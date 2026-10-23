import React from 'react';
import { 
    Shield, Smartphone, Heart, Activity, CheckCircle2, QrCode, 
    ArrowRight, Award, Compass, Eye, Info, Building2, Lock, Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import ResqrLogo from '../components/branding/ResqrLogo';

export default function AboutUs() {
    const navigate = useNavigate();

    const handleCtaClick = () => {
        if (auth?.currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const pillars = [
        { 
            title: 'The Challenge', 
            desc: 'When sudden road collisions, cardiac episodes, or transit emergencies occur, responders frequently arrive to find victims unconscious or unable to communicate. Bystanders cannot unlock smartphones, leaving vital allergies, blood groups, and next-of-kin contacts unreachable during the critical Golden Hour.', 
            icon: <Info className="text-primary" size={24} /> 
        },
        { 
            title: 'Our Technology Solution', 
            desc: 'A physical scannable QR or contactless NFC identifier that resolves to an ephemeral, secure mobile gateway in seconds on any standard smartphone camera. No external apps required, no reliance on phone passcodes.', 
            icon: <CheckCircle2 className="text-emerald-400" size={24} /> 
        },
        { 
            title: 'Privacy By Design', 
            desc: 'Public bystanders see only minimal vital coordination data (name, blood group, masked family telephone trigger). Extended medical histories remain strictly isolated behind verified healthcare authorization gates in compliance with India\'s DPDP Act, 2023.', 
            icon: <Lock className="text-blue-400" size={24} /> 
        },
        { 
            title: 'Our Long-Term Mission', 
            desc: 'To establish connected, accessible emergency identification across all Indian states and municipalities—connecting civilians, ambulances, and trauma hospitals under a shared public safety standard.', 
            icon: <Compass className="text-amber-400" size={24} /> 
        }
    ];

    const platformPrinciples = [
        {
            title: "Zero Vendor Lock-In",
            desc: "Designed using standard QR codes and NTAG216 NFC chips readable by native iOS and Android cameras without proprietary apps."
        },
        {
            title: "Dynamic Cloud Identity",
            desc: "Updating contact numbers or medication changes in your dashboard immediately updates the scan destination without tag reprinting."
        },
        {
            title: "Transparent Legal Governance",
            desc: "Sion Enterprises maintains strict purpose limitation and data principal consent compliance under Indian data protection legislation."
        },
        {
            title: "Tamper-Resilient Physical Gear",
            desc: "Reflective 3M vinyl stickers and stainless steel tags built for high thermal variance, heavy monsoon rains, and prolonged UV exposure."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30">
            {/* Hero Section */}
            <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 border-b border-white/10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <ResqrLogo className="h-10 sm:h-12 w-auto mx-auto object-contain" />
                    
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                        ABOUT RESQR
                    </span>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                        Bridging the Golden-Hour Void <br />
                        <span className="text-primary">When Seconds Save Lives.</span>
                    </h1>

                    <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
                        RESQR is an emergency identification platform engineered by Sion Enterprises in Hyderabad, Telangana. We provide scannable physical and digital identifiers that keep emergency contacts and permitted health data immediately reachable during life-critical situations.
                    </p>
                </div>
            </section>

            {/* Core Mission Pillars */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">PURPOSE & ARCHITECTURE</span>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white">Why RESQR Exists</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pillars.map((p, idx) => (
                        <div 
                            key={idx} 
                            className="bg-[#17191D] border border-white/10 rounded-2xl p-8 space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                                    {p.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white uppercase">{p.title}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed font-normal">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Corporate Structure & Principles */}
            <section className="py-20 bg-[#121519] border-y border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">CORPORATE & TECHNICAL FOUNDATION</span>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">Platform Principles</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {platformPrinciples.map((principle, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-[#17191D] border border-white/10 space-y-3">
                                <span className="text-xs font-mono text-primary font-bold">0{idx + 1}</span>
                                <h3 className="text-sm font-bold text-white uppercase">{principle.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{principle.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Legal Entity Details */}
                    <div className="p-6 rounded-2xl bg-[#17191D] border border-white/10 max-w-3xl mx-auto text-center space-y-2 text-xs text-slate-400">
                        <p className="font-bold text-white uppercase">Corporate Entity Notice</p>
                        <p>
                            RESQR™ is an emergency technology product developed and operated by <strong>Sion Enterprises</strong> (commercial collaboration with Sicon Technologies), headquartered in Hyderabad, Telangana, India.
                        </p>
                    </div>
                </div>
            </section>

            {/* Final Call to Action */}
            <section className="py-24 text-center px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                        Equip Yourself with an Emergency Identity
                    </h2>
                    <p className="text-slate-300 text-sm max-w-xl mx-auto">
                        Ensure your important emergency information is accessible when every second matters.
                    </p>
                    <div className="pt-2">
                        <button 
                            onClick={handleCtaClick} 
                            className="px-8 py-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all"
                        >
                            Create Your RESQR Profile
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
