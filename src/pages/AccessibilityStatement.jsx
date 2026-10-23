import { Shield, CheckCircle2, ArrowLeft, Eye, Heart, Globe, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccessibilityStatement() {
    const commitments = [
        {
            title: "WCAG 2.1 Level AA Conformance Goal",
            desc: "RESQR is designed to meet or exceed Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards to ensure critical emergency information remains accessible to all people, including those with visual, auditory, cognitive, or motor impairments."
        },
        {
            title: "Keyboard Navigation & Focus Indicators",
            desc: "All interactive controls, navigation menus, and emergency demo triggers are fully navigable via standard keyboard inputs (Tab, Shift+Tab, Enter, Space) with distinct, high-contrast focus rings."
        },
        {
            title: "High Contrast & Emergency Legibility",
            desc: "We enforce high color-contrast ratios across all critical emergency text, alerts, and button elements, maintaining readability in bright sunlight, outdoor accident conditions, and low-light environments."
        },
        {
            title: "Respect for Reduced Motion Settings",
            desc: "Our styling system honors the 'prefers-reduced-motion: reduce' media query. When active, all decorative continuous motion and page transitions are automatically disabled or minimized."
        },
        {
            title: "Semantic HTML5 & Screen Reader Compatibility",
            desc: "Pages utilize proper heading hierarchies (single h1 per view, logical h2/h3 nesting), semantic landmark tags (<nav>, <main>, <header>, <footer>), descriptive ARIA labels, and explicit image alternative text."
        },
        {
            title: "App-Free Native Browser Accessibility",
            desc: "Emergency identification portals load directly in native mobile browsers upon scan, allowing responders to utilize native device magnification, screen readers (VoiceOver, TalkBack), and accessibility tools without external apps."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Back Link */}
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Home
                </Link>

                {/* Header */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                        <Globe size={13} /> DIGITAL INCLUSION
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                        Accessibility Statement
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Emergency health technology must be universally accessible. In life-critical situations, clarity, speed, and assistive-technology support can save lives.
                    </p>
                </div>

                {/* Core Commitments */}
                <div className="bg-[#17191D] border border-white/10 rounded-3xl p-8 sm:p-10 space-y-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">UNIVERSAL ACCESS MEASURES</span>
                        <h2 className="text-2xl font-bold uppercase text-white mt-1">Implemented Accessibility Measures</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {commitments.map((c, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    {c.title}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Feedback and Contact */}
                    <div className="pt-6 border-t border-white/10 space-y-3">
                        <h3 className="text-base font-bold text-white uppercase">Reporting Accessibility Barriers</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            We continually audit and refine our user interface. If you encounter an accessibility barrier or require an accommodation while navigating RESQR, please contact our accessibility coordinator:
                        </p>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
                            <p><strong className="text-white">Accessibility Desk:</strong> Sion Enterprises</p>
                            <p><strong className="text-white">Email:</strong> <a href="mailto:admin@resqr.co.in" className="text-primary underline">admin@resqr.co.in</a></p>
                            <p><strong className="text-white">Response Commitment:</strong> Within 3 business days</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
