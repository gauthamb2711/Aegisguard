import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';

interface SOSButtonProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  variant = 'hero',
  className = '',
}) => {
  const { requestSosConfirmation, activeSosEvent } = useSafety();

  const handlePress = () => {
    requestSosConfirmation({
      source: 'MANUAL',
      title: 'Confirm Emergency SOS Activation',
      description:
        'Activating SOS creates an emergency event, retrieves your current GPS coordinates (if permitted), and prepares a shareable alert message. Nothing is sent automatically without your final action.',
    });
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handlePress}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 whitespace-nowrap shrink-0 cursor-pointer shadow-xs ${className}`}
      >
        <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{activeSosEvent ? 'SOS Active — Manage' : 'Trigger SOS'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePress}
      className={`group relative w-full sm:w-auto min-w-[240px] px-8 py-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 cursor-pointer shadow-md shadow-rose-900/15 ${className}`}
    >
      <div className="flex items-center justify-center gap-3.5">
        <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/15 border border-white/25">
          <ShieldAlert className="w-6 h-6 text-white" aria-hidden="true" />
        </span>
        <div className="text-left">
          <div className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
            {activeSosEvent ? 'Emergency SOS Active' : 'Emergency SOS'}
          </div>
          <div className="text-xs text-rose-50 font-medium">
            {activeSosEvent
              ? 'Open confirmation & sharing options'
              : 'Tap for deliberate confirmation'}
          </div>
        </div>
      </div>
    </button>
  );
};
