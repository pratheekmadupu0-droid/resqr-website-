/**
 * RESQR Subscription & Renewal Configuration
 * Central source of truth for subscription plans, pricing, durations, and status calculations.
 */

export const SUBSCRIPTION_PLANS = {
    // Initial Registration Plan
    initial_3m: {
        id: 'initial_3m',
        name: 'RESQR Registration + 2 QR Stickers',
        shortName: '3 Months (Initial)',
        type: 'registration',
        amount: 149,
        durationMonths: 3,
        description: 'Includes account registration, 3-angle face enrollment, emergency profile, 2 reflective QR stickers, and 3 months of active RESQR emergency protection.',
        stickersIncluded: 2,
        popular: false,
        badge: 'NEW REGISTRATION'
    },
    // Renewal / Upgrade Plans
    renewal_3m: {
        id: 'renewal_3m',
        name: '3 Months Renewal',
        shortName: '3 Months',
        type: 'renewal',
        amount: 299,
        durationMonths: 3,
        description: 'Valid for 3 months',
        popular: false
    },
    renewal_6m: {
        id: 'renewal_6m',
        name: '6 Months Renewal',
        shortName: '6 Months',
        type: 'renewal',
        amount: 599,
        durationMonths: 6,
        description: 'Valid for 6 months',
        popular: false
    },
    renewal_12m: {
        id: 'renewal_12m',
        name: '12 Months Renewal',
        shortName: '12 Months',
        type: 'renewal',
        amount: 1199,
        durationMonths: 12,
        description: 'Valid for 12 months',
        popular: true,
        badge: 'MOST POPULAR'
    },
    renewal_18m: {
        id: 'renewal_18m',
        name: '18 Months Renewal',
        shortName: '18 Months',
        type: 'renewal',
        amount: 1799,
        durationMonths: 18,
        description: 'Valid for 18 months',
        popular: false
    },
    renewal_24m: {
        id: 'renewal_24m',
        name: '24 Months Renewal',
        shortName: '24 Months',
        type: 'renewal',
        amount: 2399,
        durationMonths: 24,
        description: 'Valid for 24 months',
        popular: false
    }
};

export const RENEWAL_PLAN_LIST = [
    { ...SUBSCRIPTION_PLANS.renewal_3m, pricePerMonth: 100, isPopular: false },
    { ...SUBSCRIPTION_PLANS.renewal_6m, pricePerMonth: 100, isPopular: false },
    { ...SUBSCRIPTION_PLANS.renewal_12m, pricePerMonth: 100, isPopular: true },
    { ...SUBSCRIPTION_PLANS.renewal_18m, pricePerMonth: 100, isPopular: false },
    { ...SUBSCRIPTION_PLANS.renewal_24m, pricePerMonth: 100, isPopular: false }
];

export const RENEWAL_PLANS = RENEWAL_PLAN_LIST;

/**
 * Add specified months to a date.
 */
export function addMonthsToDate(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) {
        d.setDate(0);
    }
    return d;
}

/**
 * Calculates new expiry date for a subscription.
 * RULE:
 * - If renewed before expiry (existingExpiry > now):
 *   NEW EXPIRY = EXISTING EXPIRY + PLAN DURATION
 * - If renewed after expiry (existingExpiry <= now) or new registration:
 *   NEW EXPIRY = PAYMENT/ACTIVATION DATE + PLAN DURATION
 * 
 * Never removes user's unused validity!
 */
export function calculateNewExpiry(existingExpiry, durationMonths, baseDate = new Date()) {
    const now = new Date(baseDate);
    const existing = existingExpiry ? new Date(existingExpiry) : null;

    if (existing && !isNaN(existing.getTime()) && existing.getTime() > now.getTime()) {
        // Renewed before expiry — extend from existing expiry date
        return addMonthsToDate(existing, durationMonths).toISOString();
    } else {
        // Renewed after expiry or initial purchase — start from now
        return addMonthsToDate(now, durationMonths).toISOString();
    }
}

/**
 * Computes the dynamic status of a subscription from backend timestamp source of truth.
 * Statuses: ACTIVE | EXPIRING_SOON | EXPIRED | SUSPENDED | REVOKED
 */
