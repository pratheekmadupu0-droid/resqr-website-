import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, UserPlus, GraduationCap, BookOpen, Building2,
    ShoppingBag, RefreshCw, Wallet, FileSpreadsheet, ShieldCheck, HelpCircle,
    Search, Plus, Upload, Download, ArrowUpRight, CheckCircle2, Clock,
    AlertTriangle, ChevronRight, Phone, Mail, MapPin, Eye, Filter, Sparkles,
    Calendar, TrendingUp, DollarSign, Menu, X, ExternalLink
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
    listenAgentClients, listenAgentGroups, listenAgentOrders, getAgentProfile,
    COMMISSION_STATUS, getCommissionConfig, getAgentPlansConfig
} from '../../lib/agents';
import { CUSTOMER_CATEGORIES, CUSTOMER_CATEGORY_TYPES } from '../../lib/agentCategoriesConfig';
import CreateCustomerModal from '../agent/CreateCustomerModal';
import BulkUploadModal from '../agent/BulkUploadModal';
import GroupDetailsModal from '../agent/GroupDetailsModal';

export default function AgentDashboard({ data }) {
    const navigate = useNavigate();
    const agentUid = auth.currentUser?.uid;
    const [agentProfile, setAgentProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Live data collections
    const [clients, setClients] = useState(null); // Individual clients
    const [groups, setGroups] = useState(null);   // Multi-category groups (Family, School, College, Corp)
    const [orders, setOrders] = useState(null);   // Orders & payment records
    const [commissions, setCommissions] = useState(null); // Live commission ledger

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Modals
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const [createCategoryDefault, setCreateCategoryDefault] = useState(null);
    const [selectedGroupForDetails, setSelectedGroupForDetails] = useState(null);
    const [selectedGroupForBulk, setSelectedGroupForBulk] = useState(null);

    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    // 1. Fetch Agent Profile
    useEffect(() => {
        if (!agentUid) return;
        const load = async () => {
            try {
                const profile = await getAgentProfile(agentUid);
                if (mountedRef.current) {
                    setAgentProfile(profile || { name: data?.name || 'Agent Partner', agentId: data?.agentId || 'RESQR-AG-0001' });
                }
            } catch (err) {
                console.error('Agent profile error:', err);
            }
        };
        load();
    }, [agentUid, data]);

    // 2. Listen to Individual Clients
    useEffect(() => {
        if (!agentUid) return;
        const unsub = listenAgentClients(agentUid, (list) => {
            if (mountedRef.current) setClients(list);
        });
        return () => { if (unsub) unsub(); };
    }, [agentUid]);

    // 3. Listen to Customer Groups (Family, School, College, Corporate)
    useEffect(() => {
        if (!agentUid) return;
        const unsub = listenAgentGroups(agentUid, (list) => {
            if (mountedRef.current) setGroups(list);
        });
        return () => { if (unsub) unsub(); };
    }, [agentUid]);

    // 4. Listen to Orders
    useEffect(() => {
        if (!agentUid) return;
        const unsub = listenAgentOrders(agentUid, (list) => {
            if (mountedRef.current) setOrders(list);
        });
        return () => { if (unsub) unsub(); };
    }, [agentUid]);

    // 5. Listen to Commission Ledger
    useEffect(() => {
        if (!agentUid) return;
        const unsub = onValue(ref(db, `agentCommissions/${agentUid}`), (snap) => {
            if (!mountedRef.current) return;
            const list = snap.exists()
                ? Object.entries(snap.val()).map(([id, c]) => ({ id, ...c }))
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                : [];
            setCommissions(list);
        }, () => setCommissions([]));
        return () => { if (unsub) unsub(); };
    }, [agentUid]);

    // Computed financial and entity metrics
    const metrics = useMemo(() => {
        const individualList = clients || [];
        const groupList = groups || [];
        const orderList = orders || [];
        const commList = commissions || [];

        const totalSales = orderList.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        const paidOrders = orderList.filter(o => o.paymentStatus === 'paid').length;
        const pendingOrders = orderList.filter(o => o.paymentStatus !== 'paid').length;

        const totalCommissionEarned = commList
            .filter(c => c.status !== COMMISSION_STATUS.CANCELLED)
            .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

        const commissionPaid = commList
            .filter(c => c.status === COMMISSION_STATUS.PAID)
            .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

        const commissionPending = commList
            .filter(c => c.status === COMMISSION_STATUS.PENDING || c.status === COMMISSION_STATUS.APPROVED)
            .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

        // Group counts by category
        const familyGroups = groupList.filter(g => g.categoryType === CUSTOMER_CATEGORY_TYPES.FAMILY);
        const schoolGroups = groupList.filter(g => g.categoryType === CUSTOMER_CATEGORY_TYPES.SCHOOL);
        const collegeGroups = groupList.filter(g => g.categoryType === CUSTOMER_CATEGORY_TYPES.COLLEGE);
        const corporateGroups = groupList.filter(g => g.categoryType === CUSTOMER_CATEGORY_TYPES.CORPORATE);

        // Total registered users across individual + groups
        const totalGroupUsers = groupList.reduce((sum, g) => sum + (Number(g.memberCount) || Number(g.plan?.memberCapacity) || 1), 0);
        const totalCitizens = individualList.length + totalGroupUsers;

        return {
            totalSales,
            paidOrders,
            pendingOrders,
            totalCommissionEarned,
            commissionPaid,
            commissionPending,
            totalCitizens,
            individualCount: individualList.length,
            familyCount: familyGroups.length,
            schoolCount: schoolGroups.length,
            collegeCount: collegeGroups.length,
            corporateCount: corporateGroups.length,
            totalGroups: groupList.length,
            familyGroups,
            schoolGroups,
            collegeGroups,
            corporateGroups,
        };
    }, [clients, groups, orders, commissions]);

    // Filtered customer list (merging groups and individual clients for universal directory)
    const filteredUniversalCustomers = useMemo(() => {
        const groupItems = (groups || []).map(g => ({
            id: g.groupId,
            isGroup: true,
            groupId: g.groupId,
            categoryType: g.categoryType,
            categoryName: g.categoryName || CUSTOMER_CATEGORIES[g.categoryType]?.name || 'Group',
            name: g.institutionName || g.companyName || g.familyName || g.primaryContactName || 'Customer Group',
            contactPerson: g.principalName || g.hrAdminName || g.administratorName || g.primaryContactName || '—',
            phone: g.contactPhone || g.primaryPhone || '—',
            email: g.contactEmail || g.primaryEmail || '—',
            city: g.city || '—',
            memberCount: g.memberCount || g.plan?.memberCapacity || 1,
            planName: g.plan?.name || 'Standard Package',
            status: g.status || 'active',
            createdAt: g.createdAt || Date.now(),
            raw: g,
        }));

        const individualItems = (clients || []).map(c => ({
            id: c.clientId,
            isGroup: false,
            clientId: c.clientId,
            categoryType: CUSTOMER_CATEGORY_TYPES.INDIVIDUAL,
            categoryName: 'Individual Customer',
            name: c.name || 'Individual Citizen',
            contactPerson: c.name || 'Self',
            phone: c.phone || '—',
            email: c.email || '—',
            city: c.city || '—',
            memberCount: 1,
            planName: c.notes || 'Individual Plan',
            status: c.resqrStatus || c.status || 'active',
            createdAt: c.enrollmentDate || c.createdAt || Date.now(),
            raw: c,
        }));

        const combined = [...groupItems, ...individualItems].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        return combined.filter(item => {
            const matchesCategory = categoryFilter === 'all' || item.categoryType === categoryFilter;
            const q = searchTerm.toLowerCase().trim();
            const matchesSearch = !q ||
                (item.name || '').toLowerCase().includes(q) ||
                (item.contactPerson || '').toLowerCase().includes(q) ||
                (item.phone || '').includes(q) ||
                (item.id || '').toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [groups, clients, categoryFilter, searchTerm]);

    const handleOpenCreateModal = (catType = null) => {
        setCreateCategoryDefault(catType);
        setShowCreateCustomer(true);
    };

    const handleExportReport = () => {
        let csv = 'Entity_ID,Category,Name,Contact_Person,Phone,Email,City,Members_Capacity,Plan,Status,Created_Date\n';
        filteredUniversalCustomers.forEach(c => {
            const dateStr = new Date(c.createdAt).toLocaleDateString('en-IN');
            csv += `"${c.id}","${c.categoryName}","${c.name}","${c.contactPerson}","${c.phone}","${c.email}","${c.city}",${c.memberCount},"${c.planName}","${c.status}","${dateStr}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RESQR_Agent_Customer_Report_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Customer report downloaded successfully.');
    };

    // Sidebar navigation items
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'customers', label: 'All Customers', icon: Users, badge: metrics.totalCitizens },
        { id: 'create_customer_trigger', label: '+ Create Customer', icon: UserPlus, isAction: true },
        { id: 'family_plans', label: 'Family Plans', icon: Users, count: metrics.familyCount },
        { id: 'schools', label: 'Schools', icon: GraduationCap, count: metrics.schoolCount },
        { id: 'colleges', label: 'Colleges', icon: BookOpen, count: metrics.collegeCount },
        { id: 'corporate', label: 'Corporate / IT', icon: Building2, count: metrics.corporateCount },
        { id: 'orders', label: 'Orders', icon: ShoppingBag, count: (orders || []).length },
        { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
        { id: 'commission', label: 'Commission', icon: Wallet, highlight: `₹${metrics.commissionPending}` },
        { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
        { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck },
        { id: 'support', label: 'Support & Help', icon: HelpCircle },
    ];

    const currentAgent = {
        agentId: data?.agentProfile?.agentId || agentProfile?.agentId || 'RESQR-AG-0001',
        name: data?.name || agentProfile?.name || 'Authorized Partner',
        uid: agentUid,
    };

    return (
        <div className="min-h-screen bg-[#040812] text-white font-manrope flex flex-col lg:flex-row">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-[#090E1A] border-b border-white/10 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div>
                        <h1 className="text-base font-black italic uppercase tracking-wider text-white">Agent Console</h1>
                        <p className="text-[10px] text-primary font-mono font-bold">{currentAgent.agentId}</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenCreateModal()}
                    className="btn-app-primary py-2 px-3 text-[11px] font-bold inline-flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                    <Plus size={14} /> New Customer
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-[#090E1A] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ${
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="p-6 overflow-y-auto">
                    {/* Brand Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5 mb-5">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest mb-1.5">
                                <Sparkles size={10} /> Partner Portal
                            </div>
                            <h2 className="text-xl font-black italic uppercase font-poppins text-white">RESQR Agent</h2>
                            <p className="text-[11px] text-slate-400 font-bold mt-0.5 truncate">{currentAgent.name}</p>
                            <p className="text-[10px] font-mono text-primary font-black mt-0.5">{currentAgent.agentId}</p>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="lg:hidden p-1.5 rounded-xl bg-white/5 text-slate-400"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            if (item.isAction) {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            handleOpenCreateModal();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full my-3 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary text-white font-black italic uppercase text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                    >
                                        <Plus size={16} /> Create Customer
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                        isActive
                                            ? 'bg-primary/15 text-white border-l-4 border-primary pl-3'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon size={16} className={isActive ? 'text-primary' : 'text-slate-400'} />
                                        <span>{item.label}</span>
                                    </span>
                                    {item.count !== undefined && item.count > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-slate-300">
                                            {item.count}
                                        </span>
                                    )}
                                    {item.highlight && (
                                        <span className="text-[10px] font-black text-emerald-400">
                                            {item.highlight}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Agent Status */}
                <div className="p-4 border-t border-white/10 bg-[#050914]">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-slate-300 uppercase">Agent Online</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">v4.0.0</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 space-y-8 overflow-y-auto">
                {/* 1. DASHBOARD OVERVIEW */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Partner Command Center</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Multi-tenant safety network & bulk client enrollment console
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleOpenCreateModal()}
                                    className="btn-app-primary py-3 px-6 text-xs font-bold inline-flex items-center gap-2 shadow-xl shadow-primary/20"
                                >
                                    <Plus size={16} /> Onboard New Entity
                                </button>
                            </div>
                        </div>

                        {/* Financial & Volume KPI Matrix */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled Citizens</p>
                                        <p className="text-3xl font-black italic text-white mt-1">{metrics.totalCitizens}</p>
                                        <p className="text-[11px] text-slate-500 mt-1">{metrics.totalGroups} Organizations / Families</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Users size={24} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sales Volume</p>
                                        <p className="text-3xl font-black italic text-white mt-1">₹{metrics.totalSales.toLocaleString('en-IN')}</p>
                                        <p className="text-[11px] text-emerald-400 mt-1 font-bold">{metrics.paidOrders} Paid Orders</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                        <TrendingUp size={24} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Commission Earned</p>
                                        <p className="text-3xl font-black italic text-emerald-400 mt-1">₹{metrics.totalCommissionEarned.toLocaleString('en-IN')}</p>
                                        <p className="text-[11px] text-slate-500 mt-1">Paid: ₹{metrics.commissionPaid.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                        <Wallet size={24} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Commission</p>
                                        <p className="text-3xl font-black italic text-amber-400 mt-1">₹{metrics.commissionPending.toLocaleString('en-IN')}</p>
                                        <p className="text-[11px] text-slate-500 mt-1">Admin clearance cycle</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                        <Clock size={24} />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Customer Categories Quick Launch Cards */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black italic uppercase font-poppins text-white">Client Category Management</h2>
                                <span className="text-xs text-slate-400">Click to filter or create</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { id: CUSTOMER_CATEGORY_TYPES.FAMILY, label: 'Family Plans', icon: Users, count: metrics.familyCount, color: 'text-rose-400', desc: '4, 6, 8 member household bundles' },
                                    { id: CUSTOMER_CATEGORY_TYPES.SCHOOL, label: 'Schools', icon: GraduationCap, count: metrics.schoolCount, color: 'text-blue-400', desc: 'Grade 1–12 classes & bulk rosters' },
                                    { id: CUSTOMER_CATEGORY_TYPES.COLLEGE, label: 'Colleges', icon: BookOpen, count: metrics.collegeCount, color: 'text-amber-400', desc: 'Campus departments & student safety' },
                                    { id: CUSTOMER_CATEGORY_TYPES.CORPORATE, label: 'Corporate / IT', icon: Building2, count: metrics.corporateCount, color: 'text-emerald-400', desc: 'Offices, branches & employee fleet' },
                                ].map((cat) => {
                                    const Icon = cat.icon;
                                    return (
                                        <div
                                            key={cat.id}
                                            className="p-5 rounded-2xl bg-[#090E1A] border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
                                            onClick={() => {
                                                setCategoryFilter(cat.id);
                                                setActiveTab('customers');
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`w-10 h-10 rounded-xl bg-white/5 ${cat.color} flex items-center justify-center`}>
                                                    <Icon size={20} />
                                                </div>
                                                <span className="text-xl font-black italic text-white">{cat.count}</span>
                                            </div>
                                            <h3 className="text-sm font-black italic uppercase font-poppins text-white group-hover:text-primary transition-colors">
                                                {cat.label}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 mt-1">{cat.desc}</p>
                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                                <span>View Directory</span>
                                                <ChevronRight size={14} className="text-slate-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Onboardings Table */}
                        <Card className="p-6 bg-[#090E1A] border-white/10 rounded-3xl">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-black italic uppercase font-poppins text-white">Recent Customer Deployments</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Latest registered entities across all categories</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('customers')}
                                    className="btn-app-secondary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
                                >
                                    View Full Roster <ArrowUpRight size={14} />
                                </button>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#050914] overflow-hidden overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#090E1A] border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="p-3.5">Entity / Customer</th>
                                            <th className="p-3.5">Category</th>
                                            <th className="p-3.5">Contact Person</th>
                                            <th className="p-3.5">Members</th>
                                            <th className="p-3.5">Plan</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUniversalCustomers.slice(0, 6).map((c) => (
                                            <tr key={c.id} className="hover:bg-white/5 text-slate-200">
                                                <td className="p-3.5">
                                                    <p className="font-bold text-white">{c.name}</p>
                                                    <p className="text-[10px] font-mono text-slate-400">{c.id}</p>
                                                </td>
                                                <td className="p-3.5">
                                                    <Badge variant="default" className="text-[10px] uppercase font-bold">
                                                        {c.categoryName}
                                                    </Badge>
                                                </td>
                                                <td className="p-3.5">
                                                    <p className="text-white">{c.contactPerson}</p>
                                                    <p className="text-[10px] font-mono text-slate-400">{c.phone}</p>
                                                </td>
                                                <td className="p-3.5 font-bold text-white">
                                                    {c.memberCount} {c.memberCount === 1 ? 'User' : 'Users'}
                                                </td>
                                                <td className="p-3.5 text-slate-300 truncate max-w-[150px]">{c.planName}</td>
                                                <td className="p-3.5">
                                                    <Badge variant={c.status === 'active' ? 'success' : 'warning'} className="text-[10px]">
                                                        {c.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    {c.isGroup ? (
                                                        <button
                                                            onClick={() => setSelectedGroupForDetails(c.raw)}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                                                            title="Inspect Group Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-500">Citizen</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 2. ALL CUSTOMERS DIRECTORY */}
                {activeTab === 'customers' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Client Directory</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Universal registry of families, schools, colleges, corporations, and individuals
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExportReport}
                                    className="btn-app-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2"
                                >
                                    <Download size={14} /> Export CSV
                                </button>
                                <button
                                    onClick={() => handleOpenCreateModal()}
                                    className="btn-app-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <Plus size={16} /> Add Customer
                                </button>
                            </div>
                        </div>

                        {/* Search & Category Filter Bar */}
                        <div className="p-4 rounded-2xl bg-[#090E1A] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, contact, phone, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#050914] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: CUSTOMER_CATEGORY_TYPES.FAMILY, label: 'Family Plans' },
                                    { id: CUSTOMER_CATEGORY_TYPES.SCHOOL, label: 'Schools' },
                                    { id: CUSTOMER_CATEGORY_TYPES.COLLEGE, label: 'Colleges' },
                                    { id: CUSTOMER_CATEGORY_TYPES.CORPORATE, label: 'Corporate' },
                                    { id: CUSTOMER_CATEGORY_TYPES.INDIVIDUAL, label: 'Individual' },
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategoryFilter(cat.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                                            categoryFilter === cat.id
                                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Directory Table */}
                        <Card className="p-0 bg-[#090E1A] border-white/10 rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#050914] border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="p-4">Customer / Organization</th>
                                            <th className="p-4">Classification</th>
                                            <th className="p-4">Contact Person</th>
                                            <th className="p-4">Location</th>
                                            <th className="p-4">Members</th>
                                            <th className="p-4">Package</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUniversalCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-16 text-slate-500 font-bold uppercase tracking-wider">
                                                    No customer records found matching your filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUniversalCustomers.map((c) => (
                                                <tr key={c.id} className="hover:bg-white/5 text-slate-200">
                                                    <td className="p-4">
                                                        <p className="font-bold text-white text-sm">{c.name}</p>
                                                        <p className="text-[10px] font-mono text-primary font-bold">{c.id}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="default" className="text-[10px] uppercase font-bold">
                                                            {c.categoryName}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-white font-medium">{c.contactPerson}</p>
                                                        <p className="text-[10px] font-mono text-slate-400">{c.phone}</p>
                                                    </td>
                                                    <td className="p-4 text-slate-400">{c.city}</td>
                                                    <td className="p-4 font-bold text-white">
                                                        {c.memberCount}
                                                    </td>
                                                    <td className="p-4 text-slate-300 max-w-[160px] truncate">{c.planName}</td>
                                                    <td className="p-4">
                                                        <Badge variant={c.status === 'active' ? 'success' : 'warning'} className="text-[10px]">
                                                            {c.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {c.isGroup && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setSelectedGroupForBulk(c.raw)}
                                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400"
                                                                        title="Bulk Upload CSV"
                                                                    >
                                                                        <Upload size={15} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSelectedGroupForDetails(c.raw)}
                                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                                                                        title="View Members"
                                                                    >
                                                                        <Eye size={15} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 3. CATEGORY SPECIFIC TABS: Family Plans */}
                {activeTab === 'family_plans' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Family Safety Plans</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Household emergency identification bundles with 4, 6, 8, or custom member capacity
                                </p>
                            </div>
                            <button
                                onClick={() => handleOpenCreateModal(CUSTOMER_CATEGORY_TYPES.FAMILY)}
                                className="btn-app-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus size={16} /> Create Family Plan
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Total Family Accounts</p>
                                <p className="text-3xl font-black italic text-white mt-1">{metrics.familyCount}</p>
                            </Card>
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Family Members Protected</p>
                                <p className="text-3xl font-black italic text-emerald-400 mt-1">
                                    {metrics.familyGroups.reduce((s, f) => s + (Number(f.memberCount) || 4), 0)}
                                </p>
                            </Card>
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Standard Sizes</p>
                                <p className="text-sm font-bold text-slate-300 mt-2">4 Members · 6 Members · 8 Members</p>
                            </Card>
                        </div>

                        {/* Families Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {metrics.familyGroups.length === 0 ? (
                                <div className="col-span-3 text-center py-16 text-slate-500 font-bold uppercase">
                                    No family plans enrolled yet. Click &quot;Create Family Plan&quot; to onboard your first family.
                                </div>
                            ) : (
                                metrics.familyGroups.map((fam) => (
                                    <Card key={fam.groupId} className="p-6 bg-[#090E1A] border-white/10 hover:border-white/20 transition-all">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div>
                                                <span className="text-[10px] font-mono text-primary font-bold">{fam.groupId}</span>
                                                <h3 className="text-lg font-black italic uppercase font-poppins text-white mt-0.5">
                                                    {fam.familyName || fam.primaryContactName}
                                                </h3>
                                                <p className="text-xs text-slate-400">{fam.city || 'India'}</p>
                                            </div>
                                            <Badge variant="success" className="text-[10px]">Active</Badge>
                                        </div>

                                        <div className="space-y-2 text-xs text-slate-300 my-4 p-3 rounded-xl bg-white/5">
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Head of Family:</span>
                                                <span className="font-bold text-white">{fam.primaryContactName}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Contact:</span>
                                                <span className="font-mono text-slate-300">{fam.primaryPhone}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Package:</span>
                                                <span className="font-bold text-primary">{fam.plan?.name || 'Family Plan'}</span>
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <button
                                                onClick={() => setSelectedGroupForDetails(fam)}
                                                className="btn-app-secondary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <Eye size={14} /> Manage Members
                                            </button>
                                            <span className="text-[11px] font-bold text-emerald-400">
                                                {fam.memberCount || 4} Members Enrolled
                                            </span>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 4. SCHOOLS */}
                {activeTab === 'schools' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Schools Safety Network</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Grade 1–12 campus safety rosters, parent notifications & bulk CSV management
                                </p>
                            </div>
                            <button
                                onClick={() => handleOpenCreateModal(CUSTOMER_CATEGORY_TYPES.SCHOOL)}
                                className="btn-app-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus size={16} /> Onboard School
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Partner Schools</p>
                                <p className="text-3xl font-black italic text-white mt-1">{metrics.schoolCount}</p>
                            </Card>
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Total Students & Staff</p>
                                <p className="text-3xl font-black italic text-blue-400 mt-1">
                                    {metrics.schoolGroups.reduce((s, g) => s + (Number(g.studentCount) || Number(g.memberCount) || 0), 0)}
                                </p>
                            </Card>
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Hierarchy</p>
                                <p className="text-xs font-bold text-slate-300 mt-2">School → Grades / Classes → Students</p>
                            </Card>
                        </div>

                        {/* School Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {metrics.schoolGroups.length === 0 ? (
                                <div className="col-span-3 text-center py-16 text-slate-500 font-bold uppercase">
                                    No schools enrolled yet. Click &quot;Onboard School&quot; to register a school.
                                </div>
                            ) : (
                                metrics.schoolGroups.map((sch) => (
                                    <Card key={sch.groupId} className="p-6 bg-[#090E1A] border-white/10 hover:border-white/20 transition-all">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div>
                                                <span className="text-[10px] font-mono text-primary font-bold">{sch.groupId}</span>
                                                <h3 className="text-lg font-black italic uppercase font-poppins text-white mt-0.5">
                                                    {sch.institutionName}
                                                </h3>
                                                <p className="text-xs text-slate-400">{sch.city} · Code: {sch.institutionId}</p>
                                            </div>
                                            <Badge variant="success" className="text-[10px]">Active</Badge>
                                        </div>

                                        <div className="space-y-2 text-xs text-slate-300 my-4 p-3 rounded-xl bg-white/5">
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Principal:</span>
                                                <span className="font-bold text-white">{sch.principalName}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Emergency Desk:</span>
                                                <span className="font-mono text-primary font-bold">{sch.campusEmergencyContact}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-slate-400">Plan:</span>
                                                <span className="font-bold text-white">{sch.plan?.name || 'School Bulk Plan'}</span>
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setSelectedGroupForBulk(sch)}
                                                className="btn-app-secondary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <Upload size={14} /> Bulk CSV
                                            </button>
                                            <button
                                                onClick={() => setSelectedGroupForDetails(sch)}
                                                className="btn-app-primary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <Eye size={14} /> View Roster
                                            </button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 5. COLLEGES */}
                {activeTab === 'colleges' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Colleges & Universities</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Higher education departments, faculty & campus-wide emergency routing
                                </p>
                            </div>
                            <button
                                onClick={() => handleOpenCreateModal(CUSTOMER_CATEGORY_TYPES.COLLEGE)}
                                className="btn-app-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus size={16} /> Onboard College
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {metrics.collegeGroups.length === 0 ? (
                                <div className="col-span-3 text-center py-16 text-slate-500 font-bold uppercase">
                                    No colleges registered. Click &quot;Onboard College&quot; to deploy a college network.
                                </div>
                            ) : (
                                metrics.collegeGroups.map((col) => (
                                    <Card key={col.groupId} className="p-6 bg-[#090E1A] border-white/10">
                                        <span className="text-[10px] font-mono text-primary font-bold">{col.groupId}</span>
                                        <h3 className="text-lg font-black italic uppercase font-poppins text-white mt-1">
                                            {col.institutionName}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{col.city} · Dean: {col.administratorName}</p>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setSelectedGroupForBulk(col)}
                                                className="btn-app-secondary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <Upload size={14} /> Bulk CSV
                                            </button>
                                            <button
                                                onClick={() => setSelectedGroupForDetails(col)}
                                                className="btn-app-primary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <Eye size={14} /> View Roster
                                            </button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 6. CORPORATE */}
                {activeTab === 'corporate' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Corporate & IT Enterprise</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Workplace emergency cards, branch locations & corporate employee fleet
                                </p>
                            </div>
                            <button
                                onClick={() => handleOpenCreateModal(CUSTOMER_CATEGORY_TYPES.CORPORATE)}
                                className="btn-app-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus size={16} /> Onboard Company
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {metrics.corporateGroups.length === 0 ? (
                                <div className="col-span-3 text-center py-16 text-slate-500 font-bold uppercase">
                                    No corporate accounts enrolled yet. Click &quot;Onboard Company&quot; to start.
                                </div>
                            ) : (
                                metrics.corporateGroups.map((corp) => (
                                    <Card key={corp.groupId} className="p-6 bg-[#090E1A] border-white/10">
                                        <span className="text-[10px] font-mono text-primary font-bold">{corp.groupId}</span>
                                        <h3 className="text-lg font-black italic uppercase font-poppins text-white mt-1">
                                            {corp.companyName}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">HR Head: {corp.hrAdminName} · {corp.city}</p>
                                        <p className="text-[11px] text-slate-500 mt-1 truncate">Locations: {corp.officeLocations}</p>

                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                                            <button
                                                onClick={() => setSelectedGroupForBulk(corp)}
                                                className="btn-app-secondary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <Upload size={14} /> Bulk CSV
                                            </button>
                                            <button
                                                onClick={() => setSelectedGroupForDetails(corp)}
                                                className="btn-app-primary py-1.5 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <Eye size={14} /> View Employees
                                            </button>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 7. ORDERS */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Orders & Transactions</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    All customer package orders and invoice references
                                </p>
                            </div>
                        </div>

                        <Card className="p-0 bg-[#090E1A] border-white/10 rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#050914] border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="p-4">Order ID</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Plan Description</th>
                                            <th className="p-4">Order Amount</th>
                                            <th className="p-4">Commission</th>
                                            <th className="p-4">Payment</th>
                                            <th className="p-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(orders || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-16 text-slate-500 font-bold uppercase">
                                                    No orders recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            (orders || []).map((o) => (
                                                <tr key={o.orderId} className="hover:bg-white/5 text-slate-200">
                                                    <td className="p-4 font-mono font-bold text-primary">{o.orderId}</td>
                                                    <td className="p-4 font-bold text-white">{o.customerName}</td>
                                                    <td className="p-4 text-slate-300">{o.planName}</td>
                                                    <td className="p-4 font-mono font-bold text-white">₹{Number(o.amount).toLocaleString('en-IN')}</td>
                                                    <td className="p-4 font-mono font-bold text-emerald-400">+₹{Number(o.commissionAmount || 100).toLocaleString('en-IN')}</td>
                                                    <td className="p-4">
                                                        <Badge variant={o.paymentStatus === 'paid' ? 'success' : 'warning'} className="text-[10px]">
                                                            {o.paymentStatus}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 8. SUBSCRIPTIONS */}
                {activeTab === 'subscriptions' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Active Subscriptions</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Lifecycle validity and renewal tracking across all customer groups
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(groups || []).map((g) => {
                                const expiry = g.plan?.validityEndDate ? new Date(g.plan.validityEndDate) : null;
                                const daysLeft = expiry ? Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24)) : 365;
                                return (
                                    <Card key={g.groupId} className="p-6 bg-[#090E1A] border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-mono text-primary font-bold">{g.groupId}</span>
                                            <Badge variant={daysLeft > 30 ? 'success' : 'warning'} className="text-[10px]">
                                                {daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}
                                            </Badge>
                                        </div>
                                        <h3 className="text-base font-black italic uppercase text-white truncate">
                                            {g.institutionName || g.companyName || g.familyName || g.primaryContactName}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">{g.plan?.name || 'Standard Plan'}</p>
                                        <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400 flex justify-between">
                                            <span>Expiry Date:</span>
                                            <span className="font-bold text-white">{expiry ? expiry.toLocaleDateString('en-IN') : '12 Months'}</span>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 9. COMMISSION FINANCIAL LEDGER */}
                {activeTab === 'commission' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Commission Center</h1>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                                    Automatic server-computed earnings & payout ledger
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Total Earned</p>
                                <p className="text-3xl font-black italic text-emerald-400 mt-1">₹{metrics.totalCommissionEarned.toLocaleString('en-IN')}</p>
                            </Card>
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Disbursed (Paid)</p>
                                <p className="text-3xl font-black italic text-white mt-1">₹{metrics.commissionPaid.toLocaleString('en-IN')}</p>
                            </Card>
                            <Card className="p-5 bg-[#090E1A] border-white/10">
                                <p className="text-[10px] font-bold uppercase text-slate-400">Pending Approval / Payout</p>
                                <p className="text-3xl font-black italic text-amber-400 mt-1">₹{metrics.commissionPending.toLocaleString('en-IN')}</p>
                            </Card>
                        </div>

                        <Card className="p-0 bg-[#090E1A] border-white/10 rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#050914] border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="p-4">Commission ID</th>
                                            <th className="p-4">Entity / Client</th>
                                            <th className="p-4">Commission Amount</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Recorded Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(commissions || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-16 text-slate-500 font-bold uppercase">
                                                    No commission records found.
                                                </td>
                                            </tr>
                                        ) : (
                                            (commissions || []).map((c) => (
                                                <tr key={c.id} className="hover:bg-white/5 text-slate-200">
                                                    <td className="p-4 font-mono font-bold text-primary">{c.id}</td>
                                                    <td className="p-4 font-bold text-white">{c.clientName}</td>
                                                    <td className="p-4 font-mono font-black text-emerald-400">+₹{Number(c.amount).toLocaleString('en-IN')}</td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant={c.status === 'paid' ? 'success' : c.status === 'approved' ? 'default' : 'warning'}
                                                            className="text-[10px] uppercase"
                                                        >
                                                            {c.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 10. REPORTS */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Reports & Exports</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Generate audit spreadsheets, client lists, and performance analytics
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-6 bg-[#090E1A] border-white/10">
                                <h3 className="text-base font-black italic uppercase text-white">Customer Directory Export</h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Download complete roster of all enrolled families, schools, colleges, and corporate accounts.
                                </p>
                                <button
                                    onClick={handleExportReport}
                                    className="mt-6 btn-app-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2"
                                >
                                    <Download size={14} /> Download Customers CSV
                                </button>
                            </Card>

                            <Card className="p-6 bg-[#090E1A] border-white/10">
                                <h3 className="text-base font-black italic uppercase text-white">Commission Payout Report</h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Export your complete commission ledger with timestamps and settlement status.
                                </p>
                                <button
                                    onClick={() => {
                                        let csv = 'Commission_ID,Client_Name,Amount,Status,Date\n';
                                        (commissions || []).forEach(c => {
                                            csv += `"${c.id}","${c.clientName}",${c.amount},"${c.status}","${new Date(c.createdAt).toLocaleDateString('en-IN')}"\n`;
                                        });
                                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `RESQR_Commission_Ledger_${Date.now()}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        toast.success('Commission ledger exported.');
                                    }}
                                    className="mt-6 btn-app-secondary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2"
                                >
                                    <Download size={14} /> Download Commission CSV
                                </button>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 11. PRIVACY & SECURITY */}
                {activeTab === 'privacy' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Partner Privacy & Data Protection</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Role-scoped access guidelines under DPDP Act 2023 & Indian HealthTech Standards
                        </p>

                        <div className="space-y-4">
                            <Card className="p-6 bg-[#090E1A] border-white/10">
                                <div className="flex items-start gap-4">
                                    <ShieldCheck className="text-primary shrink-0" size={32} />
                                    <div className="space-y-2">
                                        <h3 className="text-base font-black italic uppercase text-white">Agent Role Access Boundaries</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            As an authorized RESQR field partner, your role permissions are strictly confined to customer onboarding, plan assignment, QR tag dispatch, and commission auditing.
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                                <p className="font-bold">✓ Authorized Agent Access</p>
                                                <ul className="list-disc list-inside mt-1 text-[11px] space-y-1">
                                                    <li>Organization / Family contact details</li>
                                                    <li>Order & payment lifecycle records</li>
                                                    <li>QR activation & dispatch status</li>
                                                    <li>Commission ledger & sales analytics</li>
                                                </ul>
                                            </div>
                                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                                                <p className="font-bold">✗ Strictly Restricted Data</p>
                                                <ul className="list-disc list-inside mt-1 text-[11px] space-y-1">
                                                    <li>Detailed medical diagnostic dossiers</li>
                                                    <li>Hospital face recognition embeddings</li>
                                                    <li>Insurance policy numbers & claims</li>
                                                    <li>Private residential unmasked addresses</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 12. SUPPORT */}
                {activeTab === 'support' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-black italic uppercase font-poppins text-white">Partner Support & Helpdesk</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Direct technical assistance, bulk tag ordering, and partner onboarding helpline
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-6 bg-[#090E1A] border-white/10">
                                <h3 className="text-base font-black italic uppercase text-white">Direct Partner Helpline</h3>
                                <p className="text-xs text-slate-400 mt-1">Priority partner channel for urgent deployment issues.</p>
                                <div className="mt-4 space-y-2 text-xs font-mono">
                                    <p className="text-primary font-bold">📞 +91 99999 99999 / +91 88888 88888</p>
                                    <p className="text-slate-300">✉️ partners@resqr.co.in</p>
                                    <p className="text-slate-400">🕒 Mon–Sat: 9:00 AM – 8:00 PM IST</p>
                                </div>
                            </Card>

                            <Card className="p-6 bg-[#090E1A] border-white/10">
                                <h3 className="text-base font-black italic uppercase text-white">Physical Tag Restocking</h3>
                                <p className="text-xs text-slate-400 mt-1">Request batches of physical QR smart stickers, cards, and wristbands.</p>
                                <button
                                    onClick={() => toast.success('Sticker dispatch request submitted to logistics team.')}
                                    className="mt-6 btn-app-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2"
                                >
                                    <ShoppingBag size={14} /> Request 50 Physical Tags
                                </button>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showCreateCustomer && (
                <CreateCustomerModal
                    isOpen={showCreateCustomer}
                    onClose={() => setShowCreateCustomer(false)}
                    agent={currentAgent}
                    defaultCategory={createCategoryDefault}
                    onCreated={() => {
                        setShowCreateCustomer(false);
                    }}
                />
            )}

            {selectedGroupForDetails && (
                <GroupDetailsModal
                    isOpen={!!selectedGroupForDetails}
                    onClose={() => setSelectedGroupForDetails(null)}
                    group={selectedGroupForDetails}
                    agent={currentAgent}
                />
            )}

            {selectedGroupForBulk && (
                <BulkUploadModal
                    isOpen={!!selectedGroupForBulk}
                    onClose={() => setSelectedGroupForBulk(null)}
                    group={selectedGroupForBulk}
                    agent={currentAgent}
                    onComplete={() => setSelectedGroupForBulk(null)}
                />
            )}
        </div>
    );
}
