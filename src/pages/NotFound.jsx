import { Link } from 'react-router-dom';
import { ShieldAlert, Home, QrCode, LayoutDashboard } from 'lucide-react';

/**
 * NotFound — elegant 404 for unmatched routes.
 * Routes like /:username are handled by QRScanPage, so reaching this page
 * means the URL genuinely does not exist. Never shows technical details.
 */
export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope flex items-center justify-center px-5 py-24 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[110px]" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gold/10 rounded-full blur-[110px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg text-center space-y-7">
                <img
                    src={`${import.meta.env.BASE_URL}resqr_logo.png`}
                    alt="RESQR"
                    className="h-11 w-auto mx-auto object-contain"
                />

                <div className="inline-flex items-center gap-2 status-pill status-pill-danger">
                    <ShieldAlert size={13} /> Error 404
                </div>

                <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter font-poppins leading-none">
                    Page not found
                </h1>

                <p className="text-sm font-semibold text-slate-400 leading-relaxed max-w-md mx-auto">
                    The page you were looking for is not available. If you scanned a RESQR tag, open the
                    scanner and try again — emergency information always loads from the tag itself.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link to="/" className="btn-app-primary w-full sm:w-auto">
                        <Home size={16} /> Back to home
                    </Link>
                    <Link to="/scanner" className="btn-app-outline w-full sm:w-auto">
                        <QrCode size={16} /> Scan RESQR
                    </Link>
                    <Link to="/dashboard" className="btn-app-secondary w-full sm:w-auto">
                        <LayoutDashboard size={16} /> Dashboard
                    </Link>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-600 pt-4">
                    RESQR Emergency Identity Systems
                </p>
            </div>
        </div>
    );
}
