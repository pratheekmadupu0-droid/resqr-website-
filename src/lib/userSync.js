import { db } from './firebase';
import { ref, get, update } from 'firebase/database';

export const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in'
];

/**
 * Ensures user login is recorded and synchronized in Firebase Realtime Database
 * so they are immediately visible in the Admin Panel.
 *
 * @param {import('firebase/auth').User} user Firebase auth user object
 * @param {Object} extraData Additional attributes (e.g. role, name, status)
 * @returns {Promise<Object|null>} The synchronized user data
 */
export async function syncUserOnLogin(user, extraData = {}) {
    if (!user || !user.uid) return null;

    try {
        const uid = user.uid;
        const userRef = ref(db, `users/${uid}`);
        const userSnap = await get(userRef);
        const existing = userSnap.exists() ? userSnap.val() : {};

        const userEmail = (user.email || existing.email || extraData.email || '').trim().toLowerCase();
        
        const isAdmin = (userEmail && ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail)) ||
                        existing.role === 'admin' ||
                        extraData.role === 'admin';

        const determinedRole = isAdmin ? 'admin' : (existing.role || extraData.role || 'citizen');
        const now = new Date().toISOString();

        const updatedData = {
            ...existing,
            uid: uid,
            name: user.displayName || existing.name || extraData.name || (userEmail ? userEmail.split('@')[0] : 'Member'),
            email: user.email || existing.email || extraData.email || '',
            photo: user.photoURL || existing.photo || extraData.photo || '',
            phone: user.phoneNumber || existing.phone || extraData.phone || '',
            role: determinedRole,
            status: existing.status || (isAdmin ? 'approved' : (extraData.status || 'approved')),
            lastLogin: now,
            createdAt: existing.createdAt || extraData.createdAt || now,
            authProvider: user.providerData?.[0]?.providerId || existing.authProvider || 'firebase'
        };

        // Merge any non-overriding extraData fields (without clobbering essential auth fields)
        Object.entries(extraData).forEach(([key, val]) => {
            if (val !== undefined && val !== null && !['uid', 'lastLogin'].includes(key)) {
                updatedData[key] = val;
            }
        });

        // Ensure role and lastLogin remain consistent
        updatedData.role = determinedRole;
        updatedData.lastLogin = now;

        await update(userRef, updatedData);
        return updatedData;
    } catch (err) {
        console.error("Failed to sync user login to RTDB:", err);
        return null;
    }
}
