import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, Heart, Mail, ExternalLink, HelpCircle, FileText, Lock, Globe } from 'lucide-react';
import ResqrLogo from './branding/ResqrLogo';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const columns = [
        {
            heading: 'Platform',
            links: [
                { name: 'How It Works', to: '/how-it-works' },
                { name: 'Products & Stickers', to: '/products' },
                { name: 'Subscription & Pricing', to: '/pricing' },
                { name: 'Pet RESQR Identity', to: '/pet-dashboard' },
                { name: 'Live Scanner', to: '/scanner' },
                { name: 'Technology & System', to: '/technology' },
            ],
        },
        {
            heading: 'Solutions',
            links: [
                { name: 'Individuals & Families', to: '/solutions/individuals' },
                { name: 'Senior Citizens & Caregivers', to: '/solutions/families' },
                { name: 'Hospitals & Emergency Wards', to: '/solutions/hospitals' },
                { name: 'Doctors & Clinicians', to: '/solutions/doctors' },
                { name: 'First Responders & 108', to: '/solutions/first-responders' },
                { name: 'Institutional Partnerships', to: '/government-partnerships' },
            ],
        },
        {
            heading: 'Privacy & Governance',
            links: [
                { name: 'Privacy Policy', to: '/privacy-policy' },
                { name: 'Privacy Settings & Controls', to: '/privacy-settings' },
                { name: 'Terms of Service', to: '/legal' },
                { name: 'Account & Data Deletion', to: '/account-deletion' },
                { name: 'Security & Disclosure', to: '/security' },
                { name: 'Accessibility Statement', to: '/accessibility' },
            ],
        },
        {
            heading: 'Company & Support',
            links: [
                { name: 'About RESQR', to: '/about' },
                { name: 'Contact & Grievances', to: '/contact' },
                { name: 'Frequently Asked Questions', to: '/faq' },
                { name: 'Refund & Cancellation Policy', to: '/legal?tab=refunds' },
                { name: 'Shipping & Delivery Policy', to: '/legal?tab=shipping' },
                { name: 'Emergency Awareness Guide', to: '/emergency-awareness' },
            ],
        },
    ];

    return (
        <footer className="bg-[#0C0E12] border-t border-white/10 text-slate-400 relative overflow-hidden" aria-label="Footer">
            {/* Ambient subtle backdrop */}
            <div className="pointer-events-none absolute inset-0 opacity-40 qr-grid-pattern" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-32 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                {/* Top Section: Brand Statement & CTA */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-14 border-b border-white/10">
                    <div className="lg:col-span-5 space-y-4">
                        <Link to="/" className="inline-block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg" aria-label="RESQR home">
                            <ResqrLogo className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105" />
                        </Link>
                        <p className="text-xs uppercase font-extrabold tracking-[0.2em] text-primary">
                            SCAN. RESCUE. SAVE LIVES.
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                            RESQR connects a registered emergency profile to a scannable QR or NFC identifier, helping people reach designated emergency contacts and access permitted emergency information during critical moments.
                        </p>
                        <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
                            <span>Sion Enterprises</span>
                            <span>•</span>
                            <span>Hyderabad, Telangana, India</span>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center justify-start lg:justify-end gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-sm">
                            <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Lock size={14} className="text-emerald-400" /> Emergency Data Governance
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                                Data is handled following purpose specification, role-based visibility, and data minimization standards under Indian privacy legislation.
                            </p>
                        </div>
                        <Link 
                            to="/login" 
                            className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] shrink-0"
                        >
                            Create Your RESQR
                        </Link>
                    </div>
                </div>

                {/* Middle Section: Navigation Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-white/10">
                    {columns.map((col) => (
                        <div key={col.heading}>
                            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4">{col.heading}</h3>
                            <ul className="space-y-2.5">
                                {col.links.map((link) => (
                                    <li key={link.name}>
                                        <Link 
                                            to={link.to} 
                                            className="text-xs text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:underline"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Legal & Regulatory Row */}
                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>
                        © {currentYear} Sion Enterprises. All rights reserved. RESQR™ is a proprietary emergency identity platform.
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                        <Link to="/legal" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
                        <span>•</span>
                        <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
                        <span>•</span>
                        <Link to="/security" className="hover:text-slate-300 transition-colors">Security & Disclosure</Link>
                        <span>•</span>
                        <Link to="/accessibility" className="hover:text-slate-300 transition-colors">Accessibility</Link>
                        <span>•</span>
                        <a href="mailto:admin@resqr.co.in" className="hover:text-primary transition-colors">admin@resqr.co.in</a>
                    </div>
                </div>

                {/* Indian Legal Disclaimer Note */}
                <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-slate-600 leading-relaxed text-center sm:text-left">
                    <p>
                        <strong>Regulatory Note:</strong> RESQR is an emergency information and identification platform, not an ambulance dispatch or licensed medical care provider. Information access depends on implemented permissions and user-configured consent controls. All legal and privacy notices are subject to formal legal review under applicable Indian statutes, including the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.
                    </p>
                </div>
            </div>
        </footer>
    );
}