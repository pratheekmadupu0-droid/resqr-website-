import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    QrCode, Calendar, Clock, RefreshCw, AlertTriangle, ShieldCheck, 
    CheckCircle2, CreditCard, ChevronDown, ChevronUp, ExternalLink, Download
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { calculateSubscriptionStatus } from '../../lib/subscriptionConfig';
import { getPaymentHistory } from '../../lib/subscriptionApi';

export default function SubscriptionCard({
    subscription,
    activeProfile,
    onRenewClick,
    onDownloadQR
}) {
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const statusInfo = calculateSubscriptionStatus(subscription);
    const userName = (activeProfile?.name || activeProfile?.data?.name || 'REGISTERED HOLDER').toUpperCase();
    const qrId = activeProfile?.id || subscription?.qrId || 'RQ_LIVE';
    const qrDisplay = activeProfile?.username 
        ? activeProfile.username.toUpperCase() 
        : qrId.replace(/^c_/, 'RQ').slice(0, 10).toUpperCase();

    const qrValue = activeProfile?.username
        ? `${window.location.origin}/${activeProfile.username}`
        : `${window.location.origin}/qr/${qrId}`;

    useEffect(() => {
        if (showHistory && subscription?.userId) {
            setLoadingHistory(true);
            getPaymentHistory(subscription.userId, subscription.qrId)
                .then(data => setHistory(data))
                .catch(console.error)
                .finally(() => setLoadingHistory(false));
        }
    }, [showHistory, subscription]);

    return (
        <div className="bg-[#11192A] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl relative">
            {/* Top Status Header */}
            <div className="p-6 sm:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <QrCode size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                RESQR Emergency Subscription
                            </h3>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            Unified Protection & Biometric Active Node
                        </p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusInfo.badgeClass}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dotClass}`} />
                        <span>● {statusInfo.status.replace('_', ' ')}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* QR Code Container */}
                <div className="flex flex-col items-center text-center p-6 bg-slate-950/70 rounded-3xl border border-white/5">
                    <div className="p-4 bg-white rounded-2xl shadow-xl">
                        <QRCodeCanvas
                            id="subscription-qr-code"
                            value={qrValue}
                            size={140}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    <p className="text-xs font-mono font-bold text-white tracking-widest mt-3">
                        {qrDisplay}
                    </p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1 truncate max-w-[200px]">
                        {userName}
                    </p>
                    {onDownloadQR && (
                        <button
                            onClick={onDownloadQR}
                            className="mt-3 text-[10px] font-bold text-primary hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                            <Download size={12} /> Download Official Tag
                        </button>
                    )}
                </div>

                {/* Subscription Validity Information */}
                <div className="md:col-span-2 space-y-5">
                    {/* Status Message based on state */}
                    {statusInfo.isActive && !statusInfo.isExpiringSoon && (
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                                Service Validity Status
                            </span>
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="text-3xl font-black italic text-white font-poppins">
                                    Valid Until: {statusInfo.formattedExpiry}
                                </span>
                                <span className="text-xs font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                    {statusInfo.daysRemaining} DAYS REMAINING
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                Your emergency response network, hospital face-verification protocol, and GPS dispatch are operational.
                            </p>
                        </div>
                    )}

                    {statusInfo.isExpiringSoon && (
                        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertTriangle size={18} />
                                <span className="text-xs font-black uppercase tracking-wider">
                                    Service Expiring Soon
                                </span>
                            </div>
                            <div className="text-2xl font-black italic text-white font-poppins">
                                Valid Until: {statusInfo.formattedExpiry}
                            </div>
                            <p className="text-xs text-amber-200/80">
                                Only <strong className="text-amber-300 font-bold">{statusInfo.daysRemaining} days remaining</strong>. Renew now to avoid interruption in your emergency rescue services. Unused validity is preserved.
                            </p>
                        </div>
                    )}

                    {statusInfo.isExpired && (
                        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-rose-400">
                                <AlertTriangle size={18} />
                                <span className="text-xs font-black uppercase tracking-wider">
                                    Service Expired
                                </span>
                            </div>
                            <div className="text-2xl font-black italic text-white font-poppins">
                                Your RESQR service has expired.
                            </div>
                            <p className="text-xs text-rose-200/80">
                                Renew your plan to reactivate your RESQR emergency service and 1:1 facial verification. Your medical data, insurance details, and QR token remain safely preserved.
                            </p>
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                            <p className="text-[9px] uppercase font-bold text-slate-500">Current Plan</p>
                            <p className="font-black italic text-white mt-0.5 truncate">{subscription?.planName || '3 Months'}</p>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                            <p className="text-[9px] uppercase font-bold text-slate-500">Activated Date</p>
                            <p className="font-black italic text-white mt-0.5">
                                {subscription?.activatedAt ? new Date(subscription.activatedAt).toLocaleDateString('en-IN') : 'Active'}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                            <p className="text-[9px] uppercase font-bold text-slate-500">QR Code Token</p>
                            <p className="font-mono font-bold text-emerald-400 mt-0.5 truncate">{qrDisplay}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <Button
                            onClick={onRenewClick}
                            className={`w-full sm:flex-1 py-4 font-black italic uppercase tracking-wider text-xs rounded-2xl shadow-xl transition-all ${
                                statusInfo.isExpired
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 animate-bounce'
                                    : statusInfo.isExpiringSoon
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                                    : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'
                            }`}
                        >
                            <RefreshCw size={16} className="mr-2" />
                            {statusInfo.isExpired ? 'RENEW NOW' : statusInfo.isExpiringSoon ? 'RENEW NOW' : 'RENEW / UPGRADE QR'}
                        </Button>

                        <button
                            type="button"
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full sm:w-auto px-5 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 transition-colors"
                        >
                            <CreditCard size={14} />
                            Payment History
                            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible Payment / Renewal History Section */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/5 bg-slate-950/90 p-6 sm:p-8"
                    >
                        <h4 className="text-sm font-black italic uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-primary" />
                            Renewal & Payment History
                        </h4>

                        {loadingHistory ? (
                            <p className="text-xs text-slate-500 italic py-4">Loading transaction history...</p>
                        ) : history.length === 0 ? (
                            <div className="p-6 bg-slate-900/40 rounded-2xl text-center border border-white/5 text-xs text-slate-500">
                                {subscription?.paymentId ? (
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-left">
                                        <div>
                                            <p className="font-bold text-white">{subscription.planName || '3 Months Registration'}</p>
                                            <p className="text-[10px] text-slate-400">Payment ID: {subscription.paymentId}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-emerald-400 font-bold">₹{subscription.amount || 149} SUCCESSFUL</span>
                                            <p className="text-[10px] text-slate-400">{new Date(subscription.activatedAt || Date.now()).toLocaleDateString('en-IN')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p>No past payment history records found.</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((item, index) => (
                                    <div
                                        key={item.paymentId || index}
                                        className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black italic text-white uppercase">
                                                    {item.planName || `${item.durationMonths || 3} Months Renewal`}
                                                </span>
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-black uppercase">
                                                    {item.status || 'SUCCESSFUL'}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                                                ID: {item.paymentId} {item.orderId ? `• Order: ${item.orderId}` : ''}
                                            </p>
                                        </div>

                                        <div className="text-left sm:text-right">
                                            <span className="text-base font-black italic text-emerald-400 font-poppins">
                                                ₹{item.amount?.toLocaleString('en-IN') || '0'}
                                            </span>
                                            <p className="text-[10px] text-slate-400">
                                                {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
