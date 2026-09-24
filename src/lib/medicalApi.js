/**
 * RESQR Medical Access Client API
 * Connects frontend hospital verification to server-authorized endpoints:
 *  - POST /api/medical/verify-face
 *  - GET /api/medical/profile
 * Enforces short-lived 15-minute access sessions and audit logging.
 */

import { db, auth } from './firebase';
import { ref, get, push, serverTimestamp, set } from 'firebase/database';
import CryptoJS from 'crypto-js';

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
    if (!probeDescriptor || !patientId) {
        return { verified: false, error: 'Probe descriptor and QR ID required.' };
    }

    try {
        // Retrieve candidate's enrolled biometric profile
        let bioSnap = await get(ref(db, `biometricProfiles/${patientId}`));
        if (!bioSnap.exists()) {
            const uid = patientId.includes('_') ? (patientId.startsWith('c_') ? patientId.replace('c_', '') : patientId.split('_')[0]) : patientId;
            bioSnap = await get(ref(db, `users/${uid}/biometricProfiles/${patientId}`));
        }

        const bio = bioSnap.exists() ? bioSnap.val() : null;
        if (!bio || (!bio.frontTemplate?.descriptor && !bio.leftTemplate?.descriptor && !bio.rightTemplate?.descriptor)) {
            return { verified: false, error: 'NO_BIOMETRIC_PROFILE', message: 'No registered facial identity found for this RESQR.' };
        }

        // 1:1 match against 3-angle enrolled templates
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
        const isMatch = minDistance <= 0.45; // Strict threshold, NEVER lowered

        // Audit log in Firebase RTDB
        const auditLogData = {
            qrId,
            patientId,
            result: isMatch ? 'VERIFIED' : 'FAILED',
            timestamp: new Date().toISOString(),
            epoch: Date.now(),
            padScore: Number(padScore.toFixed(2))
        };
        try {
            await push(ref(db, `verificationAudits/${patientId}`), auditLogData);
        } catch (e) {}

        if (isMatch) {
            const exp = Date.now() + PUBLIC_SESSION_EXPIRATION_MS;
            const payload = {
                patientId,
                qrId,
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
                minDistance
            };
        } else {
            return {
                verified: false,
                error: 'IDENTITY_MISMATCH',
                message: 'The captured face does not match the registered RESQR identity.'
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
