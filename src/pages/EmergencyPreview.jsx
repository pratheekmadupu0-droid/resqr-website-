import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, QrCode, LayoutDashboard, ArrowLeft, Sparkles } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import AppLoading from '../components/ui/AppLoading';
import EmergencyProfileView from '../components/emergency/EmergencyProfileView';

/**
 * EmergencyPreview — the owner seeing exactly what a responder sees.
 *
 * Flow: Dashboard → Emergency Profile → Preview
 * No payment and no six-step setup: it simply renders the saved profile.
 */

const normalize = (raw) => {
    const data = raw.data || {};
    const medical = raw.medical || {};
    const insurance = raw.insurance || {};
    const address = raw.address || {};
    const firstContact = Array.isArray(raw.emergencyContacts) ? raw.emergencyContacts[0] || {} : {};

    return {
        data: {
            ...data,
            name: data.name || raw.name || raw.fullName || '',
            age: data.age || raw.age || '',
            gender: data.gender || raw.gender || '',
            bloodGroup: data.bloodGroup || medical.bloodGroup || raw.bloodGroup || '',
            healthIssues: data.healthIssues || medical.medicalConditions || raw.medicalConditions || '',
            allergies: data.allergies || medical.allergies || raw.allergies || '',
            currentMedication: data.currentMedication || medical.currentMedication || '',
            previousSurgeries: data.previousSurgeries || medical.previousSurgeries || '',
            emergencyNotes: data.emergencyNotes || medical.emergencyNotes || '',
            isOrganDonor: data.isOrganDonor || medical.isOrganDonor || false,
            emergencyContactName: firstContact.name || raw.emergencyContactName || '',
            emergencyContactRelation: firstContact.relationship || raw.emergencyContactRelation || '',
            emergencyContactPhone: firstContact.phone || raw.emergencyContactPhone || '',
        },
        insurance,
        address,
    };
};

export default function EmergencyPreview() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState('loading'); // loading | ready | empty | signed-out
    const [profile, setProfile] = useState(null);

    const load = useCallback(async () => {
        setState('loading');
        setLoading(true);

        try {
            if (!auth.currentUser) {
                setState('signed-out');
                return;
            }

            const uid = auth.currentUser.uid;
            const activeSlug = localStorage.getItem('resqr_active_slug');

            if (activeSlug) {
                const activeSnap = await get(ref(db, `users/${uid}/profiles/${activeSlug}`));
                if (activeSnap.exists()) {
                    setProfile(normalize(activeSnap.val()));
                    setState('ready');
                    return;
                }
            }

            const listSnap = await get(ref(db, `users/${uid}/profiles`));
            if (listSnap.exists()) {
                const [slug, raw] = Object.entries(listSnap.val()).reverse()[0];
                localStorage.setItem('resqr_active_slug', slug);
                setProfile(normalize(raw));
                setState('ready');
            } else {
                setState('empty');
            }
        } catch (error) {
            console.error('PREVIEW_LOAD_FAILED', error);
            setState('empty');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading || state === 'loading') {
        return <AppLoading message="Preparing your emergency profile preview..." />;
    }

    if (state === 'signed-out') {
        return (
            <div className="min-h-screen bg-[#040812] text-white flex items-center justify-center px-5 py-24 font-manrope">
                <div className="max-w-md w-full text-center space-y-6">
                    <Eye size={44} className="mx-auto text-primary" />
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">Sign in to preview</h1>
                    <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                        Your emergency profile preview is private to your RESQR account.
                    </p>
                    <Link to="/login?redirect_to=/emergency-preview" className="btn-app-primary w-full">
                        LOGIN TO CONTINUE
                    </Link>
                    <Link to="/" className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors">
                        Back to home
                    </Link>
                </div>
            </div>
        );
    }

    if (state === 'empty') {
        return (
            <div className="min-h-screen bg-[#040812] text-white flex items-center justify-center px-5 py-24 font-manrope">
                <div className="max-w-md w-full text-center space-y-6">
                    <QrCode size={44} className="mx-auto text-gold" />
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">No emergency profile yet</h1>
                    <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                        Create your RESQR to generate a scannable emergency profile.
                    </p>
                    <Link to="/login" className="btn-app-primary w-full">CREATE MY RESQR</Link>
                    <Link to="/dashboard" className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors">
                        Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }
return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope">
            <div className="max-w-3xl mx-auto px-5 py-10 sm:py-14 space-y-7">
                {/* ===== Header ===== */}
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={14} /> Dashboard
                    </button>
                    <Link to="/my-qr" className="btn-app-secondary" style={{ minHeight: 42 }}>
                        <QrCode size={15} /> My RESQR
                    </Link>
                </header>

                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 status-pill status-pill-warning">
                        <Sparkles size={13} /> Preview mode
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter font-poppins leading-none">
                        Emergency Profile <span className="text-gradient-red">Preview</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-slate-500 max-w-xl mx-auto leading-relaxed">
                        This is exactly what a responder sees after scanning your RESQR tag.
                    </p>
                </div>

                {/* ===== The profile, exactly as scanners see it ===== */}
                <EmergencyProfileView
                    data={profile?.data}
                    insurance={profile?.insurance}
                    address={profile?.address}
                    mode="preview"
                />

                {/* ===== CTA ===== */}
                <div className="em-card p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div>
                        <h2 className="text-lg font-black italic uppercase tracking-tighter font-poppins">Something missing?</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1.5">
                            Updates are instant and always free.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link to="/dashboard" className="btn-app-primary">
                            <LayoutDashboard size={16} /> Edit profile
                        </Link>
                        <Link to="/my-qr" className="btn-app-outline">
                            <QrCode size={16} /> My QR
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}