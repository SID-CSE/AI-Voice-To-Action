import assert from 'node:assert/strict';
import test from 'node:test';
import { db } from './db.js';

test('authenticated scopes do not inherit guest demo data', async () => {
  await db.ready();

  const scope = `test-user-${Date.now()}`;
  await db.prepareScope(scope, 'Private Tester');

  db.runWithScope(scope, () => {
    assert.deepEqual(db.getTasks(), []);
    assert.deepEqual(db.getAnalyses(), []);
    assert.deepEqual(db.getAuditLogs(), []);

    const documents = db.getKnowledgeDocuments();
    assert.equal(documents.length, 1);
    assert.equal(documents[0].title, "Private Tester's demo context.txt");
    assert.equal(documents.some((document) => document.id === 'doc-team-1'), false);
  });
});