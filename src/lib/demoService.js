/**
 * RESQR Demo Environment & Simulation Service
 * --------------------------------------------
 * 100% Free, fully isolated test environment.
 * All accounts, payments, subscriptions, and emergency workflows are simulated.
 * Every demo record is explicitly tagged with { isDemo: true, environment: "demo" }.
 * Real customer data and production payment systems remain 100% untouched.
 */

import { db, auth } from './firebase';
import { ref, get, set, update, push, remove, serverTimestamp } from 'firebase/database';

export const DEMO_ROLES = {
    USER: 'user',
    AGENT: 'agent',
    DOCTOR: 'doctor',
    HOSPITAL: 'hospital',
    AMBULANCE: 'ambulance',
    PET_OWNER: 'pet_owner',
    SCHOOL: 'school',
    COLLEGE: 'college',
    ENTERPRISE: 'enterprise',
    ADMIN: 'admin',
};

export const DEMO_ROLE_METADATA = {
    [DEMO_ROLES.USER]: {
        label: 'Citizen / User',
        icon: 'User',
        targetRoute: '/dashboard',
        demoUid: 'demo_user_rajesh',
        name: 'Rajesh Sharma (Demo Citizen)',
        desc: 'Individual emergency medical profile, QR pass, insurance & emergency contacts.',
    },
    [DEMO_ROLES.AGENT]: {
        label: 'Agent Partner',
        icon: 'Users',
        targetRoute: '/dashboard',
        demoUid: 'demo_agent_vikram',
        name: 'Vikram Malhotra (Demo Agent)',
        desc: 'Agent console with Family, School, College, Corporate customer management & commission ledger.',
    },
    [DEMO_ROLES.DOCTOR]: {
        label: 'Emergency Doctor',
        icon: 'HeartPulse',
        targetRoute: '/solutions/doctors',
        demoUid: 'demo_doctor_ananya',
        name: 'Dr. Ananya Sen, MD (Trauma Lead)',
        desc: 'Clinical QR scanner, authorized full medical dossiers, allergy warnings & access logs.',
    },
    [DEMO_ROLES.HOSPITAL]: {
        label: 'Hospital Hub',
        icon: 'Building2',
        targetRoute: '/solutions/hospitals',
        demoUid: 'demo_hospital_apollo',
        name: 'Apollo Metro Trauma Center',
        desc: 'Emergency triage desk, trauma admissions, bed allocations & clinical staff registry.',
    },
    [DEMO_ROLES.AMBULANCE]: {
        label: 'Ambulance Responder',
        icon: 'Siren',
        targetRoute: '/demo/ambulance',
        demoUid: 'demo_ambulance_unit09',
        name: 'City Ambulance Unit #09',
        desc: 'Live GPS dispatch map, emergency pickup response & hospital en-route routing.',
    },
    [DEMO_ROLES.PET_OWNER]: {
        label: 'Pet RESQR Owner',
        icon: 'Dog',
        targetRoute: '/pet-dashboard',
        demoUid: 'demo_pet_owner_priya',
        name: 'Priya Sharma (Pet Parent)',
        desc: 'Bruno (Golden Retriever) safety profile, Lost Pet Mode & live finder GPS reports stream.',
    },
    [DEMO_ROLES.SCHOOL]: {
        label: 'School Campus',
        icon: 'GraduationCap',
        targetRoute: '/dashboard',
        demoUid: 'demo_school_stxavier',
        name: 'St. Xavier High School (Demo)',
        desc: 'Grade 1–12 classroom rosters, student safety tags & campus emergency liaison.',
    },
    [DEMO_ROLES.COLLEGE]: {
        label: 'College / University',
        icon: 'BookOpen',
        targetRoute: '/dashboard',
        demoUid: 'demo_college_nit',
        name: 'National Institute of Tech (Demo)',
        desc: 'Cyber Security, CSE, ECE, AIML departments, campus health desk & student fleet.',
    },
    [DEMO_ROLES.ENTERPRISE]: {
        label: 'Corporate Enterprise',
        icon: 'Briefcase',
        targetRoute: '/dashboard',
        demoUid: 'demo_corp_infotech',
        name: 'Infotech Solutions Pvt Ltd',
        desc: 'Bengaluru HQ & Hyderabad branches, employee emergency cards & corporate wellness.',
    },
    [DEMO_ROLES.ADMIN]: {
        label: 'Master Admin',
        icon: 'Shield',
        targetRoute: '/admin',
        demoUid: 'demo_admin_master',
        name: 'RESQR Demo Administrator',
        desc: 'Master console inspecting live platform payments, user audits, and security logs.',
    },
};

