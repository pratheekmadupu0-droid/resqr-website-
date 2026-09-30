import React from 'react';

/**
 * ResqrQrLogo
 * 
 * Official RESQR QR-Card Brand Logo (Black "Res" + Red "QR" with TM mark).
 * STRICTLY ISOLATED TO:
 * - Generated QR cards
 * - QR preview modal / badge
 * - Printable QR tags / physical stickers
 * - QR downloads and exports
 * 
 * DO NOT use this variant across the general dark-themed website UI.
 */
export default function ResqrQrLogo({
    className = 'h-10 sm:h-12 w-auto object-contain',
    alt = 'RESQR Official QR Card Logo',
    style = {},
    loading = 'eager',
    ...props
}) {
    const logoSrc = `${import.meta.env.BASE_URL}resqr_qr_logo.png`;

    return (
        <img
            src={logoSrc}
            alt={alt}
            className={className}
            style={{ ...style }}
            loading={loading}
            {...props}
        />
    );
}
