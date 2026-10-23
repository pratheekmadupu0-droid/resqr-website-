/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx,html}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#D71920', // Official Emergency Red
                    dark: '#A80F19',    // Deep Crimson
                    crimson: '#A80F19',
                    hover: '#B8141B',
                    light: '#F87171',
                    soft: 'rgba(215, 25, 32, 0.08)',
                    glow: 'rgba(215, 25, 32, 0.25)',
                },
                charcoal: {
                    DEFAULT: '#17191D', // Charcoal
                    dark: '#0E1013',
                    card: '#131519',
                    surface: '#1A1D22',
                    border: '#272B33',
                    muted: '#626975',
                },
                slate: {
                    950: '#0C0E12',
                    900: '#12151B',
                    850: '#17191D',
                    800: '#1E232B',
                },
                resqr: {
                    red: '#D71920',
                    crimson: '#A80F19',
                    charcoal: '#17191D',
                    softbg: '#F6F7F8',
                    muted: '#626975',
                    border: '#E5E7EB',
                },
                medical: {
                    bg: '#0E1013',
                    card: '#14171D',
                    accent: '#D71920',
                },
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            fontFamily: {
                sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
                poppins: ['Inter', 'Manrope', 'sans-serif'],
                manrope: ['Manrope', 'Inter', 'sans-serif'],
                heading: ['Inter', 'Manrope', 'sans-serif'],
            },
            boxShadow: {
                'red-glow': '0 0 28px rgba(215, 25, 32, 0.35)',
                'red-subtle': '0 4px 20px rgba(215, 25, 32, 0.15)',
                'card-premium': '0 20px 48px rgba(0,0,0,0.45), 0 2px 10px rgba(0,0,0,0.3)',
                'card-light': '0 10px 30px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            },
        },
    },
    plugins: [],
    corePlugins: {
        float: false,
        clear: false,
        skew: false,
        fontVariantNumeric: false,
        scrollSnapType: false,
        scrollSnapAlign: false,
        scrollSnapStop: false,
    },
}