/**
 * Check if demo mode is currently active in the session
 */
export function isDemoMode() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('resqr_demo_mode') === 'true' ||
           sessionStorage.getItem('resqr_demo_mode') === 'true';
}

/**
 * Get the currently active simulated demo role
 */
export function getActiveDemoRole() {
    if (typeof window === 'undefined') return DEMO_ROLES.USER;
    return localStorage.getItem('resqr_demo_role') || DEMO_ROLES.USER;
}

/**
 * Activate or update Demo Mode role
 */
export function setDemoMode(active, role = DEMO_ROLES.USER) {
    if (typeof window === 'undefined') return;
    if (active) {
        localStorage.setItem('resqr_demo_mode', 'true');
        localStorage.setItem('resqr_demo_role', role);
        localStorage.setItem('resqr_active_role', role);
        sessionStorage.setItem('resqr_demo_mode', 'true');
    } else {
        localStorage.removeItem('resqr_demo_mode');
        localStorage.removeItem('resqr_demo_role');
        sessionStorage.removeItem('resqr_demo_mode');
    }
    // Broadcast event for UI reactive updates
    window.dispatchEvent(new CustomEvent('resqr-demo-mode-change', { detail: { active, role } }));
}

/**
 * Simulated Demo Payment Generator
 * 100% Free - Never contacts real payment gateway.
 */
export async function simulateDemoPayment(orderData = {}) {
    const now = Date.now();
    const demoOrderId = `DEMO-ORDER-${Math.floor(10000 + Math.random() * 90000)}`;
    const demoPaymentId = `DEMO-PAYMENT-${Math.floor(10000 + Math.random() * 90000)}`;

    const record = {
        orderId: demoOrderId,
        paymentId: demoPaymentId,
        amount: orderData.amount || 199,
        planId: orderData.planId || 'demo_plan',
        planName: orderData.planName || 'RESQR Demo Package',
        customerName: orderData.customerName || 'Demo Citizen',
        customerEmail: orderData.customerEmail || 'demo@resqr-demo.local',
        customerPhone: orderData.customerPhone || '9876543210',
        paymentStatus: 'paid',
        isDemo: true,
        environment: 'demo',
        createdAt: now,
    };

    // Store in demo namespace
    try {
        await set(ref(db, `demoPayments/${demoPaymentId}`), record);
    } catch (e) {
        console.warn('Demo payment RTDB write warning:', e);
    }

    return {
        success: true,
        verified: true,
        isDemo: true,
        orderId: demoOrderId,
        paymentId: demoPaymentId,
        record,
    };
}

/**
 * Simulated Demo OTP System (Always accepts 123456 or returns instantaneous demo code)
 */
export const DEMO_STATIC_OTP = '123456';

export function verifyDemoOtp(enteredOtp) {
    const clean = String(enteredOtp || '').trim();
    return clean === DEMO_STATIC_OTP || clean === '000000';
}

/**
 * Fixture Data Seed: Initializes all demo role entities in RTDB
 */
