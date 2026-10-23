import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, User, LayoutDashboard, LogOut, ChevronDown, Building2, Stethoscope, Users, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { ADMIN_EMAILS } from '../lib/subscriptionConfig';
import ResqrLogo from './branding/ResqrLogo';

/**
 * RESQR Premium Navigation Bar
 * 
 * Aesthetic tokens:
 * - Background: #101114
 * - Primary red: #E31824
 * - Deep red hover: #C9141E
 * - Primary text: #F7F8FA
 * - Secondary text: #C5CBD4
 * - Subtle borders: #303238
 * - Container max-width: 1480px
 * - Height: 84px - 88px
 */
export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [solutionsDropdown, setSolutionsDropdown] = useState(false);
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [isAdminUser, setIsAdminUser] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
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
            localStorage.removeItem('resqr_active_role');
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Close solutions dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSolutionsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Accessibility: Support Escape key to close mobile menu and dropdown
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setSolutionsDropdown(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Lock page scroll when mobile drawer is open
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    // Close mobile menu and dropdown upon route change
    useEffect(() => {
        setIsOpen(false);
        setSolutionsDropdown(false);
    }, [location.pathname]);

    if (isEmergency) return null;

    const isActive = (path) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const solutionItems = [
        { name: 'Individuals & Families', path: '/solutions/individuals', icon: Users, desc: 'Personal safety profiles, physical QR tags, and ICE contacts.' },
        { name: 'Hospitals & Clinics', path: '/solutions/hospitals', icon: Building2, desc: 'Emergency trauma identification and ER admission telemetry.' },
        { name: 'Doctors & Clinicians', path: '/solutions/doctors', icon: Stethoscope, desc: 'Verified clinical portal and medical condition access.' },
        { name: 'Institutional & Government', path: '/government-partnerships', icon: Shield, desc: 'Public-sector emergency response infrastructure and pilot programs.' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-[#101114]/95 backdrop-blur-md border-b border-[#303238] transition-all">
            {/* Centered responsive container max-width: 1480px, height: 84px to 88px */}
            <nav 
                className="max-w-[1480px] mx-auto px-6 lg:px-8 xl:px-12 h-[84px] md:h-[88px] flex items-center justify-between" 
                aria-label="Main navigation"
            >
                {/* ======================================================== */}
                {/* LEFT: RESQR Official Brand Logo                         */}
                {/* ======================================================== */}
                <div className="flex items-center shrink-0">
                    <Link 
                        to="/" 
                        className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824] rounded-lg" 
                        aria-label="RESQR Home"
                    >
                        {/* Visual width 136-150px, perfectly proportioned, no stretching */}
                        <ResqrLogo className="h-9 md:h-10 w-[140px] md:w-[148px] object-contain shrink-0 transition-opacity group-hover:opacity-90" />
                    </Link>
                </div>

                {/* ======================================================== */}
                {/* CENTER: Desktop Primary Navigation Links                */}
                {/* (Visible on xl+ displays, ~28-36px gap, nowrap)         */}
                {/* ======================================================== */}
                <div className="hidden xl:flex items-center gap-7 2xl:gap-8 justify-center flex-1 px-8">
                    {/* 1. PRODUCT */}
                    <Link
                        to="/products"
                        className={`text-[13.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-200 py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824] rounded ${
                            isActive('/products') || isActive('/store') ? 'text-[#F7F8FA]' : 'text-[#C5CBD4] hover:text-[#F7F8FA]'
                        }`}
                    >
                        Product
                        {(isActive('/products') || isActive('/store')) && (
                            <span className="absolute -bottom-2.5 left-0 right-0 h-[2px] bg-[#E31824] rounded-full" />
                        )}
                    </Link>

                    {/* 2. HOW IT WORKS */}
                    <Link
                        to="/how-it-works"
                        className={`text-[13.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-200 py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824] rounded ${
                            isActive('/how-it-works') ? 'text-[#F7F8FA]' : 'text-[#C5CBD4] hover:text-[#F7F8FA]'
                        }`}
                    >
                        How It Works
                        {isActive('/how-it-works') && (
                            <span className="absolute -bottom-2.5 left-0 right-0 h-[2px] bg-[#E31824] rounded-full" />
                        )}
                    </Link>

                    {/* 3. SOLUTIONS (Dropdown) */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setSolutionsDropdown(!solutionsDropdown)}
                            onMouseEnter={() => setSolutionsDropdown(true)}
                            className={`text-[13.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-200 py-2 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824] rounded ${
                                isActive('/solutions') ? 'text-[#F7F8FA]' : 'text-[#C5CBD4] hover:text-[#F7F8FA]'
                            }`}
                            aria-expanded={solutionsDropdown}
                            aria-haspopup="true"
                        >
                            Solutions
                            <ChevronDown 
                                size={14} 
                                className={`transition-transform duration-200 ${solutionsDropdown ? 'rotate-180 text-[#E31824]' : 'text-[#C5CBD4]'}`} 
                            />
                        </button>

                        {/* Solutions Dropdown Menu */}
                        {solutionsDropdown && (
                            <div 
                                role="menu"
                                aria-label="Solutions dropdown"
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-84 bg-[#17191D] border border-[#303238] rounded-2xl shadow-2xl p-2.5 space-y-1 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95"
                                onMouseLeave={() => setSolutionsDropdown(false)}
                            >
                                {solutionItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            role="menuitem"
                                            onClick={() => setSolutionsDropdown(false)}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.05] transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824]"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-[#E31824]/10 border border-[#E31824]/20 text-[#E31824] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#F7F8FA] group-hover:text-[#E31824] transition-colors">{item.name}</p>
                                                <p className="text-[11px] text-[#C5CBD4] leading-snug mt-0.5">{item.desc}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 4. PRIVACY & SECURITY */}
                    <Link
                        to="/privacy-policy"
                        className={`text-[13.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-200 py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824] rounded ${
                            isActive('/privacy-policy') || isActive('/privacy-settings') ? 'text-[#F7F8FA]' : 'text-[#C5CBD4] hover:text-[#F7F8FA]'
                        }`}
                    >
                        Privacy & Security
                        {(isActive('/privacy-policy') || isActive('/privacy-settings')) && (
                            <span className="absolute -bottom-2.5 left-0 right-0 h-[2px] bg-[#E31824] rounded-full" />
                        )}
                    </Link>

                    {/* 5. INSTITUTIONAL PARTNERSHIPS */}
                    <Link
                        to="/government-partnerships"
                        className={`text-[13.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-200 py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824] rounded ${
                            isActive('/government-partnerships') ? 'text-[#F7F8FA]' : 'text-[#C5CBD4] hover:text-[#F7F8FA]'
                        }`}
                    >
                        Institutional Partnerships
                        {isActive('/government-partnerships') && (
                            <span className="absolute -bottom-2.5 left-0 right-0 h-[2px] bg-[#E31824] rounded-full" />
                        )}
                    </Link>

                    {/* 6. ABOUT */}
                    <Link
                        to="/about"
                        className={`text-[13.5px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-200 py-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824] rounded ${
                            isActive('/about') ? 'text-[#F7F8FA]' : 'text-[#C5CBD4] hover:text-[#F7F8FA]'
                        }`}
                    >
                        About
                        {isActive('/about') && (
                            <span className="absolute -bottom-2.5 left-0 right-0 h-[2px] bg-[#E31824] rounded-full" />
                        )}
                    </Link>

                    {/* ADMIN BADGE LINK (If authenticated admin) */}
                    {isAdminUser && (
                        <Link
                            to="/admin"
                            className={`text-[13px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-colors py-2 px-3 rounded-lg bg-white/5 border border-purple-500/30 text-purple-300 hover:text-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400`}
                        >
                            Admin Console
                        </Link>
                    )}
                </div>

                {/* ======================================================== */}
                {/* RIGHT: Action Buttons (Login + CREATE YOUR RESQR CTA)    */}
                {/* ======================================================== */}
                <div className="hidden xl:flex items-center gap-3.5 shrink-0">
                    {user ? (
                        /* Authenticated User View */
                        <div className="flex items-center gap-3">
                            <Link 
                                to="/dashboard" 
                                className="h-11 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-[#303238] hover:border-slate-400 text-[#F7F8FA] text-[13px] font-bold uppercase tracking-[0.06em] flex items-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824]"
                            >
                                <LayoutDashboard size={15} className="text-[#E31824]" /> 
                                <span>{userName ? userName.split(' ')[0] : 'Dashboard'}</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="h-11 w-11 rounded-xl bg-transparent border border-[#303238] hover:border-[#E31824] text-[#C5CBD4] hover:text-[#E31824] transition-all duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824]"
                                aria-label="Log out"
                                title="Log Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        /* Guest / Public User View */
                        <>
                            {/* LOGIN BUTTON (Restrained secondary button) */}
                            <Link 
                                to="/login" 
                                className="h-11 px-6 rounded-xl bg-transparent hover:bg-white/[0.06] border border-[#303238] hover:border-[#626975] text-[#F7F8FA] text-[13px] font-bold uppercase tracking-[0.06em] inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824]"
                            >
                                Login
                            </Link>

                            {/* CREATE YOUR RESQR CTA (Prominent primary action) */}
                            <Link 
                                to="/login" 
                                className="h-11 px-6 rounded-xl bg-[#E31824] hover:bg-[#C9141E] text-white text-[13px] font-bold uppercase tracking-[0.06em] inline-flex items-center justify-center shadow-md shadow-[#E31824]/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824]"
                            >
                                Create Your RESQR
                            </Link>
                        </>
                    )}
                </div>

                {/* ======================================================== */}
                {/* TABLET / MOBILE HEADER ACTIONS                           */}
                {/* Quick CTA + Accessible Menu Hamburger Button             */}
                {/* ======================================================== */}
                <div className="flex xl:hidden items-center gap-3">
                    {!user ? (
                        <Link 
                            to="/login" 
                            className="h-10 px-4 rounded-xl bg-[#E31824] hover:bg-[#C9141E] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center shadow-md shadow-[#E31824]/20 transition-all"
                        >
                            Create RESQR
                        </Link>
                    ) : (
                        <Link 
                            to="/dashboard" 
                            className="h-10 px-3.5 rounded-xl bg-white/[0.05] border border-[#303238] text-[#F7F8FA] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                        >
                            <User size={14} className="text-[#E31824]" /> 
                            <span>{userName ? userName.split(' ')[0] : 'Account'}</span>
                        </Link>
                    )}

                    {/* Accessible Hamburger Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="h-10 w-10 rounded-xl bg-transparent border border-[#303238] hover:border-slate-500 text-[#F7F8FA] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31824]"
                        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={isOpen}
                        aria-controls="mobile-navigation-drawer"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* ======================================================== */}
            {/* MOBILE & TABLET NAVIGATION DRAWER                        */}
            {/* Accessible, scroll-locked, supports Escape to close      */}
            {/* ======================================================== */}
            {isOpen && (
                <div
                    id="mobile-navigation-drawer"
                    ref={mobileMenuRef}
                    className="xl:hidden fixed inset-x-0 top-[84px] md:top-[88px] bottom-0 bg-[#101114] border-t border-[#303238] overflow-y-auto py-6 px-6 space-y-5 z-50 animate-in fade-in duration-200"
                    aria-label="Mobile navigation menu"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-[#303238]">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5CBD4]">
                            Navigation Menu
                        </span>
                        <span className="text-[10px] text-slate-500">
                            Press Esc to close
                        </span>
                    </div>
                    
                    {/* Primary Links */}
                    <div className="space-y-2">
                        <Link
                            to="/products"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-white/[0.03] border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#F7F8FA] hover:border-[#E31824]/40 transition-colors"
                        >
                            <span>Product Catalog & Hardware</span>
                            <ArrowRight size={14} className="text-[#C5CBD4]" />
                        </Link>

                        <Link
                            to="/how-it-works"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-white/[0.03] border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#F7F8FA] hover:border-[#E31824]/40 transition-colors"
                        >
                            <span>How It Works</span>
                            <ArrowRight size={14} className="text-[#C5CBD4]" />
                        </Link>

                        <Link
                            to="/privacy-policy"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-white/[0.03] border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#F7F8FA] hover:border-[#E31824]/40 transition-colors"
                        >
                            <span>Privacy & Security (DPDP 2023)</span>
                            <ArrowRight size={14} className="text-[#C5CBD4]" />
                        </Link>

                        <Link
                            to="/government-partnerships"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-white/[0.03] border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#F7F8FA] hover:border-[#E31824]/40 transition-colors"
                        >
                            <span>Institutional Partnerships</span>
                            <ArrowRight size={14} className="text-[#C5CBD4]" />
                        </Link>

                        <Link
                            to="/about"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-white/[0.03] border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#F7F8FA] hover:border-[#E31824]/40 transition-colors"
                        >
                            <span>About RESQR</span>
                            <ArrowRight size={14} className="text-[#C5CBD4]" />
                        </Link>

                        <Link
                            to="/pet-dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-white/[0.03] border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#F7F8FA] hover:border-[#E31824]/40 transition-colors"
                        >
                            <span>Pet RESQR 🐾</span>
                            <ArrowRight size={14} className="text-[#C5CBD4]" />
                        </Link>
                    </div>

                    {/* Solutions Sub-List */}
                    <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5CBD4] px-1 mb-2.5">
                            Specialized Solutions
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                            {solutionItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-medium text-[#C5CBD4] hover:text-[#F7F8FA] hover:bg-white/[0.04] transition-colors"
                                >
                                    <item.icon size={15} className="text-[#E31824] shrink-0" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Admin links if applicable */}
                    {isAdminUser && (
                        <div className="pt-2 border-t border-[#303238] space-y-2">
                            <Link 
                                to="/admin" 
                                onClick={() => setIsOpen(false)} 
                                className="block py-3 px-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-bold uppercase tracking-wider text-purple-300"
                            >
                                Admin Governance Console
                            </Link>
                            <Link 
                                to="/demo" 
                                onClick={() => setIsOpen(false)} 
                                className="block py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold uppercase tracking-wider text-amber-300"
                            >
                                Interactive Demo Hub
                            </Link>
                        </div>
                    )}

                    {/* Authentication Actions */}
                    <div className="pt-4 border-t border-[#303238] space-y-3">
                        {user ? (
                            <>
                                <Link 
                                    to="/dashboard" 
                                    onClick={() => setIsOpen(false)} 
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] text-xs font-bold uppercase tracking-wider text-white border border-[#303238]"
                                >
                                    <LayoutDashboard size={15} className="text-[#E31824]" /> Access Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-transparent border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#E31824] hover:bg-[#E31824]/10 transition-colors"
                                >
                                    <LogOut size={15} /> Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    onClick={() => setIsOpen(false)} 
                                    className="w-full h-12 flex items-center justify-center rounded-xl border border-[#303238] text-xs font-bold uppercase tracking-wider text-[#F7F8FA] hover:bg-white/[0.05] transition-colors"
                                >
                                    Sign In to Account
                                </Link>
                                <Link 
                                    to="/login" 
                                    onClick={() => setIsOpen(false)} 
                                    className="w-full h-12 flex items-center justify-center rounded-xl bg-[#E31824] hover:bg-[#C9141E] text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#E31824]/25 transition-all"
                                >
                                    Create Your RESQR
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Institutional Sion Enterprises Note */}
                    <div className="pt-4 text-center text-[10px] text-slate-500">
                        <span>RESQR • Powered by Sion Enterprises</span>
                    </div>
                </div>
            )}
        </header>
    );
}