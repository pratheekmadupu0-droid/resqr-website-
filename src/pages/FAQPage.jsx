import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Shield, QrCode, Lock, Building2, User, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FAQPage() {
    const categories = [
        { id: 'GENERAL', label: 'Platform & Purpose', icon: HelpCircle },
        { id: 'PROFILES', label: 'Profiles & Registration', icon: User },
        { id: 'EMERGENCY', label: 'Emergency Scene Scanning', icon: QrCode },
        { id: 'PRIVACY', label: 'Privacy & Permissions', icon: Lock },
        { id: 'PRODUCTS', label: 'Physical Gear & Tags', icon: Shield },
        { id: 'HEALTHCARE', label: 'Hospitals & Doctors', icon: Building2 },
    ];

    const [activeCategory, setActiveCategory] = useState('GENERAL');
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            cat: 'GENERAL',
            q: 'What is RESQR and who operates it?',
            a: 'RESQR is an emergency identification platform developed and operated by Sion Enterprises, based in Hyderabad, India. It connects scannable physical and digital identifiers to an emergency profile so first responders can reach designated family contacts and view permitted medical information.'
        },
        {
            cat: 'GENERAL',
            q: 'Does a person scanning a RESQR need to install an app?',
            a: 'No. Any smartphone with a standard built-in camera (iOS or Android) can scan the QR tag directly. The emergency profile opens instantly in the phone’s native browser.'
        },
        {
            cat: 'GENERAL',
            q: 'Is RESQR a replacement for emergency ambulance services?',
            a: 'No. RESQR is an identification and emergency information platform, not a medical dispatch agency. In any life-threatening situation, callers should dial 108 (Ambulance) or 100 (Police) immediately.'
        },
        {
            cat: 'PROFILES',
            q: 'How do I register and create my profile?',
            a: 'Visit the Login page on resqr.co.in, verify your mobile number via OTP or authenticate with Google, and complete your basic profile setup. You can designate emergency contacts and voluntarily record vital health information.'
        },
        {
            cat: 'PROFILES',
            q: 'What information is mandatory to register?',
            a: 'Only your name and at least one designated emergency contact are required. All medical details (such as blood group, drug allergies, and medications) are entered voluntarily.'
        },
        {
            cat: 'PROFILES',
            q: 'What happens if I need to update my details later?',
            a: 'You can update your phone numbers, contacts, or medical details in your RESQR Dashboard at any time. Because physical tags point to your dynamic cloud identity, changes take effect immediately without reprinting tags.'
        },
        {
            cat: 'EMERGENCY',
            q: 'What does a bystander see when scanning my tag?',
            a: 'A public scan displays: (1) Patient Name, (2) Blood Group, (3) A masked "Connect Call" trigger to phone your designated emergency contact, and (4) Quick-dial links to 108 Ambulance and 100 Police.'
        },
        {
            cat: 'EMERGENCY',
            q: 'Are my family members\' real phone numbers visible to strangers?',
            a: 'No. Phone numbers are masked on the screen (e.g., +91 ••••• ••42). When a responder taps "Connect Call", their mobile phone dialer initiates the call without exposing the unmasked contact number in the browser window.'
        },
        {
            cat: 'PRIVACY',
            q: 'How does RESQR protect my health records under Indian privacy law?',
            a: 'RESQR is designed around purpose specification and data minimization in alignment with the Digital Personal Data Protection (DPDP) Act, 2023. Detailed medical conditions and surgical records are not shown to public passersby; they require authorized clinical verification.'
        },
        {
            cat: 'PRIVACY',
            q: 'Can I permanently delete my account and data?',
            a: 'Yes. You can submit an account and data erasure request via our dedicated Account Deletion page or by contacting our Data Protection Officer at privacy@resqr.co.in. Your medical records and contacts are purged immediately upon request processing.'
        },
        {
            cat: 'PRODUCTS',
            q: 'How durable are the physical reflective QR stickers?',
            a: 'Our reflective stickers are manufactured using high-grade 3M vinyl with UV-resistant and waterproof lamination, designed to withstand rain, high highway wind speeds, and prolonged outdoor sun exposure on motorcycle helmets.'
        },
        {
            cat: 'PRODUCTS',
            q: 'What should I do if I lose my physical sticker, card, or keychain?',
            a: 'Log into your RESQR Dashboard and click "Revoke Tag" on the affected identifier. Once revoked, that specific QR code is permanently disconnected and will immediately cease displaying any profile data if scanned.'
        },
        {
            cat: 'HEALTHCARE',
            q: 'How do doctors and trauma centers access clinical data?',
            a: 'Authorized clinicians and hospital emergency staff utilize verified credentials to request time-limited clinical tokens, unlocking critical allergy and medical history parameters needed during trauma triage.'
        },
        {
            cat: 'HEALTHCARE',
            q: 'How can our hospital or clinic pilot RESQR?',
            a: 'Hospitals can visit our Institutional Partnerships page or email admin@resqr.co.in to request a technical pilot overview and integration roadmap.'
        }
    ];

    const filteredFaqs = faqs.filter(f => f.cat === activeCategory);

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-14">
                
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                        <HelpCircle size={13} /> KNOWLEDGE & FAQ
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Accurate, transparent answers regarding platform mechanics, privacy governance, physical tags, and clinical access.
                    </p>
                </div>

                {/* Category Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
                    {categories.map((c) => {
                        const Icon = c.icon;
                        const isSelected = activeCategory === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => { setActiveCategory(c.id); setOpenIndex(null); }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-[#17191D] border border-white/10 text-slate-400 hover:text-white'}`}
                            >
                                <Icon size={14} />
                                {c.label}
                            </button>
                        );
                    })}
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                    {filteredFaqs.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div 
                                key={idx}
                                className="bg-[#17191D] border border-white/10 rounded-2xl overflow-hidden transition-all"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                                    className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    aria-expanded={isOpen}
                                >
                                    <span className="text-sm font-bold text-white leading-snug">{faq.q}</span>
                                    <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-6 pt-2 text-xs text-slate-300 leading-relaxed border-t border-white/5">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Still Need Help Box */}
                <div className="bg-[#17191D] border border-white/10 rounded-3xl p-8 sm:p-10 text-center space-y-4">
                    <h3 className="text-xl font-bold uppercase text-white">Have a Specific Inquiry?</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                        Our citizen support and technical teams are ready to help. Reach out directly or submit an institutional inquiry.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
                        <Link 
                            to="/contact" 
                            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Contact Support Desk
                        </Link>
                        <Link 
                            to="/privacy-policy" 
                            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Review Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
