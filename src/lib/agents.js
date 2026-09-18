/**
 * RESQR Agent & Commission Service Layer
 * ---------------------------------------
 * Central, configurable commission + agent management logic.
 * All commission amounts come from `settings/commission` in RTDB
 * (admin-editable) — NEVER hard-coded in components.
 *
 * Data model (RTDB):
 *   settings/commission          -> { perClient: number, updatedAt }
 *   counters/agents              -> sequential agent number
 *   counters/clients             -> sequential client number
 *   agents/{agentId}             -> denormalized agent directory
 *   agentClients/{agentId}/{cid} -> clients enrolled BY that agent (scoped)
 *   clientDirectory/{phoneKey}   -> phone -> {agentId, clientId} duplicate guard
 *   commissions/{cid}            -> commission records (admin-controlled)
 *   auditLogs/{logId}            -> audit trail
 */

import { db } from './firebase';
import {
    ref, get, set, update, push, runTransaction, serverTimestamp, onValue
} from 'firebase/database';

const pad4 = (n) => String(n).padStart(4, '0');
const normalizePhone = (phone) => String(phone || '').replace(/[^0-9]/g, '').slice(-10);

/** Commission lifecycle statuses (lowercase in DB). */
export const COMMISSION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    PAID: 'paid',
    CANCELLED: 'cancelled',
};

/** Returns the configurable per-client commission (default 100). */
export async function getCommissionConfig() {
    const snap = await get(ref(db, 'settings/commission'));
    const cfg = snap.exists() ? snap.val() : {};
    return {
        perClient: Number(cfg.perClient) || 100,
        updatedAt: cfg.updatedAt || null,
    };
}

/** Admin-only: update the per-client commission amount. */
export async function setCommissionPerClient(amount, adminUid) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    await set(ref(db, 'settings/commission'), {
        perClient: value,
        updatedAt: serverTimestamp(),
        updatedBy: adminUid,
    });
    await writeAudit('commission_config_updated', adminUid, { perClient: value });
}

/**
 * Assign the next sequential Agent ID (RESQR-AG-0001, 0002, ...).
 * Uses a transaction so concurrent approvals never collide.
 * Writes to users/{uid} AND the agents directory. Returns the agentId.
 */
export async function assignAgentId(uid, agentName) {
    const counterRef = ref(db, 'counters/agents');
    const { snapshot } = await runTransaction(counterRef, (current) =>
        (typeof current === 'number' ? current : 0) + 1
    );
    const n = snapshot.val() || 1;
    const agentId = `RESQR-AG-${pad4(n)}`;

    await update(ref(db), {
        [`users/${uid}/agentId`]: agentId,
        [`users/${uid}/status`]: 'approved',
        [`agentsByUid/${uid}`]: agentId, // uid -> agentId lookup (scoped reads)
        [`agents/${agentId}`]: {
            agentId,
            uid,
            name: agentName || '',
            status: 'active',
            createdAt: serverTimestamp(),
        },
    });
    await writeAudit('agent_created', uid, { agentId, name: agentName });
    return agentId;
}

/** Fetch the full agent directory (admin only). */
export async function listAgents() {
    const snap = await get(ref(db, 'agents'));
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
}

/** Toggle an agent's active status (admin only). */
export async function setAgentStatus(agentId, status, adminUid) {
    const updates = {
        [`agents/${agentId}/status`]: status,
    };
    // Keep the user record in sync
    const snap = await get(ref(db, `agents/${agentId}/uid`));
    const uid = snap.val();
    if (uid) updates[`users/${uid}/agentStatus`] = status;
    await update(ref(db), updates);
    await writeAudit(status === 'active' ? 'agent_activated' : 'agent_deactivated', adminUid, { agentId });
}

export const validateClientForm = ({ name, phone, email }) => {
    const errors = {};
    if (!name || name.trim().length < 2) errors.name = 'Client name is required.';
    if (!/^[0-9+\-\s()]{10,15}$/.test(String(phone || '').trim())) errors.phone = 'Enter a valid phone number.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
    return errors;
};

/** Write an audit-log entry (best-effort; never blocks the main flow). */
export async function writeAudit(action, actorUid, details = {}) {
    try {
        await push(ref(db, 'auditLogs'), {
            action,
            actorUid: actorUid || null,
            details,
            at: serverTimestamp(),
        });
    } catch (e) {
        // Audit is supplementary — never break the primary flow on failure.
        console.warn('Audit log failed:', action, e);
    }
}

/**
 * Enroll a client on behalf of an agent.
 * - Duplicate protection via clientDirectory/{phoneKey}
 * - Sequential public client ID: RESQR-USER-000001
 * - Commission record generated from settings/commission (system-set,
 *   agents cannot modify amount or status)
 * Returns { clientId, commissionId } or { duplicate: true, existing }.
 */
