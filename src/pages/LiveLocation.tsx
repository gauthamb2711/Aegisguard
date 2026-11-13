import React from 'react';
import { Info, Shield } from 'lucide-react';
import { LocationPanel } from '../components/LocationPanel';
import { useSafety } from '../context/SafetyContext';

export const LiveLocation: React.FC = () => {
  const { currentLocation, isWatchingLocation } = useSafety();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          Browser GPS Location Tracking
        </h2>
        <p className="text-sm text-[#4B4560]">
          Uses the standard HTML5 Geolocation API to retrieve real device coordinates and accuracy on demand or during an active Safe Journey.
        </p>
      </div>

      <LocationPanel />

      {currentLocation ? (
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
              Coordinate Map Reference (OpenStreetMap)
            </h3>
            <span className="text-xs text-[#5B5570] font-mono tabular-nums">
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </span>
          </div>
          <div className="rounded-lg overflow-hidden border border-[#EAE4F2] h-80 bg-[#FAF8FC]">
            <iframe
              title="OpenStreetMap Current Location"
              className="w-full h-full border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(currentLocation.longitude - 0.008).toFixed(6)}%2C${(currentLocation.latitude - 0.006).toFixed(6)}%2C${(currentLocation.longitude + 0.008).toFixed(6)}%2C${(currentLocation.latitude + 0.006).toFixed(6)}&layer=mapnik&marker=${currentLocation.latitude.toFixed(6)}%2C${currentLocation.longitude.toFixed(6)}`}
            />
          </div>
          <p className="text-xs text-[#5B5570]">
            Map tile embed uses your live browser coordinates. If offline or blocked by network rules, use the coordinates and accuracy metrics above.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#EAE4F2] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1B2E]">
            <Info className="w-4 h-4 text-purple-600" aria-hidden="true" />
            <span>Browser Background Tracking Limitation</span>
          </div>
          <p className="text-xs text-[#4B4560] leading-relaxed">
            Web browsers stop JavaScript execution and Geolocation watchers when the browser tab is closed or the mobile OS suspends background tabs. Continuous location tracking is active only while the tab remains open during a Safe Journey ({isWatchingLocation ? 'currently watching' : 'currently idle'}).
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#EAE4F2] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1B2E]">
            <Shield className="w-4 h-4 text-teal-600" aria-hidden="true" />
            <span>Privacy-First Location Policy</span>
          </div>
          <p className="text-xs text-[#4B4560] leading-relaxed">
            Continuous location history is never stored in LocalStorage or transmitted to any server. Coordinates are only attached to a safety event when you explicitly consent during SOS activation.
          </p>
        </div>
      </div>
    </div>
  );
};
