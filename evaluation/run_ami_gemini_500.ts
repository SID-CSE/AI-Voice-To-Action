import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { GeminiService } from '../server/gemini.js';
import { runAnnotationExperiment } from './runner.js';

const dataset = JSON.parse(
  await readFile(new URL('../research_data/actionflow_annotated_pilot_500.json', import.meta.url), 'utf8'),
) as unknown;
const model = 'gemini-3.5-flash-lite';
const outputPath = new URL('../research_data/ami_pilot_gemini_35_flash_lite_500_results.json', import.meta.url);
const service = new GeminiService();
let apiResponses = 0;
let fallbackResponses = 0;

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim().length === 0) {
  throw new Error('GEMINI_API_KEY is not configured.');
}

const run = await runAnnotationExperiment(
  dataset,
  'gemini-baseline',
  'ami-pilot-v2-500',
  async transcript => {
    const result = await service.analyzeTranscript(transcript, {
      workflowType: 'baseline',
      enableGrounding: false,
      preferredModel: model,
      failFast: true,
    });
    const extractionDetail = result.stages.find(stage => stage.id === 's5')?.detail ?? '';
    if (extractionDetail.includes('fallback') || extractionDetail.includes('rule engine')) {
      fallbackResponses++;
      throw new Error(`Gemini evaluation stopped after fallback on model ${model}.`);
    } else {
      apiResponses++;
    }
    return result.output;
  },
);

await writeFile(outputPath, `${JSON.stringify({
  ...run,
  model,
  apiResponses,
  fallbackResponses,
}, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output: outputPath.pathname,
  cases: run.result.caseCount,
  taskF1: run.result.macroTaskF1,
  taskPrecision: run.result.macroTaskPrecision,
  taskRecall: run.result.macroTaskRecall,
  owner: run.result.macroOwnerAssignmentAccuracy,
  deadline: run.result.macroDeadlineExtraction,
  evidence: run.result.macroEvidenceFaithfulness,
  risk: run.result.macroRiskClassificationAccuracy,
  confirmation: run.result.macroConfirmationAccuracy,
  apiResponses,
  fallbackResponses,
}, null, 2));
