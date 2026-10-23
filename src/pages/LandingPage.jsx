import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ChevronRight, Activity, Heart, CheckCircle2,
    QrCode, Smartphone, Users, Lock, Zap, User, ScanLine,
    ArrowRight, HeartHandshake, AlertCircle, PhoneCall, Building2,
    Stethoscope, Siren, ShieldCheck, HelpCircle, ShieldAlert,
    ExternalLink, Eye, EyeOff, Radio, Check, ChevronDown, Sparkles,
    FileText, UserCheck, AlertTriangle, Key, Hospital, Landmark,
    Briefcase, Award, Ambulance, RefreshCw, Cpu, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import ResqrLogo from '../components/branding/ResqrLogo';

/**
 * RESQR — When Every Second Matters
 * 
 * World-Class UI/UX Homepage Transformation
 * Combines premium industrial product design, cinematic technology art direction,
 * refined editorial typography, and alternating dark cinematic and clean light sections.
 */
export default function LandingPage() {
    const [userCount, setUserCount] = useState('...');
    const [hasPaid, setHasPaid] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);
    
    // Signature Hero Interaction States
    const [scanScenario, setScanScenario] = useState('bystander'); // 'bystander' | 'clinical'
    const [isScanning, setIsScanning] = useState(false);
    const [scanFeedback, setScanFeedback] = useState(null);

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

    // Fictional demonstration profile data (strictly fictional)
    const demoProfile = {
        name: "Rohan Sharma",
        id: "RQ-DEL-88219",
        status: "ACTIVE PROTECTION",
        bloodGroup: "O+",
        age: 31,
        primaryContact: {
            relation: "Spouse (Next of Kin)",
            name: "Ananya Sharma",
            maskedPhone: "+91 98XXX XXXXX"
        },
        allergies: "Severe Penicillin & Peanut Allergy (Anaphylaxis Risk)",
        chronicConditions: "Mild Asthma (Carries Inhaler)",
        emergencyNotes: "Contact spouse immediately in emergency. Carries auto-injector in jacket pocket.",
        organDonor: "Registered Organ Donor",
        hospitalAdmissionRef: "HOSP-MH-VERIFIED",
    };

    // Signature Scan Interaction Handler
    const handleTriggerScan = (targetScenario) => {
        setIsScanning(true);
        setScanFeedback(null);
        setTimeout(() => {
            setScanScenario(targetScenario);
            setIsScanning(false);
            setScanFeedback(targetScenario === 'bystander' 
                ? "Bystander View Active: Essential ICE contacts displayed. Medical vault remains sealed." 
                : "Hospital Gate Active: Clinical vitals unlocked under verified emergency protocol."
            );
        }, 1100);
    };

    const howItWorksSteps = [
        {
            num: "01",
            title: "Register Account",
            desc: "Create your personal RESQR account using verified mobile OTP or secure Google sign-in.",
            detail: "Establishes a private data principal record on our secure cloud platform."
        },
        {
            num: "02",
            title: "Add Emergency Contacts",
            desc: "Designate family members or trusted guardians as your primary and secondary points of contact.",
            detail: "Numbers are stored in your secure vault and masked during public scans to prevent spam."
        },
        {
            num: "03",
            title: "Configure Health Data",
            desc: "Voluntarily record your blood group, severe drug allergies, and critical medical conditions.",
            detail: "You maintain complete granular control over what information is entered and displayed."
        },
        {
            num: "04",
            title: "Activate QR / NFC Tag",
            desc: "Link your unique reflective physical sticker, keychain tag, wallet card, or digital pass.",
            detail: "Each tag carries an unpredictable cryptographic token, never raw medical records."
        },
        {
            num: "05",
            title: "Scan in Emergency",
            desc: "During an accident or medical event, a bystander or paramedic scans the tag using any smartphone.",
            detail: "Works with native iPhone and Android cameras. Zero external app installation required."
        },
        {
            num: "06",
            title: "Governed Access Display",
            desc: "The responder accesses only the information permitted under your configured access policy.",
            detail: "Passersby see minimal coordination data; detailed medical records require clinical verification."
        },
        {
            num: "07",
            title: "Direct Contact Actions",
            desc: "The responder taps to connect directly with your designated emergency contacts.",
            detail: "Enables immediate notification of family members during the critical golden hour."
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
            desc: "Rapid patient identity mapping, verified blood group, and allergy alerts upon arrival in emergency departments.",
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
            a: "When a bystander taps the 'Call Emergency Contact' action on your emergency screen, their phone initiates a telephone call to your designated emergency contact. Phone numbers are masked on the screen to prevent spam and protect family privacy."
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
        <div className="relative min-h-screen bg-[#101114] text-[#F7F8FA] font-manrope selection:bg-primary/30">
            
            {/* ========================================================================= */}
            {/* 1. CINEMATIC HERO SECTION ("RESQR — When Every Second Matters")           */}
            {/* 55% messaging width, 45% product visual scene, no overlapping clutter    */}
            {/* ========================================================================= */}
            <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
                {/* Sophisticated background lighting (Deep charcoal, subtle crimson ambient radial) */}
                <div className="absolute top-[-10%] right-[10%] w-[650px] h-[650px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
                <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-primary-dark/8 rounded-full blur-[140px] pointer-events-none" />
                
                {/* Subtle, restrained QR-inspired geometric motif in the backdrop */}
                <div className="absolute top-16 right-12 w-96 h-96 border border-white/[0.03] rounded-3xl pointer-events-none rotate-12 hidden lg:block" />
                <div className="absolute top-32 right-28 w-64 h-64 border border-primary/[0.04] rounded-2xl pointer-events-none -rotate-6 hidden lg:block" />

                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
                        
                        {/* LEFT COLUMN: Editorial Typography & Intentional Actions (55% width) */}
                        <div className="lg:col-span-7 space-y-7 text-left">
                            {/* Strategic Trust Badge */}
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#303238] bg-white/[0.03] text-slate-300 text-xs font-semibold tracking-wide backdrop-blur-sm">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                                <span>Intelligent Emergency Infrastructure</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-[11px] text-slate-400 font-mono">DPDP Act 2023</span>
                            </div>

                            {/* Mandated Refined Editorial Headline */}
                            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08]">
                                Emergency information. <br />
                                <span className="text-primary">Within reach.</span>
                            </h1>

                            {/* Mandated Concise Supporting Text */}
                            <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal leading-relaxed max-w-xl">
                                RESQR connects a registered emergency profile to a scannable QR or NFC identifier, helping people reach designated emergency contacts and access permitted emergency information.
                            </p>

                            {/* Calls to Action: Primary, Secondary, and Institutional */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                                <Link 
                                    to={primaryHref} 
                                    className="h-12 px-7 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <HeartHandshake size={17} /> Create Your RESQR
                                </Link>

                                <a 
                                    href="#how-it-works" 
                                    className="h-12 px-6 bg-transparent hover:bg-white/[0.06] text-white border border-[#303238] hover:border-slate-500 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                    See How It Works <ArrowRight size={15} />
                                </a>

                                <Link 
                                    to="/government-partnerships" 
                                    className="h-12 px-5 text-slate-400 hover:text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Building2 size={15} className="text-primary" /> Explore Partnerships
                                </Link>
                            </div>

                            {/* Clean Baseline Permission & Trust Footnote */}
                            <div className="pt-6 border-t border-[#303238] flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                                    <span>User-configured privacy controls</span>
                                </div>
                                <span className="hidden sm:inline text-slate-600">•</span>
                                <div className="flex items-center gap-2">
                                    <Smartphone size={16} className="text-primary shrink-0" />
                                    <span>Zero app required for first responders</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Signature 3D Product & Interactive Smartphone Scene (45% width) */}
                        <div className="lg:col-span-5 relative">
                            {/* Ambient focal lighting behind the device */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-primary/5 rounded-[40px] blur-3xl pointer-events-none" />

                            {/* Main Product Scene Container */}
                            <div className="relative bg-[#171A20] border border-[#303238] rounded-[32px] p-5 sm:p-7 shadow-2xl space-y-5 backdrop-blur-xl">
                                
                                {/* Top Controls Bar: Simulation Switcher & Scan Trigger */}
                                <div className="flex items-center justify-between pb-3.5 border-b border-[#303238]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                                            Interactive Demonstration
                                        </span>
                                    </div>
                                    <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/5 text-[10px] font-bold uppercase">
                                        <button
                                            type="button"
                                            onClick={() => handleTriggerScan('bystander')}
                                            disabled={isScanning}
                                            className={`px-2.5 py-1 rounded-lg transition-all ${scanScenario === 'bystander' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Bystander
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTriggerScan('clinical')}
                                            disabled={isScanning}
                                            className={`px-2.5 py-1 rounded-lg transition-all ${scanScenario === 'clinical' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Clinical ER
                                        </button>
                                    </div>
                                </div>

                                {/* Physical Hardware Tag Scene: Matte Obsidian Card + 3M Reflective Decal */}
                                <div className="relative bg-gradient-to-br from-[#121418] to-[#0A0B0D] border border-white/10 rounded-2xl p-4 shadow-inner overflow-hidden">
                                    {/* Scanning Laser Beam Indicator */}
                                    {isScanning && (
                                        <motion.div
                                            initial={{ y: -10 }}
                                            animate={{ y: 130 }}
                                            transition={{ duration: 1, ease: "linear", repeat: 1 }}
                                            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#D71920] z-20 pointer-events-none"
                                        />
                                    )}

                                    <div className="flex items-center justify-between gap-4">
                                        {/* Physical Card Representation */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center relative">
                                                <QrCode size={46} className="text-slate-900" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-4 h-4 rounded-sm bg-primary border border-white flex items-center justify-center">
                                                        <span className="text-[7px] text-white font-black">R</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <Radio size={12} className="text-primary animate-pulse" />
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                                                        NFC + Reflective Tag
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">
                                                    Tag ID: {demoProfile.id}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    Permanent Cryptographic Token
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tap to simulate scan button */}
                                        <button
                                            type="button"
                                            onClick={() => handleTriggerScan(scanScenario === 'bystander' ? 'clinical' : 'bystander')}
                                            disabled={isScanning}
                                            className="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shrink-0"
                                            title="Simulate smartphone scan"
                                        >
                                            <RefreshCw size={12} className={isScanning ? "animate-spin text-primary" : ""} />
                                            <span>Simulate Scan</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Smartphone Mockup Framing displaying the Emergency Profile */}
                                <div className="bg-[#0C0E12] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl relative">
                                    {/* Mock Smartphone Status Header */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pb-2 border-b border-white/5">
                                        <span className="flex items-center gap-1.5 text-slate-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            SECURE RESQR VIEW
                                        </span>
                                        <span className="text-[9px] uppercase tracking-widest text-primary font-bold">
                                            {scanScenario === 'bystander' ? 'Public View' : 'Verified Clinical'}
                                        </span>
                                    </div>

                                    {/* Registered Citizen Info */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Citizen</span>
                                            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                                                {demoProfile.name}
                                            </h3>
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-black text-xs">
                                            {demoProfile.bloodGroup}
                                        </div>
                                    </div>

                                    {/* Designated Emergency Contact (Masked for privacy) */}
                                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Emergency Contact (Next of Kin)</span>
                                            <span className="text-[9px] font-mono text-emerald-400">Privacy Masked</span>
                                        </div>
                                        <p className="text-xs font-bold text-white">{demoProfile.primaryContact.name} ({demoProfile.primaryContact.relation})</p>
                                        <p className="text-xs font-mono text-primary">{demoProfile.primaryContact.maskedPhone}</p>
                                    </div>

                                    {/* Medical Alert Notice */}
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                                        <AlertTriangle size={15} className="text-primary shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <span className="font-bold text-[11px] uppercase tracking-wider block">Critical Allergy Alert</span>
                                            <span className="text-[11px] leading-tight text-slate-200 block">{demoProfile.allergies}</span>
                                        </div>
                                    </div>

                                    {/* Conditional Clinical Vault Data (Only shown in clinical scenario) */}
                                    {scanScenario === 'clinical' && (
                                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs space-y-1 animate-in fade-in">
                                            <div className="flex items-center justify-between font-bold text-[10px] uppercase text-blue-300">
                                                <span>Clinical Medical Vault</span>
                                                <span className="font-mono">Verified Hospital</span>
                                            </div>
                                            <p className="text-[11px] text-slate-300"><strong>Chronic:</strong> {demoProfile.chronicConditions}</p>
                                            <p className="text-[11px] text-slate-300"><strong>Protocol:</strong> {demoProfile.emergencyNotes}</p>
                                        </div>
                                    )}

                                    {/* Primary Responder Action Button */}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setScanFeedback(`Call intent simulated for ${demoProfile.primaryContact.name}. Real phone initiates standard dialer call.`)}
                                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all"
                                        >
                                            <PhoneCall size={14} /> Call Emergency Contact
                                        </button>
                                    </div>

                                    {/* Action Feedback Toast */}
                                    {scanFeedback && (
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center justify-between">
                                            <span>{scanFeedback}</span>
                                            <button onClick={() => setScanFeedback(null)} className="text-emerald-400 hover:text-white font-bold text-[10px] ml-2">✕</button>
                                        </div>
                                    )}
                                </div>

                                {/* Hardware Placement Tags: Helmet, Wallet, Keychain */}
                                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-white">Helmet Sticker</p>
                                        <span className="text-[9px] text-slate-500">Reflective 3M</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-white">Wallet Card</p>
                                        <span className="text-[9px] text-slate-500">Smart NFC PVC</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-white">Keychain Tag</p>
                                        <span className="text-[9px] text-slate-500">Laser-Etched</span>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-500 text-center">
                                    Simulated demonstration only. Real individual medical records are never published publicly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 2. SECTION A: HOW RESQR WORKS (Clean, High-Trust Soft Light Section)     */}
            {/* Alternates to #F6F7F8 soft light background for editorial elegance        */}
            {/* ========================================================================= */}
            <section id="how-it-works" className="py-24 bg-[#F6F7F8] text-[#17191D] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="px-3.5 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-[#626975] font-bold text-xs uppercase tracking-[0.2em] shadow-sm">
                            Complete Safety Framework
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#17191D]">
                            How RESQR Works
                        </h2>
                        <p className="text-[#626975] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            A structured public safety framework designed to connect first responders with designated emergency contacts and permitted health data when every minute counts.
                        </p>
                    </div>

                    {/* 7-Step Progression Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {howItWorksSteps.map((step) => (
                            <div 
                                key={step.num}
                                className="bg-white border border-[#E5E7EB] hover:border-primary/50 rounded-2xl p-7 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-mono font-black text-primary tracking-widest">{step.num}</span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tight text-[#17191D]">{step.title}</h3>
                                    <p className="text-xs text-[#626975] leading-relaxed font-normal">{step.desc}</p>
                                </div>
                                <div className="pt-3 border-t border-[#E5E7EB]">
                                    <p className="text-[11px] text-slate-500 leading-normal">{step.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Data Access Clarification Callout */}
                    <div className="mt-12 p-6 rounded-2xl bg-white border border-[#E5E7EB] max-w-3xl mx-auto text-center text-xs text-[#626975] leading-relaxed shadow-sm">
                        <p>
                            <strong className="text-[#17191D]">Privacy Governance Note:</strong> Scanning a physical RESQR identifier does NOT broadcast raw medical records to strangers. Information access adheres strictly to the user-configured access policy and role-based clinical verification gates.
                        </p>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 3. SECTION B: THE PRODUCT ECOSYSTEM (Cinematic Dark Industrial Theme)     */}
            {/* ========================================================================= */}
            <section className="py-24 bg-[#101114] border-y border-[#303238] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="px-3.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300 font-bold text-xs uppercase tracking-[0.2em]">
                            Product Ecosystem
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                            Physical & Digital Identifiers
                        </h2>
                        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
                            Carry your emergency identity in the format that best fits your daily mobility—from helmet stickers to wallet smart cards.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ecosystemProducts.map((p) => (
                            <div 
                                key={p.name}
                                className="bg-[#171A20] border border-[#303238] hover:border-slate-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:-translate-y-1"
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
                                    className="w-full h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-[#303238] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                >
                                    View Specifications
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 4. SECTION C: TAILORED SOLUTIONS (Clean Light Section)                    */}
            {/* ========================================================================= */}
            <section className="py-24 bg-[#F6F7F8] text-[#17191D] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="px-3.5 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-[#626975] font-bold text-xs uppercase tracking-[0.2em] shadow-sm">
                            Tailored Workflows
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#17191D]">
                            Designed for Every Stakeholder
                        </h2>
                        <p className="text-[#626975] text-base max-w-2xl mx-auto leading-relaxed">
                            Emergency access solutions adapted for citizens, healthcare institutions, doctors, corporate campuses, and civic responders.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {audienceSolutions.map((sol) => {
                            const Icon = sol.icon;
                            return (
                                <Link 
                                    key={sol.title}
                                    to={sol.link}
                                    className="bg-white border border-[#E5E7EB] hover:border-primary/50 rounded-2xl p-7 space-y-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <Icon size={22} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                            {sol.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black text-[#17191D] uppercase group-hover:text-primary transition-colors">
                                        {sol.title}
                                    </h3>

                                    <p className="text-xs text-[#626975] leading-relaxed">
                                        {sol.desc}
                                    </p>

                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                                        Explore Solution Details <ChevronRight size={14} />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 5. SECTION D: PRIVACY & DATA GOVERNANCE (Dark Security Vault Aesthetic)   */}
            {/* ========================================================================= */}
            <section className="py-24 bg-[#121418] border-y border-[#303238] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em]">
                            DPDP 2023 & IT Act Alignment
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                            Emergency access. Privacy by design.
                        </h2>
                        <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
                            Emergency assistance must never compromise personal privacy. Discover what information is collected, how access is controlled, and how your data principal rights are enforced.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-[#171A20] border border-[#303238] rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <FileText size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">What Is Stored</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Account identifiers, designated emergency contacts, and voluntary medical information provided directly by the user. Physical identifiers contain unpredictable random keys, never raw health records.
                            </p>
                        </div>

                        <div className="bg-[#171A20] border border-[#303238] rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <Eye size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">What a Scan Reveals</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Public scans display patient display name, blood group, masked emergency contact telephone triggers, and emergency service dial actions. Strangers do not receive full medical histories.
                            </p>
                        </div>

                        <div className="bg-[#171A20] border border-[#303238] rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <Lock size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">Authorized Clinical Access</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Extended clinical medical records (allergies, chronic conditions, surgical notes, insurance) are isolated behind verified clinical authorization gates with time-limited tokens.
                            </p>
                        </div>

                        <div className="bg-[#171A20] border border-[#303238] rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <UserCheck size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">Consent & Preferences</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Users explicitly control optional sharing settings (such as GPS transmission) and can toggle public visibility of specific items directly in their Privacy Settings console.
                            </p>
                        </div>

                        <div className="bg-[#171A20] border border-[#303238] rounded-2xl p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                            <h3 className="text-base font-bold text-white uppercase">Incident & Audit Logging</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Every administrative profile view and verification event generates an immutable audit record. In-memory rate limiting blocks brute-force verification attacks.
                            </p>
                        </div>

                        <div className="bg-[#171A20] border border-[#303238] rounded-2xl p-6 space-y-3">
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
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#303238] text-xs font-bold uppercase tracking-wider text-white transition-all"
                        >
                            Read Full Privacy Policy & Governance Details <ExternalLink size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 6. SECTION E: INSTITUTIONAL & GOVERNMENT PARTNERSHIPS                     */}
            {/* ========================================================================= */}
            <section className="py-24 max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                <div className="bg-[#171A20] border border-[#303238] rounded-3xl p-8 sm:p-14 relative overflow-hidden">
                    <div className="max-w-3xl space-y-6">
                        <span className="px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                            Institutional Collaboration
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                            Building Resilient Civic Emergency Networks
                        </h2>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                            Road trauma is a leading cause of preventable mortality during transit. RESQR collaborates with municipal transit authorities, industrial campuses, and public health departments to deploy scalable emergency identification infrastructure.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#303238]">
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
                                className="h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 transition-all flex items-center justify-center text-center"
                            >
                                Submit Pilot Proposal Request
                            </Link>
                            <Link 
                                to="/contact" 
                                className="h-12 px-6 bg-transparent hover:bg-white/5 text-white border border-[#303238] rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center text-center"
                            >
                                Contact Institutional Team
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 7. FREQUENTLY ASKED QUESTIONS                                             */}
            {/* ========================================================================= */}
            <section className="py-20 bg-[#121418] border-t border-[#303238] relative z-10">
                <div className="max-w-4xl mx-auto px-6 sm:px-8">
                    <div className="text-center space-y-3 mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Transparency & Verification</span>
                        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Frequently Asked Questions</h2>
                        <p className="text-slate-400 text-sm">Clear, straightforward answers about how the RESQR platform functions.</p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, index) => {
                            const isOpen = activeFaq === index;
                            return (
                                <div 
                                    key={index}
                                    className="bg-[#171A20] border border-[#303238] rounded-2xl overflow-hidden transition-all"
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
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 8. SECTION F: FINAL CALL TO ACTION                                        */}
            {/* ========================================================================= */}
            <section className="py-24 max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 text-center relative z-10">
                <div className="max-w-3xl mx-auto space-y-6">
                    <ResqrLogo className="h-10 w-auto mx-auto object-contain" />
                    
                    {/* Mandated Section F Headline */}
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                        Make emergency information easier to reach.
                    </h2>
                    
                    <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                        Join proactive citizens, families, and organizations who ensure vital emergency information is reachable when every second matters.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link 
                            to={primaryHref} 
                            className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-primary/30 transition-all hover:-translate-y-0.5 flex items-center justify-center"
                        >
                            Create Your RESQR
                        </Link>
                        <Link 
                            to="/government-partnerships" 
                            className="w-full sm:w-auto h-12 px-8 bg-transparent hover:bg-white/5 text-white border border-[#303238] rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center"
                        >
                            Discuss an Institutional Pilot
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