import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Check, ShieldCheck, Sparkles, ArrowRight, Clock, 
    Calendar, CheckCircle2, AlertCircle, RefreshCw, QrCode
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';
import { RENEWAL_PLAN_LIST, calculateNewExpiry, calculateSubscriptionStatus } from '../../lib/subscriptionConfig';
import { createSubscriptionOrder, verifySubscriptionPayment } from '../../lib/subscriptionApi';
import DemoRazorpayModal from '../common/DemoRazorpayModal';

export default function RenewalModal({
    isOpen,
    onClose,
    subscription,
    activeProfile,
    userId,
    onSuccess
}) {
    const [selectedPlanId, setSelectedPlanId] = useState('renewal_12m'); // default to 12 months MOST POPULAR
    const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successData, setSuccessData] = useState(null);

    if (!isOpen) return null;

    const selectedPlan = RENEWAL_PLAN_LIST.find(p => p.id === selectedPlanId) || RENEWAL_PLAN_LIST[2];
    const qrId = activeProfile?.id || subscription?.qrId || 'RQ_LIVE';
    const qrCodeDisplay = activeProfile?.username 
        ? activeProfile.username.toUpperCase() 
        : (qrId.replace(/^c_/, 'RQ').slice(0, 10).toUpperCase());

    const existingExpiry = subscription?.expiresAt || null;
    const newCalculatedExpiry = calculateNewExpiry(existingExpiry, selectedPlan.durationMonths);

    const formattedCurrentExpiry = existingExpiry
        ? new Date(existingExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Expired / Inactive';

    const formattedNewExpiry = new Date(newCalculatedExpiry).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const isCurrentlyActive = existingExpiry && new Date(existingExpiry).getTime() > Date.now();

    const handleStartPayment = async () => {
        setIsProcessing(true);
        const t = toast.loading('Initializing secure renewal...');
        try {
            const customerName = activeProfile?.name || activeProfile?.data?.name || 'RESQR Citizen';
            const customerEmail = activeProfile?.email || activeProfile?.data?.email || 'citizen@resqr.co.in';
            const customerPhone = activeProfile?.phone || activeProfile?.data?.phone || '9876543210';

            const order = await createSubscriptionOrder({
                userId,
                qrId,
                planId: selectedPlan.id,
                customerName,
                customerEmail,
                customerPhone
            });

            setPendingOrder(order);
            toast.dismiss(t);
            setIsRazorpayModalOpen(true);
        } catch (err) {
            console.error('Payment initialization error:', err);
            toast.error(err.message || 'Failed to start payment gateway', { id: t });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentVerified = async (paymentResponse) => {
        setIsRazorpayModalOpen(false);
        const t = toast.loading('Verifying payment and extending subscription...');
        try {
            const verificationResult = await verifySubscriptionPayment({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id || pendingOrder?.orderId,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderToken: pendingOrder?.orderToken,
                userId,
                qrId,
                planId: selectedPlan.id
            });

            toast.success('Subscription Extended Successfully!', { id: t });
            setSuccessData(verificationResult);
            if (onSuccess) onSuccess(verificationResult);
        } catch (err) {
            console.error('Verification error:', err);
            toast.error(err.message || 'Payment verification failed', { id: t });
        }
    };

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md font-manrope overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-2xl bg-[#090f1e] text-white rounded-[32px] sm:rounded-[40px] border border-white/10 shadow-2xl overflow-hidden relative my-auto"
                    >
                        {/* Header Banner */}
                        <div className="p-6 sm:p-8 bg-gradient-to-br from-primary/20 via-slate-900 to-[#090f1e] border-b border-white/5 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black tracking-widest uppercase italic">
                                    RESQR LIFETIME QR CONTINUITY
                                </Badge>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                RESQR UPGRADE / <span className="text-primary italic-display">RENEWAL PLANS</span>
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                                Your existing QR continues unchanged. Select a duration to extend your protection.
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                            {successData ? (
                                /* Success Confirmation State */
                                <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                                        <CheckCircle2 size={44} />
                                    </div>

                                    <div>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black italic text-[10px] tracking-widest uppercase mb-2">
                                            ● ACTIVE FOR {successData.durationMonths} MONTHS
                                        </Badge>
                                        <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight font-poppins text-white">
                                            QR Successfully Renewed!
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2">
                                            Your existing QR token <span className="text-white font-mono font-bold">{qrCodeDisplay}</span> has been reactivated with uninterrupted protection.
                                        </p>
                                    </div>

                                    <div className="bg-slate-950/70 p-6 rounded-3xl border border-white/5 space-y-3 max-w-md mx-auto text-left text-xs">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Current QR Token:</span>
                                            <span className="font-mono text-white font-bold">{qrCodeDisplay}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>New Expiry Date:</span>
                                            <span className="text-emerald-400 font-black">{formattedNewExpiry}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Payment ID:</span>
                                            <span className="font-mono text-white text-[11px] truncate max-w-[180px]">{successData.paymentId}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span>Amount Paid:</span>
                                            <span className="text-white font-black text-sm">₹{selectedPlan.amount}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={onClose}
                                        className="w-full max-w-md py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-wider text-xs shadow-xl shadow-primary/20"
                                    >
                                        Done & Return to Dashboard
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* QR continuity notice */}
                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <QrCode size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    Linked Active QR Tag
                                                </p>
                                                <p className="font-mono text-sm font-bold text-white tracking-wider">
                                                    {qrCodeDisplay}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                            SAME QR PRESERVED
                                        </span>
                                    </div>

                                    {/* Plan Options Selector */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic block">
                                            Choose Your Validity:
                                        </label>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {RENEWAL_PLAN_LIST.map((plan) => {
                                                const isSelected = selectedPlanId === plan.id;
                                                return (
                                                    <div
                                                        key={plan.id}
                                                        onClick={() => setSelectedPlanId(plan.id)}
                                                        className={`p-5 rounded-2xl sm:rounded-3xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                                                            isSelected
                                                                ? 'bg-primary/10 border-primary shadow-xl shadow-primary/10 ring-1 ring-primary'
                                                                : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                                                        }`}
                                                    >
                                                        {plan.popular && (
                                                            <div className="absolute top-3 right-3">
                                                                <span className="bg-primary text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full italic shadow-md">
                                                                    MOST POPULAR
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                                                isSelected ? 'border-primary bg-primary' : 'border-slate-600'
                                                            }`}>
                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-black italic uppercase tracking-tight text-white font-poppins">
                                                                    {plan.shortName}
                                                                </h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                                    {plan.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-baseline justify-between">
                                                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                                                Renewal Price
                                                            </span>
                                                            <span className="text-2xl font-black italic text-white font-poppins">
                                                                ₹{plan.amount.toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Expiry Calculation & Details Breakdown */}
                                    <div className="bg-slate-950/80 p-5 rounded-2xl sm:rounded-3xl border border-white/5 space-y-3 text-xs">
                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-500" /> Current Expiry:
                                            </span>
                                            <span className={`font-bold ${isCurrentlyActive ? 'text-white' : 'text-rose-400'}`}>
                                                {formattedCurrentExpiry}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-primary" /> New Calculated Expiry:
                                            </span>
                                            <span className="font-black text-emerald-400 text-sm">
                                                {formattedNewExpiry}
                                            </span>
                                        </div>

                                        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    Total Payable
                                                </p>
                                                <p className="text-[9px] text-slate-500">
                                                    Inclusive of all taxes & protection services
                                                </p>
                                            </div>
                                            <span className="text-3xl font-black italic text-primary font-poppins">
                                                ₹{selectedPlan.amount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <Button
                                            onClick={onClose}
                                            variant="outline"
                                            className="w-full sm:w-1/3 py-4 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-400 hover:text-white"
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            onClick={handleStartPayment}
                                            disabled={isProcessing}
                                            className="w-full sm:w-2/3 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black italic uppercase tracking-wider text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? 'Connecting Gateway...' : `Continue to Payment (₹${selectedPlan.amount})`}
                                            <ArrowRight size={16} />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            {/* Reusable Razorpay Gateway Modal */}
            <DemoRazorpayModal
                isOpen={isRazorpayModalOpen}
                onClose={() => setIsRazorpayModalOpen(false)}
                amount={selectedPlan.amount}
                title={`RESQR ${selectedPlan.name}`}
                customerName={activeProfile?.name || activeProfile?.data?.name || 'RESQR Citizen'}
                customerEmail={activeProfile?.email || activeProfile?.data?.email || 'citizen@resqr.co.in'}
                customerPhone={activeProfile?.phone || activeProfile?.data?.phone || '9876543210'}
                onSuccess={handlePaymentVerified}
            />
        </>
    );
}
