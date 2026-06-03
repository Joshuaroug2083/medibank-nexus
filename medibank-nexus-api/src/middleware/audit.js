import db from '../db.js';

/**
 * Write an entry to the audit_log table.
 * Fire-and-forget — does not block the response.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.hospitalId
 * @param {string} opts.action      — e.g. 'login', 'register_patient'
 * @param {string} [opts.entity]    — e.g. 'patient', 'visit'
 * @param {string} [opts.entityId]
 * @param {string} [opts.level]     — 'info' | 'warning' | 'error'
 * @param {string} [opts.ip]
 */
export function audit(opts) {
  db('audit_log').insert({
    hospital_id: opts.hospitalId ?? null,
    user_id:     opts.userId     ?? null,
    action:      opts.action,
    entity:      opts.entity     ?? null,
    entity_id:   opts.entityId   ?? null,
    level:       opts.level      ?? 'info',
    ip:          opts.ip         ?? null,
  }).catch(err => console.error('[AUDIT]', err.message));
}
