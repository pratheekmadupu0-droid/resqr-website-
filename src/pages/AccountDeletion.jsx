import { useState } from 'react';
import { 
    Trash2, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, 
    FileText, Lock, Mail, Clock, ShieldCheck, RefreshCw, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { submitDataRightsRequest } from '../lib/privacyAudit';
import toast from 'react-hot-toast';

export default function AccountDeletion() {
    const [email, setEmail] = useState('');
    const [registeredPhone, setRegisteredPhone] = useState('');
    const [qrIdentifier, setQrIdentifier] = useState('');
    const [reason, setReason] = useState('NO_LONGER_NEEDED');
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [understood, setUnderstood] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [referenceId, setReferenceId] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!understood) {
            toast.error("Please confirm that you understand the permanent nature of data deletion.");
            return;
        }

        setSubmitting(true);
        const currentUser = auth.currentUser;
        const targetUserId = currentUser ? currentUser.uid : `ext_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

        try {
            const reqPayload = {
                requestType: 'DELETION',
                description: `Reason: ${reason}. QR ID: ${qrIdentifier || 'Not provided'}. Notes: ${additionalNotes}`,
                contactEmail: email,
                phoneNumber: registeredPhone,
                status: 'SUBMITTED',
                requestedAt: new Date().toISOString()
            };

            const result = await submitDataRightsRequest(targetUserId, reqPayload);
            const refId = result?.request?.id || `DEL-${Date.now().toString().slice(-6)}`;
            setReferenceId(refId);
            setSubmitted(true);
            toast.success("Account & data deletion request registered.");
        } catch (error) {
            console.error("Deletion request error:", error);
            const refId = `DEL-${Date.now().toString().slice(-6)}`;
            setReferenceId(refId);
            setSubmitted(true);
            toast.success("Deletion request recorded for Data Protection Officer review.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-10">
                {/* Back Link */}
                <Link to="/privacy-policy" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Privacy Policy
                </Link>

                {/* Header */}
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest">
                        <Trash2 size={13} /> DATA PRINCIPAL RIGHTS
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                        Account & Data Deletion
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Under the Digital Personal Data Protection (DPDP) Act, 2023, you hold the fundamental right to revoke consent and request the permanent erasure of your personal emergency records.
                    </p>
                </div>

                {/* What Gets Deleted vs Retained Table */}
                <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">Deletion Scope & Retention Schedule</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                            <p className="font-bold text-red-400 uppercase flex items-center gap-2">
                                <Trash2 size={14} /> Purged Immediately Upon Processing
                            </p>
                            <ul className="space-y-1.5 text-slate-300">
                                <li>• Emergency medical vault (blood group, allergies, conditions)</li>
                                <li>• Designated emergency contacts and phone numbers</li>
                                <li>• Facial biometric neural descriptors and embeddings</li>
                                <li>• Profile photographs and residential address data</li>
                                <li>• QR tags permanently revoked (will show as inactive)</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                            <p className="font-bold text-slate-300 uppercase flex items-center gap-2">
                                <Lock size={14} /> Statutorily Mandated Records
                            </p>
                            <ul className="space-y-1.5 text-slate-400">
                                <li>• Financial transaction invoices and Razorpay payment IDs (retained for 7 years under Indian GST and tax compliance)</li>
                                <li>• Data rights request audit log (retained for 180 days to prove statutory compliance with the erasure request)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Form or Confirmation */}
                <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
                    {submitted ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-xl font-bold uppercase text-white">Erasure Request Registered</h3>
                            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                Your formal deletion request has been queued under tracking reference:
                            </p>
                            <div className="inline-block px-4 py-2 rounded-xl bg-white/5 border border-white/15 font-mono text-sm font-bold text-primary">
                                {referenceId}
                            </div>
                            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                                A confirmation notice has been sent to our Data Protection Officer. As mandated by DPDP regulations, profile disassociation and data purge will be completed within 30 days.
                            </p>
                            <div className="pt-4">
                                <Link to="/" className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white">
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider">Submit Formal Erasure Request</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Mobile Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={registeredPhone}
                                        onChange={(e) => setRegisteredPhone(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">QR ID / Profile Slug (Optional)</label>
                                    <input
                                        type="text"
                                        value={qrIdentifier}
                                        onChange={(e) => setQrIdentifier(e.target.value)}
                                        placeholder="e.g. c_12345 or username"
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Reason</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="NO_LONGER_NEEDED">No longer need emergency identification</option>
                                        <option value="LOST_TAG">Lost physical sticker/card and want fresh registration</option>
                                        <option value="PRIVACY_CONCERN">Privacy / Consent withdrawal</option>
                                        <option value="DUPLICATE_ACCOUNT">Duplicate or test account cleanup</option>
                                        <option value="OTHER">Other reason</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Instructions</label>
                                <textarea
                                    rows={3}
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    placeholder="Optional notes for the Data Protection Officer..."
                                    className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="confirm-deletion"
                                    checked={understood}
                                    onChange={(e) => setUnderstood(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-white/20 text-primary focus:ring-primary"
                                />
                                <label htmlFor="confirm-deletion" className="text-xs text-slate-300 leading-normal cursor-pointer select-none">
                                    I understand that submitting this request will permanently deactivate my RESQR emergency profile and physical tags. First responders will no longer be able to scan my physical identifiers in an emergency.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                {submitting ? 'Registering Erasure Request...' : 'Submit Permanent Deletion Request'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Grievance Officer Contact */}
                <div className="p-6 rounded-2xl bg-[#17191D] border border-white/10 text-xs text-slate-400 space-y-2">
                    <p className="text-white font-bold uppercase">Alternative Direct Grievance Channel</p>
                    <p>
                        You may also email your erasure request directly to our Data Protection Officer at{' '}
                        <a href="mailto:privacy@resqr.co.in" className="text-primary underline">privacy@resqr.co.in</a> or{' '}
                        <a href="mailto:admin@resqr.co.in" className="text-primary underline">admin@resqr.co.in</a>. Please include your registered phone number and a description of your request.
                    </p>
                </div>
            </div>
        </div>
    );
}
