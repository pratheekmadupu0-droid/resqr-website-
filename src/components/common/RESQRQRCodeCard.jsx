import React, { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * RESQRQRCodeCard
 *
 * The official unified RESQR Emergency QR Card component for every registered user.
 * Structure:
 * 1. Official RESQR Logo
 * 2. High-contrast QR Code (with excavate logo center)
 * 3. Registered User Full Name (strictly from DB/auth, dynamic for all users)
 * 4. SCAN IN EMERGENCY
 * 5. POWERED BY RESQR.CO.IN
 */
const RESQRQRCodeCard = forwardRef(function RESQRQRCodeCard(
    {
        qrValue = 'https://resqr.co.in',
        userName = 'REGISTERED USER',
        canvasId = 'resqr-qr-canvas',
        size = 200,
        className = '',
        showBorder = true,
        onClick
    },
    ref
) {
    // Format name cleanly and defensively
    const displayName = (userName && String(userName).trim())
        ? String(userName).trim().toUpperCase()
        : 'REGISTERED USER';

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={`bg-white rounded-[36px] p-8 sm:p-10 flex flex-col items-center text-center select-none shadow-2xl relative transition-all ${
                showBorder ? 'border-4 border-slate-900/10' : ''
            } ${className}`}
            style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}
        >
            {/* 1. Official RESQR Brand Logo */}
            <div className="mb-6 flex items-center justify-center w-full">
                <img
                    src={`${import.meta.env.BASE_URL}resqr_logo.png`}
                    alt="RESQR"
                    className="h-10 sm:h-12 w-auto object-contain brightness-0"
                    loading="eager"
                />
            </div>

            {/* 2. QR Code Matrix */}
            <div className="bg-white p-3.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100 mb-6 relative">
                <QRCodeCanvas
                    id={canvasId}
                    value={qrValue || 'https://resqr.co.in'}
                    size={size}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                        src: `${import.meta.env.BASE_URL}resqr_icon.png`,
                        height: Math.round(size * 0.22),
                        width: Math.round(size * 0.22),
                        excavate: true
                    }}
                />
            </div>

            {/* 3. Registered User Full Name directly below QR code */}
            <div className="w-full px-2 mb-3">
                <h3
                    className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-slate-900 font-poppins leading-tight break-words"
                    title={displayName}
                >
                    {displayName}
                </h3>
            </div>

            {/* 4. SCAN IN EMERGENCY Instruction */}
            <div className="mb-2">
                <p className="text-xs sm:text-sm font-black uppercase italic tracking-[0.2em] text-[#E63946] font-poppins">
                    SCAN IN EMERGENCY
                </p>
            </div>

            {/* 5. POWERED BY RESQR.CO.IN Brand Attribution */}
            <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 font-sans">
                    POWERED BY RESQR.CO.IN
                </p>
            </div>
        </div>
    );
});

export default RESQRQRCodeCard;
