import assert from 'node:assert/strict';
import test from 'node:test';
import { runAnnotationExperiment } from './runner.js';

const fixture = [{
  schemaVersion: '1.0',
  caseId: 'runner-001',
  split: 'test',
  source: {
    dataset: 'runner-fixture',
    license: 'test-only',
    meetingId: 'meeting-001',
    transcript: 'Maya will send the contract by Friday.',
  },
  tasks: [{
    task: 'Send the contract',
    owner: 'Maya',
    deadline: 'Friday',
    evidence: 'Maya will send the contract by Friday',
    ownerStatus: 'explicit',
    deadlineStatus: 'explicit',
  }],
  uncertaintyLabels: [],
  risk: { level: 'LOW', confirmationRequired: false, categories: [] },
  annotation: { annotatorIds: ['test'], adjudicated: true },
}];

test('runs an analyzer over validated records and returns macro scores', async () => {
  const result = await runAnnotationExperiment(
    fixture,
    'test-workflow',
    'fixture-v1',
    async (_transcript, testCase) => ({
      summary: '',
      intent: '',
      tasks: testCase.goldTasks.map((task, index) => ({
        id: `task-${index}`,
        task: task.task,
        owner: task.owner,
        deadline: task.deadline,
        priority: 'Medium',
        dependencies: [],
        confidence: 90,
        evidence: task.evidence,
      })),
      action_items: [],
      uncertainties: [],
      assumptions: [],
      unsupported_requests: [],
      risk_level: testCase.expectedRisk,
      confirmation_required: testCase.expectedConfirmation,
      proposed_actions: [],
    }),
  );

  assert.equal(result.workflow, 'test-workflow');
  assert.equal(result.datasetVersion, 'fixture-v1');
  assert.equal(result.result.scoredCaseCount, 1);
  assert.equal(result.result.macroTaskExtractionAccuracy, 100);
});

test('fails before analysis when annotations are invalid', async () => {
  await assert.rejects(
    runAnnotationExperiment(
      [{ ...fixture[0], caseId: 'invalid', tasks: [{ ...fixture[0].tasks[0], evidence: 'not present' }] }],
      'test-workflow',
      'fixture-v1',
      async () => {
        throw new Error('analyzer should not run');
      },
    ),
    /Annotation dataset validation failed/,
  );
});
