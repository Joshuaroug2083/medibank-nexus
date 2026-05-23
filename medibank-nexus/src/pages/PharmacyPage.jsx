/**
 * Step 9 — Pharmacy Rx Queue
 * Live Rx queue · Dispense flow · Drug inventory · Stock alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast }  from '../components/Toast';
import { api }       from '../lib/api';
import { useAppCtx } from '../context/AppContext';
import Badge         from '../components/Badge';
import Alert         from '../components/Alert';
import ProgressBar   from '../components/ProgressBar';
import EmptyState    from '../components/EmptyState';
import {
  IcPill, IcCheckCircle, IcWarning, IcClock,
  IcPerson, IcFilter, IcBox, IcRefresh,
  IcChevronDown, IcChevronRight,
} from '../components/Icons';

/* ── Mock data ──────────────────────────────────────────── */
const INITIAL_QUEUE = [
  {
    id: 'RX-2026-0041', patientId: 'PT-2026-0012', patientName: 'Chidi Obi', age: 34,
    doctor: 'Dr. Emeka Nwosu', time: '09:14', status: 'pending', urgent: true,
    drugs: [
      { name: 'Amlodipine 5mg',     dose: '5mg',    freq: 'Once daily',      dur: '30 days',  qty: 30, available: 87  },
      { name: 'Lisinopril 10mg',    dose: '10mg',   freq: 'Once daily',      dur: '30 days',  qty: 30, available: 52  },
    ],
    notes: 'Hypertension follow-up. Patient allergic to Penicillin.',
  },
  {
    id: 'RX-2026-0042', patientId: 'PT-2026-0031', patientName: 'Amara Eze', age: 28,
    doctor: 'Dr. Emeka Nwosu', time: '09:42', status: 'pending', urgent: false,
    drugs: [
      { name: 'Azithromycin 250mg', dose: '250mg',  freq: 'Once daily',      dur: '5 days',   qty: 5,  available: 18  },
      { name: 'Paracetamol 1000mg', dose: '1000mg', freq: 'Twice daily (bd)', dur: '5 days',  qty: 10, available: 240 },
      { name: 'Vitamin C 500mg',    dose: '500mg',  freq: 'Once daily',      dur: '7 days',   qty: 7,  available: 180 },
    ],
    notes: 'Respiratory tract infection.',
  },
  {
    id: 'RX-2026-0043', patientId: 'PT-2026-0047', patientName: 'Taiwo Adeyemi', age: 52,
    doctor: 'Dr. Emeka Nwosu', time: '10:05', status: 'dispensed', urgent: false,
    drugs: [
      { name: 'Metformin 500mg',    dose: '500mg',  freq: 'Twice daily (bd)', dur: '30 days', qty: 60, available: 145 },
      { name: 'Omeprazole 20mg',    dose: '20mg',   freq: 'Once daily',      dur: '14 days',  qty: 14, available: 62  },
    ],
    notes: 'Diabetes follow-up. On Metformin long-term.',
  },
  {
    id: 'RX-2026-0044', patientId: 'PT-2026-0058', patientName: 'Ngozi Okafor', age: 22,
    doctor: 'Dr. Adaeze Ibe', time: '10:31', status: 'pending', urgent: false,
    drugs: [
      { name: 'Artemether/Lumefantrine', dose: '80/480mg', freq: 'Twice daily (bd)', dur: '3 days', qty: 6, available: 44 },
      { name: 'Paracetamol 1000mg', dose: '1000mg', freq: 'Three times daily (tds)', dur: '3 days', qty: 9, available: 240 },
    ],
    notes: 'Uncomplicated malaria.',
  },
  {
    id: 'RX-2026-0045', patientId: 'PT-2026-0063', patientName: 'Emeka Dike', age: 45,
    doctor: 'Dr. Chukwudi Obi', time: '10:58', status: 'pending', urgent: true,
    drugs: [
      { name: 'Ciprofloxacin 500mg', dose: '500mg', freq: 'Twice daily (bd)', dur: '7 days', qty: 14, available: 11 },
      { name: 'Metronidazole 400mg', dose: '400mg', freq: 'Three times daily (tds)', dur: '7 days', qty: 21, available: 8 },
    ],
    notes: 'Acute gastrointestinal infection. Urgent.',
  },
];

