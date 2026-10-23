import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Sparkles, ShieldAlert, ArrowRight, User, Users, HeartPulse,
    Building2, Siren, Dog, GraduationCap, BookOpen, Briefcase,
    Shield, X, ChevronDown, RefreshCw, LayoutDashboard
} from 'lucide-react';
import {
    isDemoMode, getActiveDemoRole, setDemoMode,
    DEMO_ROLES, DEMO_ROLE_METADATA, seedDemoDatabaseFixtures
} from '../../lib/demoService';
import toast from 'react-hot-toast';

const ICONS = {
    User,
    Users,
    HeartPulse,
    Building2,
    Siren,
    Dog,
    GraduationCap,
    BookOpen,
    Briefcase,
    Shield,
};

export default function DemoFloatingBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [active, setActive] = useState(false);
    const [currentRole, setCurrentRole] = useState(DEMO_ROLES.USER);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const checkState = () => {
            const isDemo = isDemoMode();
            setActive(isDemo);
            setCurrentRole(getActiveDemoRole());
        };

        checkState();

        const handleDemoEvent = (e) => {
            if (e.detail) {
                setActive(e.detail.active);
                if (e.detail.role) setCurrentRole(e.detail.role);
            } else {
                checkState();
            }
        };

        window.addEventListener('resqr-demo-mode-change', handleDemoEvent);
        return () => window.removeEventListener('resqr-demo-mode-change', handleDemoEvent);
    }, [location.pathname]);

    if (!active) return null;

    const meta = DEMO_ROLE_METADATA[currentRole] || DEMO_ROLE_METADATA[DEMO_ROLES.USER];
    const RoleIcon = ICONS[meta.icon] || User;

    const handleSwitchRole = async (newRole) => {
        setDemoMode(true, newRole);
        setCurrentRole(newRole);
        setIsMenuOpen(false);

        const target = DEMO_ROLE_METADATA[newRole]?.targetRoute || '/dashboard';
        toast.success(`Switched context to Demo ${DEMO_ROLE_METADATA[newRole]?.label}`);
        navigate(target);
    };

    const handleExitDemo = () => {
        setDemoMode(false);
        setActive(false);
        toast.success('Exited Demo Mode. Returned to Live Production Environment.');
        navigate('/');
    };

    return (
        <aside 
            role="complementary"
            aria-label="Demo Mode Notification"
            className="sticky top-0 z-[100] bg-gradient-to-r from-amber-600 via-red-600 to-amber-600 text-white shadow-2xl border-b border-white/20 text-xs font-manrope transition-all"
        >
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                {/* Left Alert Badge */}
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span className="px-2 py-0.5 rounded-full bg-black/40 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-white/20">
                        100% FREE DEMO MODE
                    </span>
                    <span className="hidden md:inline text-[11px] font-bold text-white/90">
                        All accounts, payments & emergency triggers are safely simulated.
                    </span>
                </div>

                {/* Center Role Switcher */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 border border-white/20 text-white font-bold inline-flex items-center gap-2 text-xs shadow-md transition-all"
                    >
                        <RoleIcon size={14} className="text-amber-300" />
                        <span>Viewing as: <strong className="text-amber-200 uppercase font-black">{meta.label}</strong></span>
                        <ChevronDown size={14} className="opacity-70" />
                    </button>

                    {/* Role Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-72 bg-[#090E1A] border border-white/15 rounded-2xl shadow-2xl p-2 space-y-1 z-50 text-slate-200">
                            <p className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Switch Demo Experience (1-Click)
                            </p>
                            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
                                {Object.values(DEMO_ROLES).map((roleKey) => {
                                    const rMeta = DEMO_ROLE_METADATA[roleKey];
                                    const Icon = ICONS[rMeta.icon] || User;
                                    const isCurrent = currentRole === roleKey;
                                    return (
                                        <button
                                            key={roleKey}
                                            onClick={() => handleSwitchRole(roleKey)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                                                isCurrent
                                                    ? 'bg-primary text-white font-black'
                                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            <Icon size={16} className={isCurrent ? 'text-white' : 'text-primary'} />
                                            <div>
                                                <p className="leading-tight">{rMeta.label}</p>
                                                <p className="text-[10px] opacity-70 font-normal truncate max-w-[190px]">{rMeta.name}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/demo-admin')}
                        className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        <LayoutDashboard size={13} /> Demo Hub
                    </button>
                    <button
                        type="button"
                        onClick={handleExitDemo}
                        className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 transition-all"
                        title="Exit Demo Mode"
                    >
                        <X size={12} /> Exit
                    </button>
                </div>
            </div>
        </aside>
    );
}
