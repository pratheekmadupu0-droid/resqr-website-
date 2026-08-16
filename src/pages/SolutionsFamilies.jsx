import React from 'react';
import { Shield, Heart, Users, Bell, MapPin, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function SolutionsFamilies() {
    const navigate = useNavigate();
    const handleCtaClick = () => {
        if (auth?.currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const plans = [
        {
            title: 'Unified Dashboard',
            desc: 'Manage profiles for your spouse, children, and elderly parents from one central master dashboard account.',
            icon: <Users className="text-primary" size={24} />
        },
        {
            title: 'Real-time Alerts',
            desc: 'Get instant SMS notifications and WhatsApp alerts showing the exact GPS coordinates when any family member\'s QR is scanned.',
            icon: <Bell className="text-emerald-400" size={24} />
        },
        {
            title: 'Child Safety Gear',
            desc: 'Attach waterproof RESQR tags onto backpacks, wristbands, and school IDs for instant emergency protection.',
            icon: <Heart className="text-blue-400" size={24} />
        },
        {
            title: 'Elderly Medical Logs',
            desc: 'Save critical medical histories, prescriptions, blood groups, and chronic conditions for parents who may have difficulty speaking.',
            icon: <Shield className="text-amber-500" size={24} />
        }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">FAMILY GUARDIAN</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        PROTECT WHAT <br />
                        <span className="text-primary italic-display">MATTERS MOST.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        A single connected account to shield your children, parents, and partners with the ultimate real-time emergency telemetry system.
                    </p>
                </div>
            </section>

            {/* Plans Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {plans.map((p, idx) => (
                        <Card key={idx} className="p-10 hover:border-white/10 transition-all flex gap-6 items-start">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                                {p.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins mb-4 text-white">{p.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">{p.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 px-4 text-center bg-slate-950">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">SECURE YOUR HOUSEHOLD</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Protect up to 5 family members on a single dashboard plan. Get custom smart cards and gear delivered directly.</p>
                    <div className="flex gap-6 justify-center">
                        <Button size="lg" onClick={handleCtaClick} className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">ORDER FAMILY PACK</Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
