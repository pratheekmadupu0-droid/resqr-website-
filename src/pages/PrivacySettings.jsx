import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { 
    Eye, EyeOff, ShieldCheck, Lock, ArrowLeft, Loader2, Check, 
    User, FileText, PhoneCall, HeartPulse, Shield, QrCode, MapPin, 
    Camera, Download, Trash2, RefreshCw, AlertTriangle, HelpCircle, 
    Mail, ExternalLink, CheckCircle2, Clock, Globe, Laptop, Key
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import AppLoading from '../components/ui/AppLoading';
import { 
    PRIVACY_POLICY_VERSION, 
    DATA_CATEGORIES, 
    CONSENT_DEFINITIONS,
    PRIVACY_OFFICER_DETAILS,
    DATA_RETENTION_POLICIES
} from '../lib/privacyConfig';
import { 
    logPrivacyAudit, 
    getUserPrivacyAuditLogs, 
    submitDataRightsRequest, 
    getUserDataRightsRequests 
} from '../lib/privacyAudit';

// Field key -> { label, description, group }
const PRIVACY_FIELDS = [
    { key: 'bloodGroup', label: 'Blood Group', description: 'The single most requested detail in an emergency.', group: 'MEDICAL' },
    { key: 'allergies', label: 'Allergies', description: 'Critical for safe first-line treatment.', group: 'MEDICAL' },
    { key: 'medicalConditions', label: 'Medical Conditions', description: 'Ongoing conditions responders should know about.', group: 'MEDICAL' },
    { key: 'currentMedication', label: 'Current Medications', description: 'Helps avoid adverse drug interactions.', group: 'MEDICAL' },
    { key: 'previousSurgeries', label: 'Previous Surgeries', description: 'Relevant surgical history.', group: 'MEDICAL' },
    { key: 'emergencyNotes', label: 'Emergency Notes', description: 'Free-form notes you consider vital.', group: 'MEDICAL' },
    { key: 'emergencyContacts', label: 'Emergency Contacts', description: 'Let responders call your family or guardian.', group: 'CONTACTS & INSURANCE' },
    { key: 'insurance', label: 'Insurance Details', description: 'Provider and policy information for admission.', group: 'CONTACTS & INSURANCE' },
    { key: 'address', label: 'Home Address', description: 'Shown so responders know where you are registered.', group: 'CONTACTS & INSURANCE' },
    { key: 'organDonor', label: 'Organ Donor Status', description: 'Displays your organ-donor pledge.', group: 'CONTACTS & INSURANCE' },
];

const ALL_ON = Object.fromEntries(PRIVACY_FIELDS.map(f => [f.key, true]));

export default function PrivacySettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [privacy, setPrivacy] = useState(ALL_ON);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Consent preferences state
    const [consentState, setConsentState] = useState({
        accepted: true,
        version: PRIVACY_POLICY_VERSION,
        optionalLocation: false,
        optionalMarketing: false,
        optionalFeatures: false,
        timestamp: new Date().toISOString()
    });

    // Audit logs & Data rights requests
    const [auditLogs, setAuditLogs] = useState([]);
    const [dataRequests, setDataRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('controls'); // 'controls' | 'consent' | 'activity' | 'rights' | 'retention'

    // Data Rights Modals
    const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
    const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
    const [requestDesc, setRequestDesc] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Load user data, profiles, consents, and audit logs
    const loadUserData = useCallback(async (uid) => {
        setLoading(true);
        try {
            const userSnap = await get(ref(db, `users/${uid}`));
            if (userSnap.exists()) {
                const u = userSnap.val();
                setUserData(u);
                if (u.privacyConsent) {
                    setConsentState(u.privacyConsent);
                }

                // Load profiles
                if (u.profiles) {
                    const list = Object.entries(u.profiles).map(([id, val]) => ({ id, ...val }));
                    setProfiles(list);
                    const stored = localStorage.getItem('resqr_active_profile_id');
                    const active = list.find(p => p.id === stored) || list[0];
                    if (active) {
                        setActiveId(active.id);
                        setPrivacy({ ...ALL_ON, ...(active.privacy || {}) });
                    }
                }
            }

            // Load audit logs & requests
            const [logs, requests] = await Promise.all([
                getUserPrivacyAuditLogs(uid),
                getUserDataRightsRequests(uid)
            ]);
            setAuditLogs(logs);
            setDataRequests(requests);
        } catch (err) {
            console.error('Privacy settings load error:', err);
            toast.error('Unable to load privacy preferences. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) loadUserData(user.uid);
            else setLoading(false);
        });
        return () => unsub();
    }, [loadUserData]);

    const toggleField = (key) => {
        setPrivacy(p => ({ ...p, [key]: !p[key] }));
        setDirty(true);
    };

    const setAll = (value) => {
        setPrivacy(Object.fromEntries(PRIVACY_FIELDS.map(f => [f.key, value])));
        setDirty(true);
    };

    const handleSavePrivacyFields = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid || !activeId) return;
        setSaving(true);
        const t = toast.loading('Updating emergency privacy controls…');
        try {
            await set(ref(db, `users/${uid}/profiles/${activeId}/privacy`), privacy);
            await logPrivacyAudit({
                userId: uid,
                action: 'PRIVACY_FIELD_VISIBILITY_UPDATED',
                details: { profileId: activeId, visibleCount: Object.values(privacy).filter(Boolean).length }
            });
            toast.success('Emergency visibility settings updated successfully.', { id: t });
            setDirty(false);
        } catch (err) {
            console.error('Privacy save failed:', err);
            toast.error('Unable to save changes. Please try again.', { id: t });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleConsent = async (consentKey, value) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const updatedConsent = {
            ...consentState,
            [consentKey]: value,
            lastUpdated: new Date().toISOString()
        };
        setConsentState(updatedConsent);
        try {
            await update(ref(db, `users/${uid}/privacyConsent`), updatedConsent);
            await logPrivacyAudit({
                userId: uid,
                action: value ? 'OPTIONAL_CONSENT_GRANTED' : 'OPTIONAL_CONSENT_WITHDRAWN',
                details: { consentKey, value }
            });
            toast.success(`Consent preference for ${consentKey} updated.`);
        } catch (err) {
            console.error("Consent update error:", err);
            toast.error("Failed to update consent preference.");
        }
    };

    const handleWithdrawAllOptionalConsents = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const resetConsent = {
            ...consentState,
            optionalLocation: false,
            optionalMarketing: false,
            optionalFeatures: false,
            withdrawnAt: new Date().toISOString()
        };
        setConsentState(resetConsent);
        try {
            await update(ref(db, `users/${uid}/privacyConsent`), resetConsent);
            await logPrivacyAudit({
                userId: uid,
                action: 'ALL_OPTIONAL_CONSENTS_WITHDRAWN',
                details: { resetConsent }
            });
            toast.success("All optional consents withdrawn successfully.");
        } catch (err) {
            toast.error("Failed to withdraw optional consents.");
        }
    };

    // Download Data Package (JSON)
    const handleDownloadMyData = () => {
        const uid = auth.currentUser?.uid;
        if (!userData) return;
        const exportPayload = {
            userAccount: {
                uid: userData.uid,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin
            },
            privacyConsent: userData.privacyConsent || consentState,
            profiles: userData.profiles || {},
            subscription: userData.subscription || {},
            privacyAuditLogs: auditLogs,
            exportedAt: new Date().toISOString(),
            platform: 'RESQR Healthcare Emergency Platform'
        };

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resqr-my-data-${uid || 'export'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        logPrivacyAudit({
            userId: uid,
            action: 'DATA_EXPORT_DOWNLOADED',
            details: { format: 'json' }
        });
        toast.success("Personal data archive downloaded.");
    };

    // Submit Correction Request
    const handleSubmitCorrection = async () => {
        if (!requestDesc.trim()) {
            toast.error("Please specify the details to be corrected.");
            return;
        }
        setSubmittingRequest(true);
        try {
            const req = await submitDataRightsRequest({
                userId: auth.currentUser?.uid,
                requestType: 'CORRECTION',
                description: requestDesc,
                contactEmail: userData?.email || auth.currentUser?.email
            });
            setDataRequests(prev => [req, ...prev]);
            setIsCorrectionModalOpen(false);
            setRequestDesc('');
            toast.success("Correction request submitted to Data Protection Officer.");
        } catch (e) {
            toast.error("Failed to submit request: " + e.message);
        } finally {
            setSubmittingRequest(false);
        }
    };

    // Submit Deletion Request
    const handleSubmitDeletion = async () => {
        if (!requestDesc.trim()) {
            toast.error("Please provide a brief reason or confirmation for account deletion.");
            return;
        }
        setSubmittingRequest(true);
        try {
            const req = await submitDataRightsRequest({
                userId: auth.currentUser?.uid,
                requestType: 'DELETION',
                description: requestDesc,
                contactEmail: userData?.email || auth.currentUser?.email
            });
            setDataRequests(prev => [req, ...prev]);
            setIsDeletionModalOpen(false);
            setRequestDesc('');
            toast.success("Account deletion request submitted. An officer will review within 48 hours.");
        } catch (e) {
            toast.error("Failed to submit deletion request: " + e.message);
        } finally {
            setSubmittingRequest(false);
        }
    };

    if (loading) return <AppLoading message="Loading your privacy & security controls…" />;

    if (!auth.currentUser) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center px-4 py-24 text-white">
                <div className="max-w-md w-full bg-[#11192A] rounded-[40px] border border-white/5 p-10 text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Lock size={26} />
                    </div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">Session Expired</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed">
                        Sign in to access your Privacy Settings and Data Protection Hub.
                    </p>
                    <Link to="/login" className="btn-app-primary w-full justify-center">AUTHENTICATE PORTAL</Link>
                </div>
            </div>
        );
    }

    const visibleCount = PRIVACY_FIELDS.filter(f => privacy[f.key] !== false).length;

    return (
        <div className="min-h-screen bg-[#040812] page-bg-ganesha text-white font-manrope selection:bg-primary/30 relative">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-24 space-y-8 relative z-10">

                {/* ===== Header ===== */}
                <header className="space-y-3">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back to dashboard
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter font-poppins leading-none">
                                    PRIVACY & DATA PROTECTION
                                </h1>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1.5">
                                    User-Centric Data Governance & Role-Based Access Controls
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                                ● DPDP Framework Aligned
                            </Badge>
                        </div>
                    </div>
                </header>

                {/* ===== Navigation Tabs ===== */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 text-xs font-black uppercase tracking-wider">
                    {[
                        { id: 'controls', label: '1. Emergency Data Sharing' },
                        { id: 'consent', label: '2. Consent Preferences' },
                        { id: 'activity', label: '3. Security & Access Activity' },
                        { id: 'rights', label: '4. Data Rights & Requests' },
                        { id: 'retention', label: '5. Retention Policies' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 font-black'
                                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ================= TAB 1: EMERGENCY DATA SHARING CONTROLS ================= */}
                {activeTab === 'controls' && (
                    <div className="space-y-6">
                        {/* Profile switcher */}
                        {profiles.length > 1 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-2">Select Profile:</span>
                                {profiles.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveId(p.id);
                                            localStorage.setItem('resqr_active_profile_id', p.id);
                                            setPrivacy({ ...ALL_ON, ...(p.privacy || {}) });
                                            setDirty(false);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            p.id === activeId 
                                                ? 'bg-primary border-primary text-white' 
                                                : 'bg-[#11192A] border-white/10 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {p.data?.name || p.name || 'Identity Node'} {p.identityType && `(${p.identityType})`}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Explanation Banner */}
                        <div className="bg-[#11192A] rounded-[32px] border border-white/5 p-6 flex items-start gap-4">
                            <Eye size={20} className="text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="text-sm font-black uppercase text-white tracking-wide">
                                    Role-Based Granular Disclosure
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Only fields toggled ON will appear during an unauthenticated emergency scan. Sensitive clinical details are automatically protected behind doctor authorization.
                                </p>
                            </div>
                        </div>

                        {/* Field toggles */}
                        {['MEDICAL', 'CONTACTS & INSURANCE'].map(group => (
                            <section key={group} className="space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2 pt-2">{group}</h2>
                                <div className="bg-[#11192A] rounded-[32px] border border-white/5 overflow-hidden divide-y divide-white/5">
                                    {PRIVACY_FIELDS.filter(f => f.group === group).map(f => {
                                        const on = privacy[f.key] !== false;
                                        return (
                                            <div key={f.key} className="flex items-center justify-between gap-4 px-6 py-5">
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-bold ${on ? 'text-white' : 'text-slate-500'}`}>{f.label}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">{f.description}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={on}
                                                    aria-label={`Show ${f.label} to scanners`}
                                                    onClick={() => toggleField(f.key)}
                                                    className={`relative w-14 h-8 rounded-full border transition-all shrink-0 ${on ? 'bg-primary/25 border-primary/50' : 'bg-white/5 border-white/10'}`}
                                                >
                                                    <span className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${on ? 'left-[calc(100%-1.75rem)] bg-primary text-white' : 'left-1 bg-slate-600 text-slate-300'}`}>
                                                        {on ? <Eye size={13} /> : <EyeOff size={13} />}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}

                        {/* Bulk actions */}
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setAll(true)} className="flex-1 py-3.5 rounded-2xl bg-[#11192A] border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-all">Show All</button>
                            <button type="button" onClick={() => setAll(false)} className="flex-1 py-3.5 rounded-2xl bg-[#11192A] border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-primary/40 hover:text-primary transition-all">Hide All</button>
                        </div>

                        {/* Sticky save bar */}
                        <div className="bg-[#0B1322]/95 backdrop-blur border border-white/10 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-relaxed shrink-0">
                                {visibleCount}/10 fields visible<br />
                                <span className="text-primary">to emergency scanners</span>
                            </p>
                            <button
                                type="button"
                                onClick={handleSavePrivacyFields}
                                disabled={saving || !dirty}
                                className={`btn-app-primary px-8 shrink-0 ${(!dirty || saving) ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : dirty ? <Check size={16} /> : <Check size={16} className="opacity-40" />}
                                {saving ? 'Saving…' : dirty ? 'SAVE CHANGES' : 'SAVED'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ================= TAB 2: CONSENT PREFERENCES ================= */}
                {activeTab === 'consent' && (
                    <div className="space-y-6">
                        <div className="bg-[#11192A] rounded-[32px] border border-white/5 p-6 sm:p-8 space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div>
                                    <h3 className="text-xl font-black italic uppercase font-poppins">Active Consent Record</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Policy Version: <strong className="text-white">{consentState.version || PRIVACY_POLICY_VERSION}</strong></p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    Last Updated: {consentState.timestamp ? new Date(consentState.timestamp).toLocaleDateString('en-IN') : 'Active'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Required Account Processing */}
                                <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                                            <span>{CONSENT_DEFINITIONS.required.title}</span>
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase">ACTIVE</Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{CONSENT_DEFINITIONS.required.description}</p>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-500 py-2 shrink-0">Mandatory</span>
                                </div>

                                {/* Optional: Location */}
                                <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                                            <span>{CONSENT_DEFINITIONS.optionalLocation.title}</span>
                                            <Badge className={`text-[8px] font-black uppercase ${consentState.optionalLocation ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                                {consentState.optionalLocation ? 'ENABLED' : 'DISABLED'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{CONSENT_DEFINITIONS.optionalLocation.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleConsent('optionalLocation', !consentState.optionalLocation)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                                            consentState.optionalLocation ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-primary text-white hover:bg-red-700'
                                        }`}
                                    >
                                        {consentState.optionalLocation ? 'Disable' : 'Enable'}
                                    </button>
                                </div>

                                {/* Optional: Marketing */}
                                <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                                            <span>{CONSENT_DEFINITIONS.optionalMarketing.title}</span>
                                            <Badge className={`text-[8px] font-black uppercase ${consentState.optionalMarketing ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                                {consentState.optionalMarketing ? 'ENABLED' : 'DISABLED'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{CONSENT_DEFINITIONS.optionalMarketing.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleConsent('optionalMarketing', !consentState.optionalMarketing)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                                            consentState.optionalMarketing ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-primary text-white hover:bg-red-700'
                                        }`}
                                    >
                                        {consentState.optionalMarketing ? 'Disable' : 'Enable'}
                                    </button>
                                </div>

                                {/* Optional: Features */}
                                <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                                            <span>{CONSENT_DEFINITIONS.optionalFeatures.title}</span>
                                            <Badge className={`text-[8px] font-black uppercase ${consentState.optionalFeatures ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                                {consentState.optionalFeatures ? 'ENABLED' : 'DISABLED'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{CONSENT_DEFINITIONS.optionalFeatures.description}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleConsent('optionalFeatures', !consentState.optionalFeatures)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                                            consentState.optionalFeatures ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-primary text-white hover:bg-red-700'
                                        }`}
                                    >
                                        {consentState.optionalFeatures ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <p className="text-xs text-slate-500">
                                    You have the right to withdraw optional consents at any time.
                                </p>
                                <Button
                                    onClick={handleWithdrawAllOptionalConsents}
                                    variant="outline"
                                    className="py-3 px-6 text-xs font-black uppercase border-white/10 hover:border-red-500 text-slate-400 hover:text-red-400 rounded-xl"
                                >
                                    Withdraw All Optional Consents
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= TAB 3: SECURITY & ACCESS ACTIVITY LOGS ================= */}
                {activeTab === 'activity' && (
                    <div className="space-y-6">
                        <div className="bg-[#11192A] rounded-[32px] border border-white/5 p-6 sm:p-8 space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div>
                                    <h3 className="text-xl font-black italic uppercase font-poppins">Security & Access Activity</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Real-time audit log of authenticated logins, QR scans, and doctor accesses.</p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    {auditLogs.length} Events Recorded
                                </span>
                            </div>

                            {auditLogs.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-950/50 rounded-2xl border border-white/5">
                                    No security access events recorded in current log buffer.
                                </div>
                            ) : (
                                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-start justify-between gap-4 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white font-mono">{log.action}</span>
                                                    <Badge className="bg-white/5 text-slate-400 border-none text-[8px] uppercase">{log.role || 'citizen'}</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-400">
                                                    {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : 'Authorized event'}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold shrink-0">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Recent'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= TAB 4: DATA RIGHTS & REQUESTS ================= */}
                {activeTab === 'rights' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Download My Data */}
                            <div className="p-6 bg-[#11192A] rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                                        <Download size={20} />
                                    </div>
                                    <h4 className="text-base font-black italic uppercase text-white font-poppins">Download My Data</h4>
                                    <p className="text-xs text-slate-400 mt-1">Export your complete personal, emergency profile, and audit logs archive.</p>
                                </div>
                                <Button onClick={handleDownloadMyData} className="w-full py-3.5 bg-primary text-white text-xs font-black uppercase rounded-xl">
                                    Export JSON Archive
                                </Button>
                            </div>

                            {/* Card 2: Request Correction */}
                            <div className="p-6 bg-[#11192A] rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                                        <FileText size={20} />
                                    </div>
                                    <h4 className="text-base font-black italic uppercase text-white font-poppins">Request Correction</h4>
                                    <p className="text-xs text-slate-400 mt-1">Request rectification or update of any inaccurate personal or medical record.</p>
                                </div>
                                <Button onClick={() => setIsCorrectionModalOpen(true)} variant="outline" className="w-full py-3.5 border-white/10 text-white text-xs font-black uppercase rounded-xl">
                                    Submit Request
                                </Button>
                            </div>

                            {/* Card 3: Account Deletion */}
                            <div className="p-6 bg-[#11192A] rounded-3xl border border-white/5 flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
                                        <Trash2 size={20} />
                                    </div>
                                    <h4 className="text-base font-black italic uppercase text-white font-poppins">Request Deletion</h4>
                                    <p className="text-xs text-slate-400 mt-1">Request erasure of account & medical vault with statutory retention explanation.</p>
                                </div>
                                <Button onClick={() => setIsDeletionModalOpen(true)} variant="outline" className="w-full py-3.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-black uppercase rounded-xl">
                                    Request Erasure
                                </Button>
                            </div>
                        </div>

                        {/* Existing Requests Table */}
                        <div className="bg-[#11192A] rounded-[32px] border border-white/5 p-6 sm:p-8 space-y-4">
                            <h3 className="text-lg font-black italic uppercase font-poppins">Your Submitted Requests</h3>
                            {dataRequests.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-4">No active data rights requests submitted.</p>
                            ) : (
                                <div className="space-y-3">
                                    {dataRequests.map(req => (
                                        <div key={req.id} className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-start justify-between text-xs">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white">{req.requestType} REQUEST</span>
                                                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] uppercase">{req.status}</Badge>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1">{req.description}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">{req.resolutionNotes}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold shrink-0">{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Grievance Officer Card */}
                        <div className="p-6 bg-slate-950/80 rounded-3xl border border-white/5 space-y-2 text-xs">
                            <h4 className="font-black uppercase text-white tracking-wide">Data Protection & Grievance Contact</h4>
                            <p className="text-slate-400 leading-relaxed">
                                Under the Digital Personal Data Protection Act, our designated Data Protection Officer responds to grievance inquiries within {PRIVACY_OFFICER_DETAILS.responseTime}.
                            </p>
                            <div className="pt-2 text-primary font-bold">
                                Email: <a href={`mailto:${PRIVACY_OFFICER_DETAILS.email}`} className="underline">{PRIVACY_OFFICER_DETAILS.email}</a> ({PRIVACY_OFFICER_DETAILS.organization})
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= TAB 5: RETENTION POLICIES ================= */}
                {activeTab === 'retention' && (
                    <div className="space-y-6">
                        <div className="bg-[#11192A] rounded-[32px] border border-white/5 p-6 sm:p-8 space-y-6">
                            <div>
                                <h3 className="text-xl font-black italic uppercase font-poppins">Configurable Data Retention Rules</h3>
                                <p className="text-xs text-slate-400 mt-0.5">RESQR adheres to data minimization and legal retention standards.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(DATA_RETENTION_POLICIES).map(([key, policy]) => (
                                    <div key={key} className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black uppercase text-white font-poppins">{policy.category}</h4>
                                            <Badge className="bg-white/5 text-slate-400 text-[8px] uppercase">CONFIGURABLE</Badge>
                                        </div>
                                        <p className="text-slate-400"><strong className="text-slate-200">Active Retention:</strong> {policy.retentionPeriod}</p>
                                        <p className="text-slate-400"><strong className="text-slate-200">Archival Rule:</strong> {policy.archivalPeriod}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Correction Modal */}
            {isCorrectionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="max-w-md w-full bg-[#11192A] rounded-3xl border border-white/10 p-6 space-y-4">
                        <h3 className="text-lg font-black uppercase text-white">Request Data Correction</h3>
                        <p className="text-xs text-slate-400">Describe the specific information you would like to update or correct:</p>
                        <textarea
                            rows={4}
                            value={requestDesc}
                            onChange={(e) => setRequestDesc(e.target.value)}
                            placeholder="e.g. Please correct medical history entry..."
                            className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button onClick={() => setIsCorrectionModalOpen(false)} variant="outline" className="text-xs">Cancel</Button>
                            <Button onClick={handleSubmitCorrection} disabled={submittingRequest} className="bg-primary text-xs">
                                {submittingRequest ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Modal */}
            {isDeletionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="max-w-md w-full bg-[#11192A] rounded-3xl border border-white/10 p-6 space-y-4">
                        <div className="flex items-center gap-2 text-rose-500 font-black">
                            <AlertTriangle size={20} />
                            <h3 className="text-lg uppercase">Request Account Deletion</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Upon verified deletion, your emergency profile and medical vault are deactivated immediately. Note that financial payment invoices are archived for statutory compliance (GST 7 years) as required by law.
                        </p>
                        <textarea
                            rows={3}
                            value={requestDesc}
                            onChange={(e) => setRequestDesc(e.target.value)}
                            placeholder="Reason for deletion or confirmation notes..."
                            className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button onClick={() => setIsDeletionModalOpen(false)} variant="outline" className="text-xs">Cancel</Button>
                            <Button onClick={handleSubmitDeletion} disabled={submittingRequest} className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
                                {submittingRequest ? 'Submitting...' : 'Confirm Erasure Request'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
