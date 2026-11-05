import assert from 'node:assert/strict';
import test from 'node:test';
import { extractActionCandidates, validateTaskEvidence } from './action-extraction.js';

test('extracts action candidates and excludes discussion-only sentences', () => {
  const candidates = extractActionCandidates(
    'We discussed the dashboard. Rahul will complete the UI by Friday. Maybe we should revisit the color.',
  );
  assert.deepEqual(candidates, ['Rahul will complete the UI by Friday.']);
});

test('keeps transcript-grounded tasks and removes unsupported evidence', () => {
  const tasks = [
    {
      id: 't1',
      task: 'Complete the UI',
      owner: 'Rahul',
      deadline: 'Friday',
      priority: 'High',
      dependencies: [],
      confidence: 90,
      evidence: 'Rahul will complete the UI by Friday',
      status: 'Pending' as const,
    },
    {
      id: 't2',
      task: 'Delete the database',
      owner: 'Not specified',
      deadline: 'Not specified',
      priority: 'High',
      dependencies: [],
      confidence: 90,
      evidence: 'The database must be deleted.',
      status: 'Pending' as const,
    },
  ];
  const validated = validateTaskEvidence(tasks, 'Rahul will complete the UI by Friday.');
  assert.equal(validated.length, 1);
  assert.equal(validated[0].evidence, 'Rahul will complete the UI by Friday.');
});

test('removes duplicate tasks with the same normalized fields', () => {
  const tasks = [
    {
      id: 't1',
      task: 'Complete the UI',
      owner: 'Rahul',
      deadline: 'Friday',
      priority: 'High',
      dependencies: [],
      confidence: 90,
      evidence: 'Rahul will complete the UI by Friday.',
      status: 'Pending' as const,
    },
    {
      id: 't2',
      task: 'complete the ui',
      owner: 'Rahul',
      deadline: 'Friday',
      priority: 'Medium',
      dependencies: [],
      confidence: 80,
      evidence: 'Rahul will complete the UI by Friday.',
      status: 'Pending' as const,
    },
  ];
  assert.equal(validateTaskEvidence(tasks, 'Rahul will complete the UI by Friday.').length, 1);
});

test('removes unsupported owner and deadline claims', () => {
  const [task] = validateTaskEvidence([
    {
      id: 't1',
      task: 'Complete the UI',
      owner: 'Ankit',
      deadline: 'Monday',
      priority: 'High',
      dependencies: [],
      confidence: 90,
      evidence: 'Rahul will complete the UI by Friday.',
      status: 'Pending' as const,
    },
  ], 'Rahul will complete the UI by Friday.');
  assert.equal(task.owner, 'Not specified');
  assert.equal(task.deadline, 'Not specified');
});
