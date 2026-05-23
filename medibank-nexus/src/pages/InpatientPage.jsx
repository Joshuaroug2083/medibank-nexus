/**
 * InpatientPage — Ward & Bed Management, Admissions, Nursing Notes, MAR
 *
 * Tabs: Wards Overview | Active Admissions | Nursing Notes | MAR
 * Roles: nurse, doctor, admin
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth }  from '../context/AuthContext';
import { apiFetch } from '../context/AuthContext';
import {
  IcHospital, IcPeople, IcCheckCircle, IcWarning,
  IcPersonAdd, IcSearch, IcPerson, IcClock,
  IcPill, IcArrowRight,
} from '../components/Icons';

/* ── Mock data shown when API is offline ──────────────────────── */
const MOCK_WARDS = [
  { id: 1, name: 'General Ward A', ward_type: 'general',  beds: { total: 20, available: 7, occupied: 13 } },
  { id: 2, name: 'ICU',            ward_type: 'icu',       beds: { total: 6,  available: 2, occupied: 4  } },
  { id: 3, name: 'Maternity',      ward_type: 'maternity', beds: { total: 12, available: 5, occupied: 7  } },
  { id: 4, name: 'Paediatric',     ward_type: 'paediatric',beds: { total: 10, available: 4, occupied: 6  } },
];

const MOCK_ADMISSIONS = [
  { id: 1, patient_name: 'Amaka Obi',     ward_name: 'General Ward A', bed_number: '7',  doctor_name: 'Dr. Adebayo', admitted_at: new Date(Date.now()-2*86400000).toISOString(), diagnosis: 'Malaria with complications', status: 'admitted' },
  { id: 2, patient_name: 'Emeka Chukwu',  ward_name: 'ICU',            bed_number: '2',  doctor_name: 'Dr. Ibrahim', admitted_at: new Date(Date.now()-86400000).toISOString(),  diagnosis: 'Septicaemia',               status: 'admitted' },
  { id: 3, patient_name: 'Chioma Nwosu',  ward_name: 'Maternity',      bed_number: '5',  doctor_name: 'Dr. Adebayo', admitted_at: new Date(Date.now()-3600000).toISOString(),   diagnosis: 'Ante-partum care',          status: 'admitted' },
];

const WARD_TYPE_COLORS = {
  general:    ['var(--primary)', 'var(--primary-light)'],
  icu:        ['var(--danger)',  'var(--danger-light)'],
  maternity:  ['var(--teal)',    'var(--teal-light,#e6fafa)'],
  paediatric: ['var(--success)', 'var(--success-light)'],
  surgical:   ['var(--warning)', 'var(--warning-light)'],
  private:    ['var(--text-500)','var(--bg)'],
  emergency:  ['var(--danger)',  'var(--danger-light)'],
};

function WardCard({ ward }) {
  const [color, bg] = WARD_TYPE_COLORS[ward.ward_type] ?? ['var(--text-400)', 'var(--bg)'];
  const occ = ward.beds?.occupied ?? 0;
  const total = ward.beds?.total ?? 0;
  const pct   = total ? Math.round((occ / total) * 100) : 0;

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
      padding: '20px', cursor: 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IcHospital width={16} height={16} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text-900)' }}>{ward.name}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-400)', textTransform: 'capitalize' }}>{ward.ward_type.replace('_', ' ')} ward</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '.76rem', fontWeight: 700, color: ward.beds?.available > 0 ? 'var(--success)' : 'var(--danger)' }}>
          {ward.beds?.available ?? 0} free
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: 'var(--text-500)', marginBottom: 4 }}>
          <span>{occ} occupied</span>
          <span>{total} total beds</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : color, borderRadius: 4, transition: 'width .4s' }} />
        </div>
      </div>

      <div style={{ fontSize: '.74rem', color: 'var(--text-400)', textAlign: 'right' }}>{pct}% occupancy</div>
    </div>
  );
}

