import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, User, ShieldCheck, Mail, Lock, Phone, ArrowLeft, ArrowRight, Check,
    Upload, CreditCard, Key, AlertTriangle, Building, FileText, CheckSquare, Plus, Trash2, Camera, Download, HelpCircle, BadgeInfo, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ref, update, set, get } from 'firebase/database';
import DemoRazorpayModal from '../components/common/DemoRazorpayModal';
import QRPreviewModal from '../components/common/QRPreviewModal';
import { extractFeatures } from '../lib/cvHelper';

// Helper Badge Component
function Badge({ children, className = '', ...props }) {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${className}`} {...props}>
            {children}
        </span>
    );
}

// Google Icon Component
function GoogleIcon() {
    return (
        <svg className="w-5 h-5 mr-3 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

export default function LoginPage() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null); // null, 'citizen', 'agent', 'hospital'
    const [authState, setAuthState] = useState('card_select'); // card_select, google_verify, register_wizard, email_login, email_register
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
    const [expandedPortal, setExpandedPortal] = useState('citizen'); // 'citizen' default expanded
    
    // Auth variables
    const [phoneNumber, setPhoneNumber] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [enteredOtp, setEnteredOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    // Citizen Registration Wizard States
    const [citizenStep, setCitizenStep] = useState(1);
    const [citizenProfilePhoto, setCitizenProfilePhoto] = useState('');
    const [citizenName, setCitizenName] = useState('');
    const [citizenEmail, setCitizenEmail] = useState('');
    const [citizenDob, setCitizenDob] = useState('');
    const [citizenGender, setCitizenGender] = useState('');
    const [citizenAddress, setCitizenAddress] = useState({
        houseNo: '', street: '', area: '', city: '', district: '', state: '', pincode: ''
    });
    const [emergencyContacts, setEmergencyContacts] = useState([{ name: '', relationship: '', phone: '' }]);
    const [familyDoctor, setFamilyDoctor] = useState({ name: '', hospital: '', phone: '' });

    // Citizen Medical Details
    const [bloodGroup, setBloodGroup] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [allergies, setAllergies] = useState('');
    const [currentMedication, setCurrentMedication] = useState('');
    const [previousSurgeries, setPreviousSurgeries] = useState('');
    const [isOrganDonor, setIsOrganDonor] = useState(false);
    const [emergencyNotes, setEmergencyNotes] = useState('');
    const [medicalId, setMedicalId] = useState('');

    // Citizen Insurance Details
    const [hasInsurance, setHasInsurance] = useState('yes'); // 'yes' or 'no'
    const [insuranceCompany, setInsuranceCompany] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [policyHolder, setPolicyHolder] = useState('');
    const [policyAgentName, setPolicyAgentName] = useState('');
    const [policyAgentPhone, setPolicyAgentPhone] = useState('');
    const [policyExpiry, setPolicyExpiry] = useState('');
    const [coverageAmount, setCoverageAmount] = useState('');
    const [insuranceCardPhoto, setInsuranceCardPhoto] = useState('');
    const [cashlessFacility, setCashlessFacility] = useState(false);

    // Citizen QR Package
    const [selectedPackage, setSelectedPackage] = useState('digital'); // 'digital' (99), 'stickers' (149)

    // Agent Registration States
    const [agentName, setAgentName] = useState('');
    const [agentEmail, setAgentEmail] = useState('');
    const [agentDob, setAgentDob] = useState('');
    const [agentAadhaar, setAgentAadhaar] = useState('');
    const [agentPan, setAgentPan] = useState('');
    const [agentAadhaarFront, setAgentAadhaarFront] = useState('');
    const [agentAadhaarBack, setAgentAadhaarBack] = useState('');
    const [agentPhoto, setAgentPhoto] = useState('');
    const [agentAddress, setAgentAddress] = useState({
        houseNo: '', street: '', city: '', district: '', state: '', pincode: ''
    });
    const [agentEmergencyContact, setAgentEmergencyContact] = useState('');
    const [agentBank, setAgentBank] = useState({
        accountHolder: '', bankName: '', accountNumber: '', ifscCode: ''
    });
    const [agentAcceptedAgreement, setAgentAcceptedAgreement] = useState(false);

    // Hospital Registration States
    const [hospitalStep, setHospitalStep] = useState(1); // 1: Info, 2: Details, 3: Plans, 4: Payment
    const [hospitalInfo, setHospitalInfo] = useState({
        hospitalName: '', regNo: '', licenseNo: '', nabhAccreditation: '', gstNo: ''
    });
    const [hospitalDetails, setHospitalDetails] = useState({
        beds: '', icuBeds: '', hasEmergency: false, hasTrauma: false
    });
    const [hospitalType, setHospitalType] = useState('private'); // government, private, multi-speciality, clinic
    const [hospitalAddress, setHospitalAddress] = useState({
        city: '', state: '', district: '', pincode: ''
    });
    const [hospitalContact, setHospitalContact] = useState({
        name: '', designation: '', phone: ''
    });
    const [hospitalLicensePhoto, setHospitalLicensePhoto] = useState('');
    const [hospitalRegCertPhoto, setHospitalRegCertPhoto] = useState('');
    const [selectedHospitalPlan, setSelectedHospitalPlan] = useState('medium'); // small, medium, large, enterprise

    const hospitalPlans = {
        small: { name: 'Small Hospital', beds: '20-50 Beds', price: 1999, desc: 'Perfect for local clinics and small hospitals.' },
        medium: { name: 'Medium Hospital', beds: '50-150 Beds', price: 4999, desc: 'Designed for regional healthcare facilities.' },
        large: { name: 'Large Hospital', beds: '150-500 Beds', price: 9999, desc: 'Suitable for multi-speciality hospitals.' },
        enterprise: { name: 'Enterprise Hospital', beds: '500+ Beds', price: 19999, desc: 'Complete integration for tier-1 medical complexes.' }
    };

    // Helper for base64 file convert
    const handleFileChange = (e, setPhoto) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGoogleSignIn = async () => {
        setAuthLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;
            const uid = user.uid;

            // Check if user already registered in RTDB by UID
            const userSnap = await get(ref(db, `users/${uid}`));
            
            if (userSnap.exists()) {
                const userData = userSnap.val();
                if (userData.status === 'pending') {
                    toast.error("Your account is pending admin approval. Please wait for the audit to complete.");
                    await auth.signOut();
                    setAuthLoading(false);
                    return;
                }
                
                const profileSnap = await get(ref(db, `profiles/c_${uid}`));
                if (userData.role === 'agent' || userData.role === 'hospital' || (profileSnap.exists() && userData.profileCompleted)) {
                    toast.success(`Welcome back, ${userData.name || user.displayName || 'User'}! Authentication successful.`);
                    navigate('/dashboard');
                    return;
                }
            }

            // Open Registration Wizard based on chosen role
            if (selectedRole === 'agent') {
                setAgentName(user.displayName || '');
                setAgentEmail(user.email || '');
                setAuthState('register_wizard');
                toast.success("Google authenticated! Please complete your Agent Registration.");
            } else {
                setSelectedRole('citizen');
                setCitizenName(user.displayName || '');
                setCitizenEmail(user.email || '');
                setAuthState('register_wizard');
                setCitizenStep(1);
                toast.success("Google authenticated! Please complete your 4-Step Medical Profile.");
            }
        } catch (error) {
            console.error("Google Auth error:", error);
            toast.error("Google authentication failed: " + error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    // Submit Citizen registration
    const handleCitizenRegistrationSubmit = async () => {
        setAuthLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication context lost.");

            const uid = currentUser.uid;
            const profileId = `c_${uid}`;

            let descriptors = null;
            let scannerType = 'qr';
            if (citizenProfilePhoto) {
                const t = toast.loading("Analyzing Facial Node...");
                try {
                    const features = await extractFeatures(citizenProfilePhoto);
                    descriptors = features.descriptors;
                    scannerType = 'facial';
                    toast.success("Facial Node Mapped", { id: t });
                } catch (e) {
                    console.warn("Facial mapping skipped or failed:", e);
                    toast.dismiss(t);
                }
            }

            const profileData = {
                id: profileId,
                role: 'citizen',
                profilePhoto: citizenProfilePhoto,
                scannerType: scannerType,
                descriptors: descriptors,
                name: citizenName,
                phone: phoneNumber,
                email: citizenEmail,
                dob: citizenDob,
                gender: citizenGender,
                address: citizenAddress,
                emergencyContacts,
                familyDoctor,
                medical: {
                    bloodGroup, height, weight, medicalConditions, allergies,
                    currentMedication, previousSurgeries, isOrganDonor, emergencyNotes, medicalId
                },
                insurance: {
                    hasInsurance,
                    insuranceCompany: hasInsurance === 'yes' ? insuranceCompany : '',
                    policyNumber: hasInsurance === 'yes' ? policyNumber : '',
                    policyHolder: hasInsurance === 'yes' ? policyHolder : '',
                    policyAgentName: hasInsurance === 'yes' ? policyAgentName : '',
                    policyAgentPhone: hasInsurance === 'yes' ? policyAgentPhone : '',
                    policyExpiry: hasInsurance === 'yes' ? policyExpiry : '',
                    coverageAmount: hasInsurance === 'yes' ? coverageAmount : '',
                    insuranceCardPhoto: hasInsurance === 'yes' ? insuranceCardPhoto : '',
                    cashlessFacility: hasInsurance === 'yes' ? cashlessFacility : false
                },
                qrPackage: {
                    type: selectedPackage,
                    price: selectedPackage === 'digital' ? 99 : 149,
                    paymentStatus: 'paid' // Simulated Payment success
                },
                payment_status: 'paid',
                payment_id: "demo_pay_" + Math.random().toString(36).substr(2, 9),
                payment_date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                uid: uid
            };

            // Save to DB
            const updates = {};
            updates[`users/${uid}`] = {
                uid,
                name: citizenName,
                email: citizenEmail || 'anonymous@resqr.co.in',
                phone: phoneNumber,
                role: 'citizen',
                status: 'approved',
                profileCompleted: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                profiles: {
                    [profileId]: profileData
                }
            };
            updates[`profiles/${profileId}`] = profileData;

            await update(ref(db), updates);
            localStorage.setItem('resqr_active_slug', profileId);

            toast.success("Citizen Emergency Profile Generated!");
            navigate('/success');
        } catch (error) {
            console.error("Error creating citizen profile:", error);
            toast.error("Registration synchronization failed: " + error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    // Submit Agent registration
    const handleAgentRegistrationSubmit = async () => {
        if (!agentAcceptedAgreement) {
            toast.error("You must accept the privacy and legal agreement to register.");
            return;
        }

        setAuthLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication context lost.");

            const uid = currentUser.uid;
            const agentId = `AGT-${Math.floor(100000 + Math.random() * 900000)}`;

            const agentProfile = {
                agentId,
                name: agentName,
                email: agentEmail,
                phone: phoneNumber,
                dob: agentDob,
                aadhaarNo: agentAadhaar,
                panNo: agentPan,
                aadhaarFront: agentAadhaarFront,
                aadhaarBack: agentAadhaarBack,
                photo: agentPhoto,
                address: agentAddress,
                emergencyContact: agentEmergencyContact,
                bankDetails: agentBank,
                acceptedAgreement: true,
                commissionEarned: 0,
                pendingCommission: 0,
                totalRegistered: 0
            };

            const userData = {
                uid,
                name: agentName,
                email: agentEmail,
                phone: phoneNumber,
                role: 'agent',
                status: 'pending', // Pending Admin approval
                agentProfile,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            await set(ref(db, `users/${uid}`), userData);
            toast.success("Agent Application Transmitted! Pending Admin Review.");
            await auth.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error("Agent reg error:", error);
            toast.error("Registration failed: " + error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    // Hospital Signup / Login Email
    const handleHospitalEmailSubmit = async (e) => {
        e.preventDefault();
        setAuthLoading(true);

        try {
            if (authState === 'email_register') {
                if (password !== confirmPassword) {
                    toast.error("Passwords do not match.");
                    setAuthLoading(false);
                    return;
                }
                // Register in Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Move to Hospital Registration steps
                toast.success("Hospital account credentials created! Complete institutional registration.");
                setSelectedRole('hospital');
                setAuthState('register_wizard');
                setHospitalStep(1);
            } else {
                // Sign in
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const uid = userCredential.user.uid;

                // Check RTDB
                const userSnap = await get(ref(db, `users/${uid}`));
                if (userSnap.exists()) {
                    const userData = userSnap.val();
                    if (userData.status === 'pending') {
                        toast.error("Your account is pending admin approval. Please wait for the audit to complete.");
                        await auth.signOut();
                        setAuthLoading(false);
                        return;
                    }
                    toast.success(`Welcome back, ${userData.name || 'Hospital'}!`);
                    navigate('/dashboard');
                    return;
                }
                
                // Check if existing user by email in all users
                const allUsersSnap = await get(ref(db, 'users'));
                if (allUsersSnap.exists()) {
                    const allUsers = allUsersSnap.val();
                    const matchedHospital = Object.values(allUsers).find(u => u.email === email);
                    if (matchedHospital) {
                        toast.success(`Welcome back, ${matchedHospital.name || 'Hospital'}!`);
                        navigate('/dashboard');
                        return;
                    }
                }

                // If signed in via Auth but no RTDB record yet, proceed to complete hospital wizard
                toast.success("Authenticated! Complete your hospital profile.");
                setSelectedRole('hospital');
                setAuthState('register_wizard');
                setHospitalStep(1);
            }
        } catch (error) {
            console.error("Hospital email auth error:", error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                toast.error("Hospital account not found. Click 'Register Hospital' below to create a new account.");
            } else {
                toast.error(error.message || "Email authentication failed.");
            }
        } finally {
            setAuthLoading(false);
        }
    };

    // Submit Hospital registration
    const handleHospitalRegistrationSubmit = async () => {
        setAuthLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication context lost.");

            const uid = currentUser.uid;
            const planDetails = hospitalPlans[selectedHospitalPlan];

            const hospitalProfile = {
                hospitalName: hospitalInfo.hospitalName,
                regNo: hospitalInfo.regNo,
                licenseNo: hospitalInfo.licenseNo,
                nabhAccreditation: hospitalInfo.nabhAccreditation,
                gstNo: hospitalInfo.gstNo,
                beds: parseInt(hospitalDetails.beds) || 0,
                icuBeds: parseInt(hospitalDetails.icuBeds) || 0,
                hasEmergency: hospitalDetails.hasEmergency,
                hasTrauma: hospitalDetails.hasTrauma,
                type: hospitalType,
                address: hospitalAddress,
                contact: hospitalContact,
                licensePhoto: hospitalLicensePhoto,
                regCertificate: hospitalRegCertPhoto,
                plan: {
                    name: planDetails.name,
                    price: planDetails.price,
                    status: 'paid'
                },
                payment_status: 'paid'
            };

            const userData = {
                uid,
                name: hospitalInfo.hospitalName,
                email: email || currentUser.email,
                role: 'hospital',
                status: 'pending', // Pending Admin approval
                hospitalProfile,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            await set(ref(db, `users/${uid}`), userData);
            toast.success("Hospital profile created! Waiting for Admin verification.");
            await auth.signOut();
            window.location.href = '/';
        } catch (error) {
            console.error("Hospital reg error:", error);
            toast.error("Profile synchronization failed: " + error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleDemoLogin = async (role) => {
        setAuthLoading(true);
        try {
            let currentUser = auth.currentUser;
            if (!currentUser) {
                try {
                    const userCredential = await signInAnonymously(auth);
                    currentUser = userCredential.user;
                } catch (anonErr) {
                    console.warn("Anonymous auth restricted in console, switching to demo auth handshake...", anonErr);
                    const demoEmail = `demo.${role || 'user'}@resqr.co.in`;
                    const demoPass = "ResQR#DemoPass2026";
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
                        currentUser = userCredential.user;
                    } catch (loginErr) {
                        const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
                        currentUser = userCredential.user;
                    }
                }
            }
            const uid = currentUser.uid;

            if (role === 'citizen') {
                const userData = {
                    uid,
                    name: "Alex Morgan (Demo Citizen)",
                    email: "citizen.demo@resqr.co.in",
                    phone: "9876543210",
                    role: "citizen",
                    status: "approved",
                    paymentStatus: "paid",
                    qrCodeId: `c_${uid}`,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };

                const profileData = {
                    name: "Alex Morgan",
                    dob: "1994-08-15",
                    gender: "Male",
                    phone: "9876543210",
                    email: "citizen.demo@resqr.co.in",
                    profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
                    bloodGroup: "O+",
                    height: "178",
                    weight: "72",
                    allergies: "Penicillin, Peanuts",
                    currentMedication: "Insulin 10IU Daily",
                    medicalConditions: "Type-1 Diabetes",
                    surgeries: "Appendectomy (2018)",
                    emergencyNotes: "Diabetic patient. Carry glucose tabs in wallet.",
                    emergencyContacts: [
                        { name: "Sarah Morgan", relationship: "Spouse", phone: "9876543211" },
                        { name: "David Morgan", relationship: "Brother", phone: "9876543212" }
                    ],
                    insurance: {
                        insuranceCompany: "Star Health Allied Insurance",
                        policyNumber: "POL-882910492",
                        cashlessFacility: true
                    }
                };

                await set(ref(db, `users/${uid}`), userData);
                await set(ref(db, `profiles/c_${uid}`), profileData);
                await set(ref(db, `users/${uid}/profiles/c_${uid}`), profileData);
                toast.success("⚡ Demo Citizen Authenticated!");
                navigate('/dashboard');

            } else if (role === 'agent') {
                const userData = {
                    uid,
                    name: "Rajesh Kumar (Demo Agent)",
                    email: "agent.demo@resqr.co.in",
                    phone: "9876543220",
                    role: "agent",
                    status: "approved",
                    agentProfile: {
                        name: "Rajesh Kumar",
                        agentId: "AGT-998822",
                        phone: "9876543220",
                        city: "Mumbai",
                        state: "Maharashtra",
                        bankName: "HDFC Bank",
                        accountNo: "50100293847162"
                    },
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };

                await set(ref(db, `users/${uid}`), userData);
                toast.success("⚡ Demo Agent Portal Opened!");
                navigate('/dashboard');

            } else if (role === 'hospital') {
                const userData = {
                    uid,
                    name: "Apollo Emergency Care (Demo Hospital)",
                    email: "hospital.demo@resqr.co.in",
                    phone: "9876543230",
                    role: "hospital",
                    status: "approved",
                    hospitalProfile: {
                        hospitalName: "Apollo Emergency Care Center",
                        regNo: "HOSP-MH-2024-883",
                        beds: 45,
                        icuBeds: 12,
                        traumaUnit: true,
                        city: "Mumbai",
                        contactPerson: "Dr. K. V. Sharma",
                        plan: { name: "Enterprise Port" }
                    },
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };

                await set(ref(db, `users/${uid}`), userData);
                toast.success("⚡ Demo Hospital Command Center Activated!");
                navigate('/dashboard');

            } else if (role === 'admin') {
                const userData = {
                    uid,
                    name: "System Administrator (Demo Admin)",
                    email: "pratheekmadupu2006@gmail.com",
                    role: "admin",
                    status: "approved",
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };

                await set(ref(db, `users/${uid}`), userData);
                localStorage.setItem('resqr_active_role', 'admin');
                toast.success("⚡ Demo Admin Console Opened!");
                navigate('/admin');
            }
        } catch (error) {
            console.error("Demo login error:", error);
            toast.error("Demo login failed: " + error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-medical-bg flex items-center justify-center p-6 font-manrope selection:bg-primary/30">
            <div className="w-full max-w-5xl py-12">
                {/* Header branding */}
                <div className="text-center mb-12">
                    <Link to="/" className="inline-block relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR Logo" className="relative h-16 w-auto" />
                    </Link>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.25em] text-[10px] italic mt-4">
                        Secure Enterprise-Grade Safety Network
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {/* Role Card Selector */}
                    {authState === 'card_select' && (
                        <motion.div 
                            key="card_select"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-3">
                                <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none font-poppins">
                                    LOGIN TO <span className="text-primary italic-display">RESQR</span>
                                </h1>
                                <p className="text-slate-400 max-w-md mx-auto text-xs font-black uppercase tracking-[0.2em]">
                                    Select your system portal to continue
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Card 1: Citizen */}
                                <Card 
                                    onClick={() => setExpandedPortal(expandedPortal === 'citizen' ? null : 'citizen')}
                                    className="p-8 md:p-10 bg-slate-900/40 border-white/5 hover:border-primary/30 hover:shadow-[0_15px_40px_rgba(230,57,70,0.12)] transition-all duration-300 rounded-[35px] cursor-pointer backdrop-blur-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        {/* Left part: Icon & Role */}
                                        <div className="flex items-center gap-6 md:w-1/4 shrink-0">
                                            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/10 group-hover:scale-105 transition-transform">
                                                <User size={30} />
                                            </div>
                                            <div>
                                                <span className="inline-block text-[9px] font-black tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full italic mb-2">
                                                    CITIZEN CORE
                                                </span>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                                    Users Portal
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Center part: Detailed Info */}
                                        <div className="flex-1 space-y-4">
                                            <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-xl">
                                                Create, secure, and manage your Emergency Medical Identity. Link next-of-kin, medical history, and insurance records to physical smart stickers.
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Wallet QR Pass
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Sticker Mapping
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Encrypted Cloud
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right part: Action / Chevron */}
                                        <div className="shrink-0 flex items-center gap-3 text-slate-500 group-hover:text-white transition-colors">
                                            <span className="text-[9px] font-bold uppercase tracking-wider hidden md:inline">
                                                {expandedPortal === 'citizen' ? 'Collapse Specs' : 'View Portal Specs'}
                                            </span>
                                            {expandedPortal === 'citizen' ? <ChevronUp size={18} /> : <ChevronDown size={18} className="transform group-hover:translate-y-0.5 transition-transform" />}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence initial={false}>
                                        {expandedPortal === 'citizen' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden mt-6 pt-6 border-t border-white/5 space-y-6"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-primary uppercase tracking-wider">01 / Dynamic Health Profile</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Input allergies, blood type, surgical history, and emergency contacts. Modify your safety parameters in real time.
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-primary uppercase tracking-wider">02 / Medical Sticker Sync</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Map your digital safety QR pass to premium physical stickers. Apply to helmets, gear, or carry as a wallet card.
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-primary uppercase tracking-wider">03 / Granular Privacy Locks</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Choose what bystanders see (e.g., emergency contact only) versus verified medical response personnel.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                                                    <div className="text-left">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">SECURE REGISTRATION</span>
                                                        <p className="text-[11px] text-slate-400">Verifying via secure Google Authentication protocol</p>
                                                    </div>
                                                    <Button 
                                                        onClick={() => { setSelectedRole('citizen'); setAuthState('google_verify'); }}
                                                        className="w-full sm:w-auto px-8 py-4.5 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                                                    >
                                                        Login / Register
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>

                                {/* Card 2: Agent */}
                                <Card 
                                    onClick={() => setExpandedPortal(expandedPortal === 'agent' ? null : 'agent')}
                                    className="p-8 md:p-10 bg-slate-900/40 border-white/5 hover:border-blue-500/30 hover:shadow-[0_15px_40px_rgba(59,130,246,0.12)] transition-all duration-300 rounded-[35px] cursor-pointer backdrop-blur-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        {/* Left part: Icon & Role */}
                                        <div className="flex items-center gap-6 md:w-1/4 shrink-0">
                                            <div className="w-16 h-16 bg-blue-500/5 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/10 group-hover:scale-105 transition-transform">
                                                <ShieldCheck size={30} />
                                            </div>
                                            <div>
                                                <span className="inline-block text-[9px] font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full italic mb-2">
                                                    PARTNER FIELD
                                                </span>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                                    Agent Portal
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Center part: Detailed Info */}
                                        <div className="flex-1 space-y-4">
                                            <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-xl">
                                                Authorized RESQR Sales, Distribution, & Support Channel Partner console. Review registration pipelines and track community onboardings.
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Sales Telemetry
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Onboarding Audits
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> CSV Deployment
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right part: Action / Chevron */}
                                        <div className="shrink-0 flex items-center gap-3 text-slate-500 group-hover:text-white transition-colors">
                                            <span className="text-[9px] font-bold uppercase tracking-wider hidden md:inline">
                                                {expandedPortal === 'agent' ? 'Collapse Specs' : 'View Portal Specs'}
                                            </span>
                                            {expandedPortal === 'agent' ? <ChevronUp size={18} /> : <ChevronDown size={18} className="transform group-hover:translate-y-0.5 transition-transform" />}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence initial={false}>
                                        {expandedPortal === 'agent' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden mt-6 pt-6 border-t border-white/5 space-y-6"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">01 / Onboarding Telemetry</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Track your local citizen registrations, distribution statistics, and commission pipeline from a unified dashboard.
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">02 / Physical Sticker Kits</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Distribute, map, and scan safety codes on the field. Act as a verified agent for citizen account creations.
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">03 / Institutional Audits</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Perform direct validation checks for community partners, ensuring absolute accuracy of emergency medical databases.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                                                    <div className="text-left">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">AGENT AUTHENTICATION</span>
                                                        <p className="text-[11px] text-slate-400">Restricted to authorized channel partners</p>
                                                    </div>
                                                    <Button 
                                                        onClick={() => { setSelectedRole('agent'); setAuthState('google_verify'); }}
                                                        className="w-full sm:w-auto px-8 py-4.5 bg-slate-950 border border-white/5 hover:border-blue-500/20 hover:bg-blue-500/5 text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px]"
                                                    >
                                                        Agent Login
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>

                                {/* Card 3: Hospital */}
                                <Card 
                                    onClick={() => setExpandedPortal(expandedPortal === 'hospital' ? null : 'hospital')}
                                    className="p-8 md:p-10 bg-slate-900/40 border-white/5 hover:border-emerald-500/30 hover:shadow-[0_15px_40px_rgba(16,185,129,0.12)] transition-all duration-300 rounded-[35px] cursor-pointer backdrop-blur-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        {/* Left part: Icon & Role */}
                                        <div className="flex items-center gap-6 md:w-1/4 shrink-0">
                                            <div className="w-16 h-16 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform">
                                                <Building size={30} />
                                            </div>
                                            <div>
                                                <span className="inline-block text-[9px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full italic mb-2">
                                                    CLINICAL NODE
                                                </span>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                                    Hospital Hub
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Center part: Detailed Info */}
                                        <div className="flex-1 space-y-4">
                                            <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-xl">
                                                Verified Trauma, ER admissions, & Hospital Emergency Response integration terminal. Instant verified access to incoming patient telemetry.
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Paramedic Sync
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Trauma Unit Active
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Compliance Logs
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right part: Action / Chevron */}
                                        <div className="shrink-0 flex items-center gap-3 text-slate-500 group-hover:text-white transition-colors">
                                            <span className="text-[9px] font-bold uppercase tracking-wider hidden md:inline">
                                                {expandedPortal === 'hospital' ? 'Collapse Specs' : 'View Portal Specs'}
                                            </span>
                                            {expandedPortal === 'hospital' ? <ChevronUp size={18} /> : <ChevronDown size={18} className="transform group-hover:translate-y-0.5 transition-transform" />}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence initial={false}>
                                        {expandedPortal === 'hospital' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden mt-6 pt-6 border-t border-white/5 space-y-6"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">01 / Intake Stream Feed</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Receive instant telemetry updates of incoming patients before they arrive. Prepare triage units and ICU beds in advance.
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">02 / EHR Sync</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Secure, HIPAA-compliant access to emergency contact details, blood groups, allergies, and pre-existing conditions.
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                                                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">03 / Compliance Logs</h4>
                                                        <p className="text-slate-500 text-[11px] leading-relaxed">
                                                            Manage ambulance integrations, trace field scans, and monitor security access logs across multiple wards.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                                                    <div className="text-left">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">CLINICAL HUB LOGIN</span>
                                                        <p className="text-[11px] text-slate-400">Requires verified trauma center authorization credentials</p>
                                                    </div>
                                                    <Button 
                                                        onClick={() => { setSelectedRole('hospital'); setAuthState('email_login'); }}
                                                        className="w-full sm:w-auto px-8 py-4.5 bg-slate-950 border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px]"
                                                    >
                                                        Hospital Login
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* Google verification flow (Citizen / Agent) */}
                    {authState === 'google_verify' && (
                        <motion.div 
                            key="google_verify"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            className="max-w-md mx-auto"
                        >
                            <Card className="p-10 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden">
                                <button onClick={() => setAuthState('card_select')} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest italic">
                                    <ArrowLeft size={14} /> Back
                                </button>
                                <div className="space-y-4 mb-8">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">
                                        {selectedRole === 'citizen' ? 'Citizen' : 'Agent'} Login
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">
                                        Secure Google Authentication Sequence
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                        Authenticate using your official Google Account to access the RESQR platform.
                                    </p>

                                    <Button 
                                        onClick={handleGoogleSignIn}
                                        disabled={authLoading}
                                        className="w-full py-7 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl flex items-center justify-center border border-slate-200"
                                    >
                                        {authLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Connecting Securely...
                                            </>
                                        ) : (
                                            <>
                                                <GoogleIcon />
                                                Continue with Google
                                            </>
                                        )}
                                    </Button>

                                    <div className="pt-4 border-t border-white/5 text-center">
                                        <button 
                                            type="button" 
                                            onClick={() => handleDemoLogin(selectedRole || 'citizen')}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline italic"
                                        >
                                            ⚡ Skip Verification & Launch Demo {selectedRole === 'agent' ? 'Agent' : 'Citizen'} Portal
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Citizen Registration Wizard */}
                    {authState === 'register_wizard' && selectedRole === 'citizen' && (
                        <motion.div 
                            key="citizen_wizard"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card className="p-10 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden">
                                {/* Wizard Steps Header */}
                                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                                    <div>
                                        <Badge className="bg-primary/20 text-primary border-none px-4 py-1 font-black italic tracking-widest text-[9px] mb-2">CITIZEN IDENTITY PROTOCOL</Badge>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">
                                            Step {citizenStep} of 4: {
                                                citizenStep === 1 ? 'Personal Details' :
                                                citizenStep === 2 ? 'Medical Passport' :
                                                citizenStep === 3 ? 'Insurance Cover' : 'Pricing & Tags'
                                            }
                                        </h2>
                                    </div>
                                    <span className="text-xl font-black italic text-primary font-poppins">{citizenStep * 25}% Completed</span>
                                </div>

                                {/* Step 1: Personal Details */}
                                {citizenStep === 1 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex flex-col md:flex-row gap-8 items-center border-b border-white/5 pb-8 mb-6">
                                            <div className="relative group">
                                                {citizenProfilePhoto ? (
                                                    <img src={citizenProfilePhoto} alt="Citizen Preview" className="w-28 h-28 object-cover rounded-3xl border-2 border-primary shadow-lg" />
                                                ) : (
                                                    <div className="w-28 h-28 bg-slate-950 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500 group-hover:border-primary/50 transition-colors">
                                                        <Camera size={24} />
                                                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Photo</span>
                                                    </div>
                                                )}
                                                <label className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary-dark p-2 rounded-xl text-white cursor-pointer shadow-lg">
                                                    <Upload size={14} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setCitizenProfilePhoto)} />
                                                </label>
                                            </div>
                                            <div className="flex-1 w-full space-y-4">
                                                <Input label="Full Name" placeholder="e.g. John Doe" value={citizenName} onChange={(e) => setCitizenName(e.target.value)} required />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input 
                                                        label="Mobile Number" 
                                                        placeholder="e.g. 9876543210" 
                                                        value={phoneNumber} 
                                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                                                        required 
                                                    />
                                                    <Input label="Email (Optional)" type="email" placeholder="name@email.com" value={citizenEmail} onChange={(e) => setCitizenEmail(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Date of Birth" type="date" value={citizenDob} onChange={(e) => setCitizenDob(e.target.value)} required />
                                            <Select 
                                                label="Gender" 
                                                value={citizenGender} 
                                                onChange={(e) => setCitizenGender(e.target.value)} 
                                                options={[
                                                    { label: 'Select Gender', value: '' },
                                                    { label: 'Male', value: 'male' },
                                                    { label: 'Female', value: 'female' },
                                                    { label: 'Other', value: 'other' }
                                                ]} 
                                            />
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Address Details</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <Input label="House No." placeholder="123" value={citizenAddress.houseNo} onChange={(e) => setCitizenAddress({...citizenAddress, houseNo: e.target.value})} />
                                                <Input label="Street" placeholder="Main Rd" value={citizenAddress.street} onChange={(e) => setCitizenAddress({...citizenAddress, street: e.target.value})} />
                                                <Input label="Area" placeholder="Suburbs" value={citizenAddress.area} onChange={(e) => setCitizenAddress({...citizenAddress, area: e.target.value})} />
                                                <Input label="City" placeholder="City" value={citizenAddress.city} onChange={(e) => setCitizenAddress({...citizenAddress, city: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input label="District" value={citizenAddress.district} onChange={(e) => setCitizenAddress({...citizenAddress, district: e.target.value})} />
                                                <Input label="State" value={citizenAddress.state} onChange={(e) => setCitizenAddress({...citizenAddress, state: e.target.value})} />
                                                <Input label="Pincode" maxLength="6" value={citizenAddress.pincode} onChange={(e) => setCitizenAddress({...citizenAddress, pincode: e.target.value.replace(/\D/g, '')})} />
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Emergency Family Members</h3>
                                                <Button onClick={() => setEmergencyContacts([...emergencyContacts, { name: '', relationship: '', phone: '' }])} variant="outline" className="py-2 px-3 text-[9px] rounded-lg border-white/10 hover:border-primary">
                                                    <Plus size={12} className="mr-1" /> Add Contact
                                                </Button>
                                            </div>
                                            {emergencyContacts.map((contact, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-950/40 p-4 rounded-2xl border border-white/5 relative">
                                                    <Input label="Contact Name" value={contact.name} onChange={(e) => {
                                                        const updated = [...emergencyContacts];
                                                        updated[index].name = e.target.value;
                                                        setEmergencyContacts(updated);
                                                    }} />
                                                    <Input label="Relationship" placeholder="e.g. Spouse" value={contact.relationship} onChange={(e) => {
                                                        const updated = [...emergencyContacts];
                                                        updated[index].relationship = e.target.value;
                                                        setEmergencyContacts(updated);
                                                    }} />
                                                    <div className="flex gap-2 items-center">
                                                        <Input label="Phone Number" maxLength="10" value={contact.phone} onChange={(e) => {
                                                            const updated = [...emergencyContacts];
                                                            updated[index].phone = e.target.value.replace(/\D/g, '');
                                                            setEmergencyContacts(updated);
                                                        }} />
                                                        {emergencyContacts.length > 1 && (
                                                            <button onClick={() => setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index))} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl mt-6">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic font-poppins">Family Doctor (Optional)</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input label="Doctor Name" placeholder="Dr. Smith" value={familyDoctor.name} onChange={(e) => setFamilyDoctor({...familyDoctor, name: e.target.value})} />
                                                <Input label="Hospital Name" placeholder="City General" value={familyDoctor.hospital} onChange={(e) => setFamilyDoctor({...familyDoctor, hospital: e.target.value})} />
                                                <Input label="Doctor Phone" maxLength="10" value={familyDoctor.phone} onChange={(e) => setFamilyDoctor({...familyDoctor, phone: e.target.value.replace(/\D/g, '')})} />
                                            </div>
                                        </div>

                                        <div className="pt-8 flex justify-end">
                                            <Button onClick={() => {
                                                if (!citizenName || !citizenDob || !citizenGender || !citizenAddress.city || !citizenAddress.pincode) {
                                                    toast.error("Please fill all mandatory personal & address details.");
                                                    return;
                                                }
                                                setCitizenStep(2);
                                            }} className="py-4 px-8 bg-primary rounded-2xl font-black italic uppercase text-xs">
                                                Continue to Medical details <ArrowRight size={16} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Medical Details */}
                                {citizenStep === 2 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Select 
                                                label="Blood Group" 
                                                value={bloodGroup} 
                                                onChange={(e) => setBloodGroup(e.target.value)} 
                                                options={[
                                                    { label: 'Select Group', value: '' },
                                                    { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
                                                    { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
                                                    { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
                                                    { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
                                                ]} 
                                            />
                                            <Input label="Height (cm)" type="number" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} />
                                            <Input label="Weight (kg)" type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
                                        </div>

                                        <Input label="Medical Conditions / Chronic Diseases" placeholder="e.g. Diabetes, Asthma, None" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} />
                                        <Input label="Allergies (Critical)" placeholder="e.g. Penicillin, Peanuts, Latex" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                                        <Input label="Current Medications" placeholder="e.g. Insulin 10ml, Metformin" value={currentMedication} onChange={(e) => setCurrentMedication(e.target.value)} />
                                        <Input label="Previous Surgeries" placeholder="e.g. Appendectomy (2020)" value={previousSurgeries} onChange={(e) => setPreviousSurgeries(e.target.value)} />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Medical ID Number (Optional)" placeholder="Gov Health ID" value={medicalId} onChange={(e) => setMedicalId(e.target.value)} />
                                            <div className="flex items-center gap-4 border border-white/5 bg-slate-950/40 px-6 py-5 rounded-2xl mt-6">
                                                <input 
                                                    type="checkbox" 
                                                    id="organDonor" 
                                                    checked={isOrganDonor} 
                                                    onChange={(e) => setIsOrganDonor(e.target.checked)} 
                                                    className="w-5 h-5 rounded accent-primary bg-slate-900 border-white/10" 
                                                />
                                                <label htmlFor="organDonor" className="text-xs font-black uppercase tracking-widest text-slate-300 cursor-pointer">Organ Donor Consent</label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Critical Emergency Notes</label>
                                            <textarea 
                                                value={emergencyNotes} 
                                                onChange={(e) => setEmergencyNotes(e.target.value)} 
                                                placeholder="Any crucial instruction for first responders (e.g. Heart patient, Pacemaker installed)" 
                                                className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-semibold outline-none transition-all focus:border-primary placeholder:text-slate-700 h-28"
                                            />
                                        </div>

                                        <div className="pt-8 flex justify-between">
                                            <Button onClick={() => setCitizenStep(1)} variant="outline" className="py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
                                                <ArrowLeft size={16} className="mr-2" /> Back
                                            </Button>
                                            <Button onClick={() => {
                                                if (!bloodGroup) {
                                                    toast.error("Please specify your blood group.");
                                                    return;
                                                }
                                                setCitizenStep(3);
                                            }} className="py-4 px-8 bg-primary rounded-2xl font-black italic uppercase text-xs">
                                                Continue to Insurance <ArrowRight size={16} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Insurance Details */}
                                {citizenStep === 3 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        {/* Yes / No Toggle for Insurance */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic block ml-1">Do you have Health Insurance?</label>
                                            <div className="flex gap-4">
                                                <button 
                                                    type="button"
                                                    onClick={() => setHasInsurance('yes')}
                                                    className={`flex-1 py-4 rounded-2xl font-black italic uppercase tracking-widest text-xs transition-all border ${hasInsurance === 'yes' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-950/60 border-white/5 text-slate-500 hover:text-white'}`}
                                                >
                                                    Yes
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setHasInsurance('no');
                                                        // Reset insurance values if No is chosen
                                                        setInsuranceCompany('');
                                                        setPolicyNumber('');
                                                        setPolicyHolder('');
                                                        setPolicyAgentName('');
                                                        setPolicyAgentPhone('');
                                                        setPolicyExpiry('');
                                                        setCoverageAmount('');
                                                        setInsuranceCardPhoto('');
                                                        setCashlessFacility(false);
                                                    }}
                                                    className={`flex-1 py-4 rounded-2xl font-black italic uppercase tracking-widest text-xs transition-all border ${hasInsurance === 'no' ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-950/60 border-white/5 text-slate-500 hover:text-white'}`}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>

                                        {hasInsurance === 'yes' ? (
                                            <div className="space-y-6 animate-in fade-in duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Select 
                                                        label="Insurance Company" 
                                                        value={insuranceCompany} 
                                                        onChange={(e) => setInsuranceCompany(e.target.value)} 
                                                        options={[
                                                            { label: 'Select Insurance Company', value: '' },
                                                            { label: 'Star Health', value: 'Star Health' },
                                                            { label: 'Care Health', value: 'Care Health' },
                                                            { label: 'Niva Bupa', value: 'Niva Bupa' },
                                                            { label: 'ICICI Lombard', value: 'ICICI Lombard' },
                                                            { label: 'HDFC ERGO', value: 'HDFC ERGO' },
                                                            { label: 'SBI Health', value: 'SBI Health' },
                                                            { label: 'ACKO Insurance', value: 'ACKO' },
                                                            { label: 'Aditya Birla Health', value: 'Aditya Birla' },
                                                            { label: 'ManipalCigna', value: 'ManipalCigna' },
                                                            { label: 'Others', value: 'Others' }
                                                        ]} 
                                                    />
                                                    <Input label="Policy ID / Number" placeholder="POL-123456" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Input label="Policy Holder Name" placeholder="John Doe" value={policyHolder} onChange={(e) => setPolicyHolder(e.target.value)} />
                                                    <Input label="Policy Expiry Date" type="date" value={policyExpiry} onChange={(e) => setPolicyExpiry(e.target.value)} />
                                                    <Input label="Coverage Limit (₹)" placeholder="5,000,000" type="number" value={coverageAmount} onChange={(e) => setCoverageAmount(e.target.value)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input label="Insurance Agent / Coordinator Name" placeholder="Agent Name" value={policyAgentName} onChange={(e) => setPolicyAgentName(e.target.value)} />
                                                    <Input label="Agent Contact Phone" maxLength="10" placeholder="9876543210" value={policyAgentPhone} onChange={(e) => setPolicyAgentPhone(e.target.value.replace(/\D/g, ''))} />
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-6 items-center bg-slate-950/40 p-6 rounded-2xl border border-white/5">
                                                    <div className="flex-1 w-full space-y-4">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic block ml-1">Upload Health Insurance Card</label>
                                                        <div className="flex gap-4 items-center">
                                                            <label className="py-4 px-6 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl cursor-pointer text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                                                                <Upload size={14} /> Browse Card Image
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setInsuranceCardPhoto)} />
                                                            </label>
                                                            {insuranceCardPhoto && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Check size={14} /> Uploaded</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 border border-white/5 bg-slate-950 px-6 py-5 rounded-2xl min-w-[200px]">
                                                        <input 
                                                            type="checkbox" 
                                                            id="cashless" 
                                                            checked={cashlessFacility} 
                                                            onChange={(e) => setCashlessFacility(e.target.checked)} 
                                                            className="w-5 h-5 rounded accent-primary bg-slate-900 border-white/10" 
                                                        />
                                                        <label htmlFor="cashless" className="text-xs font-black uppercase tracking-widest text-slate-300 cursor-pointer">Cashless Facility Active</label>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5 text-center space-y-3 animate-in fade-in duration-300">
                                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic">No Insurance Linked</p>
                                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed max-w-sm mx-auto">
                                                    First responders and hospitals will rely purely on your clinical profile and emergency contacts. You can update this anytime.
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-8 flex justify-between">
                                            <Button onClick={() => setCitizenStep(2)} variant="outline" className="py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
                                                <ArrowLeft size={16} className="mr-2" /> Back
                                            </Button>
                                            <Button onClick={() => setCitizenStep(4)} className="py-4 px-8 bg-primary rounded-2xl font-black italic uppercase text-xs">
                                                Choose Tag Package <ArrowRight size={16} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Package & Razorpay Payment */}
                                {citizenStep === 4 && (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Digital QR */}
                                            <div 
                                                onClick={() => setSelectedPackage('digital')}
                                                className={`p-6 bg-slate-950 border rounded-3xl text-left cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden ${selectedPackage === 'digital' ? 'border-primary shadow-2xl' : 'border-white/5'}`}
                                            >
                                                <Badge className="bg-primary/20 text-primary border-none mb-4 font-black italic text-[8px] tracking-widest">BEST VALUE</Badge>
                                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1 font-poppins">Digital QR Code</h3>
                                                <p className="text-slate-500 text-xs leading-relaxed mb-6 font-bold">Lifetime access to your secure medical vault from any mobile web scanner.</p>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">One-Time Fee</span>
                                                    <span className="text-2xl font-black italic text-white font-poppins">₹99</span>
                                                </div>
                                            </div>

                                            {/* Digital QR + Stickers */}
                                            <div 
                                                onClick={() => setSelectedPackage('stickers')}
                                                className={`p-6 bg-slate-950 border rounded-3xl text-left cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden ${selectedPackage === 'stickers' ? 'border-primary shadow-2xl' : 'border-white/5'}`}
                                            >
                                                <Badge className="bg-primary/20 text-primary border-none mb-4 font-black italic text-[8px] tracking-widest">POPULAR CHOICE</Badge>
                                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1 font-poppins">Digital QR + 2 Stickers</h3>
                                                <p className="text-slate-500 text-xs leading-relaxed mb-6 font-bold">Digital QR code plus 2 physical reflective emergency stickers delivered to your door.</p>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">One-Time Fee</span>
                                                    <span className="text-2xl font-black italic text-white font-poppins">₹149</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 italic">Coming Soon Products</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40">
                                                {['QR Keychain', 'QR Bracelet', 'QR Ring', 'QR Band'].map((item) => (
                                                    <div key={item} className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                                                        <span className="text-[9px] font-black uppercase tracking-widest block mb-1 text-slate-400">{item}</span>
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] italic">Coming Soon</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Checkout info */}
                                        <div className="p-6 bg-slate-950/60 rounded-3xl border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                                <span>Subtotal</span>
                                                <span>₹{selectedPackage === 'digital' ? '83.90' : '126.27'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                                <span>GST (18%)</span>
                                                <span>₹{selectedPackage === 'digital' ? '15.10' : '22.73'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-base font-black uppercase tracking-widest text-primary border-t border-white/5 pt-4">
                                                <span>Total Amount</span>
                                                <span>₹{selectedPackage === 'digital' ? '99.00' : '149.00'}</span>
                                            </div>
                                                   <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <Button onClick={() => setCitizenStep(3)} variant="outline" className="w-full sm:w-auto py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
                                                <ArrowLeft size={16} className="mr-2" /> Back
                                            </Button>

                                            <Button 
                                                type="button"
                                                onClick={() => setIsQrPreviewOpen(true)}
                                                variant="outline" 
                                                className="w-full sm:w-auto py-4 px-6 rounded-2xl font-black italic uppercase text-xs border-primary/40 text-primary hover:bg-primary/10 flex items-center justify-center gap-2"
                                            >
                                                <Eye size={16} /> Preview QR Code
                                            </Button>

                                            <Button 
                                                onClick={() => setIsRazorpayOpen(true)}
                                                disabled={authLoading}
                                                className="w-full sm:flex-1 py-7 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                            >
                                                {authLoading ? 'Transacting Secure Checkout...' : 'Secure Pay via Razorpay'}
                                            </Button>
                                        </div>                                </div>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}

                    {/* Agent Registration Wizard */}
                    {authState === 'register_wizard' && selectedRole === 'agent' && (
                        <motion.div 
                            key="agent_wizard"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card className="p-10 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden">
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                                    <div>
                                        <Badge className="bg-primary/20 text-primary border-none px-4 py-1 font-black italic tracking-widest text-[9px] mb-2">AGENT ONBOARDING PROTOCOL</Badge>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">Agent Registration Details</h2>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Personal Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Personal Information</h3>
                                        <div className="flex flex-col md:flex-row gap-6 items-center pb-4 border-b border-white/5">
                                            <div className="relative group">
                                                {agentPhoto ? (
                                                    <img src={agentPhoto} alt="Agent Preview" className="w-24 h-24 object-cover rounded-2xl border-2 border-primary" />
                                                ) : (
                                                    <div className="w-24 h-24 bg-slate-950 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                                                        <Camera size={20} />
                                                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Passport Photo</span>
                                                    </div>
                                                )}
                                                <label className="absolute -bottom-1 -right-1 bg-primary p-2 rounded-xl text-white cursor-pointer shadow-lg">
                                                    <Upload size={12} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setAgentPhoto)} />
                                                </label>
                                            </div>
                                            <div className="flex-1 w-full space-y-4">
                                                <Input label="Full Name" placeholder="Agent Name" value={agentName} onChange={(e) => setAgentName(e.target.value)} required />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input 
                                                        label="Mobile Number" 
                                                        placeholder="e.g. 9876543210" 
                                                        value={phoneNumber} 
                                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                                                        required 
                                                    />
                                                    <Input label="Email Address" type="email" placeholder="name@resqr.com" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} required />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Date of Birth" type="date" value={agentDob} onChange={(e) => setAgentDob(e.target.value)} required />
                                            <Input label="Emergency Contact Phone" maxLength="10" placeholder="Guardian Phone" value={agentEmergencyContact} onChange={(e) => setAgentEmergencyContact(e.target.value.replace(/\D/g, ''))} required />
                                        </div>
                                    </div>

                                    {/* Government Verification */}
                                    <div className="space-y-4 border-t border-white/5 pt-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Government Verification</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Aadhaar Card Number" placeholder="12-digit Aadhaar" maxLength="12" value={agentAadhaar} onChange={(e) => setAgentAadhaar(e.target.value.replace(/\D/g, ''))} required />
                                            <Input label="PAN Card Number (Optional)" placeholder="10-digit PAN" maxLength="10" value={agentPan} onChange={(e) => setAgentPan(e.target.value.toUpperCase())} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Upload Aadhaar Front</label>
                                                <div className="flex gap-4 items-center">
                                                    <label className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl cursor-pointer text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                                                        <Upload size={14} /> Front Card Image
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setAgentAadhaarFront)} />
                                                    </label>
                                                    {agentAadhaarFront && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Check size={14} /> Uploaded</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Upload Aadhaar Back</label>
                                                <div className="flex gap-4 items-center">
                                                    <label className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl cursor-pointer text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                                                        <Upload size={14} /> Back Card Image
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setAgentAadhaarBack)} />
                                                    </label>
                                                    {agentAadhaarBack && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Check size={14} /> Uploaded</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Details */}
                                    <div className="space-y-4 border-t border-white/5 pt-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Office / Permanent Address</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <Input label="House No." value={agentAddress.houseNo} onChange={(e) => setAgentAddress({...agentAddress, houseNo: e.target.value})} required />
                                            <Input label="Street / Area" value={agentAddress.street} onChange={(e) => setAgentAddress({...agentAddress, street: e.target.value})} required />
                                            <Input label="City" value={agentAddress.city} onChange={(e) => setAgentAddress({...agentAddress, city: e.target.value})} required />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input label="District" value={agentAddress.district} onChange={(e) => setAgentAddress({...agentAddress, district: e.target.value})} required />
                                            <Input label="State" value={agentAddress.state} onChange={(e) => setAgentAddress({...agentAddress, state: e.target.value})} required />
                                            <Input label="Pincode" maxLength="6" value={agentAddress.pincode} onChange={(e) => setAgentAddress({...agentAddress, pincode: e.target.value.replace(/\D/g, '')})} required />
                                        </div>
                                    </div>

                                    {/* Bank Details */}
                                    <div className="space-y-4 border-t border-white/5 pt-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Payout Bank Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Account Holder Name" placeholder="Exactly as in Passbook" value={agentBank.accountHolder} onChange={(e) => setAgentBank({...agentBank, accountHolder: e.target.value})} required />
                                            <Input label="Bank Name" placeholder="e.g. State Bank of India" value={agentBank.bankName} onChange={(e) => setAgentBank({...agentBank, bankName: e.target.value})} required />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Account Number" placeholder="Account No" value={agentBank.accountNumber} onChange={(e) => setAgentBank({...agentBank, accountNumber: e.target.value.replace(/\D/g, '')})} required />
                                            <Input label="IFSC Code" maxLength="11" placeholder="SBIN0001234" value={agentBank.ifscCode} onChange={(e) => setAgentBank({...agentBank, ifscCode: e.target.value.toUpperCase()})} required />
                                        </div>
                                    </div>

                                    {/* Legal Agreement */}
                                    <div className="space-y-4 border-t border-white/5 pt-6 bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-red-500 italic flex items-center gap-2"><AlertTriangle size={16} /> RESQR Agent Code of Conduct</h3>
                                        <div className="space-y-3 text-[11px] text-slate-300 font-bold tracking-wide leading-relaxed">
                                            <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> I will protect customer privacy and confidentiality.</p>
                                            <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> I will not misuse the RESQR brand name, logo, or services.</p>
                                            <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> I will only collect genuine customer information.</p>
                                            <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> I will never share medical or personal data without authorization.</p>
                                            <p className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> I understand that violating these policies may result in account suspension, termination, or legal action.</p>
                                        </div>
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                            <input 
                                                type="checkbox" 
                                                id="agentAgree" 
                                                checked={agentAcceptedAgreement} 
                                                onChange={(e) => setAgentAcceptedAgreement(e.target.checked)} 
                                                className="w-5 h-5 rounded accent-primary bg-slate-900 border-white/10 cursor-pointer" 
                                            />
                                            <label htmlFor="agentAgree" className="text-xs font-black uppercase tracking-widest text-white cursor-pointer italic">☑ I have read and agree to the RESQR Agent Agreement.</label>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-8 flex justify-between gap-4">
                                        <Button onClick={() => setAuthState('google_verify')} variant="outline" className="py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
                                            Back
                                        </Button>
                                        <Button 
                                            onClick={() => {
                                                if (!agentName || !agentEmail || !agentDob || !agentAadhaar || !agentAddress.city || !agentBank.accountNumber || !agentBank.ifscCode) {
                                                    toast.error("Please fill all mandatory agent details.");
                                                    return;
                                                }
                                                handleAgentRegistrationSubmit();
                                            }}
                                            disabled={authLoading}
                                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs"
                                        >
                                            {authLoading ? 'Transmitting credentials...' : 'Activate Agent Registration'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Hospital Email Login */}
                    {authState === 'email_login' && (
                        <motion.div 
                            key="email_login"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            className="max-w-md mx-auto"
                        >
                            <Card className="p-10 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden">
                                <button onClick={() => setAuthState('card_select')} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest italic">
                                    <ArrowLeft size={14} /> Back
                                </button>
                                <div className="space-y-4 mb-8">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">
                                        Hospital Sign In
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">
                                        Healthcare Provider Gate
                                    </p>
                                </div>

                                <form onSubmit={handleHospitalEmailSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <Input 
                                            label="Official Hospital Email" 
                                            type="email" 
                                            placeholder="admin@hospitalname.com" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required 
                                        />
                                        <Input 
                                            label="Access Password" 
                                            type="password" 
                                            placeholder="••••••••" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required 
                                        />
                                    </div>

                                    <Button 
                                        type="submit"
                                        disabled={authLoading}
                                        className="w-full py-7 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                    >
                                        {authLoading ? 'Verifying Link...' : 'Access Hospital Vault'}
                                    </Button>
                                </form>

                                <div className="mt-8 text-center border-t border-white/5 pt-6 space-y-4">
                                    <button 
                                        type="button" 
                                        onClick={() => handleDemoLogin('hospital')}
                                        className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 text-white rounded-xl text-[10px] font-black italic uppercase tracking-wider transition-all"
                                    >
                                        ⚡ 1-Click Demo Hospital Access
                                    </button>

                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">
                                        Unregistered Organization?{' '}
                                        <button onClick={() => setAuthState('email_register')} className="text-primary font-black hover:underline ml-1">
                                            Register Hospital
                                        </button>
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Hospital Email Register */}
                    {authState === 'email_register' && (
                        <motion.div 
                            key="email_register"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="max-w-md mx-auto"
                        >
                            <Card className="p-10 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden">
                                <button onClick={() => setAuthState('email_login')} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest italic">
                                    <ArrowLeft size={14} /> Back
                                </button>
                                <div className="space-y-4 mb-8">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">
                                        Hospital Sign Up
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest italic">
                                        Secure Hospital Key Creation
                                    </p>
                                </div>

                                <form onSubmit={handleHospitalEmailSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <Input 
                                            label="Official Hospital Email" 
                                            type="email" 
                                            placeholder="admin@hospitalname.com" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required 
                                        />
                                        <Input 
                                            label="Create Vault Password" 
                                            type="password" 
                                            placeholder="Min. 8 characters" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required 
                                        />
                                        <Input 
                                            label="Confirm Vault Password" 
                                            type="password" 
                                            placeholder="Repeat password" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required 
                                        />
                                    </div>

                                    <Button 
                                        type="submit"
                                        disabled={authLoading}
                                        className="w-full py-7 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                    >
                                        {authLoading ? 'Creating Credentials...' : 'Sign Up & Continue'}
                                    </Button>
                                </form>
                            </Card>
                        </motion.div>
                    )}

                    {/* Hospital Registration Wizard (after Email Sign Up) */}
                    {authState === 'register_wizard' && selectedRole === 'hospital' && (
                        <motion.div 
                            key="hospital_wizard"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card className="p-10 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden">
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                                    <div>
                                        <Badge className="bg-primary/20 text-primary border-none px-4 py-1 font-black italic tracking-widest text-[9px] mb-2">HOSPITAL REGISTRATION VECTOR</Badge>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">
                                            Step {hospitalStep} of 3: {
                                                hospitalStep === 1 ? 'Hospital Identity' :
                                                hospitalStep === 2 ? 'Capabilities & Address' : 'Subscription Plan'
                                            }
                                        </h2>
                                    </div>
                                    <span className="text-xl font-black italic text-primary font-poppins">{Math.round((hospitalStep / 3) * 100)}%</span>
                                </div>

                                {/* Step 1: Hospital Identity */}
                                {hospitalStep === 1 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <Input label="Hospital / Institution Name" placeholder="e.g. City Apollo Hospital" value={hospitalInfo.hospitalName} onChange={(e) => setHospitalInfo({...hospitalInfo, hospitalName: e.target.value})} required />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Registration Number" placeholder="REG-12345" value={hospitalInfo.regNo} onChange={(e) => setHospitalInfo({...hospitalInfo, regNo: e.target.value})} required />
                                            <Input label="Government License Number" placeholder="LIC-56789" value={hospitalInfo.licenseNo} onChange={(e) => setHospitalInfo({...hospitalInfo, licenseNo: e.target.value})} required />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="NABH Accreditation Number (Optional)" placeholder="NABH-001" value={hospitalInfo.nabhAccreditation} onChange={(e) => setHospitalInfo({...hospitalInfo, nabhAccreditation: e.target.value})} />
                                            <Input label="GST Number (Optional)" placeholder="22AAAAA0000A1Z5" value={hospitalInfo.gstNo} onChange={(e) => setHospitalInfo({...hospitalInfo, gstNo: e.target.value})} />
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6 bg-slate-950/40 p-6 rounded-2xl border border-white/5">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Document Verification Uploads</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic block ml-1">Hospital License Copy</label>
                                                    <div className="flex gap-4 items-center">
                                                        <label className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl cursor-pointer text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                                                            <Upload size={14} /> Upload PDF/Image
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setHospitalLicensePhoto)} />
                                                        </label>
                                                        {hospitalLicensePhoto && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Check size={14} /> Uploaded</span>}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic block ml-1">Registration Certificate</label>
                                                    <div className="flex gap-4 items-center">
                                                        <label className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl cursor-pointer text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                                                            <Upload size={14} /> Upload PDF/Image
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setHospitalRegCertPhoto)} />
                                                        </label>
                                                        {hospitalRegCertPhoto && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Check size={14} /> Uploaded</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 flex justify-end">
                                            <Button onClick={() => {
                                                if (!hospitalInfo.hospitalName || !hospitalInfo.regNo || !hospitalInfo.licenseNo || !hospitalLicensePhoto) {
                                                    toast.error("Please fill Hospital Name, Reg No, License No, and upload License copy.");
                                                    return;
                                                }
                                                setHospitalStep(2);
                                            }} className="py-4 px-8 bg-primary rounded-2xl font-black italic uppercase text-xs">
                                                Continue <ArrowRight size={16} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Capabilities & Address */}
                                {hospitalStep === 2 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Number of Beds" type="number" placeholder="50" value={hospitalDetails.beds} onChange={(e) => setHospitalDetails({...hospitalDetails, beds: e.target.value})} required />
                                            <Input label="ICU Beds" type="number" placeholder="10" value={hospitalDetails.icuBeds} onChange={(e) => setHospitalDetails({...hospitalDetails, icuBeds: e.target.value})} required />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Select 
                                                label="Hospital Type" 
                                                value={hospitalType} 
                                                onChange={(e) => setHospitalType(e.target.value)} 
                                                options={[
                                                    { label: 'Government', value: 'government' },
                                                    { label: 'Private', value: 'private' },
                                                    { label: 'Multi-Speciality', value: 'multi-speciality' },
                                                    { label: 'Clinic', value: 'clinic' }
                                                ]} 
                                            />
                                            <div className="flex items-center gap-4 border border-white/5 bg-slate-950/40 px-6 py-5 rounded-2xl mt-6">
                                                <input 
                                                    type="checkbox" 
                                                    id="emergencyDept" 
                                                    checked={hospitalDetails.hasEmergency} 
                                                    onChange={(e) => setHospitalDetails({...hospitalDetails, hasEmergency: e.target.checked})} 
                                                    className="w-5 h-5 rounded accent-primary bg-slate-900 border-white/10" 
                                                />
                                                <label htmlFor="emergencyDept" className="text-xs font-black uppercase tracking-widest text-slate-300 cursor-pointer">Emergency Dept.</label>
                                            </div>
                                            <div className="flex items-center gap-4 border border-white/5 bg-slate-950/40 px-6 py-5 rounded-2xl mt-6">
                                                <input 
                                                    type="checkbox" 
                                                    id="traumaCentre" 
                                                    checked={hospitalDetails.hasTrauma} 
                                                    onChange={(e) => setHospitalDetails({...hospitalDetails, hasTrauma: e.target.checked})} 
                                                    className="w-5 h-5 rounded accent-primary bg-slate-900 border-white/10" 
                                                />
                                                <label htmlFor="traumaCentre" className="text-xs font-black uppercase tracking-widest text-slate-300 cursor-pointer">Trauma Centre</label>
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Hospital Address</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <Input label="City" placeholder="City" value={hospitalAddress.city} onChange={(e) => setHospitalAddress({...hospitalAddress, city: e.target.value})} required />
                                                <Input label="District" placeholder="District" value={hospitalAddress.district} onChange={(e) => setHospitalAddress({...hospitalAddress, district: e.target.value})} required />
                                                <Input label="State" placeholder="State" value={hospitalAddress.state} onChange={(e) => setHospitalAddress({...hospitalAddress, state: e.target.value})} required />
                                                <Input label="Pincode" maxLength="6" placeholder="Pincode" value={hospitalAddress.pincode} onChange={(e) => setHospitalAddress({...hospitalAddress, pincode: e.target.value.replace(/\D/g, '')})} required />
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Primary Contact Person</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input label="Contact Name" placeholder="Dean / Administrator" value={hospitalContact.name} onChange={(e) => setHospitalContact({...hospitalContact, name: e.target.value})} required />
                                                <Input label="Designation" placeholder="e.g. Dean, Director" value={hospitalContact.designation} onChange={(e) => setHospitalContact({...hospitalContact, designation: e.target.value})} required />
                                                <Input label="Contact Mobile" maxLength="10" placeholder="Mobile No" value={hospitalContact.phone} onChange={(e) => setHospitalContact({...hospitalContact, phone: e.target.value.replace(/\D/g, '')})} required />
                                            </div>
                                        </div>

                                        <div className="pt-8 flex justify-between">
                                            <Button onClick={() => setHospitalStep(1)} variant="outline" className="py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
                                                Back
                                            </Button>
                                            <Button onClick={() => {
                                                if (!hospitalDetails.beds || !hospitalAddress.city || !hospitalAddress.pincode || !hospitalContact.name || !hospitalContact.phone) {
                                                    toast.error("Please fill Beds, City, Pincode and Contact details.");
                                                    return;
                                                }
                                                setHospitalStep(3);
                                            }} className="py-4 px-8 bg-primary rounded-2xl font-black italic uppercase text-xs">
                                                Choose Subscription <ArrowRight size={16} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Subscription Plans */}
                                {hospitalStep === 3 && (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(hospitalPlans).map(([key, plan]) => (
                                                <div 
                                                    key={key}
                                                    onClick={() => setSelectedHospitalPlan(key)}
                                                    className={`p-6 bg-slate-950 border rounded-3xl text-left cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden ${selectedHospitalPlan === key ? 'border-primary shadow-2xl' : 'border-white/5'}`}
                                                >
                                                    <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1 font-poppins">{plan.name}</h3>
                                                    <Badge className="bg-primary/20 text-primary border-none mb-3 font-black italic text-[8px] tracking-widest">{plan.beds}</Badge>
                                                    <p className="text-slate-500 text-xs leading-relaxed mb-6 font-bold">{plan.desc}</p>
                                                    <div className="flex justify-between items-baseline border-t border-white/5 pt-4">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Billing</span>
                                                        <span className="text-2xl font-black italic text-white font-poppins">₹{plan.price}/mo</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-6 bg-slate-950/60 rounded-3xl border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                                <span>Plan Subtotal</span>
                                                <span>₹{(hospitalPlans[selectedHospitalPlan].price / 1.18).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                                <span>GST (18%)</span>
                                                <span>₹{(hospitalPlans[selectedHospitalPlan].price - (hospitalPlans[selectedHospitalPlan].price / 1.18)).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-base font-black uppercase tracking-widest text-primary border-t border-white/5 pt-4">
                                                <span>Total Amount due</span>
                                                <span>₹{hospitalPlans[selectedHospitalPlan].price}.00</span>
                                            </div>
                                        </div>

                                        <div className="pt-8 flex justify-between gap-4">
                                            <Button onClick={() => setHospitalStep(2)} variant="outline" className="py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
                                                Back
                                            </Button>
                                            <Button 
                                                onClick={() => setIsRazorpayOpen(true)}
                                                disabled={authLoading}
                                                className="flex-1 py-7 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                            >
                                                {authLoading ? 'Authorizing plan subscription...' : `Pay ₹${hospitalPlans[selectedHospitalPlan].price} & Subscribe`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Reusable Demo Razorpay Payment Gateway Modal */}
            <DemoRazorpayModal 
                isOpen={isRazorpayOpen}
                onClose={() => setIsRazorpayOpen(false)}
                amount={
                    selectedRole === 'hospital' 
                        ? hospitalPlans[selectedHospitalPlan].price 
                        : (selectedPackage === 'digital' ? 99 : 149)
                }
                title={
                    selectedRole === 'hospital'
                        ? `RESQR ${hospitalPlans[selectedHospitalPlan].name} Subscription`
                        : `RESQR ${selectedPackage === 'digital' ? 'Digital QR Tag' : 'Digital QR + 2 Stickers'}`
                }
                customerName={selectedRole === 'hospital' ? (hospitalInfo.hospitalName || 'Hospital Partner') : (citizenName || 'RESQR Citizen')}
                customerEmail={selectedRole === 'hospital' ? (email || 'hospital@resqr.co.in') : (citizenEmail || 'citizen@resqr.co.in')}
                customerPhone={phoneNumber || '9876543210'}
                onSuccess={(paymentInfo) => {
                    toast.success(`Payment verified! Payment ID: ${paymentInfo.razorpay_payment_id}`);
                    if (selectedRole === 'hospital') {
                        handleHospitalRegistrationSubmit();
                    } else {
                        handleCitizenRegistrationSubmit();
                    }
                }}
            />

            {/* Live Medical QR Preview Modal */}
            <QRPreviewModal 
                isOpen={isQrPreviewOpen}
                onClose={() => setIsQrPreviewOpen(false)}
                patientData={{
                    name: citizenName || 'John Doe',
                    bloodGroup: bloodGroup || 'O+',
                    phone: phoneNumber || '9876543210',
                    emergencyContacts: emergencyContacts,
                    allergies: allergies || 'No known allergies',
                    medicalConditions: medicalConditions || 'Healthy',
                    medicalId: medicalId || 'RESQR-MED-94821',
                    insuranceCompany: insuranceCompany || 'Star Health'
                }}
                onProceedToPay={() => setIsRazorpayOpen(true)}
            />
        </div>
    );
}
