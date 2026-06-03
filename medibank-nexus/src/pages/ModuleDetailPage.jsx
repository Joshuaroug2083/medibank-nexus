/**
 * ModuleDetailPage
 * Reached from footer "Modules" links — explains each platform module in depth.
 * moduleKey: 'patient-registration' | 'doctor-consultation' | 'pharmacy' | 'appointments' | 'analytics'
 */
import {
  IcHospital, IcArrowLeft, IcCheckCircle, IcArrowRight,
  IcPersonAdd, IcStethoscope, IcPill, IcCalendar, IcBarChart,
  IcShield, IcCPU, IcPeople, IcSearch, IcBell, IcFileMedical,
  IcPerson, IcPhone,
} from '../components/Icons';

/* ── Module content data ─────────────────────────────────── */
const MODULES = {
  'patient-registration': {
    icon:     <IcPersonAdd  width={32} height={32} />,
    color:    'var(--primary)',
    bg:       'var(--primary-light)',
    title:    'Patient Registration',
    subtitle: 'Fast, paperless patient intake with a complete digital record from the first visit.',
    overview: `Patient Registration is the front door of the MediBank Nexus platform. It replaces paper forms, handwritten ledgers, and slow manual lookups with an instant digital workflow that gives every patient a unique ID, a complete health record, and a searchable profile — from the moment they walk into your facility.`,
    features: [
      {
        title:  'Instant Patient ID Generation',
        desc:   'Every registered patient receives a unique, scannable patient ID (e.g. PAT-2025-0001) automatically. No duplicates, no gaps — ID is tied to the hospital and persists across visits.',
      },
      {
        title:  'Comprehensive Intake Form',
        desc:   'Capture full demographics, contact details, next-of-kin, emergency contacts, blood group, genotype, known allergies, and insurance information in a single structured form.',
      },
      {
        title:  'NHIS / HMO Integration',
        desc:   'Record the patient\'s health insurance scheme, policy number, and HMO provider. Integrates with NHIS claim workflows on the Pro and Custom plans.',
      },
      {
        title:  'Smart Duplicate Detection',
        desc:   'The system flags potential duplicate registrations based on name, date of birth, and phone number, preventing the same patient from having two separate records.',
      },
      {
        title:  'Instant Search & Lookup',
        desc:   'Any staff member can search by patient name, ID, phone number, or date of birth to retrieve a patient record in under a second.',
      },
      {
        title:  'Medical History Timeline',
        desc:   'The patient profile automatically aggregates every visit, diagnosis, prescription, lab result, and vital reading into a chronological health timeline.',
      },
      {
        title:  'Consent Management',
        desc:   'Digital consent forms are captured and timestamped at registration. NDPR-compliant consent trails are stored with every patient record.',
      },
      {
        title:  'Offline Support',
        desc:   'Registration works on low connectivity and syncs automatically when the network is restored — critical for Nigerian healthcare settings.',
      },
    ],
    workflow: [
      'Patient arrives at the front desk',
      'Nurse opens Registration and searches for existing record',
      'If new: completes intake form (2–3 minutes)',
      'Patient ID card is printed or sent via SMS',
      'Doctor receives notification of waiting patient',
      'Patient record is immediately available to all departments',
    ],
    stats: [
      { value: '< 3 min', label: 'Average registration time' },
      { value: '100%',    label: 'Digital — no paper forms' },
      { value: '99.9%',   label: 'ID uniqueness guarantee' },
      { value: '0',       label: 'Lost records with Nexus' },
    ],
    roles: ['Nurse / Front Desk', 'Admin'],
  },

  'doctor-consultation': {
    icon:     <IcStethoscope width={32} height={32} />,
    color:    'var(--teal)',
    bg:       'var(--teal-light)',
    title:    'Doctor Consultation',
    subtitle: 'Structured clinical documentation with AI-assisted SOAP notes and instant prescriptions.',
    overview: `The Doctor Consultation module is the clinical heart of MediBank Nexus. It gives doctors a fast, structured workspace to record patient encounters, document diagnoses, issue prescriptions, and request lab investigations — with Nexus AI generating summaries, suggesting ICD-10 codes, and flagging drug interactions in real time.`,
    features: [
      {
        title:  'AI-Assisted SOAP Notes',
        desc:   'Nexus AI listens to the doctor\'s brief clinical notes and generates a full SOAP (Subjective, Objective, Assessment, Plan) summary. Save up to 20 minutes per consultation.',
      },
      {
        title:  'ICD-10 Diagnosis Coding',
        desc:   'Search and assign ICD-10 codes to diagnoses with auto-suggest. Supports Nigerian common diagnoses including malaria, typhoid, hypertension, and diabetes with local context.',
      },
      {
        title:  'Vital Signs Recording',
        desc:   'Record blood pressure, pulse rate, temperature, SpO₂, respiratory rate, weight, and height. Trends are automatically graphed across visits.',
      },
      {
        title:  'Digital Prescription Writing',
        desc:   'Issue prescriptions with drug name, dosage, frequency, duration, and route. Prescriptions are instantly sent to the pharmacy queue with no paper slip.',
      },
      {
        title:  'Drug Interaction Alerts',
        desc:   'Nexus AI checks every new prescription against the patient\'s existing medications and flags dangerous interactions before the prescription is finalised.',
      },
      {
        title:  'Lab Order Requests',
        desc:   'Order blood tests, urine analysis, imaging, and other investigations directly from the consultation. Lab receives the request instantly and results flow back to the doctor.',
      },
      {
        title:  'Patient History Access',
        desc:   'View the patient\'s complete visit history, past diagnoses, previous prescriptions, and all lab results from a single panel during the consultation.',
      },
      {
        title:  'Referral Generation',
        desc:   'Generate referral letters to specialists or other facilities. The referral includes relevant history, current diagnosis, and doctor notes.',
      },
    ],
    workflow: [
      'Nurse triages patient and records vitals',
      'Doctor opens the consultation for the assigned patient',
      'Reviews patient history and today\'s vitals',
      'Conducts examination, dictates or types clinical notes',
      'Nexus AI generates structured SOAP summary for review',
      'Doctor confirms diagnosis, assigns ICD-10 code',
      'Issues digital prescription — sent instantly to pharmacy',
      'Orders any required lab investigations',
      'Consultation is saved and patient is discharged or admitted',
    ],
    stats: [
      { value: '20 min', label: 'Saved per consultation with AI' },
      { value: '< 5 sec', label: 'Prescription reaches pharmacy' },
      { value: '100%',   label: 'Prescriptions checked for interactions' },
      { value: '0',      label: 'Lost prescriptions' },
    ],
    roles: ['Doctor / Consultant'],
  },

  'pharmacy': {
    icon:     <IcPill width={32} height={32} />,
    color:    '#d97706',
    bg:       '#fffbeb',
    title:    'Pharmacy & Rx Queue',
    subtitle: 'Real-time prescription dispensing with stock management and allergy safety checks.',
    overview: `The Pharmacy module transforms the dispensing workflow from a paper-based, error-prone process into a real-time, auditable digital system. Pharmacists see every prescription the moment a doctor issues it, can verify stock, check for allergies, and confirm dispensing — all from a single dashboard. The drug formulary keeps inventory accurate so stock-outs never come as a surprise.`,
    features: [
      {
        title:  'Live Rx Queue',
        desc:   'Every prescription issued by any doctor in the facility appears in the pharmacist\'s queue instantly — no paper slips, no lost prescriptions, no waiting.',
      },
      {
        title:  'Allergy & Interaction Check',
        desc:   'Before dispensing, the system cross-checks the prescribed drug against the patient\'s recorded allergies and current medications. The pharmacist is alerted before any dispensing error occurs.',
      },
      {
        title:  'Drug Formulary Management',
        desc:   'Maintain a complete catalog of all drugs stocked at your facility with unit prices, stock levels, reorder thresholds, and drug categories. Supports 20+ categories from Analgesics to Vaccines.',
      },
      {
        title:  'Stock Level Tracking',
        desc:   'Stock is automatically decremented when a prescription is dispensed. Visual indicators show in-stock, low stock, and out-of-stock status for every drug at a glance.',
      },
      {
        title:  'Reorder Alerts',
        desc:   'When stock falls below the reorder level, the pharmacist and admin receive automatic notifications. The dashboard shows a "Low Stock" and "Out of Stock" count at all times.',
      },
      {
        title:  'Dispensing Confirmation',
        desc:   'Each dispensed prescription is logged with timestamp, pharmacist ID, and quantity. Creates a full audit trail for regulatory compliance.',
      },
      {
        title:  'Patient Counselling Notes',
        desc:   'Add dispensing notes and patient counselling instructions to each prescription before handing over — printed or sent via SMS to the patient.',
      },
      {
        title:  'Pricing & Billing Integration',
        desc:   'Unit prices from the formulary are automatically carried into the billing module, ensuring patients are charged accurately without manual price entry.',
      },
    ],
    workflow: [
      'Doctor issues prescription from consultation module',
      'Prescription appears in pharmacist\'s Rx queue immediately',
      'Pharmacist reviews: checks drug, dose, patient allergies',
      'System flags any allergy or interaction — pharmacist resolves',
      'Pharmacist confirms stock is available',
      'Drug is dispensed and marked as complete',
      'Stock is decremented automatically',
      'Billing is updated with dispensed drug and price',
    ],
    stats: [
      { value: '0 sec',  label: 'Delay from prescription to queue' },
      { value: '100%',   label: 'Prescriptions allergy-checked' },
      { value: '2',      label: 'Dangerous errors caught in first month (customer data)' },
      { value: 'Real-time', label: 'Stock level accuracy' },
    ],
    roles: ['Pharmacist', 'Admin'],
  },

  'appointments': {
    icon:     <IcCalendar width={32} height={32} />,
    color:    'var(--success)',
    bg:       'var(--success-light)',
    title:    'Appointments',
    subtitle: 'Intelligent scheduling with automated reminders and a no-show reduction engine.',
    overview: `The Appointments module gives every member of the care team — and patients themselves — a clear view of the facility's schedule. It eliminates double-bookings, automates appointment reminders via SMS and in-app notifications, and gives admins real-time visibility into attendance and utilisation rates.`,
    features: [
      {
        title:  'Drag-and-Drop Scheduling',
        desc:   'Book, reschedule, or cancel appointments with an intuitive calendar interface. Slots are colour-coded by doctor, department, and appointment type.',
      },
      {
        title:  'Doctor Availability Management',
        desc:   'Each doctor configures their working hours, consultation slot duration, and lunch break. The system only shows available slots to prevent double-booking.',
      },
      {
        title:  'Automated SMS & In-App Reminders',
        desc:   'Patients receive automatic reminders 24 hours and 1 hour before their appointment — via both in-app notification and SMS (on Pro plan). Reduces no-shows by up to 35%.',
      },
      {
        title:  'Walk-In Queue Management',
        desc:   'Manage walk-in patients alongside scheduled appointments. Nurses can add walk-ins to the queue and estimate wait times.',
      },
      {
        title:  'Appointment Types',
        desc:   'Categorise appointments by type: New Patient, Follow-Up, Procedure, Specialist Referral, Lab Visit. Each type has configurable duration.',
      },
      {
        title:  'Patient Self-Booking (Pro)',
        desc:   'Patients can view available slots and book appointments themselves through the Patient Portal — reducing phone call volume at the front desk.',
      },
      {
        title:  'Multi-Doctor Calendar',
        desc:   'Admin can view all doctors\' schedules simultaneously and identify gaps in utilisation, enabling better resource planning.',
      },
      {
        title:  'No-Show Tracking',
        desc:   'All no-shows are recorded and flagged. The system identifies repeat no-show patients and can trigger a follow-up communication automatically.',
      },
    ],
    workflow: [
      'Patient calls or walks in requesting an appointment',
      'Nurse or admin opens appointment booking',
      'Selects doctor, date, appointment type',
      'System shows available slots — prevents double-booking',
      'Appointment booked and patient receives confirmation SMS',
      'Automatic reminder sent 24h before',
      'Final reminder sent 1h before',
      'Doctor sees the day\'s schedule on their dashboard',
    ],
    stats: [
      { value: '35%',    label: 'Reduction in no-shows with reminders' },
      { value: '0',      label: 'Double-bookings with Nexus' },
      { value: '24h',    label: 'Advance reminder sent automatically' },
      { value: 'All',    label: 'Appointments tracked and auditable' },
    ],
    roles: ['Nurse', 'Admin', 'Patient (self-booking)'],
  },

  'analytics': {
    icon:     <IcBarChart width={32} height={32} />,
    color:    '#7c3aed',
    bg:       '#f5f3ff',
    title:    'Analytics Dashboard',
    subtitle: 'Real-time KPIs, revenue tracking, and operational intelligence for healthcare administrators.',
    overview: `The Analytics module turns the data generated by every patient visit, prescription, appointment, and billing event into actionable intelligence. Hospital administrators and medical directors get a live view of patient volumes, revenue, staff performance, inventory status, and compliance metrics — without needing a data analyst or a spreadsheet.`,
    features: [
      {
        title:  'Real-Time Revenue Dashboard',
        desc:   'Track daily, weekly, and monthly revenue from consultations, prescriptions, and lab fees. Revenue trend charts show growth over time with period-over-period comparison.',
      },
      {
        title:  'Patient Volume Metrics',
        desc:   'Monitor new registrations, returning patients, walk-ins vs. appointments, department utilisation, and patient demographics — all updated in real time.',
      },
      {
        title:  'Staff Performance Reports',
        desc:   'See consultation counts, average consultation time, prescription volume, and no-show rates per doctor. Identify top performers and departments under strain.',
      },
      {
        title:  'Pharmacy Analytics',
        desc:   'Track dispensing volume, top dispensed drugs, stock consumption rates, and revenue contribution from the pharmacy. Identify drugs nearing reorder levels before stock-out.',
      },
      {
        title:  'Appointment Utilisation',
        desc:   'Measure slot utilisation per doctor, peak hours, no-show rates, and cancellation trends. Optimise scheduling by identifying underutilised slots.',
      },
      {
        title:  'Financial Reports & Export',
        desc:   'Export patient records, invoice data, appointment logs, and audit trails as CSV files for financial reporting, NHIS claims, and regulatory submissions.',
      },
      {
        title:  'NDPR Compliance Metrics',
        desc:   'Track consent rates, data access logs, retention compliance, and audit events. Generates compliance reports required under the Nigerian Data Protection Regulation.',
      },
      {
        title:  'Custom Date Range Filters',
        desc:   'Filter all analytics by any custom date range — today, this week, this month, this year, or a specific period. Perfect for monthly board reports.',
      },
    ],
    workflow: [
      'Admin logs into the Analytics dashboard',
      'Sees today\'s KPIs on the overview cards',
      'Drills into revenue chart — compares to last month',
      'Checks staff performance — identifies a doctor with high no-show rate',
      'Reviews pharmacy stock alerts — 2 drugs need reordering',
      'Exports monthly invoice CSV for the finance team',
      'Downloads NDPR compliance report for the board',
    ],
    stats: [
      { value: 'Real-time', label: 'KPI updates — no manual refresh' },
      { value: '40%',       label: 'Time saved on monthly reporting' },
      { value: '100%',      label: 'Audit trail coverage across all modules' },
      { value: '1-click',   label: 'CSV export for NHIS, NDPR, finance' },
    ],
    roles: ['Admin', 'Medical Director'],
  },
};

