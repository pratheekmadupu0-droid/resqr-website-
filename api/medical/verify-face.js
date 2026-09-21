import crypto from 'crypto';

// In-memory rate limiting store for Vercel serverless environment
const failedAttemptsMap = new Map();
const COOLDOWN_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5;
const JWT_SECRET = process.env.MEDICAL_JWT_SECRET || 'resqr_trauma_medical_sec_key_2026';

function getClientIdentifier(req) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : (req.socket?.remoteAddress || '127.0.0.1');
    const doctorId = req.body?.doctorInfo?.regNo || 'ANON_DOC';
    return `${ip}_${doctorId}`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientId = getClientIdentifier(req);
    const now = Date.now();

    // 1. Rate Limiting & Cooldown check (Section 24)
    const clientRecord = failedAttemptsMap.get(clientId) || { count: 0, lastAttempt: 0, cooldownUntil: 0 };
    if (clientRecord.cooldownUntil && now < clientRecord.cooldownUntil) {
        const remaining = Math.ceil((clientRecord.cooldownUntil - now) / 1000);
        return res.status(429).json({
            error: 'Too many failed biometric attempts. Cooldown active.',
            cooldownSeconds: remaining
        });
    }

    const {
        probeDescriptor,
        patientId,
        qrId,
        doctorInfo = {},
        unconsciousMode = false,
        padScore = 0.8
    } = req.body;

    if (!probeDescriptor || !Array.isArray(probeDescriptor) || probeDescriptor.length !== 128) {
        return res.status(400).json({ error: 'Invalid 128-dimensional biometric descriptor.' });
    }

    if (!patientId) {
        return res.status(400).json({ error: 'Patient identifier required.' });
    }

    try {
        // Fetch patient biometric profile from Firebase Realtime Database
        const dbUrl = 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';
        let bioUrl = `${dbUrl}/biometricProfiles/${patientId}.json`;
        let bioRes = await fetch(bioUrl);
        let bio = await bioRes.json();

        if (!bio) {
            const uid = patientId.includes('_') ? (patientId.startsWith('c_') ? patientId.replace('c_', '') : patientId.split('_')[0]) : patientId;
            bioUrl = `${dbUrl}/users/${uid}/biometricProfiles/${patientId}.json`;
            bioRes = await fetch(bioUrl);
            bio = await bioRes.json();
        }

        if (!bio || bio.enrollmentStatus !== 'enrolled') {
            return res.status(404).json({ error: 'Patient biometric profile not enrolled.' });
        }

        // Compare probe against Front, Left, Right templates (Section 16)
        const euclideanDist = (a, b) => {
            let sum = 0;
            for (let i = 0; i < 128; i++) sum += (a[i] - b[i]) ** 2;
            return Math.sqrt(sum);
        };

        const comparisons = [];
        if (bio.frontTemplate?.descriptor) comparisons.push({ view: 'FRONT', dist: euclideanDist(probeDescriptor, bio.frontTemplate.descriptor) });
        if (bio.leftTemplate?.descriptor) comparisons.push({ view: 'LEFT', dist: euclideanDist(probeDescriptor, bio.leftTemplate.descriptor) });
        if (bio.rightTemplate?.descriptor) comparisons.push({ view: 'RIGHT', dist: euclideanDist(probeDescriptor, bio.rightTemplate.descriptor) });

        if (comparisons.length === 0) {
            return res.status(400).json({ error: 'No enrolled views available for matching.' });
        }

        comparisons.sort((a, b) => a.dist - b.dist);
        const best = comparisons[0];

        // Strict threshold: Euclidean distance <= 0.45 (Section 18: NEVER lowered for emergencies)
        const isMatch = best.dist <= 0.45;

        if (isMatch) {
            // Reset failed attempts on success
            failedAttemptsMap.delete(clientId);

            // Generate short-lived HMAC-SHA256 signed medical session token (15 minutes)
            const exp = now + (15 * 60 * 1000);
            const payload = {
                patientId,
                qrId,
                doctorId: doctorInfo.regNo || 'VERIFIED_DOCTOR',
                hospitalName: doctorInfo.hospitalName || 'Trauma Center',
                exp
            };

            const headerStr = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
            const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const signature = crypto
                .createHmac('sha256', JWT_SECRET)
                .update(`${headerStr}.${payloadStr}`)
                .digest('base64url');

            const verificationToken = `${headerStr}.${payloadStr}.${signature}`;

            return res.status(200).json({
                verified: true,
                verificationToken,
                expiresIn: 900,
                matchedView: best.view,
                confidence: Math.round((1 - best.dist / 0.70) * 100)
            });
        } else {
            // Increment failed attempts
            clientRecord.count += 1;
            clientRecord.lastAttempt = now;
            if (clientRecord.count >= MAX_FAILED_ATTEMPTS) {
                clientRecord.cooldownUntil = now + COOLDOWN_PERIOD_MS;
            }
            failedAttemptsMap.set(clientId, clientRecord);

            return res.status(401).json({
                verified: false,
                error: 'Biometric face match failed. Consistency threshold not met.',
                attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - clientRecord.count)
            });
        }
    } catch (err) {
        console.error('Server biometric verification error:', err);
        return res.status(500).json({ error: 'Internal verification server error.' });
    }
}
