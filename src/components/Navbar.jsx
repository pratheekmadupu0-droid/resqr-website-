import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, User, LayoutDashboard, Settings, LogOut, Home, Info, QrCode, CreditCard, ChevronDown, BookOpen, Layers, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [hoveredMenu, setHoveredMenu] = useState(null); // 'solutions', 'resources', 'products'
    const [openAccordion, setOpenAccordion] = useState(null); // mobile accordion state
    const location = useLocation();
    const navigate = useNavigate();
    const isEmergency = location.pathname.startsWith('/e/');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userSnap = await get(ref(db, `users/${currentUser.uid}`));
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
                }
            } else {
                setUserName('');
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

    if (isEmergency) return null;

    const solutionsLinks = [
        { name: 'Individuals', path: '/solutions/individuals' },
        { name: 'Families', path: '/solutions/families' },
        { name: 'Doctors', path: '/solutions/doctors' },
        { name: 'Hospitals', path: '/solutions/hospitals' },
        { name: 'Ambulances', path: '/solutions/ambulances' },
        { name: 'First Responders', path: '/solutions/first-responders' },
        { name: 'Enterprises', path: '/solutions/enterprises' },
        { name: 'Schools', path: '/solutions/schools' },
        { name: 'Government', path: '/solutions/government' }
    ];

    const resourcesLinks = [
        { name: 'Safety & Privacy', path: '/safety-privacy' },
        { name: 'Technology', path: '/technology' },
        { name: 'Stories', path: '/stories' },
        { name: 'Emergency Awareness', path: '/emergency-awareness' },
        { name: 'FAQ', path: '/faq' },
        { name: 'Help Center', path: '/help-center' }
    ];

    const productsLinks = [
        { name: 'Products Page', path: '/products' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'Partners', path: '/partners' }
    ];

    return (
        <nav className="sticky top-0 z-40 bg-medical-bg/85 backdrop-blur-md border-b border-white/5 font-manrope">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between py-4 items-center">
                    <Link to="/" className="flex items-center gap-2 shrink-0 group">
                        <img 
                            src={`${import.meta.env.BASE_URL}resqr_logo.png`} 
                            alt="RESQR Logo" 
                            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                        />
                    </Link>

                    {/* Desktop Links with hover dropdown logic */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-slate-100/60 hover:text-primary'}`}>
                            Home
                        </Link>

                        <Link to="/how-it-works" className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === '/how-it-works' ? 'text-primary' : 'text-slate-100/60 hover:text-primary'}`}>
                            How It Works
                        </Link>

                        {/* Solutions Dropdown */}
                        <div 
                            className="relative py-2"
                            onMouseEnter={() => setHoveredMenu('solutions')}
                            onMouseLeave={() => setHoveredMenu(null)}
                        >
                            <button className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.2em] text-slate-100/60 hover:text-primary transition-colors">
                                Solutions <ChevronDown size={12} />
                            </button>
                            {hoveredMenu === 'solutions' && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#091124] border border-white/5 shadow-2xl p-6 rounded-2xl w-64 grid grid-cols-1 gap-2.5 backdrop-blur-xl">
                                    {solutionsLinks.map((item) => (
                                        <Link 
                                            key={item.name} 
                                            to={item.path} 
                                            onClick={() => setHoveredMenu(null)}
                                            className="text-[11px] font-bold text-slate-400 hover:text-primary uppercase tracking-wider block transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Products Dropdown */}
                        <div 
                            className="relative py-2"
                            onMouseEnter={() => setHoveredMenu('products')}
                            onMouseLeave={() => setHoveredMenu(null)}
                        >
                            <button className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.2em] text-slate-100/60 hover:text-primary transition-colors">
                                Products <ChevronDown size={12} />
                            </button>
                            {hoveredMenu === 'products' && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#091124] border border-white/5 shadow-2xl p-6 rounded-2xl w-56 grid grid-cols-1 gap-2.5 backdrop-blur-xl">
                                    {productsLinks.map((item) => (
                                        <Link 
                                            key={item.name} 
                                            to={item.path} 
                                            onClick={() => setHoveredMenu(null)}
                                            className="text-[11px] font-bold text-slate-400 hover:text-primary uppercase tracking-wider block transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Resources Dropdown */}
                        <div 
                            className="relative py-2"
                            onMouseEnter={() => setHoveredMenu('resources')}
                            onMouseLeave={() => setHoveredMenu(null)}
                        >
                            <button className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.2em] text-slate-100/60 hover:text-primary transition-colors">
                                Resources <ChevronDown size={12} />
                            </button>
                            {hoveredMenu === 'resources' && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#091124] border border-white/5 shadow-2xl p-6 rounded-2xl w-60 grid grid-cols-1 gap-2.5 backdrop-blur-xl">
                                    {resourcesLinks.map((item) => (
                                        <Link 
                                            key={item.name} 
                                            to={item.path} 
                                            onClick={() => setHoveredMenu(null)}
                                            className="text-[11px] font-bold text-slate-400 hover:text-primary uppercase tracking-wider block transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link to="/about" className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === '/about' ? 'text-primary' : 'text-slate-100/60 hover:text-primary'}`}>
                            About
                        </Link>

                        <Link to="/contact" className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === '/contact' ? 'text-primary' : 'text-slate-100/60 hover:text-primary'}`}>
                            Contact
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-6 border-l border-white/5 pl-8">
                                <Link to="/dashboard" className="text-[12px] font-black text-slate-100 uppercase tracking-widest hover:text-primary transition-colors">
                                    {userName || 'Dashboard'}
                                </Link>
                                <Button size="md" variant="ghost" className="text-white opacity-40 hover:text-primary hover:opacity-100 transition-all" onClick={handleLogout}>
                                    <LogOut size={18} />
                                </Button>
                            </div>
                        ) : (
                            <Link to="/login">
                                <Button size="md" className="rounded-full px-8 py-5 font-black italic shadow-xl shadow-primary/20 bg-primary text-white border-none text-xs tracking-widest">SIGN IN</Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar overlay */}
            {isOpen && (
                <div className="md:hidden bg-medical-bg border-b border-white/5 py-8 px-6 space-y-6 shadow-2xl overflow-y-auto max-h-[85vh]">
                    <div className="space-y-4">
                        <Link to="/" onClick={() => setIsOpen(false)} className="block text-sm font-black uppercase tracking-widest text-slate-100">
                            Home
                        </Link>

                        <Link to="/how-it-works" onClick={() => setIsOpen(false)} className="block text-sm font-black uppercase tracking-widest text-slate-100">
                            How It Works
                        </Link>

                        {/* Solutions Accordion */}
                        <div>
                            <button 
                                onClick={() => setOpenAccordion(openAccordion === 'solutions' ? null : 'solutions')}
                                className="w-full flex justify-between items-center text-sm font-black uppercase tracking-widest text-slate-100"
                            >
                                Solutions <ChevronDown size={14} />
                            </button>
                            {openAccordion === 'solutions' && (
                                <div className="mt-3 pl-4 space-y-2 border-l border-white/10">
                                    {solutionsLinks.map((item) => (
                                        <Link key={item.name} to={item.path} onClick={() => setIsOpen(false)} className="block text-xs font-bold text-slate-400 uppercase tracking-wide py-1">
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Products Accordion */}
                        <div>
                            <button 
                                onClick={() => setOpenAccordion(openAccordion === 'products' ? null : 'products')}
                                className="w-full flex justify-between items-center text-sm font-black uppercase tracking-widest text-slate-100"
                            >
                                Products <ChevronDown size={14} />
                            </button>
                            {openAccordion === 'products' && (
                                <div className="mt-3 pl-4 space-y-2 border-l border-white/10">
                                    {productsLinks.map((item) => (
                                        <Link key={item.name} to={item.path} onClick={() => setIsOpen(false)} className="block text-xs font-bold text-slate-400 uppercase tracking-wide py-1">
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Resources Accordion */}
                        <div>
                            <button 
                                onClick={() => setOpenAccordion(openAccordion === 'resources' ? null : 'resources')}
                                className="w-full flex justify-between items-center text-sm font-black uppercase tracking-widest text-slate-100"
                            >
                                Resources <ChevronDown size={14} />
                            </button>
                            {openAccordion === 'resources' && (
                                <div className="mt-3 pl-4 space-y-2 border-l border-white/10">
                                    {resourcesLinks.map((item) => (
                                        <Link key={item.name} to={item.path} onClick={() => setIsOpen(false)} className="block text-xs font-bold text-slate-400 uppercase tracking-wide py-1">
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link to="/about" onClick={() => setIsOpen(false)} className="block text-sm font-black uppercase tracking-widest text-slate-100">
                            About
                        </Link>

                        <Link to="/contact" onClick={() => setIsOpen(false)} className="block text-sm font-black uppercase tracking-widest text-slate-100">
                            Contact
                        </Link>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                        {user ? (
                            <>
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block text-center py-4 bg-white/5 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest text-white">
                                    DASHBOARD ({userName})
                                </Link>
                                <Button size="lg" className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 rounded-xl font-black italic" onClick={handleLogout}>
                                    LOGOUT
                                </Button>
                            </>
                        ) : (
                            <Link to="/login" onClick={() => setIsOpen(false)}>
                                <Button size="lg" className="w-full rounded-xl shadow-xl bg-primary text-white border-none font-black italic">SIGN IN</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
