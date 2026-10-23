/**
 * RESQR Privacy & Data Protection Configuration
 * --------------------------------------------
 * Centralized schema, data categories, consent definitions, retention policies,
 * and role-based access control rules designed in alignment with DPDP framework.
 */

export const PRIVACY_POLICY_VERSION = "v1.0";
export const PRIVACY_LAST_UPDATED = "October 2026";

/**
 * 9 Data Categories with plain-language purpose explanations & minimization rationale
 */
export const DATA_CATEGORIES = [
    {
        id: 'account',
        title: '1. Account Information',
        icon: 'User',
        fields: ['Full Name', 'Mobile Number', 'Email Address', 'Login Identifier / Username'],
        purpose: 'Used to create and manage your secure RESQR account, authenticate your sessions, and verify identity during emergency retrieval.',
        isOptional: false,
        retention: 'Retained for active account lifecycle + 180 days post-deactivation for statutory auditing.'
    },
    {
        id: 'profile',
        title: '2. Profile Information',
        icon: 'FileText',
        fields: ['Date of Birth / Age', 'Gender', 'Residential City / State / Pincode', 'Emergency Profile Photo'],
        purpose: 'Used by first responders and emergency dispatchers to visually identify the patient and ascertain demographic criteria (e.g. pediatric vs adult trauma care).',
        isOptional: false,
        retention: 'Retained while profile is active. Deleted upon verified profile removal.'
    },
    {
        id: 'emergency_contacts',
        title: '3. Emergency Contact Information',
        icon: 'PhoneCall',
        fields: ['Family Member Name', 'Relationship', 'Primary Phone Number', 'Notification Preferences'],
        purpose: 'Used to alert and connect designated family members or guardians immediately when an emergency QR scan or SOS dispatch is triggered.',
        isOptional: false,
        retention: 'Retained while account is active. Updatable or replaceable at any time by user.'
    },
    {
        id: 'medical',
        title: '4. Medical & Health Information',
        icon: 'HeartPulse',
        fields: ['Blood Group', 'Severe Allergies', 'Chronic Conditions', 'Current Medications', 'Previous Surgeries', 'Organ Donor Status', 'Emergency Clinical Notes'],
        purpose: 'Used exclusively to provide authorized emergency physicians, paramedics, and hospitals with critical clinical data needed to prevent adverse drug reactions and administer prompt treatment.',
        isOptional: true,
        retention: 'User-managed. Only disclosed to verified clinical personnel or per user emergency sharing settings.'
    },
    {
        id: 'insurance',
        title: '5. Insurance & TPA Information',
        icon: 'Shield',
        fields: ['Insurance Provider Name', 'Policy Number', 'Sum Insured / Coverage Amount', 'TPA / Agent Contact Details', 'Cashless Eligibility'],
        purpose: 'Used to expedite cashless hospital admission, verify emergency health insurance coverage, and facilitate timely TPA coordination during medical emergencies.',
        isOptional: true,
        retention: 'Retained until updated or cleared by user. Protected behind clinical/hospital authorization.'
    },
    {
        id: 'qr_identity',
        title: '6. QR Identity & Physical Tag Data',
        icon: 'QrCode',
        fields: ['Secure RESQR Identifier Token', 'QR Activation Status', 'Physical Sticker Allocation', 'Scan Verification Timestamps'],
        purpose: 'A randomized cryptographic token pointing to the RESQR backend gateway. The QR itself never contains raw medical or personal text.',
        isOptional: false,
        retention: 'Preserved across renewals to ensure physical reflective stickers work continuously without reprinting.'
    },
    {
        id: 'technical',
        title: '7. Technical & Security Information',
        icon: 'Lock',
        fields: ['Device Browser User-Agent', 'IP / Security Metadata (where operationally needed)', 'Authentication & Token Refresh Logs', 'Rate-Limiting telemetry'],
        purpose: 'Used strictly for session authentication, fraud prevention, brute-force mitigation, and ensuring platform reliability.',
        isOptional: false,
        retention: 'Security logs retained for 90 days for forensic monitoring and anti-abuse protection.'
    },
    {
        id: 'location',
        title: '8. Location Information',
        icon: 'MapPin',
        fields: ['GPS Latitude / Longitude (at the moment of emergency scan or SOS activation)'],
        purpose: 'Only collected when an emergency scan occurs or when the user explicitly triggers emergency dispatch to send live GPS coordinates to designated family contacts and ambulances.',
        isOptional: true,
        retention: 'Ephemeral emergency scan log. Never tracks continuous background location.'
    },
    {
        id: 'biometric',
        title: '9. Facial Biometric & Neural Template Information',
        icon: 'Camera',
        fields: ['128-dimensional Mathematical Feature Embeddings (Derived vectors)', '3-Angle Reference Capture (Front, Left, Right)'],
        purpose: 'Used for hospital bedside 1:1 face matching when an unconscious patient arrives without physical QR tags. Raw biometrics are transformed into mathematical neural embeddings; matching is computed securely on verified devices.',
        isOptional: false,
        retention: 'Mathematical neural templates are retained only for active biometric matching and can be re-enrolled or deleted by the user in Privacy Settings.'
    }
];

/**
 * Granular Consent Schema
 */
