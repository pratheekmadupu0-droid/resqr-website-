/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#E63946', // Emergency Red
                    dark: '#D62828',
                },
                secondary: {
                    DEFAULT: '#1D3557', // Dark Blue
                    light: '#457B9D',
                },
                medical: {
                    bg: '#05080F', // Deep Medical Night
                    card: '#0C1322', // Medical Dark Card
                    accent: '#E63946',
                },
                gold: {
                    DEFAULT: '#D9A441', // Vinayaka Chavithi premium gold
                    light: '#F2C94C',
                    dark: '#B8863B',
                },
                maroon: {
                    DEFAULT: '#7A1F2E', // Deep festive maroon
                },
                night: {
                    bg: '#04070C',
                    card: '#0A101D',
                },
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
                manrope: ['Manrope', 'sans-serif'],
            },
            boxShadow: {
                'gold-glow': '0 0 24px rgba(217, 164, 65, 0.35)',
                'red-glow': '0 0 28px rgba(230, 57, 70, 0.35)',
                'card-premium': '0 20px 48px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.35)',
            },
        },
    },
    plugins: [],
}
