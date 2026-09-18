import React from 'react';
import {
    Shield, ShieldCheck, Droplet, AlertTriangle, HeartPulse, Pill, Scissors,
    Phone, MapPin, Siren, Navigation, User, Info, Lock, CalendarDays,
    CreditCard, Building2, CheckCircle2, Stethoscope
} from 'lucide-react';
import { Badge } from '../ui/Badge';

/**
 * EmergencyProfileView — renders either:
 * 1. viewLevel="public"     → What ANYONE sees upon scanning (Name + Emergency Actions + Privacy Note).
 *                             No medical vitals or insurance exposed!
 * 2. viewLevel="authorized" → What AUTHORIZED Doctors / Hospitals see (Full Decrypted Medical Dossier).
 */

const has = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    const text = String(value).trim();
    return text.length > 0 && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'undefined';
};

const maskPhone = (phone) => {
    if (!has(phone)) return '';
    return String(phone).trim().replace(/\d(?=\d{3})/g, '•');
};

export default function EmergencyProfileView({
    data = {},
    insurance = {},
    address = {},
    mode = 'live',
    viewLevel = 'public', // 'public' | 'authorized'
    onCallContact,
    onShareLocation,
    onAmbulance,
    onNearestHospital,
    isLocating = false,
}) {
    const name = data.name || data.fullName || data.petName || data.ownerName || 'Registered Member';
    const bloodGroup = data.bloodGroup || data.blood_group || '';
    const allergies = data.allergies || data.allergyInfo || '';
    const conditions = data.healthIssues || data.medicalConditions || data.conditions || data.medicalHistory || '';
    const medication = data.currentMedication || data.medications || '';
    const surgeries = data.previousSurgeries || data.surgeries || '';
    const notes = data.emergencyNotes || '';
    const medicalId = data.medicalId || '';
    const isOrganDonor = data.isOrganDonor === true || data.isOrganDonor === 'true';

    const contacts = Array.isArray(data.contacts) && data.contacts.length > 0
        ? data.contacts
        : (has(data.emergencyContactName) || has(data.emergencyContactPhone)
            ? [{
                name: data.emergencyContactName || data.parentName || 'Emergency Contact',
                relationship: data.emergencyContactRelation || data.relation || 'Authorized Contact',
                phone: data.emergencyContactPhone || data.parentPhone || data.ownerContact || data.contactNumber || ''
            }]
            : []);

    const insuranceCompany = insurance.insuranceCompany || data.insuranceCompany || '';
    const policyNumber = insurance.policyNumber || data.policyNumber || '';
    const policyHolder = insurance.policyHolder || data.policyHolder || '';
    const coverageAmount = insurance.coverageAmount || data.coverageAmount || '';
    const policyExpiry = insurance.policyExpiry || data.policyExpiry || '';
    const cashlessFacility = insurance.cashlessFacility || data.cashlessFacility || false;
    const hasInsurance = has(insuranceCompany) || has(policyNumber);

    const medicalRows = [
        { label: 'Allergies', value: allergies, fallback: 'No known allergies', tone: 'danger', Icon: AlertTriangle },
        { label: 'Medical Conditions', value: conditions, fallback: 'None recorded', tone: 'info', Icon: HeartPulse },
        { label: 'Current Medication', value: medication, fallback: 'None recorded', tone: 'info', Icon: Pill },
        { label: 'Previous Surgeries', value: surgeries, fallback: 'None recorded', tone: 'muted', Icon: Scissors },
    ];

    const hasMedical = has(allergies) || has(conditions) || has(medication) || has(surgeries) || has(notes);
    const location = [address.city, address.district, address.state, address.pincode].filter(has).join(', ');

    return (
        <div className="space-y-6">
            {/* ===== Identity ===== */}
            <section className="em-card p-7 sm:p-9 text-center relative overflow-hidden" aria-label="Patient identity">
                <span className="em-topline" aria-hidden="true" />
                <p className="em-eyebrow flex items-center justify-center gap-2">
                    <User size={12} /> Registered Citizen
                </p>
                <h1 className="mt-3 text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white font-poppins break-words leading-none">
                    {name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {has(data.age) && (
                        <span className="em-chip"><CalendarDays size={12} /> {data.age} yrs</span>
                    )}
                    {has(data.gender) && (
                        <span className="em-chip">{data.gender}</span>
                    )}
                    <span className="em-chip em-chip-verified">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified Node
                    </span>
                </div>
            </section>

            {/* ============================================================
                AUTHORIZED MEDICAL PROFILE (Visible ONLY when viewLevel === 'authorized')
                Strictly separated from public scan
                ============================================================ */}
            {viewLevel === 'authorized' && (
                <div className="space-y-6 border-2 border-emerald-500/30 rounded-3xl p-6 bg-slate-900/40">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Stethoscope size={20} />
                        </div>
                        <div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                Authorized Healthcare Clearance
                            </Badge>
                            <h2 className="text-xl font-black uppercase italic tracking-tight text-white font-poppins mt-1">
                                Decrypted Medical Profile
                            </h2>
                        </div>
                    </div>

                    {/* Critical vitals */}
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Critical information">
                        <div className="em-card-emergency p-6 flex flex-col items-center justify-center text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/80 flex items-center gap-1.5">
                                <Droplet size={12} /> Blood Group
                            </p>
                            <p className="text-5xl font-black italic leading-none mt-2 break-words">
                                {has(bloodGroup) ? bloodGroup : '—'}
                            </p>
                        </div>

                        {isOrganDonor && (
                            <div className="em-card p-6 flex flex-col items-center justify-center text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-400 flex items-center gap-1.5">
                                    <HeartPulse size={12} /> Organ Donor
                                </p>
                                <p className="text-xl font-black italic uppercase text-emerald-400 mt-2">Registered</p>
                            </div>
                        )}

                        {has(medicalId) && (
                            <div className="em-card p-6 flex flex-col items-center justify-center text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-400 flex items-center gap-1.5">
                                    <ShieldCheck size={12} /> Medical ID
                                </p>
                                <p className="text-base font-black italic uppercase tracking-tight text-white mt-2 break-all">{medicalId}</p>
                            </div>
                        )}
                    </section>

                    {/* Medical details */}
                    <section className="em-card p-6 relative overflow-hidden" aria-label="Medical information">
                        <header className="flex items-center gap-3">
                            <span className="em-icon-tile"><HeartPulse size={18} /></span>
                            <div>
                                <h3 className="text-lg font-black italic uppercase tracking-tighter font-poppins text-white">Clinical Vitals & History</h3>
                                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">Restricted to authorized responders</p>
                            </div>
                        </header>

                        {hasMedical ? (
                            <>
                                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {medicalRows.map(({ label, value, fallback, tone, Icon }) => (
                                        <div key={label} className={`em-tile em-tile-${tone}`}>
                                            <p className="em-tile-label"><Icon size={12} /> {label}</p>
                                            <p className={`text-sm font-bold leading-relaxed ${has(value) ? 'text-slate-100' : 'text-slate-500 italic'}`}>
                                                {has(value) ? value : fallback}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {has(notes) && (
                                    <div className="em-tile em-tile-info mt-4">
                                        <p className="em-tile-label"><Info size={12} /> Emergency Clinical Notes</p>
                                        <p className="text-sm font-bold text-slate-100 leading-relaxed">{notes}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                                <p className="text-sm font-bold text-slate-400">No medical details recorded for this profile.</p>
                            </div>
                        )}
                    </section>

                    {/* Insurance */}
                    {hasInsurance && (
                        <section className="em-card p-6" aria-label="Insurance information">
                            <header className="flex items-center gap-3 mb-4">
                                <span className="em-icon-tile em-icon-tile-gold"><CreditCard size={18} /></span>
                                <div>
                                    <h3 className="text-lg font-black italic uppercase tracking-tighter font-poppins text-white">Insurance Coverage</h3>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">Billing & cashless cover</p>
                                </div>
                            </header>

                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-1.5">
                                            <Building2 size={12} /> Provider
                                        </p>
                                        <p className="text-lg font-black italic uppercase tracking-tight text-white mt-1">{insuranceCompany || '—'}</p>
                                    </div>
                                    <span className={`em-chip ${cashlessFacility ? 'em-chip-verified' : ''}`}>
                                        {cashlessFacility ? <><CheckCircle2 size={12} /> Cashless Active</> : 'Reimbursement'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Policy No.', value: policyNumber },
                                        { label: 'Holder', value: policyHolder },
                                        { label: 'Coverage', value: coverageAmount ? `₹${coverageAmount}` : '' },
                                        { label: 'Valid Till', value: policyExpiry },
                                    ].filter(row => has(row.value)).map(row => (
                                        <div key={row.label} className="em-tile em-tile-muted">
                                            <p className="em-tile-label">{row.label}</p>
                                            <p className="text-xs font-black italic uppercase text-white break-words">{row.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* ============================================================
                PUBLIC CLINICAL PRIVACY NOTICE
                ============================================================ */}
            {viewLevel === 'public' && (
                <div className="bg-[#11192A]/60 rounded-3xl border border-white/5 p-5 text-center shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-1.5 text-slate-300">
                        <Lock size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                            Clinical Privacy Protocol Active
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-sm mx-auto">
                        Medical vitals, allergies, conditions, and insurance data are encrypted and restricted to authorized healthcare professionals.
                    </p>
                </div>
            )}

            {/* ===== Emergency contacts ===== */}
            <section className="em-card p-7 sm:p-9" aria-label="Emergency contacts">
                <header className="flex items-center gap-3">
                    <span className="em-icon-tile em-icon-tile-red"><Phone size={18} /></span>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter font-poppins text-white">Emergency Contacts</h2>
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">Call for rapid assistance</p>
                    </div>
                </header>

                {contacts.length > 0 ? (
                    <ul className="mt-6 space-y-4">
                        {contacts.map((contact, index) => (
                            <li key={index} className="em-contact-row">
                                <div className="min-w-0">
                                    <p className="text-lg font-black italic uppercase tracking-tight text-white truncate">
                                        {contact.name || 'Emergency Contact'}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-0.5">
                                        {contact.relationship || 'Authorized contact'}
                                    </p>
                                    {has(contact.phone) && (
                                        <p className="text-sm font-mono text-emerald-400 mt-1.5 tracking-wider">{maskPhone(contact.phone)}</p>
                                    )}
                                </div>
                                {has(contact.phone) && (
                                    <a
                                        href={`tel:${String(contact.phone).replace(/[^0-9+]/g, '')}`}
                                        className="em-call-button"
                                        aria-label={`Call ${contact.name || 'emergency contact'}`}
                                    >
                                        <Phone size={18} fill="currentColor" />
                                        CALL
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-7 text-center">
                        <Phone size={22} className="mx-auto text-slate-600" />
                        <p className="mt-3 text-sm font-bold text-slate-400">No emergency contact added yet.</p>
                    </div>
                )}

                {onCallContact && contacts[0]?.phone && (
                    <button type="button" onClick={onCallContact} className="em-action-primary mt-5">
                        <Phone size={20} fill="currentColor" />
                        Call Emergency Contact
                    </button>
                )}
            </section>

            {/* ===== Emergency actions ===== */}
            {mode === 'preview' && (
                <section className="em-card p-6 text-center" aria-label="Actions available to responders">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Public responder actions</p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <span className="em-chip">Call Emergency Contact</span>
                        <span className="em-chip">Share Location</span>
                        <span className="em-chip">Call Ambulance 108</span>
                        <span className="em-chip">Call Police 100</span>
                        <span className="em-chip">Nearest Hospital</span>
                    </div>
                </section>
            )}

            {mode !== 'preview' && (
                <section className="space-y-4" aria-label="Emergency actions">
                    <button type="button" onClick={onShareLocation} disabled={isLocating} className="em-action-secondary">
                        <MapPin size={22} fill="currentColor" />
                        {isLocating ? 'Sending location…' : 'Share Location With Family'}
                    </button>

                    <button type="button" onClick={onAmbulance} className="em-action-ambulance">
                        <Siren size={30} className="text-red-600 animate-pulse" />
                        <span className="text-left">
                            <span className="block text-2xl font-black italic uppercase leading-none font-poppins">Call Ambulance</span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-1.5">Dial 108 · First responders</span>
                        </span>
                    </button>

                    <a href="tel:100" className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-4 font-black italic uppercase tracking-wider text-sm shadow-xl shadow-blue-600/20 transition-all">
                        <Shield size={22} fill="currentColor" />
                        Call Police — 100
                    </a>

                    <button type="button" onClick={onNearestHospital} className="em-action-ghost">
                        <Navigation size={20} className="text-red-500" />
                        Nearest Hospital Locator
                    </button>
                </section>
            )}

            {/* ===== Footer note ===== */}
            <section className="em-card p-6 text-center">
                {has(location) && (
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center justify-center gap-2 mb-4">
                        <MapPin size={12} /> {location}
                    </p>
                )}
                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    {mode === 'preview'
                        ? 'This preview shows what responders and doctors see based on your selected access level.'
                        : 'Emergency parameters are managed by RESQR Clinical Infrastructure.'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                    <Shield size={13} className="text-primary" /> Powered by RESQR · resqr.co.in
                </div>
            </section>
        </div>
    );
}