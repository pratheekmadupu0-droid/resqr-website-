import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, ChevronRight, Activity, Heart, CheckCircle2,
    QrCode, Smartphone, Users, Lock, Zap, User, ScanLine,
    Play, Navigation, Sparkles, ArrowRight, HeartHandshake,
    Droplet, AlertCircle, PhoneCall, Building2, Stethoscope, Siren, ShieldCheck, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import PromotedAd from '../components/PromotedAd';
import FestiveBanner from '../components/FestiveBanner';
import DevotionalBackground from '../components/DevotionalBackground';
import { Modal } from '../components/ui/Modal';

function TypewriterHeroHeadline() {
    const phrases = [
        { text: "ONE SCAN.", isGradient: false },
        { text: "THE RIGHT INFORMATION.", isGradient: false },
        { text: "THE RIGHT CONNECTION WHEN EVERY SECOND MATTERS.", isGradient: true },
    ];

    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [mode, setMode] = useState("TYPING"); // TYPING, PAUSED, DELETING

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex];

        if (mode === "TYPING") {
            if (charIndex < currentPhrase.text.length) {
                const timeout = setTimeout(() => {
                    setCharIndex((prev) => prev + 1);
                }, 45); // Typing speed per character
                return () => clearTimeout(timeout);
            } else {
                // Completed typing current sentence -> pause so user can read
                const pauseTimeout = setTimeout(() => {
                    setMode("DELETING");
                }, 2200);
                return () => clearTimeout(pauseTimeout);
            }
        }

        if (mode === "DELETING") {
            if (charIndex > 0) {
                const timeout = setTimeout(() => {
                    setCharIndex((prev) => prev - 1);
                }, 20); // Faster delete speed
                return () => clearTimeout(timeout);
            } else {
                // Finished deleting -> move to next sentence and start typing
                setPhraseIndex((prev) => (prev + 1) % phrases.length);
                setMode("TYPING");
            }
        }
    }, [charIndex, mode, phraseIndex, phrases]);

    const currentPhrase = phrases[phraseIndex];
    const displayedText = currentPhrase.text.slice(0, charIndex);

    return (
        <div className="min-h-[140px] sm:min-h-[180px] lg:min-h-[220px] flex items-center justify-center lg:justify-start">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight font-poppins leading-[1.08]">
                <span
                    className={
                        currentPhrase.isGradient
                            ? "bg-gradient-to-r from-[#E63946] via-[#FF6B6B] to-[#FFB703] bg-clip-text text-transparent"
                            : "text-white"
                    }
                >
                    {displayedText}
                </span>
                <span
                    className={`inline-block w-1.5 sm:w-2 h-8 sm:h-12 ml-2 align-middle animate-pulse ${
                        currentPhrase.isGradient ? "bg-amber-400" : "bg-red-500"
                    }`}
                />
            </h1>
        </div>
    );
}

