import { readFile, writeFile } from 'node:fs/promises';
import { validateTaskEvidence } from '../server/action-extraction.js';
import { scoreEvaluationSet } from '../server/evaluation.js';
import { annotationToTestCase, loadAnnotationDataset } from './dataset.js';
import type { AIAnalysisOutput } from '../src/types.js';

const checkpointPath = process.env.GEMINI_TUNER_CHECKPOINT
  || './research_data/ami_pilot_gemini_31_batch_checkpoint.json';
const datasetPath = './research_data/actionflow_annotated_pilot_500.json';
const outputPath = './research_data/ami_pilot_threshold_tuning.json';
const evidenceThresholds = [0.7, 0.75, 0.8, 0.85, 0.9];
const taskThresholds = [0.25, 0.3, 0.35, 0.4, 0.45];

const dataset = loadAnnotationDataset(JSON.parse(await readFile(datasetPath, 'utf8')) as unknown);
if (dataset.errors.length > 0) throw new Error(dataset.errors.join('\n'));
const cases = dataset.records.map(annotationToTestCase).filter(testCase => testCase.benchmarkVersion && testCase.id);
const validationCases = cases.filter(testCase =>
  dataset.records.find(record => record.caseId === testCase.id)?.split === 'validation');
const checkpoint = JSON.parse(await readFile(checkpointPath, 'utf8')) as {
  outputs: Record<string, AIAnalysisOutput>;
};

const results = [];
for (const evidenceOverlapThreshold of evidenceThresholds) {
  for (const taskOverlapThreshold of taskThresholds) {
    const outputs = new Map<string, AIAnalysisOutput>();
    for (const testCase of validationCases) {
      const output = checkpoint.outputs[testCase.id];
      if (!output) continue;
      outputs.set(testCase.id, {
        ...output,
        tasks: validateTaskEvidence(output.tasks.filter(task =>
          task && typeof task.task === 'string' && task.task.trim().length > 0
        ).map(task => ({
          ...task,
          owner: typeof task.owner === 'string' ? task.owner : 'Not specified',
          deadline: typeof task.deadline === 'string' ? task.deadline : 'Not specified',
          evidence: typeof task.evidence === 'string' ? task.evidence : '',
        })), testCase.transcript, {
          evidenceOverlapThreshold,
          taskOverlapThreshold,
        }),
      });
    }
    const score = scoreEvaluationSet(validationCases, outputs);
    results.push({
      evidenceOverlapThreshold,
      taskOverlapThreshold,
      scoredCases: score.scoredCaseCount,
      taskF1: score.macroTaskF1,
      precision: score.macroTaskPrecision,
      recall: score.macroTaskRecall,
    });
  }
}

results.sort((left, right) => right.taskF1 - left.taskF1 || right.precision - left.precision);
const best = results[0];
await writeFile(outputPath, `${JSON.stringify({
  datasetVersion: 'ami-pilot-v2-500',
  split: 'validation',
  method: 'Grid search over evidence and task overlap thresholds; test split untouched.',
  best,
  results,
  recommendedEnvironment: {
    GEMINI_EVIDENCE_OVERLAP: best.evidenceOverlapThreshold,
    GEMINI_TASK_OVERLAP: best.taskOverlapThreshold,
  },
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: outputPath, validationCases: validationCases.length, best }, null, 2));
