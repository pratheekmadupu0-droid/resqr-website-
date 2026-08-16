import React from 'react';
import { Shield, PhoneCall, MapPin, Eye, Info, CheckCircle2, QrCode } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function SolutionsFirstResponders() {
    const actions = [
        {
            title: 'Contact Family',
            desc: 'Tap to instantly call the patient\'s emergency contact list without revealing their private numbers.',
            icon: <PhoneCall className="text-primary" size={24} />
        },
        {
            title: 'Share Live Location',
            desc: 'Trigger automatic GPS telemetry sending coordinates to the next of kin via encrypted SMS links.',
            icon: <MapPin className="text-emerald-400" size={24} />
        },
        {
            title: 'Call Ambulance',
            desc: 'Quick dial button pre-mapped to local ambulance services (like 108) with localized emergency code details.',
            icon: <PhoneCall className="text-blue-400" size={24} />
        },
        {
            title: 'Find Nearest Hospital',
            desc: 'Visual maps showing nearest emergency centers equipped with specialized trauma services.',
            icon: <MapPin className="text-amber-500" size={24} />
        }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">FIRST RESPONDER INFO</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        YOU DON'T NEED TO KNOW THEM <br />
                        <span className="text-primary italic-display">TO HELP THEM.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        If you discover someone in a sudden emergency or road accident, their physical RESQR tag is the bridge to save their life. Scan, call, and coordinate critical care.
                    </p>
                </div>
            </section>

            {/* Actions Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">WHAT A BYSTANDER CAN DO</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Essential emergency portal tools</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {actions.map((act, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all flex gap-6 items-start">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                                {act.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins mb-3 text-white">{act.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{act.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Mockup Section */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4 flex justify-center">
                <div className="max-w-4xl text-center space-y-12">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">BYSTANDER EMERGENCY PORTAL VIEW</h2>
                    
                    {/* Phone Mockup */}
                    <div className="w-80 h-[600px] bg-slate-900 border-[10px] border-slate-950 rounded-[50px] shadow-2xl mx-auto overflow-hidden relative border-t-[12px] border-b-[12px]">
                        {/* Notch */}
                        <div className="w-32 h-5 bg-slate-950 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20" />
                        
                        {/* Screen Content */}
                        <div className="h-full w-full bg-slate-950 p-6 space-y-6 pt-10 overflow-y-auto text-left font-sans">
                            <div className="text-center space-y-2">
                                <Badge className="bg-red-500/10 text-red-500 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5">CRITICAL EMERGENCY PORTAL</Badge>
                                <div className="text-xl font-black text-white italic font-poppins">PRATHEEK M.</div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SECURE EMERGENCY PROFILE</div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-widest italic rounded-2xl shadow-lg shadow-primary/20">
                                    📞 CONTACT FAMILY
                                </button>
                                <button className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest italic rounded-2xl">
                                    📍 SHARE CURRENT LOCATION
                                </button>
                                <button className="w-full py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest italic rounded-2xl">
                                    🚑 DIAL AMBULANCE (108)
                                </button>
                            </div>

                            <div className="p-4 bg-slate-900 rounded-xl border border-white/5 space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Emergency ID</span>
                                    <span className="text-white">#RE-9817-A</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Local Center</span>
                                    <span className="text-white">Max Hospital</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Privacy Section */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-3xl font-black uppercase italic tracking-tight font-poppins mb-6">COMPLIANT PRIVACY PROTOCOLS</h2>
                    <p className="text-slate-400 text-sm max-w-xl mx-auto mb-8 font-medium italic">
                        "Emergency access is designed to provide only the information required for immediate assistance." Sensitive medical archives remain secure behind role-based OTP credentials.
                    </p>
                    <div className="flex justify-center">
                        <Link to="/store">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">GET YOUR RESQR</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
