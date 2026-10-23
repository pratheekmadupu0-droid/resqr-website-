/**
 * API: /api/privacy/data-request
 * Handles User Data Rights requests (Access, Correction, Deletion, Withdraw).
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { userId, requestType, description, contactEmail } = req.body || {};
        if (!userId || !requestType) {
            return res.status(400).json({ error: 'Missing userId or requestType.' });
        }

        const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || 'https://resqr-d8e20-default-rtdb.firebaseio.com';
        const now = new Date().toISOString();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const requestRecord = {
            id: requestId,
            userId,
            requestType,
            description: description || '',
            contactEmail: contactEmail || '',
            status: 'SUBMITTED',
            createdAt: now,
            updatedAt: now,
            resolutionNotes: 'Under review by Data Protection Officer.'
        };

        // Save in user queue and global queue
        await fetch(`${FIREBASE_RTDB_URL}/users/${userId}/dataRightsRequests/${requestId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestRecord)
        });

        await fetch(`${FIREBASE_RTDB_URL}/dataRightsRequests/${requestId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestRecord)
        });

        return res.status(200).json({
            success: true,
            message: 'Data rights request received.',
            request: requestRecord
        });
    } catch (err) {
        console.error('Data request handling error:', err);
        return res.status(500).json({ error: 'Failed to process data rights request.' });
    }
}
