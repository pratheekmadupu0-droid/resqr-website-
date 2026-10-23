

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
import HeroScene3D from '../components/3d/HeroScene3D';
import Product3DViewer from '../components/3d/Product3DViewer';
import Step3DIcon from '../components/3d/Step3DIcon';

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
            {/* 1. CINEMATIC HERO SECTION ("RESQR — Emergency Intelligence, Designed Around People") */}
            {/* Balanced 52/48 composition, proper spacing below navbar, clean charcoal   */}
            {/* ========================================================================= */}
            <section className="relative pt-6 pb-16 lg:pt-10 lg:pb-24 overflow-hidden z-10">
                
                {/* Pure Near-Black to Charcoal Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#101114] via-[#121418] to-[#15171B] pointer-events-none" />

                {/* Controlled Crimson Ambient Light Behind Product Scene */}
                <div className="absolute top-1/3 right-[8%] w-[540px] h-[540px] bg-[#D71920]/[0.10] rounded-full blur-[130px] pointer-events-none" />

                <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                        
                        {/* LEFT COLUMN: Editorial Typography & Intentional Actions (~52% balance) */}
                        <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
                            
                            {/* Understated Eyebrow Label (No excessive spacing) */}
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-200 text-[11px] font-semibold tracking-[0.08em] uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse" />
                                <span>Emergency Identification Platform</span>
                            </div>

                            {/* Mandated Exact Headline with Authentic Editorial Typography */}
                            <h1 className="font-heading text-4xl sm:text-6xl lg:text-[68px] xl:text-[76px] font-extrabold tracking-[-0.035em] text-white leading-[1.04]">
                                Emergency information. <br />
                                <span className="text-[#D71920] drop-shadow-[0_4px_24px_rgba(215,25,32,0.30)]">Within reach.</span>
                            </h1>

                            {/* Mandated Exact Supporting Copy */}
                            <p className="text-slate-300/90 text-base sm:text-lg lg:text-[19px] font-normal leading-[1.65] tracking-[-0.012em] max-w-xl">
                                Connect a registered emergency identifier to designated contacts and permitted emergency information, helping make essential details easier to reach when assistance is needed.
                            </p>

                            {/* Primary, Secondary, and Institutional Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                                <Link 
                                    to={primaryHref} 
                                    className="h-12 px-7 bg-[#D71920] hover:bg-[#A80F19] text-white rounded-xl font-bold uppercase tracking-[0.06em] text-[12px] shadow-lg shadow-[#D71920]/25 flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D71920]"
                                >
                                    <HeartHandshake size={16} /> Create Your RESQR
                                </Link>

                                <a 
                                    href="#how-it-works" 
                                    className="h-12 px-6 bg-transparent hover:bg-white/[0.05] text-white border border-[#303238] hover:border-slate-400 rounded-xl font-bold uppercase tracking-[0.06em] text-[12px] flex items-center justify-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                    Explore How It Works <ArrowRight size={15} />
                                </a>

                                <Link 
                                    to="/government-partnerships" 
                                    className="h-12 px-4 text-slate-400 hover:text-white rounded-xl font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Building2 size={15} className="text-[#D71920]" /> Institutional Partnerships
                                </Link>
                            </div>

                            {/* Subtle Supporting Privacy Statement */}
                            <div className="pt-5 border-t border-[#303238] flex items-center gap-3 text-xs text-slate-400">
                                <ShieldCheck size={16} className="text-[#16845B] shrink-0" />
                                <span>Permitted emergency access • Zero app required for first responders</span>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: The Interactive 3D Product Stage */}
                        <div className="lg:col-span-5 relative">
                            <HeroScene3D 
                                scanScenario={scanScenario}
                                onScenarioChange={setScanScenario}
                            />
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

                    {/* 6-Step Visual Sequence Grid with 3D Micro-Illustrations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {howItWorksSteps.map((step) => (
                            <div 
                                key={step.num}
                                className="bg-white border border-[#E3E6EB] hover:border-[#D71920]/50 rounded-2xl p-7 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3.5">
                                            <span className="text-base font-mono font-black text-[#D71920] tracking-widest">{step.num}</span>
                                            <Step3DIcon stepNumber={parseInt(step.num, 10)} />
                                        </div>
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
                                className="bg-[#181A1F] border border-[#303238] hover:border-slate-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all hover:-translate-y-1 group"
                            >
                                <div className="space-y-4">
                                    {/* Interactive 3D Product Mesh Viewer */}
                                    <div className="w-full h-44 rounded-xl bg-[#121418] border border-white/5 relative flex items-center justify-center overflow-hidden">
                                        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase font-mono tracking-wider text-slate-400">
                                            3D MODEL
                                        </div>
                                        <Product3DViewer productType={p.name} className="w-full h-full" />
                                    </div>

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