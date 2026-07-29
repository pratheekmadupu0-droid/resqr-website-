import React, { useState, useEffect } from 'react';
import { 
    Shield, User, Award, DollarSign, Users, ChevronRight, Copy, Check,
    Download, Play, BookOpen, MessageSquare, Send, Bell, Star
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';
import { db, auth } from '../../lib/firebase';
import { ref, onValue, update, push } from 'firebase/database';

export default function AgentDashboard({ data }) {
    const [copied, setCopied] = useState(false);
    const [stickerQty, setStickerQty] = useState('10');
    const [shippingAddress, setShippingAddress] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, text: "Verification reward added! ₹500 credited for onboarding validation.", time: "1h ago" },
        { id: 2, text: "Physical sticker inventory updated. Free shipping active on requests >50 units.", time: "1d ago" }
    ]);
    const [customers, setCustomers] = useState([]);

    const agent = data?.agentProfile || {};
    const refCode = agent.agentId || 'AGT-000000';
    const refLink = `${window.location.origin}/login?ref=${refCode}`;

    // Read customers registered by this agent
    useEffect(() => {
        // Since we don't have a direct relational mapping, we can scan the profiles database
        // and find the ones where the referrer or agent matches, or read from users node
        const usersRef = ref(db, 'users');
        const unsub = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const list = [];
                snapshot.forEach((child) => {
                    const val = child.val();
                    if (val.role === 'citizen' && val.referredBy === refCode) {
                        list.push({
                            uid: val.uid,
                            name: val.name,
                            phone: val.phone,
                            date: val.createdAt ? new Date(val.createdAt).toLocaleDateString() : 'N/A'
                        });
                    }
                });
                // Fallback / mock data for demo purposes if empty
                if (list.length === 0) {
                    setCustomers([
                        { uid: 'c1', name: "Amit Kumar", phone: "+91 98765 12345", date: "24/07/2026", status: "Paid", commission: "₹45" },
                        { uid: 'c2', name: "Sunita Sharma", phone: "+91 98123 45678", date: "25/07/2026", status: "Paid", commission: "₹30" },
                        { uid: 'c3', name: "Vijay Patel", phone: "+91 99112 23344", date: "26/07/2026", status: "Paid", commission: "₹30" }
                    ]);
                } else {
                    setCustomers(list.map(c => ({
                        ...c,
                        status: "Paid",
                        commission: "₹30"
                    })));
                }
            } else {
                setCustomers([
                    { uid: 'c1', name: "Amit Kumar", phone: "+91 98765 12345", date: "24/07/2026", status: "Paid", commission: "₹45" },
                    { uid: 'c2', name: "Sunita Sharma", phone: "+91 98123 45678", date: "25/07/2026", status: "Paid", commission: "₹30" },
                    { uid: 'c3', name: "Vijay Patel", phone: "+91 99112 23344", date: "26/07/2026", status: "Paid", commission: "₹30" }
                ]);
            }
        });
        return () => unsub();
    }, [refCode]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(refLink);
        setCopied(true);
        toast.success("Referral code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRequestStickers = async (e) => {
        e.preventDefault();
        if (!shippingAddress) {
            toast.error("Please enter a shipping address.");
            return;
        }
        setSubmitLoading(true);
        try {
            // Push order to RTDB
            const orderRef = ref(db, `orders/stickers`);
            await push(orderRef, {
                agentId: refCode,
                agentName: agent.name,
                quantity: parseInt(stickerQty),
                address: shippingAddress,
                status: 'pending',
                date: new Date().toISOString()
            });
            toast.success(`Requested ${stickerQty} Physical Stickers! Delivery dispatched in 48 hours.`);
            setShippingAddress('');
        } catch (error) {
            toast.error("Sticker request failed: " + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const mockLeaderboard = [
        { rank: 1, name: "Vikram Malhotra", count: 184, earnings: "₹6,820", self: false },
        { rank: 2, name: "Pooja Hegde", count: 142, earnings: "₹5,110", self: false },
        { rank: 3, name: `${agent.name || 'You'} (You)`, count: customers.length, earnings: `₹${customers.length * 30}`, self: true },
        { rank: 4, name: "Deepak Rawat", count: 8, earnings: "₹240", self: false },
    ].sort((a, b) => b.count - a.count).map((item, idx) => ({ ...item, rank: idx + 1 }));

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 space-y-12">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        {agent.photo ? (
                            <img src={agent.photo} alt="Agent Portrait" className="w-20 h-20 object-cover rounded-3xl border border-white/10 shadow-2xl" />
                        ) : (
                            <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-center text-primary">
                                <User size={32} />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter font-poppins text-white leading-tight">
                                    {agent.name || 'Agent Partner'}
                                </h1>
                                <Badge className="bg-primary/20 text-primary border-none px-3 py-1 font-black italic text-[9px] uppercase tracking-widest">
                                    BRONZE PARTNER
                                </Badge>
                            </div>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.25em] mt-2 italic">
                                Agent Node ID: <span className="text-white font-black">{refCode}</span>
                            </p>
                        </div>
                    </div>
                </header>

                {/* Referral Code link */}
                <Card className="p-8 bg-gradient-to-r from-slate-950 via-[#11192A] to-slate-950 border border-white/5 rounded-[35px] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter font-poppins text-white">
                            SHARE YOUR REFERRAL LINK
                        </h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                            Earn 30% instant commission on every emergency medical profile registered under your ID.
                        </p>
                    </div>
                    <div className="flex items-center bg-slate-950/80 border border-white/5 pl-6 pr-2 py-2 rounded-2xl w-full md:w-auto max-w-md shrink-0 justify-between">
                        <span className="text-slate-400 font-black tracking-wider text-xs truncate mr-4">
                            resqr.co.in/ref?id={refCode}
                        </span>
                        <Button 
                            onClick={copyToClipboard}
                            className="bg-primary hover:bg-primary-dark border-none py-3 px-6 rounded-xl font-black italic uppercase tracking-widest text-[9px] flex items-center gap-1"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#11192A] p-8 rounded-[35px] border border-white/5 flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                            <Users size={26} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Citizens Onboarded</p>
                            <p className="text-3xl font-black italic text-white font-poppins">{customers.length}</p>
                        </div>
                    </div>
                    <div className="bg-[#11192A] p-8 rounded-[35px] border border-white/5 flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                            <DollarSign size={26} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Commission Earned</p>
                            <p className="text-3xl font-black italic text-emerald-400 font-poppins">₹{customers.length * 30 + 500}</p>
                        </div>
                    </div>
                    <div className="bg-[#11192A] p-8 rounded-[35px] border border-white/5 flex items-center gap-5">
                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-400">
                            <Clock size={26} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pending Payouts</p>
                            <p className="text-3xl font-black italic text-amber-400 font-poppins">₹{customers.length * 30}</p>
                        </div>
                    </div>
                    <div className="bg-[#11192A] p-8 rounded-[35px] border border-white/5 flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 text-primary">
                            <Award size={26} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sales Tier Rank</p>
                            <p className="text-3xl font-black italic text-white font-poppins">Tier-3</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Customers & Leaderboard */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Onboarded Customers */}
                        <Card className="bg-[#11192A] border-white/5 rounded-[45px] overflow-hidden">
                            <div className="p-10 pb-4">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white">
                                    ONBOARDED CITIZENS
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    Secure client registrations linked to your agent protocol
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-950/20">
                                            <th className="px-10 py-5">Full Name</th>
                                            <th className="px-6 py-5">Mobile</th>
                                            <th className="px-6 py-5">Created Date</th>
                                            <th className="px-6 py-5">Status</th>
                                            <th className="px-10 py-5 text-right">Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                        {customers.map((c) => (
                                            <tr key={c.uid} className="hover:bg-slate-950/10 transition-colors">
                                                <td className="px-10 py-5 font-black uppercase italic text-white">{c.name}</td>
                                                <td className="px-6 py-5 font-semibold text-slate-400">{c.phone}</td>
                                                <td className="px-6 py-5 font-bold text-slate-400">{c.date}</td>
                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-500" /> {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-5 font-black italic text-right text-emerald-500">{c.commission}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Leaderboard Card */}
                        <Card className="p-10 bg-[#11192A] border-white/5 rounded-[45px] shadow-2xl">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter font-poppins text-white mb-6">
                                NATIONAL AGENT LEADERBOARD
                            </h3>
                            <div className="space-y-4">
                                {mockLeaderboard.map((item) => (
                                    <div 
                                        key={item.rank} 
                                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${item.self ? 'bg-primary/5 border-primary/20' : 'bg-slate-950/40 border-white/5'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic text-xs ${item.rank === 1 ? 'bg-yellow-500 text-black' : item.rank === 2 ? 'bg-slate-300 text-black' : 'bg-slate-900 text-slate-500'}`}>
                                                #{item.rank}
                                            </span>
                                            <span className={`font-black uppercase italic text-sm ${item.self ? 'text-primary' : 'text-white'}`}>{item.name}</span>
                                        </div>
                                        <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-slate-500">
                                            <span>{item.count} Signups</span>
                                            <span className="text-emerald-500 italic">Payout: {item.earnings}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right: Orders & Training */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Physical Sticker Orders */}
                        <Card className="p-8 bg-[#11192A] border-white/5 rounded-[45px] shadow-2xl">
                            <h3 className="text-xl font-black italic uppercase tracking-tighter font-poppins text-white mb-6">
                                REQUEST REFLECTIVE QR STICKERS
                            </h3>
                            <form onSubmit={handleRequestStickers} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Quantity</label>
                                    <select 
                                        value={stickerQty}
                                        onChange={(e) => setStickerQty(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl h-16 px-6 text-xs font-bold outline-none focus:border-primary transition-all appearance-none text-white"
                                    >
                                        <option value="10" className="bg-[#11192A]">10 Units</option>
                                        <option value="25" className="bg-[#11192A]">25 Units</option>
                                        <option value="50" className="bg-[#11192A]">50 Units (Free Shipping)</option>
                                        <option value="100" className="bg-[#11192A]">100 Units (Partner Special)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Shipping Address</label>
                                    <textarea 
                                        required
                                        placeholder="Enter complete shipping address"
                                        value={shippingAddress}
                                        onChange={(e) => setShippingAddress(e.target.value)}
                                        className="w-full px-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-semibold outline-none focus:border-primary transition-all placeholder:text-slate-700 h-24 text-xs"
                                    />
                                </div>
                                <Button 
                                    type="submit"
                                    disabled={submitLoading}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px]"
                                >
                                    {submitLoading ? 'Transmitting Order...' : 'Dispatch Sticker Pack'}
                                </Button>
                            </form>
                        </Card>

                        {/* Training Materials */}
                        <Card className="p-8 bg-[#11192A] border-white/5 rounded-[45px] shadow-2xl">
                            <h3 className="text-xl font-black italic uppercase tracking-tighter font-poppins text-white mb-6">
                                TRAINING MATERIALS
                            </h3>
                            <div className="space-y-4">
                                <a href="#" onClick={(e) => { e.preventDefault(); toast.success("Pitch deck downloaded!"); }} className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                            <BookOpen size={18} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black uppercase italic text-white block">Agent Sales Playbook</span>
                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">PDF Manual • 4.2 MB</span>
                                        </div>
                                    </div>
                                    <Download size={16} className="text-slate-500 group-hover:text-primary transition-colors" />
                                </a>

                                <a href="#" onClick={(e) => { e.preventDefault(); toast.success("Opening training video stream..."); }} className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-2xl hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <Play size={18} className="fill-primary" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black uppercase italic text-white block">How to Pitch ResQR</span>
                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">Video Stream • 12 mins</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-500 group-hover:text-primary transition-colors" />
                                </a>
                            </div>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
