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
export function audit(opts: {
    userId: string;
    hospitalId: string;
    action: string;
    entity?: string | undefined;
    entityId?: string | undefined;
    level?: string | undefined;
    ip?: string | undefined;
}): void;
