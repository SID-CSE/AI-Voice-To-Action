import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DatabaseService } from './db.js';

function temporaryStore() {
  const directory = mkdtempSync(path.join(tmpdir(), 'actionflow-db-test-'));
  return {
    file: path.join(directory, 'store.json'),
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

const task = (id: string) => ({
  id,
  task: id,
  owner: 'Test user',
  deadline: 'Tomorrow',
  priority: 'Medium',
  dependencies: [],
  confidence: 90,
  evidence: 'test data',
  status: 'Pending' as const,
});

test('production storage reports unavailable instead of falling back to disk without Neon', async () => {
  const store = temporaryStore();
  try {
    const service = new DatabaseService(null, store.file, true);
    assert.deepEqual(await service.checkHealth(), { configured: false, available: false, persistent: false });
    await assert.rejects(service.ready(), /DATABASE_URL is required in production/);
  } finally {
    store.cleanup();
  }
});

test('guest scope is shared and survives a fresh database service', async () => {
  const store = temporaryStore();
  try {
    const firstInstance = new DatabaseService(null, store.file, false);
    await firstInstance.ready();
    await firstInstance.prepareScope('guest');
    await firstInstance.runWithScope('guest', () => firstInstance.saveTasks([task('guest-task')]));

    const secondInstance = new DatabaseService(null, store.file, false);
    await secondInstance.ready();
    await secondInstance.prepareScope('guest');
    secondInstance.runWithScope('guest', () => {
      assert.equal(secondInstance.getTasks().some((item) => item.id === 'guest-task'), true);
    });
  } finally {
    store.cleanup();
  }
});

test('signed-in scopes persist independently from guest and other users', async () => {
  const store = temporaryStore();
  try {
    const firstInstance = new DatabaseService(null, store.file, false);
    await firstInstance.ready();
    await firstInstance.prepareScope('guest');
    await firstInstance.prepareScope('user-a', 'User A');
    await firstInstance.runWithScope('user-a', async () => {
      await firstInstance.saveTasks([task('user-a-task')]);
      await firstInstance.addKnowledgeDocument({ title: 'user-a-private', content: 'Private User A context.', category: 'Test', tags: [] });
    });
    await firstInstance.prepareScope('user-b', 'User B');

    firstInstance.runWithScope('user-b', () => {
      assert.deepEqual(firstInstance.getTasks(), []);
      assert.equal(firstInstance.getKnowledgeDocuments().some((document) => document.title === 'user-a-private'), false);
    });
    firstInstance.runWithScope('guest', () => {
      assert.equal(firstInstance.getTasks().some((item) => item.id === 'user-a-task'), false);
      assert.equal(firstInstance.getKnowledgeDocuments().some((document) => document.title === 'user-a-private'), false);
    });

    const restartedInstance = new DatabaseService(null, store.file, false);
    await restartedInstance.ready();
    await restartedInstance.prepareScope('user-a', 'User A');
    restartedInstance.runWithScope('user-a', () => {
      assert.equal(restartedInstance.getTasks().some((item) => item.id === 'user-a-task'), true);
      assert.equal(restartedInstance.getKnowledgeDocuments().some((document) => document.title === 'user-a-private'), true);
    });
    await restartedInstance.prepareScope('user-b', 'User B');
    restartedInstance.runWithScope('user-b', () => {
      assert.deepEqual(restartedInstance.getTasks(), []);
      assert.equal(restartedInstance.getKnowledgeDocuments().some((document) => document.title === 'user-a-private'), false);
    });
    await restartedInstance.prepareScope('guest');
    restartedInstance.runWithScope('guest', () => {
      assert.equal(restartedInstance.getTasks().some((item) => item.id === 'user-a-task'), false);
    });
    await restartedInstance.prepareScope('user-a', 'User A');
    restartedInstance.runWithScope('user-a', () => {
      assert.equal(restartedInstance.getTasks().some((item) => item.id === 'user-a-task'), true);
      assert.equal(restartedInstance.getKnowledgeDocuments().some((document) => document.title === 'user-a-private'), true);
    });
  } finally {
    store.cleanup();
  }
});

test('task storage is capped without blocking existing task updates', async () => {
  const store = temporaryStore();
  try {
    const service = new DatabaseService(null, store.file, false);
    await service.ready();
    await service.prepareScope('guest');
    await service.runWithScope('guest', async () => {
      assert.equal(await service.saveTasks(Array.from({ length: 497 }, (_, index) => task(`bulk-${index}`))), true);
      assert.equal(await service.saveTasks([task('one-too-many')]), false);
      assert.equal(await service.saveTasks([{ ...task('demo-task-frontend'), task: 'Updated demo task' }]), true);
    });
  } finally {
    store.cleanup();
  }
});

test('local rate limits allow only the configured number of requests per window', async () => {
  const store = temporaryStore();
  try {
    const service = new DatabaseService(null, store.file, false);
    await service.ready();
    assert.equal(await service.consumeRateLimit('test-key', 2, 60_000), true);
    assert.equal(await service.consumeRateLimit('test-key', 2, 60_000), true);
    assert.equal(await service.consumeRateLimit('test-key', 2, 60_000), false);
  } finally {
    store.cleanup();
  }
});

test('knowledge documents enforce per-workspace count and byte limits', async () => {
  const store = temporaryStore();
  try {
    const service = new DatabaseService(null, store.file, false);
    await service.ready();
    await service.prepareScope('guest');
    await service.runWithScope('guest', async () => {
      for (let index = 0; index < 47; index += 1) {
        const created = await service.addKnowledgeDocument({
          title: `document-${index}`,
          category: 'Test',
          content: 'x',
          tags: [],
        });
        assert.ok(created);
      }
      assert.equal(await service.addKnowledgeDocument({ title: 'overflow', category: 'Test', content: 'x', tags: [] }), null);
    });
    await service.prepareScope('user-a', 'User A');
    await service.runWithScope('user-a', async () => {
      const existingBytes = service.getKnowledgeDocuments().reduce((total, document) => total + Buffer.byteLength(document.content, 'utf8'), 0);
      assert.ok(await service.addKnowledgeDocument({ title: 'maximum', category: 'Test', content: 'x'.repeat(2 * 1024 * 1024 - existingBytes), tags: [] }));
      assert.equal(await service.addKnowledgeDocument({ title: 'over-limit', category: 'Test', content: 'x', tags: [] }), null);
    });
  } finally {
    store.cleanup();
  }
});

test('audit confirmations are bound to one pending proposed action and cannot repeat', async () => {
  const store = temporaryStore();
  try {
    const service = new DatabaseService(null, store.file, false);
    await service.ready();
    await service.prepareScope('guest');
    const record = {
      id: 'audit-test',
      timestamp: new Date().toISOString(),
      inputType: 'text' as const,
      originalInput: 'Test',
      transcript: 'Test',
      promptVersion: 'test',
      model: 'test',
      retrievedContext: [],
      riskLevel: 'HIGH' as const,
      confirmationRequired: true,
      confirmationStatus: 'AWAITING_CONFIRMATION' as const,
      aiOutput: {
        summary: 'Test', intent: 'Test', tasks: [], action_items: [], uncertainties: [], assumptions: [],
        unsupported_requests: [], risk_level: 'HIGH' as const, confirmation_required: true,
        proposed_actions: [
          { id: 'action-a', action: 'A', reason: 'Test', requires_confirmation: true, status: 'AWAITING_CONFIRMATION' as const },
          { id: 'action-b', action: 'B', reason: 'Test', requires_confirmation: true, status: 'AWAITING_CONFIRMATION' as const },
        ],
      },
    };
    await service.runWithScope('guest', () => service.saveAuditRecord(record));
    assert.equal(await service.runWithScope('guest', () => service.updateAuditConfirmation('audit-test', 'unknown-action', 'CONFIRMED')), null);
    const first = await service.runWithScope('guest', () => service.updateAuditConfirmation('audit-test', 'action-a', 'CONFIRMED'));
    assert.equal(first?.aiOutput.proposed_actions[0].status, 'CONFIRMED');
    assert.equal(first?.confirmationStatus, 'AWAITING_CONFIRMATION');
    assert.equal(await service.runWithScope('guest', () => service.updateAuditConfirmation('audit-test', 'action-a', 'CANCELLED')), null);
    const second = await service.runWithScope('guest', () => service.updateAuditConfirmation('audit-test', 'action-b', 'CANCELLED'));
    assert.equal(second?.confirmationStatus, 'CONFIRMED');
    assert.deepEqual(second?.executedActions?.map((action) => action.actionId), ['action-a', 'action-b']);
  } finally {
    store.cleanup();
  }
});

test('version-checked writes retry after a concurrent snapshot update', async () => {
  const state = new Map<string, { data: Record<string, unknown>; version: number }>();
  let barrierEnabled = false;
  let readsAtBarrier = 0;
  let releaseBarrier = () => {};
  let barrier = new Promise<void>((resolve) => { releaseBarrier = resolve; });
  const fakeSql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join(' ').replace(/\\s+/g, ' ').trim();
    if (query.startsWith('SELECT data, version FROM app_state')) {
      const scope = String(values[0]);
      const stored = state.get(scope);
      const snapshot = stored ? [{ data: structuredClone(stored.data), version: stored.version }] : [];
      if (barrierEnabled && stored) {
        readsAtBarrier += 1;
        if (readsAtBarrier === 2) {
          barrierEnabled = false;
          releaseBarrier();
        }
        await barrier;
      }
      return snapshot;
    }
    if (query.startsWith('INSERT INTO app_state')) {
      const scope = String(values[0]);
      if (!state.has(scope)) state.set(scope, { data: JSON.parse(String(values[1])), version: 0 });
      return [];
    }
    if (query.startsWith('UPDATE app_state')) {
      const scope = String(values[1]);
      const current = state.get(scope);
      if (!current || current.version !== Number(values[2])) return [];
      current.data = JSON.parse(String(values[0]));
      current.version += 1;
      return [{ version: current.version }];
    }
    return [];
  };
  const store = temporaryStore();
  try {
    const service = new DatabaseService(fakeSql as never, store.file, false);
    await service.ready();
    await service.prepareScope('guest');
    readsAtBarrier = 0;
    barrier = new Promise<void>((resolve) => { releaseBarrier = resolve; });
    barrierEnabled = true;
    await Promise.all([
      service.runWithScope('guest', () => service.saveTasks([task('parallel-a')])),
      service.runWithScope('guest', () => service.saveTasks([task('parallel-b')])),
    ]);
    const storedTasks = state.get('guest')?.data.tasks as { id: string }[];
    assert.equal(storedTasks.length, 5);
    assert.equal(storedTasks.some((item) => item.id === 'parallel-a'), true);
    assert.equal(storedTasks.some((item) => item.id === 'parallel-b'), true);
    assert.equal(state.get('guest')?.version, 2);
  } finally {
    store.cleanup();
  }
});
