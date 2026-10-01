import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Shield, Plus, QrCode, Download, Edit3, Trash2,
    Clock, Loader2, Eye, Lock, RefreshCw, X, ExternalLink,
    AlertTriangle, CheckCircle2, MapPin, Phone, MessageCircle,
    Navigation, Sparkles, HeartPulse, ChevronRight, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { QRCodeCanvas } from 'qrcode.react';
import {
    listenUserPets, getFullPetProfile, setPetLostStatus,
    listenPetLostReports, PET_LOST_STATUS
} from '../lib/petService';

export default function PetDashboard() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [selectedPetFull, setSelectedPetFull] = useState(null);
    const [petReports, setPetReports] = useState([]);
    const [togglingLost, setTogglingLost] = useState(false);
    const [showLostNotesModal, setShowLostNotesModal] = useState(false);
    const [lostNotes, setLostNotes] = useState('');

    // Auth state listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    // Listen to user's pet list
    useEffect(() => {
        if (!currentUser) return;
        const unsub = listenUserPets(currentUser.uid, (list) => {
            setPets(list);
            setLoading(false);
            if (list.length > 0 && !selectedPetId) {
                setSelectedPetId(list[0].petId);
            }
        });
        return () => unsub();
    }, [currentUser, selectedPetId]);

    // Fetch full details of selected pet
    useEffect(() => {
        if (!selectedPetId) {
            setSelectedPetFull(null);
            return;
        }
        let isMounted = true;
        const loadFull = async () => {
            const data = await getFullPetProfile(selectedPetId);
            if (isMounted) {
                setSelectedPetFull(data);
            }
        };
        loadFull();

        // Listen to live GPS location reports from finders
        const unsubReports = listenPetLostReports(selectedPetId, (reports) => {
            if (isMounted) setPetReports(reports);
        });

        return () => {
            isMounted = false;
            unsubReports();
        };
    }, [selectedPetId]);

    const activePet = selectedPetFull || pets.find(p => p.petId === selectedPetId);
    const isLost = activePet?.lostStatus === PET_LOST_STATUS.LOST;

    const handleToggleLostStatus = async () => {
        if (!activePet) return;
        if (!isLost) {
            // Opening prompt for lost notes
            setShowLostNotesModal(true);
        } else {
            // Turning off lost mode (marked found)
            setTogglingLost(true);
            const t = toast.loading('Updating Pet Status to Normal / Recovered...');
            try {
                await setPetLostStatus(activePet.petId, false);
                toast.success('Pet marked as SAFE & RECOVERED!', { id: t });
            } catch (err) {
                toast.error(err.message || 'Failed to update status', { id: t });
            } finally {
                setTogglingLost(false);
            }
        }
    };

    const handleConfirmLostMode = async () => {
        setTogglingLost(true);
        const t = toast.loading('Activating LOST PET MODE...');
        try {
            await setPetLostStatus(activePet.petId, true, lostNotes);
            toast.error('LOST PET MODE ACTIVATED. Public scans will now show emergency alerts.', { id: t, duration: 6000 });
            setShowLostNotesModal(false);
            setLostNotes('');
        } catch (err) {
            toast.error(err.message || 'Failed to activate lost mode', { id: t });
        } finally {
            setTogglingLost(false);
        }
    };

    const handleDownloadQr = () => {
        const canvas = document.getElementById(`pet-qr-${activePet?.petId}`);
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `Pet_RESQR_${activePet.name}_${activePet.petId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Pet QR Tag Downloaded.');
    };

    const handleShareProfile = () => {
        const url = `https://resqr.co.in/pet/${activePet?.petId}`;
        if (navigator.share) {
            navigator.share({
                title: `${activePet.name}'s Pet RESQR Profile`,
                text: `Emergency safety profile for ${activePet.name}`,
                url,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Pet safety link copied to clipboard.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center p-6 text-white font-manrope">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-primary mx-auto" size={40} />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Pet Safety Vault...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center p-6 text-white font-manrope">
                <Card className="max-w-md w-full bg-[#090E1A] border-white/10 p-8 rounded-3xl text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto text-2xl">
                        🐾
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase font-poppins text-white">Pet Safety Portal</h2>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Please sign in with your RESQR account to manage your registered pets and review live location reports.
                        </p>
                    </div>
                    <Link to="/login" className="btn-app-primary w-full py-3.5 text-xs font-bold inline-flex items-center justify-center gap-2">
                        Sign In / Register
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#040812] text-white py-10 px-4 sm:px-6 lg:px-8 font-manrope">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                            🐾 Pet Safety Command Hub
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black italic uppercase font-poppins text-white">
                            Pet RESQR <span className="text-primary italic-display">Vault</span>
                        </h1>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            Emergency QR tags, Lost Pet Mode, and real-time finder GPS telemetry
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/create-pet"
                            className="btn-app-primary py-3 px-6 text-xs font-bold inline-flex items-center gap-2 shadow-xl shadow-primary/20"
                        >
                            <Plus size={16} /> Register Another Pet
                        </Link>
                    </div>
                </div>

                {/* Empty State */}
                {pets.length === 0 ? (
                    <Card className="p-12 text-center bg-[#090E1A] border-white/10 rounded-3xl space-y-6">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto text-3xl">
                            🐾
                        </div>
                        <div className="max-w-md mx-auto">
                            <h3 className="text-2xl font-black italic uppercase font-poppins text-white">No Pets Registered Yet</h3>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Give your furry companion a life-saving safety identity with Lost Pet Mode and instant location reporting.
                            </p>
                        </div>
                        <Link
                            to="/create-pet"
                            className="btn-app-primary py-3.5 px-8 text-xs font-bold inline-flex items-center gap-2 shadow-xl shadow-primary/20"
                        >
                            <Plus size={16} /> Create Pet RESQR Profile
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Pet Switcher List */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
                                My Companions ({pets.length})
                            </h2>

                            <div className="space-y-3">
                                {pets.map((p) => {
                                    const isSelected = p.petId === selectedPetId;
                                    const isPetLost = p.lostStatus === PET_LOST_STATUS.LOST;
                                    return (
                                        <div
                                            key={p.petId}
                                            onClick={() => setSelectedPetId(p.petId)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? 'bg-[#090E1A] border-primary shadow-xl shadow-primary/10'
                                                    : 'bg-white/5 border-white/5 hover:border-white/15'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-[#050914] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-lg">
                                                    {p.photoUrl ? (
                                                        <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        '🐾'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black italic uppercase font-poppins text-white truncate">
                                                        {p.name}
                                                    </h4>
                                                    <p className="text-[10px] font-mono text-slate-400">{p.petId}</p>
                                                </div>
                                            </div>

                                            <div>
                                                {isPetLost ? (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                        LOST MODE
                                                    </span>
                                                ) : (
                                                    <Badge variant="success" className="text-[9px]">Active</Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT COLUMNS: Active Pet Details & Real-Time Telemetry */}
                        {activePet && (
                            <div className="lg:col-span-2 space-y-6">
                                {/* LOST PET MODE STATUS CONTROLLER CARD */}
                                <Card className={`p-6 rounded-3xl border-2 transition-all ${
                                    isLost
                                        ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                                        : 'bg-[#090E1A] border-white/10 text-white'
                                }`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                isLost ? 'bg-rose-600 text-white' : 'bg-white/5 text-slate-400'
                                            }`}>
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-black italic uppercase font-poppins text-white">
                                                        Lost Pet Mode: {isLost ? 'ACTIVE (SEARCHING)' : 'OFF (SAFE)'}
                                                    </h3>
                                                    {isLost && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                                    {isLost
                                                        ? 'Public scans will show emergency recovery alerts, location prompts & masked contacts.'
                                                        : 'Activate immediately if your pet wanders away to receive live location alerts.'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleToggleLostStatus}
                                            disabled={togglingLost}
                                            className={`py-3 px-6 rounded-2xl text-xs font-black italic uppercase tracking-wider transition-all shrink-0 ${
                                                isLost
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20'
                                                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/20'
                                            }`}
                                        >
                                            {togglingLost ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : isLost ? (
                                                '✓ Mark as Found / Safe'
                                            ) : (
                                                '🚨 Mark as Lost'
                                            )}
                                        </button>
                                    </div>
                                </Card>

                                {/* PET IDENTITY & QR PREVIEW CARD */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Identity Details */}
                                    <Card className="p-6 bg-[#090E1A] border-white/10 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[#050914] border border-white/10 overflow-hidden flex items-center justify-center shrink-0 text-2xl">
                                                {activePet.photoUrl ? (
                                                    <img src={activePet.photoUrl} alt={activePet.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    '🐾'
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black italic uppercase font-poppins text-white">{activePet.name}</h3>
                                                <p className="text-xs text-slate-400">{activePet.breed || activePet.species} · {activePet.gender}</p>
                                                <p className="text-[11px] font-mono text-primary font-bold">{activePet.petId}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-white/5 text-xs text-slate-300">
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Microchip:</span>
                                                <span className="font-mono text-white">{activePet.microchipNumber || 'Not Registered'}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Markings:</span>
                                                <span className="text-white truncate max-w-[160px]">{activePet.identificationMarkings || 'None'}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Vaccinations:</span>
                                                <span className="text-emerald-400 font-bold">{activePet.medical?.vaccinationInfo || 'Up to Date'}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Veterinarian:</span>
                                                <span className="text-white">{activePet.medical?.veterinarianName || 'Not Listed'}</span>
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-white/5 flex gap-2">
                                            <Link
                                                to={`/pet/${activePet.petId}`}
                                                className="flex-1 btn-app-secondary py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                                            >
                                                <Eye size={14} /> Public View
                                            </Link>
                                            <button
                                                onClick={handleShareProfile}
                                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                                title="Share Pet Profile"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </Card>

                                    {/* QR Code Tag Card */}
                                    <Card className="p-6 bg-[#090E1A] border-white/10 rounded-3xl text-center space-y-4 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                                                Pet QR Smart Tag
                                            </span>
                                            <div className="p-3 bg-white rounded-2xl inline-block mx-auto shadow-xl">
                                                <QRCodeCanvas
                                                    id={`pet-qr-${activePet.petId}`}
                                                    value={`https://resqr.co.in/pet/${activePet.petId}`}
                                                    size={130}
                                                    level="H"
                                                    includeMargin={false}
                                                />
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-400 mt-2">
                                                Attach to collar or smart tag
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleDownloadQr}
                                            className="w-full btn-app-primary py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            <Download size={14} /> Download Printable Tag
                                        </button>
                                    </Card>
                                </div>

                                {/* FINDER GPS LOCATION REPORTS CARD */}
                                <Card className="p-6 bg-[#090E1A] border-white/10 rounded-3xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-2">
                                            <Navigation size={18} className="text-primary" />
                                            <h3 className="text-base font-black italic uppercase font-poppins text-white">
                                                Finder Location Logs & Telemetry ({petReports.length})
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400">Live GPS Stream</span>
                                    </div>

                                    {petReports.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                            No scan or location reports recorded yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {petReports.map((report) => (
                                                <div
                                                    key={report.reportId}
                                                    className="p-4 rounded-2xl bg-[#050914] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={14} className="text-emerald-400" />
                                                            <span className="font-bold text-white text-xs">{report.locationAddress}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                · {new Date(report.reportedAt).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-300">
                                                            Finder: <strong className="text-white">{report.finderName}</strong>
                                                            {report.finderPhone ? ` · Phone: ${report.finderPhone}` : ''}
                                                        </p>
                                                        {report.message && (
                                                            <p className="text-[11px] text-slate-400 italic">
                                                                &ldquo;{report.message}&rdquo;
                                                            </p>
                                                        )}
                                                    </div>

                                                    {report.latitude && report.longitude && (
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-app-secondary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                                                        >
                                                            <ExternalLink size={12} /> Open in Google Maps
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LOST PET MODAL PROMPT */}
            {showLostNotesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="relative w-full max-w-md bg-[#090E1A] border border-rose-500/30 rounded-3xl p-6 text-white shadow-2xl space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black italic uppercase font-poppins text-white">Activate Lost Pet Mode</h3>
                                    <p className="text-xs text-slate-400">Alert public scanners and rescuers</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLostNotesModal(false)} className="p-1.5 rounded-xl bg-white/5 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1.5">
                                Emergency Message for Rescuers (Optional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="e.g. Lost near Indiranagar 100ft road. Very friendly, responds to Bruno. Reward for safe return."
                                value={lostNotes}
                                onChange={(e) => setLostNotes(e.target.value)}
                                className="w-full bg-[#050914] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => setShowLostNotesModal(false)}
                                className="btn-app-secondary py-2 px-4 text-xs font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmLostMode}
                                disabled={togglingLost}
                                className="py-2 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black italic uppercase shadow-lg shadow-rose-600/30"
                            >
                                {togglingLost ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Lost Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
