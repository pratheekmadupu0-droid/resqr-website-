import React from 'react';
import { ShieldAlert, Clock, Check, Hourglass, PhoneCall, LogOut } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PendingVerification({ role, data }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Disconnected security session.");
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const isAgent = role === 'agent';
    const profile = isAgent ? data?.agentProfile : data?.hospitalProfile;

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope flex items-center justify-center p-6">
            <div className="w-full max-w-2xl py-12">
                <Card className="p-10 bg-medical-card border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[45px] relative overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                    
                    {/* Glowing Clock Icon */}
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                        <Clock className="text-amber-500 animate-pulse" size={38} />
                    </div>

                    <Badge className="bg-amber-500/20 text-amber-500 border-none mb-6 px-6 py-1 font-black italic tracking-widest text-[9px]">
                        SOC CREDENTIAL REVIEW
                    </Badge>

                    <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none font-poppins mb-6">
                        Verification <span className="text-amber-500">Pending.</span>
                    </h1>

                    <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto mb-10">
                        Your application for {isAgent ? 'RESQR Agent Partnership' : 'Hospital Network Integration'} is undergoing verification by our Compliance Operations Center. Manual credential sweeps are completed within 2 to 4 hours.
                    </p>

                    {/* Progress steps */}
                    <div className="max-w-md mx-auto grid grid-cols-4 gap-2 mb-12 bg-slate-950/40 p-4 rounded-3xl border border-white/5">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 text-xs"><Check size={14} /></div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Register</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-1 text-xs"><Check size={14} /></div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Documents</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500 text-amber-500 flex items-center justify-center mb-1 text-xs animate-pulse"><Hourglass size={14} /></div>
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Audit</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/5 text-slate-700 flex items-center justify-center mb-1 text-xs"><ShieldAlert size={14} /></div>
                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Deploy</span>
                        </div>
                    </div>

                    {/* Submission Summary */}
                    <div className="text-left bg-slate-950 p-8 rounded-3xl border border-white/5 max-w-md mx-auto space-y-4 mb-10">
                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 border-b border-white/5 pb-2 italic">
                            SUBMITTED RECORD DETAILS
                        </h4>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-wider">Institution/Name</span>
                            <span className="text-white font-black uppercase italic">{isAgent ? profile?.name : profile?.hospitalName}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-wider">ID / License No</span>
                            <span className="text-white font-black uppercase italic">{isAgent ? profile?.agentId : profile?.licenseNo}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-wider">Plan / Role</span>
                            <span className="text-white font-black uppercase italic">{isAgent ? 'RESQR Sales Agent' : profile?.plan?.name}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                        <Button 
                            onClick={() => toast.success("Compliance Support alerted. An operations manager will reach out shortly.")}
                            className="flex-1 py-4 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-300 font-black italic uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2"
                        >
                            <PhoneCall size={14} /> Contact Compliance
                        </Button>
                        <Button 
                            onClick={handleLogout}
                            className="py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-black italic uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2 border-none shadow-lg shadow-red-600/10"
                        >
                            <LogOut size={14} /> Disconnect
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
