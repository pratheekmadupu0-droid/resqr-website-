import React, { useState } from 'react';
import { 
    Shield, Lock, Activity, Users, FileText, CheckCircle2, ChevronRight, 
    Award, Key, MapPin, QrCode, Search, Phone, Camera, Bed, RefreshCw, 
    Layers, ShieldCheck, Plus, Trash2, X, Clock, CreditCard, Database, 
    AlertTriangle, Check, Heart, Info, User
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { calculateAge } from '../lib/dateUtils';

// Initial list of patient profiles
const INITIAL_PATIENTS = [
    {
        id: 'pat-1',
        name: 'PRATHEEK M.',
        age: '28 Yrs',
        blood: 'O+',
        status: 'IN TRANSIT',
        priority: 'CRITICAL',
        dob: '12th March 1998',
        gender: 'Male',
        phone: '+91 98765 43210',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        allergies: 'Penicillin, Peanuts',
        conditions: 'Asthma',
        medications: 'Albuterol Inhaler (as needed)',
        emergencyContact: { name: 'Kavitha M.', relation: 'Mother', phone: '+91 98765 43211' },
        notes: 'Carries EpiPen. Responds to albuterol during asthma attacks.'
    },
    {
        id: 'pat-2',
        name: 'ANANYA R.',
        age: '32 Yrs',
        blood: 'AB-',
        status: 'ER ADMITTED',
        priority: 'ALERT',
        dob: '4th July 1994',
        gender: 'Female',
        phone: '+91 99887 76655',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        allergies: 'Sulfa Drugs',
        conditions: 'None',
        medications: 'None',
        emergencyContact: { name: 'Rahul R.', relation: 'Husband', phone: '+91 99887 76650' },
        notes: 'Patient was admitted with acute abdominal pain.'
    },
    {
        id: 'pat-3',
        name: 'ROHAN S.',
        age: '45 Yrs',
        blood: 'B+',
        status: 'DISCHARGED',
        priority: 'INFO',
        dob: '18th November 1980',
        gender: 'Male',
        phone: '+91 91234 56789',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        allergies: 'None',
        conditions: 'Hypertension',
        medications: 'Lisinopril 10mg daily',
        emergencyContact: { name: 'Priya S.', relation: 'Wife', phone: '+91 91234 56780' },
        notes: 'Stable blood pressure. Discharged following routine checkup.'
    }
];

const SIMULATION_PROFILES = [
    {
        id: 'pat-4',
        name: 'VIKRAM K.',
        age: '41 Yrs',
        blood: 'A+',
        status: 'IN TRANSIT',
        priority: 'CRITICAL',
        dob: '22nd September 1985',
        gender: 'Male',
        phone: '+91 98888 77777',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        allergies: 'Aspirin, Shellfish',
        conditions: 'Type 2 Diabetes',
        medications: 'Metformin 500mg, Insulin',
        emergencyContact: { name: 'Sunita K.', relation: 'Wife', phone: '+91 98888 77770' },
        notes: 'Cardiac history. Do not administer aspirin due to severe allergy.'
    },
    {
        id: 'pat-5',
        name: 'PRIYA N.',
        age: '19 Yrs',
        blood: 'O-',
        status: 'IN TRANSIT',
        priority: 'ALERT',
        dob: '5th May 2007',
        gender: 'Female',
        phone: '+91 97777 66666',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        allergies: 'Peanuts, Tree Nuts (Severe Anaphylaxis)',
        conditions: 'None',
        medications: 'None',
        emergencyContact: { name: 'Karan N.', relation: 'Father', phone: '+91 97777 66660' },
        notes: 'Carries dual-pack EpiPen. Severe peanut allergy.'
    },
    {
        id: 'pat-6',
        name: 'KABIR S.',
        age: '53 Yrs',
        blood: 'B-',
        status: 'ER ADMITTED',
        priority: 'ALERT',
        dob: '14th February 1973',
        gender: 'Male',
        phone: '+91 96666 55555',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        allergies: 'Latex',
        conditions: 'Mild COPD',
        medications: 'Spiriva inhaler',
        emergencyContact: { name: 'Meera S.', relation: 'Daughter', phone: '+91 96666 55550' },
        notes: 'COPD exacerbation. Use latex-free gloves and equipment.'
    }
];

export default function SolutionsHospitals() {
    const sections = [
        { title: 'Hospital Registration', desc: 'Secure onboarding portal for clinics and multi-speciality network hospitals.' },
        { title: 'Hospital Verification', desc: 'Credential audits matching institutional licensing protocols.' },
        { title: 'Hospital ID', desc: 'Secure hospital access keys linked to active practitioner directories.' },
        { title: 'Hospital Capacity', desc: 'Real-time telemetry showing emergency room (ER) and ICU occupancy levels.' },
        { title: 'Hospital Subscription', desc: 'Flexible SLA tiers for digital patient records synchronization.' },
        { title: 'Hospital Scanner', desc: 'Dedicated barcode and NFC scanning interface for triage reception.' },
        { title: 'Patient Identification', desc: 'Instant search across scanned databases matching name and age parameters.' },
        { title: 'Authorised Medical Access', desc: 'Encrypted patient records decryption using verified system tokens.' },
        { title: 'Emergency Patient Profile', desc: 'Blood group, allergy list, and emergency contacts consolidated view.' },
        { title: 'Insurance Information', desc: 'Pre-admission health insurance claims mapping for instant credit clearance.' },
        { title: 'Access Logs', desc: 'Compliance audit trail containing timestamp, physician name, and access purpose.' }
    ];

    const workflow = [
        'Ambulance Arrives',
        'Patient Identified',
        'RESQR Scanned',
        'Hospital Verified',
        'Medical Profile Loaded',
        'Doctor Reviews',
        'Emergency Care Started'
    ];

    const dashboardTabs = [
        'Emergency Patients', 'Scan RESQR', 'Patient Search', 'Patient History', 'Insurance Logs', 'Access Logs', 'Hospital Profile', 'Subscription Status'
    ];

    // Live states for Mock Terminal
    const [activeTab, setActiveTab] = useState('Emergency Patients');
    const [patients, setPatients] = useState(INITIAL_PATIENTS);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [scanSimulating, setScanSimulating] = useState(false);
    const [manualCode, setManualCode] = useState('');

    // Hospital Profile state
    const [hospitalProfile, setHospitalProfile] = useState({
        name: 'Max Emergency Center',
        traumaLevel: 'Level 1 Trauma Center',
        generalBeds: 45,
        icuBeds: 12,
        surgeonsCount: 4,
        address: 'Sector 62, Noida, UP - 201301',
        status: 'Online'
    });

    // Diagnostic state
    const [diagnosticStatus, setDiagnosticStatus] = useState('idle');

    // History logs
    const [history, setHistory] = useState([
        { id: 'h-1', name: 'RAJESH MALHOTRA', age: '56 Yrs', date: '16-Aug-2026', diagnosis: 'Mild Myocardial Infarction', doctor: 'Dr. Aditya Verma', status: 'Transferred to ICU' },
        { id: 'h-2', name: 'SUNITA SEN', age: '34 Yrs', date: '15-Aug-2026', diagnosis: 'Acute Appendicitis', doctor: 'Dr. Sarah Jones', status: 'Discharged' },
        { id: 'h-3', name: 'VIKRAM RATHORE', age: '62 Yrs', date: '13-Aug-2026', diagnosis: 'Chronic Bronchitis Flare-up', doctor: 'Dr. N. Sinha', status: 'Discharged' },
        { id: 'h-4', name: 'SARA KHAN', age: '29 Yrs', date: '10-Aug-2026', diagnosis: 'Fractured Tibia (Sports Injury)', doctor: 'Dr. Aditya Verma', status: 'Discharged' }
    ]);

    // Insurance logs
    const [insuranceLogs, setInsuranceLogs] = useState([
        { id: 'i-1', name: 'PRATHEEK M.', provider: 'STAR HEALTH', policy: 'POL-882182', coverage: '₹5,000,000', facility: 'ACTIVE', status: 'Approved' },
        { id: 'i-2', name: 'ANANYA R.', provider: 'HDFC ERGO', policy: 'POL-992381', coverage: '₹2,500,000', facility: 'ACTIVE', status: 'Approved' },
        { id: 'i-3', name: 'VIKRAM K.', provider: 'MAX BUPA', policy: 'POL-441292', coverage: '₹7,500,000', facility: 'ACTIVE', status: 'Pending Review' },
        { id: 'i-4', name: 'PRIYA N.', provider: 'ICICI LOMBARD', policy: 'POL-223192', coverage: '₹1,000,000', facility: 'ACTIVE', status: 'Approved' },
        { id: 'i-5', name: 'ROHAN S.', provider: 'NIPPON LIFE', policy: 'POL-110293', coverage: '₹3,000,000', facility: 'INACTIVE', status: 'Direct Bill' }
    ]);

    // Compliance Access logs
    const [accessLogs, setAccessLogs] = useState([
        { timestamp: '17-Aug-2026 00:15:30', user: 'Dr. Aditya Verma', patient: 'PRATHEEK M.', purpose: 'Emergency Decrypt - Critical Triage', level: 'Emergency Decrypt', status: 'Authorized' },
        { timestamp: '17-Aug-2026 00:12:15', user: 'Nurse Sarah Jones', patient: 'ANANYA R.', purpose: 'Admissions Intake', level: 'Standard Decrypt', status: 'Authorized' },
        { timestamp: '17-Aug-2026 00:08:44', user: 'Dr. Aditya Verma', patient: 'ROHAN S.', purpose: 'Discharge Summary Sign-off', level: 'Standard Decrypt', status: 'Authorized' },
        { timestamp: '16-Aug-2026 23:45:00', user: 'System Admin', patient: 'System Database', purpose: 'Daily Encryption Key Rotation', level: 'System Administration', status: 'Authorized' }
    ]);

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Embedded CSS for custom scanner line animation */}
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 0.8; }
                    100% { top: 0%; opacity: 0.8; }
                }
            `}</style>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">HOSPITAL ENTERPRISE</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        TURN EMERGENCY INFORMATION <br />
                        <span className="text-primary italic-display">INTO ACTIONABLE INFORMATION.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Integrate RESQR digital health passport data straight into your hospital ERP. Accelerate triage admissions, mitigate billing delays, and save lives.
                    </p>
                </div>
            </section>

            {/* Workflow Diagram */}
            <section className="py-24 bg-slate-950 border-b border-white/5 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">TRIAGE & ADMISSION WORKFLOW</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">From physical scanner to medical care execution</p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
                        {workflow.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-black italic text-sm mb-4">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 max-w-[120px]">{step}</span>
                                </div>
                                {idx < workflow.length - 1 && (
                                    <ChevronRight className="text-slate-700 hidden lg:block" size={24} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* Detailed Feature Sections */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">PLATFORM ARCHITECTURE FEATURES</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Comprehensive toolkits powering critical care admissions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sections.map((sec, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all">
                            <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{sec.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-semibold">{sec.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Dashboard Mockup */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">HOSPITAL TRIAGE DASHBOARD PREVIEW</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Interactive ER reception system interface</p>
                    </div>

                    <Card className="bg-medical-card border-white/5 overflow-hidden p-0 rounded-[40px] shadow-2xl relative">
                        {/* Fake browser header */}
                        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <span className="w-3 h-3 rounded-full bg-green-500/50" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">MAX EMERGENCY CENTER TERMINAL</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Sync Online</span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row min-h-[480px]">
                            {/* Left Navigation bar */}
                            <div className="w-full lg:w-1/4 bg-slate-950 p-6 border-r border-white/5 space-y-2">
                                {dashboardTabs.map((tab, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => {
                                            setActiveTab(tab);
                                        }}
                                        className={`p-4 rounded-xl text-xs font-black uppercase tracking-wider italic transition-all cursor-pointer ${activeTab === tab ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                    >
                                        {tab}
                                    </div>
                                ))}
                            </div>

                            {/* Right Content dashboard */}
                            <div className="w-full lg:w-3/4 p-8 md:p-10 space-y-8">
                                
                                {/* VIEW: Emergency Patients */}
                                {activeTab === 'Emergency Patients' && (
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                            <div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Emergency Patients Queue</h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Real-time scan admissions triage</p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                onClick={() => setActiveTab('Scan RESQR')}
                                                className="font-black italic text-[10px] uppercase tracking-widest bg-primary"
                                            >
                                                SCAN NEW PATIENT
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {patients.map((pat, idx) => (
                                                <div 
                                                    key={pat.id} 
                                                    onClick={() => setSelectedPatient(pat)}
                                                    className="p-5 bg-slate-950/80 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/30 hover:bg-slate-900/40 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                                        {pat.photo ? (
                                                            <img src={pat.photo} alt={pat.name} className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:border-primary/50 transition-all" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-white/10 text-primary">
                                                                <Users size={20} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="text-base font-black text-white italic tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
                                                                {pat.name} <span className="text-xs text-slate-400 font-semibold italic">({pat.age})</span>
                                                            </h4>
                                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mt-0.5">BLOOD GROUP: {pat.blood}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                                            <select 
                                                                value={pat.status} 
                                                                onChange={(e) => {
                                                                    const newStatus = e.target.value;
                                                                    setPatients(patients.map(p => p.id === pat.id ? { ...p, status: newStatus } : p));
                                                                    toast.success(`Updated ${pat.name} status to ${newStatus}`);
                                                                }}
                                                                className="bg-slate-900 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-primary"
                                                            >
                                                                <option value="IN TRANSIT">IN TRANSIT</option>
                                                                <option value="ER ADMITTED">ER ADMITTED</option>
                                                                <option value="DISCHARGED">DISCHARGED</option>
                                                            </select>
                                                        </div>
                                                        <Badge variant={pat.priority === 'CRITICAL' ? 'danger' : pat.priority === 'ALERT' ? 'warning' : 'primary'}>
                                                            {pat.priority}
                                                        </Badge>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPatients(patients.filter(p => p.id !== pat.id));
                                                                toast.success(`Dismissed ${pat.name} from emergency queue`);
                                                            }}
                                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {patients.length === 0 && (
                                                <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl bg-slate-950/20">
                                                    <Activity className="mx-auto text-slate-600 mb-4 animate-pulse" size={40} />
                                                    <p className="text-sm font-bold text-slate-400">Emergency Queue Empty</p>
                                                    <p className="text-xs text-slate-600 mt-1">Scan a new patient RESQR tag to decrypt and log them here.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* VIEW: Scan RESQR */}
                                {activeTab === 'Scan RESQR' && (
                                    <div className="space-y-8">
                                        <div className="border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Scan Patient RESQR Tag</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Hold QR code or NFC tag near camera to decrypt</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-slate-950 rounded-3xl border border-white/5 p-6 text-center relative overflow-hidden">
                                                <div className="w-full max-w-sm mx-auto aspect-video bg-slate-900/60 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center gap-4">
                                                    {scanSimulating ? (
                                                        <div className="flex flex-col items-center justify-center gap-4 p-4 text-center z-10">
                                                            <RefreshCw className="text-primary animate-spin" size={32} />
                                                            <div>
                                                                <p className="text-xs font-black uppercase tracking-widest text-primary">DECRYPTING VAULT KEY...</p>
                                                                <p className="text-[10px] text-slate-400 mt-1 font-semibold italic">Establishing secure connection to RESQR Decentralized Ledger...</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary" />
                                                            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary" />
                                                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary" />
                                                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary" />
                                                            
                                                            <div className="absolute left-0 right-0 h-0.5 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{ animation: 'scan 2s ease-in-out infinite' }} />
                                                            
                                                            <Camera className="text-slate-600 animate-pulse" size={48} />
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting RESQR Tag Scan</p>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                <p className="text-slate-400 text-xs font-semibold max-w-md mx-auto mt-6">
                                                    Hold a physical RESQR wristband, smart card, or digital QR badge in front of the scanner. Or simulate a test profile below:
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {SIMULATION_PROFILES.map((profile) => (
                                                    <button
                                                        key={profile.id}
                                                        disabled={scanSimulating}
                                                        onClick={() => {
                                                            setScanSimulating(true);
                                                            toast.loading(`Scanning ${profile.name}'s RESQR code...`, { id: 'scan-toast' });
                                                            setTimeout(() => {
                                                                toast.dismiss('scan-toast');
                                                                setPatients(prev => {
                                                                    if (prev.some(p => p.id === profile.id)) return prev;
                                                                    return [profile, ...prev];
                                                                });
                                                                
                                                                const newLog = {
                                                                    timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
                                                                    user: 'Dr. Aditya Verma',
                                                                    patient: profile.name,
                                                                    purpose: 'Emergency Decrypt - ' + (profile.priority === 'CRITICAL' ? 'Critical Trauma' : 'Admission Triage'),
                                                                    level: 'Emergency Decrypt',
                                                                    status: 'Authorized'
                                                                };
                                                                setAccessLogs(prev => [newLog, ...prev]);

                                                                setScanSimulating(false);
                                                                setSelectedPatient(profile);
                                                                setActiveTab('Emergency Patients');
                                                                toast.success(`${profile.name} Decrypted and Added to Emergency Queue!`);
                                                            }, 2000);
                                                        }}
                                                        className="p-4 bg-slate-900/60 border border-white/5 hover:border-primary/50 hover:bg-slate-900 rounded-2xl text-left transition-all active:scale-95 group disabled:opacity-50"
                                                    >
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-widest block mb-1">Simulate Tag Scan</span>
                                                        <span className="text-sm font-black text-white italic block group-hover:text-primary transition-colors">{profile.name} ({profile.age})</span>
                                                        <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Blood: {profile.blood} • {profile.priority}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="bg-slate-950 p-6 rounded-3xl border border-white/5">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">Manual Decryption Key Bypass</h4>
                                                <div className="flex gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter RESQR Profile Decryption Key (e.g. RE-98218)"
                                                        value={manualCode}
                                                        onChange={(e) => setManualCode(e.target.value)}
                                                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all placeholder:text-slate-700"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (!manualCode.trim()) {
                                                                toast.error('Please enter a key');
                                                                return;
                                                            }
                                                            toast.loading('Verifying decryption token...', { id: 'manual-toast' });
                                                            setTimeout(() => {
                                                                toast.dismiss('manual-toast');
                                                                const found = SIMULATION_PROFILES.find(p => p.id.includes(manualCode.toLowerCase()) || p.name.toLowerCase().includes(manualCode.toLowerCase()));
                                                                const profile = found || {
                                                                    id: 'pat-manual-' + Date.now(),
                                                                    name: manualCode.toUpperCase() + ' (MOCK)',
                                                                    age: '30 Yrs',
                                                                    blood: 'O+',
                                                                    status: 'IN TRANSIT',
                                                                    priority: 'ALERT',
                                                                    dob: '1st Jan 1996',
                                                                    gender: 'Male',
                                                                    phone: '+91 99999 88888',
                                                                    photo: null,
                                                                    allergies: 'None reported',
                                                                    conditions: 'None reported',
                                                                    medications: 'None',
                                                                    emergencyContact: { name: 'Guardian', relation: 'Contact', phone: '+91 99999 88880' },
                                                                    notes: 'Manually logged using bypass credential.'
                                                                };

                                                                setPatients(prev => {
                                                                    if (prev.some(p => p.id === profile.id)) return prev;
                                                                    return [profile, ...prev];
                                                                });

                                                                const newLog = {
                                                                    timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
                                                                    user: 'Dr. Aditya Verma',
                                                                    patient: profile.name,
                                                                    purpose: 'Bypass Key Decrypt',
                                                                    level: 'Bypass Override',
                                                                    status: 'Authorized'
                                                                };
                                                                setAccessLogs(prev => [newLog, ...prev]);

                                                                setSelectedPatient(profile);
                                                                setActiveTab('Emergency Patients');
                                                                setManualCode('');
                                                                toast.success(`Token Auth Valid: Unlocked ${profile.name}`);
                                                            }, 1500);
                                                        }}
                                                        className="bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-6 py-3 transition-all"
                                                    >
                                                        Decrypt Vault
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VIEW: Patient Search */}
                                {activeTab === 'Patient Search' && (
                                    <div className="space-y-8">
                                        <div className="border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Patient Search Vault</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Query local emergency database and cloud backups</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Search size={18} /></span>
                                                <input 
                                                    type="text" 
                                                    placeholder="Search local emergency database by Patient Name, ID, or Blood Group..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-primary transition-all placeholder:text-slate-700 text-sm"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                {patients.filter(p => 
                                                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    p.blood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    p.id.toLowerCase().includes(searchQuery.toLowerCase())
                                                ).map((pat) => (
                                                    <div 
                                                        key={pat.id}
                                                        onClick={() => setSelectedPatient(pat)}
                                                        className="p-5 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer hover:bg-slate-900/40 group"
                                                    >
                                                        <div>
                                                            <h4 className="text-base font-black text-white italic tracking-tight group-hover:text-primary transition-all">{pat.name} ({pat.age})</h4>
                                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">BLOOD GROUP: {pat.blood} • ID: {pat.id}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant={pat.priority === 'CRITICAL' ? 'danger' : pat.priority === 'ALERT' ? 'warning' : 'primary'}>
                                                                {pat.priority}
                                                            </Badge>
                                                            <ChevronRight className="text-slate-600 group-hover:text-primary transition-colors" size={16} />
                                                        </div>
                                                    </div>
                                                ))}
                                                {patients.filter(p => 
                                                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    p.blood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    p.id.toLowerCase().includes(searchQuery.toLowerCase())
                                                ).length === 0 && (
                                                    <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl bg-slate-950/20">
                                                        <Search className="mx-auto text-slate-600 mb-4" size={40} />
                                                        <p className="text-sm font-bold text-slate-400">No matching profiles found</p>
                                                        <p className="text-xs text-slate-600 mt-1">Try searching for "Pratheek", "O+", or "pat-1".</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VIEW: Patient History */}
                                {activeTab === 'Patient History' && (
                                    <div className="space-y-8">
                                        <div className="border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Discharge & History Logs</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Historical archive of patients logged at this terminal</p>
                                        </div>

                                        <div className="overflow-x-auto bg-slate-950 rounded-3xl border border-white/5">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/30">
                                                        <th className="px-6 py-4">Patient Name</th>
                                                        <th className="px-6 py-4">Admission Date</th>
                                                        <th className="px-6 py-4">Diagnosis</th>
                                                        <th className="px-6 py-4">Attending Doctor</th>
                                                        <th className="px-6 py-4 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-slate-300">
                                                    {history.map((row) => (
                                                        <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                                                            <td className="px-6 py-4 font-black text-white italic">{row.name} ({row.age})</td>
                                                            <td className="px-6 py-4 font-semibold">{row.date}</td>
                                                            <td className="px-6 py-4 font-semibold text-slate-400">{row.diagnosis}</td>
                                                            <td className="px-6 py-4 font-semibold">{row.doctor}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${row.status === 'Discharged' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* VIEW: Insurance Logs */}
                                {activeTab === 'Insurance Logs' && (
                                    <div className="space-y-8">
                                        <div className="border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Insurance Claims & Pre-Auth Logs</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Pre-admission cashless verification and coverage mapping</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="overflow-x-auto bg-slate-950 rounded-3xl border border-white/5">
                                                <table className="w-full border-collapse text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/30">
                                                            <th className="px-6 py-4">Patient Name</th>
                                                            <th className="px-6 py-4">Insurance Provider</th>
                                                            <th className="px-6 py-4">Policy No.</th>
                                                            <th className="px-6 py-4">Coverage Limit</th>
                                                            <th className="px-6 py-4 text-center">Cashless Facility</th>
                                                            <th className="px-6 py-4 text-right">Pre-Auth Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 text-slate-300">
                                                        {insuranceLogs.map((log) => (
                                                            <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                                                                <td className="px-6 py-4 font-black text-white italic">{log.name}</td>
                                                                <td className="px-6 py-4 font-black text-slate-400 tracking-wider italic text-[10px]">{log.provider}</td>
                                                                <td className="px-6 py-4 font-mono font-bold text-slate-400">{log.policy}</td>
                                                                <td className="px-6 py-4 font-bold text-white">{log.coverage}</td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-widest ${log.facility === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                        {log.facility}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${log.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : log.status === 'Pending Review' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border border-white/5'}`}>
                                                                        {log.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={() => {
                                                        toast.loading('Querying insurance gateway nodes...', { id: 'ins-sync' });
                                                        setTimeout(() => {
                                                            toast.success('All insurance cashless mappings are synchronized with HIE (Health Information Exchange)', { id: 'ins-sync' });
                                                        }, 1500);
                                                    }}
                                                    className="flex items-center gap-2 bg-slate-900 border border-white/5 hover:border-primary/50 text-white font-black italic uppercase tracking-widest text-[9px] px-6 py-3 rounded-xl transition-all"
                                                >
                                                    <RefreshCw size={12} /> Sync Gateway Nodes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VIEW: Access Logs */}
                                {activeTab === 'Access Logs' && (
                                    <div className="space-y-8">
                                        <div className="border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">HIPAA & Security Compliance Logs</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Real-time immutable audit trail of medical record decryptions</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Showing last {accessLogs.length} audit entries</span>
                                                <Badge variant="success" className="text-[8px]">HIPAA Compliant</Badge>
                                            </div>
                                            <div className="overflow-x-auto bg-slate-950 rounded-3xl border border-white/5">
                                                <table className="w-full border-collapse text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-900/30">
                                                            <th className="px-6 py-4">Timestamp</th>
                                                            <th className="px-6 py-4">Authorized Agent</th>
                                                            <th className="px-6 py-4">Accessed Target</th>
                                                            <th className="px-6 py-4">Access Purpose</th>
                                                            <th className="px-6 py-4">Clearance Level</th>
                                                            <th className="px-6 py-4 text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                                                        {accessLogs.map((log, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-900/40 transition-colors text-[11px]">
                                                                <td className="px-6 py-4 text-slate-500">{log.timestamp}</td>
                                                                <td className="px-6 py-4 font-bold text-slate-300">{log.user}</td>
                                                                <td className="px-6 py-4 font-black italic text-white">{log.patient}</td>
                                                                <td className="px-6 py-4 text-slate-400 font-semibold">{log.purpose}</td>
                                                                <td className="px-6 py-4 text-[9px]"><span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-white/5 uppercase font-bold">{log.level}</span></td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <span className="text-emerald-500 font-bold flex items-center justify-end gap-1 text-[10px]">
                                                                        <Check size={12} /> {log.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VIEW: Hospital Profile */}
                                {activeTab === 'Hospital Profile' && (
                                    <div className="space-y-8">
                                        <div className="border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Hospital Terminal Profile</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Configure capacity telemetry and terminal details</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-slate-950 p-6 rounded-3xl border border-white/5">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-white mb-6">Terminal Telemetry Config</h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Hospital Terminal Name</label>
                                                        <input 
                                                            type="text" 
                                                            value={hospitalProfile.name}
                                                            onChange={(e) => setHospitalProfile({...hospitalProfile, name: e.target.value})}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Trauma Rating</label>
                                                        <select 
                                                            value={hospitalProfile.traumaLevel}
                                                            onChange={(e) => setHospitalProfile({...hospitalProfile, traumaLevel: e.target.value})}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all font-sans text-slate-800"
                                                        >
                                                            <option value="Level 1 Trauma Center">Level 1 Trauma Center</option>
                                                            <option value="Level 2 Trauma Center">Level 2 Trauma Center</option>
                                                            <option value="Level 3 Trauma Center">Level 3 Trauma Center</option>
                                                            <option value="Primary Clinic Port">Primary Clinic Port</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Available General Beds</label>
                                                        <input 
                                                            type="number" 
                                                            value={hospitalProfile.generalBeds}
                                                            onChange={(e) => setHospitalProfile({...hospitalProfile, generalBeds: parseInt(e.target.value) || 0})}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Available ICU Beds</label>
                                                        <input 
                                                            type="number" 
                                                            value={hospitalProfile.icuBeds}
                                                            onChange={(e) => setHospitalProfile({...hospitalProfile, icuBeds: parseInt(e.target.value) || 0})}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Surgeons On-Call</label>
                                                        <input 
                                                            type="number" 
                                                            value={hospitalProfile.surgeonsCount}
                                                            onChange={(e) => setHospitalProfile({...hospitalProfile, surgeonsCount: parseInt(e.target.value) || 0})}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Address / GPS Coordinates</label>
                                                        <input 
                                                            type="text" 
                                                            value={hospitalProfile.address}
                                                            onChange={(e) => setHospitalProfile({...hospitalProfile, address: e.target.value})}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-primary transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <button 
                                                        onClick={() => {
                                                            toast.loading('Broadcasting bed capacity metrics...', { id: 'prof-save' });
                                                            setTimeout(() => {
                                                                toast.success('Capacity and trauma settings broadcasted to active EMS ambulance routers.', { id: 'prof-save' });
                                                            }, 1500);
                                                        }}
                                                        className="bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-8 py-4 transition-all"
                                                    >
                                                        Broadcast Telemetry Metrics
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VIEW: Subscription Status */}
                                {activeTab === 'Subscription Status' && (
                                    <div className="space-y-8">
                                        <div className="border-b border-white/5 pb-6">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Enterprise RESQR SLA Port</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manage platform subscription and API synchronizations</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
                                                    <div>
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-widest block mb-2">Current Active Plan</span>
                                                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white font-poppins">ENTERPRISE RESQR PORT SUITE</h4>
                                                        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                                            Licensed to Max Healthcare Group. Enables multi-physician digital decryption credentials, HL7 FHIR database integration, and active telemetry broadcast to ambulance fleets.
                                                        </p>
                                                    </div>
                                                    <div className="mt-6 border-t border-white/5 pt-4 flex justify-between items-center text-xs font-semibold text-slate-400">
                                                        <span>Renewal Date: July 15, 2027</span>
                                                        <span className="text-emerald-500 font-bold">Paid (Annual)</span>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 space-y-4">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Level Agreement (SLA)</h5>
                                                    <div className="space-y-2 text-xs font-semibold text-slate-300">
                                                        <div className="flex justify-between">
                                                            <span>Decryption Sync Rate</span>
                                                            <span className="text-white font-mono">99.98% uptime</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Database Latency</span>
                                                            <span className="text-white font-mono">12ms average</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Secure HIPAA Vault Lock</span>
                                                            <span className="text-emerald-500 font-bold">Enabled</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>HL7 FHIR Interoperability</span>
                                                            <span className="text-emerald-500 font-bold">Connected</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-950 p-6 rounded-3xl border border-white/5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-white font-poppins">System Connectivity Diagnostic</h4>
                                                    {diagnosticStatus === 'running' && (
                                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                            <RefreshCw size={10} className="animate-spin" /> Diagnosing...
                                                        </span>
                                                    )}
                                                    {diagnosticStatus === 'success' && (
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                            <Check size={10} /> Sync Stable
                                                        </span>
                                                    )}
                                                </div>

                                                {diagnosticStatus === 'success' ? (
                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex items-center gap-2 text-emerald-500">
                                                            <CheckCircle2 size={14} />
                                                            <span className="font-semibold">Decryption Ledger Handshake: SUCCESS (10ms)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-emerald-500">
                                                            <CheckCircle2 size={14} />
                                                            <span className="font-semibold">HIE Exchange Sync: ACTIVE (HL7 Server V4)</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-emerald-500">
                                                            <CheckCircle2 size={14} />
                                                            <span className="font-semibold">Ambulance Fleet Telemetry Broadcast: ACTIVE</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6">
                                                        <button
                                                            disabled={diagnosticStatus === 'running'}
                                                            onClick={() => {
                                                                setDiagnosticStatus('running');
                                                                toast.loading('Running telemetry handshake diagnostics...', { id: 'diag' });
                                                                setTimeout(() => {
                                                                    setDiagnosticStatus('success');
                                                                    toast.success('Decryption ledger handshake verified. Uptime is nominal.', { id: 'diag' });
                                                                }, 2000);
                                                            }}
                                                            className="bg-slate-900 border border-white/5 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
                                                        >
                                                            Run Port Diagnostic Test
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Scanned Patient Medical Vault Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto font-manrope">
                    <Card className="p-8 md:p-10 bg-[#11192A] border-white/10 rounded-[50px] w-full max-w-4xl shadow-2xl relative my-12 text-white">
                        <button 
                            onClick={() => setSelectedPatient(null)} 
                            className="absolute top-8 right-8 p-3 bg-slate-900 border border-white/5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all animate-pulse"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col md:flex-row gap-8 items-center border-b border-white/5 pb-8 mb-8">
                            <div className="relative">
                                {selectedPatient.photo ? (
                                    <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-28 h-28 object-cover rounded-3xl border-2 border-primary" />
                                ) : (
                                    <div className="w-28 h-28 bg-slate-950 border border-white/5 rounded-3xl flex items-center justify-center text-primary">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins text-white leading-tight">
                                        {selectedPatient.name}
                                    </h2>
                                    <Badge variant="danger" className="border-none px-3 py-1 font-black italic text-[9px] uppercase tracking-widest">
                                        PATIENT VAULT DECRYPTED
                                    </Badge>
                                </div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
                                    DOB: <span className="text-white">{selectedPatient.dob || "N/A"}</span> {(selectedPatient.age || selectedPatient.dob) && <span className="text-slate-400">({selectedPatient.age ? (selectedPatient.age.toString().toLowerCase().includes('yr') ? selectedPatient.age : `${selectedPatient.age} Yrs`) : (selectedPatient.dob && `${calculateAge(selectedPatient.dob)} Yrs`)})</span>} • Gender: <span className="text-white uppercase">{selectedPatient.gender || "N/A"}</span> • Phone: <span className="text-white">{selectedPatient.phone || "N/A"}</span>
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
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Blood Group</span>
                                        <span className="text-3xl font-black italic text-red-500 font-poppins">
                                            {selectedPatient.blood || "N/A"}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Height</span>
                                        <span className="text-xl font-black italic text-white font-poppins">
                                            178 cm
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Weight</span>
                                        <span className="text-xl font-black italic text-white font-poppins">
                                            74 kg
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Chronic Conditions</span>
                                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-xs font-semibold text-white/80">
                                            {selectedPatient.conditions || "No chronic illnesses reported."}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Allergies (Critical)</span>
                                        <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 text-xs font-bold text-red-400">
                                            {selectedPatient.allergies || "No allergies reported."}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Current Medications</span>
                                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-xs font-semibold text-white/80">
                                            {selectedPatient.medications || "None."}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 block mb-1">Emergency Notes & Directives</span>
                                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-xs font-bold text-amber-500">
                                            {selectedPatient.notes || "None."}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Contacts & Insurance */}
                            <div className="space-y-6">
                                {/* Emergency Contact */}
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic border-b border-white/5 pb-2 mb-3 font-poppins">
                                        Emergency Contacts
                                    </h3>
                                    {selectedPatient.emergencyContact ? (
                                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex justify-between items-center text-xs">
                                            <div>
                                                <span className="font-black uppercase italic block text-white">{selectedPatient.emergencyContact.name}</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">{selectedPatient.emergencyContact.relation}</span>
                                            </div>
                                            <a href={`tel:${selectedPatient.emergencyContact.phone}`} className="p-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/10">
                                                <Phone size={14} />
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 font-semibold">No emergency contacts logged.</p>
                                    )}
                                </div>

                                {/* Insurance Vault */}
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic border-b border-white/5 pb-2 mb-3 font-poppins">
                                        Insurance Policy Details
                                    </h3>
                                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3 text-[11px] font-bold">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-semibold">Provider</span>
                                            <span className="text-white uppercase italic">STAR HEALTH</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-semibold">Policy No</span>
                                            <span className="text-white uppercase">POL-882182</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-semibold">Cashless</span>
                                            <span className="text-emerald-500">ACTIVE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 mt-8 flex justify-end gap-4">
                            <Button 
                                onClick={() => setSelectedPatient(null)}
                                variant="outline" 
                                className="py-4 px-6 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white"
                            >
                                Dismiss Profile
                            </Button>
                            <Button 
                                onClick={() => {
                                    setPatients(patients.map(p => p.id === selectedPatient.id ? { ...p, status: 'ER ADMITTED' } : p));
                                    setSelectedPatient(null);
                                    toast.success(`${selectedPatient.name} status updated to ER ADMITTED.`);
                                }}
                                className="py-4 px-8 bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20"
                            >
                                Acknowledge Intake & Log Patient
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* CTAs */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">INTEGRATE YOUR HOSPITAL SYSTEM</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Coordinate with our technology consultants to deploy RESQR scanning terminals in your emergency wards.</p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link to="/contact">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">REQUEST HOSPITAL DEMO</Button>
                        </Link>
                        <Link to="/partners">
                            <Button size="lg" variant="outline" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest border-white/10 text-white hover:bg-white/5">PARTNER WITH RESQR</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
