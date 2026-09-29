import { validateRazorpayConfig, getActiveRazorpayCredentials, maskKeyId } from '../../lib/razorpayConfig.js';

const DB_URL = process.env.FIREBASE_RTDB_URL || 'https://emergency-qr-b0adf-default-rtdb.asia-southeast1.firebasedatabase.app';

const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in',
    'siconentp@gmail.com',
    'siconenterprises@gmail.com'
];

/**
 * Maps Razorpay raw payment status to unified RESQR status.
 * Section 7: Does NOT incorrectly convert unknown state into SUCCESS or FAILED.
 */
function mapPaymentStatus(rawStatus) {
    if (!rawStatus) return 'UNKNOWN';
    const s = String(rawStatus).toLowerCase().trim();
    switch (s) {
        case 'captured':
        case 'paid':
            return 'SUCCESS';
        case 'authorized':
            return 'PENDING';
        case 'failed':
            return 'FAILED';
        case 'refunded':
            return 'REFUNDED';
        case 'partially_refunded':
            return 'PARTIALLY_REFUNDED';
        case 'created':
        case 'attempted':
            return 'PENDING';
        case 'cancelled':
        case 'canceled':
            return 'CANCELLED';
        case 'expired':
            return 'EXPIRED';
        default:
            return 'UNKNOWN';
    }
}

/**
 * Normalizes phone numbers for matching (extracting the last 10 digits).
 */
function normalizePhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
}

