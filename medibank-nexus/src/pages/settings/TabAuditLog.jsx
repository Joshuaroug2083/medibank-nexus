/**
 * TabAuditLog — Admin Settings > Audit Log Viewer
 * Streams paginated audit events from /api/v1/compliance/audit-log
 * with filters for action, entity, user, date range.
 */
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../context/AuthContext';
import {
  IcShield, IcSearch, IcWarning, IcCheckCircle,
} from '../../components/Icons';

const ACTION_COLORS = {
  login:            'var(--success)',
  login_failed:     'var(--danger)',
  logout:           'var(--text-400)',
  create:           'var(--primary)',
  update:           'var(--warning)',
  delete:           'var(--danger)',
  staff_added:      'var(--primary)',
  staff_removed:    'var(--danger)',
  patient_admitted: 'var(--teal)',
  patient_discharged:'var(--success)',
  subscription_activated: 'var(--success)',
  '2fa_enabled':    'var(--success)',
  '2fa_disabled':   'var(--warning)',
};

function actionColor(action) {
  for (const [k, v] of Object.entries(ACTION_COLORS)) {
    if (action.includes(k)) return v;
  }
  return 'var(--text-500)';
}

/* Mock data shown when the API is not running */
const MOCK_LOGS = [
  { id: 1, user_name: 'Dr. Adebayo', user_role: 'doctor',  action: 'login',               entity: null,       created_at: new Date(Date.now() - 300_000).toISOString(),  ip: '192.168.1.5' },
  { id: 2, user_name: 'Admin Grace', user_role: 'admin',   action: 'staff_added',          entity: 'user',     created_at: new Date(Date.now() - 900_000).toISOString(),  ip: '192.168.1.2' },
  { id: 3, user_name: 'Nurse Emeka', user_role: 'nurse',   action: 'patient_admitted',     entity: 'admission',created_at: new Date(Date.now() - 3_600_000).toISOString(), ip: '192.168.1.8' },
  { id: 4, user_name: 'Admin Grace', user_role: 'admin',   action: 'subscription_activated',entity:'hospital', created_at: new Date(Date.now() - 86_400_000).toISOString(),ip: '192.168.1.2' },
  { id: 5, user_name: null,          user_role: null,       action: 'login_failed',          entity: null,       created_at: new Date(Date.now() - 7_200_000).toISOString(), ip: '41.203.72.1' },
];

export default function TabAuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState({ action: '', entity: '', from: '', to: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (filters.action) params.set('action', filters.action);
      if (filters.entity) params.set('entity', filters.entity);
      if (filters.from)   params.set('from',   filters.from);
      if (filters.to)     params.set('to',     filters.to);

      const res = await apiFetch(`/api/v1/compliance/audit-log?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      } else {
        throw new Error();
      }
    } catch {
      setLogs(MOCK_LOGS);
      setTotal(MOCK_LOGS.length);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const p = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <IcShield width={18} height={18} style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-900)', margin: 0 }}>
          Audit Log
        </h3>
        <span style={{ fontSize: '.76rem', color: 'var(--text-400)', marginLeft: 'auto' }}>
          {total.toLocaleString()} events total
        </span>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
        padding: '16px 20px', marginBottom: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12,
      }}>
        <div>
          <label style={{ fontSize: '.74rem', color: 'var(--text-400)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
            Action
          </label>
          <div className="input-wrap">
            <div className="input-icon-left"><IcSearch width={12} height={12} /></div>
            <input
              className="input input-sm"
              style={{ paddingLeft: 30, fontSize: '.8rem' }}
              placeholder="e.g. login, patient…"
              value={filters.action}
              onChange={e => p('action', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '.74rem', color: 'var(--text-400)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Entity</label>
          <input
            className="input input-sm"
            style={{ fontSize: '.8rem' }}
            placeholder="user, patient, admission…"
            value={filters.entity}
            onChange={e => p('entity', e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: '.74rem', color: 'var(--text-400)', fontWeight: 600, display: 'block', marginBottom: 4 }}>From</label>
          <input
            type="date"
            className="input input-sm"
            style={{ fontSize: '.8rem' }}
            value={filters.from}
            onChange={e => p('from', e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: '.74rem', color: 'var(--text-400)', fontWeight: 600, display: 'block', marginBottom: 4 }}>To</label>
          <input
            type="date"
            className="input input-sm"
            style={{ fontSize: '.8rem' }}
            value={filters.to}
            onChange={e => p('to', e.target.value)}
          />
        </div>
      </div>

      {/* Log table */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-400)', fontSize: '.85rem' }}>
            Loading audit log…
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-400)', fontSize: '.85rem' }}>
            No audit events match your filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Timestamp','User','Action','Entity','IP'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-500)', fontSize: '.76rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'white' : 'var(--bg)' }}>
                  <td style={{ padding: '9px 14px', color: 'var(--text-400)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    {log.user_name
                      ? <><span style={{ fontWeight: 600, color: 'var(--text-800)' }}>{log.user_name}</span> <span style={{ color: 'var(--text-400)', fontSize: '.74rem' }}>({log.user_role})</span></>
                      : <span style={{ color: 'var(--text-300)', fontStyle: 'italic' }}>anonymous</span>
                    }
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: `color-mix(in srgb, ${actionColor(log.action)} 12%, white)`,
                      color: actionColor(log.action),
                      fontWeight: 600, fontSize: '.76rem',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--text-500)' }}>
                    {log.entity ?? '—'}
                    {log.entity_id ? ` #${log.entity_id}` : ''}
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--text-400)', fontFamily: 'var(--font-mono)', fontSize: '.76rem' }}>
                    {log.ip ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)',
            fontSize: '.8rem', color: 'var(--text-500)',
          }}>
            <span>Showing page {page} of {Math.ceil(total / 50)}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 50)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
