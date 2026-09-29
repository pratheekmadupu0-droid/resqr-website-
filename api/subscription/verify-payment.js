import crypto from 'crypto';

const DB_URL = process.env.FIREBASE_RTDB_URL || 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';

const PLAN_CATALOG = {
    initial_3m: { name: 'RESQR Registration + 2 QR Stickers', amount: 149, durationMonths: 3, type: 'registration' },
    renewal_3m: { name: '3 Months Renewal', amount: 299, durationMonths: 3, type: 'renewal' },
    renewal_6m: { name: '6 Months Renewal', amount: 599, durationMonths: 6, type: 'renewal' },
    renewal_12m: { name: '12 Months Renewal', amount: 1199, durationMonths: 12, type: 'renewal' },
    renewal_18m: { name: '18 Months Renewal', amount: 1799, durationMonths: 18, type: 'renewal' },
    renewal_24m: { name: '24 Months Renewal', amount: 2399, durationMonths: 24, type: 'renewal' }
};

function addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) {
        d.setDate(0);
    }
    return d;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        userId,
        qrId,
        planId = 'initial_3m',
        userName = '',
        userEmail = '',
        userPhone = ''
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({
            error: 'MISSING_PAYMENT_DATA',
            message: 'Razorpay Payment ID, Order ID, and Cryptographic Signature are required.'
        });
    }

    if (!userId || !qrId) {
        return res.status(400).json({ error: 'User ID and QR ID are required.' });
    }

    const plan = PLAN_CATALOG[planId];
    if (!plan) {
        return res.status(400).json({ error: `Invalid plan specified: ${planId}` });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        return res.status(500).json({
            error: 'CONFIG_ERROR',
            message: 'Razorpay Secret is not configured on server.'
        });
    }

    // 1. Strict Server-Side HMAC SHA-256 Signature Verification (Section 2 & 26)
    const verificationBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(verificationBody)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
            error: 'INVALID_SIGNATURE',
            message: 'Cryptographic payment verification failed. Unauthorized request.'
        });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const cleanQrId = String(qrId).trim();
    const cleanUserId = String(userId).trim();

    try {
        // 2. Anti-Replay Protection: Check if paymentId was already processed
        const checkPayUrl = `${DB_URL}/payments/${razorpay_payment_id}.json`;
        const payRes = await fetch(checkPayUrl);
        const existingPayment = await payRes.json();

        if (existingPayment && existingPayment.status === 'SUCCESS') {
            return res.status(200).json({
                success: true,
                duplicate: true,
                message: 'Payment already processed and verified previously.',
                paymentId: razorpay_payment_id,
                qrId: cleanQrId
            });
        }

        // 3. Fetch existing subscription from RTDB (Source of truth)
        let existingSub = null;
        try {
            const subRes = await fetch(`${DB_URL}/subscriptions/${cleanQrId}.json`);
            existingSub = await subRes.json();
            if (!existingSub) {
                const userSubRes = await fetch(`${DB_URL}/users/${cleanUserId}/subscription.json`);
                existingSub = await userSubRes.json();
            }
        } catch (fetchErr) {
            console.warn('Subscription fetch notice:', fetchErr.message);
        }

        // Fetch user data if user details not provided in request
        let resolvedName = userName;
        let resolvedEmail = userEmail;
        let resolvedPhone = userPhone;
        if (!resolvedName || !resolvedEmail) {
            try {
                const userRes = await fetch(`${DB_URL}/users/${cleanUserId}.json`);
                const userData = await userRes.json();
                if (userData) {
                    resolvedName = resolvedName || userData.name || '';
                    resolvedEmail = resolvedEmail || userData.email || '';
                    resolvedPhone = resolvedPhone || userData.phone || '';
                }
            } catch (e) {}
        }

        // 4. Calculate New Expiry Date (Section 15: PRESERVE SAME QR TOKEN, ONLY EXTEND EXPIRY)
        let newExpiryDate;
        const existingExpiresAt = existingSub?.expiresAt ? new Date(existingSub.expiresAt) : null;

        if (existingExpiresAt && !isNaN(existingExpiresAt.getTime()) && existingExpiresAt.getTime() > now.getTime()) {
            // Renewed BEFORE expiry: EXISTING EXPIRY + PLAN DURATION
            newExpiryDate = addMonths(existingExpiresAt, plan.durationMonths);
        } else {
            // Renewed AFTER expiry or initial registration: NOW + PLAN DURATION
            newExpiryDate = addMonths(now, plan.durationMonths);
        }

        const newExpiryIso = newExpiryDate.toISOString();
        const activatedAtIso = existingSub?.activatedAt || nowIso;
        const receiptNumber = `REC-${cleanUserId.slice(-4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

        // 5. Canonical Payment Record (Section 4 Schema)
        const paymentRecord = {
            paymentId: razorpay_payment_id,
            userId: cleanUserId,
            userName: resolvedName,
            userEmail: resolvedEmail,
            userPhone: resolvedPhone,
            qrId: cleanQrId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            planId: planId,
            planName: plan.name,
            amount: plan.amount,
            currency: 'INR',
            status: 'SUCCESS',
            createdAt: nowIso,
            updatedAt: nowIso,
            paidAt: nowIso,
            paymentMethod: 'razorpay',
            receiptNumber: receiptNumber,
            subscriptionStartDate: activatedAtIso,
            subscriptionExpiryDate: newExpiryIso,
            webhookVerified: false,
            signatureVerified: true,
            type: plan.type
        };

        // 6. Canonical Subscription Record
        const subscriptionRecord = {
            id: `sub_${cleanQrId}`,
            userId: cleanUserId,
            qrId: cleanQrId,
            planId: planId,
            planName: plan.name,
            durationMonths: plan.durationMonths,
            amount: plan.amount,
            currency: 'INR',
            status: 'ACTIVE',
            activatedAt: activatedAtIso,
            expiresAt: newExpiryIso,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paymentStatus: 'paid',
            createdAt: existingSub?.createdAt || nowIso,
            updatedAt: nowIso,
            renewedAt: nowIso,
            renewalCount: (existingSub?.renewalCount || 0) + (plan.type === 'registration' ? 0 : 1)
        };

        // 7. Atomic Multi-path Updates to Realtime Database
        const updatePayload = {
            [`payments/${razorpay_payment_id}`]: paymentRecord,
            [`paymentHistory/${razorpay_payment_id}`]: {
                ...paymentRecord,
                status: 'SUCCESSFUL',
                epoch: now.getTime()
            },
            [`paymentAttempts/${razorpay_order_id}/status`]: 'SUCCESS',
            [`paymentAttempts/${razorpay_order_id}/razorpayPaymentId`]: razorpay_payment_id,
            [`paymentAttempts/${razorpay_order_id}/updatedAt`]: nowIso,
            [`subscriptions/${cleanQrId}`]: subscriptionRecord,
            [`users/${cleanUserId}/subscription`]: subscriptionRecord,
            [`users/${cleanUserId}/profiles/${cleanQrId}/subscription`]: subscriptionRecord,
            [`profiles/${cleanQrId}/subscription`]: subscriptionRecord,
            [`profiles/${cleanQrId}/payment_status`]: 'paid',
            [`profiles/${cleanQrId}/payment_id`]: razorpay_payment_id,
            [`profiles/${cleanQrId}/subscriptionStatus`]: 'ACTIVE',
            [`profiles/${cleanQrId}/subscriptionExpiresAt`]: newExpiryIso,
            [`profiles/${cleanQrId}/registrationStatus`]: 'COMPLETED',
            [`profiles/${cleanQrId}/paymentStatus`]: 'SUCCESS',
            [`profiles/${cleanQrId}/serviceStatus`]: 'ACTIVE',
            [`profiles/${cleanQrId}/emergencyProfileStatus`]: 'ACTIVE',
            [`profiles/${cleanQrId}/qrStatus`]: 'ACTIVE',
            [`profiles/${cleanQrId}/planId`]: planId,
            [`profiles/${cleanQrId}/amountPaid`]: plan.amount,
            [`profiles/${cleanQrId}/paymentId`]: razorpay_payment_id,
            [`profiles/${cleanQrId}/serviceStartDate`]: activatedAtIso,
            [`profiles/${cleanQrId}/serviceExpiryDate`]: newExpiryIso,
            [`users/${cleanUserId}/registrationStatus`]: 'COMPLETED',
            [`users/${cleanUserId}/paymentStatus`]: 'SUCCESS',
            [`users/${cleanUserId}/serviceStatus`]: 'ACTIVE',
            [`users/${cleanUserId}/emergencyProfileStatus`]: 'ACTIVE',
            [`users/${cleanUserId}/qrStatus`]: 'ACTIVE',
            [`users/${cleanUserId}/planId`]: planId,
            [`users/${cleanUserId}/amountPaid`]: plan.amount,
            [`users/${cleanUserId}/paymentId`]: razorpay_payment_id,
            [`users/${cleanUserId}/serviceStartDate`]: activatedAtIso,
            [`users/${cleanUserId}/serviceExpiryDate`]: newExpiryIso,
            [`users/${cleanUserId}/profiles/${cleanQrId}/payment_status`]: 'paid',
            [`users/${cleanUserId}/profiles/${cleanQrId}/payment_id`]: razorpay_payment_id,
            [`users/${cleanUserId}/profiles/${cleanQrId}/subscriptionStatus`]: 'ACTIVE',
            [`users/${cleanUserId}/profiles/${cleanQrId}/subscriptionExpiresAt`]: newExpiryIso,
            [`users/${cleanUserId}/profiles/${cleanQrId}/registrationStatus`]: 'COMPLETED',
            [`users/${cleanUserId}/profiles/${cleanQrId}/paymentStatus`]: 'SUCCESS',
            [`users/${cleanUserId}/profiles/${cleanQrId}/serviceStatus`]: 'ACTIVE',
            [`users/${cleanUserId}/profiles/${cleanQrId}/emergencyProfileStatus`]: 'ACTIVE',
            [`users/${cleanUserId}/profiles/${cleanQrId}/qrStatus`]: 'ACTIVE'
        };

        const updateRes = await fetch(`${DB_URL}/.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        if (!updateRes.ok) {
            console.error('Failed to commit verified payment to RTDB:', await updateRes.text());
        }

        // Audit log entry
        try {
            await fetch(`${DB_URL}/subscriptionAudits/${cleanQrId}.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: plan.type === 'registration' ? 'INITIAL_REGISTRATION_ACTIVATED' : 'SUBSCRIPTION_RENEWAL_EXTENDED',
                    userId: cleanUserId,
                    qrId: cleanQrId,
                    planId,
                    amount: plan.amount,
                    previousExpiry: existingSub?.expiresAt || null,
                    newExpiry: newExpiryIso,
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    receiptNumber,
                    timestamp: nowIso
                })
            });
        } catch (e) {}

        return res.status(200).json({
            success: true,
            verified: true,
            status: 'ACTIVE',
            qrId: cleanQrId,
            planId,
            planName: plan.name,
            durationMonths: plan.durationMonths,
            amount: plan.amount,
            activatedAt: activatedAtIso,
            expiresAt: newExpiryIso,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            receiptNumber
        });
    } catch (err) {
        console.error('Backend payment verification error:', err);
        return res.status(500).json({
            error: 'INTERNAL_VERIFICATION_ERROR',
            message: err.message || 'Server error verifying subscription payment'
        });
    }
}
