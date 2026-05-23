/**
 * ContactPage — Custom / Enterprise plan enquiries
 * Reached when user clicks "Contact Us" on the Custom pricing card.
 */
import { useState } from 'react';
import {
  IcHospital, IcPerson, IcMail, IcPhone, IcPeople,
  IcArrowLeft, IcCheckCircle, IcBarChart, IcSend,
  IcShield, IcMapPin,
} from '../components/Icons';

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const STAFF_RANGES = [
  '31–50 staff',
  '51–100 staff',
  '101–200 staff',
  '200+ staff',
  'Multi-branch hospital group',
];

const INTERESTS = [
  'Multi-branch / group management',
  'Custom NHIS / LHIMS integration',
  'Custom branding & white-label',
  'Bulk staff onboarding',
  'On-site implementation & training',
  '24/7 dedicated support',
  'Full API access',
  'SLA guarantee',
];

export default function ContactPage({ onBack }) {
  const [form, setForm] = useState({
    name:        '',
    email:       '',
    phone:       '',
    hospital:    '',
    state:       '',
    staffRange:  '',
    interests:   [],
    message:     '',
  });
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending,   setSending]   = useState(false);

  const p = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleInterest = (item) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(item)
        ? f.interests.filter(i => i !== item)
        : [...f.interests, item],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.hospital.trim()) e.hospital = 'Hospital name is required';
    if (!form.phone.trim())    e.phone    = 'Phone number is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSending(true);
    /* In production, POST to /api/v1/contact or send via email service */
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--success-light)', border: '2px solid var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: 'var(--success)',
          }}>
            <IcCheckCircle width={32} height={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 10, color: 'var(--text-900)' }}>
            Message received!
          </h2>
          <p style={{ color: 'var(--text-500)', lineHeight: 1.7, marginBottom: 28 }}>
            Thank you, <strong>{form.name.split(' ')[0]}</strong>. Our enterprise team will contact you
            at <strong>{form.email}</strong> within 1 business day to discuss your custom plan.
          </p>
          <button className="btn btn-primary" onClick={onBack}>
            <IcArrowLeft width={14} height={14} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      {/* Top nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)', padding: '0 24px', height: 58,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          <IcArrowLeft width={13} height={13} /> Back
        </button>
        <div className="brand" style={{ marginLeft: 4 }}>
          <div className="brand-logo"><IcHospital width={18} height={18} /></div>
          <span className="brand-name">MediBank <span>Nexus</span></span>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)', color: 'var(--primary)',
            fontSize: '.78rem', fontWeight: 700, marginBottom: 14,
          }}>
            Custom / Enterprise Plan
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 900, color: 'var(--text-900)', marginBottom: 12 }}>
            Let's build your custom plan
          </h1>
          <p style={{ color: 'var(--text-500)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            For large hospitals, multi-branch groups, and enterprise healthcare networks.
            Our team will design a plan around your exact requirements.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0,380px)', gap: 32 }}>

          {/* ── Left: form ── */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '32px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-900)', marginBottom: 20 }}>
              Tell us about your facility
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Name */}
              <div className="form-group">
                <label className="form-label">Your Full Name *</label>
                <div className="input-wrap">
                  <div className="input-icon-left"><IcPerson width={14} height={14} /></div>
                  <input className={`input${errors.name ? ' error' : ''}`} style={{ paddingLeft: 36 }}
                    placeholder="Dr. Amaka Obi"
                    value={form.name} onChange={e => p('name', e.target.value)} />
                </div>
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Work Email *</label>
                <div className="input-wrap">
                  <div className="input-icon-left"><IcMail width={14} height={14} /></div>
                  <input className={`input${errors.email ? ' error' : ''}`} style={{ paddingLeft: 36 }}
                    type="email" placeholder="admin@hospital.ng"
                    value={form.email} onChange={e => p('email', e.target.value)} />
                </div>
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              {/* Hospital */}
              <div className="form-group">
                <label className="form-label">Hospital / Group Name *</label>
                <div className="input-wrap">
                  <div className="input-icon-left"><IcHospital width={14} height={14} /></div>
                  <input className={`input${errors.hospital ? ' error' : ''}`} style={{ paddingLeft: 36 }}
                    placeholder="Lagos General Hospital"
                    value={form.hospital} onChange={e => p('hospital', e.target.value)} />
                </div>
                {errors.hospital && <div className="form-error">{errors.hospital}</div>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone / WhatsApp *</label>
                <div className="input-wrap">
                  <div className="input-icon-left"><IcPhone width={14} height={14} /></div>
                  <input className={`input${errors.phone ? ' error' : ''}`} style={{ paddingLeft: 36 }}
                    placeholder="+234 801 234 5678"
                    value={form.phone} onChange={e => p('phone', e.target.value)} />
                </div>
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>

              {/* State */}
              <div className="form-group">
                <label className="form-label">State / Location</label>
                <div className="input-wrap">
                  <div className="input-icon-left"><IcMapPin width={14} height={14} /></div>
                  <select className="input" style={{ paddingLeft: 36 }}
                    value={form.state} onChange={e => p('state', e.target.value)}>
                    <option value="">Select state…</option>
                    {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Staff range */}
              <div className="form-group">
                <label className="form-label">Staff Size</label>
                <div className="input-wrap">
                  <div className="input-icon-left"><IcPeople width={14} height={14} /></div>
                  <select className="input" style={{ paddingLeft: 36 }}
                    value={form.staffRange} onChange={e => p('staffRange', e.target.value)}>
                    <option value="">Select range…</option>
                    {STAFF_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="form-group" style={{ marginTop: 4 }}>
              <label className="form-label">What features matter most? (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {INTERESTS.map(item => {
                  const active = form.interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-full)',
                        fontSize: '.76rem', fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'var(--primary-light)' : 'white',
                        color: active ? 'var(--primary)' : 'var(--text-500)',
                        transition: 'all var(--t)',
                      }}
                    >
                      {active && '✓ '}{item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Additional notes / requirements</label>
              <textarea
                className="input"
                style={{ height: 100, resize: 'vertical', paddingTop: 10 }}
                placeholder="Tell us about any specific integrations, compliance requirements, or features you need…"
                value={form.message}
                onChange={e => p('message', e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 8 }}
              onClick={handleSubmit}
              disabled={sending}
            >
              {sending
                ? 'Sending…'
                : <><IcSend width={14} height={14} /> Send Enquiry</>
              }
            </button>
          </div>

          {/* ── Right: what's included + contact info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* What's included */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--teal))', borderRadius: 'var(--radius-xl)', padding: '24px', color: 'white' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 16 }}>
                Custom plan includes everything in Pro, plus:
              </div>
              {[
                ['Unlimited staff & patients', IcPeople],
                ['Multi-branch management', IcBarChart],
                ['Custom NHIS / LHIMS integration', IcShield],
                ['Dedicated account manager', IcPerson],
                ['On-site staff training', IcCheckCircle],
                ['24/7 phone & chat support', IcPhone],
                ['SLA uptime guarantee', IcCheckCircle],
                ['Full API access', IcBarChart],
              ].map(([label, Icon]) => (
                <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: '.85rem' }}>
                  <Icon width={14} height={14} style={{ color: 'rgba(255,255,255,.8)', flexShrink: 0, marginTop: 2 }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text-900)', marginBottom: 14 }}>
                Prefer to talk directly?
              </div>
              {[
                [IcPhone, '+234 800 MEDIBANK', 'Call or WhatsApp us'],
                [IcMail,  'enterprise@medibanknexus.com', 'Email our team'],
                [IcMapPin,'Lagos · Abuja · Port Harcourt', 'We are across Nigeria'],
              ].map(([Icon, value, label]) => (
                <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius)',
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon width={14} height={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--text-900)' }}>{value}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-400)', marginTop: 1 }}>{label}</div>
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: 4, padding: '10px 14px', background: 'var(--success-light)',
                borderRadius: 'var(--radius)', border: '1px solid var(--success)',
                fontSize: '.78rem', color: 'var(--success-dark)', fontWeight: 600,
              }}>
                Response time: within 1 business day
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
