import fs from 'fs';
import path from 'path';

// 1. Ensure environment variables are loaded (zero-dependency native loader)
try {
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile();
    } else {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const eqIdx = trimmed.indexOf('=');
                    if (eqIdx > 0) {
                        const k = trimmed.slice(0, eqIdx).trim();
                        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                        if (!process.env[k]) {
                            process.env[k] = v;
                        }
                    }
                }
            }
        }
    }
} catch (e) {
    // Non-fatal if .env is missing or already loaded in production
}

/**
 * Masks a Key ID for safe display in logs and UI (e.g. "rzp_live_...fxvJ")
 */
export function maskKeyId(keyId) {
    if (!keyId || typeof keyId !== 'string') return 'Not Configured';
    if (keyId.length <= 12) return keyId.slice(0, 4) + '...' + keyId.slice(-3);
    return keyId.slice(0, 8) + '...' + keyId.slice(-4);
}

/**
 * Reads key pairs from CSV files (e.g. rzp-key (1).csv) if available.
 */
function readCsvCredentials() {
    try {
        const cwd = process.cwd();
        const candidateFiles = [
            path.join(cwd, 'razor pay api keys .csv'),
            path.join(cwd, 'razor-pay-api-keys.csv'),
            path.join(cwd, 'rzp-key.csv'),
            path.join(cwd, 'rzp-key (1).csv')
        ];

        for (const filePath of candidateFiles) {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(',').map(s => s.trim());
                    if (parts.length >= 2 && parts[0].startsWith('rzp_')) {
                        return {
                            keyId: parts[0],
                            keySecret: parts[1],
                            source: path.basename(filePath)
                        };
                    }
                }
            }
        }
    } catch (e) {
        // Silently continue
    }
    return null;
}

/**
 * Safely extracts Key ID from environment with alias and whitespace/quote stripping
 */
