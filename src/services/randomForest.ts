/**
 * Genuine Random Forest Classifier implemented from scratch in TypeScript.
 * Uses CART Gini Impurity splitting, bootstrap aggregating (bagging),
 * random feature subset selection at each split, and majority voting.
 */

export interface TreeNode {
  isLeaf: boolean;
  predictedClass: number;
  classProbabilities: [number, number]; // [probClass0, probClass1]
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  samples: number;
  impurity: number;
}

export interface RandomForestConfig {
  nEstimators: number;
  maxDepth: number;
  minSamplesSplit: number;
  maxFeatures?: number;
  seed?: number;
}

export interface ClassificationOutput {
  predictedClass: 0 | 1;
  confidence: number;
  votes: [number, number];
  totalTrees: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
}

// Mulberry32 deterministic PRNG for reproducible bootstrap & feature sampling
function createPRNG(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function giniImpurity(labels: number[]): number {
  const n = labels.length;
  if (n === 0) return 0;
  let ones = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] === 1) ones++;
  }
  const p1 = ones / n;
  const p0 = 1 - p1;
  return 1 - (p0 * p0 + p1 * p1);
}

function countClasses(labels: number[]): [number, number] {
  let c0 = 0;
  let c1 = 0;
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === 1) c1++;
    else c0++;
  }
  return [c0, c1];
}

function sampleFeaturesSubset(
  totalFeatures: number,
  maxFeatures: number,
  rand: () => number
): number[] {
  const indices = Array.from({ length: totalFeatures }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  return indices.slice(0, maxFeatures);
}

class DecisionTreeClassifier {
  public root: TreeNode | null = null;
  public featureImportances: number[] = [];

  constructor(
    private readonly maxDepth: number,
    private readonly minSamplesSplit: number,
    private readonly maxFeatures: number,
    private readonly rand: () => number
  ) {}

  fit(X: number[][], y: number[]): void {
    const nFeatures = X[0]?.length ?? 0;
    this.featureImportances = new Array(nFeatures).fill(0);
    const totalSamples = X.length;
    this.root = this.buildTree(X, y, 0, totalSamples);

    const sumImp = this.featureImportances.reduce((acc, v) => acc + v, 0);
    if (sumImp > 0) {
      this.featureImportances = this.featureImportances.map((v) => v / sumImp);
    }
  }

  private buildTree(
    X: number[][],
    y: number[],
    depth: number,
    totalSamples: number
  ): TreeNode {
    const nSamples = y.length;
    const [c0, c1] = countClasses(y);
    const impurity = giniImpurity(y);
    const predictedClass = c1 >= c0 ? 1 : 0;
    const probs: [number, number] =
      nSamples > 0 ? [c0 / nSamples, c1 / nSamples] : [0.5, 0.5];

    if (
      depth >= this.maxDepth ||
      nSamples < this.minSamplesSplit ||
      c0 === 0 ||
      c1 === 0
    ) {
      return {
        isLeaf: true,
        predictedClass,
        classProbabilities: probs,
        samples: nSamples,
        impurity,
      };
    }

    const nFeatures = X[0].length;
    const featureSubset = sampleFeaturesSubset(
      nFeatures,
      Math.min(this.maxFeatures, nFeatures),
      this.rand
    );

    let bestGain = 0;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    for (const featureIdx of featureSubset) {
      // Collect sorted unique candidate midpoints
      const pairs = X.map((row, idx) => ({ val: row[featureIdx], idx })).sort(
        (a, b) => a.val - b.val
      );

      // Evaluate thresholds efficiently via running class counts
      let leftC0 = 0;
      let leftC1 = 0;
      const totalC0 = c0;
      const totalC1 = c1;

      for (let i = 0; i < pairs.length - 1; i++) {
        const label = y[pairs[i].idx];
        if (label === 1) leftC1++;
        else leftC0++;

        const currentVal = pairs[i].val;
        const nextVal = pairs[i + 1].val;
        if (currentVal === nextVal) continue;

        const leftCount = i + 1;
        const rightCount = nSamples - leftCount;
        const rightC0 = totalC0 - leftC0;
        const rightC1 = totalC1 - leftC1;

        const leftGini =
          1 -
          ((leftC0 / leftCount) * (leftC0 / leftCount) +
            (leftC1 / leftCount) * (leftC1 / leftCount));
        const rightGini =
          1 -
          ((rightC0 / rightCount) * (rightC0 / rightCount) +
            (rightC1 / rightCount) * (rightC1 / rightCount));

        const weightedImpurity =
          (leftCount / nSamples) * leftGini +
          (rightCount / nSamples) * rightGini;
        const gain = impurity - weightedImpurity;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = featureIdx;
          bestThreshold = (currentVal + nextVal) / 2;
        }
      }
    }

    if (bestFeature === -1 || bestGain <= 1e-7) {
      return {
        isLeaf: true,
        predictedClass,
        classProbabilities: probs,
        samples: nSamples,
        impurity,
      };
    }

    bestLeftIndices = [];
    bestRightIndices = [];
    for (let i = 0; i < nSamples; i++) {
      if (X[i][bestFeature] <= bestThreshold) {
        bestLeftIndices.push(i);
      } else {
        bestRightIndices.push(i);
      }
    }

    if (bestLeftIndices.length === 0 || bestRightIndices.length === 0) {
      return {
        isLeaf: true,
        predictedClass,
        classProbabilities: probs,
        samples: nSamples,
        impurity,
      };
    }

    // Accumulate weighted impurity decrease for feature importance
    this.featureImportances[bestFeature] +=
      (nSamples / totalSamples) * bestGain;

    const leftX = bestLeftIndices.map((idx) => X[idx]);
    const leftY = bestLeftIndices.map((idx) => y[idx]);
    const rightX = bestRightIndices.map((idx) => X[idx]);
    const rightY = bestRightIndices.map((idx) => y[idx]);

    return {
      isLeaf: false,
      predictedClass,
      classProbabilities: probs,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      samples: nSamples,
      impurity,
      left: this.buildTree(leftX, leftY, depth + 1, totalSamples),
      right: this.buildTree(rightX, rightY, depth + 1, totalSamples),
    };
  }

  predictOne(x: number[]): 0 | 1 {
    let node = this.root;
    while (node && !node.isLeaf) {
      if (
        node.featureIndex !== undefined &&
        node.threshold !== undefined &&
        x[node.featureIndex] <= node.threshold
      ) {
        node = node.left ?? null;
      } else {
        node = node.right ?? null;
      }
    }
    return (node?.predictedClass ?? 0) as 0 | 1;
  }
}

