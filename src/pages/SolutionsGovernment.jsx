import React from 'react';
import { Shield, MapPin, Activity, Award, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function SolutionsGovernment() {
    const systems = [
        { title: 'Public Health Infrastructure', desc: 'Sync civil hospital emergency wards with automated patient data feeds.' },
        { title: 'Disaster Recovery Logs', desc: 'Secure emergency cards for lightning-fast identity mapping in relief camps.' },
        { title: 'Citizen Safety Portals', desc: 'Fully compliant medical databases matching localized privacy laws.' },
        { title: 'Secure REST APIs', desc: 'State-certified data interfaces linking emergency response networks.' }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">CIVIC NETWORKS</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        PUBLIC SAFETY, <br />
                        <span className="text-primary italic-display">RE-ENGINEERED.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Partner with RESQR to build resilient citizen emergency networks. Enhance civic welfare with cloud-enabled rescue databases.
                    </p>
                </div>
            </section>

            {/* Systems Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {systems.map((s, idx) => (
                        <Card key={idx} className="p-10 hover:border-white/10 transition-all flex gap-6 items-start">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 text-primary">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins mb-4 text-white">{s.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">{s.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 px-4 text-center bg-slate-950">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">MUNICIPAL & STATE COLLABORATIONS</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Connect with our public sector team to configure citizen-wide smart identification systems.</p>
                    <div className="flex gap-6 justify-center">
                        <Link to="/contact">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">CONTACT CIVIC SOLUTIONS</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
