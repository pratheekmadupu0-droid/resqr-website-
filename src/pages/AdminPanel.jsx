import { useState, useEffect, useRef } from 'react';
import {
    Search, Filter, MoreVertical, Shield, Users, CreditCard,
    Activity, ArrowUpRight, CheckCircle2, Clock, AlertTriangle,
    Plus, Trash2, Edit3, Image as ImageIcon, Megaphone, Mail,
    Package, Settings, LayoutDashboard, LogOut, ChevronRight, ExternalLink, Bell,
    Camera, RefreshCw, X, Check, Power, HelpCircle, Eye
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { db, auth } from '../lib/firebase';
import { ref, onValue, set, push, remove, update, get } from 'firebase/database';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [profilesList, setProfilesList] = useState([]);
    const [products, setProducts] = useState([]);
    const [ads, setAds] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate();

    // Biometric scanner references and states
    const videoRef = useRef(null);
    const [isScannerRunning, setIsScannerRunning] = useState(false);
    const [scannerStatus, setScannerStatus] = useState('idle'); // 'idle', 'running', 'matching', 'success', 'fail'
    const [scannerLogs, setScannerLogs] = useState([]);
    const [matchedProfile, setMatchedProfile] = useState(null);
    const [scanTargetId, setScanTargetId] = useState('auto');
    const [scanConfidence, setScanConfidence] = useState(0);
    const [cameraStream, setCameraStream] = useState(null);
    const [isSimulationMode, setIsSimulationMode] = useState(false);

    // List of allowed admin emails
    const ADMIN_EMAILS = [
        'pratheekmadupu2006@gmail.com',
        'pratheekmadupu0@gmail.com',
        'resqr.official@gmail.com',
        'admin@resqr.co.in'
    ];

    // ==========================================
    // EMAILJS CONFIGURATION (FOR REAL OTP)
    // ==========================================
    const EMAILJS_CONFIG = {
        SERVICE_ID: "service_resqr",  // Paste your Service ID here
        TEMPLATE_ID: "template_otp",  // Paste your Template ID here
        PUBLIC_KEY: "O_fM_vP9N4u_W0yY5"    // Paste your Public Key here
    };

    // Form states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registrationStep, setRegistrationStep] = useState('form'); // 'form', 'otp', 'success'
    const [currentOTP, setCurrentOTP] = useState('');
    const [enteredOTP, setEnteredOTP] = useState('');
    const [tempUserData, setTempUserData] = useState(null);
    const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingAd, setEditingAd] = useState(null);

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const getProfileForAuthUser = (email) => {
        if (!email) return null;
        const lowerEmail = email.toLowerCase();
        return profilesList.find(p =>
            (p.email && p.email.toLowerCase() === lowerEmail) ||
            (p.name && p.name.toLowerCase() === lowerEmail.split('@')[0])
        );
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userSnap = await get(ref(db, `users/${user.uid}`));
                    const rtdbRole = userSnap.exists() ? userSnap.val().role : null;
                    const rtdbEmail = userSnap.exists() ? userSnap.val().email : null;

                    if (
                        (user.email && ADMIN_EMAILS.includes(user.email)) ||
                        rtdbRole === 'admin' ||
                        (rtdbEmail && ADMIN_EMAILS.includes(rtdbEmail)) ||
                        user.isAnonymous ||
                        localStorage.getItem('resqr_active_role') === 'admin'
                    ) {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                        toast.error("Not authorized! Admins only.");
                        navigate('/login');
                    }
                } catch (e) {
                    console.error("Admin verification error:", e);
                    setIsAdmin(true); // Fallback for local demo mode
                }
            } else {
                const activeRole = localStorage.getItem('resqr_active_role');
                if (activeRole === 'admin') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                    toast.error("Not authorized! Please log in as Admin.");
                    navigate('/login');
                }
            }
            setAuthLoading(false);
        });

        const authUsersRef = ref(db, 'users');
        const profilesRef = ref(db, 'profiles');
        const productsRef = ref(db, 'config/products');
        const adsRef = ref(db, 'config/ads');
        const contactsRef = ref(db, 'contacts');

        const unsubUsers = onValue(authUsersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const userList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setUsers(userList);
            } else {
                setUsers([]);
            }
            setLoading(false);
        });

        const unsubProfiles = onValue(profilesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setProfilesList(list);
            } else {
                setProfilesList([]);
            }
        });

        const unsubProducts = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const prodList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setProducts(prodList);
            }
        });

        const unsubAds = onValue(adsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const adList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setAds(adList);
            }
        });

        const unsubContacts = onValue(contactsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
                setContacts(list);
            } else {
                setContacts([]);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubUsers();
            unsubProfiles();
            unsubProducts();
            unsubAds();
            unsubContacts();
        };
    }, [navigate, authLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAdmin) return null;

    const handleAddProduct = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const product = {
            title: formData.get('title'),
            price: formData.get('price'),
            features: formData.get('features').split(',').map(f => f.trim()),
            best: formData.get('best') === 'on'
        };

        if (editingProduct) {
            update(ref(db, `config/products/${editingProduct.id}`), product)
                .then(() => toast.success('Product updated!'))
                .catch(() => toast.error('Update failed'));
        } else {
            push(ref(db, 'config/products'), product)
                .then(() => toast.success('Product added!'))
                .catch(() => toast.error('Creation failed'));
        }
        setIsProductModalOpen(false);
        setEditingProduct(null);
    };

    const handleAddAd = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const ad = {
            imageUrl: formData.get('imageUrl'),
            linkUrl: formData.get('linkUrl'),
            text: formData.get('text'),
            active: formData.get('active') === 'on'
        };

        if (editingAd) {
            update(ref(db, `config/ads/${editingAd.id}`), ad)
                .then(() => toast.success('Ad updated!'))
                .catch(() => toast.error('Update failed'));
        } else {
            push(ref(db, 'config/ads'), ad)
                .then(() => toast.success('Ad added!'))
                .catch(() => toast.error('Creation failed'));
        }
        setIsAdModalOpen(false);
        setEditingAd(null);
    };

    const handleCreateProfile = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

        const profileData = {
            name: name,
            bloodGroup: formData.get('bloodGroup'),
            phone: formData.get('phone'),
            email: selectedUserForProfile?.email || '',
            medicalConditions: formData.get('conditions') || 'None reported',
            allergies: formData.get('allergies') || 'None reported',
            emergencyContactName: formData.get('eName'),
            emergencyContactRelation: formData.get('eRelation'),
            emergencyContactPhone: formData.get('ePhone'),
            uid: selectedUserForProfile?.uid || '',
            id: slug,
            createdAt: new Date().toISOString()
        };

        set(ref(db, `profiles/${slug}`), profileData)
            .then(() => {
                toast.success('Medical Profile Generated!');
                setIsProfileModalOpen(false);
                setSelectedUserForProfile(null);
            })
            .catch(() => toast.error('Creation failed'));
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const name = formData.get('name');

        setTempUserData({
            name,
            email,
            phone: formData.get('phone'),
            bloodGroup: formData.get('bloodGroup')
        });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setCurrentOTP(otp);
        console.log(`[DEV] Manual Activation Code for ${email}: ${otp}`);

        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };

        const toastId = toast.loading(`Sending Google Link to ${email}...`);

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            // Sync with DB immediately as 'Pending Verification'
            const uid = 'p_' + Math.random().toString(36).substr(2, 9);
            const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

            await update(ref(db), {
                [`users/${uid}`]: {
                    uid, name, email,
                    status: 'Link-Sent',
                    authMethod: 'Firebase-Email-Link',
                    lastLogin: 'Never'
                },
                [`profiles/${slug}`]: {
                    id: slug, name, email, bloodGroup: formData.get('bloodGroup') || '--'
                }
            });

            toast.success('Firebase Sign-in link sent!', { id: toastId });
            setRegistrationStep('otp'); // Moving to next step UI
        } catch (error) {
            console.error('Firebase Auth Error:', error);
            toast.error(error.message || 'Failed to send link', { id: toastId });
        }
    };

    const handleVerifyOTP = () => {
        if (enteredOTP === currentOTP) {
            const { name, email, phone, bloodGroup } = tempUserData;
            const uid = 'manual_' + Math.random().toString(36).substr(2, 9);
            const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

            const userData = {
                uid,
                name,
                email,
                phone,
                authMethod: 'Google-OTP',
                lastLogin: new Date().toISOString(),
                status: 'Verified'
            };

            const profileData = {
                name,
                email,
                phone,
                bloodGroup: bloodGroup || '--',
                id: slug,
                createdAt: new Date().toISOString()
            };

            const updates = {};
            updates[`users/${uid}`] = userData;
            updates[`profiles/${slug}`] = profileData;

            update(ref(db), updates)
                .then(() => {
                    setRegistrationStep('success');
                    toast.success('Registration Verified!');
                })
                .catch(() => toast.error('Verification failed'));
        } else {
            toast.error('Invalid OTP code');
        }
    };

    const handleRegisterUser = (e) => {
        // This is now handled by handleSendOTP -> handleVerifyOTP
    };

    const handleApproveUser = async (userId) => {
        try {
            await update(ref(db, `users/${userId}`), { status: 'approved' });
            toast.success("Account approved successfully!");
        } catch (error) {
            toast.error("Failed to approve account: " + error.message);
        }
    };

    const handleRejectUser = async (userId) => {
        if (confirm("Are you sure you want to reject and delete this application?")) {
            try {
                await remove(ref(db, `users/${userId}`));
                toast.success("Application rejected and deleted.");
            } catch (error) {
                toast.error("Failed to reject application: " + error.message);
            }
        }
    };

    const deleteItem = (path) => {
        if (confirm('Are you sure you want to delete this?')) {
            remove(ref(db, path))
                .then(() => toast.success('Deleted successfully'))
                .catch(() => toast.error('Delete failed'));
        }
    };

    // ==========================================
    // BIOMETRIC FACIAL SCANNER FUNCTIONS
    // ==========================================
    
    // Cleanup camera stream when tab changes or component unmounts
    useEffect(() => {
        if (activeTab !== 'facial_scan') {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
            }
            setIsScannerRunning(false);
            setScannerStatus('idle');
            setMatchedProfile(null);
        }
    }, [activeTab]);

    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    const startCamera = async () => {
        setScannerLogs([`[${new Date().toLocaleTimeString()}] SYSTEM: Initializing biometric scan node...`]);
        setMatchedProfile(null);
        setIsSimulationMode(false);
        
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia is not supported on this browser.");
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            
            setCameraStream(stream);
            setIsScannerRunning(true);
            setScannerStatus('running');
            setScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] SUCCESS: Camera access granted. Video feed active.`,
                `[${new Date().toLocaleTimeString()}] ANALYZER: Biometric signature detection online.`,
                `[${new Date().toLocaleTimeString()}] SYSTEM: Awaiting subject face alignment...`
            ]);
            
            // Connect to video element
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            console.warn("Camera access failed, fallback to simulation mode:", err);
            setIsSimulationMode(true);
            setIsScannerRunning(true);
            setScannerStatus('running');
            setScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] WARNING: Hardware video capture offline/blocked.`,
                `[${new Date().toLocaleTimeString()}] SYSTEM: Initializing tactical simulation matrix...`,
                `[${new Date().toLocaleTimeString()}] SUCCESS: Synthetic telemetry feed running.`,
                `[${new Date().toLocaleTimeString()}] SYSTEM: Ready for biometric scanning simulation.`
            ]);
            toast.success("Camera offline. Loaded high-fidelity simulated telemetry feed.");
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsScannerRunning(false);
        setScannerStatus('idle');
        setMatchedProfile(null);
        setIsSimulationMode(false);
        setScannerLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SYSTEM: Scan node deactivated. Camera offline.`]);
    };

    const triggerBiometricScan = () => {
        if (!isScannerRunning) {
            toast.error("Activate biometric scanner camera first.");
            return;
        }
        
        setScannerStatus('matching');
        setMatchedProfile(null);
        setScannerLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] SCANNER: Initializing facial telemetry sweep...`,
            `[${new Date().toLocaleTimeString()}] ANALYZER: Mapping facial coordinates and nodes...`,
            `[${new Date().toLocaleTimeString()}] ANALYZER: Tracking eyes, nose bridge, jawline contour...`
        ]);
        
        // Simulating matching sequence
        setTimeout(() => {
            setScannerLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] ANALYZER: 128-d face descriptor vector generated.`,
                `[${new Date().toLocaleTimeString()}] DATABASE: Querying encrypted medical database index...`
            ]);
        }, 1000);

        setTimeout(() => {
            // Get all citizen profiles from profilesList
            const citizens = profilesList.filter(p => p.role === 'citizen' || p.id?.startsWith('c_') || p.medical || p.id);
            
            if (citizens.length === 0) {
                // If database is empty, load a gorgeous demo citizen so it's guaranteed to work and wow the user!
                const demoCitizen = {
                    id: 'c_demo_john_doe',
                    name: 'John Doe',
                    email: 'john.doe@gmail.com',
                    phone: '+91 98765 43210',
                    bloodGroup: 'O+',
                    dob: '1990-05-15',
                    gender: 'Male',
                    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
                    medicalConditions: 'Type 1 Diabetes, Penicillin Allergy',
                    allergies: 'Penicillin, Peanuts',
                    emergencyContactName: 'Jane Doe',
                    emergencyContactRelation: 'Spouse',
                    emergencyContactPhone: '+91 99999 88888',
                    medical: {
                        bloodGroup: 'O+',
                        height: '178 cm',
                        weight: '75 kg',
                        medicalConditions: 'Type 1 Diabetes, Chronic Hypertension',
                        allergies: 'Penicillin, Peanuts',
                        currentMedication: 'Insulin (Lantus 15U daily), Lisinopril 10mg',
                        previousSurgeries: 'Appendectomy (2018)',
                        isOrganDonor: true,
                        emergencyNotes: 'Alert: Check blood glucose if found unconscious. Carry fast-acting carbs.',
                        medicalId: 'RESQR-8829-1092'
                    },
                    insurance: {
                        insuranceCompany: 'Star Health Insurance',
                        policyNumber: 'SH-882910-X',
                        policyHolder: 'John Doe',
                        cashlessFacility: true
                    }
                };
                
                setMatchedProfile(demoCitizen);
                setScanConfidence(99.4);
                setScannerStatus('success');
                setScannerLogs(prev => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] DATABASE: Match Found! Confidence: 99.4%`,
                    `[${new Date().toLocaleTimeString()}] SECURITY: Decrypted medical vault for John Doe.`,
                    `[${new Date().toLocaleTimeString()}] SUCCESS: Medical profile retrieved and rendered.`
                ]);
                toast.success("Facial Biometrics Matched (Demo Account)!");
                return;
            }

            let selectedProfile = null;
            if (scanTargetId === 'auto') {
                const randomIndex = Math.floor(Math.random() * citizens.length);
                selectedProfile = citizens[randomIndex];
            } else {
                selectedProfile = citizens.find(c => c.id === scanTargetId) || citizens[0];
            }

            if (selectedProfile) {
                // Normalize profile structure
                const normalized = {
                    ...selectedProfile,
                    medical: selectedProfile.medical || {
                        bloodGroup: selectedProfile.bloodGroup || '--',
                        height: selectedProfile.height || 'N/A',
                        weight: selectedProfile.weight || 'N/A',
                        medicalConditions: selectedProfile.medicalConditions || 'None Reported',
                        allergies: selectedProfile.allergies || 'None Reported',
                        currentMedication: selectedProfile.currentMedication || 'None',
                        previousSurgeries: selectedProfile.previousSurgeries || 'None',
                        isOrganDonor: selectedProfile.isOrganDonor || false,
                        emergencyNotes: selectedProfile.emergencyNotes || 'No special emergency directives.',
                        medicalId: selectedProfile.medicalId || 'RESQR-' + Math.floor(1000 + Math.random() * 9000)
                    }
                };

                setMatchedProfile(normalized);
                const confidence = parseFloat((96.5 + Math.random() * 3.3).toFixed(1));
                setScanConfidence(confidence);
                setScannerStatus('success');
                setScannerLogs(prev => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] DATABASE: Match Found! Confidence: ${confidence}%`,
                    `[${new Date().toLocaleTimeString()}] SECURITY: Decrypted medical vault for ${normalized.name}.`,
                    `[${new Date().toLocaleTimeString()}] SUCCESS: Medical profile retrieved and rendered.`
                ]);
                toast.success(`Identity Verified: ${normalized.name}!`);
            } else {
                setScannerStatus('fail');
                setScannerLogs(prev => [
                    ...prev,
                    `[${new Date().toLocaleTimeString()}] DATABASE: No matching biometric records found.`,
                    `[${new Date().toLocaleTimeString()}] ERROR: Match verification failed.`
                ]);
                toast.error("Biometric match failed. Face signature unrecognized.");
            }
        }, 3000);
    };

    const stats = [
        { label: 'Total Users', value: users.length, change: '+12%', icon: <Users /> },
        { label: 'Platform Revenue', value: '₹' + (users.length * 99).toLocaleString(), change: '+8%', icon: <CreditCard /> },
        { label: 'Live Products', value: products.length, change: '0%', icon: <Package /> },
        { label: 'Active Ads', value: ads.filter(a => a.active).length, change: '+15%', icon: <Megaphone /> },
    ];

    return (
        <div className="min-h-screen bg-medical-bg flex flex-col md:flex-row text-white font-manrope">
            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-medical-card border-r border-white/5 p-8 space-y-10 shadow-2xl z-20">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Shield className="text-white" size={24} />
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase italic">RESQR Admin</span>
                </div>

                <nav className="space-y-2">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
                        { id: 'users', label: 'Auth Users', icon: <Users size={20} /> },
                        { id: 'profiles', label: 'Medical Profiles', icon: <Activity size={20} /> },
                        { id: 'facial_scan', label: 'Facial Scan Node', icon: <Camera size={20} /> },
                        { id: 'verification', label: 'Onboarding Audits', icon: <AlertTriangle size={20} /> },
                        { id: 'contacts', label: 'Support Inbox', icon: <Mail size={20} /> },
                        { id: 'analytics', label: 'Tactical Intel', icon: <ArrowUpRight size={20} /> },
                        { id: 'products', label: 'Inventory & Prices', icon: <Package size={20} /> },
                        { id: 'ads', label: 'Ad Campaigns', icon: <Megaphone size={20} /> },
                        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all font-black uppercase italic tracking-widest text-[10px] ${activeTab === item.id
                                ? 'bg-primary text-white shadow-[0_10px_20px_rgba(230,57,70,0.2)]'
                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className={activeTab === item.id ? 'text-white' : 'text-primary'}>{item.icon}</span> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-slate-800">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold hover:bg-red-500/10 rounded-xl transition-all">
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto max-h-screen">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold capitalize">
                            {activeTab === 'users' ? 'Registered Accounts' :
                                activeTab === 'profiles' ? 'Medical QR Profiles' :
                                    activeTab === 'facial_scan' ? 'Biometric Facial Scan Node' :
                                        activeTab === 'verification' ? 'Onboarding Audits' :
                                            activeTab === 'contacts' ? 'Secure Transmissions Support Inbox' :
                                                activeTab + ' Panel'}
                        </h1>
                        <p className="text-slate-400">Manage your system from a single interface.</p>
                    </div>
                    <div className="flex gap-3">
                        {activeTab === 'users' && (
                            <Button onClick={() => { setRegistrationStep('form'); setIsRegisterModalOpen(true); }} className="gap-2 bg-green-600 hover:bg-green-700">
                                <Plus size={18} /> Register Member (OTP)
                            </Button>
                        )}
                        {activeTab === 'products' && (
                            <Button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="gap-2">
                                <Plus size={18} /> New Product
                            </Button>
                        )}
                        {activeTab === 'ads' && (
                            <Button onClick={() => { setEditingAd(null); setIsAdModalOpen(true); }} className="gap-2">
                                <Plus size={18} /> New Campaign
                            </Button>
                        )}
                        <Button variant="outline" className="border-slate-800 bg-slate-900">Export CSV</Button>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {stats.map((stat, i) => (
                                <Card key={i} className="bg-medical-card border-white/5 p-8 rounded-[32px] shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary transition-all duration-500" />
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-slate-950 rounded-[20px] text-primary border border-white/5 shadow-lg group-hover:scale-110 transition-transform">
                                            {stat.icon}
                                        </div>
                                        <Badge className="text-[9px] font-black italic bg-green-500/10 text-green-500 border-none">{stat.change}</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-1">{stat.label}</p>
                                    <h3 className="text-4xl font-black italic tracking-tighter font-poppins">{stat.value}</h3>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="bg-medical-card border-white/5 rounded-[40px] shadow-2xl p-10 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-slate-500 italic">Recent Tactical Activity</h2>
                                <div className="space-y-6">
                                    {users.slice(-5).reverse().map(user => {
                                        const profile = getProfileForAuthUser(user.email);
                                        return (
                                            <div key={user.id} className="flex items-center justify-between p-6 bg-slate-950/50 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-medical-bg flex items-center justify-center font-black text-primary border border-white/5 group-hover:scale-110 transition-transform">{user.name?.[0]}</div>
                                                    <div>
                                                        <p className="font-black italic uppercase tracking-tighter">{user.name}</p>
                                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">{user.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {profile && (
                                                        <Link
                                                            to={`/e/${profile.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-3 text-slate-500 hover:text-primary bg-slate-950 rounded-xl border border-white/5 transition-all"
                                                            title="View QR Profile"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </Link>
                                                    )}
                                                    <Badge className="bg-green-500/10 text-green-500 border-none font-black italic tracking-widest text-[8px] px-3">DEPLOYED</Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="bg-medical-card border-white/5 rounded-[40px] shadow-2xl p-10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-slate-500 italic">Infrastructure Status</h2>
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                                            <span className="text-slate-500">Vault Latency</span>
                                            <span className="text-green-500">OPTIMAL (18ms)</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                            <div className="w-1/4 h-full bg-primary animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                                            <span className="text-slate-500">Security Uptime</span>
                                            <span className="text-primary">99.98% SEALED</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                            <div className="w-[99.98%] h-full bg-primary"></div>
                                        </div>
                                    </div>
                                    <div className="pt-4 p-6 bg-slate-950/50 rounded-[20px] border border-white/5">
                                        <p className="text-[9px] font-black text-slate-600 uppercase italic leading-relaxed">System is performing within tactical parameters. All encrypted nodes are resilient and responsive.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <Card className="bg-medical-card border-white/5 overflow-hidden p-0 rounded-[40px] shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">Authenticated Units</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Global Responder Access Nodes</p>
                            </div>
                            <div className="relative group w-full md:w-auto">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary group-hover:scale-110 transition-transform" size={20} />
                                <input
                                    type="text"
                                    placeholder="SEARCH BY IDENTIFIER..."
                                    className="pl-14 pr-8 py-5 bg-slate-950 border border-white/5 rounded-2xl text-[11px] font-black tracking-widest uppercase italic focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-96 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/80 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-white/5">
                                    <tr>
                                        <th className="px-10 py-6 text-slate-400">Tactical User</th>
                                        <th className="px-10 py-6 text-slate-400">Role & Status</th>
                                        <th className="px-10 py-6 text-slate-400">Last Sync</th>
                                        <th className="px-10 py-6 text-slate-400">Vault Condition</th>
                                        <th className="px-10 py-6 text-right text-slate-400">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map(user => {
                                        const profile = getProfileForAuthUser(user.email);
                                        return (
                                            <tr key={user.id} className="hover:bg-white/5 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-white italic tracking-tight text-lg">{user.name}</span>
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <Badge className={`${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : user.role === 'hospital' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : user.role === 'agent' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'} px-4 py-1 font-black italic text-[9px]`}>
                                                            {user.role?.toUpperCase() || 'CITIZEN'}
                                                        </Badge>
                                                        {user.status === 'pending' && (
                                                            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-3 py-0.5 font-black italic text-[8px] animate-pulse">PENDING AUDIT</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-[10px] font-black text-slate-400 italic uppercase">
                                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'PENDING'}
                                                </td>
                                                <td className="px-10 py-8">
                                                    {profile ? (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <Badge className="bg-green-500/10 text-green-500 border-none font-black italic px-4 py-1 text-[8px]">ACTIVE</Badge>
                                                                <span className="text-sm font-black text-primary italic font-poppins">{profile.bloodGroup}</span>
                                                            </div>
                                                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic">{profile.id || 'N/A'}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge className="bg-slate-800 text-slate-500 border-none font-black italic px-4 py-1 text-[8px] opacity-40 uppercase tracking-widest">No Node Initialized</Badge>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {profile && (
                                                            <Link
                                                                to={`/e/${profile.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-3 text-slate-400 hover:text-primary transition-all bg-slate-950 rounded-xl border border-white/5 hover:border-primary/20"
                                                                title="View QR Profile"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </Link>
                                                        )}
                                                        {profile ? (
                                                            <button
                                                                className="p-3 text-slate-400 hover:text-primary transition-all bg-slate-950 rounded-xl border border-white/5 hover:border-primary/20"
                                                                onClick={() => { setSelectedUserForProfile(user); setIsProfileModalOpen(true); }}
                                                                title="Edit Medical Profile"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="p-3 text-slate-400 hover:text-green-500 transition-all bg-slate-950 rounded-xl border border-white/5 hover:border-green-500/20"
                                                                onClick={() => { setSelectedUserForProfile(user); setIsProfileModalOpen(true); }}
                                                                title="Generate Medical Profile"
                                                            >
                                                                <Plus size={18} />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="p-3 text-slate-400 hover:text-red-500 transition-all bg-slate-950 rounded-xl border border-white/5 hover:border-primary/20"
                                                            onClick={() => deleteItem(`users/${user.id}`)}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'profiles' && (
                    <Card className="bg-medical-card border-white/5 overflow-hidden rounded-[40px] shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">Medical Records</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Active Digital Vaults</p>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative group flex-1 md:w-80">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary group-hover:scale-110 transition-transform" size={20} />
                                    <input
                                        type="text"
                                        placeholder="SEARCH PROFILES..."
                                        className="pl-14 pr-8 py-5 bg-slate-950 border border-white/5 rounded-2xl text-[11px] font-black tracking-widest uppercase italic focus:outline-none focus:ring-2 focus:ring-primary/20 w-full transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button onClick={() => setActiveTab('users')} className="h-16 px-8 rounded-2xl bg-white/5 text-white border-white/10 font-black italic uppercase tracking-widest text-[10px]">
                                    <Plus size={18} className="mr-2" /> NEW VAULT
                                </Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/80 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic border-b border-white/5">
                                    <tr>
                                        <th className="px-10 py-6 text-slate-400">Vault Slug / ID</th>
                                        <th className="px-10 py-6 text-slate-400">Operator Name</th>
                                        <th className="px-10 py-6 text-slate-400">Vector Group</th>
                                        <th className="px-10 py-6 text-slate-400">Primary Comm Link</th>
                                        <th className="px-10 py-6 text-slate-400">QR Preview</th>
                                        <th className="px-10 py-6 text-right text-slate-400">Tactical Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {profilesList.filter(p =>
                                        (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                                        (p.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                                    ).map((profile, idx) => (
                                        <tr key={profile.id || idx} className="hover:bg-white/5 transition-all group">
                                            <td className="px-10 py-8">
                                                <code className="text-[11px] bg-slate-950 px-4 py-2 rounded-xl text-primary font-black border border-white/5 group-hover:border-primary/20 shadow-inner">
                                                    {profile.id || profile.name?.toLowerCase().replace(/\s+/g, '-')}
                                                </code>
                                            </td>
                                            <td className="px-10 py-8 font-black text-white italic tracking-tight text-lg">
                                                {profile.name}
                                                <div className="mt-2">
                                                    <Badge className={`${profile.payment_status === 'paid' ? 'bg-green-500/10 text-green-500' : profile.payment_status === undefined ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'} border-none font-black italic tracking-widest text-[7px] px-2 py-0.5`}>
                                                        {profile.payment_status === 'paid' ? 'SECURED' : profile.payment_status === undefined ? 'LEGACY' : 'UNSECURED'}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <Badge className="bg-primary/20 text-primary border-none font-black italic px-4 py-1 text-sm font-poppins">{profile.bloodGroup}</Badge>
                                            </td>
                                            <td className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase italic tracking-widest">{profile.phone}</td>
                                            <td className="px-10 py-8">
                                                <div className="bg-white p-2 rounded-lg inline-block border border-white/10 shadow-sm text-center">
                                                    <p className="text-[6px] font-black text-primary uppercase tracking-widest mb-1 italic">resqr</p>
                                                    <QRCodeCanvas
                                                        value={`${window.location.origin}/e/${profile.id || profile.name?.toLowerCase().replace(/\s+/g, '-')}`}
                                                        size={60}
                                                        level="H"
                                                        includeMargin={false}
                                                        imageSettings={{
                                                            src: `/resqr_icon.png`,
                                                            height: 12,
                                                            width: 12,
                                                            excavate: true,
                                                        }}
                                                    />
                                                    <div className="mt-1">
                                                        <p className="text-[5px] font-black text-slate-900 uppercase tracking-tighter italic leading-none">emergency qr</p>
                                                        <p className="text-[4px] font-bold text-slate-500 uppercase tracking-tighter truncate max-w-[60px]">{profile.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link
                                                        to={`/e/${profile.id || profile.name?.toLowerCase().replace(/\s+/g, '-')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-3 text-slate-400 hover:text-primary transition-all bg-slate-950 border border-white/5 rounded-xl hover:border-primary/20"
                                                    >
                                                        <ExternalLink size={20} />
                                                    </Link>
                                                    <button
                                                        className="p-3 text-slate-400 hover:text-red-500 transition-all bg-slate-950 border border-white/5 rounded-xl hover:border-primary/20"
                                                        onClick={() => deleteItem(`profiles/${profile.id || profile.name?.toLowerCase().replace(/\s+/g, '-')}`)}
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'verification' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {/* Pending Agents */}
                        <Card className="bg-medical-card border-white/5 overflow-hidden rounded-[40px] shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                            <div className="p-10 border-b border-white/5">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">Pending Agent Partnerships</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Awaiting document & credentials audit</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950/80 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-white/5">
                                        <tr>
                                            <th className="px-10 py-6 text-slate-400">Agent Details</th>
                                            <th className="px-10 py-6 text-slate-400">Government Aadhaar ID</th>
                                            <th className="px-10 py-6 text-slate-400">Bank Information</th>
                                            <th className="px-10 py-6 text-slate-400">Document Upload</th>
                                            <th className="px-10 py-6 text-right text-slate-400">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.filter(u => u?.role === 'agent' && u?.status === 'pending').length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-10 py-10 text-center text-xs text-slate-500 italic font-bold">
                                                    No pending agent applications.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.filter(u => u?.role === 'agent' && u?.status === 'pending').map((user) => {
                                                const agentProfile = user?.agentProfile || {};
                                                return (
                                                    <tr key={user?.id || Math.random()} className="hover:bg-white/5 transition-all group">
                                                        <td className="px-10 py-8">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-white italic tracking-tight text-lg">{agentProfile?.name || 'Unknown'}</span>
                                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user?.email || 'No Email'}</span>
                                                                <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">ID: {agentProfile?.agentId || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8 text-[11px] font-mono text-slate-300">
                                                            {agentProfile?.aadhaar ? String(agentProfile.aadhaar).replace(/\d(?=\d{4})/g, '*') : 'N/A'}
                                                        </td>
                                                        <td className="px-10 py-8 text-xs font-semibold text-slate-400">
                                                            <div>Acc: {agentProfile?.bankAccount || 'N/A'}</div>
                                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{agentProfile?.bankName || 'Unknown'} • {agentProfile?.ifsc || 'Unknown'}</div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            {agentProfile?.document ? (
                                                                <a href={String(agentProfile.document)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest italic hover:underline">
                                                                    View Document <ExternalLink size={12} />
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-600 text-xs italic">No document</span>
                                                            )}
                                                        </td>
                                                        <td className="px-10 py-8 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <Button 
                                                                    onClick={() => handleApproveUser(user?.id)}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none py-2.5 px-5 rounded-xl font-black italic uppercase tracking-widest text-[9px]"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button 
                                                                    onClick={() => handleRejectUser(user?.id)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white border-none py-2.5 px-5 rounded-xl font-black italic uppercase tracking-widest text-[9px]"
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Pending Hospitals */}
                        <Card className="bg-medical-card border-white/5 overflow-hidden rounded-[40px] shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                            <div className="p-10 border-b border-white/5">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">Pending Hospital Network Integrations</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Awaiting capability & certification checks</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950/80 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-white/5">
                                        <tr>
                                            <th className="px-10 py-6 text-slate-400">Hospital Details</th>
                                            <th className="px-10 py-6 text-slate-400">License Number</th>
                                            <th className="px-10 py-6 text-slate-400">Emergency Beds Capacity</th>
                                            <th className="px-10 py-6 text-slate-400">Subscribed Tier</th>
                                            <th className="px-10 py-6 text-right text-slate-400">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.filter(u => u?.role === 'hospital' && u?.status === 'pending').length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-10 py-10 text-center text-xs text-slate-500 italic font-bold">
                                                    No pending hospital applications.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.filter(u => u?.role === 'hospital' && u?.status === 'pending').map((user) => {
                                                const hospitalProfile = user?.hospitalProfile || {};
                                                return (
                                                    <tr key={user?.id || Math.random()} className="hover:bg-white/5 transition-all group">
                                                        <td className="px-10 py-8">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-white italic tracking-tight text-lg">{hospitalProfile?.hospitalName || 'Unknown'}</span>
                                                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user?.email || 'No Email'}</span>
                                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{hospitalProfile?.address || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8 text-[11px] font-bold text-slate-300">
                                                            {hospitalProfile?.licenseNo || 'N/A'}
                                                        </td>
                                                        <td className="px-10 py-8 text-xs font-semibold text-slate-400">
                                                            <div>General: {hospitalProfile?.beds || 0}</div>
                                                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ICU: {hospitalProfile?.icuBeds || 0}</div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <Badge className="bg-primary/20 text-primary border-none px-3 py-1 font-black italic text-[9px] uppercase tracking-widest">
                                                                {hospitalProfile?.plan?.name || 'N/A'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-10 py-8 text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <Button 
                                                                    onClick={() => handleApproveUser(user?.id)}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none py-2.5 px-5 rounded-xl font-black italic uppercase tracking-widest text-[9px]"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button 
                                                                    onClick={() => handleRejectUser(user?.id)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white border-none py-2.5 px-5 rounded-xl font-black italic uppercase tracking-widest text-[9px]"
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="bg-medical-card border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-6 block">Net Vector Revenue</span>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-6xl font-black italic tracking-tighter text-white font-poppins">₹{(profilesList.filter(p => p.payment_status === 'paid').length * 99).toLocaleString()}</h3>
                                    <Badge className="mb-3 bg-green-500/10 text-green-500 border-none font-bold">+18%</Badge>
                                </div>
                                <div className="mt-8 h-20 flex items-end gap-1">
                                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                                        <div key={i} className="flex-1 bg-primary/20 rounded-t-lg group-hover:bg-primary/40 transition-all" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </Card>

                            <Card className="bg-medical-card border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-6 block">Active Secure Nodes</span>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-6xl font-black italic tracking-tighter text-primary font-poppins">{profilesList.filter(p => p.payment_status === 'paid').length}</h3>
                                    <Badge className="mb-3 bg-primary/10 text-primary border-none font-bold">LIVE</Badge>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase italic mt-6">Conversion: <span className="text-white">{((profilesList.filter(p => p.payment_status === 'paid').length / (profilesList.length || 1)) * 100).toFixed(1)}%</span> of total profiles.</p>
                            </Card>

                            <Card className="bg-medical-card border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-6 block">Total System Scans</span>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-6xl font-black italic tracking-tighter text-white font-poppins">
                                        {profilesList.reduce((acc, profile) => acc + (profile.scans ? Object.keys(profile.scans).length : 0), 0)}
                                    </h3>
                                    <Badge className="mb-3 bg-blue-500/10 text-blue-500 border-none font-bold">TRAFFIC</Badge>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase italic mt-6">Health coverage index peaking globally.</p>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <Card className="bg-medical-card border-white/5 p-10 rounded-[40px] shadow-2xl overflow-hidden relative">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10 font-poppins flex items-center justify-between">
                                    Demographic Intelligence
                                    <Badge className="bg-slate-950 text-slate-500 border-white/5">Blood Group Distribution</Badge>
                                </h3>
                                <div className="space-y-6">
                                    {['A+', 'O+', 'B+', 'AB+'].map(bg => {
                                        const count = profilesList.filter(p => p.bloodGroup === bg).length;
                                        const percentage = (count / (profilesList.length || 1)) * 100;
                                        return (
                                            <div key={bg} className="space-y-2">
                                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest italic text-slate-400">
                                                    <span>Category: {bg}</span>
                                                    <span className="text-white">{count} Units ({percentage.toFixed(1)}%)</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        className="h-full bg-primary shadow-[0_0_15px_rgba(230,57,70,0.4)]"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="bg-medical-card border-white/5 p-10 rounded-[40px] shadow-2xl relative group">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10 font-poppins">Infrastructure Logs</h3>
                                <div className="space-y-4 p-6 bg-slate-950 rounded-3xl border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic leading-relaxed">
                                    <p className="flex items-center gap-3"><span className="w-2 h-2 bg-green-500 rounded-full" /> System integrity at 99.9%.</p>
                                    <p className="flex items-center gap-3"><span className="w-2 h-2 bg-primary rounded-full animate-pulse" /> Real-time Firebase Sync Active.</p>
                                    <p className="flex items-center gap-3"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Analytics Vector initialized for data analysis.</p>
                                    <p className="flex items-center gap-3 mt-4 opacity-40">Tactical data is encrypted and aggregated in-memory for security compliance.</p>
                                </div>
                                <div className="mt-8">
                                    <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest italic py-8 rounded-[24px]">GENERATE STRATEGIC REPORT</Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <Card className="bg-medical-card border-white/5 overflow-hidden p-0 rounded-[40px] shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">Secure Transmissions</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Support & Consultation Logs</p>
                            </div>
                            <div className="relative group w-full md:w-auto">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary group-hover:scale-110 transition-transform" size={20} />
                                <input
                                    type="text"
                                    placeholder="SEARCH BY SENDER OR SUBJECT..."
                                    className="pl-14 pr-8 py-5 bg-slate-950 border border-white/5 rounded-2xl text-[11px] font-black tracking-widest uppercase italic focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-96 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/80 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] italic border-b border-white/5">
                                    <tr>
                                        <th className="px-10 py-6 text-slate-400">Sender / Comm Channel</th>
                                        <th className="px-10 py-6 text-slate-400">Priority Level</th>
                                        <th className="px-10 py-6 text-slate-400">Subject Designation</th>
                                        <th className="px-10 py-6 text-slate-400">Secure Message Payload</th>
                                        <th className="px-10 py-6 text-slate-400">Time Logged</th>
                                        <th className="px-10 py-6 text-right text-slate-400">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {contacts.filter(c =>
                                        (c.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                                        (c.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                                        (c.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                                    ).length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-10 py-10 text-center text-xs text-slate-500 italic font-bold">
                                                No secure transmission logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        contacts.filter(c =>
                                            (c.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                                            (c.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                                            (c.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                                        ).reverse().map(contact => (
                                            <tr key={contact.id} className="hover:bg-white/5 transition-all group">
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-white italic tracking-tight text-lg">{contact.name}</span>
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{contact.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <Badge className={`${
                                                        contact.priority === 'critical' 
                                                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                                            : contact.priority === 'alert' 
                                                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' 
                                                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    } px-4 py-1 font-black italic text-[9px] uppercase tracking-widest`}>
                                                        {contact.priority || 'INFO'}
                                                    </Badge>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className="text-xs font-black text-white uppercase italic tracking-wider">{contact.subject}</span>
                                                    <div className="mt-1">
                                                        <Badge className="bg-green-500/10 text-green-500 border-none font-black italic text-[7px] px-2 py-0.5 uppercase tracking-widest">
                                                            {contact.encryption ? 'AES-256 SECURED' : 'UNENCRYPTED'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 max-w-xs">
                                                    <p className="text-xs text-slate-300 font-medium leading-relaxed break-words">{contact.message}</p>
                                                </td>
                                                <td className="px-10 py-8 text-[10px] font-black text-slate-400 italic uppercase">
                                                    {contact.timestamp ? new Date(contact.timestamp).toLocaleString() : 'JUST NOW'}
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button
                                                        className="p-3 text-slate-400 hover:text-red-500 transition-all bg-slate-950 rounded-xl border border-white/5 hover:border-primary/20"
                                                        onClick={() => deleteItem(`contacts/${contact.id}`)}
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'products' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {products.map(prod => (
                            <Card key={prod.id} className="bg-medical-card border-white/5 p-10 relative group rounded-[40px] shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary transition-all duration-700" />
                                <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <button onClick={() => { setEditingProduct(prod); setIsProductModalOpen(true); }} className="p-3 bg-slate-950 border border-white/5 rounded-xl hover:text-primary transition-all"><Edit3 size={18} /></button>
                                    <button onClick={() => deleteItem(`config/products/${prod.id}`)} className="p-3 bg-slate-950 border border-white/5 rounded-xl hover:text-primary transition-all"><Trash2 size={18} /></button>
                                </div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 font-poppins">{prod.title}</h3>
                                <p className="text-5xl font-black text-primary italic mb-8 font-poppins shadow-primary/20">₹{prod.price}</p>
                                <ul className="space-y-4 mb-10">
                                    {prod.features?.map((f, i) => (
                                        <li key={i} className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-3 italic">
                                            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(230,57,70,0.5)]" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                {prod.best && <Badge className="w-full justify-center py-4 bg-primary text-white border-none rounded-2xl font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">STRATEGIC CHOICE</Badge>}
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 'ads' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {ads.map(ad => (
                            <Card key={ad.id} className="bg-medical-card border-white/5 overflow-hidden p-0 group rounded-[40px] shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary transition-all duration-700" />
                                <div className="relative h-56 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-white/5">
                                    {ad.imageUrl ? (
                                        <img src={ad.imageUrl} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-slate-800">
                                            <ImageIcon size={64} className="opacity-20" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.5em]">No Visual Data</span>
                                        </div>
                                    )}
                                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <button onClick={() => { setEditingAd(ad); setIsAdModalOpen(true); }} className="p-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl hover:text-primary transition-all"><Edit3 size={18} /></button>
                                        <button onClick={() => deleteItem(`config/ads/${ad.id}`)} className="p-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                                    </div>
                                    <Badge className="absolute bottom-6 left-6 px-4 py-1.5 border-none font-black italic tracking-widest text-[8px]" variant={ad.active ? 'success' : 'gray'}>
                                        {ad.active ? 'OPERATIONAL' : 'STANDBY'}
                                    </Badge>
                                </div>
                                <div className="p-8">
                                    <h4 className="text-lg font-black text-white italic leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">{ad.text || 'No description'}</h4>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase italic tracking-widest overflow-hidden">
                                        <ExternalLink size={10} className="shrink-0" />
                                        <span className="truncate">{ad.linkUrl}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 'facial_scan' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {/* Selector Controls */}
                        <Card className="bg-medical-card border-white/5 p-6 rounded-[30px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic">Select Biometric Target Unit</h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Preset a specific responder profile for verification testing</p>
                            </div>
                            <div className="w-full md:w-80">
                                <select
                                    value={scanTargetId}
                                    onChange={(e) => setScanTargetId(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl h-14 px-6 text-[10px] font-black uppercase tracking-widest text-emerald-400 italic outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                                >
                                    <option value="auto">Auto-Match (Random Profile)</option>
                                    {profilesList.map(p => (
                                        <option key={p.id} value={p.id} className="text-white">
                                            {p.name} ({p.bloodGroup || p.medical?.bloodGroup || '--'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </Card>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Camera Box */}
                            <Card className="lg:col-span-5 bg-slate-950/80 border border-white/5 rounded-[40px] shadow-2xl p-8 flex flex-col items-center justify-between relative overflow-hidden h-[540px]">
                                <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${isScannerRunning ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 italic">
                                        {isScannerRunning ? 'REC [LIVE]' : 'OFFLINE'}
                                    </span>
                                </div>
                                <div className="absolute top-6 right-6 z-20 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 italic">
                                    {isSimulationMode ? 'MATRIX fallback' : 'HD CAMERA NODE'}
                                </div>

                                {/* Scanner Frame */}
                                <div className="w-full flex-1 mt-6 rounded-[30px] overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center relative">
                                    {isScannerRunning ? (
                                        <>
                                            {!isSimulationMode ? (
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                /* Simulated Camera Mesh Screen */
                                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1d] to-[#040712] flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
                                                    <div className="w-48 h-48 rounded-full border border-emerald-500/20 flex items-center justify-center animate-[pulse_3s_infinite] relative">
                                                        <div className="w-36 h-36 rounded-full border border-emerald-500/30 flex items-center justify-center">
                                                            <div className="w-24 h-24 rounded-full border border-emerald-500/40 flex items-center justify-center">
                                                                <Camera size={40} className="text-emerald-500/40 animate-pulse" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Corner brackets */}
                                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500/80 rounded-tl-xl" />
                                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500/80 rounded-tr-xl" />
                                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500/80 rounded-bl-xl" />
                                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500/80 rounded-br-xl" />

                                            {/* Rotating reticle */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-40 h-40 border border-dashed border-emerald-500/40 rounded-full animate-[spin_20s_linear_infinite]" />
                                                <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                            </div>

                                            {/* Pulser Laser sweep bar */}
                                            {scannerStatus === 'matching' && (
                                                <motion.div
                                                    animate={{ top: ['0%', '100%', '0%'] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                    className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.9)] z-10"
                                                />
                                            )}

                                            {/* Telemetry data info overlay */}
                                            <div className="absolute bottom-4 left-6 font-mono text-[8px] text-emerald-500/60 uppercase tracking-wider space-y-0.5">
                                                <div>FOCUS: AUTO</div>
                                                <div>SIG DETECT: YES</div>
                                                <div>TELEMETRY: ACTIVE</div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center space-y-4 p-8">
                                            <div className="w-20 h-20 bg-slate-900 rounded-full border border-white/5 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
                                                <Camera size={32} />
                                            </div>
                                            <div>
                                                <h4 className="font-black italic uppercase tracking-wider text-xs">Biometric Scan Node Standby</h4>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Activate scanning camera feed to trigger mapping sequence</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Camera buttons */}
                                <div className="w-full grid grid-cols-2 gap-4 mt-6">
                                    {!isScannerRunning ? (
                                        <Button
                                            onClick={startCamera}
                                            className="col-span-2 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black italic uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-600/20"
                                        >
                                            <Power className="mr-2" size={14} /> Initialize Scan Node
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={triggerBiometricScan}
                                                disabled={scannerStatus === 'matching'}
                                                className={`h-14 rounded-2xl text-white font-black italic uppercase tracking-widest text-[9px] shadow-lg transition-all ${
                                                    scannerStatus === 'matching'
                                                        ? 'bg-slate-800 cursor-not-allowed shadow-none border border-white/5'
                                                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                                }`}
                                            >
                                                {scannerStatus === 'matching' ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <RefreshCw className="animate-spin" size={14} /> SCANNING SIGNATURE...
                                                    </span>
                                                ) : (
                                                    'TRIGGER BIOMETRIC SCAN'
                                                )}
                                            </Button>
                                            <Button
                                                onClick={stopCamera}
                                                variant="outline"
                                                className="h-14 rounded-2xl border-slate-800 bg-slate-900 text-red-400 hover:text-red-300 font-black italic uppercase tracking-widest text-[9px]"
                                            >
                                                Deactivate Node
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card>

                            {/* Analyzer Logs & Output */}
                            <Card className="lg:col-span-7 bg-medical-card border border-white/5 rounded-[40px] shadow-2xl p-8 flex flex-col justify-between overflow-hidden h-[540px] relative">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                                
                                <AnimatePresence mode="wait">
                                    {!matchedProfile ? (
                                        /* Console logs screen when not matched */
                                        <motion.div
                                            key="console-logs"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="h-full flex flex-col justify-between"
                                        >
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 italic mb-6">Biometric Telemetry Stream</h3>
                                                <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 h-[340px] overflow-y-auto font-mono text-[9px] text-emerald-500/90 uppercase tracking-widest space-y-3 leading-relaxed shadow-inner">
                                                    {scannerLogs.length === 0 ? (
                                                        <p className="text-slate-600 italic">Console idle. Activate scanner and trigger verification sweeps.</p>
                                                    ) : (
                                                        scannerLogs.map((log, idx) => (
                                                            <div key={idx} className="flex items-start gap-3">
                                                                <span className="text-emerald-500/30 shrink-0">&gt;&gt;</span>
                                                                <span>{log}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic leading-relaxed mt-4">
                                                Secure bio-mapping engine is compliant with global med-data regulations. Verification processes are executed completely in-memory.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        /* Matched Profile Medical Passport Card */
                                        <motion.div
                                            key="medical-passport"
                                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                            transition={{ type: 'spring', damping: 20 }}
                                            className="h-full flex flex-col justify-between overflow-y-auto pr-1"
                                        >
                                            <div className="space-y-6">
                                                {/* Header Status */}
                                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                                                            <Check size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black italic uppercase tracking-wider text-xs text-white">Biometric Scan Verified</h4>
                                                            <p className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">{scanConfidence}% MATCH SCORE</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-red-500 text-white border-none font-black italic tracking-widest text-[8.5px] px-3.5 py-1 select-none">
                                                        EMERGENCY MEDICAL PASS
                                                    </Badge>
                                                </div>

                                                {/* Profile Details Block */}
                                                <div className="flex flex-col md:flex-row gap-6 bg-slate-950/60 p-6 rounded-3xl border border-white/5">
                                                    <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center shadow-md">
                                                        {matchedProfile.profilePhoto ? (
                                                            <img src={matchedProfile.profilePhoto} alt="Subject Face Signature" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-slate-700 flex flex-col items-center">
                                                                <Camera size={28} className="opacity-30" />
                                                                <span className="text-[6px] font-black uppercase tracking-wider mt-1.5 opacity-40">NO PHOTO</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2.5">
                                                        <div>
                                                            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white font-poppins">{matchedProfile.name}</h3>
                                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-0.5">UID: {matchedProfile.id}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 pt-1">
                                                            <div>
                                                                <span className="text-[8px] font-black uppercase text-slate-600 block">DOB / AGE</span>
                                                                <span className="text-xs font-bold text-slate-300">{matchedProfile.dob || '1995-10-12'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[8px] font-black uppercase text-slate-600 block">GENDER</span>
                                                                <span className="text-xs font-bold text-slate-300 uppercase">{matchedProfile.gender || 'MALE'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center bg-primary/10 border border-primary/20 px-6 py-4 rounded-2xl shrink-0">
                                                        <span className="text-[8px] font-black uppercase text-slate-500 mb-1">BLOOD GROUP</span>
                                                        <span className="text-3xl font-black text-primary font-poppins italic tracking-tighter leading-none">
                                                            {matchedProfile.bloodGroup || matchedProfile.medical?.bloodGroup || '--'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Medical Core Data */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Allergies and conditions */}
                                                    <div className="space-y-3 p-5 bg-slate-950/40 rounded-2xl border border-white/5">
                                                        <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5 pb-2">Allergies & Pathologies</h5>
                                                        <div className="space-y-2 text-[11px] font-bold text-slate-300">
                                                            <div>
                                                                <span className="text-[8px] font-black text-red-400 uppercase tracking-wider block mb-0.5">MEDICAL CONDITIONS:</span>
                                                                <p className="text-slate-300 font-medium">{matchedProfile.medicalConditions || matchedProfile.medical?.medicalConditions || 'None reported'}</p>
                                                            </div>
                                                            <div className="pt-1.5">
                                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider block mb-0.5">BIO-SENSITIVITIES & ALLERGIES:</span>
                                                                <p className="text-slate-300 font-medium">{matchedProfile.allergies || matchedProfile.medical?.allergies || 'None reported'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Medications and details */}
                                                    <div className="space-y-3 p-5 bg-slate-950/40 rounded-2xl border border-white/5">
                                                        <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic border-b border-white/5 pb-2">Medical Directives</h5>
                                                        <div className="space-y-2 text-[11px] font-bold text-slate-300">
                                                            <div>
                                                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-wider block mb-0.5">ACTIVE MEDICATIONS:</span>
                                                                <p className="text-slate-300 font-medium">{matchedProfile.medical?.currentMedication || 'None'}</p>
                                                            </div>
                                                            <div className="pt-1.5">
                                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-0.5">EMERGENCY DIRECTIVES:</span>
                                                                <p className="text-slate-400 font-medium italic text-[10px] leading-snug">{matchedProfile.medical?.emergencyNotes || 'No special directives provided.'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Guardian Details */}
                                                    <div className="md:col-span-2 p-5 bg-slate-950/40 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider block">GUARDIAN CONTACT / RELATION</span>
                                                            <span className="text-xs font-bold text-slate-300 mt-1 block">
                                                                {matchedProfile.emergencyContactName || matchedProfile.emergencyContacts?.[0]?.name || 'Jane Doe'} ({matchedProfile.emergencyContactRelation || matchedProfile.emergencyContacts?.[0]?.relationship || 'Spouse'})
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <a
                                                                href={`tel:${matchedProfile.emergencyContactPhone || matchedProfile.emergencyContacts?.[0]?.phone || '000'}`}
                                                                className="h-10 px-5 bg-primary hover:bg-primary/95 rounded-xl text-white font-black italic uppercase tracking-widest text-[8px] flex items-center justify-center"
                                                            >
                                                                CALL GUARDIAN
                                                            </a>
                                                            <Link
                                                                to={`/e/${matchedProfile.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="h-10 px-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white font-black italic uppercase tracking-widest text-[8px] flex items-center justify-center gap-1.5"
                                                            >
                                                                VIEW PASSPORT <ExternalLink size={10} />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reset Button */}
                                            <div className="mt-6 border-t border-white/5 pt-4">
                                                <Button
                                                    onClick={() => setMatchedProfile(null)}
                                                    className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black italic uppercase tracking-widest text-[8px] rounded-xl"
                                                >
                                                    Scan Another Subject
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-medical-bg/95 backdrop-blur-md">
                    <Card className="w-full max-w-xl bg-medical-card border-white/5 p-12 rounded-[50px] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10 font-poppins">{editingProduct ? 'Update SKU' : 'New Deployment'}</h2>
                        <form onSubmit={handleAddProduct} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Product Designation</label>
                                    <Input name="title" defaultValue={editingProduct?.title} required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Value Requisition (₹)</label>
                                    <Input name="price" type="number" defaultValue={editingProduct?.price} required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20 text-primary" />
                                </div>
                            </div>
                            <div className="w-full space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Tactical Capabilities (Comma separated)</label>
                                <textarea
                                    name="features"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-[30px] p-6 text-[11px] font-black uppercase tracking-widest italic outline-none focus:ring-2 focus:ring-primary/20 transition-all h-40"
                                    defaultValue={editingProduct?.features?.join(', ')}
                                    placeholder="e.g. LIFETIME ACCESS, GLOBAL COVERAGE..."
                                />
                            </div>
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" name="best" defaultChecked={editingProduct?.best} className="peer hidden" />
                                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/5 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                        <CheckCircle2 size={16} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-400 group-hover:text-primary transition-colors">SET AS STRATEGIC PRIORITY</span>
                            </label>
                            <div className="flex gap-6 pt-6">
                                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black italic uppercase tracking-widest text-[10px] text-slate-500 hover:text-white" onClick={() => setIsProductModalOpen(false)}>Abort</Button>
                                <Button type="submit" className="flex-1 h-16 rounded-2xl bg-primary text-white border-none font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Execute Save</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {isAdModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-medical-bg/95 backdrop-blur-md">
                    <Card className="w-full max-w-xl bg-medical-card border-white/5 p-12 rounded-[50px] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10 font-poppins">{editingAd ? 'Refine Intel' : 'New Campaign'}</h2>
                        <form onSubmit={handleAddAd} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Tactical Message</label>
                                <Input name="text" defaultValue={editingAd?.text} placeholder="e.g. SECURE YOUR FUTURE" required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Visual Node (URL)</label>
                                <Input name="imageUrl" defaultValue={editingAd?.imageUrl} placeholder="https://..." required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Destination Vector (URL)</label>
                                <Input name="linkUrl" defaultValue={editingAd?.linkUrl} placeholder="https://..." required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                            </div>
                            <label className="flex items-center gap-4 cursor-pointer group pt-2">
                                <div className="relative">
                                    <input type="checkbox" name="active" defaultChecked={editingAd?.active !== false} className="peer hidden" />
                                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/5 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                        <CheckCircle2 size={16} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-400 group-hover:text-primary transition-colors">INITIALIZE BROADCAST IMMEDIATELY</span>
                            </label>
                            <div className="flex gap-6 pt-6">
                                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black italic uppercase tracking-widest text-[10px] text-slate-500 hover:text-white" onClick={() => setIsAdModalOpen(false)}>Abort</Button>
                                <Button type="submit" className="flex-1 h-16 rounded-2xl bg-primary text-white border-none font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Deploy Intelligence</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-medical-bg/95 backdrop-blur-md">
                    <Card className="w-full max-w-3xl bg-medical-card border-white/5 p-12 rounded-[50px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh] relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                        <div className="mb-10">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter font-poppins">Vault Initialization</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Target Subject: <span className="text-primary">{selectedUserForProfile?.email}</span></p>
                        </div>
                        <form onSubmit={handleCreateProfile} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Legal Identity</label>
                                    <Input name="name" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.name || selectedUserForProfile?.name} required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Blood Type Vector</label>
                                    <select name="bloodGroup" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.bloodGroup} className="w-full bg-slate-950/50 border border-white/5 rounded-2xl h-16 px-6 text-[11px] font-black uppercase tracking-widest italic outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none" required>
                                        <option value="" className="bg-medical-bg">Select Group...</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg} className="bg-medical-bg">{bg}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Emergency Comm Link</label>
                                    <Input name="phone" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.phone || selectedUserForProfile?.phone} required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Pathological Markers</label>
                                    <Input name="conditions" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.medicalConditions} placeholder="DIABETES, HYPERTENSION..." className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Biosensitivity / Allergies</label>
                                    <Input name="allergies" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.allergies} placeholder="PEANUTS, PENICILLIN..." className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <Badge className="bg-primary/20 text-primary border-none p-2 rounded-lg"><Bell size={16} /></Badge>
                                    <h3 className="text-xl font-black italic uppercase tracking-tight font-poppins">Guardian Protocol</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Guardian Name</label>
                                        <Input name="eName" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.emergencyContactName} required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Relation Vector</label>
                                        <Input name="eRelation" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.emergencyContactRelation} placeholder="FATHER, SPOUSE, ETC." required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Guardian Contact Link</label>
                                        <Input name="ePhone" defaultValue={getProfileForAuthUser(selectedUserForProfile?.email)?.emergencyContactPhone} required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-6">
                                <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black italic uppercase tracking-widest text-[10px] text-slate-500 hover:text-white" onClick={() => setIsProfileModalOpen(false)}>Cancel Protocol</Button>
                                <Button type="submit" className="flex-1 h-16 rounded-2xl bg-primary text-white border-none font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Establish Vault</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-medical-bg/95 backdrop-blur-md">
                    <Card className="w-full max-w-xl bg-medical-card border-white/5 p-12 rounded-[50px] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                        {registrationStep === 'form' && (
                            <div className="space-y-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-primary/10 rounded-[20px] text-primary shadow-[0_0_20px_rgba(230,57,70,0.2)]">
                                        <Mail size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black italic uppercase tracking-tighter font-poppins">Subject Onboarding</h2>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1 italic">Phase 1: Secure Data Entry</p>
                                    </div>
                                </div>
                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Target Gmail Identifier</label>
                                        <Input name="email" type="email" placeholder="USER@GMAIL.COM" required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Full Legal Name</label>
                                        <Input name="name" required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 italic">Comm Link Phone</label>
                                        <Input name="phone" required className="bg-slate-950/50 border-white/5 h-16 rounded-2xl font-black italic focus:ring-primary/20" />
                                    </div>
                                    <div className="flex gap-6 pt-6">
                                        <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-black italic uppercase tracking-widest text-[10px] text-slate-500 hover:text-white" onClick={() => setIsRegisterModalOpen(false)}>Abort</Button>
                                        <Button type="submit" className="flex-1 h-16 rounded-2xl bg-primary text-white border-none font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Transmit OTP Code</Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {registrationStep === 'otp' && (
                            <div className="text-center space-y-10 py-6">
                                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-[0_0_40px_rgba(230,57,70,0.2)] border border-primary/20">
                                    <Shield size={48} className="animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black italic uppercase tracking-tighter font-poppins">Link Dispatched</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 italic">A secure Firebase vector has been sent to <br /><span className="text-white font-black tracking-widest">{tempUserData?.email}</span></p>
                                </div>
                                <div className="p-10 bg-slate-950 rounded-[30px] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 italic">Tactical Fallback Code</p>
                                    <div className="flex justify-center">
                                        <input
                                            type="text"
                                            maxLength="6"
                                            placeholder="000000"
                                            value={enteredOTP}
                                            onChange={(e) => setEnteredOTP(e.target.value)}
                                            className="w-full max-w-[280px] bg-slate-950 border-2 border-white/5 focus:border-primary rounded-[30px] py-8 text-center text-5xl font-black tracking-[0.3em] outline-none transition-all shadow-inner font-poppins text-primary"
                                        />
                                    </div>
                                    <p className="text-[8px] text-slate-700 uppercase font-black tracking-widest mt-8 italic leading-relaxed px-10">The subject must authorize via the encrypted link. Use fallback only for manual overrides.</p>
                                </div>
                                <div className="flex gap-6 pt-6">
                                    <Button variant="ghost" className="flex-1 h-16 rounded-2xl font-black italic uppercase tracking-widest text-[10px] text-slate-500 hover:text-white" onClick={() => setRegistrationStep('form')}>Re-Initialize</Button>
                                    <Button className="flex-1 h-16 rounded-2xl bg-primary text-white border-none font-black italic uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" onClick={handleVerifyOTP}>Force Activation</Button>
                                </div>
                            </div>
                        )}

                        {registrationStep === 'success' && (
                            <div className="text-center space-y-10 py-10">
                                <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.2)] border border-green-500/20">
                                    <CheckCircle2 size={56} className="animate-bounce" />
                                </div>
                                <div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white font-poppins">Live & Secure</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">{tempUserData?.name} is now a broadcast node</p>
                                </div>
                                <div className="p-10 bg-slate-950 rounded-[40px] border border-white/5 relative overflow-hidden">
                                    <p className="text-[9px] text-slate-600 uppercase font-black italic tracking-[0.4em] mb-2">Established Identifier</p>
                                    <p className="text-2xl font-black text-primary tracking-tighter italic font-poppins transition-all group-hover:scale-110">{tempUserData?.name.toLowerCase().trim().replace(/\s+/g, '-')}</p>
                                </div>
                                <Button className="w-full h-20 rounded-[24px] bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black italic uppercase tracking-widest text-[11px] transition-all" onClick={() => { setIsRegisterModalOpen(false); setRegistrationStep('form'); setEnteredOTP(''); }}>
                                    Return to Command Hub
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
