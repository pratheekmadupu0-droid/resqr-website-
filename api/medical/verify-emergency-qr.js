import crypto from 'crypto';

// In-memory rate limiting store for Vercel serverless environment
const failedEmergencyAttemptsMap = new Map();
const COOLDOWN_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 3;
const PUBLIC_QR_JWT_SECRET = process.env.PUBLIC_QR_JWT_SECRET || 'resqr_public_emergency_access_sec_key_2026';
const DB_URL = process.env.FIREBASE_RTDB_URL || 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';

function getClientIdentifier(req, patientId) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : (req.socket?.remoteAddress || '127.0.0.1');
    return `${ip}_${patientId}`;
}

function isPseudoEmbedding(desc) {
    if (!desc || !Array.isArray(desc) || desc.length !== 128) return true;
    if (desc[0] === 0.01 && desc[1] === 0.01 && desc[2] === 0.01) return true;
    if (desc[60] === 0 && desc[61] === 0) return true;
    let sum = 0;
    let zeroCount = 0;
    for (let i = 0; i < 128; i++) {
        sum += desc[i] * desc[i];
        if (desc[i] === 0) zeroCount++;
    }
    const norm = Math.sqrt(sum);
    if (norm < 0.8 || norm > 1.2 || zeroCount > 5) return true;
    return false;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        probeDescriptor,
        patientId,
        qrId,
        padScore = 0.8
    } = req.body || {};

    if (!probeDescriptor || !Array.isArray(probeDescriptor) || probeDescriptor.length !== 128 || isPseudoEmbedding(probeDescriptor)) {
        return res.status(400).json({ error: 'Valid 128-dimensional biometric descriptor required.' });
    }

    if (!patientId) {
        return res.status(400).json({ error: 'Patient identifier required.' });
    }

    const cleanId = patientId.trim();
    const clientId = getClientIdentifier(req, cleanId);
    const now = Date.now();

    // 1. Rate Limiting Check (Max 3 failed attempts)
    const clientRecord = failedEmergencyAttemptsMap.get(clientId) || { count: 0, lastAttempt: 0, cooldownUntil: 0 };
    if (clientRecord.cooldownUntil && now < clientRecord.cooldownUntil) {
        const remaining = Math.ceil((clientRecord.cooldownUntil - now) / 1000);
        return res.status(429).json({
            error: 'Verification temporarily locked due to repeated mismatches.',
            cooldownSeconds: remaining
        });
    }

    try {
        // 1.5. Backend Subscription Validity Check
        let subRes = await fetch(`${DB_URL}/subscriptions/${cleanId}.json`);
        let sub = await subRes.json();
        if (!sub) {
            const uid = cleanId.includes('_') ? (cleanId.startsWith('c_') ? cleanId.replace('c_', '') : cleanId.split('_')[0]) : cleanId;
            subRes = await fetch(`${DB_URL}/users/${uid}/subscription.json`);
            sub = await subRes.json();
        }

        if (sub) {
            if (sub.status === 'SUSPENDED' || sub.status === 'REVOKED') {
                return res.status(403).json({
                    error: 'SUBSCRIPTION_INACTIVE',
                    message: `This RESQR identity service is currently ${sub.status.toLowerCase()}. Please contact support.`
                });
            }
            if (sub.expiresAt && new Date(sub.expiresAt).getTime() <= now) {
                return res.status(403).json({
                    error: 'SUBSCRIPTION_EXPIRED',
                    message: 'The RESQR emergency protection subscription has expired. Please renew the subscription to reactivate emergency access.'
                });
            }
        }

        // 2. 1:1 Retrieval of the specific QR owner's biometric profile
        let bioUrl = `${DB_URL}/biometricProfiles/${cleanId}.json`;
        let bioRes = await fetch(bioUrl);
        let bio = await bioRes.json();

        if (!bio) {
            const uid = cleanId.includes('_') ? (cleanId.startsWith('c_') ? cleanId.replace('c_', '') : cleanId.split('_')[0]) : cleanId;
            bioUrl = `${DB_URL}/users/${uid}/biometricProfiles/${cleanId}.json`;
            bioRes = await fetch(bioUrl);
            bio = await bioRes.json();
        }

        if (!bio) {
            // Lookup username registry
            const regRes = await fetch(`${DB_URL}/usernames/${cleanId.toLowerCase()}.json`);
            const regPath = await regRes.json();
            if (regPath && typeof regPath === 'string') {
                const parts = regPath.split('/');
                const actualUid = parts[0] === 'users' ? parts[1] : parts[0];
                const actualPid = parts[parts.length - 1];
                bioRes = await fetch(`${DB_URL}/biometricProfiles/${actualPid}.json`);
                bio = await bioRes.json();
                if (!bio && actualUid) {
                    bioRes = await fetch(`${DB_URL}/users/${actualUid}/biometricProfiles/${actualPid}.json`);
                    bio = await bioRes.json();
                }
            }
        }

        if (!bio || (!bio.frontTemplate?.descriptor && !bio.leftTemplate?.descriptor && !bio.rightTemplate?.descriptor)) {
            return res.status(404).json({ error: 'Registered biometric profile not found for this RESQR.' });
        }

        // 3. Strict 1:1 Euclidean distance matching
        const euclideanDist = (a, b) => {
            if (!a || !b || a.length !== 128 || b.length !== 128) return 1.0;
            let sum = 0;
            for (let i = 0; i < 128; i++) sum += (a[i] - b[i]) ** 2;
            return Math.sqrt(sum);
        };

        const comparisons = [];
        if (bio.frontTemplate?.descriptor && !isPseudoEmbedding(bio.frontTemplate.descriptor)) {
            comparisons.push({ view: 'FRONT', dist: euclideanDist(probeDescriptor, bio.frontTemplate.descriptor) });
        }
        if (bio.leftTemplate?.descriptor && !isPseudoEmbedding(bio.leftTemplate.descriptor)) {
            comparisons.push({ view: 'LEFT', dist: euclideanDist(probeDescriptor, bio.leftTemplate.descriptor) });
        }
        if (bio.rightTemplate?.descriptor && !isPseudoEmbedding(bio.rightTemplate.descriptor)) {
            comparisons.push({ view: 'RIGHT', dist: euclideanDist(probeDescriptor, bio.rightTemplate.descriptor) });
        }

        if (comparisons.length === 0) {
            return res.status(400).json({ error: 'Biometric identity requires re-enrollment.' });
        }

        comparisons.sort((a, b) => a.dist - b.dist);
        const best = comparisons[0];

        // Strict 1:1 threshold: Euclidean distance <= 0.45 (NEVER lowered)
        const isMatch = best.dist <= 0.45;

        // Log audit event to RTDB
        const auditPayload = {
            qrId: qrId || cleanId,
            patientId: cleanId,
            result: isMatch ? 'VERIFIED' : 'FAILED',
            timestamp: new Date().toISOString(),
            epoch: now,
            padScore: Number(padScore.toFixed(2))
        };
        try {
            await fetch(`${DB_URL}/verificationAudits/${cleanId}.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(auditPayload)
            });
        } catch (e) {}

        if (isMatch) {
            // Reset attempts on successful verification
            failedEmergencyAttemptsMap.delete(clientId);

            // Generate short-lived HMAC-SHA256 signed public session token (15 minutes)
            const exp = now + (15 * 60 * 1000);
            const payload = {
                patientId: cleanId,
                qrId: qrId || cleanId,
                role: 'PUBLIC_SCANNER',
                exp
            };

            const headerStr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const signature = crypto
                .createHmac('sha256', PUBLIC_QR_JWT_SECRET)
                .update(`${headerStr}.${payloadStr}`)
                .digest('base64url');

            const verificationToken = `${headerStr}.${payloadStr}.${signature}`;

            return res.status(200).json({
                verified: true,
                verificationToken,
                expiresAt: exp
            });
        } else {
            // Record failed attempt
            clientRecord.count += 1;
            clientRecord.lastAttempt = now;
            if (clientRecord.count >= MAX_FAILED_ATTEMPTS) {
                clientRecord.cooldownUntil = now + COOLDOWN_PERIOD_MS;
            }
            failedEmergencyAttemptsMap.set(clientId, clientRecord);

            return res.status(401).json({
                verified: false,
                error: 'IDENTITY_MISMATCH',
                message: 'The captured person does not match the registered RESQR user.',
                attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - clientRecord.count)
            });
        }
    } catch (err) {
        console.error('Server emergency biometric verification error:', err);
        return res.status(500).json({ error: 'Internal verification server error.' });
    }
}
