import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export default function PaymentReceiptModal({
    isOpen,
    onClose,
    paymentData
}) {
    if (!isOpen || !paymentData) return null;

    const receiptNum = paymentData.receiptNumber || `REC-${(paymentData.userId || 'USER').slice(-4).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const amount = Number(paymentData.amount || 149);
    const subtotal = (amount / 1.18).toFixed(2);
    const gst = (amount - Number(subtotal)).toFixed(2);

    const paidDate = paymentData.paidAt || paymentData.createdAt || paymentData.timestamp || new Date().toISOString();
    const formattedPaidDate = new Date(paidDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const startDate = paymentData.subscriptionStartDate || paidDate;
    const expiryDate = paymentData.subscriptionExpiryDate || paymentData.expiresAt;

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-manrope overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-xl bg-[#0b1329] text-white rounded-[32px] border border-white/10 shadow-2xl overflow-hidden relative my-auto print:bg-white print:text-black print:max-w-none print:border-none print:shadow-none"
                >
                    {/* Header */}
                    <div className="p-8 bg-slate-900/80 border-b border-white/5 flex justify-between items-start print:bg-white print:border-b-2 print:border-black">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-black text-white text-base">
                                    R
                                </div>
                                <span className="text-xl font-black italic tracking-tighter uppercase font-poppins text-white print:text-black">
                                    RESQR Emergency
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest print:text-gray-600">
                                Official Payment Receipt • Section 17 Verified
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest px-3 py-1 print:bg-gray-100 print:text-black">
                                <CheckCircle2 size={12} className="mr-1" /> PAID
                            </Badge>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors print:hidden"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-8 space-y-6 text-xs">
                        {/* Meta Row */}
                        <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/5 print:border-gray-200">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-500 block print:text-gray-600">Receipt No:</span>
                                <span className="font-mono font-bold text-white text-sm print:text-black">{receiptNum}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block print:text-gray-600">Date & Time:</span>
                                <span className="font-bold text-slate-300 print:text-black">{formattedPaidDate}</span>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2 print:bg-gray-50 print:border-gray-200">
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block print:text-gray-600">
                                Customer Account
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="font-bold text-white print:text-black">{paymentData.userName || 'RESQR Citizen'}</p>
                                    <p className="text-[11px] text-slate-400 print:text-gray-600">{paymentData.userEmail || '—'}</p>
                                    <p className="text-[11px] text-slate-400 print:text-gray-600">{paymentData.userPhone || '—'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase print:text-gray-600">User ID</p>
                                    <p className="font-mono text-slate-300 truncate print:text-black">{paymentData.userId || '—'}</p>
                                    <p className="text-[10px] text-slate-500 uppercase mt-1 print:text-gray-600">Identity QR</p>
                                    <p className="font-mono text-emerald-400 font-bold truncate print:text-black">{paymentData.qrId || '—'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Plan & Transaction Breakdown */}
                        <div className="space-y-3">
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block print:text-gray-600">
                                Order Breakdown
                            </span>

                            <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-3 print:bg-white print:border-gray-200">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-white print:text-black">{paymentData.planName || 'RESQR Protection Plan'}</span>
                                    <span className="text-white print:text-black">₹{amount}</span>
                                </div>

                                <div className="pt-3 border-t border-white/5 space-y-1.5 text-[11px] text-slate-400 print:border-gray-200 print:text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Subtotal (Net Amount):</span>
                                        <span>₹{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Integrated GST (18% Included):</span>
                                        <span>₹{gst}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-white/5 text-sm font-black text-emerald-400 print:text-black">
                                        <span>Total Amount Paid:</span>
                                        <span>₹{amount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gateway Details */}
                        <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400 pt-2 border-t border-white/5 print:border-gray-200 print:text-gray-600">
                            <div>
                                <span className="uppercase font-bold text-slate-500 block">Payment Gateway:</span>
                                <span className="font-medium text-slate-300 print:text-black">Razorpay Live Verified</span>
                                <span className="block font-mono text-[9px] text-slate-400 print:text-gray-600">Payment ID: {paymentData.paymentId || paymentData.razorpayPaymentId || '—'}</span>
                            </div>
                            <div className="text-right">
                                <span className="uppercase font-bold text-slate-500 block">Order ID:</span>
                                <span className="font-mono text-slate-300 print:text-black">{paymentData.razorpayOrderId || paymentData.orderId || '—'}</span>
                                {expiryDate && (
                                    <span className="block text-[9px] text-emerald-400 font-bold print:text-black">
                                        Valid Until: {new Date(expiryDate).toLocaleDateString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-slate-900/80 border-t border-white/5 flex items-center justify-between gap-3 print:hidden">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span>Server Verified • Tamper Proof</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase rounded-xl flex items-center gap-2"
                            >
                                <Printer size={14} /> Print / Save PDF
                            </Button>
                            <Button
                                onClick={onClose}
                                className="bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase rounded-xl px-5"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
