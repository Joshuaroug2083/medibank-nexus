/**
 * Laboratory / Investigations Page
 * Roles: doctor, nurse (order tests) | nurse, admin (record results) | all (view orders)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth }   from '../context/AuthContext';
import { api }       from '../lib/api';
import Badge         from '../components/Badge';
import Alert         from '../components/Alert';
import Card          from '../components/Card';
import EmptyState    from '../components/EmptyState';
import {
  IcFlask, IcPerson, IcCalendar, IcClock, IcCheckCircle,
  IcWarning, IcX, IcPlus, IcSearch, IcRefresh,
} from '../components/Icons';

/* ── common Nigerian lab tests ── */
const COMMON_TESTS = [
  { name: 'Full Blood Count (FBC)', code: 'FBC', category: 'haematology' },
  { name: 'Fasting Blood Sugar (FBS)', code: 'FBS', category: 'biochemistry' },
  { name: 'Random Blood Sugar (RBS)', code: 'RBS', category: 'biochemistry' },
  { name: 'HbA1c', code: 'HBA1C', category: 'biochemistry' },
  { name: 'Urea, Electrolytes & Creatinine (U/E/Cr)', code: 'UEC', category: 'biochemistry' },
  { name: 'Liver Function Tests (LFT)', code: 'LFT', category: 'biochemistry' },
  { name: 'Lipid Profile', code: 'LIPID', category: 'biochemistry' },
  { name: 'Malaria RDT', code: 'MRDT', category: 'serology' },
  { name: 'Malaria Thick & Thin Film', code: 'MTF', category: 'haematology' },
  { name: 'Widal Test', code: 'WIDAL', category: 'serology' },
  { name: 'HIV Screening', code: 'HIV', category: 'serology' },
  { name: 'Hepatitis B Surface Antigen (HBsAg)', code: 'HBSAG', category: 'serology' },
  { name: 'Urinalysis (U/A)', code: 'UA', category: 'urine' },
  { name: 'Urine M/C/S', code: 'UMCS', category: 'urine' },
  { name: 'Thyroid Function Test (TFT)', code: 'TFT', category: 'biochemistry' },
  { name: 'Prostate Specific Antigen (PSA)', code: 'PSA', category: 'biochemistry' },
  { name: 'Pregnancy Test (UPT)', code: 'UPT', category: 'serology' },
  { name: 'Blood Culture & Sensitivity', code: 'BCS', category: 'microbiology' },
  { name: 'Sputum for AFB', code: 'AFB', category: 'microbiology' },
  { name: 'ECG', code: 'ECG', category: 'imaging' },
  { name: 'Chest X-Ray', code: 'CXR', category: 'imaging' },
  { name: 'Abdominal Ultrasound', code: 'USS-ABD', category: 'imaging' },
];

const STATUS_BADGE = {
  pending:    { variant: 'warning', label: 'Pending'     },
  collected:  { variant: 'primary', label: 'Collected'   },
  processing: { variant: 'primary', label: 'Processing'  },
  completed:  { variant: 'success', label: 'Completed'   },
  cancelled:  { variant: 'danger',  label: 'Cancelled'   },
};
const PRIORITY_COLOR = { routine: 'var(--text-400)', urgent: 'var(--warning)', stat: 'var(--danger)' };

const fmt = d => d ? new Date(d).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

