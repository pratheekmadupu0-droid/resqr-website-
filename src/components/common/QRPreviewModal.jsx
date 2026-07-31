import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Eye, ShieldAlert, Phone, HeartPulse, ShieldCheck, Download, ExternalLink, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export default function QRPreviewModal({ 
    isOpen, 
    onClose, 
    patientData = {},
    onProceedToPay
}) {
    const [viewMode, setViewMode] = useState('tag'); // 'tag' or 'scanner_view'

    if (!isOpen) return null;

    const {
        name = "John Doe",
        bloodGroup = "O+",
        phone = "9876543210",
        emergencyContacts = [{ name: "Family Contact", relationship: "Spouse", phone: "9876543210" }],
        allergies = "None reported",
        medicalConditions = "Healthy",
        medicalId = "RESQR-MED-98421",
        insuranceCompany = "Star Health Insurance"
    } = patientData;

    const previewUrl = `${window.location.origin}/qr/${medicalId}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg font-manrope text-white">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-xl bg-slate-950 border border-white/10 rounded-[36px] overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="bg-slate-900/80 px-8 py-6 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                <Eye size={20} />
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary italic block">LIVE PREVIEW PROTOCOL</span>
                                <h3 className="text-xl font-black italic uppercase font-poppins text-white">Emergency Medical QR Badge</h3>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="p-4 bg-slate-900/40 border-b border-white/5 flex justify-center gap-3">
                        <button 
                            onClick={() => setViewMode('tag')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest italic transition-all flex items-center gap-2 ${viewMode === 'tag' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <Eye size={14} /> Physical Tag View
                        </button>
                        <button 
                            onClick={() => setViewMode('scanner_view')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest italic transition-all flex items-center gap-2 ${viewMode === 'scanner_view' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <Activity size={14} /> Responder HUD View
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                        {viewMode === 'tag' ? (
                            <div className="flex flex-col items-center">
                                {/* Simulated Physical QR Card */}
                                <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 p-8 rounded-[36px] border-2 border-primary/30 shadow-2xl relative overflow-hidden text-center group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                                    
                                    <div className="flex flex-col items-center mb-6 pb-4 border-b border-white/10">
                                        <img src={`${import.meta.env.BASE_URL}resqr_logo.png`} alt="RESQR Logo" className="h-10 w-auto object-contain mb-3" />
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">RESQR MEDICAL TAG</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-400">{medicalId}</span>
                                        </div>
                                    </div>

                                    {/* QR Canvas */}
                                    <div className="bg-white p-5 rounded-3xl inline-block shadow-2xl mb-6 border-4 border-slate-950 relative">
                                        <QRCodeCanvas 
                                            value={previewUrl}
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                            imageSettings={{
                                                src: `${import.meta.env.BASE_URL}resqr_icon.png`,
                                                height: 40,
                                                width: 40,
                                                excavate: true,
                                            }}
                                        />
                                    </div>

                                    {/* Patient Metadata Banner */}
                                    <div className="space-y-3 text-left bg-slate-950/80 p-5 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Patient Name</span>
                                            <span className="text-sm font-black italic text-white uppercase">{name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Blood Group</span>
                                            <span className="text-xs font-black italic text-primary px-3 py-1 bg-primary/20 rounded-full border border-primary/30">{bloodGroup}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Emergency SOS Contact</span>
                                            <span className="text-xs font-mono font-bold text-slate-300">{phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* First Responder Scanner Screen HUD */
                            <div className="space-y-5 bg-slate-900/60 p-6 rounded-3xl border border-emerald-500/20">
                                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-emerald-400">
                                    <ShieldCheck size={24} className="shrink-0" />
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider italic">Verified Responder HUD View</h4>
                                        <p className="text-[10px] text-slate-400 font-bold">This is how paramedics and ER doctors instantly read patient data during emergencies.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Patient Name</span>
                                        <span className="text-sm font-black italic text-white">{name}</span>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Blood Type</span>
                                        <span className="text-sm font-black italic text-primary">{bloodGroup}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> Allergies & Critical Warnings
                                    </span>
                                    <p className="text-xs text-slate-300 font-bold leading-relaxed">{allergies || 'No known drug allergies'}</p>
                                </div>

                                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                                        <HeartPulse size={12} /> Medical Conditions
                                    </span>
                                    <p className="text-xs text-slate-300 font-bold leading-relaxed">{medicalConditions || 'No pre-existing conditions reported'}</p>
                                </div>

                                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Primary Emergency Contact</span>
                                    {emergencyContacts.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-300">
                                            <span>{c.name || 'Emergency Contact'} ({c.relationship || 'Kin'})</span>
                                            <span className="text-emerald-400 font-mono">{c.phone || phone}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-900/90 px-8 py-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Button 
                            onClick={onClose}
                            variant="outline"
                            className="w-full sm:w-auto py-3 px-6 rounded-2xl font-black italic uppercase text-xs border-white/10 text-slate-400 hover:text-white"
                        >
                            Close Preview
                        </Button>

                        {onProceedToPay && (
                            <Button 
                                onClick={() => {
                                    onClose();
                                    onProceedToPay();
                                }}
                                className="w-full sm:w-auto py-4 px-8 bg-primary text-white rounded-2xl font-black italic uppercase text-xs shadow-xl shadow-primary/20 tracking-wider"
                            >
                                Proceed to Checkout & Activation
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
