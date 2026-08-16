import React from 'react';
import { Check, Shield, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function PricingPage() {
    const plans = [
        {
            category: 'PERSONAL',
            name: 'Digital QR Pass',
            price: '₹99',
            period: 'One-time payment',
            features: [
                'Dynamic Emergency Portal Access',
                'Emergency Contact Calling Link',
                'GPS Location Coordinates Sharing',
                'Apple/Google Wallet Integration',
                'Lifetime Profile Updates'
            ],
            available: true,
            cta: 'GET DIGITAL QR'
        },
        {
            category: 'PERSONAL',
            name: 'Emergency Sticker Pack',
            price: '₹149',
            period: 'One-time payment',
            features: [
                'Includes 2 Weatherproof Stickers',
                'UV-Protected High-Resolution QRs',
                'Reflective Safety Outer Coating',
                'Ideal for Helmets, Bicycles, Vehicles',
                'Lifetime Profile Updates'
            ],
            available: true,
            cta: 'ORDER STICKER PACK'
        },
        {
            category: 'BUSINESS',
            name: 'Hospitals & Clinics Network',
            price: 'Contact Sales',
            period: 'Custom SLA License',
            features: [
                'Verified OTP Practitioner Accounts',
                'Dedicated Triage Scanning Terminals',
                'Pre-Admission Insurance Verification API',
                'Data Sync with Internal ERPs',
                'Compliance Access Audit Logging'
            ],
            available: false,
            cta: 'CONTACT SALES'
        },
        {
            category: 'BUSINESS',
            name: 'Enterprises & Corporates',
            price: 'Contact Sales',
            period: 'Annual Subscription',
            features: [
                'Central HR Control Dashboard',
                'Automated CSV Bulk Registrations',
                'Bulk Physical Cards/Stickers delivery',
                'Dedicated Incident Report Downloads',
                'Occupational Safety Auditing'
            ],
            available: false,
            cta: 'CONTACT SALES'
        }
    ];

    const comparisons = [
        { feature: 'Dynamic Web Profile', digital: true, sticker: true, business: true },
        { feature: 'Next of Kin Calling', digital: true, sticker: true, business: true },
        { feature: 'GPS Coordinates Link', digital: true, sticker: true, business: true },
        { feature: 'Practitioner Verification API', digital: false, sticker: false, business: true },
        { feature: 'Bulk Dashboard Enrollment', digital: false, sticker: false, business: true },
        { feature: 'Dedicated Account Managers', digital: false, sticker: false, business: true }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">SAFETY COST ESTIMATES</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        TRANSPARENT, ONE-TIME <br />
                        <span className="text-primary italic-display">SAFETY PACKAGES.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Choose personal emergency identity coverage or partner with our team to secure institutional scale protection pipelines.
                    </p>
                </div>
            </section>

            {/* Plans List */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((pl, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all flex flex-col justify-between border border-white/5">
                            <div>
                                <Badge className="bg-white/5 text-white border-white/5 text-[8px] tracking-widest uppercase mb-4">{pl.category}</Badge>
                                <h3 className="text-xl font-black uppercase italic tracking-tight font-poppins text-white mb-1">{pl.name}</h3>
                                <div className="text-sm font-black text-slate-500 uppercase tracking-widest italic mb-6">{pl.period}</div>
                                
                                <div className="text-4xl font-black text-primary font-poppins italic mb-8">{pl.price}</div>
                                
                                <ul className="space-y-3 mb-8">
                                    {pl.features.map((ft, j) => (
                                        <li key={j} className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {ft}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                {pl.available ? (
                                    <Link to="/store">
                                        <Button className="w-full py-4 text-xs font-black uppercase tracking-widest italic">
                                            {pl.cta}
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link to="/contact">
                                        <Button variant="outline" className="w-full py-4 text-xs font-black uppercase tracking-widest italic text-white border-white/10 hover:bg-white/5">
                                            {pl.cta}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Comparison Matrix Table */}
            <section className="py-24 bg-slate-950 border-t border-white/5 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter font-poppins text-center mb-16">PLAN FEATURE DIRECT COMPARISONS</h2>
                    
                    <div className="overflow-x-auto rounded-[30px] border border-white/5 shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest italic border-b border-white/5">
                                <tr>
                                    <th className="p-6">System Parameters</th>
                                    <th className="p-6">Digital pass</th>
                                    <th className="p-6">Stickers</th>
                                    <th className="p-6">Enterprise B2B</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-bold uppercase tracking-wider">
                                {comparisons.map((c, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-all">
                                        <td className="p-6 font-semibold text-slate-400">{c.feature}</td>
                                        <td className="p-6">{c.digital ? <span className="text-emerald-400">✓</span> : <span className="text-slate-700">-</span>}</td>
                                        <td className="p-6">{c.sticker ? <span className="text-emerald-400">✓</span> : <span className="text-slate-700">-</span>}</td>
                                        <td className="p-6">{c.business ? <span className="text-emerald-400">✓</span> : <span className="text-slate-700">-</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
