/**
 * StaticPage — renders all product & company footer pages.
 * pageKey: 'about' | 'privacy' | 'ndpr' | 'changelog' | 'roadmap' | 'blog' | 'careers'
 */
import {
  IcHospital, IcArrowLeft, IcArrowRight, IcCheckCircle,
  IcShield, IcPeople, IcBarChart, IcCPU, IcPhone, IcMail, IcMapPin,
} from '../components/Icons';

/* ── Nav ─────────────────────────────────────────────────── */
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

function Hero({ title, subtitle, eyebrow }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--primary), var(--teal))',
      color: 'white', padding: 'clamp(48px,8vw,80px) clamp(20px,5vw,80px)',
      textAlign: 'center',
    }}>
      {eyebrow && (
        <div style={{
          display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)',
          fontSize: '.75rem', fontWeight: 700, marginBottom: 14, letterSpacing: '.04em',
        }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 900, marginBottom: 14, letterSpacing: '-.03em' }}>
        {title}
      </h1>
      <p style={{ fontSize: 'clamp(.88rem,2vw,1.05rem)', opacity: .88, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
        {subtitle}
      </p>
    </div>
  );
}

function Container({ children }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px,6vw,60px) clamp(16px,4vw,40px)' }}>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      {title && (
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-900)', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

const bodyText = { fontSize: '.9rem', color: 'var(--text-700)', lineHeight: 1.85 };

/* ══════════════════════════════════════════════════════════
   PAGE CONTENT
══════════════════════════════════════════════════════════ */

function AboutPage({ onGetStarted }) {
  return (
    <>
      <Hero
        eyebrow="OUR STORY"
        title="Building the digital backbone of African healthcare"
        subtitle="MediBank Nexus was born in a Lagos hospital where a doctor lost a patient's record between departments. We built the system we wish had existed."
      />
      <Container>
        <Section title="Our Mission">
          <p style={bodyText}>
            MediBank Nexus exists to eliminate preventable harm and inefficiency in Nigerian and African healthcare
            by replacing paper records, verbal handovers, and manual billing with a secure, connected, AI-powered
            platform that every member of the care team — from the front desk nurse to the medical director — can
            use from the first day.
          </p>
          <p style={{ ...bodyText, marginTop: 14 }}>
            We believe that every patient in Nigeria deserves the same quality of documentation and care coordination
            that patients in high-income countries take for granted. Technology should not be a luxury in healthcare.
          </p>
        </Section>

        <Section title="What We Built">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {[
              { icon: <IcPeople width={18} height={18} />, title: 'Multi-Role Platform', desc: 'One platform for nurses, doctors, pharmacists, lab scientists, admins, and patients.' },
              { icon: <IcShield width={18} height={18} />, title: 'NDPR Compliant', desc: 'Patient data protected under Nigeria\'s Data Protection Regulation with AES-256 encryption.' },
              { icon: <IcCPU    width={18} height={18} />, title: 'AI-Powered',       desc: 'Nexus AI assists with SOAP notes, drug interaction checks, and clinical summaries.' },
              { icon: <IcBarChart width={18} height={18} />, title: 'Built for Nigeria', desc: 'Designed around Nigerian workflows: NHIS, MDCN licensing, NGN pricing, and low-connectivity environments.' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)', padding: '18px 20px',
              }}>
                <div style={{ color: 'var(--primary)', marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text-900)', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: '.82rem', color: 'var(--text-500)', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="The Team">
          <p style={bodyText}>
            MediBank Nexus was founded by <strong>Joshua Redeem Ohiani Bankole</strong> — a developer with a
            passion for healthcare technology and a firsthand understanding of how broken paper-based systems
            affect patient outcomes in Nigerian hospitals.
          </p>
          <p style={{ ...bodyText, marginTop: 14 }}>
            The platform is built on modern, secure web technologies and is continuously developed with input
            from nurses, doctors, pharmacists, and hospital administrators across Lagos, Abuja, and Port Harcourt.
          </p>
        </Section>

        <Section title="Contact Us">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              [IcPhone,  '+234 800 MEDIBANK',         'General enquiries'],
              [IcMail,   'hello@medibanknexus.com',    'Email us anytime'],
              [IcMail,   'enterprise@medibanknexus.com','Enterprise / Custom plans'],
              [IcMapPin, 'Lagos · Abuja · Port Harcourt', 'We operate across Nigeria'],
            ].map(([Icon, val, lbl]) => (
              <div key={lbl} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--radius)',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon width={14} height={14} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--text-900)' }}>{val}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--text-400)' }}>{lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <button className="btn btn-primary" onClick={onGetStarted}>
            Get Started — Free Trial <IcArrowRight width={14} height={14} />
          </button>
        </div>
      </Container>
    </>
  );
}

