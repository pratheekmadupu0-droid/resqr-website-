import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, MessageCircle, Users, CheckCircle2, Clock, X,
    AlertTriangle, RefreshCw, Check, Ban, Info, UserCheck,
    History as HistoryIcon, ExternalLink, Sparkles, Copy
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { db, auth } from '../../lib/firebase';
import { ref, get, onValue, push, update, serverTimestamp } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

// ============================================================
// RESQR MANUAL WHATSAPP MESSAGING
// - Uses standard wa.me deep links ONLY.
// - NO WhatsApp Business API, NO tokens, NO automatic sending.
// - The admin always presses SEND inside WhatsApp themselves.
// ============================================================

// Same authorized admin list used by the existing RESQR admin system
const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in'
];

// RESQR Admin WhatsApp SENDER account (the account the admin sends from manually).
// NEVER used as a recipient — recipients always come from the selected user's Firebase profile.
const ADMIN_SENDER = {
    raw: '9441151466',
    waNumber: '919441151466',
    display: '+91 94411 51466'
};

const MESSAGE_TEMPLATES = [
    {
        id: 'welcome',
        name: 'Welcome to RESQR',
        body: 'Hi {{name}} 👋\n\nWelcome to RESQR!\n\nYour emergency profile has been successfully created.\n\nYour RESQR emergency profile is now ready.\n\nYou can access and manage your emergency information anytime from your RESQR account.\n\nStay safe,\nTeam RESQR'
    },
    {
        id: 'profile_completed',
        name: 'Profile Completed',
        body: 'Hi {{name}} 👋\n\nGreat news! Your RESQR emergency profile has been completed.\n\nAll your important emergency information is now organized and ready when it matters most.\n\nStay safe,\nTeam RESQR'
    },
    {
        id: 'qr_ready',
        name: 'QR Ready',
        body: 'Hi {{name}} 👋\n\nYour RESQR emergency QR is now ready!\n\nYou can view, download and share it anytime from your RESQR dashboard.\n\nStay safe,\nTeam RESQR'
    },
    {
        id: 'complete_profile',
        name: 'Complete Your RESQR Profile',
        body: 'Hi {{name}} 👋\n\nWelcome to RESQR!\n\nYour registration is complete, but your emergency profile setup is still pending.\n\nComplete your profile today so your emergency information is ready when it matters most.\n\nNeed help? Just reply to this message.\n\nStay safe,\nTeam RESQR'
    },
    {
        id: 'vinayaka',
        name: 'Vinayaka Chavithi Welcome',
        body: '🙏 Happy Vinayaka Chavithi, {{name}}!\n\nMay Lord Ganesha bring health, safety and happiness to you and your loved ones.\n\nWelcome to RESQR.\n\nYour emergency profile is now ready.\n\nStay safe and have a wonderful Vinayaka Chavithi! 🪔\n\nTeam RESQR'
    },
    {
        id: 'custom',
        name: 'Custom Message',
        body: ''
    }
];

