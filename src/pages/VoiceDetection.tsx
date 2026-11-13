import React, { useState } from 'react';
import {
  AlertCircle,
  Mic,
  MicOff,
  Plus,
  ShieldAlert,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { voiceRecognitionService } from '../services/voiceRecognitionService';

export const VoiceDetection: React.FC = () => {
  const {
    settings,
    updateSettings,
    voiceSupported,
    micSupported,
    isVoiceListening,
    isSpeechEngineActive,
    micLevel,
    voiceLang,
    setVoiceLang,
    acousticSpikeEnabled,
    setAcousticSpikeEnabled,
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
      setPhraseError(null);
      requestSosConfirmation({
        source: 'VOICE',
        title: `Phrase Matched: "${matched}"`,
        description:
          'Emergency command matcher detected a configured phrase. Confirm or cancel SOS.',
        detectedTriggerDetail: `Input: "${testInput}"`,
      });
    } else {
      setPhraseError('No configured emergency command matched that test phrase.');
    }
  };

  const triggerQuickPhrase = (phrase: string) => {
    requestSosConfirmation({
      source: 'VOICE',
      title: `Voice Phrase Triggered: "${phrase}"`,
      description:
        'Confirmed emergency phrase check. Click Confirm & Activate SOS or Cancel Alert.',
      detectedTriggerDetail: `Phrase: "${phrase}"`,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
            Voice Emergency Command Detection
          </h2>
          <p className="text-sm text-[#4B4560]">
            Uses your browser&apos;s built-in microphone and Web Speech API (zero external API keys). Audio is analyzed in real time in memory and never recorded or saved.
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

      {/* Recognition & Live Microphone Monitor Card */}
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
                {isVoiceListening
                  ? isSpeechEngineActive
                    ? 'Listening — Speech & Acoustic Detection Active'
                    : 'Listening — Live Microphone Acoustic Mode'
                  : 'Voice & Microphone Detection Standby'}
              </div>
              <div className="text-xs text-[#5B5570]">
                Microphone API: {micSupported ? 'Available' : 'Unavailable'} · Speech Recognition:{' '}
                {voiceSupported ? 'Supported' : 'Not Supported in Browser'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              disabled={isVoiceListening}
              aria-label="Speech recognition language"
              className="px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-xs text-[#1E1B2E] disabled:opacity-60"
            >
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="en-GB">English (UK)</option>
            </select>

            {!isVoiceListening ? (
              <button
                type="button"
                onClick={() => void startVoiceListening()}
                disabled={!micSupported && !voiceSupported}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
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
        </div>

        {/* Live Microphone Volume Meter (Web Audio AnalyserNode - 100% offline/no API) */}
        <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#342E49]">
              <Volume2 className="w-4 h-4 text-purple-600" aria-hidden="true" />
              <span>Live Microphone Input Level (Browser AudioContext)</span>
            </span>
            <span className="font-mono font-semibold text-purple-700 tabular-nums">
              {micLevel}%
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-purple-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                micLevel >= 80
                  ? 'bg-red-600'
                  : micLevel >= 45
                    ? 'bg-purple-600'
                    : 'bg-teal-600'
              }`}
              style={{ width: `${micLevel}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-[#4B4560] cursor-pointer">
              <input
                type="checkbox"
                checked={acousticSpikeEnabled}
                onChange={(e) => setAcousticSpikeEnabled(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-purple-300 text-purple-600"
              />
              <span>
                Enable Offline Acoustic Distress Trigger (triggers confirmation if sustained sound ≥ 80% without needing cloud speech-to-text)
              </span>
            </label>
          </div>
        </div>

        {!voiceSupported && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
            Your browser does not support <code className="font-mono">SpeechRecognition</code> phrase transcription (e.g., Firefox or certain webviews). Live Microphone Acoustic Monitoring above works offline with zero API dependencies, and you can also use Manual SOS or Phrase Simulation below.
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
            {voiceTranscript ||
              (isVoiceListening
                ? isSpeechEngineActive
                  ? 'Listening for distress phrases...'
                  : 'Acoustic microphone monitor active (speak loudly to test spike or test phrases below)'
                : 'Idle')}
          </div>
          {voiceAlternatives.length > 1 && (
            <div className="text-xs text-[#5B5570]">
              Alternative hypotheses: {voiceAlternatives.slice(1).join(' / ')}
            </div>
          )}
        </div>
      </div>

      {/* Configurable Emergency Phrases & Instant Tester */}
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

          {phraseError && <p className="text-xs text-rose-700">{phraseError}</p>}

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
            Phrase Matcher & Quick Verification
          </h3>
          <p className="text-xs text-[#5B5570]">
            Test how the command matcher responds across any browser without requiring cloud speech-to-text servers.
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
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white cursor-pointer"
            >
              Test Command Match
            </button>
          </form>

          <div className="pt-2 border-t border-[#EAE4F2] space-y-2">
            <div className="text-xs font-medium text-[#5B5570]">
              One-Tap Command Trigger Test:
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.voiceCommands.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => triggerQuickPhrase(cmd)}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-mono text-[#342E49] cursor-pointer"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