function PrivacyPage() {
  const items = [
    ['1. What data we collect', `We collect information you provide when registering a hospital or user account, including names, email addresses, phone numbers, and facility details. We also collect patient health data entered by authorised clinical staff during the course of patient care.`],
    ['2. How we use your data', `Data is used solely to provide the MediBank Nexus platform services. Patient health data is used to support clinical workflows, enable care coordination between departments, and generate administrative reports. We do not sell, share, or disclose personal data to third parties for marketing purposes.`],
    ['3. Data storage & security', `All data is stored on secure servers with AES-256-GCM field-level encryption applied to all personally identifiable and health information. Data in transit is protected with TLS 1.3. Access is controlled by role-based permissions enforced at every API endpoint.`],
    ['4. Data retention', `Patient health records are retained for a minimum of 7 years in accordance with Nigerian Medical Records guidelines. Hospital administrators can configure extended retention periods. Data subject to deletion requests will be anonymised rather than deleted where retention is legally required.`],
    ['5. Your rights under NDPR', `Under the Nigerian Data Protection Regulation (NDPR) 2019, you have the right to: access your personal data; correct inaccurate data; request deletion of data where legally permissible; withdraw consent; and lodge a complaint with the National Information Technology Development Agency (NITDA).`],
    ['6. Cookies', `We use session cookies strictly necessary for authentication. We do not use third-party tracking cookies, advertising cookies, or analytics cookies that track individual behaviour across websites.`],
    ['7. Third-party services', `We use Paystack for payment processing (subject to their privacy policy), Google Calendar and Drive for optional integrations (subject to Google's privacy policy), and Termii or Africa's Talking for SMS reminders. No health data is transmitted to these services.`],
    ['8. Changes to this policy', `We will notify all registered hospital administrators by email of any material changes to this Privacy Policy at least 30 days before they take effect.`],
    ['9. Contact', `Privacy enquiries: privacy@medibanknexus.com · +234 800 MEDIBANK`],
  ];

  return (
    <>
      <Hero
        eyebrow="LEGAL"
        title="Privacy Policy"
        subtitle="Last updated: January 2026 · Effective: January 2026"
      />
      <Container>
        <p style={{ ...bodyText, marginBottom: 32, padding: '14px 18px', background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
          MediBank Nexus is committed to protecting patient health information and personal data in accordance with the Nigerian Data Protection Regulation (NDPR) 2019 and international best practices.
        </p>
        {items.map(([title, body]) => (
          <Section key={title} title={title}>
            <p style={bodyText}>{body}</p>
          </Section>
        ))}
      </Container>
    </>
  );
}

function NdprPage() {
  return (
    <>
      <Hero
        eyebrow="COMPLIANCE"
        title="NDPR Compliance"
        subtitle="How MediBank Nexus implements the Nigerian Data Protection Regulation 2019 across the entire platform."
      />
      <Container>
        <Section>
          <p style={bodyText}>
            The Nigerian Data Protection Regulation (NDPR) 2019, administered by NITDA, requires any entity
            processing the personal data of Nigerian citizens to implement appropriate technical and organisational
            measures to protect that data. As a healthcare platform handling sensitive health information,
            MediBank Nexus applies NDPR compliance at every layer of the system.
          </p>
        </Section>

        {[
          {
            title: 'Lawful basis for processing',
            body: 'Patient health data is processed under the lawful basis of vital interests (emergency care), performance of a contract (direct patient care), and explicit consent collected during registration. All consent records are timestamped and auditable.',
          },
          {
            title: 'Data minimisation',
            body: 'We collect only the data necessary for patient care. Role-based access control (RBAC) ensures each user sees only the minimum data required for their function. Pharmacists cannot view full clinical notes; nurses cannot access billing data.',
          },
          {
            title: 'Encryption & pseudonymisation',
            body: 'All personally identifiable information (PII) and protected health information (PHI) fields are encrypted at rest using AES-256-GCM before being written to the database. Encryption keys are stored separately from encrypted data. All communications use TLS 1.3.',
          },
          {
            title: 'Access control & audit logs',
            body: 'Every access, modification, and deletion of patient data is logged with a timestamp, user ID, and IP address. Audit logs are immutable and exportable. Failed login attempts are tracked and accounts are locked after 5 consecutive failures.',
          },
          {
            title: 'Data subject rights',
            body: 'Patients can request access to their data through the Patient Portal. Hospital administrators can process data subject requests (access, correction, deletion) from the Compliance settings module. Deletion requests for health records are fulfilled as anonymisation to comply with medical records retention law.',
          },
          {
            title: 'Data breach notification',
            body: 'In the event of a confirmed data breach, MediBank Nexus commits to notifying affected hospital administrators and NITDA within 72 hours of discovery, as required under NDPR. Affected patients are notified within the timeframes specified by NITDA guidance.',
          },
          {
            title: 'Data retention & disposal',
            body: 'Health records are retained for a minimum of 7 years. After the retention period, data is automatically anonymised. Hospital administrators can configure extended retention. Hospitals that close their accounts receive a 90-day window to export all data before secure deletion.',
          },
          {
            title: 'Third-party processors',
            body: 'All third-party processors (Paystack, cloud hosting provider) operate under data processing agreements (DPAs) that comply with NDPR requirements. No health data is shared with payment processors or SMS gateways.',
          },
        ].map(item => (
          <Section key={item.title} title={item.title}>
            <p style={bodyText}>{item.body}</p>
          </Section>
        ))}

        <div style={{
          padding: '18px 20px', background: 'var(--success-light)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--success)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <IcShield width={18} height={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '.86rem', color: 'var(--success-dark)', lineHeight: 1.7 }}>
            <strong>Compliance Officer Contact:</strong> For NDPR-related enquiries, data subject requests, or to
            report a concern, contact <strong>privacy@medibanknexus.com</strong> or call <strong>+234 800 MEDIBANK</strong>.
          </div>
        </div>
      </Container>
    </>
  );
}

function ChangelogPage() {
  const RELEASES = [
    {
      version: 'v1.4.0',
      date:    'April 2026',
      tag:     'New Features',
      color:   'var(--primary)',
      changes: [
        'Drug Formulary module: full CRUD for hospital medication catalog',
        'Lab & Investigations module: order lab tests, enter results, notify doctors',
        'CSV export for patients, invoices, appointments, audit logs',
        'Collapsible sidebar with icon-only mode',
        'Profile photo upload for all roles; hospital logo upload for admin',
        'Appointment reminder job: automatic SMS + in-app alerts at 24h and 1h',
      ],
    },
    {
      version: 'v1.3.0',
      date:    'March 2026',
      tag:     'Platform',
      color:   'var(--teal)',
      changes: [
        'Free Trial plan (30 days, 5 staff max) — no payment required',
        'Pro plan with Paystack payment integration',
        'Custom/Enterprise plan with contact form',
        'Trial expiry banner and upgrade flow',
        'Google OAuth integration for Calendar and Drive',
        'Gemini AI as default model with Anthropic/OpenAI fallback chain',
      ],
    },
    {
      version: 'v1.2.0',
      date:    'February 2026',
      tag:     'Modules',
      color:   'var(--success)',
      changes: [
        'Billing & Payments module with invoice generation',
        'Analytics dashboard with revenue and staff performance charts',
        'Staff Management with role assignment and department allocation',
        'Patient Portal: patients can view records, appointments, prescriptions',
        'Notifications centre: in-app alerts with mark-as-read',
        'Settings: Hospital branding, NDPR compliance, doctor schedules',
      ],
    },
    {
      version: 'v1.1.0',
      date:    'January 2026',
      tag:     'Core',
      color:   'var(--warning)',
      changes: [
        'Hospital onboarding wizard (4 steps)',
        'Role-based authentication (nurse, doctor, pharmacist, admin, patient)',
        'Patient registration with unique ID generation',
        'Doctor consultation with SOAP note template',
        'Pharmacy Rx queue with allergy checking',
        'Appointment booking with doctor availability',
        'Nexus AI chat assistant on dashboard',
      ],
    },
  ];

  return (
    <>
      <Hero
        eyebrow="CHANGELOG"
        title="What's new in MediBank Nexus"
        subtitle="Full release history — every feature, fix, and improvement documented."
      />
      <Container>
        {RELEASES.map((r, i) => (
          <div key={r.version} style={{ marginBottom: 40, paddingBottom: 40, borderBottom: i < RELEASES.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-900)' }}>{r.version}</span>
              <span style={{
                padding: '2px 10px', borderRadius: 'var(--radius-full)',
                background: `color-mix(in srgb, ${r.color} 12%, white)`,
                color: r.color, fontSize: '.72rem', fontWeight: 700,
                border: `1px solid color-mix(in srgb, ${r.color} 25%, transparent)`,
              }}>
                {r.tag}
              </span>
              <span style={{ fontSize: '.78rem', color: 'var(--text-400)', marginLeft: 'auto' }}>{r.date}</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.changes.map(c => (
                <li key={c} style={{ display: 'flex', gap: 10, fontSize: '.87rem', color: 'var(--text-700)', lineHeight: 1.5 }}>
                  <IcCheckCircle width={14} height={14} style={{ color: r.color, flexShrink: 0, marginTop: 2 }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
    </>
  );
}

function RoadmapPage() {
  const items = [
    { quarter: 'Q2 2026', tag: 'In Progress', color: 'var(--primary)', features: [
      'Two-Factor Authentication (TOTP) — QR code enrollment + backup codes',
      'Inpatient ward & bed management — admissions, transfers, discharge planning',
      'Nursing notes & Medication Administration Record (MAR)',
      'Referral system — internal (dept-to-dept) and external (other hospitals)',
      'File uploads — lab PDFs, consent forms, patient photos (S3/Cloudinary)',
    ]},
    { quarter: 'Q3 2026', tag: 'Planned', color: 'var(--teal)', features: [
      'Full PDF generation — discharge summaries, official prescription slips',
      'Email/SMS notifications via Termii and Africa\'s Talking',
      'NDPR data subject request module — consent records, audit export',
      'Multi-branch management — group hospitals under one admin',
      'Telemedicine — video consultation integration',
    ]},
    { quarter: 'Q4 2026', tag: 'Future', color: 'var(--success)', features: [
      'NHIS claims integration — automated electronic claims submission',
      'LHIMS (Lagos Health Information Management System) connector',
      'Mobile app — iOS and Android for doctors and patients',
      'AI diagnostic support — differential diagnosis suggestions',
      'Wearable device integration — continuous vitals monitoring',
    ]},
  ];

  return (
    <>
      <Hero
        eyebrow="ROADMAP"
        title="What we're building next"
        subtitle="Our public roadmap shows what's in progress, what's planned, and what's on the horizon for MediBank Nexus."
      />
      <Container>
        <p style={{ ...bodyText, marginBottom: 36 }}>
          Have a feature request? Email <strong>product@medibanknexus.com</strong> — hospital feedback directly
          shapes our roadmap.
        </p>
        {items.map(item => (
          <div key={item.quarter} style={{
            marginBottom: 32, background: 'white',
            borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
            padding: '24px 28px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-900)' }}>{item.quarter}</span>
              <span style={{
                padding: '2px 10px', borderRadius: 'var(--radius-full)',
                background: `color-mix(in srgb, ${item.color} 14%, white)`,
                color: item.color, fontSize: '.72rem', fontWeight: 700,
                border: `1px solid color-mix(in srgb, ${item.color} 28%, transparent)`,
              }}>
                {item.tag}
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {item.features.map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontSize: '.87rem', color: 'var(--text-700)', lineHeight: 1.5 }}>
                  <IcArrowRight width={13} height={13} style={{ color: item.color, flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
    </>
  );
}

function BlogPage() {
  return (
    <>
      <Hero
        eyebrow="BLOG"
        title="Insights on healthcare technology in Nigeria"
        subtitle="Articles, guides, and research from the MediBank Nexus team."
      />
      <Container>
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <IcBarChart width={26} height={26} />
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: 10, color: 'var(--text-900)' }}>
            Blog launching soon
          </h2>
          <p style={{ ...bodyText, maxWidth: 420, margin: '0 auto 20px', color: 'var(--text-500)' }}>
            We're preparing articles on Nigerian healthcare digitalisation, NDPR compliance,
            AI in clinical settings, and how hospitals are using Nexus to improve outcomes.
          </p>
          <p style={{ fontSize: '.82rem', color: 'var(--text-400)' }}>
            Subscribe: <strong>blog@medibanknexus.com</strong>
          </p>
        </div>
      </Container>
    </>
  );
}

function CareersPage() {
  const ROLES = [
    { title: 'Senior Frontend Engineer (React)', team: 'Engineering', type: 'Full-time · Remote (Nigeria)', desc: 'Build and maintain the Nexus web platform. Strong React + TypeScript experience required. Experience with healthcare or fintech systems a plus.' },
    { title: 'Backend Engineer (Node.js / PostgreSQL)', team: 'Engineering', type: 'Full-time · Remote (Nigeria)', desc: 'Build robust, secure API endpoints. Experience with multi-tenant SaaS, encryption, and RBAC systems required.' },
    { title: 'Customer Success Manager', team: 'Customer Success', type: 'Full-time · Lagos or Abuja', desc: 'Onboard new hospital clients, conduct staff training, and ensure hospitals are getting maximum value from the platform.' },
    { title: 'Healthcare Product Designer (UX/UI)', team: 'Design', type: 'Full-time · Remote (Nigeria)', desc: 'Design intuitive clinical workflows for nurses, doctors, and administrators. Experience designing for healthcare or complex data-intensive applications required.' },
    { title: 'Sales Executive — Healthcare SaaS', team: 'Sales', type: 'Full-time · Lagos', desc: 'Identify, pitch, and close new hospital clients. Existing network in private hospitals or HMOs is a significant advantage.' },
  ];

  return (
    <>
      <Hero
        eyebrow="CAREERS"
        title="Build the future of African healthcare with us"
        subtitle="We're a small, mission-driven team with big ambitions. We move fast, write great code, and care deeply about outcomes for patients."
      />
      <Container>
        <Section title="Why join MediBank Nexus?">
          {[
            'Work on software that directly saves lives and improves patient outcomes',
            'Small team — high ownership and impact from day one',
            'Remote-first — work from anywhere in Nigeria',
            'Competitive salary + equity options for early team members',
            'Health insurance + 21 days annual leave',
          ].map(p => (
            <div key={p} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start', fontSize: '.88rem', color: 'var(--text-700)' }}>
              <IcCheckCircle width={14} height={14} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
              {p}
            </div>
          ))}
        </Section>

        <Section title="Open Positions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ROLES.map(r => (
              <div key={r.title} style={{
                background: 'white', borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)', padding: '20px 24px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-900)', marginBottom: 4 }}>{r.title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)33' }}>{r.team}</span>
                      <span style={{ fontSize: '.72rem', color: 'var(--text-400)' }}>{r.type}</span>
                    </div>
                  </div>
                  <a
                    href="mailto:careers@medibanknexus.com"
                    className="btn btn-outline btn-sm"
                    style={{ flexShrink: 0, textDecoration: 'none' }}
                  >
                    Apply
                  </a>
                </div>
                <p style={{ fontSize: '.84rem', color: 'var(--text-500)', lineHeight: 1.65, margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <div style={{ padding: '20px 24px', background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary)', fontSize: '.86rem', color: 'var(--primary)' }}>
          Don't see your role? Send a speculative application to <strong>careers@medibanknexus.com</strong> with your CV and what you'd bring to the team.
        </div>
      </Container>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
const PAGES = {
  about:     AboutPage,
  privacy:   PrivacyPage,
  ndpr:      NdprPage,
  changelog: ChangelogPage,
  roadmap:   RoadmapPage,
  blog:      BlogPage,
  careers:   CareersPage,
};

export default function StaticPage({ pageKey, onBack, onGetStarted }) {
  const Page = PAGES[pageKey];
  if (!Page) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <PageNav onBack={onBack} onGetStarted={onGetStarted} />
      <Page onGetStarted={onGetStarted} />
    </div>
  );
}
