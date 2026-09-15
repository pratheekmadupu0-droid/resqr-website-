import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { Eye, EyeOff, ShieldCheck, Lock, ArrowLeft, Loader2, Check } from 'lucide-react';
import AppLoading from '../components/ui/AppLoading';

/**
 * RESQR Privacy Settings
 * ----------------------
 * Per-field ON/OFF control over what a responder sees after scanning a QR.
 * Saved directly to `users/{uid}/profiles/{pid}/privacy` — always free,
 * never gated behind payment (ordinary profile management).
 *
 * The enforcement lives in the scan flow (QRScanPage) which strips any
 * field set to `false` before rendering the emergency profile.
 */

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
    const [profiles, setProfiles] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [privacy, setPrivacy] = useState(ALL_ON);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Load this account's identity vault and its saved privacy map.
    const loadVault = useCallback(async (uid) => {
        setLoading(true);
        try {
            const snap = await get(ref(db, `users/${uid}/profiles`));
            if (snap.exists()) {
                const list = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
                setProfiles(list);
                const stored = localStorage.getItem('resqr_active_profile_id');
                const active = list.find(p => p.id === stored) || list[0];
                if (active) {
                    setActiveId(active.id);
                    setPrivacy({ ...ALL_ON, ...(active.privacy || {}) });
                }
            } else {
                setProfiles([]);
            }
        } catch (err) {
            console.error('Privacy vault load failed:', err);
            toast.error('Unable to load your privacy settings. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) loadVault(user.uid);
            else setLoading(false);
        });
        return () => unsub();
    }, [loadVault]);

    const toggleField = (key) => {
        setPrivacy(p => ({ ...p, [key]: !p[key] }));
        setDirty(true);
    };

    const setAll = (value) => {
        setPrivacy(Object.fromEntries(PRIVACY_FIELDS.map(f => [f.key, value])));
        setDirty(true);
    };

    const handleSave = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid || !activeId) return;
        setSaving(true);
        const t = toast.loading('Updating privacy settings…');
        try {
            await set(ref(db, `users/${uid}/profiles/${activeId}/privacy`), privacy);
            const local = JSON.parse(localStorage.getItem('resqr_profiles') || '[]');
            const idx = local.findIndex(p => p.id === activeId);
            if (idx !== -1) { local[idx] = { ...local[idx], privacy }; localStorage.setItem('resqr_profiles', JSON.stringify(local)); }
            toast.success('Privacy settings updated successfully.', { id: t });
            setDirty(false);
        } catch (err) {
            console.error('Privacy save failed:', err);
            toast.error('Unable to save changes. Please try again.', { id: t });
        } finally {
            setSaving(false);
        }
    };

    const switchProfile = (id) => {
        setActiveId(id);
        localStorage.setItem('resqr_active_profile_id', id);
        const p = profiles.find(x => x.id === id);
        setPrivacy({ ...ALL_ON, ...(p?.privacy || {}) });
        setDirty(false);
    };

    if (loading) return <AppLoading message="Loading your privacy settings…" />;

    // Not signed in — ask the user to re-authenticate
    if (!auth.currentUser) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center px-4 py-24">
                <div className="max-w-md w-full bg-[#11192A] rounded-[40px] border border-white/5 p-10 text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Lock size={26} /></div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white font-poppins">Session Expired</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed">Sign in again to manage your emergency privacy settings.</p>
                    <Link to="/login" className="btn-app-primary w-full justify-center">AUTHENTICATE PORTAL</Link>
                </div>
            </div>
        );
    }

    // No identity created yet
    if (profiles.length === 0) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center px-4 py-24">
                <div className="max-w-md w-full bg-[#11192A] rounded-[40px] border border-white/5 p-10 text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold"><ShieldCheck size={26} /></div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white font-poppins">No Identity Yet</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed">Create your RESQR identity first — then decide exactly what a scanner can see.</p>
                    <Link to="/create-identity" className="btn-app-primary w-full justify-center">CREATE MY RESQR</Link>
                </div>
            </div>
        );
    }

    const activeProfile = profiles.find(p => p.id === activeId) || profiles[0];
    const visibleCount = PRIVACY_FIELDS.filter(f => privacy[f.key] !== false).length;

    return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-primary/30 relative overflow-hidden">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 lg:py-24 space-y-8 relative z-10">

                {/* ===== Header ===== */}
                <header className="space-y-3">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back to dashboard
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0"><ShieldCheck size={22} /></div>
                        <div className="min-w-0">
                            <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter font-poppins leading-none">PRIVACY SETTINGS</h1>
                            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mt-1.5">CONTROL WHAT A SCANNER SEES · ALWAYS FREE</p>
                        </div>
                    </div>
                </header>

                {/* ===== Profile switcher (multi-identity vaults) ===== */}
                {profiles.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                        {profiles.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => switchProfile(p.id)}
                                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${p.id === activeId ? 'bg-primary border-primary text-white' : 'bg-[#11192A] border-white/10 text-slate-400 hover:border-white/25 hover:text-white'}`}
                            >
                                {p.data?.name || 'Identity Node'} {p.identityType && `(${p.identityType})`}
                            </button>
                        ))}
                    </div>
                )}

                {/* ===== Explanation ===== */}
                <div className="bg-[#11192A] rounded-[32px] border border-white/5 p-6 flex items-start gap-4">
                    <Eye size={20} className="text-gold shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                        Only the information you choose to share will appear on your emergency profile.
                        Hidden fields are stripped <span className="text-white font-bold">before</span> anything reaches a scanner — the raw data is never sent.
                    </p>
                </div>


                {/* ===== Field toggles (grouped) ===== */}
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

                {/* ===== Bulk actions ===== */}
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setAll(true)} className="flex-1 py-3.5 rounded-2xl bg-[#11192A] border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-all">Show Everything</button>
                    <button type="button" onClick={() => setAll(false)} className="flex-1 py-3.5 rounded-2xl bg-[#11192A] border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-primary/40 hover:text-primary transition-all">Hide Everything</button>
                </div>



                {/* ===== Sticky-style save bar ===== */}
                <div className="sticky bottom-24 lg:bottom-6 z-20">
                    <div className="bg-[#0B1322]/95 backdrop-blur border border-white/10 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-relaxed shrink-0">
                            {visibleCount}/10 fields visible<br />
                            <span className="text-gold">to emergency scanners</span>
                        </p>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !dirty}
                            className={`btn-app-primary px-8 shrink-0 ${(!dirty || saving) ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : dirty ? <Check size={16} /> : <Check size={16} className="opacity-40" />}
                            {saving ? 'Saving…' : dirty ? 'SAVE CHANGES' : 'SAVED'}
                        </button>
                    </div>
                </div>

                <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600 pb-8">
                    Privacy applies instantly · No payment required
                </p>
            </div>
        </div>
    );
}
