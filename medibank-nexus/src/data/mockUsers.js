/**
 * MediBank Nexus — Mock Users & Role Config
 *
 * In production these come from the backend API.
 * During development / demo mode these are used directly.
 *
 * Import anywhere with:
 *   import { MOCK_USERS, ROLE_CONFIG } from '../data/mockUsers';
 */

export const MOCK_USERS = [
  {
    id:         1,
    email:      'nurse@medibank.ng',
    password:   'nurse123',
    role:       'nurse',
    name:       'Adaeze Okonkwo',
    initials:   'AO',
    dept:       'Front Desk & Admissions',
    hospitalId: 'hosp_001',
  },
  {
    id:         2,
    email:      'doctor@medibank.ng',
    password:   'doctor123',
    role:       'doctor',
    name:       'Dr. Emeka Nwosu',
    initials:   'EN',
    dept:       'General Medicine',
    hospitalId: 'hosp_001',
  },
  {
    id:         3,
    email:      'pharma@medibank.ng',
    password:   'pharma123',
    role:       'pharmacist',
    name:       'Bisi Adeleke',
    initials:   'BA',
    dept:       'Pharmacy',
    hospitalId: 'hosp_001',
  },
  {
    id:         4,
    email:      'admin@medibank.ng',
    password:   'admin123',
    role:       'admin',
    name:       'Joshua Bankole',
    initials:   'JB',
    dept:       'Administration',
    hospitalId: 'hosp_001',
  },
  {
    id:         5,
    email:      'patient@medibank.ng',
    password:   'patient123',
    role:       'patient',
    name:       'Chidi Obi',
    initials:   'CO',
    dept:       'Patient Portal',
    hospitalId: 'hosp_001',
  },
  /* ── Demo: Abuja Medical Centre staff ── */
  {
    id:         6,
    email:      'nurse@abujamedical.ng',
    password:   'nurse123',
    role:       'nurse',
    name:       'Fatima Musa',
    initials:   'FM',
    dept:       'Front Desk & Admissions',
    hospitalId: 'hosp_002',
  },
  {
    id:         7,
    email:      'admin@abujamedical.ng',
    password:   'admin123',
    role:       'admin',
    name:       'Yusuf Ibrahim',
    initials:   'YI',
    dept:       'Administration',
    hospitalId: 'hosp_002',
  },
];

/**
 * Role-specific configuration.
 * color      — primary accent for this role
 * bg         — light tint background
 * label      — human-readable role name
 * pages      — which nav pages this role can access
 */
export const ROLE_CONFIG = {
  nurse: {
    label:  'Nurse',
    color:  'var(--teal)',
    bg:     'var(--teal-light)',
    pages:  ['register', 'appointments', 'notifications'],
  },
  doctor: {
    label:  'Doctor',
    color:  'var(--primary)',
    bg:     'var(--primary-light)',
    pages:  ['consultation', 'appointments', 'notifications'],
  },
  pharmacist: {
    label:  'Pharmacist',
    color:  'var(--warning)',
    bg:     'var(--warning-light)',
    pages:  ['pharmacy', 'notifications'],
  },
  admin: {
    label:  'Admin',
    color:  '#374151',
    bg:     '#f3f4f6',
    pages:  ['analytics', 'notifications'],
  },
  patient: {
    label:  'Patient',
    color:  'var(--primary)',
    bg:     'var(--primary-light)',
    pages:  ['portal', 'notifications'],
  },
};
