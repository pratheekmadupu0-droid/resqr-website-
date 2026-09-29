import Razorpay from 'razorpay';

const DB_URL = process.env.FIREBASE_RTDB_URL || 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';

const PLAN_PRICES = {
    initial_3m: { name: 'RESQR Registration + 2 QR Stickers', amount: 149, durationMonths: 3, type: 'registration' },
    renewal_3m: { name: '3 Months Renewal', amount: 299, durationMonths: 3, type: 'renewal' },
    renewal_6m: { name: '6 Months Renewal', amount: 599, durationMonths: 6, type: 'renewal' },
    renewal_12m: { name: '12 Months Renewal', amount: 1199, durationMonths: 12, type: 'renewal' },
    renewal_18m: { name: '18 Months Renewal', amount: 1799, durationMonths: 18, type: 'renewal' },
    renewal_24m: { name: '24 Months Renewal', amount: 2399, durationMonths: 24, type: 'renewal' }
};

export const paymentAttemptsCache = new Map();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        userId,
        qrId,
        planId = 'initial_3m',
        customerName = '',
        customerEmail = '',
        customerPhone = ''
    } = req.body || {};

    if (!userId || !qrId) {
        return res.status(400).json({ error: 'User ID and QR ID are required.' });
    }

    const plan = PLAN_PRICES[planId];
    if (!plan) {
        return res.status(400).json({ error: `Invalid plan specified: ${planId}` });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return res.status(500).json({
            error: 'CONFIG_ERROR',
            message: 'Razorpay keys not configured on server. Check environment variables.'
        });
    }

    const cleanReceipt = `rcpt_${String(userId).slice(-6)}_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40);
    const now = new Date();
    const nowIso = now.toISOString();

    try {
        const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const razorpayOrder = await rzp.orders.create({
            amount: Math.round(plan.amount * 100), // amount in paise
            currency: 'INR',
            receipt: cleanReceipt,
            notes: {
                userId: String(userId),
                qrId: String(qrId),
                planId: String(planId),
                planName: plan.name,
                durationMonths: String(plan.durationMonths),
                type: plan.type
            }
        });

        const orderId = razorpayOrder.id;

        // Record pending payment attempt in database (Section 12)
        const attemptRecord = {
            attemptId: orderId,
            orderId: orderId,
            userId: String(userId),
            qrId: String(qrId),
            userName: customerName || '',
            userEmail: customerEmail || '',
            userPhone: customerPhone || '',
            planId: planId,
            planName: plan.name,
            amount: plan.amount,
            currency: 'INR',
            status: 'PENDING',
            receiptNumber: cleanReceipt,
            createdAt: nowIso,
            updatedAt: nowIso,
            epoch: now.getTime()
        };

        paymentAttemptsCache.set(orderId, attemptRecord);

        try {
            await fetch(`${DB_URL}/paymentAttempts/${orderId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attemptRecord)
            });
        } catch (dbErr) {
            console.warn('Payment attempt recording notice:', dbErr.message);
        }

        // Return only safe checkout info to frontend (Never expose secret!)
        return res.status(200).json({
            success: true,
            orderId: razorpayOrder.id,
            amount: plan.amount,
            currency: 'INR',
            planId: planId,
            planName: plan.name,
            durationMonths: plan.durationMonths,
            keyId: keyId,
            receipt: cleanReceipt,
            customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone
            }
        });
    } catch (err) {
        console.error('Razorpay order creation error:', err);
        return res.status(500).json({
            error: 'ORDER_CREATION_FAILED',
            message: err.message || 'Failed to create Razorpay order'
        });
    }
}
