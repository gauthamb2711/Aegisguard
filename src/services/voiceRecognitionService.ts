interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export interface VoiceRecognitionCallbacks {
  onStatusChange: (active: boolean) => void;
  onSpeechEngineChange: (active: boolean) => void;
  onMicLevelChange: (levelPercent: number) => void;
  onAcousticSpike?: (peakLevel: number) => void;
  onTranscript: (transcript: string, isFinal: boolean, alternatives: string[]) => void;
  onCommandMatch: (matchedCommand: string, fullTranscript: string) => void;
  onError: (errorCode: string, message: string, recovery: string) => void;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export const voiceRecognitionService = {
  isSupported(): boolean {
    return getSpeechRecognitionConstructor() !== null;
  },

  isMicrophoneSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia)
    );
  },

  mapSpeechError(errorCode: string): { message: string; recovery: string } {
    switch (errorCode) {
      case 'not-allowed':
      case 'service-not-allowed':
        return {
          message: 'Microphone permission was denied or blocked by browser settings.',
          recovery:
            'Click the lock/site icon in your browser address bar, allow Microphone access, and click Start Voice Detection again.',
        };
      case 'audio-capture':
        return {
          message: 'No working microphone input device was detected.',
          recovery:
            'Connect or unmute a microphone in your device settings, or use the manual SOS button.',
        };
      case 'no-speech':
        return {
          message: 'No speech was detected recently—still listening.',
          recovery:
            'Speak clearly near the microphone using one of your configured phrases.',
        };
      case 'network':
        return {
          message:
            'Browser speech-to-text engine could not reach its cloud service (common on Firefox, Brave, or restricted networks). Live microphone acoustic monitoring remains active.',
          recovery:
            'Use Chrome/Edge/Safari with internet for phrase transcription, or rely on the active Acoustic Loudness Trigger or Manual SOS.',
        };
      case 'aborted':
        return {
          message: 'Voice recognition session was stopped.',
          recovery: 'Click Start Voice Detection whenever you want to resume.',
        };
      default:
        return {
          message: `Speech recognition notice (${errorCode}).`,
          recovery: 'Acoustic microphone monitoring or manual SOS remains available.',
        };
    }
  },

  matchEmergencyCommand(transcript: string, commands: string[]): string | null {
    const normalized = transcript
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!normalized) return null;

    for (const cmd of commands) {
      const cleanCmd = cmd.toLowerCase().trim();
      if (!cleanCmd) continue;
      if (normalized.includes(cleanCmd)) {
        return cmd;
      }
    }
    return null;
  },

  /**
   * Starts a zero-API-key browser voice + live microphone monitoring session.
   * Requests microphone permission via getUserMedia (for real-time level & acoustic spike fallback),
   * and runs Web Speech API phrase detection in parallel when supported.
   * Never records or saves audio files.
   */
  createSession(
    commands: string[],
    options: { lang?: string; acousticSpikeEnabled?: boolean; acousticThreshold?: number },
    callbacks: VoiceRecognitionCallbacks
  ): { start: () => Promise<void>; stop: () => void } {
    let recognition: SpeechRecognitionInstance | null = null;
    let shouldStayActive = false;
    let restartTimer: number | null = null;
    let mediaStream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let rafId: number | null = null;
    let highEnergyFrames = 0;
    let lastAcousticTrigger = 0;

    const cleanupAudio = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        void audioCtx.close();
        audioCtx = null;
      }
      callbacks.onMicLevelChange(0);
    };

    const startAudioMonitor = async (): Promise<boolean> => {
      if (!this.isMicrophoneSupported()) {
        return true; // Allow SpeechRecognition to request its own mic if getUserMedia absent
      }
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

        if (AudioCtx && mediaStream) {
          audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(mediaStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const data = new Uint8Array(analyser.frequencyBinCount);
          const threshold = options.acousticThreshold ?? 78;

          const tick = () => {
            if (!shouldStayActive) return;
            analyser.getByteTimeDomainData(data);
            let sumSquares = 0;
            for (let i = 0; i < data.length; i++) {
              const norm = (data[i] - 128) / 128;
              sumSquares += norm * norm;
            }
            const rms = Math.sqrt(sumSquares / data.length);
            const level = Math.min(100, Math.round(rms * 260));
            callbacks.onMicLevelChange(level);

            if (options.acousticSpikeEnabled) {
              if (level >= threshold) {
                highEnergyFrames++;
                const now = Date.now();
                if (highEnergyFrames >= 12 && now - lastAcousticTrigger > 10000) {
                  lastAcousticTrigger = now;
                  highEnergyFrames = 0;
                  callbacks.onAcousticSpike?.(level);
                }
              } else {
                highEnergyFrames = Math.max(0, highEnergyFrames - 1);
              }
            }

            rafId = window.requestAnimationFrame(tick);
          };

          rafId = window.requestAnimationFrame(tick);
        }
        return true;
      } catch (err) {
        const errName = err instanceof Error ? err.name : '';
        const mapped =
          errName === 'NotAllowedError' || errName === 'PermissionDeniedError'
            ? this.mapSpeechError('not-allowed')
            : errName === 'NotFoundError'
              ? this.mapSpeechError('audio-capture')
              : this.mapSpeechError('not-allowed');
        callbacks.onError(errName || 'not-allowed', mapped.message, mapped.recovery);
        return false;
      }
    };

    const startSpeechEngine = () => {
      const Ctor = getSpeechRecognitionConstructor();
      if (!Ctor) {
        callbacks.onSpeechEngineChange(false);
        return;
      }

      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = options.lang || 'en-US';
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        callbacks.onSpeechEngineChange(true);
      };

      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const alternatives: string[] = [];
          for (let j = 0; j < result.length; j++) {
            alternatives.push(result[j].transcript);
          }
          const primary = alternatives[0] ?? '';
          callbacks.onTranscript(primary, result.isFinal, alternatives);

          for (const alt of alternatives) {
            const matched = this.matchEmergencyCommand(alt, commands);
            if (matched) {
              callbacks.onCommandMatch(matched, alt);
              break;
            }
          }
        }
      };

      rec.onerror = (event) => {
        const mapped = this.mapSpeechError(event.error);
        if (
          event.error === 'not-allowed' ||
          event.error === 'service-not-allowed' ||
          event.error === 'audio-capture'
        ) {
          shouldStayActive = false;
          callbacks.onSpeechEngineChange(false);
          callbacks.onStatusChange(false);
          cleanupAudio();
          callbacks.onError(event.error, mapped.message, mapped.recovery);
          return;
        }

        if (event.error === 'network') {
          // Speech-to-text cloud failed, but keep live microphone acoustic monitor running!
          callbacks.onSpeechEngineChange(false);
          callbacks.onError(event.error, mapped.message, mapped.recovery);
          return;
        }

        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          callbacks.onError(event.error, mapped.message, mapped.recovery);
        }
      };

      rec.onend = () => {
        callbacks.onSpeechEngineChange(false);
        if (shouldStayActive) {
          if (restartTimer !== null) window.clearTimeout(restartTimer);
          restartTimer = window.setTimeout(() => {
            if (!shouldStayActive) return;
            try {
              rec.start();
            } catch {
              // Ignore InvalidStateError if already restarting
            }
          }, 350);
        }
      };

      recognition = rec;
      try {
        rec.start();
      } catch {
        // Safe ignore
      }
    };

    return {
      start: async () => {
        shouldStayActive = true;
        const micOk = await startAudioMonitor();
        if (!micOk) {
          shouldStayActive = false;
          callbacks.onStatusChange(false);
          return;
        }
        callbacks.onStatusChange(true);
        startSpeechEngine();
      },
      stop: () => {
        shouldStayActive = false;
        if (restartTimer !== null) {
          window.clearTimeout(restartTimer);
          restartTimer = null;
        }
        if (recognition) {
          try {
            recognition.onend = null;
            recognition.stop();
          } catch {
            // Safe ignore
          }
          recognition = null;
        }
        cleanupAudio();
        callbacks.onSpeechEngineChange(false);
        callbacks.onStatusChange(false);
      },
    };
  },
};
