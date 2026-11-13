import React, { useMemo } from 'react';
import { BarChart3, Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSafety } from '../context/SafetyContext';
import { storageService } from '../services/storageService';

export const Reports: React.FC = () => {
  const { events, contacts, settings, activeJourney, mlMetrics } = useSafety();

  const summary = useMemo(() => {
    const total = events.length;
    const confirmedSos = events.filter(
      (e) =>
        e.userConfirmed &&
        (e.type === 'MANUAL_SOS' ||
          e.type === 'VOICE_TRIGGERED_SOS' ||
          e.type === 'SHAKE_TRIGGERED_SOS')
    ).length;
    const cancelled = events.filter((e) => e.cancelled).length;
    const withLocation = events.filter((e) => Boolean(e.location)).length;

    const countsByType: Record<string, number> = {};
    for (const evt of events) {
      countsByType[evt.type] = (countsByType[evt.type] || 0) + 1;
    }

    const chartData = Object.entries(countsByType).map(([type, count]) => ({
      type: type.replace(/_/g, ' '),
      count,
    }));

    return { total, confirmedSos, cancelled, withLocation, chartData };
  }, [events]);

  const handleExportReportJson = () => {
    const json = storageService.exportAllData(
      settings,
      contacts,
      events,
      activeJourney
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegisguard-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
            Safety Reports & Analytics
          </h2>
          <p className="text-sm text-[#4B4560]">
            Computed directly from your local safety event log and in-browser Random Forest validation metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportReportJson}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-purple-50 border border-[#DCD4EA] text-xs font-semibold text-[#1E1B2E] whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
          <span>Export JSON Report</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono tabular-nums">
        <div className="p-4 rounded-xl bg-white border border-[#EAE4F2] shadow-xs">
          <div className="text-xs text-[#5B5570] font-sans">Total Logged Events</div>
          <div className="mt-1 text-2xl font-bold text-[#1E1B2E]">{summary.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#EAE4F2] shadow-xs">
          <div className="text-xs text-[#5B5570] font-sans">User-Confirmed SOS</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{summary.confirmedSos}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#EAE4F2] shadow-xs">
          <div className="text-xs text-[#5B5570] font-sans">Cancelled Prompts</div>
          <div className="mt-1 text-2xl font-bold text-[#342E49]">{summary.cancelled}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#EAE4F2] shadow-xs">
          <div className="text-xs text-[#5B5570] font-sans">Events with GPS Consent</div>
          <div className="mt-1 text-2xl font-bold text-purple-700">{summary.withLocation}</div>
        </div>
      </div>

      {/* Event Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Events by Category
          </h3>
          {summary.chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DEF0" />
                  <XAxis dataKey="type" stroke="#5B5570" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#5B5570" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DDD6EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#1E1B2E',
                    }}
                  />
                  <Bar dataKey="count" name="Events" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <BarChart3 className="w-6 h-6 text-[#8E86A4] mb-2" aria-hidden="true" />
              <div className="text-sm font-medium text-[#342E49]">
                No event data to chart yet
              </div>
              <p className="text-xs text-[#5B5570] mt-1">
                Charts populate strictly from real logged interactions—no placeholder data is displayed.
              </p>
            </div>
          )}
        </div>

        {/* ML Validation Report */}
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Random Forest Model Validation Summary
          </h3>
          {mlMetrics ? (
            <div className="space-y-4 text-xs">
              <p className="text-[#5B5570]">
                Evaluated on {mlMetrics.validationSize} held-out synthetic demonstration samples ({mlMetrics.treeCount} CART trees, max depth {mlMetrics.maxDepth}).
              </p>
              <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                  <div className="text-[#5B5570] font-sans">Accuracy</div>
                  <div className="mt-1 text-lg font-bold text-[#1E1B2E]">{mlMetrics.accuracy}%</div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                  <div className="text-[#5B5570] font-sans">F1-Score</div>
                  <div className="mt-1 text-lg font-bold text-teal-700">{mlMetrics.f1Score}%</div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                  <div className="text-[#5B5570] font-sans">Precision</div>
                  <div className="mt-1 text-lg font-bold text-purple-700">{mlMetrics.precision}%</div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                  <div className="text-[#5B5570] font-sans">Recall</div>
                  <div className="mt-1 text-lg font-bold text-rose-600">{mlMetrics.recall}%</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#5B5570]">Model metrics unavailable.</p>
          )}
        </div>
      </div>
    </div>
  );
};
