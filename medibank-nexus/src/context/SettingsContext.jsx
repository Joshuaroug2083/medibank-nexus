import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SettingsCtx = createContext(null);
export const useSettings = () => {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
};

/* ── Default settings (merged with stored values on load) ─────── */
const DEFAULTS = {
  /* Universal */
  profile: { name: '', phone: '', email: '', title: '', avatar: '' },
  notifications: {
    inApp:  { appointments: true,  prescriptions: true,  newPatient: true,  labResults: true,  billing: true  },
    email:  { appointments: true,  prescriptions: false, newPatient: false, labResults: false, billing: true  },
    sms:    { appointments: true,  prescriptions: false, newPatient: false, labResults: false, billing: false },
  },
  appearance: { theme: 'light', fontSize: 'medium', language: 'en', compactMode: false },

  /* Doctor */
  clinical: {
    soapTemplate:     '',
    vitalsOrder:      ['bp','pulse','temp','spo2','rr','weight'],
    defaultDuration:  30,
    autoSummarize:    true,
    aiAssistOnConsult:true,
    preferredAiModel: 'claude',
  },
  schedule: {
    workingDays:  [1,2,3,4,5],
    startTime:    '08:00',
    endTime:      '17:00',
    slotDuration: 30,
    lunchBreak:   true,
    lunchStart:   '12:00',
    lunchEnd:     '13:00',
  },

  /* Nurse */
  registration: {
    defaultState:     '',
    requireInsurance: false,
    requireNin:       false,
    autoGenerateId:   true,
    defaultBloodGroup:'',
  },

  /* Pharmacist */
  pharmacy: {
    lowStockThreshold:    30,
    alertOnLowStock:      true,
    requireDoubleCheck:   false,
    defaultRoute:         'Oral',
    dispensingNotes:      true,
  },

  /* Patient */
  health: {
    bloodGroup:  '',
    genotype:    '',
    allergies:   [],
    conditions:  [],
    medications: [],
  },
  privacy: {
    shareWithDoctors:     true,
    shareWithPharmacists: true,
    allowAiAccess:        true,
    showInStaffDirectory: false,
  },
  emergencyContacts: [],

  /* Admin */
  hospital: {
    name: '', phone: '', email: '', address: '',
    city: '', state: '', primaryColor: '#0a6ebd', website: '',
  },
  compliance: {
    dataRetentionMonths:      84,
    requireConsentOnRegister: true,
    auditAllAccess:           true,
    exportEnabled:            true,
    anonymizeAfterRetention:  true,
  },
};

function storageKey(userId) { return `nexus_settings_${userId}`; }

function mergeDeep(defaults, stored) {
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (stored?.[key] !== undefined) {
      result[key] = typeof defaults[key] === 'object' && !Array.isArray(defaults[key])
        ? { ...defaults[key], ...stored[key] }
        : stored[key];
    }
  }
  return result;
}

export function SettingsProvider({ children }) {
  const { user } = useAuth();

  const [settings, setSettings] = useState(DEFAULTS);
  const [dirty,    setDirty]    = useState(false);

  /* Load from localStorage when user changes */
  useEffect(() => {
    if (!user) return;
    try {
      const raw     = localStorage.getItem(storageKey(user.id));
      const stored  = raw ? JSON.parse(raw) : {};
      const merged  = mergeDeep(DEFAULTS, stored);
      /* Pre-fill profile from auth user */
      merged.profile = {
        ...merged.profile,
        name:  merged.profile.name  || user.name  || '',
        email: merged.profile.email || user.email || '',
        title: merged.profile.title || user.dept  || '',
      };
      setSettings(merged);
    } catch {
      setSettings(DEFAULTS);
    }
    setDirty(false);
  }, [user?.id]);

  /* Apply theme whenever appearance.theme changes */
  useEffect(() => {
    const theme = settings.appearance.theme;
    const root  = document.documentElement;
    if (theme === 'dark')   root.setAttribute('data-theme', 'dark');
    else if (theme === 'light') root.removeAttribute('data-theme');
    else {
      /* System: follow OS preference */
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme');
    }
  }, [settings.appearance.theme]);

  /* Apply font size */
  useEffect(() => {
    const sizes = { small: '13px', medium: '15px', large: '17px' };
    document.documentElement.style.setProperty('--base-font-size', sizes[settings.appearance.fontSize] ?? '15px');
  }, [settings.appearance.fontSize]);

  /** Patch a top-level settings section */
  const patch = useCallback((section, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: typeof value === 'object' && !Array.isArray(value)
        ? { ...prev[section], ...value }
        : value,
    }));
    setDirty(true);
  }, []);

  /** Save all settings to localStorage */
  const save = useCallback(() => {
    if (!user) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify(settings));
    setDirty(false);
  }, [user, settings]);

  /** Immediately save a single patch (no "save" button needed for toggles) */
  const patchAndSave = useCallback((section, value) => {
    setSettings(prev => {
      const next = {
        ...prev,
        [section]: typeof value === 'object' && !Array.isArray(value)
          ? { ...prev[section], ...value }
          : value,
      };
      if (user) localStorage.setItem(storageKey(user.id), JSON.stringify(next));
      return next;
    });
  }, [user]);

  /** Reset one section to defaults */
  const resetSection = useCallback((section) => {
    patch(section, DEFAULTS[section]);
  }, [patch]);

  return (
    <SettingsCtx.Provider value={{ settings, patch, patchAndSave, save, dirty, resetSection, DEFAULTS }}>
      {children}
    </SettingsCtx.Provider>
  );
}
