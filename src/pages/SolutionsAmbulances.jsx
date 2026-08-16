import React from 'react';
import { Shield, MapPin, Navigation, Phone, Bell, CheckCircle, Flame, Activity } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export default function SolutionsAmbulances() {
    const workflow = [
        { title: 'Emergency Detected', desc: 'Critical accident triggers an SOS scan from a bystander.' },
        { title: 'Emergency Alert', desc: 'GPS coordinates and core patient info sent to dispatcher.' },
        { title: 'Location Received', desc: 'Precise coordinates overlay on dispatcher navigation routing.' },
        { title: 'Ambulance Dispatched', desc: 'Nearest ambulance unit is routed immediately to site.' },
        { title: 'Patient Identified', desc: 'QR code scanned to verify allergies & blood group in transit.' },
        { title: 'Nearest Hospital Found', desc: 'Automatic routing recommends the closest ER bed available.' },
        { title: 'Hospital Notified', desc: 'Receiving trauma team prepares room based on telemetry data.' },
        { title: 'Patient Arrives', desc: 'Seamless handover with no paperwork delay.' }
    ];

    return (
        <div className="min-h-screen bg-medical-bg text-white font-manrope">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden border-b border-white/5 bg-slate-950/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.05),transparent)] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 px-4 py-1.5 font-black tracking-widest text-xs uppercase italic">AMBULANCE SERVICES</Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-poppins text-white mb-6 leading-none italic">
                        FROM EMERGENCY ALERT <br />
                        <span className="text-primary italic-display">TO HOSPITAL.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                        Equip your ambulance fleet with real-time patient health telemetry. Scan, prep, and transmit medical profiles while in transit.
                    </p>
                </div>
            </section>

            {/* Workflow steps */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">AMBULANCE RESPONSE SEQUENCE</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Synchronized workflow timeline</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {workflow.map((w, idx) => (
                        <Card key={idx} className="p-8 hover:border-white/10 transition-all">
                            <span className="text-3xl font-black italic text-primary/20 mb-4 block">{(idx + 1).toString().padStart(2, '0')}</span>
                            <h3 className="text-lg font-black uppercase italic tracking-tight font-poppins text-white mb-3">{w.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed font-semibold">{w.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Map and Telemetry Dashboard Mockup */}
            <section className="py-24 bg-slate-950 border-y border-white/5 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter font-poppins">ACTIVE TELEMETRY & MAP DISPLAY</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">Live ambulance tracking terminal interface</p>
                    </div>

                    <Card className="bg-medical-card border-white/5 overflow-hidden p-0 rounded-[40px] shadow-2xl">
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">ACTIVE DISPATCH</h4>
                                        <Badge className="bg-red-500/10 text-red-500 border-none font-black text-[8px]">EMERGENCY</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-black text-white italic">UNIT: AMBULANCE #12</div>
                                        <div className="text-xs font-bold text-slate-400">Patient: Pratheek M.</div>
                                        <div className="text-xs font-bold text-slate-400">Destination: Max Emergency Center</div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 space-y-2 text-xs font-bold text-slate-400">
                                    <div className="flex justify-between"><span>Response Status</span><span className="text-emerald-400 font-black">EN ROUTE</span></div>
                                    <div className="flex justify-between"><span>Blood Group</span><span className="text-white font-black">O+ POSITIVE</span></div>
                                    <div className="flex justify-between"><span>Allergies</span><span className="text-white font-bold">Penicillin, Peanuts</span></div>
                                </div>
                            </div>

                            {/* Fake Map Grid Graphic */}
                            <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-white/5 p-8 h-80 relative overflow-hidden flex items-center justify-center">
                                {/* Grid lines background */}
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
                                
                                <div className="relative z-10 text-center space-y-4">
                                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto animate-ping absolute -top-4 left-1/2 -translate-x-1/2" />
                                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto relative">
                                        <Navigation size={24} className="rotate-45" />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-white italic">GPS LIVE ROUTING ACTIVE</h4>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Lat: 28.6139° N, Lon: 77.2090° E</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 text-center bg-medical-bg">
                <div className="max-w-4xl mx-auto bg-medical-card p-16 rounded-[50px] border border-white/5 shadow-2xl">
                    <h2 className="text-4xl font-black uppercase italic tracking-tight font-poppins mb-6">INTEGRATE YOUR AMBULANCE FLEET</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Equip paramedic teams with instant medical history scans and smart hospital routing maps.</p>
                    <div className="flex gap-6 justify-center">
                        <Link to="/partners">
                            <Button size="lg" className="rounded-full px-10 py-5 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25">PARTNER WITH RESQR</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
