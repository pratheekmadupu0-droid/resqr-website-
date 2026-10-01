/**
 * RESQR Pet Safety Service Layer
 * --------------------------------
 * Manages Pet RESQR identities, secure QR token resolution,
 * Lost Pet Mode, Geolocation reports from finders, and veterinary records.
 *
 * Dedicated database paths to preserve logical separation from human records:
 *   pets/{petId}
 *   userPets/{userId}/{petId}
 *   petEmergencyContacts/{petId}
 *   petMedicalRecords/{petId}
 *   petLostReports/{petId}/{reportId}
 *   petScanEvents/{petId}/{scanId}
 *   petQrTokens/{secureToken} -> { petId, ownerUid }
 */

import { db, auth } from './firebase';
import {
    ref, get, set, update, push, runTransaction, serverTimestamp, onValue
} from 'firebase/database';

export const PET_SPECIES_OPTIONS = [
    'Dog',
    'Cat',
    'Bird',
    'Rabbit',
    'Horse',
    'Other Companion Animal',
];

export const PET_STATUS = {
    ACTIVE: 'active',
    DEACTIVATED: 'deactivated',
};

export const PET_LOST_STATUS = {
    NORMAL: 'normal',
    LOST: 'lost',
};

/**
 * Generate a sequential Pet RESQR ID (RESQR-PET-000001, 000002, ...)
 */
export async function assignPetId() {
    const counterRef = ref(db, 'counters/pets');
    const { snapshot } = await runTransaction(counterRef, (current) =>
        (typeof current === 'number' ? current : 0) + 1
    );
    const n = snapshot.val() || 1;
    return `RESQR-PET-${String(n).padStart(6, '0')}`;
}

/**
 * Create a new Pet RESQR Identity
 */
export async function createPetProfile(ownerUid, petDetails, ownerDetails, healthDetails, emergencyContacts) {
    if (!ownerUid) throw new Error('User authentication required to register a pet.');
    if (!petDetails?.name) throw new Error('Pet name is required.');

    const petId = await assignPetId();
    const now = Date.now();
    const secureToken = `pet_tok_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;

    const petRecord = {
        petId,
        secureToken,
        ownerUid,
        name: petDetails.name.trim(),
        photoUrl: petDetails.photoUrl || '',
        species: petDetails.species || 'Dog',
        breed: petDetails.breed || '',
        gender: petDetails.gender || 'Unknown',
        age: petDetails.age || '',
        dob: petDetails.dob || '',
        colour: petDetails.colour || '',
        identificationMarkings: petDetails.identificationMarkings || '',
        microchipNumber: petDetails.microchipNumber || '',
        registrationNumber: petDetails.registrationNumber || '',
        status: PET_STATUS.ACTIVE,
        lostStatus: PET_LOST_STATUS.NORMAL,
        lostReportedAt: null,
        lostNotes: '',
        createdAt: now,
        updatedAt: now,
        qrCodeUrl: `https://resqr.co.in/pet/${petId}`,
    };

    const ownerRecord = {
        ownerName: ownerDetails.ownerName || '',
        phone: ownerDetails.phone || '',
        email: ownerDetails.email || '',
        address: ownerDetails.address || '',
        city: ownerDetails.city || '',
        emergencyContact: ownerDetails.emergencyContact || '',
    };

    const healthRecord = {
        bloodType: healthDetails.bloodType || '',
        allergies: healthDetails.allergies || '',
        medicalConditions: healthDetails.medicalConditions || '',
        medications: healthDetails.medications || '',
        vaccinationInfo: healthDetails.vaccinationInfo || '',
        veterinarianName: healthDetails.veterinarianName || '',
        veterinarianContact: healthDetails.veterinarianContact || '',
        veterinarianClinic: healthDetails.veterinarianClinic || '',
        medicalNotes: healthDetails.medicalNotes || '',
        updatedAt: now,
    };

    const contactsRecord = {
        primaryOwner: {
            name: ownerDetails.ownerName || '',
            phone: ownerDetails.phone || '',
            relation: 'Primary Owner',
        },
        secondaryOwner: emergencyContacts.secondaryOwner || null,
        familyMember: emergencyContacts.familyMember || null,
        veterinarian: {
            name: healthDetails.veterinarianName || '',
            phone: healthDetails.veterinarianContact || '',
            clinic: healthDetails.veterinarianClinic || '',
        },
        updatedAt: now,
    };

    const updates = {};
    updates[`pets/${petId}`] = petRecord;
    updates[`userPets/${ownerUid}/${petId}`] = {
        petId,
        name: petRecord.name,
        species: petRecord.species,
        breed: petRecord.breed,
        photoUrl: petRecord.photoUrl,
        lostStatus: petRecord.lostStatus,
        status: petRecord.status,
        createdAt: now,
    };
    updates[`petOwners/${petId}`] = ownerRecord;
    updates[`petMedicalRecords/${petId}`] = healthRecord;
    updates[`petEmergencyContacts/${petId}`] = contactsRecord;
    updates[`petQrTokens/${secureToken}`] = { petId, ownerUid, createdAt: now };

    await update(ref(db), updates);

    return {
        success: true,
        petId,
        secureToken,
        petRecord,
    };
}

