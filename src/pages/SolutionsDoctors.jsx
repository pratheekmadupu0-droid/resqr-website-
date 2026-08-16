import React from 'react';
import { Shield, Lock, Eye, CheckCircle2, UserCheck, Star, Activity, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function SolutionsDoctors() {
    const accessLevels = [
        {
            lvl: 'LEVEL 1',
            title: 'Public Emergency Information',
            desc: 'Accessible to anyone scanning the QR code in an emergency. Includes next of kin contact, quick dial buttons, and name.',
            color: 'text-blue-400 border-blue-500/20'
        },
        {
            lvl: 'LEVEL 2',
            title: 'Authorised Responder Information',
            desc: 'Accessible to registered paramedics and police officers. Includes basic triage info, blood type, and emergency contacts.',
            color: 'text-amber-400 border-amber-500/20'
        },
        {
            lvl: 'LEVEL 3',
            title: 'Authorised Medical Information',
            desc: 'Accessible to verified medical professionals only. Includes allergies, current active prescription medications, and health conditions.',
            color: 'text-primary border-primary/20'
        },
        {
            lvl: 'LEVEL 4',
            title: 'Patient Private Information',
            desc: 'Accessible only to the profile owner and their designated doctors. Includes detailed medical history and files.',
            color: 'text-emerald-400 border-emerald-500/20'
        }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">MEDICAL VERIFICATION</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        CRITICAL INFORMATION. <br />
                        <span className="text-primary italic-display">WHEN IT MATTERS MOST.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Verify patient identities, access encrypted medical records instantly, and execute treatment protocols with guaranteed data integrity.
                    </p>
                </div>
            </section>

            {/* Information Hierarchy */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">INFORMATION ACCESS HIERARCHY</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Strict separation of data based on scanning authorization role</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {accessLevels.map((lvl, idx) => (
                        <Card key={idx} className={`p-8 hover:border-white/10 transition-all border flex flex-col justify-between ${lvl.color}`}>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest block opacity-60 mb-2">{lvl.lvl}</span>
                                <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-4">{lvl.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{lvl.desc}</p>
                            </div>
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <Lock size={12} /> SECURED DATA
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Doctor Portal Mockup */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">DOCTOR CLINIC GATEWAY</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Professional patient diagnostics dashboard view</p>
                    </div>

                    <Card className="bg-medical-card border-white/5 overflow-hidden p-0 rounded-[40px] shadow-2xl relative">
                        {/* Fake Browser Bar */}
                        <div className="bg-slate-900 px-6 py-4 flex items-center gap-2 border-b border-white/5">
                            <span className="w-3 h-3 rounded-full bg-red-500/50" />
                            <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <span className="w-3 h-3 rounded-full bg-green-500/50" />
                            <div className="bg-slate-950 px-6 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4 w-72">
                                resqr.org/doctor-terminal
                            </div>
                        </div>

                        <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-6 bg-slate-950 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-wider text-white">DR. KIRAN M.</h4>
                                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">VERIFIED PHYSICIAN</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide space-y-1">
                                        <div>MCI Reg ID: MCI-71822</div>
                                        <div>Facility: Max Hospital, Delhi</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest italic shadow-lg shadow-primary/20">
                                        SCAN INCOMING PATIENT
                                    </button>
                                    <button className="w-full py-4 bg-white/5 border border-white/5 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest italic">
                                        PATIENT ACCESS LOGS
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-2 p-8 bg-slate-950 rounded-2xl border border-white/5 space-y-6">
                                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                    <div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">PATIENT PROFILE: ACTIVE SCAN</h3>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">ID: #RE-9817-A</p>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] tracking-widest px-3 py-1 uppercase">VERIFIED ACTIVE</Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Blood Group Specimen</span>
                                        <div className="text-base font-black text-white italic">O- NEGATIVE</div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Known Allergies</span>
                                        <div className="text-xs font-bold text-white">Sulfa Drugs, Peanuts</div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Chronic Conditions</span>
                                        <div className="text-xs font-bold text-white">Asthma, Hypertension</div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Emergency Contacts</span>
                                        <div className="text-xs font-bold text-primary italic">9985309102 (Mother)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">JOIN THE RESQR MEDICAL NETWORK</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Equip your practice or clinic with secure emergency profile scan verification credentials.</p>
                    <div className="flex gap-6 justify-center">
                        <Link to="/contact">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">EXPLORE RESQR FOR DOCTORS</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
