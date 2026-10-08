import type { StructuredTask, TaskPriority, TaskStatus } from '../src/types.js';

const priorities = new Set<TaskPriority>(['Low', 'Medium', 'High', 'Urgent']);
const statuses = new Set<TaskStatus>(['Pending', 'In Progress', 'Completed']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength: number, allowEmpty = true): value is string {
  return typeof value === 'string' && value.length <= maxLength && (allowEmpty || value.trim().length > 0);
}

export function parseTaskCreate(value: unknown): Pick<StructuredTask, 'task' | 'owner' | 'deadline' | 'priority'> | null {
  if (!isRecord(value) || !boundedString(value.task, 500, false)) return null;
  if (value.owner !== undefined && !boundedString(value.owner, 160)) return null;
  if (value.deadline !== undefined && !boundedString(value.deadline, 160)) return null;
  if (value.priority !== undefined && (typeof value.priority !== 'string' || !priorities.has(value.priority as TaskPriority))) return null;

  return {
    task: value.task.trim(),
    owner: typeof value.owner === 'string' && value.owner.trim() ? value.owner.trim() : 'Not specified',
    deadline: typeof value.deadline === 'string' && value.deadline.trim() ? value.deadline.trim() : 'Not specified',
    priority: (value.priority as TaskPriority | undefined) || 'Medium',
  };
}

export function parseTaskUpdates(value: unknown): Partial<StructuredTask> | null {
  if (!isRecord(value)) return null;
  const updates: Partial<StructuredTask> = {};

  if ('task' in value) {
    if (!boundedString(value.task, 500, false)) return null;
    updates.task = value.task.trim();
  }
  if ('owner' in value) {
    if (!boundedString(value.owner, 160)) return null;
    updates.owner = value.owner.trim();
  }
  if ('deadline' in value) {
    if (!boundedString(value.deadline, 160)) return null;
    updates.deadline = value.deadline.trim();
  }
  if ('priority' in value) {
    if (typeof value.priority !== 'string' || !priorities.has(value.priority as TaskPriority)) return null;
    updates.priority = value.priority as TaskPriority;
  }
  if ('status' in value) {
    if (typeof value.status !== 'string' || !statuses.has(value.status as TaskStatus)) return null;
    updates.status = value.status as TaskStatus;
  }
  return Object.keys(updates).length ? updates : null;
}

export function parseAuditLogFilters(value: Record<string, unknown>): { riskLevel?: string; confirmationStatus?: string; search?: string } | null {
  const riskLevels = new Set(['ALL', 'LOW', 'MEDIUM', 'HIGH']);
  const confirmationStatuses = new Set(['ALL', 'NOT_REQUIRED', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'CANCELLED']);
  if (value.riskLevel !== undefined && (typeof value.riskLevel !== 'string' || !riskLevels.has(value.riskLevel))) return null;
  if (value.confirmationStatus !== undefined && (typeof value.confirmationStatus !== 'string' || !confirmationStatuses.has(value.confirmationStatus))) return null;
  if (value.search !== undefined && (typeof value.search !== 'string' || value.search.length > 500)) return null;
  return {
    ...(typeof value.riskLevel === 'string' ? { riskLevel: value.riskLevel } : {}),
    ...(typeof value.confirmationStatus === 'string' ? { confirmationStatus: value.confirmationStatus } : {}),
    ...(typeof value.search === 'string' ? { search: value.search } : {}),
  };
}

export function guestUploadContentType(pathname: string): 'text/plain' | 'text/markdown' | 'text/csv' | null {
  if (!/^guest-uploads\/[a-z0-9._-]{1,200}\.(txt|md|csv)$/i.test(pathname)) return null;
  const extension = pathname.slice(pathname.lastIndexOf('.') + 1).toLowerCase();
  return extension === 'md' ? 'text/markdown' : extension === 'csv' ? 'text/csv' : 'text/plain';
}

export function isSafePublicBlobUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2_048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && !url.port
      && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}
