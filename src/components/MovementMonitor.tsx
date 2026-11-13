import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSafety } from '../context/SafetyContext';

export const MovementMonitor: React.FC = () => {
  const {
    motionApiAvailable,
    motionPermission,
    isMotionMonitoring,
    isMotionPaused,
    hasHardwareMotionData,
    motionSamples,
    latestPrediction,
    mlTrained,
    startMotionMonitoring,
    pauseMotionMonitoring,
    resumeMotionMonitoring,
    stopMotionMonitoring,
  } = useSafety();

  const chartData = motionSamples.map((s, idx) => ({
    index: idx + 1,
    time: new Date(s.timestamp).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    }),
    ax: s.ax,
    ay: s.ay,
    az: s.az,
    magnitude: s.magnitude,
  }));

  return (
    <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
            <Activity className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
              Live DeviceMotion Sensor Monitor
            </h3>
            <p className="text-xs text-[#5B5570]">
              <span>API: {motionApiAvailable ? 'Present' : 'Unsupported'}</span>
              <span aria-hidden="true"> · </span>
              <span>Permission: {motionPermission}</span>
              <span aria-hidden="true"> · </span>
              <span>
                ML Model: {mlTrained ? 'Random Forest Ready' : 'Not Trained'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isMotionMonitoring ? (
            <button
              type="button"
              onClick={() => void startMotionMonitoring()}
              disabled={!motionApiAvailable}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Start Monitoring</span>
            </button>
          ) : (
            <>
              {isMotionPaused ? (
                <button
                  type="button"
                  onClick={resumeMotionMonitoring}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseMotionMonitoring}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </button>
              )}
              <button
                type="button"
                onClick={stopMotionMonitoring}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-medium text-[#342E49] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {motionPermission === 'denied' && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-red-800">
          Motion sensor permission was denied. Enable Motion & Orientation access in your browser/device settings (on iOS Safari, open Settings or reload over HTTPS and accept the prompt), or use the Movement Simulator below.
        </div>
      )}

      {isMotionMonitoring && !hasHardwareMotionData && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              No physical accelerometer events detected from this browser (common on laptops and desktop browsers). No fake sensor readings are generated. Use the Movement Sensor Simulator to test ML classification.
            </span>
          </div>
          <Link
            to="/ml-lab"
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-purple-800 font-semibold whitespace-nowrap"
          >
            Open Simulator
          </Link>
        </div>
      )}

      {/* Real-time Telemetry Chart */}
      <div className="h-64 w-full rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] p-3">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DEF0" />
              <XAxis
                dataKey="time"
                stroke="#6D6684"
                tick={{ fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis stroke="#6D6684" tick={{ fontSize: 11 }} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DDD6EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#1E1B2E',
                }}
              />
              <Line
                type="monotone"
                dataKey="magnitude"
                name="Magnitude (m/s²)"
                stroke="#0D9488"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="ax"
                name="Acc X"
                stroke="#7C3AED"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="ay"
                name="Acc Y"
                stroke="#E11D48"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm font-medium text-[#342E49]">
              {isMotionMonitoring
                ? 'Listening for hardware DeviceMotion events...'
                : 'Live motion monitoring is idle'}
            </p>
            <p className="mt-1 text-xs text-[#5B5570] max-w-md">
              Start monitoring on a mobile phone or tablet with accelerometer hardware, or test the Random Forest model using the Movement Sensor Simulator.
            </p>
          </div>
        )}
      </div>

      {/* Latest Live Prediction Summary */}
      {latestPrediction && !latestPrediction.isSimulated && (
        <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#5B5570]">
              Latest Live Sensor Classification ·{' '}
              {new Date(latestPrediction.timestamp).toLocaleTimeString()}
            </div>
            <div
              className={`mt-1 font-display text-sm font-bold ${
                latestPrediction.label === 'UNUSUAL MOVEMENT PATTERN'
                  ? 'text-amber-700'
                  : 'text-teal-700'
              }`}
            >
              {latestPrediction.label}
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs tabular-nums">
            <div>
              <div className="text-[#5B5570]">Confidence</div>
              <div className="text-[#1E1B2E] font-semibold">
                {latestPrediction.confidence}%
              </div>
            </div>
            <div>
              <div className="text-[#5B5570]">Tree Votes</div>
              <div className="text-[#1E1B2E] font-semibold">
                {latestPrediction.unusualVotes}/{latestPrediction.totalTrees} unusual
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
