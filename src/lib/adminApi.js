import { auth, db } from './firebase';
import { ref, get, push, set, serverTimestamp } from 'firebase/database';

export const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in'
];

/**
 * Check if the given user or current authenticated user is an authorized admin
 */
export async function verifyAdminStatus(user = auth.currentUser) {
    if (!user) return false;
    const email = (user.email || '').toLowerCase();
    if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email)) {
        return true;
    }
    try {
        const uid = user.uid;
        const roleSnap = await get(ref(db, `users/${uid}/role`));
        if (roleSnap.exists() && roleSnap.val() === 'admin') {
            return true;
        }
        const adminSnap = await get(ref(db, `admins/${uid}`));
        if (adminSnap.exists()) {
            return true;
        }
    } catch (e) {
        console.warn("Client admin role verification check:", e);
    }
    return false;
}

/**
 * Fetch a user's Emergency Profile with ADMIN authorization.
 * NO facial verification, NO camera, NO biometric prompts.
 * Strictly requests sanitized emergency profile from backend API or authenticated RTDB.
 */
export async function fetchAdminEmergencyProfile(userId) {
    if (!userId) {
        throw new Error("Target user ID required.");
    }

    const currentUser = auth.currentUser;
    const isAdmin = await verifyAdminStatus(currentUser);
    if (!isAdmin) {
        const err = new Error("Access Denied. You do not possess administrative privileges.");
        err.code = "FORBIDDEN_NOT_ADMIN";
        throw err;
    }

    // 1. Try secure backend API endpoint
    try {
        const token = currentUser ? await currentUser.getIdToken() : (localStorage.getItem('resqr_active_role') === 'admin' ? currentUser?.email : null);
        const headers = { 'Accept': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/emergency-profile`, {
            method: 'GET',
            headers
        });

        if (res.ok) {
            const data = await res.json();
            if (data.emergencyProfile) {
                return data.emergencyProfile;
            }
        }
        // If 403, handle authorization and service inactivity
        if (res.status === 403) {
            const errData = await res.json().catch(() => ({}));
            const err = new Error(errData.error || "403 Forbidden: Administrator role verification failed.");
            err.code = errData.code || "FORBIDDEN_NOT_ADMIN";
            err.lifecycle = errData.lifecycle || null;
            throw err;
        }
    } catch (apiErr) {
        if (apiErr.code === "FORBIDDEN_NOT_ADMIN" || apiErr.code === "EMERGENCY_PROFILE_INACTIVE") {
            throw apiErr;
        }
        console.warn("Backend API route unreachable, using authenticated client fallback:", apiErr);
    }

    // 2. Direct Authenticated Fallback (Guaranteed to work in serverless/offline environments)
    try {
        let userSnap = await get(ref(db, `users/${userId}`));
        let profileSnap = await get(ref(db, `profiles/${userId}`));
        let rawUser = userSnap.exists() ? userSnap.val() : null;
        let rawProfile = profileSnap.exists() ? profileSnap.val() : null;

        // If not found, try username lookup
        if (!rawUser && !rawProfile) {
            const userRegSnap = await get(ref(db, `usernames/${userId.toLowerCase()}`));
            if (userRegSnap.exists()) {
                const regPath = userRegSnap.val();
                const resolvedSnap = await get(ref(db, regPath.startsWith('/') ? regPath.substring(1) : regPath));
                if (resolvedSnap.exists()) {
                    rawProfile = resolvedSnap.val();
                }
            }
        }

        // If user has sub-profile
        if (rawUser && !rawProfile && rawUser.profiles) {
            const pKeys = Object.keys(rawUser.profiles);
            if (pKeys.length > 0) {
                rawProfile = rawUser.profiles[userId] || rawUser.profiles[pKeys[0]];
            }
        }

        if (!rawUser && !rawProfile) {
            const err = new Error("Requested citizen profile could not be found.");
            err.code = "NOT_FOUND";
            throw err;
        }

        const raw = rawProfile || rawUser;
        const medical = raw.medical || rawProfile?.medical || rawUser?.medical || {};

        // Fetch subscription if available
        let subscription = null;
        try {
            const subSnap = await get(ref(db, `subscriptions/${userId}`));
            if (subSnap.exists()) {
                subscription = subSnap.val();
            } else if (rawUser?.id) {
                const uSubSnap = await get(ref(db, `users/${rawUser.id}/subscription`));
                if (uSubSnap.exists()) subscription = uSubSnap.val();
            }
        } catch (e) {}

        // EXACT ACTIVATION CONDITION CHECK (Section 3 & 12)
        const expiry = rawUser?.serviceExpiryDate || rawProfile?.serviceExpiryDate || rawProfile?.subscriptionExpiresAt || subscription?.expiresAt || null;
        const isExpired = expiry && !isNaN(new Date(expiry).getTime()) && new Date(expiry).getTime() <= Date.now();

        let paymentStatus = rawUser?.paymentStatus || rawProfile?.paymentStatus || (rawProfile?.payment_status === 'paid' ? 'SUCCESS' : (subscription?.paymentStatus === 'paid' ? 'SUCCESS' : 'PENDING'));
        if (paymentStatus === 'PAID' || paymentStatus === 'SUCCESSFUL') paymentStatus = 'SUCCESS';

        let registrationStatus = rawUser?.registrationStatus || rawProfile?.registrationStatus;
        if (!registrationStatus) {
            if (paymentStatus === 'SUCCESS' && (rawUser?.profileCompleted || rawProfile?.name)) {
                registrationStatus = 'COMPLETED';
            } else if (rawUser?.profileCompleted || rawProfile?.name) {
                registrationStatus = 'PAYMENT_PENDING';
            } else {
                registrationStatus = 'IN_PROGRESS';
            }
        }

        let serviceStatus = rawUser?.serviceStatus || rawProfile?.serviceStatus;
        if (!serviceStatus) {
            if (isExpired) {
                serviceStatus = 'EXPIRED';
            } else if (paymentStatus === 'SUCCESS' && registrationStatus === 'COMPLETED') {
                serviceStatus = 'ACTIVE';
            } else {
                serviceStatus = 'NOT_ACTIVE';
            }
        } else if (isExpired && serviceStatus === 'ACTIVE') {
            serviceStatus = 'EXPIRED';
        }

        let emergencyProfileStatus = rawUser?.emergencyProfileStatus || rawProfile?.emergencyProfileStatus;
        if (!emergencyProfileStatus) {
            if (isExpired) {
                emergencyProfileStatus = 'EXPIRED';
            } else if (serviceStatus === 'ACTIVE' && paymentStatus === 'SUCCESS' && registrationStatus === 'COMPLETED') {
                emergencyProfileStatus = 'ACTIVE';
            } else {
                emergencyProfileStatus = 'NOT_CREATED';
            }
        } else if (isExpired && emergencyProfileStatus === 'ACTIVE') {
            emergencyProfileStatus = 'EXPIRED';
        }

        if (
            registrationStatus !== 'COMPLETED' ||
            paymentStatus !== 'SUCCESS' ||
            serviceStatus !== 'ACTIVE' ||
            emergencyProfileStatus !== 'ACTIVE'
        ) {
            const err = new Error("Emergency Profile is not active. Citizen must complete registration and verified payment.");
            err.code = "EMERGENCY_PROFILE_INACTIVE";
            err.lifecycle = { registrationStatus, paymentStatus, serviceStatus, emergencyProfileStatus };
            throw err;
        }

        // SANITIZED EMERGENCY PROFILE DATA ONLY
        // Biometrics, full medical history, insurance files, and passwords are never returned
        const sanitizedProfile = {
            userId: rawUser?.id || rawUser?.uid || userId,
            qrId: rawProfile?.id || rawUser?.qrId || userId,
            name: rawProfile?.name || rawUser?.name || rawUser?.fullName || 'Registered Citizen',
            photo: rawProfile?.photo || rawProfile?.photoUrl || rawUser?.photoURL || rawUser?.photo || null,
            bloodGroup: rawProfile?.bloodGroup || medical.bloodGroup || rawUser?.bloodGroup || 'Not Specified',
            gender: rawProfile?.gender || rawUser?.gender || 'Not Specified',
            age: rawProfile?.age || rawUser?.age || null,
            emergencyContact: {
                name: rawProfile?.emergencyContactName || rawProfile?.contacts?.[0]?.name || rawUser?.emergencyContact?.name || 'Designated Contact',
                phone: rawProfile?.emergencyContactPhone || rawProfile?.contacts?.[0]?.phone || rawUser?.emergencyContact?.phone || '',
                relation: rawProfile?.emergencyContactRelation || rawProfile?.contacts?.[0]?.relationship || rawUser?.emergencyContact?.relation || 'Authorized Contact'
            },
            secondaryContact: (rawProfile?.contacts?.[1] || rawUser?.secondaryContact) ? {
                name: rawProfile?.contacts?.[1]?.name || rawUser?.secondaryContact?.name || '',
                phone: rawProfile?.contacts?.[1]?.phone || rawUser?.secondaryContact?.phone || '',
                relation: rawProfile?.contacts?.[1]?.relationship || rawUser?.secondaryContact?.relation || ''
            } : null,
            criticalAlerts: rawProfile?.allergies || medical.allergies || rawUser?.allergies || 'No critical allergies or acute alerts recorded.',
            emergencyActions: [
                'SEND_LOCATION',
                'CALL_108',
                'CALL_100',
                'NEAREST_HOSPITAL'
            ],
            subscription: {
                status: subscription?.status || 'ACTIVE',
                planName: subscription?.planName || 'Standard Emergency Protection',
                expiresAt: subscription?.expiresAt || null
            },
            authorizedAccessLevel: 'ADMIN_EMERGENCY_ACCESS'
        };

        // Write Audit Log
        try {
            const auditEntry = {
                adminId: currentUser?.uid || 'admin_client',
                adminEmail: currentUser?.email || 'admin@resqr.co.in',
                targetUserId: userId,
                targetUserName: sanitizedProfile.name,
                profileType: "EMERGENCY_PROFILE",
                action: "VIEW",
                timestamp: new Date().toISOString(),
                result: "SUCCESS"
            };
            await push(ref(db, 'auditLogs/emergencyProfileViews'), auditEntry);
        } catch (auditErr) {
            console.warn("Audit log push error:", auditErr);
        }

        return sanitizedProfile;
    } catch (fallbackErr) {
        console.error("Direct fallback retrieval failed:", fallbackErr);
        throw fallbackErr;
    }
}
