/**
 * MediBank Nexus — Mock Hospitals (Tenants)
 *
 * Each hospital is an independent tenant on the platform.
 * In production these come from the backend API.
 */

export const MOCK_HOSPITALS = [
  {
    id:            'hosp_001',
    name:          'Lagos General Hospital',
    shortName:     'LGH',
    type:          'Government Hospital',
    tier:          'enterprise',
    address:       '23 Broad Street, Lagos Island',
    city:          'Lagos',
    state:         'Lagos',
    phone:         '+234 801 234 5678',
    email:         'admin@lagosgeneralhospital.ng',
    primaryColor:  '#0a6ebd',
    staffCount:    48,
    patientCount:  5486,
    createdAt:     '2024-01-15',
    status:        'active',
    licenseNumber: 'MDCN/2024/LGS/001',
  },
  {
    id:            'hosp_002',
    name:          'Abuja Medical Centre',
    shortName:     'AMC',
    type:          'Private Hospital',
    tier:          'professional',
    address:       '7 Wuse Zone 4, Abuja',
    city:          'Abuja',
    state:         'FCT',
    phone:         '+234 802 345 6789',
    email:         'admin@abujamedicalcentre.ng',
    primaryColor:  '#0d9488',
    staffCount:    22,
    patientCount:  1832,
    createdAt:     '2024-03-20',
    status:        'active',
    licenseNumber: 'MDCN/2024/FCT/045',
  },
  {
    id:            'hosp_003',
    name:          'Port Harcourt Clinic',
    shortName:     'PHC',
    type:          'Private Clinic',
    tier:          'starter',
    address:       '12 Aba Road, Port Harcourt',
    city:          'Port Harcourt',
    state:         'Rivers',
    phone:         '+234 803 456 7890',
    email:         'admin@phclinic.ng',
    primaryColor:  '#7c3aed',
    staffCount:    8,
    patientCount:  412,
    createdAt:     '2024-06-01',
    status:        'trial',
    licenseNumber: 'MDCN/2024/RVS/112',
  },
];

/** Subscription tier definitions */
export const TIER_CONFIG = {
  free_trial: {
    label:        'Free Trial',
    price:        '₦0',
    period:       '/30 days',
    color:        '#6b7280',
    bg:           '#f3f4f6',
    maxStaff:     5,
    maxPatients:  200,
    trialDays:    30,
    paystackCode: null,
    features: [
      'Up to 5 staff accounts',
      'Patient Registration',
      'Basic Appointments',
      'Notifications',
      'Community support',
    ],
    locked: [
      'Nexus AI Assistant',
      'Analytics Dashboard',
      'Pharmacy Rx Queue',
      'Lab & Investigations',
      'Drug Formulary',
      'Billing Reports',
    ],
  },
  pro: {
    label:        'Pro',
    price:        '₦80,000',
    period:       '/month',
    color:        '#0d9488',
    bg:           '#e0f7f4',
    maxStaff:     30,
    maxPatients:  5000,
    trialDays:    null,
    paystackCode: 'PLN_pro_medibank', // replace with live Paystack plan code
    features: [
      'Up to 30 staff accounts',
      'All Free Trial features',
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
  custom: {
    label:        'Custom',
    price:        'Custom',
    period:       '',
    color:        '#0a6ebd',
    bg:           '#e8f2fb',
    maxStaff:     null,
    maxPatients:  null,
    trialDays:    null,
    paystackCode: null,
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
  /* Legacy keys kept for backward compat with existing mock hospitals */
  starter:      { label: 'Starter',      price: '₦25,000/mo', color: '#6b7280', bg: '#f3f4f6', maxStaff: 10,   maxPatients: 500,  features: [] },
  professional: { label: 'Pro',          price: '₦80,000/mo', color: '#0d9488', bg: '#e0f7f4', maxStaff: 30,   maxPatients: 5000, features: [] },
  enterprise:   { label: 'Custom',       price: 'Custom',      color: '#0a6ebd', bg: '#e8f2fb', maxStaff: null, maxPatients: null, features: [] },
};

/** Nigerian states for the onboarding form */
export const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

/** Hospital type options */
export const HOSPITAL_TYPES = [
  'Government Hospital',
  'Teaching Hospital',
  'Private Hospital',
  'Private Clinic',
  'Specialist Hospital',
  'Maternity / Birthing Centre',
  'Dental Clinic',
  'Eye Clinic',
  'Mental Health Facility',
  'Rehabilitation Centre',
  'Diagnostic Centre',
];
