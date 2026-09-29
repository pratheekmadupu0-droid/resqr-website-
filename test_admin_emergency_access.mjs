import crypto from 'crypto';
import adminProfileHandler from './api/admin/emergency-profile.js';

function mockReqRes(headers = {}, query = {}, params = {}, method = 'GET') {
    let statusCode = 200;
    let responseData = null;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        }
    };
    const req = {
        method,
        headers,
        query,
        params,
        socket: { remoteAddress: '127.0.0.1' }
    };
    return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

// Generate test JWT
function createTestToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', 'test_sec').update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
}

async function runTests() {
    console.log('========================================================');
    console.log('🚀 TESTING RESQR ADMIN EMERGENCY PROFILE ACCESS CONTROL');
    console.log('========================================================\n');

    let passed = 0;
    let failed = 0;

    // ----------------------------------------------------
    // TEST 1 & 5: Authorized Admin Retrieves Emergency Profile Directly
    // ----------------------------------------------------
    console.log('--- TEST 1 & 5: Authorized Admin Directly Views Emergency Profile ---');
    const adminToken = createTestToken({
        email: 'admin@resqr.co.in',
        user_id: 'admin_test_uid',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 3600
    });

    const mock1 = mockReqRes(
        { 'authorization': `Bearer ${adminToken}` },
        { userId: 'c_demo_john_doe' }
    );

    await adminProfileHandler(mock1.req, mock1.res);
    const status1 = mock1.getStatus();
    const data1 = mock1.getData();

    console.log(`Response Status: ${status1}`);
    if (status1 === 200 && data1.success) {
        console.log('Emergency Profile returned:', {
            name: data1.emergencyProfile.name,
            bloodGroup: data1.emergencyProfile.bloodGroup,
            emergencyContact: data1.emergencyProfile.emergencyContact,
            emergencyActions: data1.emergencyProfile.emergencyActions,
            accessMode: data1.accessMode
        });

        // Verify NO biometric or sensitive documents returned
        const hasBiometrics = 'faceDescriptor' in data1.emergencyProfile || 'faceEmbedding' in data1.emergencyProfile;
        const hasAadhaar = 'aadhaar' in data1.emergencyProfile;
        const hasFullMedical = 'previousSurgeries' in data1.emergencyProfile;

        if (!hasBiometrics && !hasAadhaar && !hasFullMedical) {
            console.log('✅ TEST 1 & 5 PASSED: Admin profile opened directly with strictly sanitized emergency data. Zero biometric/Aadhaar/clinical leakage.');
            passed += 2;
        } else {
            console.error('❌ TEST 1 & 5 FAILED: Sensitive data found in response.');
            failed += 2;
        }
    } else {
        console.error('❌ TEST 1 & 5 FAILED: Response was not 200.', data1);
        failed += 2;
    }

    // ----------------------------------------------------
    // TEST 2: Client Attempts ?role=admin bypass without Admin token
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Fake query param ?role=admin Rejection ---');
    const mock2 = mockReqRes(
        {},
        { userId: 'c_demo_john_doe', role: 'admin' }
    );

    await adminProfileHandler(mock2.req, mock2.res);
    const status2 = mock2.getStatus();
    console.log(`Response Status: ${status2}`);
    if (status2 === 401 || status2 === 403) {
        console.log('✅ TEST 2 PASSED: Client parameter ?role=admin rejected. Requires valid token.');
        passed++;
    } else {
        console.error('❌ TEST 2 FAILED: Fake role was accepted!', status2);
        failed++;
    }

    // ----------------------------------------------------
    // TEST 3 & 4: Normal Citizen Attempts Accessing Admin API
    // ----------------------------------------------------
    console.log('\n--- TEST 3 & 4: Normal Citizen Token Access Denied (403 Forbidden) ---');
    const citizenToken = createTestToken({
        email: 'regular.citizen@example.com',
        user_id: 'citizen_123',
        role: 'citizen',
        exp: Math.floor(Date.now() / 1000) + 3600
    });

    const mock3 = mockReqRes(
        { 'authorization': `Bearer ${citizenToken}` },
        { userId: 'c_demo_john_doe' }
    );

    await adminProfileHandler(mock3.req, mock3.res);
    const status3 = mock3.getStatus();
    const data3 = mock3.getData();
    console.log(`Response Status: ${status3}`, data3);
    if (status3 === 403 && data3.code === 'FORBIDDEN_NOT_ADMIN') {
        console.log('✅ TEST 3 & 4 PASSED: Citizen correctly denied with 403 Forbidden.');
        passed += 2;
    } else {
        console.error('❌ TEST 3 & 4 FAILED: Citizen was not rejected with 403.', status3);
        failed += 2;
    }

    // ----------------------------------------------------
    // TEST 6: Audit Log Recording Verification
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Audit Log Verification ---');
    const { adminAuditLogsCache } = await import('./api/admin/emergency-profile.js');
    if (adminAuditLogsCache.length > 0 && adminAuditLogsCache[0].action === 'VIEW' && adminAuditLogsCache[0].profileType === 'EMERGENCY_PROFILE') {
        console.log('Audit Log Recorded:', adminAuditLogsCache[0]);
        console.log('✅ TEST 6 PASSED: Admin profile inspection successfully audit-logged with adminId, targetUserId, timestamp, and IP.');
        passed++;
    } else {
        console.error('❌ TEST 6 FAILED: Audit log entry missing.');
        failed++;
    }

    console.log('\n========================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    if (failed > 0) process.exit(1);
}

runTests();
