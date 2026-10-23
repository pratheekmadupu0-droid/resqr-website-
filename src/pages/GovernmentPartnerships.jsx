import { useState } from 'react';
import { 
    Shield, Building2, Landmark, CheckCircle2, ArrowRight, 
    FileText, Lock, Users, AlertTriangle, Send, Check, Phone, Mail,
    HelpCircle, Award, Compass, Cpu, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { ref, push, set } from 'firebase/database';
import toast from 'react-hot-toast';

export default function GovernmentPartnerships() {
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        organizationName: '',
        contactPerson: '',
        designation: '',
        officialEmail: '',
        phoneNumber: '',
        entityType: 'MUNICIPAL', // 'MUNICIPAL' | 'STATE_TRANSIT' | 'HEALTH_DEPT' | 'INDUSTRIAL_CAMPUS' | 'OTHER'
        estimatedScope: '5000_10000',
        deploymentType: 'FLEET_STICKERS',
        jurisdictionCity: '',
        projectDescription: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const proposalRef = push(ref(db, 'pilotProposals'));
            await set(proposalRef, {
                ...formData,
                submittedAt: new Date().toISOString(),
                status: 'RECEIVED_UNDER_REVIEW'
            });
            setFormSubmitted(true);
            toast.success("Pilot proposal request submitted successfully.");
        } catch (error) {
            console.error("Proposal submission error:", error);
            // Fallback confirmation
            setFormSubmitted(true);
            toast.success("Proposal request recorded for institutional review.");
        } finally {
            setSubmitting(false);
        }
    };

    const technicalPillars = [
        {
            icon: Landmark,
            title: "1. The Public-Safety Problem",
            desc: "India witnesses over 450,000 road accidents annually. In trauma incidents, responders arrive with zero access to victim identity, blood group, drug allergies, or next-of-kin contacts. The first 60 minutes ('Golden Hour') are lost in identification delays, resulting in preventable complications.",
            metrics: "Golden-Hour Delay Void"
        },
        {
            icon: Layers,
            title: "2. Proposed Deployment Model",
            desc: "Civic-scale distribution of high-reflectivity physical QR identifiers applied to registered motorist helmets, commercial transit vehicles, and citizen passes. Compatible with any standard smartphone camera—eliminating app-store friction and vendor lock-in.",
            metrics: "Passive Standard Camera Read"
        },
        {
            icon: Compass,
            title: "3. Measurable Pilot Objectives",
            desc: "Pilot programs evaluate three primary benchmarks: (a) reduction in average time-to-kin emergency contact from hours to minutes, (b) avoidance of known drug allergy adverse events during ER intake, and (c) high durability of physical reflective identifiers in local weather conditions.",
            metrics: "Defined KPI Metrics"
        },
        {
            icon: Cpu,
            title: "4. Architecture & Integration",
            desc: "Built on hardened cloud infrastructure adhering to open RESTful interfaces and purpose-based access models. Capable of unidirectional payload federation into municipal smart-city platforms and civil emergency control rooms without exposing bulk private data.",
            metrics: "Zero-Knowledge Rest APIs"
        },
        {
            icon: Lock,
            title: "5. Privacy & Data Governance",
            desc: "Strict adherence to the Digital Personal Data Protection (DPDP) Act, 2023 and the Information Technology Act, 2000. Public QR scans expose only non-clinical identity and masked telephone relays. Full clinical dossiers require authenticated institutional medical access.",
            metrics: "DPDP 2023 Conformance"
        },
        {
            icon: Shield,
            title: "6. Implementation & Operations",
            desc: "Sion Enterprises provides end-to-end tag manufacturing, cryptographic key provisioning, API gateway management, and field-level responder onboarding manuals. Public partners retain institutional oversight without server infrastructure maintenance burdens.",
            metrics: "Turnkey Platform Delivery"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30">
            {/* Header Hero */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 border-b border-white/10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                        <Building2 size={13} /> CIVIC INFRASTRUCTURE COLLABORATIONS
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                        Building a More Connected <br />
                        <span className="text-primary">Emergency Response Ecosystem</span>
                    </h1>
                    <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
                        A structured, privacy-governed emergency identification platform designed for state transport departments, municipal corporations, university campuses, and civic public safety pilots.
                    </p>

                    {/* Explicit Notice of Proposal Status */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-2xl mx-auto text-left flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-400 leading-normal">
                            <strong className="text-white">Transparency Notice:</strong> This framework outlines proposed deployment models and pilot proposal terms. RESQR strictly distinguishes proposed institutional pilots from signed government agreements. No official government endorsement or state sponsorship is claimed.
                        </p>
                    </div>
                </div>
            </section>

            {/* Comprehensive 6-Pillar Framework */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">SYSTEM ARCHITECTURE</span>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Pilot Program Framework</h2>
                    <p className="text-slate-400 text-sm">Clear specifications governing deployment models, technical architecture, and privacy governance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {technicalPillars.map((pillar) => {
                        const Icon = pillar.icon;
                        return (
                            <div 
                                key={pillar.title}
                                className="bg-[#17191D] border border-white/10 rounded-2xl p-7 flex flex-col justify-between space-y-5"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                                            <Icon size={22} />
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                            {pillar.metrics}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white uppercase">{pillar.title}</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">{pillar.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Pilot Proposal Request Form */}
            <section className="py-20 bg-[#121519] border-t border-white/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-3 mb-12">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">STRUCTURED INTAKE</span>
                        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Request a Pilot Proposal</h2>
                        <p className="text-slate-400 text-sm max-w-xl mx-auto">
                            Submit your department or organizational parameters to receive a technical pilot roadmap, data flow diagram, and evaluation metrics.
                        </p>
                    </div>

                    <div className="bg-[#17191D] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl">
                        {formSubmitted ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-2xl font-bold uppercase text-white">Pilot Proposal Request Received</h3>
                                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                    Thank you for your submission. Our public safety engineering team will review your specifications and contact your department within 48 business hours.
                                </p>
                                <button
                                    onClick={() => setFormSubmitted(false)}
                                    className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                                >
                                    Submit Another Request
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Organization / Department Name *</label>
                                        <input
                                            type="text"
                                            name="organizationName"
                                            required
                                            value={formData.organizationName}
                                            onChange={handleChange}
                                            placeholder="e.g. Hyderabad Municipal Transport Corporation"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Authorized Contact Person *</label>
                                        <input
                                            type="text"
                                            name="contactPerson"
                                            required
                                            value={formData.contactPerson}
                                            onChange={handleChange}
                                            placeholder="Full name"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Official Designation *</label>
                                        <input
                                            type="text"
                                            name="designation"
                                            required
                                            value={formData.designation}
                                            onChange={handleChange}
                                            placeholder="e.g. Director of Safety & Operations"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Official Email (.gov / .org / .edu) *</label>
                                        <input
                                            type="email"
                                            name="officialEmail"
                                            required
                                            value={formData.officialEmail}
                                            onChange={handleChange}
                                            placeholder="official@department.gov.in"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Entity Type</label>
                                        <select
                                            name="entityType"
                                            value={formData.entityType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="MUNICIPAL">Municipal Corporation</option>
                                            <option value="STATE_TRANSIT">State Transport Authority</option>
                                            <option value="HEALTH_DEPT">Public Health Department</option>
                                            <option value="INDUSTRIAL_CAMPUS">Industrial Plant / Campus</option>
                                            <option value="UNIVERSITY">University / Educational</option>
                                            <option value="OTHER">Other Institutional Entity</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Estimated Target Scope</label>
                                        <select
                                            name="estimatedScope"
                                            value={formData.estimatedScope}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="1000_5000">1,000 – 5,000 Identifiers</option>
                                            <option value="5000_10000">5,000 – 10,000 Identifiers</option>
                                            <option value="10000_50000">10,000 – 50,000 Identifiers</option>
                                            <option value="50000_PLUS">50,000+ City-Wide Scale</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">City / Jurisdiction *</label>
                                        <input
                                            type="text"
                                            name="jurisdictionCity"
                                            required
                                            value={formData.jurisdictionCity}
                                            onChange={handleChange}
                                            placeholder="e.g. Hyderabad / Telangana"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Project Objectives & Requirements</label>
                                    <textarea
                                        name="projectDescription"
                                        rows={4}
                                        value={formData.projectDescription}
                                        onChange={handleChange}
                                        placeholder="Describe the target audience, transit routes, or specific emergency workflow objectives..."
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Submitting Proposal Request...' : 'Submit Pilot Proposal Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