/**
 * Fetch public pet profile for QR Scan (Excludes private owner home addresses)
 */
export async function getPublicPetProfile(petId) {
    if (!petId) return null;
    const cleanId = String(petId).trim();

    // Check if token was provided
    let resolvedPetId = cleanId;
    if (cleanId.startsWith('pet_tok_')) {
        const tokenSnap = await get(ref(db, `petQrTokens/${cleanId}`));
        if (tokenSnap.exists()) {
            resolvedPetId = tokenSnap.val().petId;
        }
    }

    const petSnap = await get(ref(db, `pets/${resolvedPetId}`));
    if (!petSnap.exists()) return null;

    const pet = petSnap.val();
    const contactsSnap = await get(ref(db, `petEmergencyContacts/${resolvedPetId}`));
    const contacts = contactsSnap.exists() ? contactsSnap.val() : {};

    const medicalSnap = await get(ref(db, `petMedicalRecords/${resolvedPetId}`));
    const medical = medicalSnap.exists() ? medicalSnap.val() : {};

    return {
        petId: pet.petId,
        name: pet.name,
        photoUrl: pet.photoUrl,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        age: pet.age,
        colour: pet.colour,
        identificationMarkings: pet.identificationMarkings,
        lostStatus: pet.lostStatus,
        lostNotes: pet.lostNotes,
        lostReportedAt: pet.lostReportedAt,
        status: pet.status,
        emergencyContacts: contacts,
        criticalMedicalWarnings: {
            allergies: medical.allergies,
            medicalConditions: medical.medicalConditions,
            medications: medical.medications,
            medicalNotes: medical.medicalNotes,
            veterinarianName: medical.veterinarianName,
            veterinarianContact: medical.veterinarianContact,
            veterinarianClinic: medical.veterinarianClinic,
        },
    };
}

/**
 * Fetch full private pet profile (For authorized pet owner dashboard)
 */
export async function getFullPetProfile(petId) {
    if (!petId) return null;
    const [petSnap, ownerSnap, medicalSnap, contactsSnap] = await Promise.all([
        get(ref(db, `pets/${petId}`)),
        get(ref(db, `petOwners/${petId}`)),
        get(ref(db, `petMedicalRecords/${petId}`)),
        get(ref(db, `petEmergencyContacts/${petId}`)),
    ]);

    if (!petSnap.exists()) return null;

    return {
        ...petSnap.val(),
        owner: ownerSnap.exists() ? ownerSnap.val() : {},
        medical: medicalSnap.exists() ? medicalSnap.val() : {},
        contacts: contactsSnap.exists() ? contactsSnap.val() : {},
    };
}

