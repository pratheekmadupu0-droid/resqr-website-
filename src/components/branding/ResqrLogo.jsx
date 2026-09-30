import React from 'react';

/**
 * ResqrLogo
 * 
 * Official RESQR Website Brand Logo (White "Res" + Red "QR").
 * Single source of truth for all general website branding:
 * - Navbar
 * - Footer
 * - Login & Registration
 * - Dashboards (Citizen, Admin, Doctor, Hospital, Agent)
 * - Error & Info Pages
 * 
 * IMPORTANT: This logo retains its exact brand colors and proportions.
 */
export default function ResqrLogo({
    className = 'h-10 sm:h-12 w-auto object-contain',
    alt = 'RESQR Official Logo',
    style = {},
    loading = 'eager',
    ...props
}) {
    const logoSrc = `${import.meta.env.BASE_URL}resqr_logo.png`;

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
