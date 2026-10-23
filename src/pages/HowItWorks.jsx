import React, { useState } from 'react';
import { 
    Shield, Smartphone, QrCode, AlertTriangle, Search, Lock, 
    UserCheck, HeartHandshake, PhoneCall, Maximize2, X, Check,
    Eye, ShieldCheck, ArrowRight, Clock, HelpCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function HowItWorks() {
    const navigate = useNavigate();
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
            title: 'Account Registration',
            desc: 'The citizen registers on the RESQR platform via mobile OTP or Google authentication.',
            icon: <Smartphone className="text-primary" size={24} />,
            details: [
                'Verified mobile or Google authentication',
                'Basic demographic data (Name, Age, City)',
                'Unique random account identifier created',
                'No public indexing of account credentials'
            ]
        },
        {
            num: '02',
            title: 'Emergency Contacts Setup',
            desc: 'The user designates trusted emergency contacts (next of kin, spouse, guardians) to be reached in crisis.',
            icon: <PhoneCall className="text-emerald-400" size={24} />,
            details: [
                'Primary and secondary contact designations',
                'Relationship specifications (e.g., Spouse, Parent)',
                'Numbers stored in user secure vault',
                'Numbers are masked on public scan displays'
            ]
        },
        {
            num: '03',
            title: 'Voluntary Medical Data',
            desc: 'The user chooses which critical medical facts to record for emergency responder guidance.',
            icon: <UserCheck className="text-blue-400" size={24} />,
            details: [
                'Blood group verification and donor pledge',
                'Severe drug allergies (e.g. Penicillin, Sulfa)',
                'Chronic medical conditions & daily medications',
                'Voluntary submission; only emergency contacts are mandatory'
            ]
        },
        {
            num: '04',
            title: 'Tag & Identifier Activation',
            desc: 'The profile is bound to a scannable QR or contactless NFC identifier tag.',
            icon: <QrCode className="text-amber-400" size={24} />,
            details: [
                'Weatherproof 3M reflective helmet sticker',
                'Stainless steel laser-etched keychain',
                'Smart contactless NFC wallet card',
                'Digital Apple/Google wallet emergency pass'
            ]
        },
        {
            num: '05',
            title: 'Emergency Scene Scan',
            desc: 'During an unexpected road accident or medical event, a passerby or paramedic scans the tag.',
            icon: <Search className="text-violet-400" size={24} />,
            details: [
                'Scans using native smartphone camera (iOS & Android)',
                'No app download or account creation needed for scanner',
                'Instant secure HTTPS mobile web portal load',
                'Works regardless of whether the victim\'s phone is locked'
            ]
        },
        {
            num: '06',
            title: 'Governed Access Display',
            desc: 'The system renders only information permitted under the platform\'s role-based access policy.',
            icon: <HeartHandshake className="text-teal-400" size={24} />,
            details: [
                'Patient name and blood group displayed clearly',
                'Masked contact relay ("Connect Call" action)',
                'Quick-dial emergency ambulance (108) / police (100)',
                'Nearest hospital directory assistance'
            ],
            note: 'Privacy Guarantee: Strangers and bystanders do NOT receive full clinical dossiers or home street addresses.'
        },
        {
            num: '07',
            title: 'Authorized Clinical Access',
            desc: 'Verified healthcare professionals in trauma centers access detailed medical records.',
            icon: <Lock className="text-red-500" size={24} />,
            details: [
                'Time-limited cryptographic session token',
                'Access to allergies, medications, and surgical notes',
                'Immutable audit logging of every record view',
                'Helps prevent adverse drug reactions during acute trauma'
            ]
        },
        {
            num: '08',
            title: 'Dynamic Updating & Revocation',
            desc: 'The physical tag remains dynamic; updates take effect instantly without tag reprinting.',
            icon: <ShieldCheck className="text-primary" size={24} />,
            details: [
                'Update phone numbers or medications anytime in dashboard',
                'Same physical sticker reflects updates immediately',
                'Lost tags can be instantly revoked from the dashboard',
                'Revoked tags immediately cease to display information'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30">
            {/* Hero Section */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 max-w-7xl mx-auto">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                        <Clock size={13} /> THE EMERGENCY RESPONSE LIFECYCLE
                    </span>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                        How RESQR Works: <br />
                        <span className="text-primary">From Registration to Rescue</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
                        An end-to-end overview of how registered emergency profiles connect first responders with designated contacts and permitted health data.
                    </p>
                </div>
            </section>

            {/* Visual Workflow Infographic Card */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="bg-[#17191D] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
                    <div className="text-center space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">OFFICIAL ARCHITECTURE MAP</span>
                        <h2 className="text-2xl font-bold uppercase text-white">System Response Infographic</h2>
                        <p className="text-xs text-slate-400">Click to expand the complete system overview in high resolution.</p>
                    </div>

                    <div 
                        onClick={() => setIsLightboxOpen(true)}
                        className="relative rounded-2xl overflow-hidden border border-white/10 bg-white p-3 hover:scale-[1.005] transition-all cursor-zoom-in group"
                    >
                        <img 
                            src="/resqr_pamphlet.jpg" 
                            alt="RESQR - How It Works Visual Infographic Architecture" 
                            className="w-full h-auto object-contain rounded-xl mx-auto max-h-[700px]"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <div className="bg-primary text-white p-3.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                <Maximize2 size={22} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div 
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                        className="absolute top-6 right-6 p-3 bg-charcoal border border-white/10 rounded-full text-slate-300 hover:text-white transition-all z-50"
                        aria-label="Close image preview"
                    >
                        <X size={20} />
                    </button>
                    <div onClick={(e) => e.stopPropagation()} className="relative max-w-6xl max-h-[90vh] overflow-auto bg-white p-3 rounded-2xl">
                        <img 
                            src="/resqr_pamphlet.jpg" 
                            alt="RESQR System Infographic Fullscreen" 
                            className="max-w-full h-auto object-contain mx-auto max-h-[85vh] rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Step-by-Step Stages */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stages.map((stage) => (
                        <div 
                            key={stage.num} 
                            className="bg-[#17191D] border border-white/10 rounded-2xl p-7 flex flex-col justify-between space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                            {stage.icon}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-mono text-primary font-bold tracking-widest">{stage.num}</span>
                                            <h3 className="text-lg font-bold uppercase text-white leading-snug">{stage.title}</h3>
                                        </div>
                                    </div>
                                    <span className="text-3xl font-black font-mono text-white/5">{stage.num}</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">{stage.desc}</p>
                                
                                <ul className="space-y-2 pt-2 border-t border-white/5">
                                    {stage.details.map((detail, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {stage.note && (
                                <div className="p-3.5 bg-primary/10 rounded-xl border border-primary/20 text-xs font-medium text-red-200 flex items-center gap-2.5">
                                    <Shield size={16} className="text-primary shrink-0" />
                                    <span>{stage.note}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom Call to Action */}
            <section className="py-20 bg-[#121519] border-t border-white/10 text-center px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                        Ready to Protect Yourself & Your Family?
                    </h2>
                    <p className="text-slate-300 text-sm max-w-xl mx-auto">
                        Takes less than 3 minutes to register your account and configure emergency contacts.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
                        <button 
                            onClick={handleCtaClick} 
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all"
                        >
                            Create Your RESQR
                        </button>
                        <Link 
                            to="/government-partnerships" 
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Institutional Inquiries
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
