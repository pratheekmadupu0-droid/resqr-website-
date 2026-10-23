/**
 * RESQR Subscription & Payment Client API
 * Connects frontend flows to backend endpoints for order creation,
 * cryptographic verification, subscription status, and payment history.
 */

import { db } from './firebase';
import { ref, get } from 'firebase/database';
import { SUBSCRIPTION_PLANS, calculateSubscriptionStatus } from './subscriptionConfig';

/**
 * Creates a Razorpay order securely on the backend.
 */
export async function createSubscriptionOrder({
    userId,
    qrId,
    planId = 'initial_3m',
    customerName = '',
    customerEmail = '',
    customerPhone = ''
}) {
    const response = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            qrId,
            planId,
            customerName,
            customerEmail,
            customerPhone
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to initialize payment order with server.');
    }

    const data = await response.json();
    return data;
}

/**
 * Cryptographically verifies Razorpay payment on the server and activates/extends the subscription.
 */
export async function verifySubscriptionPayment({
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    userId,
    qrId,
    planId,
    userName = '',
    userEmail = '',
    userPhone = ''
}) {
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        throw new Error('Complete Razorpay payment credentials are required for verification.');
    }

    const response = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            userId,
            qrId,
            planId,
            userName,
            userEmail,
            userPhone
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Cryptographic payment verification failed on server.');
    }

    return data;
}

/**
 * Fetches subscription status from serverless backend or RTDB fallback.
 */
export async function getSubscriptionStatus(qrId, userId) {
    if (!qrId && !userId) return null;

    try {
        const queryParams = new URLSearchParams();
        if (qrId) queryParams.set('qrId', qrId);
        if (userId) queryParams.set('userId', userId);

        const res = await fetch(`/api/subscription/status?${queryParams.toString()}`);
        if (res.ok) {
            const data = await res.json();
            if (data.found) return data;
        }
    } catch (e) {}

    // Fallback: Fetch directly from RTDB
    try {
        let sub = null;
        if (qrId) {
            const snap = await get(ref(db, `subscriptions/${qrId}`));
            if (snap.exists()) sub = snap.val();
        }
        if (!sub && userId) {
            const userSubSnap = await get(ref(db, `users/${userId}/subscription`));
            if (userSubSnap.exists()) sub = userSubSnap.val();
        }
        if (!sub && qrId) {
            const profileSnap = await get(ref(db, `profiles/${qrId}/subscription`));
            if (profileSnap.exists()) sub = profileSnap.val();
        }

        if (sub) {
            const statusInfo = calculateSubscriptionStatus(sub);
            return {
                found: true,
                ...sub,
                ...statusInfo
            };
        }
    } catch (e) {
        console.error('Error fetching subscription status:', e);
    }

    return null;
}

/**
 * Fetches all verified payment history for a user or QR.
 */
export async function getPaymentHistory(userId, qrId) {
    try {
        // First try canonical payments collection
        const paymentsSnap = await get(ref(db, 'payments'));
        let payments = [];

        if (paymentsSnap.exists()) {
            payments = Object.values(paymentsSnap.val());
        } else {
            const legacySnap = await get(ref(db, 'paymentHistory'));
            if (legacySnap.exists()) {
                payments = Object.values(legacySnap.val());
            }
        }

        return payments
            .filter(item => {
                if (!item) return false;
                if (userId && item.userId === userId) return true;
                if (qrId && item.qrId === qrId) return true;
                return false;
            })
            .sort((a, b) => new Date(b.createdAt || b.paidAt || b.timestamp || 0) - new Date(a.createdAt || a.paidAt || a.timestamp || 0));
    } catch (e) {
        console.error('Failed to fetch payment history:', e);
        return [];
    }
}

/**
 * Fetches payment attempts for a user or admin audit.
 */
export async function getPaymentAttempts(userId) {
    try {
        const attemptsSnap = await get(ref(db, 'paymentAttempts'));
        if (!attemptsSnap.exists()) return [];

        const all = Object.values(attemptsSnap.val());
        return all
            .filter(item => !userId || item.userId === userId)
            .sort((a, b) => (b.epoch || 0) - (a.epoch || 0));
    } catch (e) {
        console.error('Failed to fetch payment attempts:', e);
        return [];
    }
}
