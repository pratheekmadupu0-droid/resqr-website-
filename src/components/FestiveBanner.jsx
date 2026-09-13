import { Link } from 'react-router-dom';
import { Sparkles, HeartHandshake } from 'lucide-react';

/**
 * Vinayaka Chavithi campaign banner.
 * A temporary festive greeting that respects the RESQR brand.
 * Modes:
 *  - 'hero'   : full cinematic greeting panel (used on the landing page)
 *  - 'ribbon' : slim top ribbon with ticker greeting (used across the site)
 */
export default function FestiveBanner({ mode = 'ribbon' }) {
    const particles = [
        { top: '12%', left: '6%', delay: '0s' },
        { top: '72%', left: '14%', delay: '1.2s' },
        { top: '26%', left: '82%', delay: '0.6s' },
        { top: '64%', left: '88%', delay: '2s' },
        { top: '8%', left: '48%', delay: '1.6s' },
    ];

    if (mode === 'hero') {
        return (
            <section
                className="festive-banner relative overflow-hidden mx-auto w-full animate-in slide-in-from-bottom-3 duration-700"
                aria-label="Vinayaka Chavithi greetings"
            >
                <img src="/ganesha-bg.png" alt="" aria-hidden="true" className="festive-bg-photo" loading="lazy" />
                <div className="festive-bg-scrim" aria-hidden="true" />
                {particles.map((p, i) => (
                    <span
                        key={i}
                        className="festive-particle"
                        style={{ top: p.top, left: p.left, animationDelay: p.delay }}
                    />
                ))}

                <div className="relative px-6 sm:px-10 pt-6 sm:pt-8 pb-8 sm:pb-10 text-center">
                    {/* Ganesha-inspired ornament row */}
                    <div className="relative flex justify-center mb-4" aria-hidden="true">
                        <img src="/ganesha-idol.png" alt="Lord Ganesha" className="festive-idol" loading="lazy" />
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-5" aria-hidden="true" style={{ display: 'none' }}>
                        <span className="festive-orbit" />
                        <span className="diya" />
                        <Sparkles size={26} className="text-gold" />
                        <span className="diya" />
                        <span className="festive-orbit" style={{ animationDirection: 'reverse' }} />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gold/90 mb-2">
                        A Ganesha Chaturthi Celebration
                    </p>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                        Happy <span className="text-gradient-gold">Vinayaka</span> Chavithi
                    </h2>

                    <div className="festive-divider w-40 mx-auto mt-4 mb-5" />

                    <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
                        This Vinayaka Chavithi, give yourself and your loved ones the gift of being prepared.
                        May Lord Ganesha bring <span className="text-gold font-semibold">health, safety &amp; happiness</span> to you and your family.
                    </p>

                    <p className="text-sm sm:text-base text-slate-400 mt-5 font-medium">
                        Celebrate with care — create your RESQR emergency profile today.
                    </p>

                    <div className="mt-7 flex items-center justify-center gap-3">
                        <Link to="/login" className="btn-app-gold" style={{ minWidth: 190 }}>
                            <HeartHandshake size={18} /> Create My RESQR
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    // ribbon mode
    return (
        <div
            className="festive-banner ribbon-mode relative overflow-hidden"
            style={{
                background: 'linear-gradient(120deg, #160B12 0%, #1A0E16 45%, #141020 100%)',
                border: '1px solid rgba(217,164,65,0.18)',
            }}
            aria-label="Vinayaka Chavithi greeting snackbar"
        >
            <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
                <span className="diya shrink-0" aria-hidden="true" />
                <p className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-gold/90 truncate">
                    Happy Vinayaka Chavithi · May Lord Ganesha bring health, safety &amp; happiness to you and your loved ones
                </p>
                <span className="diya shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}