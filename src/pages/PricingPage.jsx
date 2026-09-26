import React, { useState, useEffect } from 'react';
import { 
    Check, Shield, Sparkles, QrCode, ArrowRight, RefreshCw, 
    CreditCard, HeartPulse, CheckCircle2, ShieldCheck, ChevronRight, HelpCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import RenewalModal from '../components/subscription/RenewalModal';
import { RENEWAL_PLANS } from '../lib/subscriptionConfig';

export default function PricingPage() {
    const navigate = useNavigate();
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('renewal_12m');
    const [userProfile, setUserProfile] = useState(null);
    const [userQrId, setUserQrId] = useState('');
    const [userExpiry, setUserExpiry] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const slug = localStorage.getItem('resqr_active_slug');
                let targetId = slug || user.uid;
                setUserQrId(targetId);

                // Fetch subscription expiry
                const subSnap = await get(ref(db, `subscriptions/${targetId}`));
                if (subSnap.exists()) {
                    setUserExpiry(subSnap.val().expiresAt);
                }

                const profSnap = await get(ref(db, `users/${user.uid}`));
                if (profSnap.exists()) {
                    setUserProfile(profSnap.val());
                }
            } catch (err) {
                console.warn("Could not load user subscription details:", err);
            }
        };

        fetchUserData();
    }, []);

    const handleRegisterClick = () => {
        if (auth.currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleSelectRenewalPlan = (planId) => {
        setSelectedPlanId(planId);
        if (auth.currentUser) {
            setIsRenewalModalOpen(true);
        } else {
            navigate('/login');
        }
    };

    const steps = [
        {
            num: "1",
            title: "Register on Website",
            desc: "Sign up, complete 3-angle face enrollment, enter emergency & medical details.",
            highlight: "₹149 one-time"
        },
        {
            num: "2",
            title: "Use for 3 Months",
            desc: "Receive 2 physical reflective QR stickers. Your QR code is fully active for 3 months.",
            highlight: "3 months included"
        },
        {
            num: "3",
            title: "Choose a Plan",
            desc: "Select 3, 6, 12, 18, or 24 months based on your family's safety requirements.",
            highlight: "Flexible durations"
        },
        {
            num: "4",
            title: "Make Payment",
            desc: "Pay securely via Razorpay with UPI, Debit/Credit Card, or Netbanking.",
            highlight: "Instant activation"
        },
        {
            num: "5",
            title: "Stay Active",
            desc: "The exact same QR sticker continues working seamlessly without reprinting.",
            highlight: "Same QR continues"
        }
    ];

    const faqs = [
        {
            q: "Does my QR code change when I renew?",
            a: "No! Your physical stickers and digital QR token never change. When you renew, validity is extended on the exact same QR code in real-time."
        },
        {
            q: "What happens if I renew before my current plan expires?",
            a: "Zero lost days! If you renew while your QR is still active, the new duration is seamlessly added to your existing expiry date."
        },
        {
            q: "What is included in the ₹149 initial registration?",
            a: "The ₹149 registration includes account creation, 1:1 facial biometric enrollment, full encrypted medical vault, 2 physical reflective emergency stickers delivered to your door, and 3 months of active RESQR emergency response validity."
        },
        {
            q: "Can I renew if my QR has already expired?",
            a: "Yes. If your QR has expired, renewing it immediately reactivates emergency protection starting from the date of payment."
        }
    ];

    return (
        <div className="min-h-screen bg-[#040812] page-bg-ganesha text-white font-manrope selection:bg-primary/30">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.08),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">
                        OFFICIAL RESQR PRICING & RENEWALS
                    </Badge>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-tight italic">
                        LIFESAVING PROTECTION <br />
                        <span className="text-primary italic-display">THAT STAYS WITH YOU.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                        Start with complete registration and 2 physical QR stickers for 3 months, then renew seamlessly on the exact same QR code.
                    </p>
                </div>
            </section>

            {/* 1. Initial Registration Section — ₹149 */}
            <section className="py-16 px-4 max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Step 1 — Initial Setup</span>
                    <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white font-poppins mt-1">
                        RESQR Initial Registration
                    </h2>
                </div>

                <div className="bg-gradient-to-br from-slate-900/90 via-slate-950 to-[#0c1427] border-2 border-primary/40 rounded-3xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(230,57,70,0.15)] relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-4 max-w-xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge className="bg-primary text-white font-black italic text-[10px] tracking-widest uppercase">
                                    PRIMARY REGISTRATION
                                </Badge>
                                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                    ● 3 Months Validity Included
                                </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-white font-poppins">
                                ₹149 — RESQR Registration + 2 QR Stickers
                            </h3>

                            <p className="text-slate-300 text-sm leading-relaxed">
                                Complete personal, medical, and insurance profile setup, 3-angle facial biometric enrollment, 2 weather-resistant physical reflective stickers shipped to you, and 3 full months of emergency QR service.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>RESQR Account Registration</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>Face Registration / Enrollment</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>Personal & Emergency Contacts</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>Medical & Insurance Vault</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>2 Physical Reflective QR Stickers</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span>3 Months RESQR Service Validity</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-auto flex flex-col items-center lg:items-end justify-center p-6 bg-slate-950/70 border border-white/5 rounded-2xl shrink-0 space-y-4">
                            <div className="text-center lg:text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Investment</span>
                                <div className="text-5xl font-black italic text-white font-poppins">₹149</div>
                                <span className="text-[11px] text-slate-400">Includes taxes & 2 stickers delivery</span>
                            </div>

                            <Button 
                                onClick={handleRegisterClick}
                                className="w-full sm:w-auto px-8 py-5 bg-primary hover:bg-red-700 text-white rounded-2xl font-black italic uppercase tracking-wider text-xs shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform"
                            >
                                Register Now — ₹149 <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Visual / Process Flow — 5 Steps */}
            <section className="py-16 px-4 max-w-7xl mx-auto border-t border-white/5">
                <div className="text-center mb-14">
                    <Badge className="bg-white/5 text-slate-300 border-white/10 mb-4 px-3 py-1 font-black tracking-widest text-[10px] uppercase italic">
                        SIMPLE & SEAMLESS LIFECYCLE
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white font-poppins">
                        How RESQR Works
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm font-medium mt-2 max-w-xl mx-auto">
                        A continuous safety network designed to keep your physical QR active forever.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {steps.map((st, i) => (
                        <Card key={i} className="p-6 bg-slate-950/60 border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between relative group">
                            <div>
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black italic font-poppins flex items-center justify-center text-lg mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                                    {st.num}
                                </div>
                                <h3 className="text-base font-black italic uppercase text-white font-poppins mb-2">
                                    {st.title}
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-medium mb-4">
                                    {st.desc}
                                </p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-primary/90 bg-primary/10 px-2.5 py-1 rounded-full self-start">
                                {st.highlight}
                            </span>
                        </Card>
                    ))}
                </div>
            </section>

            {/* 3. Upgrade / Renewal Plans Section */}
            <section className="py-16 px-4 max-w-7xl mx-auto border-t border-white/5">
                <div className="text-center mb-14">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-3 py-1 font-black tracking-widest text-[10px] uppercase italic">
                        EXTEND YOUR PROTECTION
                    </Badge>
                    <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tight text-white font-poppins">
                        Upgrade / Renewal Plans
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm font-medium mt-2 max-w-2xl mx-auto">
                        Continuous protection. The exact same QR token remains active. No reprints needed.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {RENEWAL_PLANS.map((plan) => {
                        const isPopular = plan.isPopular;
                        return (
                            <div 
                                key={plan.id}
                                className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                                    isPopular 
                                        ? 'bg-gradient-to-b from-primary/20 via-slate-900 to-slate-950 border-2 border-primary shadow-[0_15px_40px_rgba(230,57,70,0.25)] scale-[1.03] -translate-y-1' 
                                        : 'bg-slate-950/70 border border-white/5 hover:border-white/20'
                                }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-white font-black italic text-[9px] tracking-widest uppercase px-3 py-1 shadow-lg">
                                            MOST POPULAR
                                        </Badge>
                                    </div>
                                )}

                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {plan.durationMonths} Months Duration
                                    </span>
                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white font-poppins mt-1">
                                        {plan.name}
                                    </h3>
                                    <div className="mt-4 mb-6">
                                        <div className="text-3xl font-black italic text-primary font-poppins">
                                            ₹{plan.amount.toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            ₹{plan.pricePerMonth}/month
                                        </div>
                                    </div>

                                    <ul className="space-y-2.5 mb-8 border-t border-white/5 pt-4">
                                        <li className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                            <Check size={14} className="text-emerald-400 shrink-0" />
                                            <span>Same QR Token Continues</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                            <Check size={14} className="text-emerald-400 shrink-0" />
                                            <span>Biometric 1:1 Verification</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                            <Check size={14} className="text-emerald-400 shrink-0" />
                                            <span>Full Medical Vault Active</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                                            <Check size={14} className="text-emerald-400 shrink-0" />
                                            <span>Emergency GPS Dispatch</span>
                                        </li>
                                    </ul>
                                </div>

                                <Button 
                                    onClick={() => handleSelectRenewalPlan(plan.id)}
                                    className={`w-full py-4 text-xs font-black uppercase tracking-widest italic rounded-2xl ${
                                        isPopular
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-red-700'
                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    }`}
                                >
                                    Renew {plan.durationMonths}M
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 4. Frequently Asked Questions */}
            <section className="py-16 px-4 max-w-4xl mx-auto border-t border-white/5">
                <div className="text-center mb-12">
                    <Badge className="bg-white/5 text-slate-300 border-white/10 mb-4 px-3 py-1 font-black tracking-widest text-[10px] uppercase italic">
                        COMMON QUESTIONS
                    </Badge>
                    <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white font-poppins">
                        Subscription & Renewal FAQs
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="p-6 bg-slate-950/60 rounded-2xl border border-white/5">
                            <h3 className="text-sm sm:text-base font-black italic uppercase tracking-tight text-white font-poppins flex items-center gap-2 mb-2">
                                <HelpCircle size={16} className="text-primary shrink-0" />
                                {faq.q}
                            </h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium pl-6">
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Reusable Renewal Modal for Logged-In Users */}
            {auth.currentUser && (
                <RenewalModal 
                    isOpen={isRenewalModalOpen}
                    onClose={() => setIsRenewalModalOpen(false)}
                    qrId={userQrId}
                    currentExpiry={userExpiry}
                    holderName={userProfile?.name || 'Citizen'}
                    onRenewalComplete={() => {
                        setIsRenewalModalOpen(false);
                        navigate('/dashboard');
                    }}
                />
            )}
        </div>
    );
}
