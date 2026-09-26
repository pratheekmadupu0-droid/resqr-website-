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
