import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Lock,
  Save,
  Trash2,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { storageService } from '../services/storageService';

export const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    clearAllData,
    contacts,
    events,
    activeJourney,
    locationPermission,
    refreshLocation,
  } = useSafety();

  const [emergencyNumber, setEmergencyNumber] = useState(
    settings.emergencyNumber
  );
  const [emergencyLabel, setEmergencyLabel] = useState(
    settings.emergencyNumberLabel
  );
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveEmergencyNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = emergencyNumber.trim();
    if (!/^[+\d\s-]{2,15}$/.test(cleaned)) {
      setSavedFeedback('Please enter a valid emergency helpline number.');
      return;
    }
    updateSettings({
      emergencyNumber: cleaned,
      emergencyNumberLabel: emergencyLabel.trim() || 'Local Emergency Helpline',
    });
    setSavedFeedback('Emergency helpline number updated.');
    window.setTimeout(() => setSavedFeedback(null), 2500);
  };

  const handleExportAll = () => {
    const json = storageService.exportAllData(
      settings,
      contacts,
      events,
      activeJourney
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegisguard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          Settings & Privacy
        </h2>
        <p className="text-sm text-[#4B4560]">
          Configure your emergency helpline number, sensor thresholds, alert sound preferences, and local data controls.
        </p>
      </div>

      <form
        onSubmit={handleSaveEmergencyNumber}
        className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-4 shadow-xs"
      >
        <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
          Local Emergency Helpline Number
        </h3>
        <p className="text-xs text-[#5B5570]">
          Defaults to <span className="font-mono font-semibold text-[#1E1B2E]">112</span> (India National Emergency Helpline). Edit this if you are in another region (e.g., 911, 999, 112). Calling always opens your device dialer for user confirmation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="set-em-num" className="block text-xs font-medium text-[#342E49]">
              Emergency Number
            </label>
            <input
              id="set-em-num"
              type="text"
              value={emergencyNumber}
              onChange={(e) => setEmergencyNumber(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="set-em-lbl" className="block text-xs font-medium text-[#342E49]">
              Region / Service Label
            </label>
            <input
              id="set-em-lbl"
              type="text"
              value={emergencyLabel}
              onChange={(e) => setEmergencyLabel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-teal-700">{savedFeedback ?? ''}</span>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Save Helpline</span>
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-4 shadow-xs">
        <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
          Permissions, Audio & Sensor Preferences
        </h3>

        <div className="divide-y divide-[#EAE4F2]">
          <div className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[#1E1B2E]">
                Alert Sound Chimes
              </div>
              <div className="text-xs text-[#5B5570]">
                Play synthesized Web Audio alert chimes when SOS confirmation or check-in reminders appear.
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSettings({ alertSoundEnabled: !settings.alertSoundEnabled })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                settings.alertSoundEnabled
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#FAF8FC] text-[#4B4560] border border-[#DCD4EA]'
              }`}
            >
              {settings.alertSoundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          <div className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[#1E1B2E]">
                Default GPS Inclusion in SOS
              </div>
              <div className="text-xs text-[#5B5570]">
                Current GPS permission: {locationPermission}. Can still be toggled per alert.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshLocation()}
                className="px-3 py-1.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-medium text-[#342E49] cursor-pointer"
              >
                Test GPS
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    includeLocationInSOSByDefault:
                      !settings.includeLocationInSOSByDefault,
                  })
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  settings.includeLocationInSOSByDefault
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#FAF8FC] text-[#4B4560] border border-[#DCD4EA]'
                }`}
              >
                {settings.includeLocationInSOSByDefault ? 'Included' : 'Excluded'}
              </button>
            </div>
          </div>

          <div className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[#1E1B2E]">
                Shake Detection & Voice Commands
              </div>
              <div className="text-xs text-[#5B5570]">
                Shake-to-Alert: {settings.shakeEnabled ? 'Enabled' : 'Disabled'} · {settings.voiceCommands.length} voice trigger phrases configured.
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <Link to="/shake" className="text-purple-700 hover:text-purple-900">
                Shake Settings
              </Link>
              <Link to="/voice" className="text-purple-700 hover:text-purple-900">
                Voice Settings
              </Link>
              <Link to="/contacts" className="text-purple-700 hover:text-purple-900">
                Contacts ({contacts.length})
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-4 shadow-xs">
        <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
          Local Data Portability & Deletion
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-semibold text-[#1E1B2E] cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-600" aria-hidden="true" />
            <span>Export All Local Data (JSON)</span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-red-700 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Clear All Local Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300">
              <span className="text-xs text-rose-900">
                Erase all contacts, history, and settings?
              </span>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setEmergencyNumber('112');
                  setEmergencyLabel('India National Emergency (112)');
                  setConfirmReset(false);
                }}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer"
              >
                Confirm Erase
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-xs text-[#4B4560] hover:text-[#1E1B2E] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600" aria-hidden="true" />
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Privacy & Security Architecture
          </h3>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B4560] leading-relaxed">
          <li>Location is accessed strictly via browser Geolocation API only when you grant permission.</li>
          <li>Motion sensor streams and Random Forest ML inference execute 100% locally in your browser.</li>
          <li>No cloud database, backend API, or external telemetry service receives your contacts or events.</li>
          <li>No continuous audio or video recording is ever stored—speech recognition runs transiently in memory.</li>
          <li>Web browsers cannot monitor sensors, GPS, or voice commands in the background after the browser tab is closed.</li>
          <li>All synthetic simulator waveforms and training datasets are explicitly labeled as simulated/synthetic data.</li>
        </ul>
      </div>
    </div>
  );
};
