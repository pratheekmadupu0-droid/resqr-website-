import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Shield, BookOpen, UserX, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HelpCenter() {
    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">GUARDIAN HELP DESK</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        RESQR SUPPORT & <br />
                        <span className="text-primary italic-display">HELP CENTER.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Access system configuration files, recover lost physical emergency tags, or connect with our customer safety operations desks.
                    </p>
                </div>
            </section>

            {/* Guides Columns */}
            <section className="py-24 px-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 border border-white/5 space-y-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-primary border border-white/10">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins">System Guides</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                        Read step-by-step layout tutorials explaining profile integrations, NFC tagging, and emergency coordinate settings.
                    </p>
                </Card>

                <Card className="p-8 border border-white/5 space-y-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-blue-400 border border-white/10">
                        <UserX size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins">Identity Recovery</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                        Lost your sticker pack or smart keychain card? Instantly block active credentials and register replacement codes.
                    </p>
                </Card>

                <Card className="p-8 border border-white/5 space-y-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-emerald-400 border border-white/10">
                        <PhoneCall size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins">Contact Safety Helpdesk</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                        Need immediate billing support, custom corporate demo setups, or hospital verification help? Send us a secure wire message.
                    </p>
                </Card>
            </section>
        </div>
    );
}
