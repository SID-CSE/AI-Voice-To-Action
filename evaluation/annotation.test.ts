import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAnnotationRecord } from './annotation.js';
import type { EvaluationAnnotationRecord } from '../src/types.js';

const validRecord: EvaluationAnnotationRecord = {
  schemaVersion: '1.0',
  caseId: 'pilot-001',
  split: 'test',
  source: {
    dataset: 'sanitized-pilot-v1',
    license: 'documented-permission',
    meetingId: 'meeting-001',
    transcript: 'Maya will send the contract by Friday.',
  },
  tasks: [{
    task: 'Send the contract',
    owner: 'Maya',
    deadline: 'Friday',
    evidence: 'Maya will send the contract by Friday',
    taskSpan: { start: 10, end: 27, text: 'send the contract' },
    ownerSpan: { start: 0, end: 4, text: 'Maya' },
    deadlineSpan: { start: 31, end: 37, text: 'Friday' },
    evidenceSpan: { start: 0, end: 37, text: 'Maya will send the contract by Friday' },
    ownerStatus: 'explicit',
    deadlineStatus: 'explicit',
  }],
  uncertaintyLabels: [],
  risk: { level: 'LOW', confirmationRequired: false, categories: [] },
  annotation: { annotatorIds: ['anon-a'], adjudicated: false },
};

test('accepts annotation records with transcript-grounded spans', () => {
  assert.deepEqual(validateAnnotationRecord(validRecord), { valid: true, errors: [] });
});

test('rejects invalid offsets and unsupported evidence', () => {
  const invalid = structuredClone(validRecord);
  invalid.tasks[0].evidence = 'Invented evidence';
  invalid.tasks[0].ownerSpan = { start: 0, end: 4, text: 'Maya ' };
  const result = validateAnnotationRecord(invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /evidence must occur/);
  assert.match(result.errors.join('\n'), /ownerSpan text does not match/);
});
