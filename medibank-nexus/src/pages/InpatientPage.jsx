/**
 * InpatientPage — Ward & Bed Management, Admissions, Nursing Notes, MAR
 *
 * Tabs: Wards Overview | Active Admissions | Nursing Notes | MAR (Medications)
 * Roles: nurse, doctor, admin
 *
 * This file is the orchestrating shell. All data-fetching lives in:
 *   ./inpatient/useInpatientData.js
 * All modal logic lives in:
 *   ./inpatient/AdmitModal.jsx
 *   ./inpatient/DischargeModal.jsx
 *   ./inpatient/NursingNoteModal.jsx
 *   ./inpatient/MARModals.jsx  (ScheduleMedModal + AdministerModal)
 */
import { useState } from 'react';
import { useAuth }       from '../context/AuthContext';
import { useToast }      from '../components/Toast';
import { Badge }         from '../components';
import {
  IcHospital, IcPeople, IcCheckCircle,
  IcPersonAdd, IcSearch, IcPerson,
  IcPill, IcPlus,
} from '../components/Icons';

/* Sub-components */
import { useInpatientData, useMarRecords } from './inpatient/useInpatientData';
import AdmitModal        from './inpatient/AdmitModal';
import DischargeModal    from './inpatient/DischargeModal';
import NursingNoteModal  from './inpatient/NursingNoteModal';
import { ScheduleMedModal, AdministerModal } from './inpatient/MARModals';

/* ── Ward type colours ─────────────────────────── */
const WARD_TYPE_COLORS = {
  general:    ['var(--primary)', 'var(--primary-light)'],
  icu:        ['var(--danger)',  'var(--danger-light)'],
  maternity:  ['var(--teal)',    'var(--teal-light,#e6fafa)'],
  paediatric: ['var(--success)', 'var(--success-light)'],
  surgical:   ['var(--warning)', 'var(--warning-light)'],
  private:    ['var(--text-500)','var(--bg)'],
  emergency:  ['var(--danger)',  'var(--danger-light)'],
};

/* ── WardCard ─────────────────────────────────── */
function WardCard({ ward }) {
  const [color, bg] = WARD_TYPE_COLORS[ward.ward_type] ?? ['var(--text-400)', 'var(--bg)'];
  const occ   = ward.beds?.occupied  ?? 0;
  const total = ward.beds?.total     ?? 0;
  const pct   = total ? Math.round((occ / total) * 100) : 0;

  return (
    <div className="card anim-scale-in" style={{ padding: '20px' }}>
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
          <span>{occ} occupied</span><span>{total} total beds</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : color, borderRadius: 4, transition: 'width .4s' }} />
        </div>
      </div>
      <div style={{ fontSize: '.74rem', color: 'var(--text-400)', textAlign: 'right' }}>{pct}% occupancy</div>
    </div>
  );
}

/* ── Tabs config ──────────────────────────────── */
const TABS = ['wards', 'admissions', 'nursing-notes', 'mar'];
const TAB_LABELS = { wards: 'Wards Overview', admissions: 'Active Admissions', 'nursing-notes': 'Nursing Notes', mar: 'MAR (Medications)' };

