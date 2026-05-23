/**
 * Navigation configuration for every role.
 *
 * Each section has a label and a list of nav items.
 * Each nav item has:
 *   key      — matches the page key used in AppContext
 *   label    — displayed text
 *   icon     — Icon component name (imported in AppShell)
 *   badge    — optional { count, variant } for notification dots
 */

export const NAV_CONFIG = {

  nurse: [
    {
      section: 'Workspace',
      items: [
        { key: 'dashboard',    label: 'Dashboard',           icon: 'IcGrid'      },
        { key: 'register',     label: 'Register Patient',    icon: 'IcPersonAdd' },
        { key: 'inpatient',    label: 'Inpatient / Wards',   icon: 'IcHospital'  },
        { key: 'billing',      label: 'Billing',             icon: 'IcFileMedical' },
        { key: 'appointments', label: 'Appointments',        icon: 'IcCalendar'  },
        { key: 'lab',          label: 'Lab & Investigations', icon: 'IcFlask'    },
      ],
    },
    {
      section: 'General',
      items: [
        { key: 'notifications', label: 'Notifications', icon: 'IcBell',
          badge: { count: 3, variant: 'danger' } },
        { key: 'settings',      label: 'Settings',      icon: 'IcGear'  },
      ],
    },
  ],

  doctor: [
    {
      section: 'Workspace',
      items: [
        { key: 'dashboard',    label: 'Dashboard',           icon: 'IcGrid'        },
        { key: 'consultation', label: 'Consultation',        icon: 'IcStethoscope' },
        { key: 'inpatient',    label: 'Inpatient / Wards',   icon: 'IcHospital'    },
        { key: 'referrals',    label: 'Referrals',           icon: 'IcArrowRight'  },
        { key: 'appointments', label: 'Appointments',        icon: 'IcCalendar'    },
        { key: 'lab',          label: 'Lab & Investigations', icon: 'IcFlask'      },
      ],
    },
    {
      section: 'General',
      items: [
        { key: 'notifications', label: 'Notifications', icon: 'IcBell',
          badge: { count: 2, variant: 'danger' } },
        { key: 'settings',      label: 'Settings',      icon: 'IcGear'  },
      ],
    },
  ],

  pharmacist: [
    {
      section: 'Workspace',
      items: [
        { key: 'dashboard',  label: 'Dashboard',     icon: 'IcGrid' },
        { key: 'pharmacy',   label: 'Rx Queue',       icon: 'IcPill',
          badge: { count: 3, variant: 'danger' } },
        { key: 'formulary',  label: 'Drug Formulary', icon: 'IcBox'  },
      ],
    },
    {
      section: 'General',
      items: [
        { key: 'notifications', label: 'Notifications', icon: 'IcBell',
          badge: { count: 1, variant: 'danger' } },
        { key: 'settings',      label: 'Settings',      icon: 'IcGear'  },
      ],
    },
  ],

  admin: [
    {
      section: 'Workspace',
      items: [
        { key: 'dashboard',        label: 'Dashboard',           icon: 'IcGrid'       },
        { key: 'analytics',        label: 'Analytics',           icon: 'IcBarChart'   },
        { key: 'billing',          label: 'Billing',             icon: 'IcFileMedical'},
        { key: 'lab',              label: 'Lab & Investigations', icon: 'IcFlask'     },
        { key: 'formulary',        label: 'Drug Formulary',       icon: 'IcBox'       },
        { key: 'inpatient',        label: 'Inpatient / Wards',   icon: 'IcHospital'   },
        { key: 'referrals',        label: 'Referrals',           icon: 'IcArrowRight' },
        { key: 'staff-management', label: 'Staff Management',    icon: 'IcPeople'     },
      ],
    },
    {
      section: 'System',
      items: [
        { key: 'notifications', label: 'Notifications', icon: 'IcBell',
          badge: { count: 8, variant: 'danger' } },
        { key: 'settings',      label: 'Settings',      icon: 'IcGear'  },
      ],
    },
  ],

  patient: [
    {
      section: 'My Health',
      items: [
        { key: 'portal',       label: 'My Records',    icon: 'IcFileMedical' },
        { key: 'appointments', label: 'Appointments',  icon: 'IcCalendar'    },
      ],
    },
    {
      section: 'Account',
      items: [
        { key: 'notifications', label: 'Notifications', icon: 'IcBell',
          badge: { count: 3, variant: 'danger' } },
        { key: 'settings',      label: 'Settings',      icon: 'IcGear'  },
      ],
    },
  ],

};

/** Page titles shown in the topbar breadcrumb */
export const PAGE_TITLES = {
  dashboard:        'Dashboard',
  register:         'Register Patient',
  consultation:     'Consultation',
  pharmacy:         'Pharmacy Rx Queue',
  appointments:     'Appointments',
  analytics:        'Analytics',
  portal:           'My Health Records',
  notifications:    'Notifications',
  settings:         'Settings',
  'staff-management': 'Staff Management',
  billing:            'Billing & Payments',
  lab:                'Lab & Investigations',
  formulary:          'Drug Formulary',
  inpatient:          'Inpatient & Ward Management',
  referrals:          'Referrals',
};
