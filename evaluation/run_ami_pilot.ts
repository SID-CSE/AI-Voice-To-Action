import { readFile, writeFile } from 'node:fs/promises';
import type { AIAnalysisOutput } from '../src/types.js';
import { runAnnotationExperiment } from './runner.js';

const datasetPath = new URL('../research_data/actionflow_annotated_pilot_500.json', import.meta.url);
const outputPath = new URL('../research_data/ami_pilot_heuristic_500_results.json', import.meta.url);
const dataset = JSON.parse(await readFile(datasetPath, 'utf8')) as unknown;
function analyzeOffline(transcript: string): AIAnalysisOutput {
  const riskLevel = /\b(delete|deletion|password|secret|credential|transfer|wire|pay|permission)\b/i.test(transcript)
    ? 'HIGH'
    : /\b(email|send to the client|call|external)\b/i.test(transcript)
      ? 'MEDIUM'
      : 'LOW';
  const confirmationRequired = riskLevel !== 'LOW';
  const fragments = transcript
    .split(/\.\s+|\s+and\s+/i)
    .map(fragment => fragment.trim())
    .filter(fragment => /\b(need to|have to|should|must|will|going to|gonna|i'll|we can|we need|we should|take|send|check|make|write|review|add|remove|update|change|design|finish|prepare|look|ask|call|test|implement|create|build|fix|bring|show|give|provide)\b/i.test(fragment));
  const tasks = fragments.map((fragment, index) => ({
    id: `offline-${index + 1}`,
    task: fragment.replace(/^(so|uh|yeah|okay)[,.\s]*/i, '').trim(),
    owner: 'Not specified',
    deadline: 'Not specified',
    priority: 'Medium',
    dependencies: [],
    confidence: 50,
    evidence: fragment,
    status: 'Pending' as const,
  }));
  return {
    summary: 'Deterministic offline heuristic output.',
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
    confirmation_required: confirmationRequired,
    proposed_actions: [],
    workflow_type: 'baseline',
  };
}

const run = await runAnnotationExperiment(
  dataset,
  'heuristic-local',
  'ami-pilot-v2-500',
  async (transcript) => analyzeOffline(transcript),
);

await writeFile(outputPath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath.pathname}`);
console.log(JSON.stringify({
  workflow: run.workflow,
  datasetVersion: run.datasetVersion,
  caseCount: run.result.caseCount,
  scoredCaseCount: run.result.scoredCaseCount,
  macroTaskExtractionAccuracy: run.result.macroTaskExtractionAccuracy,
  macroTaskRecall: Object.values(run.result.perCase).reduce((sum, score) => sum + score.taskRecall, 0) / run.result.scoredCaseCount,
}, null, 2));

