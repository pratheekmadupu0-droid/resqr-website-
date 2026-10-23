import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, RefreshCcw, Truck, ChevronRight, ExternalLink, Sliders, Cookie, Building, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function LegalPage() {
    const location = useLocation();

    // Determine initial tab based on path
    const getInitialTab = (pathname) => {
        if (pathname.includes('/terms')) return 'terms';
        if (pathname.includes('/refund')) return 'refunds';
        if (pathname.includes('/shipping')) return 'shipping';
        if (pathname.includes('/cookie')) return 'cookies';
        return 'privacy';
    };

    const [activeTab, setActiveTab] = useState(() => getInitialTab(location.pathname));

    useEffect(() => {
        setActiveTab(getInitialTab(location.pathname));
    }, [location.pathname]);

    const tabs = [
        { id: 'privacy', label: 'Privacy & Data Governance', icon: <Shield size={18} /> },
        { id: 'terms', label: 'Terms of Service', icon: <FileText size={18} /> },
        { id: 'refunds', label: 'Refund & Cancellation', icon: <RefreshCcw size={18} /> },
        { id: 'shipping', label: 'Shipping & Delivery', icon: <Truck size={18} /> },
        { id: 'cookies', label: 'Cookies & Telemetry', icon: <Cookie size={18} /> },
    ];

    const content = {
        privacy: (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
                    <div>
                        <h2 className="text-3xl font-black italic text-primary uppercase tracking-tighter">Privacy & Data Governance</h2>
                        <p className="text-xs text-slate-400 mt-1">Digital Personal Data Protection (DPDP) Act 2023 Aligned · Version 1.0</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link to="/privacy-policy" className="btn-app-primary py-2 px-4 text-xs inline-flex items-center gap-2">
                            <ExternalLink size={14} /> Full Privacy Centre
                        </Link>
                        <Link to="/privacy-settings" className="btn-app-secondary py-2 px-4 text-xs inline-flex items-center gap-2">
                            <Sliders size={14} /> Privacy Settings
                        </Link>
                    </div>
                </div>

                <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
                    <p className="font-bold text-white italic">Effective Date: October 2026 · Plain Language Legal Summary</p>
                    <p>
                        At <strong>RESQR</strong> (resqr.co.in), developed and operated by <strong>Sion Enterprises</strong>, we treat emergency personal and medical data as a sacred trust. We adhere strictly to data minimization, purpose limitation, transparent consent, and granular role-based access controls.
                    </p>
                    
                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">1. Purpose-Based Processing</h3>
                    <p>
                        We only collect data strictly necessary to operate your emergency QR and NFC identification system, facilitate authenticated medical emergency workflows, and contact designated family members during critical moments.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">2. Public QR Privacy & Masked Relays</h3>
                    <p>
                        Public QR scans never expose raw phone numbers, full medical dossiers, or private residential addresses to unverified passersby. Contact is mediated through secure masked relays (+91 ••••• ••XX) and instant emergency notifications.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">3. Data Principal Rights & Self-Serve Controls</h3>
                    <p>
                        You maintain full sovereignty over your data. Through the <Link to="/privacy-settings" className="text-primary underline">Privacy Settings</Link> and <Link to="/account-deletion" className="text-primary underline">Account Deletion</Link> portals, you can view your personal data inventory, download a complete JSON archive, modify consent permissions, review access audit logs, or request complete account erasure.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">4. Statutory Compliance Notice</h3>
                    <p className="text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-white/5">
                        These privacy disclosures are designed in accordance with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000. Full legal compliance remains subject to formal review by qualified Indian legal counsel upon publication of statutory enforcement rules.
                    </p>
                </div>
            </div>
        ),
        terms: (
            <div className="space-y-6">
                <div className="border-b border-white/10 pb-6 mb-6">
                    <h2 className="text-3xl font-black italic text-primary uppercase tracking-tighter">Terms of Service</h2>
                    <p className="text-xs text-slate-400 mt-1">Official User Agreement · Version 1.2 · Sion Enterprises</p>
                </div>

                <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
                    <p className="font-bold text-white italic">Last Updated: October 2026</p>
                    <p>
                        Please read these Terms of Service carefully before creating a profile or ordering physical QR/NFC identifiers from <strong>RESQR</strong> (resqr.co.in), operated by <strong>Sion Enterprises</strong>. By accessing or using our platform, you agree to be bound by these terms.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">1. Emergency Technology Platform — Not an Ambulance Service</h3>
                    <p>
                        RESQR is an identification, contact relay, and emergency information retrieval technology platform. <strong>RESQR is not an emergency medical service, hospital, or ambulance provider.</strong> While we facilitate instant retrieval of vital information by responders, RESQR does not provide emergency dispatch guarantees, diagnosis, or clinical care.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">2. User Responsibility for Data Accuracy</h3>
                    <p>
                        You are solely responsible for ensuring that all medical details (such as blood group, drug allergies, existing chronic conditions, and emergency contacts) entered into your RESQR profile are accurate, complete, and regularly kept up-to-date. RESQR disclaims liability for inaccuracies in information entered by the user.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">3. Profile Ownership & Account Validity</h3>
                    <p>
                        Initial registration plans provide active emergency service access for the duration specified at purchase (e.g., 3-month trial or digital passport). The physical QR identifier remains your property upon delivery. Profile emergency validities can be renewed without changing or reprinting physical stickers.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">4. Intellectual Property</h3>
                    <p>
                        The RESQR brand, trademark, logo, proprietary QR routing architecture, and user interface are the intellectual property of Sion Enterprises. Unauthorized reproduction or reverse engineering is prohibited.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">5. Governing Law and Jurisdiction</h3>
                    <p>
                        These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Hyderabad, Telangana, India.
                    </p>
                </div>
            </div>
        ),
        refunds: (
            <div className="space-y-6">
                <div className="border-b border-white/10 pb-6 mb-6">
                    <h2 className="text-3xl font-black italic text-primary uppercase tracking-tighter">Refund & Cancellation Policy</h2>
                    <p className="text-xs text-slate-400 mt-1">Fair & Transparent Consumer Protection Terms · Sion Enterprises</p>
                </div>

                <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
                    <p>
                        We strive for complete satisfaction with our safety products and digital passes.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">1. Digital Subscriptions & QR Passes</h3>
                    <p>
                        Digital RESQR profiles and registration fees can be cancelled for a full refund within 24 hours of purchase, provided the emergency profile has not yet been activated or publicly scanned. Once a digital profile has been activated and deployed, registration services are considered consumed.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">2. Physical Products (Stickers, Cards, Tags)</h3>
                    <p>
                        Physical orders (such as helmet sticker packs, smart ID cards, and keychains) can be cancelled for a full refund at any time before the order has entered the printing and dispatch phase. Once an order has been dispatched with a courier tracking number, physical shipments are subject to our return policy.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">3. Damaged or Defective Items</h3>
                    <p>
                        If your physical QR sticker pack, card, or tag arrives damaged, unreadable, or defective, notify us within 7 days of delivery at <a href="mailto:support@resqr.co.in" className="text-primary underline">support@resqr.co.in</a> with photographic evidence. We will dispatch a free replacement immediately at no additional cost.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">4. Refund Processing Time</h3>
                    <p>
                        Approved refunds are processed to the original payment source (via Razorpay) within 5 to 7 business days, depending on your bank's clearance cycles.
                    </p>
                </div>
            </div>
        ),
        shipping: (
            <div className="space-y-6">
                <div className="border-b border-white/10 pb-6 mb-6">
                    <h2 className="text-3xl font-black italic text-primary uppercase tracking-tighter">Shipping & Delivery Policy</h2>
                    <p className="text-xs text-slate-400 mt-1">Pan-India Courier Network · Sion Enterprises</p>
                </div>

                <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
                    <p>
                        We deliver physical RESQR safety gear to every serviceable postal pincode across India.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">1. Dispatch & Processing Time</h3>
                    <p>
                        Physical orders (reflective vinyl stickers, smart wallet cards, and keychains) are typically packed and dispatched within 2 business days of order confirmation and payment verification.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">2. Delivery Timelines</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                        <li><strong>Metro Cities (Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata):</strong> 3 to 4 business days.</li>
                        <li><strong>Tier-2 & Tier-3 Cities:</strong> 4 to 6 business days.</li>
                        <li><strong>Remote or North-Eastern Pincodes:</strong> 7 to 9 business days.</li>
                    </ul>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">3. Courier Partners & Tracking</h3>
                    <p>
                        We partner with reputable Indian logistics carriers including BlueDart, Delhivery, DTDC, and India Post Speed Post. As soon as your shipment leaves our fulfillment centre in Hyderabad, tracking details are sent via SMS and email.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">4. Shipping Charges</h3>
                    <p>
                        Standard shipping fees (if applicable) are clearly calculated and displayed at checkout before payment confirmation. Certain bundle packs and promotional tiers include complimentary free shipping.
                    </p>
                </div>
            </div>
        ),
        cookies: (
            <div className="space-y-6">
                <div className="border-b border-white/10 pb-6 mb-6">
                    <h2 className="text-3xl font-black italic text-primary uppercase tracking-tighter">Cookies & Technical Telemetry</h2>
                    <p className="text-xs text-slate-400 mt-1">Zero Invasive Cross-Site Ad Tracking · Sion Enterprises</p>
                </div>

                <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
                    <p>
                        RESQR respects citizen digital privacy. We do not use third-party behavioral advertising cookies or cross-site tracking trackers.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">1. Essential Technical Cookies & Tokens</h3>
                    <p>
                        We store essential session tokens in secure browser storage (such as Firebase Auth JWTs) strictly to keep you authenticated, preserve active profile selections, and remember interface preferences across navigation.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">2. Security Telemetry</h3>
                    <p>
                        When accessing protected endpoints or triggering emergency scans, our infrastructure logs standard HTTP metadata (such as IP address, User-Agent, and timestamp) solely for rate limiting, DDoS mitigation, and anti-tamper security auditing.
                    </p>

                    <h3 className="text-base font-black text-white italic uppercase tracking-wider mt-6">3. Managing Local Storage</h3>
                    <p>
                        You can clear your browser cookies and local storage at any time via your browser settings. Logging out of your account purges session authentication tokens immediately.
                    </p>
                </div>
            </div>
        ),
    };

    return (
        <div className="min-h-screen bg-[#040812] page-bg-ganesha py-28 px-4 text-white font-manrope">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                    <div className="flex justify-center">
                        <Badge className="bg-primary/20 text-primary border border-primary/20 px-6 py-1 font-black italic tracking-widest text-xs">
                            LEGAL & COMPLIANCE HUB
                        </Badge>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-none font-poppins">
                        LEGAL & <span className="text-primary italic-display">COMPLIANCE.</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-medium">
                        Complete legal framework, consumer rights, shipping policies, and operational terms governing Sion Enterprises and the RESQR platform.
                    </p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Navigation Sidebar */}
                    <aside className="lg:w-80 space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-black italic uppercase tracking-[0.1em] text-xs ${
                                    activeTab === tab.id
                                        ? 'bg-charcoal border-2 border-primary text-white shadow-xl shadow-primary/10'
                                        : 'bg-charcoal/40 border-2 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                                }`}
                            >
                                <span className="flex items-center gap-3">
                                    <div className={activeTab === tab.id ? 'text-primary' : 'text-slate-500'}>
                                        {tab.icon}
                                    </div>
                                    {tab.label}
                                </span>
                                <ChevronRight size={16} className={activeTab === tab.id ? 'text-primary translate-x-1' : 'opacity-0'} />
                            </button>
                        ))}

                        <div className="mt-8 p-6 bg-charcoal/60 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase">
                                <Building size={16} /> Legal Entity Details
                            </div>
                            <div className="text-xs text-slate-400 space-y-1">
                                <p><strong className="text-white">Operating Company:</strong> Sion Enterprises</p>
                                <p><strong className="text-white">Product:</strong> RESQR (resqr.co.in)</p>
                                <p><strong className="text-white">Headquarters:</strong> Hyderabad, Telangana, India</p>
                                <p><strong className="text-white">Legal Inquiries:</strong> admin@resqr.co.in</p>
                            </div>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1">
                        <Card className="p-8 md:p-12 bg-charcoal/80 border-white/5 shadow-2xl rounded-3xl relative overflow-hidden min-h-[500px]">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {content[activeTab]}
                                </motion.div>
                            </AnimatePresence>
                        </Card>
                    </main>
                </div>
            </div>
        </div>
    );
}
