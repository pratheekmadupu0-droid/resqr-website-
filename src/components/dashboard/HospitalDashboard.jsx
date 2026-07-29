import React, { useState, useEffect, useRef } from 'react';
import { 
    Shield, Building, Activity, QrCode, Search, Phone, ExternalLink,
    AlertCircle, FileText, CheckCircle2, Heart, Plus, Trash2, Camera,
    Bed, RefreshCw, Layers, ShieldCheck, MapPin, User, ChevronRight, X
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { db, auth } from '../../lib/firebase';
import { ref, update, get, set, push, onValue } from 'firebase/database';

export default function HospitalDashboard({ data }) {
    const [stats, setStats] = useState({
        scansToday: 4,
        activeRescues: 1,
        reportsGenerated: 24
    });

    const hospital = data?.hospitalProfile || {};
    const [beds, setBeds] = useState(hospital.beds || 50);
    const [icuBeds, setIcuBeds] = useState(hospital.icuBeds || 10);
    const [updatingBeds, setUpdatingBeds] = useState(false);

    // Scanner States
    const [showScanner, setShowScanner] = useState(false);
    const [scannedPatient, setScannedPatient] = useState(null);
    const [scanLoading, setScanLoading] = useState(false);

    // Queue / Lookup States
    const [searchQuery, setSearchQuery] = useState('');
    const [intakeQueue, setIntakeQueue] = useState([]);
    
    // Read intake queue from database or local storage
    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const intakeRef = ref(db, `users/${uid}/intakes`);
        const unsub = onValue(intakeRef, (snapshot) => {
            if (snapshot.exists()) {
                const list = [];
                snapshot.forEach((child) => {
                    list.push({ id: child.key, ...child.val() });
                });
                setIntakeQueue(list.reverse());
            } else {
                // Mock intakes
                setIntakeQueue([
                    { id: '1', name: "Rajesh Malhotra", bloodGroup: "O+", time: "10 mins ago", triage: "Critical", status: "Admitted" },
                    { id: '2', name: "Sunita Sen", bloodGroup: "A-", time: "1 hour ago", triage: "Medium", status: "ICU" },
                    { id: '3', name: "Vikram Rathore", bloodGroup: "B+", time: "2 hours ago", triage: "Low", status: "Discharged" }
                ]);
            }
        });
        return () => unsub();
    }, []);

    // Initialize HTML5 QR Code Scanner
    useEffect(() => {
        if (!showScanner) return;

        const scanner = new Html5QrcodeScanner("hospital-qr-reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        });

        scanner.render(async (decodedText) => {
            scanner.clear();
            setShowScanner(false);
            
            let slug = decodedText;
            if (decodedText.startsWith('http')) {
                try {
                    const url = new URL(decodedText);
                    slug = url.pathname.split('/').pop();
                } catch (e) {
                    console.error("Failed to parse URL:", e);
                }
            }

            await handleFetchPatientProfile(slug);
        }, (error) => {
            // silent scanner feed
        });

        return () => {
            scanner.clear().catch(e => console.error("Html5Qrcode clear error", e));
        };
    }, [showScanner]);

    const handleFetchPatientProfile = async (slug) => {
        setScanLoading(true);
        try {
            // Try fetching by username or profile slug
            let targetSlug = slug;
            const usernameRef = ref(db, `usernames/${slug.toLowerCase()}`);
            const usernameSnap = await get(usernameRef);
            if (usernameSnap.exists()) {
                const pathParts = usernameSnap.val().split('/');
                targetSlug = pathParts.pop();
            }

            // 1. Fetch from global node
            let profileSnap = await get(ref(db, `profiles/${targetSlug}`));

            // 2. Fetch from users sub-profile node if global failed
            if (!profileSnap.exists()) {
                const uid = targetSlug.includes('_') ? targetSlug.split('_')[0] : targetSlug;
                profileSnap = await get(ref(db, `users/${uid}/profiles/${targetSlug}`));
            }

            if (profileSnap.exists()) {
                setScannedPatient({
                    id: targetSlug,
                    ...profileSnap.val()
                });
                toast.success("Emergency Medical Profile Decrypted!");
            } else {
                toast.error("Profile not found or vault access denied.");
            }
        } catch (error) {
            console.error("Patient fetch error:", error);
            toast.error("Decryption failed: " + error.message);
        } finally {
            setScanLoading(false);
        }
    };

    const handleIntakeAcknowledge = async () => {
        if (!scannedPatient) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        try {
            const patientName = scannedPatient.name || scannedPatient.data?.name || "Unknown Patient";
            const bg = scannedPatient.medical?.bloodGroup || scannedPatient.data?.bloodGroup || "N/A";
            
            const newIntake = {
                name: patientName,
                bloodGroup: bg,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                triage: scannedPatient.medical?.emergencyNotes ? "Critical" : "Medium",
                status: "Admitted",
                date: new Date().toLocaleDateString()
            };

            await push(ref(db, `users/${uid}/intakes`), newIntake);
            toast.success("Intake acknowledged! Patient added to emergency queue.");
            setScannedPatient(null);
        } catch (error) {
            toast.error("Failed to add to intake queue: " + error.message);
        }
    };

    const handleUpdateBeds = async () => {
        setUpdatingBeds(true);
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        try {
            await update(ref(db, `users/${uid}/hospitalProfile`), {
                beds: parseInt(beds),
                icuBeds: parseInt(icuBeds)
            });
            toast.success("Hospital capacity metrics updated live.");
        } catch (error) {
            toast.error("Capacity update failed: " + error.message);
        } finally {
            setUpdatingBeds(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        handleFetchPatientProfile(searchQuery);
    };

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 space-y-12">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                            <Building size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter font-poppins text-white leading-tight">
                                    {hospital.hospitalName || 'Network Hospital'}
                                </h1>
                                <Badge className="bg-green-500/20 text-green-500 border-none px-3 py-1 font-black italic text-[9px] uppercase tracking-widest">
                                    VERIFIED RESQR PORT
                                </Badge>
                            </div>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.25em] mt-2 italic">
                                Plan: <span className="text-white font-black">{hospital.plan?.name || 'Standard Port'}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <Button 
                            onClick={() => setShowScanner(true)}
                            className="bg-primary text-white border-none py-4 px-8 rounded-2xl font-black italic uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                        >
                            <QrCode size={16} /> Scan Patient QR
                        </Button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#11192A] p-8 rounded-[35px] border border-white/5 flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                            <Activity size={26} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Emergency Scans Today</p>
                            <p className="text-3xl font-black italic text-white font-poppins">{stats.scansToday}</p>
                        </div>
                    </div>
                    <div className="bg-[#11192A] p-8 rounded-[35px] border border-white/5 flex items-center gap-5">
                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 text-red-500">
                            <AlertCircle size={26} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active EMS Dispatches</p>
                            <p className="text-3xl font-black italic text-red-500 font-poppins">{stats.activeRescues}</p>
                        </div>
                    </div>
                    <div className="bg-[#11192A] p-8 rounded-[35px] border border-white/5 flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                            <FileText size={26} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Intakes Logged</p>
                            <p className="text-3xl font-black italic text-white font-poppins">{intakeQueue.length}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Queue & Lookup */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Lookup patient manually */}
                        <Card className="p-8 bg-[#11192A] border-white/5 rounded-[45px] shadow-2xl">
                            <h3 className="text-xl font-black italic uppercase tracking-tighter font-poppins text-white mb-6">
                                PATIENT ACCESS PORTAL
                            </h3>
                            <form onSubmit={handleSearch} className="flex gap-4">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Search size={18} /></span>
                                    <input 
                                        type="text" 
                                        placeholder="Enter RESQR Profile Code / Username (e.g. c_uid or client-username)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-primary transition-all placeholder:text-slate-700 text-sm"
                                    />
                                </div>
                                <Button 
                                    type="submit"
                                    className="bg-slate-950 border border-white/5 hover:border-primary px-8 rounded-2xl font-black italic uppercase tracking-widest text-[10px]"
                                >
                                    Decrypt Vault
                                </Button>
                            </form>
                        </Card>

                        {/* Intake Queue */}
                        <Card className="bg-[#11192A] border-white/5 rounded-[45px] overflow-hidden">
                            <div className="p-10 pb-4">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                    EMERGENCY ROOM INTAKE QUEUE
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    Live intake logs and triage queue for emergency arrivals
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-950/20">
                                            <th className="px-10 py-5">Patient Name</th>
                                            <th className="px-6 py-5">Blood Group</th>
                                            <th className="px-6 py-5">Logged Time</th>
                                            <th className="px-6 py-5">Triage Status</th>
                                            <th className="px-10 py-5 text-right">Disposition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                        {intakeQueue.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-950/10 transition-colors">
                                                <td className="px-10 py-5 font-black uppercase italic text-white">{item.name}</td>
                                                <td className="px-6 py-5 font-bold text-slate-400">{item.bloodGroup}</td>
                                                <td className="px-6 py-5 font-bold text-slate-400">{item.time}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.triage === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                        {item.triage}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-5 text-right font-black italic text-primary">{item.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Bed capacity control */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Bed allocation widgets */}
                        <Card className="p-8 bg-[#11192A] border-white/5 rounded-[45px] shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                    <Bed size={20} />
                                </div>
                                <h3 className="text-lg font-black italic uppercase tracking-tighter font-poppins text-white">
                                    BED ALLOCATION CONTROL
                                </h3>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="General Beds" 
                                        type="number"
                                        value={beds}
                                        onChange={(e) => setBeds(e.target.value)}
                                    />
                                    <Input 
                                        label="ICU Beds Available" 
                                        type="number"
                                        value={icuBeds}
                                        onChange={(e) => setIcuBeds(e.target.value)}
                                    />
                                </div>
                                <Button 
                                    onClick={handleUpdateBeds}
                                    disabled={updatingBeds}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px]"
                                >
                                    {updatingBeds ? 'Updating SOC...' : 'Broadcast Bed Availability'}
                                </Button>
                            </div>
                        </Card>

                        {/* Network Alerts */}
                        <Card className="p-8 bg-[#11192A] border-white/5 rounded-[45px] shadow-2xl">
                            <h3 className="text-lg font-black italic uppercase tracking-tighter font-poppins text-white mb-6">
                                SYSTEM NETWORK ALERTS
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest block mb-1">🚨 Critical Trauma dispatch</span>
                                    <p className="text-xs font-bold text-slate-300 leading-relaxed">Ambulance RESQR-09 is route to your ER with a road trauma victim. ETA 8 minutes.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Webcam Scanner Modal */}
                {showScanner && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <Card className="p-8 bg-[#11192A] border-white/10 rounded-[45px] w-full max-w-md text-center shadow-2xl relative">
                            <button 
                                onClick={() => setShowScanner(false)} 
                                className="absolute top-6 right-6 p-2 bg-slate-900 border border-white/5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                            >
                                <X size={16} />
                            </button>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter font-poppins text-white mb-6">
                                SCAN RESQR EMERGENCY TAG
                            </h3>
                            <div id="hospital-qr-reader" className="w-full aspect-square rounded-3xl overflow-hidden bg-slate-950 border border-white/5 mb-6" />
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">
                                Center the patient's QR code within the frame to authorize decryption
                            </p>
                        </Card>
                    </div>
                )}

                {/* Scanned Patient Medical Vault Modal */}
                {scannedPatient && (
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
                        <Card className="p-10 bg-[#11192A] border-white/10 rounded-[50px] w-full max-w-4xl shadow-2xl relative my-12">
                            <button 
                                onClick={() => setScannedPatient(null)} 
                                className="absolute top-8 right-8 p-3 bg-slate-900 border border-white/5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col md:flex-row gap-8 items-center border-b border-white/5 pb-8 mb-8">
                                <div className="relative">
                                    {scannedPatient.profilePhoto ? (
                                        <img src={scannedPatient.profilePhoto} alt="Patient Portrait" className="w-28 h-28 object-cover rounded-3xl border-2 border-primary" />
                                    ) : (
                                        <div className="w-28 h-28 bg-slate-950 border border-white/5 rounded-3xl flex items-center justify-center text-primary">
                                            <User size={40} />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex flex-col md:flex-row items-center gap-3">
                                        <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins text-white leading-tight">
                                            {scannedPatient.name || scannedPatient.data?.name}
                                        </h2>
                                        <Badge className="bg-red-500/20 text-red-500 border-none px-3 py-1 font-black italic text-[9px] uppercase tracking-widest">
                                            PATIENT VAULT DECRYPTED
                                        </Badge>
                                    </div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
                                        DOB: <span className="text-white">{scannedPatient.dob || "N/A"}</span> • Gender: <span className="text-white uppercase">{scannedPatient.gender || "N/A"}</span> • Phone: <span className="text-white">{scannedPatient.phone}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Medical Passport */}
                                <div className="space-y-6 md:col-span-2">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary italic border-b border-white/5 pb-2 font-poppins">
                                        Medical History & Vitals
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Blood Group</span>
                                            <span className="text-3xl font-black italic text-red-500 font-poppins">
                                                {scannedPatient.medical?.bloodGroup || scannedPatient.data?.bloodGroup || "N/A"}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Height</span>
                                            <span className="text-xl font-black italic text-white font-poppins">
                                                {scannedPatient.medical?.height || "N/A"} cm
                                            </span>
                                        </div>
                                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Weight</span>
                                            <span className="text-xl font-black italic text-white font-poppins">
                                                {scannedPatient.medical?.weight || "N/A"} kg
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Chronic Conditions</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-xs font-semibold text-white/80">
                                                {scannedPatient.medical?.medicalConditions || scannedPatient.data?.healthIssues || "No chronic illnesses reported."}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Allergies (Critical)</span>
                                            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 text-xs font-bold text-red-400">
                                                {scannedPatient.medical?.allergies || scannedPatient.data?.allergies || "No allergies reported."}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Current Medications</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-xs font-semibold text-white/80">
                                                {scannedPatient.medical?.currentMedication || "None."}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Emergency Notes & Directives</span>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-xs font-bold text-amber-500">
                                                {scannedPatient.medical?.emergencyNotes || "None."}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Contacts & Insurance */}
                                <div className="space-y-6">
                                    {/* Emergency Contact */}
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic border-b border-white/5 pb-2 mb-3">
                                            Emergency Contacts
                                        </h3>
                                        <div className="space-y-3">
                                            {(scannedPatient.emergencyContacts || [
                                                { name: scannedPatient.data?.emergencyContactName, relationship: scannedPatient.data?.emergencyContactRelation, phone: scannedPatient.data?.emergencyContactPhone }
                                            ]).map((c, idx) => (
                                                <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex justify-between items-center text-xs">
                                                    <div>
                                                        <span className="font-black uppercase italic block text-white">{c.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">{c.relationship}</span>
                                                    </div>
                                                    <a href={`tel:${c.phone}`} className="p-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/10">
                                                        <Phone size={14} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Insurance Vault */}
                                    {scannedPatient.insurance && (
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic border-b border-white/5 pb-2 mb-3">
                                                Insurance Policy Details
                                            </h3>
                                            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3 text-[11px] font-bold">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Provider</span>
                                                    <span className="text-white uppercase italic">{scannedPatient.insurance.insuranceCompany}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Policy No</span>
                                                    <span className="text-white uppercase">{scannedPatient.insurance.policyNumber}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Cashless</span>
                                                    <span className={scannedPatient.insurance.cashlessFacility ? "text-emerald-500" : "text-red-500"}>
                                                        {scannedPatient.insurance.cashlessFacility ? "ACTIVE" : "NO"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 mt-8 flex justify-end gap-4">
                                <Button 
                                    onClick={() => setScannedPatient(null)}
                                    variant="outline" 
                                    className="py-4 px-6 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white"
                                >
                                    Dismiss Profile
                                </Button>
                                <Button 
                                    onClick={handleIntakeAcknowledge}
                                    className="py-4 px-8 bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20"
                                >
                                    Acknowledge Intake & Log Patient
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

            </div>
        </div>
    );
}
