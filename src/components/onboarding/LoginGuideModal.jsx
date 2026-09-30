import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ArrowRight, ArrowLeft, Shield, ShieldCheck, 
    Smartphone, Mail, Lock, QrCode, HeartPulse, User,
    CheckCircle2, Sparkles, AlertCircle, KeyRound, ExternalLink
} from 'lucide-react';
import ResqrLogo from '../branding/ResqrLogo';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY = 'resqr_login_guide_completed';

/**
 * LoginGuideModal
 * 
 * Interactive 4-step onboarding guide explaining how first-time visitors
 * can log in and access their RESQR emergency account.
 * 
 * Automatically appears for first-time unauthenticated visitors.
 * Can be manually reopened anytime via custom event 'resqr-open-login-guide'.
 */
export default function LoginGuideModal() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
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
                // Double check auth before opening
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
                                {step === 2 && 'Step 2: Enter Details'}
                                {step === 3 && 'Step 3: Identity Verification'}
                                {step === 4 && 'Step 4: Access Vault'}
                            </span>
                        </div>

                        {/* Animated Step Panes */}
                        <AnimatePresence mode="wait">
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
                                            If you are on mobile, you will find the Login action easily accessible in the top header and bottom menu.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Visual Mock of Details Input */}
                                    <div className="bg-[#050811] rounded-2xl p-5 border border-white/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Choose Portal & Enter ID
                                            </span>
                                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                Citizen / Provider
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5 text-slate-300 text-xs font-semibold">
                                                    <Smartphone size={14} className="text-primary" />
                                                    <span>+91 98765 43210</span>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Phone / OTP</span>
                                            </div>

                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/5 flex items-center justify-between text-slate-500 text-xs">
                                                <div className="flex items-center gap-2.5 font-semibold">
                                                    <Mail size={14} />
                                                    <span>user@resqr.co.in</span>
                                                </div>
                                                <span className="text-[9px] font-bold uppercase tracking-wider">Email</span>
                                            </div>
                                        </div>

                                        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2 text-[10px] font-bold text-slate-300">
                                            <Shield size={13} className="text-primary shrink-0" />
                                            <span>Passwordless verification keeps your emergency health keys secure.</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                            Enter Your Details
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                            Use the phone number or email associated with your RESQR account.
                                        </p>
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-400 font-medium space-y-1">
                                            <p className="text-slate-200 font-bold">• If you already have a RESQR account: <span className="text-emerald-400">Login</span></p>
                                            <p className="text-slate-200 font-bold">• If you are new to RESQR: <span className="text-primary">Choose Register / Get Started</span></p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Visual Mock of OTP Verification Screen */}
                                    <div className="bg-[#050811] rounded-2xl p-5 border border-white/10 space-y-4 text-center">
                                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto">
                                            <KeyRound size={22} />
                                        </div>

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider text-white">Enter 6-Digit Code</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Secure OTP sent to your registered device</p>
                                        </div>

                                        {/* Mock OTP input boxes */}
                                        <div className="flex justify-center gap-2">
                                            {['•', '•', '•', '', '', ''].map((val, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`w-9 h-11 rounded-xl border flex items-center justify-center text-sm font-mono font-bold ${
                                                        idx === 3 
                                                            ? 'border-primary bg-primary/10 text-primary animate-pulse' 
                                                            : val 
                                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' 
                                                                : 'border-white/10 bg-[#0C1322] text-slate-600'
                                                    }`}
                                                >
                                                    {val || (idx === 3 ? '|' : '')}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] font-bold text-amber-300 flex items-center justify-center gap-1.5">
                                            <AlertCircle size={13} className="shrink-0" />
                                            <span>Never share your verification code or OTP with anyone.</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                            Verify Your Identity
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                            Complete the secure verification step to continue.
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            RESQR uses end-to-end encrypted authentication protocols to protect your medical dossiers from unauthorized access.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Visual Mock of Dashboard Features */}
                                    <div className="bg-[#050811] rounded-2xl p-5 border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                                    RESQR Vault Hub
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-500">NODE ACTIVE</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase">
                                                    <QrCode size={12} /> Scannable QR
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">Instant tag preview & downloads</p>
                                            </div>

                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase">
                                                    <HeartPulse size={12} /> Medical Data
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">Blood group, allergies, conditions</p>
                                            </div>

                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase">
                                                    <ShieldCheck size={12} /> SOS Contacts
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">Emergency next-of-kin relay</p>
                                            </div>

                                            <div className="p-3 bg-[#0C1322] rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase">
                                                    <Sparkles size={12} /> Stickers & Cards
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">Physical reflective smart tags</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                            Access Your RESQR
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                                            You're ready to access your RESQR dashboard and manage your account.
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Complete your RESQR registration and profile details to activate your lifetime emergency identity.
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
                                    <Lock size={14} /> LOGIN TO RESQR
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
                                    New to RESQR? Create an account →
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