export class RandomForestClassifier {
  public trees: DecisionTreeClassifier[] = [];
  public featureImportances: number[] = [];
  public isTrained = false;
  private readonly config: Required<RandomForestConfig>;

  constructor(config?: Partial<RandomForestConfig>) {
    this.config = {
      nEstimators: config?.nEstimators ?? 25,
      maxDepth: config?.maxDepth ?? 7,
      minSamplesSplit: config?.minSamplesSplit ?? 4,
      maxFeatures: config?.maxFeatures ?? 3,
      seed: config?.seed ?? 20261112,
    };
  }

  fit(X: number[][], y: number[]): void {
    if (X.length === 0 || X.length !== y.length) {
      throw new Error('Invalid training dataset dimensions for Random Forest.');
    }

    const nSamples = X.length;
    const nFeatures = X[0].length;
    const maxFeatures = Math.max(
      1,
      Math.min(nFeatures, this.config.maxFeatures || Math.round(Math.sqrt(nFeatures)))
    );

    const rand = createPRNG(this.config.seed);
    this.trees = [];
    const accumulatedImportance = new Array(nFeatures).fill(0);

    for (let t = 0; t < this.config.nEstimators; t++) {
      // Bootstrap sampling with replacement
      const bootX: number[][] = new Array(nSamples);
      const bootY: number[] = new Array(nSamples);
      for (let i = 0; i < nSamples; i++) {
        const idx = Math.floor(rand() * nSamples);
        bootX[i] = X[idx];
        bootY[i] = y[idx];
      }

      const tree = new DecisionTreeClassifier(
        this.config.maxDepth,
        this.config.minSamplesSplit,
        maxFeatures,
        rand
      );
      tree.fit(bootX, bootY);
      this.trees.push(tree);

      for (let f = 0; f < nFeatures; f++) {
        accumulatedImportance[f] += tree.featureImportances[f] ?? 0;
      }
    }

    const totalTrees = this.trees.length || 1;
    this.featureImportances = accumulatedImportance.map((v) => v / totalTrees);
    this.isTrained = true;
  }

  predictOne(x: number[]): ClassificationOutput {
    if (!this.isTrained || this.trees.length === 0) {
      throw new Error('Random Forest model has not been trained yet.');
    }

    let votes0 = 0;
    let votes1 = 0;
    for (const tree of this.trees) {
      const pred = tree.predictOne(x);
      if (pred === 1) votes1++;
      else votes0++;
    }

    const totalTrees = this.trees.length;
    const predictedClass: 0 | 1 = votes1 >= votes0 ? 1 : 0;
    const winningVotes = predictedClass === 1 ? votes1 : votes0;

    return {
      predictedClass,
      confidence: winningVotes / totalTrees,
      votes: [votes0, votes1],
      totalTrees,
    };
  }

  predictBatch(X: number[][]): ClassificationOutput[] {
    return X.map((row) => this.predictOne(row));
  }
}

export function evaluateBinaryPredictions(
  yTrue: number[],
  yPred: number[]
): EvaluationMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < yTrue.length; i++) {
    const actual = yTrue[i];
    const pred = yPred[i];
    if (actual === 1 && pred === 1) tp++;
    else if (actual === 0 && pred === 1) fp++;
    else if (actual === 0 && pred === 0) tn++;
    else if (actual === 1 && pred === 0) fn++;
  }

  const total = tp + fp + tn + fn || 1;
  const accuracy = (tp + tn) / total;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: { tp, fp, tn, fn },
  };
}
