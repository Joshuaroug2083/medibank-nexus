/**
 * Drug Formulary Management Page — Admin only
 * Lists hospital drug catalog with stock levels, pricing, reorder alerts.
 * CRUD: add drug, edit stock/price, deactivate.
 */
import { useState, useEffect, useCallback } from 'react';
import { api }       from '../lib/api';
import Badge         from '../components/Badge';
import Alert         from '../components/Alert';
import EmptyState    from '../components/EmptyState';
import {
  IcPill, IcPlus, IcSearch, IcRefresh, IcX,
  IcWarning, IcCheckCircle, IcBox,
} from '../components/Icons';

const CATEGORIES = [
  'Analgesics', 'Antibiotics', 'Antihypertensives', 'Antidiabetics',
  'Antimalarials', 'Antiretrovirals', 'Cardiovascular', 'Dermatology',
  'Endocrinology', 'Gastroenterology', 'Haematology', 'Neurology',
  'Ophthalmology', 'Paediatrics', 'Respiratory', 'Vitamins & Supplements',
  'Vaccines', 'IV Fluids', 'Surgical', 'Other',
];

const MOCK_DRUGS = [
  { id: 1, name: 'Paracetamol 500mg',      generic: 'Paracetamol',       category: 'Analgesics',          stock: 1200, reorder_level: 200, unit_price: 50,   unit: 'tablet',  status: 'active' },
  { id: 2, name: 'Amoxicillin 500mg',      generic: 'Amoxicillin',       category: 'Antibiotics',         stock: 340,  reorder_level: 100, unit_price: 120,  unit: 'capsule', status: 'active' },
  { id: 3, name: 'Lisinopril 10mg',        generic: 'Lisinopril',        category: 'Antihypertensives',   stock: 85,   reorder_level: 100, unit_price: 200,  unit: 'tablet',  status: 'active' },
  { id: 4, name: 'Metformin 500mg',        generic: 'Metformin',         category: 'Antidiabetics',       stock: 420,  reorder_level: 100, unit_price: 90,   unit: 'tablet',  status: 'active' },
  { id: 5, name: 'Artemether/Lumefantrine',generic: 'Artemether+Lumef.', category: 'Antimalarials',       stock: 60,   reorder_level: 150, unit_price: 850,  unit: 'pack',    status: 'active' },
  { id: 6, name: 'Amlodipine 5mg',         generic: 'Amlodipine',        category: 'Antihypertensives',   stock: 290,  reorder_level: 80,  unit_price: 180,  unit: 'tablet',  status: 'active' },
  { id: 7, name: 'ORS Sachet',             generic: 'ORS',               category: 'Gastroenterology',    stock: 0,    reorder_level: 100, unit_price: 120,  unit: 'sachet',  status: 'active' },
  { id: 8, name: 'Metronidazole 400mg',    generic: 'Metronidazole',     category: 'Antibiotics',         stock: 510,  reorder_level: 100, unit_price: 80,   unit: 'tablet',  status: 'active' },
];

const fmt = n => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

function stockStatus(stock, reorder) {
  if (stock === 0)          return { variant: 'danger',  label: 'Out of stock' };
  if (stock <= reorder)     return { variant: 'warning', label: 'Low stock'    };
  return                           { variant: 'success', label: 'In stock'     };
}

