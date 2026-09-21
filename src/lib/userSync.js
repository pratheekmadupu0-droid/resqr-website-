import { db } from './firebase';
import { ref, get, update } from 'firebase/database';

export const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in'
];

/**
 * Ensures user login and Firebase authentication details are synchronized in Firebase RTDB
 * so the Google Account, Google ID, and login timestamps are visible in the Admin Panel.
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

        // Extract Google provider info if present
        const googleProvider = (user.providerData || []).find(p => p.providerId === 'google.com');
        const googleId = googleProvider?.uid || extraData.googleId || existing.googleId || null;
        const googleEmail = googleProvider?.email || (user.email && user.email.includes('@gmail.com') ? user.email : (existing.googleEmail || null));
        const googleDisplayName = googleProvider?.displayName || null;
        const googlePhotoURL = googleProvider?.photoURL || null;

        const authProvider = googleProvider ? 'google.com' : (user.providerData?.[0]?.providerId || existing.authProvider || 'firebase');
        const userEmail = (user.email || googleEmail || existing.email || extraData.email || '').trim().toLowerCase();
        
        const isAdmin = (userEmail && ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail)) ||
                        existing.role === 'admin' ||
                        extraData.role === 'admin';

        const determinedRole = isAdmin ? 'admin' : (existing.role || extraData.role || 'citizen');
        const now = new Date().toISOString();

        const updatedData = {
            ...existing,
            uid: uid,
            name: user.displayName || googleDisplayName || existing.name || extraData.name || (userEmail ? userEmail.split('@')[0] : 'Member'),
            email: user.email || googleEmail || existing.email || extraData.email || '',
            photo: user.photoURL || googlePhotoURL || existing.photo || extraData.photo || '',
            phone: user.phoneNumber || existing.phone || extraData.phone || '',
            role: determinedRole,
            status: existing.status || (isAdmin ? 'approved' : (extraData.status || 'approved')),
            lastLogin: now,
            createdAt: existing.createdAt || extraData.createdAt || user.metadata?.creationTime || now,
            authProvider: authProvider,
            // Detailed Firebase Authentication & Google Account parameters
            googleId: googleId,
            googleEmail: googleEmail,
            googleDisplayName: googleDisplayName,
            isGoogleAuth: !!googleProvider || !!googleId || (userEmail.endsWith('@gmail.com')),
            emailVerified: typeof user.emailVerified === 'boolean' ? user.emailVerified : (existing.emailVerified ?? false),
            authCreationTime: user.metadata?.creationTime || existing.authCreationTime || now,
            authLastSignInTime: user.metadata?.lastSignInTime || existing.authLastSignInTime || now,
            providers: (user.providerData && user.providerData.length > 0)
                ? user.providerData.map(p => ({
                    providerId: p.providerId,
                    uid: p.uid,
                    email: p.email || '',
                    displayName: p.displayName || ''
                }))
                : (existing.providers || null)
        };

        // Merge any non-overriding extraData fields
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
