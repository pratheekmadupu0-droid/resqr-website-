import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '../components/ui/Button';
import AppLoading from '../components/ui/AppLoading';

// Lazy-loaded Role Dashboards (Feature-level code splitting)
const CitizenDashboard = lazy(() => import('./DashboardCitizen'));
const AgentDashboard = lazy(() => import('../components/dashboard/AgentDashboard'));
const HospitalDashboard = lazy(() => import('../components/dashboard/HospitalDashboard'));
const PendingVerification = lazy(() => import('../components/dashboard/PendingVerification'));

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        let unsubData = null;
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (unsubData) {
                unsubData();
                unsubData = null;
            }
            if (!currentUser) {
                setLoading(false);
                return;
            }

            const uid = currentUser.uid;
            
            // Listen to changes in the user's role and status
            const userRef = ref(db, `users/${uid}`);
            unsubData = onValue(userRef, (snapshot) => {
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

        return () => {
            if (unsubData) unsubData();
            unsubscribeAuth();
        };
    }, [navigate]);

    if (loading) {
        return <AppLoading message="Synchronizing your security hub..." />;
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

    return (
        <Suspense fallback={<AppLoading message="Loading portal..." />}>
            {userStatus === 'pending' && <PendingVerification role={userRole} data={userData} />}
            {userStatus !== 'pending' && userRole === 'agent' && <AgentDashboard data={userData} />}
            {userStatus !== 'pending' && userRole === 'hospital' && <HospitalDashboard data={userData} />}
            {userStatus !== 'pending' && userRole !== 'agent' && userRole !== 'hospital' && <CitizenDashboard />}
        </Suspense>
    );
}
