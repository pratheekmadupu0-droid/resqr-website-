import { AlertTriangle, HeartPulse, Pill, Scissors, Droplet, ShieldCheck, CreditCard, Building2, Info } from 'lucide-react';

/**
 * EmergencyInfoSections — shared renderer for the emergency medical
 * information shown to a person who scans a RESQR tag.
 *
 * Rules:
 *  - Only fields that actually contain information are rendered.
 *  - Raw identifiers (uid / profile slug / tokens) are NEVER displayed.
 *  - Reused by the scanned profile view and the owner's preview screen.
 */

const clean = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') return '';
    return text;
};

export default function EmergencyInfoSections({ data = {}, insurance = {}, className = '' }) {
    const bloodGroup = clean(data.bloodGroup || data.blood_group);
    const allergies = clean(data.allergies);
    const conditions = clean(data.healthIssues || data.medicalConditions || data.conditions);
    const medications = clean(data.currentMedication);
    const surgeries = clean(data.previousSurgeries || data.surgeries);
    const notes = clean(data.emergencyNotes);
    const isOrganDonor = data.isOrganDonor === true;

    const insuranceCompany = clean(insurance.insuranceCompany || data.insuranceCompany);
    const policyNumber = clean(insurance.policyNumber || data.policyNumber);
    const coverageAmount = clean(insurance.coverageAmount || data.coverageAmount);
    const cashlessFacility = insurance.cashlessFacility || data.cashlessFacility;
    const hasInsurance = Boolean(insuranceCompany || policyNumber);

    const tiles = [
        allergies && { key: 'allergies', label: 'Allergies', value: allergies, Icon: AlertTriangle, tone: 'red' },
        conditions && { key: 'conditions', label: 'Medical Conditions', value: conditions, Icon: HeartPulse, tone: 'default' },
        medications && { key: 'medications', label: 'Current Medication', value: medications, Icon: Pill, tone: 'default' },
        surgeries && { key: 'surgeries', label: 'Previous Surgeries', value: surgeries, Icon: Scissors, tone: 'default' },
        notes && { key: 'notes', label: 'Emergency Notes', value: notes, Icon: Info, tone: 'amber' },
    ].filter(Boolean);

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 bg-primary text-white rounded-[28px] p-6 text-center shadow-2xl shadow-primary/25 border border-white/10">
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
                            <p className="text-lg font-black italic uppercase text-white mt-1">Registered donor</p>
                        </div>
                    </div>
                )}
            </div>

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
                            <p className={`text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 ${tone === 'red' ? 'text-red-400' : tone === 'amber' ? 'text-amber-400' : 'text-slate-500'}`}>
                                <Icon size={13} /> {label}
                            </p>
                            <p className="mt-3 text-lg font-black italic uppercase text-white leading-tight break-words">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {hasInsurance && (
                <div className="bg-[#11192A] border border-white/5 rounded-[28px] p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gold flex items-center gap-2">
                        <CreditCard size={13} /> Insurance
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
                <div className="empty-state">
                    <AlertTriangle className="mx-auto text-amber-400" size={26} />
                    <p className="empty-state-title">No medical information recorded</p>
                    <p className="empty-state-text">
                        This RESQR holder has not added medical details yet. Please use the emergency contact below.
                    </p>
                </div>
            )}
        </div>
    );
}
