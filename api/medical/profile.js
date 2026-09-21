import crypto from 'crypto';

const JWT_SECRET = process.env.MEDICAL_JWT_SECRET || 'resqr_trauma_medical_sec_key_2026';

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Extract and verify token
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

    if (!token) {
        return res.status(401).json({ error: 'Authorization token required for clinical medical access.' });
    }

    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return res.status(401).json({ error: 'Malformed authorization token.' });
        }

        const [headerStr, payloadStr, signature] = parts;
        const expectedSig = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${headerStr}.${payloadStr}`)
            .digest('base64url');

        if (signature !== expectedSig) {
            return res.status(403).json({ error: 'Invalid token signature. Access denied.' });
        }

        const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
        const now = Date.now();

        if (now > payload.exp) {
            return res.status(403).json({ error: 'Medical access token expired. Re-verification required.' });
        }

        const requestedPatientId = req.query.patientId || req.body?.patientId || payload.patientId;
        if (payload.patientId !== requestedPatientId) {
            return res.status(403).json({ error: 'Access token not valid for requested patient.' });
        }

        // 2. Fetch patient record from RTDB
        const dbUrl = 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';
        let profileUrl = `${dbUrl}/profiles/${requestedPatientId}.json`;
        let pRes = await fetch(profileUrl);
        let raw = await pRes.json();

        if (!raw) {
            const uid = requestedPatientId.includes('_') ? (requestedPatientId.startsWith('c_') ? requestedPatientId.replace('c_', '') : requestedPatientId.split('_')[0]) : requestedPatientId;
            profileUrl = `${dbUrl}/users/${uid}/profiles/${requestedPatientId}.json`;
            pRes = await fetch(profileUrl);
            raw = await pRes.json();
        }

        if (!raw) {
            return res.status(404).json({ error: 'Patient medical record not found.' });
        }

        const medical = raw.medical || {};

        // 3. Strip sensitive identifiers and return ONLY permitted medical information (Section 4)
        const medicalData = {
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

        return res.status(200).json({
            success: true,
            medicalData
        });
    } catch (err) {
        console.error('Server medical profile fetch error:', err);
        return res.status(500).json({ error: 'Internal server error processing medical profile.' });
    }
}
