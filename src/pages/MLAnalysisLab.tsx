import React, { useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  Play,
  RefreshCw,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSafety } from '../context/SafetyContext';
import { generateSyntheticSequence } from '../services/mlTrainingService';
import {
  MLPrediction,
  MotionSample,
  SimulatorScenario,
} from '../types/safety';

const SCENARIOS: { id: SimulatorScenario; label: string }[] = [
  { id: 'stationary', label: 'Stationary State' },
  { id: 'normal_walking', label: 'Normal Walking' },
  { id: 'running', label: 'Running' },
  { id: 'sudden_movement', label: 'Sudden Movement' },
  { id: 'sudden_stop', label: 'Sudden Stop' },
  { id: 'fall_like', label: 'Fall-Like Movement Pattern' },
  { id: 'irregular_movement', label: 'Irregular Movement' },
];

export const MLAnalysisLab: React.FC = () => {
  const {
    mlMetrics,
    mlTrained,
    mlError,
    retrainModel,
    evaluateFeatures,
    requestSosConfirmation,
  } = useSafety();

  const [treeCount, setTreeCount] = useState(25);
  const [maxDepth, setMaxDepth] = useState(7);
  const [selectedScenario, setSelectedScenario] =
    useState<SimulatorScenario>('normal_walking');
  const [simSamples, setSimSamples] = useState<MotionSample[]>([]);
  const [simMeta, setSimMeta] = useState<{
    label: string;
    description: string;
  } | null>(null);
  const [simPrediction, setSimPrediction] = useState<MLPrediction | null>(null);

  const handleRunSimulation = (scenario: SimulatorScenario) => {
    setSelectedScenario(scenario);
    const seq = generateSyntheticSequence(scenario);
    setSimSamples(seq.samples);
    setSimMeta({ label: seq.label, description: seq.description });
    const pred = evaluateFeatures(seq.samples, true);
    setSimPrediction(pred);
  };

  const simChartData = simSamples.map((s, idx) => ({
    step: `T+${idx * 150}ms`,
    ax: s.ax,
    ay: s.ay,
    az: s.az,
    magnitude: s.magnitude,
  }));

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[#1E1B2E]">
          ML Analysis Lab & Movement Sensor Simulator
        </h2>
        <p className="text-sm text-[#4B4560]">
          Genuine TypeScript Random Forest classifier (CART Gini impurity, bootstrap sampling, random feature subsets, majority voting) trained on clearly-labeled synthetic demonstration data.
        </p>
      </div>

      {mlError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          <span>{mlError}</span>
        </div>
      )}

      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 leading-relaxed">
        <span className="font-semibold">Synthetic Demonstration Dataset Notice:</span>{' '}
        Training ({mlMetrics?.trainSize ?? 320} samples) and separate validation ({mlMetrics?.validationSize ?? 140} samples) datasets are synthetically generated in-browser for academic engineering demonstration. This model is NOT trained on real-world assault data and never claims to confirm an attack.
      </div>

      {/* Model Training & Validation Metrics */}
      <section className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-purple-600" aria-hidden="true" />
            <div>
              <h3 className="font-display text-lg font-semibold text-[#1E1B2E]">
                Random Forest Model Evaluation
              </h3>
              <p className="text-xs text-[#5B5570]">
                Status: {mlTrained ? 'Trained & Ready' : 'Not Trained'}
                {mlMetrics
                  ? ` · Trained in ${mlMetrics.trainingTimeMs}ms · ${mlMetrics.treeCount} decision trees (max depth ${mlMetrics.maxDepth})`
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-[#342E49] flex items-center gap-2">
              <span>Trees:</span>
              <select
                value={treeCount}
                onChange={(e) => setTreeCount(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-[#1E1B2E] text-xs"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={45}>45</option>
              </select>
            </label>
            <label className="text-xs text-[#342E49] flex items-center gap-2">
              <span>Depth:</span>
              <select
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF8FC] border border-[#DCD4EA] text-[#1E1B2E] text-xs"
              >
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={10}>10</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => retrainModel(treeCount, maxDepth)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Train / Retrain Model</span>
            </button>
          </div>
        </div>

        {mlMetrics && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono tabular-nums">
              <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-xs text-[#5B5570] font-sans">Validation Accuracy</div>
                <div className="mt-1 text-2xl font-bold text-[#1E1B2E]">
                  {mlMetrics.accuracy}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-xs text-[#5B5570] font-sans">Precision (Unusual)</div>
                <div className="mt-1 text-2xl font-bold text-purple-700">
                  {mlMetrics.precision}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-xs text-[#5B5570] font-sans">Recall (Unusual)</div>
                <div className="mt-1 text-2xl font-bold text-rose-600">
                  {mlMetrics.recall}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-xs text-[#5B5570] font-sans">F1-Score</div>
                <div className="mt-1 text-2xl font-bold text-teal-700">
                  {mlMetrics.f1Score}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] space-y-3">
                <h4 className="font-display text-sm font-semibold text-[#1E1B2E]">
                  Validation Confusion Matrix (n = {mlMetrics.validationSize})
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono tabular-nums">
                  <div />
                  <div className="py-1.5 text-[#5B5570] font-sans">Pred Normal</div>
                  <div className="py-1.5 text-[#5B5570] font-sans">Pred Unusual</div>

                  <div className="py-3 text-right pr-2 text-[#5B5570] font-sans">
                    Actual Normal
                  </div>
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold">
                    TN: {mlMetrics.confusionMatrix.tn}
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                    FP: {mlMetrics.confusionMatrix.fp}
                  </div>

                  <div className="py-3 text-right pr-2 text-[#5B5570] font-sans">
                    Actual Unusual
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                    FN: {mlMetrics.confusionMatrix.fn}
                  </div>
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold">
                    TP: {mlMetrics.confusionMatrix.tp}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] space-y-3">
                <h4 className="font-display text-sm font-semibold text-[#1E1B2E]">
                  Gini Feature Importance (%)
                </h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mlMetrics.featureImportances.slice(0, 6)}
                      layout="vertical"
                      margin={{ left: 10, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5DEF0" />
                      <XAxis type="number" stroke="#6D6684" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="key"
                        stroke="#4B4560"
                        tick={{ fontSize: 11 }}
                        width={110}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DDD6EB',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#1E1B2E',
                        }}
                      />
                      <Bar dataKey="importance" name="Importance %" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Interactive Movement Sensor Simulator */}
      <section className="rounded-xl bg-white border border-[#EAE4F2] p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1E1B2E]">
              Interactive Movement Sensor Simulator
            </h3>
            <p className="text-xs text-[#5B5570]">
              Generates synthetic 3-axis acceleration sequences and runs them through the trained Random Forest classifier. Clearly separated from live hardware sensors.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-purple-700">
            SIMULATED MOVEMENT DATA
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleRunSimulation(sc.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedScenario === sc.id && simSamples.length > 0
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-[#FAF8FC] border-[#DCD4EA] text-[#342E49] hover:bg-purple-50'
              }`}
            >
              <Play className="w-3 h-3" aria-hidden="true" />
              <span>{sc.label}</span>
            </button>
          ))}
        </div>

        {simPrediction && simMeta ? (
          <div className="space-y-5 pt-2">
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                simPrediction.label === 'UNUSUAL MOVEMENT PATTERN'
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-teal-50 border-teal-200'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#4B4560]">
                  SIMULATED MOVEMENT DATA · Scenario: {simMeta.label} ·{' '}
                  {new Date(simPrediction.timestamp).toLocaleTimeString()}
                </div>
                <div
                  className={`font-display text-lg font-bold ${
                    simPrediction.label === 'UNUSUAL MOVEMENT PATTERN'
                      ? 'text-amber-800'
                      : 'text-teal-800'
                  }`}
                >
                  {simPrediction.label}
                </div>
                {simPrediction.label === 'UNUSUAL MOVEMENT PATTERN' && (
                  <p className="text-xs text-amber-900">
                    Unusual movement detected – Please check your safety. (Simulated test result)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6 font-mono text-xs tabular-nums">
                <div>
                  <div className="text-[#5B5570]">Model Confidence</div>
                  <div className="text-base font-bold text-[#1E1B2E]">
                    {simPrediction.confidence}%
                  </div>
                </div>
                <div>
                  <div className="text-[#5B5570]">Ensemble Vote</div>
                  <div className="text-base font-bold text-[#1E1B2E]">
                    {simPrediction.unusualVotes}U / {simPrediction.normalVotes}N
                  </div>
                </div>
                {simPrediction.label === 'UNUSUAL MOVEMENT PATTERN' && (
                  <button
                    type="button"
                    onClick={() =>
                      requestSosConfirmation({
                        source: 'MOVEMENT_ML',
                        title: 'Simulated Unusual Movement Prompt',
                        description:
                          'Test SOS confirmation flow triggered from simulated unusual movement.',
                      })
                    }
                    className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
                  >
                    Test SOS Prompt
                  </button>
                )}
              </div>
            </div>

            <div className="h-60 w-full rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DEF0" />
                  <XAxis dataKey="step" stroke="#6D6684" tick={{ fontSize: 10 }} />
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
                  <Line type="monotone" dataKey="magnitude" name="Magnitude" stroke="#0D9488" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ax" name="Acc X" stroke="#7C3AED" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="ay" name="Acc Y" stroke="#E11D48" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs tabular-nums">
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-[#5B5570] font-sans">Peak Magnitude</div>
                <div className="mt-1 font-semibold text-[#1E1B2E]">
                  {simPrediction.features.magnitude} m/s²
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-[#5B5570] font-sans">Max Delta Accel</div>
                <div className="mt-1 font-semibold text-[#1E1B2E]">
                  {simPrediction.features.deltaAcceleration} m/s²
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-[#5B5570] font-sans">Motion Variance</div>
                <div className="mt-1 font-semibold text-[#1E1B2E]">
                  {simPrediction.features.motionVariance}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-[#5B5570] font-sans">Peak Count</div>
                <div className="mt-1 font-semibold text-[#1E1B2E]">
                  {simPrediction.features.peakCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2]">
                <div className="text-[#5B5570] font-sans">Short-Term Intensity</div>
                <div className="mt-1 font-semibold text-[#1E1B2E]">
                  {simPrediction.features.shortTermIntensity}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-lg bg-[#FAF8FC] border border-[#EAE4F2] text-xs text-[#5B5570]">
            Select any movement scenario above to generate synthetic 3-axis acceleration telemetry and inspect the Random Forest classification output.
          </div>
        )}
      </section>
    </div>
  );
};
