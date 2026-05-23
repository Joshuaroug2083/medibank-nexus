import { useState }   from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast }    from '../../components/Toast';
import {
  IcPerson, IcPhone, IcPlus, IcTrash, IcCheckCircle, IcWarning,
} from '../../components/Icons';

const RELATIONS = ['Spouse','Parent','Child','Sibling','Friend','Colleague','Guardian','Other'];

function ContactCard({ contact, onRemove }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '13px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: 'var(--danger)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '.82rem',
      }}>
        {contact.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--text-900)' }}>{contact.name}</div>
        <div style={{ fontSize: '.74rem', color: 'var(--text-400)', marginTop: 2, display: 'flex', gap: 10 }}>
          <span>{contact.relation}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IcPhone width={10} height={10} /> {contact.phone}
          </span>
        </div>
      </div>
      <button
        className="icon-btn"
        style={{ color: 'var(--danger)' }}
        onClick={() => onRemove(contact.id)}
        title="Remove contact"
      >
        <IcTrash width={14} height={14} />
      </button>
    </div>
  );
}

const EMPTY_FORM = { name: '', phone: '', relation: 'Spouse' };

export default function TabPatientEmergency() {
  const { settings, patchAndSave } = useSettings();
  const toast   = useToast();

  const contacts = settings.emergencyContacts ?? [];
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [errors,   setErrors]   = useState({});

  const p = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const updated = [...contacts, { ...form, id: Date.now().toString() }];
    patchAndSave('emergencyContacts', updated);
    setForm(EMPTY_FORM);
    setShowForm(false);
    toast.success('Emergency contact added');
  };

  const handleRemove = (id) => {
    patchAndSave('emergencyContacts', contacts.filter(c => c.id !== id));
    toast.info('Contact removed');
  };

  return (
    <div>
      <div className="settings-section-title">Emergency Contacts</div>
      <p className="settings-section-desc">
        These people will be contacted by hospital staff in an emergency.
        Add at least one contact. Your information is kept strictly confidential.
      </p>

      {contacts.length === 0 && !showForm && (
        <div style={{
          padding: '28px', textAlign: 'center',
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          marginBottom: 20,
        }}>
          <IcWarning width={28} height={28} style={{ color: 'var(--warning)', marginBottom: 10 }} />
          <div style={{ fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>No emergency contacts added</div>
          <p style={{ fontSize: '.82rem', color: 'var(--text-400)', marginBottom: 16, maxWidth: 300, margin: '0 auto 16px' }}>
            We recommend adding at least one person who should be contacted in an emergency.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <IcPlus width={13} height={13} /> Add Emergency Contact
          </button>
        </div>
      )}

      {contacts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, maxWidth: 480 }}>
          {contacts.map(c => <ContactCard key={c.id} contact={c} onRemove={handleRemove} />)}
        </div>
      )}

      {contacts.length > 0 && !showForm && (
        <button className="btn btn-outline" style={{ marginBottom: 24 }} onClick={() => setShowForm(true)}>
          <IcPlus width={13} height={13} /> Add Another Contact
        </button>
      )}

      {/* Add contact form */}
      {showForm && (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '18px', maxWidth: 440, marginBottom: 24,
        }}>
          <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text-900)', marginBottom: 14 }}>
            New Emergency Contact
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Full Name *</label>
            <div className="input-wrap">
              <div className="input-icon-left"><IcPerson width={14} height={14} /></div>
              <input className={`input${errors.name ? ' error' : ''}`} style={{ paddingLeft: 36 }}
                placeholder="Contact's full name"
                value={form.name} onChange={e => p('name', e.target.value)} />
            </div>
            {errors.name && <div className="form-error"><IcWarning width={11} height={11} /> {errors.name}</div>}
          </div>

          <div className="settings-grid-2" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <div className="input-wrap">
                <div className="input-icon-left"><IcPhone width={14} height={14} /></div>
                <input className={`input${errors.phone ? ' error' : ''}`} style={{ paddingLeft: 36 }}
                  placeholder="+234 801 234 5678"
                  value={form.phone} onChange={e => p('phone', e.target.value)} />
              </div>
              {errors.phone && <div className="form-error"><IcWarning width={11} height={11} /> {errors.phone}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Relationship</label>
              <select className="select" value={form.relation} onChange={e => p('relation', e.target.value)}>
                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleAdd}>
              <IcCheckCircle width={13} height={13} /> Save Contact
            </button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setErrors({}); setForm(EMPTY_FORM); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{
        padding: '10px 14px', borderRadius: 'var(--radius-md)',
        background: 'var(--primary-light)', border: '1px solid #bee3f8',
        fontSize: '.78rem', color: 'var(--primary-dark)',
        display: 'flex', gap: 8, maxWidth: 480,
      }}>
        <IcCheckCircle width={13} height={13} style={{ flexShrink: 0, marginTop: 1 }} />
        Emergency contacts are also visible to the nursing staff who registered you and your attending physician.
      </div>
    </div>
  );
}
