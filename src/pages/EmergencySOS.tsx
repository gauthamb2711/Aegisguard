import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Share2,
  ShieldAlert,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { sosService } from '../services/sosService';
import { sharingService } from '../services/sharingService';
import { locationService } from '../services/locationService';

export const EmergencySOS: React.FC = () => {
  const {
    settings,
    contacts,
    activeSosEvent,
    currentLocation,
    locationError,
    isFetchingLocation,
    activeJourney,
    confirmSosActivation,
    cancelActiveSos,
    resolveActiveSos,
    refreshLocation,
    updateEventShareChannel,
  } = useSafety();

  const [includeLocation, setIncludeLocation] = useState(
    settings.includeLocationInSOSByDefault
  );
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const webShareSupported = sharingService.isWebShareSupported();

  const effectiveLocation = activeSosEvent?.location
    ? {
        latitude: activeSosEvent.location.latitude,
        longitude: activeSosEvent.location.longitude,
        accuracy: activeSosEvent.location.accuracy,
        timestamp: activeSosEvent.timestamp,
        speed: null,
        heading: null,
      }
    : currentLocation;

  const preparedMessage = sosService.buildEmergencyMessage({
    location: effectiveLocation,
    includeLocation,
    emergencyNumber: settings.emergencyNumber,
    customNote,
    destination: activeJourney?.destination,
  });

  const preferredContacts = contacts.filter((c) => c.isPreferred);
  const targetContacts = preferredContacts.length > 0 ? preferredContacts : contacts;

  const handleDirectActivate = async () => {
    setShareFeedback(null);
    await confirmSosActivation({
      source: 'MANUAL',
      includeLocation,
      customNotes: customNote.trim() || undefined,
    });
  };

  const handleCopy = async () => {
    const ok = await sharingService.copyToClipboard(preparedMessage);
    if (ok) {
      setCopied(true);
      if (activeSosEvent) {
        updateEventShareChannel(activeSosEvent.id, 'COPIED');
      }
      setShareFeedback(
        'Emergency message copied to clipboard. Paste it into any messaging app to send.'
      );
      window.setTimeout(() => setCopied(false), 2500);
    } else {
      setShareFeedback('Clipboard permission was blocked. Select and copy the message text manually.');
    }
  };

  const handleWebShare = async () => {
    const mapUrl = effectiveLocation
      ? locationService.getGoogleMapsUrl(
          effectiveLocation.latitude,
          effectiveLocation.longitude
        )
      : undefined;
    const res = await sharingService.shareViaWebShare(
      'Emergency SOS Alert',
      preparedMessage,
      mapUrl
    );
    if (res.ok) {
      if (activeSosEvent) {
        updateEventShareChannel(activeSosEvent.id, 'WEB_SHARE');
      }
      setShareFeedback(
        'Device share sheet completed. Confirm inside your selected app that the message was sent.'
      );
    } else if (res.error) {
      setShareFeedback(res.error);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {!isOnline && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold">Offline Mode Detected:</span> Manual SOS, message preparation, local emergency contacts, and SMS/Call app links remain fully functional without internet connectivity.
          </div>
        </div>
      )}

      {/* Active SOS Banner OR Manual Trigger Card */}
      {activeSosEvent ? (
        <div className="rounded-xl bg-rose-50 border border-rose-300 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-red-600 text-white shrink-0">
                <ShieldAlert className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[#1E1B2E]">
                  Active Emergency SOS Event
                </h2>
                <p className="mt-1 text-xs text-rose-800 font-mono tabular-nums">
                  {activeSosEvent.id} · Created{' '}
                  {new Date(activeSosEvent.timestamp).toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-[#342E49]">
                  Review your location and prepared message below, then choose a user-initiated sharing or calling action. Nothing is transmitted automatically.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resolveActiveSos}
                className="px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
              >
                Mark Safe / Resolve
              </button>
              <button
                type="button"
                onClick={cancelActiveSos}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-rose-100 border border-rose-300 text-xs font-medium text-[#342E49] whitespace-nowrap cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                <span>Cancel Accidental Alert</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <h2 className="font-display text-xl font-bold text-[#1E1B2E]">
                Manual Emergency SOS Activation
              </h2>
              <p className="text-sm text-[#4B4560] leading-relaxed">
                Creates an emergency event with a timestamp, retrieves GPS coordinates if permitted, and prepares an emergency message for your contacts. Always works even if GPS, ML, voice, or internet are unavailable.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDirectActivate()}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-display font-bold text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              Activate Manual SOS Now
            </button>
          </div>

          <div className="pt-3 border-t border-[#EAE4F2] flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2.5 text-sm text-[#342E49] cursor-pointer">
              <input
                type="checkbox"
                checked={includeLocation}
                onChange={(e) => setIncludeLocation(e.target.checked)}
                className="h-4 w-4 rounded border-purple-300 text-purple-600"
              />
              <span>Include GPS coordinates if available</span>
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Optional note (e.g., landmark, vehicle number)"
              className="flex-1 px-3.5 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-sm text-[#1E1B2E] placeholder:text-[#8E86A4] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {/* Location & Helpline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" aria-hidden="true" />
              <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
                SOS Location Status
              </h3>
            </div>
            <button
              type="button"
              onClick={() => void refreshLocation()}
              disabled={isFetchingLocation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-medium text-purple-900 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetchingLocation ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isFetchingLocation ? 'Locating...' : 'Refresh GPS'}</span>
            </button>
          </div>

          {effectiveLocation ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 font-mono text-xs tabular-nums">
                <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                  <div className="text-[#5B5570] font-sans">Latitude</div>
                  <div className="mt-1 font-semibold text-[#1E1B2E]">
                    {effectiveLocation.latitude.toFixed(6)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                  <div className="text-[#5B5570] font-sans">Longitude</div>
                  <div className="mt-1 font-semibold text-[#1E1B2E]">
                    {effectiveLocation.longitude.toFixed(6)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                  <div className="text-[#5B5570] font-sans">Accuracy</div>
                  <div className="mt-1 font-semibold text-purple-700">
                    ±{Math.round(effectiveLocation.accuracy)}m
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={locationService.getGoogleMapsUrl(
                    effectiveLocation.latitude,
                    effectiveLocation.longitude
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-medium text-white whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Map Location</span>
                </a>
                <a
                  href={locationService.getOpenStreetMapUrl(
                    effectiveLocation.latitude,
                    effectiveLocation.longitude
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-medium text-[#342E49] whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>OpenStreetMap</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] text-xs text-[#4B4560] space-y-1">
              <div className="font-semibold text-amber-700">
                Location unavailable for this alert
              </div>
              <p className="text-[#5B5570]">
                {locationError
                  ? `${locationError.message} ${locationError.recovery}`
                  : 'GPS coordinates have not been acquired yet. Your SOS message still works and clearly states that location could not be retrieved.'}
              </p>
            </div>
          )}
        </div>

        {/* User-Initiated Emergency Call & Contacts */}
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
              Emergency Helpline & Contacts
            </h3>
            <Link
              to="/contacts"
              className="text-xs font-semibold text-purple-700 hover:text-purple-900"
            >
              Manage Contacts
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-[#5B5570]">
                Configured Emergency Number (Editable in Settings)
              </div>
              <div className="mt-0.5 font-mono text-lg font-bold text-[#1E1B2E]">
                {settings.emergencyNumber || '112'}
              </div>
              <div className="text-xs text-[#5B5570]">
                {settings.emergencyNumberLabel}
              </div>
            </div>
            <a
              href={sharingService.buildTelUri(settings.emergencyNumber || '112')}
              onClick={() => {
                if (activeSosEvent) {
                  updateEventShareChannel(activeSosEvent.id, 'CALL_LINK');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white whitespace-nowrap"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>Open Dialer ({settings.emergencyNumber || '112'})</span>
            </a>
          </div>

          <div>
            <div className="text-xs font-medium text-[#5B5570] mb-2">
              Configured Emergency Contacts ({targetContacts.length} selected for alerts)
            </div>
            {targetContacts.length > 0 ? (
              <ul className="space-y-1.5 max-h-28 overflow-y-auto">
                {targetContacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]"
                  >
                    <span className="font-medium text-[#1E1B2E]">
                      {c.name}{' '}
                      <span className="text-[#5B5570]">
                        ({c.relationship || 'Contact'})
                      </span>
                    </span>
                    <span className="font-mono text-[#342E49]">{c.phone}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#5B5570]">
                No emergency contacts configured yet. You can still share via system share sheet, SMS, email, or copy message.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Prepared Message & Sharing Actions */}
      <div className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Prepared Emergency Alert Message
          </h3>
          <span className="text-xs text-[#5B5570]">
            User-initiated dispatch only · Never sent silently
          </span>
        </div>

        <pre className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] text-xs font-mono text-[#1E1B2E] whitespace-pre-wrap leading-relaxed">
          {preparedMessage}
        </pre>

        {shareFeedback && (
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900">
            {shareFeedback}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {webShareSupported && (
            <button
              type="button"
              onClick={() => void handleWebShare()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              <span>Share via Device Share Sheet</span>
            </button>
          )}

          <a
            href={sharingService.buildSmsUri(targetContacts, preparedMessage)}
            onClick={() => {
              if (activeSosEvent) {
                updateEventShareChannel(activeSosEvent.id, 'SMS_LINK');
              }
              setShareFeedback(
                'Opened your SMS app with the prepared message. Tap Send inside your messaging app to deliver.'
              );
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-semibold text-[#1E1B2E] whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 text-purple-600" aria-hidden="true" />
            <span>Open SMS App</span>
          </a>

          <a
            href={sharingService.buildMailtoUri(
              targetContacts,
              'EMERGENCY SOS ALERT',
              preparedMessage
            )}
            onClick={() => {
              if (activeSosEvent) {
                updateEventShareChannel(activeSosEvent.id, 'MAILTO_LINK');
              }
              setShareFeedback(
                'Opened your email client with the prepared message. Confirm sending inside your email app.'
              );
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-semibold text-[#1E1B2E] whitespace-nowrap"
          >
            <Mail className="w-4 h-4 text-rose-600" aria-hidden="true" />
            <span>Open Email App</span>
          </a>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAF8FC] hover:bg-purple-50 border border-[#DCD4EA] text-xs font-semibold text-[#1E1B2E] whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-teal-600" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 text-[#5B5570]" aria-hidden="true" />
            )}
            <span>{copied ? 'Copied Message' : 'Copy Emergency Message'}</span>
          </button>
        </div>

        <div className="pt-2 flex items-start gap-2 text-xs text-[#5B5570]">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Important: Opening SMS, Email, Dialer, or Share Sheet hands off the message to your device apps. AegisGuard does not claim delivery until you complete sending in that app.
          </span>
        </div>
      </div>
    </div>
  );
};
