import assert from 'node:assert/strict';
import test from 'node:test';
import { guardrails } from './guardrails.js';

test('rejects empty and very short input', () => {
  assert.equal(guardrails.validateInput(''), false);
  assert.equal(guardrails.validateInput('hi').code, 'TOO_SHORT');
});

test('flags financial instructions as high risk', () => {
  const result = guardrails.evaluateRisk('Transfer $500 to the vendor today.');
  assert.equal(result.riskLevel, 'HIGH');
  assert.equal(result.confirmationRequired, true);
  assert.equal(result.detectedProposedActions[0]?.category, 'financial');
});

test('flags external messages as medium risk', () => {
  const result = guardrails.evaluateRisk('Send the final report to the client.');
  assert.equal(result.riskLevel, 'MEDIUM');
  assert.equal(result.confirmationRequired, true);
});

test('allows routine planning', () => {
  const result = guardrails.evaluateRisk('Review the frontend backlog next Friday.');
  assert.equal(result.riskLevel, 'LOW');
  assert.equal(result.confirmationRequired, false);
});