export function calculateSubscriptionStatus(subscription, now = new Date()) {
    if (!subscription) {
        return {
            status: 'EXPIRED',
            daysRemaining: 0,
            isExpired: true,
            isExpiringSoon: false,
            isActive: false,
            isSuspended: false,
            isRevoked: false,
            formattedExpiry: 'No Active Subscription',
            badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            dotClass: 'bg-rose-500'
        };
    }

    if (subscription.status === 'SUSPENDED') {
        return {
            status: 'SUSPENDED',
            daysRemaining: 0,
            isExpired: false,
            isExpiringSoon: false,
            isActive: false,
            isSuspended: true,
            isRevoked: false,
            formattedExpiry: subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Suspended',
            badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            dotClass: 'bg-amber-400'
        };
    }

    if (subscription.status === 'REVOKED') {
        return {
            status: 'REVOKED',
            daysRemaining: 0,
            isExpired: false,
            isExpiringSoon: false,
            isActive: false,
            isSuspended: false,
            isRevoked: true,
            formattedExpiry: 'Revoked by Administrator',
            badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
            dotClass: 'bg-red-500'
        };
    }

    const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
    if (!expiresAt || isNaN(expiresAt.getTime())) {
        return {
            status: 'EXPIRED',
            daysRemaining: 0,
            isExpired: true,
            isExpiringSoon: false,
            isActive: false,
            isSuspended: false,
            isRevoked: false,
            formattedExpiry: 'Expired',
            badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            dotClass: 'bg-rose-500'
        };
    }

    const nowDate = new Date(now);
    const diffMs = expiresAt.getTime() - nowDate.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const formattedExpiry = expiresAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    if (diffMs <= 0) {
        return {
            status: 'EXPIRED',
            daysRemaining: 0,
            isExpired: true,
            isExpiringSoon: false,
            isActive: false,
            isSuspended: false,
            isRevoked: false,
            formattedExpiry,
            badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            dotClass: 'bg-rose-500'
        };
    } else if (daysRemaining <= 30) {
        return {
            status: 'EXPIRING_SOON',
            daysRemaining,
            isExpired: false,
            isExpiringSoon: true,
            isActive: true,
            isSuspended: false,
            isRevoked: false,
            formattedExpiry,
            badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
            dotClass: 'bg-amber-400 ring-2 ring-amber-400/30'
        };
    } else {
        return {
            status: 'ACTIVE',
            daysRemaining,
            isExpired: false,
            isExpiringSoon: false,
            isActive: true,
            isSuspended: false,
            isRevoked: false,
            formattedExpiry,
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            dotClass: 'bg-emerald-400 ring-2 ring-emerald-400/30'
        };
    }
}

/**
 * Notification thresholds in days before expiry
 */
export const REMINDER_THRESHOLDS_DAYS = [30, 15, 7, 3, 1];

/**
 * User & Service Lifecycle Status Models (Section 2)
 */
export const REGISTRATION_STATUS = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    PAYMENT_PENDING: 'PAYMENT_PENDING',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    COMPLETED: 'COMPLETED'
};

export const PAYMENT_STATUS = {
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
    EXPIRED: 'EXPIRED'
};

export const SERVICE_STATUS = {
    NOT_ACTIVE: 'NOT_ACTIVE',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    SUSPENDED: 'SUSPENDED',
    REVOKED: 'REVOKED'
};

export const EMERGENCY_PROFILE_STATUS = {
    NOT_CREATED: 'NOT_CREATED',
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    EXPIRED: 'EXPIRED',
    SUSPENDED: 'SUSPENDED',
    REVOKED: 'REVOKED'
};

export const QR_STATUS = {
    NOT_ACTIVE: 'NOT_ACTIVE',
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    SUSPENDED: 'SUSPENDED',
    REVOKED: 'REVOKED'
};

export const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in',
    'siconentp@gmail.com',
    'siconenterprises@gmail.com'
];

/**
 * Evaluates the full unified lifecycle state for a user/profile
 */
