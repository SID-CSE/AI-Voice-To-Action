import type { EvaluationAnnotationRecord, TextSpan } from '../src/types.js';

export interface AnnotationValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSpan(
  span: TextSpan | undefined,
  transcript: string,
  label: string,
  errors: string[],
): void {
  if (!span) return;
  if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.end <= span.start) {
    errors.push(`${label} must use a non-empty, zero-based span.`);
    return;
  }
  if (span.end > transcript.length) {
    errors.push(`${label} exceeds transcript length.`);
    return;
  }
  if (transcript.slice(span.start, span.end) !== span.text) {
    errors.push(`${label} text does not match the transcript offsets.`);
  }
}

export function validateAnnotationRecord(record: EvaluationAnnotationRecord): AnnotationValidationResult {
  const errors: string[] = [];
  const transcript = record.source.transcript;

  if (record.schemaVersion !== '1.0') errors.push('schemaVersion must be 1.0.');
  if (!record.caseId.trim()) errors.push('caseId is required.');
  if (!transcript.trim()) errors.push('source.transcript is required.');
  if (record.annotation.annotatorIds.length === 0) errors.push('At least one annotator is required.');

  for (const [index, task] of record.tasks.entries()) {
    const prefix = `tasks[${index}]`;
    if (!task.task.trim()) errors.push(`${prefix}.task is required.`);
    if (!task.owner.trim()) errors.push(`${prefix}.owner is required.`);
    if (!task.deadline.trim()) errors.push(`${prefix}.deadline is required.`);
    if (!task.evidence.trim()) errors.push(`${prefix}.evidence is required.`);
    if (!transcript.toLowerCase().includes(task.evidence.toLowerCase())) {
      errors.push(`${prefix}.evidence must occur in the transcript.`);
    }
    validateSpan(task.taskSpan, transcript, `${prefix}.taskSpan`, errors);
    validateSpan(task.ownerSpan, transcript, `${prefix}.ownerSpan`, errors);
    validateSpan(task.deadlineSpan, transcript, `${prefix}.deadlineSpan`, errors);
    validateSpan(task.evidenceSpan, transcript, `${prefix}.evidenceSpan`, errors);
    if (task.evidenceSpan && task.evidenceSpan.text !== task.evidence) {
      errors.push(`${prefix}.evidenceSpan must equal evidence.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
