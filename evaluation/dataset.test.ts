import assert from 'node:assert/strict';
import test from 'node:test';
import { annotationToTestCase, loadAnnotationDataset } from './dataset.js';
import { scoreEvaluation } from '../server/evaluation.js';

const validRecord = {
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

test('loads only valid annotation records', () => {
  const result = loadAnnotationDataset([validRecord, { ...validRecord, caseId: 'invalid', tasks: [{ ...validRecord.tasks[0], evidence: 'not in transcript' }] }]);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].caseId, 'pilot-001');
  assert.match(result.errors[0], /evidence must occur/);
});

test('rejects duplicate IDs and malformed dataset input', () => {
  const duplicate = loadAnnotationDataset([validRecord, validRecord]);
  assert.equal(duplicate.records.length, 1);
  assert.match(duplicate.errors[0], /duplicates caseId/);

  const malformed = loadAnnotationDataset({ records: [validRecord] });
  assert.deepEqual(malformed, { records: [], errors: ['Dataset must be a JSON array.'] });
});

test('adapts validated annotations to the shared gold scorer', () => {
  const result = loadAnnotationDataset([validRecord]);
  assert.equal(result.errors.length, 0);
  const testCase = annotationToTestCase(result.records[0]);
  const score = scoreEvaluation({
    summary: '',
    intent: '',
    tasks: [{
      id: 'task-1',
      task: 'Send the contract',
      owner: 'Maya',
      deadline: 'Friday',
      priority: 'Medium',
      dependencies: [],
      confidence: 90,
      evidence: 'Maya will send the contract by Friday',
    }],
    action_items: [],
    uncertainties: [],
    assumptions: [],
    unsupported_requests: [],
    risk_level: 'LOW',
    confirmation_required: false,
    proposed_actions: [],
  }, testCase);

  assert.equal(score.taskExtractionAccuracy, 100);
  assert.equal(score.evidenceFaithfulness, 100);
});
