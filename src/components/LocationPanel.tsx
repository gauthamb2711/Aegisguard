import React from 'react';
import {
  AlertCircle,
  ExternalLink,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { locationService } from '../services/locationService';

export const LocationPanel: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const {
    gpsSupported,
    locationPermission,
    currentLocation,
    locationError,
    isFetchingLocation,
    isWatchingLocation,
    refreshLocation,
  } = useSafety();

  const permLabelMap: Record<string, { text: string; color: string }> = {
    granted: { text: 'Permission Granted', color: 'text-teal-700 font-medium' },
    denied: { text: 'Permission Denied', color: 'text-red-600 font-medium' },
    prompt: { text: 'Prompt Required', color: 'text-amber-700 font-medium' },
    unsupported: { text: 'Browser Unsupported', color: 'text-[#5B5570]' },
    unknown: { text: 'Not Yet Requested', color: 'text-[#4B4560]' },
  };

  const permInfo = permLabelMap[locationPermission] ?? permLabelMap.unknown;

  return (
    <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-purple-600 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
              GPS Location Status
            </h3>
            <p className="text-xs text-[#5B5570]">
              <span className={permInfo.color}>{permInfo.text}</span>
              <span aria-hidden="true"> · </span>
              <span>
                {isWatchingLocation
                  ? 'Active journey watch running'
                  : gpsSupported
                    ? 'On-demand browser Geolocation API'
                    : 'Geolocation unavailable'}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refreshLocation()}
          disabled={isFetchingLocation || !gpsSupported}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 disabled:opacity-50 border border-purple-200 text-xs font-semibold text-purple-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetchingLocation ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{isFetchingLocation ? 'Fetching GPS...' : 'Get Current Location'}</span>
        </button>
      </div>

      {locationError && (
        <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {locationError.code}: {locationError.message}
            </span>
          </div>
          <p className="text-[#4B4560] leading-relaxed">{locationError.recovery}</p>
        </div>
      )}

      {currentLocation ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
              <div className="text-xs text-[#5B5570]">Latitude</div>
              <div className="mt-1 font-mono text-sm font-semibold text-[#1E1B2E] tabular-nums">
                {currentLocation.latitude.toFixed(6)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
              <div className="text-xs text-[#5B5570]">Longitude</div>
              <div className="mt-1 font-mono text-sm font-semibold text-[#1E1B2E] tabular-nums">
                {currentLocation.longitude.toFixed(6)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
              <div className="text-xs text-[#5B5570]">Accuracy</div>
              <div className="mt-1 font-mono text-sm font-semibold text-purple-700 tabular-nums">
                ±{Math.round(currentLocation.accuracy)} m
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
              <div className="text-xs text-[#5B5570]">Last Updated</div>
              <div className="mt-1 font-mono text-sm font-semibold text-[#342E49] tabular-nums">
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {!compact && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={locationService.getGoogleMapsUrl(
                  currentLocation.latitude,
                  currentLocation.longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-medium text-white transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open in Google Maps</span>
              </a>
              <a
                href={locationService.getOpenStreetMapUrl(
                  currentLocation.latitude,
                  currentLocation.longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-xs font-medium text-teal-800 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open in OpenStreetMap</span>
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] text-xs text-[#5B5570]">
          No live GPS fix has been retrieved yet. Click "Get Current Location" to request coordinates from your browser. No sample coordinates are fabricated.
        </div>
      )}
    </div>
  );
};
