import {
  MLPrediction,
  MLValidationMetrics,
  MotionFeatures,
  MotionSample,
  SimulatorScenario,
} from '../types/safety';
import {
  evaluateBinaryPredictions,
  RandomForestClassifier,
} from './randomForest';

export const FEATURE_NAMES: { key: keyof MotionFeatures; label: string }[] = [
  { key: 'ax', label: 'Acceleration X (m/s²)' },
  { key: 'ay', label: 'Acceleration Y (m/s²)' },
  { key: 'az', label: 'Acceleration Z (m/s²)' },
  { key: 'magnitude', label: 'Acceleration Magnitude (m/s²)' },
  { key: 'deltaAcceleration', label: 'Delta Acceleration (m/s²)' },
  { key: 'motionVariance', label: 'Motion Variance' },
  { key: 'peakCount', label: 'Motion Peak Count' },
  { key: 'shortTermIntensity', label: 'Short-Term Intensity' },
  { key: 'unusualDurationSec', label: 'Elevated Duration (s)' },
];

export function featuresToVector(f: MotionFeatures): number[] {
  return [
    f.ax,
    f.ay,
    f.az,
    f.magnitude,
    f.deltaAcceleration,
    f.motionVariance,
    f.peakCount,
    f.shortTermIntensity,
    f.unusualDurationSec,
  ];
}

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number, mean: number, std: number): number {
  const u1 = Math.max(1e-7, rand());
  const u2 = rand();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

/**
 * Generates clearly-labeled SYNTHETIC DEMONSTRATION DATA for training and validation.
 * Class 0 = NORMAL MOVEMENT PATTERN (stationary, normal walking, steady jogging)
 * Class 1 = UNUSUAL MOVEMENT PATTERN (sudden jolt, fall-like spike + stop, erratic shaking)
 * Note: This does NOT represent real assault or emergency data.
 */
function buildSyntheticDataset(
  count: number,
  seed: number
): { X: number[][]; y: number[] } {
  const rand = seededRand(seed);
  const X: number[][] = [];
  const y: number[] = [];

  for (let i = 0; i < count; i++) {
    const isUnusual = i % 2 === 1;
    let f: MotionFeatures;

    if (!isUnusual) {
      const subType = rand();
      if (subType < 0.35) {
        // Stationary / resting
        const ax = gaussian(rand, 0.1, 0.35);
        const ay = gaussian(rand, 0.2, 0.35);
        const az = gaussian(rand, 9.78, 0.25);
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);
        f = {
          ax,
          ay,
          az,
          magnitude: mag,
          deltaAcceleration: Math.abs(gaussian(rand, 0.25, 0.2)),
          motionVariance: Math.max(0.01, gaussian(rand, 0.15, 0.12)),
          peakCount: Math.max(0, Math.round(gaussian(rand, 0.2, 0.4))),
          shortTermIntensity: Math.max(0.1, gaussian(rand, 0.4, 0.25)),
          unusualDurationSec: 0,
        };
      } else if (subType < 0.78) {
        // Normal walking
        const ax = gaussian(rand, 1.4, 1.1);
        const ay = gaussian(rand, 2.1, 1.2);
        const az = gaussian(rand, 9.9, 1.4);
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);
        f = {
          ax,
          ay,
          az,
          magnitude: mag,
          deltaAcceleration: Math.abs(gaussian(rand, 2.1, 0.9)),
          motionVariance: Math.max(0.2, gaussian(rand, 2.6, 1.1)),
          peakCount: Math.max(0, Math.round(gaussian(rand, 2.2, 1.1))),
          shortTermIntensity: Math.max(0.5, gaussian(rand, 2.9, 0.9)),
          unusualDurationSec: Math.max(0, gaussian(rand, 0.2, 0.25)),
        };
      } else {
        // Steady brisk walking / vigorous running (natural boundary overlap)
        const ax = gaussian(rand, 3.2, 2.2);
        const ay = gaussian(rand, 4.4, 2.3);
        const az = gaussian(rand, 11.6, 2.8);
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);
        f = {
          ax,
          ay,
          az,
          magnitude: mag,
          deltaAcceleration: Math.abs(gaussian(rand, 5.1, 2.3)),
          motionVariance: Math.max(1.0, gaussian(rand, 8.2, 4.0)),
          peakCount: Math.max(1, Math.round(gaussian(rand, 4.6, 1.8))),
          shortTermIntensity: Math.max(1.5, gaussian(rand, 5.9, 2.1)),
          unusualDurationSec: Math.max(0, gaussian(rand, 0.7, 0.6)),
        };
      }
      X.push(featuresToVector(f));
      y.push(0);
    } else {
      const subType = rand();
      if (subType < 0.35) {
        // Sudden violent jolt / sharp acceleration change
        const ax = gaussian(rand, 8.8, 3.2);
        const ay = gaussian(rand, -7.4, 3.1);
        const az = gaussian(rand, 15.8, 3.8);
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);
        f = {
          ax,
          ay,
          az,
          magnitude: mag,
          deltaAcceleration: Math.abs(gaussian(rand, 13.5, 3.4)),
          motionVariance: Math.max(4.0, gaussian(rand, 24.0, 6.5)),
          peakCount: Math.max(2, Math.round(gaussian(rand, 7.5, 2.0))),
          shortTermIntensity: Math.max(4.0, gaussian(rand, 12.2, 2.8)),
          unusualDurationSec: Math.max(0.6, gaussian(rand, 2.2, 0.8)),
        };
      } else if (subType < 0.7) {
        // Fall-like spike followed by abrupt stillness
        const ax = gaussian(rand, -10.2, 3.6);
        const ay = gaussian(rand, 9.5, 3.4);
        const az = gaussian(rand, 17.5, 4.2);
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);
        f = {
          ax,
          ay,
          az,
          magnitude: mag,
          deltaAcceleration: Math.abs(gaussian(rand, 16.2, 4.0)),
          motionVariance: Math.max(5.0, gaussian(rand, 32.0, 8.0)),
          peakCount: Math.max(1, Math.round(gaussian(rand, 4.5, 1.5))),
          shortTermIntensity: Math.max(5.0, gaussian(rand, 14.5, 3.5)),
          unusualDurationSec: Math.max(0.8, gaussian(rand, 2.8, 0.9)),
        };
      } else {
        // Irregular erratic shaking / sudden stop-start bursts
        const ax = gaussian(rand, 6.8, 3.5);
        const ay = gaussian(rand, 7.2, 3.5);
        const az = gaussian(rand, 13.9, 3.2);
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);
        f = {
          ax,
          ay,
          az,
          magnitude: mag,
          deltaAcceleration: Math.abs(gaussian(rand, 10.8, 2.9)),
          motionVariance: Math.max(4.5, gaussian(rand, 21.5, 5.5)),
          peakCount: Math.max(3, Math.round(gaussian(rand, 9.2, 2.2))),
          shortTermIntensity: Math.max(4.2, gaussian(rand, 10.6, 2.4)),
          unusualDurationSec: Math.max(1.0, gaussian(rand, 3.4, 1.0)),
        };
      }
      X.push(featuresToVector(f));
      y.push(1);
    }
  }

  return { X, y };
}