export function getEnvKeyId() {
    const raw = process.env.RAZORPAY_KEY_ID 
        || process.env.VITE_RAZORPAY_KEY_ID 
        || process.env.RAZORPAY_KEY 
        || process.env.RAZORPAY_API_KEY 
        || process.env.RZP_KEY_ID
        || process.env.RAZOR_PAY_KEY_ID
        || '';
    return typeof raw === 'string' ? raw.trim().replace(/^["']|["']$/g, '') : '';
}

/**
 * Safely extracts Key Secret from environment with alias and whitespace/quote stripping
 */
export function getEnvKeySecret() {
    const raw = process.env.RAZORPAY_KEY_SECRET 
        || process.env.RAZORPAY_SECRET 
        || process.env.RAZORPAY_API_SECRET 
        || process.env.RAZORPAY_SECRET_KEY 
        || process.env.RZP_KEY_SECRET
        || process.env.RAZOR_PAY_KEY_SECRET
        || '';
    return typeof raw === 'string' ? raw.trim().replace(/^["']|["']$/g, '') : '';
}

/**
 * Safely extracts Webhook Secret with alias and whitespace/quote stripping
 */
export function getEnvWebhookSecret() {
    const raw = process.env.RAZORPAY_WEBHOOK_SECRET
        || process.env.RAZORPAY_WEBHOOK
        || process.env.RZP_WEBHOOK_SECRET
        || '';
    return typeof raw === 'string' ? raw.trim().replace(/^["']|["']$/g, '') : '';
}

let cachedWorkingPair = null;

/**
 * Validates the Razorpay server configuration without exposing the secret.
 * Section 3: Environment Validation
 */
export function validateRazorpayConfig() {
    const envKeyId = getEnvKeyId();
    const envKeySecret = getEnvKeySecret();
    const csvCreds = readCsvCredentials();

    const keyId = envKeyId || csvCreds?.keyId || '';
    const keySecret = envKeySecret || csvCreds?.keySecret || '';
    const source = envKeyId && envKeySecret ? (process.env.VERCEL ? 'Vercel Environment Variables' : 'process.env / .env') : (csvCreds ? csvCreds.source : 'none');

    const keyConfigured = Boolean(keyId && keyId.length > 0);
    const secretConfigured = Boolean(keySecret && keySecret.length > 0);
    const webhookConfigured = Boolean(getEnvWebhookSecret().length > 0);

    const isLive = keyId.startsWith('rzp_live_');
    const isTest = keyId.startsWith('rzp_test_');
    const mode = isLive ? 'LIVE' : (isTest ? 'TEST' : (process.env.RAZORPAY_MODE?.toUpperCase() || 'UNKNOWN'));

    console.log('[Razorpay] Configuration loaded');
    console.log(`[Razorpay] Environment: ${mode}`);
    console.log(`[Razorpay] Key ID configured: ${keyConfigured}`);
    console.log(`[Razorpay] Secret configured: ${secretConfigured}`);

    if (!keyConfigured && !secretConfigured) {
        return {
            isValid: false,
            error: 'RAZORPAY_CONFIG_MISSING',
            message: 'Razorpay configuration is incomplete on the server. Neither Key ID nor Key Secret is configured.',
            keyConfigured: false,
            secretConfigured: false,
            webhookConfigured,
            mode,
            keyIdMasked: 'Not Configured',
            source
        };
    }

    if (!keyConfigured) {
        return {
            isValid: false,
            error: 'RAZORPAY_KEY_ID_MISSING',
            message: 'Razorpay Key ID is missing in the server configuration.',
            keyConfigured: false,
            secretConfigured: true,
            webhookConfigured,
            mode,
            keyIdMasked: 'Not Configured',
            source
        };
    }

    if (!secretConfigured) {
        return {
            isValid: false,
            error: 'RAZORPAY_KEY_SECRET_MISSING',
            message: 'Razorpay Key Secret is missing on the server. Configure RAZORPAY_KEY_SECRET in environment variables.',
            keyConfigured: true,
            secretConfigured: false,
            webhookConfigured,
            mode,
            keyIdMasked: maskKeyId(keyId),
            source
        };
    }

    return {
        isValid: true,
        error: null,
        message: 'Razorpay configuration is valid.',
        keyId,
        keySecret,
        keyIdMasked: maskKeyId(keyId),
        keyConfigured: true,
        secretConfigured: true,
        webhookConfigured,
        mode,
        source
    };
}

/**
 * Returns candidate key pairs to test against Razorpay.
 */
function getCandidatePairs() {
    const candidates = [];

    // Candidate A: .env / process.env / Vercel
    const envKeyId = getEnvKeyId();
    const envKeySecret = getEnvKeySecret();
    if (envKeyId && envKeySecret) {
        candidates.push({ keyId: envKeyId, keySecret: envKeySecret, source: process.env.VERCEL ? 'Vercel Environment' : '.env' });
    }

    // Candidate B: CSV file (e.g. rzp-key (1).csv)
    const csvCreds = readCsvCredentials();
    if (csvCreds?.keyId && csvCreds?.keySecret) {
        // Only add if not identical to candidate A
        if (!candidates.some(c => c.keyId === csvCreds.keyId && c.keySecret === csvCreds.keySecret)) {
            candidates.push({ keyId: csvCreds.keyId.trim(), keySecret: csvCreds.keySecret.trim(), source: csvCreds.source });
        }
    }

    return candidates;
}

/**
 * Makes an authenticated request to verify Razorpay credentials without performing a payment.
 * Section 6: Test Razorpay Connection
 */
export async function testRazorpayConnection(forceRefresh = false) {
    if (forceRefresh) {
        cachedWorkingPair = null;
    }
    if (!forceRefresh && cachedWorkingPair) {
        return {
            success: true,
            status: 'Connected',
            mode: cachedWorkingPair.keyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST',
            keyIdMasked: maskKeyId(cachedWorkingPair.keyId),
            keyConfigured: true,
            secretConfigured: true,
            message: 'Connected to Razorpay API successfully.',
            timestamp: new Date().toISOString(),
            source: cachedWorkingPair.source
        };
    }

    console.log('[Razorpay] Connection test started');
    const candidates = getCandidatePairs();

    if (candidates.length === 0) {
        const envKeyId = getEnvKeyId();
        const envKeySecret = getEnvKeySecret();
        const keyConfigured = Boolean(envKeyId);
        const secretConfigured = Boolean(envKeySecret);
        const detectedEnvNames = Object.keys(process.env).filter(k => 
            k.toUpperCase().includes('RAZOR') || 
            k.toUpperCase().includes('RZP')
        );

        return {
            success: false,
            status: 'Error',
            error: 'MISSING_CONFIGURATION',
            message: !keyConfigured && !secretConfigured 
                ? 'Razorpay configuration is incomplete on the server. Neither Key ID nor Key Secret is configured.'
                : !keyConfigured 
                ? 'Razorpay Key ID is missing in the server configuration.'
                : 'Razorpay Key Secret is missing on the server.',
            keyConfigured,
            secretConfigured,
            mode: envKeyId.startsWith('rzp_live_') ? 'LIVE' : (envKeyId.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN'),
            keyIdMasked: keyConfigured ? maskKeyId(envKeyId) : 'Not Configured',
            timestamp: new Date().toISOString(),
            diagnostics: {
                runtime: process.env.VERCEL ? 'Vercel Serverless Function' : 'Node.js Local Server',
                vercelEnv: process.env.VERCEL_ENV || (process.env.VERCEL ? 'production' : 'local'),
                detectedKeys: detectedEnvNames
            }
        };
    }

    let lastError = null;

    for (const pair of candidates) {
        const basicAuth = Buffer.from(`${pair.keyId}:${pair.keySecret}`).toString('base64');
        try {
            const response = await fetch('https://api.razorpay.com/v1/payments?count=1', {
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'User-Agent': 'RESQR-Backend-Diagnostic/2.0'
                }
            });

            const data = await response.json();

            if (response.ok && !data.error) {
                console.log('[Razorpay] Connection successful');
                cachedWorkingPair = pair;
                const isLive = pair.keyId.startsWith('rzp_live_');
                return {
                    success: true,
                    status: 'Connected',
                    mode: isLive ? 'LIVE' : 'TEST',
                    keyIdMasked: maskKeyId(pair.keyId),
                    keyConfigured: true,
                    secretConfigured: true,
                    message: `Successfully connected to Razorpay API (${isLive ? 'LIVE' : 'TEST'} Mode).`,
                    timestamp: new Date().toISOString(),
                    sampleCount: data.count || 0,
                    source: pair.source
                };
            } else if (data.error) {
                lastError = data.error;
                console.warn(`[Razorpay] Candidate key ${maskKeyId(pair.keyId)} (${pair.source}) rejected: ${data.error.description || data.error.code}`);
            }
        } catch (fetchErr) {
            console.error('[Razorpay] Network error testing connection:', fetchErr.message);
            lastError = { code: 'NETWORK_ERROR', description: fetchErr.message };
        }
    }

    // All candidates failed
    const isAuthFailed = lastError?.code === 'BAD_REQUEST_ERROR' || lastError?.description?.toLowerCase().includes('auth');
    const errorCode = isAuthFailed ? 'INVALID_CREDENTIALS' : (lastError?.code || 'RAZORPAY_API_ERROR');
    const safeMsg = isAuthFailed
        ? 'Razorpay rejected credentials: Authentication failed. Verify that your Key ID and Key Secret are active and match.'
        : `Razorpay API communication error: ${lastError?.description || 'Unknown error'}`;

    return {
        success: false,
        status: 'Error',
        error: errorCode,
        message: safeMsg,
        keyConfigured: true,
        secretConfigured: true,
        mode: candidates[0].keyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST',
        keyIdMasked: maskKeyId(candidates[0].keyId),
        timestamp: new Date().toISOString()
    };
}

/**
 * Returns active working Razorpay credentials, automatically testing/resolving candidate pairs.
 */
export async function getActiveRazorpayCredentials() {
    if (cachedWorkingPair) {
        return cachedWorkingPair;
    }

    const testResult = await testRazorpayConnection(true);
    if (testResult.success && cachedWorkingPair) {
        return cachedWorkingPair;
    }

    // If test failed, fall back to first configured pair
    const candidates = getCandidatePairs();
    if (candidates.length > 0) {
        return candidates[0];
    }

    return null;
}
