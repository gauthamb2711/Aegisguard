import React from 'react';
import { AlertTriangle, ShieldAlert, Smartphone } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';

export const ShakeDetection: React.FC = () => {
  const {
    settings,
    updateSettings,
    motionApiAvailable,
    motionPermission,
    hasHardwareMotionData,
    shakePeaksCount,
    shakeCooldownRemaining,
    requestMotionPermission,
    simulateShakeTrigger,
  } = useSafety();

  const handleToggleShake = async () => {
    if (!settings.shakeEnabled) {
      if (motionApiAvailable) {
        const perm = await requestMotionPermission();
        if (perm === 'denied') return;
      }
      updateSettings({ shakeEnabled: true });
    } else {
      updateSettings({ shakeEnabled: false });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          Shake-to-Alert Configuration
        </h2>
        <p className="text-sm text-[#4B4560]">
          Detects rapid multi-peak device shaking via the Browser DeviceMotion API and opens a cancellable SOS confirmation screen.
        </p>
      </div>

      <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
                Shake Detection: {settings.shakeEnabled ? 'Enabled' : 'Disabled'}
              </h3>
              <p className="text-xs text-[#5B5570]">
                DeviceMotion API: {motionApiAvailable ? 'Present' : 'Unsupported'} · Permission: {motionPermission} · Hardware stream: {hasHardwareMotionData ? 'Detected' : 'Not observed'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void requestMotionPermission()}
              disabled={!motionApiAvailable}
              className="px-3.5 py-2 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 disabled:opacity-50 border border-[#DCD4EA] text-xs font-medium text-[#342E49] whitespace-nowrap cursor-pointer"
            >
              Request Motion Permission
            </button>
            <button
              type="button"
              onClick={() => void handleToggleShake()}
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap cursor-pointer ${
                settings.shakeEnabled
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {settings.shakeEnabled ? 'Disable Shake-to-Alert' : 'Enable Shake-to-Alert'}
            </button>
          </div>
        </div>

        {motionPermission === 'denied' && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-red-800">
            DeviceMotion permission was denied. Grant Motion & Orientation permission in your mobile browser settings to use physical shake detection.
          </div>
        )}

        {!hasHardwareMotionData && (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Desktop and laptop browsers generally do not have physical accelerometer hardware even when the DeviceMotion API interface exists. This app does not pretend a laptop can detect physical shakes. Use a smartphone browser to test physical shaking, or use the simulation button below.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="shake-threshold" className="font-medium text-[#1E1B2E]">
                Shake Acceleration Threshold
              </label>
              <span className="font-mono text-purple-700 font-semibold tabular-nums">
                {settings.shakeThreshold} m/s²
              </span>
            </div>
            <input
              id="shake-threshold"
              type="range"
              min={15}
              max={38}
              step={1}
              value={settings.shakeThreshold}
              onChange={(e) =>
                updateSettings({ shakeThreshold: Number(e.target.value) })
              }
              className="w-full accent-purple-600"
            />
            <p className="text-xs text-[#5B5570]">
              Requires 3 acceleration peaks above threshold within 1.4 seconds to avoid false triggers during normal walking.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="shake-cooldown" className="font-medium text-[#1E1B2E]">
                Trigger Cooldown Period
              </label>
              <span className="font-mono text-rose-700 font-semibold tabular-nums">
                {settings.shakeCooldownSec} seconds
              </span>
            </div>
            <input
              id="shake-cooldown"
              type="range"
              min={5}
              max={30}
              step={1}
              value={settings.shakeCooldownSec}
              onChange={(e) =>
                updateSettings({ shakeCooldownSec: Number(e.target.value) })
              }
              className="w-full accent-rose-600"
            />
            <p className="text-xs text-[#5B5570]">
              Prevents repeated confirmation popups after a shake trigger.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs tabular-nums">
          <div className="p-3.5 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
            <div className="text-[#5B5570] font-sans">Recent Peaks in Window</div>
            <div className="mt-1 text-base font-bold text-[#1E1B2E]">
              {shakePeaksCount} / 3
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
            <div className="text-[#5B5570] font-sans">Active Cooldown</div>
            <div className="mt-1 text-base font-bold text-[#1E1B2E]">
              {shakeCooldownRemaining}s
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 max-w-xl">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Shake-to-Alert Demonstration Simulator
          </h3>
          <p className="text-xs text-[#5B5570]">
            Simulates a 3-peak shake event on devices without accelerometers so you can verify the confirmation and cancellation flow.
          </p>
        </div>

        <button
          type="button"
          onClick={simulateShakeTrigger}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          <span>Simulate Shake Event</span>
        </button>
      </div>
    </div>
  );
};
