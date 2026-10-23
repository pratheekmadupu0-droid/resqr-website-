import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Shield, ShieldCheck, ShieldAlert, AlertTriangle, Phone, MapPin, 
    Siren, Navigation, ArrowLeft, Loader2, CheckCircle2, User,
    Droplet, Lock, Activity, Eye, FileText, Calendar, Building2,
    Clock, ExternalLink
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import { fetchAdminEmergencyProfile, verifyAdminStatus, ADMIN_EMAILS } from '../lib/adminApi';
import { 
    getRegistrationStatusBadge, 
    getPaymentStatusBadge, 
    getServiceStatusBadge, 
    getEmergencyProfileStatusBadge 
} from '../lib/subscriptionConfig';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

export default function AdminEmergencyProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();

    // Authentication & Authorization states (Section 11)
    const [adminLoading, setAdminLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
    const [currentAdminUser, setCurrentAdminUser] = useState(null);

    // Profile & Tab states
    const [profileLoading, setProfileLoading] = useState(false);
    const [emergencyProfile, setEmergencyProfile] = useState(null);
    const [inactiveError, setInactiveError] = useState(null);
    const [activeSection, setActiveSection] = useState('emergency'); // 'emergency' | 'medical' | 'insurance' | 'qr' | 'subscription' | 'logs'
    const [auditLogs, setAuditLogs] = useState([]);
    const [gpsLocation, setGpsLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // 1. Check Admin Authentication & Role Authorization (Strict Zero-Face-Scan)
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                // Check if active session role is stored
                const storedRole = localStorage.getItem('resqr_active_role');
                if (storedRole === 'admin') {
                    setIsAuthenticated(true);
                    setIsAuthorizedAdmin(true);
                    setCurrentAdminUser({ email: 'admin@resqr.co.in', uid: 'admin_session' });
                } else {
                    setIsAuthenticated(false);
                    setIsAuthorizedAdmin(false);
                }
                setAdminLoading(false);
                return;
            }

            setIsAuthenticated(true);
            setCurrentAdminUser(user);

            const hasAdminRole = await verifyAdminStatus(user);
            setIsAuthorizedAdmin(hasAdminRole);
            setAdminLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. Fetch Sanitized Emergency Profile once Admin Authorization is confirmed
    useEffect(() => {
        if (!isAuthorizedAdmin || !userId) return;

        let isMounted = true;
        const loadProfile = async () => {
            setProfileLoading(true);
            setInactiveError(null);
            try {
                const profile = await fetchAdminEmergencyProfile(userId);
                if (isMounted) {
                    setEmergencyProfile(profile);
                }
            } catch (err) {
                console.error("Failed to load admin emergency profile:", err);
                if (isMounted) {
                    if (err.code === "FORBIDDEN_NOT_ADMIN") {
                        setIsAuthorizedAdmin(false);
                    } else if (err.code === "EMERGENCY_PROFILE_INACTIVE") {
                        setInactiveError({
                            message: err.message,
                            lifecycle: err.lifecycle || {}
                        });
                    } else {
                        toast.error(err.message || "Could not retrieve emergency profile.");
                    }
                }
            } finally {
                if (isMounted) {
                    setProfileLoading(false);
                }
            }
        };

        loadProfile();

        // Load audit logs for this user
        const unsubLogs = onValue(ref(db, 'auditLogs/emergencyProfileViews'), (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                const list = Object.values(data).filter(log => log && log.targetUserId === userId);
                list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                if (isMounted) setAuditLogs(list);
            }
        });

        return () => {
            isMounted = false;
            unsubLogs();
        };
    }, [isAuthorizedAdmin, userId]);

    // Section 10: Explicit Emergency Actions
    const handleSendLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setGpsLocation(loc);
                setIsLocating(false);
                toast.success("Current GPS location acquired.");

                const phone = emergencyProfile?.emergencyContact?.phone?.replace(/[^0-9+]/g, '');
                if (phone) {
                    const mapsUrl = `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
                    const msg = encodeURIComponent(`RESQR EMERGENCY ALERT: Current GPS location for ${emergencyProfile?.name || 'Citizen'}: ${mapsUrl}`);
                    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                } else {
                    window.open(`https://maps.google.com/?q=${loc.lat},${loc.lng}`, '_blank');
                }
            },
            (err) => {
                console.error("GPS location error:", err);
                toast.error("Unable to retrieve device GPS coordinates.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleNearestHospital = () => {
        const query = gpsLocation 
            ? `emergency hospital near ${gpsLocation.lat},${gpsLocation.lng}` 
            : 'emergency hospital near me';
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
    };

    // ----------------------------------------------------
    // FRONTEND STATE HANDLING (Requirement 11)
    // ----------------------------------------------------

    // 1. Loading State
    if (adminLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-manrope">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 animate-pulse">
                    <ShieldCheck size={36} />
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-wider font-poppins">Verifying Admin Credentials</h2>
                <p className="text-xs text-slate-400 mt-2 font-medium">Validating administrative clearance and security context...</p>
                <Loader2 className="animate-spin text-primary mt-6" size={24} />
            </div>
        );
    }

    // 2. Unauthenticated State
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-manrope">
                <Card className="max-w-md w-full bg-slate-900 border-white/10 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">Admin Authentication Required</h2>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            You must be authenticated as a system administrator to view emergency dossiers.
                        </p>
                    </div>
                    <Button 
                        onClick={() => navigate('/admin')}
                        className="w-full py-4 bg-primary text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-primary/20"
                    >
                        Go to Admin Login
                    </Button>
                </Card>
            </div>
        );
    }

    // 3. Unauthorized State (Logged in user is not an Admin)
    if (!isAuthorizedAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-manrope">
                <Card className="max-w-md w-full bg-slate-900 border-red-500/20 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest mb-3">
                            403 FORBIDDEN
                        </Badge>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">Access Denied</h2>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Your authenticated account (<span className="text-white font-bold">{currentAdminUser?.email || 'User'}</span>) does not possess administrator clearance.
                        </p>
                    </div>
                    <Button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-xl border border-white/10"
                    >
                        Return to Citizen Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // 3.5. Inactive Emergency Profile State (Requirement 11 & Requirement 18)
    if (inactiveError) {
        const lc = inactiveError.lifecycle || {};
        const regBadge = getRegistrationStatusBadge(lc.registrationStatus);
        const payBadge = getPaymentStatusBadge(lc.paymentStatus);
        const srvBadge = getServiceStatusBadge(lc.serviceStatus);
        const profBadge = getEmergencyProfileStatusBadge(lc.emergencyProfileStatus);

        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-manrope">
                <Card className="max-w-xl w-full bg-slate-900 border-amber-500/20 p-8 md:p-10 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
                    
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                        <AlertTriangle size={32} />
                    </div>

                    <div>
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest mb-3">
                            403 · EMERGENCY PROFILE NOT ACTIVE
                        </Badge>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                            Emergency Profile Inaccessible
                        </h2>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
                            {inactiveError.message || "An Emergency Profile is created and displayed ONLY for users who have completed registration and verified payment."}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">User ID: {userId}</p>
                    </div>

                    {/* Lifecycle Status Matrix */}
                    <div className="grid grid-cols-2 gap-3 text-left p-4 rounded-2xl bg-slate-950/80 border border-white/5">
                        <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Registration</span>
                            <div>
                                <Badge className={`${regBadge.className} text-[8px] font-black uppercase`}>
                                    {regBadge.label}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Payment</span>
                            <div>
                                <Badge className={`${payBadge.className} text-[8px] font-black uppercase`}>
                                    {payBadge.label}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Service Status</span>
                            <div>
                                <Badge className={`${srvBadge.className} text-[8px] font-black uppercase`}>
                                    {srvBadge.label}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">Profile Status</span>
                            <div>
                                <Badge className={`${profBadge.className} text-[8px] font-black uppercase`}>
                                    {profBadge.label}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left">
                        <p className="text-[11px] font-bold text-blue-300">
                            Operational Policy:
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Emergency Profiles contain critical medical and responder dispatch directives. They are provisioned only when the RESQR subscription is active and verified. Unpaid or incomplete accounts do not have active emergency dossiers.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <Button 
                            onClick={() => navigate('/admin')}
                            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-primary/20"
                        >
                            Return to Admin Console
                        </Button>
                        <Button 
                            onClick={() => {
                                navigator.clipboard.writeText(userId);
                                toast.success("User ID copied to clipboard");
                            }}
                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-xl border border-white/10"
                        >
                            Copy User ID
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // 4. Authorized Admin Emergency Profile View (NO FACIAL VERIFICATION REQUIRED)
    return (
        <div className="min-h-screen bg-slate-950 text-white font-manrope pb-24">
            {/* Top Navigation & Status Bar */}
            <div className="border-b border-white/5 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/admin" 
                            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft size={16} /> Admin Console
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black italic uppercase tracking-tight text-white font-poppins">Emergency Profile Inspector</span>
                                <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase tracking-widest">
                                    ADMIN CLEARANCE
                                </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">Target: {userId}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/5 text-[10px] text-slate-400">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span>Audit Logged: <strong className="text-white">{currentAdminUser?.email || 'Admin'}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
                {/* Profile Header Card */}
                {profileLoading ? (
                    <div className="p-16 text-center bg-slate-900/40 rounded-[32px] border border-white/5 space-y-4">
                        <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Retrieving sanitized profile...</p>
                    </div>
                ) : emergencyProfile ? (
                    <>
                        <div className="bg-medical-card border border-white/10 rounded-[36px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                            
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                {/* Profile Photo / Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-slate-800 border-2 border-white/10 flex items-center justify-center shadow-xl">
                                        {emergencyProfile.photo ? (
                                            <img 
                                                src={emergencyProfile.photo} 
                                                alt={emergencyProfile.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="text-slate-600 flex flex-col items-center">
                                                <User size={48} />
                                                <span className="text-[9px] font-black uppercase tracking-wider mt-1 text-slate-500">No Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Node
                                    </span>
                                </div>

                                {/* Identity & Critical Vitals */}
                                <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider">
                                            REGISTERED CITIZEN
                                        </Badge>
                                        <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[9px] font-mono">
                                            QR: {emergencyProfile.qrId}
                                        </Badge>
                                        {emergencyProfile.gender && (
                                            <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[9px] font-bold uppercase">
                                                {emergencyProfile.gender}
                                            </Badge>
                                        )}
                                        {emergencyProfile.age && (
                                            <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[9px] font-bold uppercase">
                                                {emergencyProfile.age} YRS
                                            </Badge>
                                        )}
                                    </div>

                                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white font-poppins truncate">
                                        {emergencyProfile.name}
                                    </h1>

                                    <p className="text-xs text-slate-400 font-medium">
                                        Emergency clearance authorized under Administrator Security Policy. Access directly enabled without requiring facial scan.
                                    </p>

                                    {/* Blood Group Highlight */}
                                    <div className="pt-2 flex items-center justify-center md:justify-start gap-4">
                                        <div className="px-5 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5">
                                            <Droplet size={18} className="text-red-500" />
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block leading-none">Blood Group</span>
                                                <span className="text-xl font-black italic text-red-400 font-poppins leading-tight">
                                                    {emergencyProfile.bloodGroup || '—'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-white/5 flex items-center gap-2.5">
                                            <Shield size={18} className="text-primary" />
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block leading-none">Subscription</span>
                                                <span className="text-xs font-black italic uppercase text-white font-poppins leading-tight">
                                                    {emergencyProfile.subscription?.planName || 'ACTIVE PLAN'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Details Section Tabs (Requirement 5) */}
                        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1 text-xs font-black uppercase tracking-wider">
                            <button
                                onClick={() => setActiveSection('emergency')}
                                className={`px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
                                    activeSection === 'emergency' 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-slate-400 hover:text-white bg-slate-900/60'
                                }`}
                            >
                                <Phone size={14} /> Emergency Profile
                            </button>
                            <button
                                onClick={() => setActiveSection('medical')}
                                className={`px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
                                    activeSection === 'medical' 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-slate-400 hover:text-white bg-slate-900/60'
                                }`}
                            >
                                <Activity size={14} /> Medical Profile
                            </button>
                            <button
                                onClick={() => setActiveSection('insurance')}
                                className={`px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
                                    activeSection === 'insurance' 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-slate-400 hover:text-white bg-slate-900/60'
                                }`}
                            >
                                <Building2 size={14} /> Insurance
                            </button>
                            <button
                                onClick={() => setActiveSection('qr')}
                                className={`px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
                                    activeSection === 'qr' 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-slate-400 hover:text-white bg-slate-900/60'
                                }`}
                            >
                                <Shield size={14} /> QR Information
                            </button>
                            <button
                                onClick={() => setActiveSection('subscription')}
                                className={`px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
                                    activeSection === 'subscription' 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-slate-400 hover:text-white bg-slate-900/60'
                                }`}
                            >
                                <Calendar size={14} /> Subscription
                            </button>
                            <button
                                onClick={() => setActiveSection('logs')}
                                className={`px-5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
                                    activeSection === 'logs' 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'text-slate-400 hover:text-white bg-slate-900/60'
                                }`}
                            >
                                <Clock size={14} /> Access Logs ({auditLogs.length})
                            </button>
                        </div>

                        {/* SECTION 1: EMERGENCY PROFILE (Requirement 4 & 9) */}
                        {activeSection === 'emergency' && (
                            <div className="space-y-6">
                                {/* Designated Emergency Contacts */}
                                <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-6 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black italic uppercase text-white font-poppins">Emergency Contacts</h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Primary & Kin Notification Matrix</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Primary Contact */}
                                        <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider">
                                                    PRIMARY KIN ({emergencyProfile.emergencyContact.relation})
                                                </Badge>
                                                <p className="text-base font-bold text-white uppercase">{emergencyProfile.emergencyContact.name}</p>
                                                <p className="text-xs font-mono text-slate-400">{emergencyProfile.emergencyContact.phone || 'No phone recorded'}</p>
                                            </div>
                                            {emergencyProfile.emergencyContact.phone && (
                                                <a 
                                                    href={`tel:${emergencyProfile.emergencyContact.phone.replace(/[^0-9+]/g, '')}`}
                                                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
                                                >
                                                    <Phone size={14} /> Call Kin
                                                </a>
                                            )}
                                        </div>

                                        {/* Secondary Contact (if available) */}
                                        {emergencyProfile.secondaryContact ? (
                                            <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black uppercase tracking-wider">
                                                        SECONDARY ({emergencyProfile.secondaryContact.relation || 'Contact'})
                                                    </Badge>
                                                    <p className="text-base font-bold text-white uppercase">{emergencyProfile.secondaryContact.name}</p>
                                                    <p className="text-xs font-mono text-slate-400">{emergencyProfile.secondaryContact.phone || '—'}</p>
                                                </div>
                                                {emergencyProfile.secondaryContact.phone && (
                                                    <a 
                                                        href={`tel:${emergencyProfile.secondaryContact.phone.replace(/[^0-9+]/g, '')}`}
                                                        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
                                                    >
                                                        <Phone size={14} /> Call
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-5 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                No secondary kin specified
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Critical Medical Alerts & Acute Warnings */}
                                <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-4 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black italic uppercase text-white font-poppins">Critical Emergency Alerts</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Severe allergies and acute trauma triage factors</p>
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/20 text-sm text-slate-200 leading-relaxed font-semibold">
                                        {emergencyProfile.criticalAlerts}
                                    </div>
                                </Card>

                                {/* Section 10: Explicit Admin Emergency Actions */}
                                <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-6 shadow-xl">
                                    <div>
                                        <h3 className="text-lg font-black italic uppercase text-white font-poppins">Emergency Tactical Actions</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Explicit Admin Initiated Actions (Not Automatically Triggered)</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <Button
                                            onClick={handleSendLocation}
                                            disabled={isLocating}
                                            className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            <Navigation size={18} />
                                            {isLocating ? 'Locating...' : 'Send Location'}
                                        </Button>

                                        <a
                                            href="tel:108"
                                            className="h-16 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black italic uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                                        >
                                            <Siren size={18} /> Call Ambulance (108)
                                        </a>

                                        <a
                                            href="tel:100"
                                            className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                                        >
                                            <Shield size={18} /> Call Police (100)
                                        </a>

                                        <Button
                                            onClick={handleNearestHospital}
                                            variant="outline"
                                            className="h-16 rounded-2xl border-white/10 hover:bg-white/5 text-white font-black italic uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                                        >
                                            <Building2 size={18} /> Nearest Hospital
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* SECTION 2: MEDICAL PROFILE (Requirement 5) */}
                        {activeSection === 'medical' && (
                            <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-6 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                                        <Activity size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black italic uppercase text-white font-poppins">Clinical Medical Vault</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Role-Based Hospital & Doctor Authorization Policy</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/20 space-y-3">
                                    <p className="text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Lock size={14} /> Controlled Healthcare Dossier
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        In compliance with RESQR Clinical Data Isolation protocols, sensitive clinical records (complete medical history, past surgeries, prescription dosages, and physician clinical notes) are strictly partitioned from the Emergency Profile and require authenticated Doctor/Hospital role credentials or clinical trauma override.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                                        <span className="text-[10px] font-black uppercase text-slate-500">Blood Group</span>
                                        <p className="text-white font-bold">{emergencyProfile.bloodGroup}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                                        <span className="text-[10px] font-black uppercase text-slate-500">Triage Allergies</span>
                                        <p className="text-white font-bold">{emergencyProfile.criticalAlerts}</p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* SECTION 3: INSURANCE (Requirement 5) */}
                        {activeSection === 'insurance' && (
                            <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-6 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black italic uppercase text-white font-poppins">Insurance & Cashless Cover</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Designated Hospital TPA Verification</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 text-xs text-slate-400 space-y-2">
                                    <p className="text-white font-bold">Confidential Policy Records Protected</p>
                                    <p className="leading-relaxed">
                                        Insurance policy numbers, cashless claim limits, and financial documents are isolated and accessible only upon verified hospital admission check-in.
                                    </p>
                                </div>
                            </Card>
                        )}

                        {/* SECTION 4: QR INFORMATION */}
                        {activeSection === 'qr' && (
                            <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-6 shadow-xl">
                                <div>
                                    <h3 className="text-lg font-black italic uppercase text-white font-poppins">QR Token Architecture</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Public Token & Routing Node</p>
                                </div>
                                <div className="space-y-3 font-mono text-xs">
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                                        <span className="text-slate-500 uppercase">Public QR Identifier:</span>
                                        <span className="text-primary font-bold">{emergencyProfile.qrId}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                                        <span className="text-slate-500 uppercase">Public Scan Link:</span>
                                        <span className="text-white font-bold">/e/{emergencyProfile.qrId}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 flex justify-between items-center">
                                        <span className="text-slate-500 uppercase">Security Gate:</span>
                                        <span className="text-emerald-400 font-bold">1:1 Biometric Verification Mandatory for Public</span>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* SECTION 5: SUBSCRIPTION */}
                        {activeSection === 'subscription' && (
                            <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-6 shadow-xl">
                                <div>
                                    <h3 className="text-lg font-black italic uppercase text-white font-poppins">Active Subscription Plan</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Validity and QR Dispatch Status</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                                        <span className="text-[9px] uppercase text-slate-500 font-sans">Status</span>
                                        <p className="text-emerald-400 font-bold text-sm">{emergencyProfile.subscription?.status || 'ACTIVE'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                                        <span className="text-[9px] uppercase text-slate-500 font-sans">Plan Name</span>
                                        <p className="text-white font-bold text-sm">{emergencyProfile.subscription?.planName || 'Standard'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                                        <span className="text-[9px] uppercase text-slate-500 font-sans">Expires At</span>
                                        <p className="text-white font-bold text-sm">
                                            {emergencyProfile.subscription?.expiresAt ? new Date(emergencyProfile.subscription.expiresAt).toLocaleDateString() : 'Active Continuous'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* SECTION 6: ACCESS AUDIT LOGS (Requirement 8) */}
                        {activeSection === 'logs' && (
                            <Card className="p-8 bg-medical-card border-white/5 rounded-[32px] space-y-6 shadow-xl">
                                <div>
                                    <h3 className="text-lg font-black italic uppercase text-white font-poppins">Immutable Access Trail</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chronological Log of Administrative Profile Inspections</p>
                                </div>

                                {auditLogs.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-white/5 text-xs text-slate-500">
                                        Current session logged. Historical log syncing with database.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {auditLogs.map((log, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase">
                                                            {log.action} · {log.result}
                                                        </Badge>
                                                        <span className="text-white font-bold font-mono">{log.adminEmail}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500">Admin ID: {log.adminId} {log.ip ? `· IP: ${log.ip}` : ''}</p>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        )}
                    </>
                ) : (
                    <div className="p-16 text-center bg-slate-900/40 rounded-[32px] border border-white/5 space-y-4">
                        <AlertTriangle className="text-amber-500 mx-auto" size={32} />
                        <h3 className="text-xl font-bold uppercase italic text-white">Profile Not Found</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            The emergency profile for user ID "{userId}" could not be located in the database.
                        </p>
                        <Button onClick={() => navigate('/admin')} className="bg-white/10 text-white text-xs">
                            Return to Admin Panel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