/* ── Main Page ───────────────────────────────── */
export default function InpatientPage() {
  const { user }  = useAuth();
  const toast     = useToast();
  const [tab,     setTab]    = useState('wards');
  const [search,  setSearch] = useState('');

  /* Data hooks */
  const { wards, admissions, nursingNotes, loading, reload } = useInpatientData();
  const { marRecords, loadingMar, selectedAdmissionId, setSelectedAdmissionId, reloadMar } = useMarRecords();

  /* Modal open state */
  const [admitOpen,      setAdmitOpen]      = useState(false);
  const [dischargeOpen,  setDischargeOpen]  = useState(false);
  const [noteOpen,       setNoteOpen]       = useState(false);
  const [schedMedOpen,   setSchedMedOpen]   = useState(false);
  const [administerOpen, setAdministerOpen] = useState(false);

  /* Selected entities for modals */
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [selectedMarRecord, setSelectedMarRecord] = useState(null);

  /* Summary stats */
  const totalBeds     = wards.reduce((s, w) => s + (w.beds?.total     ?? 0), 0);
  const occupiedBeds  = wards.reduce((s, w) => s + (w.beds?.occupied  ?? 0), 0);
  const availableBeds = wards.reduce((s, w) => s + (w.beds?.available ?? 0), 0);

  const filteredAdmissions = admissions.filter(a =>
    !search || a.patient_name?.toLowerCase().includes(search.toLowerCase()),
  );

  /* Open discharge modal */
  const openDischarge = (adm) => { setSelectedAdmission(adm); setDischargeOpen(true); };

  /* Open schedule-med modal — requires an active admission to be selected */
  const openScheduleMed = () => {
    const adm = admissions.find(a => String(a.id) === String(selectedAdmissionId));
    if (!adm) return toast.warning('Please select an active admission first.');
    setSelectedAdmission(adm);
    setSchedMedOpen(true);
  };

  /* Open administer modal */
  const openAdminister = (rec) => { setSelectedMarRecord(rec); setAdministerOpen(true); };

  return (
    <div style={{ padding: '0 4px' }} className="anim-fade-up">

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-900)', marginBottom: 4 }}>
            Inpatient &amp; Ward Management
          </h2>
          <p style={{ fontSize: '.84rem', color: 'var(--text-500)' }}>
            Monitor ward occupancy, manage admissions, nursing notes, and medication records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'admissions' && (
            <button className="btn btn-primary btn-sm" onClick={() => setAdmitOpen(true)}>
              <IcPersonAdd width={14} height={14} /> Admit Patient
            </button>
          )}
          {tab === 'nursing-notes' && (
            <button className="btn btn-primary btn-sm" onClick={() => setNoteOpen(true)}>
              <IcPlus width={14} height={14} /> Add Nursing Note
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Beds',        value: totalBeds,          color: 'var(--primary)',  Icon: IcHospital    },
          { label: 'Occupied',          value: occupiedBeds,       color: 'var(--warning)',  Icon: IcPeople      },
          { label: 'Available',         value: availableBeds,      color: 'var(--success)',  Icon: IcCheckCircle },
          { label: 'Active Admissions', value: admissions.length,  color: 'var(--teal)',     Icon: IcPerson      },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
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
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === t ? 700 : 500, fontSize: '.86rem',
            color: tab === t ? 'var(--primary)' : 'var(--text-500)',
            borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -1, transition: 'all var(--t)',
          }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Wards Tab ── */}
      {tab === 'wards' && (
        loading
          ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-400)' }}>Loading wards…</div>
          : (
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
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="input-wrap" style={{ maxWidth: 320, flex: 1 }}>
              <div className="input-icon-left"><IcSearch width={14} height={14} /></div>
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by patient name…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: '.82rem', color: 'var(--text-400)', marginLeft: 'auto' }}>
              {filteredAdmissions.length} active admission{filteredAdmissions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {loading
              ? <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-400)' }}>Loading admissions…</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                        {['Patient / Diagnosis','Ward & Bed','Attending Doctor','Admitted','Status','Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-500)', fontSize: '.76rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmissions.map(a => {
                        const days = Math.ceil((Date.now() - new Date(a.admitted_at)) / 86_400_000);
                        return (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 600, fontSize: '.86rem', color: 'var(--text-900)' }}>{a.patient_name}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 1 }}>{a.diagnosis ?? '—'}</div>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: '.84rem', color: 'var(--text-700)' }}>{a.ward_name} · Bed {a.bed_number ?? '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: '.84rem', color: 'var(--text-600)' }}>{a.doctor_name ?? '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: '.8rem', color: 'var(--text-400)', whiteSpace: 'nowrap' }}>{days} day{days !== 1 ? 's' : ''} ago</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '.72rem', fontWeight: 700, background: 'var(--success-light)', color: 'var(--success)' }}>
                                {a.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <button className="btn btn-outline btn-xs" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => openDischarge(a)}>
                                Discharge
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredAdmissions.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-400)', fontSize: '.85rem' }}>No active admissions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ── Nursing Notes Tab ── */}
      {tab === 'nursing-notes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {loading
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-400)' }}>Loading notes…</div>
            : (
              <>
                {nursingNotes.map(n => {
                  const parsedVitals = n.vitals ? (typeof n.vitals === 'string' ? JSON.parse(n.vitals) : n.vitals) : null;
                  return (
                    <div key={n.id} className="card anim-scale-in" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <IcPerson width={14} height={14} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '.86rem', color: 'var(--text-900)' }}>{n.patient_name ?? `Patient ID: ${n.patient_id}`}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text-400)' }}>By {n.nurse_name} · {new Date(n.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        <Badge variant={n.note_type === 'vitals' ? 'primary' : n.note_type === 'triage' ? 'warning' : 'teal'}>{n.note_type}</Badge>
                      </div>
                      <div style={{ fontSize: '.84rem', color: 'var(--text-700)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{n.content}</div>
                      {parsedVitals && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius)', gap: 8, fontSize: '.76rem' }}>
                          {parsedVitals.bp    && <div><strong>BP:</strong> {parsedVitals.bp} mmHg</div>}
                          {parsedVitals.pulse && <div><strong>Pulse:</strong> {parsedVitals.pulse} bpm</div>}
                          {parsedVitals.temp  && <div><strong>Temp:</strong> {parsedVitals.temp} °C</div>}
                          {parsedVitals.spo2  && <div><strong>SpO₂:</strong> {parsedVitals.spo2} %</div>}
                          {parsedVitals.rr    && <div><strong>Resp:</strong> {parsedVitals.rr} /min</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {nursingNotes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-400)' }}>
                    <IcSearch width={32} height={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .3 }} />
                    No nursing notes added yet.
                  </div>
                )}
              </>
            )
          }
        </div>
      )}

      {/* ── MAR Tab ── */}
      {tab === 'mar' && (
        <div>
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
            <div className="form-group" style={{ maxWidth: 420, marginBottom: 0 }}>
              <label className="form-label" htmlFor="mar-admission-select">Select Active Admission</label>
              <select id="mar-admission-select" className="select" value={selectedAdmissionId} onChange={e => setSelectedAdmissionId(e.target.value)}>
                <option value="">Select an active admission…</option>
                {admissions.map(a => (
                  <option key={a.id} value={a.id}>{a.patient_name} ({a.ward_name} · Bed {a.bed_number})</option>
                ))}
              </select>
            </div>
          </div>

          {selectedAdmissionId ? (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text-900)' }}>Medication Administration Record</div>
                <button className="btn btn-primary btn-sm" onClick={openScheduleMed}>
                  <IcPlus width={13} height={13} /> Schedule Med
                </button>
              </div>

              {loadingMar
                ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-400)' }}>Loading MAR records…</div>
                : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                          {['Medication / Dose','Route / Freq','Scheduled','Status','Administered By','Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-500)', fontSize: '.76rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {marRecords.map(r => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-900)' }}>{r.drug_name}</div>
                              <div style={{ fontSize: '.74rem', color: 'var(--text-400)' }}>Dose: {r.dose}</div>
                            </td>
                            <td style={{ padding: '10px 14px', textTransform: 'capitalize' }}>{r.route} · {r.frequency}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-500)', fontSize: '.78rem' }}>{new Date(r.scheduled_at).toLocaleString()}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <Badge variant={r.status === 'given' ? 'success' : r.status === 'scheduled' ? 'primary' : 'danger'}>{r.status}</Badge>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: '.78rem', color: 'var(--text-500)' }}>
                              {r.status === 'given'
                                ? <><div>{r.administered_by_name}</div><div style={{ fontSize: '.68rem', color: 'var(--text-400)' }}>{new Date(r.administered_at).toLocaleString()}</div></>
                                : r.status !== 'scheduled'
                                  ? <div style={{ fontSize: '.72rem', color: 'var(--danger)' }}><strong>Reason:</strong> {r.omission_reason || '—'}</div>
                                  : '—'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {r.status === 'scheduled' && (
                                <button className="btn btn-outline btn-xs" onClick={() => openAdminister(r)}>Administer</button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {marRecords.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-400)', fontSize: '.84rem' }}>No medications scheduled for this admission.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          ) : (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-400)' }}>
              <IcPill width={28} height={28} style={{ margin: '0 auto 10px', display: 'block', opacity: .3 }} />
              Select an active admission above to view or schedule medication administration records.
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <AdmitModal
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
        wards={wards}
        onSuccess={reload}
      />

      <DischargeModal
        open={dischargeOpen}
        onClose={() => { setDischargeOpen(false); setSelectedAdmission(null); }}
        admission={selectedAdmission}
        onSuccess={reload}
      />

      <NursingNoteModal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        admissions={admissions}
        onSuccess={reload}
      />

      <ScheduleMedModal
        open={schedMedOpen}
        onClose={() => setSchedMedOpen(false)}
        admission={selectedAdmission}
        onSuccess={reloadMar}
      />

      <AdministerModal
        open={administerOpen}
        onClose={() => { setAdministerOpen(false); setSelectedMarRecord(null); }}
        marRecord={selectedMarRecord}
        onSuccess={reloadMar}
      />
    </div>
  );
}
