{
  "name": "MediBank Nexus",
  "short_name": "Nexus",
  "description": "Healthcare Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": []
}/**
 * Step 7 — Patient Registration
 * 5-step wizard: Personal → Medical → Emergency → Insurance → Review & Submit
 */

import { useState } from 'react';
import { useToast }  from '../components/Toast';
import { useAppCtx } from '../context/AppContext';
import { api }       from '../lib/api';
import StepsBar      from '../components/StepsBar';
import Alert         from '../components/Alert';
import {
  IcPerson, IcHeartPulse, IcPhone, IcShield,
  IcCheckCircle, IcArrowRight, IcArrowLeft,
  IcWarning, IcFileMedical,
} from '../components/Icons';

/* ── constants ─────────────────────────────────────────── */
const STEPS = ['Personal', 'Medical', 'Emergency', 'Insurance', 'Review'];

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa',
  'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger',
  'Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe',
  'Zamfara','FCT Abuja',
];

const BLOOD_GROUPS  = ['A+','A−','B+','B−','AB+','AB−','O+','O−','Unknown'];
const GENOTYPES     = ['AA','AS','SS','AC','SC','Unknown'];
const ALLERGY_OPTS  = ['Penicillin','Aspirin','Ibuprofen','Sulfa drugs','Latex','Peanuts','Shellfish','Eggs','None known'];
const CONDITION_OPTS= ['Diabetes','Hypertension','Asthma','Sickle Cell','HIV/AIDS','Epilepsy','Heart Disease','Kidney Disease','None'];
const INSURANCE_PROVIDERS = ['NHIS','Leadway Assurance','Hygeia HMO','Reliance HMO','AXA Mansard','Total Health Trust','Redcare HMO','No Insurance'];

/* ── helpers ─────────────────────────────────────────────── */
const genPatientId = () => {
  /* Temporary display ID shown in the wizard — replaced by server-assigned ID on success */
  const yr  = new Date().getFullYear();
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `PT-${yr}-${rnd}`;
};

const empty = {
  /* Step 1 */
  firstName:'', lastName:'', dob:'', gender:'', phone:'', altPhone:'',
  email:'', nin:'', address:'', state:'', lga:'',
  /* Step 2 */
  bloodGroup:'', genotype:'', height:'', weight:'',
  allergies:[], conditions:[], surgeries:'', medications:'',
  /* Step 3 */
  ecName:'', ecRelation:'', ecPhone:'', ecAltPhone:'',
  /* Step 4 */
  insuranceProvider:'', insuranceNumber:'', insurancePlan:'',
  /* Meta */
  patientId: genPatientId(),
};

