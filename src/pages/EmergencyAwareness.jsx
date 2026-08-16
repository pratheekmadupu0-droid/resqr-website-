import React from 'react';
import { Shield, Info, Heart, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function EmergencyAwareness() {
    const protocols = [
        { title: 'Triage Assessment', desc: 'Verify airway, breathing, and circulation levels first. Call local emergency dispatch numbers immediately.' },
        { title: 'Secure The Scene', desc: 'Ensure onlookers are safe and warn oncoming vehicular traffic when assisting road crashes.' },
        { title: 'Locate RESQR tags', desc: 'Scan for QR stickers on helmets, phone backs, or keychains to immediately retrieve emergency contacts.' },
        { title: 'Coordinate Handover', desc: 'Communicate blood type and pre-existing chronic conditions immediately to arriving paramedic teams.' }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">AWARENESS GATEWAY</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        CRITICAL SAFETY & <br />
                        <span className="text-primary italic-display">EMERGENCY FIRST-AID.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Equip yourself with verified knowledge. Discover the primary action steps required when discovering a citizen in sudden distress.
                    </p>
                </div>
            </section>

            {/* Protocols Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {protocols.map((p, idx) => (
                        <Card key={idx} className="p-10 hover:border-white/10 transition-all flex gap-6 items-start border border-white/5">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0 text-primary">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins mb-3 text-white">{p.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{p.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
