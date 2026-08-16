import React from 'react';
import { Newspaper, Calendar, User, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function StoriesPage() {
    const articles = [
        {
            category: 'Road Safety',
            title: 'Gold Hour Management: How Immediate Medical Profiling Mitigates Crash Risks',
            desc: '[SAMPLE CONTENT] Exploring the critical impact of displaying verified blood type and allergies within the initial minutes of high-speed collision responses.',
            date: 'August 14, 2026',
            author: 'RESQR Editorial Team'
        },
        {
            category: 'Technology',
            title: 'Role-Based Decryption: Balancing Public Safety and Personal Health Data Rights',
            desc: '[SAMPLE CONTENT] An in-depth review of our AES-256 cloud token security pipeline restricting unauthorized scans from sensitive medical file access.',
            date: 'August 08, 2026',
            author: 'Tech Compliance Dept'
        },
        {
            category: 'Healthcare Partnerships',
            title: 'Expanding Triage Admission Networks Across Civil Emergency Trauma Centers',
            desc: '[SAMPLE CONTENT] Presenting real-time sync adapters that direct patient profile telemetry straight to on-call surgeon dashboard queues.',
            date: 'July 29, 2026',
            author: 'Operations Director'
        }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">RESQR EDITORIALS</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        STORIES, RESEARCH, <br />
                        <span className="text-primary italic-display">& AWARENESS LOGS.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Stay informed with articles detailing emergency tech developments, road safety guidelines, and clinical network updates.
                    </p>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {articles.map((art, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all flex flex-col justify-between border border-white/5">
                            <div>
                                <Badge className="bg-primary/10 text-primary border-none text-[8px] tracking-widest uppercase mb-6 px-3 py-1">{art.category}</Badge>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins text-white mb-4 leading-tight">{art.title}</h3>
                                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 italic">{art.desc}</p>
                            </div>

                            <div className="border-t border-white/5 pt-6 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest italic">
                                <span className="flex items-center gap-1.5"><Calendar size={12} /> {art.date}</span>
                                <span className="flex items-center gap-1.5"><User size={12} /> {art.author}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
