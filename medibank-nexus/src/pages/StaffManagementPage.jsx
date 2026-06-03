import { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { ROLE_CONFIG } from '../data/mockUsers';
import { TIER_CONFIG } from '../data/mockHospitals';
import {
  IcPersonAdd, IcSearch, IcStethoscope, IcPill, IcGear,
  IcPerson, IcMail, IcPhone, IcCheckCircle, IcXCircle,
  IcWarning, IcEdit, IcTrash, IcX, IcPeople,
} from '../components/Icons';

/* ── Mock staff roster seeded per hospital ── */
const SEED_STAFF = [
  { id: 's1', name: 'Adaeze Okonkwo',  email: 'nurse@medibank.ng',   role: 'nurse',      dept: 'Front Desk & Admissions', phone: '+234 801 111 1111', status: 'active' },
  { id: 's2', name: 'Dr. Emeka Nwosu', email: 'doctor@medibank.ng',  role: 'doctor',     dept: 'General Medicine',        phone: '+234 802 222 2222', status: 'active' },
  { id: 's3', name: 'Bisi Adeleke',    email: 'pharma@medibank.ng',  role: 'pharmacist', dept: 'Pharmacy',                phone: '+234 803 333 3333', status: 'active' },
  { id: 's4', name: 'Joshua Bankole',  email: 'admin@medibank.ng',   role: 'admin',      dept: 'Administration',          phone: '+234 804 444 4444', status: 'active' },
];

const ROLE_ICONS = {
  nurse:      <IcPersonAdd    width={13} height={13} />,
  doctor:     <IcStethoscope  width={13} height={13} />,
  pharmacist: <IcPill         width={13} height={13} />,
  admin:      <IcGear         width={13} height={13} />,
  patient:    <IcPerson       width={13} height={13} />,
};

const DEPARTMENTS = [
  'Administration', 'Front Desk & Admissions', 'General Medicine', 'Surgery',
  'Paediatrics', 'Obstetrics & Gynaecology', 'Pharmacy', 'Laboratory',
  'Radiology', 'Physiotherapy', 'Nursing', 'ICU / Critical Care', 'A&E',
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^(\+?234|0)[789]\d{9}$/;

/* ────────────────────────────────────────────
   ADD STAFF MODAL
──────────────────────────────────────────── */
function AddStaffModal({ onClose, onAdd, existingEmails }) {
  const [form, setForm]     = useState({ name: '', email: '', role: 'nurse', dept: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const patch = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                             e.name  = 'Full name is required';
    if (!emailRe.test(form.email))                     e.email = 'Enter a valid email address';
    if (existingEmails.includes(form.email.toLowerCase())) e.email = 'This email is already registered';
    if (!form.role)                                    e.role  = 'Please select a role';
    if (!form.dept)                                    e.dept  = 'Please select a department';
    if (form.phone && !phoneRe.test(form.phone.replace(/\s/g, '')))
                                                       e.phone = 'Enter a valid Nigerian phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    onAdd({
      id:     `s${Date.now()}`,
      name:   form.name,
      email:  form.email.toLowerCase(),
      role:   form.role,
      dept:   form.dept,
      phone:  form.phone,
      status: 'active',
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520, width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Staff Member</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><IcX width={16} height={16} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Full Name *</label>
            <div className="input-wrap">
              <div className="input-icon-left"><IcPerson width={14} height={14} /></div>
              <input
                className={`input${errors.name ? ' error' : ''}`}
                style={{ paddingLeft: 36 }}
                placeholder="e.g. Dr. Amara Osei"
                value={form.name}
                onChange={e => patch('name', e.target.value)}
              />
            </div>
            {errors.name && <div className="form-error"><IcWarning width={11} height={11} /> {errors.name}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Email Address *</label>
            <div className="input-wrap">
              <div className="input-icon-left"><IcMail width={14} height={14} /></div>
              <input
                type="email"
                className={`input${errors.email ? ' error' : ''}`}
                style={{ paddingLeft: 36 }}
                placeholder="staff@yourhospital.ng"
                value={form.email}
                onChange={e => patch('email', e.target.value)}
              />
            </div>
            {errors.email && <div className="form-error"><IcWarning width={11} height={11} /> {errors.email}</div>}
          </div>

          <div className="grid-2col" style={{ gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                className={`select${errors.role ? ' error' : ''}`}
                value={form.role}
                onChange={e => patch('role', e.target.value)}
              >
                {Object.entries(ROLE_CONFIG).filter(([k]) => k !== 'patient').map(([k, cfg]) => (
                  <option key={k} value={k}>{cfg.label}</option>
                ))}
              </select>
              {errors.role && <div className="form-error"><IcWarning width={11} height={11} /> {errors.role}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className={`select${errors.dept ? ' error' : ''}`}
                value={form.dept}
                onChange={e => patch('dept', e.target.value)}
              >
                <option value="">Select…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.dept && <div className="form-error"><IcWarning width={11} height={11} /> {errors.dept}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (optional)</label>
            <div className="input-wrap">
              <div className="input-icon-left"><IcPhone width={14} height={14} /></div>
              <input
                className={`input${errors.phone ? ' error' : ''}`}
                style={{ paddingLeft: 36 }}
                placeholder="+234 801 234 5678"
                value={form.phone}
                onChange={e => patch('phone', e.target.value)}
              />
            </div>
            {errors.phone && <div className="form-error"><IcWarning width={11} height={11} /> {errors.phone}</div>}
          </div>

          <div style={{
            marginTop: 14, padding: '10px 12px',
            background: 'var(--primary-light)', borderRadius: 'var(--radius-md)',
            fontSize: '.78rem', color: 'var(--primary-dark)',
          }}>
            A login link will be sent to the staff email. Temporary password: <strong>Welcome@123</strong>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="btn-spinner" /> Adding…</> : <><IcPersonAdd width={14} height={14} /> Add Staff</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   STAFF ROW
──────────────────────────────────────────── */
function StaffRow({ member, onToggle, onRemove }) {
  const cfg = ROLE_CONFIG[member.role];

  return (
    <tr>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: cfg.bg, color: cfg.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '.78rem',
          }}>
            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text-900)' }}>{member.name}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-400)' }}>{member.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          background: cfg.bg, color: cfg.color,
          fontSize: '.73rem', fontWeight: 700,
          border: `1px solid ${cfg.color}33`,
        }}>
          {ROLE_ICONS[member.role]} {cfg.label}
        </span>
      </td>
      <td style={{ padding: '12px 14px', fontSize: '.82rem', color: 'var(--text-500)' }}>
        {member.dept}
      </td>
      <td style={{ padding: '12px 14px', fontSize: '.82rem', color: 'var(--text-500)' }}>
        {member.phone || '—'}
      </td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          background: member.status === 'active' ? '#dcfce7' : '#fee2e2',
          color:      member.status === 'active' ? 'var(--success)' : 'var(--danger)',
          fontSize:   '.73rem', fontWeight: 700,
        }}>
          {member.status === 'active'
            ? <IcCheckCircle width={11} height={11} />
            : <IcXCircle     width={11} height={11} />
          }
          {member.status === 'active' ? 'Active' : 'Suspended'}
        </span>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <button
            className="icon-btn"
            title={member.status === 'active' ? 'Suspend' : 'Reactivate'}
            onClick={() => onToggle(member.id)}
            style={{ color: member.status === 'active' ? 'var(--warning)' : 'var(--success)' }}
          >
            {member.status === 'active'
              ? <IcXCircle    width={14} height={14} />
              : <IcCheckCircle width={14} height={14} />
            }
          </button>
          <button
            className="icon-btn"
            title="Remove"
            onClick={() => onRemove(member.id)}
            style={{ color: 'var(--danger)' }}
          >
            <IcTrash width={14} height={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────── */
export default function StaffManagementPage() {
  const { hospital } = useTenant();
  const tier = TIER_CONFIG[hospital?.tier ?? 'starter'];

  const [staff,      setStaff]      = useState(SEED_STAFF);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAdd,    setShowAdd]    = useState(false);

  const filtered = staff.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.includes(q) || m.dept.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    total:  staff.length,
    active: staff.filter(m => m.status === 'active').length,
    ...Object.fromEntries(
      Object.keys(ROLE_CONFIG).filter(r => r !== 'patient').map(r => [r, staff.filter(m => m.role === r).length])
    ),
  };

  const maxStaff    = tier?.maxStaff ?? Infinity;
  const atLimit     = staff.length >= maxStaff;
  const usagePct    = maxStaff === Infinity ? 0 : Math.min(100, Math.round((staff.length / maxStaff) * 100));

  const handleAdd    = (member) => setStaff(s => [...s, member]);
  const handleToggle = (id) => setStaff(s => s.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'suspended' : 'active' } : m));
  const handleRemove = (id) => setStaff(s => s.filter(m => m.id !== id));

  return (
    <div className="anim-fade-in">

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-.02em', marginBottom: 4 }}>
            Staff Management
          </h1>
          <p style={{ fontSize: '.85rem', color: 'var(--text-500)' }}>
            {hospital?.name ?? 'Your Hospital'} · {counts.active} active staff members
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAdd(true)}
          disabled={atLimit}
          title={atLimit ? `Your ${tier?.label} plan allows up to ${maxStaff} staff` : 'Add a new staff member'}
        >
          <IcPersonAdd width={14} height={14} /> Add Staff
          {atLimit && <span style={{ fontSize: '.7rem', marginLeft: 4, opacity: .8 }}>— Limit reached</span>}
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Total Staff',   value: counts.total,      color: 'var(--primary)' },
          { label: 'Nurses',        value: counts.nurse,       color: 'var(--teal)'    },
          { label: 'Doctors',       value: counts.doctor,      color: 'var(--primary)' },
          { label: 'Pharmacists',   value: counts.pharmacist,  color: 'var(--warning)' },
          { label: 'Admins',        value: counts.admin,       color: '#374151'        },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--text-400)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Plan usage bar (shown if limited tier) ── */}
      {maxStaff !== Infinity && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          marginBottom: 18, display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <IcPeople width={14} height={14} style={{ color: 'var(--text-400)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-500)' }}>Staff seats used</span>
              <span style={{ fontWeight: 700, color: atLimit ? 'var(--danger)' : 'var(--text-900)' }}>
                {staff.length} / {maxStaff}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 9999,
                width: `${usagePct}%`,
                background: usagePct >= 90 ? 'var(--danger)' : usagePct >= 70 ? 'var(--warning)' : 'var(--primary)',
                transition: 'width .4s var(--ease)',
              }} />
            </div>
          </div>
          {atLimit && (
            <span style={{ fontSize: '.72rem', color: 'var(--danger)', fontWeight: 700, flexShrink: 0 }}>
              Upgrade to add more
            </span>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="input-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <div className="input-icon-left"><IcSearch width={14} height={14} /></div>
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name, email or department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'nurse', 'doctor', 'pharmacist', 'admin'].map(r => (
            <button
              key={r}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? `All (${counts.total})` : `${ROLE_CONFIG[r]?.label} (${counts[r]})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-400)', fontSize: '.85rem' }}>
            <IcPeople width={32} height={32} style={{ opacity: .25, marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: 'var(--text-700)', marginBottom: 6 }}>No staff found</div>
            {search || roleFilter !== 'all'
              ? <div>Try adjusting your search or filter.</div>
              : <div>Add your first staff member to get started.</div>
            }
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {['Staff Member', 'Role', 'Department', 'Phone', 'Status', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: '.72rem', fontWeight: 700, color: 'var(--text-400)',
                      textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <StaffRow
                      key={m.id}
                      member={m}
                      onToggle={handleToggle}
                      onRemove={handleRemove}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddStaffModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          existingEmails={staff.map(m => m.email)}
        />
      )}
    </div>
  );
}
