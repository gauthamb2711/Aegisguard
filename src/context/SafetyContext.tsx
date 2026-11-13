import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AppSettings,
  EmergencyContact,
  LocationData,
  LocationErrorState,
  MLPrediction,
  MLValidationMetrics,
  MotionSample,
  PendingConfirmation,
  PermissionStatusType,
  SafeJourney,
  SafetyEvent,
  SafetyEventType,
  ShareChannel,
} from '../types/safety';
import { DEFAULT_SETTINGS, storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import {
  extractFeaturesFromWindow,
  mlTrainingService,
} from '../services/mlTrainingService';
import { motionService } from '../services/motionService';
import { ShakeDetector } from '../services/shakeDetectionService';
import { voiceRecognitionService } from '../services/voiceRecognitionService';
import { sosService } from '../services/sosService';
import { audioService } from '../services/audioService';

interface SafetyContextValue {
  // Storage & Settings
  settings: AppSettings;
  storageNotice: string | null;
  dismissStorageNotice: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  clearAllData: () => void;

  // Contacts
  contacts: EmergencyContact[];
  addContact: (contact: Omit<EmergencyContact, 'id' | 'createdAt'>) => void;
  updateContact: (id: string, partial: Partial<EmergencyContact>) => void;
  removeContact: (id: string) => void;

  // Events & SOS
  events: SafetyEvent[];
  activeSosEvent: SafetyEvent | null;
  pendingConfirmation: PendingConfirmation | null;
  requestSosConfirmation: (pending: Omit<PendingConfirmation, 'createdAt'>) => void;
  confirmSosActivation: (params?: {
    source?: PendingConfirmation['source'];
    includeLocation?: boolean;
    customNotes?: string;
  }) => Promise<SafetyEvent>;
  cancelPendingConfirmation: (logCancellation?: boolean) => void;
  cancelActiveSos: () => void;
  resolveActiveSos: () => void;
  updateEventShareChannel: (eventId: string, channel: ShareChannel) => void;
  logSafetyEvent: (event: SafetyEvent) => void;
  clearEventHistory: () => void;

  // GPS
  gpsSupported: boolean;
  locationPermission: PermissionStatusType;
  currentLocation: LocationData | null;
  locationError: LocationErrorState | null;
  isFetchingLocation: boolean;
  isWatchingLocation: boolean;
  refreshLocation: () => Promise<LocationData | null>;

  // Machine Learning
  mlMetrics: MLValidationMetrics | null;
  mlTrained: boolean;
  mlError: string | null;
  latestPrediction: MLPrediction | null;
  retrainModel: (nEstimators?: number, maxDepth?: number) => void;
  evaluateFeatures: (
    samples: MotionSample[],
    isSimulated: boolean
  ) => MLPrediction | null;

  // Live Motion Sensor
  motionApiAvailable: boolean;
  motionPermission: PermissionStatusType;
  isMotionMonitoring: boolean;
  isMotionPaused: boolean;
  hasHardwareMotionData: boolean;
  motionSamples: MotionSample[];
  unusualMovementWarning: string | null;
  dismissUnusualWarning: () => void;
  requestMotionPermission: () => Promise<PermissionStatusType>;
  startMotionMonitoring: () => Promise<void>;
  pauseMotionMonitoring: () => void;
  resumeMotionMonitoring: () => void;
  stopMotionMonitoring: () => void;

  // Voice Recognition
  voiceSupported: boolean;
  isVoiceListening: boolean;
  voiceTranscript: string;
  voiceAlternatives: string[];
  voiceError: { code: string; message: string; recovery: string } | null;
  startVoiceListening: () => void;
  stopVoiceListening: () => void;

  // Shake Detection
  shakePeaksCount: number;
  shakeCooldownRemaining: number;
  simulateShakeTrigger: () => void;

  // Safe Journey
  activeJourney: SafeJourney | null;
  journeyElapsedSec: number;
  journeyCheckInRemainingSec: number | null;
  startJourney: (params: {
    destination: string;
    estimatedMinutes: number;
    checkInIntervalMinutes: number;
  }) => void;
  checkInJourney: () => void;
  endJourney: () => void;
}

const SafetyContext = createContext<SafetyContextValue | null>(null);

export const SafetyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Load initial storage safely
  const [settings, setSettings] = useState<AppSettings>(() => {
    return storageService.loadSettings().data;
  });
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    return storageService.loadContacts().data;
  });
  const [events, setEvents] = useState<SafetyEvent[]>(() => {
    return storageService.loadEvents().data;
  });
  const [activeJourney, setActiveJourney] = useState<SafeJourney | null>(() => {
    return storageService.loadJourney().data;
  });
  const [storageNotice, setStorageNotice] = useState<string | null>(() => {
    const s = storageService.loadSettings();
    const c = storageService.loadContacts();
    const e = storageService.loadEvents();
    return s.error || c.error || e.error || null;
  });

  // SOS & Confirmation
  const [activeSosEvent, setActiveSosEvent] = useState<SafetyEvent | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);

  // GPS
  const gpsSupported = locationService.isSupported();
  const [locationPermission, setLocationPermission] =
    useState<PermissionStatusType>(gpsSupported ? 'unknown' : 'unsupported');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [locationError, setLocationError] = useState<LocationErrorState | null>(
    null
  );
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // ML
  const [mlMetrics, setMlMetrics] = useState<MLValidationMetrics | null>(null);
  const [mlTrained, setMlTrained] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const [latestPrediction, setLatestPrediction] =
    useState<MLPrediction | null>(null);

  // Motion Sensor & Shake
  const motionApiAvailable = motionService.isApiPresent();
  const [motionPermission, setMotionPermission] = useState<PermissionStatusType>(
    !motionApiAvailable
      ? 'unsupported'
      : motionService.requiresExplicitPermission()
        ? 'prompt'
        : 'granted'
  );
  const [isMotionMonitoring, setIsMotionMonitoring] = useState(false);
  const [isMotionPaused, setIsMotionPaused] = useState(false);
  const [hasHardwareMotionData, setHasHardwareMotionData] = useState(false);
  const [motionSamples, setMotionSamples] = useState<MotionSample[]>([]);
  const [unusualMovementWarning, setUnusualMovementWarning] = useState<
    string | null
  >(null);
  const motionUnsubscribeRef = useRef<(() => void) | null>(null);
  const motionBufferRef = useRef<MotionSample[]>([]);
  const lastMlCheckRef = useRef<number>(0);

  // Shake
  const shakeDetectorRef = useRef<ShakeDetector>(new ShakeDetector());
  const [shakePeaksCount, setShakePeaksCount] = useState(0);
  const [shakeCooldownRemaining, setShakeCooldownRemaining] = useState(0);

  // Voice
  const voiceSupported = voiceRecognitionService.isSupported();
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceAlternatives, setVoiceAlternatives] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState<{
    code: string;
    message: string;
    recovery: string;
  } | null>(null);
  const voiceSessionRef = useRef<{ start: () => void; stop: () => void } | null>(
    null
  );

  // Journey timers
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Initialize ML model on mount
  useEffect(() => {
    try {
      const metrics = mlTrainingService.ensureTrained();
      setMlMetrics(metrics);
      setMlTrained(true);
      setMlError(null);
    } catch (err) {
      setMlError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize Random Forest classifier.'
      );
      setMlTrained(false);
    }
  }, []);

  // Check initial GPS permission
  useEffect(() => {
    void locationService.checkPermission().then((perm) => {
      setLocationPermission(perm);
    });
  }, []);

  // Cleanup everything on unmount
  useEffect(() => {
    return () => {
      locationService.clearWatch(watchIdRef.current);
      motionUnsubscribeRef.current?.();
      voiceSessionRef.current?.stop();
      audioService.dispose();
    };
  }, []);

  const dismissStorageNotice = useCallback(() => setStorageNotice(null), []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      const err = storageService.saveSettings(next);
      if (err) setStorageNotice(err);
      return next;
    });
  }, []);

  const clearAllData = useCallback(() => {
    const err = storageService.clearAllLocalData();
    if (err) setStorageNotice(err);
    setSettings(DEFAULT_SETTINGS);
    setContacts([]);
    setEvents([]);
    setActiveJourney(null);
    setActiveSosEvent(null);
  }, []);

  // Contacts
  const addContact = useCallback(
    (contact: Omit<EmergencyContact, 'id' | 'createdAt'>) => {
      setContacts((prev) => {
        const next: EmergencyContact[] = [
          ...prev,
          {
            ...contact,
            id: `CNT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: Date.now(),
          },
        ];
        const err = storageService.saveContacts(
          next,
          settings.localStorageConsentGranted
        );
        if (err) setStorageNotice(err);
        return next;
      });
    },
    [settings.localStorageConsentGranted]
  );

  const updateContact = useCallback(
    (id: string, partial: Partial<EmergencyContact>) => {
      setContacts((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...partial } : c));
        const err = storageService.saveContacts(
          next,
          settings.localStorageConsentGranted
        );
        if (err) setStorageNotice(err);
        return next;
      });
    },
    [settings.localStorageConsentGranted]
  );

  const removeContact = useCallback(
    (id: string) => {
      setContacts((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const err = storageService.saveContacts(
          next,
          settings.localStorageConsentGranted
        );
        if (err) setStorageNotice(err);
        return next;
      });
    },
    [settings.localStorageConsentGranted]
  );

  const logSafetyEvent = useCallback(
    (event: SafetyEvent) => {
      setEvents((prev) => {
        const next = [event, ...prev];
        const err = storageService.saveEvents(
          next,
          settings.localStorageConsentGranted
        );
        if (err) setStorageNotice(err);
        return next;
      });
    },
    [settings.localStorageConsentGranted]
  );

  const clearEventHistory = useCallback(() => {
    setEvents([]);
    const err = storageService.saveEvents(
      [],
      settings.localStorageConsentGranted
    );
    if (err) setStorageNotice(err);
  }, [settings.localStorageConsentGranted]);

  // GPS
  const refreshLocation = useCallback(async (): Promise<LocationData | null> => {
    setIsFetchingLocation(true);
    try {
      const loc = await locationService.getCurrentPosition();
      setCurrentLocation(loc);
      setLocationError(null);
      setLocationPermission('granted');
      return loc;
    } catch (err) {
      const mapped = err as LocationErrorState;
      setLocationError(mapped);
      if (mapped.code === 'PERMISSION_DENIED') {
        setLocationPermission('denied');
      }
      return null;
    } finally {
      setIsFetchingLocation(false);
    }
  }, []);

  // Journey location watcher
  useEffect(() => {
    if (activeJourney && (activeJourney.status === 'ACTIVE' || activeJourney.status === 'CHECKIN_OVERDUE')) {
      if (locationPermission === 'granted' && watchIdRef.current === null) {
        const id = locationService.watchPosition(
          (loc) => {
            setCurrentLocation(loc);
            setLocationError(null);
            setIsWatchingLocation(true);
          },
          (err) => {
            setLocationError(err);
            setIsWatchingLocation(false);
          }
        );
        watchIdRef.current = id;
        if (id !== null) setIsWatchingLocation(true);
      }
    } else {
      if (watchIdRef.current !== null) {
        locationService.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsWatchingLocation(false);
      }
    }
  }, [activeJourney, locationPermission]);

  // Journey ticker
  useEffect(() => {
    if (!activeJourney) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      setActiveJourney((prev) => {
        if (!prev || prev.status === 'COMPLETED' || prev.status === 'SOS_ESCALATED') {
          return prev;
        }
        if (now >= prev.nextCheckInDueAt && prev.status === 'ACTIVE') {
          if (settings.alertSoundEnabled) {
            audioService.playAlertChime();
          }
          const updated: SafeJourney = {
            ...prev,
            status: 'CHECKIN_OVERDUE',
            missedCheckIns: prev.missedCheckIns + 1,
          };
          storageService.saveJourney(updated, settings.localStorageConsentGranted);
          const missedEvt = sosService.createEvent({
            type: 'JOURNEY_CHECKIN_MISSED',
            userConfirmed: false,
            locationConsented: false,
            notes: `Safe journey check-in reminder triggered for destination: ${prev.destination}. Awaiting user confirmation.`,
          });
          setEvents((evts) => {
            const nextEvts = [missedEvt, ...evts];
            storageService.saveEvents(nextEvts, settings.localStorageConsentGranted);
            return nextEvts;
          });
          return updated;
        }
        return prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeJourney, settings.alertSoundEnabled, settings.localStorageConsentGranted]);

  // SOS Flows
  const requestSosConfirmation = useCallback(
    (pending: Omit<PendingConfirmation, 'createdAt'>) => {
      setPendingConfirmation({ ...pending, createdAt: Date.now() });
      if (settings.alertSoundEnabled) {
        audioService.playAlertChime();
      }
    },
    [settings.alertSoundEnabled]
  );

  const confirmSosActivation = useCallback(
    async (params?: {
      source?: PendingConfirmation['source'];
      includeLocation?: boolean;
      customNotes?: string;
    }): Promise<SafetyEvent> => {
      const source = params?.source ?? pendingConfirmation?.source ?? 'MANUAL';
      const includeLoc =
        params?.includeLocation ?? settings.includeLocationInSOSByDefault;

      setPendingConfirmation(null);

      let loc = currentLocation;
      if (includeLoc) {
        const freshLoc = await refreshLocation();
        if (freshLoc) loc = freshLoc;
      }

      const eventTypeMap: Record<PendingConfirmation['source'], SafetyEventType> = {
        MANUAL: 'MANUAL_SOS',
        VOICE: 'VOICE_TRIGGERED_SOS',
        SHAKE: 'SHAKE_TRIGGERED_SOS',
        MOVEMENT_ML: 'MANUAL_SOS',
        JOURNEY_CHECKIN: 'MANUAL_SOS',
      };

      const evt = sosService.createEvent({
        type: eventTypeMap[source],
        userConfirmed: true,
        locationConsented: includeLoc && Boolean(loc),
        location: includeLoc ? loc : null,
        messagePrepared: true,
        notes:
          params?.customNotes ||
          (loc
            ? `User-confirmed SOS created (${source}). GPS coordinates attached with ±${Math.round(loc.accuracy)}m accuracy.`
            : `User-confirmed SOS created (${source}). Location unavailable or not attached.`),
      });

      setActiveSosEvent(evt);
      logSafetyEvent(evt);

      if (settings.alertSoundEnabled) {
        audioService.playAlertChime();
      }

      return evt;
    },
    [
      pendingConfirmation,
      settings.includeLocationInSOSByDefault,
      settings.alertSoundEnabled,
      currentLocation,
      refreshLocation,
      logSafetyEvent,
    ]
  );

  const cancelPendingConfirmation = useCallback(
    (logCancellation = true) => {
      if (pendingConfirmation && logCancellation) {
        const cancelEvt = sosService.createEvent({
          type: 'SOS_CANCELLED',
          userConfirmed: false,
          cancelled: true,
          locationConsented: false,
          notes: `Alert prompt (${pendingConfirmation.source}) was cancelled by user.`,
        });
        logSafetyEvent(cancelEvt);
      }
      setPendingConfirmation(null);
    },
    [pendingConfirmation, logSafetyEvent]
  );

  const cancelActiveSos = useCallback(() => {
    if (!activeSosEvent) return;
    setEvents((prev) => {
      const next = prev.map((e) =>
        e.id === activeSosEvent.id
          ? {
              ...e,
              cancelled: true,
              status: 'CANCELLED' as const,
              notes: `${e.notes} [Marked as cancelled/false alarm by user]`,
            }
          : e
      );
      storageService.saveEvents(next, settings.localStorageConsentGranted);
      return next;
    });
    setActiveSosEvent(null);
  }, [activeSosEvent, settings.localStorageConsentGranted]);

  const resolveActiveSos = useCallback(() => {
    if (!activeSosEvent) return;
    setEvents((prev) => {
      const next = prev.map((e) =>
        e.id === activeSosEvent.id
          ? { ...e, status: 'RESOLVED' as const }
          : e
      );
      storageService.saveEvents(next, settings.localStorageConsentGranted);
      return next;
    });
    setActiveSosEvent(null);
  }, [activeSosEvent, settings.localStorageConsentGranted]);

  const updateEventShareChannel = useCallback(
    (eventId: string, channel: ShareChannel) => {
      setEvents((prev) => {
        const next = prev.map((e) =>
          e.id === eventId ? { ...e, sharedVia: channel } : e
        );
        storageService.saveEvents(next, settings.localStorageConsentGranted);
        return next;
      });
      setActiveSosEvent((prev) =>
        prev && prev.id === eventId ? { ...prev, sharedVia: channel } : prev
      );
    },
    [settings.localStorageConsentGranted]
  );

  // ML
  const retrainModel = useCallback((nEstimators = 25, maxDepth = 7) => {
    try {
      const { metrics } = mlTrainingService.trainModel(nEstimators, maxDepth);
      setMlMetrics(metrics);
      setMlTrained(true);
      setMlError(null);
    } catch (err) {
      setMlError(
        err instanceof Error ? err.message : 'Model training failed.'
      );
      setMlTrained(false);
    }
  }, []);

  const evaluateFeatures = useCallback(
    (samples: MotionSample[], isSimulated: boolean): MLPrediction | null => {
      if (!mlTrainingService.isModelTrained()) {
        setMlError('Random Forest model is not trained.');
        return null;
      }
      try {
        const features = extractFeaturesFromWindow(samples);
        const prediction = mlTrainingService.predictFromFeatures(
          features,
          isSimulated
        );
        setLatestPrediction(prediction);
        setMlError(null);
        return prediction;
      } catch (err) {
        setMlError(
          err instanceof Error ? err.message : 'ML prediction failed.'
        );
        return null;
      }
    },
    []
  );

  // Motion & Shake monitoring
  const requestMotionPermission =
    useCallback(async (): Promise<PermissionStatusType> => {
      const status = await motionService.requestPermission();
      setMotionPermission(status);
      return status;
    }, []);

  const handleIncomingMotionSample = useCallback(
    (sample: MotionSample) => {
      setHasHardwareMotionData(true);
      setMotionSamples((prev) => [...prev.slice(-59), sample]);

      const buffer = [...motionBufferRef.current.slice(-19), sample];
      motionBufferRef.current = buffer;

      // Shake Detection when enabled
      if (settings.shakeEnabled) {
        const shakeRes = shakeDetectorRef.current.processSample(
          sample.magnitude,
          sample.deltaMagnitude,
          {
            threshold: settings.shakeThreshold,
            cooldownMs: settings.shakeCooldownSec * 1000,
            requiredPeaks: 3,
            windowMs: 1400,
          }
        );
        setShakePeaksCount(shakeRes.peakCountInWindow);
        setShakeCooldownRemaining(shakeRes.cooldownRemainingSec);

        if (shakeRes.triggered) {
          requestSosConfirmation({
            source: 'SHAKE',
            title: 'Shake Pattern Detected',
            description:
              'A rapid multi-peak shake pattern was detected by the device accelerometer. Confirm if you want to trigger SOS or cancel.',
            detectedTriggerDetail: `Magnitude ${sample.magnitude.toFixed(1)} m/s²`,
          });
        }
      }

      // Periodic ML prediction every 1500ms if enough samples
      const now = Date.now();
      if (
        !isMotionPaused &&
        buffer.length >= 8 &&
        now - lastMlCheckRef.current >= 1500
      ) {
        lastMlCheckRef.current = now;
        const pred = evaluateFeatures(buffer, false);
        if (pred && pred.label === 'UNUSUAL MOVEMENT PATTERN') {
          setUnusualMovementWarning(
            'Unusual movement detected – Please check your safety.'
          );
        }
      }
    },
    [
      settings.shakeEnabled,
      settings.shakeThreshold,
      settings.shakeCooldownSec,
      isMotionPaused,
      evaluateFeatures,
      requestSosConfirmation,
    ]
  );

  const attachMotionStream = useCallback(() => {
    motionUnsubscribeRef.current?.();
    const unsub = motionService.subscribe(
      handleIncomingMotionSample,
      () => {
        setHasHardwareMotionData(false);
      }
    );
    motionUnsubscribeRef.current = unsub;
  }, [handleIncomingMotionSample]);

  const startMotionMonitoring = useCallback(async () => {
    if (!motionApiAvailable) {
      setMotionPermission('unsupported');
      return;
    }
    const perm = await requestMotionPermission();
    if (perm === 'denied') {
      return;
    }
    setIsMotionMonitoring(true);
    setIsMotionPaused(false);
    attachMotionStream();
  }, [motionApiAvailable, requestMotionPermission, attachMotionStream]);

  const pauseMotionMonitoring = useCallback(() => {
    setIsMotionPaused(true);
  }, []);

  const resumeMotionMonitoring = useCallback(() => {
    setIsMotionPaused(false);
  }, []);

  const stopMotionMonitoring = useCallback(() => {
    motionUnsubscribeRef.current?.();
    motionUnsubscribeRef.current = null;
    setIsMotionMonitoring(false);
    setIsMotionPaused(false);
    setShakePeaksCount(0);
  }, []);

  // Re-subscribe when shake/monitoring callbacks update while active
  useEffect(() => {
    if (isMotionMonitoring || settings.shakeEnabled) {
      if (motionApiAvailable && motionPermission === 'granted') {
        attachMotionStream();
      }
    } else {
      motionUnsubscribeRef.current?.();
      motionUnsubscribeRef.current = null;
    }
  }, [
    isMotionMonitoring,
    settings.shakeEnabled,
    motionApiAvailable,
    motionPermission,
    attachMotionStream,
  ]);

  const simulateShakeTrigger = useCallback(() => {
    requestSosConfirmation({
      source: 'SHAKE',
      title: 'Simulated Shake Pattern Triggered',
      description:
        'A simulated rapid shake gesture exceeded the configured threshold. Confirm if you want to test SOS activation or cancel.',
      detectedTriggerDetail: 'SIMULATED SHAKE EVENT (3 peaks in 1.2s)',
    });
  }, [requestSosConfirmation]);

  // Voice recognition
  const stopVoiceListening = useCallback(() => {
    voiceSessionRef.current?.stop();
    voiceSessionRef.current = null;
    setIsVoiceListening(false);
  }, []);

  const startVoiceListening = useCallback(() => {
    if (!voiceSupported) {
      setVoiceError({
        code: 'unsupported',
        message: 'Web Speech Recognition API is not supported in this browser.',
        recovery:
          'Use Chrome, Edge, or Safari with SpeechRecognition support, or use Manual SOS.',
      });
      return;
    }

    voiceSessionRef.current?.stop();
    setVoiceError(null);

    const session = voiceRecognitionService.createSession(
      settings.voiceCommands,
      {
        onStatusChange: (active) => setIsVoiceListening(active),
        onTranscript: (transcript, _isFinal, alternatives) => {
          setVoiceTranscript(transcript);
          setVoiceAlternatives(alternatives);
        },
        onCommandMatch: (matchedCommand, fullTranscript) => {
          requestSosConfirmation({
            source: 'VOICE',
            title: `Voice Command Detected: "${matchedCommand}"`,
            description:
              'A configured emergency phrase was recognized. Confirm immediately to activate SOS, or cancel if triggered by mistake.',
            detectedTriggerDetail: `Transcript: "${fullTranscript}"`,
          });
        },
        onError: (code, message, recovery) => {
          setVoiceError({ code, message, recovery });
        },
      }
    );

    if (session) {
      voiceSessionRef.current = session;
      session.start();
    }
  }, [voiceSupported, settings.voiceCommands, requestSosConfirmation]);

  // Safe Journey actions
  const startJourney = useCallback(
    (params: {
      destination: string;
      estimatedMinutes: number;
      checkInIntervalMinutes: number;
    }) => {
      const now = Date.now();
      const intervalMs = Math.max(1, params.checkInIntervalMinutes) * 60 * 1000;
      const journey: SafeJourney = {
        id: `JRN-${now}`,
        destination: params.destination.trim(),
        estimatedMinutes: params.estimatedMinutes,
        checkInIntervalMinutes: params.checkInIntervalMinutes,
        startedAt: now,
        lastCheckInAt: now,
        nextCheckInDueAt: now + intervalMs,
        status: 'ACTIVE',
        missedCheckIns: 0,
      };
      setActiveJourney(journey);
      setNowTick(now);
      storageService.saveJourney(journey, settings.localStorageConsentGranted);
      if (locationPermission === 'granted') {
        void refreshLocation();
      }
    },
    [settings.localStorageConsentGranted, locationPermission, refreshLocation]
  );

  const checkInJourney = useCallback(() => {
    const now = Date.now();
    setActiveJourney((prev) => {
      if (!prev) return null;
      const next: SafeJourney = {
        ...prev,
        lastCheckInAt: now,
        nextCheckInDueAt: now + prev.checkInIntervalMinutes * 60 * 1000,
        status: 'ACTIVE',
      };
      storageService.saveJourney(next, settings.localStorageConsentGranted);
      return next;
    });
  }, [settings.localStorageConsentGranted]);

  const endJourney = useCallback(() => {
    setActiveJourney(null);
    storageService.saveJourney(null, settings.localStorageConsentGranted);
  }, [settings.localStorageConsentGranted]);

  const journeyElapsedSec = activeJourney
    ? Math.max(0, Math.floor((nowTick - activeJourney.startedAt) / 1000))
    : 0;

  const journeyCheckInRemainingSec = activeJourney
    ? Math.floor((activeJourney.nextCheckInDueAt - nowTick) / 1000)
    : null;

  return (
    <SafetyContext.Provider
      value={{
        settings,
        storageNotice,
        dismissStorageNotice,
        updateSettings,
        clearAllData,
        contacts,
        addContact,
        updateContact,
        removeContact,
        events,
        activeSosEvent,
        pendingConfirmation,
        requestSosConfirmation,
        confirmSosActivation,
        cancelPendingConfirmation,
        cancelActiveSos,
        resolveActiveSos,
        updateEventShareChannel,
        logSafetyEvent,
        clearEventHistory,
        gpsSupported,
        locationPermission,
        currentLocation,
        locationError,
        isFetchingLocation,
        isWatchingLocation,
        refreshLocation,
        mlMetrics,
        mlTrained,
        mlError,
        latestPrediction,
        retrainModel,
        evaluateFeatures,
        motionApiAvailable,
        motionPermission,
        isMotionMonitoring,
        isMotionPaused,
        hasHardwareMotionData,
        motionSamples,
        unusualMovementWarning,
        dismissUnusualWarning: () => setUnusualMovementWarning(null),
        requestMotionPermission,
        startMotionMonitoring,
        pauseMotionMonitoring,
        resumeMotionMonitoring,
        stopMotionMonitoring,
        voiceSupported,
        isVoiceListening,
        voiceTranscript,
        voiceAlternatives,
        voiceError,
        startVoiceListening,
        stopVoiceListening,
        shakePeaksCount,
        shakeCooldownRemaining,
        simulateShakeTrigger,
        activeJourney,
        journeyElapsedSec,
        journeyCheckInRemainingSec,
        startJourney,
        checkInJourney,
        endJourney,
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
};

export function useSafety(): SafetyContextValue {
  const ctx = useContext(SafetyContext);
  if (!ctx) {
    throw new Error('useSafety must be used within SafetyProvider');
  }
  return ctx;
}
