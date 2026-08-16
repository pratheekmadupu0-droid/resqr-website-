import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function FAQPage() {
    const categories = ['GENERAL', 'USERS', 'EMERGENCY', 'MEDICAL', 'PRODUCT', 'HOSPITALS'];
    const [activeCategory, setActiveCategory] = useState('GENERAL');

    const faqs = [
        {
            cat: 'GENERAL',
            q: 'What is RESQR?',
            a: 'RESQR is a smart emergency identity platform that links physical QR stickers or smart cards directly to verified health profiles, securing lives when seconds count.'
        },
        {
            cat: 'GENERAL',
            q: 'Why was RESQR created?',
            a: 'To solve the critical communication gap in emergencies. When a victim is unconscious or unable to speak, RESQR gives responders immediate access to vital contacts and blood type records.'
        },
        {
            cat: 'GENERAL',
            q: 'How does RESQR work?',
            a: 'Once a bystander scans your unique QR, a secure portal loads allowing them to share location telemetry and quick-dial your family, while verified medical professionals decrypt your medical records.'
        },
        {
            cat: 'USERS',
            q: 'How do I register?',
            a: 'Create an account on the RESQR Portal using secure Mobile OTP authentication, fill in demographics, and lock your primary emergency contact numbers.'
        },
        {
            cat: 'USERS',
            q: 'How do I create my emergency profile?',
            a: 'Navigate to the Profile Setup section within your dashboard, choose what fields to expose to the public, and click "Submit Profile" to sync to the Realtime Database.'
        },
        {
            cat: 'USERS',
            q: 'What happens if I lose my physical QR tag?',
            a: 'You can instantly lock the lost identity block inside your central RESQR Dashboard settings and assign a new sticker tag or smart card to your active profile.'
        },
        {
            cat: 'EMERGENCY',
            q: 'What happens when someone scans my QR code?',
            a: 'The scanning bystander is redirected to a public web portal showing quick-dials for next of kin and ambulance services. Simultaneously, your emergency contacts receive a GPS location ping via SMS.'
        },
        {
            cat: 'EMERGENCY',
            q: 'What can a stranger see when scanning?',
            a: 'Only limited public parameters (Name, emergency contacts, location ping buttons, and nearest hospital recommendations). Sensitive medical and health files remain encrypted.'
        },
        {
            cat: 'MEDICAL',
            q: 'What can doctors see?',
            a: 'Verified physicians can access Level 3 parameters including allergy alerts, chronic medical conditions, and active prescriptions to prevent treatment complications.'
        },
        {
            cat: 'MEDICAL',
            q: 'How is medical information protected?',
            a: 'Data files are encrypted using AES-256 standard protocols. No raw health details are encoded inside the physical QR barcodes, and only verified accounts get decryption access.'
        },
        {
            cat: 'PRODUCT',
            q: 'What products are currently available?',
            a: 'We offer a Digital QR Pass for mobile wallets, weatherproof Sticker Packs for helmets, and are launching keychains, silicone wristbands, and smart rings shortly.'
        },
        {
            cat: 'HOSPITALS',
            q: 'How does hospital verification work?',
            a: 'Hospitals submit credential audits to our administration team. Once verified, ER centers receive encrypted access tokens to instantly sync patient records during admissions.'
        }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">HELP DESK FAQ</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        FREQUENTLY ASKED <br />
                        <span className="text-primary italic-display">QUESTIONS.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Find answers to common queries regarding profile setups, emergency telemetry, data encryption, and clinic integration.
                    </p>
                </div>
            </section>

            {/* Category Navigation and FAQ List */}
            <section className="py-24 px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="md:col-span-1 space-y-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`w-full text-left p-4 rounded-xl text-xs font-black uppercase tracking-wider italic transition-all ${activeCategory === cat ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="md:col-span-3 space-y-6">
                    {faqs.filter(faq => faq.cat === activeCategory).length === 0 ? (
                        <div className="text-xs text-slate-500 italic font-bold">No items found under this category yet.</div>
                    ) : (
                        faqs.filter(faq => faq.cat === activeCategory).map((faq, idx) => (
                            <Card key={idx} className="p-8 border border-white/5">
                                <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{faq.q}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{faq.a}</p>
                            </Card>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
