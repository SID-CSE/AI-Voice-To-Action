import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type PerCaseScore = {
  taskExtractionAccuracy: number;
  ownerAssignmentAccuracy: number;
  deadlineExtraction: number;
  evidenceFaithfulness: number;
  riskClassificationAccuracy: number;
  confirmationAccuracy: number;
  confidenceCalibration: number;
  taskPrecision: number;
  taskRecall: number;
};

type ExperimentFile = {
  workflow: string;
  model?: string;
  result: {
    caseCount: number;
    scoredCaseCount: number;
    perCase: Record<string, PerCaseScore>;
  };
  apiResponses?: number;
  fallbackResponses?: number;
};

const root = path.resolve(process.cwd());
const dataDirectory = path.join(root, 'research_data');
const outputPath = path.join(dataDirectory, 'ami_pilot_statistical_analysis.json');
const iterations = 5_000;
const seed = 0x9e3779b9;

const metricKeys = [
  'taskExtractionAccuracy',
  'ownerAssignmentAccuracy',
  'deadlineExtraction',
  'evidenceFaithfulness',
  'riskClassificationAccuracy',
  'confirmationAccuracy',
] as const;

function createRandom(seedValue: number): () => number {
  let state = seedValue >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function percentile(values: number[], probability: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function bootstrapInterval(values: number[], random: () => number) {
  const estimates: number[] = [];
  for (let iteration = 0; iteration < iterations; iteration++) {
    let sum = 0;
    for (let sample = 0; sample < values.length; sample++) {
      sum += values[Math.floor(random() * values.length)];
    }
    estimates.push(sum / values.length);
  }
  return {
    estimate: values.reduce((sum, value) => sum + value, 0) / values.length,
    lower95: percentile(estimates, 0.025),
    upper95: percentile(estimates, 0.975),
  };
}

async function loadExperiments(): Promise<ExperimentFile[]> {
  const files = (await readdir(dataDirectory))
    .filter(file => file.endsWith('_500_results.json'));

  return Promise.all(files.map(async file => {
    const content = await readFile(path.join(dataDirectory, file), 'utf8');
    return JSON.parse(content) as ExperimentFile;
  }));
}

const random = createRandom(seed);
const experiments = await loadExperiments();
const analyses = experiments.map(experiment => {
  const cases = Object.entries(experiment.result.perCase);
  const metrics = Object.fromEntries(metricKeys.map(metric => [
    metric,
    bootstrapInterval(cases.map(([, score]) => score[metric]), random),
  ]));
  const taskPrecision = bootstrapInterval(cases.map(([, score]) => score.taskPrecision), random);
  const taskRecall = bootstrapInterval(cases.map(([, score]) => score.taskRecall), random);
  const taskF1 = bootstrapInterval(cases.map(([, score]) => score.taskExtractionAccuracy), random);
  const hardestCases = cases
    .filter(([, score]) => score.taskExtractionAccuracy < 100)
    .sort(([, left], [, right]) => left.taskExtractionAccuracy - right.taskExtractionAccuracy)
    .slice(0, 10)
    .map(([id, score]) => ({
      id,
      taskExtractionAccuracy: score.taskExtractionAccuracy,
      taskPrecision: score.taskPrecision,
      taskRecall: score.taskRecall,
      ownerAssignmentAccuracy: score.ownerAssignmentAccuracy,
      deadlineExtraction: score.deadlineExtraction,
      confirmationAccuracy: score.confirmationAccuracy,
    }));

  return {
    workflow: experiment.workflow,
    model: experiment.model ?? experiment.workflow,
    caseCount: experiment.result.caseCount,
    scoredCaseCount: experiment.result.scoredCaseCount,
    apiResponses: experiment.apiResponses ?? null,
    fallbackResponses: experiment.fallbackResponses ?? null,
    confidenceLevel: 0.95,
    bootstrapIterations: iterations,
    metrics,
    taskPrecision,
    taskRecall,
    taskF1,
    hardestTaskCases: hardestCases,
  };
});

await writeFile(outputPath, `${JSON.stringify({
  datasetVersion: 'ami-pilot-v2-500',
  method: 'Deterministic percentile bootstrap over per-case macro scores',
  seed,
  analyses,
}, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output: outputPath,
  experiments: analyses.map(analysis => ({
    model: analysis.model,
    cases: analysis.scoredCaseCount,
    taskExtraction: analysis.metrics.taskExtractionAccuracy,
    hardestCases: analysis.hardestTaskCases.length,
  })),
}, null, 2));
