/**
 * Step 14 — Landing / Marketing Page
 * Hero · Stats strip · Features · How it works · Pricing · Testimonials · CTA · Footer
 */

import { useState } from 'react';
import {
  IcHospital, IcPeople, IcPill, IcCalendar,
  IcShield, IcCPU, IcBarChart, IcCheckCircle,
  IcArrowRight, IcPhone, IcMail, IcMapPin,
  IcWifi, IcStethoscope, IcFileMedical,
  IcStar, IcStarFill, IcPersonAdd, IcX, IcPerson,
} from '../components/Icons';

/* ── data ─────────────────────────────────────────────────── */
const STATS = [
  { value: '5,400+', label: 'Patients Managed'    },
  { value: '47',     label: 'Staff Members'        },
  { value: '99.9%',  label: 'System Uptime'        },
  { value: '₦6M+',   label: 'Monthly Revenue Tracked' },
];

const FEATURES = [
  {
    icon:  <IcPersonAdd    width={22} height={22} />,
    color: 'var(--primary)',
    title: 'Patient Registration',
    desc:  'Paperless 5-step intake with NIN verification, allergy flags, insurance details and a generated patient ID — all in under 3 minutes.',
  },
  {
    icon:  <IcStethoscope  width={22} height={22} />,
    color: 'var(--teal)',
    title: 'Doctor Consultations',
    desc:  'Vitals grid, SOAP notes, multi-drug prescription builder with allergy conflict detection, and one-click AI clinical summary via Claude.',
  },
  {
    icon:  <IcPill         width={22} height={22} />,
    color: 'var(--warning)',
    title: 'Pharmacy Rx Queue',
    desc:  'Real-time prescription queue with stock-level bars, urgent flagging, one-click dispense flow, and automatic inventory deduction.',
  },
  {
    icon:  <IcCalendar     width={22} height={22} />,
    color: '#7c3aed',
    title: 'Appointment Booking',
    desc:  '4-step booking wizard with an interactive calendar, per-doctor availability, taken-slot detection, and multi-channel reminders.',
  },
  {
    icon:  <IcBarChart     width={22} height={22} />,
    color: 'var(--success)',
    title: 'Admin Analytics',
    desc:  'Live KPI dashboard with animated count-ups, area charts for volume trends, revenue bars, department breakdowns, and an immutable audit log.',
  },
  {
    icon:  <IcCPU          width={22} height={22} />,
    color: '#db2777',
    title: 'Nexus AI Assistant',
    desc:  'Role-aware Claude-powered assistant embedded in every module — clinical summaries, drug lookups, ICD codes, and patient queries in plain English.',
  },
  {
    icon:  <IcShield       width={22} height={22} />,
    color: 'var(--danger)',
    title: 'NDPR Compliance',
    desc:  'AES-256 encryption at rest, TLS 1.3 in transit, role-based access control, full audit trails, and multi-factor authentication.',
  },
  {
    icon:  <IcWifi         width={22} height={22} />,
    color: 'var(--teal)',
    title: 'Offline Ready (PWA)',
    desc:  'Installable on any device. Service worker caches all critical pages so staff can keep working even on intermittent VSAT connections.',
  },
  {
    icon:  <IcFileMedical  width={22} height={22} />,
    color: 'var(--primary)',
    title: 'Patient Portal',
    desc:  'Patients can view visit history, check prescriptions, manage appointments, and receive automated SMS/WhatsApp/email reminders.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register Patients',    desc: 'Front desk or nurse completes the 5-step digital intake — no paper, no double entry.', color: 'var(--primary)' },
  { step: '02', title: 'Doctor Consults',      desc: 'Doctor reviews history, records vitals, writes notes, prescribes with allergy checking.', color: 'var(--teal)'    },
  { step: '03', title: 'Pharmacy Dispenses',   desc: 'Pharmacist sees the live Rx queue, checks stock, confirms and dispenses in one click.', color: 'var(--warning)'  },
  { step: '04', title: 'Track & Improve',      desc: 'Admin monitors KPIs, staff performance, and compliance through the analytics dashboard.', color: 'var(--success)'  },
];

