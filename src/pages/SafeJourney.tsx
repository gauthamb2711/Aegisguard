import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Route,
  ShieldAlert,
  Square,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { LocationPanel } from '../components/LocationPanel';

function formatTimer(totalSec: number): string {
  const abs = Math.abs(totalSec);
  const hrs = Math.floor(abs / 3600);
  const mins = Math.floor((abs % 3600) / 60);
  const secs = abs % 60;
  const base = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return hrs > 0 ? `${hrs}:${base}` : base;
}

export const SafeJourney: React.FC = () => {
  const {
    activeJourney,
    journeyElapsedSec,
    journeyCheckInRemainingSec,
    startJourney,
    checkInJourney,
    endJourney,
    requestSosConfirmation,
  } = useSafety();

  const [destination, setDestination] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [checkInIntervalMinutes, setCheckInIntervalMinutes] = useState(10);
  const [formError, setFormError] = useState<string | null>(null);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim().length < 2) {
      setFormError('Enter a destination name or landmark label.');
      return;
    }
    setFormError(null);
    startJourney({
      destination: destination.trim(),
      estimatedMinutes,
      checkInIntervalMinutes,
    });
    setDestination('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          Safe Journey Monitoring
        </h2>
        <p className="text-sm text-[#4B4560]">
          Track elapsed commute time, receive periodic safety check-in reminders, and watch live browser GPS coordinates while the journey is active.
        </p>
      </div>

      {activeJourney ? (
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-purple-700">
                Active Safe Journey · Started{' '}
                {new Date(activeJourney.startedAt).toLocaleTimeString()}
              </div>
              <h3 className="font-display text-xl font-bold text-[#1E1B2E]">
                Destination: {activeJourney.destination}
              </h3>
              <p className="text-xs text-[#5B5570]">
                Estimated trip duration: {activeJourney.estimatedMinutes} min · Check-in every {activeJourney.checkInIntervalMinutes} min
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={checkInJourney}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>I Am Safe (Check In)</span>
              </button>
              <button
                type="button"
                onClick={endJourney}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-semibold text-[#342E49] whitespace-nowrap cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                <span>End Journey</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  requestSosConfirmation({
                    source: 'JOURNEY_CHECKIN',
                    title: 'Confirm SOS During Journey',
                    description: `Confirm manual SOS activation while travelling to "${activeJourney.destination}".`,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                <span>Trigger SOS</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono tabular-nums">
            <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
              <div className="text-xs text-[#5B5570] font-sans">Elapsed Time</div>
              <div className="mt-1 text-2xl font-bold text-[#1E1B2E]">
                {formatTimer(journeyElapsedSec)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
              <div className="text-xs text-[#5B5570] font-sans">
                Next Check-In Countdown
              </div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  (journeyCheckInRemainingSec ?? 0) <= 0
                    ? 'text-rose-700'
                    : 'text-purple-700'
                }`}
              >
                {journeyCheckInRemainingSec !== null
                  ? journeyCheckInRemainingSec <= 0
                    ? `Overdue (${formatTimer(journeyCheckInRemainingSec)})`
                    : formatTimer(journeyCheckInRemainingSec)
                  : '--:--'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
              <div className="text-xs text-[#5B5570] font-sans">Journey State</div>
              <div className="mt-1 text-lg font-bold text-[#1E1B2E] font-sans">
                {activeJourney.status === 'CHECKIN_OVERDUE'
                  ? 'Check-In Reminder Active'
                  : 'Monitoring Active'}
              </div>
            </div>
          </div>

          {activeJourney.status === 'CHECKIN_OVERDUE' && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
              <div className="font-semibold">
                Check-In Timer Expired — Are you safe?
              </div>
              <p className="text-rose-900">
                A missed check-in does NOT automatically declare an emergency or send alerts without your confirmation. Click "I Am Safe (Check In)" to reset the timer, or use "Trigger SOS" if you need assistance.
              </p>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleStart}
          className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-5 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Route className="w-5 h-5 text-purple-600" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[#1E1B2E]">
              Start a New Safe Journey
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <label
                htmlFor="journey-destination"
                className="block text-xs font-medium text-[#342E49]"
              >
                Destination Label
              </label>
              <input
                id="journey-destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Home / Campus Hostel"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] placeholder:text-[#8E86A4] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="journey-eta"
                className="block text-xs font-medium text-[#342E49]"
              >
                Estimated Arrival (minutes)
              </label>
              <input
                id="journey-eta"
                type="number"
                min={5}
                max={480}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value) || 15)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="journey-checkin"
                className="block text-xs font-medium text-[#342E49]"
              >
                Check-In Reminder Interval (minutes)
              </label>
              <input
                id="journey-checkin"
                type="number"
                min={1}
                max={120}
                value={checkInIntervalMinutes}
                onChange={(e) =>
                  setCheckInIntervalMinutes(Number(e.target.value) || 5)
                }
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <p className="text-xs text-[#5B5570] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#6D6684]" aria-hidden="true" />
              <span>
                Uses destination label and browser GPS only—no fabricated route directions or traffic times.
              </span>
            </p>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white whitespace-nowrap cursor-pointer"
            >
              Start Safe Journey
            </button>
          </div>
        </form>
      )}

      <LocationPanel />
    </div>
  );
};
