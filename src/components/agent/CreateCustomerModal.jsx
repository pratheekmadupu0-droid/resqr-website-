import { useState, useEffect } from 'react';
import {
    Users, GraduationCap, BookOpen, Building2, User, X, Check,
    ArrowRight, ArrowLeft, Shield, AlertCircle, Plus, Trash2, Loader2, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CUSTOMER_CATEGORIES, CUSTOMER_CATEGORY_TYPES } from '../../lib/agentCategoriesConfig';
import { createCustomerGroup, enrollClient, getAgentPlansConfig } from '../../lib/agents';

const ICONS = {
    Users,
    GraduationCap,
    BookOpen,
    Building2,
    User,
};

export default function CreateCustomerModal({ isOpen, onClose, agent, onCreated, defaultCategory = null }) {
    const [step, setStep] = useState(1); // 1: Choose Category, 2: Entity Details, 3: Select Plan, 4: Initial Members & Summary
    const [selectedCategory, setSelectedCategory] = useState(defaultCategory || CUSTOMER_CATEGORY_TYPES.FAMILY);
    const [formData, setFormData] = useState({});
    const [availablePlans, setAvailablePlans] = useState({});
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [members, setMembers] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (defaultCategory) {
            setSelectedCategory(defaultCategory);
        }
    }, [defaultCategory]);

    // Load dynamic agent plans from config
    useEffect(() => {
        let isMounted = true;
        const loadPlans = async () => {
            try {
                const plans = await getAgentPlansConfig();
                if (isMounted) {
                    setAvailablePlans(plans);
                }
            } catch (err) {
                console.warn('Failed to load agent plans:', err);
            }
        };
        loadPlans();
        return () => { isMounted = false; };
    }, []);

    // Set default plan when category changes
    useEffect(() => {
        const catPlans = availablePlans[selectedCategory] || CUSTOMER_CATEGORIES[selectedCategory]?.defaultPlans || [];
        if (catPlans.length > 0) {
            setSelectedPlan(catPlans[0]);
            // If family plan, pre-populate member slots matching plan memberCount
            if (selectedCategory === CUSTOMER_CATEGORY_TYPES.FAMILY) {
                const count = catPlans[0].memberCount || 4;
                const initialSlots = Array.from({ length: count }, (_, i) => ({
                    name: i === 0 ? (formData.primaryContactName || '') : '',
                    relationship: i === 0 ? 'Self / Head' : (i === 1 ? 'Spouse' : (i === 2 ? 'Child' : 'Parent')),
                    phone: i === 0 ? (formData.primaryPhone || '') : '',
                    age: '',
                    bloodGroup: 'Unknown / Disclose Later',
                }));
                setMembers(initialSlots);
            } else {
                setMembers([]);
            }
        }
    }, [selectedCategory, availablePlans]);

    if (!isOpen) return null;

    const catConfig = CUSTOMER_CATEGORIES[selectedCategory] || CUSTOMER_CATEGORIES[CUSTOMER_CATEGORY_TYPES.INDIVIDUAL];
    const CategoryIcon = ICONS[catConfig.icon] || Users;
    const plansForCategory = availablePlans[selectedCategory] || catConfig.defaultPlans || [];

    const handleFieldChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        // If primary contact name/phone updated in family, sync to 1st member
        if (selectedCategory === CUSTOMER_CATEGORY_TYPES.FAMILY && members.length > 0) {
            if (key === 'primaryContactName') {
                const updated = [...members];
                if (updated[0]) updated[0].name = value;
                setMembers(updated);
            } else if (key === 'primaryPhone') {
                const updated = [...members];
                if (updated[0]) updated[0].phone = value;
                setMembers(updated);
            }
        }
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        if (selectedCategory === CUSTOMER_CATEGORY_TYPES.FAMILY) {
            const count = plan.memberCount || 4;
            setMembers(prev => {
                const current = [...prev];
                if (current.length < count) {
                    while (current.length < count) {
                        current.push({ name: '', relationship: 'Child', phone: '', age: '', bloodGroup: 'Unknown / Disclose Later' });
                    }
                } else if (current.length > count) {
                    return current.slice(0, count);
                }
                return current;
            });
        }
    };

    const handleMemberChange = (index, key, val) => {
        setMembers(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: val };
            return updated;
        });
    };

    const handleAddMemberSlot = () => {
        setMembers(prev => [
            ...prev,
            { name: '', relationship: 'Other', phone: '', age: '', bloodGroup: 'Unknown / Disclose Later' },
        ]);
    };

    const handleRemoveMemberSlot = (index) => {
        if (members.length <= 1) return;
        setMembers(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep2 = () => {
        for (const field of catConfig.fields) {
            if (field.required && (!formData[field.key] || !String(formData[field.key]).trim())) {
                toast.error(`Please enter ${field.label}.`);
                return false;
            }
        }
        return true;
    };

    const validateStep4 = () => {
        if (selectedCategory === CUSTOMER_CATEGORY_TYPES.FAMILY) {
            for (let i = 0; i < members.length; i++) {
                if (!members[i].name || members[i].name.trim().length < 2) {
                    toast.error(`Please enter a valid name for Family Member #${i + 1}.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateStep4()) return;
        setSubmitting(true);
        const t = toast.loading(`Creating ${catConfig.name} profile...`);

        try {
            if (selectedCategory === CUSTOMER_CATEGORY_TYPES.INDIVIDUAL) {
                // Individual customer registration
                const clientPayload = {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email || '',
                    notes: formData.notes || `Individual Plan (${selectedPlan?.name || 'Standard'})`,
                };
                const res = await enrollClient(agent, clientPayload);
                if (res.duplicate) {
                    toast.error(`A customer with phone ${res.existing?.phoneKey} is already registered.`, { id: t });
                    setSubmitting(false);
                    return;
                }
                toast.success(`Individual customer enrolled! ID: ${res.clientId}`, { id: t });
                if (onCreated) onCreated({ type: 'individual', id: res.clientId });
                onClose();
            } else {
                // Group customer registration (Family, School, College, Corporate)
                const res = await createCustomerGroup(agent, selectedCategory, formData, selectedPlan || plansForCategory[0], members);
                toast.success(`${catConfig.name} created successfully! Group ID: ${res.groupId}`, { id: t, duration: 6000 });
                if (onCreated) onCreated({ type: 'group', id: res.groupId, group: res });
                onClose();
            }
        } catch (err) {
            console.error('Customer creation failed:', err);
            toast.error(err.message || 'Failed to create customer.', { id: t });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-[#090E1A] border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                            Customer Onboarding Wizard · Step {step} of 4
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black italic uppercase font-poppins text-white">
                            {step === 1 && 'Select Customer Category'}
                            {step === 2 && `Setup ${catConfig.name} Profile`}
                            {step === 3 && `Choose ${catConfig.name} Package`}
                            {step === 4 && 'Member Registration & Confirmation'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="grid grid-cols-4 gap-2 my-6">
                    {['Category', 'Entity Info', 'Pricing Plan', 'Members & Review'].map((label, idx) => {
                        const stepNum = idx + 1;
                        const isDone = step > stepNum;
                        const isCurr = step === stepNum;
                        return (
                            <div key={label} className="text-center">
                                <div className={`h-1.5 rounded-full transition-all ${isDone ? 'bg-emerald-500' : isCurr ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-white/10'}`} />
                                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${isCurr ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Step 1: Category Selector */}
                {step === 1 && (
                    <div className="space-y-4 py-2">
                        <p className="text-xs text-slate-400 font-medium">
                            Select the customer classification to load category-specific schemas, bulk onboarding tools, and special partner pricing.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.values(CUSTOMER_CATEGORIES).map((cat) => {
                                const IconComp = ICONS[cat.icon] || Users;
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-primary/10 border-primary shadow-xl shadow-primary/10'
                                                : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-white/10 text-slate-300'}`}>
                                                    <IconComp size={20} />
                                                </div>
                                                {isSelected && (
                                                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                                        <Check size={14} />
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base font-black italic uppercase font-poppins text-white">{cat.label}</h3>
                                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{cat.shortDesc}</p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            <span>ID: {cat.idPrefix}-XXXX</span>
                                            <span className={cat.allowBulkUpload ? 'text-emerald-400' : 'text-slate-500'}>
                                                {cat.allowBulkUpload ? 'Bulk Upload Ready' : 'Single User'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: Entity Form */}
                {step === 2 && (
                    <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-slate-300">
                            <CategoryIcon className="text-primary shrink-0" size={24} />
                            <div>
                                <span className="font-bold text-white uppercase">{catConfig.name} Details</span>
                                <p className="text-[11px] text-slate-400 mt-0.5">Please provide primary contact and organization credentials.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {catConfig.fields.map((field) => (
                                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                        {field.label} {field.required && <span className="text-primary">*</span>}
                                    </label>
                                    <input
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder || ''}
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Select Plan */}
                {step === 3 && (
                    <div className="space-y-4 py-2">
                        <p className="text-xs text-slate-400 font-medium">
                            Choose an authorized partner plan for this {catConfig.name}. Pricing and commissions are dynamically managed from the administrative pricing console.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plansForCategory.map((plan) => {
                                const isSelected = selectedPlan?.id === plan.id;
                                const perUser = plan.perUserRate || (plan.memberCount ? Math.round(plan.basePrice / plan.memberCount) : plan.basePrice);
                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-primary/10 border-primary shadow-xl shadow-primary/10'
                                                : 'bg-white/5 border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                                                    {plan.durationMonths || 12} Months
                                                </span>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                                                        <Check size={12} />
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-black italic uppercase font-poppins text-white">{plan.name}</h3>
                                            <p className="text-2xl font-black italic text-primary mt-2">
                                                ₹{Number(plan.basePrice).toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                                ₹{perUser} / user capacity ({plan.memberCount || 1} users)
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400 font-bold">Your Commission:</span>
                                            <span className="text-emerald-400 font-black">
                                                +₹{Number(plan.commissionAmount || 100).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 4: Members & Summary */}
                {step === 4 && (
                    <div className="space-y-6 py-2 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Summary Card */}
                        <div className="p-5 rounded-2xl bg-[#050914] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category & Name</p>
                                <p className="text-sm font-bold text-white mt-1">
                                    {formData.institutionName || formData.companyName || formData.familyName || formData.name || 'Customer'}
                                </p>
                                <span className="text-[10px] text-primary font-bold uppercase">{catConfig.name}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected Plan</p>
                                <p className="text-sm font-bold text-white mt-1">{selectedPlan?.name || 'Standard Package'}</p>
                                <p className="text-[11px] text-slate-400">Total: ₹{Number(selectedPlan?.basePrice || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent Commission</p>
                                <p className="text-sm font-bold text-emerald-400 mt-1">
                                    +₹{Number(selectedPlan?.commissionAmount || 100).toLocaleString('en-IN')}
                                </p>
                                <p className="text-[10px] text-slate-400">Credited upon confirmation</p>
                            </div>
                        </div>

                        {/* Category Specific Member Setup */}
                        {selectedCategory === CUSTOMER_CATEGORY_TYPES.FAMILY && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                                        Family Member Profiles ({members.length} Members)
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddMemberSlot}
                                        className="btn-app-secondary py-1.5 px-3 text-[11px] font-bold inline-flex items-center gap-1.5"
                                    >
                                        <Plus size={12} /> Add Member Slot
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {members.map((member, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                                    Member #{idx + 1} Name <span className="text-primary">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Full Name"
                                                    value={member.name || ''}
                                                    onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Relationship</label>
                                                <select
                                                    value={member.relationship || 'Self / Head'}
                                                    onChange={(e) => handleMemberChange(idx, 'relationship', e.target.value)}
                                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                                                >
                                                    {['Self / Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'].map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mobile (Optional)</label>
                                                <input
                                                    type="tel"
                                                    placeholder="Phone"
                                                    value={member.phone || ''}
                                                    onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                                                    className="w-full bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Age</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Age"
                                                        value={member.age || ''}
                                                        onChange={(e) => handleMemberChange(idx, 'age', e.target.value)}
                                                        className="w-full bg-[#050914] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                                    />
                                                </div>
                                                {idx > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMemberSlot(idx)}
                                                        className="mt-5 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bulk Upload note for School / College / Corporate */}
                        {(selectedCategory === CUSTOMER_CATEGORY_TYPES.SCHOOL ||
                          selectedCategory === CUSTOMER_CATEGORY_TYPES.COLLEGE ||
                          selectedCategory === CUSTOMER_CATEGORY_TYPES.CORPORATE) && (
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
                                <Sparkles className="shrink-0 text-emerald-400 mt-0.5" size={18} />
                                <div>
                                    <p className="font-bold text-white">Bulk Directory Ready</p>
                                    <p className="text-[11px] text-emerald-300 mt-1">
                                        Once this {catConfig.name} profile is created, you can instantly upload the entire student/staff/employee CSV roster from the entity management tab.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Privacy & Role Notice */}
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400 flex items-start gap-3">
                            <Shield className="shrink-0 text-primary mt-0.5" size={16} />
                            <p>
                                <strong>DPDP Act & Medical Data Privacy:</strong> Agent and administrative accounts are strictly restricted from viewing private medical histories. RESQR identities and QR codes are generated with role-scoped bystander and emergency hospital access.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Navigation Buttons */}
                <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-white/10">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(s => s - 1)}
                            disabled={submitting}
                            className="btn-app-secondary py-3 px-6 text-xs font-bold inline-flex items-center gap-2"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-app-secondary py-3 px-6 text-xs font-bold"
                        >
                            Cancel
                        </button>
                    )}

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (step === 2 && !validateStep2()) return;
                                setStep(s => s + 1);
                            }}
                            className="btn-app-primary py-3 px-8 text-xs font-bold inline-flex items-center gap-2"
                        >
                            Next <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn-app-primary py-3 px-8 text-xs font-bold inline-flex items-center gap-2 shadow-xl shadow-primary/20"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Processing Enrollment...
                                </>
                            ) : (
                                <>
                                    Confirm & Create Customer <Check size={16} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
