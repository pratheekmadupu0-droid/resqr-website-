import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, User, LayoutDashboard, LogOut, QrCode, ChevronDown, Building2, Stethoscope, Users, HeartHandshake, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { ADMIN_EMAILS } from '../lib/subscriptionConfig';
import ResqrLogo from './branding/ResqrLogo';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [solutionsDropdown, setSolutionsDropdown] = useState(false);
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [isAdminUser, setIsAdminUser] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const isEmergency = location.pathname.startsWith('/e/');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userSnap = await get(ref(db, `users/${currentUser.uid}`));
                    const rtdbRole = userSnap.exists() ? userSnap.val().role : null;
                    const rtdbEmail = userSnap.exists() ? userSnap.val().email : null;

                    const isAuth = (currentUser.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase())) ||
                                   (rtdbEmail && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(rtdbEmail.toLowerCase())) ||
                                   rtdbRole === 'admin' ||
                                   localStorage.getItem('resqr_active_role') === 'admin';

                    setIsAdminUser(!!isAuth);

                    if (userSnap.exists() && userSnap.val().name) {
                        setUserName(userSnap.val().name);
                    } else if (currentUser.displayName) {
                        setUserName(currentUser.displayName);
                    } else if (currentUser.email) {
                        setUserName(currentUser.email.split('@')[0]);
                    } else {
                        setUserName('User');
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserName('User');
                    setIsAdminUser(false);
                }
            } else {
                setUserName('');
                const activeRole = localStorage.getItem('resqr_active_role');
                setIsAdminUser(activeRole === 'admin');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSolutionsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lock page scroll while the mobile menu is open
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    // Close menu after navigation
    useEffect(() => {
        setIsOpen(false);
        setSolutionsDropdown(false);
    }, [location.pathname]);

    if (isEmergency) return null;

    const isActive = (path) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const solutionItems = [
        { name: 'Individuals & Families', path: '/solutions/individuals', icon: Users, desc: 'Personal emergency safety profiles and physical tags.' },
        { name: 'Hospitals & Clinics', path: '/solutions/hospitals', icon: Building2, desc: 'Emergency trauma identification and bedside verification.' },
        { name: 'Doctors & Clinicians', path: '/solutions/doctors', icon: Stethoscope, desc: 'Authenticated clinical medical vault access.' },
        { name: 'Institutional & Government', path: '/government-partnerships', icon: Shield, desc: 'Public safety infrastructure and large-scale deployment.' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-[#0E1013]/95 backdrop-blur-md border-b border-white/10 transition-all">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4" aria-label="Main navigation">
                {/* Official RESQR Brand Logo */}
                <Link to="/" className="flex items-center gap-3 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg" aria-label="RESQR Home">
                    <ResqrLogo className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105" />
                </Link>

                {/* Desktop Primary Navigation */}
                <div className="hidden lg:flex items-center gap-7 flex-1 justify-center">
                    <Link
                        to="/products"
                        className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/products') || isActive('/store') ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        Product
                        {(isActive('/products') || isActive('/store')) && (
                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(215,25,32,0.8)]" />
                        )}
                    </Link>

                    <Link
                        to="/how-it-works"
                        className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/how-it-works') ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        How It Works
                        {isActive('/how-it-works') && (
                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(215,25,32,0.8)]" />
                        )}
                    </Link>

                    {/* Solutions Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setSolutionsDropdown(!solutionsDropdown)}
                            onMouseEnter={() => setSolutionsDropdown(true)}
                            className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/solutions') ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                            aria-expanded={solutionsDropdown}
                        >
                            Solutions
                            <ChevronDown size={14} className={`transition-transform duration-200 ${solutionsDropdown ? 'rotate-180 text-primary' : 'text-slate-400'}`} />
                        </button>

                        {solutionsDropdown && (
                            <div 
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-[#17191D] border border-white/10 rounded-2xl shadow-2xl p-2.5 space-y-1 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95"
                                onMouseLeave={() => setSolutionsDropdown(false)}
                            >
                                {solutionItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            onClick={() => setSolutionsDropdown(false)}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{item.name}</p>
                                                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Link
                        to="/privacy-policy"
                        className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/privacy-policy') || isActive('/privacy-settings') ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        Privacy & Security
                        {(isActive('/privacy-policy') || isActive('/privacy-settings')) && (
                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(215,25,32,0.8)]" />
                        )}
                    </Link>

                    <Link
                        to="/government-partnerships"
                        className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/government-partnerships') ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        Institutional Partnerships
                        {isActive('/government-partnerships') && (
                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(215,25,32,0.8)]" />
                        )}
                    </Link>

                    <Link
                        to="/about"
                        className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/about') ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        About
                        {isActive('/about') && (
                            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(215,25,32,0.8)]" />
                        )}
                    </Link>

                    {isAdminUser && (
                        <>
                            <Link
                                to="/admin"
                                className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/admin') ? 'text-purple-400 font-extrabold' : 'text-slate-400 hover:text-purple-400'}`}
                            >
                                Admin
                            </Link>
                            <Link
                                to="/demo"
                                className={`text-xs font-bold uppercase tracking-[0.14em] transition-colors py-2 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive('/demo') ? 'text-amber-400' : 'text-amber-400/80 hover:text-amber-300'}`}
                            >
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                Demo Hub
                            </Link>
                        </>
                    )}
                </div>

                {/* Desktop Auth / Action Buttons */}
                <div className="hidden lg:flex items-center gap-3">
                    {user ? (
                        <>
                            <Link 
                                to="/dashboard" 
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <LayoutDashboard size={15} /> {userName || 'Dashboard'}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label="Log out"
                            >
                                <LogOut size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link 
                                to="/login" 
                                className="px-5 py-2.5 rounded-xl border border-white/15 hover:border-white/30 text-white text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                Login
                            </Link>
                            <Link 
                                to="/login" 
                                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                Create Your RESQR
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile actions: quick CTA + hamburger */}
                <div className="flex lg:hidden items-center gap-2.5">
                    {!user && (
                        <Link 
                            to="/login" 
                            className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20"
                        >
                            Create RESQR
                        </Link>
                    )}
                    {user && (
                        <Link 
                            to="/dashboard" 
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                        >
                            <User size={14} /> {userName?.split(' ')[0] || 'Account'}
                        </Link>
                    )}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu panel */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-x-0 top-20 bottom-0 bg-[#0E1013] border-t border-white/10 overflow-y-auto py-6 px-5 space-y-4 z-50"
                    aria-label="Mobile navigation menu"
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Navigation</p>
                    
                    <Link
                        to="/products"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-primary/30"
                    >
                        Product
                        <ChevronDown size={14} className="rotate-[-90deg] text-slate-500" />
                    </Link>

                    <Link
                        to="/how-it-works"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-primary/30"
                    >
                        How It Works
                        <ChevronDown size={14} className="rotate-[-90deg] text-slate-500" />
                    </Link>

                    <div className="py-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1 mb-2">Solutions</p>
                        {solutionItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5"
                            >
                                <item.icon size={15} className="text-primary" />
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <Link
                        to="/privacy-policy"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-primary/30"
                    >
                        Privacy & Security
                        <ChevronDown size={14} className="rotate-[-90deg] text-slate-500" />
                    </Link>

                    <Link
                        to="/government-partnerships"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-primary/30"
                    >
                        Institutional Partnerships
                        <ChevronDown size={14} className="rotate-[-90deg] text-slate-500" />
                    </Link>

                    <Link
                        to="/about"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-primary/30"
                    >
                        About RESQR
                        <ChevronDown size={14} className="rotate-[-90deg] text-slate-500" />
                    </Link>

                    <Link
                        to="/pet-dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-primary/30"
                    >
                        Pet RESQR
                        <ChevronDown size={14} className="rotate-[-90deg] text-slate-500" />
                    </Link>

                    {isAdminUser && (
                        <div className="pt-2 border-t border-white/10 space-y-2">
                            <Link to="/admin" onClick={() => setIsOpen(false)} className="block py-2.5 px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold uppercase tracking-wider text-purple-300">
                                Admin Console
                            </Link>
                            <Link to="/demo" onClick={() => setIsOpen(false)} className="block py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold uppercase tracking-wider text-amber-300">
                                Interactive Demo Hub
                            </Link>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/10 space-y-3">
                        {user ? (
                            <>
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 text-xs font-bold uppercase tracking-wider text-white">
                                    <LayoutDashboard size={15} /> My Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-wider text-primary"
                                >
                                    <LogOut size={15} /> Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center py-3.5 rounded-xl border border-white/20 text-xs font-bold uppercase tracking-wider text-white">
                                    Login to Account
                                </Link>
                                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center py-3.5 rounded-xl bg-primary text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/30">
                                    Create Your RESQR
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}