const PRICING = [
  {
    key:      'free_trial',
    name:     'Free Trial',
    price:    '₦0',
    period:   '/30 days',
    desc:     'Try Nexus free — no credit card needed',
    highlight: false,
    cta:      'Start Free Trial',
    features: [
      'Up to 5 staff accounts',
      'Patient registration & records',
      'Basic appointment booking',
      'In-app notifications',
      'Community support',
    ],
    locked: ['Nexus AI', 'Analytics', 'Pharmacy', 'Lab module'],
  },
  {
    key:      'pro',
    name:     'Pro',
    price:    '₦80,000',
    period:   '/month',
    desc:     'For growing hospitals, up to 30 staff',
    highlight: true,
    cta:      'Get Pro',
    features: [
      'Up to 30 staff accounts',
      'Everything in Free Trial',
      'Doctor Consultation Module',
      'Pharmacy & Rx Queue',
      'Lab & Investigations',
      'Drug Formulary',
      'Analytics Dashboard',
      'Nexus AI Assistant',
      'Patient Portal & SMS Reminders',
      'NDPR Compliance Reports',
      'Priority support',
    ],
    locked: [],
  },
  {
    key:      'custom',
    name:     'Custom',
    price:    'Custom',
    period:   '',
    desc:     'For large hospitals, groups & enterprise',
    highlight: false,
    cta:      'Contact Us',
    features: [
      'Unlimited staff & patients',
      'All Pro features',
      'Custom Branding & Colours',
      'Multi-Branch Management',
      'Full API Access (NHIS, LHIMS)',
      'Dedicated account manager',
      'On-site staff training',
      '24/7 phone & chat support',
      'SLA guarantee',
    ],
    locked: [],
  },
];

const TESTIMONIALS = [
  {
    name:   'Dr. Adaeze Ibe',
    role:   'Consultant, OBS & Gynaecology',
    clinic: 'Cedarcrest Hospital, Abuja',
    rating: 5,
    quote:  'Nexus cut our patient wait time by 40%. The AI summary feature alone saves me 20 minutes per shift — it generates a proper SOAP note from vitals and my brief notes instantly.',
  },
  {
    name:   'Emeka Bankole',
    role:   'Hospital Administrator',
    clinic: 'Lagoon Hospital, Lagos',
    rating: 5,
    quote:  'The analytics dashboard gives me real-time visibility I never had before. I can see revenue, no-show rates, and department performance all in one place. Game-changing for a Nigerian hospital.',
  },
  {
    name:   'Fatima Bello',
    role:   'Head Pharmacist',
    clinic: 'National Hospital, Abuja',
    rating: 5,
    quote:  'The Rx queue with stock level bars means I never run out without warning. The allergy conflict detection has already caught two dangerous prescription errors in our first month.',
  },
];

/* ── sub-components ──────────────────────────────────────── */

