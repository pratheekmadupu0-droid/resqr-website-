import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, ChevronRight, Activity, Heart, CheckCircle2,
    QrCode, Smartphone, Users, Lock, Zap, User, ScanLine,
    Play, Navigation, Sparkles, ArrowRight, HeartHandshake,
    Droplet, AlertCircle, PhoneCall, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import PromotedAd from '../components/PromotedAd';
import FestiveBanner from '../components/FestiveBanner';
import { Modal } from '../components/ui/Modal';

const HERO_PARTICLES = [
    { top: '18%', left: '8%', delay: '0s', size: 4 },
    { top: '30%', left: '88%', delay: '1.4s', size: 5 },
    { top: '64%', left: '4%', delay: '0.8s', size: 3 },
    { top: '76%', left: '90%', delay: '2.1s', size: 5 },
    { top: '45%', left: '50%', delay: '1.8s', size: 3 },
    { top: '12%', left: '60%', delay: '2.6s', size: 4 },
    { top: '82%', left: '38%', delay: '0.4s', size: 4 },
    { top: '55%', left: '18%', delay: '3.1s', size: 3 },
];

export default function LandingPage() {
    const [products, setProducts] = useState([]);
    const [userCount, setUserCount] = useState('...');
    const [loading, setLoading] = useState(true);
    const [isDemoOpen, setIsDemoOpen] = useState(false);
    const [hasPaid, setHasPaid] = useState(false);

    const defaultProducts = [
        { title: "Digital QR", price: "99", features: ["Digital Dashboard", "Instant Access", "Lifetime Validity"], best: true }
    ];

    useEffect(() => {
        // Fetch Registered User Count (Profiles)
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

        // Fetch Products
        const prodRef = ref(db, 'config/products');
        const unsubProducts = onValue(prodRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setProducts(list);
            } else {
                setProducts(defaultProducts);
            }
            setLoading(false);
        });

        return () => {
            unsubUsers();
            unsubProducts();
        };
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
const primaryHref = hasPaid ? '/dashboard' : '/login';

    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.8, ease: "easeOut" }
    };

    const staggerContainer = {
        initial: {},
        whileInView: {},
        viewport: { once: true },
        transition: { staggerChildren: 0.1 }
    };

    return (
        <div className="relative overflow-hidden bg-[#05080F] text-slate-100 font-sans">

            {/* ============ HERO — CINEMATIC FIRST SCREEN ============ */}
            <section className="relative min-h-[100svh] flex flex-col items-center overflow-hidden pt-16 pb-16 lg:pt-24 lg:pb-24" aria-label="RESQR — your emergency information when it matters most">
                {/* Ambient cinematic lighting */}
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="absolute -top-[12%] -left-[8%] w-[55vw] h-[55vw] bg-primary/8 rounded-full blur-[120px]" />
                    <div className="absolute top-[18%] -right-[12%] w-[48vw] h-[48vw] bg-gold/6 rounded-full blur-[130px]" />
                    <div className="absolute bottom-[-6%] left-[28%] w-[60vw] h-[34vh] bg-secondary/12 rounded-full blur-[150px]" />
                    {HERO_PARTICLES.map((p, i) => (
                        <span
                            key={i}
                            className="festive-particle"
                            style={{ top: p.top, left: p.left, width: p.size, height: p.size, animationDelay: p.delay }}
                        />
                    ))}
                </div>

                <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center relative z-10">
                    {/* Left column */}
                    <div className="text-center lg:text-left">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/10 text-primary font-bold text-[11px] uppercase tracking-[0.18em]">
                            <Zap size={13} className="fill-primary" />
                            Emergency-First QR Identity
                        </span>

                        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05]">
                            Your emergency information.
                            <span className="block mt-1 text-gradient-red">Available when it matters most.</span>
                        </h1>

                        <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                            RESQR keeps your most important medical details, emergency contacts and safety
                            information in one secure profile — instantly reachable with a single QR scan.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:justify-center lg:justify-start">
                            <Link to={primaryHref} className="btn-app-primary" style={{ minWidth: 230 }}>
                                <HeartHandshake size={20} />
                                {hasPaid ? 'VIEW DASHBOARD' : 'CREATE YOUR RESQR'}
                            </Link>
                            <Link to="/login" className="btn-app-outline" style={{ minWidth: 150 }}>
                                LOGIN
                            </Link>
                        </div>

                        <a
                            href="#how-it-works"
                            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            How RESQR works
                            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </a>

                        {/* Social proof */}
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A101D] bg-slate-800 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/60?u=${i + 30}`} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left leading-tight">
                                <div className="flex text-gold" aria-label="Rated 5 out of 5">
                                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={13} fill="currentColor" className="fill-gold" />)}
                                </div>
                                <p className="text-xs text-slate-400 font-semibold">Trusted by <span className="text-white font-bold">{userCount}</span> active profiles</p>
                            </div>
                        </div>
                    </div>

{/* Right column — phone prototype of what a rescuer sees */}
                    <div className="relative flex justify-center animate-in slide-in-from-bottom-3 duration-1000">
                        <div className="relative w-[300px] sm:w-[330px] mx-auto">
                            {/* Glow behind phone */}
                            <div className="absolute inset-0 -z-10 scale-125 bg-gradient-to-br from-primary/10 via-transparent to-gold/10 blur-[60px] rounded-[60px]" />

                            {/* Phone frame */}
                            <div className="relative rounded-[44px] border-[4px] border-[#1a2333] bg-[#0A101D] shadow-2xl shadow-black/60 overflow-hidden">
                                <div className="h-5 bg-[#05080F] rounded-bl-[14px] rounded-br-[14px] mx-auto w-24" />
                                <div className="px-5 py-5 space-y-3 text-left">
                                    {/* App header */}
                                    <div className="flex items-center gap-2">
                                        <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR" className="h-6 w-auto object-contain" />
                                        <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified
                                        </span>
                                    </div>

                                    {/* Blood group — most critical */}
                                    <div className="rounded-2xl bg-[#E63946] text-white px-4 py-3 shadow-lg shadow-primary/20">
                                        <p className="text-[9px] uppercase tracking-[0.3em] opacity-80">Critical Vital · Blood Group</p>
                                        <p className="text-4xl font-black italic leading-none">B+</p>
                                    </div>

                                    {/* Identity card */}
                                    <div className="rounded-2xl bg-[#11192A] border border-white/10 px-4 py-3">
                                        <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Identity</p>
                                        <p className="text-base font-bold text-white">Aarav Sharma · 28 Yrs</p>
                                        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                                            <Droplet size={11} className="text-primary" /> Allergies: Peanuts
                                        </div>
                                    </div>

                                    {/* Emergency contact */}
                                    <div className="rounded-2xl bg-[#11192A] border border-emerald-500/20 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                                                <PhoneCall size={15} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Emergency Contact</p>
                                                <p className="text-xs font-bold text-white truncate">Meera Sharma · 98860***21</p>
                                            </div>
                                            <span className="text-[9px] font-black text-emerald-400 uppercase">Call</span>
                                        </div>
                                    </div>

                                    {/* QR being scanned */}
                                    <div className="relative rounded-2xl bg-white/5 border border-dashed border-white/15 overflow-hidden">
                                        <div className="flex items-center justify-center py-4">
                                            <QrCode size={72} className="text-white opacity-25" />
                                        </div>
                                        {/* Scanning line */}
                                        <div className="absolute left-3 right-3 h-[3px] bg-primary rounded-full shadow-[0_0_10px_rgba(230,57,70,0.9)]" style={{ animation: 'scan-sweep 2.4s ease-in-out infinite' }} />
                                        <p className="absolute bottom-1 inset-x-0 text-center text-[8px] uppercase tracking-[0.2em] text-slate-400">Accessing emergency profile…</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating alert bubble */}
                            <div className="absolute -top-4 -right-6 rounded-2xl bg-[#11192A] border border-primary/30 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-primary shadow-xl shadow-primary/20" style={{ animation: 'float-soft 4s ease-in-out infinite' }}>
                                <Shield size={12} className="inline mr-1" /> Rescue signal ready
                            </div>
                        </div>
                    </div>
                </div>
            </section>

{/* ============ VINAYAKA CHAVITHI CAMPAIGN ============ */}
            <div className="max-w-4xl mx-auto px-4 mt-14">
                <FestiveBanner mode="hero" />
            </div>

            {/* ============ TRUST — BECAUSE EMERGENCIES DON'T WAIT ============ */}
            <section className="py-16 sm:py-20 bg-[#060A13] border-t border-white/5 relative overflow-hidden" aria-label="Why RESQR matters">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em]">
                            <Activity size={12} className="mr-1.5" /> Why RESQR matters
                        </span>
                        <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                            Because <span className="text-gradient-red">emergencies</span> don't wait.
                        </h2>
                        <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
                            In a stressful moment, recalling critical details is hard. RESQR makes sure the
                            information that can save time — and lives — is a single scan away.
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <AlertCircle size={26} className="text-primary" />,
                                title: 'Hard to remember',
                                desc: 'Blood group, allergies, medications and contacts are difficult to recall accurately under pressure.',
                                tone: 'border-primary/25 bg-primary/8 text-primary',
                            },
                            {
                                icon: <Users size={26} className="text-gold" />,
                                title: 'Responders need answers',
                                desc: 'Family members and first responders need reliable information quickly to act with confidence.',
                                tone: 'border-gold/25 bg-gold/8 text-gold',
                            },
                            {
                                icon: <Shield size={26} className="text-emerald-500" />,
                                title: 'RESQR brings it together',
                                desc: 'One secure emergency profile with your vital information — ready whenever it is needed.',
                                tone: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-500',
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="app-card app-card-hover p-7 animate-in slide-in-from-bottom-3 duration-700"
                                style={{ animationDelay: `${i * 0.12}s` }}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.tone}`}>
                                    {item.icon}
                                </div>
                                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
{/* ============ HOW RESQR WORKS — 3 CINEMATIC STEPS ============ */}
            <section id="how-it-works" className="py-20 bg-[#05080F] border-t border-white/5 relative overflow-hidden" aria-label="How RESQR works">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="absolute top-1/4 left-0 w-[40vw] h-[40vh] bg-primary/5 rounded-full blur-[110px]" />
                    <div className="absolute bottom-1/4 right-0 w-[40vw] h-[40vh] bg-gold/5 rounded-full blur-[110px]" />
                </div>

                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                            <ScanLine size={12} className="mr-1.5" /> How it works
                        </span>
                        <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                            Protected in <span className="text-gradient-red">three simple steps.</span>
                        </h2>
                        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                            No complicated setup. Just the important details, organised and ready.
                        </p>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                step: '01', title: 'Create', icon: <User size={26} className="text-primary" />,
                                desc: 'Create your emergency profile — personal details, medical info and emergency contacts.',
                            },
                            {
                                step: '02', title: 'Generate', icon: <QrCode size={26} className="text-gold" />,
                                desc: 'Generate your personal RESQR emergency QR — digital, printable and always yours.',
                            },
                            {
                                step: '03', title: 'Scan', icon: <Smartphone size={26} className="text-emerald-500" />,
                                desc: 'In an emergency, anyone can scan the QR to reach your emergency profile instantly.',
                            },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                whileHover={{ y: -6 }}
                                className="app-card app-card-hover p-8 relative overflow-hidden group"
                            >
                                <span className="absolute top-4 right-5 text-5xl font-black text-white/5 group-hover:text-primary/25 transition-colors" aria-hidden="true">
                                    {item.step}
                                </span>
                                <div className="w-16 h-16 rounded-2xl bg-[#0A101D] border border-white/10 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <h3 className="mt-5 text-2xl font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Step {item.step}
                                    <ChevronRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="mt-10 text-center">
                        <Link to={primaryHref} className="btn-app-primary" style={{ minWidth: 260 }}>
                            <Sparkles size={18} /> CREATE YOUR RESQR
                        </Link>
                    </div>
                </div>
            </section>
{/* ============ BE PREPARED — BENEFITS ============ */}
            <section className="py-20 bg-[#060A13] border-t border-white/5 relative overflow-hidden" aria-label="Be prepared before you need it">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                        <div className="text-center lg:text-left">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                                <CheckCircle2 size={12} className="mr-1.5" /> Be ready
                            </span>
                            <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                                Be prepared <span className="text-gradient-red">before</span> you need it.
                            </h2>
                            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
                                A few minutes today can make all the difference in a critical moment.
                            </p>

                            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                {[
                                    'Emergency information in one place',
                                    'Easy access for anyone who scans',
                                    'Emergency contacts always listed',
                                    'Medical information organised',
                                    'QR-based instant access',
                                    'Simple profile management',
                                ].map((benefit) => (
                                    <li key={benefit} className="flex items-center gap-3 rounded-2xl bg-[#0C1322] border border-white/8 px-4 py-3">
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                        <span className="text-sm font-semibold text-slate-200 flex-1">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8">
                                <Link to={primaryHref} className="btn-app-primary" style={{ minWidth: 240 }}>
                                    <HeartHandshake size={18} /> CREATE MY RESQR
                                </Link>
                            </div>
                        </div>

                        {/* Benefits visual — checklist card that mirrors the app */}
                        <motion.div
                            variants={fadeInUp}
                            initial="initial"
                            whileInView="whileInView"
                            viewport={{ once: true }}
                            className="app-card p-8 relative overflow-hidden group mx-auto w-full max-w-md"
                        >
                            <div className="pointer-events-none absolute -right-10 -bottom-10 opacity-10" aria-hidden="true">
                                <Heart size={180} className="text-primary" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
                                    <Shield size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">Emergency Profile</p>
                                    <h3 className="text-lg font-bold">What a scan reveals</h3>
                                </div>
                            </div>
                            <div className="mt-6 space-y-2.5">
                                {[
                                    { label: 'Blood Group', value: 'B+', tone: 'text-primary' },
                                    { label: 'Allergies', value: 'Peanuts · Penicillin', tone: 'text-amber-500' },
                                    { label: 'Medical Conditions', value: 'Type-1 Diabetes', tone: 'text-sky-500' },
                                    { label: 'Emergency Contact', value: 'Meera Sharma · +91 98*** **21', tone: 'text-emerald-500' },
                                    { label: 'Insurance', value: 'Active Policy · Cashless', tone: 'text-gold' },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-2xl bg-[#0A101D] border border-white/8">
                                        <span className="text-xs font-semibold text-slate-400">{row.label}</span>
                                        <span className={`text-sm font-extrabold ${row.tone}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                <Lock size={12} className="text-emerald-500" /> Shown only to someone scanning your RESQR
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
{/* ============ FAMILY — PROTECT THE PEOPLE WHO MATTER MOST ============ */}
            <section className="py-20 relative overflow-hidden border-t border-white/5" aria-label="Protect the people who matter most">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="absolute -left-10 top-1/3 w-[50vw] h-[50vh] bg-primary/6 rounded-full blur-[110px]" />
                    <div className="absolute -right-10 bottom-1/4 w-[46vw] h-[46vh] bg-gold/6 rounded-full blur-[110px]" />
                </div>

                <div className="max-w-5xl mx-auto px-4 relative">
                    <div className="festive-banner relative overflow-hidden rounded-[28px] p-8 sm:p-12 text-center">
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <div className="flex items-center justify-end gap-4 absolute top-4 right-4 opacity-70">
                                <span className="diya" />
                                <Sparkles size={20} className="text-gold" />
                            </div>
                        </div>

                        <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold font-bold text-[10px] uppercase tracking-[0.2em]">
                            For families &amp; loved ones
                        </span>
                        <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                            Protect the people <span className="text-gradient-gold">who matter most.</span>
                        </h2>
                        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            When something goes wrong, families often struggle to recall medical history and
                            emergency numbers. With RESQR, the information your loved ones need is organised,
                            secure and reachable in seconds — so they can act with clarity, not confusion.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                            <Link to={primaryHref} className="btn-app-gold" style={{ minWidth: 240 }}>
                                <HeartHandshake size={18} /> Create Your Profile
                            </Link>
                            <Link to="/login" className="btn-app-outline" style={{ minWidth: 160 }}>
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
{/* ============ FINAL CTA ============ */}
            <section className="py-20 bg-[#05080F] border-t border-white/5 relative overflow-hidden text-center" aria-label="Create your RESQR emergency profile">
                <div className="max-w-3xl mx-auto px-4">
                    <img
                        src={`${import.meta.env.BASE_URL}resqr_logo.png`}
                        alt="RESQR"
                        className="h-12 w-auto mx-auto mb-8 object-contain"
                    />
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                        Ready when you are.
                        <span className="block text-gradient-red">Create your RESQR emergency profile today.</span>
                    </h2>
                    <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Join the growing community of proactive individuals who trust RESQR to bridge the gap
                        in emergency communication.
                    </p>
                    <div className="mt-9 flex flex-col sm:flex-row items-center gap-4">
                        <Link to={primaryHref} className="btn-app-primary" style={{ minWidth: 260 }}>
                            <HeartHandshake size={20} /> {hasPaid ? 'VIEW DASHBOARD' : 'CREATE MY RESQR'}
                        </Link>
                        <Link to="/login" className="btn-app-outline" style={{ minWidth: 170 }}>
                            Login
                        </Link>
                    </div>
                    <div className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#0C1322] border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 uppercase tracking-[0.15em]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {userCount} profiles active worldwide
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 mt-16">
                    <PromotedAd />
                </div>
            </section>

            {/* ============ DEMO MODAL (kept from original) ============ */}
            <Modal
                isOpen={isDemoOpen}
                onClose={() => setIsDemoOpen(false)}
                title="RESQR - HOW IT WORKS"
            >
                <div className="aspect-video w-full bg-slate-950 rounded-[30px] overflow-hidden relative group border border-white/10 shadow-2xl">
                    <img
                        src="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=1200&auto=format&fit=crop"
                        alt="Emergency Demo"
                        className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                        <div className="text-center text-white">
                            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl shadow-primary/50 cursor-pointer hover:scale-110 transition-transform">
                                <Play size={44} className="fill-white ml-2" />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter font-poppins">Watch the Demo Video</h3>
                            <p className="font-bold text-[10px] uppercase tracking-[0.4em] opacity-50 mt-2">Connecting to Emergency Stream...</p>
                        </div>
                    </div>
                </div>
                <div className="mt-10 space-y-6 text-slate-400 font-medium leading-relaxed">
                    <p className="text-lg">In this demo, you'll see how a first responder scans a RESQR tag on a patient's helmet and instantly accesses their medical history and emergency contacts.</p>
                    <div className="flex flex-wrap gap-3">
                        {['Real-time scan alerts', 'Medical diagnostics', 'GPS location relay', 'Encrypted Privacy'].map((f) => (
                            <span key={f} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                                <CheckCircle2 size={14} className="text-emerald-500" /> {f}
                            </span>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}