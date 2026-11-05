import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { GoogleGenAI } from '@google/genai';
import type { AIAnalysisOutput } from '../src/types.js';
import {
  BASELINE_SYSTEM_INSTRUCTION,
  BUILD_BASELINE_PROMPT,
  BUILD_REACT_PROMPT,
  REACT_SYSTEM_INSTRUCTION,
} from '../server/prompts.js';
import { annotationToTestCase, loadAnnotationDataset } from './dataset.js';
import { scoreEvaluationSet } from '../server/evaluation.js';
import { validateTaskEvidence } from '../server/action-extraction.js';
import { extractActionCandidates } from '../server/action-extraction.js';
import { guardrails } from '../server/guardrails.js';

const model = process.env.GEMINI_BATCH_MODEL?.trim() || 'gemini-3.1-flash-lite';
const workflow = process.env.GEMINI_BATCH_WORKFLOW?.trim() === 'react' ? 'react' : 'baseline';
const ablation = process.env.GEMINI_BATCH_ABLATION?.trim() || 'full';
const postprocess = process.env.GEMINI_BATCH_POSTPROCESS?.trim() === 'guardrails';
const evidenceOverlapThreshold = Number.parseFloat(process.env.GEMINI_EVIDENCE_OVERLAP || '0.8');
const taskOverlapThreshold = Number.parseFloat(process.env.GEMINI_TASK_OVERLAP || '0.35');
const batchSize = Number.parseInt(process.env.GEMINI_BATCH_SIZE || '5', 10);
const pacingMs = Number.parseInt(process.env.GEMINI_BATCH_PACING_MS || '5000', 10);
const maxAttempts = Number.parseInt(process.env.GEMINI_BATCH_MAX_ATTEMPTS || '3', 10);
const maxRequestsPerMinute = 12;
const requestWindowMs = 60_000;
const datasetPath = new URL('../research_data/actionflow_annotated_pilot_500.json', import.meta.url);
const checkpointPath = new URL(
  process.env.GEMINI_BATCH_CHECKPOINT || '../research_data/ami_pilot_gemini_batch_checkpoint.json',
  import.meta.url,
);
const outputPath = new URL(
  process.env.GEMINI_BATCH_OUTPUT || '../research_data/ami_pilot_gemini_batch_500_results.json',
  import.meta.url,
);
const errorPath = new URL(
  process.env.GEMINI_BATCH_ERROR || '../research_data/ami_pilot_gemini_batch_last_error.json',
  import.meta.url,
);

type Checkpoint = {
  model: string;
  batchSize: number;
  outputs: Record<string, AIAnalysisOutput>;
};

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

function normalizeOutput(value: unknown, caseId: string, transcript?: string): AIAnalysisOutput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid model output for ${caseId}: expected an object.`);
  }
  const output = value as Partial<AIAnalysisOutput>;
  if (!Array.isArray(output.tasks) || typeof output.summary !== 'string') {
    throw new Error(`Invalid model output for ${caseId}: missing summary or tasks.`);
  }
  const normalized: AIAnalysisOutput = {
    summary: output.summary,
    intent: typeof output.intent === 'string' ? output.intent : 'General Discussion',
    tasks: output.tasks
      .filter(task => task && typeof task.task === 'string' && task.task.trim().length > 0)
      .map((task, index) => ({
      id: typeof task.id === 'string' ? task.id : `${caseId}-task-${index + 1}`,
      task: task.task,
      owner: typeof task.owner === 'string' && task.owner.trim() ? task.owner : 'Not specified',
      deadline: typeof task.deadline === 'string' && task.deadline.trim() ? task.deadline : 'Not specified',
      priority: typeof task.priority === 'string' && task.priority.trim() ? task.priority : 'Medium',
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      confidence: Number.isFinite(Number(task.confidence)) ? Number(task.confidence) : 0,
      evidence: typeof task.evidence === 'string' ? task.evidence : '',
      status: typeof task.status === 'string' ? task.status : 'Pending',
    })),
    action_items: Array.isArray(output.action_items) ? output.action_items : [],
    uncertainties: Array.isArray(output.uncertainties) ? output.uncertainties : [],
    assumptions: Array.isArray(output.assumptions) ? output.assumptions : [],
    unsupported_requests: Array.isArray(output.unsupported_requests) ? output.unsupported_requests : [],
    risk_level: output.risk_level === 'HIGH' || output.risk_level === 'MEDIUM' ? output.risk_level : 'LOW',
    confirmation_required: output.confirmation_required === true,
    proposed_actions: Array.isArray(output.proposed_actions) ? output.proposed_actions : [],
    workflow_type: workflow,
    analysis_provider: 'gemini',
    model_used: model,
  };
  if (!postprocess || !transcript) return normalized;
  normalized.tasks = validateTaskEvidence(normalized.tasks, transcript, {
    evidenceOverlapThreshold,
    taskOverlapThreshold,
  });
  normalized.action_items = normalized.tasks.map(task => ({
    action: task.task,
    owner: task.owner,
    deadline: task.deadline,
    confidence: task.confidence,
    evidence: task.evidence,
  }));
  const risk = guardrails.evaluateRisk(transcript);
  if (risk.riskLevel === 'HIGH' || normalized.risk_level !== 'HIGH') normalized.risk_level = risk.riskLevel;
  normalized.confirmation_required = normalized.confirmation_required || risk.confirmationRequired;
  normalized.proposed_actions = [...normalized.proposed_actions, ...risk.detectedProposedActions];
  return normalized;
}

function buildPrompt(cases: ReturnType<typeof annotationToTestCase>[]): string {
  const records = cases.map(testCase => ({
    case_id: testCase.id,
    transcript: testCase.transcript,
    action_candidate_sentences: extractActionCandidates(testCase.transcript),
  }));
  const recordsPrompt = `Analyze each independent meeting transcript. Do not mix information between records.
