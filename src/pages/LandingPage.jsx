

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ChevronRight, Activity, Heart, CheckCircle2,
    QrCode, Smartphone, Users, Lock, Zap, User, ScanLine,
    ArrowRight, HeartHandshake, AlertCircle, PhoneCall, Building2,
    Stethoscope, Siren, ShieldCheck, HelpCircle, ShieldAlert,
    ExternalLink, Eye, EyeOff, Radio, Check, ChevronDown, Sparkles,
    FileText, UserCheck, AlertTriangle, Key, Hospital, Landmark,
    Briefcase, Award, Ambulance, RefreshCw, Cpu, Layers, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import ResqrLogo from '../components/branding/ResqrLogo';

/**
 * RESQR — The Future of Emergency Identification
 * Company: Sion Enterprises | Tagline: SCAN. RESCUE. SAVE LIVES.
 * 
 * Creative Direction:
 * - Cinematic product storytelling & industrial design aesthetics
 * - Balanced 52/48 hero composition with refined negative space
 * - Faux-grid removed in favor of soft obsidian-to-charcoal gradient & ambient focal illumination
 * - Tangible physical RESQR tag + modern smartphone emergency profile preview
 * - Interactive scenario switcher: "Emergency Scan" vs "Authorized Clinical Access"
 * - Alternating rhythm: Cinematic Dark (#101114) and Calm High-Trust Light (#F7F8FA / #FFFFFF)
 * - Strict adherence to DPDP Act 2023, data minimization, and real capabilities
 */
