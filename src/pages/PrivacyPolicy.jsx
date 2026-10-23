import React, { useState } from 'react';
import { 
    Shield, Lock, FileText, ArrowLeft, ExternalLink, CheckCircle2, ChevronRight, 
    User, HeartPulse, PhoneCall, QrCode, MapPin, Camera, Server, Trash2, 
    Download, Sliders, AlertCircle, HelpCircle, Eye, EyeOff, Building, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    PRIVACY_POLICY_VERSION, 
    PRIVACY_LAST_UPDATED, 
    PRIVACY_OFFICER_DETAILS,
    DATA_CATEGORIES,
    ROLE_ACCESS_MATRIX,
    DATA_RETENTION_POLICIES
} from '../lib/privacyConfig';

export default function PrivacyPolicy() {
    const [activeTab, setActiveTab] = useState('summary');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'summary', label: 'Plain-Language Summary', icon: <Shield size={16} /> },
        { id: 'categories', label: 'Data Collection & Purpose', icon: <FileText size={16} /> },
        { id: 'visibility', label: 'Access Control & Visibility', icon: <Eye size={16} /> },
        { id: 'rights', label: 'Consent & User Rights', icon: <Sliders size={16} /> },
        { id: 'retention', label: 'Retention & Deletion', icon: <Trash2 size={16} /> },
        { id: 'infrastructure', label: 'Processors & Security', icon: <Server size={16} /> },
        { id: 'full_policy', label: 'Full 20-Section Policy', icon: <Lock size={16} /> },
        { id: 'dpo', label: 'DPO & Grievance', icon: <Building size={16} /> },
    ];

    const fullPolicySections = [
        {
            id: '1',
            title: '1. Introduction & Operating Entity',
            content: `RESQR is an emergency identification and response platform developed and operated by Sion Enterprises, headquartered in Hyderabad, Telangana, India (accessible at https://www.resqr.co.in). We recognize that personal health details, emergency contact numbers, and identification records are highly sensitive. This Privacy Policy discloses in clear language how we collect, process, disclose, retain, and safeguard information entrusted to us by citizens, families, healthcare providers, and enterprise partners.`
        },
        {
            id: '2',
            title: '2. Categories of Information Collected',
            content: `We collect information necessary to fulfill our emergency identification mandate:
• Account Information: Full name, mobile number, email address, password/auth tokens.
• Profile Information: Date of birth, gender, residential district/state/pincode, profile photograph.
• Emergency Contacts: Designee name, relationship, contact numbers, and priority order.
• Medical Vault: Blood group, allergies, chronic conditions, current medication, surgical history, organ donation pledge, and emergency notes.
• Insurance Data: Insurer name, policy number, coverage sum, TPA/agent contact details.
• QR Identity: Cryptographic tag tokens, activation timestamps, physical sticker batch metadata.
• Location Data: Ephemeral GPS coordinates captured upon active emergency QR scan (only with scanner permission).
• Biometric Data: 128-dimensional mathematical neural embeddings derived from reference face captures.`
        },
        {
            id: '3',
            title: '3. Purpose Specification & Data Minimization',
            content: `Every piece of data collected has a direct, specified purpose:
• To immediately identify an injured or unconscious person during golden-hour medical emergencies.
• To notify emergency contacts and transmit emergency location coordinates.
• To enable authorized doctors to prevent adverse drug reactions and administer urgent care.
• To coordinate cashless hospital admissions with TPAs.
We follow data minimization: we do not collect personal data merely because it might be useful later.`
        },
        {
            id: '4',
            title: '4. How RESQR Processes Information',
            content: `We process data only for:
1. Operating your account and maintaining your encrypted emergency profile.
2. Generating and validating secure QR tokens.
3. Transmitting emergency dispatch alerts upon verified physical scans.
4. Performing 1:1 facial biometric verification for bedside emergency hospital access.
5. Detecting and mitigating security threats, abuse, or unauthorized access attempts.
We do NOT sell, rent, or trade personal health data with third-party advertising brokers.`
        },
        {
            id: '5',
            title: '5. Emergency Access & Public Disclosures',
            content: `When your physical QR tag is scanned by a bystander:
• The public scanner sees minimal vital information: Patient Name, Masked Contact ("Connect Call"), Emergency Action buttons (108 Ambulance / Police), and Nearest Hospitals.
• Public scanners CANNOT view your full medical history, insurance policy numbers, private street address, or raw family phone numbers.
• Raw family contact numbers are masked (e.g. +91 ••••• ••12) and relayed through controlled dispatch triggers.`
        },
        {
            id: '6',
            title: '6. Doctor & Hospital Access',
            content: `Sensitive medical records (blood group, allergies, medical conditions, medications, surgeries, insurance) are restricted behind verified healthcare access gates:
• 1:1 Biometric Face Match at hospital bedside, OR
• Verified Doctor Medical Council Registration PIN override logged with emergency audit trails.
• Clinical sessions expire automatically after 15 minutes of inactivity.`
        },
        {
            id: '7',
            title: '7. Field Agent Access Limits',
            content: `Verified RESQR Field Agents can only access logistical data required for physical tag fulfillment (user name, sticker delivery pincode, dispatch status). Agents are strictly prohibited from viewing medical vaults or emergency contact numbers.`
        },
        {
            id: '8',
            title: '8. Location Data Governance',
            content: `Location is collected only when an emergency scan occurs or when the user activates SOS dispatch. We never track continuous background location. The emergency scanner is prompted for location access to route coordinates to family.`
        },
        {
            id: '9',
            title: '9. Facial Biometric & Neural Embedding Data',
            content: `When you enroll in 1:1 Face Registration:
• A deep neural network processes 3 face angles (Front, Left, Right) to compute a 128-dimensional mathematical descriptor vector.
• The mathematical vector is stored in your secure vault; matching is performed using Euclidean distance comparison.
• Biometric descriptors are used exclusively for trauma hospital matching and can be deleted or re-enrolled at any time in Privacy Settings.`
        },
        {
            id: '10',
            title: '10. Technical Telemetry & Cookies',
            content: `We use essential session tokens and security telemetry (IP, user agent) to authenticate sessions, prevent brute-force attacks, and maintain state. We do not deploy invasive third-party cross-site tracking cookies.`
        },
        {
            id: '11',
            title: '11. Payments & Financial Data',
            content: `Financial transactions are securely processed via Razorpay over 256-bit TLS encryption. RESQR does not store your debit/credit card numbers, CVVs, or UPI PINs on its servers. We retain transaction order IDs and payment receipts for statutory tax accounting.`
        },
        {
            id: '12',
            title: '12. Third-Party Infrastructure & Sub-Processors',
            content: `We integrate with vetted enterprise infrastructure providers:
• Firebase / Google Cloud: Encrypted Realtime Database & Authentication infrastructure.
• Razorpay: RBI-authorized payment gateway for Indian transactions.
• Mapbox / OpenStreetMap: Emergency hospital routing and geolocation display.
All providers are bound by strict data processing agreements.`
        },
        {
            id: '13',
            title: '13. Data Security Safeguards',
            content: `RESQR implements multi-layer technical and organizational safeguards:
• 256-bit AES database encryption at rest and TLS 1.3 encryption in transit.
• Role-Based Access Control (RBAC) and least-privilege administrative protocols.
• Cryptographic QR token hashing preventing direct database key enumeration.
• Server-side HMAC SHA-256 payment signature verification.
While we implement rigorous security controls designed to protect personal information, no internet transmission is 100% immune from unforeseen technical vulnerabilities.`
        },
        {
            id: '14',
            title: '14. Data Retention & Archival Schedule',
            content: `We retain data only as long as necessary for specified operational and legal requirements:
• User Account & Medical Vault: Active account lifetime; deleted upon user erasure request.
• Access & Audit Logs: 90 days rolling window for security monitoring.
• Payment & Invoice Records: 7 years as mandated by Indian GST and statutory accounting laws.`
        },
        {
            id: '15',
            title: '15. Data Principal Choices and Rights (DPDP Act 2023)',
            content: `In alignment with the Digital Personal Data Protection Act, 2023, you have the right to:
1. Access your personal data and download an export package.
2. Rectify inaccurate or incomplete medical and personal data.
3. Manage per-field emergency visibility controls in Privacy Settings.
4. Nominate an emergency representative / authorized guardian.
5. Request erasure of personal data through our self-service deletion portal.`
        },
        {
            id: '16',
            title: '16. Consent Mechanism',
            content: `Consent is obtained prior to registration and account creation via a granular consent interface. Required consent is limited to account and emergency operations; optional consents (Location, Marketing, Beta features) are never pre-selected.`
        },
        {
            id: '17',
            title: '17. Withdrawal of Consent',
            content: `You may withdraw any optional consent at any time via the Privacy Settings page. Withdrawal takes effect immediately for future processing and does not affect the legality of prior emergency actions.`
        },
        {
            id: '18',
            title: '18. Account Erasure & Data Deletion Flow',
            content: `You may request account deactivation and medical vault erasure at any time via the Account & Data Deletion page (/account-deletion) or in Privacy Settings. Upon verified request, public QR lookups and biometric vectors are deactivated immediately. Statutory financial records are archived as required by law.`
        },
        {
            id: '19',
            title: '19. Grievance Redressal & Data Protection Officer Contact',
            content: `If you have any questions, feedback, or grievances regarding our privacy practices, contact our Data Protection Officer:
• Designation: ${PRIVACY_OFFICER_DETAILS.designation}
• Organization: ${PRIVACY_OFFICER_DETAILS.organization}
• Email: ${PRIVACY_OFFICER_DETAILS.email} / ${PRIVACY_OFFICER_DETAILS.officialEmail}
• Grievance Response SLA: ${PRIVACY_OFFICER_DETAILS.responseTime}
• Jurisdiction: Hyderabad, Telangana, India`
        },
        {
            id: '20',
            title: '20. Policy Updates & Versioning',
            content: `We may periodically update this Privacy Policy. When material changes are made to processing purposes or data categories, returning users will be presented with an updated notice and consent flow upon login. Current Version: ${PRIVACY_POLICY_VERSION} (Effective ${PRIVACY_LAST_UPDATED}).`
        }
    ];

    return (
        <div className="min-h-screen bg-[#040812] page-bg-ganesha text-white font-manrope selection:bg-primary/30 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <header className="space-y-4 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                    <div className="flex justify-center">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-black tracking-widest uppercase px-4 py-1.5">
                            RESQR PRIVACY CENTRE & DATA GOVERNANCE
                        </Badge>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter font-poppins leading-none">
                        EMERGENCY ACCESS. <br />
                        <span className="text-primary italic-display">PRIVACY BY DESIGN.</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-3xl mx-auto font-medium leading-relaxed">
                        Explore our data collection matrix, role-based visibility controls, statutory retention schedules, and self-service privacy tools designed in alignment with the Indian Digital Personal Data Protection (DPDP) Act, 2023.
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-slate-400 pt-2">
                        <span>Version: <strong className="text-white">{PRIVACY_POLICY_VERSION}</strong></span>
                        <span>•</span>
                        <span>Last Updated: <strong className="text-white">{PRIVACY_LAST_UPDATED}</strong></span>
                        <span>•</span>
                        <span>Operator: <strong className="text-white">Sion Enterprises</strong></span>
                    </div>
                </header>

                {/* Quick Action Navigation Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link to="/privacy-settings" className="p-5 bg-charcoal/80 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase text-white group-hover:text-primary transition-colors">Privacy Settings</span>
                            <Sliders size={16} className="text-primary" />
                        </div>
                        <p className="text-[11px] text-slate-400">Toggle per-field emergency visibility & consents</p>
                    </Link>
                    <Link to="/account-deletion" className="p-5 bg-charcoal/80 rounded-2xl border border-white/5 hover:border-red-500/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase text-white group-hover:text-red-400 transition-colors">Account & Data Deletion</span>
                            <Trash2 size={16} className="text-red-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">Exercise erasure rights & submit deletion requests</p>
                    </Link>
                    <Link to="/security" className="p-5 bg-charcoal/80 rounded-2xl border border-white/5 hover:border-blue-400/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase text-white group-hover:text-blue-400 transition-colors">Security Disclosure</span>
                            <Lock size={16} className="text-blue-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">Vulnerability reporting & technical safeguards</p>
                    </Link>
                    <a href={`mailto:${PRIVACY_OFFICER_DETAILS.email}`} className="p-5 bg-charcoal/80 rounded-2xl border border-white/5 hover:border-amber-400/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase text-white group-hover:text-amber-400 transition-colors">Contact DPO</span>
                            <ExternalLink size={16} className="text-amber-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">Response guaranteed within 48 business hours</p>
                    </a>
                </div>

                {/* Privacy Centre Tab Navigation */}
                <div className="flex overflow-x-auto gap-2 border-b border-white/10 pb-4 scrollbar-none">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider italic shrink-0 flex items-center gap-2 transition-all ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB 1: PLAIN-LANGUAGE SUMMARY */}
                {activeTab === 'summary' && (
                    <div className="space-y-8">
                        <Card className="p-8 bg-charcoal/80 border-white/5 rounded-3xl space-y-6">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                Core Privacy Commitments
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-black text-sm uppercase">
                                        <CheckCircle2 size={18} /> No Ad Tracking or Selling
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        RESQR never sells, rents, monetizes, or shares personal health data with advertisers, data brokers, or marketing networks.
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-black text-sm uppercase">
                                        <CheckCircle2 size={18} /> Masked Public Relays
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Passersby who scan your tag cannot view raw family phone numbers or full medical histories. Phone calls are triggered through masked relays (+91 ••••• ••12).
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-black text-sm uppercase">
                                        <CheckCircle2 size={18} /> Granular Visibility Controls
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        You decide which medical fields (allergies, blood group, medications) are shown during emergencies through your Privacy Settings portal.
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-black text-sm uppercase">
                                        <CheckCircle2 size={18} /> Verified Clinical Access Only
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Full medical records and insurance policy numbers require bedside 1:1 facial matching or verified clinician credentials with immutable audit logs.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                            <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                            <div className="space-y-1 text-xs text-slate-300">
                                <p className="font-bold text-white uppercase tracking-wider">Statutory Legal Disclosure Note</p>
                                <p>
                                    Statements on this portal describe actual, operational data workflows and are architected to align with the Digital Personal Data Protection (DPDP) Act, 2023 and the Information Technology Act, 2000. Full statutory compliance is subject to formal review and validation by qualified Indian legal counsel as statutory enforcement rules are officially notified.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: DATA CATEGORIES & PURPOSE */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                    Data Collection & Purpose Matrix
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Detailed inventory of all 9 data categories processed by RESQR</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {DATA_CATEGORIES.map((cat) => (
                                <Card key={cat.id} className="p-6 bg-charcoal/80 border-white/5 rounded-3xl space-y-4">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-base font-black italic uppercase text-white font-poppins">
                                            {cat.title}
                                        </h3>
                                        <Badge className={`text-[9px] uppercase font-black px-2 py-0.5 ${
                                            cat.isOptional 
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                                : 'bg-primary/10 text-primary border border-primary/20'
                                        }`}>
                                            {cat.isOptional ? 'Optional Data' : 'Mandatory for Operation'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Collected Fields:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {cat.fields.map((f, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-[11px] text-slate-300">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Purpose & Minimization:</p>
                                        <p className="text-xs text-slate-300 leading-relaxed">{cat.purpose}</p>
                                    </div>
                                    <div className="space-y-1 pt-2 border-t border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Retention Period:</p>
                                        <p className="text-[11px] text-slate-400">{cat.retention}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: ACCESS CONTROL & VISIBILITY */}
                {activeTab === 'visibility' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                Role-Based Access Control (RBAC) Matrix
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Exact disclosure boundaries for each user role during an emergency or administrative workflow</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {Object.entries(ROLE_ACCESS_MATRIX).map(([roleKey, role]) => (
                                <Card key={roleKey} className="p-8 bg-charcoal/80 border-white/5 rounded-3xl space-y-6">
                                    <div className="border-b border-white/5 pb-4">
                                        <h3 className="text-lg font-black uppercase italic text-primary font-poppins">{role.role}</h3>
                                        <p className="text-xs text-slate-400 mt-1">{role.description}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                            <Check size={14} /> Permitted Information Access:
                                        </p>
                                        <ul className="space-y-2">
                                            {role.allowedData.map((item, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                        <p className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                            <Lock size={14} /> Strictly Restricted / Hidden:
                                        </p>
                                        <ul className="space-y-2">
                                            {role.restrictedData.map((item, i) => (
                                                <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: CONSENT & USER RIGHTS */}
                {activeTab === 'rights' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                Data Principal Rights (DPDP Act, 2023)
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Self-serve privacy tools and procedural rights guaranteed to every RESQR profile holder</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 bg-charcoal/80 border-white/5 rounded-3xl space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Sliders size={20} />
                                </div>
                                <h3 className="text-base font-black italic uppercase text-white font-poppins">Right to Control Visibility</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Toggle each medical field on or off in real-time. Uncheck chronic conditions or medications from appearing to emergency responders if you prefer privacy.
                                </p>
                                <Link to="/privacy-settings" className="btn-app-secondary w-full py-2.5 text-xs text-center inline-block">
                                    Open Privacy Settings
                                </Link>
                            </Card>

                            <Card className="p-6 bg-charcoal/80 border-white/5 rounded-3xl space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Download size={20} />
                                </div>
                                <h3 className="text-base font-black italic uppercase text-white font-poppins">Right to Access & Portability</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Request a complete, machine-readable JSON export archive containing your entire account history, medical vault, access audit records, and consent timestamps.
                                </p>
                                <Link to="/privacy-settings" className="btn-app-secondary w-full py-2.5 text-xs text-center inline-block">
                                    Export JSON Archive
                                </Link>
                            </Card>

                            <Card className="p-6 bg-charcoal/80 border-white/5 rounded-3xl space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                                    <Trash2 size={20} />
                                </div>
                                <h3 className="text-base font-black italic uppercase text-white font-poppins">Right to Erasure & Deletion</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Deactivate your account and purge medical vaults and biometric descriptors permanently. Deactivates public QR scans instantly.
                                </p>
                                <Link to="/account-deletion" className="btn-app-primary w-full py-2.5 text-xs text-center inline-block">
                                    Request Account Deletion
                                </Link>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB 5: RETENTION & DELETION */}
                {activeTab === 'retention' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                Data Retention & Deletion Schedule
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Statutory timelines for data preservation, archiving, and automated purging</p>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(DATA_RETENTION_POLICIES).map(([k, policy]) => (
                                <div key={k} className="p-6 bg-charcoal/80 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black uppercase text-white tracking-wide">{policy.category}</h3>
                                        <p className="text-xs text-slate-400">Post-processing lifecycle buffer</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-white/5 text-right">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Retention</p>
                                            <p className="text-xs font-bold text-emerald-400">{policy.retentionPeriod}</p>
                                        </div>
                                        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-white/5 text-right">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Archival / Purge</p>
                                            <p className="text-xs font-bold text-amber-400">{policy.archivalPeriod}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 6: PROCESSORS & SECURITY */}
                {activeTab === 'infrastructure' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                Enterprise Sub-Processors & Infrastructure
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Infrastructure providers bound by stringent enterprise data protection agreements</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 bg-charcoal/80 border-white/5 rounded-3xl space-y-3">
                                <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px]">CLOUD & DATABASE</Badge>
                                <h3 className="text-base font-black text-white">Google Cloud / Firebase</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Hosts our encrypted Realtime Database (located in asia-southeast1) and identity authentication endpoints with 256-bit AES encryption at rest and TLS 1.3 in transit.
                                </p>
                            </Card>

                            <Card className="p-6 bg-charcoal/80 border-white/5 rounded-3xl space-y-3">
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px]">PAYMENTS GATEWAY</Badge>
                                <h3 className="text-base font-black text-white">Razorpay (India)</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    RBI-authorized payment aggregator processing UPI, debit/credit cards, and netbanking. RESQR servers never touch or store raw card or UPI PIN data.
                                </p>
                            </Card>

                            <Card className="p-6 bg-charcoal/80 border-white/5 rounded-3xl space-y-3">
                                <Badge className="bg-amber-500/10 text-amber-400 border-none text-[9px]">MAPPING & GEOLOCATION</Badge>
                                <h3 className="text-base font-black text-white">Mapbox / OpenStreetMap</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Renders hospital routing tiles and bystander emergency location coordinates strictly upon active emergency dispatch triggers.
                                </p>
                            </Card>
                        </div>

                        <Card className="p-8 bg-charcoal/80 border-white/5 rounded-3xl space-y-4">
                            <h3 className="text-lg font-black uppercase italic text-white font-poppins">
                                Security Safeguards & Responsible Disclosure
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                We maintain server-side HMAC SHA-256 signature verification, random cryptographic QR tokens (preventing raw user ID guessing), rate limiting on authentication and scanning endpoints, and audit trails for hospital decryptions. Security researchers can review our guidelines and report findings through our dedicated disclosure channel.
                            </p>
                            <Link to="/security" className="btn-app-secondary inline-flex items-center gap-2 py-2.5 px-6 text-xs font-black uppercase tracking-wider">
                                View Security & Disclosure Portal <ChevronRight size={14} />
                            </Link>
                        </Card>
                    </div>
                )}

                {/* TAB 7: FULL 20-SECTION LEGAL POLICY */}
                {activeTab === 'full_policy' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                    Full Privacy Policy (20 Sections)
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">Official contractual and statutory policy document</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Filter sections (e.g. biometric, retention)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 w-full sm:w-64"
                            />
                        </div>

                        <div className="space-y-6">
                            {fullPolicySections
                                .filter(sec => 
                                    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    sec.content.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((sec) => (
                                    <Card key={sec.id} className="p-6 sm:p-8 bg-charcoal/80 border-white/5 rounded-3xl space-y-3 shadow-xl">
                                        <h3 className="text-base sm:text-lg font-black italic uppercase text-white font-poppins flex items-center gap-2">
                                            <span className="text-primary">{sec.title}</span>
                                        </h3>
                                        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                                            {sec.content}
                                        </div>
                                    </Card>
                                ))}
                        </div>
                    </div>
                )}

                {/* TAB 8: DPO & GRIEVANCE */}
                {activeTab === 'dpo' && (
                    <div className="space-y-8">
                        <Card className="p-8 bg-charcoal/80 border-white/5 rounded-3xl space-y-6 max-w-3xl mx-auto">
                            <div className="text-center space-y-2">
                                <Building className="mx-auto text-primary" size={36} />
                                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">
                                    Data Protection & Grievance Redressal
                                </h2>
                                <p className="text-xs text-slate-400">
                                    In compliance with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000
                                </p>
                            </div>

                            <div className="p-6 bg-slate-950/80 rounded-2xl border border-white/5 space-y-3 text-xs text-slate-300">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-bold text-slate-400 uppercase">Designation:</span>
                                    <span className="text-white font-semibold">{PRIVACY_OFFICER_DETAILS.designation}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-bold text-slate-400 uppercase">Operating Entity:</span>
                                    <span className="text-white font-semibold">Sion Enterprises</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-bold text-slate-400 uppercase">Official Email:</span>
                                    <a href={`mailto:${PRIVACY_OFFICER_DETAILS.email}`} className="text-primary font-bold hover:underline">
                                        {PRIVACY_OFFICER_DETAILS.email}
                                    </a>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-bold text-slate-400 uppercase">Secondary Email:</span>
                                    <a href={`mailto:${PRIVACY_OFFICER_DETAILS.officialEmail}`} className="text-primary font-bold hover:underline">
                                        {PRIVACY_OFFICER_DETAILS.officialEmail}
                                    </a>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-bold text-slate-400 uppercase">Headquarters / Jurisdiction:</span>
                                    <span className="text-white font-semibold">{PRIVACY_OFFICER_DETAILS.address}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-400 uppercase">Grievance Response SLA:</span>
                                    <span className="text-emerald-400 font-bold">{PRIVACY_OFFICER_DETAILS.responseTime}</span>
                                </div>
                            </div>

                            <p className="text-center text-xs text-slate-400 leading-relaxed">
                                To file a formal grievance, request record rectification, or escalate a privacy concern, please write to our Grievance Officer with your registered phone number or User ID.
                            </p>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