/* ════════════ ORDER MODAL ═══════════════════════════════════ */
function OrderModal({ onClose, onCreated }) {
  const [search,      setSearch]      = useState('');
  const [patients,    setPatients]    = useState([]);
  const [patient,     setPatient]     = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [priority,    setPriority]    = useState('routine');
  const [notes,       setNotes]       = useState('');
  const [testSearch,  setTestSearch]  = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const debRef = useRef(null);

  useEffect(() => {
    if (search.length < 2) { setPatients([]); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      try {
        const r = await api.get(`/api/v1/patients?q=${encodeURIComponent(search)}&limit=6`);
        setPatients(r.patients ?? []);
      } catch { setPatients([]); }
    }, 300);
  }, [search]);

  const toggleTest = t => {
    setSelectedTests(prev =>
      prev.find(x => x.code === t.code) ? prev.filter(x => x.code !== t.code) : [...prev, t]
    );
  };

  const filteredTests = COMMON_TESTS.filter(t =>
    !testSearch || t.name.toLowerCase().includes(testSearch.toLowerCase()) || t.category.includes(testSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!patient) return setError('Select a patient');
    if (!selectedTests.length) return setError('Select at least one test');
    setSaving(true); setError('');
    try {
      const r = await api.post('/api/v1/lab/orders', {
        patientId: patient.id,
        tests: selectedTests,
        priority,
        notes,
      });
      onCreated(r.order);
      onClose();
    } catch (e) {
      setError(e.data?.error ?? 'Failed to create lab order');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 660, width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title"><IcFlask width={16} height={16} /> New Lab Order</h3>
          <button className="icon-btn" onClick={onClose}><IcX width={16} height={16} /></button>
        </div>
        <div className="modal-body">
          {error && <Alert variant="danger" style={{ marginBottom: 12 }}>{error}</Alert>}

          {/* Patient search */}
          <div className="form-group">
            <label className="form-label">Patient *</label>
            {patient ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--primary-light)', borderRadius:'var(--radius-md)', border:'1px solid var(--primary)22' }}>
                <IcPerson width={14} height={14} style={{ color:'var(--primary)' }} />
                <span style={{ fontWeight:700, fontSize:'.85rem', color:'var(--primary-dark)', flex:1 }}>{patient.name} — {patient.id}</span>
                <button className="icon-btn" onClick={() => setPatient(null)}><IcX width={12} height={12} /></button>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                <input className="input" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                {patients.length > 0 && (
                  <div className="search-dropdown">
                    {patients.map(p => (
                      <button key={p.id} className="search-dropdown-item" onClick={() => { setPatient(p); setSearch(''); setPatients([]); }}>
                        <IcPerson width={13} height={13} style={{ color:'var(--text-400)' }} />
                        <span style={{ fontWeight:600 }}>{p.name}</span>
                        <span style={{ marginLeft:'auto', fontSize:'.75rem', color:'var(--text-400)' }}>{p.id}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test selection */}
          <div className="form-group">
            <label className="form-label">Tests * <span style={{ color:'var(--text-400)', fontWeight:400 }}>({selectedTests.length} selected)</span></label>
            <input className="input" placeholder="Filter tests…" value={testSearch} onChange={e => setTestSearch(e.target.value)} style={{ marginBottom:8 }} />
            <div style={{ maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:4, border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:8 }}>
              {filteredTests.map(t => {
                const selected = !!selectedTests.find(x => x.code === t.code);
                return (
                  <label key={t.code} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px', borderRadius:'var(--radius)', cursor:'pointer', background: selected ? 'var(--primary-light)' : 'transparent' }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleTest(t)} style={{ accentColor:'var(--primary)' }} />
                    <span style={{ flex:1, fontSize:'.83rem', fontWeight: selected ? 700 : 400, color: selected ? 'var(--primary-dark)' : 'var(--text-700)' }}>{t.name}</span>
                    <span style={{ fontSize:'.7rem', color:'var(--text-400)', background:'var(--surface-2)', padding:'1px 6px', borderRadius:4 }}>{t.category}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="input" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════ RESULTS MODAL ═════════════════════════════════ */
function ResultsModal({ order, onClose, onUpdated }) {
  const [results, setResults] = useState(
    order.tests.map(t => ({ testId: t.id, result: t.result ?? '', unit: t.unit ?? '', referenceRange: t.reference_range ?? '', flag: t.flag ?? '' }))
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const update = (i, field, val) => setResults(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const r = await api.post(`/api/v1/lab/orders/${order.id}/results`, { results });
      onUpdated(r.tests);
      onClose();
    } catch (e) {
      setError(e.data?.error ?? 'Failed to save results');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Enter Results — {order.id}</h3>
          <button className="icon-btn" onClick={onClose}><IcX width={16} height={16} /></button>
        </div>
        <div className="modal-body">
          {error && <Alert variant="danger" style={{ marginBottom:12 }}>{error}</Alert>}
          <p style={{ fontSize:'.8rem', color:'var(--text-400)', marginBottom:14 }}>Patient: <strong>{order.patient_name}</strong></p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {order.tests.map((t, i) => (
              <div key={t.id} style={{ padding:'12px 14px', background:'var(--surface-2)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:700, fontSize:'.85rem', marginBottom:8 }}>{t.test_name}</div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 2fr 1fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:'.72rem', color:'var(--text-400)', display:'block', marginBottom:3 }}>Result</label>
                    <input className="input" placeholder="Enter result" value={results[i]?.result ?? ''} onChange={e => update(i, 'result', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize:'.72rem', color:'var(--text-400)', display:'block', marginBottom:3 }}>Unit</label>
                    <input className="input" placeholder="e.g. g/dL" value={results[i]?.unit ?? ''} onChange={e => update(i, 'unit', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize:'.72rem', color:'var(--text-400)', display:'block', marginBottom:3 }}>Reference Range</label>
                    <input className="input" placeholder="e.g. 11.5–16.5" value={results[i]?.referenceRange ?? ''} onChange={e => update(i, 'referenceRange', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize:'.72rem', color:'var(--text-400)', display:'block', marginBottom:3 }}>Flag</label>
                    <select className="input" value={results[i]?.flag ?? ''} onChange={e => update(i, 'flag', e.target.value)}>
                      <option value="">Normal</option>
                      <option value="low">Low</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Results'}</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════ MAIN PAGE ═════════════════════════════════════ */
export default function LabPage() {
  const { user }   = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [resultsFor, setResultsFor] = useState(null);
  const canOrder  = ['doctor','nurse'].includes(user.role);
  const canResult = ['nurse','doctor','admin'].includes(user.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 60 });
      if (search) params.set('q', search);
      if (status) params.set('status', status);
      const r = await api.get(`/api/v1/lab/orders?${params}`);
      setOrders(r.orders ?? []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/v1/lab/orders/${id}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch { /* ignore */ }
  };

  return (
    <div className="anim-fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Laboratory <span>& Investigations</span></div>
          <div className="page-subtitle">Manage lab orders and test results</div>
        </div>
        {canOrder && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <IcPlus width={14} height={14} /> New Lab Order
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 220px' }}>
          <IcSearch width={14} height={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)' }} />
          <input className="input" style={{ paddingLeft:32 }} placeholder="Search by patient or order ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width:160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="collected">Collected</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-outline" onClick={load}><IcRefresh width={14} height={14} /></button>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'var(--text-400)' }}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <EmptyState title="No lab orders found" icon={<IcFlask width={26} height={26} />}
          action={canOrder ? <button className="btn btn-primary" onClick={() => setShowModal(true)}><IcPlus width={14} height={14} /> New Order</button> : null} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {orders.map(order => {
            const sb = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
            return (
              <div key={order.id} className="card" style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:800, fontSize:'.86rem', fontFamily:'var(--font-mono)', color:'var(--text-900)' }}>{order.id}</span>
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                      <span style={{ fontSize:'.74rem', fontWeight:700, color: PRIORITY_COLOR[order.priority] }}>
                        {order.priority.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontWeight:600, fontSize:'.88rem', color:'var(--text-900)', marginBottom:3 }}>
                      <IcPerson width={12} height={12} style={{ marginRight:5, color:'var(--text-400)' }} />
                      {order.patient_name}
                    </div>
                    <div style={{ fontSize:'.74rem', color:'var(--text-400)', display:'flex', gap:12 }}>
                      <span><IcCalendar width={10} height={10} style={{ marginRight:4 }} />{fmt(order.ordered_at)}</span>
                      <span>By {order.ordered_by_name}</span>
                    </div>
                  </div>

                  {/* Tests summary */}
                  <div style={{ flex:2, minWidth:200 }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {order.tests.map(t => (
                        <span key={t.id} style={{
                          fontSize:'.74rem', padding:'2px 8px', borderRadius:4,
                          background: t.flag === 'critical' ? '#fee2e2' : t.flag === 'high' || t.flag === 'low' ? '#fef3c7' : 'var(--surface-2)',
                          color: t.flag === 'critical' ? 'var(--danger)' : t.flag ? 'var(--warning)' : 'var(--text-600)',
                          border: '1px solid var(--border)', fontWeight: t.result ? 600 : 400,
                        }}>
                          {t.test_name}{t.result ? `: ${t.result}${t.unit ? ' '+t.unit : ''}` : ''}
                          {t.flag && t.flag !== 'normal' && ` ⚠`}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap' }}>
                    {canResult && order.status === 'pending' && (
                      <button className="btn btn-outline btn-sm" onClick={() => updateStatus(order.id, 'collected')}>
                        Mark Collected
                      </button>
                    )}
                    {canResult && order.status === 'collected' && (
                      <button className="btn btn-outline btn-sm" onClick={() => updateStatus(order.id, 'processing')}>
                        Processing
                      </button>
                    )}
                    {canResult && order.status === 'processing' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setResultsFor(order)}>
                        Enter Results
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <button className="btn btn-outline btn-sm" onClick={() => setResultsFor(order)}>
                        View / Edit Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <OrderModal
          onClose={() => setShowModal(false)}
          onCreated={o => setOrders(prev => [o, ...prev])}
        />
      )}

      {resultsFor && (
        <ResultsModal
          order={resultsFor}
          onClose={() => setResultsFor(null)}
          onUpdated={tests => {
            setOrders(prev => prev.map(o => o.id === resultsFor.id ? { ...o, tests, status: tests.every(t => t.result) ? 'completed' : o.status } : o));
            setResultsFor(null);
          }}
        />
      )}
    </div>
  );
}
