import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ShieldAlert, ArrowRight, User, Users, HeartPulse,
    Building2, Siren, Dog, GraduationCap, BookOpen, Briefcase,
    Shield, CheckCircle2, RefreshCw, Play, Check, QrCode, CreditCard,
    Lock, AlertTriangle, Eye, Activity, MapPin, Phone, Mail, RotateCcw,
    Layers, Zap, Search, ChevronRight, FileText, Download, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
    isDemoMode, setDemoMode, getActiveDemoRole,
    DEMO_ROLES, DEMO_ROLE_METADATA, seedDemoDatabaseFixtures,
    resetDemoDatabase, simulateDemoPayment, DEMO_EMERGENCY_STEPS
} from '../lib/demoService';

const ICONS = {
    User,
    Users,
    HeartPulse,
    Building2,
    Siren,
    Dog,
    GraduationCap,
    BookOpen,
    Briefcase,
    Shield,
};

export default function DemoAdminPanel() {
    const navigate = useNavigate();
    const [currentRole, setCurrentRole] = useState(getActiveDemoRole());
    const [simulatingEmergency, setSimulatingEmergency] = useState(false);
    const [currentSimStep, setCurrentSimStep] = useState(0);
    const [resetting, setResetting] = useState(false);

    // Create Demo Account Form State
    const [createRole, setCreateRole] = useState(DEMO_ROLES.USER);
    const [accountForm, setAccountForm] = useState({
        name: '',
        email: '',
        phone: '',
        specialtyOrCategory: '',
        medicalNotes: '',
    });

    // Subscriptions Simulator State
    const [selectedPlanForSim, setSelectedPlanForSim] = useState('initial_199');
    const [simulatedSubState, setSimulatedSubState] = useState('ACTIVE');

    useEffect(() => {
        setDemoMode(true, DEMO_ROLES.ADMIN);
        seedDemoDatabaseFixtures();
    }, []);

    const handleEnterRole = (roleKey) => {
        setDemoMode(true, roleKey);
        setCurrentRole(roleKey);
        const meta = DEMO_ROLE_METADATA[roleKey];
        toast.success(`Entering RESQR as ${meta.label}! (100% Free Demo Mode)`);
        navigate(meta.targetRoute || '/dashboard');
    };

    const handleAutofillDemoData = () => {
        switch (createRole) {
            case DEMO_ROLES.USER:
                setAccountForm({
                    name: 'Rajesh Sharma (Demo)',
                    email: 'demo-user@resqr-demo.local',
                    phone: '9876543210',
                    specialtyOrCategory: 'O+ Blood, Penicillin Allergy',
                    medicalNotes: 'Mild Asthma, Emergency Contact: Priya Sharma (9876543211)',
                });
                break;
            case DEMO_ROLES.AGENT:
                setAccountForm({
                    name: 'Vikram Malhotra (Demo Agent)',
                    email: 'demo-agent@resqr-demo.local',
                    phone: '9876543220',
                    specialtyOrCategory: 'Authorized Field Partner',
                    medicalNotes: 'Partner ID: RESQR-AG-DEMO',
                });
                break;
            case DEMO_ROLES.DOCTOR:
                setAccountForm({
                    name: 'Dr. Ananya Sen (Trauma Lead)',
                    email: 'doctor-ananya@apollo-demo.local',
                    phone: '9876543230',
                    specialtyOrCategory: 'Emergency Medicine / Trauma Surgery',
                    medicalNotes: 'Medical Reg: MCI-2026-8899',
                });
                break;
            case DEMO_ROLES.HOSPITAL:
                setAccountForm({
                    name: 'Apollo Metro Trauma Hospital',
                    email: 'er-desk@apollo-demo.local',
                    phone: '9876543240',
                    specialtyOrCategory: 'Level 1 Trauma Center',
                    medicalNotes: '24/7 ICU & Ambulance Grid Node',
                });
                break;
            case DEMO_ROLES.PET_OWNER:
                setAccountForm({
                    name: 'Bruno (Golden Retriever)',
                    email: 'priya-pet@resqr-demo.local',
                    phone: '9876543211',
                    specialtyOrCategory: 'Lost Pet Mode Enabled',
                    medicalNotes: 'Microchip: 981098109810981 · Dr. Rao (Vet)',
                });
                break;
            case DEMO_ROLES.SCHOOL:
                setAccountForm({
                    name: 'St. Xavier High School (Demo)',
                    email: 'admin@stxavier-demo.edu.in',
                    phone: '9876543250',
                    specialtyOrCategory: 'Grade 1–12 School',
                    medicalNotes: '450 Students · 35 Faculty Members',
                });
                break;
            default:
                setAccountForm({
                    name: 'Demo Enterprise Account',
                    email: 'admin@demo-org.local',
                    phone: '9876543260',
                    specialtyOrCategory: 'Corporate Safety Fleet',
                    medicalNotes: 'Bengaluru HQ & Hyderabad Branch',
                });
        }
        toast.success('Fictional test data prefilled.');
    };

    const handleCreateDemoAccount = () => {
        if (!accountForm.name) {
            toast.error('Please enter an account name or click "USE DEMO DATA".');
            return;
        }
        toast.success(`Demo ${DEMO_ROLE_METADATA[createRole]?.label} account created! (Zero Payment / Zero Verification)`);
        handleEnterRole(createRole);
    };

    // Emergency Simulation Timeline runner
    const handleStartCompleteDemo = async () => {
        setSimulatingEmergency(true);
        setCurrentSimStep(0);

        for (let i = 0; i < DEMO_EMERGENCY_STEPS.length; i++) {
            setCurrentSimStep(i + 1);
            await new Promise(res => setTimeout(res, DEMO_EMERGENCY_STEPS[i].durationMs));
        }

        toast.success('🎉 Complete 8-Step Emergency Simulation Finished!');
        setSimulatingEmergency(false);
    };

    const handleResetAllDemo = async () => {
        setResetting(true);
        const t = toast.loading('Resetting demo database fixtures...');
        try {
            await resetDemoDatabase();
            toast.success('Demo environment cleanly reset! Real customer data untouched.', { id: t });
        } catch (e) {
            toast.error('Reset error', { id: t });
        } finally {
            setResetting(false);
        }
    };

    // 24-Point Feature Checklist
    const demoFeatures = [
        { name: 'Authentication & Session Isolation', route: '/login', role: DEMO_ROLES.USER },
        { name: 'Citizen Emergency Registration', route: '/login', role: DEMO_ROLES.USER },
        { name: 'Medical Profile & Allergies Vault', route: '/dashboard', role: DEMO_ROLES.USER },
        { name: 'Insurance & Next-of-Kin Contacts', route: '/dashboard', role: DEMO_ROLES.USER },
        { name: 'QR Code Generation & Print Passes', route: '/my-qr', role: DEMO_ROLES.USER },
        { name: 'Public Bystander QR Scan & Masked Relay', route: '/p/demo-user-001', role: DEMO_ROLES.USER },
        { name: 'Agent Partner Multi-Category Console', route: '/dashboard', role: DEMO_ROLES.AGENT },
        { name: 'Family Plans (4, 6, 8 Members)', route: '/dashboard', role: DEMO_ROLES.AGENT },
        { name: 'Schools & Grade 1–12 Roster Management', route: '/dashboard', role: DEMO_ROLES.AGENT },
        { name: 'Colleges & University Departments', route: '/dashboard', role: DEMO_ROLES.AGENT },
        { name: 'Corporate / IT Office Fleet', route: '/dashboard', role: DEMO_ROLES.AGENT },
        { name: 'Bulk CSV Roster Import & Error Reports', route: '/dashboard', role: DEMO_ROLES.AGENT },
        { name: 'Automatic Agent Commission Ledger', route: '/dashboard', role: DEMO_ROLES.AGENT },
        { name: 'Emergency Doctor Clinical Scan', route: '/solutions/doctors', role: DEMO_ROLES.DOCTOR },
        { name: 'Hospital Emergency Room Triage', route: '/solutions/hospitals', role: DEMO_ROLES.HOSPITAL },
        { name: 'Ambulance 108 GPS Dispatch Unit', route: '/demo/ambulance', role: DEMO_ROLES.AMBULANCE },
        { name: 'Pet RESQR Identity & Tag Registration', route: '/create-pet', role: DEMO_ROLES.PET_OWNER },
        { name: 'Lost Pet Mode & Live GPS Telemetry', route: '/pet-dashboard', role: DEMO_ROLES.PET_OWNER },
        { name: 'Public Pet QR Scan & Finder Location Sharing', route: '/pet/RESQR-PET-DEMO01', role: DEMO_ROLES.PET_OWNER },
        { name: 'Free Demo Payment (0 Charges / Simulated)', route: '/payment', role: DEMO_ROLES.USER },
        { name: 'Subscriptions Lifecycle Simulator', route: '/pricing', role: DEMO_ROLES.USER },
        { name: 'DPDP Privacy Notice & Granular Consent', route: '/privacy-settings', role: DEMO_ROLES.USER },
        { name: 'Facial Verification Node Simulation', route: '/scanner', role: DEMO_ROLES.DOCTOR },
        { name: 'Master Admin Operations Console', route: '/admin', role: DEMO_ROLES.ADMIN },
    ];

    return (
        <div className="min-h-screen bg-[#040812] text-white py-12 px-4 sm:px-6 lg:px-8 font-manrope">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Hero Banner */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest">
                        <Sparkles size={14} /> RESQR 100% FREE DEMO & TESTING ENVIRONMENT
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black italic uppercase font-poppins text-white tracking-tight">
                        Experience <span className="text-primary italic-display">Every Role.</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Test the complete RESQR platform with simulated accounts, zero payment friction, isolated test fixtures, and live emergency telemetry.
                    </p>
                </div>

                {/* SECTION 1: 1-CLICK ROLE SWITCHER */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">INSTANT DEMO CONSOLE</span>
                            <h2 className="text-2xl font-black italic uppercase font-poppins text-white">
                                Enter RESQR as Any Role (1-Click)
                            </h2>
                        </div>
                        <span className="text-xs text-slate-400">All features unlocked · Zero payment required</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {Object.values(DEMO_ROLES).map((roleKey) => {
                            const meta = DEMO_ROLE_METADATA[roleKey];
                            const Icon = ICONS[meta.icon] || User;
                            return (
                                <div
                                    key={roleKey}
                                    onClick={() => handleEnterRole(roleKey)}
                                    className="p-5 rounded-3xl bg-[#090E1A] border border-white/10 hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-primary text-slate-300 group-hover:text-white transition-all flex items-center justify-center mb-4">
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="text-base font-black italic uppercase font-poppins text-white group-hover:text-primary transition-colors">
                                            {meta.label}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                            {meta.desc}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-primary">
                                        <span>Enter Demo</span>
                                        <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SECTION 2: CREATE DEMO ACCOUNT & SIMULATED REGISTRATION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Instant Account Creator */}
                    <Card className="p-6 sm:p-8 bg-[#090E1A] border-white/10 rounded-3xl space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-xl font-black italic uppercase font-poppins text-white">
                                    Instant Demo Account Creator
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Mint new test identities with zero payment</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutofillDemoData}
                                className="btn-app-secondary py-1.5 px-3 text-[11px] font-bold inline-flex items-center gap-1 text-amber-300 border-amber-500/30"
                            >
                                <Sparkles size={12} /> USE DEMO DATA
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Select Account Type</label>
                                <select
                                    value={createRole}
                                    onChange={(e) => setCreateRole(e.target.value)}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-primary"
                                >
                                    {Object.values(DEMO_ROLES).map(r => (
                                        <option key={r} value={r}>{DEMO_ROLE_METADATA[r].label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Full Name / Entity Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter demo name"
                                    value={accountForm.name}
                                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Demo Email</label>
                                    <input
                                        type="email"
                                        placeholder="demo@resqr.local"
                                        value={accountForm.email}
                                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Demo Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={accountForm.phone}
                                        onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Category / Medical Details</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Blood O+, Asthma, Penicillin allergy"
                                    value={accountForm.specialtyOrCategory}
                                    onChange={(e) => setAccountForm({ ...accountForm, specialtyOrCategory: e.target.value })}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleCreateDemoAccount}
                                className="w-full btn-app-primary py-3 px-6 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xl shadow-primary/20 mt-2"
                            >
                                <Check size={16} /> Create & Enter Demo Dashboard
                            </button>
                        </div>
                    </Card>

                    {/* Right: Interactive Emergency Timeline Simulator */}
                    <Card className="p-6 sm:p-8 bg-[#090E1A] border-white/10 rounded-3xl space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-xl font-black italic uppercase font-poppins text-white">
                                    Live Emergency Simulation
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">8-Stage real-time automated workflow runner</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleStartCompleteDemo}
                                disabled={simulatingEmergency}
                                className="btn-app-primary py-2 px-5 text-xs font-black italic uppercase inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {simulatingEmergency ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                START COMPLETE DEMO
                            </button>
                        </div>

                        {/* Stepper Timeline List */}
                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {DEMO_EMERGENCY_STEPS.map((st) => {
                                const isDone = currentSimStep >= st.id;
                                const isCurrent = currentSimStep === st.id && simulatingEmergency;
                                return (
                                    <div
                                        key={st.id}
                                        className={`p-3 rounded-2xl border transition-all flex items-start gap-3 text-xs ${
                                            isCurrent
                                                ? 'bg-primary/20 border-primary text-white animate-pulse'
                                                : isDone
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                                : 'bg-white/5 border-white/5 text-slate-500'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${
                                            isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'
                                        }`}>
                                            {isDone ? '✓' : st.id}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`font-bold ${isCurrent ? 'text-primary' : isDone ? 'text-white' : 'text-slate-400'}`}>
                                                {st.title}
                                            </p>
                                            <p className="text-[11px] opacity-80 mt-0.5">{st.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* SECTION 3: DEMO SUBSCRIPTION & PAYMENT TESTER */}
                <Card className="p-6 sm:p-8 bg-[#090E1A] border-white/10 rounded-3xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">100% FREE TESTING</span>
                            <h3 className="text-xl font-black italic uppercase font-poppins text-white">
                                Subscription & Payment Bypass Engine
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Simulate full subscription lifecycles and payment confirmations without charging any real payment gateway.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                            <label className="block text-[11px] font-bold uppercase text-slate-400">Select Subscription Tier</label>
                            <select
                                value={selectedPlanForSim}
                                onChange={(e) => setSelectedPlanForSim(e.target.value)}
                                className="w-full bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-primary"
                            >
                                <option value="initial_149">Digital RESQR (₹149 - Free in Demo)</option>
                                <option value="initial_199">RESQR QR + 3-Month Validity (₹199 - Free in Demo)</option>
                                <option value="annual_399">Annual Plan (12 Months - Free in Demo)</option>
                                <option value="family_4">Family Plan (4 Members - Free in Demo)</option>
                                <option value="school_bulk">School Campus Bulk (Free in Demo)</option>
                            </select>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                            <label className="block text-[11px] font-bold uppercase text-slate-400">Simulate Lifecycle State</label>
                            <select
                                value={simulatedSubState}
                                onChange={(e) => setSimulatedSubState(e.target.value)}
                                className="w-full bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-primary"
                            >
                                <option value="ACTIVE">ACTIVE (Full Coverage)</option>
                                <option value="EXPIRING_SOON">EXPIRING SOON (7 Days Left)</option>
                                <option value="EXPIRED">EXPIRED (Prompt Renewal)</option>
                                <option value="RENEWED">RENEWED (Extension Applied)</option>
                            </select>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-end">
                            <button
                                type="button"
                                onClick={async () => {
                                    const res = await simulateDemoPayment({
                                        amount: 199,
                                        planId: selectedPlanForSim,
                                        planName: 'RESQR Demo Package',
                                    });
                                    toast.success(`Demo Payment Verified! Order: ${res.orderId} (${simulatedSubState})`);
                                }}
                                className="w-full btn-app-primary py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <CreditCard size={14} /> Simulate Demo Payment
                            </button>
                        </div>
                    </div>
                </Card>

                {/* SECTION 4: 24-POINT DEMO FEATURE TESTER CHECKLIST */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">QUALITY ASSURANCE SUITE</span>
                            <h2 className="text-2xl font-black italic uppercase font-poppins text-white">
                                24-Point Demo Feature Tester
                            </h2>
                        </div>
                        <span className="text-xs text-emerald-400 font-bold">24 / 24 Features Ready</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {demoFeatures.map((feat, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-2xl bg-[#090E1A] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 text-xs"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                        ✓
                                    </span>
                                    <span className="font-bold text-white truncate">{feat.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDemoMode(true, feat.role);
                                        navigate(feat.route);
                                        toast.success(`Launched interactive test for: ${feat.name}`);
                                    }}
                                    className="btn-app-secondary py-1 px-3 text-[10px] font-bold uppercase tracking-wider shrink-0 text-primary border-primary/30 hover:bg-primary hover:text-white transition-all"
                                >
                                    TEST
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 5: DEMO RESET CONTROLLER */}
                <Card className="p-6 bg-gradient-to-r from-red-950/40 via-[#090E1A] to-red-950/40 border-red-500/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="text-red-500" size={20} />
                            <h3 className="text-lg font-black italic uppercase font-poppins text-white">
                                Reset Demo Database Fixtures
                            </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Safely purges only records tagged with <code className="text-amber-300">isDemo: true</code> and restores clean initial test accounts. Real production accounts remain 100% untouched.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleResetAllDemo}
                        disabled={resetting}
                        className="py-3 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black italic uppercase tracking-wider inline-flex items-center gap-2 shadow-xl shadow-red-600/30 transition-all shrink-0"
                    >
                        {resetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                        RESET COMPLETE DEMO
                    </button>
                </Card>
            </div>
        </div>
    );
}
