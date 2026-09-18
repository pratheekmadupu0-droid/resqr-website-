import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram, Github, HeartHandshake } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const columns = [
        {
            heading: 'RESQR',
            links: [
                { name: 'About RESQR', to: '/about' },
                { name: 'How It Works', to: '/how-it-works' },
                { name: 'Products', to: '/products' },
                { name: 'Pricing', to: '/pricing' },
                { name: 'Stories', to: '/stories' },
            ],
        },
        {
            heading: 'Legal & Safety',
            links: [
                { name: 'Privacy Policy', to: '/safety-privacy' },
                { name: 'Terms of Service', to: '/legal' },
                { name: 'Emergency Awareness', to: '/emergency-awareness' },
                { name: 'Technology', to: '/technology' },
            ],
        },
        {
            heading: 'Support',
            links: [
                { name: 'Contact', to: '/contact' },
                { name: 'Help Center', to: '/help-center' },
                { name: 'FAQ', to: '/faq' },
                { name: 'Partners', to: '/partners' },
            ],
        },
    ];

    return (
        <footer className="bg-[#05070D] border-t border-white/5 relative overflow-hidden">

            {/* faint festive glow */}
            <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
                <div className="absolute bottom-0 left-1/4 w-[45vw] h-[30vh] bg-gold/4 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[45vw] h-[30vh] bg-primary/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
                    {/* Brand + CTA */}
                    <div className="space-y-5">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR Logo" className="h-10 sm:h-12 w-auto object-contain" />
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            The emergency identification system that keeps your important
                            information accessible when it matters most.
                        </p>
                        <Link to="/login" className="btn-app-primary w-full" style={{ minHeight: 48 }}>
                            <HeartHandshake size={16} /> Create My RESQR
                        </Link>
                        <div className="flex gap-3">
                            {[{ Icon: Twitter, label: 'Twitter' }, { Icon: Facebook, label: 'Facebook' }, { Icon: Instagram, label: 'Instagram' }, { Icon: Github, label: 'GitHub' }].map(({ Icon, label }, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    aria-label={`RESQR on ${label}`}
                                    className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 border border-white/8 transition-all"
                                >
                                    <Icon size={19} />
                                </a>
                            ))}
                        </div>
                    </div>
{/* Link columns */}
                    {columns.map((col) => (
                        <div key={col.heading}>
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.22em] mb-5">{col.heading}</h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.name}>
                                        <Link to={link.to} className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Auth quick links */}
                <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center gap-4 flex-wrap">
                    <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-primary uppercase tracking-widest">Login</Link>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-primary uppercase tracking-widest">Register</Link>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <Link to="/scanner" className="text-xs font-bold text-slate-400 hover:text-primary uppercase tracking-widest">Scan RESQR</Link>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <Link to="/free-qr" className="text-xs font-bold text-slate-400 hover:text-primary uppercase tracking-widest">Free QR</Link>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <Link to="/store" className="text-xs font-bold text-slate-400 hover:text-primary uppercase tracking-widest">Store</Link>
                    <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> System Online
                    </span>
                </div>

                <div className="mt-8 pt-5 border-t border-white/8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                        © {currentYear} RESQR IDENTITY SYSTEMS · ALL RIGHTS RESERVED
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Emergency QR Identity · resqr.co.in
                    </p>
                </div>
            </div>
        </footer>
    );
}