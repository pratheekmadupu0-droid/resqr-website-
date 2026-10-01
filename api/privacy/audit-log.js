/**
 * API: /api/privacy/audit-log
 * Server-authoritative audit logging for security and access events.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userId, action, role, resourceId, details } = req.body || {};
        if (!userId || !action) {
            return res.status(400).json({ error: 'Missing userId or action for audit entry.' });
        }

        const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || 'https://resqr-d8e20-default-rtdb.firebaseio.com';
        const now = new Date().toISOString();

        const auditEntry = {
            action,
            role: role || 'citizen',
            resourceId: resourceId || null,
            details: details || {},
            timestamp: now,
            epoch: Date.now(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ip: req.headers['x-forwarded-for'] || 'Internal'
        };

        const logUrl = `${FIREBASE_RTDB_URL}/users/${userId}/privacyAuditLogs.json`;
        await fetch(logUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auditEntry)
        });

        return res.status(200).json({ success: true, message: 'Audit event logged.' });
    } catch (err) {
        console.error('Audit logging error:', err);
        return res.status(500).json({ error: 'Failed to record audit log.' });
    }
}
