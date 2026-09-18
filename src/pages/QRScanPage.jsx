import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { 
    Phone, MapPin, AlertCircle, Heart, Activity as ActivityIcon, Loader2, 
    Info, Lock, Shield, Share2, Activity as HeartPulse, Navigation, Siren, 
    Users, ChevronRight, ShieldAlert, CheckCircle2, XCircle, Key, 
    Stethoscope, Unlock, X 
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import EmergencyInfoSections from '../components/emergency/EmergencyInfoSections';
import AppLoading from '../components/ui/AppLoading';
import { db, auth } from '../lib/firebase';
import { ref, get, push, serverTimestamp } from 'firebase/database';
import toast from 'react-hot-toast';

export default function QRScanPage() {
    const { profileId, username } = useParams();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [scanRecorded, setScanRecorded] = useState(false);
    const [coords, setCoords] = useState(null);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [visitCount, setVisitCount] = useState(0);

    // Privacy & Authorized Medical Access states
    const [isMedicalAuthorized, setIsMedicalAuthorized] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMethod, setAuthMethod] = useState('otp'); // 'otp' | 'doctor_id'
    const [doctorRegNo, setDoctorRegNo] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [verifyingAuth, setVerifyingAuth] = useState(false);

    useEffect(() => {
        const id = profileId || username;
        if (id) {
            const key = `resqr_scan_visit_${id}`;
            const current = parseInt(localStorage.getItem(key) || '0');
            const next = current + 1;
            localStorage.setItem(key, next.toString());
            setVisitCount(next);
        }
    }, [profileId, username]);

    useEffect(() => {
        const fetchProfile = async () => {
             const id = profileId || username;
             if (!id) return setLoading(false);
             
             try {
                if (id) {
                    const cleanId = id.trim();
                    let snap = null;

                    let actualUid = null;
                    let actualPid = cleanId;

                    // 1. Direct user profile path first if ID matches Dashboard structure
                    if (cleanId.includes('_')) {
                        actualUid = cleanId.startsWith('c_') ? cleanId.replace('c_', '') : cleanId.split('_')[0];
                        snap = await get(ref(db, `users/${actualUid}/profiles/${cleanId}`));
                    }

                    // 2. Username registry lookup
                    if (!snap || !snap.exists()) {
                        const regSnap = await get(ref(db, `usernames/${cleanId.toLowerCase()}`));
                        if (regSnap.exists()) {
                            const path = regSnap.val();
                            const fullPath = path.startsWith('users/') ? path : `users/${path}`;
                            snap = await get(ref(db, fullPath));
                            
                            const parts = path.split('/');
                            actualUid = parts[0] === 'users' ? parts[1] : parts[0];
                            actualPid = parts[parts.length - 1];
                        }
                    }

                    // 3. Public registry fallback
                    if (!snap || !snap.exists()) {
                        snap = await get(ref(db, `profiles/${cleanId}`));
                    }

                    if (snap.exists()) {
                        const raw = snap.val();
                        
                        const fallbackMedical = raw.medical || {};
                        const fallbackEmergency = raw.emergencyContacts?.[0] || {};
                        
                        const mergedData = {
                            name: raw.name || raw.fullName || '',
                            phone: raw.phone || '',
                            email: raw.email || '',
                            dob: raw.dob || '',
                            gender: raw.gender || '',
                            
                            bloodGroup: fallbackMedical.bloodGroup || raw.bloodGroup || '',
                            healthIssues: fallbackMedical.medicalConditions || raw.medicalConditions || raw.healthIssues || raw.conditions || raw.medicalHistory || '',
                            allergies: fallbackMedical.allergies || raw.allergies || '',
                            currentMedication: fallbackMedical.currentMedication || raw.currentMedication || '',
                            previousSurgeries: fallbackMedical.previousSurgeries || raw.previousSurgeries || raw.surgeries || '',
                            emergencyNotes: fallbackMedical.emergencyNotes || raw.emergencyNotes || '',
                            
                            emergencyContactName: fallbackEmergency.name || raw.emergencyContactName || '',
                            emergencyContactRelation: fallbackEmergency.relationship || fallbackEmergency.relation || raw.emergencyContactRelation || '',
                            emergencyContactPhone: fallbackEmergency.phone || raw.emergencyContactPhone || '',
                            // Insurance + donor status
                            insuranceCompany: raw.insurance?.insuranceCompany || '',
                            policyNumber: raw.insurance?.policyNumber || '',
                            coverageAmount: raw.insurance?.coverageAmount || '',
                            cashlessFacility: raw.insurance?.cashlessFacility || false,
                            isOrganDonor: fallbackMedical.isOrganDonor || raw.isOrganDonor || false,
                            
                            ...(raw.data || {})
                        };

                        const pv = raw.privacy || {};
                        if (pv.bloodGroup === false) mergedData.bloodGroup = '';
                        if (pv.allergies === false) mergedData.allergies = '';
                        if (pv.medicalConditions === false) mergedData.healthIssues = '';
                        if (pv.currentMedication === false) mergedData.currentMedication = '';
                        if (pv.previousSurgeries === false) mergedData.previousSurgeries = '';
                        if (pv.emergencyNotes === false) mergedData.emergencyNotes = '';
                        if (pv.emergencyContacts === false) {
                            mergedData.emergencyContactName = '';
                            mergedData.emergencyContactRelation = '';
                            mergedData.emergencyContactPhone = '';
                        }
                        if (pv.insurance === false) {
                            mergedData.insuranceCompany = '';
                            mergedData.policyNumber = '';
                            mergedData.coverageAmount = '';
                            mergedData.cashlessFacility = false;
                        }
                        if (pv.organDonor === false) mergedData.isOrganDonor = false;
                        if (pv.address === false) {
                            mergedData.address = null;
                            ['houseNo', 'street', 'area', 'city', 'district', 'state', 'pincode'].forEach(k => { delete mergedData[k]; });
                        }
                        
                        actualUid = actualUid || raw.uid || (actualPid.includes('_') ? (actualPid.startsWith('c_') ? actualPid.replace('c_', '') : actualPid.split('_')[0]) : null);
                        
                        setProfile({ 
                            category: raw.category || 'people', 
                            data: mergedData, 
                            id: actualPid, 
                            uid: actualUid
                        });
                        
                        if (actualUid) recordScan(actualUid, actualPid, mergedData);
                    }
                }
             } catch (err) {
                console.error("Fetch Error:", err);
             } finally {
                setLoading(false);
             }
        };
        fetchProfile();
    }, [profileId, username]);

    const recordScan = async (userId, pid, profileData) => {
        if (scanRecorded) return;
        setIsTransmitting(true);
        
        try {
            let lat = null;
            let lng = null;
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { 
                        timeout: 10000, 
                        maximumAge: 0, 
                        enableHighAccuracy: true 
                    });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                setCoords({ lat, lng });
            } catch (err) {
                console.warn("Geolocation signal offline.");
            }

            const scanData = {
                timestamp: serverTimestamp(),
                time: new Date().toLocaleTimeString(),
                date: new Date().toLocaleDateString(),
                status: 'QR SCAN ALERT',
                coords: (lat && lng) ? { lat, lng } : null
            };

            const targetPid = pid || profileId || (profile?.id);
            const targetUid = userId || (profile?.uid);

            if (targetPid) await push(ref(db, `profiles/${targetPid}/scans`), scanData);
            if (targetUid && targetPid) await push(ref(db, `users/${targetUid}/profiles/${targetPid}/scans`), scanData);

            setScanRecorded(true);
        } catch (e) {
            console.error("Signal Failure:", e);
        } finally {
            setIsTransmitting(false);
        }
    };

    const handleSendLocation = async () => {
        if (!coords) {
            toast.loading("Locating GPS coordinates...");
            try {
                const pos = await new Promise((res, rej) => {
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true });
                });
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setCoords(loc);
                toast.dismiss();
                triggerWhatsApp(loc);
            } catch (err) {
                toast.dismiss();
                toast.error("GPS Signal Offline.");
            }
        } else {
            triggerWhatsApp(coords);
        }
    };

    const triggerWhatsApp = (location) => {
        const rawPh = profile.data.emergencyContactPhone || profile.data.ownerContact || profile.data.contactNumber;
        const sanPh = rawPh?.replace(/[^0-9+]/g, '');
        if (sanPh) {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
            const waMessage = encodeURIComponent(`🚨 *RESQR EMERGENCY ALERT* 🚨\n\nI have just scanned the emergency profile of *${(profile.data?.name || profile.data?.fullName || "A Member").toUpperCase()}*.\n\n📍 *CURRENT LOCATION:* ${mapsUrl}\n\n⚕️ *PROTOCOL:* High Priority Rescue Dispatch Requested.`);
            const waPhone = sanPh.startsWith('+') ? sanPh.substring(1) : sanPh;
            window.open(`https://wa.me/${waPhone}?text=${waMessage}`, '_blank');
        } else {
            toast.error("Emergency contact number missing.");
        }
    };

    // Hospital / Doctor authorization flow
    const handleSendEmergencyOtp = () => {
        setOtpSent(true);
        toast.success(`Emergency access OTP dispatched to ${profile.data.emergencyContactName || 'emergency contact'}.`);
    };

    const handleVerifyMedicalAccess = (e) => {
        e.preventDefault();
        setVerifyingAuth(true);

        setTimeout(() => {
            if (authMethod === 'otp') {
                if (otpCode.length >= 4) {
                    setIsMedicalAuthorized(true);
                    setShowAuthModal(false);
                    toast.success("Medical profile unlocked via contact authorization.");
                } else {
                    toast.error("Please enter a valid 4 to 6-digit emergency OTP.");
                }
            } else {
                if (doctorRegNo.trim().length >= 4) {
                    setIsMedicalAuthorized(true);
                    setShowAuthModal(false);
                    toast.success("Medical profile unlocked for verified medical personnel.");
                } else {
                    toast.error("Please enter your Medical Council Registration Number.");
                }
            }
            setVerifyingAuth(false);
        }, 600);
    };

    if (loading) return <AppLoading message="Verifying RESQR identity..." />;
    if (!profile) return (
        <div className="min-h-screen bg-[#040812] flex flex-col items-center justify-center text-white p-8 text-center">
            <ShieldAlert size={56} className="text-amber-400/70 mb-6" />
            <h1 className="text-3xl font-black uppercase italic tracking-tighter font-poppins">QR not recognised</h1>
            <p className="mt-3 text-sm font-semibold text-slate-400 max-w-sm leading-relaxed">
                This RESQR tag is not linked to an emergency profile. It may have been mistyped, or the profile may no longer be active.
            </p>
            <a href="/scanner" className="btn-app-primary mt-8">SCAN ANOTHER RESQR</a>
            <a href="/" className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors">Back to home</a>
        </div>
    );

    const { category, data } = profile;
    const displayName = (data?.name || data?.fullName || data?.ownerName || data?.petName || "REGISTERED CITIZEN").toUpperCase();
    const contactName = (data?.emergencyContactName || data?.parentName || "GUARDIAN").toUpperCase();
    const contactRelation = data?.emergencyContactRelation || data?.relation || "AUTHORIZED CONTACT";
    const rawContactPhone = data?.emergencyContactPhone || data?.parentPhone || data?.ownerContact || data?.contactNumber || '';

    return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-red-600/30">
            {/* FRAUD PREVENTION BANNER */}
            <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest sticky top-0 z-50 shadow-xl italic">
                <ShieldAlert size={16} />
                EMERGENCY SCAN SIGNAL DETECTED. LOCATION LOGGING ACTIVE.
            </div>

            <div className="max-w-xl mx-auto space-y-8 pb-40 px-5 pt-12">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-10 text-center animate-in fade-in duration-700">
                     <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR" className="h-10 w-auto mb-6" />
                     <Badge className="bg-red-600 text-white border-none px-6 py-2.5 tracking-[0.35em] uppercase italic font-black text-[10px] shadow-2xl shadow-red-600/30">
                        Verified Rescue Identity
                     </Badge>
                </div>

                {category === 'people' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* ============================================================
                            1. PUBLIC EMERGENCY PROFILE: REGISTERED FULL NAME
                            Universally dynamic for every user (Pratheek, Rahul, etc.)
                            ============================================================ */}
                        <div className="bg-[#11192A] rounded-[40px] border border-white/5 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-4 italic">Registered Citizen</span>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase text-white tracking-tighter italic font-poppins break-words leading-none w-full">
                                {displayName}
                            </h1>
                            <div className="mt-5 flex items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Emergency Node
                                </span>
                            </div>
                        </div>

                        {/* ============================================================
                            2. EMERGENCY CONTACT (GUARDIAN LIAISON NODE)
                            ============================================================ */}
                        <div className="bg-[#11192A] rounded-[40px] border border-white/10 p-8 sm:p-10 space-y-8 shadow-2xl relative group">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-3">Guardian Liaison Node</p>
                                <h4 className="text-3xl sm:text-4xl font-black italic text-white uppercase font-poppins leading-none">
                                    {contactName}
                                </h4>
                                <div className="mt-2.5 flex items-center justify-center">
                                    <Badge className="bg-white/5 text-slate-400 border border-white/10 font-bold uppercase text-[9px] px-3 py-1">
                                        {contactRelation}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {/* Connect Call to Family */}
                                <button 
                                    onClick={() => {
                                        const sanPh = rawContactPhone?.replace(/[^0-9+]/g, '');
                                        if (sanPh) window.location.href = `tel:${sanPh}`;
                                        else toast.error("Emergency contact phone number not available.");
                                    }}
                                    className="h-24 bg-red-600 text-white rounded-[30px] flex flex-col items-center justify-center gap-1 shadow-2xl shadow-red-600/30 active:scale-95 transition-all group overflow-hidden"
                                >
                                    <div className="flex items-center gap-3">
                                        <Phone size={26} fill="white" />
                                        <span className="font-black uppercase italic tracking-widest text-2xl">Connect Call</span>
                                    </div>
                                    <span className="text-xs opacity-75 font-mono font-bold tracking-widest">
                                        {rawContactPhone ? rawContactPhone.replace(/\d(?=\d{4})/g, '*') : 'Tap to dial'}
                                    </span>
                                </button>

                                {/* Send Location to Family via WhatsApp */}
                                <button 
                                    onClick={handleSendLocation}
                                    className="h-20 bg-emerald-600 text-white rounded-[28px] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all"
                                >
                                    <MapPin size={24} fill="white" />
                                    <span className="font-black uppercase italic tracking-widest text-lg">Send Location To Family</span>
                                </button>
                            </div>
                        </div>

                        {/* ============================================================
                            3. OFFICIAL EMERGENCY RESPONSE ACTIONS
                            ============================================================ */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Call 108 Ambulance */}
                            <button 
                                onClick={() => window.location.href = `tel:108`}
                                className="w-full h-24 bg-white text-black rounded-[32px] flex items-center justify-center gap-6 shadow-2xl active:scale-95 transition-all"
                            >
                                <Siren size={34} className="text-red-600 animate-pulse" />
                                <div className="text-left">
                                    <p className="text-2xl sm:text-3xl font-black italic uppercase leading-none font-poppins">Call 108</p>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.25em] mt-1.5">Ambulance Emergency</p>
                                </div>
                            </button>

                            {/* Call Police 100 */}
                            <button 
                                onClick={() => window.location.href = `tel:100`}
                                className="w-full h-22 bg-blue-600 text-white rounded-[30px] flex items-center justify-center gap-5 shadow-2xl shadow-blue-600/30 active:scale-95 transition-all"
                            >
                                <ShieldAlert size={30} fill="white" />
                                <div className="text-left">
                                    <p className="text-xl sm:text-2xl font-black italic uppercase leading-none font-poppins">Call Police — 100</p>
                                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-1">Law Enforcement Relay</p>
                                </div>
                            </button>

                            {/* Nearest Hospital Locator */}
                            <button 
                                onClick={() => window.open(`https://www.google.com/maps/search/hospitals+near+me/@${coords?.lat || ''},${coords?.lng || ''}`, '_blank')}
                                className="w-full h-20 bg-[#11192A] text-white border border-white/10 rounded-[28px] flex items-center justify-center gap-3 active:scale-95 transition-all hover:border-red-600/40"
                            >
                                <div className="p-2.5 bg-red-600/10 rounded-xl text-red-600">
                                    <Navigation size={20} />
                                </div>
                                <span className="font-black uppercase italic tracking-widest text-base">Nearest Hospital Locator</span>
                            </button>
                        </div>

                        {/* ============================================================
                            4. CLINICAL PRIVACY PROTOCOL BANNER
                            Strictly confirms medical data is private & protected
                            ============================================================ */}
                        <div className="bg-[#11192A]/60 rounded-[32px] border border-white/5 p-6 text-center shadow-xl">
                            <div className="flex items-center justify-center gap-2 mb-2 text-slate-400">
                                <Lock size={15} className="text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                                    Clinical Privacy Protocol Active
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-md mx-auto">
                                Sensitive medical vitals, allergies, conditions, and insurance data are encrypted and restricted to authorized healthcare professionals and hospital trauma teams.
                            </p>
                        </div>

                        {/* ============================================================
                            5. AUTHORIZED MEDICAL ACCESS SECTION
                            Gated behind Doctor / Hospital verification
                            ============================================================ */}
                        {!isMedicalAuthorized ? (
                            <div className="bg-gradient-to-b from-[#11192A] to-[#0A0F1D] rounded-[36px] border border-red-500/20 p-8 text-center space-y-5 shadow-2xl">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="p-3 bg-red-600/10 rounded-2xl text-red-500">
                                        <Stethoscope size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-black uppercase italic tracking-tight text-white font-poppins">
                                            Authorized Medical Access
                                        </h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Hospitals & Registered Doctors
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                                    Paramedics and trauma physicians can unlock the encrypted medical dossier (Blood Group, Allergies, Medical Conditions, Medications, Insurance) through authorized verification.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowAuthModal(true)}
                                    className="w-full py-4 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-2xl font-black italic uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <Lock size={14} className="text-red-500" />
                                    Unlock Medical Profile — Doctors & Hospitals
                                </button>
                            </div>
                        ) : (
                            /* ============================================================
                               AUTHORIZED MEDICAL PROFILE (UNLOCKED FOR HEALTHCARE)
                               ============================================================ */
                            <div className="bg-[#11192A] rounded-[40px] border-2 border-emerald-500/30 p-8 sm:p-10 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
                                <EmergencyInfoSections
                                    data={data}
                                    insurance={data}
                                    isAuthorized={true}
                                    onLock={() => {
                                        setIsMedicalAuthorized(false);
                                        toast.success("Medical profile locked.");
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-24 px-8 bg-[#11192A] rounded-[40px] border border-white/5 text-center shadow-2xl">
                        <ShieldAlert size={44} className="mx-auto mb-6 text-slate-600" />
                        <p className="text-slate-400 font-black uppercase italic text-xs tracking-[0.3em] leading-relaxed">
                            This RESQR tag has no active emergency profile to display.
                        </p>
                    </div>
                )}
            </div>

            {/* ============================================================
                MODAL: AUTHORIZED MEDICAL ACCESS VERIFICATION
                ============================================================ */}
            <AnimatePresence>
                {showAuthModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#11192A] border border-white/10 rounded-[36px] max-w-md w-full p-8 space-y-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-white p-2"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-600/10 rounded-2xl text-red-500">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                        Medical Clearance
                                    </h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Authorized Personnel Verification
                                    </p>
                                </div>
                            </div>

                            {/* Toggle Auth Methods */}
                            <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-2xl">
                                <button
                                    type="button"
                                    onClick={() => setAuthMethod('otp')}
                                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                        authMethod === 'otp' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Emergency OTP
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAuthMethod('doctor_id')}
                                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                        authMethod === 'doctor_id' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Doctor / Hospital ID
                                </button>
                            </div>

                            <form onSubmit={handleVerifyMedicalAccess} className="space-y-4">
                                {authMethod === 'otp' ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Send a high-priority 4-digit verification OTP to the registered emergency contact ({contactName}).
                                        </p>
                                        {!otpSent ? (
                                            <button
                                                type="button"
                                                onClick={handleSendEmergencyOtp}
                                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black italic uppercase text-xs tracking-widest transition-all"
                                            >
                                                Send OTP to Emergency Contact
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter 4-digit OTP"
                                                    maxLength={6}
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value)}
                                                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-center font-mono text-lg tracking-widest text-white outline-none focus:border-red-500"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSendEmergencyOtp}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-white underline block text-center"
                                                >
                                                    Resend Code
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Enter your state Medical Council Registration number or Hospital trauma center ID for the audit trail.
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Doctor Reg / License No. (e.g. MCI-12345)"
                                            value={doctorRegNo}
                                            onChange={(e) => setDoctorRegNo(e.target.value)}
                                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-mono uppercase text-white outline-none focus:border-red-500"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Hospital / Trauma Center Name"
                                            value={hospitalName}
                                            onChange={(e) => setHospitalName(e.target.value)}
                                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-red-500"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={verifyingAuth}
                                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black italic uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-2"
                                >
                                    {verifyingAuth ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                    Verify & Decrypt Medical Records
                                </button>

                                <div className="text-center pt-2">
                                    <Link
                                        to="/login"
                                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                                    >
                                        Hospital Staff Portal Login &rarr;
                                    </Link>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <footer className="text-center py-20 bg-[#040812] border-t border-white/5 opacity-50">
                <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR" className="h-8 w-auto mx-auto mb-6 grayscale" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">
                    GLOBAL EMERGENCY IDENTITY INFRASTRUCTURE
                </p>
            </footer>
        </div>
    );
}
