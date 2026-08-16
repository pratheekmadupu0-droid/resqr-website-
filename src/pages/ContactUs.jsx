import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Phone, MapPin, Send, MessageSquare, ArrowRight,
    Terminal as TerminalIcon, ShieldAlert, Cpu, Radio, Activity,
    Wifi, Shield, AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function ContactUs() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('info'); // info, alert, critical
    const [encryption, setEncryption] = useState(true);
    const [logs, setLogs] = useState([
        { time: '00:00:01', text: 'INITIALIZING SECURE UPLINK NODE...' },
        { time: '00:00:02', text: 'SYS: STATUS STANDBY. ENCRYPTION PROTOCOL ARMED.' },
        { time: '00:00:03', text: 'WAITING FOR GUARDIAN HANDSHAKE...' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitProgress, setSubmitProgress] = useState(0);
    const [submitStatus, setSubmitStatus] = useState('idle'); // idle, sending, success
    const terminalContainerRef = useRef(null);

    // Scroll to bottom of terminal when logs update
    useEffect(() => {
        if (terminalContainerRef.current) {
            terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // Format current timestamp
    const getTimestamp = () => {
        const now = new Date();
        return now.toTimeString().split(' ')[0];
    };

    // Add logs dynamically on input changes
    const addLog = (text) => {
        const timestamp = getTimestamp();
        setLogs(prev => [...prev, { time: timestamp, text }]);
    };

    const handleNameChange = (e) => {
        const val = e.target.value;
        setName(val);
        if (val.length === 1) {
            addLog(`SYS: IDENTIFIER DETECTED [${val.toUpperCase()}]`);
        } else if (val.length % 10 === 0 && val.length > 0) {
            addLog(`SYS: IDENT CONFIRMED AS "${val}"`);
        }
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        if (val.includes('@') && !logs.some(l => l.text.includes('EMAIL HANDSHAKE'))) {
            addLog(`SECURE: VALIDATING ROUTING DOMAIN FOR [${val}]`);
        }
    };

    const handlePriorityChange = (level) => {
        setPriority(level);
        if (level === 'info') {
            addLog('SYS: TRANSMISSION MODE -> STABLE TELEMETRY (INFO)');
        } else if (level === 'alert') {
            addLog('SYS: TRANSMISSION MODE -> DIAGNOSTIC ELEVATION (SUPPORT)');
        } else if (level === 'critical') {
            addLog('ALERT: TRANSMISSION MODE -> CRITICAL UPLINK GATEWAY (EMERGENCY RED)');
        }
    };

    const handleEncryptionToggle = () => {
        const state = !encryption;
        setEncryption(state);
        addLog(`SECURITY: AES-256 VAULT ENCRYPTION ${state ? 'ENABLED' : 'DEACTIVATED! WARNING'}`);
    };

    // Handle form submission animation
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitStatus('sending');
        setSubmitProgress(0);
        addLog('UPLINK: INITIATING SECURE MESSAGE TRANSMISSION ROUTE...');

        // Simulation sequences
        const steps = [
            { progress: 15, log: 'UPLINK: SOLVING CRYPTO HANDSHAKE NODE...' },
            { progress: 35, log: 'UPLINK: ENCRYPTING DATA VAULT SEGMENTS...' },
            { progress: 60, log: 'UPLINK: ESTABLISHING CONNECTIVITY GROMIGHTY GATEWAY...' },
            { progress: 85, log: 'UPLINK: ROUTING TO SICON SPACE MAIN FRAME...' },
            { progress: 100, log: 'UPLINK: TRANSMISSION DELIVERED SUCCESSFULLY.' }
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setSubmitProgress(steps[i].progress);
            addLog(steps[i].log);
        }

        setSubmitStatus('success');
        setIsSubmitting(false);
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setPriority('info');
        setEncryption(true);
        setSubmitStatus('idle');
        setSubmitProgress(0);
        setLogs([
            { time: getTimestamp(), text: 'SYS: CONSOLE RESET.' },
            { time: getTimestamp(), text: 'SYS: STANDBY FOR GUARDIAN TELEMETRY...' }
        ]);
    };

    // Color definitions based on priority level
    const priorityColors = {
        info: {
            glow: 'from-blue-600/20 via-cyan-500/10 to-transparent',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            bg: 'bg-blue-500/10',
            pulse: 'bg-blue-500',
            radar: 'border-blue-500/20'
        },
        alert: {
            glow: 'from-amber-600/20 via-orange-500/10 to-transparent',
            border: 'border-amber-500/30',
            text: 'text-amber-400',
            bg: 'bg-amber-500/10',
            pulse: 'bg-amber-500',
            radar: 'border-amber-500/20'
        },
        critical: {
            glow: 'from-red-600/25 via-primary/10 to-transparent',
            border: 'border-primary/40 animate-pulse',
            text: 'text-primary',
            bg: 'bg-primary/20',
            pulse: 'bg-primary animate-ping',
            radar: 'border-primary/30'
        }
    };

    const currentTheme = priorityColors[priority];

    return (
        <div className="min-h-screen bg-medical-bg relative overflow-hidden text-white font-manrope pt-28 pb-20 px-4 md:px-8">
            {/* Holographic Ambient Glow Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] bg-gradient-to-b ${currentTheme.glow} blur-[120px] rounded-full transition-all duration-1000`} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(0,0,0,0.35)_100%)]" />
                {/* scanline simulation grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.003)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="text-center mb-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: -25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-3">
                            <Badge variant={priority === 'critical' ? 'danger' : priority === 'alert' ? 'warning' : 'primary'} className="transition-all duration-500">
                                {priority === 'critical' ? 'CRITICAL BEACON' : priority === 'alert' ? 'SUPPORT NODE' : 'SECURE GATEWAY'}
                            </Badge>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <span className={`w-2 h-2 rounded-full ${currentTheme.pulse} transition-all duration-500`} />
                                NODE STATUS: {priority.toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none font-poppins">
                            SECURE <span className="text-primary italic-display">TRANSMISSION</span>
                        </h1>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-semibold leading-relaxed">
                            Establish a direct encrypted connection to our emergency operations support. Select priority status to route telemetry correctly.
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Terminal and System Diagnostics (Span 5) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Interactive HUD / Holographic Node Card */}
                        <Card className="p-8 bg-slate-950/80 backdrop-blur-md border-white/5 shadow-2xl relative overflow-hidden group">
                            {/* Scanning Laser Line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-40 animate-[bounce_4s_infinite_linear]" />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                                <Radio size={14} className="text-primary animate-pulse" /> Live Telemetry Hologram
                            </h3>

                            {/* Rotating Holographic Shield */}
                            <div className="relative aspect-square max-w-[200px] mx-auto my-6 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                                    className={`absolute inset-0 border-2 border-dashed ${currentTheme.radar} rounded-full transition-colors duration-500`}
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                    className={`absolute inset-4 border border-dotted ${currentTheme.radar} rounded-full transition-colors duration-500`}
                                />
                                <div className="absolute inset-8 rounded-full bg-slate-950/90 border border-white/5 flex items-center justify-center flex-col">
                                    <Activity size={36} className={`${currentTheme.text} animate-[pulse_2s_infinite] transition-colors duration-500`} />
                                    <span className="text-[9px] font-black text-slate-500 mt-2 uppercase tracking-widest">
                                        {priority === 'critical' ? 'PINGING...' : 'ONLINE'}
                                    </span>
                                </div>
                            </div>

                            {/* Stats Readout */}
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">SIGNAL QUALITY</span>
                                    <span className="text-sm font-bold text-emerald-400">99.8%</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">PORT ENCRYPTION</span>
                                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                        <Shield size={12} className={encryption ? 'text-primary' : 'text-slate-500'} />
                                        {encryption ? 'AES-256' : 'NONE'}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Interactive Terminal Component */}
                        <Card className="p-6 bg-black border-white/10 shadow-2xl relative overflow-hidden rounded-3xl h-[280px] flex flex-col font-mono text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <TerminalIcon size={14} className="text-primary" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">secure_uplink_terminal.sh</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                </div>
                            </div>
                            <div ref={terminalContainerRef} className="flex-grow overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                                {logs.map((log, index) => (
                                    <div key={index} className="flex items-start gap-2 leading-relaxed">
                                        <span className="text-slate-600 text-[10px] shrink-0">[{log.time}]</span>
                                        <span className={log.text.startsWith('ALERT') ? 'text-primary font-bold' : log.text.startsWith('SECURE') ? 'text-emerald-400' : 'text-slate-300'}>
                                            {log.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-slate-500 shrink-0">
                                <span className="animate-pulse font-bold text-primary">&gt;</span>
                                <span className="animate-pulse">_</span>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Uplink Form (Span 7) */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {submitStatus === 'idle' || submitStatus === 'sending' ? (
                                <motion.div
                                    key="form-container"
                                    initial={{ opacity: 0, x: 25 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -25 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Card className={`p-8 md:p-12 bg-medical-card border-white/5 shadow-2xl rounded-[40px] relative transition-all duration-500 ${currentTheme.border}`}>
                                        <form onSubmit={handleSubmit} className="space-y-8">
                                            {/* Priority/Uplink Mode Toggle */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Transmission Priority</label>
                                                <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-white/5">
                                                    {[
                                                        { id: 'info', label: 'INFO', icon: <Wifi size={14} /> },
                                                        { id: 'alert', label: 'SUPPORT', icon: <Cpu size={14} /> },
                                                        { id: 'critical', label: 'CRITICAL', icon: <ShieldAlert size={14} /> }
                                                    ].map((lvl) => (
                                                        <button
                                                            key={lvl.id}
                                                            type="button"
                                                            onClick={() => handlePriorityChange(lvl.id)}
                                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 ${priority === lvl.id ? (lvl.id === 'critical' ? 'bg-primary text-white shadow-lg shadow-primary/20' : lvl.id === 'alert' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20') : 'text-slate-500 hover:text-slate-300'}`}
                                                        >
                                                            {lvl.icon} {lvl.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Inputs */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Guardian Name</label>
                                                    <input
                                                        className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-700 text-white focus:border-primary/30"
                                                        placeholder="Full Name"
                                                        value={name}
                                                        onChange={handleNameChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Secure Routing Email</label>
                                                    <input
                                                        type="email"
                                                        className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-700 text-white focus:border-primary/30"
                                                        placeholder="email@example.com"
                                                        value={email}
                                                        onChange={handleEmailChange}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Transmission Subject</label>
                                                <input
                                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-700 text-white focus:border-primary/30"
                                                    placeholder="Subject classification"
                                                    value={subject}
                                                    onChange={(e) => { setSubject(e.target.value); if (subject.length === 0) addLog(`SYS: SUBJECT STATED -> "${e.target.value}"`); }}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Uplink Message Body</label>
                                                <textarea
                                                    className="w-full bg-slate-950/60 border border-white/5 rounded-3xl p-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none h-40 transition-all placeholder:text-slate-700 resize-none text-white focus:border-primary/30"
                                                    placeholder="Compose secure text data payload..."
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    required
                                                ></textarea>
                                            </div>

                                            {/* Security Checkbox & Actions */}
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-2 border-t border-white/5">
                                                <button
                                                    type="button"
                                                    onClick={handleEncryptionToggle}
                                                    className="flex items-center gap-3 group text-left"
                                                >
                                                    <div className={`w-10 h-6 rounded-full p-1 transition-all ${encryption ? 'bg-primary' : 'bg-slate-800'} flex items-center`}>
                                                        <motion.div
                                                            layout
                                                            className="w-4 h-4 rounded-full bg-white"
                                                            animate={{ x: encryption ? 16 : 0 }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-300">SECURE VAULT</span>
                                                        <span className="text-[9px] text-slate-500 font-bold uppercase">Encrypt transmission packet</span>
                                                    </div>
                                                </button>

                                                <Button
                                                    type="submit"
                                                    isLoading={isSubmitting}
                                                    className={`w-full sm:w-auto px-10 py-5 text-sm font-black italic rounded-2xl gap-3 shadow-xl transition-all border-none ${priority === 'critical' ? 'bg-primary text-white shadow-primary/20 hover:bg-primary/95' : priority === 'alert' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                                                >
                                                    <Send size={16} /> INITIALIZE UPLINK
                                                </Button>
                                            </div>
                                        </form>

                                        {/* Submit overlay progress bar */}
                                        {isSubmitting && (
                                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-[40px] flex flex-col items-center justify-center p-8 z-35">
                                                <RefreshCw className="animate-spin text-primary mb-6" size={44} />
                                                <h4 className="text-xl font-black italic uppercase tracking-wider text-white">TRANSMITTING TELEMETRY</h4>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{submitProgress}% completed</p>
                                                <div className="w-64 h-1 bg-white/10 rounded-full mt-4 overflow-hidden border border-white/5">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: '0%' }}
                                                        animate={{ width: `${submitProgress}%` }}
                                                        transition={{ duration: 0.2 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success-container"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Card className="p-12 bg-medical-card border-emerald-500/20 shadow-2xl rounded-[40px] text-center space-y-8 relative overflow-hidden">
                                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]" />
                                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/15 mb-4 animate-pulse">
                                            <CheckCircle size={48} className="text-emerald-500" />
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white font-poppins">UPLINK SECURED</h2>
                                        <div className="max-w-md mx-auto space-y-4">
                                            <p className="text-slate-400 text-base leading-relaxed font-bold">
                                                Thank you, Guardian. Sicon Enterprises' Gromighty unit has successfully encrypted and routed your transmission to our live security logs.
                                            </p>
                                            <p className="text-[10px] font-mono text-slate-500 bg-black/40 py-3 px-4 rounded-xl border border-white/5">
                                                RECEIPT: RESQR-TX-{Math.floor(100000 + Math.random() * 900000)}
                                            </p>
                                        </div>
                                        <div className="pt-6">
                                            <Button
                                                onClick={resetForm}
                                                className="mx-auto rounded-xl px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black italic uppercase tracking-widest text-xs"
                                            >
                                                NEW TRANSMISSION
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Info Cards Row (HQ, Call, Support channels) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    <Card className="p-8 bg-medical-card/60 backdrop-blur-md border-white/5 hover:border-white/10 transition-all rounded-[30px] flex items-start gap-5">
                        <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0 shadow-lg shadow-primary/5">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-2">EMAIL ARCHIVES</h4>
                            <p className="font-bold text-sm text-white hover:text-primary transition-colors">support@resqr.co.in</p>
                            <p className="font-bold text-sm text-white hover:text-primary transition-colors mt-0.5">partners@resqr.co.in</p>
                        </div>
                    </Card>
                    <Card className="p-8 bg-medical-card/60 backdrop-blur-md border-white/5 hover:border-white/10 transition-all rounded-[30px] flex items-start gap-5">
                        <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 shrink-0 shadow-lg shadow-blue-500/5">
                            <Phone size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-2">VOICE FREQUENCY</h4>
                            <p className="font-bold text-sm text-white">+91 9985309102</p>
                            <span className="inline-block text-[8px] text-primary font-black uppercase tracking-widest mt-1 bg-primary/10 px-2 py-0.5 rounded-full italic">24/7 HELPLINE</span>
                        </div>
                    </Card>
                    <Card className="p-8 bg-medical-card/60 backdrop-blur-md border-white/5 hover:border-white/10 transition-all rounded-[30px] flex items-start gap-5">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/5">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-500 mb-2">SECURE WHATSAPP</h4>
                            <p className="font-bold text-sm text-slate-400 leading-tight mb-2">Instant profile setup and support queries.</p>
                            <a
                                href="https://wa.me/919985309102"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest text-emerald-400 hover:text-emerald-300 uppercase italic transition-colors"
                            >
                                START CHAT <ArrowRight size={12} />
                            </a>
                        </div>
                    </Card>
                </div>

                {/* Brand Section: Developed by Gromighty under Sicon Enterprises */}
                <Card className="p-8 md:p-10 bg-gradient-to-br from-slate-950/95 to-medical-card border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 justify-between mt-12 rounded-[40px]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none italic font-black text-6xl text-white select-none">
                        GROMIGHTY • SICON
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        {/* Gromighty Logo container */}
                        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-2.5 shadow-xl shadow-black/40 hover:scale-105 transition-transform duration-300 shrink-0">
                            <img
                                src={`${import.meta.env.BASE_URL}gromighty_logo.png`}
                                alt="Gromighty Logo"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/150?text=GROMIGHTY';
                                }}
                            />
                        </div>
                        <div className="h-[1px] w-8 bg-white/10 sm:hidden" />
                        <div className="space-y-1">
                            <h4 className="text-white font-extrabold italic tracking-wider text-xl uppercase font-poppins">
                                Developed by Gromighty
                            </h4>
                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1.5">
                                UNDER
                                <span className="inline-flex items-center gap-1 text-white font-black hover:text-primary transition-all">
                                    SICON ENTERPRISES
                                </span>
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium max-w-xl leading-relaxed mt-2 sm:mt-1">
                                Engineered by Gromighty Online Agency Services, delivering high-performance, critical digital-to-physical infrastructure solutions for Sicon Enterprises' ecosystems.
                            </p>
                        </div>
                    </div>

                    {/* Sicon Logo and space link */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
                        <div className="h-[40px] w-[1px] bg-white/10 hidden md:block" />
                        <a
                            href="https://www.sicon.space/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <img
                                src={`${import.meta.env.BASE_URL}sicon_logo.png`}
                                alt="Sicon Enterprises Logo"
                                className="h-8 w-auto object-contain brightness-100 group-hover:brightness-120 transition-all"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                            <div className="text-left">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400">PARENT ECOSYSTEM</span>
                                <span className="text-[10px] font-black text-white uppercase tracking-wider group-hover:text-primary transition-colors">SICON.SPACE <ArrowRight size={10} className="inline ml-1" /></span>
                            </div>
                        </a>
                    </div>
                </Card>
            </div>

            {/* Micro-animated Scanlines & Noise */}
            <div className="absolute inset-0 bg-transparent opacity-[0.02] pointer-events-none select-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />
        </div>
    );
}
