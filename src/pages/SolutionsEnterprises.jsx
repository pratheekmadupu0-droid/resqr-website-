import React from 'react';
import { Shield, Users, FileText, ChevronRight, Activity, Zap, Clipboard, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function SolutionsEnterprises() {
    const targets = [
        'Construction & Infrastructure',
        'Manufacturing & Heavy Industries',
        'Logistics & Supply Chain',
        'Transportation & Mobility',
        'Last-Mile Delivery Fleets',
        'Corporate Offices & Tech Parks',
        'Private Security & Guard Units',
        'Industrial Plants & Refineries',
        'Field Sales & Service Crews'
    ];

    const workflow = [
        'Employee Registration',
        'Emergency Profile Set',
        'RESQR Identity Created',
        'Emergency Event',
        'Family SOS Notified',
        'Emergency Services Dispatched',
        'Hospital Access Granted'
    ];

    const features = [
        { title: 'Employee Management', desc: 'Central HR dashboard to manage and update active workforce safety profiles.' },
        { title: 'Bulk Registration', desc: 'Onboard thousands of personnel simultaneously via automated CSV/Excel uploads.' },
        { title: 'Emergency Contacts', desc: 'Secure contact routing to HR representatives and designated family members.' },
        { title: 'QR Management', desc: 'Track and assign smart cards, stickers, or badges across multiple sites.' },
        { title: 'Admin Dashboard', desc: 'Deep analytics tracking compliance audits, active security states, and scan logs.' },
        { title: 'Reports & Audits', desc: 'Download comprehensive incident reports mapping emergency timeline logs.' }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">ENTERPRISE SAFETY</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        PROTECT YOUR PEOPLE <br />
                        <span className="text-primary italic-display">BEYOND THE WORKPLACE.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Scale corporate medical response infrastructure. Shield field agents, industrial operators, and logistics workers with automated emergency care.
                    </p>
                </div>
            </section>

            {/* Target Sectors */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">TARGET SECTORS & WORKFORCES</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Pre-mapped security profiles across critical fields</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {targets.map((tgt, idx) => (
                        <div key={idx} className="p-6 bg-slate-950 rounded-2xl border border-white/5 flex items-center gap-3 hover:border-white/10 transition-all font-bold uppercase tracking-wider text-xs text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-primary" /> {tgt}
                        </div>
                    ))}
                </div>
            </section>

            {/* Enterprise Workflow */}
            <section className="py-24 bg-slate-950 border-b border-white/5 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">ENTERPRISE RESCUE WORKFLOW</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">From HR enrollment to critical care delivery</p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
                        {workflow.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-black italic text-xs mb-3">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 max-w-[100px]">{step}</span>
                                </div>
                                {idx < workflow.length - 1 && (
                                    <ChevronRight className="text-slate-700 hidden lg:block" size={18} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Features */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">PLATFORM SYSTEM FEATURES</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Enterprise-grade safety administration portal tools</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feat, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all">
                            <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{feat.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-semibold">{feat.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">DEPLOY ENTERPRISE SAFETY NOW</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Connect with our corporate accounts team to configure corporate safety options and bulk smart cards.</p>
                    <div className="flex justify-center">
                        <Link to="/contact">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">REQUEST ENTERPRISE DEMO</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