export function evaluateUserStatus(user = {}, profile = {}, subscription = null) {
    const u = user || {};
    const p = profile || {};
    const s = subscription || u.subscription || p.subscription || null;

    const email = (u.email || p.email || s?.email || '').toLowerCase().trim();
    const isAdminAccount = Boolean(
        (email && ADMIN_EMAILS.includes(email)) ||
        u.role === 'admin' ||
        (u.role === 'agent' && u.status === 'approved') ||
        (p && (p.id === 'jwala-shyam' || p.id === 'shyam-madupu'))
    );

    // Check expiration against current time
    const expiry = u.serviceExpiryDate || p.serviceExpiryDate || p.subscriptionExpiresAt || s?.expiresAt || (isAdminAccount ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null);
    const isExpired = !isAdminAccount && expiry && !isNaN(new Date(expiry).getTime()) && new Date(expiry).getTime() <= Date.now();

    // 1. Payment status evaluation
    let paymentStatus = u.paymentStatus || p.paymentStatus || (
        isAdminAccount || u.payment_status === 'paid' || p.payment_status === 'paid' || s?.paymentStatus === 'paid' || s?.payment_status === 'paid' || (s?.status === 'ACTIVE' && !isExpired)
            ? 'SUCCESS' 
            : 'PENDING'
    );
    if (isAdminAccount || paymentStatus === 'PAID' || paymentStatus === 'SUCCESSFUL') paymentStatus = 'SUCCESS';

    // 2. Registration status evaluation
    let registrationStatus = u.registrationStatus || p.registrationStatus;
    if (isAdminAccount) {
        registrationStatus = 'COMPLETED';
    } else if (!registrationStatus) {
        if (paymentStatus === 'SUCCESS' && (u.profileCompleted || p.name || p.id)) {
            registrationStatus = 'COMPLETED';
        } else if (u.profileCompleted || p.name) {
            registrationStatus = 'PAYMENT_PENDING';
        } else if (u.phone || u.name) {
            registrationStatus = 'IN_PROGRESS';
        } else {
            registrationStatus = 'NOT_STARTED';
        }
    }

    // 3. Service status evaluation
    let serviceStatus = u.serviceStatus || p.serviceStatus;
    if (isAdminAccount) {
        serviceStatus = 'ACTIVE';
    } else if (!serviceStatus) {
        if (isExpired) {
            serviceStatus = 'EXPIRED';
        } else if (s?.status === 'SUSPENDED' || u.status === 'suspended') {
            serviceStatus = 'SUSPENDED';
        } else if (s?.status === 'REVOKED' || u.status === 'revoked') {
            serviceStatus = 'REVOKED';
        } else if (paymentStatus === 'SUCCESS' && registrationStatus === 'COMPLETED') {
            serviceStatus = 'ACTIVE';
        } else {
            serviceStatus = 'NOT_ACTIVE';
        }
    } else if (isExpired && serviceStatus === 'ACTIVE') {
        serviceStatus = 'EXPIRED';
    }

    // 4. Emergency profile status evaluation
    let emergencyProfileStatus = u.emergencyProfileStatus || p.emergencyProfileStatus;
    if (isAdminAccount) {
        emergencyProfileStatus = 'ACTIVE';
    } else if (!emergencyProfileStatus) {
        if (isExpired) {
            emergencyProfileStatus = 'EXPIRED';
        } else if (serviceStatus === 'ACTIVE' && paymentStatus === 'SUCCESS' && registrationStatus === 'COMPLETED') {
            emergencyProfileStatus = 'ACTIVE';
        } else if (serviceStatus === 'SUSPENDED') {
            emergencyProfileStatus = 'SUSPENDED';
        } else if (serviceStatus === 'REVOKED') {
            emergencyProfileStatus = 'REVOKED';
        } else {
            emergencyProfileStatus = 'NOT_CREATED';
        }
    } else if (isExpired && emergencyProfileStatus === 'ACTIVE') {
        emergencyProfileStatus = 'EXPIRED';
    }

    // 5. QR status evaluation
    let qrStatus = u.qrStatus || p.qrStatus;
    if (isAdminAccount) {
        qrStatus = 'ACTIVE';
    } else if (!qrStatus) {
        if (isExpired) {
            qrStatus = 'EXPIRED';
        } else if (serviceStatus === 'ACTIVE' && paymentStatus === 'SUCCESS') {
            qrStatus = 'ACTIVE';
        } else {
            qrStatus = 'NOT_ACTIVE';
        }
    } else if (isExpired && qrStatus === 'ACTIVE') {
        qrStatus = 'EXPIRED';
    }

    // Exact activation condition (Section 3):
    // ALL 4 must be satisfied simultaneously
    const isActive = (
        registrationStatus === 'COMPLETED' &&
        paymentStatus === 'SUCCESS' &&
        serviceStatus === 'ACTIVE' &&
        emergencyProfileStatus === 'ACTIVE'
    );

    return {
        registrationStatus,
        paymentStatus,
        serviceStatus,
        emergencyProfileStatus,
        qrStatus,
        isActive,
        isExpired: Boolean(isExpired),
        serviceExpiryDate: expiry,
        amountPaid: u.amountPaid || p.amountPaid || s?.amount || (paymentStatus === 'SUCCESS' ? 149 : 0),
        planId: u.planId || p.planId || s?.planId || 'initial_3m',
        paymentId: u.paymentId || p.paymentId || s?.paymentId || null
    };
}