export function extractFeaturesFromWindow(
  samples: MotionSample[]
): MotionFeatures {
  if (samples.length === 0) {
    return {
      ax: 0,
      ay: 0,
      az: 9.81,
      magnitude: 9.81,
      deltaAcceleration: 0,
      motionVariance: 0,
      peakCount: 0,
      shortTermIntensity: 0,
      unusualDurationSec: 0,
    };
  }

  const latest = samples[samples.length - 1];
  const n = samples.length;
  const mags = samples.map((s) => s.magnitude);
  const deltas = samples.map((s) => s.deltaMagnitude);

  const meanMag = mags.reduce((a, b) => a + b, 0) / n;
  const variance =
    mags.reduce((acc, m) => acc + (m - meanMag) * (m - meanMag), 0) / n;

  // Dynamic intensity above gravity baseline (~9.81 m/s²)
  const dynamicMagnitudes = mags.map((m) => Math.abs(m - 9.81));
  const shortTermIntensity =
    dynamicMagnitudes.reduce((a, b) => a + b, 0) / n;

  const maxDelta = Math.max(...deltas, 0);
  const peakThreshold = 5.5;
  let peakCount = 0;
  let elevatedSamples = 0;

  for (let i = 0; i < samples.length; i++) {
    if (
      samples[i].deltaMagnitude > peakThreshold ||
      Math.abs(samples[i].magnitude - 9.81) > 7.5
    ) {
      peakCount++;
      elevatedSamples++;
    }
  }

  const spanSec =
    n > 1
      ? Math.max(0.1, (samples[n - 1].timestamp - samples[0].timestamp) / 1000)
      : 0.2;
  const unusualDurationSec = Number(
    ((elevatedSamples / n) * spanSec).toFixed(2)
  );

  return {
    ax: Number(latest.ax.toFixed(2)),
    ay: Number(latest.ay.toFixed(2)),
    az: Number(latest.az.toFixed(2)),
    magnitude: Number(Math.max(...mags).toFixed(2)),
    deltaAcceleration: Number(maxDelta.toFixed(2)),
    motionVariance: Number(variance.toFixed(2)),
    peakCount,
    shortTermIntensity: Number(shortTermIntensity.toFixed(2)),
    unusualDurationSec,
  };
}

