import { Link } from 'react-router-dom';
import { Shield, Twitter, Facebook, Instagram, Github } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 border-t border-white/5 font-manrope">
            <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
                    <div className="space-y-8">
                        <Link to="/" className="flex items-center gap-2">
                            <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR Logo" className="h-10 sm:h-12 w-auto object-contain" />
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            The world\'s most advanced emergency identification system. We bridge the gap between physical safety and digital health data when every second counts.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Facebook, Instagram, Github].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 border border-white/5 transition-all">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 italic">Ecosystem</h4>
                        <ul className="space-y-4">
                            <li><Link to="/technology" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Core Technology</Link></li>
                            <li><Link to="/how-it-works" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">How It Works</Link></li>
                            <li><Link to="/products" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Products</Link></li>
                            <li><Link to="/pricing" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Pricing Options</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 italic">Solutions</h4>
                        <ul className="space-y-4">
                            <li><Link to="/solutions/individuals" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Individuals</Link></li>
                            <li><Link to="/solutions/families" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Families</Link></li>
                            <li><Link to="/solutions/enterprises" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Enterprises</Link></li>
                            <li><Link to="/solutions/hospitals" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Hospital Networks</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] mb-8 italic">Guardian Support</h4>
                        <ul className="space-y-4">
                            <li><Link to="/contact" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Contact Helpdesk</Link></li>
                            <li><Link to="/safety-privacy" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Privacy Shield</Link></li>
                            <li><Link to="/help-center" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Help Center</Link></li>
                            <li><Link to="/faq" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">FAQ Database</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
                        © {currentYear} RESQR IDENTITY SYSTEMS INC. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Node Network: <span className="text-emerald-500">Online</span></span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
