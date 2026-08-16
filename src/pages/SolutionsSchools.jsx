import React from 'react';
import { Shield, Smartphone, Heart, Users, ChevronRight, Activity, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function SolutionsSchools() {
    const workflow = [
        'Student Enrollment',
        'RESQR Tag Assigned',
        'Emergency Event',
        'Instant Parent Alert',
        'Live GPS Tracking',
        'Emergency Services',
        'Hospital Pre-admit'
    ];

    const useCases = [
        { title: 'Student Identification', desc: 'Attach emergency QRs directly onto existing student ID cards or school smart passes.' },
        { title: 'Emergency Contacts', desc: 'Secure links mapping parent contact logs and primary pediatrician details.' },
        { title: 'Parent Communication', desc: 'Instant SMS updates when school authorities trigger medical response protocols.' },
        { title: 'Medical Information', desc: 'Store details of severe peanut allergies, asthma triggers, insulin levels, and medications.' },
        { title: 'Campus Emergency Response', desc: 'Give campus health centers verified tools to manage sudden student illness.' }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">ACADEMIC INSTITUTIONS</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        SAFETY THAT STAYS <br />
                        <span className="text-primary italic-display">WITH STUDENTS.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Deploy student safety passes and automated parent notification chains across campuses. Safeguard children with real-time medical profile backups.
                    </p>
                </div>
            </section>

            {/* Workflow Timeline */}
            <section className="py-24 bg-slate-950 border-b border-white/5 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">STUDENT INCIDENT WORKFLOW</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">From campus incident to active care delivery</p>
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

            {/* Use Cases */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">CAMPUS IMPLEMENTATION AREAS</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Pre-mapped safety protocols for students</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {useCases.map((uc, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all">
                            <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{uc.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-semibold">{uc.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">SECURE YOUR CAMPUS WORKFORCE & STUDENTS</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Connect with our institutional account specialists to configure campus safety plans.</p>
                    <div className="flex justify-center">
                        <Link to="/contact">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">REQUEST INSTITUTIONAL DEMO</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