const STATUS_META = {
    not_sent: { label: 'Not Sent', cls: 'bg-slate-700/40 text-slate-400 border-slate-600/40' },
    whatsapp_opened: { label: 'WhatsApp Opened', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    sent_manually: { label: 'Sent Manually', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    failed: { label: 'Failed', cls: 'bg-red-500/10 text-red-400 border-red-500/30' }
};

const parseDateMs = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const t = new Date(val).getTime();
    return Number.isNaN(t) ? 0 : t;
};

const formatDate = (val) => {
    const ms = parseDateMs(val);
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Normalize an Indian phone number into wa.me format (91XXXXXXXXXX).
// Handles: 9876543210, +91 98765 43210, 09876543210, 919876543210, spaces/dashes.
const normalizePhone = (raw) => {
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
        return { valid: false, waNumber: null, display: '', reason: 'missing' };
    }
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
    let candidate = null;
    if (digits.length === 10 && /^[6-9]/.test(digits)) candidate = '91' + digits;
    else if (digits.length === 11 && digits.startsWith('0')) candidate = '91' + digits.slice(1);
    else if (digits.length === 12 && digits.startsWith('91')) candidate = digits;
    if (candidate && /^91[6-9]\d{9}$/.test(candidate)) {
        return {
            valid: true,
            waNumber: candidate,
            display: '+91 ' + candidate.slice(2, 7) + ' ' + candidate.slice(7)
        };
    }
    return { valid: false, waNumber: null, display: raw, reason: 'invalid' };
};

// Replace supported {{variables}} with the real user's data
const personalizeMessage = (text, user, profileId) => {
    if (!text) return '';
    return String(text)
        .replace(/{{\s*name\s*}}/g, (user && user.name) || 'there')
        .replace(/{{\s*phone\s*}}/g, (user && user.phoneInfo && user.phoneInfo.display) || (user && user.phone) || '—')
        .replace(/{{\s*email\s*}}/g, (user && user.email) || '—')
        .replace(/{{\s*profileId\s*}}/g, profileId || '—');
};

export default function WhatsAppMessaging({ users = [], profilesList = [] }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | completed | incomplete | messaged | not_messaged
    const [selectedIds, setSelectedIds] = useState([]);
    const [composer, setComposer] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [dbError, setDbError] = useState(false);
    const [adminReady, setAdminReady] = useState(false);

    // ---- Admin authorization (reuse existing RESQR admin model) ----
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (cu) => {
            if (!cu) { setAdminReady(false); return; }
            try {
                const uSnap = await get(ref(db, `users/${cu.uid}`));
                const ud = uSnap.exists() ? uSnap.val() : {};
                const rtdbEmail = ud.email;
                const allowed = (cu.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cu.email.toLowerCase())) ||
                    (rtdbEmail && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(String(rtdbEmail).toLowerCase())) ||
                    ud.role === 'admin';
                setAdminReady(!!allowed);
            } catch {
                setAdminReady(!!(cu.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cu.email.toLowerCase())));
            }
        });
        return () => unsub();
    }, []);

    // ---- Load WhatsApp history from existing Firebase RTDB ----
    useEffect(() => {
        if (!adminReady) return;
        const notifRef = ref(db, 'notifications');
        let unsub;
        try {
            unsub = onValue(notifRef, (snap) => {
                const val = snap.val() || {};
                const rows = Object.entries(val)
                    .map(([id, rec]) => ({ id, ...rec }))
                    .filter(r => r && r.channel === 'whatsapp')
                    .sort((a, b) => parseDateMs(b.createdAt) - parseDateMs(a.createdAt))
                    .slice(0, 200);
                setHistory(rows);
                setHistoryLoading(false);
                setDbError(false);
            }, () => { setDbError(true); setHistoryLoading(false); });
        } catch {
            setDbError(true);
            setHistoryLoading(false);
        }
        return () => { if (unsub) unsub(); };
    }, [adminReady]);

    // ---- Build list from EXISTING users + profiles data (no new writes) ----
    const waUsers = useMemo(() => {
        const profileByUserId = {};
        (profilesList || []).forEach(p => {
            if (p && p.userId && !profileByUserId[p.userId]) profileByUserId[p.userId] = p;
        });
        const seen = new Set();
        const list = [];
        (users || []).forEach(u => {
            if (!u || !u.id || seen.has(u.id)) return;
            seen.add(u.id);
            const prof = profileByUserId[u.id];
            const phone = u.phone || (prof && prof.phone) || '';
            const phoneInfo = normalizePhone(phone);
            const hasProfile = !!prof;
            const pct = hasProfile ? (prof.completion ? Number(prof.completion) : 100) : 0;
            list.push({
                id: u.id,
                name: u.name || (prof && prof.name) || u.email || 'Unnamed User',
                email: u.email || '',
                phone,
                phoneInfo,
                role: u.role || 'citizen',
                registered: hasProfile || u.registered === true,
                profileCompletion: pct,
                profileId: prof ? (prof.id || u.id) : u.id
            });
        });
        return list;
    }, [users, profilesList]);

    const stats = useMemo(() => {
        const registered = waUsers.filter(u => u.registered).length;
        const completed = waUsers.filter(u => u.registered && u.profileCompletion >= 100).length;
        const sent = history.filter(h => h.status === 'sent_manually').length;
        const opened = history.filter(h => h.status === 'whatsapp_opened' || h.status === 'sent_manually').length;
        const messagedUserIds = new Set(history.map(h => h.userId).filter(Boolean));
        const pending = waUsers.filter(u => u.phoneInfo.valid && !messagedUserIds.has(u.id)).length;
        return { registered, completed, opened, sent, pending };
    }, [waUsers, history]);

    const statusByUser = useMemo(() => {
        const map = {};
        history.forEach(h => {
            if (!h.userId) return;
            const rank = { sent_manually: 3, whatsapp_opened: 2, failed: 1 };
            if (!map[h.userId] || (rank[h.status] || 0) > (rank[map[h.userId].status] || 0)) {
                map[h.userId] = h;
            }
        });
        return map;
    }, [history]);

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        return waUsers.filter(u => {
            if (q && !(
                (u.name || '').toLowerCase().includes(q) ||
                (u.phone || '').includes(q) ||
                (u.phoneInfo.waNumber || '').includes(q.replace(/\D/g, '')) ||
                (u.email || '').toLowerCase().includes(q)
            )) return false;
            const st = statusByUser[u.id];
            if (filter === 'completed') return u.registered && u.profileCompletion >= 100;
            if (filter === 'incomplete') return !u.registered || u.profileCompletion < 100;
            if (filter === 'messaged') return !!st;
            if (filter === 'not_messaged') return !st;
            return true;
        });
    }, [waUsers, search, filter, statusByUser]);

    const newestCompleted = useMemo(() =>
        filteredUsers
            .filter(u => u.registered && u.profileCompletion >= 100)
            .slice(0, 3), [filteredUsers]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const openComposer = (user) => {
        if (!user) { toast.error('User not found.'); return; }
        if (!user.phoneInfo.valid) {
            toast.error(user.phoneInfo.reason === 'missing'
                ? 'No phone number available for this user.'
                : 'Invalid phone number.');
            return;
        }
        // Safety: the admin sender account must never be used as a recipient.
        if (user.phoneInfo.waNumber === ADMIN_SENDER.waNumber) {
            toast.error("This user's phone matches the RESQR admin sender account. Verify the user's number in Firebase first.");
            return;
        }
        setComposer({ user, templateId: 'welcome', text: '', previewMode: false, bulkIndex: null, bulkQueue: null });
    };

    if (!adminReady) {
        return (
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 text-center">
                <AlertTriangle className="text-amber-400 mx-auto mb-3" size={28} />
                <p className="text-slate-300 font-semibold">Verifying administrator access…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SenderBanner />
            <StatsBar stats={stats} />
            <SectionHeader
                search={search} setSearch={setSearch}
                filter={filter} setFilter={setFilter}
                selectedIds={selectedIds} filteredUsers={filteredUsers}
                onPrepareBulk={() => {
                    const queue = filteredUsers.filter(u => selectedIds.includes(u.id) && u.phoneInfo.valid);
                    if (!queue.length) { toast.error('No selected users with a valid phone number.'); return; }
                    setComposer({ user: queue[0], templateId: 'welcome', text: '', previewMode: false, bulkQueue: queue, bulkIndex: 0 });
                }}
            />
            {newestCompleted.length > 0 && (
                <NewUsersStrip users={newestCompleted} onSend={openComposer} />
            )}
            <UserGrid users={filteredUsers} statusByUser={statusByUser} onSend={openComposer}
                selectedIds={selectedIds} toggleSelect={toggleSelect} />
            <HistoryPanel history={history} loading={historyLoading} dbError={dbError}
                onMarkSent={async (row) => {
                    try {
                        await update(ref(db, `notifications/${row.id}`), { status: 'sent_manually', sentAt: serverTimestamp() });
                        toast.success('Marked as Sent Manually');
                    } catch { toast.error('Could not update status. Check your connection.'); }
                }}
                onMarkFailed={async (row) => {
                    try {
                        await update(ref(db, `notifications/${row.id}`), { status: 'failed', failedAt: serverTimestamp() });
                        toast.success('Marked as Failed');
                    } catch { toast.error('Could not update status. Check your connection.'); }
                }}
            />
            <AnimatePresence>
                {composer && (
                    <ComposerModal key={composer.user.id} composer={composer} setComposer={setComposer} onClose={() => setComposer(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============ SUB-COMPONENTS ============

function SenderBanner() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-2xl bg-[#25D366]/[0.06] border border-[#25D366]/20 px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.8)] shrink-0" aria-hidden="true" />
                <p className="text-xs text-slate-300 font-semibold truncate">
                    Sending from <span className="text-[#25D366] font-black">RESQR Admin</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-1.5">{ADMIN_SENDER.display}</span>
                </p>
            </div>
            <p className="text-[10px] text-slate-500 font-medium sm:ml-auto sm:text-right leading-relaxed">
                Recipients always come from each user's Firebase profile. WhatsApp opens on the device logged in with this account.
            </p>
        </div>
    );
}

function StatsBar({ stats }) {
    const items = [
        { label: 'Registered Users', value: stats.registered, icon: Users, tone: 'text-sky-400' },
        { label: 'Completed Profiles', value: stats.completed, icon: UserCheck, tone: 'text-emerald-400' },
        { label: 'Messages Opened', value: stats.opened, icon: MessageCircle, tone: 'text-amber-400' },
        { label: 'Sent Manually', value: stats.sent, icon: CheckCircle2, tone: 'text-emerald-400' },
        { label: 'Pending', value: stats.pending, icon: Clock, tone: 'text-slate-400' }
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {items.map((it) => (
                <motion.div key={it.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-slate-900/60 border border-white/5 p-4">
                    <it.icon size={18} className={it.tone} />
                    <p className="mt-2 text-2xl font-black text-white leading-none">{it.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{it.label}</p>
                </motion.div>
            ))}
        </div>
    );
}

const FILTERS = [
    { id: 'all', label: 'All Users' },
    { id: 'completed', label: 'Completed Registration' },
    { id: 'incomplete', label: 'Incomplete Registration' },
    { id: 'messaged', label: 'Message Sent' },
    { id: 'not_messaged', label: 'Message Not Sent' }
];

function SectionHeader({ search, setSearch, filter, setFilter, selectedIds, filteredUsers, onPrepareBulk }) {
    return (
        <div className="rounded-3xl bg-slate-900/40 border border-white/5 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        aria-label="Search users by name, phone or email"
                        className="w-full bg-slate-950/70 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-primary/60 transition-colors"
                    />
                </div>
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <Button onClick={onPrepareBulk} className="w-full md:w-auto">
                                <MessageCircle size={14} /> Selected: {selectedIds.length} — Prepare WhatsApp
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Filter users">
                {FILTERS.map(f => (
                    <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wide whitespace-nowrap border transition-all ${filter === f.id
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                            : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-slate-200'}`}>
                        {f.label}
                    </button>
                ))}
            </div>
            <p className="text-xs text-slate-500 font-semibold">
                Showing {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
                {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
                <span className="hidden md:inline"> · Messages are sent manually by you inside WhatsApp</span>
            </p>
        </div>
    );
}

function NewUsersStrip({ users, onSend }) {
    return (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-[10px] uppercase font-black tracking-[0.25em] text-emerald-400 mb-3">New RESQR Users</p>
            <div className="space-y-3">
                {users.map(u => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-2xl bg-slate-950/50 border border-white/5 p-4">
                        <div>
                            <p className="text-white font-bold text-sm">{u.name}</p>
                            <p className="text-slate-400 text-xs">Registration completed{u.phoneInfo.valid ? ` · ${u.phoneInfo.display}` : ' · no phone on file'}</p>
                        </div>
                        <Button onClick={() => onSend(u)} className="w-full sm:w-auto shrink-0">
                            <MessageCircle size={14} /> Send Welcome WhatsApp
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UserGrid({ users, statusByUser, onSend, selectedIds, toggleSelect }) {
    if (!users.length) {
        return (
            <div className="rounded-3xl bg-slate-900/40 border border-white/5 p-10 text-center">
                <Users className="mx-auto text-slate-600 mb-3" size={32} />
                <p className="text-slate-400 font-semibold">No users match this view.</p>
                <p className="text-slate-600 text-xs mt-1">Try a different search or filter.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {users.map((u, i) => {
                const st = statusByUser[u.id];
                const statusMeta = st ? (STATUS_META[st.status] || STATUS_META.not_sent) : STATUS_META.not_sent;
                const checked = selectedIds.includes(u.id);
                return (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 sm:p-5 flex gap-3 items-start hover:border-white/10 transition-colors">
                        <label className="pt-1 cursor-pointer shrink-0" aria-label={`Select ${u.name} for batch messaging`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleSelect(u.id)}
                                className="w-5 h-5 rounded accent-[var(--color-primary)] cursor-pointer" />
                        </label>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-white font-bold text-sm truncate">{u.name}</p>
                                {u.registered
                                    ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Registered</Badge>
                                    : <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Incomplete</Badge>}
                                <Badge className={`${statusMeta.cls} ml-auto`}>{statusMeta.label}</Badge>
                            </div>
                            <p className="text-slate-400 text-xs mt-1.5">{u.phoneInfo.valid ? u.phoneInfo.display : (u.phone || 'No phone number')}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-1.5 flex-1 max-w-[140px] rounded-full bg-slate-800 overflow-hidden">
                                    <div className={`h-full rounded-full ${u.profileCompletion >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min(Math.max(u.profileCompletion, 4), 100)}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {u.registered ? `Profile ${u.profileCompletion}%` : 'No profile yet'}
                                </span>
                            </div>
                        </div>
                        <Button onClick={() => onSend(u)} className="shrink-0 !px-4">
                            <MessageCircle size={14} /> <span className="hidden sm:inline">Send WhatsApp</span><span className="sm:hidden">Send</span>
                        </Button>
                    </motion.div>
                );
            })}
        </div>
    );
}

function HistoryPanel({ history, loading, dbError, onMarkSent, onMarkFailed }) {
    return (
        <div className="rounded-3xl bg-slate-900/40 border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-4">
                <HistoryIcon size={16} className="text-primary" />
                <h3 className="text-white font-black uppercase tracking-wider text-xs">WhatsApp History</h3>
                <Badge className="ml-auto bg-slate-800 text-slate-400 border-white/10">{history.length} record{history.length === 1 ? '' : 's'}</Badge>
            </div>
            {loading && (
                <p className="text-slate-500 text-xs py-6 text-center flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin" /> Loading history…
                </p>
            )}
            {!loading && dbError && (
                <p className="text-amber-400/80 text-xs py-4 text-center flex items-center justify-center gap-2">
                    <Info size={14} /> Could not load history right now. Messaging still works.
                </p>
            )}
            {!loading && !dbError && history.length === 0 && (
                <p className="text-slate-600 text-xs py-6 text-center">
                    No WhatsApp messages yet. Open WhatsApp for a user to create the first record.
                </p>
            )}
            {!loading && !dbError && history.length > 0 && (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {history.map(h => {
                        const meta = STATUS_META[h.status] || STATUS_META.not_sent;
                        const preview = (h.message || '').replace(/\s+/g, ' ').slice(0, 90);
                        return (
                            <div key={h.id} className="rounded-2xl bg-slate-950/60 border border-white/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-white font-bold text-sm">{h.userName || 'Unknown user'}</p>
                                        <Badge className={meta.cls}>{meta.label}</Badge>
                                    </div>
                                    <p className="text-slate-400 text-xs mt-1 truncate">{h.templateName || 'Custom Message'} · {preview || '—'}</p>
                                    <p className="text-slate-600 text-[10px] mt-1">{formatDate(h.createdAt)}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {h.status !== 'sent_manually' && (
                                        <button onClick={() => onMarkSent(h)}
                                            className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black uppercase tracking-wide hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
                                            <Check size={12} /> Mark Sent
                                        </button>
                                    )}
                                    {h.status !== 'failed' && (
                                        <button onClick={() => onMarkFailed(h)}
                                            className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-black uppercase tracking-wide hover:bg-red-500/20 transition-colors flex items-center gap-1.5">
                                            <Ban size={12} /> Failed
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ComposerModal({ composer, setComposer, onClose }) {
    const { user, bulkQueue, bulkIndex } = composer;
    const [templateId, setTemplateId] = useState(composer.templateId || 'welcome');
    const [text, setText] = useState(() => {
        const t = MESSAGE_TEMPLATES.find(t => t.id === (composer.templateId || 'welcome'));
        return t ? t.body : '';
    });
    const [opening, setOpening] = useState(false);
    const isCustom = templateId === 'custom';
    const bulkTotal = bulkQueue ? bulkQueue.length : 0;

    const applyTemplate = (id) => {
        setTemplateId(id);
        const t = MESSAGE_TEMPLATES.find(t => t.id === id);
        setText(t ? t.body : '');
    };

    const preview = personalizeMessage(text, user, user.profileId);

    // Manual only: opens WhatsApp with pre-filled chat. NEVER sends automatically.
    const handleOpenWhatsApp = async () => {
        if (!preview.trim()) { toast.error('Write a message first.'); return; }
        if (!user.phoneInfo.valid) {
            toast.error(user.phoneInfo.reason === 'missing'
                ? 'No phone number available for this user.'
                : 'Invalid phone number.');
            return;
        }
        // Defense-in-depth: never send TO the RESQR admin sender account.
        if (user.phoneInfo.waNumber === ADMIN_SENDER.waNumber) {
            toast.error("This user's phone matches the RESQR admin sender account. Verify the user's number in Firebase first.");
            return;
        }
        setOpening(true);
        try {
            const waUrl = `https://wa.me/${user.phoneInfo.waNumber}?text=${encodeURIComponent(preview)}`;
            let opened = false;
            try {
                const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
                opened = !!(win && typeof win === 'object');
                if (win && win.focus) { try { win.focus(); } catch { /* ignore */ } }
            } catch { opened = false; }
            if (!opened) {
                toast.error('Popup blocked — opening WhatsApp in this tab instead.', { duration: 4000 });
                window.location.href = waUrl;
            }
            // Record only "WhatsApp Opened" (NOT delivered). Admin sends manually inside WhatsApp.
            const t = MESSAGE_TEMPLATES.find(x => x.id === templateId);
            await push(ref(db, 'notifications'), {
                userId: user.id,
                channel: 'whatsapp',
                userName: user.name,
                userPhone: user.phoneInfo.display,
                message: preview,
                templateId,
                templateName: t ? t.name : 'Custom Message',
                status: 'whatsapp_opened',
                createdAt: serverTimestamp(),
                openedAt: serverTimestamp()
            });
            toast.success('WhatsApp opened — press SEND inside WhatsApp.');
        } catch {
            toast.error('Could not open WhatsApp. Please try again.');
        } finally {
            setOpening(false);
        }
    };

    // Bulk is manual: prepare next selected user only after this one is handled.
    const handleSkip = () => {
        if (bulkQueue && bulkIndex + 1 < bulkQueue.length) {
            const nextUser = bulkQueue[bulkIndex + 1];
            const t = MESSAGE_TEMPLATES.find(x => x.id === templateId);
            const nextText = templateId === 'custom' ? '' : (t ? t.body : '');
            setComposer({ user: nextUser, templateId, text: nextText, previewMode: false, bulkQueue, bulkIndex: bulkIndex + 1 });
        } else {
            onClose();
        }
    };

    return (
        <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <motion.div role="dialog" aria-modal="true" aria-label="Send WhatsApp message"
                initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="relative w-full sm:max-w-lg max-h-[94vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0B1220] border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center shrink-0">
                        <MessageCircle size={18} className="text-[#25D366]" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-white font-black text-sm tracking-wide">Send WhatsApp Message</h3>
                        {bulkTotal > 1 && (
                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                Bulk · Message {bulkIndex + 1} of {bulkTotal} (manual, one at a time)
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} aria-label="Close"
                        className="ml-auto w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* From (RESQR admin sender account) / To (from Firebase) */}
                    <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-4 space-y-3">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
                                From — RESQR Admin
                            </p>
                            <p className="text-slate-300 text-xs font-mono">{ADMIN_SENDER.display}</p>
                        </div>
                        <div className="pt-3 border-t border-white/5">
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-1">To</p>
                            <p className="text-white font-bold text-sm">{user.name}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{user.phoneInfo.display}</p>
                            {user.email && <p className="text-slate-600 text-[10px] mt-0.5">{user.email}</p>}
                        </div>
                    </div>

                    {/* Template picker */}
                    <div>
                        <label htmlFor="wa-template" className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 block mb-2">
                            Message Template
                        </label>
                        <div className="relative">
                            <Sparkles size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                            <select id="wa-template" value={templateId} onChange={(e) => applyTemplate(e.target.value)}
                                className="w-full appearance-none bg-slate-950/70 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm text-white outline-none focus:border-primary/60 transition-colors cursor-pointer">
                                {MESSAGE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Editable message */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label htmlFor="wa-text" className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">
                                {isCustom ? 'Write your WhatsApp message here…' : 'Message (editable)'}
                            </label>
                            <span className="text-[10px] text-slate-600 font-bold">{text.length} chars</span>
                        </div>
                        <textarea id="wa-text" rows={isCustom ? 8 : 7} value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={isCustom ? 'Write your WhatsApp message here…' : 'Edit the message before opening WhatsApp…'}
                            className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-primary/60 transition-colors resize-y leading-relaxed" />
                        <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1.5">
                            <Copy size={10} /> Variables: {'{{name}}'} {'{{phone}}'} {'{{email}}'} {'{{profileId}}'}
                        </p>
                    </div>

                    {/* Live preview */}
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-2">Message Preview</p>
                        <div className="rounded-2xl bg-[#0B141A] border border-white/10 p-4">
                            <div className="rounded-2xl rounded-tr-sm bg-[#005C4B] px-4 py-3">
                                {preview.trim()
                                    ? <p className="text-[13px] leading-relaxed text-[#E9EDEF] whitespace-pre-wrap break-words">{preview}</p>
                                    : <p className="text-[13px] italic text-[#8696A0]">No message yet…</p>}
                                <p className="text-right text-[10px] text-[#8696A0] mt-1.5">{user.phoneInfo.display}</p>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2 flex items-start gap-1.5">
                                <Info size={10} className="mt-0.5 shrink-0" />
                                Nothing is sent automatically. You will press SEND inside WhatsApp yourself.
                            </p>
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                        <button onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-black uppercase tracking-wider text-xs hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <Button onClick={handleOpenWhatsApp} disabled={opening || !preview.trim()}
                            className="flex-1 !bg-[#25D366] hover:!bg-[#1FB855] !text-[#06251A] disabled:opacity-50 justify-center">
                            {opening ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                            {opening ? 'Opening…' : 'Open WhatsApp'}
                        </Button>
                    </div>
                    {bulkTotal > 1 && (
                        <button onClick={handleSkip}
                            className="w-full text-[11px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-wider py-1 transition-colors">
                            Skip this user →
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
