import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import EmergencyPage from './pages/EmergencyPage';
import QRScanPage from './pages/QRScanPage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ContactUs from './pages/ContactUs';
import LegalPage from './pages/LegalPage';
import AboutUs from './pages/AboutUs';
import ViralQR from './pages/ViralQR';
import ScannerPage from './pages/ScannerPage';
import StorePage from './pages/StorePage';
import SiconBadge from './components/SiconBadge';
import { useEffect } from 'react';

// New expansion pages
import HowItWorks from './pages/HowItWorks';
import SolutionsIndividuals from './pages/SolutionsIndividuals';
import SolutionsFamilies from './pages/SolutionsFamilies';
import SolutionsDoctors from './pages/SolutionsDoctors';
import SolutionsHospitals from './pages/SolutionsHospitals';
import SolutionsAmbulances from './pages/SolutionsAmbulances';
import SolutionsFirstResponders from './pages/SolutionsFirstResponders';
import SolutionsEnterprises from './pages/SolutionsEnterprises';
import SolutionsSchools from './pages/SolutionsSchools';
import SolutionsGovernment from './pages/SolutionsGovernment';
import SafetyPrivacy from './pages/SafetyPrivacy';
import Technology from './pages/Technology';
import ProductsPage from './pages/ProductsPage';
import PricingPage from './pages/PricingPage';
import PartnersPage from './pages/PartnersPage';
import StoriesPage from './pages/StoriesPage';
import EmergencyAwareness from './pages/EmergencyAwareness';
import FAQPage from './pages/FAQPage';
import HelpCenter from './pages/HelpCenter';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
}

function App() {
    const location = useLocation();
    const isScanPage = location.pathname.startsWith('/e/') || location.pathname.startsWith('/qr/') || location.pathname.startsWith('/u/') || (location.pathname.length > 1 && !['dashboard', 'create-profile', 'payment', 'success', 'admin', 'login', 'contact', 'legal', 'about', 'free-qr', 'viral-id', 'scanner', 'store', 'how-it-works', 'solutions', 'safety-privacy', 'technology', 'products', 'pricing', 'partners', 'stories', 'emergency-awareness', 'faq', 'help-center'].includes(location.pathname.split('/')[1]));

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-white">
            <ScrollToTop />
            {!isScanPage && <Navbar />}
            <main className={`flex-grow ${isScanPage ? 'pt-0' : ''}`}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/free-qr" element={<ViralQR />} />
                    <Route path="/viral-id" element={<ViralQR />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create-profile" element={<Navigate to="/login" replace />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/success" element={<SuccessPage />} />
                    <Route path="/e/:id" element={<EmergencyPage />} />
                    <Route path="/qr/:profileId" element={<QRScanPage />} />
                    <Route path="/admin" element={<AdminPanel />} />
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
                    <Route path="/technology" element={<Technology />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/partners" element={<PartnersPage />} />
                    <Route path="/stories" element={<StoriesPage />} />
                    <Route path="/emergency-awareness" element={<EmergencyAwareness />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/help-center" element={<HelpCenter />} />
                    <Route path="/:username" element={<QRScanPage />} />
                    <Route path="/scanner" element={<ScannerPage />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            {!isScanPage && <Footer />}
            <SiconBadge />
        </div>
    );
}

export default App;
