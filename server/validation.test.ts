import assert from 'node:assert/strict';
import test from 'node:test';
import { guestUploadContentType, isSafePublicBlobUrl, parseAuditLogFilters, parseTaskCreate, parseTaskUpdates } from './validation.js';

test('task creation accepts only bounded, typed fields and ignores ownership input', () => {
  assert.deepEqual(parseTaskCreate({ task: ' Review release ', userId: 'user-b', id: 'foreign-id' }), {
    task: 'Review release',
    owner: 'Not specified',
    deadline: 'Not specified',
    priority: 'Medium',
  });
  assert.equal(parseTaskCreate({ task: 'x'.repeat(501) }), null);
  assert.equal(parseTaskCreate({ task: 'Review release', priority: 'Critical' }), null);
  assert.equal(parseTaskCreate({ task: {}, owner: ['attacker'] }), null);
});

test('task updates allow editable fields but discard ownership and server-managed fields', () => {
  assert.deepEqual(parseTaskUpdates({ status: 'Completed', id: 'foreign-id', userId: 'user-b', confidence: 0, evidence: 'forged' }), {
    status: 'Completed',
  });
  assert.equal(parseTaskUpdates({ status: 'deleted' }), null);
  assert.equal(parseTaskUpdates({ task: ' ' }), null);
  assert.equal(parseTaskUpdates({}), null);
});

test('audit filters reject arrays, unsupported values, and oversized searches', () => {
  assert.deepEqual(parseAuditLogFilters({ riskLevel: 'HIGH', search: 'invoice' }), { riskLevel: 'HIGH', search: 'invoice' });
  assert.equal(parseAuditLogFilters({ search: ['one', 'two'] }), null);
  assert.equal(parseAuditLogFilters({ confirmationStatus: 'EXECUTED' }), null);
  assert.equal(parseAuditLogFilters({ search: 'x'.repeat(501) }), null);
});

test('guest upload paths allow only supported files under the guest prefix', () => {
  assert.equal(guestUploadContentType('guest-uploads/notes.txt'), 'text/plain');
  assert.equal(guestUploadContentType('guest-uploads/notes.md'), 'text/markdown');
  assert.equal(guestUploadContentType('guest-uploads/table.csv'), 'text/csv');
  assert.equal(guestUploadContentType('guest-uploads/notes.pdf'), null);
  assert.equal(guestUploadContentType('other/notes.txt'), null);
  assert.equal(guestUploadContentType('guest-uploads/../notes.txt'), null);
});

test('public Blob URLs require HTTPS and the Vercel public Blob host', () => {
  assert.equal(isSafePublicBlobUrl('https://store.public.blob.vercel-storage.com/guest-uploads/a.txt'), true);
  assert.equal(isSafePublicBlobUrl('http://store.public.blob.vercel-storage.com/a.txt'), false);
  assert.equal(isSafePublicBlobUrl('https://store.public.blob.vercel-storage.com.evil.example/a.txt'), false);
  assert.equal(isSafePublicBlobUrl('https://user@store.public.blob.vercel-storage.com/a.txt'), false);
  assert.equal(isSafePublicBlobUrl('https://127.0.0.1/a.txt'), false);
});
