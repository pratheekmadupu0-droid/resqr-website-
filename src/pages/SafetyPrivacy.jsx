import React from 'react';
import { Shield, Eye, Lock, RefreshCw, Key, Database, FileText, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function SafetyPrivacy() {
    const roles = [
        { role: 'STRANGER / BYSTANDER', access: 'Limited Emergency Access', desc: 'Can only view emergency contact hotlines, name, and basic instructions to assist/alert next of kin.', icon: <Eye className="text-blue-400" size={24} /> },
        { role: 'FIRST RESPONDER / POLICE', access: 'Emergency Information', desc: 'Can access non-sensitive parameters such as blood group and critical next of kin locations.', icon: <Shield className="text-amber-500" size={24} /> },
        { role: 'AUTHORISED DOCTOR', access: 'Medical Information', desc: 'Verified professionals get access to active medication prescriptions, chronic conditions, and allergy history.', icon: <Lock className="text-primary" size={24} /> },
        { role: 'AUTHORISED HOSPITAL', access: 'Medical + Insurance Profiles', desc: 'Trauma reception centers can access verified medical data plus insurance policies for swifter admission routing.', icon: <Database className="text-emerald-400" size={24} /> },
        { role: 'PROFILE OWNER (USER)', access: 'Full Control', desc: 'Complete access to edit, delete, audit, and log permissions for all demographic, medical, and insurance fields.', icon: <Key className="text-violet-400" size={24} /> }
    ];

    const securityPillars = [
        { title: 'Data Protection', desc: 'We align security protocols with global standards to safeguard sensitive electronic health records.' },
        { title: 'Authentication', desc: 'Multi-factor and secure OTP logins ensure verified identities access the backend database.' },
        { title: 'Role-Based Access', desc: 'Strict separation of permissions prevents unauthorized scans from viewing sensitive history.' },
        { title: 'AES-256 Encryption', desc: 'All medical data files are encrypted in-transit and at-rest within our databases.' },
        { title: 'Secure Storage', desc: 'Encrypted databases with multi-region backups and automated firewall systems.' },
        { title: 'Audit Logging', desc: 'Every decryption request is logged, tracing the timestamp, IP address, and practitioner credential.' },
        { title: 'Data Minimisation', desc: 'We collect and store only the parameters essential for emergency saving workflows.' },
        { title: 'Consent Framework', desc: 'Users actively control what information is exposed, and can revoke permission instantly.' }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">SECURITY & COMPLIANCE</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        YOUR INFORMATION. <br />
                        <span className="text-primary italic-display">YOUR CONTROL.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        RESQR is engineered on trust. Explore our role-based data encryption systems and privacy compliance parameters designed to keep you safe.
                    </p>
                </div>
            </section>

            {/* Interactive Access Model */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">ROLE-BASED ACCESS SPECTRUM</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Visualizing localized permission layers</p>
                </div>

                <div className="space-y-6">
                    {roles.map((r, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                    {r.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tight text-white">{r.role}</h3>
                                    <span className="text-[10px] text-primary font-black uppercase tracking-wider">{r.access}</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed max-w-xl md:text-right font-semibold">{r.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* What We Never Do */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4 text-center">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins mb-16 text-primary">WHAT WE NEVER DO</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        {[
                            'We do NOT expose unnecessary medical history or policies to public bystanders or strangers.',
                            'We do NOT encode medical data directly inside physical QR barcodes; QRs only store encrypted routing tags.',
                            'We do NOT permit client-side authorization bypasses. All profile decryptions require server token verification.',
                            'We do NOT claim "100% unhackable" systems. We acknowledge threats and execute real-time intrusion monitoring.'
                        ].map((str, idx) => (
                            <div key={idx} className="p-6 bg-medical-card/30 rounded-3xl border border-red-500/10 flex items-start gap-4">
                                <AlertOctagon className="text-primary shrink-0 mt-0.5" size={20} />
                                <p className="text-xs text-slate-300 font-bold uppercase tracking-wide leading-relaxed">{str}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Compliance Columns */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">COMPLIANCE & SYSTEM PILLARS</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Architecting next-generation emergency health data pipelines</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {securityPillars.map((p, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all border border-white/5">
                            <h3 className="text-base font-black uppercase italic tracking-tight font-poppins text-white mb-3">{p.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-semibold">{p.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Legal Links Directory */}
            <section className="py-24 bg-slate-950 border-t border-white/5 px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter font-poppins text-white">RESOURCES & DATA RIGHTS</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] max-w-lg mx-auto">
                        Review our legal documentation, including Privacy Shield Policy, Terms of Service, Consent Rules, and Data Erasure Guidelines.
                    </p>
                </div>
            </section>
        </div>
    );
}