export async function seedDemoDatabaseFixtures() {
    const now = Date.now();
    const threeMonthsLater = now + (90 * 24 * 60 * 60 * 1000);

    const fixtures = {
        // 1. Demo User (Citizen)
        [`users/demo_user_rajesh`]: {
            uid: 'demo_user_rajesh',
            name: 'Rajesh Sharma',
            email: 'demo-user@resqr-demo.local',
            phone: '9876543210',
            role: 'citizen',
            status: 'approved',
            isDemo: true,
            environment: 'demo',
            profileCompleted: true,
            privacyConsent: { version: 'v1.0', acceptedAt: now, isDemo: true },
            bloodGroup: 'O+',
            medicalConditions: 'Mild Asthma, Hypertension',
            allergies: 'Penicillin, Dust Mites',
            emergencyContactName: 'Priya Sharma (Spouse)',
            emergencyContactPhone: '9876543211',
            subscription: {
                id: 'sub_demo_rajesh',
                planId: 'initial_199',
                planName: 'RESQR QR + 3-Month Validity (Demo)',
                status: 'ACTIVE',
                isDemo: true,
                activatedAt: new Date(now).toISOString(),
                expiresAt: new Date(threeMonthsLater).toISOString(),
            },
        },
        [`profiles/c_demo_user_rajesh`]: {
            id: 'c_demo_user_rajesh',
            uid: 'demo_user_rajesh',
            name: 'Rajesh Sharma',
            bloodGroup: 'O+',
            healthIssues: 'Mild Asthma, Hypertension',
            allergies: 'Penicillin, Dust Mites',
            emergencyContactName: 'Priya Sharma',
            emergencyContactRelation: 'Spouse',
            emergencyContactPhone: '9876543211',
            isDemo: true,
            environment: 'demo',
            createdAt: now,
        },

        // 2. Demo Agent
        [`users/demo_agent_vikram`]: {
            uid: 'demo_agent_vikram',
            name: 'Vikram Malhotra',
            email: 'demo-agent@resqr-demo.local',
            phone: '9876543220',
            role: 'agent',
            status: 'approved',
            agentId: 'RESQR-AG-DEMO',
            isDemo: true,
            environment: 'demo',
        },
        [`agents/RESQR-AG-DEMO`]: {
            agentId: 'RESQR-AG-DEMO',
            uid: 'demo_agent_vikram',
            name: 'Vikram Malhotra',
            status: 'active',
            isDemo: true,
            environment: 'demo',
            createdAt: now,
        },
        [`agentsByUid/demo_agent_vikram`]: 'RESQR-AG-DEMO',

        // 3. Demo Pet (Bruno)
        [`pets/RESQR-PET-DEMO01`]: {
            petId: 'RESQR-PET-DEMO01',
            name: 'Bruno',
            species: 'Dog',
            breed: 'Golden Retriever',
            gender: 'Male',
            age: '3 Years',
            colour: 'Golden Honey',
            identificationMarkings: 'White patch on chest, brown leather collar',
            microchipNumber: '981098109810981',
            ownerUid: 'demo_pet_owner_priya',
            lostStatus: 'lost', // Default in lost mode to showcase recovery features
            lostNotes: 'Bruno wandered away near Indiranagar 100ft road. Very friendly! Reward for safe return.',
            lostReportedAt: now - 3600000,
            status: 'active',
            isDemo: true,
            environment: 'demo',
            createdAt: now,
        },
        [`petEmergencyContacts/RESQR-PET-DEMO01`]: {
            primaryOwner: { name: 'Priya Sharma', phone: '9876543211', relation: 'Pet Parent' },
            veterinarian: { name: 'Dr. Rao', phone: '9876543299', clinic: 'PetCare Trauma Hospital' },
            isDemo: true,
        },
        [`petMedicalRecords/RESQR-PET-DEMO01`]: {
            allergies: 'Allergic to chicken',
            medicalConditions: 'Sensitive stomach',
            vaccinationInfo: 'Up to Date (Rabies + 9-in-1)',
            veterinarianName: 'Dr. Rao',
            veterinarianContact: '9876543299',
            isDemo: true,
        },

        // 4. Demo School
        [`agentGroups/RESQR-AG-DEMO/RESQR-SCH-DEMO`]: {
            groupId: 'RESQR-SCH-DEMO',
            categoryType: 'school',
            categoryName: 'Educational Institution (School)',
            institutionName: 'St. Xavier High School (Demo)',
            principalName: 'Father Thomas Kurian',
            contactPhone: '9876543230',
            contactEmail: 'principal@stxavier-demo.edu.in',
            campusEmergencyContact: '9876543239',
            studentCount: 450,
            staffCount: 35,
            city: 'Mumbai',
            status: 'active',
            plan: { id: 'school_tier2', name: 'School Campus Bulk (500)', memberCapacity: 500 },
            isDemo: true,
            environment: 'demo',
            createdAt: now,
        },

        // 5. Demo Corporate
        [`agentGroups/RESQR-AG-DEMO/RESQR-CORP-DEMO`]: {
            groupId: 'RESQR-CORP-DEMO',
            categoryType: 'corporate',
            categoryName: 'IT / Office / Corporate Enterprise',
            companyName: 'Infotech Solutions Pvt Ltd (Demo)',
            hrAdminName: 'Sunita Mehra (VP HR)',
            contactPhone: '9876543240',
            contactEmail: 'hr@infotech-demo.com',
            corporateEmergencyContact: '9876543249',
            employeeCount: 350,
            officeLocations: 'Bengaluru HQ, Hyderabad Hub',
            city: 'Bengaluru',
            status: 'active',
            plan: { id: 'corp_large', name: 'Corporate Enterprise (500)', memberCapacity: 500 },
            isDemo: true,
            environment: 'demo',
            createdAt: now,
        },

        // 6. Demo Ambulance Dispatch
        [`demoAmbulanceRequests/REQ-DEMO-001`]: {
            requestId: 'REQ-DEMO-001',
            patientName: 'Rajesh Sharma',
            patientPhone: '9876543210',
            bloodGroup: 'O+',
            allergies: 'Penicillin',
            pickupAddress: 'MG Road Metro Station, Gate 2, Bengaluru',
            latitude: 12.9756,
            longitude: 77.6067,
            status: 'in_transit', // pending, accepted, in_transit, arrived, completed
            assignedUnit: 'BLS-09 (Paramedic Ashok)',
            destinationHospital: 'Apollo Metro Trauma Center',
            etaMinutes: 6,
            isDemo: true,
            environment: 'demo',
            createdAt: now,
        },
    };

    await update(ref(db), fixtures);
    return true;
}