Return ONLY a JSON array with exactly one object per input record, in the same order.
Each object must contain: case_id, summary, intent, tasks, action_items, uncertainties, assumptions,
unsupported_requests, risk_level, confirmation_required, proposed_actions.
${ablation === 'no-evidence' ? 'Do not include evidence fields or leave evidence empty for every task.' : 'For every task, evidence must be an exact quote from that record transcript.'}
${ablation === 'no-uncertainty' ? 'Do not report uncertainties; return an empty uncertainties array.' : 'Report ambiguities and missing details in uncertainties.'}
${ablation === 'no-safety' ? 'Do not apply special risk or confirmation rules beyond literal transcript labels.' : 'Do not invent owners, deadlines, dates, or actions. Use "Not specified" for missing owner or deadline and flag consequential actions for confirmation.'}

INPUT RECORDS:
${JSON.stringify(records)}`;
  if (workflow === 'react') {
    return `${recordsPrompt}\n\nUse a ReAct-style analysis process, but return only the final JSON array.`;
  }
  return recordsPrompt;
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length === 0) {
  throw new Error('GEMINI_API_KEY is not configured.');
}

const rawDataset = JSON.parse(await readFile(datasetPath, 'utf8')) as unknown;
const loaded = loadAnnotationDataset(rawDataset);
if (loaded.errors.length > 0) {
  throw new Error(`Annotation dataset validation failed:\n${loaded.errors.join('\n')}`);
}
const cases = loaded.records.map(annotationToTestCase);
let checkpoint: Checkpoint = { model, batchSize, outputs: {} };
try {
  checkpoint = JSON.parse(await readFile(checkpointPath, 'utf8')) as Checkpoint;
  if (checkpoint.model !== model || checkpoint.batchSize !== batchSize) {
    checkpoint = { model, batchSize, outputs: {} };
  }
} catch {
  // Start a new checkpoint when none exists.
}
checkpoint.outputs = Object.fromEntries(
  Object.entries(checkpoint.outputs).map(([caseId, output]) => {
    const transcript = cases.find(testCase => testCase.id === caseId)?.transcript;
    return [caseId, normalizeOutput(output, caseId, transcript)];
  }),
);

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { timeout: 60_000, retryOptions: { attempts: 1 } },
});
const remaining = cases.filter(testCase => !checkpoint.outputs[testCase.id]);
console.log(`Model=${model}; total=${cases.length}; completed=${cases.length - remaining.length}; remaining=${remaining.length}`);
let lastRequestAt = 0;
const requestTimestamps: number[] = [];
let abortRequested = false;

process.once('SIGINT', () => {
  abortRequested = true;
  console.error('\nAbort requested. The current request will finish, then the checkpoint will be preserved.');
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function retryDelay(error: unknown, attempt: number): number {
  const message = errorMessage(error);
  const retrySeconds = message.match(/retryDelay[^0-9]*(\d+)/i)?.[1];
  if (retrySeconds) return Math.max(pacingMs, Number(retrySeconds) * 1000);
  if (message.includes('429')) return Math.max(pacingMs, 60_000);
  return Math.max(pacingMs, 10_000 * attempt);
}

async function requestBatch(batch: ReturnType<typeof annotationToTestCase>[]): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    while (true) {
      const now = Date.now();
      while (requestTimestamps.length > 0 && now - requestTimestamps[0] >= requestWindowMs) {
        requestTimestamps.shift();
      }
      const intervalWait = Math.max(0, pacingMs - (now - lastRequestAt));
      const windowWait = requestTimestamps.length >= maxRequestsPerMinute
        ? requestWindowMs - (now - requestTimestamps[0]) + 100
        : 0;
      const wait = Math.max(intervalWait, windowWait);
      if (wait <= 0) break;
      console.log(`Rate limit guard: waiting ${Math.ceil(wait / 1000)}s (${requestTimestamps.length}/${maxRequestsPerMinute} requests in the last minute).`);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();
    requestTimestamps.push(lastRequestAt);
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildPrompt(batch),
        config: {
          systemInstruction: workflow === 'react' ? REACT_SYSTEM_INSTRUCTION : BASELINE_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      return parseJson(response.text || '');
    } catch (error) {
      lastError = error;
      const delay = retryDelay(error, attempt);
      console.error(`Request failed (attempt ${attempt}/${maxAttempts}): ${errorMessage(error)}`);
      if (attempt < maxAttempts) {
        console.error(`Waiting ${Math.ceil(delay / 1000)}s before retrying the same batch.`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(errorMessage(lastError));
}

for (let offset = 0; offset < remaining.length && !abortRequested; offset += batchSize) {
  const batch = remaining.slice(offset, offset + batchSize);
  try {
    const parsed = await requestBatch(batch);
    if (!Array.isArray(parsed) || parsed.length !== batch.length) {
      throw new Error(`Batch returned ${Array.isArray(parsed) ? parsed.length : 'non-array'} outputs for ${batch.length} inputs.`);
    }
    parsed.forEach((value, index) => {
      const item = value as { case_id?: unknown };
      const caseId = item.case_id === batch[index].id ? batch[index].id : '';
      if (!caseId) throw new Error(`Batch output ${index + 1} has mismatched case_id.`);
      const { case_id: _caseId, ...analysis } = item as Record<string, unknown>;
      checkpoint.outputs[caseId] = normalizeOutput(analysis, caseId, batch[index].transcript);
    });
    await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`, 'utf8');
    console.log(`Completed ${Object.keys(checkpoint.outputs).length}/${cases.length}`);
  } catch (error) {
    const failure = {
      model,
      batchSize,
      completed: Object.keys(checkpoint.outputs).length,
      remaining: cases.length - Object.keys(checkpoint.outputs).length,
      failedCaseIds: batch.map(testCase => testCase.id),
      error: errorMessage(error),
      timestamp: new Date().toISOString(),
      resumeCommand: 'Use the same model, checkpoint, batch size, and pacing values.',
    };
    await writeFile(errorPath, `${JSON.stringify(failure, null, 2)}\n`, 'utf8');
    console.error(JSON.stringify(failure, null, 2));
    process.exitCode = 1;
    break;
  }
  if (process.exitCode === 1) break;
}

const outputs = new Map(Object.entries(checkpoint.outputs));
const result = scoreEvaluationSet(cases, outputs);
if (outputs.size === cases.length) await writeFile(outputPath, `${JSON.stringify({
  workflow: `gemini-${workflow}-${ablation}-${postprocess ? 'guardrails' : 'raw'}-batched`,
  ablation,
  datasetVersion: 'ami-pilot-v2-500',
  model,
  batchSize,
  pacingMs,
  maxRequestsPerMinute,
  apiResponses: Math.ceil(cases.length / batchSize),
  fallbackResponses: 0,
  result,
}, null, 2)}\n`, 'utf8');
else console.log(`Evaluation incomplete; final results will be written after ${cases.length - outputs.size} records are completed.`);
if (abortRequested) {
  console.log(`Aborted safely. Checkpoint contains ${outputs.size}/${cases.length} records.`);
  process.exitCode = 0;
}
console.log(JSON.stringify({
  output: outputPath.pathname,
  cases: result.caseCount,
  taskF1: result.macroTaskF1,
  taskPrecision: result.macroTaskPrecision,
  taskRecall: result.macroTaskRecall,
}, null, 2));
