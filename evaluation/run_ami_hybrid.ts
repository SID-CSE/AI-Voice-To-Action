import { readFile, writeFile } from 'node:fs/promises';
import type { AIAnalysisOutput } from '../src/types.js';
import { extractActionCandidates, validateTaskEvidence } from '../server/action-extraction.js';
import { runAnnotationExperiment } from './runner.js';

const dataset = JSON.parse(
  await readFile(new URL('../research_data/actionflow_annotated_pilot_500.json', import.meta.url), 'utf8'),
) as unknown;

function analyzeOffline(transcript: string): AIAnalysisOutput {
  const candidates = extractActionCandidates(transcript);
  const tasks = validateTaskEvidence(candidates.map((evidence, index) => ({
    id: `hybrid-${index + 1}`,
    task: evidence.replace(/^(so|uh|yeah|okay)[,.\s]*/i, '').trim(),
    owner: 'Not specified',
    deadline: 'Not specified',
    priority: 'Medium',
    dependencies: [],
    confidence: 55,
    evidence,
    status: 'Pending' as const,
  })), transcript);
  const riskLevel = /\b(delete|deletion|password|secret|credential|transfer|wire|pay|permission)\b/i.test(transcript)
    ? 'HIGH'
    : /\b(email|send to the client|call|external)\b/i.test(transcript)
      ? 'MEDIUM'
      : 'LOW';

  return {
    summary: 'Offline hybrid candidate and evidence validation output.',
    intent: tasks.length > 0 ? 'Task Planning' : 'General Discussion',
    tasks,
    action_items: tasks.map(task => ({
      action: task.task,
      owner: task.owner,
      deadline: task.deadline,
      confidence: task.confidence,
      evidence: task.evidence,
    })),
    uncertainties: [],
    assumptions: [],
    unsupported_requests: [],
    risk_level: riskLevel,
    confirmation_required: riskLevel !== 'LOW',
    proposed_actions: [],
    workflow_type: 'baseline',
  };
}

const run = await runAnnotationExperiment(
  dataset,
  'hybrid-offline',
  'ami-pilot-v2-500',
  async transcript => analyzeOffline(transcript),
);
const outputPath = new URL('../research_data/ami_pilot_hybrid_500_results.json', import.meta.url);
await writeFile(outputPath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');

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
}, null, 2));
