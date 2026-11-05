import type { EvaluationAnnotationRecord, EvalTestCase } from '../src/types.js';
import { validateAnnotationRecord } from './annotation.js';

export interface DatasetLoadResult {
  records: EvaluationAnnotationRecord[];
  errors: string[];
}

export function annotationToTestCase(record: EvaluationAnnotationRecord): EvalTestCase {
  return {
    id: record.caseId,
    name: record.caseId,
    category: record.risk.categories[0] || 'annotated',
    transcript: record.source.transcript,
    benchmarkVersion: `schema-${record.schemaVersion}`,
    expectedTasksCount: record.tasks.length,
    expectedRisk: record.risk.level,
    expectedConfirmation: record.risk.confirmationRequired,
    expectedUncertaintyCount: record.uncertaintyLabels.length,
    goldTasks: record.tasks.map(task => ({
      task: task.task,
      owner: task.owner,
      deadline: task.deadline,
      evidence: task.evidence,
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCandidateAnnotation(value: unknown): value is EvaluationAnnotationRecord {
  if (!isRecord(value)) return false;
  return typeof value.schemaVersion === 'string'
    && typeof value.caseId === 'string'
    && (value.split === 'train' || value.split === 'validation' || value.split === 'test')
    && isRecord(value.source)
    && typeof value.source.transcript === 'string'
    && Array.isArray(value.tasks)
    && Array.isArray(value.uncertaintyLabels)
    && isRecord(value.risk)
    && isRecord(value.annotation);
}

export function loadAnnotationDataset(input: unknown): DatasetLoadResult {
  if (!Array.isArray(input)) {
    return { records: [], errors: ['Dataset must be a JSON array.'] };
  }

  const records: EvaluationAnnotationRecord[] = [];
  const errors: string[] = [];
  const seenCaseIds = new Set<string>();

  input.forEach((value, index) => {
    const prefix = `records[${index}]`;
    if (!isCandidateAnnotation(value)) {
      errors.push(`${prefix} has an invalid annotation record shape.`);
      return;
    }
    if (seenCaseIds.has(value.caseId)) {
      errors.push(`${prefix} duplicates caseId "${value.caseId}".`);
      return;
    }
    seenCaseIds.add(value.caseId);

    const validation = validateAnnotationRecord(value);
    if (!validation.valid) {
      errors.push(...validation.errors.map(error => `${prefix}: ${error}`));
      return;
    }
    records.push(value);
  });

  return { records, errors };
}
