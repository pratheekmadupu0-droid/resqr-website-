import React from 'react';
import { Shield, Eye, Lock, ArrowRight, User, Heart, Smartphone, Users, MapPin, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function SolutionsIndividuals() {
    const navigate = useNavigate();
    const handleCtaClick = () => {
        if (auth?.currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const segments = [
        { title: 'Students', desc: 'Secure campus protection and emergency contacts link for school/university hours.' },
        { title: 'Drivers & Riders', desc: 'Instant identification and crash detection alerts on high-speed transits.' },
        { title: 'Senior Citizens', desc: 'Pre-existing condition details and medication protocols accessible in vital moments.' },
        { title: 'Travellers', desc: 'Multilingual profile options and secure insurance parameters globally mapped.' },
        { title: 'Industrial Workers', desc: 'Compliance tracking and immediate occupational hazard emergency reporting.' },
        { title: 'Parents & Families', desc: 'Coordinated child profiles with next-of-kin links and active GPS tracking.' },
        { title: 'Medical Condition Holders', desc: 'Immediate notification of allergies, epilepsy, diabetes, or rare conditions.' },
        { title: 'Children', desc: 'Simplified wearables/stickers for immediate location and guardian link.' }
    ];

    const emergencyWorkflow = [
        { title: 'Incident Occurs', desc: 'Individual is found unresponsive or unable to speak.' },
        { title: 'RESQR Tag Found', desc: 'First responder spots the helmet sticker, band, or wallet card.' },
        { title: 'QR Scan Initiated', desc: 'A smartphone camera scans the unique QR code instantly.' },
        { title: 'Emergency Profile Opens', desc: 'Bystander sees key action options to coordinate care.' },
        { title: 'Family Notified', desc: 'Emergency contacts receive SMS alerts with live GPS coordinates.' },
        { title: 'Hospital Alerted', desc: 'Local network hospitals receive incoming medical notifications.' }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">PERSONAL SECURITY</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        YOUR EMERGENCY IDENTITY, <br />
                        <span className="text-primary italic-display">WHEREVER YOU GO.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Secure vital protection for yourself and your loved ones. RESQR bridges the critical gap between medical data and emergency response.
                    </p>
                </div>
            </section>

            {/* Segments Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">DESIGNED FOR EVERY CITIZEN</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Tailored protection layers for diverse use cases</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {segments.map((s, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins text-white mb-4">{s.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-medium">{s.desc}</p>
                            </div>
                            <div className="mt-8 text-primary font-black text-[10px] uppercase tracking-widest italic flex items-center gap-1.5">
                                ACTIVE PROTECTION <Zap size={12} />
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Interactive Journey Flow */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">WHAT HAPPENS IN AN EMERGENCY?</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">The instantaneous step-by-step rescue sequence</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        {emergencyWorkflow.map((w, idx) => (
                            <div key={idx} className="relative group text-center md:text-left">
                                <div className="text-3xl font-black text-primary/20 italic mb-4">{(idx + 1).toString().padStart(2, '0')}</div>
                                <h4 className="text-sm font-black uppercase italic tracking-wider text-white mb-2">{w.title}</h4>
                                <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">{w.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Access Control Side-by-Side */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">ROBUST ACCESS ARCHITECTURE</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Visualizing bystander view vs verified medical access</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Stranger View Card */}
                    <Card className="p-8 md:p-12 border-blue-500/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Eye size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter font-poppins text-white">WHAT A STRANGER CAN SEE</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Public emergency interface</p>
                            </div>
                        </div>

                        <div className="space-y-4 p-6 bg-slate-950 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Patient Name</span>
                                <span className="text-white">PRATHEEK M.</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Emergency SOS Contact</span>
                                <span className="text-primary font-black italic">CALL FAMILY</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Live GPS Telemetry</span>
                                <span className="text-emerald-500 font-black italic">SHARE LOCATION</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Ambulance Dispatch</span>
                                <span className="text-white font-black italic">CALL 108</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 font-bold uppercase tracking-wider text-slate-400">
                                <span>Nearest Medical Center</span>
                                <span className="text-white font-black italic">MAP ROUTE</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-6 italic">
                            * Safe privacy protocol ensures no health conditions, medicines, or sensitive medical info is visible to the public scanning terminal.
                        </p>
                    </Card>

                    {/* Hospital View Card */}
                    <Card className="p-8 md:p-12 border-primary/20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter font-poppins text-white">WHAT A MEDICAL PRO CAN SEE</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Verified OTP/Token access only</p>
                            </div>
                        </div>

                        <div className="space-y-4 p-6 bg-slate-950 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Blood Group Specimen</span>
                                <span className="text-primary font-black italic">O+ POSITIVE</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Medical Conditions</span>
                                <span className="text-white">Type 1 Diabetes, Penicillin Allergy</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Active Medications</span>
                                <span className="text-white">Metformin 500mg, Lantus Insulin</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 border-b border-white/5 font-bold uppercase tracking-wider text-slate-400">
                                <span>Insurance Provider</span>
                                <span className="text-white">HDFC ERGO / Policy #98175-H</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-3 font-bold uppercase tracking-wider text-slate-400">
                                <span>Authorized access log</span>
                                <span className="text-emerald-500 font-bold uppercase tracking-widest text-[9px]">ENCRYPTED LOGGED</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-6 italic">
                            * Strictly governed access matching compliance standards. Full audit logs are committed to the security database.
                        </p>
                    </Card>
                </div>
            </section>

            {/* CTA section */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">CHOOSE EMERGENCY PROTECTION</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Protect yourself and your loved ones today with RESQR digital emergency passes and gear.</p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" onClick={handleCtaClick} className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">GET YOUR RESQR</Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
