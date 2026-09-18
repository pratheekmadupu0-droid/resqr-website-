import { AlertTriangle, HeartPulse, Pill, Scissors, Droplet, ShieldCheck, CreditCard, Building2, Info, Lock, Stethoscope } from 'lucide-react';
import { Badge } from '../ui/Badge';

/**
 * EmergencyInfoSections — renderer for the Authorized Medical Profile.
 *
 * Rules:
 *  - Only accessible to authorized medical personnel (paramedics, ER doctors, hospitals).
 *  - Stripped from public emergency view to protect patient privacy.
 *  - Only fields that actually contain information are rendered.
 *  - Raw identifiers (uid / profile slug / tokens) are NEVER displayed.
 */

const clean = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') return '';
    return text;
};

export default function EmergencyInfoSections({ 
    data = {}, 
    insurance = {}, 
    className = '',
    isAuthorized = false,
    onLock
}) {
    const bloodGroup = clean(data.bloodGroup || data.blood_group);
    const allergies = clean(data.allergies);
    const conditions = clean(data.healthIssues || data.medicalConditions || data.conditions || data.medicalHistory);
    const medications = clean(data.currentMedication);
    const surgeries = clean(data.previousSurgeries || data.surgeries);
    const notes = clean(data.emergencyNotes);
    const isOrganDonor = data.isOrganDonor === true || data.isOrganDonor === 'true';

    const insuranceCompany = clean(insurance.insuranceCompany || data.insuranceCompany);
    const policyNumber = clean(insurance.policyNumber || data.policyNumber);
    const coverageAmount = clean(insurance.coverageAmount || data.coverageAmount);
    const cashlessFacility = insurance.cashlessFacility || data.cashlessFacility;
    const hasInsurance = Boolean(insuranceCompany || policyNumber);

    const tiles = [
        allergies && { key: 'allergies', label: 'Critical Allergies', value: allergies, Icon: AlertTriangle, tone: 'red' },
        conditions && { key: 'conditions', label: 'Chronic Conditions & History', value: conditions, Icon: HeartPulse, tone: 'default' },
        medications && { key: 'medications', label: 'Current Medication', value: medications, Icon: Pill, tone: 'default' },
        surgeries && { key: 'surgeries', label: 'Previous Surgeries', value: surgeries, Icon: Scissors, tone: 'default' },
        notes && { key: 'notes', label: 'Emergency Clinical Notes', value: notes, Icon: Info, tone: 'amber' },
    ].filter(Boolean);

    return (
        <div className={`space-y-6 ${className}`}>
            {isAuthorized && (
                <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Stethoscope size={20} />
                        </div>
                        <div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest mb-1">
                                Authorized Healthcare Access
                            </Badge>
                            <h3 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins">
                                Decrypted Medical Profile
                            </h3>
                        </div>
                    </div>
                    {onLock && (
                        <button
                            type="button"
                            onClick={onLock}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5 transition-colors"
                        >
                            <Lock size={12} /> Lock Profile
                        </button>
                    )}
                </div>
            )}

            {/* Critical Vitals: Blood Group & Organ Donor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 bg-red-600 text-white rounded-[28px] p-6 text-center shadow-2xl shadow-red-600/25 border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-1.5 text-white/80">
                        <Droplet size={12} /> Blood Group
                    </p>
                    <p className="text-5xl font-black italic leading-none mt-2 break-words">{bloodGroup || '—'}</p>
                </div>
                {isOrganDonor && (
                    <div className="sm:col-span-2 bg-emerald-500/10 border border-emerald-500/25 rounded-[28px] p-6 flex items-center gap-4">
                        <ShieldCheck className="text-emerald-400 shrink-0" size={30} />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Organ Donor</p>
                            <p className="text-lg font-black italic uppercase text-white mt-1">Registered Donor</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Clinical Details */}
            {tiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tiles.map(({ key, label, value, Icon, tone }) => (
                        <div
                            key={key}
                            className={`rounded-[28px] p-6 border ${tone === 'red'
                                ? 'bg-red-500/5 border-red-500/20'
                                : tone === 'amber'
                                    ? 'bg-amber-500/5 border-amber-500/20'
                                    : 'bg-[#11192A] border-white/5'}`}
                        >
                            <p className={`text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 ${tone === 'red' ? 'text-red-400' : tone === 'amber' ? 'text-amber-400' : 'text-slate-400'}`}>
                                <Icon size={13} /> {label}
                            </p>
                            <p className="mt-3 text-lg font-black italic uppercase text-white leading-tight break-words">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Health Insurance */}
            {hasInsurance && (
                <div className="bg-[#11192A] border border-white/5 rounded-[28px] p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 flex items-center gap-2">
                        <CreditCard size={13} /> Health Insurance Cover
                    </p>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-5">
                        {insuranceCompany && (
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                                    <Building2 size={11} /> Provider
                                </p>
                                <p className="text-sm font-black italic uppercase text-white mt-1 break-words">{insuranceCompany}</p>
                            </div>
                        )}
                        {policyNumber && (
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Policy No.</p>
                                <p className="text-sm font-black italic uppercase text-white mt-1 break-words">{policyNumber}</p>
                            </div>
                        )}
                        {coverageAmount && (
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Coverage</p>
                                <p className="text-sm font-black italic uppercase text-white mt-1 break-words">{'\u20B9'}{coverageAmount}</p>
                            </div>
                        )}
                    </div>
                    {cashlessFacility && (
                        <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                            <ShieldCheck size={12} /> Cashless facility active
                        </p>
                    )}
                </div>
            )}

            {!bloodGroup && tiles.length === 0 && !hasInsurance && (
                <div className="empty-state p-6 rounded-[28px] bg-[#11192A] border border-white/5 text-center">
                    <AlertTriangle className="mx-auto text-amber-400 mb-2" size={26} />
                    <p className="text-sm font-black uppercase text-white">No detailed clinical history recorded</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Patient has not added supplementary clinical records yet.
                    </p>
                </div>
            )}
        </div>
    );
}
