import assert from 'node:assert/strict';
import test from 'node:test';
import { BENCHMARK_TEST_CASES, scoreEvaluation, scoreEvaluationSet } from './evaluation.js';

test('scores exact gold task extraction without synthetic constants', () => {
  const expected = BENCHMARK_TEST_CASES[0];
  const score = scoreEvaluation({
    summary: '',
    intent: '',
    tasks: expected.goldTasks.map((task, index) => ({
      id: `t-${index}`,
      task: task.task,
      owner: task.owner,
      deadline: task.deadline,
      priority: 'Medium',
      dependencies: [],
      confidence: 100,
      evidence: task.evidence,
    })),
    action_items: [],
    uncertainties: ['Exact date is unspecified.'],
    assumptions: [],
    unsupported_requests: [],
    risk_level: expected.expectedRisk,
    confirmation_required: expected.expectedConfirmation,
    proposed_actions: [],
  }, expected);

  assert.equal(score.taskExtractionAccuracy, 100);
  assert.equal(score.ownerAssignmentAccuracy, 100);
  assert.equal(score.deadlineExtraction, 100);
  assert.equal(score.evidenceFaithfulness, 100);
  assert.equal(score.riskClassificationAccuracy, 100);
  assert.equal(score.confirmationAccuracy, 100);
  assert.equal(score.confidenceCalibration, 100);
});

test('penalizes missing, extra, and unsupported task fields', () => {
  const expected = BENCHMARK_TEST_CASES[0];
  const score = scoreEvaluation({
    summary: '',
    intent: '',
    tasks: [{
      id: 't-1',
      task: 'Complete the frontend dashboard',
      owner: 'Not specified',
      deadline: 'Not specified',
      priority: 'Medium',
      dependencies: [],
      confidence: 100,
      evidence: 'The model guessed this task.',
    }],
    action_items: [],
    uncertainties: [],
    assumptions: [],
    unsupported_requests: [],
    risk_level: 'LOW',
    confirmation_required: false,
    proposed_actions: [],
  }, expected);

  assert.equal(score.taskExtractionAccuracy, 67);
  assert.equal(score.taskPrecision, 100);
  assert.equal(score.taskRecall, 50);
  assert.equal(score.ownerAssignmentAccuracy, 0);
  assert.equal(score.deadlineExtraction, 0);
  assert.equal(score.evidenceFaithfulness, 0);
  assert.equal(score.confidenceCalibration, 100);
});

test('keeps the synthetic benchmark versioned and evidence-anchored', () => {
  assert.equal(BENCHMARK_TEST_CASES.length, 10);
  assert.equal(new Set(BENCHMARK_TEST_CASES.map(testCase => testCase.id)).size, 10);
  for (const testCase of BENCHMARK_TEST_CASES) {
    assert.match(testCase.benchmarkVersion, /^v\d+\.\d+-synthetic$/);
    for (const task of testCase.goldTasks) {
      assert.ok(testCase.transcript.toLowerCase().includes(task.evidence.toLowerCase()));
    }
  }
});

test('aggregates only available cases without inventing missing scores', () => {
  const expected = BENCHMARK_TEST_CASES[0];
  const output = {
    summary: '',
    intent: '',
    tasks: [],
    action_items: [],
    uncertainties: [],
    assumptions: [],
    unsupported_requests: [],
    risk_level: expected.expectedRisk,
    confirmation_required: expected.expectedConfirmation,
    proposed_actions: [],
  };
  const result = scoreEvaluationSet(
    [expected, BENCHMARK_TEST_CASES[1]],
    new Map([[expected.id, output]]),
  );

  assert.equal(result.caseCount, 2);
  assert.equal(result.scoredCaseCount, 1);
  assert.equal(result.perCase[expected.id]?.taskRecall, 0);
  assert.equal(result.macroRiskClassificationAccuracy, 100);
  assert.equal(result.macroConfidenceCalibration, 0);
});
