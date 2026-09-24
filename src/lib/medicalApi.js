/**
 * RESQR Medical Access Client API
 * Connects frontend hospital verification to server-authorized endpoints:
 *  - POST /api/medical/verify-face
 *  - GET /api/medical/profile
 * Enforces short-lived 15-minute access sessions and audit logging.
 */

import { db, auth } from './firebase';
import { ref, get, push, serverTimestamp, set, update } from 'firebase/database';
import CryptoJS from 'crypto-js';
import { isPseudoEmbedding, extractDeepDescriptorFromImage } from './biometrics';

const MEDICAL_JWT_SECRET = 'resqr_trauma_medical_sec_key_2026';
const SESSION_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Serverless or local verification handler for biometric facial probe.
 */
export async function verifyFaceOnServer({
    probeDescriptor,
    patientId,
    qrId,
    doctorInfo = {},
    unconsciousMode = false,
    padScore = 0.8
}) {
    try {
        // Try calling the Vercel serverless API endpoint
        const response = await fetch('/api/medical/verify-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                probeDescriptor,
                patientId,
                qrId,
                doctorInfo,
                unconsciousMode,
                padScore
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (e) {
        // Serverless route unavailable or local environment fallback
    }

    // Direct Secure Realtime Database Verification Fallback
    try {
        // Retrieve patient's enrolled biometric profile from protected node
        let bioSnap = await get(ref(db, `biometricProfiles/${patientId}`));
        if (!bioSnap.exists()) {
            // Check sub-profile path
            const uid = patientId.includes('_') ? (patientId.startsWith('c_') ? patientId.replace('c_', '') : patientId.split('_')[0]) : patientId;
            bioSnap = await get(ref(db, `users/${uid}/biometricProfiles/${patientId}`));
        }

        const bio = bioSnap.exists() ? bioSnap.val() : null;
        if (!bio) {
            return { verified: false, error: 'Patient biometric profile not found.' };
        }

        // Compare probe vs Front, Left, Right templates
        const comparisons = [];
        const euclideanDist = (a, b) => {
            if (!a || !b || a.length !== b.length) return 1.0;
            let sum = 0;
            for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
            return Math.sqrt(sum);
        };

        if (bio.frontTemplate?.descriptor) {
            comparisons.push(euclideanDist(probeDescriptor, bio.frontTemplate.descriptor));
        }
        if (bio.leftTemplate?.descriptor) {
            comparisons.push(euclideanDist(probeDescriptor, bio.leftTemplate.descriptor));
        }
        if (bio.rightTemplate?.descriptor) {
            comparisons.push(euclideanDist(probeDescriptor, bio.rightTemplate.descriptor));
        }

        const minDistance = Math.min(...comparisons);
        const isMatch = minDistance <= 0.45; // Strict threshold, never lowered for emergency

        if (isMatch) {
            const exp = Date.now() + SESSION_EXPIRATION_MS;
            const payload = {
                patientId,
                qrId,
                doctorId: doctorInfo.regNo || auth.currentUser?.uid || 'HOSPITAL_STAFF',
                hospitalName: doctorInfo.hospitalName || 'Authorized Trauma Center',
                exp
            };

            const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
            const body = btoa(JSON.stringify(payload));
            const signature = CryptoJS.HmacSHA256(`${header}.${body}`, MEDICAL_JWT_SECRET).toString(CryptoJS.enc.Base64);
            const token = `${header}.${body}.${signature}`;

            // Write audit log
            await logMedicalAccessAudit({
                hospitalId: doctorInfo.hospitalId || 'TRAUMA_UNIT',
                hospitalName: doctorInfo.hospitalName || 'Emergency Trauma Center',
                doctorId: doctorInfo.regNo || 'STAFF_DOCTOR',
                patientId,
                qrId,
                result: 'VERIFIED',
                accessType: 'face_biometric',
                unconsciousMode,
                minDistance: Number(minDistance.toFixed(4))
            });

            return {
                verified: true,
                verificationToken: token,
                expiresIn: 900,
                minDistance
            };
        } else {
            await logMedicalAccessAudit({
                hospitalId: doctorInfo.hospitalId || 'TRAUMA_UNIT',
                hospitalName: doctorInfo.hospitalName || 'Emergency Trauma Center',
                doctorId: doctorInfo.regNo || 'STAFF_DOCTOR',
                patientId,
                qrId,
                result: 'FAILED',
                accessType: 'face_biometric',
                unconsciousMode,
                minDistance: Number(minDistance.toFixed(4))
            });

            return { verified: false, error: 'Biometric face match failed.' };
        }
    } catch (err) {
        console.error("Biometric verification fallback failed:", err);
        return { verified: false, error: err.message };
    }
}

/**
 * Retrieves the Authorized Medical Profile using the short-lived session token.
 */
export async function fetchAuthorizedMedicalProfile(patientId, verificationToken) {
    if (!verificationToken) {
        throw new Error('Access denied. Valid medical authorization token required.');
    }

    try {
        const response = await fetch(`/api/medical/profile?patientId=${encodeURIComponent(patientId)}`, {
            headers: {
                'Authorization': `Bearer ${verificationToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.medicalData;
        }
    } catch (e) {
        // Fallback to RTDB
    }

    // Verify token locally
    try {
        const parts = verificationToken.split('.');
        if (parts.length !== 3) throw new Error('Malformed authorization token.');

        const [header, body, signature] = parts;
        const expectedSig = CryptoJS.HmacSHA256(`${header}.${body}`, MEDICAL_JWT_SECRET).toString(CryptoJS.enc.Base64);
        if (signature !== expectedSig) {
            throw new Error('Cryptographic signature mismatch. Unauthorized access token.');
        }

        const payload = JSON.parse(atob(body));
        if (Date.now() > payload.exp) {
            throw new Error('Medical authorization token has expired.');
        }
        if (payload.patientId !== patientId) {
            throw new Error('Token does not match target patient ID.');
        }

        // Fetch medical data from RTDB
        let targetUid = patientId.includes('_') ? (patientId.startsWith('c_') ? patientId.replace('c_', '') : patientId.split('_')[0]) : patientId;
        let snap = await get(ref(db, `users/${targetUid}/profiles/${patientId}`));
        if (!snap.exists()) {
            snap = await get(ref(db, `profiles/${patientId}`));
        }

        if (!snap.exists()) {
            throw new Error('Patient medical dossier not found.');
        }

        const raw = snap.val();
        const medical = raw.medical || {};

        // Only return authorized clinical fields
        return {
            name: raw.name || raw.fullName || 'PATIENT',
            bloodGroup: medical.bloodGroup || raw.bloodGroup || '',
            allergies: medical.allergies || raw.allergies || '',
            medicalConditions: medical.medicalConditions || raw.medicalConditions || raw.healthIssues || raw.conditions || '',
            currentMedication: medical.currentMedication || raw.currentMedication || '',
            previousSurgeries: medical.previousSurgeries || raw.previousSurgeries || raw.surgeries || '',
            emergencyNotes: medical.emergencyNotes || raw.emergencyNotes || '',
            isOrganDonor: Boolean(medical.isOrganDonor ?? raw.isOrganDonor),
            insurance: raw.insurance || medical.insurance || {},
            medicalId: medical.medicalId || raw.medicalId || '',
            authorizedUntil: payload.exp
        };
    } catch (err) {
        console.error("Authorized profile fetch error:", err);
        throw err;
    }
}

/**
 * Writes an immutable audit entry for medical access (Section 23).
 */
export async function logMedicalAccessAudit(entry) {
    try {
        const patientId = entry.patientId || 'UNKNOWN';
        const logData = {
            hospitalId: entry.hospitalId || 'TRAUMA_CENTER',
            hospitalName: entry.hospitalName || 'Emergency Care',
            doctorId: entry.doctorId || 'STAFF',
            patientId,
            qrId: entry.qrId || patientId,
            result: entry.result, // 'VERIFIED' | 'FAILED' | 'INCONCLUSIVE' | 'AUTHORIZED_OVERRIDE'
            accessType: entry.accessType || 'face_biometric',
            unconsciousMode: Boolean(entry.unconsciousMode),
            minDistance: entry.minDistance || null,
            timestamp: new Date().toISOString(),
            epoch: Date.now()
        };

        // Write to patient audit node
        await push(ref(db, `auditLogs/${patientId}`), logData);
        // Also write to global audit node for admin overview
        await push(ref(db, `medicalAuditTrail`), logData);
    } catch (err) {
        console.warn("Failed to write medical audit log:", err);
    }
}

const PUBLIC_QR_JWT_SECRET = 'resqr_public_emergency_access_sec_key_2026';
const PUBLIC_SESSION_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * 1:1 Biometric Verification for Public QR Scanner before emergency profile access.
 * Compares probe descriptor against the specific QR user's enrolled biometric profile.
 * Does NOT compare against whole database.
 * Does NOT lower threshold (strict <= 0.45).
 */
export async function verifyPublicEmergencyAccess({
    probeDescriptor,
    patientId,
    qrId,
    padScore = 0.8
}) {
    if (!probeDescriptor || !Array.isArray(probeDescriptor) || probeDescriptor.length !== 128) {
        return { verified: false, error: 'INVALID_PROBE', message: 'Valid 128-d biometric descriptor required.' };
    }

    if (isPseudoEmbedding(probeDescriptor)) {
        return { verified: false, error: 'INVALID_PROBE', message: 'Synthetic pseudo-embeddings are not allowed for verification.' };
    }

    if (!patientId) {
        return { verified: false, error: 'MISSING_PATIENT_ID', message: 'Target RESQR identity identifier required.' };
    }

    try {
        // 1. Retrieve candidate's enrolled biometric profile
        let cleanId = patientId.trim();
        let bioSnap = await get(ref(db, `biometricProfiles/${cleanId}`));
        
        // 2. Try resolving via UID prefix
        if (!bioSnap.exists()) {
            const uid = cleanId.includes('_') ? (cleanId.startsWith('c_') ? cleanId.replace('c_', '') : cleanId.split('_')[0]) : cleanId;
            bioSnap = await get(ref(db, `users/${uid}/biometricProfiles/${cleanId}`));
            if (!bioSnap.exists()) {
                bioSnap = await get(ref(db, `biometricProfiles/${uid}`));
            }
        }

        // 3. Try resolving via username registry if cleanId is a slug/username
        if (!bioSnap.exists()) {
            try {
                const regSnap = await get(ref(db, `usernames/${cleanId.toLowerCase()}`));
                if (regSnap.exists()) {
                    const path = regSnap.val();
                    const parts = path.split('/');
                    const actualUid = parts[0] === 'users' ? parts[1] : parts[0];
                    const actualPid = parts[parts.length - 1];
                    bioSnap = await get(ref(db, `biometricProfiles/${actualPid}`));
                    if (!bioSnap.exists() && actualUid) {
                        bioSnap = await get(ref(db, `users/${actualUid}/biometricProfiles/${actualPid}`));
                    }
                    if (!bioSnap.exists() && actualUid) {
                        bioSnap = await get(ref(db, `biometricProfiles/${actualUid}`));
                    }
                }
            } catch (e) {}
        }

        // 4. Broad fallback search across biometricProfiles collection
        if (!bioSnap.exists()) {
            try {
                const allBioSnap = await get(ref(db, `biometricProfiles`));
                if (allBioSnap.exists()) {
                    const allBios = allBioSnap.val();
                    for (const [k, v] of Object.entries(allBios)) {
                        if (k === cleanId || v.profileId === cleanId || v.uid === cleanId) {
                            bioSnap = { exists: () => true, val: () => v };
                            break;
                        }
                    }
                }
            } catch (e) {}
        }

        const bio = bioSnap.exists() ? bioSnap.val() : null;
        if (!bio) {
            return { verified: false, error: 'NO_BIOMETRIC_PROFILE', message: 'No registered biometric identity found for this RESQR.' };
        }

        let frontDesc = bio.frontTemplate?.descriptor;
        let leftDesc = bio.leftTemplate?.descriptor;
        let rightDesc = bio.rightTemplate?.descriptor;

        // Self-heal legacy profiles if snapshot photo is present
        const snapshotUrl = bio.frontPhotoSnapshot || bio.frontTemplate?.snapshot;
        if ((!frontDesc || isPseudoEmbedding(frontDesc)) && snapshotUrl) {
            try {
                const healed = await extractDeepDescriptorFromImage(snapshotUrl);
                if (healed && !isPseudoEmbedding(healed)) {
                    frontDesc = healed;
                    // Persist upgraded descriptor to RTDB
                    try {
                        const targetProfileKey = bio.profileId || cleanId;
                        const targetUid = bio.uid;
                        const updates = {};
                        updates[`biometricProfiles/${targetProfileKey}/frontTemplate/descriptor`] = healed;
                        updates[`biometricProfiles/${targetProfileKey}/templateVersion`] = '2.0';
                        if (targetUid) {
                            updates[`users/${targetUid}/biometricProfiles/${targetProfileKey}/frontTemplate/descriptor`] = healed;
                        }
                        await update(ref(db), updates);
                    } catch (e) {}
                }
            } catch (e) {}
        }

        // Strict 1:1 distance check against genuine neural templates only
        const comparisons = [];
        const euclideanDist = (a, b) => {
            if (!a || !b || a.length !== 128 || b.length !== 128) return 1.0;
            let sum = 0;
            for (let i = 0; i < 128; i++) sum += (a[i] - b[i]) ** 2;
            return Math.sqrt(sum);
        };

        if (frontDesc && !isPseudoEmbedding(frontDesc)) {
            comparisons.push({ view: 'FRONT', dist: euclideanDist(probeDescriptor, frontDesc) });
        }
        if (leftDesc && !isPseudoEmbedding(leftDesc)) {
            comparisons.push({ view: 'LEFT', dist: euclideanDist(probeDescriptor, leftDesc) });
        }
        if (rightDesc && !isPseudoEmbedding(rightDesc)) {
            comparisons.push({ view: 'RIGHT', dist: euclideanDist(probeDescriptor, rightDesc) });
        }

        if (comparisons.length === 0) {
            return {
                verified: false,
                error: 'LEGACY_ENROLLMENT_REQUIRED',
                message: 'Biometric identity requires facial re-enrollment by the owner for security.'
            };
        }

        comparisons.sort((a, b) => a.dist - b.dist);
        const best = comparisons[0];
        const minDistance = Number(best.dist.toFixed(4));
        const MATCH_THRESHOLD = 0.45; // Strict Euclidean distance threshold, NEVER lowered
        const isMatch = minDistance <= MATCH_THRESHOLD;

        console.log(`[RESQR BIOMETRIC VERIFICATION AUDIT] Target: ${cleanId}, Best View: ${best.view}, Min Distance: ${minDistance}, Threshold: ${MATCH_THRESHOLD}, Result: ${isMatch ? 'VERIFIED (MATCH)' : 'DENIED (MISMATCH)'}`);

        // Audit log in Firebase RTDB
        const auditLogData = {
            qrId: qrId || cleanId,
            patientId: cleanId,
            matchedView: best.view,
            minDistance,
            result: isMatch ? 'VERIFIED' : 'FAILED',
            timestamp: new Date().toISOString(),
            epoch: Date.now(),
            padScore: Number((padScore || 0.8).toFixed(2))
        };
        try {
            await push(ref(db, `verificationAudits/${cleanId}`), auditLogData);
        } catch (e) {}

        if (isMatch) {
            const exp = Date.now() + PUBLIC_SESSION_EXPIRATION_MS;
            const payload = {
                patientId: cleanId,
                qrId: qrId || cleanId,
                role: 'PUBLIC_SCANNER',
                exp
            };

            const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
            const body = btoa(JSON.stringify(payload));
            const signature = CryptoJS.HmacSHA256(`${header}.${body}`, PUBLIC_QR_JWT_SECRET).toString(CryptoJS.enc.Base64);
            const token = `${header}.${body}.${signature}`;

            return {
                verified: true,
                verificationToken: token,
                expiresAt: exp,
                minDistance,
                matchedView: best.view
            };
        } else {
            return {
                verified: false,
                error: 'IDENTITY_MISMATCH',
                message: 'The captured face does not match the registered RESQR identity.',
                minDistance,
                matchedView: best.view
            };
        }
    } catch (err) {
        console.error("Public emergency biometric verification failed:", err);
        return { verified: false, error: 'VERIFICATION_ERROR', message: err.message };
    }
}

/**
 * Validates the short-lived Public QR verification session token.
 */
export function validatePublicEmergencySession(patientId, token) {
    if (!token || !patientId) return false;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const [header, body, signature] = parts;
        const expectedSig = CryptoJS.HmacSHA256(`${header}.${body}`, PUBLIC_QR_JWT_SECRET).toString(CryptoJS.enc.Base64);
        if (signature !== expectedSig) return false;

        const payload = JSON.parse(atob(body));
        if (Date.now() > payload.exp) return false;
        if (payload.patientId !== patientId) return false;
        return true;
    } catch (e) {
        return false;
    }
}
