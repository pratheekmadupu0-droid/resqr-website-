import { useState, useEffect } from 'react';
import {
    Users, GraduationCap, BookOpen, Building2, User, X, Search,
    Upload, Download, QrCode, Shield, CheckCircle2, Clock,
} from 'lucide-react';
import { CUSTOMER_CATEGORIES, CUSTOMER_CATEGORY_TYPES } from '../../lib/agentCategoriesConfig';
import { listenGroupMembers } from '../../lib/agents';
import { Badge } from '../ui/Badge';
import BulkUploadModal from './BulkUploadModal';

const ICONS = {
    Users,
    GraduationCap,
    BookOpen,
    Building2,
    User,
};

export default function GroupDetailsModal({ isOpen, onClose, group, agent }) {
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState('');
    const [divisionFilter, setDivisionFilter] = useState('all');
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        if (!group?.groupId) return;
        const unsub = listenGroupMembers(group.groupId, (list) => {
            setMembers(list);
        });
        return () => { if (unsub) unsub(); };
    }, [group?.groupId]);

    if (!isOpen || !group) return null;

    const catConfig = CUSTOMER_CATEGORIES[group.categoryType] || CUSTOMER_CATEGORIES[CUSTOMER_CATEGORY_TYPES.INDIVIDUAL];
    const CategoryIcon = ICONS[catConfig.icon] || Users;

    // Distinct divisions / classes / departments for filtering
    const divisions = Array.from(new Set(members.map(m => m.divisionOrDept || m.relationship).filter(Boolean)));

    const filteredMembers = members.filter(m => {
        const matchesSearch = !search.trim() ||
            (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (m.phone || '').includes(search.trim()) ||
            (m.resqrId || m.memberId || '').toLowerCase().includes(search.toLowerCase());

        const matchesDiv = divisionFilter === 'all' ||
            m.divisionOrDept === divisionFilter ||
            m.relationship === divisionFilter;

        return matchesSearch && matchesDiv;
    });

    const expiryDate = group.plan?.validityEndDate
        ? new Date(group.plan.validityEndDate).toLocaleDateString('en-IN')
        : 'Active (12 Months)';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-[#090E1A] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl my-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                            <CategoryIcon size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {catConfig.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 font-bold">
                                    ID: {group.groupId}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black italic uppercase font-poppins text-white mt-1">
                                {group.institutionName || group.companyName || group.familyName || group.name || 'Customer Entity'}
                            </h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {group.city || 'India'} {group.address ? `· ${group.address}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start">
                        {catConfig.allowBulkUpload && (
                            <button
                                type="button"
                                onClick={() => setShowBulkModal(true)}
                                className="btn-app-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Upload size={14} /> Bulk CSV Import
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Entity Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 text-xs">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Contact</p>
                        <p className="text-sm font-bold text-white mt-1">
                            {group.principalName || group.hrAdminName || group.administratorName || group.primaryContactName || 'Authorized Head'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {group.contactPhone || group.primaryPhone || '—'}
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Members</p>
                        <p className="text-sm font-bold text-white mt-1">
                            {members.length} <span className="text-slate-400 text-xs font-normal">/ {group.plan?.memberCapacity || '—'} Capacity</span>
                        </p>
                        <p className="text-[11px] text-emerald-400 font-bold mt-0.5">Active QR Fleet</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan & Package</p>
                        <p className="text-sm font-bold text-white mt-1 truncate">{group.plan?.name || 'Standard Package'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Expires: {expiryDate}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Emergency Liaison</p>
                        <p className="text-sm font-bold text-primary mt-1 font-mono">
                            {group.campusEmergencyContact || group.corporateEmergencyContact || group.familyEmergencyContact || '24/7 Desk'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Campus/Family Emergency Line</p>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${catConfig.memberNoun || 'members'}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#050914] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                        />
                    </div>

                    {divisions.length > 0 && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Filter:</span>
                            <select
                                value={divisionFilter}
                                onChange={(e) => setDivisionFilter(e.target.value)}
                                className="bg-[#050914] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
                            >
                                <option value="all">All ({divisions.length})</option>
                                {divisions.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Member Roster Table */}
                <div className="rounded-2xl border border-white/10 bg-[#050914] overflow-hidden max-h-80 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 font-bold uppercase text-xs tracking-wider">
                            No member records found. Click &quot;Bulk CSV Import&quot; to upload member directory.
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#090E1A] border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="p-3">RESQR ID</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">{catConfig.containerNoun || 'Department / Role'}</th>
                                    <th className="p-3">Phone</th>
                                    <th className="p-3">Emergency Contact</th>
                                    <th className="p-3">QR Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredMembers.map((member) => (
                                    <tr key={member.memberId || member.resqrId} className="hover:bg-white/5 text-slate-200">
                                        <td className="p-3 font-mono font-bold text-primary">
                                            {member.resqrId || member.memberId}
                                        </td>
                                        <td className="p-3 font-bold text-white">{member.name}</td>
                                        <td className="p-3 text-slate-400">{member.divisionOrDept || member.relationship || '—'}</td>
                                        <td className="p-3 font-mono text-slate-400">{member.phone || '—'}</td>
                                        <td className="p-3 font-mono text-slate-400">{member.emergencyContact || member.parentPhone || '—'}</td>
                                        <td className="p-3">
                                            <Badge variant={member.qrStatus === 'activated' ? 'success' : 'default'} className="text-[10px]">
                                                {member.qrStatus === 'activated' ? 'Active QR' : 'Generated'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Privacy Badge */}
                <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-primary shrink-0" />
                        <span>Medical history records are role-gated under DPDP Act and encrypted for hospital triage only.</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Encrypted Vault</span>
                </div>

                {/* Bulk Upload Modal */}
                {showBulkModal && (
                    <BulkUploadModal
                        isOpen={showBulkModal}
                        onClose={() => setShowBulkModal(false)}
                        group={group}
                        agent={agent}
                        onComplete={() => setShowBulkModal(false)}
                    />
                )}
            </div>
        </div>
    );
}