/* ── Add/Edit Modal ── */
function DrugModal({ drug, onClose, onSaved }) {
  const isEdit = !!drug?.id;
  const [form, setForm] = useState({
    name:          drug?.name          ?? '',
    generic:       drug?.generic       ?? '',
    category:      drug?.category      ?? CATEGORIES[0],
    stock:         drug?.stock         ?? 0,
    reorder_level: drug?.reorder_level ?? 100,
    unit_price:    drug?.unit_price    ?? 0,
    unit:          drug?.unit          ?? 'tablet',
    status:        drug?.status        ?? 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Drug name is required');
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/api/v1/formulary/${drug.id}`, form);
      } else {
        await api.post('/api/v1/formulary', form);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.data?.error ?? 'Failed to save drug');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title"><IcPill width={15} height={15} /> {isEdit ? 'Edit Drug' : 'Add Drug to Formulary'}</h3>
          <button className="icon-btn" onClick={onClose}><IcX width={16} height={16} /></button>
        </div>
        <div className="modal-body">
          {error && <Alert variant="danger" style={{ marginBottom: 12 }}>{error}</Alert>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Drug Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Amoxicillin 500mg" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input className="input" value={form.generic} onChange={e => set('generic', e.target.value)} placeholder="Generic / INN name" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                {['tablet','capsule','vial','ampoule','sachet','bottle','pack','tube','inhaler','patch','syrup (ml)','injection (ml)'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (₦)</label>
              <input className="input" type="number" min="0" value={form.unit_price} onChange={e => set('unit_price', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Stock</label>
              <input className="input" type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input className="input" type="number" min="0" value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} />
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Drug'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function FormularyPage() {
  const [drugs,    setDrugs]    = useState(MOCK_DRUGS);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [modal,    setModal]    = useState(null); // null | 'add' | drug object
  const [apiOk,    setApiOk]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (search)   params.set('q', search);
      if (category) params.set('category', category);
      const r = await api.get(`/api/v1/formulary?${params}`);
      if (r.drugs?.length >= 0) { setDrugs(r.drugs); setApiOk(true); }
    } catch {
      // keep mock data
    } finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { load(); }, [load]);

  const filtered = drugs.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || d.name.toLowerCase().includes(q) || (d.generic ?? '').toLowerCase().includes(q);
    const matchC = !category || d.category === category;
    return matchQ && matchC;
  });

  const lowStock  = filtered.filter(d => d.stock > 0 && d.stock <= d.reorder_level).length;
  const outStock  = filtered.filter(d => d.stock === 0).length;
  const totalItems = filtered.length;

  return (
    <div className="anim-fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Drug <span>Formulary</span></div>
          <div className="page-subtitle">Hospital medication catalog, stock levels & pricing</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <IcPlus width={14} height={14} /> Add Drug
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Drugs',    value: totalItems, color: 'var(--primary)', icon: <IcPill width={16} height={16} />      },
          { label: 'Low Stock',      value: lowStock,   color: 'var(--warning)', icon: <IcWarning width={16} height={16} />   },
          { label: 'Out of Stock',   value: outStock,   color: 'var(--danger)',  icon: <IcBox width={16} height={16} />       },
          { label: 'Fully Stocked',  value: totalItems - lowStock - outStock, color: 'var(--success)', icon: <IcCheckCircle width={16} height={16} /> },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-400)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <IcSearch width={14} height={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Search by name or generic…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 180 }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-outline" onClick={load}><IcRefresh width={14} height={14} /></button>
      </div>

      {!apiOk && (
        <Alert variant="warning" style={{ marginBottom: 14 }}>
          Showing demo data. Connect the formulary API endpoint to manage your real drug catalog.
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-400)' }}>Loading formulary…</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No drugs found" icon={<IcPill width={26} height={26} />}
          action={<button className="btn btn-primary" onClick={() => setModal('add')}><IcPlus width={13} height={13} /> Add Drug</button>} />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Drug Name</th>
                <th>Generic</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const ss = stockStatus(d.stock, d.reorder_level);
                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)' }}>{d.name}</div>
                    </td>
                    <td style={{ fontSize: '.8rem', color: 'var(--text-500)' }}>{d.generic || '—'}</td>
                    <td><span style={{ fontSize: '.76rem', color: 'var(--text-600)' }}>{d.category}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{d.stock.toLocaleString()}</span>
                        <span style={{ fontSize: '.72rem', color: 'var(--text-400)' }}>{d.unit}s</span>
                        <Badge variant={ss.variant} style={{ fontSize: '.65rem' }}>{ss.label}</Badge>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '.84rem', fontWeight: 600 }}>{fmt(d.unit_price)}</td>
                    <td><Badge variant={d.status === 'active' ? 'success' : 'neutral'}>{d.status}</Badge></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setModal(d)}>Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(modal === 'add' || (modal && typeof modal === 'object')) && (
        <DrugModal
          drug={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
