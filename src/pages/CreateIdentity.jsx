import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Users, Baby, Heart, ArrowLeft, ArrowRight, Upload, Camera, 
    Plus, Trash2, Check, CheckCircle2, Shield, ShieldCheck, Loader2, Sparkles, Eye
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { db, auth } from '../lib/firebase';
import { ref, get, update, set } from 'firebase/database';
import toast from 'react-hot-toast';
import { extractFeatures } from '../lib/cvHelper';
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

export default function CreateIdentity() {
    const navigate = useNavigate();
    const [authLoading, setAuthLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Primary profile backup for "Myself" autofill
    const [primaryProfile, setPrimaryProfile] = useState(null);

    // Flow states
    const [selectedType, setSelectedType] = useState(null); // null, 'myself', 'family', 'child', 'friend'
    const [wizardStep, setWizardStep] = useState(1); // 1: Personal, 2: Medical, 3: Payment

    // Form states
    const [citizenProfilePhoto, setCitizenProfilePhoto] = useState('');
    const [citizenName, setCitizenName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [citizenEmail, setCitizenEmail] = useState('');
    const [citizenDob, setCitizenDob] = useState('');
    const [citizenGender, setCitizenGender] = useState('');
    const [chosenUsername, setChosenUsername] = useState('');

    // Dynamic type-specific fields
    const [relationshipToUser, setRelationshipToUser] = useState(''); // Mother, Father, Friend, Gym Partner etc.
    const [schoolName, setSchoolName] = useState('');
    const [gradeClass, setGradeClass] = useState('');
    
    // Address Details
    const [citizenAddress, setCitizenAddress] = useState({
        houseNo: '',
        street: '',
        area: '',
        city: '',
        district: '',
        state: '',
        pincode: ''
    });

    // Emergency Contacts
    const [emergencyContacts, setEmergencyContacts] = useState([
        { name: '', relationship: '', phone: '' }
    ]);

    // Family Doctor
    const [familyDoctor, setFamilyDoctor] = useState({
        name: '',
        hospital: '',
        phone: ''
    });

    // Medical details
    const [bloodGroup, setBloodGroup] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [allergies, setAllergies] = useState('');
    const [currentMedication, setCurrentMedication] = useState('');
    const [previousSurgeries, setPreviousSurgeries] = useState('');
    const [medicalId, setMedicalId] = useState('');
    const [isOrganDonor, setIsOrganDonor] = useState(false);
    const [emergencyNotes, setEmergencyNotes] = useState('');

    // Payment & package states
    const [selectedPackage, setSelectedPackage] = useState('digital');
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);

    // Initial auth & fetch primary profile
    useEffect(() => {
        const checkUser = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                toast.error("Please login to create an identity.");
                navigate('/login');
            } else {
                setCheckingAuth(false);
                // Fetch user profiles to find primary profile
                try {
                    const profilesRef = ref(db, `users/${user.uid}/profiles`);
                    const snapshot = await get(profilesRef);
                    if (snapshot.exists()) {
                        const profilesData = snapshot.val();
                        // Find first profile without an identityType (meaning primary profile)
                        const primary = Object.values(profilesData).find(p => !p.identityType) || Object.values(profilesData)[0];
                        if (primary) {
                            setPrimaryProfile(primary);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching primary profile:", err);
                }
            }
        });
        return () => checkUser();
    }, [navigate]);

    // Populate or reset form fields based on selected identity type
    useEffect(() => {
        if (selectedType === 'myself' && primaryProfile) {
            setCitizenName(primaryProfile.name || '');
            setPhoneNumber(primaryProfile.phone || '');
            setCitizenEmail(primaryProfile.email || '');
            setCitizenDob(primaryProfile.dob || '');
            setCitizenGender(primaryProfile.gender || '');
            setCitizenProfilePhoto(primaryProfile.profilePhoto || '');
            if (primaryProfile.address) {
                setCitizenAddress({
                    houseNo: primaryProfile.address.houseNo || '',
                    street: primaryProfile.address.street || '',
                    area: primaryProfile.address.area || '',
                    city: primaryProfile.address.city || '',
                    district: primaryProfile.address.district || '',
                    state: primaryProfile.address.state || '',
                    pincode: primaryProfile.address.pincode || ''
                });
            }
            if (primaryProfile.emergencyContacts) {
                setEmergencyContacts(primaryProfile.emergencyContacts);
            } else if (primaryProfile.data?.emergencyContactName) {
                setEmergencyContacts([
                    {
                        name: primaryProfile.data.emergencyContactName,
                        relationship: primaryProfile.data.emergencyContactRelation || '',
                        phone: primaryProfile.data.emergencyContactPhone || ''
                    }
                ]);
            }
            if (primaryProfile.familyDoctor) {
                setFamilyDoctor({
                    name: primaryProfile.familyDoctor.name || '',
                    hospital: primaryProfile.familyDoctor.hospital || '',
                    phone: primaryProfile.familyDoctor.phone || ''
                });
            }
            // Medical details mapping
            if (primaryProfile.medical) {
                setBloodGroup(primaryProfile.medical.bloodGroup || '');
                setHeight(primaryProfile.medical.height || '');
                setWeight(primaryProfile.medical.weight || '');
                setMedicalConditions(primaryProfile.medical.medicalConditions || '');
                setAllergies(primaryProfile.medical.allergies || '');
                setCurrentMedication(primaryProfile.medical.currentMedication || '');
                setPreviousSurgeries(primaryProfile.medical.previousSurgeries || '');
                setMedicalId(primaryProfile.medical.medicalId || '');
                setIsOrganDonor(primaryProfile.medical.isOrganDonor || false);
                setEmergencyNotes(primaryProfile.medical.emergencyNotes || '');
            } else if (primaryProfile.data) {
                setBloodGroup(primaryProfile.data.bloodGroup || '');
                setHeight(primaryProfile.data.height || '');
                setWeight(primaryProfile.data.weight || '');
                setMedicalConditions(primaryProfile.data.healthIssues || '');
                setAllergies(primaryProfile.data.allergies || '');
                setCurrentMedication(primaryProfile.data.currentMedication || '');
                setPreviousSurgeries(primaryProfile.data.previousSurgeries || '');
                setMedicalId(primaryProfile.data.medicalId || '');
                setIsOrganDonor(primaryProfile.data.isOrganDonor || false);
                setEmergencyNotes(primaryProfile.data.emergencyNotes || '');
            }
            setRelationshipToUser('Self');
            setSchoolName('');
            setGradeClass('');
        } else {
            // Reset all values for a clean setup
            setCitizenName('');
            setPhoneNumber('');
            setCitizenEmail('');
            setCitizenDob('');
            setCitizenGender('');
            setCitizenProfilePhoto('');
            setCitizenAddress({
                houseNo: '',
                street: '',
                area: '',
                city: '',
                district: '',
                state: '',
                pincode: ''
            });
            setEmergencyContacts([{ name: '', relationship: '', phone: '' }]);
            setFamilyDoctor({ name: '', hospital: '', phone: '' });
            setBloodGroup('');
            setHeight('');
            setWeight('');
            setMedicalConditions('');
            setAllergies('');
            setCurrentMedication('');
            setPreviousSurgeries('');
            setMedicalId('');
            setIsOrganDonor(false);
            setEmergencyNotes('');
            setSchoolName('');
            setGradeClass('');
            setRelationshipToUser('');
            setChosenUsername('');
        }
    }, [selectedType, primaryProfile]);

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

    const handleStep1Submit = async () => {
        if (!citizenName || !citizenDob || !citizenGender || !citizenAddress.city || !citizenAddress.pincode || !chosenUsername) {
            toast.error("Please fill all mandatory personal & address details, including a username.");
            return;
        }

        // Child node validations
        if (selectedType === 'child') {
            if (!schoolName || !gradeClass) {
                toast.error("Please specify school/college name and grade/class.");
                return;
            }
            // Age validation (under 17)
            const dobDate = new Date(citizenDob);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }
            if (age >= 17) {
                toast.error("Minor Node profiles must be under 17 years of age.");
                return;
            }
        }

        // Family / Friend node validations
        if ((selectedType === 'family' || selectedType === 'friend') && !relationshipToUser) {
            toast.error("Please enter the relationship/companion detail.");
            return;
        }

        const cleanUser = chosenUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanUser.length < 3) {
            toast.error("Username must be at least 3 characters long.");
            return;
        }

        const t = toast.loading("Checking username availability...");
        try {
            const regRef = ref(db, `usernames/${cleanUser}`);
            const existing = await get(regRef);
            if (existing.exists()) {
                toast.error("Username already taken. Please choose another one.", { id: t });
                return;
            }
            toast.success("Username available!", { id: t });
            setWizardStep(2);
        } catch (e) {
            console.error("Username check error:", e);
            toast.error("Error validating username", { id: t });
        }
    };

    const handleStep2Submit = () => {
        if (!bloodGroup) {
            toast.error("Please specify a blood group.");
            return;
        }
        setWizardStep(3);
    };

    const handleCreateIdentitySubmit = async (paymentId) => {
        setAuthLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Authentication context lost.");

            const uid = currentUser.uid;
            // Generate unique profile key
            const uniqueKey = Math.random().toString(36).substr(2, 9);
            const profileId = `c_${uid}_${uniqueKey}`;

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

            const firstEmergencyContact = emergencyContacts && emergencyContacts.length > 0 
                ? emergencyContacts[0] 
                : { name: '', relationship: '', phone: '' };

            const profileData = {
                id: profileId,
                role: 'citizen',
                identityType: selectedType,
                username: chosenUsername.toLowerCase(),
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
                relationshipToUser: relationshipToUser || '',
                schoolName: schoolName || '',
                gradeClass: gradeClass || '',
                medical: {
                    bloodGroup, height, weight, medicalConditions, allergies,
                    currentMedication, previousSurgeries, isOrganDonor, emergencyNotes, medicalId
                },
                data: {
                    name: citizenName,
                    bloodGroup: bloodGroup,
                    healthIssues: medicalConditions,
                    allergies: allergies,
                    emergencyContactName: firstEmergencyContact.name,
                    emergencyContactRelation: firstEmergencyContact.relationship || firstEmergencyContact.relation || '',
                    emergencyContactPhone: firstEmergencyContact.phone,
                    phone: phoneNumber,
                    email: citizenEmail,
                    dob: citizenDob,
                    gender: citizenGender,
                    height: height,
                    weight: weight,
                    currentMedication: currentMedication,
                    previousSurgeries: previousSurgeries,
                    isOrganDonor: isOrganDonor,
                    emergencyNotes: emergencyNotes,
                    medicalId: medicalId,
                    relationshipToUser: relationshipToUser || '',
                    schoolName: schoolName || '',
                    gradeClass: gradeClass || ''
                },
                qrPackage: {
                    type: selectedPackage,
                    price: selectedPackage === 'digital' ? 99 : 149,
                    paymentStatus: 'paid'
                },
                payment_status: 'paid',
                payment_id: paymentId || "expansion_pay_" + Math.random().toString(36).substr(2, 9),
                payment_date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                uid: uid
            };

            // Save to DB
            const updates = {};
            updates[`users/${uid}/profiles/${profileId}`] = profileData;
            updates[`profiles/${profileId}`] = profileData;
            updates[`usernames/${chosenUsername.toLowerCase()}`] = `${uid}/profiles/${profileId}`;

            await update(ref(db), updates);
            toast.success("New Identity Vault Generated!");
            
            // Set newly created profile as active
            localStorage.setItem('resqr_active_slug', profileId);
            navigate('/dashboard');
        } catch (error) {
            console.error("Error creating identity profile:", error);
            toast.error("Generation failed: " + error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-[#040812] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="text-primary animate-spin" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse italic">
                        Authorizing Security Vault...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#040812] flex items-center justify-center p-6 font-manrope selection:bg-primary/30">
            <div className="w-full max-w-5xl py-12">
                {/* Header branding */}
                <div className="text-center mb-12">
                    <Link to="/dashboard" className="inline-block relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR Logo" className="relative h-16 w-auto animate-pulse" />
                    </Link>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.25em] text-[10px] italic mt-4">
                        Secure Multi-Identity Vault Expansion
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {/* Identity Type Selection Screen */}
                    {selectedType === null && (
                        <motion.div 
                            key="type_select"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-3">
                                <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none font-poppins">
                                    ADD NEW <span className="text-primary italic-display">IDENTITY BLOCK</span>
                                </h1>
                                <p className="text-slate-400 max-w-md mx-auto text-xs font-black uppercase tracking-[0.2em]">
                                    Select the node role you wish to configure
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Option 1: Myself */}
                                <Card 
                                    onClick={() => setSelectedType('myself')}
                                    className="p-8 bg-slate-900/40 border-white/5 hover:border-primary/30 hover:shadow-[0_15px_40px_rgba(230,57,70,0.12)] transition-all duration-300 rounded-[35px] cursor-pointer backdrop-blur-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/10 group-hover:scale-105 transition-transform">
                                            <User size={30} />
                                        </div>
                                        <div>
                                            <span className="inline-block text-[9px] font-black tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full italic mb-2">
                                                Self Node
                                            </span>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                                Myself
                                            </h3>
                                            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                                Autofills your account details. Create another secondary medical profile or vehicle/helmet QR tag for yourself.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Option 2: Family */}
                                <Card 
                                    onClick={() => setSelectedType('family')}
                                    className="p-8 bg-slate-900/40 border-white/5 hover:border-blue-500/30 hover:shadow-[0_15px_40px_rgba(59,130,246,0.12)] transition-all duration-300 rounded-[35px] cursor-pointer backdrop-blur-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-blue-500/5 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/10 group-hover:scale-105 transition-transform">
                                            <Users size={30} />
                                        </div>
                                        <div>
                                            <span className="inline-block text-[9px] font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full italic mb-2">
                                                Relative Node
                                            </span>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                                Family Member
                                            </h3>
                                            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                                Register emergency health profile for parents, spouse, or siblings. Specify relationship node.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Option 3: Child */}
                                <Card 
                                    onClick={() => setSelectedType('child')}
                                    className="p-8 bg-slate-900/40 border-white/5 hover:border-purple-500/30 hover:shadow-[0_15px_40px_rgba(168,85,247,0.12)] transition-all duration-300 rounded-[35px] cursor-pointer backdrop-blur-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-purple-500/5 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/10 group-hover:scale-105 transition-transform">
                                            <Baby size={30} />
                                        </div>
                                        <div>
                                            <span className="inline-block text-[9px] font-black tracking-widest text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full italic mb-2">
                                                Minor Node
                                            </span>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                                Children
                                            </h3>
                                            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                                Setup safety stickers for kids under 17. Configure school/institution and class parameters.
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Option 4: Friend */}
                                <Card 
                                    onClick={() => setSelectedType('friend')}
                                    className="p-8 bg-slate-900/40 border-white/5 hover:border-emerald-500/30 hover:shadow-[0_15px_40px_rgba(16,185,129,0.12)] transition-all duration-300 rounded-[35px] cursor-pointer backdrop-blur-md relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform">
                                            <Heart size={30} />
                                        </div>
                                        <div>
                                            <span className="inline-block text-[9px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full italic mb-2">
                                                Companion Node
                                            </span>
                                            <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                                Friends
                                            </h3>
                                            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                                Link companions or travel mates. Customize companion type parameters (e.g. Gym Buddy, Colleague).
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="flex justify-center">
                                <Button 
                                    onClick={() => navigate('/dashboard')}
                                    variant="outline" 
                                    className="px-8 py-4 rounded-xl border-white/10 text-slate-400 hover:text-white"
                                >
                                    <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step-by-Step Registration Form */}
                    {selectedType !== null && (
                        <motion.div 
                            key="registration_wizard"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="max-w-3xl mx-auto"
                        >
                            <Card className="p-10 bg-slate-900/80 border-white/5 shadow-2xl rounded-[40px] relative overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95">
                                <button 
                                    onClick={() => { setSelectedType(null); setWizardStep(1); }} 
                                    className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest italic"
                                >
                                    <ArrowLeft size={14} /> Change Identity Type
                                </button>

                                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                                    <div>
                                        <Badge className="bg-primary/20 text-primary border-none px-4 py-1 font-black italic tracking-widest text-[9px] mb-2">
                                            {selectedType} IDENTITY NODE
                                        </Badge>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                            Step {wizardStep} of 3: {wizardStep === 1 ? 'Personal Details' : wizardStep === 2 ? 'Medical Vault' : 'Secure Checkout'}
                                        </h2>
                                    </div>
                                    <span className="text-xl font-black italic text-primary font-poppins">{Math.round((wizardStep / 3) * 100)}% Completed</span>
                                </div>

                                {/* Step 1: Personal Details */}
                                {wizardStep === 1 && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        
                                        {/* Dynamic Relationship Field for Family Members */}
                                        {selectedType === 'family' && (
                                            <div className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl space-y-2">
                                                <Select 
                                                    label="Relationship to Primary Owner" 
                                                    value={relationshipToUser} 
                                                    onChange={(e) => setRelationshipToUser(e.target.value)} 
                                                    required
                                                    options={[
                                                        { label: 'Select Relationship', value: '' },
                                                        { label: 'Father', value: 'Father' },
                                                        { label: 'Mother', value: 'Mother' },
                                                        { label: 'Brother', value: 'Brother' },
                                                        { label: 'Sister', value: 'Sister' },
                                                        { label: 'Spouse (Husband/Wife)', value: 'Spouse' },
                                                        { label: 'Son', value: 'Son' },
                                                        { label: 'Daughter', value: 'Daughter' },
                                                        { label: 'Other Relative', value: 'Other' }
                                                    ]} 
                                                />
                                            </div>
                                        )}

                                        {/* Dynamic Companion Field for Friends */}
                                        {selectedType === 'friend' && (
                                            <div className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl space-y-2">
                                                <Input 
                                                    label="Friendship / Companion Type" 
                                                    placeholder="e.g. Travel Buddy, Gym Partner, Roommate, Colleague" 
                                                    value={relationshipToUser} 
                                                    onChange={(e) => setRelationshipToUser(e.target.value)} 
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-col md:flex-row gap-8 items-center border-b border-white/5 pb-8 mb-6">
                                            <div className="relative group">
                                                {citizenProfilePhoto ? (
                                                    <img src={citizenProfilePhoto} alt="Preview" className="w-28 h-28 object-cover rounded-3xl border-2 border-primary shadow-lg" />
                                                ) : (
                                                    <div className="w-28 h-28 bg-slate-950 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500 group-hover:border-primary/50 transition-colors">
                                                        <Camera size={24} />
                                                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Photo</span>
                                                    </div>
                                                )}
                                                <label className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 p-2 rounded-xl text-white cursor-pointer shadow-lg">
                                                    <Upload size={14} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setCitizenProfilePhoto)} />
                                                </label>
                                            </div>
                                            <div className="flex-1 w-full space-y-4">
                                                <Input label="Full Name" placeholder="e.g. Jane Doe" value={citizenName} onChange={(e) => setCitizenName(e.target.value)} required />
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
                                                <div className="space-y-1">
                                                    <Input 
                                                        label="Choose Unique Link ID / Username" 
                                                        placeholder="e.g. janedoe" 
                                                        value={chosenUsername} 
                                                        onChange={(e) => setChosenUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} 
                                                        required 
                                                    />
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1 italic">
                                                        Emergency lookup url: <span className="text-primary italic lowercase">resqr.co.in/{chosenUsername || 'username'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input 
                                                label={selectedType === 'child' ? "Date of Birth (Must be under 17)" : "Date of Birth"} 
                                                type="date" 
                                                value={citizenDob} 
                                                onChange={(e) => setCitizenDob(e.target.value)} 
                                                required 
                                            />
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

                                        {/* Dynamic Institution & Schooling Fields for Children */}
                                        {selectedType === 'child' && (
                                            <div className="space-y-4 border-t border-white/5 pt-6 animate-in slide-in-from-top-4 duration-300">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Academic & Institution details</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input 
                                                        label="School / Institution Name" 
                                                        placeholder="e.g. Greenwood High School" 
                                                        value={schoolName} 
                                                        onChange={(e) => setSchoolName(e.target.value)} 
                                                        required 
                                                    />
                                                    <Input 
                                                        label="Standard / Grade / Class" 
                                                        placeholder="e.g. 7th Standard, Class 10" 
                                                        value={gradeClass} 
                                                        onChange={(e) => setGradeClass(e.target.value)} 
                                                        required 
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Address Details</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <Input label="House No." placeholder="123" value={citizenAddress.houseNo} onChange={(e) => setCitizenAddress({...citizenAddress, houseNo: e.target.value})} />
                                                <Input label="Street" placeholder="Main Rd" value={citizenAddress.street} onChange={(e) => setCitizenAddress({...citizenAddress, street: e.target.value})} />
                                                <Input label="Area" placeholder="Suburbs" value={citizenAddress.area} onChange={(e) => setCitizenAddress({...citizenAddress, area: e.target.value})} />
                                                <Input label="City" placeholder="City" value={citizenAddress.city} onChange={(e) => setCitizenAddress({...citizenAddress, city: e.target.value})} required />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input label="District" value={citizenAddress.district} onChange={(e) => setCitizenAddress({...citizenAddress, district: e.target.value})} />
                                                <Input label="State" value={citizenAddress.state} onChange={(e) => setCitizenAddress({...citizenAddress, state: e.target.value})} />
                                                <Input label="Pincode" maxLength="6" value={citizenAddress.pincode} onChange={(e) => setCitizenAddress({...citizenAddress, pincode: e.target.value.replace(/\D/g, '')})} required />
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
                                            <div className="pt-8 flex justify-end">
                                                <Button onClick={handleStep1Submit} className="py-4 px-8 bg-primary rounded-2xl font-black italic uppercase text-xs">
                                                    Continue to Medical details <ArrowRight size={16} className="ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Medical Passport */}
                                {wizardStep === 2 && (
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

                                        <Input label="Medical Conditions / Chronic Diseases" placeholder="e.g. Asthma, None" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} />
                                        <Input label="Allergies (Critical)" placeholder="e.g. Penicillin, Peanuts" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                                        <Input label="Current Medications" placeholder="e.g. Metformin 500mg" value={currentMedication} onChange={(e) => setCurrentMedication(e.target.value)} />
                                        <Input label="Previous Surgeries" placeholder="e.g. Appendectomy (2021)" value={previousSurgeries} onChange={(e) => setPreviousSurgeries(e.target.value)} />

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
                                                placeholder="Any crucial instruction for first responders (e.g. Asthma patient, carries inhaler)" 
                                                className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-semibold outline-none transition-all focus:border-primary placeholder:text-slate-700 h-28"
                                            />
                                        </div>

                                        <div className="pt-8 flex justify-between">
                                            <Button onClick={() => setWizardStep(1)} variant="outline" className="py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
                                                <ArrowLeft size={16} className="mr-2" /> Back
                                            </Button>
                                            <Button onClick={handleStep2Submit} className="py-4 px-8 bg-primary rounded-2xl font-black italic uppercase text-xs">
                                                Proceed to payment <ArrowRight size={16} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Payment Checkout */}
                                {wizardStep === 3 && (
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

                                        {/* Checkout Info */}
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
                                                <Button onClick={() => setWizardStep(2)} variant="outline" className="w-full sm:w-auto py-4 px-8 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-500 hover:text-white">
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
                                            </div>
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
                amount={selectedPackage === 'digital' ? 99 : 149}
                title={`RESQR ${selectedPackage === 'digital' ? 'Digital QR Tag' : 'Digital QR + 2 Stickers'}`}
                customerName={citizenName || 'RESQR Citizen'}
                customerEmail={citizenEmail || 'citizen@resqr.co.in'}
                customerPhone={phoneNumber || '9876543210'}
                onSuccess={(paymentInfo) => {
                    toast.success(`Payment verified! Payment ID: ${paymentInfo.razorpay_payment_id}`);
                    handleCreateIdentitySubmit(paymentInfo.razorpay_payment_id);
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
                    username: chosenUsername.toLowerCase()
                }}
                onProceedToPay={() => setIsRazorpayOpen(true)}
            />
        </div>
    );
}
