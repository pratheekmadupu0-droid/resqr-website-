/**
 * RESQR Authoritative Registration State Machine
 * Manages strictly ordered, sequential citizen registration:
 * Step 1: Face Registration
 * Step 2: Personal Details
 * Step 3: Medical Details
 * Step 4: Insurance Details
 * Step 5: QR / Plan Selection
 * Step 6: Razorpay Payment
 * Step 7: Registration Completed
 * Step 8: Service & QR Activated
 */

import { db } from './firebase';
import { ref, get, update, set } from 'firebase/database';

export const REGISTRATION_STEPS = {
    FACE: 1,
    PERSONAL: 2,
    MEDICAL: 3,
    INSURANCE: 4,
    PLAN: 5,
    PAYMENT: 6,
    COMPLETED: 7,
    ACTIVATED: 8
};

export const STEP_METADATA = [
    { number: 1, id: 'face', title: 'Face Registration', shortTitle: 'Face', desc: 'Neural facial biometric enrollment (3 angles)' },
    { number: 2, id: 'personal', title: 'Personal Details', shortTitle: 'Personal', desc: 'Identity, contacts & username' },
    { number: 3, id: 'medical', title: 'Medical Details', shortTitle: 'Medical', desc: 'Blood group, conditions & allergies' },
    { number: 4, id: 'insurance', title: 'Insurance Details', shortTitle: 'Insurance', desc: 'Policy & cashless coverage' },
    { number: 5, id: 'plan', title: 'QR / Plan Selection', shortTitle: 'QR & Plan', desc: '₹149 Digital QR or ₹199 QR + 3 Months' },
    { number: 6, id: 'payment', title: 'Razorpay Payment', shortTitle: 'Payment', desc: 'Secure Razorpay checkout & activation' },
    { number: 7, id: 'completed', title: 'Registration Completed', shortTitle: 'Completed', desc: 'Dossier generated' },
    { number: 8, id: 'activated', title: 'Service & QR Activated', shortTitle: 'Activated', desc: 'Live protection' }
];

const LOCAL_STORAGE_KEY_PREFIX = 'resqr_reg_state_';

/**
 * Checks if a target step can be accessed given the completed steps.
 * Step 1 is always accessible. Step N requires 1..(N-1) to all be completed.
 */
export function canAccessStep(targetStep, completedSteps = {}) {
    if (targetStep <= 1) return true;
    for (let s = 1; s < targetStep; s++) {
        if (!completedSteps[s]) return false;
    }
    return true;
}

/**
 * Determines the first incomplete step.
 */
export function getFirstIncompleteStep(completedSteps = {}) {
    for (let s = 1; s <= 6; s++) {
        if (!completedSteps[s]) return s;
    }
    return 6;
}

/**
 * Fetches the authoritative registration state from Firebase RTDB (with local fallback).
 */
