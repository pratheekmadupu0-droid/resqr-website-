import React, { useState } from 'react';
import { Shield, Building2, UserCheck, HeartHandshake, CheckCircle2, Send, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { db } from '../lib/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';
import toast from 'react-hot-toast';

export default function PartnersPage() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [org, setOrg] = useState('');
    const [category, setCategory] = useState('Hospital Partnership');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        { title: 'Hospitals & Clinics', desc: 'Secure verified access credentials to speed up emergency ward triage admissions.', icon: <Building2 className="text-primary" size={24} /> },
        { title: 'Ambulance Fleets', desc: 'Equip emergency response vehicles with instant location routing and patient profile scans.', icon: <Zap className="text-emerald-400" size={24} /> },
        { title: 'Verified Doctors', desc: 'Gain authenticated access to patient prescriptions, allergy charts, and health histories.', icon: <UserCheck className="text-blue-400" size={24} /> },
        { title: 'Insurance Partners', desc: 'Accelerate medical claim authorizations with verified pre-admission logs.', icon: <Shield className="text-amber-500" size={24} /> }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !phone || !email || !message) {
            toast.error('Please fill in all required telemetry fields.');
            return;
        }
        setSubmitting(true);
        try {
            const contactRef = ref(db, 'contacts');
            await push(contactRef, {
                name,
                email,
                subject: `${category} inquiry - ${org || 'Independent'}`,
                message: `Phone: ${phone}. Msg: ${message}`,
                priority: 'alert',
                encryption: true,
                timestamp: serverTimestamp()
            });
            toast.success('Partnership inquiry submitted successfully!');
            setName('');
            setPhone('');
            setEmail('');
            setOrg('');
            setMessage('');
        } catch (err) {
            console.error('Error submitting partner inquiry:', err);
            toast.error('Failed to commit partner telemetry to database.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">COLLABORATION NETWORK</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        BUILD THE FUTURE OF EMERGENCY <br />
                        <span className="text-primary italic-display">RESPONSE WITH RESQR.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Partner with India\'s premier emergency identification ecosystem. Sync, coordinate, and scale response metrics.
                    </p>
                </div>
            </section>

            {/* Value Categories Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                    {categories.map((c, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all flex flex-col justify-between border border-white/5">
                            <div>
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 mb-6">
                                    {c.icon}
                                </div>
                                <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{c.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed font-semibold">{c.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Inquiry Form */}
                <div className="max-w-2xl mx-auto bg-medical-card p-10 md:p-16 rounded-[40px] border border-white/5 shadow-2xl relative">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter font-poppins">BECOME A PARTNER</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2">Submit inquiry credentials for secure audit review</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Name *</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-950 border border-white/5 px-5 py-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Frequency *</label>
                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-slate-950 border border-white/5 px-5 py-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Channel *</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950 border border-white/5 px-5 py-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Organization Name</label>
                                <input type="text" value={org} onChange={e => setOrg(e.target.value)} className="w-full bg-slate-950 border border-white/5 px-5 py-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-white" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Partnership Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-950 border border-white/5 px-5 py-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-white">
                                <option value="Hospital Partnership">Hospital & Clinic Partnership</option>
                                <option value="Ambulance Partnership">Ambulance Fleet Partnership</option>
                                <option value="Doctor Partnership">Doctor Clinic Partnership</option>
                                <option value="Enterprise Partnership">Enterprise Corporate Partnership</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Message Payload *</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} className="w-full bg-slate-950 border border-white/5 px-5 py-4 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-white" />
                        </div>

                        <Button type="submit" isLoading={submitting} className="w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest italic shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                            <Send size={16} /> SUBMIT INQUIRY
                        </Button>
                    </form>
                </div>
            </section>
        </div>
    );
}
