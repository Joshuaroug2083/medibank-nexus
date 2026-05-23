/**
 * ReferralsPage — Internal & External Patient Referrals
 * Roles: doctor (create + view own), admin (view all), nurse (create)
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth }  from '../context/AuthContext';
import { apiFetch } from '../context/AuthContext';
import {
  IcArrowRight, IcPerson, IcSearch, IcCheckCircle,
  IcWarning, IcClock, IcHospital,
} from '../components/Icons';

const MOCK_REFERRALS = [
  { id: 1, patient_name: 'Amaka Obi',    referral_type: 'internal', from_dept: 'Emergency', to_dept: 'Cardiology',       from_doctor_name: 'Dr. Ibrahim', reason: 'Chest pain — rule out MI',            urgency: 'urgent',  status: 'pending',   created_at: new Date(Date.now()-3600000).toISOString()  },
  { id: 2, patient_name: 'Chike Eze',    referral_type: 'external', from_dept: 'General',   to_hospital_name: 'LUTH',    from_doctor_name: 'Dr. Adebayo', reason: 'Neurosurgery consultation required',   urgency: 'routine', status: 'accepted',  created_at: new Date(Date.now()-86400000).toISOString() },
  { id: 3, patient_name: 'Ngozi Okeke',  referral_type: 'internal', from_dept: 'Paediatric',to_dept: 'Ophthalmology',    from_doctor_name: 'Dr. Adebayo', reason: 'Vision screening & possible strabismus',urgency: 'routine', status: 'completed', created_at: new Date(Date.now()-2*86400000).toISOString()},
];

const URGENCY_STYLE = {
  routine:   ['var(--primary)',  'var(--primary-light)'],
  urgent:    ['var(--warning)',  'var(--warning-light)'],
  emergency: ['var(--danger)',   'var(--danger-light)'],
};

const STATUS_STYLE = {
  pending:   ['var(--text-500)','var(--bg)'],
  accepted:  ['var(--primary)', 'var(--primary-light)'],
  completed: ['var(--success)', 'var(--success-light)'],
  cancelled: ['var(--danger)',  'var(--danger-light)'],
};

export default function ReferralsPage() {
  const { user }               = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all'); // all | pending | accepted | completed
  const [search,    setSearch]    = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [form, setForm] = useState({
    patientId: '', referralType: 'internal', toDept: '',
    toHospitalName: '', toSpecialist: '', reason: '', urgency: 'routine', clinicalSummary: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (filter !== 'all') params.set('status', filter);
      const res = await apiFetch(`/api/v1/referrals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals);
      } else throw new Error();
    } catch {
      setReferrals(MOCK_REFERRALS);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.reason.trim()) return setSaveErr('Reason is required');
    setSaving(true); setSaveErr('');
    try {
      const res  = await apiFetch('/api/v1/referrals', {
        method: 'POST',
        body:   JSON.stringify({
          patientId:      form.patientId || undefined,
          referralType:   form.referralType,
          toDept:         form.toDept || undefined,
          toHospitalName: form.toHospitalName || undefined,
          toSpecialist:   form.toSpecialist || undefined,
          reason:         form.reason,
          urgency:        form.urgency,
          clinicalSummary:form.clinicalSummary || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveErr(data.error); setSaving(false); return; }
      setReferrals(r => [data.referral, ...r]);
      setShowForm(false);
      setForm({ patientId:'',referralType:'internal',toDept:'',toHospitalName:'',toSpecialist:'',reason:'',urgency:'routine',clinicalSummary:'' });
    } catch {
      setSaveErr('Network error. Please try again.');
    } finally { setSaving(false); }
  };

  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = referrals.filter(r =>
    (!search || r.patient_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-900)', marginBottom: 4 }}>Referrals</h2>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)' }}>Manage internal department referrals and external hospital referrals.</p>
        </div>
        {(user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'admin') && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            <IcArrowRight width={13} height={13} /> New Referral
          </button>
        )}
      </div>

      {/* ── New Referral Form ── */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)', marginBottom: 16 }}>Create Referral</div>

          {saveErr && <div style={{ padding: '8px 12px', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', fontSize: '.8rem', color: 'var(--danger-dark)', marginBottom: 12 }}>{saveErr}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Referral Type</label>
              <select className="input" value={form.referralType} onChange={e => p('referralType', e.target.value)}>
                <option value="internal">Internal (dept-to-dept)</option>
                <option value="external">External (other hospital)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Urgency</label>
              <select className="input" value={form.urgency} onChange={e => p('urgency', e.target.value)}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            {form.referralType === 'internal' ? (
              <div className="form-group">
                <label className="form-label">To Department</label>
                <input className="input" placeholder="e.g. Cardiology" value={form.toDept} onChange={e => p('toDept', e.target.value)} />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">To Hospital</label>
                  <input className="input" placeholder="e.g. Lagos University Teaching Hospital" value={form.toHospitalName} onChange={e => p('toHospitalName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Specialist</label>
                  <input className="input" placeholder="e.g. Neurosurgeon" value={form.toSpecialist} onChange={e => p('toSpecialist', e.target.value)} />
                </div>
              </>
            )}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Reason for Referral *</label>
              <input className="input" placeholder="Brief clinical reason" value={form.reason} onChange={e => p('reason', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Clinical Summary</label>
              <textarea className="input" style={{ height: 80, resize: 'vertical', paddingTop: 10 }} placeholder="History, investigations, current management…" value={form.clinicalSummary} onChange={e => p('clinicalSummary', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <><div className="btn-spinner" /> Saving…</> : <><IcCheckCircle width={13} height={13} /> Submit Referral</>}
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setSaveErr(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all','pending','accepted','completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </button>
        ))}
        <div className="input-wrap" style={{ marginLeft: 'auto', maxWidth: 260 }}>
          <div className="input-icon-left"><IcSearch width={13} height={13} /></div>
          <input className="input input-sm" style={{ paddingLeft: 32 }} placeholder="Search patient…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Referrals List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-400)' }}>Loading referrals…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-400)' }}>
            <IcArrowRight width={32} height={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .25 }} />
            No referrals found.
          </div>
        ) : filtered.map(r => {
          const [urgencyColor, urgencyBg] = URGENCY_STYLE[r.urgency] ?? URGENCY_STYLE.routine;
          const [statusColor, statusBg]   = STATUS_STYLE[r.status]   ?? STATUS_STYLE.pending;
          return (
            <div key={r.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: urgencyBg, color: urgencyColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.referral_type === 'internal' ? <IcArrowRight width={16} height={16} /> : <IcHospital width={16} height={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-900)' }}>{r.patient_name}</span>
                    <span style={{ fontSize: '.72rem', padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700, background: urgencyBg, color: urgencyColor }}>{r.urgency}</span>
                    <span style={{ fontSize: '.72rem', padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700, background: statusBg, color: statusColor, marginLeft: 'auto' }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: '.84rem', color: 'var(--text-700)', marginBottom: 4 }}>{r.reason}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-400)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span><strong>From:</strong> {r.from_dept ?? r.from_doctor_name ?? '—'}</span>
                    <span><strong>To:</strong> {r.to_dept ?? r.to_hospital_name ?? '—'}{r.to_specialist ? ` (${r.to_specialist})` : ''}</span>
                    <span style={{ marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