const INVENTORY = [
  { name: 'Amoxicillin 500mg',          qty: 23,  reorder: 50,  unit: 'capsules' },
  { name: 'Artemether/Lumefantrine',     qty: 44,  reorder: 40,  unit: 'packs'    },
  { name: 'Azithromycin 250mg',          qty: 18,  reorder: 30,  unit: 'tablets'  },
  { name: 'Ciprofloxacin 500mg',         qty: 11,  reorder: 30,  unit: 'tablets'  },
  { name: 'Lisinopril 10mg',             qty: 52,  reorder: 60,  unit: 'tablets'  },
  { name: 'Metformin 500mg',             qty: 145, reorder: 100, unit: 'tablets'  },
  { name: 'Metronidazole 400mg',         qty: 8,   reorder: 40,  unit: 'tablets'  },
  { name: 'Omeprazole 20mg',             qty: 62,  reorder: 50,  unit: 'capsules' },
  { name: 'Paracetamol 1000mg',          qty: 240, reorder: 100, unit: 'tablets'  },
  { name: 'Vitamin C 500mg',             qty: 180, reorder: 100, unit: 'tablets'  },
  { name: 'Amlodipine 5mg',              qty: 87,  reorder: 60,  unit: 'tablets'  },
  { name: 'Doxycycline 100mg',           qty: 34,  reorder: 40,  unit: 'capsules' },
];

/* ── helpers ─────────────────────────────────────────────── */
const stockStatus  = (qty, reorder) => {
  if (qty <= 0)              return 'out';
  if (qty < reorder * 0.3)   return 'critical';
  if (qty < reorder * 0.6)   return 'low';
  return 'ok';
};
const stockColor = { ok: 'var(--success)', low: 'var(--warning)', critical: 'var(--danger)', out: 'var(--danger)' };
const stockLabel = { ok: 'In Stock', low: 'Low Stock', critical: 'Critical', out: 'Out of Stock' };

/* ── sub-components ──────────────────────────────────────── */
function StockBar({ qty, reorder }) {
  const pct    = Math.min((qty / (reorder * 2)) * 100, 100);
  const status = stockStatus(qty, reorder);
  return (
    <div>
      <ProgressBar
        value={pct}
        max={100}
        color={stockColor[status]}
        height={5}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '.7rem' }}>
        <span style={{ color: stockColor[status], fontWeight: 700 }}>{stockLabel[status]}</span>
        <span style={{ color: 'var(--text-400)', fontFamily: 'var(--font-mono)' }}>{qty} units</span>
      </div>
    </div>
  );
}

