import {
  AppSettings,
  EmergencyContact,
  SafeJourney,
  SafetyEvent,
} from '../types/safety';

const KEYS = {
  SETTINGS: 'aegisguard_settings_v1',
  CONTACTS: 'aegisguard_contacts_v1',
  EVENTS: 'aegisguard_events_v1',
  JOURNEY: 'aegisguard_active_journey_v1',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  emergencyNumber: '112',
  emergencyNumberLabel: 'India National Emergency (112)',
  alertSoundEnabled: true,
  voiceCommands: ['help me', 'save me', 'emergency', 'sos'],
  shakeEnabled: false,
  shakeThreshold: 24,
  shakeCooldownSec: 12,
  motionSampleWindowSize: 20,
  localStorageConsentGranted: true,
  includeLocationInSOSByDefault: true,
};

export interface StorageReadResult<T> {
  data: T;
  error: string | null;
}

function isStorageAvailable(): boolean {
  try {
    const testKey = '__aegisguard_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeRead<T>(key: string, fallback: T): StorageReadResult<T> {
  if (!isStorageAvailable()) {
    return {
      data: fallback,
      error:
        'Browser LocalStorage is unavailable or blocked. Preferences will remain in memory for this session only.',
    };
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return { data: fallback, error: null };
    }
    const parsed = JSON.parse(raw) as T;
    return { data: parsed, error: null };
  } catch {
    return {
      data: fallback,
      error: `Corrupted local data detected for "${key}". Resetting to safe defaults.`,
    };
  }
}

function safeWrite<T>(key: string, value: T, consentGranted: boolean): string | null {
  if (!consentGranted) {
    return null;
  }
  if (!isStorageAvailable()) {
    return 'LocalStorage is blocked by browser privacy settings.';
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return null;
  } catch {
    return 'Failed to save data to LocalStorage (storage quota or privacy restriction).';
  }
}

export const storageService = {
  loadSettings(): StorageReadResult<AppSettings> {
    const res = safeRead<Partial<AppSettings>>(KEYS.SETTINGS, DEFAULT_SETTINGS);
    return {
      data: { ...DEFAULT_SETTINGS, ...res.data },
      error: res.error,
    };
  },

  saveSettings(settings: AppSettings): string | null {
    // Always allow saving the user's consent decision itself; for other writes respect consent
    if (!isStorageAvailable()) {
      return 'LocalStorage is blocked by browser privacy settings.';
    }
    try {
      if (!settings.localStorageConsentGranted) {
        // Store only the opt-out preference flag or clear all stored items
        window.localStorage.removeItem(KEYS.CONTACTS);
        window.localStorage.removeItem(KEYS.EVENTS);
        window.localStorage.removeItem(KEYS.JOURNEY);
      }
      window.localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      return null;
    } catch {
      return 'Failed to persist settings to LocalStorage.';
    }
  },

  loadContacts(): StorageReadResult<EmergencyContact[]> {
    const res = safeRead<EmergencyContact[]>(KEYS.CONTACTS, []);
    return {
      data: Array.isArray(res.data) ? res.data : [],
      error: res.error,
    };
  },

  saveContacts(contacts: EmergencyContact[], consentGranted: boolean): string | null {
    return safeWrite(KEYS.CONTACTS, contacts, consentGranted);
  },

  loadEvents(): StorageReadResult<SafetyEvent[]> {
    const res = safeRead<SafetyEvent[]>(KEYS.EVENTS, []);
    return {
      data: Array.isArray(res.data) ? res.data : [],
      error: res.error,
    };
  },

  saveEvents(events: SafetyEvent[], consentGranted: boolean): string | null {
    return safeWrite(KEYS.EVENTS, events, consentGranted);
  },

  loadJourney(): StorageReadResult<SafeJourney | null> {
    return safeRead<SafeJourney | null>(KEYS.JOURNEY, null);
  },

  saveJourney(journey: SafeJourney | null, consentGranted: boolean): string | null {
    if (!consentGranted) return null;
    if (!isStorageAvailable()) return 'LocalStorage is unavailable.';
    try {
      if (journey === null) {
        window.localStorage.removeItem(KEYS.JOURNEY);
      } else {
        window.localStorage.setItem(KEYS.JOURNEY, JSON.stringify(journey));
      }
      return null;
    } catch {
      return 'Failed to update journey state in LocalStorage.';
    }
  },

  clearAllLocalData(): string | null {
    if (!isStorageAvailable()) {
      return 'LocalStorage is unavailable.';
    }
    try {
      Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
      return null;
    } catch {
      return 'Unable to clear LocalStorage.';
    }
  },

  exportAllData(
    settings: AppSettings,
    contacts: EmergencyContact[],
    events: SafetyEvent[],
    activeJourney: SafeJourney | null
  ): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        application: 'AegisGuard Personal Safety Platform',
        note: 'All data stored strictly locally in browser. No continuous audio or background location history.',
        settings,
        contacts,
        events,
        activeJourney,
      },
      null,
      2
    );
  },
};