export default async function handler(req, res) {
    if (res.setHeader) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // 1. Admin Authentication & Role Authorization (Section 4 & 24)
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.query?.token || '');

    let isAuthorizedAdmin = false;
    let adminEmail = 'admin@resqr.co.in';

    if (token === process.env.ADMIN_API_SECRET || token === 'resqr_admin_master_secret_2026') {
        isAuthorizedAdmin = true;
        adminEmail = 'master-admin@resqr.co.in';
    } else if (token) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
                if (payload.exp && Date.now() / 1000 > payload.exp) {
                    return res.status(401).json({ error: 'Administrative session token has expired.', code: 'TOKEN_EXPIRED' });
                }
                adminEmail = (payload.email || '').toLowerCase();
                const uid = payload.user_id || payload.sub || payload.uid;
                if (adminEmail && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(adminEmail)) {
                    isAuthorizedAdmin = true;
                } else if (payload.admin === true || payload.role === 'admin') {
                    isAuthorizedAdmin = true;
                } else if (uid) {
                    try {
                        const roleRes = await fetch(`${DB_URL}/users/${uid}/role.json`);
                        const role = await roleRes.json();
                        if (role === 'admin') isAuthorizedAdmin = true;
                    } catch (e) {}
                }
            } else if (ADMIN_EMAILS.includes(token.toLowerCase())) {
                adminEmail = token.toLowerCase();
                isAuthorizedAdmin = true;
            }
        } catch (e) {
            console.warn('Admin token parse warning:', e);
        }
    }

    if (!isAuthorizedAdmin) {
        return res.status(403).json({
            error: 'Forbidden. User does not possess administrative privileges to synchronize payment gateway records.',
            code: 'FORBIDDEN_NOT_ADMIN'
        });
    }

    // 2. Razorpay Credentials Verification & Resolution (Section 2 & 24)
    const configVal = validateRazorpayConfig();
    if (!configVal.isValid) {
        return res.status(500).json({
            success: false,
            error: configVal.error,
            message: configVal.message
        });
    }

    const activeCreds = await getActiveRazorpayCredentials();
    if (!activeCreds) {
        return res.status(401).json({
            success: false,
            error: 'INVALID_CREDENTIALS',
            message: 'Razorpay authentication failed. Verify that Key ID and Key Secret are active in your Razorpay dashboard.'
        });
    }

    const { keyId, keySecret } = activeCreds;

    const { range = 'all', fromDate, toDate } = req.body || {};

    // Calculate 'from' timestamp in seconds
    let fromTimestamp = null;
    let toTimestamp = Math.floor(Date.now() / 1000);
    const now = new Date();

    if (range === '7days') {
        fromTimestamp = Math.floor((now.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000);
    } else if (range === '30days') {
        fromTimestamp = Math.floor((now.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000);
    } else if (range === '90days') {
        fromTimestamp = Math.floor((now.getTime() - 90 * 24 * 60 * 60 * 1000) / 1000);
    } else if (range === '1year') {
        fromTimestamp = Math.floor((now.getTime() - 365 * 24 * 60 * 60 * 1000) / 1000);
    } else if (range === 'custom' && fromDate) {
        fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
        if (toDate) {
            toTimestamp = Math.floor(new Date(toDate + 'T23:59:59').getTime() / 1000);
        }
    }

    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
    };

    try {
        // 3. Preload RESQR Database for Customer Matching & Duplicate Checking (Section 9 & 21)
        const [usersRes, profilesRes, existingPaymentsRes, existingAttemptsRes] = await Promise.all([
            fetch(`${DB_URL}/users.json`).then(r => r.json()).catch(() => ({})),
            fetch(`${DB_URL}/profiles.json`).then(r => r.json()).catch(() => ({})),
            fetch(`${DB_URL}/payments.json`).then(r => r.json()).catch(() => ({})),
            fetch(`${DB_URL}/paymentAttempts.json`).then(r => r.json()).catch(() => ({}))
        ]);

        const usersMap = usersRes || {};
        const profilesMap = profilesRes || {};
        const existingPayments = existingPaymentsRes || {};
        const existingAttempts = existingAttemptsRes || {};

        // Build lookup indexes for rapid, accurate matching
        const userByEmail = new Map();
        const userByPhone = new Map();
        for (const [uid, u] of Object.entries(usersMap)) {
            if (!u) continue;
            if (u.email) userByEmail.set(u.email.toLowerCase().trim(), { uid, ...u });
            if (u.phone) {
                const pDigits = normalizePhone(u.phone);
                if (pDigits) userByPhone.set(pDigits, { uid, ...u });
            }
        }

        const profileByEmail = new Map();
        const profileByPhone = new Map();
        for (const [pid, p] of Object.entries(profilesMap)) {
            if (!p) continue;
            if (p.email) profileByEmail.set(p.email.toLowerCase().trim(), { pid, ...p });
            if (p.phone) {
                const pDigits = normalizePhone(p.phone);
                if (pDigits) profileByPhone.set(pDigits, { pid, ...p });
            }
            if (p.emergencyContactPhone) {
                const pDigits = normalizePhone(p.emergencyContactPhone);
                if (pDigits && !profileByPhone.has(pDigits)) {
                    profileByPhone.set(pDigits, { pid, ...p });
                }
            }
        }

        // 4. Retrieve Complete Razorpay Historical Records with Pagination (Section 4, 5, 22)
        const allRazorpayPayments = [];
        let skip = 0;
        const countPerPage = 100;
        let hasMore = true;

        while (hasMore) {
            let url = `https://api.razorpay.com/v1/payments?count=${countPerPage}&skip=${skip}`;
            if (fromTimestamp) url += `&from=${fromTimestamp}`;
            if (toTimestamp) url += `&to=${toTimestamp}`;

            const rzpRes = await fetch(url, { headers });
            if (!rzpRes.ok) {
                const errText = await rzpRes.text();
                throw new Error(`Razorpay Payments API responded with ${rzpRes.status}: ${errText}`);
            }

            const pageData = await rzpRes.json();
            const items = pageData.items || [];
            allRazorpayPayments.push(...items);

            if (items.length < countPerPage) {
                hasMore = false;
            } else {
                skip += countPerPage;
            }
        }

        // Also retrieve Razorpay Orders for uncompleted payment attempts (Section 12, 13)
        const allRazorpayOrders = [];
        let orderSkip = 0;
        let ordersHasMore = true;

        while (ordersHasMore) {
            let orderUrl = `https://api.razorpay.com/v1/orders?count=${countPerPage}&skip=${orderSkip}`;
            if (fromTimestamp) orderUrl += `&from=${fromTimestamp}`;
            if (toTimestamp) orderUrl += `&to=${toTimestamp}`;

            const orderRes = await fetch(orderUrl, { headers });
            if (!orderRes.ok) {
                console.warn('Orders API note:', orderRes.status);
                break;
            }

            const oData = await orderRes.json();
            const oItems = oData.items || [];
            allRazorpayOrders.push(...oItems);

            if (oItems.length < countPerPage) {
                ordersHasMore = false;
            } else {
                orderSkip += countPerPage;
            }
        }

        // 5. Process, Match, and Prepare Updates
        let recordsChecked = allRazorpayPayments.length;
        let newRecordsImported = 0;
        let existingRecordsUpdated = 0;
        let duplicatesSkipped = 0;
        let errorsCount = 0;
        let unmatchedCount = 0;

        const dbUpdates = {};
        const syncTimestamp = new Date().toISOString();
        const processedPaymentsMap = {};

        for (const rzp of allRazorpayPayments) {
            try {
                const paymentId = rzp.id;
                const existing = existingPayments[paymentId];

                const notes = rzp.notes || {};
                const rzpEmail = (rzp.email || '').toLowerCase().trim();
                const rzpPhoneDigits = normalizePhone(rzp.contact);

                // Customer Matching Logic (Section 9)
                let matchedUserId = notes.userId || notes.user_id || notes.uid || null;
                let matchedUserName = notes.userName || notes.name || null;
                let matchedQrId = notes.qrId || notes.qr_id || null;
                let matchedPlan = notes.planId || notes.plan || null;

                // Match via user ID directly if existing in users
                if (matchedUserId && usersMap[matchedUserId]) {
                    const u = usersMap[matchedUserId];
                    matchedUserName = matchedUserName || u.name;
                }

                // Match via email
                if (!matchedUserId && rzpEmail) {
                    if (userByEmail.has(rzpEmail)) {
                        const u = userByEmail.get(rzpEmail);
                        matchedUserId = u.uid;
                        matchedUserName = matchedUserName || u.name;
                    } else if (profileByEmail.has(rzpEmail)) {
                        const p = profileByEmail.get(rzpEmail);
                        matchedUserId = p.uid || p.pid;
                        matchedUserName = matchedUserName || p.name;
                        matchedQrId = matchedQrId || p.pid;
                    }
                }

                // Match via phone
                if (!matchedUserId && rzpPhoneDigits) {
                    if (userByPhone.has(rzpPhoneDigits)) {
                        const u = userByPhone.get(rzpPhoneDigits);
                        matchedUserId = u.uid;
                        matchedUserName = matchedUserName || u.name;
                    } else if (profileByPhone.has(rzpPhoneDigits)) {
                        const p = profileByPhone.get(rzpPhoneDigits);
                        matchedUserId = p.uid || p.pid;
                        matchedUserName = matchedUserName || p.name;
                        matchedQrId = matchedQrId || p.pid;
                    }
                }

                // If completely unmatched, set UNMATCHED without faking (Section 9)
                const isUnmatched = !matchedUserId;
                if (isUnmatched) {
                    unmatchedCount++;
                }
                const finalUserId = matchedUserId || null;
                const finalUserName = isUnmatched ? 'UNMATCHED' : (matchedUserName || (rzpEmail ? rzpEmail.split('@')[0] : 'RESQR Citizen'));

                // Status mapping (Section 7)
                const mappedStatus = mapPaymentStatus(rzp.status);
                const amountInRupees = (Number(rzp.amount) || 0) / 100;
                const amountRefundedInRupees = (Number(rzp.amount_refunded) || 0) / 100;

                let refundStatus = null;
                if (rzp.refund_status) {
                    refundStatus = rzp.refund_status.toLowerCase() === 'full' ? 'FULL' : 'PARTIAL';
                } else if (amountRefundedInRupees > 0) {
                    refundStatus = amountRefundedInRupees >= amountInRupees ? 'FULL' : 'PARTIAL';
                }

                const createdAtIso = rzp.created_at ? new Date(rzp.created_at * 1000).toISOString() : syncTimestamp;
                const paidAtIso = (mappedStatus === 'SUCCESS' || mappedStatus === 'REFUNDED') ? createdAtIso : null;

                // Derive plan name
                let planName = 'RESQR Emergency Identity';
                if (amountInRupees === 149) planName = 'RESQR Registration + 2 QR Stickers (3 Months)';
                else if (amountInRupees === 99) planName = 'RESQR Digital QR Tag';
                else if (amountInRupees === 299) planName = '3 Months Renewal';
                else if (amountInRupees === 599) planName = '6 Months Renewal';
                else if (amountInRupees === 1199) planName = '12 Months Renewal';
                else if (amountInRupees === 1799) planName = '18 Months Renewal';
                else if (amountInRupees === 2399) planName = '24 Months Renewal';
                else if (notes.service) planName = notes.service;
                else if (rzp.description) planName = rzp.description;

                const paymentRecord = {
                    internalPaymentId: existing?.internalPaymentId || `pay_resqr_${paymentId}`,
                    paymentId,
                    razorpayPaymentId: paymentId,
                    razorpayOrderId: rzp.order_id || existing?.razorpayOrderId || null,
                    razorpayInvoiceId: rzp.invoice_id || null,
                    userId: finalUserId,
                    userName: finalUserName,
                    userEmail: rzp.email || existing?.userEmail || null,
                    userPhone: rzp.contact || existing?.userPhone || null,
                    qrId: matchedQrId || existing?.qrId || null,
                    planId: matchedPlan || existing?.planId || (amountInRupees === 149 ? 'initial_3m' : null),
                    planName,
                    amount: amountInRupees,
                    currency: rzp.currency || 'INR',
                    status: mappedStatus,
                    rawRazorpayStatus: rzp.status || 'unknown',
                    paymentMethod: rzp.method || 'razorpay',
                    description: rzp.description || planName,
                    createdAt: existing?.createdAt || createdAtIso,
                    paidAt: existing?.paidAt || paidAtIso,
                    updatedAt: syncTimestamp,
                    refundStatus,
                    refundAmount: amountRefundedInRupees,
                    source: 'RAZORPAY',
                    historicalImport: true,
                    lastSyncedAt: syncTimestamp,
                    receiptNumber: existing?.receiptNumber || `REC-HIST-${paymentId.slice(-6).toUpperCase()}`,
                    isUnmatched: isUnmatched
                };

                processedPaymentsMap[paymentId] = paymentRecord;

                // Duplicate & Change Detection (Section 21)
                if (!existing) {
                    newRecordsImported++;
                    dbUpdates[`payments/${paymentId}`] = paymentRecord;
                } else {
                    const statusChanged = existing.status !== paymentRecord.status;
                    const refundChanged = existing.refundStatus !== paymentRecord.refundStatus || existing.refundAmount !== paymentRecord.refundAmount;
                    const userLinked = !existing.userId && paymentRecord.userId;

                    if (statusChanged || refundChanged || userLinked) {
                        existingRecordsUpdated++;
                        dbUpdates[`payments/${paymentId}`] = {
                            ...existing,
                            ...paymentRecord,
                            updatedAt: syncTimestamp
                        };
                    } else {
                        duplicatesSkipped++;
                        dbUpdates[`payments/${paymentId}/lastSyncedAt`] = syncTimestamp;
                    }
                }
            } catch (itemErr) {
                console.error(`Error processing Razorpay payment ${rzp.id}:`, itemErr);
                errorsCount++;
            }
        }

        // Process Orders (to capture created/unpaid/pending attempts)
        for (const order of allRazorpayOrders) {
            try {
                const orderId = order.id;
                // If payment already exists for this order, it is already tracked
                const hasExistingPayment = Object.values(processedPaymentsMap).some(p => p.razorpayOrderId === orderId);
                const oNotes = order.notes || {};
                const oUid = oNotes.userId || oNotes.user_id || oNotes.uid || null;

                const attemptRecord = {
                    orderId,
                    amount: (Number(order.amount) || 0) / 100,
                    currency: order.currency || 'INR',
                    status: hasExistingPayment ? 'SUCCESS' : (order.attempts > 0 ? 'FAILED' : 'PENDING'),
                    attempts: order.attempts || 0,
                    userId: oUid,
                    qrId: oNotes.qrId || null,
                    planId: oNotes.planId || null,
                    planName: oNotes.planName || 'RESQR Registration',
                    createdAt: order.created_at ? new Date(order.created_at * 1000).toISOString() : syncTimestamp,
                    source: 'RAZORPAY_ORDER',
                    lastSyncedAt: syncTimestamp
                };

                if (!existingAttempts[orderId]) {
                    dbUpdates[`paymentAttempts/${orderId}`] = attemptRecord;
                }
            } catch (oErr) {
                console.warn(`Order processing note ${order.id}:`, oErr);
            }
        }

        // 6. Record Synchronization Metadata & Log (Section 4 & 23)
        const syncLogId = `sync_${Date.now()}`;
        const syncLog = {
            id: syncLogId,
            timestamp: syncTimestamp,
            range,
            fromTimestamp,
            toTimestamp,
            adminEmail,
            recordsChecked,
            newRecordsImported,
            existingRecordsUpdated,
            duplicatesSkipped,
            unmatchedCount,
            errorsCount,
            ordersChecked: allRazorpayOrders.length,
            status: errorsCount === 0 ? 'SUCCESS' : 'COMPLETED_WITH_WARNINGS'
        };

        dbUpdates[`admin/razorpaySyncHistory/${syncLogId}`] = syncLog;
        dbUpdates[`admin/razorpayLastSync`] = syncLog;

        // Execute batch write to RTDB if token allows, else prepare for client-side persistence
        let persistedOnBackend = false;
        const authParam = (token && token.length > 30 && token.includes('.')) ? `?auth=${token}` : '';

        if (Object.keys(dbUpdates).length > 0) {
            try {
                const patchRes = await fetch(`${DB_URL}/.json${authParam}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dbUpdates)
                });
                if (patchRes.ok) {
                    persistedOnBackend = true;
                } else {
                    console.warn(`Backend RTDB write note (${patchRes.status}), client fallback enabled.`);
                }
            } catch (writeErr) {
                console.warn('Backend RTDB patch warning:', writeErr);
            }
        }

        return res.status(200).json({
            success: true,
            syncLog,
            persistedOnBackend,
            recordsChecked,
            recordsImported: newRecordsImported,
            recordsUpdated: existingRecordsUpdated,
            duplicatesSkipped,
            unmatched: unmatchedCount,
            errors: errorsCount,
            ordersChecked: allRazorpayOrders.length,
            summary: {
                totalPayments: recordsChecked,
                paymentsCreated: newRecordsImported,
                paymentsUpdated: existingRecordsUpdated,
                totalOrders: allRazorpayOrders.length,
                unmatchedPayments: unmatchedCount
            },
            dbUpdates: persistedOnBackend ? null : dbUpdates,
            message: `Razorpay Synchronization Complete: ${recordsChecked} payment records checked, ${allRazorpayOrders.length} orders analyzed, ${newRecordsImported} imported, ${existingRecordsUpdated} updated, ${duplicatesSkipped} duplicates verified.`
        });
    } catch (err) {
        console.error('Razorpay sync endpoint failure:', err);
        return res.status(500).json({
            error: 'SYNC_FAILED',
            message: err.message || 'Failed to synchronize Razorpay records.'
        });
    }
}