export async function fetchAuthoritativeRegistrationState(uid) {
    if (!uid) {
        return {
            currentStep: 1,
            completedSteps: {},
            draft: {},
            isCompleted: false,
            status: 'UNAUTHENTICATED'
        };
    }

    try {
        const userSnap = await get(ref(db, `users/${uid}`));
        if (userSnap.exists()) {
            const data = userSnap.val() || {};
            const completedSteps = data.completedSteps || {};

            // Check if profile is already finalized
            if (data.profileCompleted || data.registrationStatus === 'COMPLETED' || data.serviceStatus === 'ACTIVE') {
                return {
                    currentStep: 7,
                    completedSteps: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
                    draft: data.draftProfile || {},
                    isCompleted: true,
                    status: 'COMPLETED',
                    profile: data
                };
            }

            // Derive completed steps if not explicitly set
            if (!completedSteps[1] && (data.faceEnrollmentStatus === 'completed' || data.biometricEnrolled)) {
                completedSteps[1] = true;
            }
            if (!completedSteps[2] && (data.name && data.phone && (data.username || data.chosenUsername))) {
                completedSteps[2] = true;
            }
            if (!completedSteps[3] && (data.bloodGroup || data.medical?.bloodGroup)) {
                completedSteps[3] = true;
            }
            if (!completedSteps[4] && (data.insurance || data.hasInsurance !== undefined)) {
                completedSteps[4] = true;
            }
            if (!completedSteps[5] && (data.selectedPackage || data.planId)) {
                completedSteps[5] = true;
            }
            if (!completedSteps[6] && (data.paymentStatus === 'SUCCESS' || data.payment_status === 'paid')) {
                completedSteps[6] = true;
            }

            const currentStep = getFirstIncompleteStep(completedSteps);

            return {
                currentStep,
                completedSteps,
                draft: data.draftProfile || {},
                isCompleted: false,
                status: data.registrationStatus || 'IN_PROGRESS',
                profile: data
            };
        }
    } catch (e) {
        console.warn("Could not fetch registration state from RTDB:", e);
    }

    // LocalStorage fallback
    try {
        const local = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`);
        if (local) {
            const parsed = JSON.parse(local);
            return parsed;
        }
    } catch (e) {}

    return {
        currentStep: 1,
        completedSteps: {},
        draft: {},
        isCompleted: false,
        status: 'NEW'
    };
}

/**
 * Commits a completed step to Firebase RTDB and updates the authoritative state machine.
 */
export async function commitStepProgress({ uid, stepNumber, stepData = {}, nextStepNumber = null }) {
    if (!uid) throw new Error("Cannot save step progress without authenticated UID.");

    const nowIso = new Date().toISOString();
    const targetNextStep = nextStepNumber || Math.min(stepNumber + 1, 7);

    const updates = {};
    updates[`users/${uid}/completedSteps/${stepNumber}`] = true;
    updates[`users/${uid}/currentRegistrationStep`] = targetNextStep;
    updates[`users/${uid}/registrationUpdatedAt`] = nowIso;
    updates[`users/${uid}/registrationStatus`] = `STEP_${stepNumber}_COMPLETED`;

    // Persist step-specific draft data
    if (stepNumber === 1) {
        // Face Registration
        updates[`users/${uid}/faceEnrollmentStatus`] = 'completed';
        updates[`users/${uid}/biometricEnrolled`] = true;
        if (stepData.biometricProfile) {
            updates[`users/${uid}/faceEnrollment`] = stepData.biometricProfile;
            updates[`users/${uid}/biometricProfiles/c_${uid}`] = stepData.biometricProfile;
            updates[`biometricProfiles/c_${uid}`] = stepData.biometricProfile;
            updates[`biometricProfiles/${uid}`] = stepData.biometricProfile;
        }
    } else if (stepNumber === 2) {
        // Personal Details
        updates[`users/${uid}/draftProfile/personal`] = stepData;
        if (stepData.name) updates[`users/${uid}/name`] = stepData.name;
        if (stepData.phone) updates[`users/${uid}/phone`] = stepData.phone;
        if (stepData.email) updates[`users/${uid}/email`] = stepData.email;
        if (stepData.username) {
            const cleanUser = stepData.username.toLowerCase();
            updates[`users/${uid}/chosenUsername`] = cleanUser;
            updates[`usernames/${cleanUser}`] = `users/${uid}/profiles/c_${uid}`;
            updates[`qrIdentities/${cleanUser}`] = `c_${uid}`;
        }
    } else if (stepNumber === 3) {
        // Medical Details
        updates[`users/${uid}/draftProfile/medical`] = stepData;
        if (stepData.bloodGroup) updates[`users/${uid}/bloodGroup`] = stepData.bloodGroup;
    } else if (stepNumber === 4) {
        // Insurance Details
        updates[`users/${uid}/draftProfile/insurance`] = stepData;
    } else if (stepNumber === 5) {
        // QR / Plan Selection
        updates[`users/${uid}/draftProfile/plan`] = stepData;
        updates[`users/${uid}/selectedPackage`] = stepData.package || 'stickers';
    }

    await update(ref(db), updates);

    // Save to local cache for instant recovery
    try {
        const localState = {
            uid,
            currentStep: targetNextStep,
            lastCompletedStep: stepNumber,
            updatedAt: nowIso
        };
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(localState));
    } catch (e) {}

    return { success: true, nextStep: targetNextStep };
}