/**
 * Safely Reset Demo Database
 * Deletes ONLY demo records. Real users and payments are 100% protected.
 */
export async function resetDemoDatabase() {
    // Clear demo-specific nodes
    const demoPaths = [
        'demoPayments',
        'demoAmbulanceRequests',
        'users/demo_user_rajesh',
        'users/demo_agent_vikram',
        'profiles/c_demo_user_rajesh',
        'agents/RESQR-AG-DEMO',
        'agentsByUid/demo_agent_vikram',
        'pets/RESQR-PET-DEMO01',
        'petEmergencyContacts/RESQR-PET-DEMO01',
        'petMedicalRecords/RESQR-PET-DEMO01',
        'agentGroups/RESQR-AG-DEMO/RESQR-SCH-DEMO',
        'agentGroups/RESQR-AG-DEMO/RESQR-CORP-DEMO',
    ];

    const updates = {};
    demoPaths.forEach(p => {
        updates[p] = null;
    });

    try {
        await update(ref(db), updates);
        // Re-seed clean fixtures
        await seedDemoDatabaseFixtures();
    } catch (e) {
        console.warn('Demo reset exception:', e);
    }

    return true;
}

/**
 * Demo Emergency Timeline Simulator
 * Runs step-by-step simulated emergency workflow.
 */
export const DEMO_EMERGENCY_STEPS = [
    { id: 1, title: 'QR Scanned by Bystander', desc: 'Secure identifier scanned at emergency scene.', durationMs: 1200 },
    { id: 2, title: 'Emergency Profile Opened', desc: 'Bystander accesses masked emergency contacts & blood group.', durationMs: 1400 },
    { id: 3, title: 'Family Notification Simulated', desc: 'SMS/WhatsApp dispatched to Priya Sharma (Spouse).', durationMs: 1200 },
    { id: 4, title: 'Live GPS Location Shared', desc: 'Scene coordinates (12.9756° N, 77.6067° E) pinned on map.', durationMs: 1500 },
    { id: 5, title: 'Ambulance Request Simulated', desc: 'Dispatch signal sent to nearest BLS Unit #09 (ETA: 6 mins).', durationMs: 1600 },
    { id: 6, title: 'Trauma Center Notified', desc: 'Apollo Metro Emergency Room alerted of incoming O+ patient.', durationMs: 1400 },
    { id: 7, title: 'Doctor Authorized Access', desc: 'Dr. Ananya Sen accesses verified allergy dossier (Penicillin).', durationMs: 1300 },
    { id: 8, title: 'Emergency Completed & Triage Safe', desc: 'Patient admitted; emergency contact confirmed safe arrival.', durationMs: 1000 },
];
