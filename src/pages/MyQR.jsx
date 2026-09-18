import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import {
    QrCode, Download, Share2, Copy, ScanLine, Printer, Shield, Eye,
    AlertTriangle, HeartPulse, Phone, AtSign, Droplet, Pill, Scissors,
    Sparkles, RefreshCw, CheckCircle2, MapPin
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import AppLoading from '../components/ui/AppLoading';
import RESQRQRCodeCard from '../components/common/RESQRQRCodeCard';

/**
 * MyQR — "MY RESQR" identity console.
 *
 * The dedicated place to view, download, print and share the scannable
 * emergency tag for any identity stored in the user's RESQR vault.
 *
 * NOTE: Viewing and re-issuing your own tag is always free — no payment
 * step is required anywhere on this page.
 */
export default function MyQR() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState(null);

    const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];
    const resolved = resolveProfile(activeProfile);
    const username = activeProfile?.username || '';
    const qrValue = activeProfile
        ? (username
            ? `${window.location.origin}/${username}`
            : `${window.location.origin}/qr/${activeProfile.id}`)
        : '';

    /* ---------------- vault subscription ---------------- */
    useEffect(() => {
        let unsubscribe;
        const init = () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }
            const uid = auth.currentUser.uid;
            unsubscribe = onValue(ref(db, `users/${uid}/profiles`), (snapshot) => {
                const rows = snapshot.exists()
                    ? Object.entries(snapshot.val()).map(([id, p]) => ({ id, ...p })).reverse()
                    : [];
                setProfiles(rows);
                setLoading(false);
            }, (error) => {
                console.error('Failed to load RESQR vault:', error);
                setLoading(false);
            });
        };

        if (auth.currentUser) {
            init();
            return () => { if (unsubscribe) unsubscribe(); };
        }

        const timer = setTimeout(() => { if (auth.currentUser) init(); else setLoading(false); }, 1000);
        return () => { clearTimeout(timer); if (unsubscribe) unsubscribe(); };
    }, []);

    useEffect(() => {
        if (profiles.length > 0 && !selectedProfileId) {
            setSelectedProfileId(profiles[0].id);
        }
    }, [profiles, selectedProfileId]);

    /* ---------------- tag compositing (shared by download + print) ---------------- */
    const composeTagDataUrl = useCallback(async () => {
        const canvas = document.getElementById('my-qr-canvas');
        if (!canvas) throw new Error('QR canvas not ready');

        const out = document.createElement('canvas');
        const ctx = out.getContext('2d');
        const CANVAS_W = 1200;
        const CANVAS_H = 1600;
        out.width = CANVAS_W;
        out.height = CANVAS_H;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Brand mark
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = `${import.meta.env.BASE_URL}resqr_qr_logo.png`;
        await new Promise((resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = () => reject(new Error('Failed to load logo for tag export'));
        });

        const logoW = 480;
        const logoH = (logo.height / logo.width) * logoW || 189;
        ctx.drawImage(logo, (CANVAS_W - logoW) / 2, 70, logoW, logoH);

        // QR Code Matrix
        ctx.drawImage(canvas, (CANVAS_W - 720) / 2, logoH + 130, 720, 720);

        // Dynamic Registered User Name at Bottom of QR Code
        const userNameText = (resolved.name || activeProfile?.name || 'REGISTERED HOLDER').toUpperCase();
        ctx.fillStyle = '#0F172A';
        ctx.font = 'italic 900 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(userNameText, CANVAS_W / 2, logoH + 130 + 720 + 80);

        ctx.fillStyle = '#E63946';
        ctx.font = 'italic 900 44px sans-serif';
        ctx.fillText('SCAN IN EMERGENCY', CANVAS_W / 2, logoH + 130 + 720 + 150);

        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('POWERED BY RESQR.CO.IN', CANVAS_W / 2, CANVAS_H - 60);

        return out.toDataURL('image/png', 1.0);
    }, [resolved.name, activeProfile]);

    const tagFileName = `RESQR_${(username || activeProfile?.id || 'TAG').split('_').pop()}`.toUpperCase();

    const handleDownload = async () => {
        const t = toast.loading('Synthesizing print-ready tag...');
        try {
            const dataUrl = await composeTagDataUrl();
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${tagFileName}.png`;
            link.click();
            toast.success('Tag downloaded', { id: t });
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Download failed', { id: t });
        }
    };

    const handlePrint = async () => {
        const t = toast.loading('Preparing print sheet...');
        try {
            const dataUrl = await composeTagDataUrl();
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast.error('Allow pop-ups to print your tag', { id: t });
                return;
            }
            printWindow.document.write(
                `<html><head><title>${tagFileName}</title></head>` +
                `<body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff">` +
                `<img src="${dataUrl}" style="width:100%;max-width:760px" onload="window.focus();window.print();" />` +
                `</body></html>`
            );
            printWindow.document.close();
            toast.success('Print sheet ready', { id: t });
        } catch (error) {
            console.error('Print failed:', error);
            toast.error('Print failed', { id: t });
        }
    };

    const copyLink = async () => {
        if (!qrValue) return;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(qrValue);
            } else {
                const helper = document.createElement('textarea');
                helper.value = qrValue;
                document.body.appendChild(helper);
                helper.select();
                document.execCommand('copy');
                document.body.removeChild(helper);
            }
            toast.success('Emergency link copied');
        } catch (error) {
            console.error('Copy failed:', error);
            toast.error('Could not copy link');
        }
    };

    const handleShare = async () => {
        if (!qrValue) return;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'My RESQR Emergency ID',
                    text: 'Scan or open my RESQR emergency profile.',
                    url: qrValue
                });
            } else {
                await copyLink();
            }
        } catch (error) {
            // user dismissed the native share sheet — nothing to do
        }
    };

    const openEmergencyPreview = () => {
        if (!activeProfile) return;
        const target = username ? `/${username}` : `/qr/${activeProfile.id}`;
        window.open(target, '_blank', 'noopener');
    };

    const refreshQr = () => {
        setSelectedProfileId(null);
        toast.success('Tag re-synchronized');
    };

    /* ---------------- render guards ---------------- */
    if (loading) return <AppLoading message="Loading your RESQR identity..." />;

    if (!auth.currentUser) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center text-white p-6 font-manrope">
                <div className="text-center max-w-sm space-y-6">
                    <Shield size={48} className="text-primary mx-auto animate-pulse" />
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Session Expired</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Re-authenticate to view your scannable RESQR identity.
                    </p>
                    <Button onClick={() => navigate('/login')} className="w-full py-4 bg-primary text-white rounded-2xl font-black italic uppercase text-xs">
                        AUTHENTICATE PORTAL
                    </Button>
                </div>
            </div>
        );
    }

    if (profiles.length === 0) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center text-white p-6 font-manrope relative overflow-hidden">
                <div className="text-center max-w-md space-y-6 relative z-10">
                    <QrCode size={48} className="text-primary mx-auto" />
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">No Identity Node Yet</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        Create your first emergency identity to generate a scannable RESQR tag.
                    </p>
                    <Button onClick={() => navigate('/create-identity')} className="w-full py-4 bg-primary text-white rounded-2xl font-black italic uppercase text-xs">
                        CREATE IDENTITY
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-primary/30 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 lg:py-28 space-y-10 relative z-10">
                {/* ===== header ===== */}
                <header className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-px w-10 bg-gradient-to-r from-transparent via-gold to-transparent" />
                        <Badge variant="warning" className="border-gold/30 text-gold bg-gold/5">
                            <Sparkles size={11} /> Emergency Tag Console
                        </Badge>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter font-poppins leading-none">
                        MY <span className="bg-gradient-to-r from-gold-light via-gold to-gold-dark bg-clip-text text-transparent">RESQR</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-[0.28em] max-w-2xl leading-relaxed">
                        One scannable code carrying your entire emergency identity. Scan it, print it, stick it — no fees, no waiting.
                    </p>
                </header>

                {/* ===== identity switcher ===== */}
                {profiles.length > 1 && (
                    <div className="flex flex-wrap gap-3">
                        {profiles.map((p) => {
                            const meta = resolveProfile(p);
                            const isActive = activeProfile?.id === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedProfileId(p.id)}
                                    className={`h-14 px-5 rounded-2xl border text-[10px] font-black uppercase italic tracking-widest transition-all flex items-center gap-2 ${isActive
                                        ? 'bg-gold/10 border-gold/40 text-gold shadow-gold-glow'
                                        : 'bg-[#11192A] border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300'}`}
                                >
                                    <QrCode size={14} />
                                    {meta.name || 'Identity Node'}
                                    {p.identityType ? ` (${p.identityType})` : ''}
                                </button>
                            );
                        })}
                    </div>
                )}