/**
 * Toggle Lost Pet Mode (ON / OFF)
 */
export async function setPetLostStatus(petId, isLost, lostNotes = '') {
    if (!petId) throw new Error('Pet ID required.');
    const now = Date.now();
    const status = isLost ? PET_LOST_STATUS.LOST : PET_LOST_STATUS.NORMAL;

    // Get ownerUid
    const petSnap = await get(ref(db, `pets/${petId}`));
    const pet = petSnap.exists() ? petSnap.val() : {};
    const ownerUid = pet.ownerUid;

    const updates = {};
    updates[`pets/${petId}/lostStatus`] = status;
    updates[`pets/${petId}/lostNotes`] = isLost ? lostNotes : '';
    updates[`pets/${petId}/lostReportedAt`] = isLost ? now : null;
    updates[`pets/${petId}/updatedAt`] = now;

    if (ownerUid) {
        updates[`userPets/${ownerUid}/${petId}/lostStatus`] = status;
        updates[`userPets/${ownerUid}/${petId}/updatedAt`] = now;
    }

    await update(ref(db), updates);

    return { success: true, status };
}

/**
 * Submit finder GPS location and found report
 */
export async function submitFoundPetLocation(petId, reportData) {
    if (!petId) throw new Error('Pet ID required.');
    const now = Date.now();
    const reportsRef = push(ref(db, `petLostReports/${petId}`));
    const reportId = reportsRef.key;

    const payload = {
        reportId,
        petId,
        latitude: reportData.latitude || null,
        longitude: reportData.longitude || null,
        accuracy: reportData.accuracy || null,
        locationAddress: reportData.locationAddress || 'GPS Location Captured',
        finderName: reportData.finderName || 'Kind Passerby',
        finderPhone: reportData.finderPhone || '',
        message: reportData.message || 'I have found your pet. Please reach out!',
        reportedAt: now,
    };

    const updates = {};
    updates[`petLostReports/${petId}/${reportId}`] = payload;
    updates[`pets/${petId}/lastFoundReportAt`] = now;

    await update(ref(db), updates);

    return { success: true, reportId, payload };
}

/**
 * Log a public QR scan event
 */
export async function logPetScan(petId, metadata = {}) {
    if (!petId) return;
    try {
        const scanRef = push(ref(db, `petScanEvents/${petId}`));
        await set(scanRef, {
            scanId: scanRef.key,
            petId,
            scannedAt: Date.now(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            ...metadata,
        });
    } catch (e) {
        console.warn('Pet scan logging failed:', e);
    }
}

/**
 * Listen to all pets owned by a specific user
 */
export function listenUserPets(ownerUid, callback) {
    if (!ownerUid) {
        callback([]);
        return () => {};
    }
    const userPetsRef = ref(db, `userPets/${ownerUid}`);
    return onValue(userPetsRef, (snap) => {
        const list = snap.exists()
            ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            : [];
        callback(list);
    }, (err) => {
        console.error('User pets listener error:', err);
        callback([]);
    });
}

/**
 * Listen to found reports for a pet
 */
export function listenPetLostReports(petId, callback) {
    if (!petId) {
        callback([]);
        return () => {};
    }
    const reportsRef = ref(db, `petLostReports/${petId}`);
    return onValue(reportsRef, (snap) => {
        const list = snap.exists()
            ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }))
                .sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0))
            : [];
        callback(list);
    }, (err) => {
        console.error('Pet reports listener error:', err);
        callback([]);
    });
}

/**
 * Helper to mask phone numbers on public pet scans (+91 ••••• ••12)
 */
export function maskContactNumber(phone) {
    if (!phone) return 'Confidential';
    const clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.length < 10) return '•••• ••••';
    const last2 = clean.slice(-2);
    return `+91 ••••• ••${last2}`;
}
