import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Phone, MapPin, AlertCircle, Heart, Activity as ActivityIcon, Info, Loader2, 
    Lock, Navigation, Building2, Shield, ChevronRight, ShieldAlert, CheckCircle2, 
    Key, Siren, Droplet, HeartPulse, Pill, Scissors, CreditCard, X, Stethoscope, Unlock, Clock, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useParams, Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { ref, get, push, serverTimestamp } from 'firebase/database';
import toast from 'react-hot-toast';
import HospitalFaceVerificationModal from '../components/biometrics/HospitalFaceVerificationModal';
import QRScanIdentityGate from '../components/biometrics/QRScanIdentityGate';
import RenewalModal from '../components/subscription/RenewalModal';
import { fetchAuthorizedMedicalProfile, logMedicalAccessAudit, validatePublicEmergencySession } from '../lib/medicalApi';

export default function EmergencyPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [isIdentityVerified, setIsIdentityVerified] = useState(false);
    const [scanRecorded, setScanRecorded] = useState(false);
    const [coords, setCoords] = useState(null);
    const [isTransmitting, setIsTransmitting] = useState(false);
    
    // Subscription status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED'
    const [subscriptionStatus, setSubscriptionStatus] = useState('ACTIVE');
    const [subscriptionData, setSubscriptionData] = useState(null);
    const [showRenewalModal, setShowRenewalModal] = useState(false);

    // Public Emergency Profile State (STRICTLY SANITIZED - ZERO MEDICAL DATA)
    const [publicUser, setPublicUser] = useState({
        name: "REGISTERED CITIZEN",
        emergencyContact: {
            name: "GUARDIAN",
            phone: "",
            relation: "AUTHORIZED CONTACT"
        },
        payment_status: 'paid'
    });

    // Authorized Healthcare / Medical Access States
    const [isMedicalAuthorized, setIsMedicalAuthorized] = useState(false);
    const [authorizedMedicalData, setAuthorizedMedicalData] = useState(null);
    const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
    const [sessionRemainingSec, setSessionRemainingSec] = useState(0);

    // Biometric & Alternate Verification States
    const [showBiometricModal, setShowBiometricModal] = useState(false);
    const [showAlternateModal, setShowAlternateModal] = useState(false);
    const [biometricProfile, setBiometricProfile] = useState(null);
    const [resolvedPatientId, setResolvedPatientId] = useState(id || '');

    // Alternate Override Form
    const [doctorRegNo, setDoctorRegNo] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [overrideReason, setOverrideReason] = useState('UNCONSCIOUS_TRAUMA_OVERRIDE');
    const [submittingOverride, setSubmittingOverride] = useState(false);

    // Session Timer Countdown
    useEffect(() => {
        if (!sessionExpiresAt) return;
        const interval = setInterval(() => {
            const left = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
            setSessionRemainingSec(left);
            if (left <= 0) {
                setIsMedicalAuthorized(false);
                setAuthorizedMedicalData(null);
                setSessionExpiresAt(null);
                toast.error("Medical access session expired. Clinical re-verification required.");
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiresAt]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return setLoading(false);
            try {
                let snap = null;
                let actualUid = null;
                let actualPid = id;
                let resolvedPath = null;

                if (id.includes('_')) {
                    actualUid = id.startsWith('c_') ? id.replace('c_', '') : id.split('_')[0];
                    resolvedPath = `users/${actualUid}/profiles/${id}`;
                    snap = await get(ref(db, resolvedPath));
                }

                if (!snap || !snap.exists()) {
                    const regSnap = await get(ref(db, `usernames/${id.toLowerCase()}`));
                    if (regSnap.exists()) {
                        const path = regSnap.val();
                        resolvedPath = path.startsWith('users/') ? path : `users/${path}`;
                        snap = await get(ref(db, resolvedPath));
                        
                        const parts = path.split('/');
                        actualUid = parts[0] === 'users' ? parts[1] : parts[0];
                        actualPid = parts[parts.length - 1];
                    }
                }

                if (!snap || !snap.exists()) {
                    resolvedPath = `profiles/${id}`;
                    snap = await get(ref(db, resolvedPath));
                }

                setResolvedPatientId(actualPid);

                // Check for valid unexpired emergency verification session in current browser tab
                const existingToken = sessionStorage.getItem(`resqr_emergency_token_${actualPid}`);
                if (existingToken && validatePublicEmergencySession(actualPid, existingToken)) {
                    setIsIdentityVerified(true);
                    try {
                        const clinicalData = await fetchAuthorizedMedicalProfile(actualPid, existingToken);
                        if (clinicalData) {
                            setAuthorizedMedicalData(clinicalData);
                            setIsMedicalAuthorized(true);
                            setSessionExpiresAt(clinicalData.authorizedUntil || (Date.now() + 15 * 60 * 1000));
                        }
                    } catch (e) {
                        console.warn("Session restore medical fetch note:", e);
                    }
                }

                if (snap.exists()) {
                    const raw = snap.val();
                    const fallbackEmergency = raw.emergencyContacts?.[0] || {};

                    // SANITIZED PUBLIC EMERGENCY DATA ONLY
                    // Section 3: Do NOT populate blood group, allergies, conditions, medications, insurance
                    const publicData = {
                        name: (raw.name || raw.fullName || raw.ownerName || "REGISTERED CITIZEN").toString().toUpperCase(),
                        payment_status: raw.payment_status || 'paid',
                        emergencyContact: {
                            name: raw.emergencyContactName || fallbackEmergency.name || "GUARDIAN",
                            relation: raw.emergencyContactRelation || fallbackEmergency.relationship || fallbackEmergency.relation || "AUTHORIZED CONTACT",
                            phone: raw.emergencyContactPhone || fallbackEmergency.phone || ""
                        }
                    };
                    setPublicUser(publicData);
                    recordScan(actualUid, actualPid);

                    // Fetch biometric template metadata for hospital verification
                    try {
                        let bioSnap = await get(ref(db, `biometricProfiles/${actualPid}`));
                        if (!bioSnap.exists() && actualUid) {
                            bioSnap = await get(ref(db, `users/${actualUid}/biometricProfiles/${actualPid}`));
                        }
                        if (bioSnap.exists()) {
                            setBiometricProfile(bioSnap.val());
                        }
                    } catch (err) {
                        console.warn("Could not preload biometric profile:", err);
                    }

                    // Fetch and evaluate subscription status
                    try {
                        let sub = raw.subscription || null;
                        if (!sub) {
                            const subSnap = await get(ref(db, `subscriptions/${actualPid}`));
                            if (subSnap.exists()) {
                                sub = subSnap.val();
                            } else if (actualUid) {
                                const uSubSnap = await get(ref(db, `users/${actualUid}/subscription`));
                                if (uSubSnap.exists()) sub = uSubSnap.val();
                            }
                        }
                        if (sub) {
                            setSubscriptionData(sub);
                            if (sub.status === 'REVOKED') {
                                setSubscriptionStatus('REVOKED');
                            } else if (sub.status === 'SUSPENDED') {
                                setSubscriptionStatus('SUSPENDED');
                            } else if (sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now()) {
                                setSubscriptionStatus('EXPIRED');
                            } else if (sub.expiresAt) {
                                const days = Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                if (days <= 7) {
                                    setSubscriptionStatus('EXPIRING_SOON');
                                } else {
                                    setSubscriptionStatus('ACTIVE');
                                }
                            }
                        }
                    } catch (subErr) {
                        console.warn("Could not load subscription details:", subErr);
                    }
                }
            } catch (error) {
                console.error("Profile Load Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    const recordScan = async (actualUid, actualPid) => {
        if (scanRecorded) return;
        setIsTransmitting(true);
        try {
            let lat = null;
            let lng = null;
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                setCoords({ lat, lng });
            } catch (err) {}

            const scanData = {
                timestamp: serverTimestamp(),
                time: new Date().toLocaleTimeString(),
                date: new Date().toLocaleDateString(),
                status: 'QR Scan Alert',
                coords: (lat && lng) ? { lat, lng } : null
            };

            await push(ref(db, `profiles/${actualPid}/scans`), scanData);
            if (actualUid && actualPid) {
                await push(ref(db, `users/${actualUid}/profiles/${actualPid}/scans`), scanData);
            }
            setScanRecorded(true);
        } catch (e) {
            console.error("Scan recording failed", e);
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
                toast.error("GPS Signal Offline. Please enable device location.");
            }
        } else {
            triggerWhatsApp(coords);
        }
    };

    const triggerWhatsApp = (location) => {
        const rawPh = publicUser.emergencyContact.phone;
        const sanPh = rawPh?.replace(/[^0-9+]/g, '');
        if (sanPh) {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
            const waMessage = encodeURIComponent(`🚨 *RESQR EMERGENCY ALERT* 🚨\n\nI have just scanned the emergency identity of *${publicUser.name}*.\n\n📍 *CURRENT LOCATION:* ${mapsUrl}\n\n⚕️ *PROTOCOL:* High Priority Rescue Dispatch Requested.`);
            const waPhone = sanPh.startsWith('+') ? sanPh.substring(1) : sanPh;
            window.open(`https://wa.me/${waPhone}?text=${waMessage}`, '_blank');
        } else {
            toast.error("Emergency contact phone number not available.");
        }
    };

    // On Biometric Verification Success
    const handleBiometricSuccess = async (matchDetails) => {
        setShowBiometricModal(false);
        try {
            const token = matchDetails.token;
            const medicalData = await fetchAuthorizedMedicalProfile(resolvedPatientId, token);
            setAuthorizedMedicalData(medicalData);
            setIsMedicalAuthorized(true);
            setSessionExpiresAt(Date.now() + (matchDetails.expiresIn || 900) * 1000);
            toast.success("Medical dossier unlocked with active 15-minute clinical session.");
        } catch (err) {
            toast.error(err.message || "Failed to retrieve authorized medical dossier.");
        }
    };

    // Alternate Verification Clinical Override (Section 17 & 18)
    const handleAlternateOverrideSubmit = async (e) => {
        e.preventDefault();
        if (!doctorRegNo.trim() || !hospitalName.trim()) {
            toast.error("Please enter your Medical Council Registration number and Hospital name.");
            return;
        }

        setSubmittingOverride(true);
        try {
            // Log alternate clinical override to audit trail
            await logMedicalAccessAudit({
                hospitalId: hospitalName,
                hospitalName: hospitalName,
                doctorId: doctorRegNo,
                patientId: resolvedPatientId,
                qrId: id,
                result: 'AUTHORIZED_OVERRIDE',
                accessType: 'clinical_override',
                reason: overrideReason
            });

            // Fetch medical record with override token
            let targetUid = resolvedPatientId.includes('_') ? (resolvedPatientId.startsWith('c_') ? resolvedPatientId.replace('c_', '') : resolvedPatientId.split('_')[0]) : resolvedPatientId;
            let snap = await get(ref(db, `users/${targetUid}/profiles/${resolvedPatientId}`));
            if (!snap.exists()) {
                snap = await get(ref(db, `profiles/${resolvedPatientId}`));
            }

            if (snap.exists()) {
                const raw = snap.val();
                const medical = raw.medical || {};
                setAuthorizedMedicalData({
                    name: raw.name || raw.fullName || publicUser.name,
                    bloodGroup: medical.bloodGroup || raw.bloodGroup || '',
                    allergies: medical.allergies || raw.allergies || '',
                    medicalConditions: medical.medicalConditions || raw.medicalConditions || raw.healthIssues || raw.conditions || '',
                    currentMedication: medical.currentMedication || raw.currentMedication || '',
                    previousSurgeries: medical.previousSurgeries || raw.previousSurgeries || raw.surgeries || '',
                    emergencyNotes: medical.emergencyNotes || raw.emergencyNotes || '',
                    isOrganDonor: Boolean(medical.isOrganDonor ?? raw.isOrganDonor),
                    insurance: raw.insurance || medical.insurance || {},
                    medicalId: medical.medicalId || raw.medicalId || '',
                    authorizedUntil: Date.now() + 15 * 60 * 1000
                });
                setIsMedicalAuthorized(true);
                setSessionExpiresAt(Date.now() + 15 * 60 * 1000);
                setShowAlternateModal(false);
                toast.success("Emergency Trauma Clinical Override logged and approved.");
            } else {
                toast.error("Patient record could not be located.");
            }
        } catch (err) {
            console.error("Clinical override error:", err);
            toast.error("Clinical override verification failed.");
        } finally {
            setSubmittingOverride(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center">
                <Loader2 className="text-red-600 animate-spin" size={48} />
            </div>
        );
    }

    // Section 6: Emergency Scan Subscription Check
    if (subscriptionStatus === 'EXPIRED') {
        return (
            <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-red-600/30">
                <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest sticky top-0 z-50 shadow-xl italic">
                    <AlertTriangle size={16} />
                    QR SUBSCRIPTION EXPIRED — ACCESS RESTRICTED
                </div>

                <div className="max-w-xl mx-auto px-5 py-12 text-center">
                    <div className="flex flex-col items-center mb-6">
                        <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR" className="h-10 w-auto mb-6" />
                        <div className="w-20 h-20 bg-red-600/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert size={40} className="text-red-500" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 mb-3">
                            ● EXPIRED
                        </span>
                        <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2">
                            QR Subscription Expired
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                            Please renew subscription to access emergency services and full medical details.
                        </p>
                    </div>

                    {/* Emergency Contact Calling (Only phone call available) */}
                    <div className="p-6 bg-slate-900/60 border border-white/10 rounded-3xl mb-6 text-left space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">
                            Designated Emergency Contact
                        </h3>
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Citizen Name</span>
                            <span className="text-sm font-bold text-white uppercase">{publicUser.name}</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact</span>
                            <span className="text-sm font-bold text-white">{publicUser.emergencyContact.name} ({publicUser.emergencyContact.relation})</span>
                        </div>

                        {publicUser.emergencyContact.phone ? (
                            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <a 
                                    href={`tel:${publicUser.emergencyContact.phone.replace(/[^0-9+]/g, '')}`}
                                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                                >
                                    <Phone size={16} /> Call Kin ({publicUser.emergencyContact.phone})
                                </a>
                                <button
                                    onClick={handleSendLocation}
                                    className="w-full py-4 px-6 bg-primary hover:bg-red-700 text-white rounded-2xl font-black italic uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                                >
                                    <Navigation size={16} /> Send Location
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic">No emergency phone number recorded.</p>
                        )}
                    </div>

                    {/* Option to renew */}
                    <div className="p-6 bg-gradient-to-br from-red-950/40 via-slate-900/60 to-slate-950 border border-red-500/20 rounded-3xl mb-8">
                        <h3 className="text-base font-black uppercase italic tracking-tight text-white mb-2">
                            Continuous Protection Required
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">
                            Renew your subscription to reactivate 1:1 facial verification and emergency responder clinical dossiers immediately.
                        </p>
                        <Button 
                            onClick={() => setShowRenewalModal(true)}
                            className="w-full py-5 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                        >
                            Renew Subscription (Starting ₹299)
                        </Button>
                    </div>

                    <Link to="/" className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                        Return to RESQR Homepage
                    </Link>
                </div>

                <RenewalModal 
                    isOpen={showRenewalModal}
                    onClose={() => setShowRenewalModal(false)}
                    qrId={resolvedPatientId}
                    currentExpiry={subscriptionData?.expiresAt}
                    holderName={publicUser.name}
                    onRenewalComplete={() => window.location.reload()}
                />
            </div>
        );
    }

    if (subscriptionStatus === 'SUSPENDED') {
        return (
            <div className="min-h-screen bg-[#040812] text-white font-manrope flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900/80 border border-amber-500/30 p-8 rounded-3xl space-y-6">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">Account Suspended - Contact Support</h2>
                        <p className="text-slate-400 text-xs mt-2">
                            This RESQR account has been suspended. Please contact customer support for assistance.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 text-xs text-slate-300">
                        <p className="font-bold">Support Email:</p>
                        <a href="mailto:support@resqr.co.in" className="text-primary underline">support@resqr.co.in</a>
                    </div>
                    {publicUser.emergencyContact.phone && (
                        <a 
                            href={`tel:${publicUser.emergencyContact.phone.replace(/[^0-9+]/g, '')}`}
                            className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Phone size={16} /> Call Emergency Contact
                        </a>
                    )}
                </div>
            </div>
        );
    }

    if (subscriptionStatus === 'REVOKED') {
        return (
            <div className="min-h-screen bg-[#040812] text-white font-manrope flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900/80 border border-red-500/30 p-8 rounded-3xl space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">QR Code Invalid / Deactivated</h2>
                        <p className="text-slate-400 text-xs mt-2">
                            This emergency QR token has been revoked or deactivated by system administrators.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 text-xs text-slate-300">
                        <p className="font-bold">Contact Support:</p>
                        <a href="mailto:support@resqr.co.in" className="text-primary underline">support@resqr.co.in</a>
                    </div>
                </div>
            </div>
        );
    }

    // MANDATORY BIOMETRIC SECURITY GATE: Profile data completely locked until identity verified
    if (!isIdentityVerified) {
        return (
            <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-red-600/30">
                <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest sticky top-0 z-50 shadow-xl italic">
                    <ShieldAlert size={16} />
                    RESQR SCAN DETECTED. IDENTITY VERIFICATION REQUIRED BEFORE ACCESS.
                </div>

                <div className="max-w-xl mx-auto px-5 pt-8">
                    <div className="flex flex-col items-center mb-6 text-center">
                        <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR" className="h-10 w-auto mb-4" />
                    </div>

                    <QRScanIdentityGate
                        patientId={resolvedPatientId}
                        qrId={id || resolvedPatientId}
                        onVerificationSuccess={async ({ token, expiresAt }) => {
                            sessionStorage.setItem(`resqr_emergency_token_${resolvedPatientId}`, token);
                            setIsIdentityVerified(true);
                            toast.success("✓ Identity confirmed. Emergency profile unlocked.");
                            try {
                                const clinicalData = await fetchAuthorizedMedicalProfile(resolvedPatientId, token);
                                if (clinicalData) {
                                    setAuthorizedMedicalData(clinicalData);
                                    setIsMedicalAuthorized(true);
                                    setSessionExpiresAt(expiresAt || (Date.now() + 15 * 60 * 1000));
                                }
                            } catch (e) {
                                console.warn("Auto-decrypt medical profile note:", e);
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-red-600/30">
            {subscriptionStatus === 'EXPIRING_SOON' && (
                <div className="bg-amber-600 text-white px-6 py-2.5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider sticky top-0 z-50 shadow-md">
                    <AlertTriangle size={15} />
                    <span>QR Subscription Expiring Soon ({subscriptionData?.expiresAt ? new Date(subscriptionData.expiresAt).toLocaleDateString('en-IN') : 'Within 7 days'}). Continuous protection recommended.</span>
                </div>
            )}
            {/* FRAUD PREVENTION & TELEMETRY BANNER */}
            <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest sticky top-0 z-50 shadow-xl italic">
                <ShieldAlert size={16} />
                EMERGENCY SCAN SIGNAL DETECTED. LOCATION LOGGING ACTIVE.
            </div>

            <div className="max-w-xl mx-auto space-y-8 pb-40 px-5 pt-12">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-6 text-center animate-in fade-in duration-700">
                    <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR" className="h-10 w-auto mb-6" />
                    <Badge className="bg-red-600 text-white border-none px-6 py-2.5 tracking-[0.35em] uppercase italic font-black text-[10px] shadow-2xl shadow-red-600/30">
                        Verified Rescue Identity
                    </Badge>
                </div>

                {/* Identity Verification Control Badge */}
                <div className="flex items-center justify-between px-2 pb-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={13} /> Biometrically Verified Citizen
                    </span>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem(`resqr_emergency_token_${resolvedPatientId}`);
                            setIsIdentityVerified(false);
                            setIsMedicalAuthorized(false);
                            setAuthorizedMedicalData(null);
                            setSessionExpiresAt(null);
                            toast("Profile locked. Face verification required.");
                        }}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition-all cursor-pointer"
                    >
                        <Lock size={12} /> Lock & Re-Verify
                    </button>
                </div>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* ============================================================
                        1. PUBLIC EMERGENCY PROFILE: REGISTERED USER NAME
                        (Section 3: ONLY User Name visible to bystanders)
                        ============================================================ */}
                    <div className="bg-[#11192A] rounded-[40px] border border-white/5 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-4 italic">Registered Citizen</span>
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase text-white tracking-tighter italic font-poppins break-words leading-none w-full">
                            {publicUser?.name || "REGISTERED USER"}
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
                                {(publicUser?.emergencyContact?.name || "GUARDIAN").toUpperCase()}
                            </h4>
                            <div className="mt-2.5 flex items-center justify-center">
                                <Badge className="bg-white/5 text-slate-400 border border-white/10 font-bold uppercase text-[9px] px-3 py-1">
                                    {publicUser?.emergencyContact?.relation || "AUTHORIZED CONTACT"}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Call Emergency Contact */}
                            <button 
                                onClick={() => {
                                    const rawPh = publicUser.emergencyContact.phone;
                                    const sanPh = rawPh?.replace(/[^0-9+]/g, '');
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
                                    {publicUser.emergencyContact.phone ? publicUser.emergencyContact.phone.replace(/\d(?=\d{4})/g, '*') : 'Tap to dial'}
                                </span>
                            </button>

                            {/* Send Location To Family via WhatsApp */}
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
                        (Section 3: Call 108 Ambulance, Police 100, Nearest Hospital)
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
                        Explicitly communicates separation of data
                        ============================================================ */}
                    <div className="bg-[#11192A]/60 rounded-[32px] border border-white/5 p-6 text-center shadow-xl">
                        <div className="flex items-center justify-center gap-2 mb-2 text-slate-400">
                            <Lock size={15} className="text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                                Clinical Privacy Protocol Active
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-md mx-auto">
                            Sensitive medical history, vitals, and insurance are encrypted and restricted to authorized healthcare professionals and hospital trauma teams.
                        </p>
                    </div>

                    {/* ============================================================
                        5. AUTHORIZED MEDICAL ACCESS SECTION
                        Accessible only by Doctors / Hospitals via Face Verification
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
                                Emergency trauma doctors and ICU centers can unlock the encrypted medical dossier (Blood Group, Allergies, Medical Conditions, Medications, Insurance) via biometric face verification.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowBiometricModal(true)}
                                className="w-full py-4 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-2xl font-black italic uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Lock size={14} className="text-red-500" />
                                Initiate Patient Face Verification
                            </button>
                        </div>
                    ) : (
                        /* ============================================================
                           AUTHORIZED MEDICAL DOSSIER (UNLOCKED AFTER BIOMETRIC VERIFICATION)
                           ============================================================ */
                        <div className="bg-[#11192A] rounded-[40px] border-2 border-emerald-500/30 p-8 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
                            <div className="flex items-center justify-between border-b border-white/10 pb-5 flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                                        <Unlock size={22} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest mb-1">
                                                Authorized Healthcare Access
                                            </Badge>
                                            {sessionRemainingSec > 0 && (
                                                <span className="text-[9px] font-mono font-bold text-amber-400 flex items-center gap-1">
                                                    <Clock size={11} /> {Math.floor(sessionRemainingSec / 60)}:{(sessionRemainingSec % 60).toString().padStart(2, '0')}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                            Decrypted Medical Dossier
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsMedicalAuthorized(false);
                                        setAuthorizedMedicalData(null);
                                        setSessionExpiresAt(null);
                                        toast.success("Medical dossier locked.");
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1"
                                >
                                    <Lock size={12} /> Lock Profile
                                </button>
                            </div>

                            {/* Critical Vitals: Blood Group & Organ Donor */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-red-600 text-white rounded-3xl p-6 text-center shadow-xl shadow-red-600/20">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-1.5 text-white/80">
                                        <Droplet size={13} /> Blood Group
                                    </p>
                                    <p className="text-6xl font-black italic tracking-tighter leading-none mt-2">
                                        {authorizedMedicalData?.bloodGroup || 'N/A'}
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-center text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                                        Organ Donor Status
                                    </p>
                                    <p className="text-xl font-black italic uppercase text-emerald-400">
                                        {authorizedMedicalData?.isOrganDonor ? 'Registered Donor' : 'Not Registered'}
                                    </p>
                                </div>
                            </div>

                            {/* Medical Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} /> Critical Allergies
                                    </p>
                                    <p className="text-base font-black italic uppercase text-white">
                                        {authorizedMedicalData?.allergies || 'No known allergies reported'}
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2 mb-2">
                                        <HeartPulse size={14} /> Chronic Conditions
                                    </p>
                                    <p className="text-base font-black italic uppercase text-white">
                                        {authorizedMedicalData?.medicalConditions || 'No chronic conditions recorded'}
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2 mb-2">
                                        <Pill size={14} /> Current Medications
                                    </p>
                                    <p className="text-base font-black italic uppercase text-white">
                                        {authorizedMedicalData?.currentMedication || 'None recorded'}
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2 mb-2">
                                        <Scissors size={14} /> Previous Surgeries
                                    </p>
                                    <p className="text-base font-black italic uppercase text-white">
                                        {authorizedMedicalData?.previousSurgeries || 'None recorded'}
                                    </p>
                                </div>
                            </div>

                            {authorizedMedicalData?.emergencyNotes && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 flex items-center gap-2 mb-2">
                                        <Info size={14} /> Emergency Clinical Notes
                                    </p>
                                    <p className="text-sm font-bold text-slate-200 leading-relaxed">
                                        {authorizedMedicalData.emergencyNotes}
                                    </p>
                                </div>
                            )}

                            {/* Insurance Details */}
                            {authorizedMedicalData?.insurance && (authorizedMedicalData.insurance.insuranceCompany || authorizedMedicalData.insurance.policyNumber) && (
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 flex items-center gap-2">
                                        <CreditCard size={14} /> Health Insurance Cover
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                        {authorizedMedicalData.insurance.insuranceCompany && (
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Provider</p>
                                                <p className="text-sm font-black italic uppercase text-white mt-0.5">{authorizedMedicalData.insurance.insuranceCompany}</p>
                                            </div>
                                        )}
                                        {authorizedMedicalData.insurance.policyNumber && (
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Policy No.</p>
                                                <p className="text-sm font-black italic uppercase text-white mt-0.5">{authorizedMedicalData.insurance.policyNumber}</p>
                                            </div>
                                        )}
                                        {authorizedMedicalData.insurance.coverageAmount && (
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Coverage</p>
                                                <p className="text-sm font-black italic uppercase text-white mt-0.5">₹{authorizedMedicalData.insurance.coverageAmount}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================
                BIOMETRIC FACE VERIFICATION MODAL
                ============================================================ */}
            <HospitalFaceVerificationModal
                isOpen={showBiometricModal}
                onClose={() => setShowBiometricModal(false)}
                patientName={publicUser.name}
                patientId={resolvedPatientId}
                qrId={id}
                biometricProfile={biometricProfile}
                doctorInfo={{
                    regNo: doctorRegNo || 'STAFF_DOCTOR',
                    hospitalName: hospitalName || 'Emergency Trauma Center'
                }}
                onVerificationSuccess={handleBiometricSuccess}
                onAlternateOverride={() => {
                    setShowBiometricModal(false);
                    setShowAlternateModal(true);
                }}
            />

            {/* ============================================================
                MODAL: AUTHORIZED ALTERNATE CLINICAL OVERRIDE
                (Section 17 & 18: Used when face is obstructed, severely injured, or inconclusive)
                ============================================================ */}
            <AnimatePresence>
                {showAlternateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#11192A] border border-white/10 rounded-[36px] max-w-md w-full p-8 space-y-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowAlternateModal(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-white p-2"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                        Authorized Alternate Override
                                    </h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        Clinical Trauma Audit Protocol
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                                Used when patient face verification is inconclusive due to severe facial trauma, bandages, or optical obstruction. All overrides are permanently recorded in the institutional audit log.
                            </p>

                            <form onSubmit={handleAlternateOverrideSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Doctor Reg / License No. (e.g. MCI-98214)"
                                    value={doctorRegNo}
                                    onChange={(e) => setDoctorRegNo(e.target.value)}
                                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-mono uppercase text-white outline-none focus:border-amber-500"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Hospital / Trauma Center Name"
                                    value={hospitalName}
                                    onChange={(e) => setHospitalName(e.target.value)}
                                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-amber-500"
                                    required
                                />
                                <select
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-slate-300 outline-none focus:border-amber-500"
                                >
                                    <option value="UNCONSCIOUS_TRAUMA_OVERRIDE">Unconscious Patient with Facial Trauma</option>
                                    <option value="OBSTRUCTED_BANDAGES">Severe Injuries / Medical Bandages Obscuring Face</option>
                                    <option value="CRITICAL_LIFE_SAVING_MEASURE">Immediate Life Saving Resuscitation Protocol</option>
                                </select>

                                <button
                                    type="submit"
                                    disabled={submittingOverride}
                                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black italic uppercase text-xs tracking-widest transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    {submittingOverride ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                    Log Override & Decrypt Dossier
                                </button>
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
