import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Clock,
  MapPin,
  Mic,
  PhoneCall,
  Route,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { SOSButton } from '../components/SOSButton';
import { AlertCard } from '../components/AlertCard';

export const Dashboard: React.FC = () => {
  const {
    settings,
    gpsSupported,
    locationPermission,
    currentLocation,
    motionApiAvailable,
    motionPermission,
    isMotionMonitoring,
    voiceSupported,
    isVoiceListening,
    contacts,
    activeJourney,
    journeyElapsedSec,
    events,
    mlTrained,
    mlMetrics,
    latestPrediction,
    activeSosEvent,
  } = useSafety();

  const latestEvent = events[0] ?? null;
  const recentEvents = events.slice(0, 4);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Primary Hero Anchor: SOS & Core Readiness */}
      <section className="rounded-2xl bg-gradient-to-br from-white via-[#FBF7FE] to-[#FDF2F6] border border-[#EAE4F2] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-purple-700">
              Personal Safety Control Center · Local-First Browser Architecture
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B2E]">
              {activeSosEvent
                ? 'Emergency SOS Event Active'
                : 'Manual SOS Ready — Always Available'}
            </h2>
            <p className="text-sm text-[#4B4560] leading-relaxed">
              {activeSosEvent
                ? `SOS event ${activeSosEvent.id} is active. Open the Emergency SOS console to share your prepared alert, call ${settings.emergencyNumber}, or cancel an accidental trigger.`
                : 'Manual SOS works independently of GPS, machine learning, voice recognition, or internet connectivity. No alerts or calls are ever sent silently without your confirmation.'}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5B5570]">
              <span>Emergency Helpline: {settings.emergencyNumber}</span>
              <span aria-hidden="true">·</span>
              <span>Configured Contacts: {contacts.length}</span>
              <span aria-hidden="true">·</span>
              <span>
                Monitoring:{' '}
                {isMotionMonitoring || isVoiceListening || activeJourney
                  ? 'Active'
                  : 'Standby'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <SOSButton variant="hero" />
            <div className="flex items-center gap-4 text-xs font-medium">
              <Link
                to="/fake-call"
                className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 transition-colors whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Start Fake Call</span>
              </Link>
              <Link
                to="/journey"
                className="inline-flex items-center gap-1.5 text-rose-700 hover:text-rose-900 transition-colors whitespace-nowrap"
              >
                <Route className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{activeJourney ? 'Manage Journey' : 'Start Safe Journey'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Capability & Sensor Availability Matrix */}
      <section aria-label="System Capability Status">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-[#1E1B2E]">
            System Readiness & Browser Capabilities
          </h3>
          <Link
            to="/settings"
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors whitespace-nowrap"
          >
            Configure Settings
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* GPS */}
          <Link
            to="/location"
            className="p-5 rounded-xl bg-white border border-[#EAE4F2] hover:border-purple-300 shadow-xs transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5B5570]">
                GPS Geolocation
              </span>
              <MapPin className="w-4 h-4 text-purple-600" aria-hidden="true" />
            </div>
            <div className="font-display text-base font-semibold text-[#1E1B2E]">
              {!gpsSupported
                ? 'Browser Unsupported'
                : locationPermission === 'granted'
                  ? 'Available & Permitted'
                  : locationPermission === 'denied'
                    ? 'Permission Denied'
                    : 'Permission Prompt Needed'}
            </div>
            <p className="text-xs text-[#5B5570] font-mono tabular-nums">
              {currentLocation
                ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)} (±${Math.round(currentLocation.accuracy)}m)`
                : 'No live coordinates fetched yet'}
            </p>
          </Link>

          {/* Motion Sensor */}
          <Link
            to="/movement"
            className="p-5 rounded-xl bg-white border border-[#EAE4F2] hover:border-purple-300 shadow-xs transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5B5570]">
                Movement Sensor
              </span>
              <Activity className="w-4 h-4 text-rose-600" aria-hidden="true" />
            </div>
            <div className="font-display text-base font-semibold text-[#1E1B2E]">
              {!motionApiAvailable
                ? 'Sensor API Unsupported'
                : isMotionMonitoring
                  ? 'Monitoring Active'
                  : `API Present (${motionPermission})`}
            </div>
            <p className="text-xs text-[#5B5570]">
              {latestPrediction
                ? `${latestPrediction.label} (${latestPrediction.confidence}%)`
                : 'Simulator available for desktop testing'}
            </p>
          </Link>

          {/* Voice Recognition */}
          <Link
            to="/voice"
            className="p-5 rounded-xl bg-white border border-[#EAE4F2] hover:border-purple-300 shadow-xs transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5B5570]">
                Voice Commands
              </span>
              <Mic className="w-4 h-4 text-purple-600" aria-hidden="true" />
            </div>
            <div className="font-display text-base font-semibold text-[#1E1B2E]">
              {!voiceSupported
                ? 'Speech API Unsupported'
                : isVoiceListening
                  ? 'Listening for Commands'
                  : 'Ready (Standby)'}
            </div>
            <p className="text-xs text-[#5B5570] truncate">
              Phrases: {settings.voiceCommands.join(', ')}
            </p>
          </Link>

          {/* ML Model */}
          <Link
            to="/ml-lab"
            className="p-5 rounded-xl bg-white border border-[#EAE4F2] hover:border-purple-300 shadow-xs transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5B5570]">
                Random Forest ML
              </span>
              <BrainCircuit className="w-4 h-4 text-teal-600" aria-hidden="true" />
            </div>
            <div className="font-display text-base font-semibold text-[#1E1B2E]">
              {mlTrained && mlMetrics
                ? `Trained · ${mlMetrics.treeCount} Trees`
                : 'Model Not Trained'}
            </div>
            <p className="text-xs text-[#5B5570] font-mono tabular-nums">
              {mlMetrics
                ? `Val Accuracy ${mlMetrics.accuracy}% · F1 ${mlMetrics.f1Score}% (Synthetic Data)`
                : 'Open ML Lab to train'}
            </p>
          </Link>

          {/* Emergency Contacts */}
          <Link
            to="/contacts"
            className="p-5 rounded-xl bg-white border border-[#EAE4F2] hover:border-purple-300 shadow-xs transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5B5570]">
                Emergency Contacts
              </span>
              <Users className="w-4 h-4 text-rose-600" aria-hidden="true" />
            </div>
            <div className="font-display text-base font-semibold text-[#1E1B2E] tabular-nums">
              {contacts.length === 0
                ? 'No Contacts Added'
                : `${contacts.length} Contact${contacts.length === 1 ? '' : 's'} Saved`}
            </div>
            <p className="text-xs text-[#5B5570]">
              {contacts.filter((c) => c.isPreferred).length} preferred · Stored locally only
            </p>
          </Link>

          {/* Safe Journey */}
          <Link
            to="/journey"
            className="p-5 rounded-xl bg-white border border-[#EAE4F2] hover:border-purple-300 shadow-xs transition-colors space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5B5570]">
                Safe Journey Status
              </span>
              <Route className="w-4 h-4 text-teal-600" aria-hidden="true" />
            </div>
            <div className="font-display text-base font-semibold text-[#1E1B2E] truncate">
              {activeJourney
                ? `${activeJourney.status === 'CHECKIN_OVERDUE' ? 'Check-In Due' : 'Active'} · ${activeJourney.destination}`
                : 'No Active Journey'}
            </div>
            <p className="text-xs text-[#5B5570] font-mono tabular-nums">
              {activeJourney
                ? `Elapsed ${formatDuration(journeyElapsedSec)} · ETA ${activeJourney.estimatedMinutes}m`
                : 'Configure destination & check-in timer'}
            </p>
          </Link>
        </div>
      </section>

      {/* Latest Event & Recent History + Quick Tools */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[#1E1B2E]">
              Recent Safety Events
            </h3>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((evt) => (
                <AlertCard key={evt.id} event={evt} />
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-white border border-[#EAE4F2] text-center space-y-2 shadow-xs">
              <Clock className="w-6 h-6 text-[#8E86A4] mx-auto" aria-hidden="true" />
              <div className="text-sm font-medium text-[#1E1B2E]">
                No emergency or safety events recorded yet
              </div>
              <p className="text-xs text-[#5B5570] max-w-md mx-auto">
                User-confirmed SOS alerts, cancelled prompts, journey check-in reminders, and simulated fake calls are logged locally here.
              </p>
            </div>
          )}
        </div>

        {/* Safety Principles & Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-[#1E1B2E]">
            Safety Boundaries & Quick Tools
          </h3>

          <div className="p-5 rounded-xl bg-white border border-[#EAE4F2] shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-[#4B4560] leading-relaxed space-y-1.5">
                <div className="font-semibold text-[#1E1B2E]">
                  Honest ML Classification Notice
                </div>
                <p>
                  Machine learning classifies motion features as normal-like or unusual-like using synthetic demonstration data. It cannot reliably verify an attack or replace human judgment.
                </p>
              </div>
            </div>

            <div className="border-t border-[#EAE4F2] pt-4 space-y-2">
              <div className="text-xs font-medium text-[#5B5570]">
                Latest Safety Event Summary
              </div>
              <div className="text-sm font-medium text-[#1E1B2E]">
                {latestEvent
                  ? `${latestEvent.type.replace(/_/g, ' ')} (${latestEvent.status})`
                  : 'No events logged in this browser.'}
              </div>
              {latestEvent && (
                <div className="text-xs text-[#5B5570] font-mono">
                  {new Date(latestEvent.timestamp).toLocaleString()}
                </div>
              )}
            </div>

            <div className="border-t border-[#EAE4F2] pt-4 grid grid-cols-1 gap-2">
              <Link
                to="/shake"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#EAE4F2] text-xs font-medium text-[#342E49] transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-600" aria-hidden="true" />
                  <span>Shake-to-Alert ({settings.shakeEnabled ? 'Enabled' : 'Disabled'})</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6D6684]" aria-hidden="true" />
              </Link>
              <Link
                to="/ml-lab"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#EAE4F2] text-xs font-medium text-[#342E49] transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-teal-600" aria-hidden="true" />
                  <span>Test Movement Simulator & ML</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6D6684]" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
