export type PermissionStatusType =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported'
  | 'unknown';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
}

export interface LocationErrorState {
  code:
    | 'PERMISSION_DENIED'
    | 'POSITION_UNAVAILABLE'
    | 'TIMEOUT'
    | 'UNSUPPORTED'
    | 'UNKNOWN';
  message: string;
  recovery: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPreferred: boolean;
  createdAt: number;
}

export type SafetyEventType =
  | 'MANUAL_SOS'
  | 'VOICE_TRIGGERED_SOS'
  | 'SHAKE_TRIGGERED_SOS'
  | 'UNUSUAL_MOVEMENT_ALERT'
  | 'JOURNEY_CHECKIN_MISSED'
  | 'FAKE_CALL_TRIGGERED'
  | 'SOS_CANCELLED';

export type ShareChannel =
  | 'WEB_SHARE'
  | 'SMS_LINK'
  | 'MAILTO_LINK'
  | 'COPIED'
  | 'CALL_LINK'
  | 'NONE';

export interface SafetyEvent {
  id: string;
  type: SafetyEventType;
  timestamp: number;
  userConfirmed: boolean;
  cancelled: boolean;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED' | 'ACKNOWLEDGED';
  locationConsented: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  messagePrepared: boolean;
  sharedVia: ShareChannel;
  notes: string;
}

export interface MotionSample {
  timestamp: number;
  ax: number;
  ay: number;
  az: number;
  magnitude: number;
  deltaMagnitude: number;
  isSimulated: boolean;
  patternLabel?: string;
}

export interface MotionFeatures {
  ax: number;
  ay: number;
  az: number;
  magnitude: number;
  deltaAcceleration: number;
  motionVariance: number;
  peakCount: number;
  shortTermIntensity: number;
  unusualDurationSec: number;
}

export type MovementClass =
  | 'NORMAL MOVEMENT PATTERN'
  | 'UNUSUAL MOVEMENT PATTERN';

export interface MLPrediction {
  label: MovementClass;
  confidence: number;
  unusualVotes: number;
  normalVotes: number;
  totalTrees: number;
  features: MotionFeatures;
  timestamp: number;
  isSimulated: boolean;
}

export interface MLFeatureImportance {
  feature: string;
  key: keyof MotionFeatures;
  importance: number;
}

export interface MLValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  trainSize: number;
  validationSize: number;
  treeCount: number;
  maxDepth: number;
  featureImportances: MLFeatureImportance[];
  trainedAt: number;
  trainingTimeMs: number;
}

export type SimulatorScenario =
  | 'normal_walking'
  | 'running'
  | 'sudden_movement'
  | 'sudden_stop'
  | 'fall_like'
  | 'irregular_movement'
  | 'stationary';

export interface SafeJourney {
  id: string;
  destination: string;
  estimatedMinutes: number;
  checkInIntervalMinutes: number;
  startedAt: number;
  lastCheckInAt: number;
  nextCheckInDueAt: number;
  status: 'ACTIVE' | 'CHECKIN_OVERDUE' | 'COMPLETED' | 'SOS_ESCALATED';
  missedCheckIns: number;
}

export interface AppSettings {
  emergencyNumber: string;
  emergencyNumberLabel: string;
  alertSoundEnabled: boolean;
  voiceCommands: string[];
  shakeEnabled: boolean;
  shakeThreshold: number;
  shakeCooldownSec: number;
  motionSampleWindowSize: number;
  localStorageConsentGranted: boolean;
  includeLocationInSOSByDefault: boolean;
}

export interface PendingConfirmation {
  source: 'VOICE' | 'SHAKE' | 'MOVEMENT_ML' | 'JOURNEY_CHECKIN' | 'MANUAL';
  title: string;
  description: string;
  detectedTriggerDetail?: string;
  createdAt: number;
}
