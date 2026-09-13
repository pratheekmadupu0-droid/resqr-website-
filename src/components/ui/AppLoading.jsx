import { Link } from 'react-router-dom';

/**
 * RESQR Cinematic Loading Screen
 * Used during authentication / profile loading states.
 */
export default function AppLoading({ message = 'Preparing your emergency profile...', fullScreen = true, size = 'md' }) {
    const ring = size === 'lg' ? 160 : 120;
    const logo = size === 'lg' ? 84 : 60;

    return (
        <div
            className={fullScreen
                ? 'min-h-[100svh] bg-[#05080F] flex items-center justify-center overflow-hidden select-none'
                : 'flex items-center justify-center py-10 select-none'}
            role="status"
            aria-live="polite"
        >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[90px]" />
                <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gold/10 rounded-full blur-[90px]" />
            </div>

            <div className="flex flex-col items-center gap-8">
                <div className="resqr-loader-wrap" style={{ width: ring, height: ring }}>
                    <div className="resqr-loader-ring" />
                    <div className="resqr-loader-ring-2" />
                    <img
                        src={`${import.meta.env.BASE_URL}resqr_logo.png`}
                        alt="RESQR"
                        className="resqr-loader-logo"
                        style={{ width: logo, height: 'auto' }}
                    />
                </div>

                <div className="w-52 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="resqr-progress-bar w-full" />
                </div>

                <p className="text-sm font-semibold text-slate-300 uppercase tracking-[0.22em] animate-pulse">
                    {message}
                </p>

                {fullScreen && (
                    <Link
                        to="/"
                        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        <span className="text-lg leading-none">←</span> RESQR Home
                    </Link>
                )}
            </div>
        </div>
    );
}