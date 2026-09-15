import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Builds animation style props using longhands only.
 *
 * React warns when the `animation` shorthand and a longhand such as
 * `animationDelay` are set on the same element (it causes styling bugs on
 * rerender), so every animated layer here composes longhands instead.
 */
function anim(name, { duration, timing = 'ease-in-out', iteration = 'infinite', fill = 'none', delay = '0s' } = {}, enabled = true) {
    return {
        animationName: enabled ? name : 'none',
        animationDuration: duration,
        animationTimingFunction: timing,
        animationIterationCount: iteration,
        animationFillMode: fill,
        animationDelay: delay,
        animationPlayState: 'running',
    };
}

/**
 * DevotionalBackground — reusable cinematic devotional atmosphere layer.
 *
 * Places a subtle Lord Ganesha-inspired atmosphere BEHIND the UI.
 * Uses SVG line-art, CSS gradients, and lightweight CSS animations only.
 *
 * Config props:
 *  showGanesha, showParticles, showDiya, showMandala
 *  intensity = 'low' | 'medium' | 'high'
 *  animationEnabled (auto-disabled if prefers-reduced-motion)
 *  blendTo – blend mode for foreground layer
 *  parallaxX, parallaxY – subtle parallax 0..1
 *  className, style
 *
 * IMPORTANT: pointer-events: none. UI layers must stay interactive.
 */
export default function DevotionalBackground({
    showGanesha = true,
    showParticles = true,
    showDiya = true,
    showMandala = true,
    intensity = 'medium',
    animationEnabled = true,
    blendTo = 'screen',
    parallaxX = 0,
    parallaxY = 0,
    className = '',
    style = {},
}) {
    const containerRef = useRef(null);
    const [reduced, setReduced] = useState(false);
    const [mounted, setMounted] = useState(false);

    // respect reduced-motion
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => setReduced(mq.matches);
        setReduced(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // mark mounted on client so animations kick in after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    const shouldAnimate = animationEnabled && !reduced && mounted;

    // count particles based on intensity
    const particleCount = (() => {
        if (!showParticles) return 0;
        if (intensity === 'low') return 10;
        if (intensity === 'high') return 26;
        return 16;
    })();

    const baseSize = intensity === 'low' ? 200 : intensity === 'high' ? 320 : 260;
    const haloSize = baseSize * 3.2;

    const ganeshaOpacity = intensity === 'low' ? 0.55 : intensity === 'high' ? 0.85 : 0.7;
    const haloOpacity = intensity === 'low' ? 0.5 : intensity === 'high' ? 0.75 : 0.6;
    const particleOpacity = intensity === 'low' ? 0.8 : intensity === 'high' ? 1 : 0.9;
    const mandalaOpacity = intensity === 'low' ? 0.35 : intensity === 'high' ? 0.6 : 0.45;
    const diyaOpacity = intensity === 'low' ? 0.8 : intensity === 'high' ? 1 : 0.9;

    // subtle parallax (max px varies with intensity)
    const offsetPx = useCallback(
        (axis, value) => {
            const maxPx = intensity === 'low' ? 6 : intensity === 'high' ? 22 : 14;
            const px = value * maxPx;
            if (axis === 'x') return px;
            return -px;
        },
        [intensity],
    );

    const bgX = offsetPx('x', parallaxX);
    const bgY = offsetPx('y', parallaxY);

    // particles (deterministic-ish seed so it never looks like a generic star-field)
    // NOTE: generated regardless of animation state so reduced-motion users
    // still see a static devotional scatter (animation only gates motion, not existence).
    const particles = useMemo(() => {
        if (!showParticles) return [];
        const out = [];
        for (let i = 0; i < particleCount; i++) {
            const seed = (i * 97 + 31) % 997;
            out.push({
                id: i,
                top: 5 + ((seed * 7) % 90),
                left: 5 + ((seed * 13) % 90),
                size: 2 + ((seed % 4)),
                delay: ((seed % 13) / 13) + 's',
                duration: (5 + ((seed % 5))) + 's',
            });
        }
        return out;
    }, [particleCount, showParticles]);

    return (
        <div
            ref={containerRef}
            className={`devotional-bg ${className}`.trim()}
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 0,
                willChange: 'transform',
                transform: `translate3d(${bgX}px, ${bgY}px, 0)`,
                transition: 'transform 0.25s ease-out',
                ...style,
            }}
            aria-hidden="true"
        >
            {/* ===== Deep base gradient (black, slightly cinematic) ===== */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(1400px 800px at 50% 100%, rgba(217,164,65,0.035), transparent 65%), linear-gradient(180deg, #04070C 0%, #05080F 40%, #060A13 100%)',
                    opacity: 0.35,
                    ...anim('devotional-fade-in', { duration: '1s', timing: 'ease-out', iteration: '1', fill: 'both' }, shouldAnimate),
                }}
                aria-hidden="true"
            />

            {/* ===== Golden halo behind Ganesha ===== */}
            {showGanesha && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: haloSize,
                        height: haloSize,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        background:
                            'radial-gradient(50% 50% at 50% 50%, rgba(255,178,80,0.22), rgba(217,164,65,0.10) 45%, transparent 70%)',
                        filter: 'blur(10px)',
                        opacity: haloOpacity,
                        pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            animation: shouldAnimate
                                ? 'devotional-halo-pulse 6s ease-in-out infinite'
                                : 'none',
                            background:
                                'radial-gradient(50% 50% at 50% 50%, rgba(255,200,110,0.10), transparent 70%)',
                            pointerEvents: 'none',
                        }}
                        aria-hidden="true"
                    />
                </div>
            )}

            {/* ===== Subtle mandala motif ===== */}
            {showMandala && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: mandalaOpacity,
                        mixBlendMode: blendTo,
                        pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            ...anim('devotional-mandala-float', { duration: '24s', delay: '1s' }, shouldAnimate),
                            pointerEvents: 'none',
                        }}
                        aria-hidden="true"
                    >
                        <MandalaSvg />
                    </div>
                </div>
            )}

            {/* ===== Ganesha silhouette / line-art (subtle) ===== */}
            {showGanesha && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: baseSize,
                        transform: 'translate(-50%, -50%)',
                        opacity: ganeshaOpacity,
                        mixBlendMode: blendTo,
                        color: 'rgba(217,164,65,0.9)',
                        pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                >
                    <div
                        style={{
                            ...anim('devotional-ganesha-fade', { duration: '1.4s', timing: 'ease-out', iteration: '1', fill: 'both', delay: '0.4s' }, shouldAnimate),
                            pointerEvents: 'none',
                        }}
                        aria-hidden="true"
                    >
                        <GaneshaSvg />
                    </div>
                </div>
            )}

            {/* ===== Floating devotional particles ===== */}
            {showParticles && particles.length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: particleOpacity,
                        mixBlendMode: blendTo,
                        pointerEvents: 'none',
                        perspective: '600px',
                    }}
                    aria-hidden="true"
                >
                    {particles.map((p) => (
                        <DevotionalParticle key={p.id} particle={p} animate={shouldAnimate} />
                    ))}
                </div>
            )}

            {/* ===== Diya / lamp accents ===== */}
            {showDiya && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: diyaOpacity,
                        pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            ...anim('devotional-diyas-drift', { duration: '28s', delay: '2s' }, shouldAnimate),
                        }}
                        aria-hidden="true"
                    >
                        <Diya position={{ left: '8%', top: '78%' }} scale={0.85} glowSize={120} delay={0.4} animate={shouldAnimate} />
                        <Diya position={{ left: '88%', top: '18%' }} scale={0.8} glowSize={110} delay={0.9} animate={shouldAnimate} />
                        <Diya position={{ left: '12%', top: '20%' }} scale={0.7} glowSize={100} delay={1.5} animate={shouldAnimate} />
                        <Diya position={{ left: '86%', top: '72%' }} scale={0.75} glowSize={95} delay={2.0} animate={shouldAnimate} />
                    </div>
                </div>
            )}
        </div>
    );
}

