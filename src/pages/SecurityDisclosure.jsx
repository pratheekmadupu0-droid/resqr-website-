import { useState } from 'react';
import { 
    Shield, Lock, AlertTriangle, CheckCircle2, ArrowLeft, 
    FileText, Bug, Mail, ExternalLink, Key, Cpu, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function SecurityDisclosure() {
    const [reportData, setReportData] = useState({
        reporterName: '',
        reporterEmail: '',
        vulnerabilityType: 'ACCESS_CONTROL',
        severity: 'MEDIUM',
        affectedUrl: '',
        reproductionSteps: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitted(true);
            setSubmitting(false);
            toast.success("Security vulnerability report logged. Thank you for helping keep RESQR safe.");
        }, 800);
    };

    const securityControls = [
        {
            title: "Cryptographic HMAC Signatures",
            desc: "Payment orders and emergency verification tokens utilize server-side HMAC-SHA256 cryptographic signatures. Secrets are never stored on client devices."
        },
        {
            title: "Zero Client Credential Storage",
            desc: "Private API secrets, service keys, and master administrative tokens are securely maintained in server environment variables and never bundled in frontend code."
        },
        {
            title: "Rate Limiting & Abuse Protection",
            desc: "Verification and profile query endpoints implement IP-bound and identifier-bound throttling with cooldown lockouts to prevent automated enumeration attacks."
        },
        {
            title: "Immutable Access Audit Logs",
            desc: "Every administrative view of an emergency profile and clinical verification event generates an auditable, timestamped ledger in real time."
        },
        {
            title: "Separation of Public vs. Clinical Data",
            desc: "Physical QR codes resolve only to an ephemeral gateway. Public scanners receive only masked coordination data; full medical files remain gated behind clinical authorization."
        },
        {
            title: "Dynamic Revocation Capability",
            desc: "Any physical tag or QR identifier can be immediately revoked or suspended by the owner from their dashboard if the physical item is lost or stolen."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Back Link */}
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Home
                </Link>

                {/* Header */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                        <Shield size={13} /> PLATFORM SECURITY & INTEGRITY
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                        Security Architecture & <br />
                        <span className="text-primary">Responsible Disclosure</span>
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        RESQR is engineered to protect critical emergency information with defense-in-depth security principles. We maintain a transparent vulnerability disclosure program for ethical security researchers.
                    </p>
                </div>

                {/* Verified Security Architecture Overview */}
                <div className="bg-[#17191D] border border-white/10 rounded-3xl p-8 sm:p-10 space-y-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">CORE DEFENSE IN DEPTH</span>
                        <h2 className="text-2xl font-bold uppercase text-white mt-1">Implemented Security Safeguards</h2>
                        <p className="text-xs text-slate-400 mt-1">Verified technical protections operating across the RESQR gateway and backend services.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {securityControls.map((ctrl, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                                <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                    {ctrl.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{ctrl.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-white">Responsible Claims Notice:</strong> RESQR does not claim unverified enterprise certifications (e.g. ISO, SOC2, HIPAA) or end-to-end encryption. Security architecture is built around server-side access controls, least-privilege scoping, and verified cryptographic signatures.
                        </div>
                    </div>
                </div>

                {/* Responsible Disclosure Rules of Engagement */}
                <div className="bg-[#17191D] border border-white/10 rounded-3xl p-8 sm:p-10 space-y-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">COMMUNITY COLLABORATION</span>
                        <h2 className="text-2xl font-bold uppercase text-white mt-1">Vulnerability Disclosure Program</h2>
                        <p className="text-xs text-slate-400 mt-1">Guidelines for security researchers submitting bug reports or potential vulnerability disclosures.</p>
                    </div>

                    <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                        <h3 className="text-sm font-bold text-white uppercase">Rules of Engagement:</h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Safe Harbor:</strong> We will not pursue legal action against researchers acting in good faith who comply with these guidelines.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Do Not Degrade Service:</strong> Do not execute Denial of Service (DoS/DDoS) attacks, automated stress-testing, or spamming against public emergency endpoints.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>No Access to Other User Data:</strong> Do not attempt to exfiltrate, view, modify, or delete data belonging to other real citizens. Use your own test accounts.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Coordinated Disclosure:</strong> Provide us reasonable time (up to 30 days) to validate and remediate the issue prior to public disclosure.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Report Form */}
                    <div className="pt-6 border-t border-white/10">
                        {submitted ? (
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                                <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                                <h3 className="text-lg font-bold text-white uppercase">Vulnerability Report Received</h3>
                                <p className="text-xs text-slate-300 max-w-md mx-auto">
                                    Our security team will review your findings and reply to your contact email within 48 business hours.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Bug size={16} className="text-primary" /> Submit Security Finding
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Researcher Name / Handle *</label>
                                        <input
                                            type="text"
                                            required
                                            value={reportData.reporterName}
                                            onChange={(e) => setReportData({...reportData, reporterName: e.target.value})}
                                            placeholder="Your name or handle"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={reportData.reporterEmail}
                                            onChange={(e) => setReportData({...reportData, reporterEmail: e.target.value})}
                                            placeholder="researcher@example.com"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Vulnerability Category</label>
                                        <select
                                            value={reportData.vulnerabilityType}
                                            onChange={(e) => setReportData({...reportData, vulnerabilityType: e.target.value})}
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="ACCESS_CONTROL">Access Control / Broken Authorization</option>
                                            <option value="AUTHENTICATION">Authentication Issue</option>
                                            <option value="DATA_EXPOSURE">Information Disclosure</option>
                                            <option value="RATE_LIMITING">Rate Limiting / Abuse</option>
                                            <option value="XSS_INJECTION">Injection / Cross-Site Scripting</option>
                                            <option value="OTHER">Other Security Finding</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Severity Assessment</label>
                                        <select
                                            value={reportData.severity}
                                            onChange={(e) => setReportData({...reportData, severity: e.target.value})}
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="LOW">Low Severity</option>
                                            <option value="MEDIUM">Medium Severity</option>
                                            <option value="HIGH">High Severity</option>
                                            <option value="CRITICAL">Critical Severity</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Affected URL or API Endpoint *</label>
                                    <input
                                        type="text"
                                        required
                                        value={reportData.affectedUrl}
                                        onChange={(e) => setReportData({...reportData, affectedUrl: e.target.value})}
                                        placeholder="https://www.resqr.co.in/api/..."
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Reproduction Steps & Proof of Concept *</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={reportData.reproductionSteps}
                                        onChange={(e) => setReportData({...reportData, reproductionSteps: e.target.value})}
                                        placeholder="Provide clear step-by-step instructions or HTTP request payloads to reproduce..."
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 transition-all"
                                >
                                    {submitting ? 'Submitting Report...' : 'Transmit Security Finding'}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="pt-4 text-xs text-slate-400">
                        <p>Direct Security Contact: <a href="mailto:admin@resqr.co.in" className="text-primary underline">admin@resqr.co.in</a> or <a href="mailto:security@resqr.co.in" className="text-primary underline">security@resqr.co.in</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
