import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ChevronRight, Activity, Heart, CheckCircle2,
    QrCode, Smartphone, Users, Lock, Zap, User, ScanLine,
    ArrowRight, HeartHandshake, AlertCircle, PhoneCall, Building2,
    Stethoscope, Siren, ShieldCheck, HelpCircle, ShieldAlert,
    ExternalLink, Eye, EyeOff, Radio, Check, ChevronDown, Sparkles,
    FileText, UserCheck, AlertTriangle, Key, Hospital, Landmark,
    Briefcase, Award, Ambulance
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import RESQRQRCodeCard from '../components/common/RESQRQRCodeCard';
import ResqrLogo from '../components/branding/ResqrLogo';

export default function LandingPage() {
    const [userCount, setUserCount] = useState('...');
    const [hasPaid, setHasPaid] = useState(false);
    const [demoMode, setDemoMode] = useState('bystander'); // 'bystander' | 'clinical'
    const [activeFaq, setActiveFaq] = useState(null);
    const [demoActionTriggered, setDemoActionTriggered] = useState(null);

    // Live counter from Firebase Realtime Database
    useEffect(() => {
        const profilesRef = ref(db, 'profiles');
        const unsubUsers = onValue(profilesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const count = Object.keys(data).length;
                setUserCount(count.toLocaleString());
            } else {
                setUserCount('1,000+');
            }
        }, (error) => {
            console.warn("RTDB user count notice:", error);
            setUserCount('1,000+');
        });
        return () => unsubUsers();
    }, []);

    // Active auth check
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const profilesRef = ref(db, 'profiles');
                    const snapshot = await get(profilesRef);
                    if (snapshot.exists()) {
                        const profiles = snapshot.val();
                        const userPaid = Object.values(profiles).some(p =>
                            (p.uid === user.uid || p.email === user.email) &&
                            (p.payment_status === 'paid' || p.payment_status === undefined)
                        );
                        setHasPaid(userPaid);
                    }
                } catch (err) {
                    console.warn("Auth check notice:", err);
                }
            } else {
                setHasPaid(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const primaryHref = hasPaid ? '/dashboard' : '/login';

    // Fictional demonstration profile data (strictly fictional, no real personal details)
    const demoProfile = {
        name: "Rohan Sharma",
        id: "RESQR-8821",
        status: "ACTIVE PROTECTION",
        bloodGroup: "O+",
        primaryContact: {
            relation: "Spouse (Next of Kin)",
            name: "Pooja Sharma",
            maskedPhone: "+91 ••••• ••42"
        },
        allergies: "Severe Penicillin Allergy (Anaphylaxis Risk)",
        chronicConditions: "Mild Asthma (Carries Inhaler)",
        emergencyNotes: "Contact spouse immediately in emergency. Prefers civil hospital network.",
        organDonor: "Registered Donor",
        hospitalAdmissionRef: "HOSP-MED-VERIFIED",
    };

    const howItWorksSteps = [
        {
            num: "01",
            title: "Register Account",
            desc: "Create your personal RESQR account using verified mobile OTP or Google login.",
            detail: "Establishes a private data principal record on our secure cloud platform."
        },
        {
            num: "02",
            title: "Add Emergency Contacts",
            desc: "Designate family members or trusted guardians as your emergency points of contact.",
            detail: "Numbers are stored in your secure vault and masked during public scans."
        },
        {
            num: "03",
            title: "Enter Vital Health Data",
            desc: "Voluntarily record your blood group, severe drug allergies, and acute medical conditions.",
            detail: "You decide what information is entered; nothing is mandatory except emergency contacts."
        },
        {
            num: "04",
            title: "Activate QR / NFC Tag",
            desc: "Link your unique reflective physical sticker, keychain, card, or digital wallet tag.",
            detail: "Each tag carries an unpredictable cryptographic token, not raw medical records."
        },
        {
            num: "05",
            title: "Emergency Scan",
            desc: "During an accident or medical event, a bystander or paramedic scans the tag using any smartphone.",
            detail: "Works with native iPhone and Android cameras. No external app installation required."
        },
        {
            num: "06",
            title: "Governed Access Display",
            desc: "The scanner accesses only the information permitted under your configured access policy.",
            detail: "Passersby see minimal coordination data; detailed medical records require clinical verification."
        },
        {
            num: "07",
            title: "Direct Contact Actions",
            desc: "The responder taps to connect directly with your designated emergency contacts.",
            detail: "Enables immediate notification of family members during the critical golden hour."
        }
    ];

    const audienceSolutions = [
        {
            icon: Users,
            title: "Individuals & Families",
            desc: "Complete emergency identity coverage for spouses, children, and daily commuters on road and transit networks.",
            link: "/solutions/individuals",
            tag: "Personal Safety"
        },
        {
            icon: Heart,
            title: "Senior Citizens & Caregivers",
            desc: "Vital medical and guardian details accessible if an elderly family member wanders, falls, or experiences sudden disorientation.",
            link: "/solutions/families",
            tag: "Caregiver Support"
        },
        {
            icon: Building2,
            title: "Hospitals & Clinics",
            desc: "Rapid patient identity mapping and verified blood group and allergy alerts upon arrival in emergency departments.",
            link: "/solutions/hospitals",
            tag: "Clinical Systems"
        },
        {
            icon: Stethoscope,
            title: "Doctors & Clinicians",
            desc: "Authorized clinical vault access providing drug allergy alerts before administering emergency anesthesia or pharmacotherapy.",
            link: "/solutions/doctors",
            tag: "Clinical Practice"
        },
        {
            icon: Briefcase,
            title: "Employers & Campuses",
            desc: "Institutional employee safety identification tags for industrial plants, corporate campuses, field workers, and logistics fleets.",
            link: "/solutions/enterprises",
            tag: "Workforce Safety"
        },
        {
            icon: Landmark,
            title: "Government & Public Sector",
            desc: "Proposed deployment architectures for municipal transport, state highway safety pilots, and citizen identification programs.",
            link: "/government-partnerships",
            tag: "Civic Infrastructure"
        },
        {
            icon: Ambulance,
            title: "Emergency-Response Teams",
            desc: "Paramedic-oriented scan interfaces to quickly ascertain critical vitals and relay notifications to designated family.",
            link: "/solutions/first-responders",
            tag: "First Responders"
        }
    ];

    const ecosystemProducts = [
        {
            name: "Digital RESQR Identity",
            price: "₹99 / year",
            format: "Digital Mobile Pass",
            desc: "Instant digital emergency pass compatible with Apple Wallet and Google Wallet. Perfect for digital lockscreens and smartwatch displays.",
            features: ["Immediate digital pass generation", "Dynamic cloud updates", "Lockscreen emergency wallpaper export"]
        },
        {
            name: "Reflective QR Stickers",
            price: "₹149 / pack of 2",
            format: "Physical Weatherproof Vinyl",
            desc: "High-grade 3M reflective vinyl stickers designed for motorcycle helmets, car windshields, cycles, and laptop sleeves.",
            features: ["Waterproof & UV-resistant coating", "Night-time high-reflectivity vinyl", "Scratch-resistant lamination"]
        },
        {
            name: "Laser-Engraved Keychains",
            price: "₹199",
            format: "Stainless Steel Tag",
            desc: "Durable stainless steel emergency tag with permanent laser-etched QR identifier. Attach to vehicle keys, school bags, or travel packs.",
            features: ["Corrosion-resistant metal body", "Permanent laser engraving", "Universal split-ring attachment"]
        },
        {
            name: "NFC Emergency Smart Card",
            price: "₹249",
            format: "NFC + QR Composite Card",
            desc: "Standard wallet-sized PVC card with embedded NTAG216 contactless NFC chip and high-contrast reflective QR code on reverse.",
            features: ["Dual-interface: Tap NFC or Scan QR", "Waterproof composite PVC", "Fits standard wallet card slots"]
        }
    ];

    const faqs = [
        {
            q: "Does a person scanning my RESQR need to download an app?",
            a: "No. Any standard smartphone camera (iOS or Android) can scan the QR tag directly and open the secure emergency portal in their mobile browser without installing any application."
        },
        {
            q: "Can anyone who scans my tag see all my private medical records?",
            a: "No. By default, a public bystander scan displays only essential emergency information: your name, masked emergency contact action, and emergency service direct links. Sensitive medical details, chronic conditions, and surgical history require authorized clinical credentials or user-permitted visibility."
        },
        {
            q: "How does the emergency contact action work?",
            a: "When a bystander taps the 'Connect Call' action on your emergency screen, their phone initiates a telephone call to your designated emergency contact. Phone numbers are masked on the screen to prevent spam and protect family privacy."
        },
        {
            q: "What happens if I lose my helmet, card, or sticker?",
            a: "You can instantly revoke or deactivate any specific QR tag from your RESQR Dashboard. A revoked tag immediately ceases to display your emergency profile if scanned."
        },
        {
            q: "Is RESQR affiliated with 108 or government emergency services?",
            a: "RESQR is an independent emergency technology platform built by Sion Enterprises. The quick-call buttons on our interface initiate standard telephone calls to 108 (Ambulance) or 100 (Police) via the user's phone dialer. We do not operate dispatch centers or represent government agencies."
        },
        {
            q: "Can I update my medical information or emergency contacts later?",
            a: "Yes. Your physical QR stickers and tags point to your dynamic cloud identity. You can update your emergency contacts, address, or medical information in your dashboard at any time, and your existing physical tag will reflect the updates without reprinting."
        }
    ];

    return (
        <div className="relative min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30">
            {/* Ambient Background Grid */}
            <div className="pointer-events-none fixed inset-0 z-0 opacity-40 qr-grid-pattern" aria-hidden="true" />

            {/* ================= HERO SECTION (PHASE 3B) ================= */}
            <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Left Column: Editorial Headline & Value Proposition */}
                    <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                        {/* Status Chip */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            EMERGENCY IDENTIFICATION PLATFORM
                        </div>

                        {/* Mandated Hero Headline */}
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight font-sans leading-[1.05] text-white">
                            Emergency Information. <br />
                            <span className="text-primary">Within Reach.</span>
                        </h1>

                        {/* Mandated Hero Supporting Text */}
                        <p className="text-slate-300 text-lg sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            RESQR connects a registered emergency profile to a scannable QR or NFC identifier, helping people reach designated emergency contacts and access permitted emergency information.
                        </p>

                        {/* Dual Call-to-Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                            <Link 
                                to={primaryHref} 
                                className="w-full sm:w-auto min-h-[56px] px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-primary/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <HeartHandshake size={18} /> Create Your RESQR
                            </Link>
                            <a 
                                href="#how-it-works" 
                                className="w-full sm:w-auto min-h-[56px] px-8 bg-charcoal hover:bg-charcoal-surface text-white border border-white/15 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                See How It Works <ArrowRight size={16} />
                            </a>
                        </div>

                        {/* Mandated Trust Statement on Permissions */}
                        <div className="pt-6 border-t border-white/10 text-xs text-slate-400 space-y-2">
                            <p className="flex items-center justify-center lg:justify-start gap-2 font-medium">
                                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                                <span>Information access depends on user-configured permissions and system security controls.</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Passersby see minimal contact coordination data. Detailed medical information is strictly restricted to clinical settings.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Premium Visual Hardware Composition Mockup */}
                    <div className="lg:col-span-5 relative">
                        {/* Device & Hardware Container */}
                        <div className="bg-[#17191D] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                            {/* Accent Header Line */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-charcoal" />

                            <div className="space-y-6">
                                {/* Hardware Tags Showcase Badge */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-white">Physical Identifier Mockup</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">NFC + Reflective QR</span>
                                </div>

                                {/* Smartphone Mockup Framing */}
                                <div className="bg-[#0E1013] border border-white/15 rounded-2xl p-5 space-y-4 shadow-inner">
                                    {/* Mock Smartphone Status Bar */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pb-2 border-b border-white/5">
                                        <span>EMERGENCY ACCESS PORTAL</span>
                                        <span>SECURE PASSIVE READ</span>
                                    </div>

                                    {/* Fictional Profile Display in Phone Mockup */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Registered Citizen</p>
                                                <p className="text-lg font-bold text-white uppercase">{demoProfile.name}</p>
                                            </div>
                                            <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-black">
                                                {demoProfile.bloodGroup}
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Emergency Contact</p>
                                            <p className="text-xs text-white font-medium">{demoProfile.primaryContact.name} ({demoProfile.primaryContact.relation})</p>
                                            <p className="text-xs text-emerald-400 font-mono">{demoProfile.primaryContact.maskedPhone}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium flex items-start gap-2">
                                            <AlertCircle size={15} className="text-primary shrink-0 mt-0.5" />
                                            <span>{demoProfile.allergies}</span>
                                        </div>

                                        {/* Action Button Mock */}
                                        <div className="h-10 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md">
                                            <PhoneCall size={14} /> Connect Call to Contact
                                        </div>
                                    </div>
                                </div>

                                {/* Physical Tag Placement Illustrations */}
                                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white">Helmet Sticker</p>
                                        <span className="text-[9px] text-slate-500">Reflective 3M</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white">Wallet Card</p>
                                        <span className="text-[9px] text-slate-500">Smart NFC PVC</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                        <p className="text-white">Keychain Tag</p>
                                        <span className="text-[9px] text-slate-500">Laser-Etched</span>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-500 text-center">
                                    Illustrative representation. Real individual medical records are never published publicly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= INTERACTIVE PRODUCT DEMONSTRATION (PHASE 3C) ================= */}
            <section className="py-20 bg-[#121519] border-y border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-widest">
                            <AlertCircle size={12} /> SIMULATED DEMONSTRATION
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                            Experience the Scan Flow
                        </h2>
                        <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                            Interact with a simulated emergency scan using fictional records. Observe how information access adapts between public passersby and authorized healthcare personnel.
                        </p>
                    </div>

                    {/* Demonstration Simulator HUD */}
                    <div className="max-w-4xl mx-auto bg-[#17191D] border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                        {/* Mode Switcher */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-white/10">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Simulation Viewpoint</span>
                                <p className="text-sm font-bold text-white">
                                    {demoMode === 'bystander' ? '1. Public Bystander View (Accident Scene)' : '2. Verified Clinical View (Hospital Emergency)'}
                                </p>
                            </div>

                            <div className="inline-flex p-1 rounded-xl bg-charcoal-dark border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => { setDemoMode('bystander'); setDemoActionTriggered(null); }}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${demoMode === 'bystander' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Bystander View
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setDemoMode('clinical'); setDemoActionTriggered(null); }}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${demoMode === 'clinical' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Hospital View
                                </button>
                            </div>
                        </div>

                        {/* Interactive Content Box */}
                        <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                            {/* Left: Simulated Scan Identifier */}
                            <div className="md:col-span-5 bg-[#0E1013] border border-white/10 p-6 rounded-2xl text-center space-y-4">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Identifier Identifier: {demoProfile.id}</span>
                                
                                <div className="p-4 bg-white rounded-xl inline-block shadow-lg mx-auto">
                                    {/* Fictional demo QR rendered on client */}
                                    <div className="w-36 h-36 flex flex-col items-center justify-center bg-white text-black p-2 rounded">
                                        <QrCode size={110} className="text-slate-900" />
                                        <p className="text-[9px] font-bold font-mono tracking-tighter text-primary">DEMO RESQR SCAN</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white uppercase">{demoProfile.name}</p>
                                    <p className="text-[11px] text-slate-400">Simulated 1:1 Emergency Identity</p>
                                </div>

                                <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                                    {demoMode === 'bystander' ? (
                                        <span className="text-emerald-400 font-medium">Public Mode: Medical history is hidden to protect privacy.</span>
                                    ) : (
                                        <span className="text-blue-400 font-medium">Hospital Gate: Clinical vitals unlocked via simulated medical token.</span>
                                    )}
                                </div>
                            </div>

                            {/* Right: Permitted Information & Actions */}
                            <div className="md:col-span-7 space-y-5">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Permitted Emergency Details</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                                            Verified Active
                                        </span>
                                    </div>

                                    {/* Name & Blood Group */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Patient Name</p>
                                            <p className="text-sm font-bold text-white mt-0.5">{demoProfile.name}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Blood Group</p>
                                            <p className="text-sm font-bold text-primary mt-0.5">{demoProfile.bloodGroup}</p>
                                        </div>
                                    </div>

                                    {/* Emergency Contact Relay */}
                                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Designated Contact</p>
                                            <span className="text-[10px] text-slate-500">Privacy Masked</span>
                                        </div>
                                        <p className="text-xs font-bold text-white">{demoProfile.primaryContact.name} ({demoProfile.primaryContact.relation})</p>
                                        <p className="text-xs font-mono text-emerald-400">{demoProfile.primaryContact.maskedPhone}</p>
                                    </div>

                                    {/* Clinical vs Bystander Details */}
                                    {demoMode === 'clinical' ? (
                                        <div className="space-y-2 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                                            <div className="flex items-center justify-between text-blue-300 font-bold">
                                                <span>CLINICAL EMERGENCY VAULT</span>
                                                <span className="text-[10px] uppercase font-mono">Bedside Access</span>
                                            </div>
                                            <p className="text-slate-300"><strong className="text-white">Allergies:</strong> {demoProfile.allergies}</p>
                                            <p className="text-slate-300"><strong className="text-white">Conditions:</strong> {demoProfile.chronicConditions}</p>
                                            <p className="text-slate-300"><strong className="text-white">Pledge:</strong> {demoProfile.organDonor}</p>
                                            <p className="text-slate-300"><strong className="text-white">Notes:</strong> {demoProfile.emergencyNotes}</p>
                                        </div>
                                    ) : (
                                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Lock size={14} className="text-slate-400" />
                                                <span>Extended clinical history protected</span>
                                            </span>
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">Hospital Only</span>
                                        </div>
                                    )}

                                    {/* Interactive Simulation Buttons */}
                                    <div className="pt-2 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => setDemoActionTriggered('call')}
                                            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                                        >
                                            <PhoneCall size={15} /> Simulate Connect Call to Contact
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setDemoActionTriggered('108')}
                                                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 uppercase flex items-center justify-center gap-2"
                                            >
                                                <Siren size={14} className="text-primary" /> Dial 108 (Mock)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDemoActionTriggered('police')}
                                                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 uppercase flex items-center justify-center gap-2"
                                            >
                                                <ShieldAlert size={14} className="text-blue-400" /> Dial 100 (Mock)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Simulation feedback notification */}
                                    {demoActionTriggered && (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
                                            <span>
                                                {demoActionTriggered === 'call' && `[DEMO]: Call intent triggered to ${demoProfile.primaryContact.name} at ${demoProfile.primaryContact.maskedPhone}. In production, this opens the telephone dialer.`}
                                                {demoActionTriggered === '108' && `[DEMO]: Ambulance intent triggered. Opens tel:108 on real smartphone devices.`}
                                                {demoActionTriggered === 'police' && `[DEMO]: Police helpline intent triggered. Opens tel:100 on real smartphone devices.`}
                                            </span>
                                            <button onClick={() => setDemoActionTriggered(null)} className="text-emerald-400 hover:text-white text-xs font-bold ml-2">Dismiss</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Transparency Notice at Bottom of Demo */}
                        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                            <span>Demonstration experience only. No real emergency calls, SMS messages, or ambulance dispatches are executed.</span>
                            <span className="font-mono text-slate-400">DPDP Consent Compliant</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= HOW RESQR WORKS (PHASE 3D) ================= */}
            <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                    <span className="px-3.5 py-1 rounded-full border border-white/15 bg-white/5 text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em]">
                        COMPLETE LIFECYCLE
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                        How RESQR Works
                    </h2>
                    <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                        A structured public safety framework designed to connect first responders with designated emergency contacts and permitted health data when every minute counts.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {howItWorksSteps.map((step) => (
                        <div 
                            key={step.num}
                            className="bg-[#17191D] border border-white/10 hover:border-primary/40 rounded-2xl p-7 space-y-4 transition-all duration-300 relative group flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono font-bold text-primary tracking-widest">{step.num}</span>
                                    <span className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-primary transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold uppercase tracking-tight text-white">{step.title}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed font-normal">{step.desc}</p>
                            </div>
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-[11px] text-slate-500 leading-normal">{step.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Important Behavior Disclosure */}
                <div className="mt-10 p-5 rounded-2xl bg-[#17191D] border border-white/10 max-w-3xl mx-auto text-center text-xs text-slate-400 leading-relaxed">
                    <p>
                        <strong className="text-white">Data Disclosure Note:</strong> Scanning a physical RESQR identifier does NOT automatically broadcast full medical records to strangers. Information access adheres strictly to the user-configured access policy and role-based clinical verification gates.
                    </p>
                </div>
            </section>

            {/* ================= PRODUCT ECOSYSTEM (PHASE 3E) ================= */}
            <section className="py-20 bg-[#121519] border-y border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <span className="px-3.5 py-1 rounded-full border border-white/15 bg-white/5 text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em]">
                            PRODUCT RANGE
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                            Physical & Digital Ecosystem
                        </h2>
                        <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                            Carry your emergency identity in the format that best fits your daily mobility—from helmet stickers to wallet cards.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ecosystemProducts.map((p) => (
                            <div 
                                key={p.name}
                                className="bg-[#17191D] border border-white/10 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-primary tracking-widest">{p.format}</span>
                                        <h3 className="text-lg font-bold text-white uppercase mt-1">{p.name}</h3>
                                        <p className="text-base font-extrabold text-white mt-1 font-mono">{p.price}</p>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                                    <ul className="space-y-2 pt-2 border-t border-white/5">
                                        {p.features.map((f, i) => (
                                            <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2">
                                                <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Link 
                                    to="/products"
                                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                >
                                    View Product Details
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= AUDIENCE-SPECIFIC SOLUTIONS (PHASE 3F) ================= */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                    <span className="px-3.5 py-1 rounded-full border border-white/15 bg-white/5 text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em]">
                        TARGETED SOLUTIONS
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                        Designed for Every Stakeholder
                    </h2>
                    <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                        Tailored emergency access workflows for citizens, healthcare institutions, doctors, corporate campuses, and civic responders.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {audienceSolutions.map((sol) => {
                        const Icon = sol.icon;
                        return (
                            <Link 
                                key={sol.title}
                                to={sol.link}
                                className="bg-[#17191D] border border-white/10 hover:border-primary/40 rounded-2xl p-7 space-y-4 transition-all hover:-translate-y-1 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Icon size={22} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                        {sol.tag}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white uppercase group-hover:text-primary transition-colors">
                                    {sol.title}
                                </h3>

                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {sol.desc}
                                </p>

                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                                    Explore Solution Details <ChevronRight size={14} />
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Transparency note */}
                <div className="mt-8 text-center text-xs text-slate-500">
                    <p>RESQR distinguishes proposed institutional workflows from contracted engagements. We do not claim organizational partnerships without explicit legal authorization.</p>
                </div>
            </section>

            {/* ================= PRIVACY AND SECURITY (PHASE 3G) ================= */}
            <section className="py-24 bg-[#121519] border-y border-white/10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <span className="px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                            DATA GOVERNANCE & PRIVACY
                        </span>
                        {/* Mandated Section Title */}
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                            Emergency access. Privacy by design.
                        </h2>
                        <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                            Emergency assistance must never compromise personal privacy. Discover what information is collected, how access is controlled, and how your data principal rights are enforced.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <FileText size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">What Is Stored</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Account identifiers, designated emergency contacts, and voluntary medical information provided directly by the user. Physical identifiers contain unpredictable random keys, never raw health records.
                            </p>
                        </div>

                        <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <Eye size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">What a Scan Reveals</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Public scans display patient display name, blood group, masked emergency contact telephone triggers, and emergency service dial actions. Strangers do not receive full medical histories.
                            </p>
                        </div>

                        <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <Lock size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">Authorized Clinical Access</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Extended clinical medical records (allergies, chronic conditions, surgical notes, insurance) are isolated behind verified clinical authorization gates with time-limited tokens.
                            </p>
                        </div>

                        <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <UserCheck size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">Consent & Preferences</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Users explicitly control optional sharing settings (such as GPS transmission) and can toggle public visibility of specific items directly in their Privacy Settings console.
                            </p>
                        </div>

                        <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">Incident & Audit Logging</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Every administrative profile view and verification event generates an immutable audit record. In-memory rate limiting blocks brute-force verification attacks.
                            </p>
                        </div>

                        <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <ShieldCheck size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">Right to Erasure</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Users have the right to request full data erasure or revoke physical QR tags at any time. Submit deletion requests via our self-serve Privacy Center or via email.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Link 
                            to="/privacy-policy" 
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white transition-all"
                        >
                            Read Full Privacy Policy & Governance Details <ExternalLink size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ================= INSTITUTIONAL PARTNERSHIPS (PHASE 3H) ================= */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-[#17191D] border border-white/10 rounded-3xl p-8 sm:p-14 relative overflow-hidden">
                    <div className="max-w-3xl space-y-6">
                        <span className="px-3.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                            INSTITUTIONAL COLLABORATION
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                            Building Resilient Civic Public Safety Networks
                        </h2>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                            Road trauma is a leading cause of preventable mortality during transit. RESQR collaborates with municipal transit authorities, industrial campuses, and public health departments to deploy scalable emergency identification infrastructure.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-xs font-bold text-white uppercase">Deployment Model</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Fleet-wide helmet stickers, corporate badge integrations, and civic registration drives.</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase">Measurable Criteria</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Reduced time-to-kin notification and instantaneous allergy alerts during ER triage.</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase">Governance</p>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Strict adherence to Indian IT Act and DPDP Act compliance with defined data ownership.</p>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <Link 
                                to="/government-partnerships" 
                                className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 transition-all text-center"
                            >
                                Submit Pilot Proposal Request
                            </Link>
                            <Link 
                                to="/contact" 
                                className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold uppercase tracking-wider text-xs transition-all text-center"
                            >
                                Contact Institutional Team
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FREQUENTLY ASKED QUESTIONS (PHASE 3I) ================= */}
            <section className="py-20 bg-[#121519] border-t border-white/10 relative z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-3 mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">TRANSPARENCY & VERIFICATION</span>
                        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Frequently Asked Questions</h2>
                        <p className="text-slate-400 text-sm">Clear, straightforward answers about how the RESQR platform functions.</p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, index) => {
                            const isOpen = activeFaq === index;
                            return (
                                <div 
                                    key={index}
                                    className="bg-[#17191D] border border-white/10 rounded-2xl overflow-hidden transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveFaq(isOpen ? null : index)}
                                        className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="text-sm font-bold text-white">{faq.q}</span>
                                        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                                    </button>
                                    {isOpen && (
                                        <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 text-center p-6 rounded-2xl bg-[#17191D] border border-white/10">
                        <p className="text-xs text-slate-300 font-medium">Have additional technical, medical, or legal questions?</p>
                        <p className="text-xs text-slate-400 mt-1">Our support and compliance desk is available at <a href="mailto:admin@resqr.co.in" className="text-primary underline">admin@resqr.co.in</a>.</p>
                    </div>
                </div>
            </section>

            {/* ================= FINAL CALL TO ACTION ================= */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <div className="max-w-3xl mx-auto space-y-6">
                    <ResqrLogo className="h-10 w-auto mx-auto object-contain" />
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                        Equip Yourself with an Emergency Identity Today
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Join proactive citizens, families, and organizations who ensure vital emergency information is reachable when every second matters.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link 
                            to={primaryHref} 
                            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-primary/30 transition-all hover:scale-[1.02]"
                        >
                            Create Your RESQR
                        </Link>
                        <Link 
                            to="/how-it-works" 
                            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-xl font-bold uppercase tracking-wider text-xs transition-all"
                        >
                            Read How It Works
                        </Link>
                    </div>

                    <div className="pt-6">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {userCount} Verified Profiles Registered
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}