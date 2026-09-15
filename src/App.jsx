import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// Route-level code splitting: each page is fetched on demand so the initial
// bundle stays small and the homepage loads fast (perf requirement #32).
import React, { Component, lazy, Suspense, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import SiconBadge from './components/SiconBadge';
import AppLoading from './components/ui/AppLoading';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyQR = lazy(() => import('./pages/MyQR'));
const EmergencyPreview = lazy(() => import('./pages/EmergencyPreview'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PrivacySettings = lazy(() => import('./pages/PrivacySettings'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'));
const QRScanPage = lazy(() => import('./pages/QRScanPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CreateIdentity = lazy(() => import('./pages/CreateIdentity'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ViralQR = lazy(() => import('./pages/ViralQR'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const SolutionsIndividuals = lazy(() => import('./pages/SolutionsIndividuals'));
const SolutionsFamilies = lazy(() => import('./pages/SolutionsFamilies'));
const SolutionsDoctors = lazy(() => import('./pages/SolutionsDoctors'));
const SolutionsHospitals = lazy(() => import('./pages/SolutionsHospitals'));
const SolutionsAmbulances = lazy(() => import('./pages/SolutionsAmbulances'));
const SolutionsFirstResponders = lazy(() => import('./pages/SolutionsFirstResponders'));
const SolutionsEnterprises = lazy(() => import('./pages/SolutionsEnterprises'));
const SolutionsSchools = lazy(() => import('./pages/SolutionsSchools'));
const SolutionsGovernment = lazy(() => import('./pages/SolutionsGovernment'));
const SafetyPrivacy = lazy(() => import('./pages/SafetyPrivacy'));
const Technology = lazy(() => import('./pages/Technology'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const StoriesPage = lazy(() => import('./pages/StoriesPage'));
const EmergencyAwareness = lazy(() => import('./pages/EmergencyAwareness'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));

class AdminErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("AdminPanel Error Boundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-manrope">
                    <div className="max-w-md w-full bg-slate-900/90 border border-white/10 p-8 rounded-3xl text-center space-y-6 backdrop-blur-xl shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldAlert size={36} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Admin Interface Recovered</h2>
                            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
                                A transient data exception occurred. Click below to refresh and re-sync the command console.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                        >
                            <RefreshCw size={16} /> Reload Admin Panel
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
}

function App() {
    const location = useLocation();
    const isScanPage = location.pathname.startsWith('/e/') || location.pathname.startsWith('/qr/') || location.pathname.startsWith('/u/') || (location.pathname.length > 1 && !['dashboard', 'create-profile', 'create-identity', 'payment', 'success', 'admin', 'login', 'contact', 'legal', 'about', 'free-qr', 'viral-id', 'scanner', 'store', 'how-it-works', 'solutions', 'safety-privacy', 'technology', 'products', 'pricing', 'partners', 'stories', 'emergency-awareness', 'faq', 'help-center', 'my-qr', 'emergency-preview', 'emergency-profile', 'privacy-settings'].includes(location.pathname.split('/')[1]));

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-white">
            <ScrollToTop />
            {!isScanPage && <Navbar />}
            <main className={`flex-grow ${isScanPage ? 'pt-0' : 'pb-24 lg:pb-0'}`}>
                <Suspense fallback={<AppLoading message="Loading RESQR..." />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/free-qr" element={<ViralQR />} />
                    <Route path="/viral-id" element={<ViralQR />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/my-qr" element={<MyQR />} />
                    <Route path="/emergency-preview" element={<EmergencyPreview />} />
                    <Route path="/create-profile" element={<Navigate to="/login" replace />} />
                    <Route path="/create-identity" element={<CreateIdentity />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/privacy-settings" element={<PrivacySettings />} />
                    <Route path="/success" element={<SuccessPage />} />
                    <Route path="/e/:id" element={<EmergencyPage />} />
                    <Route path="/qr/:profileId" element={<QRScanPage />} />
                    <Route path="/admin" element={<AdminErrorBoundary><AdminPanel /></AdminErrorBoundary>} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/p/:username" element={<QRScanPage />} />
                    <Route path="/u/:username" element={<QRScanPage />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/solutions/individuals" element={<SolutionsIndividuals />} />
                    <Route path="/solutions/families" element={<SolutionsFamilies />} />
                    <Route path="/solutions/doctors" element={<SolutionsDoctors />} />
                    <Route path="/solutions/hospitals" element={<SolutionsHospitals />} />
                    <Route path="/solutions/ambulances" element={<SolutionsAmbulances />} />
                    <Route path="/solutions/first-responders" element={<SolutionsFirstResponders />} />
                    <Route path="/solutions/enterprises" element={<SolutionsEnterprises />} />
                    <Route path="/solutions/schools" element={<SolutionsSchools />} />
                    <Route path="/solutions/government" element={<SolutionsGovernment />} />
                    <Route path="/safety-privacy" element={<SafetyPrivacy />} />
                    <Route path="/legal" element={<LegalPage />} />
                    <Route path="/technology" element={<Technology />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/partners" element={<PartnersPage />} />
                    <Route path="/stories" element={<StoriesPage />} />
                    <Route path="/emergency-awareness" element={<EmergencyAwareness />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/help-center" element={<HelpCenter />} />
                    <Route path="/scanner" element={<ScannerPage />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="/emergency-profile" element={<EmergencyPreview />} />
                    <Route path="/:username" element={<QRScanPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
            </main>
            {!isScanPage && <Footer />}
            {!isScanPage && <MobileNav />}
            <SiconBadge />
        </div>
    );
}

export default App;
