import { db, auth } from './firebase';
import { ref, push, get, set, serverTimestamp } from 'firebase/database';

/**
 * Logs a privacy, security, or emergency access event in RTDB.
 *
 * @param {Object} event
 * @param {string} event.userId Target or acting user ID
 * @param {string} event.action Action name (e.g., 'LOGIN', 'CONSENT_ACCEPTED', 'QR_SCANNED', 'DOCTOR_ACCESS_GRANTED', 'DATA_EXPORT_REQUESTED')
 * @param {string} [event.role] User role or 'public_bystander', 'doctor', 'admin'
 * @param {string} [event.resourceId] Affected resource (e.g. profile ID, subscription ID)
 * @param {Object} [event.details] Non-sensitive metadata describing the event
 * @param {boolean} [event.success=true]
 */
export async function logPrivacyAudit({
    userId,
    action,
    role = 'citizen',
    resourceId = null,
    details = {},
    success = true
}) {
    if (!userId && !auth.currentUser?.uid) return;
    const targetUid = userId || auth.currentUser?.uid;
    const now = new Date();
    const nowIso = now.toISOString();

    const auditEntry = {
        action,
        role,
        resourceId,
        details: typeof details === 'object' ? details : { raw: String(details) },
        success,
        timestamp: nowIso,
        epoch: now.getTime(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        ipEstimated: 'Client Verified Session'
    };

    try {
        // 1. Log under user's private audit timeline
        const userLogRef = ref(db, `users/${targetUid}/privacyAuditLogs`);
        await push(userLogRef, auditEntry);

        // 2. Also log under centralized admin security audit queue if sensitive
        const sensitiveActions = [
            'CONSENT_WITHDRAWN',
            'DOCTOR_ACCESS_GRANTED',
            'ACCOUNT_DELETION_REQUESTED',
            'DATA_EXPORT_REQUESTED',
            'ADMIN_OVERRIDE'
        ];
        if (sensitiveActions.includes(action)) {
            const globalRef = ref(db, `privacySecurityAudits`);
            await push(globalRef, { ...auditEntry, userId: targetUid });
        }
    } catch (err) {
        console.warn("Privacy audit log skipped or failed:", err);
    }
}

/**
 * Fetches user's privacy and security access logs.
 */
export async function getUserPrivacyAuditLogs(userId) {
    if (!userId) return [];
    try {
        const snap = await get(ref(db, `users/${userId}/privacyAuditLogs`));
        if (!snap.exists()) return [];
        const data = snap.val();
        return Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (b.epoch || 0) - (a.epoch || 0));
    } catch (err) {
        console.error("Failed to load user privacy audit logs:", err);
        return [];
    }
}

/**
 * Submits a Data Rights Request (View Data, Correct Data, Delete Data).
 */
export async function submitDataRightsRequest({
    userId,
    requestType, // 'ACCESS' | 'CORRECTION' | 'DELETION' | 'WITHDRAW_CONSENT'
    description = '',
    contactEmail = ''
}) {
    const targetUid = userId || auth.currentUser?.uid;
    if (!targetUid) throw new Error("Authentication required.");

    const now = new Date();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const record = {
        id: requestId,
        userId: targetUid,
        requestType,
        description,
        contactEmail: contactEmail || auth.currentUser?.email || '',
        status: 'SUBMITTED', // 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        resolutionNotes: 'Under review by RESQR Data Protection Team.'
    };

    // Store in user requests and global requests
    await set(ref(db, `users/${targetUid}/dataRightsRequests/${requestId}`), record);
    await set(ref(db, `dataRightsRequests/${requestId}`), record);

    // Audit log
    await logPrivacyAudit({
        userId: targetUid,
        action: `DATA_RIGHTS_${requestType}_REQUESTED`,
        details: { requestId, requestType }
    });

    return record;
}

/**
 * Fetches existing data rights requests for a user.
 */
export async function getUserDataRightsRequests(userId) {
    if (!userId) return [];
    try {
        const snap = await get(ref(db, `users/${userId}/dataRightsRequests`));
        if (!snap.exists()) return [];
        return Object.values(snap.val()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
        console.error("Failed to fetch data rights requests:", err);
        return [];
    }
}