function RxCard({ rx, onDispense, onExpand, expanded }) {
  const allInStock = rx.drugs.every(d => d.available >= d.qty);
  const hasCritical = rx.drugs.some(d => stockStatus(d.available, 30) === 'critical' || stockStatus(d.available, 30) === 'out');

  return (
    <div className={`rx-card${rx.urgent ? ' rx-urgent' : ''}${rx.status === 'dispensed' ? ' rx-dispensed' : ''}`}>
      {/* Header row */}
      <div
        className="rx-card-header"
        onClick={() => onExpand(rx.id)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {/* Status dot */}
          <div className={`rx-status-dot ${rx.status}`} />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '.88rem', fontFamily: 'var(--font-mono)', color: 'var(--text-900)' }}>
                {rx.id}
              </span>
              {rx.urgent && <Badge variant="danger">URGENT</Badge>}
              {rx.status === 'dispensed' && <Badge variant="success">Dispensed</Badge>}
            </div>
            <div style={{ fontSize: '.76rem', color: 'var(--text-500)', marginTop: 3 }}>
              <IcPerson width={11} height={11} style={{ marginRight: 4, color: 'var(--primary)' }} />
              {rx.patientName} · {rx.age}y · {rx.patientId}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--text-400)' }}>{rx.doctor}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text-400)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <IcClock width={10} height={10} /> {rx.time}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-400)' }}>
            {expanded
              ? <IcChevronDown  width={14} height={14} />
              : <IcChevronRight width={14} height={14} />
            }
          </div>
        </div>
      </div>

      {/* Drug count summary when collapsed */}
      {!expanded && (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {rx.drugs.map((d, i) => (
            <span key={i} style={{
              fontSize: '.72rem', padding: '2px 8px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)', color: 'var(--text-500)',
            }}>
              <IcPill width={9} height={9} style={{ marginRight: 4 }} />{d.name}
            </span>
          ))}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="rx-card-body">
          {rx.notes && (
            <div style={{ fontSize: '.78rem', color: 'var(--text-500)', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', marginBottom: 12, borderLeft: '3px solid var(--primary)' }}>
              <strong>Note:</strong> {rx.notes}
            </div>
          )}

          {hasCritical && (
            <Alert type="warning" style={{ marginBottom: 10, fontSize: '.78rem' }}>
              One or more drugs are critically low. Confirm availability before dispensing.
            </Alert>
          )}

          {/* Drug list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rx.drugs.map((d, i) => {
              const status = stockStatus(d.available, 30);
              const canFill = d.available >= d.qty;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 12, padding: '11px 13px',
                  background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${!canFill ? 'var(--danger)' : 'var(--border)'}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)' }}>{d.name}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--text-500)', marginTop: 3 }}>
                      {d.dose} · {d.freq} · {d.dur}
                    </div>
                    <div style={{ fontSize: '.74rem', marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        Qty: {d.qty}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-400)', marginBottom: 5 }}>Stock level</div>
                    <StockBar qty={d.available} reorder={30} />
                    {!canFill && (
                      <div style={{ fontSize: '.7rem', color: 'var(--danger)', fontWeight: 700, marginTop: 4 }}>
                        Insufficient: need {d.qty}, have {d.available}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {rx.status === 'pending' && !allInStock && (
              <Alert type="warning" style={{ flex: 1, fontSize: '.76rem' }}>
                Some drugs have insufficient stock. Dispense partial or contact supplier.
              </Alert>
            )}
            {/* Print slip — always available */}
            <button
              className="btn btn-outline btn-sm no-print"
              onClick={() => {
                const w = window.open('', '_blank', 'width=700,height=900');
                const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                w.document.write(`<!DOCTYPE html><html><head><title>Prescription ${rx.id}</title>
                  <style>body{font-family:Arial,sans-serif;padding:20mm;color:#000}
                  h2{margin:0;font-size:18pt}p{margin:4pt 0}
                  table{width:100%;border-collapse:collapse;margin-top:12pt}
                  th,td{border:1px solid #ccc;padding:6pt 8pt;font-size:10pt}
                  th{background:#f0f0f0;font-weight:bold}
                  .footer{margin-top:20pt;border-top:1px solid #ccc;padding-top:8pt;font-size:9pt;color:#555}
                  .sig{margin-top:30pt;border-top:1px solid #000;display:inline-block;width:160pt;font-size:9pt}
                  </style></head><body>
                  <h2>MediBank Nexus</h2><p>Prescription Receipt</p>
                  <hr/>
                  <p><strong>Rx ID:</strong> ${rx.id} &nbsp;|&nbsp; <strong>Date:</strong> ${today}</p>
                  <p><strong>Patient:</strong> ${rx.patientName} &nbsp;|&nbsp; <strong>Doctor:</strong> ${rx.doctor}</p>
                  <table>
                    <tr><th>Drug</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Qty</th></tr>
                    ${rx.drugs.map(d => `<tr><td>${d.name}</td><td>${d.dose}</td><td>${d.freq}</td><td>${d.dur}</td><td>${d.qty}</td></tr>`).join('')}
                  </table>
                  ${rx.notes ? `<p style="margin-top:10pt"><strong>Notes:</strong> ${rx.notes}</p>` : ''}
                  <div class="footer">
                    <span class="sig">Pharmacist Signature</span>
                    <br/><br/><em>This prescription is valid for 30 days from date of issue.</em>
                  </div>
                  </body></html>`);
                w.document.close();
                w.focus();
                w.print();
              }}
            >
              🖨 Print Slip
            </button>
            {rx.status === 'pending' && (
              <button
                className="btn btn-success"
                onClick={() => onDispense(rx.id)}
                style={{ flexShrink: 0 }}
              >
                <IcCheckCircle width={14} height={14} />
                Confirm &amp; Dispense
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Normalise API Rx → component shape ─────────────────── */
function normaliseRx(rx) {
  return {
    id:          rx.id,
    patientId:   rx.patient_id,
    patientName: rx.patient_name ?? '—',
    age:         '—',
    doctor:      rx.doctor_name ?? '—',
    time:        rx.created_at ? new Date(rx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
    status:      rx.status,
    urgent:      false,
    notes:       rx.notes ?? '',
    drugs: (rx.items ?? []).map(i => ({
      name:      i.drug,
      dose:      i.dose,
      freq:      i.frequency,
      dur:       i.duration,
      qty:       1,
      available: 99,
    })),
  };
}

/* ── main component ──────────────────────────────────────── */
export default function PharmacyPage() {
  const toast         = useToast();
  const { navigate }  = useAppCtx();
  const [queue,  setQueue]    = useState(INITIAL_QUEUE);
  const [filter, setFilter]   = useState('all');       // all | pending | dispensed
  const [expanded, setExpanded] = useState(new Set(['RX-2026-0041']));
  const [view,   setView]     = useState('queue');     // queue | inventory
  const [apiLoaded, setApiLoaded] = useState(false);

  /* Load real Rx queue */
  const loadQueue = useCallback(async () => {
    try {
      const { queue: rxList } = await api.get('/api/v1/pharmacy/queue?status=pending');
      if (rxList?.length) {
        setQueue(rxList.map(normaliseRx));
        if (rxList.length) setExpanded(new Set([rxList[0].id]));
        setApiLoaded(true);
      }
    } catch { /* keep mock data */ }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const dispense = async (id) => {
    const rx = queue.find(r => r.id === id);
    try {
      await api.put(`/api/v1/pharmacy/dispense/${id}`);
    } catch (err) {
      /* If API fails (e.g. mock data), still update UI */
      if (err.status !== 404) {
        toast.error(err.message ?? 'Dispense failed');
        return;
      }
    }
    setQueue(prev => prev.map(r => r.id === id ? { ...r, status: 'dispensed' } : r));
    toast.success(`${rx?.id} dispensed to ${rx?.patientName}.`, 'Dispensed');
  };

  /* filter counts */
  const counts = {
    all:       queue.length,
    pending:   queue.filter(r => r.status === 'pending').length,
    dispensed: queue.filter(r => r.status === 'dispensed').length,
  };

  const filtered = queue.filter(rx =>
    filter === 'all' ? true : rx.status === filter
  );

  const lowStockItems = INVENTORY.filter(d => stockStatus(d.qty, d.reorder) !== 'ok');

  return (
    <div className="pharmacy-root anim-fade-up">

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">Pharmacy <span>Rx Queue</span></div>
          <div className="page-subtitle">Manage prescriptions and drug dispensing</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {lowStockItems.length > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setView('inventory')}
              style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
            >
              <IcWarning width={13} height={13} />
              {lowStockItems.length} Low Stock
            </button>
          )}
          <button
            className={`btn btn-sm ${view === 'queue' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('queue')}
          >
            <IcPill width={13} height={13} /> Queue
          </button>
          <button
            className={`btn btn-sm ${view === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('inventory')}
          >
            <IcBox width={13} height={13} /> Inventory
          </button>
        </div>
      </div>

      {view === 'queue' && (
        <>
          {/* Filter tabs */}
          <div className="pharmacy-filters">
            {[
              { key: 'all',       label: 'All',       count: counts.all       },
              { key: 'pending',   label: 'Pending',   count: counts.pending   },
              { key: 'dispensed', label: 'Dispensed', count: counts.dispensed },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-chip${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                <span className="filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Queue */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<IcPill width={26} height={26} />}
              title="No prescriptions"
              description={filter === 'pending' ? 'All prescriptions have been dispensed.' : 'No prescriptions in this category.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(rx => (
                <RxCard
                  key={rx.id}
                  rx={rx}
                  expanded={expanded.has(rx.id)}
                  onExpand={toggleExpand}
                  onDispense={dispense}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'inventory' && (
        <div>
          {lowStockItems.length > 0 && (
            <Alert type="warning" style={{ marginBottom: 16 }}>
              <IcWarning width={15} height={15} />
              <strong>{lowStockItems.length} items</strong> are below reorder threshold. Contact supplier immediately.
            </Alert>
          )}

          <div className="inventory-grid">
            {INVENTORY.map((drug, i) => {
              const status = stockStatus(drug.qty, drug.reorder);
              const pct    = Math.min((drug.qty / (drug.reorder * 2)) * 100, 100);
              return (
                <div key={i} className={`inventory-card${status !== 'ok' ? ' inv-alert' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.86rem', color: 'var(--text-900)' }}>{drug.name}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text-400)', marginTop: 2 }}>{drug.unit}</div>
                    </div>
                    <Badge
                      variant={status === 'ok' ? 'success' : status === 'low' ? 'warning' : 'danger'}
                    >
                      {stockLabel[status]}
                    </Badge>
                  </div>

                  <ProgressBar
                    value={pct}
                    max={100}
                    color={stockColor[status]}
                    height={6}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: '.74rem' }}>
                    <span style={{ color: 'var(--text-500)' }}>
                      Reorder at <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{drug.reorder}</span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: stockColor[status] }}>
                      {drug.qty} left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
