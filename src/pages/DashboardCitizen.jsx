import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Dog, Briefcase, Car, Plus, QrCode, Download, Edit3, 
    Trash2, Clock, Loader2, Shield, Eye, Lock, RefreshCw, X, ExternalLink,
    Activity, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle, Phone, MapPin, AtSign, Camera
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { QRCodeCanvas } from 'qrcode.react';
import { db, auth } from '../lib/firebase';
import { ref, get, update, remove, onValue, set } from 'firebase/database';
import toast from 'react-hot-toast';
import DemoRazorpayModal from '../components/common/DemoRazorpayModal';
import AppLoading from '../components/ui/AppLoading';
import { calculateAge } from '../lib/dateUtils';
import RESQRQRCodeCard from '../components/common/RESQRQRCodeCard';
import FaceEnrollmentWizard from '../components/biometrics/FaceEnrollmentWizard';

export default function DashboardCitizen() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState([]);
    const [editData, setEditData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [username, setUsername] = useState('');
    const [editTab, setEditTab] = useState('personal'); // 'personal', 'medical', 'insurance', 'biometrics'
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
    const [isFaceEnrollModalOpen, setIsFaceEnrollModalOpen] = useState(false);

    const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

    useEffect(() => {
        if (profiles.length > 0 && !selectedProfileId) {
            setSelectedProfileId(profiles[0].id);
        }
    }, [profiles]);

    useEffect(() => {
        if (activeProfile) {
            const initialData = activeProfile.data || {};
            const fallbackEmergency = activeProfile.emergencyContacts?.[0] || {};
            const fallbackMedical = activeProfile.medical || {};
            
            const resolvedEditData = {
                name: initialData.name || activeProfile.name || activeProfile.fullName || '',
                bloodGroup: initialData.bloodGroup || fallbackMedical.bloodGroup || activeProfile.bloodGroup || '',
                healthIssues: initialData.healthIssues || fallbackMedical.medicalConditions || activeProfile.medicalConditions || activeProfile.healthIssues || '',
                allergies: initialData.allergies || fallbackMedical.allergies || activeProfile.allergies || '',
                emergencyContactName: initialData.emergencyContactName || fallbackEmergency.name || activeProfile.emergencyContactName || '',
                emergencyContactRelation: initialData.emergencyContactRelation || fallbackEmergency.relationship || fallbackEmergency.relation || activeProfile.emergencyContactRelation || '',
                emergencyContactPhone: initialData.emergencyContactPhone || fallbackEmergency.phone || activeProfile.emergencyContactPhone || '',
                phone: initialData.phone || activeProfile.phone || '',
                email: initialData.email || activeProfile.email || '',
                dob: initialData.dob || activeProfile.dob || '',
                gender: initialData.gender || activeProfile.gender || '',
                height: initialData.height || fallbackMedical.height || activeProfile.height || '',
                weight: initialData.weight || fallbackMedical.weight || activeProfile.weight || '',
                currentMedication: initialData.currentMedication || fallbackMedical.currentMedication || activeProfile.currentMedication || '',
                previousSurgeries: initialData.previousSurgeries || fallbackMedical.previousSurgeries || activeProfile.previousSurgeries || activeProfile.surgeries || '',
                emergencyNotes: initialData.emergencyNotes || fallbackMedical.emergencyNotes || activeProfile.emergencyNotes || '',
                medicalId: initialData.medicalId || fallbackMedical.medicalId || activeProfile.medicalId || '',
                isOrganDonor: initialData.isOrganDonor || fallbackMedical.isOrganDonor || activeProfile.isOrganDonor || false,
                // Address fields
                houseNo: activeProfile.address?.houseNo || '',
                street: activeProfile.address?.street || '',
                area: activeProfile.address?.area || '',
                city: activeProfile.address?.city || '',
                district: activeProfile.address?.district || '',
                state: activeProfile.address?.state || '',
                pincode: activeProfile.address?.pincode || '',
                // Insurance fields
                insuranceCompany: activeProfile.insurance?.insuranceCompany || '',
                policyNumber: activeProfile.insurance?.policyNumber || '',
                policyHolder: activeProfile.insurance?.policyHolder || '',
                policyExpiry: activeProfile.insurance?.policyExpiry || '',
                coverageAmount: activeProfile.insurance?.coverageAmount || '',
                policyAgentName: activeProfile.insurance?.policyAgentName || '',
                policyAgentPhone: activeProfile.insurance?.policyAgentPhone || '',
                cashlessFacility: activeProfile.insurance?.cashlessFacility || false
            };
            setEditData(resolvedEditData);
            setUsername(activeProfile.username || '');
        }
    }, [selectedProfileId, profiles]);

    useEffect(() => {
        let unsubscribe;
        const init = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }
            const uid = auth.currentUser.uid;
            const profilesRef = ref(db, `users/${uid}/profiles`);
            unsubscribe = onValue(profilesRef, (snapshot) => {
                const profilesData = snapshot.exists() 
                    ? Object.entries(snapshot.val()).map(([id, p]) => ({ id, ...p })).reverse()
                    : [];
                
                setProfiles(profilesData);
                setLoading(false);
            });
        };
        if (auth.currentUser) init();
        else {
            const timer = setTimeout(() => { if (auth.currentUser) init(); else setLoading(false); }, 1000);
            return () => clearTimeout(timer);
        }
        return () => { if (unsubscribe) unsubscribe(); };
    }, [navigate]);

    /**
     * Profile records belong to the citizen — saving them is always free.
     * Physical tag orders are a separate, optional purchase (see the QR card).
     */
    const saveSection = async (section) => {
        if (section === 'personal' && (!editData.name || !editData.emergencyContactName || !editData.emergencyContactPhone)) {
            toast.error("Please fill Name and Guardian details.");
            return;
        }
        if (section === 'medical' && !editData.bloodGroup) {
            toast.error("Please select a blood group before saving medical records.");
            return;
        }
        await handleSave();
    };

    const handleSave = async () => {
        try {
            const t = toast.loading("Syncing Secure Identity...");
            const uid = auth.currentUser.uid;
            const pid = activeProfile.id;

            const updates = {};
            if (username && username !== activeProfile.username) {
                const cleanUser = username.toLowerCase().replace(/[^a-z0-9]/g, '');
                const regRef = ref(db, `usernames/${cleanUser}`);
                const existing = await get(regRef);
                if (existing.exists() && existing.val() !== `${uid}/${pid}`) {
                    toast.error("Username already claimed.", { id: t });
                    return;
                }
                if (activeProfile.username) await remove(ref(db, `usernames/${activeProfile.username.toLowerCase()}`));
                await set(regRef, `${uid}/profiles/${pid}`);
                updates[`users/${uid}/profiles/${pid}/username`] = cleanUser;
                updates[`profiles/${pid}/username`] = cleanUser;
            }

            const computedAge = calculateAge(editData.dob);
            const updatedProfile = {
                ...activeProfile,
                username: username || activeProfile.username || '',
                name: editData.name || '',
                phone: editData.phone || '',
                email: editData.email || '',
                dob: editData.dob || '',
                age: computedAge,
                gender: editData.gender || '',
                address: {
                    houseNo: editData.houseNo || '',
                    street: editData.street || '',
                    area: editData.area || '',
                    city: editData.city || '',
                    district: editData.district || '',
                    state: editData.state || '',
                    pincode: editData.pincode || ''
                },
                emergencyContacts: [
                    {
                        name: editData.emergencyContactName || '',
                        relationship: editData.emergencyContactRelation || '',
                        phone: editData.emergencyContactPhone || ''
                    }
                ],
                medical: {
                    bloodGroup: editData.bloodGroup || '',
                    height: editData.height || '',
                    weight: editData.weight || '',
                    medicalConditions: editData.healthIssues || '',
                    allergies: editData.allergies || '',
                    currentMedication: editData.currentMedication || '',
                    previousSurgeries: editData.previousSurgeries || '',
                    isOrganDonor: editData.isOrganDonor || false,
                    emergencyNotes: editData.emergencyNotes || '',
                    medicalId: editData.medicalId || ''
                },
                insurance: {
                    insuranceCompany: editData.insuranceCompany || '',
                    policyNumber: editData.policyNumber || '',
                    policyHolder: editData.policyHolder || '',
                    policyExpiry: editData.policyExpiry || '',
                    coverageAmount: editData.coverageAmount || '',
                    policyAgentName: editData.policyAgentName || '',
                    policyAgentPhone: editData.policyAgentPhone || '',
                    cashlessFacility: editData.cashlessFacility || false
                },
                data: {
                    ...editData,
                    age: computedAge
                },
                lastSyncRef: "sync_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
                lastUpdatedAt: new Date().toISOString()
            };

            updates[`users/${uid}/profiles/${pid}`] = updatedProfile;
            updates[`profiles/${pid}`] = updatedProfile;

            await update(ref(db), updates);
            toast.success("Security Node Updated & Synced!", { id: t });
            setIsEditing(false);
        } catch (error) { 
            console.error("Save error:", error);
            toast.error("Sync Failed"); 
        }
    };

    const handleDownload = async () => {
        try {
            const t = toast.loading("Synthesizing Print-Ready Tag...");
            const canvas = document.getElementById(`qr-${activeProfile.id}`);
            if (!canvas) return;

            const downloadCanvas = document.createElement('canvas');
            const ctx = downloadCanvas.getContext('2d');
            const CANVAS_W = 1200;
            const CANVAS_H = 1600;
            downloadCanvas.width = CANVAS_W;
            downloadCanvas.height = CANVAS_H;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            const logo = new Image();
            logo.crossOrigin = 'anonymous';
            logo.src = `${import.meta.env.BASE_URL}resqr_logo.png`;
            await new Promise((resolve, reject) => { 
                logo.onload = resolve; 
                logo.onerror = () => reject(new Error("Failed to load logo for download"));
            });
            const logoW = 450;
            const logoH = (logo.height / logo.width) * logoW || 130;
            ctx.filter = 'brightness(0)';
            ctx.drawImage(logo, (CANVAS_W - logoW) / 2, 70, logoW, logoH);
            ctx.filter = 'none';

            // QR Code Matrix
            ctx.drawImage(canvas, (CANVAS_W - 720) / 2, logoH + 130, 720, 720);

            // Registered User Name at Bottom of QR
            const displayName = (editData?.name || activeProfile?.name || activeProfile?.data?.name || 'REGISTERED HOLDER').toUpperCase();
            ctx.fillStyle = '#0F172A';
            ctx.font = 'italic 900 64px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(displayName, CANVAS_W / 2, logoH + 130 + 720 + 80);

            ctx.fillStyle = '#E63946';
            ctx.font = 'italic 900 44px sans-serif';
            ctx.fillText('SCAN IN EMERGENCY', CANVAS_W / 2, logoH + 130 + 720 + 150);

            // Footer Site Name
            ctx.font = 'bold 30px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('POWERED BY RESQR.CO.IN', CANVAS_W / 2, CANVAS_H - 60);

            const link = document.createElement('a');
            const fileName = `RESQR_${username || activeProfile.id.split('_').pop()}`.toUpperCase();
            link.href = downloadCanvas.toDataURL('image/png', 1.0);
            link.download = `${fileName}.png`;
            link.click();
            toast.success("Tag Downloaded", { id: t });
        } catch (err) { toast.error('Download failed'); }
    };

    const handleBiometricEnrollmentComplete = async (bioProfile) => {
        try {
            const uid = auth.currentUser?.uid;
            if (!activeProfile?.id) throw new Error("No active profile selected.");
            const profileId = activeProfile.id;
            const updates = {};
            updates[`biometricProfiles/${profileId}`] = bioProfile;
            if (uid) {
                updates[`users/${uid}/biometricProfiles/${profileId}`] = bioProfile;
                updates[`users/${uid}/profiles/${profileId}/biometricEnrolled`] = true;
                updates[`users/${uid}/profiles/${profileId}/scannerType`] = 'facial';
            }
            updates[`profiles/${profileId}/biometricEnrolled`] = true;
            updates[`profiles/${profileId}/scannerType`] = 'facial';
            await update(ref(db), updates);
            toast.success("3-Angle Biometric Face ID enrolled and activated!");
            setIsFaceEnrollModalOpen(false);
        } catch (err) {
            console.error("Biometric save error:", err);
            toast.error("Failed to save biometric profile: " + err.message);
        }
    };

    if (loading) return <AppLoading message="Synchronizing your emergency profile..." />;
    if (!auth.currentUser) return <div className="min-h-screen bg-[#040812] flex items-center justify-center text-white"><Button onClick={() => navigate('/login')}>RE-AUTHENTICATE</Button></div>;

    if (profiles.length === 0 || !activeProfile) {
        return (
            <div className="min-h-screen bg-[#040812] text-white flex items-center justify-center p-6 font-manrope">
                <div className="max-w-md w-full bg-[#11192A] border border-white/10 rounded-[36px] p-10 text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                        <QrCode size={32} />
                    </div>
                    <h2 className="text-2xl font-black italic uppercase font-poppins">No Active RESQR Identity</h2>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        You have not generated an emergency profile yet. Generate your secure medical tag to activate your emergency dashboard.
                    </p>
                    <Button onClick={() => navigate('/create-identity?type=myself')} className="w-full py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-wider text-xs">
                        Create Emergency Identity
                    </Button>
                </div>
            </div>
        );
    }

    const qrValue = username 
        ? `${window.location.origin}/${username}` 
        : `${window.location.origin}/qr/${activeProfile?.id}`;

    const profileName = (editData?.name || activeProfile?.data?.name || auth.currentUser.displayName || 'Guardian').split(' ')[0].toUpperCase();

    const openEmergencyPreview = () => {
        if (username) {
            window.open(`/${username}`, '_blank');
        } else if (activeProfile?.id) {
            window.open(`/qr/${activeProfile.id}`, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-primary/30 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 space-y-12 relative z-10">
                
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="min-w-0">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-poppins text-white leading-tight break-words">WELCOME BACK, {profileName}</h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                            System operational • All nodes secure {activeProfile?.identityType && `• ${activeProfile.identityType.toUpperCase()}`}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" className="bg-[#11192A] border-white/5 text-emerald-400 font-black italic uppercase text-xs h-12 px-6 rounded-2xl hover:bg-slate-800 hover:text-emerald-300" onClick={openEmergencyPreview}><Eye size={16} className="mr-2" /> Preview Mode</Button>
                        <Button variant="outline" className="bg-gold/10 border-gold/30 text-gold font-black italic uppercase text-xs h-12 px-6 rounded-2xl hover:bg-gold/20" onClick={() => navigate('/my-qr')}><QrCode size={16} className="mr-2" /> MY RESQR</Button>
                        <Button variant="outline" className="bg-[#11192A] border-white/5 text-slate-400 font-black italic uppercase text-xs h-12 px-6 rounded-2xl hover:bg-slate-800 hover:text-white" onClick={() => navigate('/privacy-settings')}><Lock size={16} className="mr-2" /> Privacy</Button>
                        <Button variant="outline" className="bg-[#11192A] border-white/5 text-slate-400 font-black italic uppercase text-xs h-12 px-6 rounded-2xl hover:bg-slate-800" onClick={() => navigate('/scanner')}><QrCode size={16} className="mr-2" /> Scan RESQR</Button>
                        <Button variant="outline" className="bg-[#11192A] border-white/5 text-slate-400 font-black italic uppercase text-xs h-12 px-6 rounded-2xl hover:bg-slate-800" onClick={handleDownload}><Download size={16} className="mr-2" /> Download Tag</Button>
                        <Button className="bg-primary text-white font-black italic uppercase text-xs h-12 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all border-none" onClick={() => setIsEditing(!isEditing)}><Edit3 size={16} className="mr-2" /> {isEditing ? 'Discard Changes' : 'Edit Profile'}</Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#11192A] p-8 rounded-3xl border border-white/5 flex items-center gap-6 cursor-pointer hover:border-indigo-500/30 transition-all group/stat" onClick={() => document.getElementById('recent-scans')?.scrollIntoView({ behavior: 'smooth' })}><div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover/stat:bg-indigo-500/20 transition-all"><QrCode size={24} /></div><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Scans</p><p className="text-4xl font-black italic uppercase tracking-tight font-poppins text-white">{activeProfile?.scans ? Object.keys(activeProfile.scans).length : 0}</p></div></div>
                    <div className="bg-[#11192A] p-8 rounded-3xl border border-white/5 flex items-center gap-6"><div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20"><User size={24} /></div><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Health Status</p><p className="text-4xl font-black italic uppercase tracking-tighter font-poppins text-emerald-400">Verified</p></div></div>
                    <div className="bg-[#11192A] p-8 rounded-3xl border border-white/5 flex items-center gap-6"><div className="w-14 h-14 bg-[#E63946]/10 rounded-2xl flex items-center justify-center border border-red-500/20"><ShieldCheck size={24} /></div><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Safety Index</p><p className="text-4xl font-black italic uppercase tracking-tighter font-poppins text-white">High</p></div></div>
                    <div 
                        onClick={() => setIsFaceEnrollModalOpen(true)}
                        className={`bg-[#11192A] p-8 rounded-3xl border transition-all cursor-pointer group flex items-center gap-6 ${
                            activeProfile?.biometricEnrolled || activeProfile?.scannerType === 'facial' 
                                ? 'border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5' 
                                : 'border-primary/40 hover:border-primary hover:bg-primary/5 shadow-lg shadow-primary/10'
                        }`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                            activeProfile?.biometricEnrolled || activeProfile?.scannerType === 'facial'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:scale-105'
                                : 'bg-primary/10 border-primary/20 text-primary group-hover:scale-105'
                        }`}>
                            <Camera size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Biometric Face</p>
                            <p className="text-2xl font-black italic uppercase tracking-tight font-poppins text-white">
                                {activeProfile?.biometricEnrolled || activeProfile?.scannerType === 'facial' ? (
                                    <span className="text-emerald-400 text-xl">Active</span>
                                ) : (
                                    <span className="text-primary text-xl flex items-center gap-1">Scan Face &rarr;</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#11192A] rounded-[50px] border border-white/5 overflow-hidden flex flex-col relative shadow-2xl">
                        <div className="p-12 pb-0 flex justify-between items-start">
                             <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20"><Shield size={24} className="text-primary" /></div><div><h3 className="text-3xl font-black uppercase tracking-tighter font-poppins text-white italic">Emergency Passport</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">ACTIVE MEDICAL IDENTITY {activeProfile?.identityType && `• ${activeProfile.identityType.toUpperCase()}`}</p></div></div>
                              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{activeProfile?.scannerType === 'facial' ? 'AI FACIAL ACTIVE' : 'SECURED'}</span></div>
                        </div>

                        <div className="p-12">
                            {isEditing ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    {/* Tabs Selection Header */}
                                    <div className="flex bg-[#050B18] p-1.5 rounded-2xl border border-white/5 justify-between">
                                        <button 
                                            type="button"
                                            onClick={() => setEditTab('personal')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${editTab === 'personal' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Personal Details
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setEditTab('medical')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${editTab === 'medical' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Medical Passport
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setEditTab('insurance')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${editTab === 'insurance' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Insurance Node
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setEditTab('biometrics')}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${editTab === 'biometrics' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Face ID
                                        </button>
                                    </div>

                                    {/* Edit Username / Vanity URL */}
                                    <div className="bg-[#050B18] p-6 rounded-3xl border border-white/5 space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-emerald-400">Ultra-Small URL Link</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-500"><AtSign size={16} /></div>
                                            <input className="w-full h-16 bg-slate-950 border border-white/5 rounded-2xl pl-14 pr-6 font-black italic text-white uppercase tracking-widest focus:border-primary/50 outline-none transition-all placeholder:text-slate-700" placeholder="CHOOSE-USER-ID" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} />
                                            <p className="text-xs text-slate-500 font-bold mt-2 lowercase">Result: resqr.co.in/{username || 'username'}</p>
                                        </div>
                                    </div>

                                    {/* Personal Details Tab */}
                                    {editTab === 'personal' && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            <Input label="FULL IDENTITY NAME" name="name" value={editData.name || ''} onChange={(e) => setEditData({...editData, name: e.target.value.toUpperCase()})} />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input label="MOBILE NUMBER" name="phone" value={editData.phone || ''} onChange={(e) => setEditData({...editData, phone: e.target.value.replace(/\D/g, '')})} />
                                                <Input label="EMAIL ADDRESS" name="email" value={editData.email || ''} onChange={(e) => setEditData({...editData, email: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <Input label="DATE OF BIRTH" type="date" name="dob" value={editData.dob || ''} onChange={(e) => setEditData({...editData, dob: e.target.value})} />
                                                    {editData.dob && (
                                                        <span className="absolute right-3 top-9 text-[10px] font-black text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md italic z-10">
                                                            Age: {calculateAge(editData.dob)} Yrs
                                                        </span>
                                                    )}
                                                </div>
                                                <Select 
                                                    label="GENDER" 
                                                    value={editData.gender || ''} 
                                                    onChange={(e) => setEditData({...editData, gender: e.target.value})} 
                                                    options={[
                                                        { label: 'Select Gender', value: '' },
                                                        { label: 'Male', value: 'male' },
                                                        { label: 'Female', value: 'female' },
                                                        { label: 'Other', value: 'other' }
                                                    ]} 
                                                />
                                            </div>
                                            <div className="space-y-4 border-t border-white/5 pt-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Address Coordinates</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <Input label="House No." value={editData.houseNo || ''} onChange={(e) => setEditData({...editData, houseNo: e.target.value})} />
                                                    <Input label="Street" value={editData.street || ''} onChange={(e) => setEditData({...editData, street: e.target.value})} />
                                                    <Input label="Area" value={editData.area || ''} onChange={(e) => setEditData({...editData, area: e.target.value})} />
                                                    <Input label="City" value={editData.city || ''} onChange={(e) => setEditData({...editData, city: e.target.value})} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Input label="District" value={editData.district || ''} onChange={(e) => setEditData({...editData, district: e.target.value})} />
                                                    <Input label="State" value={editData.state || ''} onChange={(e) => setEditData({...editData, state: e.target.value})} />
                                                    <Input label="Pincode" value={editData.pincode || ''} onChange={(e) => setEditData({...editData, pincode: e.target.value.replace(/\D/g, '')})} />
                                                </div>
                                            </div>
                                            <div className="space-y-4 border-t border-white/5 pt-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Primary Guardian Contact</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Input label="GUARDIAN NAME" name="emergencyContactName" value={editData.emergencyContactName || ''} onChange={(e) => setEditData({...editData, emergencyContactName: e.target.value.toUpperCase()})} />
                                                    <Input label="GUARDIAN RELATION" name="emergencyContactRelation" value={editData.emergencyContactRelation || ''} onChange={(e) => setEditData({...editData, emergencyContactRelation: e.target.value.toUpperCase()})} />
                                                    <Input label="GUARDIAN PHONE" name="emergencyContactPhone" value={editData.emergencyContactPhone || ''} onChange={(e) => setEditData({...editData, emergencyContactPhone: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Medical Passport Tab */}
                                    {editTab === 'medical' && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input label="BLOOD GROUP" name="bloodGroup" value={editData.bloodGroup || ''} onChange={(e) => setEditData({...editData, bloodGroup: e.target.value.toUpperCase()})} />
                                                <Input label="HEIGHT (CM)" type="number" value={editData.height || ''} onChange={(e) => setEditData({...editData, height: e.target.value})} />
                                                <Input label="WEIGHT (KG)" type="number" value={editData.weight || ''} onChange={(e) => setEditData({...editData, weight: e.target.value})} />
                                            </div>
                                            <Input label="CRITICAL HEALTH CONDITIONS" name="healthIssues" value={editData.healthIssues || ''} onChange={(e) => setEditData({...editData, healthIssues: e.target.value})} />
                                            <Input label="VULNERABILITIES / ALLERGIES" name="allergies" value={editData.allergies || ''} onChange={(e) => setEditData({...editData, allergies: e.target.value})} />
                                            <Input label="CURRENT MEDICATION" name="currentMedication" value={editData.currentMedication || ''} onChange={(e) => setEditData({...editData, currentMedication: e.target.value})} />
                                            <Input label="PREVIOUS SURGERIES" name="previousSurgeries" value={editData.previousSurgeries || ''} onChange={(e) => setEditData({...editData, previousSurgeries: e.target.value})} />
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input label="MEDICAL ID NUMBER" value={editData.medicalId || ''} onChange={(e) => setEditData({...editData, medicalId: e.target.value})} />
                                                <div className="flex items-center gap-4 border border-white/5 bg-[#050B18] px-6 py-5 rounded-2xl mt-6">
                                                    <input 
                                                        type="checkbox" 
                                                        id="organDonor" 
                                                        checked={editData.isOrganDonor || false} 
                                                        onChange={(e) => setEditData({...editData, isOrganDonor: e.target.checked})} 
                                                        className="w-5 h-5 rounded accent-primary bg-slate-900 border-white/10" 
                                                    />
                                                    <label htmlFor="organDonor" className="text-xs font-black uppercase tracking-widest text-slate-300 cursor-pointer">Organ Donor Consent</label>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Critical Emergency Notes</label>
                                                <textarea 
                                                    value={editData.emergencyNotes || ''} 
                                                    onChange={(e) => setEditData({...editData, emergencyNotes: e.target.value})} 
                                                    placeholder="Crucial emergency responder guidance..." 
                                                    className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-semibold outline-none transition-all focus:border-primary placeholder:text-slate-700 h-28"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Insurance Node Tab */}
                                    {editTab === 'insurance' && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Select 
                                                    label="Insurance Company" 
                                                    value={editData.insuranceCompany || ''} 
                                                    onChange={(e) => setEditData({...editData, insuranceCompany: e.target.value})} 
                                                    options={[
                                                        { label: 'Select Insurance Company', value: '' },
                                                        { label: 'Star Health', value: 'Star Health' },
                                                        { label: 'Care Health', value: 'Care Health' },
                                                        { label: 'Niva Bupa', value: 'Niva Bupa' },
                                                        { label: 'ICICI Lombard', value: 'ICICI Lombard' },
                                                        { label: 'HDFC ERGO', value: 'HDFC ERGO' },
                                                        { label: 'SBI Health', value: 'SBI Health' },
                                                        { label: 'ACKO Insurance', value: 'ACKO' },
                                                        { label: 'Aditya Birla Health', value: 'Aditya Birla' },
                                                        { label: 'ManipalCigna', value: 'ManipalCigna' },
                                                        { label: 'Others', value: 'Others' }
                                                    ]} 
                                                />
                                                <Input label="Policy ID / Number" placeholder="POL-123456" value={editData.policyNumber || ''} onChange={(e) => setEditData({...editData, policyNumber: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input label="Policy Holder Name" placeholder="Holder Name" value={editData.policyHolder || ''} onChange={(e) => setEditData({...editData, policyHolder: e.target.value})} />
                                                <Input label="Policy Expiry Date" type="date" value={editData.policyExpiry || ''} onChange={(e) => setEditData({...editData, policyExpiry: e.target.value})} />
                                                <Input label="Coverage Limit (₹)" placeholder="Coverage Amount" type="number" value={editData.coverageAmount || ''} onChange={(e) => setEditData({...editData, coverageAmount: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input label="Insurance Agent Name" placeholder="Coordinator Name" value={editData.policyAgentName || ''} onChange={(e) => setEditData({...editData, policyAgentName: e.target.value})} />
                                                <Input label="Agent Contact Phone" maxLength="10" placeholder="Agent Phone" value={editData.policyAgentPhone || ''} onChange={(e) => setEditData({...editData, policyAgentPhone: e.target.value.replace(/\D/g, '')})} />
                                            </div>
                                            <div className="flex items-center gap-4 border border-white/5 bg-[#050B18] px-6 py-5 rounded-2xl mt-4">
                                                <input 
                                                    type="checkbox" 
                                                    id="cashlessFac" 
                                                    checked={editData.cashlessFacility || false} 
                                                    onChange={(e) => setEditData({...editData, cashlessFacility: e.target.checked})} 
                                                    className="w-5 h-5 rounded accent-primary bg-slate-900 border-white/10" 
                                                />
                                                <label htmlFor="cashlessFac" className="text-xs font-black uppercase tracking-widest text-slate-300 cursor-pointer">Cashless Facility Active</label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Biometric Face ID Tab */}
                                    {editTab === 'biometrics' && (
                                        <div className="space-y-6 animate-in fade-in duration-200">
                                            <div className="p-8 bg-[#050B18] rounded-3xl border border-white/5 space-y-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="text-xl font-black uppercase italic tracking-tight font-poppins text-white">
                                                            3-Angle Biometric Facial Security
                                                        </h4>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                                            128-Dimensional Neural Embedding for Trauma Hospital Access
                                                        </p>
                                                    </div>
                                                    <Badge className={activeProfile?.biometricEnrolled || activeProfile?.scannerType === 'facial' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}>
                                                        {activeProfile?.biometricEnrolled || activeProfile?.scannerType === 'facial' ? 'ACTIVE ENROLLED' : 'NOT CONFIGURED'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                    When enrolled, emergency doctors at certified hospitals can verify your identity using Front, Left, and Right facial sweeps even if your phone or ID is unavailable.
                                                </p>
                                                <Button
                                                    type="button"
                                                    onClick={() => setIsFaceEnrollModalOpen(true)}
                                                    className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black italic uppercase tracking-wider text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                                                >
                                                    <Camera size={18} />
                                                    {activeProfile?.biometricEnrolled || activeProfile?.scannerType === 'facial' ? 'Re-Scan / Update 3-Angle Face ID' : 'Launch 3-Angle Face Enrollment Wizard'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                        <Button 
                                            onClick={() => setIsEditing(false)}
                                            className="w-full h-16 bg-transparent text-slate-400 hover:text-white border border-white/10 font-black italic uppercase tracking-[0.2em] rounded-2xl"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={() => saveSection(editTab)} 
                                            className="w-full h-16 bg-primary hover:bg-primary-dark text-white font-black italic uppercase tracking-[0.15em] rounded-2xl shadow-2xl shadow-primary/20 flex flex-col justify-center items-center leading-none"
                                        >
                                            <span className="text-sm">SAVE {editTab === 'personal' ? 'PERSONAL' : editTab === 'medical' ? 'MEDICAL' : 'INSURANCE'} DETAILS</span>
                                            <span className="text-[9px] text-white/70 mt-1.5 uppercase tracking-widest font-sans font-bold">Instant sync • Always free</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-12">
                                    <div className="flex-1 space-y-10">
                                        <div className="space-y-4"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Blood Group</p><p className="text-8xl font-black italic text-[#E63946] font-poppins tracking-tighter leading-none">{editData?.bloodGroup || 'B-'}</p></div>
                                        <div className="space-y-4"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Medical Conditions</p><div className="bg-[#050B18] p-6 rounded-3xl border border-white/5 italic font-bold text-white/80">{editData?.healthIssues || 'Unknown status'}</div></div>
                                        <div className="space-y-4"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Allergies</p><div className="bg-red-500/5 p-6 rounded-3xl border border-red-500/10 italic font-bold text-red-400">{editData?.allergies || 'None reported'}</div></div>
                                    </div>
                                    <div className="w-full md:w-80 space-y-8">
                                        <div className="bg-[#050B18] p-8 rounded-[40px] border border-white/5 relative group">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 font-poppins">Emergency Contact</p>
                                            <h4 className="text-3xl font-black italic text-white uppercase font-poppins leading-none mb-1">{editData?.emergencyContactName || 'NANA'}</h4>
                                            <Badge className="bg-red-500/10 text-red-500 border-none px-3 py-1 font-black italic text-[9px] uppercase mb-10">{editData?.emergencyContactRelation || 'PARENT'}</Badge>
                                            <div className="space-y-1 mt-10"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-poppins">Private Contact Node</p><p className="text-3xl font-black italic text-white font-poppins tracking-tighter leading-none">{editData?.emergencyContactPhone?.replace(/\d(?=\d{4})/g, '*') || '**********'}</p></div>
                                            <div className="absolute top-8 right-8 flex flex-col gap-3"><button className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 transition-transform active:scale-95"><Phone size={20} /></button></div>
                                        </div>

                                        {/* Linked Insurance */}
                                        <div className="bg-[#050B18] p-8 rounded-[40px] border border-white/5 relative group">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 font-poppins">Linked Insurance</p>
                                            {activeProfile?.insurance?.insuranceCompany ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-xl font-black italic text-white uppercase font-poppins leading-none">{activeProfile.insurance.insuranceCompany}</h4>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Provider</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-500 uppercase">Policy ID</p>
                                                            <p className="text-xs font-black italic text-white mt-1 uppercase leading-none">{activeProfile.insurance.policyNumber || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-500 uppercase">Coverage Limit</p>
                                                            <p className="text-xs font-black italic text-emerald-400 mt-1 leading-none">₹{activeProfile.insurance.coverageAmount || '0'}</p>
                                                        </div>
                                                    </div>
                                                    {activeProfile.insurance.cashlessFacility && (
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-black italic text-[9px] uppercase">Cashless Active</Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] italic text-slate-600 font-semibold leading-relaxed">No insurance details linked. Click Edit Profile to add insurance.</p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-[#050B18] p-5 rounded-[25px] border border-white/5 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><CheckCircle2 size={18} className="text-emerald-500" /></div><span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] italic">BLOCKCHAIN VERIFIED</span></div>
                                            <div className="bg-[#050B18] p-5 rounded-[25px] border border-white/5 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><Lock size={18} className="text-indigo-500" /></div><span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] italic">ENCRYPTED VAULT</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {activeProfile?.scannerType === 'facial' && activeProfile?.facialImage && (
                            <div className="px-12 pb-12">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Facial Recognition Node</p>
                                <div className="relative w-32 h-32 rounded-3xl overflow-hidden border-2 border-emerald-500/30 group/facial">
                                    <img src={activeProfile.facialImage} alt="Facial Profile" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover/facial:opacity-100 transition-opacity flex items-center justify-center">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {!isEditing && <button onClick={() => setIsEditing(true)} className="w-full h-24 bg-[#050B18] text-white font-black italic uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-4 hover:bg-slate-900 transition-all group font-poppins">Update Medical Records <ChevronRight size={24} className="text-primary group-hover:translate-x-2 transition-transform" /></button>}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#11192A] rounded-[50px] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
                            <RESQRQRCodeCard
                                canvasId={`qr-${activeProfile?.id}`}
                                qrValue={qrValue}
                                userName={editData?.name || activeProfile?.name || activeProfile?.data?.name || 'REGISTERED HOLDER'}
                                size={190}
                                showBorder={false}
                                className="rounded-t-[50px] rounded-b-none cursor-pointer"
                                onClick={handleDownload}
                            />
                            <div className="bg-[#050B18] p-8 flex flex-col items-center text-center">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 font-poppins leading-relaxed">Personalized Link: <span className="text-emerald-400 lowercase">resqr.co.in/{username || '...'}</span></p>
                                <div className="flex flex-col gap-3 w-full">
                                    <Button onClick={handleDownload} className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black italic uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-red-600/20">DOWNLOAD TAG <Download size={18} /></Button>
                                    <Link to="/my-qr" className="w-full"><Button className="w-full h-14 bg-gold hover:bg-gold-light text-black font-black italic uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-gold-glow">MY RESQR CONSOLE <QrCode size={16} /></Button></Link>
                                    <Link to={username ? `/${username}` : `/qr/${activeProfile?.id}`} target="_blank" className="w-full"><Button variant="outline" className="w-full h-14 bg-transparent text-white border-white/10 font-black italic uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">Preview Page <ExternalLink size={16} /></Button></Link>
                                    <button
                                        type="button"
                                        onClick={() => setIsRazorpayOpen(true)}
                                        className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-gold transition-colors py-2"
                                    >
                                        Order a physical tag • from ₹149
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RECENT SCAN ACTIVITY */}
                <div id="recent-scans" className="pt-20 border-t border-white/5 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter font-poppins mb-2">Recent Scanned Locations</h2>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Track where and when your security nodes were accessed.</p>
                        </div>
                        <div className="hidden md:block">
                             <Badge className="bg-primary/10 text-primary border-none px-4 py-2 font-black italic text-[10px] uppercase tracking-widest">LIVE MONITORING ACTIVE</Badge>
                        </div>
                    </div>

                    {activeProfile?.scans ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(activeProfile.scans)
                                .sort((a, b) => {
                                    const timeA = a[1].timestamp || 0;
                                    const timeB = b[1].timestamp || 0;
                                    return timeB - timeA;
                                })
                                .slice(0, 6)
                                .map(([id, scan]) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={id} 
                                    className="bg-[#11192A] p-8 rounded-[40px] border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl"
                                >
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5 group-hover:scale-110 transition-transform">
                                            <MapPin size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 font-poppins italic">{scan.date}</p>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none font-poppins italic">{scan.time}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 italic">Access Point</p>
                                            <p className="text-xl font-black text-white uppercase italic tracking-tight font-poppins group-hover:text-primary transition-colors">
                                                {scan.location || 'Encrypted Node Location'}
                                            </p>
                                        </div>
                                        
                                        {scan.coords ? (
                                            <button 
                                                onClick={() => window.open(`https://www.google.com/maps?q=${scan.coords.lat},${scan.coords.lng}`, '_blank')}
                                                className="w-full py-5 bg-[#050B18] hover:bg-primary text-slate-400 hover:text-white border border-white/5 hover:border-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 italic shadow-inner"
                                            >
                                                <ExternalLink size={16} /> Locate On Grid
                                            </button>
                                        ) : (
                                            <div className="w-full py-5 bg-[#050B18]/50 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-slate-700 flex items-center justify-center gap-2 italic">
                                                <Lock size={14} /> Coordinates Masked
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                        <Activity size={120} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 border-2 border-dashed border-white/5 rounded-[50px] flex flex-col items-center justify-center text-slate-700 italic bg-[#11192A]/30 group">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                <Clock size={32} className="opacity-20 text-white" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No recent scan activity detected on this identity node.</p>
                            <p className="text-[8px] font-bold uppercase tracking-[0.2em] mt-2 opacity-30">Scan your QR tag to initialize tracking.</p>
                        </div>
                    )}
                </div>

                {/* ADDITIONAL IDENTITY NODE - AS REQUESTED */}
                <div className="pt-20 border-t border-white/5 space-y-10">
                    <div className="text-center">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter font-poppins mb-2">Powering Multiple Identities?</h2>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Add another Pet, Vehicle, or Family Member to your ResQR Vault.</p>
                    </div>
                    <button onClick={() => navigate('/create-identity')} className="w-full h-32 border-2 border-dashed border-white/10 rounded-[40px] flex items-center justify-center gap-6 group hover:border-primary/50 transition-all active:scale-95">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                            <Plus size={32} />
                        </div>
                        <div className="text-left">
                            <p className="text-xl font-black italic uppercase tracking-widest group-hover:text-primary transition-all">Create Another Identity Block</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Expansion Node Ready • Secure Setup</p>
                        </div>
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-20">
                         {profiles.length > 1 && profiles.map(p => (
                             <button key={p.id} onClick={() => { setSelectedProfileId(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`h-16 rounded-2xl border transition-all font-black uppercase italic tracking-widest text-[10px] px-4 ${p.id === selectedProfileId ? 'bg-primary border-primary text-white' : 'bg-[#11192A] border-white/5 text-slate-500 hover:border-white/20'}`}>
                                 {p.data?.name || 'Identity Node'} {p.identityType && `(${p.identityType})`}
                             </button>
                         ))}
                    </div>
                </div>

            </div>

            <DemoRazorpayModal 
                isOpen={isRazorpayOpen}
                onClose={() => setIsRazorpayOpen(false)}
                amount={149}
                title="RESQR Physical Emergency Tag"
                customerName={editData.name || 'RESQR Citizen'}
                customerEmail={editData.email || 'citizen@resqr.co.in'}
                customerPhone={editData.phone || '9876543210'}
                onSuccess={(paymentInfo) => {
                    toast.success(`Physical tag order confirmed! Reference: ${paymentInfo.razorpay_payment_id}`);
                }}
            />

            {/* Biometric Face Enrollment Modal */}
            {isFaceEnrollModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-medical-bg/95 backdrop-blur-md">
                    <div className="w-full max-w-2xl bg-medical-card border border-white/10 rounded-[40px] p-8 shadow-2xl relative">
                        <button
                            onClick={() => setIsFaceEnrollModalOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className="mb-6">
                            <Badge className="bg-primary/20 text-primary border-none px-3 py-1 font-black italic tracking-widest text-[9px]">
                                BIOMETRIC PROFILE ENROLLMENT
                            </Badge>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mt-1">
                                {activeProfile?.name || 'Citizen'} — Face ID Setup
                            </h3>
                        </div>
                        <FaceEnrollmentWizard
                            onComplete={handleBiometricEnrollmentComplete}
                            onCancel={() => setIsFaceEnrollModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