export default function LandingPage() {
    const [userCount, setUserCount] = useState('...');
    const [isDemoOpen, setIsDemoOpen] = useState(false);
    const [hasPaid, setHasPaid] = useState(false);
    const [demoStep, setDemoStep] = useState(0); // 0: QR, 1: SCAN, 2: PROFILE, 3: ACTIONS

    useEffect(() => {
        const profilesRef = ref(db, 'profiles');
        const unsubUsers = onValue(profilesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const count = Object.keys(data).length;
                setUserCount(count.toLocaleString());
            } else {
                setUserCount('0');
            }
        });
        return () => unsubUsers();
    }, []);

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
                    console.error("Error checking payment status:", err);
                }
            } else {
                setHasPaid(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Auto-advance interactive demo steps
    useEffect(() => {
        const interval = setInterval(() => {
            setDemoStep((prev) => (prev + 1) % 4);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const primaryHref = hasPaid ? '/dashboard' : '/login';

    return (
        <div className="relative overflow-hidden bg-[#040812] text-slate-100 font-sans selection:bg-primary/30">
            {/* Background Ambient Glows */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px]" />
                <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[160px]" />
                <div className="absolute bottom-1/4 left-10 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px]" />
            </div>

            {/* ================= HERO SECTION ================= */}
            <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 z-10 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Left Column: Headline & Value Proposition */}
                    <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-extrabold text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-500/10 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            EMERGENCY HEALTH-TECH INFRASTRUCTURE
                        </div>

                        <TypewriterHeroHeadline />

                        <p className="text-slate-400 text-lg sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            RESQR is designed to help connect people with critical emergency information and contacts when every second matters.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                            <Link 
                                to={primaryHref} 
                                className="w-full sm:w-auto h-16 px-8 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                            >
                                <HeartHandshake size={18} /> GET YOUR RESQR
                            </Link>
                            <a 
                                href="#how-it-works" 
                                className="w-full sm:w-auto h-16 px-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black italic uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all"
                            >
                                HOW RESQR WORKS <ArrowRight size={16} />
                            </a>
                        </div>

                        {/* Social Trust Metrics */}
                        <div className="pt-6 border-t border-white/5 flex items-center justify-center lg:justify-start gap-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                                <Shield className="text-emerald-400" size={16} /> 256-Bit Encrypted Profile
                            </div>
                            <div className="hidden sm:block text-slate-700">•</div>
                            <div className="flex items-center gap-2">
                                <Zap className="text-amber-400" size={16} /> Instant 108 GPS Relay
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Demonstration HUD */}
                    <div className="lg:col-span-5 relative">
                        <div className="bg-[#0C1322] border border-white/10 rounded-[40px] p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-gold to-emerald-400" />
                            
                            {/* Step Switcher Cues */}
                            <div className="flex items-center justify-between gap-1 mb-6 bg-[#050812] p-1.5 rounded-2xl border border-white/5">
                                {[
                                    { step: 0, label: '01. QR Tag' },
                                    { step: 1, label: '02. Scan' },
                                    { step: 2, label: '03. Profile' },
                                    { step: 3, label: '04. Actions' }
                                ].map((item) => (
                                    <button
                                        key={item.step}
                                        type="button"
                                        onClick={() => setDemoStep(item.step)}
                                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${demoStep === item.step ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {/* Demo State 0: QR Code */}
                            {demoStep === 0 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                                    <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl border-4 border-slate-950">
                                        <QrCode size={160} className="text-slate-950" />
                                    </div>
                                    <p className="text-xl font-black italic uppercase text-white font-poppins">PRATHEEK MADUPU</p>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">PERSONAL RESQR EMERGENCY TAG</p>
                                </motion.div>
                            )}

                            {/* Demo State 1: Scanning Visual */}
                            {demoStep === 1 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                                        <ScanLine size={40} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black italic uppercase font-poppins text-white">Scanning RESQR Tag...</h4>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Satellite GPS Location Locked</p>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-xs mx-auto">
                                        <div className="h-full bg-emerald-400 w-3/4 animate-pulse rounded-full" />
                                    </div>
                                </motion.div>
                            )}

                            {/* Demo State 2: Responder Profile HUD */}
                            {demoStep === 2 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                                    <div className="bg-primary p-4 rounded-2xl flex items-center justify-between text-white">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">CRITICAL VITAL</p>
                                            <p className="text-3xl font-black italic font-poppins">B+ POSITIVE</p>
                                        </div>
                                        <Droplet size={32} />
                                    </div>

                                    <div className="bg-[#050812] p-4 rounded-2xl border border-white/5 space-y-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Medical History</p>
                                        <p className="text-xs font-bold text-white">Type-1 Diabetes • Penicillin Allergy</p>
                                    </div>

                                    <div className="bg-[#050812] p-4 rounded-2xl border border-white/5 space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Guardian Contact</p>
                                        <p className="text-xs font-bold text-emerald-400 font-mono">Meera Sharma (Spouse) • 98860***21</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Demo State 3: Emergency Actions */}
                            {demoStep === 3 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                                    <div className="h-12 bg-primary text-white rounded-xl font-black italic uppercase text-xs flex items-center justify-center gap-2 shadow-lg">
                                        <PhoneCall size={16} /> CONNECT CALL TO FAMILY
                                    </div>
                                    <div className="h-12 bg-emerald-600 text-white rounded-xl font-black italic uppercase text-xs flex items-center justify-center gap-2 shadow-lg">
                                        <Navigation size={16} /> SEND LOCATION TO FAMILY
                                    </div>
                                    <div className="h-12 bg-white text-black rounded-xl font-black italic uppercase text-xs flex items-center justify-center gap-2 shadow-lg">
                                        <Siren size={16} className="text-primary" /> CALL 108 AMBULANCE
                                    </div>
                                </motion.div>
                            )}

                            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                    LIVE INTERACTIVE RESQR RESPONSE SIMULATION
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Campaign Festive Banner */}
            <div className="max-w-6xl mx-auto px-6 mb-16">
                <FestiveBanner mode="hero" />
            </div>

            {/* ================= 6-STEP VISUAL JOURNEY ================= */}
            <section id="how-it-works" className="py-24 bg-[#080D1A] border-y border-white/5 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <span className="px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold font-black text-[10px] uppercase tracking-[0.25em]">
                            VISUAL EMERGENCY JOURNEY
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-poppins text-white">
                            How <span className="bg-gradient-to-r from-gold-light via-gold to-gold-dark bg-clip-text text-transparent">RESQR</span> Protects You
                        </h2>
                        <p className="text-slate-400 text-sm font-medium">
                            A seamless 6-step lifecycle ensuring your identity is reachable during any emergency.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { num: '01', title: 'REGISTER', desc: 'Set up your encrypted profile with emergency contacts, blood type, and medical details.', icon: User, color: 'text-blue-400' },
                            { num: '02', title: 'GET YOUR RESQR', desc: 'Receive your scannable digital emergency tag and custom vanity link instantly.', icon: QrCode, color: 'text-gold' },
                            { num: '03', title: 'KEEP IT WITH YOU', desc: 'Carry your digital tag in your phone wallet, stick it on your helmet, or wear physical gear.', icon: Smartphone, color: 'text-purple-400' },
                            { num: '04', title: 'SCAN IN AN EMERGENCY', desc: 'When every second counts, any bystander or paramedic scans the QR tag instantly.', icon: ScanLine, color: 'text-emerald-400' },
                            { num: '05', title: 'CONNECT THE RIGHT PEOPLE', desc: 'Satellites log location and dispatch immediate WhatsApp SOS alerts to your family.', icon: PhoneCall, color: 'text-amber-400' },
                            { num: '06', title: 'GET APPROPRIATE HELP', desc: 'First responders read verified vitals and locate the nearest trauma center without delay.', icon: Siren, color: 'text-primary' },
                        ].map((step) => (
                            <div key={step.num} className="bg-[#0F172A] border border-white/5 p-8 rounded-[32px] relative overflow-hidden group hover:border-primary/30 transition-all hover:-translate-y-1">
                                <span className="absolute top-4 right-6 text-5xl font-black text-white/5 group-hover:text-primary/10 transition-colors font-poppins">
                                    {step.num}
                                </span>
                                <step.icon className={`${step.color} mb-6`} size={32} />
                                <h3 className="text-xl font-black italic uppercase font-poppins text-white mb-3">
                                    {step.num}. {step.title}
                                </h3>
                                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= SOLUTIONS FOR EVERYONE ================= */}
            <section className="py-24 bg-[#040812] relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <span className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.25em]">
                            VERSATILE ECOSYSTEM
                        </span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter font-poppins text-white">
                            Solutions Designed For <span className="text-primary italic">Every Need</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-[#0C1322] border border-white/5 p-8 rounded-3xl space-y-4 hover:border-primary/40 transition-all">
                            <Users className="text-primary" size={32} />
                            <h3 className="text-xl font-black italic uppercase font-poppins text-white">Families & Citizens</h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">Protect parents, children, senior citizens, and pets with instant emergency profiles.</p>
                            <Link to="/solutions/families" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">Learn More <ChevronRight size={12} /></Link>
                        </div>

                        <div className="bg-[#0C1322] border border-white/5 p-8 rounded-3xl space-y-4 hover:border-emerald-400/40 transition-all">
                            <Stethoscope className="text-emerald-400" size={32} />
                            <h3 className="text-xl font-black italic uppercase font-poppins text-white">Doctors & Clinics</h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">Streamline emergency medical history access during trauma admissions.</p>
                            <Link to="/solutions/doctors" className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">Learn More <ChevronRight size={12} /></Link>
                        </div>

                        <div className="bg-[#0C1322] border border-white/5 p-8 rounded-3xl space-y-4 hover:border-blue-400/40 transition-all">
                            <Building2 className="text-blue-400" size={32} />
                            <h3 className="text-xl font-black italic uppercase font-poppins text-white">Hospitals</h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">Enterprise dashboard for ER trauma care and instant emergency verification.</p>
                            <Link to="/solutions/hospitals" className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">Learn More <ChevronRight size={12} /></Link>
                        </div>

                        <div className="bg-[#0C1322] border border-white/5 p-8 rounded-3xl space-y-4 hover:border-amber-400/40 transition-all">
                            <Siren className="text-amber-400" size={32} />
                            <h3 className="text-xl font-black italic uppercase font-poppins text-white">First Responders</h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">Dedicated paramedic scanner HUD to connect call family and relay coordinates.</p>
                            <Link to="/solutions/first-responders" className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">Learn More <ChevronRight size={12} /></Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FINAL CALL TO ACTION ================= */}
            <section className="py-24 bg-gradient-to-b from-[#080D1A] to-[#040812] border-t border-white/5 text-center relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
                    <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR" className="h-12 w-auto mx-auto object-contain" />
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter font-poppins text-white">
                        Ready when you are. <br />
                        <span className="text-primary italic">Create your RESQR identity today.</span>
                    </h2>
                    <p className="text-slate-400 text-base max-w-xl mx-auto font-medium">
                        Join thousands of proactive citizens who rely on RESQR to keep emergency information scannable and ready.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to={primaryHref} className="w-full sm:w-auto h-16 px-10 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-3">
                            <HeartHandshake size={18} /> GET YOUR RESQR
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto h-16 px-8 bg-white/5 text-white border border-white/10 rounded-2xl font-black italic uppercase tracking-widest text-xs flex items-center justify-center">
                            AUTHENTICATE LOGIN
                        </Link>
                    </div>

                    <div className="pt-8">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C1322] border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {userCount} Active Identity Nodes Created
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}