export function generateSyntheticSequence(
  scenario: SimulatorScenario
): { samples: MotionSample[]; label: string; description: string } {
  const count = 24;
  const baseTime = Date.now() - count * 150;
  const samples: MotionSample[] = [];
  let prevMag = 9.81;

  const scenarioMeta: Record<
    SimulatorScenario,
    { label: string; description: string }
  > = {
    stationary: {
      label: 'Stationary State',
      description: 'Device resting steadily on desk or in pocket (~9.81 m/s² gravity).',
    },
    normal_walking: {
      label: 'Normal Walking',
      description: 'Rhythmic moderate stride cadence with low variance.',
    },
    running: {
      label: 'Running',
      description: 'Higher rhythmic stride amplitude, consistent cadence.',
    },
    sudden_movement: {
      label: 'Sudden Movement',
      description: 'Abrupt multi-axis acceleration surge simulating a sharp jolt.',
    },
    sudden_stop: {
      label: 'Sudden Stop',
      description: 'Rapid motion abruptly decelerating to near-zero movement.',
    },
    fall_like: {
      label: 'Fall-Like Movement Pattern',
      description: 'Brief low-g dip, sharp impact spike, followed by stillness.',
    },
    irregular_movement: {
      label: 'Irregular Movement',
      description: 'Erratic, non-periodic high-variance spikes across all three axes.',
    },
  };

  for (let i = 0; i < count; i++) {
    const t = i / count;
    let ax = 0;
    let ay = 0;
    let az = 9.81;

    switch (scenario) {
      case 'stationary':
        ax = (Math.sin(i * 0.7) * 0.12);
        ay = (Math.cos(i * 0.5) * 0.1);
        az = 9.81 + Math.sin(i) * 0.08;
        break;
      case 'normal_walking':
        ax = Math.sin(i * 0.8) * 1.6;
        ay = Math.cos(i * 0.8) * 1.9;
        az = 9.81 + Math.sin(i * 1.6) * 2.1;
        break;
      case 'running':
        ax = Math.sin(i * 1.4) * 3.1;
        ay = Math.cos(i * 1.4) * 3.8;
        az = 9.81 + Math.sin(i * 2.8) * 4.2;
        break;
      case 'sudden_movement':
        if (i >= 8 && i <= 15) {
          ax = (i % 2 === 0 ? 1 : -1) * (9.5 + (i % 3) * 1.8);
          ay = (i % 2 === 0 ? -1 : 1) * (8.4 + (i % 2) * 2.1);
          az = 16.5 + (i % 3) * 2.5;
        } else {
          ax = Math.sin(i) * 0.9;
          ay = Math.cos(i) * 0.8;
          az = 9.81;
        }
        break;
      case 'sudden_stop':
        if (i < 10) {
          ax = Math.sin(i * 1.3) * 5.2;
          ay = Math.cos(i * 1.3) * 5.6;
          az = 12.8 + Math.sin(i * 2.2) * 3.2;
        } else if (i === 10 || i === 11) {
          // Sharp deceleration spike
          ax = -11.4;
          ay = 10.2;
          az = 19.6;
        } else {
          ax = 0.05;
          ay = 0.04;
          az = 9.81;
        }
        break;
      case 'fall_like':
        if (i < 7) {
          ax = Math.sin(i) * 1.2;
          ay = Math.cos(i) * 1.1;
          az = 9.81;
        } else if (i >= 7 && i <= 9) {
          // Free-fall dip
          ax = 0.4;
          ay = -0.3;
          az = 3.1;
        } else if (i >= 10 && i <= 12) {
          // Impact spike
          ax = -12.8;
          ay = 11.9;
          az = 22.4;
        } else {
          // Post-impact stillness
          ax = 0.08;
          ay = -0.05;
          az = 9.81;
        }
        break;
      case 'irregular_movement':
        ax = Math.sin(i * 3.7) * 8.9 + Math.cos(i * 5.1) * 3.2;
        ay = Math.cos(i * 4.3) * 8.4 - Math.sin(i * 2.9) * 3.7;
        az = 12.4 + Math.sin(i * 6.1) * 7.8;
        break;
    }

    // Add tiny deterministic micro-jitter so no division by zero occurs
    ax += Math.sin(t * 19.3) * 0.15;
    ay += Math.cos(t * 23.7) * 0.15;

    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const deltaMagnitude = Math.abs(magnitude - prevMag);
    prevMag = magnitude;

    samples.push({
      timestamp: baseTime + i * 150,
      ax: Number(ax.toFixed(2)),
      ay: Number(ay.toFixed(2)),
      az: Number(az.toFixed(2)),
      magnitude: Number(magnitude.toFixed(2)),
      deltaMagnitude: Number(deltaMagnitude.toFixed(2)),
      isSimulated: true,
      patternLabel: scenarioMeta[scenario].label,
    });
  }

  return {
    samples,
    label: scenarioMeta[scenario].label,
    description: scenarioMeta[scenario].description,
  };
}

