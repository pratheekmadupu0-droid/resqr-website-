import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, ArrowLeft, Shield, Stethoscope, Lock, CheckCircle2 } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';

export default function ScannerPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);

  // QR Scanner Logic (Section 12: QR is the primary opaque identifier)
  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner("qr-reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render((decodedText) => {
      scanner.clear();
      setScanning(false);
      try {
        if (decodedText.startsWith('http')) {
          const url = new URL(decodedText);
          navigate(url.pathname);
        } else if (decodedText.startsWith('/')) {
          navigate(decodedText);
        } else {
          navigate(`/e/${decodedText}`);
        }
      } catch (e) {
        navigate(`/e/${decodedText}`);
      }
    }, () => {
      // silent scan
    });

    return () => {
      scanner.clear().catch(e => console.error("Scanner clear error", e));
    };
  }, [scanning, navigate]);

  return (
    <div className="min-h-screen bg-[#040812] text-white font-manrope selection:bg-red-600/30">
      {/* Header */}
      <div className="max-w-xl mx-auto px-6 pt-12 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter font-poppins">
            RESQR <span className="text-red-500">Scanner</span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
            Emergency Tag Reader
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="max-w-xl mx-auto px-6 py-10 flex flex-col items-center space-y-8">
        {/* Scanner Viewport */}
        <div className="relative w-full aspect-[3/4] max-w-sm rounded-[48px] overflow-hidden shadow-2xl border-4 border-white/5 bg-slate-950">
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 z-10 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
          />

          <div id="qr-reader" className="w-full h-full bg-slate-950 flex items-center justify-center" />

          {/* Corner Brackets */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl border-red-500 pointer-events-none" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl border-red-500 pointer-events-none" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl border-red-500 pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl border-red-500 pointer-events-none" />
        </div>

        {/* Clinical Privacy Guarantee Notice (Section 30: No Public Face Database) */}
        <div className="w-full max-w-sm bg-[#11192A] border border-white/5 rounded-3xl p-6 text-center space-y-3 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Lock size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              Zero Public Biometric Exposure
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            In compliance with NIST standards and privacy protocols, facial biometric matching is restricted to authenticated hospital trauma bays and verified medical sessions.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 inline-flex items-center gap-1"
            >
              <Stethoscope size={12} /> Hospital & Doctor Trauma Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