/* ── Shared nav wrapper ────────────────────────────────────── */
function PageNav({ onBack, onGetStarted }) {
  return (
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
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={onGetStarted}>Sign In</button>
        <button className="btn btn-primary btn-sm" onClick={onGetStarted}>
          Get Started <IcArrowRight width={12} height={12} />
        </button>
      </div>
    </nav>
  );
}

export default function ModuleDetailPage({ moduleKey, onBack, onGetStarted }) {
  const m = MODULES[moduleKey];
  if (!m) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <PageNav onBack={onBack} onGetStarted={onGetStarted} />

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${m.color}, var(--primary-dark))`,
        color: 'white', padding: 'clamp(48px,8vw,80px) clamp(20px,5vw,80px)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          {m.icon}
        </div>
        <div style={{
          display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)',
          fontSize: '.75rem', fontWeight: 700, marginBottom: 14, letterSpacing: '.04em',
        }}>
          PLATFORM MODULE
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 900, marginBottom: 16, letterSpacing: '-.03em' }}>
          {m.title}
        </h1>
        <p style={{ fontSize: 'clamp(.9rem,2vw,1.15rem)', opacity: .88, maxWidth: 600, margin: '0 auto 28px', lineHeight: 1.65 }}>
          {m.subtitle}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-2xl"
            style={{ background: 'white', color: m.color, fontWeight: 800 }}
            onClick={onGetStarted}
          >
            Start Free Trial <IcArrowRight width={15} height={15} />
          </button>
          <button
            className="btn btn-2xl"
            style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.3)' }}
            onClick={onBack}
          >
            View All Modules
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(32px,6vw,60px) clamp(16px,4vw,40px)' }}>

        {/* ── Stats strip ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
          gap: 14, marginBottom: 56,
        }}>
          {m.stats.map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)', padding: '20px 18px', textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-400)', marginTop: 6, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Overview ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 800, color: m.color,
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10,
          }}>
            Overview
          </div>
          <p style={{ fontSize: 'clamp(.9rem,1.5vw,1.05rem)', color: 'var(--text-700)', lineHeight: 1.8, maxWidth: 760 }}>
            {m.overview}
          </p>
        </div>

        {/* ── Features grid ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 800, color: m.color,
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10,
          }}>
            Key Features
          </div>
          <h2 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900, marginBottom: 28, color: 'var(--text-900)' }}>
            Everything you need, built in
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {m.features.map((f, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)', padding: '20px 22px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--radius)',
                  background: m.bg, color: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12, fontSize: '.88rem', fontWeight: 900,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text-900)', marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '.82rem', color: 'var(--text-500)', lineHeight: 1.65 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Workflow ── */}
        <div style={{
          background: 'white', borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border)', padding: 'clamp(24px,4vw,40px)',
          marginBottom: 56,
        }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 800, color: m.color,
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10,
          }}>
            How It Works
          </div>
          <h2 style={{ fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', fontWeight: 900, marginBottom: 28, color: 'var(--text-900)' }}>
            Step-by-step workflow
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {m.workflow.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: i < m.workflow.length - 1 ? 20 : 0 }}>
                {/* Step number + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: m.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '.78rem',
                  }}>
                    {i + 1}
                  </div>
                  {i < m.workflow.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 20, background: 'var(--border)', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: 6, fontSize: '.88rem', color: 'var(--text-700)', lineHeight: 1.6 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Roles ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 800, color: m.color,
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10,
          }}>
            Who Uses This
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {m.roles.map(role => (
              <div key={role} style={{
                padding: '6px 16px', borderRadius: 'var(--radius-full)',
                background: m.bg, color: m.color,
                border: `1px solid ${m.color}33`,
                fontSize: '.83rem', fontWeight: 700,
              }}>
                {role}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{
          background: `linear-gradient(135deg, ${m.color}, var(--teal))`,
          borderRadius: 'var(--radius-2xl)', padding: 'clamp(28px,5vw,48px)',
          textAlign: 'center', color: 'white',
        }}>
          <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', fontWeight: 900, marginBottom: 12 }}>
            Ready to activate {m.title}?
          </h2>
          <p style={{ opacity: .88, marginBottom: 24, fontSize: '.92rem', lineHeight: 1.65 }}>
            Start your free 30-day trial. No payment required. All modules included.
          </p>
          <button
            className="btn btn-2xl"
            style={{ background: 'white', color: m.color, fontWeight: 800 }}
            onClick={onGetStarted}
          >
            Start Free Trial <IcArrowRight width={15} height={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
