import React from 'react';
import { Shield, Smartphone, Heart, Activity, CheckCircle2, QrCode, ArrowRight, Award, Compass, Eye, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function AboutUs() {
    const timelines = [
        { year: '2026', title: 'RESQR Foundation', desc: 'Company incorporated to build decentralized emergency response networks.' },
        { year: '2026', title: 'Hospital Sync Beta', desc: 'Successfully integrated live emergency patient databases across 10 major trauma centers.' },
        { year: '2026', title: 'Sticker & Card Deployment', desc: 'Shipped physical QR-enabled emergency passes to over 50,000 active citizens.' }
    ];

    const pillars = [
        { title: 'The Problem', desc: 'First responders arrive at incidents with zero knowledge of a victim\'s pre-existing conditions, allergies, or emergency family contacts.', icon: <Info className="text-primary" size={24} /> },
        { title: 'Our Solution', desc: 'A smart physical QR tag mapping directly to a secure, role-based cloud profile loaded in seconds on any smartphone camera.', icon: <CheckCircle2 className="text-emerald-400" size={24} /> },
        { title: 'Our Mission', desc: 'To make critical emergency information accessible when people cannot speak for themselves, bridging health tech with response metrics.', icon: <Award className="text-blue-400" size={24} /> },
        { title: 'Our Vision', desc: 'To coordinate a connected emergency safety network globally where every civilian, ambulance, and hospital operates in unison.', icon: <Compass className="text-amber-500" size={24} /> }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-slate-300 font-manrope">
            {/* Hero Section */}
            <section className="relative py-32 overflow-hidden bg-slate-950/40 border-b border-white/5">
                <div className="absolute top-0 right-0 p-32 opacity-[0.03] rotate-12 text-white pointer-events-none">
                    <Shield size={400} />
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <Badge className="bg-primary/20 text-primary border-none px-6 py-2 uppercase tracking-[0.3em] font-black italic">
                            ABOUT RESQR
                        </Badge>
                        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none font-poppins">
                            BUILDING A SAFER WAY TO <br />
                            <span className="text-primary italic-display">RESPOND TO EMERGENCIES.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
                            RESQR is the next-gen emergency identification system, engineered to bridge the gap between responders and medical data when every second counts.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pillars Section */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {pillars.map((p, idx) => (
                        <Card key={idx} className="p-10 hover:border-white/10 transition-all flex gap-6 items-start border border-white/5">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                                {p.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins mb-3 text-white">{p.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{p.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Timeline Landmarks */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins text-center mb-16">COMPANY LANDMARKS & EVOLUTION</h2>
                    <div className="space-y-12 relative border-l border-white/5 pl-8 ml-4">
                        {timelines.map((t, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -left-[41px] top-0 w-6 h-6 bg-primary border border-slate-950 rounded-full flex items-center justify-center font-black italic text-[9px] text-white">
                                    ✓
                                </div>
                                <span className="text-xs font-black text-primary uppercase tracking-widest">{t.year}</span>
                                <h3 className="text-lg font-black uppercase italic tracking-tight text-white mt-1">{t.title}</h3>
                                <p className="text-slate-400 text-xs mt-2 font-semibold leading-relaxed">{t.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final Call to Action */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto bg-slate-900 text-white p-20 rounded-[60px] text-center space-y-10 relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute inset-0 bg-primary/10 opacity-50" />
                    <div className="relative z-10 space-y-10">
                        <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none font-poppins">
                            Don't leave your <span className="text-primary">Safety</span> to chance.
                        </h2>
                        <p className="text-white/60 text-xl font-medium max-w-2xl mx-auto">
                            Join over 50,000 users who trust RESQR to speak for them when they can't.
                        </p>
                        <div className="pt-6">
                            <Link to="/store">
                                <Button size="lg" className="px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 active:scale-95 transition-transform">
                                    GET PROTECTED <ArrowRight size={18} className="ml-3" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
