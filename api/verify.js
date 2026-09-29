import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
        return res.status(500).json({ error: 'CONFIG_ERROR', message: 'Razorpay secret not configured on server' });
    }

    if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Order ID, Payment ID, and Signature are required' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        return res.status(200).json({ status: 'ok', verified: true, message: 'Payment verified successfully' });
    } else {
        return res.status(400).json({ status: 'error', verified: false, message: 'Invalid payment signature' });
    }
}
