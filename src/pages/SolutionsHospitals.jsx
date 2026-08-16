import React from 'react';
import { Shield, Lock, Activity, Users, FileText, CheckCircle2, ChevronRight, Award, Key, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function SolutionsHospitals() {
    const sections = [
        { title: 'Hospital Registration', desc: 'Secure onboarding portal for clinics and multi-speciality network hospitals.' },
        { title: 'Hospital Verification', desc: 'Credential audits matching institutional licensing protocols.' },
        { title: 'Hospital ID', desc: 'Secure hospital access keys linked to active practitioner directories.' },
        { title: 'Hospital Capacity', desc: 'Real-time telemetry showing emergency room (ER) and ICU occupancy levels.' },
        { title: 'Hospital Subscription', desc: 'Flexible SLA tiers for digital patient records synchronization.' },
        { title: 'Hospital Scanner', desc: 'Dedicated barcode and NFC scanning interface for triage reception.' },
        { title: 'Patient Identification', desc: 'Instant search across scanned databases matching name and age parameters.' },
        { title: 'Authorised Medical Access', desc: 'Encrypted patient records decryption using verified system tokens.' },
        { title: 'Emergency Patient Profile', desc: 'Blood group, allergy list, and emergency contacts consolidated view.' },
        { title: 'Insurance Information', desc: 'Pre-admission health insurance claims mapping for instant credit clearance.' },
        { title: 'Access Logs', desc: 'Compliance audit trail containing timestamp, physician name, and access purpose.' }
    ];

    const workflow = [
        'Ambulance Arrives',
        'Patient Identified',
        'RESQR Scanned',
        'Hospital Verified',
        'Medical Profile Loaded',
        'Doctor Reviews',
        'Emergency Care Started'
    ];

    const dashboardTabs = [
        'Emergency Patients', 'Scan RESQR', 'Patient Search', 'Patient History', 'Insurance Logs', 'Access Logs', 'Hospital Profile', 'Subscription Status'
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">HOSPITAL ENTERPRISE</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        TURN EMERGENCY INFORMATION <br />
                        <span className="text-primary italic-display">INTO ACTIONABLE INFORMATION.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Integrate RESQR digital health passport data straight into your hospital ERP. Accelerate triage admissions, mitigate billing delays, and save lives.
                    </p>
                </div>
            </section>

            {/* Workflow Diagram */}
            <section className="py-24 bg-slate-950 border-b border-white/5 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">TRIAGE & ADMISSION WORKFLOW</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">From physical scanner to medical care execution</p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
                        {workflow.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-black italic text-sm mb-4">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 max-w-[120px]">{step}</span>
                                </div>
                                {idx < workflow.length - 1 && (
                                    <ChevronRight className="text-slate-700 hidden lg:block" size={24} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* Detailed Feature Sections */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">PLATFORM ARCHITECTURE FEATURES</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Comprehensive toolkits powering critical care admissions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sections.map((sec, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all">
                            <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{sec.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-semibold">{sec.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Dashboard Mockup */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">HOSPITAL TRIAGE DASHBOARD PREVIEW</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Interactive ER reception system interface</p>
                    </div>

                    <Card className="bg-medical-card border-white/5 overflow-hidden p-0 rounded-[40px] shadow-2xl relative">
                        {/* Fake browser header */}
                        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <span className="w-3 h-3 rounded-full bg-green-500/50" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">MAX EMERGENCY CENTER TERMINAL</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Sync Online</span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row min-h-[480px]">
                            {/* Left Navigation bar */}
                            <div className="w-full lg:w-1/4 bg-slate-950 p-6 border-r border-white/5 space-y-2">
                                {dashboardTabs.map((tab, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl text-xs font-black uppercase tracking-wider italic transition-all ${idx === 0 ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/5 cursor-pointer'}`}>
                                        {tab}
                                    </div>
                                ))}
                            </div>

                            {/* Right Content dashboard */}
                            <div className="w-full lg:w-3/4 p-8 md:p-10 space-y-8">
                                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Emergency Patients Queue</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Real-time scan admissions triage</p>
                                    </div>
                                    <Button size="sm" className="font-black italic text-[10px] uppercase tracking-widest bg-primary">SCAN NEW PATIENT</Button>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { name: 'PRATHEEK M.', age: '28 Yrs', blood: 'O+', status: 'IN TRANSIT', priority: 'CRITICAL' },
                                        { name: 'ANANYA R.', age: '32 Yrs', blood: 'AB-', status: 'ER ADMITTED', priority: 'ALERT' },
                                        { name: 'ROHAN S.', age: '45 Yrs', blood: 'B+', status: 'DISCHARGED', priority: 'INFO' }
                                    ].map((pat, idx) => (
                                        <div key={idx} className="p-5 bg-slate-950 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/10 transition-all">
                                            <div>
                                                <h4 className="text-base font-black text-white italic tracking-tight">{pat.name} ({pat.age})</h4>
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">BLOOD GROUP: {pat.blood}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className="bg-white/5 border border-white/10 text-white font-black text-[9px] tracking-widest uppercase px-3 py-1">{pat.status}</Badge>
                                                <Badge className={`${pat.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : pat.priority === 'ALERT' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'} font-black text-[9px] tracking-widest uppercase px-3 py-1`}>{pat.priority}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* CTAs */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">INTEGRATE YOUR HOSPITAL SYSTEM</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Coordinate with our technology consultants to deploy RESQR scanning terminals in your emergency wards.</p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link to="/contact">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">REQUEST HOSPITAL DEMO</Button>
                        </Link>
                        <Link to="/partners">
                            <Button size="lg" variant="outline" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest border-white/10 text-white hover:bg-white/5">PARTNER WITH RESQR</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