/* ── field components ────────────────────────────────────── */
function Field({ label, required, error, hint, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span className="required">*</span>}
      </label>
      {children}
      {hint  && !error && <div className="form-hint">{hint}</div>}
      {error && (
        <div className="form-error">
          <IcWarning width={12} height={12} />{error}
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, ...rest }) {
  return (
    <input
      className="input"
      value={value}
      onChange={e => onChange(e.target.value)}
      {...rest}
    />
  );
}

function Select({ value, onChange, options, placeholder = 'Select…', ...rest }) {
  return (
    <select
      className="select"
      value={value}
      onChange={e => onChange(e.target.value)}
      {...rest}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
}

function CheckGroup({ options, value = [], onChange, cols = 3 }) {
  const toggle = (opt) => {
    const next = value.includes(opt)
      ? value.filter(v => v !== opt)
      : [...value, opt];
    onChange(next);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 7 }}>
      {options.map(opt => (
        <label
          key={opt}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 10px',
            border: `1px solid ${value.includes(opt) ? 'var(--primary)' : 'var(--border-dark)'}`,
            borderRadius: 'var(--radius)',
            background: value.includes(opt) ? 'var(--primary-light)' : 'white',
            cursor: 'pointer', fontSize: '.82rem', fontWeight: value.includes(opt) ? 700 : 500,
            color: value.includes(opt) ? 'var(--primary)' : 'var(--text-700)',
            transition: 'all .12s',
          }}
        >
          <input
            type="checkbox"
            checked={value.includes(opt)}
            onChange={() => toggle(opt)}
            style={{ accentColor: 'var(--primary)', width: 14, height: 14, flexShrink: 0 }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

/* ── STEP 1 — Personal Info ─────────────────────────────── */
function Step1({ data, update, errors }) {
  return (
    <div>
      <div className="reg-step-header">
        <div className="reg-step-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <IcPerson width={20} height={20} />
        </div>
        <div>
          <div className="reg-step-title">Personal Information</div>
          <div className="reg-step-sub">Basic demographic and contact details</div>
        </div>
      </div>

      <div className="form-row">
        <Field label="First Name" required error={errors.firstName}>
          <Input value={data.firstName} onChange={v => update('firstName', v)} placeholder="e.g. Emeka" />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <Input value={data.lastName}  onChange={v => update('lastName',  v)} placeholder="e.g. Obi" />
        </Field>
      </div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <Field label="Date of Birth" required error={errors.dob}>
          <Input type="date" value={data.dob} onChange={v => update('dob', v)} max={new Date().toISOString().split('T')[0]} />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <Select
            value={data.gender} onChange={v => update('gender', v)}
            options={['Male','Female','Other','Prefer not to say']}
          />
        </Field>
      </div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <Field label="Phone Number" required error={errors.phone} hint="Nigerian mobile number">
          <div className="input-wrap">
            <span className="input-prefix-text">+234</span>
            <Input
              value={data.phone} onChange={v => update('phone', v.replace(/\D/g, '').slice(0, 10))}
              placeholder="8012345678" style={{ paddingLeft: 52 }}
            />
          </div>
        </Field>
        <Field label="Alternate Phone" hint="Optional">
          <div className="input-wrap">
            <span className="input-prefix-text">+234</span>
            <Input
              value={data.altPhone} onChange={v => update('altPhone', v.replace(/\D/g, '').slice(0, 10))}
              placeholder="8012345678" style={{ paddingLeft: 52 }}
            />
          </div>
        </Field>
      </div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <Field label="Email Address" hint="Optional — for appointment reminders">
          <Input type="email" value={data.email} onChange={v => update('email', v)} placeholder="patient@example.com" />
        </Field>
        <Field label="NIN (National ID)" hint="11-digit National Identity Number">
          <Input
            value={data.nin} onChange={v => update('nin', v.replace(/\D/g, '').slice(0, 11))}
            placeholder="12345678901" maxLength={11}
          />
        </Field>
      </div>

      <div style={{ marginTop: 14 }}>
        <Field label="Home Address" required error={errors.address}>
          <textarea
            className="textarea"
            value={data.address}
            onChange={e => update('address', e.target.value)}
            placeholder="Street address, area"
            rows={2}
            style={{ resize: 'none' }}
          />
        </Field>
      </div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <Field label="State" required error={errors.state}>
          <Select value={data.state} onChange={v => update('state', v)} options={NIGERIAN_STATES} />
        </Field>
        <Field label="LGA / City">
          <Input value={data.lga} onChange={v => update('lga', v)} placeholder="e.g. Surulere" />
        </Field>
      </div>
    </div>
  );
}

/* ── STEP 2 — Medical Info ──────────────────────────────── */
function Step2({ data, update, errors }) {
  return (
    <div>
      <div className="reg-step-header">
        <div className="reg-step-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
          <IcHeartPulse width={20} height={20} />
        </div>
        <div>
          <div className="reg-step-title">Medical History</div>
          <div className="reg-step-sub">Health background and current conditions</div>
        </div>
      </div>

      <div className="form-row">
        <Field label="Blood Group" required error={errors.bloodGroup}>
          <Select value={data.bloodGroup} onChange={v => update('bloodGroup', v)} options={BLOOD_GROUPS} />
        </Field>
        <Field label="Genotype" required error={errors.genotype}>
          <Select value={data.genotype}   onChange={v => update('genotype',   v)} options={GENOTYPES}    />
        </Field>
      </div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <Field label="Height (cm)" hint="e.g. 172">
          <Input type="number" value={data.height} onChange={v => update('height', v)} placeholder="cm" min={50} max={250} />
        </Field>
        <Field label="Weight (kg)" hint="e.g. 70">
          <Input type="number" value={data.weight} onChange={v => update('weight', v)} placeholder="kg" min={1}  max={300} />
        </Field>
      </div>

      <div style={{ marginTop: 18 }}>
        <Field label="Known Allergies" hint="Select all that apply">
          <CheckGroup options={ALLERGY_OPTS} value={data.allergies} onChange={v => update('allergies', v)} cols={3} />
        </Field>
      </div>

      {data.allergies.length > 0 && !data.allergies.includes('None known') && (
        <Alert type="warning" style={{ marginTop: 10 }}>
          <strong>Allergy flag:</strong> This patient will be flagged for{' '}
          {data.allergies.join(', ')} in all prescription modules.
        </Alert>
      )}

      <div style={{ marginTop: 18 }}>
        <Field label="Existing Conditions" hint="Select all that apply">
          <CheckGroup options={CONDITION_OPTS} value={data.conditions} onChange={v => update('conditions', v)} cols={3} />
        </Field>
      </div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <Field label="Past Surgeries / Procedures" hint="Brief description, or 'None'">
          <textarea
            className="textarea"
            value={data.surgeries}
            onChange={e => update('surgeries', e.target.value)}
            placeholder="e.g. Appendectomy 2019, Caesarean 2021"
            rows={2}
            style={{ resize: 'none' }}
          />
        </Field>
        <Field label="Current Medications" hint="Name and dosage, or 'None'">
          <textarea
            className="textarea"
            value={data.medications}
            onChange={e => update('medications', e.target.value)}
            placeholder="e.g. Metformin 500mg daily"
            rows={2}
            style={{ resize: 'none' }}
          />
        </Field>
      </div>
    </div>
  );
}

/* ── STEP 3 — Emergency Contact ─────────────────────────── */
function Step3({ data, update, errors }) {
  return (
    <div>
      <div className="reg-step-header">
        <div className="reg-step-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
          <IcPhone width={20} height={20} />
        </div>
        <div>
          <div className="reg-step-title">Emergency Contact</div>
          <div className="reg-step-sub">Person to contact in case of emergency</div>
        </div>
      </div>

      <Alert type="info" style={{ marginBottom: 20 }}>
        This contact will be notified for critical medical decisions if the patient is unable to communicate.
      </Alert>

      <div className="form-row">
        <Field label="Contact Full Name" required error={errors.ecName}>
          <Input value={data.ecName}     onChange={v => update('ecName',     v)} placeholder="e.g. Ngozi Obi" />
        </Field>
        <Field label="Relationship" required error={errors.ecRelation}>
          <Select
            value={data.ecRelation} onChange={v => update('ecRelation', v)}
            options={['Spouse','Parent','Child','Sibling','Relative','Friend','Guardian','Other']}
          />
        </Field>
      </div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <Field label="Primary Phone" required error={errors.ecPhone}>
          <div className="input-wrap">
            <span className="input-prefix-text">+234</span>
            <Input
              value={data.ecPhone} onChange={v => update('ecPhone', v.replace(/\D/g, '').slice(0, 10))}
              placeholder="8012345678" style={{ paddingLeft: 52 }}
            />
          </div>
        </Field>
        <Field label="Alternate Phone" hint="Optional">
          <div className="input-wrap">
            <span className="input-prefix-text">+234</span>
            <Input
              value={data.ecAltPhone} onChange={v => update('ecAltPhone', v.replace(/\D/g, '').slice(0, 10))}
              placeholder="8012345678" style={{ paddingLeft: 52 }}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

/* ── STEP 4 — Insurance ─────────────────────────────────── */
function Step4({ data, update }) {
  const hasInsurance = data.insuranceProvider && data.insuranceProvider !== 'No Insurance';
  return (
    <div>
      <div className="reg-step-header">
        <div className="reg-step-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
          <IcShield width={20} height={20} />
        </div>
        <div>
          <div className="reg-step-title">Insurance Details</div>
          <div className="reg-step-sub">Health insurance and coverage information</div>
        </div>
      </div>

      <Field label="Insurance Provider">
        <Select
          value={data.insuranceProvider}
          onChange={v => update('insuranceProvider', v)}
          options={INSURANCE_PROVIDERS}
        />
      </Field>

      {data.insuranceProvider === 'No Insurance' && (
        <Alert type="warning" style={{ marginTop: 14 }}>
          Patient has no health insurance. All services will be billed directly (out-of-pocket).
        </Alert>
      )}

      {hasInsurance && (
        <div className="form-row" style={{ marginTop: 14 }}>
          <Field label="Insurance Number / ID" hint="As shown on your insurance card">
            <Input value={data.insuranceNumber} onChange={v => update('insuranceNumber', v)} placeholder="e.g. NHIS-2026-00123" />
          </Field>
          <Field label="Plan / Package" hint="e.g. Standard, Premium, Family">
            <Input value={data.insurancePlan} onChange={v => update('insurancePlan', v)} placeholder="e.g. Standard" />
          </Field>
        </div>
      )}

      {!data.insuranceProvider && (
        <Alert type="info" style={{ marginTop: 14 }}>
          Select a provider above to enter insurance details, or choose "No Insurance".
        </Alert>
      )}
    </div>
  );
}

/* ── STEP 5 — Review ─────────────────────────────────────── */
function ReviewRow({ label, value, danger }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className={`review-value${danger ? ' review-danger' : ''}`}>{value || '—'}</span>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="review-section">
      <div className="review-section-title">{title}</div>
      {children}
    </div>
  );
}

function Step5({ data }) {
  const age = data.dob
    ? Math.floor((Date.now() - new Date(data.dob)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div>
      <div className="reg-step-header">
        <div className="reg-step-icon" style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}>
          <IcFileMedical width={20} height={20} />
        </div>
        <div>
          <div className="reg-step-title">Review & Confirm</div>
          <div className="reg-step-sub">Verify all details before creating the record</div>
        </div>
      </div>

      {/* Patient ID banner */}
      <div className="patient-id-banner">
        <div>
          <div style={{ fontSize: '.72rem', opacity: .75, marginBottom: 3 }}>Patient ID (auto-generated)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '.04em', fontFamily: 'var(--font-mono)' }}>
            {data.patientId}
          </div>
        </div>
        <IcCheckCircle width={28} height={28} style={{ opacity: .8 }} />
      </div>

      <ReviewSection title="Personal Information">
        <ReviewRow label="Full Name"     value={`${data.firstName} ${data.lastName}`} />
        <ReviewRow label="Date of Birth" value={data.dob ? `${data.dob}${age ? ` (${age} yrs)` : ''}` : ''} />
        <ReviewRow label="Gender"        value={data.gender} />
        <ReviewRow label="Phone"         value={data.phone ? `+234 ${data.phone}` : ''} />
        <ReviewRow label="Email"         value={data.email} />
        <ReviewRow label="NIN"           value={data.nin} />
        <ReviewRow label="State"         value={`${data.lga ? data.lga + ', ' : ''}${data.state}`} />
        <ReviewRow label="Address"       value={data.address} />
      </ReviewSection>

      <ReviewSection title="Medical History">
        <ReviewRow label="Blood Group" value={data.bloodGroup} />
        <ReviewRow label="Genotype"    value={data.genotype}   />
        {data.height && <ReviewRow label="Height / Weight" value={`${data.height} cm / ${data.weight || '—'} kg`} />}
        <ReviewRow
          label="Allergies"
          value={data.allergies.length ? data.allergies.join(', ') : 'None recorded'}
          danger={data.allergies.length > 0 && !data.allergies.includes('None known')}
        />
        <ReviewRow
          label="Conditions"
          value={data.conditions.length ? data.conditions.join(', ') : 'None recorded'}
        />
        {data.surgeries   && <ReviewRow label="Past Surgeries" value={data.surgeries}   />}
        {data.medications && <ReviewRow label="Medications"    value={data.medications} />}
      </ReviewSection>

      <ReviewSection title="Emergency Contact">
        <ReviewRow label="Name"         value={`${data.ecName} (${data.ecRelation})`} />
        <ReviewRow label="Phone"        value={data.ecPhone ? `+234 ${data.ecPhone}` : ''} />
      </ReviewSection>

      <ReviewSection title="Insurance">
        <ReviewRow label="Provider" value={data.insuranceProvider || 'Not provided'} />
        {data.insuranceNumber && <ReviewRow label="Policy No." value={data.insuranceNumber} />}
        {data.insurancePlan   && <ReviewRow label="Plan"       value={data.insurancePlan}   />}
      </ReviewSection>
    </div>
  );
}

/* ── VALIDATION ─────────────────────────────────────────── */
function validate(step, data) {
  const e = {};
  if (step === 0) {
    if (!data.firstName.trim()) e.firstName = 'Required';
    if (!data.lastName.trim())  e.lastName  = 'Required';
    if (!data.dob)              e.dob       = 'Required';
    if (!data.gender)           e.gender    = 'Required';
    if (!data.phone || data.phone.length < 10) e.phone = 'Valid 10-digit phone required';
    if (!data.address.trim())   e.address   = 'Required';
    if (!data.state)            e.state     = 'Required';
  }
  if (step === 1) {
    if (!data.bloodGroup) e.bloodGroup = 'Required';
    if (!data.genotype)   e.genotype   = 'Required';
  }
  if (step === 2) {
    if (!data.ecName.trim())   e.ecName     = 'Required';
    if (!data.ecRelation)      e.ecRelation = 'Required';
    if (!data.ecPhone || data.ecPhone.length < 10) e.ecPhone = 'Valid 10-digit phone required';
  }
  return e;
}

/* ── MAIN COMPONENT ─────────────────────────────────────── */
export default function RegisterPage() {
  const toast           = useToast();
  const { navigate }    = useAppCtx();
  const [step,   setStep]   = useState(0);
  const [data,   setData]   = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading,setLoading]= useState(false);
  const [done,   setDone]   = useState(false);
  const [apiError, setApiError] = useState('');

  const update = (field, value) => {
    setData(d => ({ ...d, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const next = () => {
    const errs = validate(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setLoading(true);
    setApiError('');
    try {
      const result = await api.post('/api/v1/patients', {
        firstName:        data.firstName,
        lastName:         data.lastName,
        dob:              data.dob,
        gender:           data.gender,
        phone:            data.phone,
        altPhone:         data.altPhone,
        email:            data.email || undefined,
        nin:              data.nin   || undefined,
        address:          data.address,
        state:            data.state,
        lga:              data.lga   || undefined,
        bloodGroup:       data.bloodGroup,
        genotype:         data.genotype,
        height:           data.height   ? Number(data.height)   : undefined,
        weight:           data.weight   ? Number(data.weight)   : undefined,
        allergies:        data.allergies,
        conditions:       data.conditions,
        medications:      data.medications || undefined,
        surgeries:        data.surgeries   || undefined,
        insurance:        data.insuranceProvider || undefined,
        insNumber:        data.insuranceNumber   || undefined,
        insurancePlan:    data.insurancePlan     || undefined,
        ecName:           data.ecName,
        ecRelation:       data.ecRelation,
        ecPhone:          data.ecPhone,
        ecAltPhone:       data.ecAltPhone || undefined,
      });
      /* Use server-assigned patient ID */
      setData(d => ({ ...d, patientId: result.patient?.id ?? d.patientId }));
      setDone(true);
      toast.success(`Patient ${result.patient?.id} registered successfully!`, 'Registration Complete');
    } catch (err) {
      setApiError(err.message ?? 'Registration failed. Please try again.');
      toast.error(err.message ?? 'Registration failed', 'Error');
    } finally {
      setLoading(false);
    }
  };

  /* ── success screen ── */
  if (done) {
    return (
      <div className="reg-success anim-scale-in">
        <div className="reg-success-icon">
          <IcCheckCircle width={36} height={36} />
        </div>
        <h2 className="reg-success-title">Patient Registered!</h2>
        <p className="reg-success-sub">
          Record created successfully and is now available across all modules.
        </p>
        <div className="patient-id-banner" style={{ maxWidth: 360, margin: '20px auto' }}>
          <div>
            <div style={{ fontSize: '.72rem', opacity: .75, marginBottom: 3 }}>Patient ID</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '.04em', fontFamily: 'var(--font-mono)' }}>
              {data.patientId}
            </div>
          </div>
          <IcFileMedical width={24} height={24} style={{ opacity: .8 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => { setData({ ...empty, patientId: genPatientId() }); setStep(0); setDone(false); }}
          >
            <IcPerson width={14} height={14} /> Register Another
          </button>
          <button className="btn btn-outline" onClick={() => navigate('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── wizard ── */
  return (
    <div className="reg-page anim-fade-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Register <span>Patient</span></div>
          <div className="page-subtitle">Complete all steps to create a new patient record</div>
        </div>
        <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '.75rem' }}>
          {data.patientId}
        </span>
      </div>

      {/* Steps bar */}
      <StepsBar steps={STEPS} current={step} />

      {/* Card */}
      <div className="card" style={{ maxWidth: 740, margin: '0 auto' }}>
        {step === 0 && <Step1 data={data} update={update} errors={errors} />}
        {step === 1 && <Step2 data={data} update={update} errors={errors} />}
        {step === 2 && <Step3 data={data} update={update} errors={errors} />}
        {step === 3 && <Step4 data={data} update={update} />}
        {step === 4 && <Step5 data={data} />}

        {/* API error */}
        {apiError && step === 4 && (
          <Alert type="danger" style={{ marginTop: 16, marginBottom: 4 }}>
            {apiError}
          </Alert>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)',
        }}>
          <button
            className="btn btn-outline"
            onClick={back}
            disabled={step === 0}
          >
            <IcArrowLeft width={14} height={14} /> Back
          </button>

          <span style={{ fontSize: '.78rem', color: 'var(--text-400)' }}>
            Step {step + 1} of {STEPS.length}
          </span>

          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue <IcArrowRight width={14} height={14} />
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={submit}
              disabled={loading}
            >
              {loading
                ? <><div className="btn-spinner" /> Registering…</>
                : <><IcCheckCircle width={14} height={14} /> Register Patient</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
