import React from 'react';
import { Shield, Smartphone, QrCode, AlertTriangle, Search, Lock, UserCheck, HeartHandshake, PhoneCall } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function HowItWorks() {
    const navigate = useNavigate();
    const handleCtaClick = () => {
        if (auth?.currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };
    const stages = [
        {
            num: '01',
            title: 'Register',
            desc: 'User creates a RESQR account and secures their vital profile details.',
            icon: <Smartphone className="text-primary" size={28} />,
            details: [
                'Secure Mobile OTP Authentication',
                'Personal & Demographic Information',
                'Emergency Contacts (Next of Kin)',
                'Crucial Medical Information & History',
                'Health Insurance & Policy Information'
            ]
        },
        {
            num: '02',
            title: 'Create Your Emergency Identity',
            desc: 'Every registered individual receives a unique, globally identifier code mapped securely on the cloud.',
            icon: <UserCheck className="text-blue-400" size={28} />,
            details: [
                'Unique Patient Identity Code',
                'Decentralized Cloud Medical Profile',
                'Encrypted backend data containment',
                'Dynamic data updating capability'
            ]
        },
        {
            num: '03',
            title: 'Get Your RESQR',
            desc: 'Choose how you want to carry your emergency identity with our range of smart products.',
            icon: <QrCode className="text-emerald-400" size={28} />,
            details: [
                'Digital QR Pass for Apple/Google Wallet',
                'Waterproof QR Stickers for Helmets & Gear',
                'Embedded NFC Smart Cards & Keychains',
                'Future Wearables (Bands, Rings & Bracelets)'
            ]
        },
        {
            num: '04',
            title: 'Emergency Occurs',
            desc: 'A realistic, unexpected critical accident, road crash, or sudden illness scenario where every second is vital.',
            icon: <AlertTriangle className="text-amber-500 animate-pulse" size={28} />,
            details: [
                'Sudden medical episode or road crash',
                'Victim is unconscious or unable to communicate',
                'No phone passcodes are known to bystanders',
                'Critical details are immediately required'
            ]
        },
        {
            num: '05',
            title: 'Bystander Scans',
            desc: 'Any ordinary citizen can scan the physical RESQR code using their native smartphone camera—no app download required, and without needing to unlock the user\'s phone.',
            icon: <Search className="text-violet-400" size={28} />,
            details: [
                'Compatible with iOS & Android native cameras',
                'No external apps required for initial scan',
                'Instant secure web loading',
                'Works regardless of phone passcode status'
            ]
        },
        {
            num: '06',
            title: 'Emergency Information Portal',
            desc: 'The bystander sees a curated public portal designed to coordinate immediate on-site support.',
            icon: <HeartHandshake className="text-teal-400" size={28} />,
            details: [
                'Patient Name & Display Photo',
                'One-click Emergency Contact Calling',
                'Share current GPS coordinates',
                'Quick-dial local Emergency Ambulance',
                'Locate Nearest Network Hospital'
            ],
            note: 'Privacy Enforcement: Strangers do NOT receive unrestricted access to sensitive medical files or history.'
        },
        {
            num: '07',
            title: 'Authorised Medical Access',
            desc: 'Only verified paramedics, doctors, and hospitals can securely access the locked medical profile.',
            icon: <Lock className="text-red-500" size={28} />,
            details: [
                'Role-based verified OTP/Token credentials',
                'Secured Blood Group & Allergies records',
                'Active Medical Conditions & Medications list',
                'Emergency contact notify & location ping',
                'Insurance coverage details for swift admission'
            ]
        },
        {
            num: '08',
            title: 'Emergency Response Chain',
            desc: 'A fully coordinated, real-time rescue sequence starts immediately from the initial scan.',
            icon: <PhoneCall className="text-indigo-400" size={28} />,
            details: [
                'Next of Kin receives SMS with GPS Location link',
                'Ambulance picks up patient with medical record preview',
                'Receiving Hospital prepares ICU bed & specific blood units',
                'On-duty Doctor reviews critical list before arrival'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">THE EMERGENCY SYSTEM</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        WHEN EVERY SECOND MATTERS, <br />
                        <span className="text-primary italic-display">RESQR CONNECTS THE RIGHT PEOPLE.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        From the moment an emergency happens to the moment the right help arrives. Discover our end-to-end medical response journey.
                    </p>
                </div>
            </section>

            {/* Stages Section */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {stages.map((stage) => (
                        <Card key={stage.num} className="p-8 md:p-12 hover:border-white/10 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                            {stage.icon}
                                        </div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight font-poppins">{stage.title}</h3>
                                    </div>
                                    <span className="text-4xl font-black italic text-white/10">{stage.num}</span>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">{stage.desc}</p>
                                
                                <ul className="space-y-3 mb-8">
                                    {stage.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {stage.note && (
                                <div className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20 text-xs font-black text-primary uppercase tracking-widest italic flex items-center gap-3">
                                    <Shield size={16} /> {stage.note}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </section>

            {/* Visual Divider / Accent */}
            <section className="py-24 bg-slate-950 border-y border-white/5 text-center px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins mb-6">
                        "ONE IDENTITY. ONE SCAN. A CONNECTED EMERGENCY RESPONSE."
                    </h2>
                    <p className="text-slate-500 text-sm uppercase tracking-[0.2em] font-black italic">
                        Securing lives through technology since 2026.
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 md:p-24 rounded-[60px] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter font-poppins mb-8 leading-none">
                        Secure Your <span className="text-primary italic-display">Identity Today.</span>
                    </h2>
                    <p className="text-slate-400 text-base md:text-lg mb-12 max-w-xl mx-auto font-medium">
                        Join thousands of families, professionals, and hospitals currently using the RESQR critical response infrastructure.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Button size="lg" onClick={handleCtaClick} className="px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">
                            GET YOUR RESQR
                        </Button>
                        <Link to="/partners">
                            <Button size="lg" variant="outline" className="px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest border-white/10 text-white hover:bg-white/5">
                                PARTNER WITH RESQR
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
