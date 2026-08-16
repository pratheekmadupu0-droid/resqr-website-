import React from 'react';
import { Shield, Cpu, Database, Bell, MapPin, BarChart3, Lock, Server, Link2, CreditCard } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Technology() {
    const techAreas = [
        { title: 'QR Technology', desc: 'UV-protected high-contrast physical barcodes matched with NFC chips for cross-device scans.', icon: <Cpu className="text-primary" size={24} /> },
        { title: 'OTP Authentication', desc: 'Secure phone validation logs ensuring only validated users access dashboard settings.', icon: <Lock className="text-blue-400" size={24} /> },
        { title: 'Secure REST APIs', desc: 'Fully verified API pipelines connecting user registries with emergency hospital scanners.', icon: <Link2 className="text-emerald-400" size={24} /> },
        { title: 'Cloud Infrastructure', desc: 'Redundant, state-monitored firewalls providing maximum data uptime and stability.', icon: <Server className="text-amber-500" size={24} /> },
        { title: 'Notification System', desc: 'Automated notification systems triggering instant WhatsApp & SMS coordinates alerts to families.', icon: <Bell className="text-teal-400" size={24} /> },
        { title: 'Location Services', desc: 'Bystander browser-based GPS coordinate tracking using safe consent controls.', icon: <MapPin className="text-indigo-400" size={24} /> },
        { title: 'Hospital Dashboard', desc: 'Triage systems matching incoming patient IDs with active ER room capacity feeds.', icon: <Database className="text-violet-400" size={24} /> },
        { title: 'Payment Gateways', desc: 'Razorpay checkout scripts enabling secure subscriptions and gear ordering.', icon: <CreditCard className="text-rose-400" size={24} /> }
    ];

    const flows = [
        'Mobile Registration App',
        'Secure Profile Generation',
        'Dynamic QR Identity Code',
        'Cloud Emergency Access Gateway',
        'SMS & WhatsApp Notifications',
        'Hospital verified credentials',
        'Critical ER handoff'
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">THE TECH STACK</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        THE TECHNOLOGY <br />
                        <span className="text-primary italic-display">BEHIND RESQR.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Discover the real-time cloud architecture, secure credentials validation, and physical QR tag sync workflows keeping citizens safe.
                    </p>
                </div>
            </section>

            {/* Architecture Diagram */}
            <section className="py-24 bg-slate-950 border-b border-white/5 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins mb-16">SYSTEM ECOSYSTEM ARCHITECTURE</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 max-w-5xl mx-auto">
                        {flows.map((fl, idx) => (
                            <div key={idx} className="p-5 bg-medical-card/40 rounded-2xl border border-white/5 flex flex-col justify-between items-center text-center relative">
                                <span className="text-xs font-black text-primary italic mb-3">{(idx + 1).toString().padStart(2, '0')}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">{fl}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Areas */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">CORE SYSTEM PLATFORM COMPONENT</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">High-performance integrations backing emergency care</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {techAreas.map((ta, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all border border-white/5 flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 mb-6 text-slate-300">
                                    {ta.icon}
                                </div>
                                <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{ta.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{ta.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