class MLTrainingService {
  private model: RandomForestClassifier | null = null;
  private metrics: MLValidationMetrics | null = null;

  trainModel(
    nEstimators = 25,
    maxDepth = 7
  ): { model: RandomForestClassifier; metrics: MLValidationMetrics } {
    const start = performance.now();

    // Separate training and validation synthetic demonstration datasets
    const trainData = buildSyntheticDataset(320, 424242);
    const valData = buildSyntheticDataset(140, 989898);

    const rf = new RandomForestClassifier({
      nEstimators,
      maxDepth,
      minSamplesSplit: 4,
      maxFeatures: 3,
      seed: 20261112 + nEstimators,
    });

    rf.fit(trainData.X, trainData.y);

    const valPredictions = rf
      .predictBatch(valData.X)
      .map((res) => res.predictedClass);
    const evalMetrics = evaluateBinaryPredictions(valData.y, valPredictions);
    const elapsedMs = Math.max(1, Math.round(performance.now() - start));

    const featureImportances = FEATURE_NAMES.map((f, idx) => ({
      feature: f.label,
      key: f.key,
      importance: Number(((rf.featureImportances[idx] ?? 0) * 100).toFixed(1)),
    })).sort((a, b) => b.importance - a.importance);

    this.model = rf;
    this.metrics = {
      accuracy: Number((evalMetrics.accuracy * 100).toFixed(1)),
      precision: Number((evalMetrics.precision * 100).toFixed(1)),
      recall: Number((evalMetrics.recall * 100).toFixed(1)),
      f1Score: Number((evalMetrics.f1Score * 100).toFixed(1)),
      confusionMatrix: evalMetrics.confusionMatrix,
      trainSize: trainData.X.length,
      validationSize: valData.X.length,
      treeCount: nEstimators,
      maxDepth,
      featureImportances,
      trainedAt: Date.now(),
      trainingTimeMs: elapsedMs,
    };

    return { model: rf, metrics: this.metrics };
  }

  ensureTrained(): MLValidationMetrics {
    if (!this.model || !this.metrics) {
      return this.trainModel().metrics;
    }
    return this.metrics;
  }

  getMetrics(): MLValidationMetrics | null {
    return this.metrics;
  }

  isModelTrained(): boolean {
    return Boolean(this.model?.isTrained);
  }

  predictFromFeatures(
    features: MotionFeatures,
    isSimulated: boolean
  ): MLPrediction {
    if (!this.model || !this.model.isTrained) {
      throw new Error('ML model is not trained yet. Train the Random Forest model first.');
    }

    const output = this.model.predictOne(featuresToVector(features));
    return {
      label:
        output.predictedClass === 1
          ? 'UNUSUAL MOVEMENT PATTERN'
          : 'NORMAL MOVEMENT PATTERN',
      confidence: Number((output.confidence * 100).toFixed(1)),
      normalVotes: output.votes[0],
      unusualVotes: output.votes[1],
      totalTrees: output.totalTrees,
      features,
      timestamp: Date.now(),
      isSimulated,
    };
  }
}

export const mlTrainingService = new MLTrainingService();