function DevotionalParticle({ particle, animate }) {
    return (
        <span
            style={{
                position: 'absolute',
                top: particle.top + '%',
                left: particle.left + '%',
                width: particle.size,
                height: particle.size,
                borderRadius: '50%',
                background: 'rgba(217,164,65,0.55)',
                boxShadow: '0 0 6px rgba(217,164,65,0.7), 0 0 2px rgba(255,210,122,0.5)',
                opacity: animate ? undefined : 0.8,
                ...anim('devotional-particle-float', { duration: `${particle.duration}s`, delay: animate ? particle.delay : '0s' }, animate),
                pointerEvents: 'none',
            }}
            aria-hidden="true"
        />
    );
}

function Diya({ position, scale = 1, glowSize = 120, delay = 0, animate = true }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                transform: `translateX(-50%) scale(${scale})`,
                animationDelay: String(delay) + 's',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
            aria-hidden="true"
        >
            <div
                style={{
                    width: glowSize,
                    height: glowSize,
                    borderRadius: '50%',
                    background:
                        'radial-gradient(50% 50% at 50% 50%, rgba(255,178,80,0.45), rgba(255,140,40,0.18) 40%, transparent 72%)',
                    filter: 'blur(7px)',
                    ...anim('devotional-diyas-flicker', { duration: '3.2s', delay: animate ? String(delay) + 's' : '0s' }, animate),
                }}
                aria-hidden="true"
            />
            <div
                style={{
                    width: 10,
                    height: 8,
                    borderRadius: '50% 50% 42% 42%',
                    background: 'linear-gradient(180deg, #D9A441, #8C5A1E)',
                    boxShadow: '0 2px 8px rgba(140,90,30,0.5)',
                }}
                aria-hidden="true"
            />
            <div
                style={{
                    width: 2.5,
                    height: 6,
                    borderRadius: '60% 60% 50% 50%',
                    background: '#FFD27A',
                    boxShadow: '0 0 10px rgba(255,178,80,0.8), 0 0 3px #FFB350',
                    marginTop: -4,
                    ...anim('devotional-flame', { duration: '2.6s', delay: animate ? String(delay) + 's' : '0s' }, animate),
                }}
                aria-hidden="true"
            />
        </div>
    );
}

