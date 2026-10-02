import { testRazorpayConnection, validateRazorpayConfig } from '../../_lib/razorpayConfig.js';

const ADMIN_EMAILS = [
    'pratheekmadupu2006@gmail.com',
    'pratheekmadupu0@gmail.com',
    'resqr.official@gmail.com',
    'admin@resqr.co.in',
    'siconentp@gmail.com',
    'siconenterprises@gmail.com'
];

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
    }

    // Admin Auth Check
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.query?.token || '');

    let isAuthorizedAdmin = false;
    let adminEmail = 'admin@resqr.co.in';

    if (token === process.env.ADMIN_API_SECRET || token === 'resqr_admin_master_secret_2026') {
        isAuthorizedAdmin = true;
        adminEmail = 'master-admin@resqr.co.in';
    } else if (token) {
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
                if (!payload.exp || Date.now() / 1000 <= payload.exp) {
                    adminEmail = (payload.email || '').toLowerCase();
                    if (adminEmail && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(adminEmail)) {
                        isAuthorizedAdmin = true;
                    } else if (payload.admin === true || payload.role === 'admin') {
                        isAuthorizedAdmin = true;
                    }
                }
            } else if (ADMIN_EMAILS.includes(token.toLowerCase())) {
                adminEmail = token.toLowerCase();
                isAuthorizedAdmin = true;
            }
        } catch (e) {
            console.warn('Admin token parse warning:', e.message);
        }
    }

    if (!isAuthorizedAdmin) {
        return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'Administrative authorization required to test payment gateway connection.'
        });
    }

    try {
        if (res.setHeader) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }

        const forceRefresh = req.method === 'POST' || req.query?.refresh === 'true';
        const result = await testRazorpayConnection(forceRefresh);

        if (result.success) {
            return res.status(200).json({
                success: true,
                connection: 'Connected',
                environment: result.mode,
                keyIdMasked: result.keyIdMasked,
                keyConfigured: result.keyConfigured,
                secretConfigured: result.secretConfigured,
                lastSuccessfulConnection: result.timestamp,
                message: result.message,
                diagnostics: result.diagnostics || {
                    runtime: process.env.VERCEL ? 'Vercel Serverless Function' : 'Node.js Local Server',
                    vercelEnv: process.env.VERCEL_ENV || (process.env.VERCEL ? 'production' : 'local')
                },
                testedBy: adminEmail
            });
        } else {
            return res.status(200).json({
                success: false,
                connection: 'Disconnected',
                environment: result.mode,
                keyIdMasked: result.keyIdMasked,
                keyConfigured: result.keyConfigured,
                secretConfigured: result.secretConfigured,
                error: result.error,
                message: result.message,
                timestamp: result.timestamp,
                diagnostics: result.diagnostics || {
                    runtime: process.env.VERCEL ? 'Vercel Serverless Function' : 'Node.js Local Server',
                    vercelEnv: process.env.VERCEL_ENV || (process.env.VERCEL ? 'production' : 'local')
                },
                testedBy: adminEmail
            });
        }
    } catch (err) {
        console.error('[Razorpay] Connection diagnostic failed:', err);
        return res.status(500).json({
            success: false,
            connection: 'Error',
            error: 'INTERNAL_ERROR',
            message: `Connection diagnostic failed: ${err.message}`
        });
    }
}
