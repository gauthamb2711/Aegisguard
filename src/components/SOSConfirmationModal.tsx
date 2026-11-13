import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, ShieldAlert, X } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';

export const SOSConfirmationModal: React.FC = () => {
  const {
    pendingConfirmation,
    settings,
    locationPermission,
    confirmSosActivation,
    cancelPendingConfirmation,
  } = useSafety();
  const navigate = useNavigate();
  const [includeLocation, setIncludeLocation] = useState(
    settings.includeLocationInSOSByDefault
  );
  const [customNotes, setCustomNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!pendingConfirmation) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await confirmSosActivation({
        source: pendingConfirmation.source,
        includeLocation,
        customNotes: customNotes.trim() || undefined,
      });
      setCustomNotes('');
      navigate('/sos');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setCustomNotes('');
    cancelPendingConfirmation(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B2E]/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-rose-200 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-red-600 shrink-0">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="sos-confirm-title"
                className="font-display text-lg font-bold text-[#1E1B2E]"
              >
                {pendingConfirmation.title}
              </h2>
              <p className="mt-1 text-sm text-[#4B4560] leading-relaxed">
                {pendingConfirmation.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close confirmation dialog"
            className="p-1.5 rounded-lg text-[#6D6684] hover:text-[#1E1B2E] hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {pendingConfirmation.detectedTriggerDetail && (
          <div className="mt-4 px-3.5 py-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs font-mono text-purple-900">
            Trigger detail: {pendingConfirmation.detectedTriggerDetail}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] cursor-pointer">
            <input
              type="checkbox"
              checked={includeLocation}
              onChange={(e) => setIncludeLocation(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="text-sm">
              <div className="font-medium text-[#1E1B2E] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                <span>Attach current GPS coordinates to SOS message</span>
              </div>
              <p className="text-xs text-[#5B5570] mt-0.5">
                Permission status: {locationPermission}. If location is denied or unavailable, SOS still proceeds without coordinates.
              </p>
            </div>
          </label>

          <div>
            <label
              htmlFor="sos-optional-note"
              className="block text-xs font-medium text-[#342E49] mb-1.5"
            >
              Optional context note for your emergency message
            </label>
            <input
              id="sos-optional-note"
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g., Near Central Metro Gate 2"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#DCD4EA] text-sm text-[#1E1B2E] placeholder:text-[#8E86A4] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Confirming opens the Emergency SOS Console with prepared SMS, email, share sheet, and emergency helpline ({settings.emergencyNumber}) actions. No message or call is sent silently.
          </span>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isConfirming}
            className="px-4 py-2.5 rounded-lg border border-[#DCD4EA] bg-white hover:bg-purple-50 text-sm font-medium text-[#342E49] transition-colors whitespace-nowrap cursor-pointer"
          >
            Cancel Alert
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-sm font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            {isConfirming ? 'Preparing SOS...' : 'Confirm & Activate SOS'}
          </button>
        </div>
      </div>
    </div>
  );
};
