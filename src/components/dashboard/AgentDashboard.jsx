import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { ref, onValue, push } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, TrendingUp, Wallet, Loader2,
  Phone, Mail, Search, ClipboardList, GraduationCap, History,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  listenAgentClients, enrollClient, getAgentProfile, COMMISSION_STATUS,
} from '../../lib/agents';

const COMMISSION_FILTERS = ['all', COMMISSION_STATUS.PENDING, COMMISSION_STATUS.APPROVED, COMMISSION_STATUS.PAID, COMMISSION_STATUS.CANCELLED];

function StatCard({ icon: Icon, label, value, tone = 'default', loading }) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-white truncate">
                        {loading ? <Loader2 className="animate-spin inline w-5 h-5 text-slate-500" /> : value}
                    </p>
                </div>
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    tone === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    tone === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                    tone === 'brand' ? 'bg-primary/10 text-primary' : 'bg-slate-700/50 text-slate-300'}`}>
                    <Icon size={20} />
                </div>
            </div>
        </Card>
    );
}

export default function AgentDashboard({ data }) {
    const navigate = useNavigate();
    const agentUid = auth.currentUser?.uid;
    const [agentProfile, setAgentProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [clients, setClients] = useState(null); // null = loading
    const [commissions, setCommissions] = useState(null);
    const [search, setSearch] = useState('');
    const [commissionFilter, setCommissionFilter] = useState('all');
    const [showEnroll, setShowEnroll] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [showSticker, setShowSticker] = useState(false);
    const [stickerForm, setStickerForm] = useState({ quantity: '10', address: '', phone: '' });
    const [stickerSubmitting, setStickerSubmitting] = useState(false);
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    // Agent profile (own document only)
    useEffect(() => {
        if (!agentUid) return;
        let unsub;
        const setup = async () => {
            try {
                const profile = await getAgentProfile(agentUid);
                if (!mountedRef.current) return;
                setAgentProfile(profile);
            } catch (err) {
                console.error('Agent profile load failed:', err);
                toast.error('Unable to load your agent profile. Check your connection.');
            } finally {
                if (mountedRef.current) setProfileLoading(false);
            }
        };
        setup();
        // Live agent-scoped commission mirror — ONE scoped read, never a global users scan
        unsub = onValue(ref(db, `agentCommissions/${agentUid}`), (snap) => {
            if (!mountedRef.current) return;
            const list = snap.exists()
                ? Object.entries(snap.val()).map(([id, c]) => ({ id, ...c }))
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                : [];
            setCommissions(list);
        }, () => setCommissions([]));
        return () => { if (unsub) unsub(); };
    }, [agentUid]);

    // Agent-scoped client list — never a global users scan
    useEffect(() => {
        if (!agentUid) return;
        return listenAgentClients(agentUid, (list) => setClients(list));
    }, [agentUid]);

    const derived = useMemo(() => {
        const list = clients || [];
        const commissionsList = commissions || [];
        const totalCommission = commissionsList.filter(c => c.status !== COMMISSION_STATUS.CANCELLED).reduce((s, c) => s + (Number(c.amount) || 0), 0);
        const pendingCommission = commissionsList.filter(c => c.status === COMMISSION_STATUS.PENDING).reduce((s, c) => s + (Number(c.amount) || 0), 0);
        const paidCommission = commissionsList.filter(c => c.status === COMMISSION_STATUS.PAID).reduce((s, c) => s + (Number(c.amount) || 0), 0);
        const filtered = search.trim()
            ? list.filter(c => {
                const q = search.toLowerCase();
                return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(search.trim()) || (c.email || '').toLowerCase().includes(q);
            })
            : list;
        const filteredCommissions = commissionFilter === 'all'
            ? commissionsList
            : commissionsList.filter(c => c.status === commissionFilter);
        return {
            total: list.length,
            active: list.filter(c => (c.status || '') === 'Active').length,
            pendingClients: list.filter(c => (c.status || '') !== 'Active').length,
            totalCommission, pendingCommission, paidCommission,
            filteredClients: filtered,
            filteredCommissions,
        };
    }, [clients, commissions, search, commissionFilter]);

    const handleEnroll = async (form) => {
        setEnrolling(true);
        const t = toast.loading('Enrolling client…');
        try {
            const result = await enrollClient(agentUid, form);
            toast.success(`Client enrolled successfully. ${result.agentId} → ${result.clientId}`, { id: t });
            setShowEnroll(false);
        } catch (err) {
            if (err && err.code === 'DUPLICATE_CLIENT') {
                toast.error('An account with this information already exists.', { id: t, duration: 6000 });
            } else if (err && err.code === 'INACTIVE_AGENT') {
                toast.error('Your agent account is not active. Contact RESQR support.', { id: t });
            } else {
                console.error('Enrollment failed:', err);
                toast.error(err?.message || 'Unable to enroll client. Please try again.', { id: t });
            }
        } finally {
            if (mountedRef.current) setEnrolling(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#040812] text-white p-6 font-manrope">
            <div className="max-w-7xl mx-auto space-y-8 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase font-poppins">Agent Partner Console</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {data?.name || agentProfile?.name || 'Authorized Partner'} • ID: {data?.agentProfile?.agentId || 'AGT-LIVE'}
                        </p>
                    </div>
                    <Button onClick={() => setShowEnroll(true)} className="bg-primary text-white font-black italic uppercase text-xs py-3 px-6 rounded-2xl shadow-xl shadow-primary/20">
                        + Enroll New Citizen
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="Enrolled Citizens" value={derived.total} loading={clients === null} tone="brand" />
                    <StatCard icon={TrendingUp} label="Active Tags" value={derived.active} loading={clients === null} tone="success" />
                    <StatCard icon={Wallet} label="Total Earned" value={`₹${derived.totalCommission}`} loading={commissions === null} tone="warning" />
                    <StatCard icon={History} label="Pending Payout" value={`₹${derived.pendingCommission}`} loading={commissions === null} tone="default" />
                </div>

                <Card className="p-8 bg-[#11192A] border-white/5 rounded-3xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                        <h3 className="text-lg font-black italic uppercase font-poppins">Enrolled Identity Network</h3>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search citizens..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#050B18] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {derived.filteredClients.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 font-bold uppercase text-xs tracking-wider">
                            No citizen enrollments recorded.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-bold">
                                <thead>
                                    <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider text-[10px]">
                                        <th className="pb-3">Citizen Name</th>
                                        <th className="pb-3">Contact</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3">Registered Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {derived.filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-4 font-black uppercase italic text-white">{client.name || 'Citizen'}</td>
                                            <td className="py-4 text-slate-400 font-mono">{client.phone || '—'}</td>
                                            <td className="py-4">
                                                <Badge variant={client.status === 'Active' ? 'success' : 'warning'}>
                                                    {client.status || 'Pending'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 text-slate-500">{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
