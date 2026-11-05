import type { AIAnalysisOutput } from '../src/types.js';
import { annotationToTestCase, loadAnnotationDataset } from './dataset.js';
import { scoreEvaluationSet, type EvaluationSetScore } from '../server/evaluation.js';

export interface ExperimentRun {
  workflow: string;
  datasetVersion: string;
  result: EvaluationSetScore;
}

export type AnnotationAnalyzer = (
  transcript: string,
  record: ReturnType<typeof annotationToTestCase>,
) => Promise<AIAnalysisOutput>;

export async function runAnnotationExperiment(
  input: unknown,
  workflow: string,
  datasetVersion: string,
  analyze: AnnotationAnalyzer,
): Promise<ExperimentRun> {
  const loaded = loadAnnotationDataset(input);
  if (loaded.errors.length > 0) {
    throw new Error(`Annotation dataset validation failed:\n${loaded.errors.join('\n')}`);
  }

  const cases = loaded.records.map(annotationToTestCase);
  const outputs = new Map<string, AIAnalysisOutput>();
  for (const testCase of cases) {
    outputs.set(testCase.id, await analyze(testCase.transcript, testCase));
  }

  return {
    workflow,
    datasetVersion,
    result: scoreEvaluationSet(cases, outputs),
  };
}
