import React, { useState } from 'react';
import { Shield, Lock, FileText, ArrowLeft, ExternalLink, CheckCircle2, ChevronRight, User, HeartPulse, PhoneCall, QrCode, MapPin, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PRIVACY_POLICY_VERSION, PRIVACY_LAST_UPDATED, PRIVACY_OFFICER_DETAILS } from '../lib/privacyConfig';

export default function PrivacyPolicy() {
    const [selectedSection, setSelectedSection] = useState('all');

    const sections = [
        {
            id: '1',
            title: '1. Introduction',
            content: `RESQR (operated by Sicon Enterprises, accessible at resqr.co.in) is an emergency health identification and emergency response platform. We recognize the profound sensitivity of emergency contacts, health details, and personal identities entrusted to us. This Privacy Policy explains in plain language how we collect, use, process, disclose, retain, and protect personal and medical data.`
        },
        {
            id: '2',
            title: '2. Information We Collect',
            content: `We collect information necessary to fulfill our emergency identification and response mandate:
• Account Information: Full name, mobile number, email address, password/auth tokens.
• Profile Information: Date of birth, gender, residential district/state/pincode, profile photograph.
• Emergency Contacts: Designee name, relationship, contact numbers, and priority order.
• Medical Vault: Blood group, allergies, chronic conditions, current medication, surgical history, organ donation pledge, and emergency notes.
• Insurance Data: Insurer name, policy number, coverage sum, TPA/agent contact details.
• QR Identity: Cryptographic tag tokens, activation timestamps, physical sticker batch metadata.
• Location Data: Ephemeral GPS coordinates captured upon active emergency QR scan.
• Biometric Data: 128-dimensional mathematical neural embeddings derived from reference face captures.`
        },
        {
            id: '3',
            title: '3. Why We Collect It (Purpose & Minimization)',
            content: `Every piece of data collected has a direct, specified purpose:
• To immediately identify an injured or unconscious person during golden-hour medical emergencies.
• To notify emergency contacts and transmit emergency location coordinates.
• To enable authorized doctors to prevent adverse drug reactions and administer urgent care.
• To coordinate cashless hospital admissions with TPAs.
We follow data minimization: we do not collect personal data merely because it might be useful later.`
        },
        {
            id: '4',
            title: '4. How RESQR Uses Information',
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
            title: '7. Agent Access',
            content: `Verified RESQR Field Agents can only access data required for their logistical role (user name, sticker delivery pincode, dispatch status). Agents are strictly prohibited from viewing medical vaults or emergency contact numbers.`
        },
        {
            id: '8',
            title: '8. Location Data',
            content: `Location is collected only when an emergency scan occurs or when the user activates SOS dispatch. We never track continuous background location. The emergency scanner is prompted for location access to route coordinates to family.`
        },
        {
            id: '9',
            title: '9. Face / Identity Verification Data',
            content: `When you enroll in 1:1 Face Registration:
• A deep neural network processes 3 face angles (Front, Left, Right) to compute a 128-dimensional mathematical descriptor vector.
• The mathematical vector is stored in your secure vault; matching is performed using Euclidean distance comparison.
• Biometric descriptors are used exclusively for trauma hospital matching and can be deleted or re-enrolled at any time in Privacy Settings.`
        },
        {
            id: '10',
            title: '10. Cookies and Technical Data',
            content: `We use essential session tokens and security telemetry (IP, user agent) to authenticate sessions, prevent brute-force attacks, and maintain state. We do not deploy invasive third-party cross-site tracking cookies.`
        },
        {
            id: '11',
            title: '11. Payments & Financial Data',
            content: `Financial transactions are securely processed via Razorpay over 256-bit TLS encryption. RESQR does not store your debit/credit card numbers, CVVs, or UPI PINs on its servers. We retain transaction order IDs and payment receipts for statutory tax accounting.`
        },
        {
            id: '12',
            title: '12. Third-Party Services',
            content: `We integrate with vetted enterprise infrastructure providers:
• Firebase / Google Cloud: Encrypted Realtime Database & Authentication infrastructure.
• Razorpay: RBI-authorized payment gateway.
• Mapbox / OpenStreetMap: Emergency hospital routing and geolocation display.
All providers are bound by strict data processing agreements.`
        },
        {
            id: '13',
            title: '13. Data Security Controls',
            content: `RESQR implements multi-layer technical and organizational safeguards:
• 256-bit AES database encryption at rest and TLS 1.3 encryption in transit.
• Role-Based Access Control (RBAC) and least-privilege administrative protocols.
• Cryptographic QR token hashing preventing direct database key enumeration.
• Server-side HMAC SHA-256 payment signature verification.
While we implement rigorous security controls designed to protect personal information, no internet transmission is 100% immune from unforeseen technical vulnerabilities.`
        },
        {
            id: '14',
            title: '14. Data Retention Strategy',
            content: `We retain data only as long as necessary for specified operational and legal requirements:
• User Account & Medical Vault: Active account lifetime; deleted upon user erasure request.
• Access & Audit Logs: 90 days rolling window for security monitoring.
• Payment & Invoice Records: 7 years as mandated by Indian GST and statutory accounting laws.`
        },
        {
            id: '15',
            title: '15. User Choices and Rights',
            content: `In alignment with the Digital Personal Data Protection Act (DPDP), you have the right to:
1. Access your personal data and download an export package.
2. Rectify inaccurate or incomplete medical and personal data.
3. Manage per-field emergency visibility controls in Privacy Settings.
4. Nominate an emergency representative / authorized guardian.`
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
            title: '18. Data Deletion & Account Erasure',
            content: `You may request account deactivation and medical vault erasure at any time in Privacy Settings. Upon verified request, public QR lookups and biometric vectors are deactivated immediately. Statutory financial records are archived as required by law.`
        },
        {
            id: '19',
            title: '19. Grievance & Data Protection Officer Contact',
            content: `If you have any questions, feedback, or grievances regarding our privacy practices, contact our Data Protection Officer:
• Designation: ${PRIVACY_OFFICER_DETAILS.designation}
• Organization: ${PRIVACY_OFFICER_DETAILS.organization}
• Email: ${PRIVACY_OFFICER_DETAILS.email} / ${PRIVACY_OFFICER_DETAILS.officialEmail}
• Grievance Response SLA: ${PRIVACY_OFFICER_DETAILS.responseTime}
• Jurisdiction: Hyderabad, Telangana, India`
        },
        {
            id: '20',
            title: '20. Policy Updates',
            content: `We may periodically update this Privacy Policy. When material changes are made to processing purposes or data categories, returning users will be presented with an updated notice and consent flow upon login. Current Version: ${PRIVACY_POLICY_VERSION} (Effective ${PRIVACY_LAST_UPDATED}).`
        }
    ];

    return (
        <div className="min-h-screen bg-[#040812] page-bg-ganesha text-white font-manrope selection:bg-primary/30 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header */}
                <header className="space-y-4 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                    <div className="flex justify-center">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-black tracking-widest uppercase px-4 py-1.5">
                            OFFICIAL PRIVACY & DATA GOVERNANCE
                        </Badge>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter font-poppins leading-none">
                        PRIVACY POLICY
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-medium">
                        Plain-language, comprehensive disclosure of how RESQR safeguards your emergency identities, medical records, and personal information.
                    </p>
                    <div className="flex justify-center items-center gap-4 text-xs text-slate-400 pt-2">
                        <span>Version: <strong className="text-white">{PRIVACY_POLICY_VERSION}</strong></span>
                        <span>•</span>
                        <span>Last Updated: <strong className="text-white">{PRIVACY_LAST_UPDATED}</strong></span>
                    </div>
                </header>

                {/* Quick Actions Hub */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link to="/privacy-settings" className="p-5 bg-[#11192A] rounded-2xl border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase text-white">Manage Privacy Settings</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Toggle visibility & consents</p>
                        </div>
                        <ChevronRight size={16} className="text-primary" />
                    </Link>
                    <Link to="/privacy-settings" className="p-5 bg-[#11192A] rounded-2xl border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase text-white">Download My Data</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Export JSON archive</p>
                        </div>
                        <ChevronRight size={16} className="text-primary" />
                    </Link>
                    <a href={`mailto:${PRIVACY_OFFICER_DETAILS.email}`} className="p-5 bg-[#11192A] rounded-2xl border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase text-white">Contact DPO</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{PRIVACY_OFFICER_DETAILS.responseTime}</p>
                        </div>
                        <ChevronRight size={16} className="text-primary" />
                    </a>
                </div>

                {/* All 20 Sections */}
                <div className="space-y-6">
                    {sections.map((sec) => (
                        <Card key={sec.id} className="p-6 sm:p-8 bg-[#11192A] border-white/5 rounded-3xl space-y-3 shadow-xl">
                            <h2 className="text-lg sm:text-xl font-black italic uppercase text-white font-poppins flex items-center gap-2">
                                <span className="text-primary">{sec.title}</span>
                            </h2>
                            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                                {sec.content}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Footer Governance Card */}
                <div className="p-8 bg-slate-950 rounded-3xl border border-white/5 text-center space-y-3">
                    <Shield className="mx-auto text-primary" size={32} />
                    <h3 className="text-lg font-black italic uppercase text-white">Privacy Commitment</h3>
                    <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
                        RESQR is committed to continuous data protection improvement in alignment with the Indian Digital Personal Data Protection Act framework and global healthcare security practices.
                    </p>
                </div>
            </div>
        </div>
    );
}