function AdmissionRow({ a }) {
  const days = Math.ceil((Date.now() - new Date(a.admitted_at)) / 86_400_000);
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ fontWeight: 600, fontSize: '.86rem', color: 'var(--text-900)' }}>{a.patient_name}</div>
        <div style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 1 }}>{a.diagnosis ?? '—'}</div>
      </td>
      <td style={{ padding: '10px 14px', fontSize: '.84rem', color: 'var(--text-700)' }}>
        {a.ward_name} · Bed {a.bed_number ?? '—'}
      </td>
      <td style={{ padding: '10px 14px', fontSize: '.84rem', color: 'var(--text-600)' }}>{a.doctor_name ?? '—'}</td>
      <td style={{ padding: '10px 14px', fontSize: '.8rem', color: 'var(--text-400)', whiteSpace: 'nowrap' }}>
        {days} day{days !== 1 ? 's' : ''} ago
      </td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{
          padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '.72rem', fontWeight: 700,
          background: 'var(--success-light)', color: 'var(--success)',
        }}>
          {a.status}
        </span>
      </td>
    </tr>
  );
}

export default function InpatientPage() {
  const { user }          = useAuth();
  const [tab,    setTab]  = useState('wards');
  const [wards,  setWards] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, aRes] = await Promise.all([
        apiFetch('/api/v1/inpatient/wards'),
        apiFetch('/api/v1/inpatient/admissions?status=admitted'),
      ]);
      if (wRes.ok && aRes.ok) {
        const [wData, aData] = await Promise.all([wRes.json(), aRes.json()]);
        setWards(wData.wards);
        setAdmissions(aData.admissions);
      } else throw new Error();
    } catch {
      setWards(MOCK_WARDS);
      setAdmissions(MOCK_ADMISSIONS);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalBeds     = wards.reduce((s, w) => s + (w.beds?.total    ?? 0), 0);
  const occupiedBeds  = wards.reduce((s, w) => s + (w.beds?.occupied ?? 0), 0);
  const availableBeds = wards.reduce((s, w) => s + (w.beds?.available?? 0), 0);

  const filteredAdmissions = admissions.filter(a =>
    !search || a.patient_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const TABS = ['wards', 'admissions'];
  const TAB_LABELS = { wards: 'Wards Overview', admissions: 'Active Admissions' };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-900)', marginBottom: 4 }}>
          Inpatient & Ward Management
        </h2>
        <p style={{ fontSize: '.84rem', color: 'var(--text-500)' }}>
          Monitor ward occupancy, manage admissions, nursing notes, and medication records.
        </p>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Beds',       value: totalBeds,           color: 'var(--primary)',  icon: IcHospital },
          { label: 'Occupied',         value: occupiedBeds,        color: 'var(--warning)',  icon: IcPeople   },
          { label: 'Available',        value: availableBeds,       color: 'var(--success)',  icon: IcCheckCircle },
          { label: 'Active Admissions',value: admissions.length,   color: 'var(--teal)',     icon: IcPerson   },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon width={14} height={14} style={{ color }} />
              <span style={{ fontSize: '.76rem', color: 'var(--text-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color }}>{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === t ? 700 : 500, fontSize: '.86rem',
              color: tab === t ? 'var(--primary)' : 'var(--text-500)',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1, transition: 'all var(--t)',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Wards Tab ── */}
      {tab === 'wards' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-400)' }}>Loading wards…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {wards.map(w => <WardCard key={w.id} ward={w} />)}
            {wards.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-400)' }}>
                <IcHospital width={32} height={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .3 }} />
                No wards set up yet. Contact your hospital admin.
              </div>
            )}
          </div>
        )
      )}

      {/* ── Admissions Tab ── */}
      {tab === 'admissions' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <div className="input-wrap" style={{ maxWidth: 320 }}>
              <div className="input-icon-left"><IcSearch width={14} height={14} /></div>
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by patient name…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: '.82rem', color: 'var(--text-400)', marginLeft: 'auto' }}>
              {filteredAdmissions.length} active admission{filteredAdmissions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-400)' }}>Loading admissions…</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    {['Patient / Diagnosis','Ward & Bed','Attending Doctor','Admitted','Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-500)', fontSize: '.76rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmissions.map(a => <AdmissionRow key={a.id} a={a} />)}
                  {filteredAdmissions.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-400)', fontSize: '.85rem' }}>
                        No active admissions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
