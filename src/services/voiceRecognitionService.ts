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

  mapSpeechError(errorCode: string): { message: string; recovery: string } {
    switch (errorCode) {
      case 'not-allowed':
      case 'service-not-allowed':
        return {
          message: 'Microphone permission was denied or blocked by browser settings.',
          recovery:
            'Allow Microphone permission in the browser address bar and click Start Listening again. Manual SOS remains fully available.',
        };
      case 'audio-capture':
        return {
          message: 'No working microphone input device was detected.',
          recovery:
            'Connect or unmute a microphone in system audio settings, or use the manual SOS button.',
        };
      case 'no-speech':
        return {
          message: 'No speech was detected during the listening window.',
          recovery:
            'Speak clearly near the microphone, or use the simulated phrase check if testing without voice input.',
        };
      case 'network':
        return {
          message:
            'Browser speech recognition engine reported a network error (some browsers require online speech servers).',
          recovery:
            'Check internet connectivity. Manual SOS works offline without speech recognition.',
        };
      case 'aborted':
        return {
          message: 'Voice recognition session was stopped.',
          recovery: 'Click Start Voice Detection whenever you want to resume.',
        };
      default:
        return {
          message: `Speech recognition error (${errorCode}).`,
          recovery: 'Restart voice recognition or use manual SOS.',
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

  createSession(
    commands: string[],
    callbacks: VoiceRecognitionCallbacks
  ): { start: () => void; stop: () => void } | null {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return null;

    let recognition: SpeechRecognitionInstance | null = null;
    let shouldStayActive = false;

    const initInstance = () => {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        callbacks.onStatusChange(true);
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
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          shouldStayActive = false;
          callbacks.onStatusChange(false);
        }
        callbacks.onError(event.error, mapped.message, mapped.recovery);
      };

      rec.onend = () => {
        if (shouldStayActive) {
          try {
            rec.start();
          } catch {
            shouldStayActive = false;
            callbacks.onStatusChange(false);
          }
        } else {
          callbacks.onStatusChange(false);
        }
      };

      return rec;
    };

    return {
      start: () => {
        shouldStayActive = true;
        if (!recognition) {
          recognition = initInstance();
        }
        try {
          recognition.start();
        } catch {
          // Ignore InvalidStateError if already started
        }
      },
      stop: () => {
        shouldStayActive = false;
        if (recognition) {
          try {
            recognition.stop();
          } catch {
            // Safe ignore
          }
        }
        callbacks.onStatusChange(false);
      },
    };
  },
};
