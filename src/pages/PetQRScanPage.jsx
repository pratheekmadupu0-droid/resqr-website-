import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Phone, MapPin, Send, MessageCircle, AlertTriangle,
    Shield, CheckCircle2, Navigation, Loader2, User, Sparkles,
    HeartPulse, HelpCircle, X, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
    getPublicPetProfile, submitFoundPetLocation, logPetScan,
    maskContactNumber, PET_LOST_STATUS
} from '../lib/petService';
import ResqrLogo from '../components/branding/ResqrLogo';

export default function PetQRScanPage() {
    const { petId } = useParams();
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Modals & Actions
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [locating, setLocating] = useState(false);
    const [submittingReport, setSubmittingReport] = useState(false);

    // Found Pet Report Form
    const [reportForm, setReportForm] = useState({
        finderName: '',
        finderPhone: '',
        locationAddress: '',
        message: 'I have found your pet. Please reach out to me!',
    });

    useEffect(() => {
        const load = async () => {
            if (!petId) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            try {
                const profile = await getPublicPetProfile(petId);
                if (!profile) {
                    setNotFound(true);
                } else {
                    setPet(profile);
                    // Log the scan event for audit
                    logPetScan(profile.petId);
                }
            } catch (err) {
                console.error('Failed to load pet profile:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [petId]);

    const isLost = pet?.lostStatus === PET_LOST_STATUS.LOST;

    // Trigger Finder GPS location sharing
    const handleShareGpsLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        setLocating(true);
        const t = toast.loading('Acquiring precise GPS location...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                try {
                    await submitFoundPetLocation(pet.petId, {
                        latitude,
                        longitude,
                        accuracy,
                        locationAddress: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`,
                        finderName: reportForm.finderName || 'Kind Passerby',
                        finderPhone: reportForm.finderPhone || '',
                        message: 'A rescuer shared their current live GPS location with you.',
                    });
                    toast.success('Your GPS location has been sent to the pet owner!', { id: t, duration: 6000 });
                    setShowLocationModal(false);
                } catch (err) {
                    console.error('Failed to send location:', err);
                    toast.error('Failed to transmit location. Please try calling the owner directly.', { id: t });
                } finally {
                    setLocating(false);
                }
            },
            (error) => {
                console.warn('Geolocation error:', error);
                setLocating(false);
                toast.error('Unable to retrieve GPS coordinates. Please allow location permissions in your browser.', { id: t });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleReportFoundSubmit = async (e) => {
        e.preventDefault();
        setSubmittingReport(true);
        const t = toast.loading('Sending found pet report...');

        try {
            await submitFoundPetLocation(pet.petId, reportForm);
            toast.success('Thank you! Your report and contact details were sent to the pet owner.', { id: t, duration: 6000 });
            setShowReportModal(false);
        } catch (err) {
            console.error('Report submission failed:', err);
            toast.error(err.message || 'Failed to submit report.', { id: t });
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleCallOwner = () => {
        const ownerPhone = pet?.emergencyContacts?.primaryOwner?.phone;
        if (ownerPhone) {
            window.location.href = `tel:${ownerPhone}`;
        } else {
            toast.error('Direct dialer unavailable. Please use the Report Form.');
        }
    };

    const handleWhatsAppOwner = () => {
        const ownerPhone = pet?.emergencyContacts?.primaryOwner?.phone?.replace(/[^0-9]/g, '');
        if (ownerPhone) {
            const msg = encodeURIComponent(`Hello! I have scanned the RESQR tag on your pet "${pet.name}" (ID: ${pet.petId}). I have found your pet and want to help reunite you!`);
            window.open(`https://wa.me/${ownerPhone.length === 10 ? '91' + ownerPhone : ownerPhone}?text=${msg}`, '_blank');
        } else {
            toast.error('WhatsApp number unavailable.');
        }
    };

    const handleCallVet = () => {
        const vetPhone = pet?.emergencyContacts?.veterinarian?.phone;
        if (vetPhone) {
            window.location.href = `tel:${vetPhone}`;
        } else {
            toast.error('Veterinarian phone number not registered.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center p-6 text-white font-manrope">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-primary mx-auto" size={40} />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Retrieving Pet RESQR Identity...
                    </p>
                </div>
            </div>
        );
    }

    if (notFound || !pet) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center p-6 text-white font-manrope">
                <Card className="max-w-md w-full bg-[#090E1A] border-white/10 p-8 rounded-3xl text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                        <ShieldAlert size={36} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase font-poppins text-white">Pet Tag Not Found</h2>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            This Pet RESQR identifier could not be resolved or may have been deactivated by its owner.
                        </p>
                    </div>
                    <Link to="/" className="btn-app-primary w-full py-3 text-xs font-bold inline-flex items-center justify-center gap-2">
                        Return to RESQR Home
                    </Link>
                </Card>
            </div>
        );
    }

    const maskedOwnerPhone = maskContactNumber(pet.emergencyContacts?.primaryOwner?.phone);
    const maskedVetPhone = maskContactNumber(pet.emergencyContacts?.veterinarian?.phone);

    return (
        <div className="min-h-screen bg-[#040812] text-white py-8 px-4 sm:px-6 font-manrope">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header Brand */}
                <div className="flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <ResqrLogo className="h-7 w-auto object-contain" />
                    </Link>
                    <span className="text-[10px] font-mono text-primary font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        🐾 Pet Safety Tag
                    </span>
                </div>

                {/* LOST PET ALERT BANNER */}
                {isLost && (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-5 rounded-3xl bg-rose-600/20 border-2 border-rose-500 text-rose-200 shadow-2xl shadow-rose-600/30 text-center space-y-2 animate-pulse"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest">
                            🚨 THIS PET HAS BEEN MARKED AS LOST 🚨
                        </div>
                        <h3 className="text-lg font-black italic uppercase font-poppins text-white mt-1">
                            Please Help {pet.name} Get Home!
                        </h3>
                        <p className="text-xs text-rose-200 leading-relaxed font-medium">
                            {pet.lostNotes || 'The owner is actively searching. Please tap below to share your GPS location or contact the owner.'}
                        </p>
                    </motion.div>
                )}

                {/* Main Pet Safety Profile Card */}
                <Card className="p-6 sm:p-8 bg-[#090E1A] border-white/10 rounded-3xl shadow-2xl text-center space-y-6">
                    {/* Pet Photograph */}
                    <div className="relative inline-block mx-auto">
                        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-[#050914] border-4 border-white/10 overflow-hidden shadow-2xl mx-auto flex items-center justify-center">
                            {pet.photoUrl ? (
                                <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-5xl">🐾</div>
                            )}
                        </div>
                        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg shadow-primary/30">
                            {pet.species}
                        </span>
                    </div>

                    {/* Pet Name & Subtitle */}
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black italic uppercase font-poppins text-white">
                            {pet.name}
                        </h1>
                        <p className="text-sm text-primary italic font-bold mt-1">
                            &ldquo;Please help me get home safely.&rdquo;
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">
                            ID: <span className="text-white font-bold">{pet.petId}</span>
                        </p>
                    </div>

                    {/* Quick Physical Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-left p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">Breed</span>
                            <span className="font-bold text-white truncate block">{pet.breed || 'Companion'}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">Gender</span>
                            <span className="font-bold text-white block">{pet.gender || '—'}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">Age</span>
                            <span className="font-bold text-white block">{pet.age || '—'}</span>
                        </div>
                        {pet.colour && (
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500 block">Colour</span>
                                <span className="font-bold text-slate-300 block truncate">{pet.colour}</span>
                            </div>
                        )}
                        {pet.identificationMarkings && (
                            <div className="col-span-2">
                                <span className="text-[10px] font-bold uppercase text-slate-500 block">Markings</span>
                                <span className="font-bold text-slate-300 block truncate">{pet.identificationMarkings}</span>
                            </div>
                        )}
                    </div>

                    {/* Critical Medical Warnings */}
                    {(pet.criticalMedicalWarnings?.allergies || pet.criticalMedicalWarnings?.medicalConditions || pet.criticalMedicalWarnings?.medications) && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-300 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-400 font-black text-[10px] uppercase tracking-wider">
                                <AlertTriangle size={14} /> Medical & Care Alert
                            </div>
                            {pet.criticalMedicalWarnings.allergies && (
                                <p><strong className="text-white">Allergies:</strong> {pet.criticalMedicalWarnings.allergies}</p>
                            )}
                            {pet.criticalMedicalWarnings.medicalConditions && (
                                <p><strong className="text-white">Condition:</strong> {pet.criticalMedicalWarnings.medicalConditions}</p>
                            )}
                            {pet.criticalMedicalWarnings.medications && (
                                <p><strong className="text-white">Daily Medication:</strong> {pet.criticalMedicalWarnings.medications}</p>
                            )}
                        </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="space-y-3 pt-2">
                        {/* 1. Contact Owner Button */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleCallOwner}
                                className="btn-app-primary py-3.5 px-4 text-xs font-black italic uppercase inline-flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                            >
                                <Phone size={16} /> Call Owner
                            </button>
                            <button
                                type="button"
                                onClick={handleWhatsAppOwner}
                                className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black italic uppercase inline-flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition-all"
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                        </div>

                        {/* 2. Share Live Location */}
                        <button
                            type="button"
                            onClick={handleShareGpsLocation}
                            disabled={locating}
                            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black italic uppercase inline-flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all"
                        >
                            {locating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Transmitting GPS Coordinates...
                                </>
                            ) : (
                                <>
                                    <Navigation size={16} /> Send My Location to Owner
                                </>
                            )}
                        </button>

                        {/* 3. Leave a Found Pet Report */}
                        <button
                            type="button"
                            onClick={() => setShowReportModal(true)}
                            className="w-full btn-app-secondary py-3 px-6 text-xs font-bold inline-flex items-center justify-center gap-2"
                        >
                            <MapPin size={16} /> Report Found Pet Details
                        </button>

                        {/* 4. Contact Veterinarian (if available) */}
                        {pet.criticalMedicalWarnings?.veterinarianContact && (
                            <button
                                type="button"
                                onClick={handleCallVet}
                                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                            >
                                <HeartPulse size={14} className="text-primary" />
                                Contact Registered Vet ({pet.criticalMedicalWarnings.veterinarianName || 'Clinic'})
                            </button>
                        )}
                    </div>

                    {/* Masked Owner Privacy Notice */}
                    <div className="pt-4 border-t border-white/5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                        <Shield size={12} className="text-emerald-400 shrink-0" />
                        <span>Protected by RESQR Masked Relay · {maskedOwnerPhone}</span>
                    </div>
                </Card>
            </div>

            {/* FOUND PET REPORT MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                    <div className="relative w-full max-w-md bg-[#090E1A] border border-white/10 rounded-3xl p-6 text-white shadow-2xl my-8">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                            <div>
                                <h3 className="text-lg font-black italic uppercase font-poppins text-white">Report Found Pet</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Let the owner know where and how to reach you.</p>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleReportFoundSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    placeholder="Your Name / Rescuer"
                                    value={reportForm.finderName}
                                    onChange={(e) => setReportForm({ ...reportForm, finderName: e.target.value })}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">Your Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="Mobile number for owner to call back"
                                    value={reportForm.finderPhone}
                                    onChange={(e) => setReportForm({ ...reportForm, finderPhone: e.target.value })}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">Found Location / Landmark</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Near Central Park gate 3, Starbucks Cafe"
                                    value={reportForm.locationAddress}
                                    onChange={(e) => setReportForm({ ...reportForm, locationAddress: e.target.value })}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">Message to Owner</label>
                                <textarea
                                    rows={3}
                                    placeholder="Where is the pet currently held? Are they safe?"
                                    value={reportForm.message}
                                    onChange={(e) => setReportForm({ ...reportForm, message: e.target.value })}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="btn-app-secondary py-2 px-4 font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReport}
                                    className="btn-app-primary py-2 px-6 font-bold inline-flex items-center gap-1.5"
                                >
                                    {submittingReport ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Submit Alert
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
