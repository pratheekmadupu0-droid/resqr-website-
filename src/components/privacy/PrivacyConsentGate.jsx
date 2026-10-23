import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, ShieldCheck, Lock, ChevronDown, ChevronUp, 
    Check, AlertCircle, Eye, FileText, User, HeartPulse, 
    PhoneCall, QrCode, MapPin, Camera, ExternalLink, X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { 
    DATA_CATEGORIES, 
    CONSENT_DEFINITIONS, 
    PRIVACY_POLICY_VERSION,
    ROLE_ACCESS_MATRIX 
} from '../../lib/privacyConfig';

export default function PrivacyConsentGate({
    isOpen,
    onClose,
    onAcceptConsent,
    userName = '',
    userEmail = '',
    isMandatoryModal = true
}) {
    const [isExpandedCategories, setIsExpandedCategories] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showRoleMatrix, setShowRoleMatrix] = useState(false);

    // Consent checkboxes state
    const [requiredConsent, setRequiredConsent] = useState(true);
    const [optionalLocation, setOptionalLocation] = useState(false);
    const [optionalMarketing, setOptionalMarketing] = useState(false);
    const [optionalFeatures, setOptionalFeatures] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleAccept = async () => {
        if (!requiredConsent) return;
        setSubmitting(true);
        const consentPayload = {
            accepted: true,
            version: PRIVACY_POLICY_VERSION,
            timestamp: new Date().toISOString(),
            required: true,
            optionalLocation,
            optionalMarketing,
            optionalFeatures,
            userEmail,
            userAgent: navigator.userAgent
        };
        try {
            await onAcceptConsent(consentPayload);
        } catch (err) {
            console.error("Error committing consent:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const getIconForCategory = (id) => {
        switch (id) {
            case 'account': return <User size={18} className="text-primary" />;
            case 'profile': return <FileText size={18} className="text-emerald-400" />;
            case 'emergency_contacts': return <PhoneCall size={18} className="text-amber-400" />;
            case 'medical': return <HeartPulse size={18} className="text-red-400" />;
            case 'insurance': return <Shield size={18} className="text-cyan-400" />;
            case 'qr_identity': return <QrCode size={18} className="text-violet-400" />;
            case 'technical': return <Lock size={18} className="text-slate-400" />;
            case 'location': return <MapPin size={18} className="text-yellow-400" />;
            case 'biometric': return <Camera size={18} className="text-blue-400" />;
            default: return <ShieldCheck size={18} className="text-primary" />;
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white text-slate-900 dark:bg-[#0B1120] dark:text-white rounded-[32px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col font-manrope"
                >
                    {/* Header */}
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-red-500/10 via-slate-100 to-transparent dark:from-red-500/15 dark:via-slate-900/60 dark:to-transparent border-b border-slate-200 dark:border-white/5 flex items-start justify-between">
                        <div className="flex items-start gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                <ShieldCheck size={26} />
                            </div>
                            <div>
                                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black tracking-widest uppercase mb-1.5">
                                    PRIVACY & DATA PROTECTION
                                </Badge>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white font-poppins">
                                    Your Privacy Matters
                                </h2>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed max-w-lg">
                                    RESQR collects and processes information needed to provide emergency identification, emergency communication, account management and authorised medical-access services.
                                </p>
                            </div>
                        </div>

                        {!isMandatoryModal && onClose && (
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
                        {/* Expandable "What information may be collected?" */}
                        <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-50/70 dark:bg-slate-950/50">
                            <button
                                type="button"
                                onClick={() => setIsExpandedCategories(!isExpandedCategories)}
                                className="w-full p-4 flex items-center justify-between text-left font-black text-sm uppercase tracking-wide text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    <span>What information may be collected & why?</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                    <span>{isExpandedCategories ? 'Collapse' : '9 Categories'}</span>
                                    {isExpandedCategories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </button>

                            {isExpandedCategories && (
                                <div className="p-4 pt-0 space-y-3 border-t border-slate-200 dark:border-white/5">
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-3">
                                        RESQR follows strict data minimisation principles. Information is collected only for specified emergency and clinical purposes:
                                    </p>
                                    
                                    <div className="space-y-2.5">
                                        {DATA_CATEGORIES.map((cat) => (
                                            <div 
                                                key={cat.id}
                                                className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-white/5 space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                                                        {getIconForCategory(cat.id)}
                                                        <span>{cat.title}</span>
                                                    </div>
                                                    {cat.isOptional && (
                                                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                            Optional Field
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                                                    <strong>Purpose:</strong> {cat.purpose}
                                                </p>
                                                {cat.id === 'biometric' && (
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 rounded-lg text-[10px] text-blue-800 dark:text-blue-300 space-y-1 ml-6">
                                                        <p className="font-bold">✓ Biometric Notice:</p>
                                                        <p>• Mathematical 128D neural templates are derived for 1:1 emergency bedside matching.</p>
                                                        <p>• Raw facial images are stored locally in your encrypted identity vault.</p>
                                                        <p>• Only authorized hospitals can perform live face-matching during trauma emergencies.</p>
                                                        <p>• You retain full control to re-enroll or delete biometric templates in Privacy Settings.</p>
                                                    </div>
                                                )}
                                                {cat.id === 'location' && (
                                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-500/20 rounded-lg text-[10px] text-yellow-800 dark:text-yellow-300 space-y-0.5 ml-6">
                                                        <p className="font-bold">✓ Location Notice:</p>
                                                        <p>• GPS is collected only upon active QR scan or SOS dispatch. Background location is never tracked.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Granular Consent Checkboxes */}
                        <div className="space-y-3.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 italic block">
                                Choose Your Consent Preferences:
                            </label>

                            {/* Required Account Processing */}
                            <label className="p-4 bg-primary/5 dark:bg-primary/10 border-2 border-primary/40 rounded-2xl flex items-start gap-3.5 cursor-pointer transition-all">
                                <input 
                                    type="checkbox"
                                    checked={requiredConsent}
                                    onChange={(e) => setRequiredConsent(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary accent-primary shrink-0"
                                />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                                            {CONSENT_DEFINITIONS.required.title}
                                        </span>
                                        <span className="text-[8px] font-black uppercase bg-primary text-white px-2 py-0.5 rounded-full">
                                            MANDATORY
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {CONSENT_DEFINITIONS.required.description}
                                    </p>
                                </div>
                            </label>

                            {/* Optional: Location */}
                            <label className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl flex items-start gap-3.5 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all">
                                <input 
                                    type="checkbox"
                                    checked={optionalLocation}
                                    onChange={(e) => setOptionalLocation(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary accent-primary shrink-0"
                                />
                                <div className="space-y-0.5">
                                    <span className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                        {CONSENT_DEFINITIONS.optionalLocation.title}
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {CONSENT_DEFINITIONS.optionalLocation.description}
                                    </p>
                                </div>
                            </label>

                            {/* Optional: Communications / Marketing */}
                            <label className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl flex items-start gap-3.5 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all">
                                <input 
                                    type="checkbox"
                                    checked={optionalMarketing}
                                    onChange={(e) => setOptionalMarketing(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary accent-primary shrink-0"
                                />
                                <div className="space-y-0.5">
                                    <span className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                        {CONSENT_DEFINITIONS.optionalMarketing.title}
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {CONSENT_DEFINITIONS.optionalMarketing.description}
                                    </p>
                                </div>
                            </label>

                            {/* Optional: Beta Safety Features */}
                            <label className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl flex items-start gap-3.5 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-all">
                                <input 
                                    type="checkbox"
                                    checked={optionalFeatures}
                                    onChange={(e) => setOptionalFeatures(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary accent-primary shrink-0"
                                />
                                <div className="space-y-0.5">
                                    <span className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                        {CONSENT_DEFINITIONS.optionalFeatures.title}
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {CONSENT_DEFINITIONS.optionalFeatures.description}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Legal Links & Trust Indicators */}
                        <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-4 flex-wrap">
                                <Link to="/legal" target="_blank" className="hover:text-primary underline flex items-center gap-1 font-bold">
                                    Privacy Notice <ExternalLink size={10} />
                                </Link>
                                <Link to="/legal" target="_blank" className="hover:text-primary underline flex items-center gap-1 font-bold">
                                    Terms of Service <ExternalLink size={10} />
                                </Link>
                                <Link to="/privacy-settings" target="_blank" className="hover:text-primary underline flex items-center gap-1 font-bold">
                                    Manage Privacy Settings <ExternalLink size={10} />
                                </Link>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                Policy Version: {PRIVACY_POLICY_VERSION}
                            </span>
                        </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-[11px] text-slate-500 text-center sm:text-left">
                            {!requiredConsent ? (
                                <span className="text-red-500 font-bold flex items-center gap-1.5">
                                    <AlertCircle size={14} /> Please check required account processing to continue.
                                </span>
                            ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                    <Check size={14} /> Ready to proceed securely.
                                </span>
                            )}
                        </div>

                        <Button
                            onClick={handleAccept}
                            disabled={!requiredConsent || submitting}
                            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-red-700 text-white font-black italic uppercase tracking-wider text-xs rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Saving Consent...' : 'Agree & Continue'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
