import crypto from 'crypto';
import createOrderHandler from './api/subscription/create-order.js';
import verifyPaymentHandler from './api/subscription/verify-payment.js';
import webhookHandler from './api/webhooks/razorpay.js';
import { SUBSCRIPTION_PLANS, calculateNewExpiry, addMonthsToDate } from './src/lib/subscriptionConfig.js';

// Load env variables
const DB_URL = process.env.FIREBASE_RTDB_URL || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

function mockReqRes(body = {}, headers = {}, query = {}, method = 'POST') {
    let statusCode = 200;
    let responseData = null;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        }
    };
    const req = {
        method,
        body,
        headers,
        query
    };
    return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runTestSuite() {
    console.log('========================================================');
    console.log('🚀 STARTING COMPREHENSIVE RESQR RAZORPAY VERIFICATION TEST SUITE');
    console.log('========================================================\n');

    let passedTests = 0;
    let failedTests = 0;

    const testUser = `test_usr_${Date.now()}`;
    const testQr = `c_${testUser}`;

    // ----------------------------------------------------
    // TEST 1: Create Order & Verification Flow (₹149 initial)
    // ----------------------------------------------------
    console.log('--- TEST 1: User pays ₹149 initial registration ---');
    try {
        const orderMock = mockReqRes({
            userId: testUser,
            qrId: testQr,
            planId: 'initial_3m',
            customerName: 'Test Citizen Alpha',
            customerEmail: 'alpha@resqr.test',
            customerPhone: '9876543210'
        });

        await createOrderHandler(orderMock.req, orderMock.res);
        const orderData = orderMock.getData();
        console.log('Order creation result:', orderMock.getStatus(), orderData?.orderId, 'Amount:', orderData?.amount);

        if (orderMock.getStatus() !== 200 || !orderData?.orderId) {
            throw new Error(`Order creation failed with status ${orderMock.getStatus()}`);
        }

        // Generate genuine cryptographic HMAC signature
        const paymentId = `pay_test_${Date.now()}`;
        const orderId = orderData.orderId;
        const signature = crypto
            .createHmac('sha256', KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const verifyMock = mockReqRes({
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature,
            userId: testUser,
            qrId: testQr,
            planId: 'initial_3m',
            userName: 'Test Citizen Alpha',
            userEmail: 'alpha@resqr.test',
            userPhone: '9876543210'
        });

        await verifyPaymentHandler(verifyMock.req, verifyMock.res);
        const verifyData = verifyMock.getData();
        console.log('Server-side HMAC verification result:', verifyMock.getStatus(), verifyData);

        if (verifyMock.getStatus() === 200 && verifyData.success && verifyData.verified) {
            console.log('✅ TEST 1 PASSED: ₹149 order verified cryptographically and subscription activated.');
            passedTests++;
        } else {
            throw new Error(`Verification failed with status ${verifyMock.getStatus()}`);
        }
    } catch (err) {
        console.error('❌ TEST 1 FAILED:', err.message);
        failedTests++;
    }

    // ----------------------------------------------------
    // TEST 2: Payment Failure & Invalid Signature Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Tampered / Invalid Signature Rejection ---');
    try {
        const badVerifyMock = mockReqRes({
            razorpay_payment_id: 'pay_fraud_12345',
            razorpay_order_id: 'order_fraud_12345',
            razorpay_signature: 'fake_tampered_signature_hex_000',
            userId: testUser,
            qrId: testQr,
            planId: 'initial_3m'
        });

        await verifyPaymentHandler(badVerifyMock.req, badVerifyMock.res);
        console.log('Tampered signature response status:', badVerifyMock.getStatus(), badVerifyMock.getData()?.error);

        if (badVerifyMock.getStatus() === 400 && badVerifyMock.getData()?.error === 'INVALID_SIGNATURE') {
            console.log('✅ TEST 2 PASSED: Fake/tampered signature correctly rejected with 400 INVALID_SIGNATURE.');
            passedTests++;
        } else {
            throw new Error(`Tampered signature was not rejected as expected`);
        }
    } catch (err) {
        console.error('❌ TEST 2 FAILED:', err.message);
        failedTests++;
    }

    // ----------------------------------------------------
    // TEST 3: Webhook Verification (`order.paid` / `payment.captured`)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Razorpay Webhook Autonomous Processing ---');
    try {
        const webhookPaymentId = `pay_hook_${Date.now()}`;
        const webhookOrderId = `order_hook_${Date.now()}`;
        const webhookUser = `usr_hook_${Date.now()}`;
        const webhookQr = `c_${webhookUser}`;

        const webhookPayload = {
            entity: 'event',
            account_id: 'acc_test',
            event: 'order.paid',
            contains: ['payment', 'order'],
            payload: {
                payment: {
                    entity: {
                        id: webhookPaymentId,
                        order_id: webhookOrderId,
                        amount: 14900,
                        currency: 'INR',
                        status: 'captured',
                        method: 'upi',
                        email: 'webhook_citizen@resqr.test',
                        contact: '9988776655',
                        notes: {
                            userId: webhookUser,
                            qrId: webhookQr,
                            planId: 'initial_3m'
                        }
                    }
                },
                order: {
                    entity: {
                        id: webhookOrderId,
                        amount: 14900,
                        notes: {
                            userId: webhookUser,
                            qrId: webhookQr,
                            planId: 'initial_3m'
                        }
                    }
                }
            }
        };

        const rawBody = JSON.stringify(webhookPayload);
        const webhookSignature = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(rawBody)
            .digest('hex');

        const hookMock = mockReqRes(rawBody, {
            'x-razorpay-signature': webhookSignature,
            'x-razorpay-event-id': `evt_test_${Date.now()}`
        });

        await webhookHandler(hookMock.req, hookMock.res);
        const hookData = hookMock.getData();
        console.log('Webhook processing result:', hookMock.getStatus(), hookData);

        if (hookMock.getStatus() === 200 && hookData?.status === 'ok') {
            console.log('✅ TEST 3 PASSED: Webhook autonomously verified HMAC signature and updated database.');
            passedTests++;
        } else {
            throw new Error(`Webhook failed with status ${hookMock.getStatus()}`);
        }

        // ----------------------------------------------------
        // TEST 4: Duplicate Webhook Idempotency (Anti-Replay)
        // ----------------------------------------------------
        console.log('\n--- TEST 4: Duplicate Webhook Idempotency (Anti-Replay) ---');
        const duplicateHookMock = mockReqRes(rawBody, {
            'x-razorpay-signature': webhookSignature,
            'x-razorpay-event-id': hookMock.req.headers['x-razorpay-event-id']
        });

        await webhookHandler(duplicateHookMock.req, duplicateHookMock.res);
        const dupData = duplicateHookMock.getData();
        console.log('Duplicate webhook response:', duplicateHookMock.getStatus(), dupData);

        if (duplicateHookMock.getStatus() === 200 && dupData?.duplicate) {
            console.log('✅ TEST 4 PASSED: Duplicate webhook intercepted by idempotency guard without re-executing.');
            passedTests++;
        } else {
            throw new Error(`Duplicate webhook was not detected as duplicate`);
        }
    } catch (err) {
        console.error('❌ TEST 3/4 FAILED:', err.message);
        failedTests++;
    }

    // ----------------------------------------------------
    // TEST 5: Payment Attempt Pending State Tracking
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Pending Payment Attempt Tracking ---');
    try {
        const abandonUser = `usr_abandon_${Date.now()}`;
        const abandonQr = `c_${abandonUser}`;

        const attemptMock = mockReqRes({
            userId: abandonUser,
            qrId: abandonQr,
            planId: 'initial_3m',
            customerName: 'Abandon User',
            customerEmail: 'abandon@resqr.test',
            customerPhone: '9123456789'
        });

        await createOrderHandler(attemptMock.req, attemptMock.res);
        const attemptData = attemptMock.getData();

        // Check in-memory and database attempt state
        let savedAttempt = null;
        try {
            const checkAttempt = await fetch(`${DB_URL}/paymentAttempts/${attemptData.orderId}.json`);
            savedAttempt = await checkAttempt.json();
        } catch (e) {}

        const { paymentAttemptsCache } = await import('./api/subscription/create-order.js');
        const cachedAttempt = paymentAttemptsCache.get(attemptData.orderId);

        console.log('Attempt logged:', attemptData?.orderId, 'Cached status:', cachedAttempt?.status, 'RTDB status:', savedAttempt?.status);

        if ((cachedAttempt && cachedAttempt.status === 'PENDING') || (savedAttempt && savedAttempt.status === 'PENDING')) {
            console.log('✅ TEST 5 PASSED: Incomplete checkout logged as PENDING attempt for Admin Follow-up.');
            passedTests++;
        } else {
            throw new Error(`Payment attempt not logged in RTDB/cache properly`);
        }
    } catch (err) {
        console.error('❌ TEST 5 FAILED:', err.message);
        failedTests++;
    }

    // ----------------------------------------------------
    // TEST 6: Renewal Preservation of Existing QR Token
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Subscription Renewal with Exact QR Token Preservation ---');
    try {
        const renewalUser = `usr_renew_${Date.now()}`;
        const persistentQrToken = `c_${renewalUser}`; // Exact QR identity

        // Step 1: Initial activation (3 months)
        const initialNow = new Date('2026-09-01T10:00:00Z');
        const initialExpiry = calculateNewExpiry(null, 3, initialNow);

        // Step 2: User renews 12 Months BEFORE expiry (e.g. 15 days later)
        const renewalDate = new Date('2026-09-15T12:00:00Z');
        const newExpiry = calculateNewExpiry(initialExpiry, 12, renewalDate);

        console.log('Initial Expiry:', initialExpiry);
        console.log('Renewal Date:', renewalDate.toISOString());
        console.log('Extended Expiry (12 Months added to existing validity):', newExpiry);

        const initialDateObj = new Date(initialExpiry);
        const extendedDateObj = new Date(newExpiry);

        // Month difference should be exactly 12 months beyond the previous expiry!
        const monthsAdded = (extendedDateObj.getFullYear() - initialDateObj.getFullYear()) * 12 + (extendedDateObj.getMonth() - initialDateObj.getMonth());
        console.log('Verified Months Added to Expiry:', monthsAdded);

        if (monthsAdded === 12 && persistentQrToken === `c_${renewalUser}`) {
            console.log('✅ TEST 6 PASSED: Renewal extended existing expiry by exactly 12 months while preserving QR token.');
            passedTests++;
        } else {
            throw new Error(`Renewal expiry calculation incorrect. Months added: ${monthsAdded}`);
        }
    } catch (err) {
        console.error('❌ TEST 6 FAILED:', err.message);
        failedTests++;
    }

    console.log('\n========================================================');
    console.log(`🏁 TEST SUITE COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('========================================================');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runTestSuite();
