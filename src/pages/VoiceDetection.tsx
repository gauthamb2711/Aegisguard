import React, { useState } from 'react';
import {
  AlertCircle,
  Mic,
  MicOff,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { voiceRecognitionService } from '../services/voiceRecognitionService';

export const VoiceDetection: React.FC = () => {
  const {
    settings,
    updateSettings,
    voiceSupported,
    isVoiceListening,
    voiceTranscript,
    voiceAlternatives,
    voiceError,
    startVoiceListening,
    stopVoiceListening,
    requestSosConfirmation,
  } = useSafety();

  const [newPhrase, setNewPhrase] = useState('');
  const [testInput, setTestInput] = useState('');
  const [phraseError, setPhraseError] = useState<string | null>(null);

  const handleAddCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newPhrase.trim().toLowerCase();
    if (cleaned.length < 2) {
      setPhraseError('Command phrase must be at least 2 characters.');
      return;
    }
    if (settings.voiceCommands.includes(cleaned)) {
      setPhraseError('This command phrase is already configured.');
      return;
    }
    setPhraseError(null);
    updateSettings({
      voiceCommands: [...settings.voiceCommands, cleaned],
    });
    setNewPhrase('');
  };

  const handleRemoveCommand = (cmd: string) => {
    if (settings.voiceCommands.length <= 1) return;
    updateSettings({
      voiceCommands: settings.voiceCommands.filter((c) => c !== cmd),
    });
  };

  const handleSimulatedTranscriptTest = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = voiceRecognitionService.matchEmergencyCommand(
      testInput,
      settings.voiceCommands
    );
    if (matched) {
      requestSosConfirmation({
        source: 'VOICE',
        title: `Simulated Phrase Matched: "${matched}"`,
        description:
          'Text-based command matcher detected a configured emergency phrase. Confirm or cancel SOS.',
        detectedTriggerDetail: `Simulated input: "${testInput}"`,
      });
    } else {
      setPhraseError('No configured emergency command matched that test phrase.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
            Voice Emergency Command Detection
          </h2>
          <p className="text-sm text-[#4B4560]">
            Listens for configured distress phrases via the browser Web Speech API and opens an immediate SOS confirmation dialog. Audio is never recorded or stored.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            requestSosConfirmation({
              source: 'MANUAL',
              title: 'Confirm Manual SOS',
              description:
                'Manual SOS works immediately even when voice recognition is unavailable or muted.',
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
          <span>Manual SOS</span>
        </button>
      </div>

      {/* Recognition Control Card */}
      <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg border ${
                isVoiceListening
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-[#FAF8FC] border-[#EAE4F2] text-[#6D6684]'
              }`}
            >
              {isVoiceListening ? (
                <Mic className="w-5 h-5" aria-hidden="true" />
              ) : (
                <MicOff className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="font-display text-base font-semibold text-[#1E1B2E]">
                {!voiceSupported
                  ? 'Speech Recognition Unsupported in This Browser'
                  : isVoiceListening
                    ? 'Voice Recognition Active — Listening'
                    : 'Voice Recognition Standby'}
              </div>
              <div className="text-xs text-[#5B5570]">
                Web Speech API: {voiceSupported ? 'Supported' : 'Not Available'} · No continuous audio saved
              </div>
            </div>
          </div>

          {voiceSupported && (
            <div className="flex items-center gap-2">
              {!isVoiceListening ? (
                <button
                  type="button"
                  onClick={startVoiceListening}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
                >
                  <Mic className="w-4 h-4" aria-hidden="true" />
                  <span>Start Voice Detection</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceListening}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-900 whitespace-nowrap cursor-pointer"
                >
                  <MicOff className="w-4 h-4" aria-hidden="true" />
                  <span>Stop Listening</span>
                </button>
              )}
            </div>
          )}
        </div>

        {!voiceSupported && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
            Your current browser does not expose <code className="font-mono">SpeechRecognition</code> or <code className="font-mono">webkitSpeechRecognition</code> (Firefox desktop and some privacy browsers disable it). You can still use the Manual SOS button or test phrase matching below.
          </div>
        )}

        {voiceError && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {voiceError.code}: {voiceError.message}
              </span>
            </div>
            <p className="text-[#4B4560]">{voiceError.recovery}</p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] space-y-2">
          <div className="text-xs font-medium text-[#5B5570]">
            Live Speech Transcript (Processed in memory only)
          </div>
          <div className="font-mono text-sm text-[#1E1B2E] min-h-[24px]">
            {voiceTranscript || (isVoiceListening ? 'Listening for speech...' : 'Idle')}
          </div>
          {voiceAlternatives.length > 1 && (
            <div className="text-xs text-[#5B5570]">
              Alternative hypotheses: {voiceAlternatives.slice(1).join(' / ')}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Configured Trigger Phrases
          </h3>
          <p className="text-xs text-[#5B5570]">
            Matching any phrase opens an SOS confirmation dialog—it never transmits an alert without your confirmation.
          </p>

          <form onSubmit={handleAddCommand} className="flex gap-2">
            <input
              type="text"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="Add trigger phrase (e.g., call police)"
              className="flex-1 px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-xs text-[#1E1B2E] placeholder:text-[#8E86A4] focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          </form>

          {phraseError && (
            <p className="text-xs text-rose-700">{phraseError}</p>
          )}

          <ul className="divide-y divide-[#EAE4F2] border border-[#EAE4F2] rounded-lg bg-[#FAF8FC]">
            {settings.voiceCommands.map((cmd) => (
              <li
                key={cmd}
                className="px-3.5 py-2.5 flex items-center justify-between text-xs"
              >
                <span className="font-mono text-[#1E1B2E]">"{cmd}"</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCommand(cmd)}
                  disabled={settings.voiceCommands.length <= 1}
                  aria-label={`Remove phrase ${cmd}`}
                  className="p-1 text-[#6D6684] hover:text-red-600 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Phrase Matcher Verification (Text Simulation)
          </h3>
          <p className="text-xs text-[#5B5570]">
            Test how the emergency command matcher responds without needing an active microphone or supported SpeechRecognition browser.
          </p>
          <form onSubmit={handleSimulatedTranscriptTest} className="space-y-3">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder='Type a test phrase like "Help me please"'
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-xs text-[#1E1B2E] placeholder:text-[#8E86A4] focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-900 cursor-pointer"
            >
              Test Command Match
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