function MandalaSvg() {
    return (
        <svg
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
            style={{
                position: 'absolute',
                left: '50%',
                top: '54%',
                width: 'clamp(120px, 34vw, 300px)',
                height: 'auto',
                transform: 'translate(-50%, -50%)',
                opacity: 0.85,
            }}
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="mandalaGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(217,164,65,0.35)" />
                    <stop offset="55%" stopColor="rgba(217,164,65,0.12)" />
                    <stop offset="100%" stopColor="rgba(217,164,65,0)" />
                </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(217,164,65,0.22)" strokeWidth="1" />
            <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(217,164,65,0.18)" strokeWidth="1" strokeDasharray="2 6" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(217,164,65,0.14)" strokeWidth="1" />
            <g fill="none" stroke="rgba(217,164,65,0.18)" strokeWidth="1">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => (
                    <g key={i} transform={`rotate(${ang} 100 100)`}>
                        <path
                            d="M 100 40 C 118 60 118 140 100 160 C 82 140 82 60 100 40 Z"
                            fill="rgba(217,164,65,0.06)"
                            stroke="rgba(217,164,65,0.18)"
                        />
                    </g>
                ))}
            </g>
            <circle cx="100" cy="100" r="3.5" fill="rgba(217,164,65,0.5)" />
            <circle cx="100" cy="100" r="6" fill="none" stroke="rgba(217,164,65,0.25)" strokeWidth="1" />
        </svg>
    );
}

function GaneshaSvg() {
    return (
        <svg
            viewBox="0 0 200 230"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="gline" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(217,164,65,0.95)" />
                    <stop offset="100%" stopColor="rgba(184,134,59,0.95)" />
                </linearGradient>
            </defs>
            <path
                d="M 100 30 C 72 30 56 52 56 78 C 56 98 70 112 84 116 C 88 117 92 118 96 120 L 104 120 C 108 118 112 117 116 116 C 130 112 144 98 144 78 C 144 52 128 30 100 30 Z"
                fill="rgba(217,164,65,0.06)"
                stroke="rgba(217,164,65,0.55)"
                strokeWidth="1"
            />
            <path
                d="M 112 80 C 132 82 148 92 152 108 C 154 116 150 122 144 124 C 138 126 134 120 136 114 C 140 106 138 100 132 98 C 128 96 126 100 128 106 C 130 112 128 118 122 120"
                fill="none"
                stroke="rgba(217,164,65,0.55)"
                strokeWidth="1"
            />
            <path
                d="M 88 80 C 68 82 52 92 48 108 C 46 116 50 122 56 124 C 62 126 66 120 64 114 C 60 106 62 100 68 98 C 72 96 74 100 72 106 C 70 112 72 118 78 120"
                fill="none"
                stroke="rgba(217,164,65,0.55)"
                strokeWidth="1"
            />
            <path
                d="M 62 72 C 42 74 32 84 34 100 C 36 110 46 114 56 110"
                fill="none"
                stroke="rgba(217,164,65,0.45)"
                strokeWidth="1"
            />
            <path
                d="M 138 72 C 158 74 168 84 166 100 C 164 110 154 114 144 110"
                fill="none"
                stroke="rgba(217,164,65,0.45)"
                strokeWidth="1"
            />
            <circle cx="144" cy="124" r="1.6" fill="rgba(217,164,65,0.7)" />
            <path
                d="M 78 122 C 74 140 72 160 78 182 C 84 200 96 212 100 212 C 104 212 116 200 122 182 C 128 160 126 140 122 122"
                fill="rgba(217,164,65,0.04)"
                stroke="rgba(217,164,65,0.45)"
                strokeWidth="1"
            />
            <path
                d="M 82 138 C 70 144 60 154 58 164"
                fill="none"
                stroke="rgba(217,164,65,0.4)"
                strokeWidth="1"
            />
            <path
                d="M 118 138 C 130 144 140 154 142 164"
                fill="none"
                stroke="rgba(217,164,65,0.4)"
                strokeWidth="1"
            />
            <g fill="none" stroke="rgba(217,164,65,0.28)" strokeWidth="1">
                <path d="M 86 212 C 92 204 96 204 100 212 C 104 204 108 204 114 212" />
                <path d="M 92 214 C 98 206 102 206 104 214 C 108 206 112 206 118 214" />
            </g>
            <path
                d="M 88 50 C 92 42 108 42 112 50"
                fill="none"
                stroke="rgba(217,164,65,0.5)"
                strokeWidth="1"
            />
            <circle cx="100" cy="46" r="2" fill="rgba(217,164,65,0.65)" />
        </svg>
    );
}


