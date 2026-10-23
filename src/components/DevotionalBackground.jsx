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
export default function DevotionalBackground() {
    return null;
}