/**
 * Exact activation condition (Section 3)
 * Emergency Profile is ACTIVE ONLY when:
 * registrationStatus == "COMPLETED"
 * && paymentStatus == "SUCCESS"
 * && serviceStatus == "ACTIVE"
 * && emergencyProfileStatus == "ACTIVE"
 */
export function isEmergencyProfileActive(user, subscription = null) {
    const status = evaluateUserStatus(user, null, subscription);
    return status.isActive;
}

/**
 * Status Badge Helpers for Admin Panel UI
 */
export function getRegistrationStatusBadge(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'COMPLETED':
            return { label: 'COMPLETED', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
        case 'PAYMENT_PENDING':
            return { label: 'PAYMENT PENDING', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
        case 'PAYMENT_FAILED':
            return { label: 'PAYMENT FAILED', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
        case 'IN_PROGRESS':
            return { label: 'IN PROGRESS', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
        case 'NOT_STARTED':
        default:
            return { label: 'NOT STARTED', className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
    }
}

export function getServiceStatusBadge(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'ACTIVE':
            return { label: 'ACTIVE', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
        case 'EXPIRED':
            return { label: 'EXPIRED', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
        case 'SUSPENDED':
            return { label: 'SUSPENDED', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
        case 'REVOKED':
            return { label: 'REVOKED', className: 'bg-red-500/10 text-red-500 border border-red-500/20' };
        case 'NOT_ACTIVE':
        default:
            return { label: 'NOT ACTIVE', className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' };
    }
}

export function getEmergencyProfileStatusBadge(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'ACTIVE':
            return { label: 'ACTIVE', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
        case 'EXPIRED':
            return { label: 'EXPIRED', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
        case 'INACTIVE':
            return { label: 'INACTIVE', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
        case 'SUSPENDED':
        case 'REVOKED':
            return { label: s, className: 'bg-red-500/10 text-red-500 border border-red-500/20' };
        case 'NOT_CREATED':
        default:
            return { label: 'NOT CREATED', className: 'bg-slate-500/10 text-slate-500 border border-slate-500/20' };
    }
}

export function getQrStatusBadge(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'ACTIVE':
            return { label: 'ACTIVE', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
        case 'EXPIRED':
            return { label: 'EXPIRED', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
        case 'SUSPENDED':
        case 'REVOKED':
            return { label: s, className: 'bg-red-500/10 text-red-500 border border-red-500/20' };
        case 'NOT_ACTIVE':
        default:
            return { label: 'NOT ACTIVE', className: 'bg-slate-500/10 text-slate-500 border border-slate-500/20' };
    }
}

/**
 * Helper to get status badge styling for payments
 */
export function getPaymentStatusBadge(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'SUCCESS':
        case 'PAID':
        case 'SUCCESSFUL':
            return {
                label: 'SUCCESS',
                className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                dotClass: 'bg-emerald-400'
            };
        case 'PENDING':
        case 'PROCESSING':
            return {
                label: s || 'PENDING',
                className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                dotClass: 'bg-amber-400'
            };
        case 'FAILED':
            return {
                label: 'FAILED',
                className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                dotClass: 'bg-rose-400'
            };
        case 'CANCELLED':
            return {
                label: 'CANCELLED',
                className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
                dotClass: 'bg-slate-400'
            };
        case 'REFUNDED':
        case 'PARTIALLY_REFUNDED':
            return {
                label: s.replace('_', ' '),
                className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
                dotClass: 'bg-purple-400'
            };
        default:
            return {
                label: s || 'UNKNOWN',
                className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
                dotClass: 'bg-slate-400'
            };
    }
}

