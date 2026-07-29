import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '../components/ui/Button';

// Dashboards
import CitizenDashboard from './DashboardCitizen';
import AgentDashboard from '../components/dashboard/AgentDashboard';
import HospitalDashboard from '../components/dashboard/HospitalDashboard';
import PendingVerification from '../components/dashboard/PendingVerification';

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            const uid = currentUser.uid;
            
            // Listen to changes in the user's role and status
            const userRef = ref(db, `users/${uid}`);
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setUserRole(data.role || 'citizen');
                    setUserStatus(data.status || 'approved');
                    setUserData(data);
                } else {
                    // Default to citizen if user record is not created
                    setUserRole('citizen');
                    setUserStatus('approved');
                }
                setLoading(false);
            }, (error) => {
                console.error("Failed to query user role:", error);
                setLoading(false);
            });
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-medical-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="text-primary animate-spin" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse italic">
                        Synchronizing Security Hub...
                    </p>
                </div>
            </div>
        );
    }

    if (!auth.currentUser) {
        return (
            <div className="min-h-screen bg-medical-bg flex items-center justify-center text-white p-6">
                <div className="text-center max-w-sm space-y-6">
                    <ShieldAlert size={48} className="text-primary mx-auto animate-pulse" />
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Session Expired</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Please re-authenticate your safety keys to view the console.
                    </p>
                    <Button onClick={() => navigate('/login')} className="w-full py-4 bg-primary text-white rounded-xl">
                        AUTHENTICATE PORTAL
                    </Button>
                </div>
            </div>
        );
    }

    // If pending verification, render the verification page
    if (userStatus === 'pending') {
        return <PendingVerification role={userRole} data={userData} />;
    }

    // Render corresponding dashboard
    if (userRole === 'agent') {
        return <AgentDashboard data={userData} />;
    }

    if (userRole === 'hospital') {
        return <HospitalDashboard data={userData} />;
    }

    // Default: Citizen Dashboard
    return <CitizenDashboard />;
}
