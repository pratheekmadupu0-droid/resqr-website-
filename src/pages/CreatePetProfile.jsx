import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Shield, ArrowRight, ArrowLeft, Check, Upload, QrCode,
    Download, Phone, Mail, MapPin, AlertTriangle, Sparkles, HeartPulse,
    Eye, Camera, User, CheckCircle2, Lock, Plus, Trash2, Loader2, Home
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { QRCodeCanvas } from 'qrcode.react';
import { createPetProfile, PET_SPECIES_OPTIONS } from '../lib/petService';

export default function CreatePetProfile() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [step, setStep] = useState(1); // 1: Pet Details, 2: Owner Details, 3: Health Info, 4: Contacts, 5: QR Activation
    const [submitting, setSubmitting] = useState(false);
    const [createdPetResult, setCreatedPetResult] = useState(null);
    const fileInputRef = useRef(null);

    // Step 1: Pet Details
    const [petDetails, setPetDetails] = useState({
        name: '',
        photoUrl: '',
        species: 'Dog',
        breed: '',
        gender: 'Male',
        age: '',
        dob: '',
        colour: '',
        identificationMarkings: '',
        microchipNumber: '',
        registrationNumber: '',
    });

    // Step 2: Owner Details
    const [ownerDetails, setOwnerDetails] = useState({
        ownerName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        emergencyContact: '',
    });

    // Step 3: Pet Health Details
    const [healthDetails, setHealthDetails] = useState({
        bloodType: '',
        allergies: '',
        medicalConditions: '',
        medications: '',
        vaccinationInfo: 'Up to Date',
        veterinarianName: '',
        veterinarianContact: '',
        veterinarianClinic: '',
        medicalNotes: '',
    });

    // Step 4: Emergency Contacts
    const [secondaryOwner, setSecondaryOwner] = useState({ name: '', phone: '', relation: 'Co-Owner / Partner' });
    const [familyContact, setFamilyContact] = useState({ name: '', phone: '', relation: 'Family Member' });

    // Authentication Guard
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                setOwnerDetails(prev => ({
                    ...prev,
                    ownerName: prev.ownerName || user.displayName || '',
                    email: prev.email || user.email || '',
                }));
            }
        });
        return () => unsub();
    }, []);

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Pet photo must be under 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const dataUrl = evt.target?.result;
            setPetDetails(prev => ({ ...prev, photoUrl: dataUrl }));
            toast.success('Pet photo attached.');
        };
        reader.readAsDataURL(file);
    };

    const validateStep1 = () => {
        if (!petDetails.name.trim()) {
            toast.error('Please enter your pet’s name.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!ownerDetails.ownerName.trim()) {
            toast.error('Please enter the owner’s name.');
            return false;
        }
        if (!ownerDetails.phone.trim() || ownerDetails.phone.replace(/[^0-9]/g, '').length < 10) {
            toast.error('Please enter a valid 10-digit mobile number.');
            return false;
        }
        return true;
    };

    const handleCreatePet = async () => {
        if (!currentUser) {
            toast.error('Please log in or authenticate to create your Pet RESQR.');
            navigate('/login');
            return;
        }

        setSubmitting(true);
        const t = toast.loading('Minting your Pet RESQR Safety ID...');

        try {
            const contacts = {
                secondaryOwner: secondaryOwner.name && secondaryOwner.phone ? secondaryOwner : null,
                familyMember: familyContact.name && familyContact.phone ? familyContact : null,
            };

            const result = await createPetProfile(
                currentUser.uid,
                petDetails,
                ownerDetails,
                healthDetails,
                contacts
            );

            setCreatedPetResult(result);
            setStep(5);
            toast.success(`Pet RESQR Created! ID: ${result.petId}`, { id: t, duration: 6000 });
        } catch (err) {
            console.error('Pet registration failed:', err);
            toast.error(err.message || 'Failed to create Pet RESQR. Please try again.', { id: t });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040812] text-white py-12 px-4 sm:px-6 lg:px-8 font-manrope">
            <div className="max-w-4xl mx-auto">
                {/* Top Back & Branding Bar */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                        🐾 Pet Safety Identity Network
                    </div>
                </div>

                {/* Hero Header */}
                <div className="text-center space-y-3 mb-10">
                    <h1 className="text-3xl sm:text-5xl font-black italic uppercase font-poppins text-white tracking-tight">
                        Create <span className="text-primary italic-display">Pet RESQR</span>
                    </h1>
                    <p className="text-sm text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
                        Help your pet get home safely. Secure emergency QR tag, instant finder location alerts & confidential medical profiles.
                    </p>
                </div>

                {/* Step Indicators */}
                {step < 5 && (
                    <div className="grid grid-cols-4 gap-2 mb-8">
                        {['Pet Details', 'Owner Info', 'Health & Vet', 'Emergency Contacts'].map((label, idx) => {
                            const stepNum = idx + 1;
                            const isDone = step > stepNum;
                            const isCurr = step === stepNum;
                            return (
                                <div key={label} className="text-center">
                                    <div className={`h-1.5 rounded-full transition-all ${
                                        isDone ? 'bg-emerald-500' : isCurr ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-white/10'
                                    }`} />
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                                        isCurr ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-500'
                                    }`}>
                                        {label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Step Forms */}
                <Card className="p-6 sm:p-10 bg-[#090E1A] border-white/10 rounded-3xl shadow-2xl">
                    {/* STEP 1: PET DETAILS */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="border-b border-white/10 pb-4">
                                <h2 className="text-xl font-black italic uppercase font-poppins text-white">1. Companion Information</h2>
                                <p className="text-xs text-slate-400 mt-1">Provide physical identifiers and photo to assist rescuers in recognizing your pet.</p>
                            </div>

                            {/* Pet Photo Upload */}
                            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-white/5 border border-white/5">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#050914] border-2 border-dashed border-white/20 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden shrink-0 group relative"
                                >
                                    {petDetails.photoUrl ? (
                                        <img src={petDetails.photoUrl} alt="Pet Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Camera size={24} className="text-slate-500 group-hover:text-primary transition-colors" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">Upload Photo</span>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                </div>
                                <div className="space-y-1 text-center sm:text-left">
                                    <h4 className="text-sm font-bold text-white">Pet Profile Photograph</h4>
                                    <p className="text-xs text-slate-400">Clear face & body photo helps finders verify your pet instantly upon scanning.</p>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn-app-secondary py-1.5 px-3 text-[11px] font-bold inline-flex items-center gap-1.5 mt-2"
                                    >
                                        <Upload size={12} /> Choose Image
                                    </button>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Pet Name <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bruno, Bella, Simba"
                                        value={petDetails.name}
                                        onChange={(e) => setPetDetails({ ...petDetails, name: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Species
                                    </label>
                                    <select
                                        value={petDetails.species}
                                        onChange={(e) => setPetDetails({ ...petDetails, species: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                    >
                                        {PET_SPECIES_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Breed
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Golden Retriever, Persian Cat, Indie"
                                        value={petDetails.breed}
                                        onChange={(e) => setPetDetails({ ...petDetails, breed: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Gender
                                    </label>
                                    <select
                                        value={petDetails.gender}
                                        onChange={(e) => setPetDetails({ ...petDetails, gender: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Neutered Male">Neutered Male</option>
                                        <option value="Spayed Female">Spayed Female</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Age / Approximate Date of Birth
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2 Years, 6 Months"
                                        value={petDetails.age}
                                        onChange={(e) => setPetDetails({ ...petDetails, age: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Coat Colour / Fur Pattern
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Golden brown, White with black patches"
                                        value={petDetails.colour}
                                        onChange={(e) => setPetDetails({ ...petDetails, colour: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Distinctive Identification Markings
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. White spot on chest, notched left ear, cropped tail"
                                        value={petDetails.identificationMarkings}
                                        onChange={(e) => setPetDetails({ ...petDetails, identificationMarkings: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Microchip Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="15-digit ISO microchip code"
                                        value={petDetails.microchipNumber}
                                        onChange={(e) => setPetDetails({ ...petDetails, microchipNumber: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Municipal / Kennel Club Reg No (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. KCI / Municipal tag"
                                        value={petDetails.registrationNumber}
                                        onChange={(e) => setPetDetails({ ...petDetails, registrationNumber: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: OWNER DETAILS */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="border-b border-white/10 pb-4">
                                <h2 className="text-xl font-black italic uppercase font-poppins text-white">2. Pet Parent / Owner Details</h2>
                                <p className="text-xs text-slate-400 mt-1">This information is securely stored in your private vault and masked on public scans.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Owner Full Name <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your Full Name"
                                        value={ownerDetails.ownerName}
                                        onChange={(e) => setOwnerDetails({ ...ownerDetails, ownerName: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Mobile Number <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="10-digit phone number"
                                        value={ownerDetails.phone}
                                        onChange={(e) => setOwnerDetails({ ...ownerDetails, phone: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={ownerDetails.email}
                                        onChange={(e) => setOwnerDetails({ ...ownerDetails, email: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mumbai, Bengaluru"
                                        value={ownerDetails.city}
                                        onChange={(e) => setOwnerDetails({ ...ownerDetails, city: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Residential Address (Private Vault Only)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Flat/House, Street, Area"
                                        value={ownerDetails.address}
                                        onChange={(e) => setOwnerDetails({ ...ownerDetails, address: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Your exact home address is NEVER displayed to unverified public scanners.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: HEALTH & VETERINARIAN */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="border-b border-white/10 pb-4">
                                <h2 className="text-xl font-black italic uppercase font-poppins text-white">3. Health Details & Veterinary Care</h2>
                                <p className="text-xs text-slate-400 mt-1">All health fields are voluntary. They assist veterinarians and animal shelters in providing life-saving care.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Known Allergies (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Chicken, Dairy, Penicillin, Flea saliva"
                                        value={healthDetails.allergies}
                                        onChange={(e) => setHealthDetails({ ...healthDetails, allergies: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Existing Medical Conditions (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Epilepsy, Diabetes, Arthritis, Blind in right eye"
                                        value={healthDetails.medicalConditions}
                                        onChange={(e) => setHealthDetails({ ...healthDetails, medicalConditions: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Daily Medications (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Insulin twice daily, Heartgard"
                                        value={healthDetails.medications}
                                        onChange={(e) => setHealthDetails({ ...healthDetails, medications: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Vaccination Status
                                    </label>
                                    <select
                                        value={healthDetails.vaccinationInfo}
                                        onChange={(e) => setHealthDetails({ ...healthDetails, vaccinationInfo: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="Up to Date (Rabies + DHPP / FVRCP)">Up to Date (Rabies + 7-in-1 / 9-in-1)</option>
                                        <option value="Partially Vaccinated">Partially Vaccinated</option>
                                        <option value="Puppy / Kitten Schedule in Progress">Puppy / Kitten Schedule in Progress</option>
                                        <option value="Due for Annual Booster">Due for Annual Booster</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Primary Veterinarian / Clinic Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Dr. Rajesh Rao / PetCare Clinic"
                                        value={healthDetails.veterinarianName}
                                        onChange={(e) => setHealthDetails({ ...healthDetails, veterinarianName: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Veterinarian Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Doctor / Clinic emergency line"
                                        value={healthDetails.veterinarianContact}
                                        onChange={(e) => setHealthDetails({ ...healthDetails, veterinarianContact: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        Special Dietary / Handling Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. Skittish around loud vehicles, loves treats, very friendly with kids."
                                        value={healthDetails.medicalNotes}
                                        onChange={(e) => setHealthDetails({ ...healthDetails, medicalNotes: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: EMERGENCY CONTACTS */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="border-b border-white/10 pb-4">
                                <h2 className="text-xl font-black italic uppercase font-poppins text-white">4. Secondary Emergency Contacts</h2>
                                <p className="text-xs text-slate-400 mt-1">If you are unavailable or travelling, who should rescuers contact?</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                                    Secondary Co-Owner / Partner
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Contact Name"
                                        value={secondaryOwner.name}
                                        onChange={(e) => setSecondaryOwner({ ...secondaryOwner, name: e.target.value })}
                                        className="bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        value={secondaryOwner.phone}
                                        onChange={(e) => setSecondaryOwner({ ...secondaryOwner, phone: e.target.value })}
                                        className="bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                                    Family Member / Caretaker
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Family Contact Name"
                                        value={familyContact.name}
                                        onChange={(e) => setFamilyContact({ ...familyContact, name: e.target.value })}
                                        className="bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        value={familyContact.phone}
                                        onChange={(e) => setFamilyContact({ ...familyContact, phone: e.target.value })}
                                        className="bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="p-4 rounded-2xl bg-[#050914] border border-white/10 flex items-start gap-3 text-xs text-slate-400">
                                <Shield className="text-primary shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="font-bold text-white">Pet Safety Guarantee</p>
                                    <p className="text-[11px] mt-0.5">
                                        Your Pet RESQR identifier will be permanently linked to your profile with Lost Pet Mode, GPS coordinate reporting, and masked dialer routing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: ACTIVATION & SUCCESS */}
                    {step === 5 && createdPetResult && (
                        <div className="space-y-8 text-center py-6 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 size={36} />
                            </div>

                            <div>
                                <Badge className="bg-primary/20 text-primary border-none px-4 py-1 text-[10px] font-black uppercase tracking-widest mb-3">
                                    SAFETY IDENTITY ACTIVATED
                                </Badge>
                                <h2 className="text-3xl font-black italic uppercase font-poppins text-white">
                                    {petDetails.name}&apos;s Pet RESQR is Ready!
                                </h2>
                                <p className="text-sm text-slate-400 mt-2 font-mono font-bold">
                                    ID: <span className="text-primary">{createdPetResult.petId}</span>
                                </p>
                            </div>

                            {/* QR Tag Card */}
                            <div className="max-w-xs mx-auto p-6 rounded-3xl bg-[#050914] border-2 border-white/10 shadow-2xl text-center space-y-4">
                                <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-md">
                                    <QRCodeCanvas
                                        value={`https://resqr.co.in/pet/${createdPetResult.petId}`}
                                        size={180}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black italic uppercase text-white font-poppins">{petDetails.name}</h4>
                                    <p className="text-xs text-slate-400">{petDetails.breed || petDetails.species}</p>
                                    <p className="text-[10px] font-mono text-slate-500 mt-1">Scan to Report Found Pet</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                                <Link
                                    to="/pet-dashboard"
                                    className="w-full sm:w-auto btn-app-primary py-3 px-8 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                >
                                    Open Pet Dashboard <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to={`/pet/${createdPetResult.petId}`}
                                    className="w-full sm:w-auto btn-app-secondary py-3 px-6 text-xs font-bold inline-flex items-center justify-center gap-2"
                                >
                                    <Eye size={14} /> Preview Public Tag
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 5 && (
                        <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-white/10">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(s => s - 1)}
                                    disabled={submitting}
                                    className="btn-app-secondary py-3 px-6 text-xs font-bold inline-flex items-center gap-2"
                                >
                                    <ArrowLeft size={14} /> Back
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="btn-app-secondary py-3 px-6 text-xs font-bold"
                                >
                                    Cancel
                                </button>
                            )}

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (step === 1 && !validateStep1()) return;
                                        if (step === 2 && !validateStep2()) return;
                                        setStep(s => s + 1);
                                    }}
                                    className="btn-app-primary py-3 px-8 text-xs font-bold inline-flex items-center gap-2"
                                >
                                    Next <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleCreatePet}
                                    disabled={submitting}
                                    className="btn-app-primary py-3 px-8 text-xs font-bold inline-flex items-center gap-2 shadow-xl shadow-primary/20"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Minting Pet RESQR...
                                        </>
                                    ) : (
                                        <>
                                            Activate Pet RESQR <Sparkles size={16} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