export async function enrollClient(agent, clientData) {
    const { name, phone, email = '', notes = '' } = clientData;
    const phoneKey = normalizePhone(phone);
    if (!phoneKey || phoneKey.length < 10) throw new Error('A valid 10-digit mobile number is required.');
    if (!agent?.agentId) throw new Error('Agent identity missing. Please re-login.');

    // 1. Duplicate protection
    const dupSnap = await get(ref(db, `clientDirectory/${phoneKey}`));
    if (dupSnap.exists()) {
        const existing = dupSnap.val();
        return { duplicate: true, existing: { ...existing, phoneKey } };
    }

    // 2. Sequential client ID
    const counterRef = ref(db, 'counters/clients');
    const { snapshot } = await runTransaction(counterRef, (current) =>
        (typeof current === 'number' ? current : 0) + 1
    );
    const n = snapshot.val() || 1;
    const clientId = `RESQR-USER-${String(n).padStart(6, '0')}`;

    // 3. Configurable commission (never hard-coded in UI)
    const cfg = await getCommissionConfig();

    // 4. Commission record — status/amount are SYSTEM controlled
    const commissionRef = push(ref(db, 'commissions'));
    const commissionId = commissionRef.key;

    const enrollmentDate = Date.now();
    await update(ref(db), {
        [`agentClients/${agent.agentId}/${clientId}`]: {
            clientId,
            name: name.trim(),
            phone: String(phone).trim(),
            email: email.trim(),
            notes,
            agentId: agent.agentId,
            agentNameSnapshot: agent.name || '',
            enrollmentDate,
            resqrStatus: 'active',
            qrStatus: 'generated',
            commissionId,
            commissionAmount: cfg.perClient,
            commissionStatus: 'pending',
        },
        [`clientDirectory/${phoneKey}`]: {
            clientId,
            agentId: agent.agentId,
            phone,
            enrolledAt: enrollmentDate,
        },
        [`commissions/${commissionId}`]: {
            commissionId,
            agentId: agent.agentId,
            agentUid: agent.uid || null,
            clientId,
            clientName: name.trim(),
            amount: cfg.perClient,
            status: 'pending',           // pending | approved | paid | cancelled
            createdAt: enrollmentDate,
            paidAt: null,
        },
        // Agent-scoped commission mirror (agents read ONLY their own node)
        [`agentCommissions/${agent.agentId}/${commissionId}`]: {
            commissionId,
            clientId,
            clientName: name.trim(),
            amount: cfg.perClient,
            status: 'pending',
            createdAt: enrollmentDate,
        },
    });

    await writeAudit('client_enrolled', agent.uid, {
        agentId: agent.agentId,
        clientId,
        commissionId,
        amount: cfg.perClient,
    });

    return { duplicate: false, clientId, commissionId };
}

/** All clients enrolled by one agent (agent-scoped read). */
export async function listAgentClients(agentId) {
    const snap = await get(ref(db, `agentClients/${agentId}`));
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
}

/** Fetch one agent's profile (agents may read their own). */
export async function getAgent(agentId) {
    const snap = await get(ref(db, `agents/${agentId}`));
    return snap.exists() ? { id: snap.key, ...snap.val() } : null;
}

/** All commissions — admin view. Pass agentId to scope to one agent. */
export async function listCommissions(agentId = null) {
    const snap = await get(ref(db, 'commissions'));
    if (!snap.exists()) return [];
    const all = Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
    return agentId ? all.filter((c) => c.agentId === agentId) : all;
}

/**
 * ADMIN ONLY: update a commission's status.
 * Agents can never call this with elevated effect because the RTDB rules
 * (see database.rules.json) reject writes to /commissions from agents.
 */
export async function setCommissionStatus(commissionId, status, adminUid) {
    // Read agentId/clientId so we can mirror the status into the
    // agent-scoped record (agents read ONLY their own node).
    const snap = await get(ref(db, `commissions/${commissionId}`));
    const rec = snap.exists() ? snap.val() : {};
    const updates = { [`commissions/${commissionId}/status`]: status };
    if (status === 'paid') updates[`commissions/${commissionId}/paidAt`] = Date.now();
    if (rec.agentId && rec.clientId) {
        updates[`agentClients/${rec.agentId}/${rec.clientId}/commissionStatus`] = status;
        updates[`agentCommissions/${rec.agentId}/${commissionId}/status`] = status;
    }
    await update(ref(db), updates);
    await writeAudit(`commission_${status}`, adminUid, { commissionId, status, agentId: rec.agentId, clientId: rec.clientId });
}

/**
 * Resolve the logged-in agent's own profile (uid -> agentId -> agents doc).
 * Reads ONLY the agent's own document — never a global agents/users scan.
 */
export async function getAgentProfile(uid) {
    if (!uid) return null;
    const ptrSnap = await get(ref(db, `agentsByUid/${uid}`));
    if (!ptrSnap.exists()) return null;
    const agentId = ptrSnap.val();
    const snap = await get(ref(db, `agents/${agentId}`));
    if (!snap.exists()) return { agentId, status: 'unknown' };
    return { ...snap.val(), agentId: snap.val().agentId || agentId };
}

/** Live agent-scoped client list. Returns an unsubscribe function. */
export function listenAgentClients(agentId, callback) {
    const clientsRef = ref(db, `agentClients/${agentId}`);
    return onValue(clientsRef, (snap) => {
        const list = snap.exists()
            ? Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }))
                .sort((a, b) => (b.enrollmentDate || 0) - (a.enrollmentDate || 0))
            : [];
        callback(list);
    }, (err) => {
        console.error('Agent clients listener error:', err);
        callback([]);
    });
}