<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-8 items-start">
                    {/* ===== scannable tag ===== */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-[#11192A] rounded-[44px] border border-white/5 overflow-hidden shadow-card-premium"
                    >
                        <RESQRQRCodeCard
                            canvasId="my-qr-canvas"
                            qrValue={qrValue || 'https://resqr.co.in'}
                            userName={resolved.name || activeProfile?.name || 'REGISTERED HOLDER'}
                            size={210}
                            showBorder={false}
                            className="rounded-t-[44px] rounded-b-none"
                        />

                        <div className="bg-[#050B18] p-7 space-y-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Personalized Link</p>
                                    <p className="text-xs font-black text-emerald-400 lowercase truncate mt-1">
                                        {username ? `resqr.co.in/${username}` : `resqr.co.in/qr/${activeProfile?.id?.slice(-8)}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshQr}
                                    className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                                    aria-label="Re-synchronize tag"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>

                            <Button
                                onClick={handleDownload}
                                className="w-full h-16 bg-primary hover:bg-primary-dark text-white font-black italic uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                DOWNLOAD TAG <Download size={18} />
                            </Button>
                            <Button
                                onClick={openEmergencyPreview}
                                variant="outline"
                                className="w-full h-14 bg-transparent text-white border-white/10 hover:bg-white/5 hover:border-white/20 font-black italic uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3"
                            >
                                EMERGENCY PREVIEW <Eye size={16} />
                            </Button>
                        </div>
                    </motion.div>

                    {/* ===== right column ===== */}
                    <div className="space-y-6 min-w-0">
                        {/* quick actions */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <QuickAction icon={Copy} label="Copy Link" onClick={copyLink} />
                            <QuickAction icon={Share2} label="Share" onClick={handleShare} />
                            <QuickAction icon={Printer} label="Print" onClick={handlePrint} />
                            <QuickAction icon={ScanLine} label="Scan" onClick={() => navigate('/scanner')} />
                        </div>

                        {/* responder view */}
                        <div className="bg-[#11192A] rounded-[36px] border border-white/5 overflow-hidden">
                            <div className="p-7 border-b border-white/5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <Shield size={18} className="text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-black italic uppercase tracking-tighter font-poppins truncate">Responder View</h2>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em]">Exactly what a scan reveals</p>
                                    </div>
                                </div>
                                <Badge variant="success">Live</Badge>
                            </div>

                            <div className="p-7 space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Registered Name</p>
                                        <p className="text-2xl font-black italic uppercase tracking-tighter font-poppins truncate">
                                            {resolved.name || 'Unnamed Identity'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                            {resolved.identityType}{resolved.age ? ` • ${resolved.age} YRS` : ''}{resolved.gender ? ` • ${resolved.gender}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#050B18] border border-white/5">
                                        <Droplet size={18} className="text-[#E63946]" />
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Blood Group</p>
                                            <p className="text-2xl font-black italic text-[#E63946] font-poppins leading-none">{resolved.bloodGroup || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoTile icon={AlertTriangle} tone="amber" label="Allergies" value={resolved.allergies} fallback="None reported" />
                                    <InfoTile icon={HeartPulse} tone="blue" label="Medical Conditions" value={resolved.medicalConditions} fallback="No pre-existing conditions" />
                                    <InfoTile icon={Pill} tone="violet" label="Current Medication" value={resolved.currentMedication} fallback="Not on medication" />
                                    <InfoTile icon={Scissors} tone="slate" label="Previous Surgeries" value={resolved.previousSurgeries} fallback="None recorded" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-3xl bg-[#050B18] border border-white/5 space-y-3">
                                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                                            <Phone size={12} className="text-emerald-400" /> Emergency Contacts
                                        </p>
                                        {resolved.emergencyContacts.length > 0 ? resolved.emergencyContacts.map((c, i) => (
                                            <div key={i} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-300">
                                                <span className="truncate">{c.name || 'Contact'}{c.relationship ? ` (${c.relationship})` : ''}</span>
                                                <span className="text-emerald-400 font-mono shrink-0">{c.phone || '—'}</span>
                                            </div>
                                        )) : (
                                            <p className="text-xs font-bold text-slate-600 italic">No emergency contact on file</p>
                                        )}
                                    </div>

                                    <div className="p-5 rounded-3xl bg-[#050B18] border border-white/5 space-y-3">
                                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-2">
                                            <Shield size={12} className="text-primary" /> Insurance & Identity
                                        </p>
                                        <div className="text-xs font-bold text-slate-300 space-y-1.5">
                                            <p className="truncate">{resolved.insuranceCompany || 'No insurer linked'}</p>
                                            <p className="text-slate-500 font-mono text-[11px] uppercase truncate">
                                                {resolved.policyNumber || 'POLICY —'}
                                            </p>
                                            <p className="text-slate-500 font-mono text-[11px] uppercase truncate flex items-center gap-1.5">
                                                <AtSign size={11} /> {resolved.medicalId || activeProfile?.id || '—'}
                                            </p>
                                            {resolved.isOrganDonor && (
                                                <p className="text-gold text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> Organ Donor
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {(resolved.city || resolved.state) && (
                                    <div className="p-5 rounded-3xl bg-[#050B18] border border-white/5 flex items-center gap-3">
                                        <MapPin size={15} className="text-slate-500 shrink-0" />
                                        <p className="text-xs font-bold text-slate-400 truncate">
                                            {[resolved.city, resolved.district, resolved.state, resolved.pincode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* manage + share strip */}
                        <div className="bg-gradient-to-br from-[#11192A] to-[#050B18] rounded-[36px] border border-white/5 p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="space-y-2">
                                <h3 className="text-lg font-black italic uppercase tracking-tighter font-poppins">Need to change something?</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                    Profile updates are instant and free — your QR tag keeps working, no re-purchase needed.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 shrink-0">
                                <Link to="/dashboard">
                                    <Button variant="outline" className="h-12 px-5 bg-transparent border-white/10 text-white font-black italic uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/5">
                                        EDIT PROFILE
                                    </Button>
                                </Link>
                                <Link to="/pricing">
                                    <Button className="h-12 px-5 bg-gold text-black hover:bg-gold-light font-black italic uppercase text-[10px] tracking-widest rounded-2xl shadow-gold-glow">
                                        PHYSICAL TAG
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================= helpers ================= */

function QuickAction({ icon: Icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="h-24 rounded-3xl bg-[#11192A] border border-white/5 hover:border-gold/30 hover:bg-[#151F33] transition-all flex flex-col items-center justify-center gap-2 group"
        >
            <Icon size={20} className="text-slate-400 group-hover:text-gold transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

function InfoTile({ icon: Icon, label, value, fallback, tone = 'slate' }) {
    const tones = {
        amber: 'text-amber-400 bg-amber-500/5 border-amber-500/10',
        blue: 'text-blue-400 bg-blue-500/5 border-blue-500/10',
        violet: 'text-violet-400 bg-violet-500/5 border-violet-500/10',
        slate: 'text-slate-400 bg-white/5 border-white/10'
    };

    return (
        <div className={`p-5 rounded-3xl border ${tones[tone]} space-y-2`}>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Icon size={12} /> {label}
            </p>
            <p className="text-xs font-bold text-slate-200 leading-relaxed">{value || fallback}</p>
        </div>
    );
}

/**
 * Normalizes the different profile shapes stored in Firebase
 * (profile.data / profile.medical / profile.emergencyContacts / profile.insurance)
 * into one flat object for rendering.
 */
function resolveProfile(profile) {
    if (!profile) {
        return {
            name: '', identityType: 'Citizen', age: '', gender: '', bloodGroup: '', allergies: '',
            medicalConditions: '', currentMedication: '', previousSurgeries: '', medicalId: '',
            insuranceCompany: '', policyNumber: '', isOrganDonor: false,
            emergencyContacts: [], city: '', district: '', state: '', pincode: ''
        };
    }

    const data = profile.data || {};
    const medical = profile.medical || {};
    const insurance = profile.insurance || {};
    const address = profile.address || {};
    const contacts = Array.isArray(profile.emergencyContacts)
        ? profile.emergencyContacts.filter(Boolean)
        : (profile.emergencyContactPhone ? [{
            name: profile.emergencyContactName || 'Emergency Contact',
            relationship: profile.emergencyContactRelation || '',
            phone: profile.emergencyContactPhone
        }] : []);

    return {
        name: data.name || profile.name || profile.fullName || '',
        identityType: profile.identityType || data.identityType || 'Citizen',
        age: data.age || profile.age || '',
        gender: data.gender || profile.gender || '',
        bloodGroup: data.bloodGroup || medical.bloodGroup || profile.bloodGroup || '',
        allergies: data.allergies || medical.allergies || profile.allergies || '',
        medicalConditions: data.healthIssues || medical.medicalConditions || profile.medicalConditions || '',
        currentMedication: data.currentMedication || medical.currentMedication || '',
        previousSurgeries: data.previousSurgeries || medical.previousSurgeries || profile.previousSurgeries || '',
        medicalId: data.medicalId || medical.medicalId || profile.medicalId || '',
        insuranceCompany: insurance.insuranceCompany || '',
        policyNumber: insurance.policyNumber || '',
        isOrganDonor: !!(data.isOrganDonor || medical.isOrganDonor || profile.isOrganDonor),
        emergencyContacts: contacts,
        city: address.city || '',
        district: address.district || '',
        state: address.state || '',
        pincode: address.pincode || ''
    };
}