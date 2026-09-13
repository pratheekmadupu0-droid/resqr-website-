import { useLocation, useNavigate } from 'react-router-dom';
import { Home, UserRound, QrCode, ScanLine, CircleUserRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * RESQR mobile app-style bottom navigation.
 * Mobile-first: HOME · PROFILE · MY QR · SCAN · ACCOUNT
 * Hidden on lg+ screens (see .app-mobile-nav media query).
 */
export default function MobileNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setIsAuthed(!!u));
        return () => unsub();
    }, []);

    const path = location.pathname;
    const isScanPage = path === '/scanner';

    const items = [
        { key: 'home', label: 'Home', icon: Home, to: '/' },
        { key: 'profile', label: 'Profile', icon: UserRound, to: '/dashboard' },
        { key: 'myqr', label: 'My QR', icon: QrCode, to: '/dashboard#my-qr' },
        { key: 'scan', label: 'Scan', icon: ScanLine, to: '/scanner' },
        { key: 'account', label: 'Account', icon: CircleUserRound, to: isAuthed ? '/dashboard' : '/login' },
    ];

    const activeKey = (() => {
        if (path === '/') return 'home';
        if (path === '/scanner') return 'scan';
        if (path.startsWith('/dashboard')) return location.hash === '#my-qr' ? 'myqr' : 'profile';
        if (path === '/login' || path === '/payment') return 'account';
        return null;
    })();

    if (isScanPage) return null;

    return (
        <nav className="app-mobile-nav" aria-label="Primary mobile navigation">
            {items.map(({ key, label, icon: Icon, to }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => {
                        if (activeKey === key && (to === '/dashboard' || to === '/')) return;
                        navigate(to);
                    }}
                    className={`app-nav-item ${activeKey === key ? 'app-nav-item-active' : ''}`}
                    aria-label={label}
                    aria-current={activeKey === key ? 'page' : undefined}
                >
                    <Icon />
                    <span>{label}</span>
                </button>
            ))}
        </nav>
    );
}