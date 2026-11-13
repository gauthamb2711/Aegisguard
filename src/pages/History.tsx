import React, { useMemo, useState } from 'react';
import {
  Clock,
  Download,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { AlertCard } from '../components/AlertCard';
import { SafetyEvent, SafetyEventType } from '../types/safety';

function escapeCsv(val: string | number | boolean | undefined): string {
  const str = String(val ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const History: React.FC = () => {
  const { events, clearEventHistory } = useSafety();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (typeFilter !== 'ALL' && evt.type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          evt.id.toLowerCase().includes(q) ||
          evt.type.toLowerCase().includes(q) ||
          evt.notes.toLowerCase().includes(q) ||
          evt.status.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (dateFrom) {
        const fromTs = new Date(`${dateFrom}T00:00:00`).getTime();
        if (evt.timestamp < fromTs) return false;
      }
      if (dateTo) {
        const toTs = new Date(`${dateTo}T23:59:59.999`).getTime();
        if (evt.timestamp > toTs) return false;
      }
      return true;
    });
  }, [events, typeFilter, searchQuery, dateFrom, dateTo]);

  const handleExportCsv = () => {
    const headers = [
      'Event ID',
      'Type',
      'Timestamp ISO',
      'Status',
      'User Confirmed',
      'Cancelled',
      'Location Consented',
      'Latitude',
      'Longitude',
      'Accuracy (m)',
      'Message Prepared',
      'Share Action',
      'Notes',
    ];

    const rows = filteredEvents.map((e) => [
      escapeCsv(e.id),
      escapeCsv(e.type),
      escapeCsv(new Date(e.timestamp).toISOString()),
      escapeCsv(e.status),
      escapeCsv(e.userConfirmed),
      escapeCsv(e.cancelled),
      escapeCsv(e.locationConsented),
      escapeCsv(e.location?.latitude ?? ''),
      escapeCsv(e.location?.longitude ?? ''),
      escapeCsv(e.location?.accuracy ?? ''),
      escapeCsv(e.messagePrepared),
      escapeCsv(e.sharedVia),
      escapeCsv(e.notes),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegisguard-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eventTypes: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All Event Types' },
    { value: 'MANUAL_SOS', label: 'Manual SOS' },
    { value: 'VOICE_TRIGGERED_SOS', label: 'Voice-Triggered SOS' },
    { value: 'SHAKE_TRIGGERED_SOS', label: 'Shake-Triggered SOS' },
    { value: 'JOURNEY_CHECKIN_MISSED', label: 'Journey Check-In' },
    { value: 'FAKE_CALL_TRIGGERED', label: 'Fake Call' },
    { value: 'SOS_CANCELLED', label: 'Cancelled Alert' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
            Emergency Event History
          </h2>
          <p className="text-sm text-[#4B4560]">
            Local-only log of confirmed SOS alerts, cancelled prompts, journey check-in reminders, and simulated calls. No audio or continuous tracking logs are stored.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredEvents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-purple-50 disabled:opacity-50 border border-[#DCD4EA] text-xs font-semibold text-[#1E1B2E] whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
            <span>Export CSV</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={events.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 disabled:opacity-50 border border-rose-200 text-xs font-semibold text-red-700 whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear History</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 rounded-lg px-3 py-1.5">
              <span className="text-xs text-rose-900">Delete all {events.length} events?</span>
              <button
                type="button"
                onClick={() => {
                  clearEventHistory();
                  setConfirmClear(false);
                  setSelectedEvent(null);
                }}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 text-xs text-[#4B4560] hover:text-[#1E1B2E] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white border border-[#EAE4F2] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-xs">
        <div className="relative">
          <Search
            className="w-4 h-4 text-[#8E86A4] absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, notes, status..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-xs text-[#1E1B2E] placeholder:text-[#8E86A4] focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SafetyEventType | 'ALL')}
          aria-label="Filter by event type"
          className="px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-xs text-[#1E1B2E] focus:outline-none focus:border-purple-500"
        >
          {eventTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Filter from date"
          className="px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-xs text-[#1E1B2E] font-mono focus:outline-none focus:border-purple-500"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="Filter to date"
          className="px-3 py-2 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-xs text-[#1E1B2E] font-mono focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Event List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <AlertCard
              key={evt.id}
              event={evt}
              onSelect={(selected) => setSelectedEvent(selected)}
            />
          ))}
        </div>
      ) : (
        <div className="p-10 rounded-xl bg-white border border-[#EAE4F2] text-center space-y-2 shadow-xs">
          <Clock className="w-6 h-6 text-[#8E86A4] mx-auto" aria-hidden="true" />
          <div className="text-sm font-medium text-[#1E1B2E]">
            {events.length === 0
              ? 'No safety events logged yet'
              : 'No events match your current filters'}
          </div>
          <p className="text-xs text-[#5B5570]">
            {events.length === 0
              ? 'Events appear here when you activate SOS, cancel a prompt, miss a journey check-in, or test a fake call.'
              : 'Try clearing the search query or date range filters.'}
          </p>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B2E]/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#EAE4F2] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#1E1B2E]">
                Event Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
                className="p-1.5 rounded-lg text-[#6D6684] hover:text-[#1E1B2E] hover:bg-purple-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <dt className="text-[#5B5570]">Event ID</dt>
                <dd className="mt-1 font-mono text-[#1E1B2E]">{selectedEvent.id}</dd>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <dt className="text-[#5B5570]">Status</dt>
                <dd className="mt-1 font-semibold text-[#1E1B2E]">{selectedEvent.status}</dd>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <dt className="text-[#5B5570]">Timestamp</dt>
                <dd className="mt-1 font-mono text-[#1E1B2E]">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </dd>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <dt className="text-[#5B5570]">Share Action</dt>
                <dd className="mt-1 text-[#1E1B2E]">{selectedEvent.sharedVia}</dd>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <dt className="text-[#5B5570]">Location Consent & Coordinates</dt>
                <dd className="mt-1 font-mono text-[#1E1B2E]">
                  {selectedEvent.location
                    ? `${selectedEvent.location.latitude.toFixed(6)}, ${selectedEvent.location.longitude.toFixed(6)} (±${Math.round(selectedEvent.location.accuracy)}m)`
                    : 'Not attached / Not consented'}
                </dd>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <dt className="text-[#5B5570]">Notes</dt>
                <dd className="mt-1 text-[#342E49] leading-relaxed">{selectedEvent.notes}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};
