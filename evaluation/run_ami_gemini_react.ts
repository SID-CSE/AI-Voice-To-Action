import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { GeminiService } from '../server/gemini.js';
import { runAnnotationExperiment } from './runner.js';

const datasetPath = new URL('../research_data/actionflow_annotated_pilot_100.json', import.meta.url);
const outputPath = new URL('../research_data/ami_pilot_gemini_react_results.json', import.meta.url);
const dataset = JSON.parse(await readFile(datasetPath, 'utf8')) as unknown;
const service = new GeminiService();
let apiResponses = 0;
let fallbackResponses = 0;

const run = await runAnnotationExperiment(
  dataset,
  'gemini-react',
  'ami-pilot-v1',
  async (transcript) => {
    const result = await service.analyzeTranscript(transcript, {
      workflowType: 'react',
      enableGrounding: false,
    });
    const detail = result.stages.find(stage => stage.id === 's5')?.detail ?? '';
    if (detail.includes('fallback') || detail.includes('rule engine')) fallbackResponses++;
    else apiResponses++;
    return result.output;
  },
);

await writeFile(outputPath, `${JSON.stringify({
  ...run,
  apiResponses,
  fallbackResponses,
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  workflow: run.workflow,
  datasetVersion: run.datasetVersion,
  caseCount: run.result.caseCount,
  scoredCaseCount: run.result.scoredCaseCount,
  macroTaskExtractionAccuracy: run.result.macroTaskExtractionAccuracy,
  macroOwnerAssignmentAccuracy: run.result.macroOwnerAssignmentAccuracy,
  macroDeadlineExtraction: run.result.macroDeadlineExtraction,
  macroEvidenceFaithfulness: run.result.macroEvidenceFaithfulness,
  macroRiskClassificationAccuracy: run.result.macroRiskClassificationAccuracy,
  macroConfirmationAccuracy: run.result.macroConfirmationAccuracy,
  apiResponses,
  fallbackResponses,
}, null, 2));
