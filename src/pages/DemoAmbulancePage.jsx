import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Siren, Navigation, Phone, MapPin, HeartPulse, ShieldAlert,
    CheckCircle2, Clock, AlertTriangle, ArrowRight, User, Hospital,
    Sparkles, RefreshCw, Volume2, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { setDemoMode, DEMO_ROLES } from '../lib/demoService';

export default function DemoAmbulancePage() {
    const navigate = useNavigate();
    const [dispatchStage, setDispatchStage] = useState('received'); // 'received', 'enroute', 'picked_up', 'arrived', 'completed'
    const [etaSeconds, setEtaSeconds] = useState(360); // 6 mins

    useEffect(() => {
        setDemoMode(true, DEMO_ROLES.AMBULANCE);
    }, []);

    // Countdown simulator
    useEffect(() => {
        if (dispatchStage !== 'enroute') return;
        const interval = setInterval(() => {
            setEtaSeconds(prev => Math.max(0, prev - 15));
        }, 1000);
        return () => clearInterval(interval);
    }, [dispatchStage]);

    const handleAccept = () => {
        setDispatchStage('enroute');
        toast.success('🚨 Emergency Accepted! Unit BLS-09 En Route to Scene (MG Road Metro).');
    };

    const handlePatientPickedUp = () => {
        setDispatchStage('picked_up');
        toast.success('Patient onboard. Vitals recorded. En route to Apollo Metro Trauma Center.');
    };

    const handleHospitalArrival = () => {
        setDispatchStage('arrived');
        toast.success('Arrived at Apollo Metro Trauma ER Bay 2. Handing over to Dr. Ananya Sen.');
    };

    const handleComplete = () => {
        setDispatchStage('completed');
        toast.success('Emergency handover complete! Dispatch unit returned to Standby.');
    };

    const handleReset = () => {
        setDispatchStage('received');
        setEtaSeconds(360);
        toast.success('Demo Ambulance workflow reset to initial dispatch.');
    };

    return (
        <div className="min-h-screen bg-[#040812] text-white py-10 px-4 sm:px-6 lg:px-8 font-manrope">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Notice Banner */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-bold">
                        <ShieldAlert size={18} className="shrink-0 text-amber-400" />
                        <span>DEMO EMERGENCY — NO REAL EMERGENCY HAS BEEN CREATED. All coordinates and vitals are simulated.</span>
                    </div>
                    <button
                        onClick={() => navigate('/demo-admin')}
                        className="btn-app-secondary py-1.5 px-3 text-[11px] font-bold shrink-0"
                    >
                        Demo Hub
                    </button>
                </div>

                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 flex items-center justify-center text-2xl animate-pulse">
                            <Siren size={30} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">
                                    AMBULANCE CONSOLE · BLS-09
                                </span>
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">GPS ACTIVE</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black italic uppercase font-poppins text-white mt-1">
                                Emergency Responder Dispatch
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">
                                Base Station: Central Trauma Grid #4 · Operator: Paramedic Ashok
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        className="btn-app-secondary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto"
                    >
                        <RefreshCw size={14} /> Reset Simulation
                    </button>
                </div>

                {/* Dispatch Progress Stepper */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'received', label: '1. Alert Received' },
                        { id: 'enroute', label: '2. En Route' },
                        { id: 'picked_up', label: '3. Patient Onboard' },
                        { id: 'completed', label: '4. ER Handover' },
                    ].map((st, idx) => {
                        const stages = ['received', 'enroute', 'picked_up', 'arrived', 'completed'];
                        const currIdx = stages.indexOf(dispatchStage);
                        const isDone = currIdx >= idx;
                        const isCurrent = dispatchStage === st.id;
                        return (
                            <div key={st.id} className="text-center">
                                <div className={`h-1.5 rounded-full transition-all ${
                                    isDone ? 'bg-red-500' : 'bg-white/10'
                                }`} />
                                <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                                    isCurrent ? 'text-white font-black' : isDone ? 'text-red-400' : 'text-slate-500'
                                }`}>
                                    {st.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Dispatch Card */}
                <Card className="p-6 sm:p-8 bg-[#090E1A] border-white/10 rounded-3xl space-y-6 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                        <div>
                            <span className="text-[10px] font-mono text-primary font-bold">DISPATCH REF: REQ-DEMO-001</span>
                            <h2 className="text-2xl font-black italic uppercase font-poppins text-white mt-0.5">
                                High-Priority Trauma Call
                            </h2>
                            <p className="text-xs text-slate-400">Triggered via RESQR Bystander Emergency Scan</p>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Simulated ETA</span>
                            <p className="text-2xl font-black italic text-emerald-400 font-poppins">
                                {Math.floor(etaSeconds / 60)}m {etaSeconds % 60}s
                            </p>
                        </div>
                    </div>

                    {/* Patient Data Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Patient Identity</span>
                            <p className="text-sm font-bold text-white">Rajesh Sharma</p>
                            <p className="text-[11px] text-slate-400">Age: 42 · Male · ID: RESQR-USER-000001</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-rose-400">Critical Blood & Allergy</span>
                            <p className="text-sm font-black italic text-white">Blood: O+ Positive</p>
                            <p className="text-[11px] text-rose-300 font-bold">⚠️ Severe Penicillin Allergy</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Destination Facility</span>
                            <p className="text-sm font-bold text-white">Apollo Metro Trauma Center</p>
                            <p className="text-[11px] text-emerald-400">ER Bay 2 Reserved · Dr. Ananya Sen</p>
                        </div>
                    </div>

                    {/* Location Pin */}
                    <div className="p-4 rounded-2xl bg-[#050914] border border-white/10 flex items-start gap-3 text-xs">
                        <MapPin size={20} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-white">Incident Coordinates & Address</p>
                            <p className="text-slate-300 mt-0.5">MG Road Metro Station, Gate 2, Bengaluru (12.9756° N, 77.6067° E)</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Reported by bystander scan at scene</p>
                        </div>
                    </div>

                    {/* Interactive Action Controller */}
                    <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-400">
                            Current Status: <strong className="text-white uppercase font-bold">{dispatchStage.replace('_', ' ')}</strong>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {dispatchStage === 'received' && (
                                <button
                                    type="button"
                                    onClick={handleAccept}
                                    className="w-full sm:w-auto btn-app-primary py-3 px-8 text-xs font-black italic uppercase inline-flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                >
                                    <Navigation size={16} /> Accept & Start GPS Navigation
                                </button>
                            )}

                            {dispatchStage === 'enroute' && (
                                <button
                                    type="button"
                                    onClick={handlePatientPickedUp}
                                    className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black italic uppercase inline-flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20"
                                >
                                    <HeartPulse size={16} /> Confirm Patient Onboard
                                </button>
                            )}

                            {dispatchStage === 'picked_up' && (
                                <button
                                    type="button"
                                    onClick={handleHospitalArrival}
                                    className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black italic uppercase inline-flex items-center justify-center gap-2 shadow-xl shadow-amber-600/20"
                                >
                                    <Hospital size={16} /> Arrived at Hospital ER
                                </button>
                            )}

                            {(dispatchStage === 'arrived' || dispatchStage === 'completed') && (
                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black italic uppercase inline-flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20"
                                >
                                    <CheckCircle2 size={16} /> Complete Handover
                                </button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
