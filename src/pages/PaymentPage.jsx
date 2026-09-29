import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ShieldCheck, Lock, ChevronRight, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { ref, onValue, update, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { SUBSCRIPTION_PLANS } from '../lib/subscriptionConfig';
import DemoRazorpayModal from '../components/common/DemoRazorpayModal';

export default function PaymentPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState('initial_3m');
    const [activeSlug, setActiveSlug] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                toast.error("Please login to proceed to checkout.");
                navigate('/login?redirect_to=/payment');
            } else {
                setActiveUser(user);
                const currentSlug = localStorage.getItem('resqr_active_slug') || `c_${user.uid}`;
                setActiveSlug(currentSlug);

                // Sync pending profile if exists
                const pendingProfileJson = localStorage.getItem('resqr_pending_profile');
                if (pendingProfileJson) {
                    try {
                        const formData = JSON.parse(pendingProfileJson);
                        const nameSlug = localStorage.getItem('resqr_active_slug') ||
                            formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

                        const profileData = {
                            ...formData,
                            email: user.email,
                            uid: user.uid,
                            payment_status: 'pending',
                            last_updated: new Date().toISOString()
                        };

                        await update(ref(db, `profiles/${nameSlug}`), profileData);
                        await update(ref(db, `users/${user.uid}/profiles/${nameSlug}`), profileData);

                        localStorage.removeItem('resqr_pending_profile');
                        localStorage.setItem('resqr_active_slug', nameSlug);
                        setActiveSlug(nameSlug);
                    } catch (err) {
                        console.error("Failed to sync pending profile:", err);
                    }
                }
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
        };
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="text-primary animate-spin" size={48} />
            </div>
        );
    }

    const availablePlans = Object.values(SUBSCRIPTION_PLANS);
    const selectedPlan = SUBSCRIPTION_PLANS[selectedPlanId] || SUBSCRIPTION_PLANS.initial_3m;
    const subtotal = selectedPlan.amount / 1.18;
    const gst = selectedPlan.amount - subtotal;

    return (
        <div className="min-h-screen bg-medical-bg py-24 px-4 text-white font-manrope">
            <div className="max-w-6xl mx-auto">
                <header className="mb-16 text-center">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none mb-4 px-6 py-1 font-black italic tracking-widest flex items-center gap-2 w-fit mx-auto">
                        <ShieldCheck size={14} /> SECURE 256-BIT ENCRYPTED CHECKOUT
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none font-poppins">
                        Checkout <span className="text-primary">Summary.</span>
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8">
                        <Card className="p-10 bg-medical-card border-white/5 rounded-[40px] shadow-2xl">
                            <h2 className="text-2xl font-black italic uppercase mb-8">Select Emergency Plan</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {availablePlans.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPlanId(p.id)}
                                        className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col justify-between ${
                                            selectedPlanId === p.id 
                                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                                                : 'border-white/5 bg-slate-900/40 hover:border-white/20'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge className="text-[8px] font-black uppercase tracking-wider bg-white/10 text-slate-300 border-none">
                                                    {p.durationMonths} MONTHS
                                                </Badge>
                                                {p.popular && (
                                                    <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                        POPULAR
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-black uppercase text-white mb-1">{p.shortName || p.name}</p>
                                            <p className="text-xs text-slate-400 font-medium line-clamp-2">{p.description}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-baseline">
                                            <span className="text-2xl font-black italic text-white font-poppins">₹{p.amount}</span>
                                            {selectedPlanId === p.id && (
                                                <CheckCircle2 size={16} className="text-primary" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-12">
                                <Button 
                                    className="w-full py-8 text-xl font-black italic rounded-[24px] bg-primary hover:bg-primary-dark text-white border-none uppercase tracking-tighter shadow-2xl shadow-primary/20 flex items-center justify-center gap-3" 
                                    onClick={() => setIsRazorpayOpen(true)}
                                >
                                    PAY ₹{selectedPlan.amount} VIA RAZORPAY <ChevronRight size={24} />
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-4">
                        <Card className="p-10 bg-medical-card border-white/5 rounded-[40px] shadow-2xl space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Order Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between font-black italic text-xl">
                                    <span className="truncate pr-2">{selectedPlan.name}</span>
                                    <span>₹{selectedPlan.amount}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 uppercase tracking-widest">
                                    <span>Plan Duration</span>
                                    <span className="text-white font-bold">{selectedPlan.durationMonths} Months</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 uppercase tracking-widest">
                                    <span>GST (Included 18%)</span>
                                    <span>₹{gst.toFixed(2)}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between font-black text-3xl text-primary">
                                    <span>Total</span>
                                    <span>₹{selectedPlan.amount}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 space-y-2 text-xs text-slate-400">
                                <p className="flex items-center gap-2 font-bold text-white">
                                    <ShieldCheck size={14} className="text-emerald-400" /> RESQR Guarantee
                                </p>
                                <p className="text-[11px] leading-relaxed">
                                    Your existing QR token is permanently preserved on renewals. Emergency dispatch, hospital facial scans, and medical vault activate immediately upon backend verification.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Razorpay Gateway Modal */}
            <DemoRazorpayModal
                isOpen={isRazorpayOpen}
                onClose={() => setIsRazorpayOpen(false)}
                amount={selectedPlan.amount}
                title={selectedPlan.name}
                customerName={activeUser?.displayName || 'RESQR Citizen'}
                customerEmail={activeUser?.email || 'citizen@resqr.co.in'}
                customerPhone={activeUser?.phoneNumber || '9876543210'}
                userId={activeUser?.uid}
                qrId={activeSlug}
                planId={selectedPlan.id}
                onSuccess={(paymentInfo) => {
                    toast.success("Payment Verified! Subscription Activated.");
                    navigate('/success');
                }}
            />
        </div>
    );
}
