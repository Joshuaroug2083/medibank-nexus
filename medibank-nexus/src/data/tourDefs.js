/**
 * Tour step definitions for every page in MediBank Nexus.
 *
 * Structure:
 *   TOUR_DEFS[pageKey][role | 'all'] = [ ...steps ]
 *
 * Each step:
 *   target   — data-tour attribute on the DOM element to highlight (or null for centred modal)
 *   title    — tooltip heading
 *   body     — tooltip body text (supports <br/> in JSX via dangerouslySetInnerHTML)
 *   placement — 'top' | 'bottom' | 'left' | 'right' | 'center' (default auto)
 */

const TOUR_DEFS = {

  /* ════════════════════════════════════════════════════════
     DASHBOARD  (role-specific welcome)
  ════════════════════════════════════════════════════════ */
  dashboard: {
    nurse: [
      {
        target:    null,
        title:     '👋 Welcome to MediBank Nexus',
        body:      "You're logged in as a Nurse. This quick tour will walk you through your workspace in under a minute. Use the arrows or keyboard → ← to navigate.",
        placement: 'center',
      },
      {
        target:    'sidebar-nav',
        title:     '🗂 Your Sidebar',
        body:      'All your main pages live here — Dashboard, Register Patient, Appointments, and Notifications. Click any item to navigate.',
        placement: 'right',
      },
      {
        target:    'welcome-card',
        title:     '📋 Welcome Card',
        body:      "Today's date and your department are shown here. It updates every day so you always know exactly where you are.",
        placement: 'bottom',
      },
      {
        target:    'kpi-stats',
        title:     '📊 KPI Statistics',
        body:      'At-a-glance numbers: patients registered today, appointments, pending check-ins, and completions. These update in real time from the database.',
        placement: 'bottom',
      },
      {
        target:    'quick-actions',
        title:     '⚡ Quick Actions',
        body:      "One-click shortcuts to your most-used pages. Register a Patient or Book an Appointment without navigating the sidebar.",
        placement: 'bottom',
      },
      {
        target:    'ai-chat',
        title:     '🤖 Nexus AI Assistant',
        body:      'Your AI medical assistant is always here. Ask about patient allergies, vitals ranges, registration guidance, or any clinical question.',
        placement: 'top',
      },
      {
        target:    'topbar-notifications',
        title:     '🔔 Notifications',
        body:      'The bell shows your unread notification count. Click it to see appointment reminders, system alerts, and updates.',
        placement: 'bottom',
      },
      {
        target:    'topbar-user',
        title:     '👤 Your Account',
        body:      'Click here to access Settings, sign out, or view your profile. Settings lets you personalise themes, notifications, and preferences.',
        placement: 'bottom',
      },
    ],

    doctor: [
      {
        target:    null,
        title:     '👋 Welcome, Doctor',
        body:      "Let's take a quick tour of your clinical workspace. Use arrows or keyboard → ← to navigate. This takes about 60 seconds.",
        placement: 'center',
      },
      {
        target:    'sidebar-nav',
        title:     '🗂 Your Navigation',
        body:      'Access Consultation, Appointments, Notifications, and Settings from the sidebar. Your active page is highlighted in blue.',
        placement: 'right',
      },
      {
        target:    'kpi-stats',
        title:     '📊 Daily Statistics',
        body:      "Today's consultations, prescriptions issued, upcoming appointments, and completions — all updated from the live database.",
        placement: 'bottom',
      },
      {
        target:    'quick-actions',
        title:     '⚡ Start a Consultation',
        body:      'Click "New Consultation" to open a patient record, document SOAP notes, record vitals, and issue prescriptions in one workflow.',
        placement: 'bottom',
      },
      {
        target:    'ai-chat',
        title:     '🤖 Clinical AI Assistant',
        body:      'Ask Nexus AI to suggest ICD-10 codes, flag drug interactions, draft clinical summaries, or answer pharmacology questions. Your AI model can be changed in Settings.',
        placement: 'top',
      },
      {
        target:    'topbar-user',
        title:     '⚙️ Clinical Settings',
        body:      'In Settings → Clinical, customise your SOAP template, vitals order, consultation duration, and AI model preference (Claude, GPT-4o, or Gemini).',
        placement: 'bottom',
      },
    ],

    pharmacist: [
      {
        target:    null,
        title:     '👋 Welcome to the Pharmacy',
        body:      "This is your dispensing workspace. Let's walk through the key areas quickly.",
        placement: 'center',
      },
      {
        target:    'sidebar-nav',
        title:     '💊 Rx Queue',
        body:      'The Rx Queue shows all prescriptions waiting to be dispensed. The red badge count tells you how many are pending right now.',
        placement: 'right',
      },
      {
        target:    'kpi-stats',
        title:     '📊 Pharmacy KPIs',
        body:      'Pending prescriptions, dispensed today, low-stock items, and total drug count — your at-a-glance stock health dashboard.',
        placement: 'bottom',
      },
      {
        target:    'ai-chat',
        title:     '🤖 Drug Information',
        body:      "Ask Nexus AI about drug interactions, dosage calculations, contraindications, or local brand equivalents. It's faster than flipping through a formulary.",
        placement: 'top',
      },
      {
        target:    'topbar-user',
        title:     '⚙️ Pharmacy Preferences',
        body:      'In Settings → Dispensing, set your low-stock alert threshold, toggle the double-check confirmation, and set your default route of administration.',
        placement: 'bottom',
      },
    ],

    admin: [
      {
        target:    null,
        title:     '👋 Welcome, Administrator',
        body:      "You have full access to MediBank Nexus. Let's explore the admin workspace together.",
        placement: 'center',
      },
      {
        target:    'sidebar-nav',
        title:     '🗂 Admin Navigation',
        body:      'Dashboard, Analytics, Staff Management, Notifications, and Settings. Staff Management lets you add, suspend, and manage all hospital staff.',
        placement: 'right',
      },
      {
        target:    'hospital-chip',
        title:     '🏥 Hospital Identity',
        body:      "This chip shows your hospital name, city, and subscription tier. It's visible to all staff. Customise it in Settings → Hospital Profile.",
        placement: 'right',
      },
      {
        target:    'kpi-stats',
        title:     '📊 Hospital-Wide KPIs',
        body:      'Total patients, monthly revenue, appointment volumes, and prescriptions issued — your high-level health of the hospital.',
        placement: 'bottom',
      },
      {
        target:    'quick-actions',
        title:     '⚡ Admin Actions',
        body:      'Jump straight to Analytics for detailed charts and reports, or view Staff Management to manage your team.',
        placement: 'bottom',
      },
      {
        target:    'ai-chat',
        title:     '🤖 AI for Administration',
        body:      'Ask Nexus AI to interpret analytics, explain platform features, generate staff reports, or answer operational questions.',
        placement: 'top',
      },
      {
        target:    'topbar-user',
        title:     '⚙️ Hospital Settings',
        body:      'Configure hospital branding, data retention policies, NDPR compliance settings, staff seats, and system-wide preferences.',
        placement: 'bottom',
      },
    ],

    patient: [
      {
        target:    null,
        title:     '👋 Welcome to Your Health Portal',
        body:      "This is your personal health portal. Everything about your care is right here. Let's take a quick tour.",
        placement: 'center',
      },
      {
        target:    'sidebar-nav',
        title:     '🗂 Your Portal',
        body:      'My Records shows your full medical history. Appointments lets you see upcoming visits. Notifications keeps you updated on your care.',
        placement: 'right',
      },
      {
        target:    'kpi-stats',
        title:     '📋 Your Health Summary',
        body:      'Your next appointment date, active prescriptions, past visits, and unread notifications — all at a glance when you log in.',
        placement: 'bottom',
      },
      {
        target:    'ai-chat',
        title:     '🤖 Ask About Your Health',
        body:      'Ask Nexus AI to explain your diagnosis, describe your medications, or answer general health questions. Your privacy settings control what it can access.',
        placement: 'top',
      },
      {
        target:    'topbar-user',
        title:     '👤 Your Account & Privacy',
        body:      'In Settings, manage your Health Profile, Privacy Controls (who sees your records), and Emergency Contacts. You are always in control of your data.',
        placement: 'bottom',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     REGISTER PATIENT (Nurse)
  ════════════════════════════════════════════════════════ */
  register: {
    all: [
      {
        target:    null,
        title:     '🆕 Registering a New Patient',
        body:      "This page creates a new patient record in the hospital system. Let's walk through the form sections.",
        placement: 'center',
      },
      {
        target:    'reg-personal-info',
        title:     '👤 Personal Information',
        body:      "Patient's full name, date of birth, gender, and National Identification Number (NIN). NIN is encrypted at rest — only authorised staff can view it.",
        placement: 'bottom',
      },
      {
        target:    'reg-contact-info',
        title:     '📞 Contact & Address',
        body:      'Phone number and address are also encrypted in the database. Use the format +234 for Nigerian numbers.',
        placement: 'bottom',
      },
      {
        target:    'reg-medical-info',
        title:     '🩺 Medical Information',
        body:      'Blood group, genotype, known allergies. This information appears as a flag to doctors during consultations and to pharmacists when dispensing.',
        placement: 'bottom',
      },
      {
        target:    'reg-insurance-info',
        title:     '🏥 Insurance / NHIS',
        body:      "If the patient is on NHIS or private insurance, enter their scheme and number here. This links to billing and reduces the patient's out-of-pocket costs.",
        placement: 'bottom',
      },
      {
        target:    'reg-submit',
        title:     '✅ Save and Register',
        body:      "Click Register Patient to create the record. A unique Patient ID (PT-YYYY-XXXX) is auto-generated. The patient can now be booked for appointments.",
        placement: 'top',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     CONSULTATION (Doctor)
  ════════════════════════════════════════════════════════ */
  consultation: {
    all: [
      {
        target:    null,
        title:     '📋 Consultation Workspace',
        body:      "This is the full clinical consultation interface. You document the visit, record vitals, write a diagnosis, and issue prescriptions — all in one place.",
        placement: 'center',
      },
      {
        target:    'consult-patient-search',
        title:     '🔍 Find a Patient',
        body:      'Search by patient name, ID, or phone number. Patient records include full medical history, past visits, allergies, and active medications.',
        placement: 'bottom',
      },
      {
        target:    'consult-vitals',
        title:     '🩺 Record Vitals',
        body:      'Enter BP, pulse, temperature, SpO₂, respiratory rate, and weight. Normal ranges are flagged visually. Vitals order can be customised in Settings → Clinical.',
        placement: 'bottom',
      },
      {
        target:    'consult-soap',
        title:     '📝 SOAP Notes',
        body:      'Subjective, Objective, Assessment, Plan. Your custom SOAP template from Settings is pre-loaded. Nexus AI can help draft sections if enabled.',
        placement: 'bottom',
      },
      {
        target:    'consult-prescription',
        title:     '💊 Issue Prescription',
        body:      'Add drugs from the hospital formulary. Dosage, frequency, duration, and route are all recorded. Allergy warnings flash automatically based on patient profile.',
        placement: 'bottom',
      },
      {
        target:    'consult-ai-summary',
        title:     '🤖 AI Summary',
        body:      "Click 'Generate Summary' to have Nexus AI write a professional clinical summary of the visit — ready for the patient's permanent record.",
        placement: 'top',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     PHARMACY / RX QUEUE
  ════════════════════════════════════════════════════════ */
  pharmacy: {
    all: [
      {
        target:    null,
        title:     '💊 Pharmacy Rx Queue',
        body:      "All prescriptions ready for dispensing appear here. Let's walk through the workflow.",
        placement: 'center',
      },
      {
        target:    'pharmacy-queue',
        title:     '📋 Prescription Queue',
        body:      'Prescriptions are listed with patient name, doctor, drugs, and status (Pending / Dispensed / Cancelled). Oldest first by default.',
        placement: 'bottom',
      },
      {
        target:    'pharmacy-dispense',
        title:     '✅ Dispense a Prescription',
        body:      "Click 'Dispense' on any Pending prescription. If double-check is enabled in your settings, a confirmation dialog will appear. Stock is decremented automatically.",
        placement: 'bottom',
      },
      {
        target:    'pharmacy-inventory',
        title:     '📦 Inventory',
        body:      'Switch to the Inventory tab to see all drugs in stock, add new stock, or flag items for reorder. Low-stock items are highlighted based on your alert threshold.',
        placement: 'bottom',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     APPOINTMENTS
  ════════════════════════════════════════════════════════ */
  appointments: {
    all: [
      {
        target:    null,
        title:     '📅 Appointments',
        body:      "Book, view, and manage consultations here. The view adapts based on your role — doctors see their schedule, patients see their bookings.",
        placement: 'center',
      },
      {
        target:    'appt-calendar',
        title:     '🗓 Calendar View',
        body:      "Appointments are shown chronologically. Confirmed ones are in blue, pending in amber, cancelled in grey. Scroll to see future weeks.",
        placement: 'bottom',
      },
      {
        target:    'appt-book',
        title:     '➕ Book an Appointment',
        body:      "Click 'New Appointment' to select a patient, doctor, date and time. The system checks the doctor's schedule settings to prevent double-booking.",
        placement: 'bottom',
      },
      {
        target:    'appt-export',
        title:     '📥 Export to Calendar',
        body:      "Download your appointments as an .ics file or sync directly to Google Calendar (if connected in Settings → Integrations). Device alarms are included.",
        placement: 'bottom',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     ANALYTICS (Admin)
  ════════════════════════════════════════════════════════ */
  analytics: {
    all: [
      {
        target:    null,
        title:     '📊 Hospital Analytics',
        body:      "A live dashboard of your hospital's performance. Revenue, patient volumes, prescriptions, and trends — all from the real database.",
        placement: 'center',
      },
      {
        target:    'analytics-kpis',
        title:     '📈 KPI Cards',
        body:      'Monthly revenue, total patients, appointments, and prescriptions with month-over-month change indicators. Green = up, Red = down.',
        placement: 'bottom',
      },
      {
        target:    'analytics-chart',
        title:     '📉 Trend Charts',
        body:      'Monthly and weekly trend lines for patient registrations, visits, and revenue. Use these to spot seasonal patterns or operational issues.',
        placement: 'bottom',
      },
      {
        target:    'analytics-audit',
        title:     '🔍 Audit Log',
        body:      "Every action in the system is logged — who accessed what patient record, when, and from where. Required for NDPR compliance and security reviews.",
        placement: 'top',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     STAFF MANAGEMENT (Admin)
  ════════════════════════════════════════════════════════ */
  'staff-management': {
    all: [
      {
        target:    null,
        title:     '👥 Staff Management',
        body:      "Add and manage every staff member in your hospital. Role-based access is enforced — each role sees only what they need.",
        placement: 'center',
      },
      {
        target:    'staff-stats',
        title:     '📊 Staff Statistics',
        body:      'Total staff, active members, suspended accounts, and your subscription seat usage — all at a glance.',
        placement: 'bottom',
      },
      {
        target:    'staff-search',
        title:     '🔍 Search & Filter',
        body:      'Search by name, email, or department. Filter by role: Nurse, Doctor, Pharmacist, Admin, Patient. Helps you find anyone quickly.',
        placement: 'bottom',
      },
      {
        target:    'staff-table',
        title:     '📋 Staff Table',
        body:      'Each row shows the staff member, role, department, and status. Click the action menu to suspend, reset their password, or remove them from the system.',
        placement: 'bottom',
      },
      {
        target:    'staff-add',
        title:     '➕ Add Staff Member',
        body:      "Click 'Add Staff' to invite a new team member. Fill in their role, department, and credentials. They'll receive a temporary password to set up their account.",
        placement: 'bottom',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     PATIENT PORTAL
  ════════════════════════════════════════════════════════ */
  portal: {
    all: [
      {
        target:    null,
        title:     '🏥 Your Health Records',
        body:      "This is your complete medical history — every visit, prescription, diagnosis, and test result from this hospital, securely stored.",
        placement: 'center',
      },
      {
        target:    'portal-visits',
        title:     '📋 Visit History',
        body:      'All your past consultations are listed here with date, doctor, diagnosis, and the full SOAP notes from each visit.',
        placement: 'bottom',
      },
      {
        target:    'portal-prescriptions',
        title:     '💊 Prescriptions',
        body:      'View all prescriptions ever issued to you — the drug names, dosages, and dispensing status. Active prescriptions are highlighted at the top.',
        placement: 'bottom',
      },
      {
        target:    'portal-allergies',
        title:     '⚠️ Allergies & Conditions',
        body:      'Your allergy profile and chronic conditions are visible here. Update them in Settings → Health Profile — they are shown to every doctor who treats you.',
        placement: 'bottom',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     SETTINGS
  ════════════════════════════════════════════════════════ */
  settings: {
    all: [
      {
        target:    null,
        title:     '⚙️ Settings',
        body:      "Customise every aspect of MediBank Nexus to fit how you work. Changes are saved automatically or on clicking 'Save'.",
        placement: 'center',
      },
      {
        target:    'settings-sidebar',
        title:     '🗂 Settings Sections',
        body:      "Your settings are organised into sections. 'Account' settings apply to everyone. The sections below are specific to your role.",
        placement: 'right',
      },
      {
        target:    'settings-profile',
        title:     '👤 Your Profile',
        body:      'Update your display name, title, phone, and email. Your avatar is auto-generated from your initials.',
        placement: 'right',
      },
      {
        target:    'settings-appearance',
        title:     '🎨 Theme & Appearance',
        body:      "Switch between Light, Dark, or System theme. Adjust font size, language, and compact mode. Changes apply instantly — no page reload needed.",
        placement: 'right',
      },
      {
        target:    'settings-integrations',
        title:     '🔗 Integrations',
        body:      "Connect Google Calendar for appointment alarms, Google Drive for record exports, and configure your preferred AI model with your own API key.",
        placement: 'right',
      },
    ],
  },

  /* ════════════════════════════════════════════════════════
     NOTIFICATIONS
  ════════════════════════════════════════════════════════ */
  notifications: {
    all: [
      {
        target:    null,
        title:     '🔔 Notifications',
        body:      'All your in-app alerts appear here — appointment reminders, new prescriptions, system updates, and urgent flags from clinical staff.',
        placement: 'center',
      },
      {
        target:    'notif-list',
        title:     '📋 Notification List',
        body:      'Unread notifications are shown with a blue dot. Click "Mark all read" to clear them all at once, or click individual notifications to view details.',
        placement: 'bottom',
      },
      {
        target:    'notif-settings-link',
        title:     '🔕 Notification Preferences',
        body:      "In Settings → Notifications, choose exactly which events trigger In-App, Email, and SMS alerts. You control the noise level.",
        placement: 'bottom',
      },
    ],
  },

};

export default TOUR_DEFS;
