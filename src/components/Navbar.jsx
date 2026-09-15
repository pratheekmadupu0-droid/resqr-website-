import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, User, LayoutDashboard, LogOut, QrCode, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';

const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in'
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [isAdminUser, setIsAdminUser] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
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

    // Lock page scroll while the mobile menu is open so the page behind it
    // never scrolls or mixes with the menu panel.
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    // Always close the menu after navigation so a stale menu can't
    // overlap whatever page the user just landed on.
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    if (isEmergency) return null;

    const desktopLinks = [
        { name: 'Home', path: '/' },
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const isActive = (path) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
return (
        <nav
            className="app-header"
            style={{ padding: '10px 16px', borderRadius: 0 }}
            aria-label="Main navigation"
        >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="RESQR home">
                <img
                    src={`${import.meta.env.BASE_URL}resqr_logo.png`}
                    alt="RESQR Logo"
                    className="app-header-logo transition-transform group-hover:scale-105"
                />
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-7 flex-1 justify-center">
                {desktopLinks.map((link) => (
                    <Link
                        key={link.name}
                        to={link.path}
                        className={`text-[13px] font-black uppercase tracking-[0.14em] transition-colors relative ${isActive(link.path) ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        {link.name}
                        {isActive(link.path) && (
                            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(230,57,70,0.8)]" />
                        )}
                    </Link>
                ))}
                {isAdminUser && (
                    <Link
                        to="/admin"
                        className={`text-[13px] font-black uppercase tracking-[0.14em] transition-colors ${isActive('/admin') ? 'text-purple-400' : 'text-slate-300 hover:text-purple-400'}`}
                    >
                        Admin
                    </Link>
                )}
            </div>

            {/* Desktop auth actions */}
            <div className="hidden lg:flex items-center gap-3">
                {user ? (
                    <>
                        <Link to="/dashboard" className="btn-app-outline" style={{ minHeight: 42, padding: '0 18px' }}>
                            <LayoutDashboard size={16} /> {userName || 'Dashboard'}
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center"
                            aria-label="Log out"
                        >
                            <LogOut size={18} />
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn-app-outline" style={{ minHeight: 42, padding: '0 18px' }}>
                            LOGIN
                        </Link>
                        <Link to="/login" className="btn-app-primary" style={{ minHeight: 42, padding: '0 20px' }}>
                            CREATE RESQR
                        </Link>
                    </>
                )}
            </div>
{/* Mobile actions: quick CTA + hamburger */}
            <div className="flex lg:hidden items-center gap-2.5">
                {!user && (
                    <Link to="/login" className="btn-app-primary" style={{ minHeight: 40, padding: '0 16px', fontSize: 13 }}>
                        CREATE RESQR
                    </Link>
                )}
                {user && (
                    <Link to="/dashboard" className="btn-app-outline" style={{ minHeight: 40, padding: '0 16px', fontSize: 13 }}>
                        <User size={15} /> {userName?.split(' ')[0] || 'Account'}
                    </Link>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-11 h-11 rounded-2xl bg-white/6 border border-white/10 text-white flex items-center justify-center"
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isOpen}
                >
                    {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile menu — a solid full-height drawer that slides under the
                header so it never mixes with the page content behind it */}
            {isOpen && (
                <div
                    className="app-mobile-menu-panel lg:hidden overflow-y-auto py-6 px-5 space-y-5"
                    aria-label="Mobile navigation menu"
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Menu</p>
                    {[...desktopLinks, ...(isAdminUser ? [{ name: 'Admin', path: '/admin' }] : [])].map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-black uppercase tracking-widest text-white hover:border-primary/30 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                            {link.name}
                            <ChevronDown size={14} className="rotate-[-90deg] text-slate-500" />
                        </Link>
                    ))}

                    <div className="pt-4 border-t border-white/10 space-y-3">
                        {user ? (
                            <>
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white">
                                    <LayoutDashboard size={16} /> My Dashboard
                                </Link>
                                <Link to="/scanner" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white">
                                    <QrCode size={16} /> Scan RESQR
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 py-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-widest text-primary"
                                >
                                    <LogOut size={16} /> Logout
                                </button>
                            </>
                        ) : (
                            <Link to="/login" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center py-4 rounded-2xl btn-app-primary">
                                <Shield size={16} /> Login / Create RESQR
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}