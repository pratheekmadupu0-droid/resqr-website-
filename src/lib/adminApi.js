import { auth, db } from './firebase';
import { ref, get, push, set, serverTimestamp } from 'firebase/database';
import { evaluateUserStatus } from './subscriptionConfig';

export const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in',
    'siconentp@gmail.com',
    'siconenterprises@gmail.com'
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
        let rawUser = null;
        let rawProfile = null;

        if (!userId.includes('@')) {
            const userSnap = await get(ref(db, `users/${userId}`));
            const profileSnap = await get(ref(db, `profiles/${userId}`));
            rawUser = userSnap.exists() ? userSnap.val() : null;
            rawProfile = profileSnap.exists() ? profileSnap.val() : null;
        } else {
            const usersSnap = await get(ref(db, 'users'));
            if (usersSnap.exists()) {
                const allU = usersSnap.val();
                const uMatch = Object.entries(allU).find(([k, u]) => u && u.email && u.email.toLowerCase() === userId.toLowerCase());
                if (uMatch) {
                    rawUser = { id: uMatch[0], ...uMatch[1] };
                }
            }
            const profilesSnap = await get(ref(db, 'profiles'));
            if (profilesSnap.exists()) {
                const allP = profilesSnap.val();
                const pMatch = Object.entries(allP).find(([k, p]) => p && p.email && p.email.toLowerCase() === userId.toLowerCase());
                if (pMatch) {
                    rawProfile = { id: pMatch[0], ...pMatch[1] };
                }
            }
        }

        // If not found, try username lookup
        if (!rawUser && !rawProfile && !userId.includes('@')) {
            const userRegSnap = await get(ref(db, `usernames/${userId.toLowerCase()}`));
            if (userRegSnap.exists()) {
                const regPath = userRegSnap.val();
                const resolvedSnap = await get(ref(db, regPath.startsWith('/') ? regPath.substring(1) : regPath));
                if (resolvedSnap.exists()) {
                    rawProfile = resolvedSnap.val();
                }
            }
        }

        // If found user, resolve complete profile from qrId, profiles, or subprofiles
        if (rawUser && !rawProfile) {
            if (rawUser.qrId) {
                const qrSnap = await get(ref(db, `profiles/${rawUser.qrId}`));
                if (qrSnap.exists()) rawProfile = qrSnap.val();
            }
            if (!rawProfile) {
                const allProfSnap = await get(ref(db, 'profiles'));
                if (allProfSnap.exists()) {
                    const allP = allProfSnap.val();
                    const match = Object.entries(allP).find(([k, p]) => p && (
                        p.uid === userId || 
                        p.id === userId ||
                        (rawUser?.email && p.email && p.email.toLowerCase() === rawUser.email.toLowerCase()) ||
                        (rawUser?.name && p.name && p.name.toLowerCase() === rawUser.name.toLowerCase())
                    ));
                    if (match) rawProfile = match[1];
                }
            }
            if (!rawProfile && rawUser.profiles) {
                const pVals = Object.values(rawUser.profiles);
                const completeP = pVals.find(p => p && (p.bloodGroup || p.emergencyContactName || p.contacts || p.name));
                if (completeP) {
                    rawProfile = completeP;
                } else if (pVals.length > 0) {
                    rawProfile = rawUser.profiles[userId] || pVals[0];
                }
            }
        }

        // If found profile, resolve linked user
        if (!rawUser && rawProfile) {
            const possibleUid = rawProfile.uid || rawProfile.userId;
            if (possibleUid) {
                const uSnap = await get(ref(db, `users/${possibleUid}`));
                if (uSnap.exists()) rawUser = uSnap.val();
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
        const lifecycle = evaluateUserStatus(rawUser, rawProfile, subscription);

        if (!lifecycle.isActive) {
            const err = new Error("Emergency Profile is not active. Citizen must complete registration and verified payment.");
            err.code = "EMERGENCY_PROFILE_INACTIVE";
            err.lifecycle = lifecycle;
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
