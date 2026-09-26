const DB_URL = process.env.FIREBASE_RTDB_URL || 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';

const REMINDER_THRESHOLDS = [30, 15, 7, 3, 1];

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { qrId, userId } = req.query || {};

    if (!qrId && !userId) {
        return res.status(400).json({ error: 'Either qrId or userId is required.' });
    }

    const cleanQrId = qrId ? String(qrId).trim() : null;
    const cleanUserId = userId ? String(userId).trim() : null;

    try {
        let subscription = null;

        // 1. Fetch from subscriptions/{qrId}
        if (cleanQrId) {
            const subRes = await fetch(`${DB_URL}/subscriptions/${cleanQrId}.json`);
            subscription = await subRes.json();
        }

        // 2. Fallback to users/{userId}/subscription
        if (!subscription && cleanUserId) {
            const userSubRes = await fetch(`${DB_URL}/users/${cleanUserId}/subscription.json`);
            subscription = await userSubRes.json();
        }

        // 3. Fallback to username lookup if qrId might be a username
        if (!subscription && cleanQrId) {
            const regRes = await fetch(`${DB_URL}/usernames/${cleanQrId.toLowerCase()}.json`);
            const regPath = await regRes.json();
            if (regPath && typeof regPath === 'string') {
                const parts = regPath.split('/');
                const actualPid = parts[parts.length - 1];
                const pidSubRes = await fetch(`${DB_URL}/subscriptions/${actualPid}.json`);
                subscription = await pidSubRes.json();
            }
        }

        const now = new Date();
        const nowMs = now.getTime();

        if (!subscription) {
            return res.status(200).json({
                found: false,
                status: 'EXPIRED',
                isActive: false,
                isExpired: true,
                isExpiringSoon: false,
                daysRemaining: 0,
                message: 'No subscription found for this identity.'
            });
        }

        // Evaluate status
        let calculatedStatus = 'ACTIVE';
        let isSuspended = subscription.status === 'SUSPENDED';
        let isRevoked = subscription.status === 'REVOKED';

        const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
        let daysRemaining = 0;

        if (isRevoked) {
            calculatedStatus = 'REVOKED';
        } else if (isSuspended) {
            calculatedStatus = 'SUSPENDED';
        } else if (!expiresAt || isNaN(expiresAt.getTime()) || expiresAt.getTime() <= nowMs) {
            calculatedStatus = 'EXPIRED';
            daysRemaining = 0;
        } else {
            const diffMs = expiresAt.getTime() - nowMs;
            daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            if (daysRemaining <= 30) {
                calculatedStatus = 'EXPIRING_SOON';
            } else {
                calculatedStatus = 'ACTIVE';
            }
        }

        const isActive = calculatedStatus === 'ACTIVE' || calculatedStatus === 'EXPIRING_SOON';
        const isExpired = calculatedStatus === 'EXPIRED';
        const isExpiringSoon = calculatedStatus === 'EXPIRING_SOON';

        // Check & record expiry reminder triggers without duplicate sending (Section 9)
        const targetId = cleanQrId || subscription.qrId || cleanUserId;
        if (targetId && isActive && daysRemaining > 0) {
            for (const threshold of REMINDER_THRESHOLDS) {
                if (daysRemaining <= threshold) {
                    const reminderKey = `reminder_${threshold}d`;
                    const remindersSent = subscription.remindersSent || {};
                    if (!remindersSent[reminderKey]) {
                        // Mark reminder sent in RTDB
                        try {
                            await fetch(`${DB_URL}/subscriptions/${targetId}/remindersSent/${reminderKey}.json`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    triggeredAt: now.toISOString(),
                                    thresholdDays: threshold,
                                    daysRemaining
                                })
                            });
                        } catch (e) {}
                        break;
                    }
                }
            }
        }

        return res.status(200).json({
            found: true,
            status: calculatedStatus,
            isActive,
            isExpired,
            isExpiringSoon,
            isSuspended,
            isRevoked,
            daysRemaining,
            qrId: subscription.qrId || cleanQrId,
            userId: subscription.userId || cleanUserId,
            planId: subscription.planId,
            planName: subscription.planName,
            durationMonths: subscription.durationMonths,
            amount: subscription.amount,
            currency: subscription.currency || 'INR',
            activatedAt: subscription.activatedAt,
            expiresAt: subscription.expiresAt,
            formattedExpiry: expiresAt ? expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
            renewalCount: subscription.renewalCount || 0
        });
    } catch (err) {
        console.error('Subscription status check error:', err);
        return res.status(500).json({ error: 'Failed to verify subscription status.' });
    }
}
