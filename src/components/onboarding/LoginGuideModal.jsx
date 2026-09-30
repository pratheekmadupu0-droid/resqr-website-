import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ArrowRight, ArrowLeft, Shield, ShieldCheck, 
    Smartphone, Camera, HeartPulse, User,
    CheckCircle2, Sparkles, CreditCard, Lock,
    FileText, QrCode, ExternalLink, ChevronRight, Check
} from 'lucide-react';
import ResqrLogo from '../branding/ResqrLogo';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY = 'resqr_login_guide_completed';

// Google Icon Component
function GoogleIcon() {
    return (
        <svg className="w-5 h-5 mr-3 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

/**
 * LoginGuideModal
 * 
 * Interactive 4-step onboarding guide explaining how first-time visitors
 * log in with Google and complete the 5-step identity workflow:
 * 1. Open RESQR Login
 * 2. Authenticate with Google Account
 * 3. 5-Step Identity Setup (Face -> Personal -> Medical -> Insurance -> Payment)
 * 4. Get Your Emergency QR Tag & Physical Stickers
 */
export default function LoginGuideModal() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [activeSetupTab, setActiveSetupTab] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if current route is an emergency scan or raw terminal view
    const isScanRoute = location.pathname.startsWith('/e/') || 
                        location.pathname.startsWith('/qr/') || 
                        location.pathname.startsWith('/u/') || 
                        location.pathname.startsWith('/p/');

    // 1. Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setIsOpen(false); // Close automatically if logged in
            } else {
                setIsAuthenticated(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Check first-time visitor status
    useEffect(() => {
        if (isAuthenticated || isScanRoute) return;

        const hasCompleted = localStorage.getItem(STORAGE_KEY);
        if (!hasCompleted) {
            // Give 1.2s delay for seamless page hydration
            const timer = setTimeout(() => {
                if (!auth.currentUser && !localStorage.getItem(STORAGE_KEY)) {
                    setIsOpen(true);
                }
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isScanRoute]);

    // 3. Global listener for manual reopen trigger ("Login Guide" in footer/help)
    useEffect(() => {
        const handleManualOpen = () => {
            setStep(1);
            setIsOpen(true);
        };

        window.addEventListener('resqr-open-login-guide', handleManualOpen);
        return () => window.removeEventListener('resqr-open-login-guide', handleManualOpen);
    }, []);

    // 4. Keyboard navigation (Esc to close, Left/Right for steps)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleDismiss();
            } else if (e.key === 'ArrowRight' && step < 4) {
                setStep(s => s + 1);
            } else if (e.key === 'ArrowLeft' && step > 1) {
                setStep(s => s - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, step]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    const handleDismiss = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsOpen(false);
    }, []);

    const handleLoginRedirect = () => {
        handleDismiss();
        navigate('/login');
    };

    if (!isOpen) return null;

    const setupSteps = [
        {
            icon: Camera,
            title: '1. Face Registration',
            desc: '3-angle neural biometric face enrollment for hospital verification.',
            badge: 'Biometrics'
        },
        {
            icon: User,
            title: '2. Personal Details',
            desc: 'Full name, phone, SOS next-of-kin contacts & personalized username.',
            badge: 'Demographics'
        },
        {
            icon: HeartPulse,
            title: '3. Medical Profile',
            desc: 'Blood group, critical allergies, chronic conditions & medications.',
            badge: 'Health Dossier'
        },
        {
            icon: ShieldCheck,
            title: '4. Insurance Details',
            desc: 'Health insurance policy number & cashless coverage network.',
            badge: 'Insurance'
        },
        {
            icon: CreditCard,
            title: '5. Payment & Activation',
            desc: 'One-time ₹149 activation plan. 2 reflective stickers dispatched.',
            badge: 'Delivery'
        }
    ];

    return (
        <AnimatePresence>
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto selection:bg-primary/30 font-manrope"
                role="dialog"
                aria-modal="true"
                aria-labelledby="guide-title"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                    className="w-full max-w-xl bg-[#080D1A] border border-white/10 rounded-[36px] shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col my-auto"
                >
                    {/* Top ambient glow */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-2xl" />

                    {/* Header Bar */}
                    <div className="p-6 sm:p-7 pb-4 flex items-center justify-between border-b border-white/5 relative z-10">
                        <div className="flex items-center gap-3">
                            <ResqrLogo className="h-7 sm:h-8 w-auto object-contain" />
                            <span className="hidden sm:inline-block h-4 w-px bg-white/15" />
                            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                First-Time Visitor Guide
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                                {step}/4
                            </span>
                            <button
                                onClick={handleDismiss}
                                aria-label="Close guide"
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Step Content Area */}
                    <div className="p-6 sm:p-8 space-y-6 relative z-10 flex-1 overflow-y-auto max-h-[60vh]">
                        {/* Step Indicator Progress Dots */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4].map((i) => (
                                    <button
                                        key={i}
                                        onClick={() => setStep(i)}
                                        aria-label={`Go to step ${i}`}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            step === i 
                                                ? 'w-8 bg-primary shadow-[0_0_12px_rgba(230,57,70,0.6)]' 
                                                : step > i 
                                                    ? 'w-2.5 bg-primary/40' 
                                                    : 'w-2 bg-white/15'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary italic">
                                {step === 1 && 'Step 1: Open Login'}
                                {step === 2 && 'Step 2: Google Sign-In'}
                                {step === 3 && 'Step 3: 5-Step Identity Setup'}
                                {step === 4 && 'Step 4: Get Emergency QR'}
                            </span>
                        </div>

                        {/* Animated Step Panes */}
                        <AnimatePresence mode="wait">
                            {/* STEP 1: OPEN RESQR LOGIN */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Visual Representation of RESQR Navbar */}
                                    <div className="bg-[#050811] rounded-2xl p-4 border border-white/10 space-y-3 relative overflow-hidden">
                                        <div className="flex items-center justify-between text-[11px] pb-3 border-b border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                RESQR Header Preview
                                            </span>
                                            <span className="text-[9px] font-mono text-emerald-400">resqr.co.in</span>
                                        </div>

                                        {/* Mock Navbar */}
                                        <div className="flex items-center justify-between bg-[#0C1322] p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <ResqrLogo className="h-5 w-auto object-contain" />
                                            </div>

                                            <div className="hidden sm:flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                <span>Home</span>
                                                <span>How It Works</span>
                                                <span>About</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Pulsing Highlighted Login Button */}
                                                <div className="relative">
                                                    <span className="absolute -inset-1 rounded-xl bg-primary/40 animate-ping opacity-75 pointer-events-none" />
                                                    <div className="relative px-3.5 py-1.5 rounded-xl bg-primary/20 border-2 border-primary text-white text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(230,57,70,0.5)] flex items-center gap-1.5">
                                                        <User size={11} /> LOGIN
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider hidden sm:block opacity-60">
                                                    CREATE RESQR
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[10px] text-center text-primary font-bold uppercase tracking-wider animate-pulse pt-1">
                                            👆 Tap the Login button located in the top navigation bar
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 id="guide-title" className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                            Open RESQR Login
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                            Tap <strong className="text-white">Login</strong> at the top of the RESQR website to access your RESQR account.
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            On mobile, you can easily tap the Login or Create RESQR action from the top header or bottom navigation.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: GOOGLE ACCOUNT AUTHENTICATION */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Visual Mock of Google Login */}
                                    <div className="bg-[#050811] rounded-2xl p-6 border border-white/10 space-y-4 text-center">
                                        <div className="flex items-center justify-between pb-3 border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Secure Authentication</span>
                                            <span className="text-emerald-400 flex items-center gap-1">
                                                <ShieldCheck size={12} /> Google OAuth 2.0
                                            </span>
                                        </div>

                                        <div className="py-2">
                                            {/* Google Login Button Mock */}
                                            <div className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black italic uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 border border-slate-200 cursor-pointer">
                                                <GoogleIcon /> Continue with Google
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-left">
                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase">
                                                    <Check size={12} /> Instant 1-Click
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">No manual passwords to remember</p>
                                            </div>
                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase">
                                                    <Shield size={12} /> Enterprise Auth
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">Secured with Firebase Google OAuth</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                            Sign In with Google
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                            Authenticate seamlessly with your Google account. One tap securely opens your emergency identity vault.
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Existing members are instantly restored to their dashboard, while new users proceed to the quick 5-step emergency setup.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: 5-STEP EMERGENCY IDENTITY SETUP */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Visual List of 5 Setup Steps */}
                                    <div className="bg-[#050811] rounded-2xl p-4 border border-white/10 space-y-2.5">
                                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                5-Step Identity Workflow
                                            </span>
                                            <span className="text-[9px] font-mono text-primary">~3 MINS TOTAL</span>
                                        </div>

                                        <div className="space-y-2">
                                            {setupSteps.map((s, idx) => {
                                                const Icon = s.icon;
                                                const isSelected = activeSetupTab === idx;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setActiveSetupTab(idx)}
                                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                            isSelected 
                                                                ? 'bg-[#11192A] border-primary/40 shadow-[0_0_15px_rgba(230,57,70,0.15)]' 
                                                                : 'bg-[#0C1322] border-white/5 hover:border-white/15'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                                isSelected ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'
                                                            }`}>
                                                                <Icon size={14} />
                                                            </div>
                                                            <div className="min-w-0 text-left">
                                                                <p className={`text-xs font-black uppercase tracking-tight truncate ${
                                                                    isSelected ? 'text-white' : 'text-slate-300'
                                                                }`}>
                                                                    {s.title}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 font-medium truncate">
                                                                    {s.desc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded-md shrink-0">
                                                            {s.badge}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                            Complete 5-Step Setup
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                            New users complete 5 quick steps: <strong className="text-white">Face Registration</strong>, <strong className="text-white">Personal Details</strong>, <strong className="text-white">Medical Profile</strong>, <strong className="text-white">Insurance</strong>, and <strong className="text-white">Payment</strong>.
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Each step automatically saves your draft in real-time, ensuring you never lose your emergency configuration.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: GET YOUR RESQR QR CODE & STICKERS */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Visual Mock of Final QR Card & Deliverables */}
                                    <div className="bg-[#050811] rounded-2xl p-5 border border-white/10 space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                                    Official Emergency QR Activated
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                LIVE PROTECTION
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Digital QR Preview Tile */}
                                            <div className="p-3.5 bg-[#0C1322] rounded-2xl border border-white/5 space-y-2 text-center">
                                                <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center mx-auto">
                                                    <QrCode size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-white tracking-wider">Digital QR Card</p>
                                                    <p className="text-[9px] text-slate-400 font-medium">Instant scannable vanity link & tag downloads</p>
                                                </div>
                                            </div>

                                            {/* Physical Deliverable Tile */}
                                            <div className="p-3.5 bg-[#0C1322] rounded-2xl border border-white/5 space-y-2 text-center">
                                                <div className="w-10 h-10 bg-gold/10 border border-gold/20 text-gold rounded-xl flex items-center justify-center mx-auto">
                                                    <Sparkles size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-white tracking-wider">Physical Stickers</p>
                                                    <p className="text-[9px] text-slate-400 font-medium">2 reflective smart stickers dispatched to your door</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5 text-center">
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                Permanent Secure Token: <span className="text-emerald-400 font-mono">resqr.co.in/yourname</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                            Get Your RESQR Tag
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                            Once payment is verified, your scannable Emergency QR badge is live and your reflective physical stickers are dispatched!
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            First responders and bystanders can now scan your QR code or verify your face to access your vital medical data in seconds.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 sm:p-7 pt-4 bg-[#050811] border-t border-white/5 relative z-10 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(s => s - 1)}
                                    className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black italic uppercase text-xs tracking-wider flex items-center gap-2 transition-all"
                                >
                                    <ArrowLeft size={14} /> BACK
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors px-2 py-2"
                                >
                                    SKIP GUIDE
                                </button>
                            )}

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(s => s + 1)}
                                    className="px-7 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black italic uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-98 transition-all"
                                >
                                    NEXT <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleLoginRedirect}
                                    className="flex-1 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black italic uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-98 transition-all"
                                >
                                    <Lock size={14} /> LOGIN WITH GOOGLE
                                </button>
                            )}
                        </div>

                        {step === 4 && (
                            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider"
                                >
                                    Skip & Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDismiss();
                                        navigate('/login');
                                    }}
                                    className="text-primary hover:underline font-bold"
                                >
                                    Ready? Start Your Setup →
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
