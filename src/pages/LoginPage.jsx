import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, User, ShieldCheck, Mail, Lock, Phone, ArrowLeft, ArrowRight, Check,
    Upload, CreditCard, Key, AlertTriangle, Building, FileText, CheckSquare, Plus, Trash2, Camera, Download, HelpCircle, BadgeInfo, Eye
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, update, set, get } from 'firebase/database';
import DemoRazorpayModal from '../components/common/DemoRazorpayModal';
import QRPreviewModal from '../components/common/QRPreviewModal';

// Helper Badge Component
function Badge({ children, className = '', ...props }) {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${className}`} {...props}>
            {children}
        </span>
    );
}

export default function LoginPage() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null); // null, 'citizen', 'agent', 'hospital'
    const [authState, setAuthState] = useState('card_select'); // card_select, phone_verify, otp_verify, register_wizard, email_login, email_register
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
    
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

    const handleSendOtp = () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error("Please enter a valid 10-digit mobile number.");
            return;
        }
        setAuthLoading(true);
        setTimeout(() => {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(otp);
            setAuthLoading(false);
            setAuthState('otp_verify');
            toast.success(`Demo Access Key Dispatched! Enter code: ${otp}`, { duration: 10000 });
        }, 1200);
    };

    const handleVerifyOtp = async () => {
        if (!enteredOtp || enteredOtp !== generatedOtp) {
            toast.error("Invalid verification code. Please check the code shown in the notification.");
            return;
        }
        setAuthLoading(true);
        try {
            // Real Firebase authentication using anonymous sign-in or demo credentials
            let currentUser = auth.currentUser;
            if (!currentUser) {
                try {
                    const userCredential = await signInAnonymously(auth);
                    currentUser = userCredential.user;
                } catch (anonErr) {
                    console.warn("Anonymous auth restricted in console, switching to demo auth handshake...", anonErr);
                    const demoEmail = `demo.${phoneNumber || 'user'}@resqr.co.in`;
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

            // Check if user already registered in RTDB by UID with completed profile
            const userSnap = await get(ref(db, `users/${uid}`));
            const profileSnap = await get(ref(db, `profiles/c_${uid}`));
            
            if (userSnap.exists() && profileSnap.exists() && userSnap.val()?.profileCompleted) {
                toast.success(`Welcome back, ${userSnap.val().name || 'User'}! Authentication successful.`);
                navigate('/dashboard');
                return;
            }

            // Open Registration Wizard based on chosen role
            if (selectedRole === 'agent') {
                setSelectedRole('agent');
                setAuthState('register_wizard');
                toast.success("Phone verified! Please complete your Agent Registration.");
            } else if (selectedRole === 'hospital') {
                setSelectedRole('hospital');
                setAuthState('register_wizard');
                setHospitalStep(1);
                toast.success("Phone verified! Please complete your Hospital Registration.");
            } else {
                setSelectedRole('citizen');
                setAuthState('register_wizard');
                setCitizenStep(1);
                toast.success("Phone verified! Please complete your 4-Step Medical Profile.");
            }
        } catch (error) {
            console.error("Auth error:", error);
            toast.error("Security handshake failed: " + error.message);
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

            const profileData = {
                id: profileId,
                role: 'citizen',
                profilePhoto: citizenProfilePhoto,
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
                    insuranceCompany, policyNumber, policyHolder, policyAgentName,
                    policyAgentPhone, policyExpiry, coverageAmount, insuranceCardPhoto, cashlessFacility
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
            navigate('/dashboard');
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
            navigate('/dashboard');
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
            <div className="w-full max-w-4xl py-12">
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
                                <p className="text-slate-400 max-w-md mx-auto text-sm font-semibold uppercase tracking-wider">
                                    Choose your role to continue.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Card 1: Citizen */}
                                <Card 
                                    onClick={() => { setSelectedRole('citizen'); setAuthState('phone_verify'); }}
                                    className="p-8 bg-medical-card border-white/5 hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(230,57,70,0.2)] transition-all duration-300 rounded-[35px] flex flex-col justify-between group h-full relative overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                            <User size={28} />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3 font-poppins text-white">👤 Citizen Login</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                            Create and manage your Emergency Medical Identity.
                                        </p>
                                    </div>
                                    <div className="relative z-10">
                                        <Button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedRole('citizen'); setAuthState('phone_verify'); }}
                                            className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                        >
                                            Login / Register
                                        </Button>
                                    </div>
                                </Card>

                                {/* Card 2: Agent */}
                                <Card 
                                    onClick={() => { setSelectedRole('agent'); setAuthState('phone_verify'); }}
                                    className="p-8 bg-medical-card border-white/5 hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(230,57,70,0.2)] transition-all duration-300 rounded-[35px] flex flex-col justify-between group h-full relative overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3 font-poppins text-white">👨💼 Agent Login</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                            Authorized RESQR Sales & Support Partner Portal.
                                        </p>
                                    </div>
                                    <div className="relative z-10">
                                        <Button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedRole('agent'); setAuthState('phone_verify'); }}
                                            className="w-full py-5 bg-slate-900 border border-white/10 hover:border-primary/50 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs"
                                        >
                                            Agent Login
                                        </Button>
                                    </div>
                                </Card>

                                {/* Card 3: Hospital */}
                                <Card 
                                    onClick={() => { setSelectedRole('hospital'); setAuthState('email_login'); }}
                                    className="p-8 bg-medical-card border-white/5 hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(230,57,70,0.2)] transition-all duration-300 rounded-[35px] flex flex-col justify-between group h-full relative overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                            <Building size={28} />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3 font-poppins text-white">🏥 Hospital Login</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                            Hospital Emergency Response Portal.
                                        </p>
                                    </div>
                                    <div className="relative z-10">
                                        <Button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedRole('hospital'); setAuthState('email_login'); }}
                                            className="w-full py-5 bg-slate-900 border border-white/10 hover:border-primary/50 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs"
                                        >
                                            Hospital Login
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* Phone verification flow (Citizen / Agent) */}
                    {authState === 'phone_verify' && (
                        <motion.div 
                            key="phone_verify"
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
                                        Secure OTP Verification Sequence
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Mobile number</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+91</span>
                                            <input 
                                                type="tel"
                                                maxLength="10"
                                                placeholder="9876543210"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                                className="w-full pl-14 pr-4 py-4 bg-slate-950 border border-white/5 focus:border-primary rounded-2xl text-white font-bold outline-none transition-all placeholder:text-slate-700"
                                            />
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={handleSendOtp}
                                        disabled={authLoading}
                                        className="w-full py-7 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                    >
                                        {authLoading ? 'Transmitting Key...' : 'Request Verification Key'}
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

                    {/* OTP verification flow (Citizen / Agent) */}
                    {authState === 'otp_verify' && (
                        <motion.div 
                            key="otp_verify"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-md mx-auto"
                        >
                            <Card className="p-10 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden">
                                <button onClick={() => setAuthState('phone_verify')} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest italic">
                                    <ArrowLeft size={14} /> Back
                                </button>
                                <div className="space-y-4 mb-8 text-center">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20">
                                        <Key size={28} className="animate-pulse" />
                                    </div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">Enter Access Key</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                                        A secure passcode was transmitted to +91 {phoneNumber}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col items-center gap-3">
                                        <input 
                                            type="text"
                                            maxLength="6"
                                            placeholder="000000"
                                            value={enteredOtp}
                                            onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full max-w-[200px] bg-slate-950 border-2 border-white/5 focus:border-primary rounded-2xl py-4 text-center text-3xl font-black tracking-[0.2em] outline-none transition-all text-primary font-poppins"
                                        />
                                        {generatedOtp && (
                                            <button 
                                                type="button" 
                                                onClick={() => setEnteredOtp(generatedOtp)}
                                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline italic"
                                            >
                                                ⚡ Auto-Fill Code ({generatedOtp})
                                            </button>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleVerifyOtp}
                                        disabled={authLoading}
                                        className="w-full py-7 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                                    >
                                        {authLoading ? 'Verifying...' : 'Establish Secure Connection'}
                                    </Button>

                                    <div className="pt-4 text-center border-t border-white/5">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                if (selectedRole === 'agent') setSelectedRole('agent');
                                                else setSelectedRole('citizen');
                                                setAuthState('register_wizard');
                                            }}
                                            className="text-[11px] text-slate-400 hover:text-primary font-black uppercase tracking-wider italic transition-colors"
                                        >
                                            New User? Complete {selectedRole === 'agent' ? 'Agent' : 'Citizen'} Registration Form ➔
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
                                                    <Input label="Mobile Number" value={`+91 ${phoneNumber}`} readOnly className="bg-slate-950/50 border-none font-bold text-slate-500" />
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
                                                    <Input label="Mobile Number" value={`+91 ${phoneNumber}`} readOnly className="bg-slate-950/50 border-none font-bold text-slate-500" />
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
                                        <Button onClick={() => setAuthState('otp_verify')} variant="outline" className="py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
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
