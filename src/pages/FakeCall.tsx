import React, { useEffect, useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { useSafety } from '../context/SafetyContext';
import { sosService } from '../services/sosService';

type CallPhase = 'IDLE' | 'RINGING' | 'CONNECTED';

export const FakeCall: React.FC = () => {
  const { logSafetyEvent } = useSafety();
  const [callerName, setCallerName] = useState('Mom');
  const [callerNumber, setCallerNumber] = useState('+91 98XXX XXXXX');
  const [phase, setPhase] = useState<CallPhase>('IDLE');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    if (phase !== 'CONNECTED') {
      setCallSeconds(0);
      return;
    }
    const id = window.setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    return () => {
      audioService.stopRingtone();
    };
  }, []);

  const formatCallTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartFakeCall = () => {
    setPhase('RINGING');
    if (soundEnabled) {
      audioService.startRingtone();
    }
    logSafetyEvent(
      sosService.createEvent({
        type: 'FAKE_CALL_TRIGGERED',
        userConfirmed: true,
        locationConsented: false,
        notes: `In-app simulated incoming call started (${callerName.trim() || 'Caller'}).`,
      })
    );
  };

  const handleAnswer = () => {
    audioService.stopRingtone();
    setPhase('CONNECTED');
  };

  const handleDeclineOrEnd = () => {
    audioService.stopRingtone();
    setPhase('IDLE');
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (!next) {
      audioService.stopRingtone();
    } else if (phase === 'RINGING') {
      audioService.startRingtone();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          Simulated Incoming Call
        </h2>
        <p className="text-sm text-[#4B4560]">
          In-app simulated call interface to help you step away from uncomfortable situations. Does not place real phone calls or impersonate external networks.
        </p>
      </div>

      {phase === 'IDLE' ? (
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-5 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="fake-caller-name"
                className="block text-xs font-medium text-[#342E49]"
              >
                Simulated Caller Name
              </label>
              <input
                id="fake-caller-name"
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="e.g., Mom, Sister, Roommate"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="fake-caller-number"
                className="block text-xs font-medium text-[#342E49]"
              >
                Display Number Label
              </label>
              <input
                id="fake-caller-number"
                type="text"
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#EAE4F2]">
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-medium text-[#342E49] cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-purple-600" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#8E86A4]" aria-hidden="true" />
              )}
              <span>Ringtone Audio: {soundEnabled ? 'On' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={handleStartFakeCall}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-semibold text-white whitespace-nowrap cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" aria-hidden="true" />
              <span>Start Simulated Call</span>
            </button>
          </div>
        </div>
      ) : (
        /* Soft Plum-Rose Simulated Phone Call Sheet */
        <div className="max-w-sm mx-auto rounded-3xl bg-gradient-to-b from-[#3B1E54] via-[#2D1742] to-[#1F102E] border border-purple-300/40 p-8 text-center space-y-8 shadow-2xl text-white">
          <div className="space-y-2">
            <div className="text-xs font-medium text-purple-200">
              IN-APP SIMULATED CALL
            </div>
            <div className="w-20 h-20 mx-auto rounded-full bg-white/15 border border-white/25 flex items-center justify-center font-display text-2xl font-bold text-white">
              {(callerName.trim()[0] || 'C').toUpperCase()}
            </div>
            <h3 className="font-display text-2xl font-bold text-white pt-2">
              {callerName.trim() || 'Caller'}
            </h3>
            <div className="font-mono text-sm text-purple-200">
              {callerNumber.trim() || 'Mobile'}
            </div>
            <div className="font-mono text-sm text-emerald-300 tabular-nums pt-1">
              {phase === 'RINGING'
                ? 'Incoming Call...'
                : `Connected · ${formatCallTime(callSeconds)}`}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-purple-100 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-purple-200" aria-hidden="true" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
              )}
              <span>{soundEnabled ? 'Mute Audio' : 'Unmute Audio'}</span>
            </button>
          </div>

          {phase === 'RINGING' ? (
            <div className="flex items-center justify-center gap-8 pt-2">
              <button
                type="button"
                onClick={handleDeclineOrEnd}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <span className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
                  <PhoneOff className="w-6 h-6" aria-hidden="true" />
                </span>
                <span className="text-xs text-purple-100">Decline</span>
              </button>

              <button
                type="button"
                onClick={handleAnswer}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <span className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors">
                  <Phone className="w-6 h-6" aria-hidden="true" />
                </span>
                <span className="text-xs text-purple-100">Answer</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleDeclineOrEnd}
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <span className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
                  <PhoneOff className="w-6 h-6" aria-hidden="true" />
                </span>
                <span className="text-xs text-purple-100">End Call</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
