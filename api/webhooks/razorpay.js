import crypto from 'crypto';
import { getEnvWebhookSecret } from '../lib/razorpayConfig.js';

const DB_URL = process.env.FIREBASE_RTDB_URL || 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';

const PLAN_CATALOG = {
    // Initial Registration Options (Section 1)
    initial_digital: { name: 'Registration + Digital RESQR QR', amount: 149, durationMonths: null, type: 'registration_digital' },
    initial_149: { name: 'Registration + Digital RESQR QR', amount: 149, durationMonths: null, type: 'registration_digital' },
    initial_3m: { name: 'Registration + RESQR QR + 3-Month Validity', amount: 199, durationMonths: 3, type: 'registration' },
    initial_199: { name: 'Registration + RESQR QR + 3-Month Validity', amount: 199, durationMonths: 3, type: 'registration' },
    
    // Existing Renewal / Upgrade Plans — UNCHANGED
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

const processedEventsSet = new Set();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = getEnvWebhookSecret();

    if (!webhookSignature || !webhookSecret) {
        return res.status(400).json({ error: 'Missing Razorpay webhook signature or server webhook secret' });
    }

    // 1. Validate Razorpay Webhook HMAC SHA-256 Signature (Section 6)
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== webhookSignature) {
        console.warn('Unauthorized webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const eventData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = eventData.event;
    const eventId = req.headers['x-razorpay-event-id'] || eventData.id || `evt_${Date.now()}`;

    const now = new Date();
    const nowIso = now.toISOString();

    try {
        // 2. Anti-Replay / Idempotency Check (Section 6 & 16)
        if (processedEventsSet.has(eventId)) {
            return res.status(200).json({ status: 'ok', duplicate: true, message: 'Event already processed' });
        }
        processedEventsSet.add(eventId);

        const checkEventUrl = `${DB_URL}/webhookEvents/${eventId}.json`;
        try {
            const evtRes = await fetch(checkEventUrl);
            const existingEvent = await evtRes.json();
            if (existingEvent && existingEvent.processed) {
                return res.status(200).json({ status: 'ok', duplicate: true, message: 'Event already processed' });
            }
        } catch (e) {}
        // Record incoming event to ensure idempotency
        await fetch(checkEventUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId,
                eventType,
                processed: true,
                receivedAt: nowIso
            })
        });

        // 3. Process Event Types
        if (eventType === 'payment.captured' || eventType === 'order.paid') {
            const paymentEntity = eventData.payload?.payment?.entity || {};
            const orderEntity = eventData.payload?.order?.entity || {};

            const paymentId = paymentEntity.id;
            const orderId = paymentEntity.order_id || orderEntity.id;
            const notes = paymentEntity.notes || orderEntity.notes || {};

            let userId = notes.userId;
            let qrId = notes.qrId;
            let planId = notes.planId || 'initial_3m';

            // If notes missing, try to find from paymentAttempts
            if (!userId && orderId) {
                try {
                    const attemptRes = await fetch(`${DB_URL}/paymentAttempts/${orderId}.json`);
                    const attemptData = await attemptRes.json();
                    if (attemptData) {
                        userId = attemptData.userId;
                        qrId = attemptData.qrId;
                        planId = attemptData.planId || planId;
                    }
                } catch (e) {}
            }

            if (!userId || !qrId) {
                console.warn('Webhook received payment but could not resolve user/qr context:', orderId);
                return res.status(200).json({ status: 'ok', warning: 'Context missing' });
            }

            const cleanUserId = String(userId).trim();
            const cleanQrId = String(qrId).trim();
            const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.initial_3m;

            // Fetch existing subscription
            let existingSub = null;
            try {
                const subRes = await fetch(`${DB_URL}/subscriptions/${cleanQrId}.json`);
                existingSub = await subRes.json();
            } catch (e) {}

            let newExpiryIso = null;
            if (plan.durationMonths) {
                const existingExpiresAt = existingSub?.expiresAt ? new Date(existingSub.expiresAt) : null;
                let newExpiryDate;
                if (existingExpiresAt && !isNaN(existingExpiresAt.getTime()) && existingExpiresAt.getTime() > now.getTime()) {
                    newExpiryDate = addMonths(existingExpiresAt, plan.durationMonths);
                } else {
                    newExpiryDate = addMonths(now, plan.durationMonths);
                }
                newExpiryIso = newExpiryDate.toISOString();
            }
            const activatedAtIso = existingSub?.activatedAt || nowIso;
            const receiptNumber = `REC-${cleanUserId.slice(-4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

            const paymentRecord = {
                internalPaymentId: `pay_resqr_${paymentId}`,
                paymentId,
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                razorpayInvoiceId: paymentEntity.invoice_id || null,
                userId: cleanUserId,
                userName: notes.userName || paymentEntity.contact || '',
                userEmail: paymentEntity.email || '',
                userPhone: paymentEntity.contact || '',
                qrId: cleanQrId,
                planId,
                planName: plan.name,
                amount: (paymentEntity.amount ? paymentEntity.amount / 100 : plan.amount),
                currency: 'INR',
                status: 'SUCCESS',
                createdAt: nowIso,
                updatedAt: nowIso,
                paidAt: nowIso,
                paymentMethod: paymentEntity.method || 'razorpay',
                description: plan.name,
                receiptNumber,
                subscriptionStartDate: activatedAtIso,
                subscriptionExpiryDate: newExpiryIso,
                source: 'RAZORPAY',
                historicalImport: false,
                lastSyncedAt: nowIso,
                webhookVerified: true,
                signatureVerified: true,
                type: plan.type
            };

            const subscriptionRecord = {
                id: `sub_${cleanQrId}`,
                userId: cleanUserId,
                qrId: cleanQrId,
                planId,
                planName: plan.name,
                durationMonths: plan.durationMonths,
                amount: paymentRecord.amount,
                currency: 'INR',
                status: 'ACTIVE',
                activatedAt: activatedAtIso,
                expiresAt: newExpiryIso,
                paymentId,
                orderId,
                paymentStatus: 'paid',
                createdAt: existingSub?.createdAt || nowIso,
                updatedAt: nowIso,
                renewedAt: nowIso,
                renewalCount: (existingSub?.renewalCount || 0) + (plan.type === 'registration' ? 0 : 1)
            };

            const updates = {
                [`payments/${paymentId}`]: paymentRecord,
                [`paymentHistory/${paymentId}`]: {
                    ...paymentRecord,
                    status: 'SUCCESSFUL',
                    epoch: now.getTime()
                },
                [`subscriptions/${cleanQrId}`]: subscriptionRecord,
                [`users/${cleanUserId}/subscription`]: subscriptionRecord,
                [`users/${cleanUserId}/profiles/${cleanQrId}/subscription`]: subscriptionRecord,
                [`profiles/${cleanQrId}/subscription`]: subscriptionRecord,
                [`profiles/${cleanQrId}/payment_status`]: 'paid',
                [`profiles/${cleanQrId}/payment_id`]: paymentId,
                [`profiles/${cleanQrId}/subscriptionStatus`]: 'ACTIVE',
                [`profiles/${cleanQrId}/subscriptionExpiresAt`]: newExpiryIso,
                [`profiles/${cleanQrId}/registrationStatus`]: 'COMPLETED',
                [`profiles/${cleanQrId}/paymentStatus`]: 'SUCCESS',
                [`profiles/${cleanQrId}/serviceStatus`]: 'ACTIVE',
                [`profiles/${cleanQrId}/emergencyProfileStatus`]: 'ACTIVE',
                [`profiles/${cleanQrId}/qrStatus`]: 'ACTIVE',
                [`profiles/${cleanQrId}/planId`]: planId,
                [`profiles/${cleanQrId}/amountPaid`]: paymentRecord.amount,
                [`profiles/${cleanQrId}/paymentId`]: paymentId,
                [`profiles/${cleanQrId}/serviceStartDate`]: activatedAtIso,
                [`profiles/${cleanQrId}/serviceExpiryDate`]: newExpiryIso,
                [`users/${cleanUserId}/registrationStatus`]: 'COMPLETED',
                [`users/${cleanUserId}/paymentStatus`]: 'SUCCESS',
                [`users/${cleanUserId}/serviceStatus`]: 'ACTIVE',
                [`users/${cleanUserId}/emergencyProfileStatus`]: 'ACTIVE',
                [`users/${cleanUserId}/qrStatus`]: 'ACTIVE',
                [`users/${cleanUserId}/planId`]: planId,
                [`users/${cleanUserId}/amountPaid`]: paymentRecord.amount,
                [`users/${cleanUserId}/paymentId`]: paymentId,
                [`users/${cleanUserId}/serviceStartDate`]: activatedAtIso,
                [`users/${cleanUserId}/serviceExpiryDate`]: newExpiryIso,
                [`users/${cleanUserId}/profiles/${cleanQrId}/payment_status`]: 'paid',
                [`users/${cleanUserId}/profiles/${cleanQrId}/payment_id`]: paymentId,
                [`users/${cleanUserId}/profiles/${cleanQrId}/subscriptionStatus`]: 'ACTIVE',
                [`users/${cleanUserId}/profiles/${cleanQrId}/subscriptionExpiresAt`]: newExpiryIso,
                [`users/${cleanUserId}/profiles/${cleanQrId}/registrationStatus`]: 'COMPLETED',
                [`users/${cleanUserId}/profiles/${cleanQrId}/paymentStatus`]: 'SUCCESS',
                [`users/${cleanUserId}/profiles/${cleanQrId}/serviceStatus`]: 'ACTIVE',
                [`users/${cleanUserId}/profiles/${cleanQrId}/emergencyProfileStatus`]: 'ACTIVE',
                [`users/${cleanUserId}/profiles/${cleanQrId}/qrStatus`]: 'ACTIVE'
            };

            if (orderId) {
                updates[`paymentAttempts/${orderId}/status`] = 'SUCCESS';
                updates[`paymentAttempts/${orderId}/razorpayPaymentId`] = paymentId;
                updates[`paymentAttempts/${orderId}/updatedAt`] = nowIso;
            }

            await fetch(`${DB_URL}/.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            return res.status(200).json({ status: 'ok', action: 'ACTIVATED_OR_EXTENDED', paymentId });
        } else if (eventType === 'payment.failed') {
            const paymentEntity = eventData.payload?.payment?.entity || {};
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;
            const failureReason = paymentEntity.error_description || 'Payment Failed';
            const notes = paymentEntity.notes || {};
            const targetUid = notes.userId;
            const targetQrId = notes.qrId;

            const failureRecord = {
                paymentId: paymentId || `failed_${Date.now()}`,
                razorpayOrderId: orderId || null,
                razorpayPaymentId: paymentId || null,
                status: 'FAILED',
                failureReason,
                updatedAt: nowIso,
                createdAt: nowIso
            };

            const updates = {};
            if (paymentId) updates[`payments/${paymentId}`] = failureRecord;
            if (orderId) {
                updates[`paymentAttempts/${orderId}/status`] = 'FAILED';
                updates[`paymentAttempts/${orderId}/failureReason`] = failureReason;
                updates[`paymentAttempts/${orderId}/updatedAt`] = nowIso;
            }
            if (targetUid) {
                updates[`users/${targetUid}/paymentStatus`] = 'FAILED';
                updates[`users/${targetUid}/registrationStatus`] = 'PAYMENT_FAILED';
                updates[`users/${targetUid}/serviceStatus`] = 'NOT_ACTIVE';
                updates[`users/${targetUid}/emergencyProfileStatus`] = 'NOT_CREATED';
                updates[`users/${targetUid}/qrStatus`] = 'NOT_ACTIVE';
            }
            if (targetQrId) {
                updates[`profiles/${targetQrId}/paymentStatus`] = 'FAILED';
                updates[`profiles/${targetQrId}/registrationStatus`] = 'PAYMENT_FAILED';
                updates[`profiles/${targetQrId}/serviceStatus`] = 'NOT_ACTIVE';
                updates[`profiles/${targetQrId}/emergencyProfileStatus`] = 'NOT_CREATED';
                updates[`profiles/${targetQrId}/qrStatus`] = 'NOT_ACTIVE';
            }

            if (Object.keys(updates).length > 0) {
                await fetch(`${DB_URL}/.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
            }

            return res.status(200).json({ status: 'ok', action: 'FAILED_RECORDED' });
        } else if (eventType === 'refund.processed' || eventType === 'refund.created') {
            const refundEntity = eventData.payload?.refund?.entity || {};
            const paymentId = refundEntity.payment_id;
            const notes = refundEntity.notes || {};
            const targetUid = notes.userId;
            const targetQrId = notes.qrId;

            if (paymentId) {
                const updates = {
                    [`payments/${paymentId}/status`]: 'REFUNDED',
                    [`payments/${paymentId}/refundId`]: refundEntity.id,
                    [`payments/${paymentId}/refundAmount`]: refundEntity.amount ? refundEntity.amount / 100 : 0,
                    [`payments/${paymentId}/refundAt`]: nowIso,
                    [`payments/${paymentId}/updatedAt`]: nowIso
                };

                if (targetUid) {
                    updates[`users/${targetUid}/paymentStatus`] = 'REFUNDED';
                    updates[`users/${targetUid}/serviceStatus`] = 'SUSPENDED';
                    updates[`users/${targetUid}/emergencyProfileStatus`] = 'INACTIVE';
                    updates[`users/${targetUid}/qrStatus`] = 'NOT_ACTIVE';
                }
                if (targetQrId) {
                    updates[`profiles/${targetQrId}/paymentStatus`] = 'REFUNDED';
                    updates[`profiles/${targetQrId}/serviceStatus`] = 'SUSPENDED';
                    updates[`profiles/${targetQrId}/emergencyProfileStatus`] = 'INACTIVE';
                    updates[`profiles/${targetQrId}/qrStatus`] = 'NOT_ACTIVE';
                }

                await fetch(`${DB_URL}/.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
            }

            return res.status(200).json({ status: 'ok', action: 'REFUND_RECORDED' });
        }

        return res.status(200).json({ status: 'ok', received: true });
    } catch (err) {
        console.error('Razorpay Webhook execution error:', err);
        return res.status(500).json({ error: 'Webhook processing error', message: err.message });
    }
}
