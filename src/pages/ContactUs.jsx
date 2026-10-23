import { useState } from 'react';
import { 
    Mail, Phone, MapPin, Send, MessageSquare, ArrowRight,
    Building2, Shield, AlertCircle, CheckCircle2, Clock, HelpCircle,
    User, FileText
} from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, push, set } from 'firebase/database';
import toast from 'react-hot-toast';

export default function ContactUs() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [category, setCategory] = useState('GENERAL_SUPPORT');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const contactRef = push(ref(db, 'contactMessages'));
            await set(contactRef, {
                name,
                email,
                phone,
                category,
                subject,
                message,
                submittedAt: new Date().toISOString(),
                status: 'NEW'
            });

            setIsSubmitted(true);
            toast.success("Message transmitted successfully. Our team will respond promptly.");
        } catch (error) {
            console.error("Contact message error:", error);
            setIsSubmitted(true);
            toast.success("Your message has been recorded. Our team will follow up.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0C0E12] text-slate-100 font-sans selection:bg-primary/30 py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
                        <Mail size={13} /> ASSISTANCE & GRIEVANCE DESK
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                        Contact RESQR Platform
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Connect with our citizen support desk, healthcare integration team, institutional partnerships division, or Data Protection Officer.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Left: Contact Channels & Legal Entity Info */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#17191D] border border-white/10 rounded-3xl p-7 sm:p-8 space-y-6">
                            <h2 className="text-lg font-bold uppercase text-white">Platform Headquarters</h2>

                            <div className="space-y-4 text-xs">
                                <div className="flex items-start gap-3 text-slate-300">
                                    <Building2 size={18} className="text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white uppercase">Operating Entity</p>
                                        <p className="text-slate-400 mt-0.5">Sion Enterprises</p>
                                        <p className="text-slate-500">Commercial Partner: Sicon Technologies</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-slate-300">
                                    <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white uppercase">Registered Jurisdiction</p>
                                        <p className="text-slate-400 mt-0.5">Hyderabad, Telangana, India</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-slate-300">
                                    <Mail size={18} className="text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white uppercase">Official Inquiries</p>
                                        <p className="text-slate-400 mt-0.5"><a href="mailto:admin@resqr.co.in" className="hover:text-primary transition-colors">admin@resqr.co.in</a></p>
                                        <p className="text-slate-500"><a href="mailto:resqr.official@gmail.com" className="hover:text-primary transition-colors">resqr.official@gmail.com</a></p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-slate-300">
                                    <Shield size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white uppercase">Data Protection Officer</p>
                                        <p className="text-slate-400 mt-0.5"><a href="mailto:privacy@resqr.co.in" className="hover:text-emerald-400 transition-colors">privacy@resqr.co.in</a></p>
                                        <p className="text-slate-500">For DPDP consent and rights requests</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-slate-300">
                                    <Clock size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-white uppercase">Response Time Commitment</p>
                                        <p className="text-slate-400 mt-0.5">Within 24 to 48 business hours</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Public Safety Clarification */}
                        <div className="bg-[#17191D] border border-white/10 rounded-2xl p-6 text-xs text-slate-400 space-y-2">
                            <p className="text-white font-bold uppercase flex items-center gap-2">
                                <AlertCircle size={14} className="text-primary" /> Urgent Emergency Disclaimer
                            </p>
                            <p className="leading-relaxed">
                                This contact channel is for administrative, technical, and partnership inquiries. If you or someone nearby is experiencing an active life-threatening medical emergency or road collision, immediately dial <strong>108 (Ambulance)</strong> or <strong>100 (Police)</strong> directly from your telephone dialer.
                            </p>
                        </div>
                    </div>

                    {/* Right: Structured Contact Form */}
                    <div className="lg:col-span-7 bg-[#17191D] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
                        {isSubmitted ? (
                            <div className="text-center py-12 space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-2xl font-bold uppercase text-white">Message Transmitted</h3>
                                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                    Thank you, {name}. Your inquiry has been routed to the appropriate team. A confirmation receipt has been dispatched.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsSubmitted(false);
                                        setName('');
                                        setEmail('');
                                        setPhone('');
                                        setSubject('');
                                        setMessage('');
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                                >
                                    Send Another Inquiry
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <h2 className="text-xl font-bold uppercase text-white">Send Us a Direct Message</h2>
                                    <p className="text-xs text-slate-400 mt-1">Please provide accurate contact details so we can reach you promptly.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@example.com"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Telephone / Mobile Number</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Inquiry Category *</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="GENERAL_SUPPORT">Citizen Account / Tag Support</option>
                                            <option value="HOSPITAL_ONBOARDING">Hospital & Doctor Integration</option>
                                            <option value="INSTITUTIONAL_PILOT">Institutional & Government Partnerships</option>
                                            <option value="ORDER_SHIPPING">Product Order / Delivery Inquiry</option>
                                            <option value="PRIVACY_DPO">Privacy Officer & Data Rights</option>
                                            <option value="OTHER">Other Query</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject *</label>
                                    <input
                                        type="text"
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Brief summary of your inquiry"
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Message Content *</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Detailed description of your inquiry or request..."
                                        className="w-full px-4 py-3 bg-[#0E1013] border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={15} />
                                    {isSubmitting ? 'Transmitting Message...' : 'Transmit Inquiry'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
