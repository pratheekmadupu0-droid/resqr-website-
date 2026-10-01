/**
 * API: /api/privacy/consent
 * Server-authoritative recording and verification of user privacy consent.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userId, consent } = req.body || {};
        if (!userId || !consent || !consent.version) {
            return res.status(400).json({ error: 'Missing userId or valid consent payload.' });
        }

        const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || 'https://resqr-d8e20-default-rtdb.firebaseio.com';
        const now = new Date().toISOString();

        const consentRecord = {
            accepted: true,
            version: consent.version,
            timestamp: now,
            required: true,
            optionalLocation: Boolean(consent.optionalLocation),
            optionalMarketing: Boolean(consent.optionalMarketing),
            optionalFeatures: Boolean(consent.optionalFeatures),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Masked'
        };

        // Save consent in Firebase RTDB
        const updateUrl = `${FIREBASE_RTDB_URL}/users/${userId}/privacyConsent.json`;
        await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(consentRecord)
        });

        // Also write an audit log
        const auditUrl = `${FIREBASE_RTDB_URL}/users/${userId}/privacyAuditLogs.json`;
        await fetch(auditUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'CONSENT_GRANTED',
                role: 'citizen',
                details: { version: consent.version, optionalLocation: consent.optionalLocation },
                timestamp: now,
                epoch: Date.now()
            })
        });

        return res.status(200).json({
            success: true,
            message: 'Privacy consent successfully recorded on backend.',
            consent: consentRecord
        });
    } catch (err) {
        console.error('Consent recording error:', err);
        return res.status(500).json({ error: 'Internal server error while saving consent.' });
    }
}
