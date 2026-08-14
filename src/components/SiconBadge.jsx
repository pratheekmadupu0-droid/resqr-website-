import React from 'react';

export default function SiconBadge() {
    return (
        <a
            href="https://www.sicon.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 hover:border-primary/50 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group"
            id="sicon-floating-badge"
        >
            <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 group-hover:text-slate-200 transition-colors uppercase">
                Powered by
            </span>
            <div className="h-4 w-[1px] bg-white/20 mx-1" />
            <img
                src={`${import.meta.env.BASE_URL}sicon_logo.png`}
                alt="Sicon Enterprises"
                className="h-4.5 w-auto object-contain transition-all"
                onError={(e) => {
                    // Hide the image element if it fails to load or is empty
                    e.target.style.display = 'none';
                }}
            />
            <span className="text-[10px] font-black tracking-widest text-white uppercase italic font-poppins">
                SICON
            </span>
        </a>
    );
}
