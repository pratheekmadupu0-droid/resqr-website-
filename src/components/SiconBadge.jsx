import React from 'react';

export default function SiconBadge() {
    return (
        <a
            href="https://www.sicon.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-950/90 hover:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-primary/50 shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 group"
            id="sicon-floating-badge"
        >
            <span className="text-[8px] font-black tracking-[0.2em] text-slate-400 group-hover:text-slate-200 transition-colors uppercase select-none">
                Powered by
            </span>
            <div className="h-3 w-[1px] bg-white/20 mx-0.5" />
            <img
                src={`${import.meta.env.BASE_URL}sicon_logo.png`}
                alt="Sicon Enterprises"
                style={{ height: '20px', width: 'auto' }}
                className="object-contain transition-all"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
        </a>
    );
}