function SignInDropdown({ onStaffLogin, onPatientLogin }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-outline btn-sm" onClick={() => setOpen(v => !v)}>
        Sign In
      </button>
      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
            background: 'white', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
            minWidth: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid var(--border)', fontSize: '.72rem', fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Sign in as
            </div>
            <button
              className="dropdown-item"
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => { setOpen(false); onStaffLogin(); }}
            >
              <IcPeople width={14} height={14} style={{ color: 'var(--primary)' }} />
              Staff Login
              <span style={{ fontSize: '.7rem', color: 'var(--text-400)', marginLeft: 'auto' }}>Nurse · Doctor · Admin</span>
            </button>
            <button
              className="dropdown-item"
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => { setOpen(false); onPatientLogin(); }}
            >
              <IcPerson width={14} height={14} style={{ color: 'var(--teal)' }} />
              Patient Login
              <span style={{ fontSize: '.7rem', color: 'var(--text-400)', marginLeft: 'auto' }}>My Health Records</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NavBar({ onGetStarted, onStaffLogin, onPatientLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <div className="brand">
          <div className="brand-logo">
            <IcHospital width={18} height={18} />
          </div>
          <span className="brand-name">MediBank <span>Nexus</span></span>
        </div>

        <div className="landing-nav-links">
          {['Features', 'How it Works', 'Pricing', 'Testimonials'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="landing-nav-link">
              {l}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SignInDropdown onStaffLogin={onStaffLogin} onPatientLogin={onPatientLogin} />
          <button className="btn btn-primary btn-sm" onClick={onGetStarted}>
            Get Started <IcArrowRight width={13} height={13} />
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero({ onGetStarted }) {
  return (
    <section className="landing-hero">
      <div className="hero-grid-bg" />

      <div className="hero-content">
        {/* Eyebrow */}
        <div className="hero-eyebrow anim-fade-up">
          <span className="hero-eyebrow-dot" />
          Built for Nigerian Healthcare
        </div>

        {/* Headline */}
        <h1 className="hero-headline anim-fade-up anim-d1">
          The Digital Backbone<br />
          <span className="hero-headline-accent">of Healthcare in Africa</span>
        </h1>

        <p className="hero-subtext anim-fade-up anim-d2">
          MediBank Nexus replaces paper records with an intelligent, connected hospital management
          system — AI-powered, NDPR-compliant, and built to work on Nigeria's networks.
        </p>

        <div className="hero-ctas anim-fade-up anim-d3">
          <button className="btn btn-primary btn-xl" onClick={onGetStarted}>
            Start Free Trial <IcArrowRight width={15} height={15} />
          </button>
          <button className="btn btn-outline btn-xl" onClick={onGetStarted}>
            Watch Demo
          </button>
        </div>

        {/* Social proof */}
        <div className="hero-proof anim-fade-up anim-d4">
          <div style={{ display: 'flex' }}>
            {['EN', 'AO', 'BA', 'JB'].map((init, i) => (
              <div key={init} className="proof-avatar" style={{ marginLeft: i > 0 ? -10 : 0 }}>
                {init}
              </div>
            ))}
          </div>
          <span className="hero-proof-text">
            Trusted by <strong>200+ healthcare professionals</strong> across Nigeria
          </span>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="hero-mockup anim-fade-up anim-d2">
        <div className="mockup-topbar">
          <div className="mockup-dots">
            <span style={{ background: '#ff5f57' }} />
            <span style={{ background: '#febc2e' }} />
            <span style={{ background: '#28c840' }} />
          </div>
          <div className="mockup-url">medibanknexus.com</div>
        </div>
        <div className="mockup-body">
          {/* Mini stat cards */}
          <div className="mockup-stats">
            {[
              { label: 'Patients', value: '5,486', color: '#0a6ebd' },
              { label: 'Revenue',  value: '₦6.01M', color: '#059669' },
              { label: 'Rx Queue', value: '3 pending', color: '#d97706' },
            ].map(s => (
              <div key={s.label} className="mockup-stat">
                <div className="mockup-stat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="mockup-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Mini chart bars */}
          <div className="mockup-chart">
            {[40, 55, 48, 65, 72, 60].map((h, i) => (
              <div key={i} className="mockup-bar" style={{ height: h, background: i === 5 ? '#0a6ebd' : '#e8f2fb' }} />
            ))}
          </div>
          {/* Mini notif */}
          <div className="mockup-notif">
            <div className="mockup-notif-dot" />
            <span>Prescription RX-2026-0041 dispensed</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <div className="landing-stats-strip">
      {STATS.map(s => (
        <div key={s.label} className="landing-stat">
          <div className="landing-stat-value">{s.value}</div>
          <div className="landing-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function Features() {
  return (
    <section className="landing-section" id="features">
      <div className="section-eyebrow">Everything you need</div>
      <h2 className="section-title">One platform. Every role.</h2>
      <p className="section-sub">
        From nurse registration to doctor prescriptions to pharmacy dispensing — every workflow
        digitised, connected, and powered by AI.
      </p>

      <div className="features-grid">
        {FEATURES.map(f => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon" style={{ background: `color-mix(in srgb, ${f.color} 12%, white)`, color: f.color }}>
              {f.icon}
            </div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="landing-section landing-section-alt" id="how-it-works">
      <div className="section-eyebrow">Simple workflow</div>
      <h2 className="section-title">How it works</h2>
      <p className="section-sub">Four steps from patient arrival to clinical resolution.</p>

      <div className="how-grid">
        {HOW_IT_WORKS.map((h, i) => (
          <div key={h.step} className="how-card">
            <div className="how-step" style={{ color: h.color, borderColor: `color-mix(in srgb, ${h.color} 30%, transparent)`, background: `color-mix(in srgb, ${h.color} 8%, white)` }}>
              {h.step}
            </div>
            {i < HOW_IT_WORKS.length - 1 && (
              <div className="how-connector" />
            )}
            <h3 className="how-title">{h.title}</h3>
            <p className="how-desc">{h.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing({ onStartTrial, onGetPro, onContactUs }) {
  return (
    <section className="landing-section" id="pricing">
      <div className="section-eyebrow">Transparent pricing</div>
      <h2 className="section-title">Simple, honest plans</h2>
      <p className="section-sub">
        No setup fees. No per-patient charges. Cancel anytime.
        Free trial upgrades to Pro after 30 days.
      </p>

      <div className="pricing-grid">
        {PRICING.map(plan => {
          const handleClick =
            plan.key === 'free_trial' ? onStartTrial :
            plan.key === 'pro'        ? onGetPro     :
                                        onContactUs;
          return (
            <div key={plan.name} className={`pricing-card${plan.highlight ? ' highlight' : ''}`}>
              {plan.highlight && <div className="pricing-popular">Pro</div>}

              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">
                {plan.price}
                <span className="pricing-period">{plan.period}</span>
              </div>
              <div className="pricing-desc">{plan.desc}</div>

              <ul className="pricing-features">
                {plan.features.map(f => (
                  <li key={f}>
                    <IcCheckCircle width={14} height={14} style={{ color: plan.highlight ? 'white' : 'var(--success)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
                {plan.locked?.map(f => (
                  <li key={f} style={{ opacity: .45 }}>
                    <IcX width={12} height={12} style={{ color: plan.highlight ? 'white' : 'var(--danger)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`btn ${plan.highlight ? 'btn-primary' : 'btn-outline'} btn-full`}
                onClick={handleClick}
              >
                {plan.cta}
                <IcArrowRight width={13} height={13} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="landing-section landing-section-alt" id="testimonials">
      <div className="section-eyebrow">What they say</div>
      <h2 className="section-title">Trusted by Nigerian clinicians</h2>

      <div className="testi-grid">
        {TESTIMONIALS.map(t => (
          <div key={t.name} className="testi-card">
            <div className="testi-stars">
              {Array(t.rating).fill(null).map((_, i) => (
                <IcStarFill key={i} width={14} height={14} style={{ color: '#f59e0b' }} />
              ))}
            </div>
            <p className="testi-quote">"{t.quote}"</p>
            <div className="testi-author">
              <div className="testi-avatar">{t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-role">{t.role}</div>
                <div className="testi-clinic">{t.clinic}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBanner({ onStartTrial, onContactUs }) {
  return (
    <section className="landing-cta">
      <div className="cta-grid-bg" />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h2 className="cta-headline">
          Ready to digitise your hospital?
        </h2>
        <p className="cta-sub">
          Join 200+ healthcare professionals already using MediBank Nexus.<br />
          Free 30-day trial. No credit card required.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-2xl" onClick={onStartTrial}>
            Start Free Trial <IcArrowRight width={16} height={16} />
          </button>
          <button className="btn btn-2xl" style={{ background: 'rgba(255,255,255,.12)', color: 'white', border: '1px solid rgba(255,255,255,.3)' }} onClick={onContactUs}>
            <IcPhone width={15} height={15} /> Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}

const MODULE_KEYS = {
  'Patient Registration': 'patient-registration',
  'Doctor Consultation':  'doctor-consultation',
  'Pharmacy':             'pharmacy',
  'Appointments':         'appointments',
  'Analytics':            'analytics',
};

const STATIC_KEYS = {
  'About':           'about',
  'Blog':            'blog',
  'Careers':         'careers',
  'Privacy Policy':  'privacy',
  'NDPR Compliance': 'ndpr',
};

/* Scrolls to a section on the landing page */
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const PRODUCT_LINKS = {
  'Features':     () => scrollTo('features'),
  'How it Works': () => scrollTo('how-it-works'),
  'Pricing':      () => scrollTo('pricing'),
  'Changelog':    null, // handled by onNavigate
  'Roadmap':      null,
};

function Footer({ onNavigateModule, onNavigateStatic }) {
  return (
    <footer className="landing-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="brand" style={{ marginBottom: 12 }}>
            <div className="brand-logo"><IcHospital width={18} height={18} /></div>
            <span className="brand-name">MediBank <span>Nexus</span></span>
          </div>
          <p className="footer-tagline">
            The digital backbone of healthcare in Africa. Built for Nigerian hospitals.
          </p>
          <div className="footer-contact">
            <div><IcPhone width={12} height={12} /> +234 800 MEDIBANK</div>
            <div><IcMail  width={12} height={12} /> hello@medibanknexus.com</div>
            <div><IcMapPin width={12} height={12} /> Lagos · Abuja · Port Harcourt</div>
          </div>
        </div>

        <div className="footer-links-group">
          <div className="footer-col">
            <div className="footer-col-title">Product</div>
            {Object.entries(PRODUCT_LINKS).map(([label, fn]) => (
              <button
                key={label}
                className="footer-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                onClick={fn ?? (() => onNavigateStatic(STATIC_KEYS[label] ?? label.toLowerCase()))}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Modules</div>
            {Object.keys(MODULE_KEYS).map(label => (
              <button
                key={label}
                className="footer-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                onClick={() => onNavigateModule(MODULE_KEYS[label])}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Company</div>
            {Object.keys(STATIC_KEYS).map(label => (
              <button
                key={label}
                className="footer-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                onClick={() => onNavigateStatic(STATIC_KEYS[label])}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 MediBank Nexus · Built by Joshua Redeem Ohiani Bankole</span>
        <span>NDPR Compliant · ISO 27001 · TLS 1.3</span>
      </div>
    </footer>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function LandingPage({
  onGetStarted, onGetPro, onContactUs,
  onStaffLogin, onPatientLogin,
  onNavigateModule, onNavigateStatic,
}) {
  const handleStartTrial    = onGetStarted;
  const handleGetPro        = onGetPro          ?? onGetStarted;
  const handleContactUs     = onContactUs       ?? onGetStarted;
  const handleStaffLogin    = onStaffLogin      ?? onGetStarted;
  const handlePatientLogin  = onPatientLogin    ?? onGetStarted;
  const handleNavModule     = onNavigateModule  ?? (() => {});
  const handleNavStatic     = onNavigateStatic  ?? (() => {});

  return (
    <div className="landing-root">
      <NavBar
        onGetStarted={handleStartTrial}
        onStaffLogin={handleStaffLogin}
        onPatientLogin={handlePatientLogin}
      />
      <Hero    onGetStarted={handleStartTrial} />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <Pricing onStartTrial={handleStartTrial} onGetPro={handleGetPro} onContactUs={handleContactUs} />
      <Testimonials />
      <CtaBanner onStartTrial={handleStartTrial} onContactUs={handleContactUs} />
      <Footer onNavigateModule={handleNavModule} onNavigateStatic={handleNavStatic} />
    </div>
  );
}
