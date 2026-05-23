import { useState, useRef, useEffect } from 'react';
import { useTenant }  from '../context/TenantContext';
import { useAuth }    from '../context/AuthContext';
import { TIER_CONFIG, NG_STATES, HOSPITAL_TYPES } from '../data/mockHospitals';
import {
  IcHospital, IcPerson, IcMail, IcLock, IcEye, IcEyeOff,
  IcCheckCircle, IcArrowRight, IcArrowLeft, IcWarning,
  IcShield, IcBarChart, IcCPU, IcPeople, IcGear, IcPhone, IcX,
} from '../components/Icons';

/* ─────────────────────────────────────────
   STEP DEFINITIONS
───────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Hospital Info',   icon: <IcHospital  width={14} height={14} /> },
  { id: 2, label: 'Admin Account',   icon: <IcPerson    width={14} height={14} /> },
  { id: 3, label: 'Choose Plan',     icon: <IcBarChart  width={14} height={14} /> },
  { id: 4, label: 'Review & Launch', icon: <IcCheckCircle width={14} height={14} /> },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe  = /^(\+?234|0)[789]\d{9}$/;

function Field({ label, error, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 14 }}>
      <label className="form-label">{label}</label>
      {children}
      {error && (
        <div className="form-error anim-fade-down">
          <IcWarning width={11} height={11} /> {error}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   STEP 1 — HOSPITAL INFORMATION
───────────────────────────────────────── */
function StepHospitalInfo({ data, onChange, errors }) {
  return (
    <div>
      <div className="grid-2col" style={{ gap: 14 }}>
        <Field label="Hospital / Facility Name *" error={errors.name}>
          <input
            className={`input${errors.name ? ' error' : ''}`}
            placeholder="e.g. Lagos General Hospital"
            value={data.name}
            onChange={e => onChange('name', e.target.value)}
          />
        </Field>
        <Field label="Short Name / Abbreviation *" error={errors.shortName}>
          <input
            className={`input${errors.shortName ? ' error' : ''}`}
            placeholder="e.g. LGH"
            maxLength={8}
            value={data.shortName}
            onChange={e => onChange('shortName', e.target.value.toUpperCase())}
          />
        </Field>
      </div>

      <div className="grid-2col" style={{ gap: 14 }}>
        <Field label="Facility Type *" error={errors.type}>
          <select
            className={`select${errors.type ? ' error' : ''}`}
            value={data.type}
            onChange={e => onChange('type', e.target.value)}
          >
            <option value="">Select type…</option>
            {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="MDCN License Number *" error={errors.licenseNumber}>
          <input
            className={`input${errors.licenseNumber ? ' error' : ''}`}
            placeholder="e.g. MDCN/2024/LGS/001"
            value={data.licenseNumber}
            onChange={e => onChange('licenseNumber', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Street Address *" error={errors.address}>
        <input
          className={`input${errors.address ? ' error' : ''}`}
          placeholder="e.g. 23 Broad Street, Lagos Island"
          value={data.address}
          onChange={e => onChange('address', e.target.value)}
        />
      </Field>

      <div className="grid-2col" style={{ gap: 14 }}>
        <Field label="City *" error={errors.city}>
          <input
            className={`input${errors.city ? ' error' : ''}`}
            placeholder="e.g. Lagos"
            value={data.city}
            onChange={e => onChange('city', e.target.value)}
          />
        </Field>
        <Field label="State *" error={errors.state}>
          <select
            className={`select${errors.state ? ' error' : ''}`}
            value={data.state}
            onChange={e => onChange('state', e.target.value)}
          >
            <option value="">Select state…</option>
            {NG_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid-2col" style={{ gap: 14 }}>
        <Field label="Official Phone Number *" error={errors.phone}>
          <div className="input-wrap">
            <div className="input-icon-left"><IcPhone width={14} height={14} /></div>
            <input
              className={`input${errors.phone ? ' error' : ''}`}
              style={{ paddingLeft: 36 }}
              placeholder="+234 801 234 5678"
              value={data.phone}
              onChange={e => onChange('phone', e.target.value)}
            />
          </div>
        </Field>
        <Field label="Official Email Address *" error={errors.email}>
          <div className="input-wrap">
            <div className="input-icon-left"><IcMail width={14} height={14} /></div>
            <input
              type="email"
              className={`input${errors.email ? ' error' : ''}`}
              style={{ paddingLeft: 36 }}
              placeholder="info@yourhospital.ng"
              value={data.email}
              onChange={e => onChange('email', e.target.value)}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   STEP 2 — ADMIN ACCOUNT
───────────────────────────────────────── */
function StepAdminAccount({ data, onChange, errors }) {
  const [showPw,   setShowPw]   = useState(false);
  const [showPw2,  setShowPw2]  = useState(false);

  return (
    <div>
      <div
        className="alert"
        style={{
          background: 'var(--primary-light)', border: '1px solid #bee3f8',
          borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 18,
          fontSize: '.82rem', color: 'var(--primary-dark)', display: 'flex', gap: 8,
        }}
      >
        <IcShield width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} />
        This account will be the Hospital Administrator — they can invite and manage all staff.
      </div>

      <div className="grid-2col" style={{ gap: 14 }}>
        <Field label="Full Name *" error={errors.adminName}>
          <div className="input-wrap">
            <div className="input-icon-left"><IcPerson width={14} height={14} /></div>
            <input
              className={`input${errors.adminName ? ' error' : ''}`}
              style={{ paddingLeft: 36 }}
              placeholder="e.g. Dr. Emeka Nwosu"
              value={data.adminName}
              onChange={e => onChange('adminName', e.target.value)}
            />
          </div>
        </Field>
        <Field label="Job Title" error={errors.adminTitle}>
          <input
            className="input"
            placeholder="e.g. Chief Medical Officer"
            value={data.adminTitle}
            onChange={e => onChange('adminTitle', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Admin Email Address *" error={errors.adminEmail}>
        <div className="input-wrap">
          <div className="input-icon-left"><IcMail width={14} height={14} /></div>
          <input
            type="email"
            className={`input${errors.adminEmail ? ' error' : ''}`}
            style={{ paddingLeft: 36 }}
            placeholder="admin@yourhospital.ng"
            value={data.adminEmail}
            onChange={e => onChange('adminEmail', e.target.value)}
          />
        </div>
      </Field>

      <div className="grid-2col" style={{ gap: 14 }}>
        <Field label="Password *" error={errors.adminPassword}>
          <div className="input-wrap">
            <div className="input-icon-left"><IcLock width={14} height={14} /></div>
            <input
              type={showPw ? 'text' : 'password'}
              className={`input${errors.adminPassword ? ' error' : ''}`}
              style={{ paddingLeft: 36, paddingRight: 44 }}
              placeholder="Min. 8 characters"
              value={data.adminPassword}
              onChange={e => onChange('adminPassword', e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon input-btn-right"
              style={{ color: 'var(--text-400)' }}
              onClick={() => setShowPw(v => !v)}
              tabIndex={-1}
            >
              {showPw ? <IcEyeOff width={15} height={15} /> : <IcEye width={15} height={15} />}
            </button>
          </div>
        </Field>
        <Field label="Confirm Password *" error={errors.adminPassword2}>
          <div className="input-wrap">
            <div className="input-icon-left"><IcLock width={14} height={14} /></div>
            <input
              type={showPw2 ? 'text' : 'password'}
              className={`input${errors.adminPassword2 ? ' error' : ''}`}
              style={{ paddingLeft: 36, paddingRight: 44 }}
              placeholder="Re-enter password"
              value={data.adminPassword2}
              onChange={e => onChange('adminPassword2', e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon input-btn-right"
              style={{ color: 'var(--text-400)' }}
              onClick={() => setShowPw2(v => !v)}
              tabIndex={-1}
            >
              {showPw2 ? <IcEyeOff width={15} height={15} /> : <IcEye width={15} height={15} />}
            </button>
          </div>
        </Field>
      </div>

      {/* Password strength hint */}
      {data.adminPassword && (
        <div style={{ marginTop: -6, marginBottom: 8, fontSize: '.75rem', color: 'var(--text-400)' }}>
          {(() => {
            const p = data.adminPassword;
            const strong = p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);
            const medium = p.length >= 8;
            return (
              <span style={{ color: strong ? 'var(--success)' : medium ? 'var(--warning)' : 'var(--danger)' }}>
                {strong ? 'Strong password' : medium ? 'Medium — add uppercase & numbers' : 'Too short'}
              </span>
            );
          })()}
        </div>
      )}

      <Field label="Phone / WhatsApp *" error={errors.adminPhone}>
        <div className="input-wrap">
          <div className="input-icon-left"><IcPhone width={14} height={14} /></div>
          <input
            className={`input${errors.adminPhone ? ' error' : ''}`}
            style={{ paddingLeft: 36 }}
            placeholder="+234 801 234 5678"
            value={data.adminPhone}
            onChange={e => onChange('adminPhone', e.target.value)}
          />
        </div>
      </Field>
    </div>
  );
}

/* ─────────────────────────────────────────
   STEP 3 — CHOOSE PLAN
───────────────────────────────────────── */
/* Only free_trial and pro are selectable in onboarding */
const ONBOARDING_TIERS = ['free_trial', 'pro'];

function StepChoosePlan({ data, onChange }) {
  return (
    <div>
      <p style={{ fontSize: '.85rem', color: 'var(--text-500)', marginBottom: 20, lineHeight: 1.65 }}>
        Start with a free 30-day trial or activate Pro immediately after payment.
        You can upgrade from trial to Pro at any time within your first month.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ONBOARDING_TIERS.map(key => {
          const tier     = TIER_CONFIG[key];
          const selected = data.tier === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange('tier', key)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${selected ? tier.color : 'var(--border)'}`,
                background: selected ? tier.bg : 'var(--surface)',
                cursor: 'pointer',
                transition: 'border-color var(--t), background var(--t)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              {/* Radio circle */}
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: `2px solid ${selected ? tier.color : 'var(--border-dark)'}`,
                background: selected ? tier.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)' }}>
                    {tier.label}
                  </span>
                  <span style={{
                    fontSize: '.72rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: tier.bg, color: tier.color,
                    border: `1px solid ${tier.color}33`,
                  }}>
                    {tier.price}{tier.period}
                  </span>
                  {key === 'pro' && (
                    <span style={{
                      fontSize: '.7rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--success)', color: 'white',
                    }}>
                      Pro
                    </span>
                  )}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ fontSize: '.78rem', color: 'var(--text-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <IcCheckCircle width={11} height={11} style={{ color: tier.color, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                  {tier.locked?.map(f => (
                    <li key={f} style={{ fontSize: '.78rem', color: 'var(--text-300)', display: 'flex', gap: 6, alignItems: 'center', opacity: .6 }}>
                      <IcX width={10} height={10} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                      {f} <span style={{ fontSize: '.68rem' }}>(Pro only)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pro payment notice */}
      {data.tier === 'pro' && (
        <div style={{
          marginTop: 14, padding: '12px 16px',
          background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--primary)', fontSize: '.82rem', color: 'var(--primary)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <IcShield width={14} height={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>Payment required.</strong> After reviewing your details, you will be directed to a
            secure Paystack payment page. Your account activates instantly after payment.
          </span>
        </div>
      )}

      {/* Free trial notice */}
      {data.tier === 'free_trial' && (
        <div style={{
          marginTop: 14, padding: '12px 16px',
          background: 'var(--warning-light)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--warning)', fontSize: '.82rem', color: 'var(--warning-dark)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <IcCheckCircle width={14} height={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>No payment needed.</strong> Your free trial lasts 30 days with up to 5 staff.
            You can upgrade to Pro at any time during or after the trial period.
          </span>
        </div>
      )}

      {/* Custom plan note */}
      <div style={{
        marginTop: 14, padding: '10px 14px',
        background: 'var(--surface-2)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', fontSize: '.78rem', color: 'var(--text-400)',
      }}>
        Need more than 30 staff or custom integrations?{' '}
        <strong style={{ color: 'var(--primary)' }}>Contact us</strong> for a Custom enterprise plan.
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   STEP 4 — REVIEW & LAUNCH
───────────────────────────────────────── */
function StepReview({ data }) {
  const tier = TIER_CONFIG[data.tier];

  const Section = ({ title, rows }) => (
    <div style={{
      background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 14,
    }}>
      <div style={{
        padding: '8px 14px', background: 'var(--surface-3)',
        borderBottom: '1px solid var(--border)',
        fontSize: '.72rem', fontWeight: 700, color: 'var(--text-500)',
        textTransform: 'uppercase', letterSpacing: '.05em',
      }}>
        {title}
      </div>
      {rows.map(([label, value]) => value ? (
        <div key={label} style={{
          padding: '8px 14px', display: 'flex', gap: 12,
          borderBottom: '1px solid var(--border)',
          fontSize: '.83rem',
        }}>
          <span style={{ color: 'var(--text-400)', minWidth: 130, flexShrink: 0 }}>{label}</span>
          <span style={{ color: 'var(--text-900)', fontWeight: 600, wordBreak: 'break-all' }}>{value}</span>
        </div>
      ) : null)}
    </div>
  );

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--teal))',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
          color: 'white',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IcHospital width={22} height={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{data.name || 'Your Hospital'}</div>
          <div style={{ fontSize: '.78rem', opacity: .8, marginTop: 2 }}>
            {data.shortName} · {data.type || 'Hospital'} · {data.city}, {data.state}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 700, padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
          }}>
            {tier?.label ?? 'Starter'} Plan
          </div>
        </div>
      </div>

      <Section title="Hospital Details" rows={[
        ['Name',           data.name],
        ['Short Name',     data.shortName],
        ['Type',           data.type],
        ['License Number', data.licenseNumber],
        ['Address',        data.address],
        ['City / State',   data.city && data.state ? `${data.city}, ${data.state}` : ''],
        ['Phone',          data.phone],
        ['Email',          data.email],
      ]} />

      <Section title="Administrator Account" rows={[
        ['Full Name',  data.adminName],
        ['Title',      data.adminTitle],
        ['Email',      data.adminEmail],
        ['Phone',      data.adminPhone],
        ['Password',   '••••••••'],
      ]} />

      <Section title="Subscription" rows={[
        ['Plan',       tier?.label],
        ['Price',      tier?.price],
        ['Max Staff',  tier?.maxStaff ? `${tier.maxStaff} accounts` : 'Unlimited'],
      ]} />

      <div style={{
        padding: '12px 14px', background: 'var(--success)', borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontSize: '.82rem',
      }}>
        <IcShield width={14} height={14} style={{ flexShrink: 0 }} />
        Your data is protected with AES-256 encryption and is NDPR compliant.
        We will never share your information.
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function HospitalOnboardingPage({ onComplete, onBack, preselectedPlan = 'free_trial' }) {
  const { setTenant } = useTenant();
  const { quickLogin } = useAuth();

  const [step,      setStep]      = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done,      setDone]      = useState(false);
  const [errors,    setErrors]    = useState({});

  /* Single flat form state across all steps */
  const [form, setForm] = useState({
    /* Step 1 */
    name: '', shortName: '', type: '', licenseNumber: '',
    address: '', city: '', state: '', phone: '', email: '',
    /* Step 2 */
    adminName: '', adminTitle: '', adminEmail: '',
    adminPassword: '', adminPassword2: '', adminPhone: '',
    /* Step 3 — default to whatever was pre-selected from landing page */
    tier: preselectedPlan === 'pro' ? 'pro' : 'free_trial',
  });

  const topRef = useRef(null);

  const patch = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  /* ── Validation per step ── */
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim())          e.name          = 'Hospital name is required';
      if (!form.shortName.trim())     e.shortName     = 'Short name is required';
      if (!form.type)                 e.type          = 'Please select a facility type';
      if (!form.licenseNumber.trim()) e.licenseNumber = 'License number is required';
      if (!form.address.trim())       e.address       = 'Address is required';
      if (!form.city.trim())          e.city          = 'City is required';
      if (!form.state)                e.state         = 'Please select a state';
      if (!phoneRe.test(form.phone.replace(/\s/g, '')))
                                      e.phone         = 'Enter a valid Nigerian phone number';
      if (!emailRe.test(form.email))  e.email         = 'Enter a valid email address';
    }
    if (step === 2) {
      if (!form.adminName.trim())                          e.adminName      = 'Full name is required';
      if (!emailRe.test(form.adminEmail))                  e.adminEmail     = 'Enter a valid email address';
      if (form.adminPassword.length < 8)                   e.adminPassword  = 'Password must be at least 8 characters';
      if (form.adminPassword !== form.adminPassword2)      e.adminPassword2 = 'Passwords do not match';
      if (!phoneRe.test(form.adminPhone.replace(/\s/g, '')))
                                                           e.adminPhone     = 'Enter a valid Nigerian phone number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep(s => s + 1);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const back = () => {
    setStep(s => s - 1);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLaunch = async () => {
    if (!validate()) return;
    setSubmitting(true);

    await new Promise(r => setTimeout(r, 900));

    const hospitalId = `hosp_${Date.now()}`;
    const today      = new Date().toISOString().split('T')[0];

    const newHospital = {
      id:             hospitalId,
      name:           form.name,
      shortName:      form.shortName,
      type:           form.type,
      tier:           form.tier,
      address:        form.address,
      city:           form.city,
      state:          form.state,
      phone:          form.phone,
      email:          form.email,
      primaryColor:   '#0a6ebd',
      staffCount:     1,
      patientCount:   0,
      createdAt:      today,
      status:         form.tier === 'free_trial' ? 'trial' : 'active',
      licenseNumber:  form.licenseNumber,
      trialStartDate: form.tier === 'free_trial' ? today : null,
    };

    const adminUser = {
      id:         `usr_${Date.now()}`,
      email:      form.adminEmail,
      role:       'admin',
      name:       form.adminName,
      initials:   form.adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      dept:       form.adminTitle || 'Administration',
      hospitalId: hospitalId,
    };

    setSubmitting(false);

    if (form.tier === 'pro') {
      /* Pro plan: pass data up — App.jsx will route to PaymentPage */
      onComplete({ ...form, hospitalId, adminUser, hospital: newHospital });
      return;
    }

    /* Free trial: activate immediately */
    setTenant(newHospital);
    quickLogin(adminUser);
    setDone(true);
  };

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="auth-root" style={{ background: 'var(--bg)' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '40px 24px',
          textAlign: 'center', maxWidth: 480, margin: '0 auto',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--success), #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(5,150,105,.25)',
          }}>
            <IcCheckCircle width={34} height={34} style={{ color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 12, letterSpacing: '-.025em' }}>
            {form.name} is Live!
          </h1>
          <p style={{ fontSize: '.9rem', color: 'var(--text-500)', lineHeight: 1.7, marginBottom: 28 }}>
            Your hospital has been successfully registered on MediBank Nexus.
            You are now logged in as the hospital administrator.
          </p>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', padding: '16px 20px',
            width: '100%', textAlign: 'left', marginBottom: 28,
          }}>
            {[
              ['Next: Invite your staff from Staff Management', 'var(--primary)'],
              ['Configure hospital settings & branding', 'var(--teal)'],
              ['Start registering patients', 'var(--success)'],
            ].map(([text, color]) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', fontSize: '.83rem', color: 'var(--text-700)' }}>
                <IcCheckCircle width={13} height={13} style={{ color, flexShrink: 0 }} />
                {text}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={onComplete}>
            Enter Dashboard <IcArrowRight width={15} height={15} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Wizard ── */
  const isLastStep = step === STEPS.length;

  return (
    <div className="auth-root">
      {/* ════════════════════════════
          LEFT — HERO PANEL
      ════════════════════════════ */}
      <div className="auth-hero-panel">
        <div className="auth-hero-grid" />
        <div className="auth-hero-content">
          <div className="auth-logo anim-fade-up">
            <div className="auth-logo-icon">
              <IcHospital width={22} height={22} />
            </div>
            MediBank Nexus
          </div>

          <h1 className="auth-hero-headline anim-fade-up anim-d1">
            Register Your<br />
            <span className="auth-hero-dim">Hospital on</span><br />
            Nexus
          </h1>

          <p className="auth-hero-desc anim-fade-up anim-d2">
            Onboard your facility in under 5 minutes.
            Your staff and patients will be operational today.
          </p>

          {/* Step progress on hero */}
          <div className="anim-fade-up anim-d3" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {STEPS.map(s => {
              const done   = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: done ? 'var(--success)' : active ? 'white' : 'rgba(255,255,255,.15)',
                    border: `2px solid ${done ? 'var(--success)' : active ? 'white' : 'rgba(255,255,255,.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: done ? 'white' : active ? 'var(--primary)' : 'rgba(255,255,255,.5)',
                    fontSize: '.72rem', fontWeight: 700,
                  }}>
                    {done ? <IcCheckCircle width={13} height={13} /> : s.id}
                  </div>
                  <span style={{
                    fontSize: '.82rem', fontWeight: active ? 700 : 400,
                    color: active ? 'white' : done ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.45)',
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="auth-hero-footer anim-fade-up anim-d4">
          {[
            [<IcShield width={12} height={12} />, 'NDPR Compliant',   'All data stays in Nigeria'],
            [<IcCPU    width={12} height={12} />, 'AI-Powered',       'Nexus AI for every role'],
            [<IcPeople width={12} height={12} />, 'Multi-Role Access','Nurse, Doctor, Pharmacist'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="auth-feature-row">
              <div className="auth-feature-check">{icon}</div>
              <span><strong>{title}</strong> — {desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════
          RIGHT — FORM PANEL
      ════════════════════════════ */}
      <div className="auth-form-panel">
        <div ref={topRef} className="auth-form-box anim-fade-up">

          <div className="auth-form-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              {/* Step progress pills */}
              {STEPS.map(s => (
                <div
                  key={s.id}
                  style={{
                    height: 4, flex: 1, borderRadius: 9999,
                    background: step > s.id ? 'var(--success)' : step === s.id ? 'var(--primary)' : 'var(--border)',
                    transition: 'background var(--t)',
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: '.72rem', color: 'var(--text-400)', marginTop: 8, marginBottom: 12 }}>
              Step {step} of {STEPS.length} — {STEPS[step - 1].label}
            </p>
            <h2 className="auth-form-title">
              {step === 1 && 'Hospital Information'}
              {step === 2 && 'Administrator Account'}
              {step === 3 && 'Choose a Plan'}
              {step === 4 && 'Review & Launch'}
            </h2>
            <p className="auth-form-sub">
              {step === 1 && 'Tell us about your facility'}
              {step === 2 && 'The first admin account for your hospital'}
              {step === 3 && 'Pick the right plan — you can change anytime'}
              {step === 4 && "Everything looks good? Let's go live."}
            </p>
          </div>

          <div className="auth-card" style={{ overflowY: 'auto', maxHeight: '55vh' }}>
            {step === 1 && <StepHospitalInfo   data={form} onChange={patch} errors={errors} />}
            {step === 2 && <StepAdminAccount   data={form} onChange={patch} errors={errors} />}
            {step === 3 && <StepChoosePlan     data={form} onChange={patch} />}
            {step === 4 && <StepReview         data={form} />}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {step > 1 && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center', padding: '11px' }}
                onClick={back}
                disabled={submitting}
              >
                <IcArrowLeft width={14} height={14} /> Back
              </button>
            )}
            {!isLastStep ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center', padding: '11px' }}
                onClick={next}
              >
                Continue <IcArrowRight width={14} height={14} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center', padding: '11px' }}
                onClick={handleLaunch}
                disabled={submitting}
              >
                {submitting
                  ? <><div className="btn-spinner" /> Launching…</>
                  : <><IcCheckCircle width={15} height={15} /> Launch Hospital</>
                }
              </button>
            )}
          </div>

          <p className="auth-footer-note">
            Already have an account?{' '}
            <span
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={onComplete}
            >
              Sign in instead
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
