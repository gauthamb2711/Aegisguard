import React from 'react';
import {
  CheckCircle2,
  MapPin,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { SafetyEvent } from '../types/safety';

interface AlertCardProps {
  event: SafetyEvent;
  onSelect?: (event: SafetyEvent) => void;
}

const EVENT_LABELS: Record<SafetyEvent['type'], string> = {
  MANUAL_SOS: 'Manual SOS',
  VOICE_TRIGGERED_SOS: 'Voice-Triggered SOS',
  SHAKE_TRIGGERED_SOS: 'Shake-Triggered SOS',
  UNUSUAL_MOVEMENT_ALERT: 'Unusual Movement Alert',
  JOURNEY_CHECKIN_MISSED: 'Journey Check-In Reminder',
  FAKE_CALL_TRIGGERED: 'Simulated Fake Call',
  SOS_CANCELLED: 'Cancelled Prompt',
};

export const AlertCard: React.FC<AlertCardProps> = ({ event, onSelect }) => {
  const statusStyles: Record<SafetyEvent['status'], string> = {
    ACTIVE: 'text-red-600 font-semibold',
    RESOLVED: 'text-teal-700 font-semibold',
    CANCELLED: 'text-[#6D6684]',
    ACKNOWLEDGED: 'text-amber-700 font-semibold',
  };

  return (
    <div
      onClick={() => onSelect?.(event)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(event);
        }
      }}
      className={`p-4 rounded-xl bg-white border border-[#EAE4F2] shadow-xs transition-colors ${
        onSelect ? 'hover:border-purple-300 cursor-pointer' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {event.status === 'ACTIVE' ? (
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          ) : event.status === 'CANCELLED' ? (
            <XCircle className="w-4 h-4 text-[#6D6684] shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
          )}
          <span className="font-display text-sm font-semibold text-[#1E1B2E]">
            {EVENT_LABELS[event.type]}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#5B5570] font-mono tabular-nums">
          <span className={statusStyles[event.status]}>{event.status}</span>
          <span aria-hidden="true">·</span>
          <span>{new Date(event.timestamp).toLocaleString()}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-[#4B4560] leading-relaxed">{event.notes}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B5570]">
        <span className="font-mono">{event.id}</span>
        <span aria-hidden="true">·</span>
        <span>
          Confirmed: {event.userConfirmed ? 'Yes' : 'No'}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Share action: {event.sharedVia === 'NONE' ? 'Prepared only' : event.sharedVia}
        </span>
        {event.location && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-purple-700 font-mono tabular-nums">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