export const CONSENT_DEFINITIONS = {
    required: {
        id: 'requiredAccountProcessing',
        title: 'Account & Emergency Service Processing (Required)',
        description: 'Processing necessary to create your account, generate your secure emergency QR token, maintain your medical emergency vault, and enable emergency contact dispatch when your QR is scanned.',
        required: true,
        default: true
    },
    optionalLocation: {
        id: 'optionalLocation',
        title: 'Emergency GPS Location Sharing (Optional)',
        description: 'Allows responders and emergency scanners to capture and transmit live GPS coordinates to your family when scanning your tag in an emergency.',
        required: false,
        default: false
    },
    optionalMarketing: {
        id: 'optionalMarketing',
        title: 'Product Updates & Safety Alerts (Optional)',
        description: 'Receive helpful emergency safety tips, product updates, and platform feature notifications via email or WhatsApp.',
        required: false,
        default: false
    },
    optionalFeatures: {
        id: 'optionalFeatures',
        title: 'Beta Safety Features & Integrations (Optional)',
        description: 'Participate in optional advanced hospital network integrations and experimental community first-responder alerts.',
        required: false,
        default: false
    }
};

/**
 * Configurable Data Retention Policies
 */
export const DATA_RETENTION_POLICIES = {
    accountData: {
        category: 'User Account Profile',
        retentionPeriod: 'Active Account Lifetime',
        archivalPeriod: '180 days post-deletion request (statutory audit buffer)',
        configurable: true
    },
    emergencyContacts: {
        category: 'Emergency Contacts',
        retentionPeriod: 'Active Account Lifetime',
        archivalPeriod: 'Immediate purge on user removal or account deletion',
        configurable: true
    },
    medicalData: {
        category: 'Medical & Health Vault',
        retentionPeriod: 'Active Account Lifetime',
        archivalPeriod: 'Purged immediately upon account deletion or user reset',
        configurable: true
    },
    insuranceData: {
        category: 'Insurance Information',
        retentionPeriod: 'Active Account Lifetime',
        archivalPeriod: 'Purged immediately upon account deletion',
        configurable: true
    },
    qrRecords: {
        category: 'QR Identity Records',
        retentionPeriod: 'Permanent token binding (preserves physical QR stickers)',
        archivalPeriod: 'Revoked and rendered inactive upon deletion',
        configurable: true
    },
    auditLogs: {
        category: 'Access & Security Logs',
        retentionPeriod: '90 days rolling window',
        archivalPeriod: 'Automated pruning after 90 days',
        configurable: true
    },
    paymentRecords: {
        category: 'Financial & Invoice History',
        retentionPeriod: '7 years (as mandated by Indian GST / Financial compliance regulations)',
        archivalPeriod: 'Read-only encrypted archive',
        configurable: true
    }
};

/**
 * Role-Based Access Control Matrix
 */
export const ROLE_ACCESS_MATRIX = {
    public_bystander: {
        role: 'Public / Anonymous Bystander',
        description: 'Someone scanning the physical QR tag on the scene of an emergency.',
        allowedData: [
            'Citizen Registered Name',
            'Masked Emergency Contact ("Call Family" trigger)',
            'Direct Emergency Service Action Buttons (108 Ambulance / Police)',
            'Nearest Hospital Directory Lookup',
            'User-allowed Public Emergency Notes'
        ],
        restrictedData: [
            'Full Medical History & Chronic Conditions (Restricted)',
            'Insurance Policy Number & Documents (Restricted)',
            'Private Residential Street Address (Restricted)',
            'Raw Unmasked Family Mobile Numbers (Restricted)',
            'Facial Biometric Neural Vectors (Restricted)'
        ]
    },
    doctor_hospital: {
        role: 'Verified Doctor / Hospital Emergency Ward',
        description: 'Authorized medical personnel treating the patient.',
        allowedData: [
            'Full Emergency Medical Vault (Blood Group, Allergies, Conditions, Medications)',
            'Previous Surgical History & Organ Donor Status',
            'Insurance Provider & Policy Number for Admission',
            'Biometric 1:1 Face Match Verification at Bedside'
        ],
        restrictedData: [
            'Payment Gateway Details & Internal Account Tokens'
        ]
    },
    agent: {
        role: 'Verified RESQR Field Agent',
        description: 'Support personnel assisting with sticker onboarding and physical delivery.',
        allowedData: [
            'User Name & Delivery Pincode',
            'Sticker Kit Dispatch Status',
            'Payment Confirmation Status'
        ],
        restrictedData: [
            'Medical Health Vault (Completely Hidden)',
            'Emergency Contacts (Hidden)',
            'Insurance Details (Hidden)',
            'Biometric Neural Templates (Hidden)'
        ]
    },
    admin: {
        role: 'Platform Operations Admin',
        description: 'Operational team following least-privilege security controls.',
        allowedData: [
            'Account Lifecycle Status',
            'Payment & Order Verification',
            'Security Access Audit Logs'
        ],
        restrictedData: [
            'Encrypted Raw Medical Files unless requested via formal legal warrant'
        ]
    }
};

/**
 * Phone Number Masking Utility
 * Example: "9876543210" -> "+91 ••••• ••10"
 */
export function maskPhoneNumber(phone) {
    if (!phone) return 'Authorized Family Contact';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 4) return 'Authorized Contact';
    const lastDigits = clean.slice(-2);
    return `+91 ••••• ••${lastDigits}`;
}

/**
 * Checks if user has accepted the current privacy consent version
 */
export function hasAcceptedLatestConsent(userOrProfile) {
    if (!userOrProfile) return false;
    const consent = userOrProfile.privacyConsent || userOrProfile.consent;
    if (!consent) return false;
    return consent.accepted === true && consent.version === PRIVACY_POLICY_VERSION && consent.required === true;
}

/**
 * Grievance / Privacy Officer Contact Info
 */
export const PRIVACY_OFFICER_DETAILS = {
    designation: "Data Protection & Grievance Officer",
    organization: "RESQR HealthTech Platform (Sicon Enterprises)",
    email: "privacy@resqr.co.in",
    officialEmail: "admin@resqr.co.in",
    supportEmail: "resqr.official@gmail.com",
    address: "Hyderabad, Telangana, India",
    responseTime: "Within 48 business hours"
};
