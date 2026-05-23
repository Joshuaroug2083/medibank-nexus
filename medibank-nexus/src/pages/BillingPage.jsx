/**
 * Billing & Payments Page
 * Roles: admin, nurse (create/record), doctor (view), pharmacist (view)
 *
 * Features:
 *  - Invoice list with search/filter by status
 *  - Create new invoice with line items
 *  - Record payment (cash / card / transfer / NHIS)
 *  - Invoice detail modal
 *  - Revenue summary strip for admins
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast }    from '../components/Toast';
import { useAuth }     from '../context/AuthContext';
import Alert           from '../components/Alert';
import Badge           from '../components/Badge';
import {
  IcPlus, IcSearch, IcFileMedical, IcCheckCircle,
  IcClock, IcWarning, IcTrash, IcArrowRight, IcRefresh,
} from '../components/Icons';
import { api }         from '../lib/api';

/* ── helpers ───────────────────────────────────────────────── */
const fmt = (n) => `₦${Number(n ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE = {
  paid:      { variant: 'success', label: 'Paid'      },
  unpaid:    { variant: 'danger',  label: 'Unpaid'    },
  partial:   { variant: 'warning', label: 'Partial'   },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
  waived:    { variant: 'neutral', label: 'Waived'    },
};

const PAYMENT_METHODS = ['cash','card','transfer','nhis','insurance','pos','other'];
const ITEM_CATEGORIES = [
  { value: 'consultation', label: 'Consultation Fee' },
  { value: 'drug',         label: 'Drugs / Pharmacy'  },
  { value: 'lab',          label: 'Laboratory'        },
  { value: 'procedure',    label: 'Procedure'         },
  { value: 'service',      label: 'Other Service'     },
];

/* ── empty item template ────────────────────────────────────── */
const emptyItem = () => ({
  id:          Date.now() + Math.random(),
  description: '',
  quantity:    1,
  unitPrice:   '',
  category:    'service',
});

/* ═══════════════════════════════════════════════════════════════
   CREATE INVOICE MODAL
═══════════════════════════════════════════════════════════════ */
function CreateInvoiceModal({ onClose, onCreated }) {
  const toast = useToast();
  const [search,    setSearch]    = useState('');
  const [patients,  setPatients]  = useState([]);
  const [patient,   setPatient]   = useState(null);
  const [searching, setSearching] = useState(false);
  const [items,     setItems]     = useState([emptyItem()]);
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (!search.trim()) { setPatients([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { patients: res } = await api.get(`/api/v1/patients?q=${encodeURIComponent(search)}&limit=6`);
        setPatients(res ?? []);
      } catch { setPatients([]); }
      finally   { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const updateItem = (id, field, val) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  const total = items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1), 0);

  const submit = async () => {
    if (!patient) return toast.warning('Select a patient first');
    const valid = items.filter(i => i.description.trim() && Number(i.unitPrice) > 0);
    if (!valid.length) return toast.warning('Add at least one line item with description and amount');

    setLoading(true);
    try {
      const { invoice } = await api.post('/api/v1/billing/invoices', {
        patientId: patient.id,
        items: valid.map(i => ({
          description: i.description,
          quantity:    Number(i.quantity) || 1,
          unitPrice:   Number(i.unitPrice),
          amount:      (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1),
          category:    i.category,
        })),
        notes: notes || undefined,
        insuranceProvider: patient.insurance || undefined,
      });
      toast.success(`Invoice ${invoice.id} created`, 'Invoice Created');
      onCreated(invoice);
    } catch (err) {
      toast.error(err.message ?? 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640, width: '100%' }}>
        <div className="modal-header">
          <div className="modal-title">New Invoice</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Patient search */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Patient <span className="required">*</span></label>
            {patient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--primary-light)', borderRadius: 'var(--radius)', border: '1px solid var(--primary)' }}>
                <IcCheckCircle width={14} height={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '.88rem' }}>
                  {patient.first_name} {patient.last_name} · {patient.id}
                </span>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setPatient(null)}>Change</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <IcSearch width={14} height={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 32 }}
                    placeholder="Search patient by name, phone, or ID…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {patients.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                    {patients.map(p => (
                      <button
                        key={p.id} type="button"
                        style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.84rem', borderBottom: '1px solid var(--border)' }}
                        onClick={() => { setPatient(p); setSearch(''); setPatients([]); }}
                      >
                        <span style={{ fontWeight: 700 }}>{p.first_name} {p.last_name}</span>
                        <span style={{ fontSize: '.74rem', color: 'var(--text-400)', marginLeft: 8 }}>{p.id} · {p.insurance || 'No Insurance'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Line items */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Line Items <span className="required">*</span></label>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setItems(prev => [...prev, emptyItem()])}>
                <IcPlus width={12} height={12} /> Add Item
              </button>
            </div>

            {/* header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 6, padding: '0 4px' }}>
              {['Description','Category','Qty','Unit Price (₦)',''].map((h, i) => (
                <div key={i} style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input
                  className="input"
                  placeholder="e.g. Consultation fee"
                  value={item.description}
                  onChange={e => updateItem(item.id, 'description', e.target.value)}
                />
                <select className="select" value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)}>
                  {ITEM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input
                  className="input" type="number" min="1"
                  value={item.quantity}
                  onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                />
                <input
                  className="input" type="number" min="0" placeholder="0.00"
                  value={item.unitPrice}
                  onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                />
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                  disabled={items.length === 1}
                >
                  <IcTrash width={13} height={13} />
                </button>
              </div>
            ))}

            <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)' }}>
              Total: {fmt(total)}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. NHIS claim, discount applied…" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><div className="btn-spinner" /> Creating…</> : <><IcFileMedical width={14} height={14} /> Create Invoice</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INVOICE DETAIL MODAL
═══════════════════════════════════════════════════════════════ */
function InvoiceDetailModal({ invoiceId, onClose, onUpdated }) {
  const toast = useToast();
  const [invoice,  setInvoice]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);
  const [payAmt,   setPayAmt]   = useState('');
  const [payMethod,setPayMethod]= useState('cash');
  const [payRef,   setPayRef]   = useState('');
  const [payLoading,setPayLoading]=useState(false);

  useEffect(() => {
    api.get(`/api/v1/billing/invoices/${invoiceId}`)
      .then(d => setInvoice(d.invoice))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const recordPayment = async () => {
    if (!payAmt || Number(payAmt) <= 0) return toast.warning('Enter a valid amount');
    setPayLoading(true);
    try {
      const { invoice: updated } = await api.post(`/api/v1/billing/invoices/${invoiceId}/pay`, {
        amount: Number(payAmt), method: payMethod, reference: payRef || undefined,
      });
      setInvoice(updated);
      setPaying(false); setPayAmt(''); setPayRef('');
      toast.success('Payment recorded successfully');
      onUpdated?.(updated);
    } catch (err) {
      toast.error(err.message ?? 'Failed to record payment');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580, width: '100%' }}>
        <div className="modal-header">
          <div className="modal-title">Invoice {invoiceId}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading && <div style={{ textAlign: 'center', padding: '32px 0' }}><div className="spinner" /></div>}

          {!loading && invoice && (
            <>
              {/* Status + Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-900)', marginBottom: 4 }}>
                    {invoice.patient_name}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-400)' }}>
                    Issued: {fmtDate(invoice.issued_at)}
                    {invoice.paid_at && ` · Paid: ${fmtDate(invoice.paid_at)}`}
                  </div>
                </div>
                <Badge variant={STATUS_BADGE[invoice.status]?.variant ?? 'neutral'}>
                  {STATUS_BADGE[invoice.status]?.label ?? invoice.status}
                </Badge>
              </div>

              {/* Amounts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  ['Total',       fmt(invoice.total),   'var(--text-900)'],
                  ['Paid',        fmt(invoice.paid),    'var(--success)'],
                  ['Outstanding', fmt(invoice.balance), invoice.balance > 0 ? 'var(--danger)' : 'var(--success)'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '.7rem', color: 'var(--text-400)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 800, fontSize: '.95rem', color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Line items */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '.82rem', color: 'var(--text-700)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>Line Items</div>
                {(invoice.items ?? []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '.84rem' }}>
                    <span style={{ color: 'var(--text-700)' }}>{item.description} {item.quantity > 1 && `×${item.quantity}`}</span>
                    <span style={{ fontWeight: 700 }}>{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Payment history */}
              {(invoice.payments ?? []).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: '.82rem', color: 'var(--text-700)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>Payments</div>
                  {invoice.payments.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '.84rem', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-500)' }}>{fmtDate(p.paid_at)} · {p.method?.toUpperCase()}{p.reference ? ` · ${p.reference}` : ''}</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Record payment */}
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <>
                  {!paying ? (
                    <button className="btn btn-primary btn-sm" onClick={() => { setPaying(true); setPayAmt(String(invoice.balance)); }}>
                      <IcCheckCircle width={13} height={13} /> Record Payment
                    </button>
                  ) : (
                    <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 'var(--radius-lg)', marginTop: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '.84rem', marginBottom: 10 }}>Record Payment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div className="form-group">
                          <label className="form-label">Amount (₦)</label>
                          <input className="input" type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} min="1" max={invoice.balance} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Method</label>
                          <select className="select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Reference</label>
                          <input className="input" placeholder="Bank ref, POS #…" value={payRef} onChange={e => setPayRef(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={recordPayment} disabled={payLoading}>
                          {payLoading ? <><div className="btn-spinner" /> Saving…</> : 'Confirm Payment'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setPaying(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {invoice.notes && (
                <Alert type="info" style={{ marginTop: 14, fontSize: '.82rem' }}>
                  <strong>Notes:</strong> {invoice.notes}
                </Alert>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BILLING PAGE — MAIN
═══════════════════════════════════════════════════════════════ */
export default function BillingPage() {
  const toast      = useToast();
  const { user }   = useAuth();
  const canCreate  = ['admin','nurse'].includes(user?.role);

  const [invoices,    setInvoices]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter,setStatusFilter]= useState('');
  const [search,      setSearch]      = useState('');
  const [summary,     setSummary]     = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [detailId,    setDetailId]    = useState(null);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter) params.set('status', statusFilter);
      const { invoices: rows, total: t } = await api.get(`/api/v1/billing/invoices?${params}`);
      setInvoices(rows ?? []);
      setTotal(t ?? 0);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/api/v1/billing/summary')
        .then(d => setSummary(d.summary))
        .catch(() => {});
    }
  }, [user?.role]);

  const handleCreated = (invoice) => {
    setShowCreate(false);
    setInvoices(prev => [{ ...invoice, patient_name: invoice.patient_name ?? '—' }, ...prev]);
  };

  const handleUpdated = (updated) => {
    setInvoices(prev => prev.map(inv => inv.id === updated.id ? { ...inv, ...updated } : inv));
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="page anim-fade-up" data-tour="billing-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Billing <span>&amp; Payments</span></div>
          <div className="page-subtitle">Manage invoices, record payments, and track revenue</div>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <IcPlus width={14} height={14} /> New Invoice
          </button>
        )}
      </div>

      {/* Revenue summary strip (admin only) */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Revenue',   value: fmt(summary.revenue),     color: 'var(--text-900)'  },
            { label: 'Collected',       value: fmt(summary.collected),   color: 'var(--success)'   },
            { label: 'Outstanding',     value: fmt(summary.outstanding), color: 'var(--danger)'    },
            { label: 'Invoices',        value: summary.invoice_count,    color: 'var(--primary)'   },
            { label: 'Paid',            value: summary.paid_count,       color: 'var(--success)'   },
            { label: 'Unpaid',          value: summary.unpaid_count,     color: 'var(--danger)'    },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <IcSearch width={14} height={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search invoices…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => load()}>
          <IcRefresh width={13} height={13} /> Refresh
        </button>
      </div>

      {/* Invoice table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}><div className="spinner" /></div>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-400)' }}>
            <IcFileMedical width={32} height={32} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--border-dark)' }} />
            <div style={{ fontWeight: 700, marginBottom: 6 }}>No invoices found</div>
            {canCreate && <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><IcPlus width={13} height={13} /> Create First Invoice</button>}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices
                .filter(inv => !search || `${inv.patient_name} ${inv.id}`.toLowerCase().includes(search.toLowerCase()))
                .map(inv => {
                  const sb = STATUS_BADGE[inv.status] ?? { variant: 'neutral', label: inv.status };
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.82rem', fontWeight: 700 }}>{inv.id}</td>
                      <td style={{ fontWeight: 600 }}>{inv.patient_name}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(inv.paid)}</td>
                      <td style={{ color: inv.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{fmt(inv.balance)}</td>
                      <td><Badge variant={sb.variant}>{sb.label}</Badge></td>
                      <td style={{ fontSize: '.8rem', color: 'var(--text-400)' }}>{fmtDate(inv.issued_at)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetailId(inv.id)}>
                          View <IcArrowRight width={12} height={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '6px 14px', fontSize: '.84rem', color: 'var(--text-500)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {detailId   && <InvoiceDetailModal invoiceId={detailId} onClose={() => setDetailId(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