export default function LandingPage() {
    const [userCount, setUserCount] = useState('...');
    const [hasPaid, setHasPaid] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);
    
    // Interactive Product Demonstration State
    const [scanScenario, setScanScenario] = useState('emergency'); // 'emergency' | 'clinical'
    const [isScanning, setIsScanning] = useState(false);
    const [simulatedFeedback, setSimulatedFeedback] = useState(null);

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

    // Fictional demonstration profile data (strictly fictional illustrative records)
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
        emergencyNotes: "Contact spouse immediately in emergency. Auto-injector in jacket pocket.",
        organDonor: "Registered Organ Donor",
        hospitalAdmissionRef: "HOSP-MH-VERIFIED",
    };

    // Trigger smooth scenario transition with signature scanlight sweep
    const handleTriggerScenario = (targetScenario) => {
        if (isScanning || targetScenario === scanScenario) return;
        setIsScanning(true);
        setSimulatedFeedback(null);
        setTimeout(() => {
            setScanScenario(targetScenario);
            setIsScanning(false);
        }, 650);
    };

    // 6-Step Visual Sequence as specified
    const howItWorksSteps = [
        {
            num: "01",
            title: "Register your profile",
            desc: "Create your personal RESQR profile using verified mobile OTP or secure Google sign-in.",
            detail: "Establishes a private data principal record on our secure cloud platform."
        },
        {
            num: "02",
            title: "Add emergency contacts",
            desc: "Designate family members or trusted guardians as your primary and secondary points of contact.",
            detail: "Phone numbers are masked during public scans to protect privacy and prevent spam."
        },
        {
            num: "03",
            title: "Configure permitted information",
            desc: "Voluntarily record your blood group, severe drug allergies, and critical health alerts.",
            detail: "You maintain complete granular control over what information is entered and shown."
        },
        {
            num: "04",
            title: "Activate your QR or NFC identifier",
            desc: "Link your physical reflective sticker, stainless keychain, or wallet smart card.",
            detail: "Physical tags carry unpredictable secure tokens, never plain medical records."
        },
        {
            num: "05",
            title: "Scan the identifier when assistance is needed",
            desc: "During an accident or medical event, a bystander or paramedic scans the tag with any smartphone camera.",
            detail: "Native camera scanning on iPhone & Android with zero app download required."
        },
        {
            num: "06",
            title: "Follow emergency-contact or clinical workflow",
            desc: "The responder accesses permitted emergency contacts or verified clinical triage notes.",
            detail: "Enables immediate connection to family during the critical golden hour."
        }
    ];

    const ecosystemProducts = [
        {
            name: "Digital RESQR Identity",
            price: "₹99 / year",
            format: "Digital Mobile Pass",
            desc: "Instant digital emergency pass compatible with Apple Wallet and Google Wallet. Optimized for smartphone lockscreen wallpaper displays.",
            features: ["Immediate digital pass generation", "Dynamic cloud updates", "Lockscreen emergency wallpaper export"]
        },
        {
            name: "Reflective QR Stickers",
            price: "₹149 / pack of 2",
            format: "Physical Weatherproof Vinyl",
            desc: "High-grade 3M reflective vinyl stickers engineered for motorcycle helmets, car windshields, cycles, and laptop sleeves.",
            features: ["Waterproof & UV-resistant coating", "Night-time high-reflectivity vinyl", "Scratch-resistant lamination"]
        },
        {
            name: "Stainless Steel Keychains",
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
            desc: "Emergency identity coverage for spouses, children, and daily commuters on highway and transit networks.",
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

    const privacyPillars = [
        {
            icon: FileText,
            title: "Information Provided by Choice",
            desc: "Citizens voluntarily record only what they deem necessary—such as blood group, emergency contacts, or severe drug allergies. We enforce strict data minimization."
        },
        {
            icon: Users,
            title: "Emergency Contact Masking",
            desc: "Designated contact telephone numbers are masked on public scan views to protect family privacy while still permitting direct phone dialer initiation."
        },
        {
            icon: Eye,
            title: "What a Public Scan Reveals",
            desc: "A public bystander scan displays only essential emergency information: citizen name, blood group, emergency contact button, and critical allergies."
        },
        {
            icon: Lock,
            title: "Authorized Clinical Access",
            desc: "Extended clinical medical histories (chronic conditions, surgical notes, hospital records) require verified role-based clinical authentication."
        },
        {
            icon: RefreshCw,
            title: "Activation & Immediate Revocation",
            desc: "If an identifier tag, sticker, or card is lost or sold, you can instantly revoke it in your RESQR Dashboard. Revoked tags immediately cease to display data."
        },
        {
            icon: Trash2,
            title: "Account Deletion & Erasure",
            desc: "You retain full ownership of your data. Exercise your statutory right to account erasure and profile removal at any time via our self-serve Privacy Center."
        },
        {
            icon: ShieldCheck,
            title: "Implemented Security Protections",
            desc: "Physical tags carry cryptographic random identifiers—never raw health files. In-memory rate limiting and secure HTTPS transport protect against brute-force attacks."
        }
    ];

    const faqs = [
        {
            q: "Does a person scanning my RESQR need to download an app?",
            a: "No. Any standard smartphone camera (iOS or Android) can scan the QR tag directly and open the secure emergency portal in their mobile browser without installing any application."
        },
        {
            q: "Can anyone who scans my tag see all my private medical records?",
            a: "No. By default, a public bystander scan displays only essential emergency information: your name, blood group, masked emergency contact action, and critical allergy alerts. Extended medical records require authorized clinical access."
        },
        {
            q: "How does the emergency contact action work?",
            a: "When a bystander taps the 'Call Emergency Contact' action on your emergency screen, their phone initiates a telephone call to your designated contact via their phone dialer. Phone numbers are masked on the screen to prevent spam."
        },
        {
            q: "What happens if I lose my helmet, card, or sticker?",
            a: "You can instantly revoke or deactivate any specific QR tag from your RESQR Dashboard. A revoked tag immediately ceases to display your emergency profile if scanned."
        },
        {
            q: "Is RESQR affiliated with 108 or government emergency services?",
            a: "RESQR is an independent emergency technology platform developed by Sion Enterprises. The emergency dial buttons initiate telephone calls to 108 or 100 via the user's phone dialer. We do not represent government agencies."
        },
        {
            q: "Can I update my medical information or emergency contacts later?",
            a: "Yes. Your physical QR stickers and tags point to your dynamic cloud identity. You can update your emergency contacts or medical information in your dashboard at any time without reprinting the physical tag."
        }
    ];

    return (
        <div className="relative min-h-screen bg-[#101114] text-[#F7F8FA] font-manrope selection:bg-[#D71920]/30 overflow-x-hidden">
            
            {/* ========================================================================= */}
            {/* 1. CINEMATIC HERO SECTION ("RESQR — The Future of Emergency Identification") */}
            {/* Refined 52/48 balance, restrained illumination, clean negative space       */}
            {/* ========================================================================= */}
            <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden z-10">
                
                {/* Subtle Near-Black to Charcoal Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#101114] via-[#14161B] to-[#181A1F] pointer-events-none" />

                {/* Restrained Crimson Ambient Glow behind the Product Scene */}
                <div className="absolute top-1/4 right-[5%] w-[680px] h-[680px] bg-gradient-to-br from-[#D71920]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

                {/* Soft Radial Illumination on Left for Text Legibility */}
                <div className="absolute top-1/3 left-[-10%] w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

                {/* Very Faint QR-Inspired Geometry Used Sparingly (Masked to avoid text competition) */}
                <div 
                    className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-40"
                    style={{
                        maskImage: 'radial-gradient(circle at 75% 45%, black 20%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(circle at 75% 45%, black 20%, transparent 70%)'
                    }}
                />

                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
                        
                        {/* LEFT COLUMN: Editorial Typography & Intentional Actions (~52% balance) */}
                        <div className="lg:col-span-7 space-y-7 text-left">
                            
                            {/* Strategic Trust Badge */}
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#303238] bg-white/[0.03] text-slate-300 text-xs font-semibold tracking-wide backdrop-blur-sm">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71920] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D71920]" />
                                </span>
                                <span>Intelligent Emergency Identification</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-[11px] text-slate-400 font-mono">DPDP Act 2023</span>
                            </div>

                            {/* Mandated Exact Headline */}
                            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08]">
                                Emergency information. <br />
                                <span className="text-[#D71920]">Within reach.</span>
                            </h1>

                            {/* Mandated Exact Supporting Copy */}
                            <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal leading-relaxed max-w-xl">
                                One simple identifier can help connect a person in an emergency to designated contacts and permitted emergency information.
                            </p>

                            {/* Primary, Secondary, and Institutional Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                                <Link 
                                    to={primaryHref} 
                                    className="h-12 px-7 bg-[#D71920] hover:bg-[#A80F19] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#D71920]/25 flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D71920]"
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
                                    <Building2 size={15} className="text-[#D71920]" /> Explore Partnerships
                                </Link>
                            </div>

                            {/* Subtle Supporting Privacy Statement */}
                            <div className="pt-6 border-t border-[#303238] flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-[#16845B] shrink-0" />
                                    <span>User-configured privacy controls</span>
                                </div>
                                <span className="hidden sm:inline text-slate-600">•</span>
                                <div className="flex items-center gap-2">
                                    <Smartphone size={16} className="text-[#D71920] shrink-0" />
                                    <span>Zero app required for first responders</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Signature RESQR Product Scene & Demonstration (~48% balance) */}
                        <div className="lg:col-span-5 relative">
                            
                            {/* Ambient focal lighting behind the product scene */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#D71920]/15 via-transparent to-[#D71920]/5 rounded-[40px] blur-3xl pointer-events-none" />

                            {/* Master Scene Card */}
                            <div className="relative bg-[#181A1F] border border-[#303238] rounded-[32px] p-5 sm:p-7 shadow-2xl space-y-5 backdrop-blur-xl">
                                
                                {/* Compact Exploration Header & Scenario Selector */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#303238]">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#AEB7C4]">
                                        EXPLORE THE RESQR EXPERIENCE
                                    </span>

                                    {/* Simple Two-Scenario Selector */}
                                    <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/5 text-[10px] font-bold uppercase">
                                        <button
                                            type="button"
                                            onClick={() => handleTriggerScenario('emergency')}
                                            disabled={isScanning}
                                            className={`px-3 py-1.5 rounded-lg transition-all ${scanScenario === 'emergency' ? 'bg-[#D71920] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Emergency Scan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTriggerScenario('clinical')}
                                            disabled={isScanning}
                                            className={`px-3 py-1.5 rounded-lg transition-all ${scanScenario === 'clinical' ? 'bg-[#181A1F] text-white border border-[#303238] shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Authorized Clinical Access
                                        </button>
                                    </div>
                                </div>

                                {/* Realistically Rendered Physical RESQR Tag Card */}
                                <div className="relative bg-gradient-to-br from-[#121418] to-[#0A0B0D] border border-white/10 rounded-2xl p-4 shadow-inner overflow-hidden">
                                    
                                    {/* Subtle Visual Highlight Moving Across the Tag on Scan */}
                                    {isScanning && (
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '200%' }}
                                            transition={{ duration: 0.65, ease: "easeInOut" }}
                                            className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#D71920]/40 to-transparent skew-x-12 z-20 pointer-events-none"
                                        />
                                    )}

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3.5">
                                            {/* Tangible QR/NFC Identifier Representation */}
                                            <div className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center relative">
                                                <QrCode size={46} className="text-slate-900" />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-4 h-4 rounded-sm bg-[#D71920] border border-white flex items-center justify-center">
                                                        <span className="text-[7px] text-white font-black">R</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <Radio size={12} className="text-[#D71920] animate-pulse" />
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

                                        {/* Action to trigger scan demonstration */}
                                        <button
                                            type="button"
                                            onClick={() => handleTriggerScenario(scanScenario === 'emergency' ? 'clinical' : 'emergency')}
                                            disabled={isScanning}
                                            className="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5 transition-all shrink-0"
                                            title="Simulate smartphone scan"
                                        >
                                            <RefreshCw size={12} className={isScanning ? "animate-spin text-[#D71920]" : ""} />
                                            <span>Simulate Scan</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Smartphone Mockup Framing: Illustrative Emergency Profile */}
                                <div className="bg-[#0C0E12] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl relative">
                                    
                                    {/* Mock Smartphone Status Header */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pb-2 border-b border-white/5">
                                        <span className="flex items-center gap-1.5 text-slate-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
                                            SECURE RESQR VIEW
                                        </span>
                                        <span className="text-[9px] uppercase tracking-widest text-[#D71920] font-bold">
                                            {scanScenario === 'emergency' ? 'Public Scan' : 'Clinical ER Gate'}
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
                                        <div className="px-3 py-1 rounded-lg bg-[#D71920]/10 border border-[#D71920]/20 text-[#D71920] font-black text-xs">
                                            {demoProfile.bloodGroup}
                                        </div>
                                    </div>

                                    {/* Designated Emergency Contact Card */}
                                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Emergency Contact</span>
                                            <span className="text-[9px] font-mono text-[#16845B]">Masked Privacy</span>
                                        </div>
                                        <p className="text-xs font-bold text-white">{demoProfile.primaryContact.name} ({demoProfile.primaryContact.relation})</p>
                                        <p className="text-xs font-mono text-[#D71920]">{demoProfile.primaryContact.maskedPhone}</p>
                                    </div>

                                    {/* Scenario-Dependent Alert & Information */}
                                    {scanScenario === 'emergency' ? (
                                        <div className="p-3 rounded-xl bg-[#D71920]/10 border border-[#D71920]/20 text-red-300 text-xs flex items-start gap-2">
                                            <AlertTriangle size={15} className="text-[#D71920] shrink-0 mt-0.5" />
                                            <div className="space-y-0.5">
                                                <span className="font-bold text-[11px] uppercase tracking-wider block">Critical Medical Alert</span>
                                                <span className="text-[11px] leading-tight text-slate-200 block">{demoProfile.allergies}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 text-xs space-y-1 animate-in fade-in">
                                            <div className="flex items-center justify-between font-bold text-[10px] uppercase text-slate-300">
                                                <span>Authorized Clinical Access</span>
                                                <span className="font-mono text-emerald-400">ER Verified</span>
                                            </div>
                                            <p className="text-[11px] text-slate-300"><strong>Allergies:</strong> {demoProfile.allergies}</p>
                                            <p className="text-[11px] text-slate-300"><strong>Chronic:</strong> {demoProfile.chronicConditions}</p>
                                            <p className="text-[11px] text-slate-300"><strong>Protocol:</strong> {demoProfile.emergencyNotes}</p>
                                        </div>
                                    )}

                                    {/* One Clear Primary Action */}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setSimulatedFeedback(`Simulation: Initiates call to ${demoProfile.primaryContact.name}. Real device dials via phone dialer.`)}
                                            className="w-full h-11 rounded-xl bg-[#D71920] hover:bg-[#A80F19] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#D71920]/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                        >
                                            <PhoneCall size={14} /> Call Emergency Contact
                                        </button>
                                    </div>

                                    {/* Simulated Demonstration Toast */}
                                    {simulatedFeedback && (
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center justify-between">
                                            <span>{simulatedFeedback}</span>
                                            <button onClick={() => setSimulatedFeedback(null)} className="text-emerald-400 hover:text-white font-bold text-[10px] ml-2">✕</button>
                                        </div>
                                    )}
                                </div>

                                {/* Physical Format Tags */}
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
                                    Simulated demonstration. Real individual medical records are never published publicly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 2. SECTION A: HOW IT WORKS (Spacious, Calm, Trustworthy Light Section)    */}
            {/* Exact 6-step visual sequence with clean connector lines and badges        */}
            {/* ========================================================================= */}
            <section id="how-it-works" className="py-24 bg-[#F7F8FA] text-[#181A1F] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="px-3.5 py-1.5 rounded-full border border-[#E3E6EB] bg-white text-[#626975] font-bold text-xs uppercase tracking-[0.2em] shadow-sm">
                            Public Safety Framework
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#181A1F]">
                            How RESQR Works
                        </h2>
                        <p className="text-[#626975] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            A clear visual sequence connecting citizen emergency identification to designated contacts and clinical triage when every second counts.
                        </p>
                    </div>

                    {/* 6-Step Visual Sequence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {howItWorksSteps.map((step) => (
                            <div 
                                key={step.num}
                                className="bg-white border border-[#E3E6EB] hover:border-[#D71920]/50 rounded-2xl p-7 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-mono font-black text-[#D71920] tracking-widest">{step.num}</span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-[#D71920] transition-colors" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tight text-[#181A1F]">{step.title}</h3>
                                    <p className="text-xs text-[#626975] leading-relaxed font-normal">{step.desc}</p>
                                </div>
                                <div className="pt-3 border-t border-[#E3E6EB]">
                                    <p className="text-[11px] text-slate-500 leading-normal">{step.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Factual Disclaimer Callout */}
                    <div className="mt-12 p-6 rounded-2xl bg-white border border-[#E3E6EB] max-w-3xl mx-auto text-center text-xs text-[#626975] leading-relaxed shadow-sm">
                        <p>
                            <strong className="text-[#181A1F]">Operational Notice:</strong> Scanning a physical RESQR identifier connects responders to your configured emergency screen. It does not automatically dispatch ambulances or broadcast GPS location without permission.
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
                            Carry your emergency identity in the physical format tailored for your daily mobility—from helmet stickers to wallet smart cards.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ecosystemProducts.map((p) => (
                            <div 
                                key={p.name}
                                className="bg-[#181A1F] border border-[#303238] hover:border-slate-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:-translate-y-1"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-[#D71920] tracking-widest">{p.format}</span>
                                        <h3 className="text-lg font-bold text-white uppercase mt-1">{p.name}</h3>
                                        <p className="text-base font-extrabold text-white mt-1 font-mono">{p.price}</p>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                                    <ul className="space-y-2 pt-2 border-t border-white/5">
                                        {p.features.map((f, i) => (
                                            <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2">
                                                <Check size={13} className="text-[#16845B] shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Link 
                                    to="/products"
                                    className="w-full h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-[#303238] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                >
                                    Explore Identifier Format
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 4. SECTION C: TAILORED SOLUTIONS (Spacious Light Section)                 */}
            {/* ========================================================================= */}
            <section className="py-24 bg-[#F7F8FA] text-[#181A1F] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="px-3.5 py-1.5 rounded-full border border-[#E3E6EB] bg-white text-[#626975] font-bold text-xs uppercase tracking-[0.2em] shadow-sm">
                            Tailored Workflows
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#181A1F]">
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
                                    className="bg-white border border-[#E3E6EB] hover:border-[#D71920]/50 rounded-2xl p-7 space-y-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-[#D71920]/10 border border-[#D71920]/20 text-[#D71920] flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <Icon size={22} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                            {sol.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black text-[#181A1F] uppercase group-hover:text-[#D71920] transition-colors">
                                        {sol.title}
                                    </h3>

                                    <p className="text-xs text-[#626975] leading-relaxed">
                                        {sol.desc}
                                    </p>

                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D71920] group-hover:translate-x-1 transition-transform">
                                        Explore Solution Details <ChevronRight size={14} />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 5. SECTION D: PRIVACY & SECURITY EXPERIENCE (Refined Light Section)       */}
            {/* High-trust white background, charcoal typography, crimson accents         */}
            {/* ========================================================================= */}
            <section className="py-24 bg-white text-[#181A1F] border-t border-[#E3E6EB] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
                        <span className="px-3.5 py-1.5 rounded-full border border-[#16845B]/30 bg-[#16845B]/10 text-[#16845B] font-bold text-xs uppercase tracking-[0.2em]">
                            DPDP Act 2023 & IT Act Alignment
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#181A1F]">
                            Privacy & Data Governance
                        </h2>
                        <p className="text-[#626975] text-base max-w-2xl mx-auto leading-relaxed">
                            Emergency assistance must never compromise personal privacy. Discover what information is collected, how access is controlled, and how your data principal rights are enforced.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {privacyPillars.map((pillar) => {
                            const Icon = pillar.icon;
                            return (
                                <div 
                                    key={pillar.title} 
                                    className="bg-[#F7F8FA] border border-[#E3E6EB] rounded-2xl p-6 space-y-3 hover:border-slate-300 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E3E6EB] text-[#D71920] flex items-center justify-center shadow-sm">
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-[#181A1F] uppercase">{pillar.title}</h3>
                                    <p className="text-xs text-[#626975] leading-relaxed">
                                        {pillar.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 text-center">
                        <Link 
                            to="/privacy-policy" 
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-[#E3E6EB] text-xs font-bold uppercase tracking-wider text-[#181A1F] shadow-sm transition-all"
                        >
                            Read Full Privacy Policy & Governance Details <ExternalLink size={14} className="text-[#D71920]" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 6. SECTION E: GOVERNMENT & INSTITUTIONAL PARTNERSHIPS                     */}
            {/* Headline: "Building a more connected emergency response ecosystem."       */}
            {/* ========================================================================= */}
            <section className="py-24 bg-[#101114] border-t border-[#303238] relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="bg-[#181A1F] border border-[#303238] rounded-3xl p-8 sm:p-14 relative overflow-hidden">
                        <div className="max-w-3xl space-y-6">
                            <span className="px-3.5 py-1.5 rounded-full border border-[#D71920]/30 bg-[#D71920]/10 text-[#D71920] font-bold text-xs uppercase tracking-[0.2em]">
                                Institutional Collaboration
                            </span>
                            
                            {/* Mandated Section Headline */}
                            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                                Building a more connected emergency response ecosystem.
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
                                    className="h-12 px-8 bg-[#D71920] hover:bg-[#A80F19] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#D71920]/25 transition-all flex items-center justify-center text-center"
                                >
                                    Discuss an Institutional Pilot
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
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 7. FREQUENTLY ASKED QUESTIONS                                             */}
            {/* ========================================================================= */}
            <section className="py-20 bg-[#14161B] border-t border-[#303238] relative z-10">
                <div className="max-w-4xl mx-auto px-6 sm:px-8">
                    <div className="text-center space-y-3 mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#D71920]">Transparency & Verification</span>
                        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Frequently Asked Questions</h2>
                        <p className="text-slate-400 text-sm">Clear, straightforward answers about how the RESQR platform functions.</p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, index) => {
                            const isOpen = activeFaq === index;
                            return (
                                <div 
                                    key={index}
                                    className="bg-[#181A1F] border border-[#303238] rounded-2xl overflow-hidden transition-all"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveFaq(isOpen ? null : index)}
                                        className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D71920]"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="text-sm font-bold text-white">{faq.q}</span>
                                        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#D71920]' : ''}`} />
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
            {/* Headline: "Make emergency information easier to reach."                   */}
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
                            className="w-full sm:w-auto h-12 px-8 bg-[#D71920] hover:bg-[#A80F19] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-xl shadow-[#D71920]/30 transition-all hover:-translate-y-0.5 flex items-center justify-center"
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
                            <span className="w-2 h-2 rounded-full bg-[#16845B] animate-pulse" />
                            {userCount} Verified Profiles Registered
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}