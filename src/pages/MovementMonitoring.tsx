import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ShieldAlert } from 'lucide-react';
import { MovementMonitor } from '../components/MovementMonitor';
import { useSafety } from '../context/SafetyContext';

export const MovementMonitoring: React.FC = () => {
  const {
    motionSamples,
    latestPrediction,
    isSimStreamActive,
    requestSosConfirmation,
  } = useSafety();

  const recentSamples = [...motionSamples].reverse().slice(0, 8);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
            Real-Time Movement Sensor Monitoring
          </h2>
          <p className="text-sm text-[#4B4560]">
            Reads device accelerometer axes (X, Y, Z) via the Browser DeviceMotion API and classifies movement windows with the trained Random Forest model.
          </p>
        </div>

        <Link
          to="/ml-lab"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-900 whitespace-nowrap"
        >
          <BrainCircuit className="w-4 h-4 text-purple-600" aria-hidden="true" />
          <span>Open ML Lab & Simulator</span>
        </Link>
      </div>

      <MovementMonitor />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Recent Sensor Samples ({isSimStreamActive ? 'SIMULATED STREAM' : 'Live Hardware'})
          </h3>
          {recentSamples.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-[#EAE4F2] text-[#5B5570]">
                    <th className="py-2 pr-3 font-medium">Time</th>
                    <th className="py-2 px-2 font-medium text-right">Ax</th>
                    <th className="py-2 px-2 font-medium text-right">Ay</th>
                    <th className="py-2 px-2 font-medium text-right">Az</th>
                    <th className="py-2 pl-2 font-medium text-right">Mag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4F2]">
                  {recentSamples.map((s, i) => (
                    <tr key={`${s.timestamp}-${i}`} className="text-[#1E1B2E]">
                      <td className="py-2 pr-3 text-[#5B5570]">
                        {new Date(s.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-2 text-right">{s.ax.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{s.ay.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right">{s.az.toFixed(2)}</td>
                      <td className="py-2 pl-2 text-right text-purple-700 font-semibold">
                        {s.magnitude.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] text-xs text-[#5B5570]">
              No live sensor samples recorded yet. On desktop devices without accelerometers, use the Movement Sensor Simulator in the ML Analysis Lab.
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white border border-[#EAE4F2] p-5 space-y-4 shadow-xs">
          <h3 className="font-display text-base font-semibold text-[#1E1B2E]">
            Classification Safety Principle
          </h3>
          <p className="text-xs text-[#4B4560] leading-relaxed">
            The Random Forest model strictly outputs <span className="font-semibold text-[#1E1B2E]">NORMAL MOVEMENT PATTERN</span> or <span className="font-semibold text-amber-700">UNUSUAL MOVEMENT PATTERN</span>. Unusual motion (such as dropping a phone, sudden running, or stumbling) does not prove an emergency or assault.
          </p>

          {latestPrediction && (
            <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] space-y-2 text-xs">
              <div className="text-[#5B5570]">
                Latest Model Evaluation ({latestPrediction.isSimulated ? 'SIMULATED DATA' : 'LIVE SENSOR'})
              </div>
              <div className="font-semibold text-[#1E1B2E]">
                {latestPrediction.label} · {latestPrediction.confidence}% confidence
              </div>
              <div className="font-mono text-[#5B5570] tabular-nums">
                Variance: {latestPrediction.features.motionVariance} · Peaks: {latestPrediction.features.peakCount} · Delta: {latestPrediction.features.deltaAcceleration} m/s²
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              requestSosConfirmation({
                source: 'MANUAL',
                title: 'Confirm Manual SOS',
                description:
                  'Manual SOS is always available regardless of sensor availability or ML status.',
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
            <span>Trigger Manual SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
