import 'dotenv/config';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  StructuredTask,
  AuditRecord,
  KnowledgeDocument,
  AppSettings,
  AIAnalysisOutput,
  EvalResult,
} from '../src/types.js';

interface DatabaseSchema {
  tasks: (StructuredTask & { createdAt: string; updatedAt: string })[];
  analyses: {
    id: string;
    timestamp: string;
    inputType: string;
    transcript: string;
    output: AIAnalysisOutput;
  }[];
  auditLogs: AuditRecord[];
  evaluations: EvalResult[];
  knowledgeDocuments: KnowledgeDocument[];
  settings: AppSettings;
}

interface ScopeContext {
  scope: string;
  data: DatabaseSchema;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'local-store.json');
const DATABASE_URL = process.env.DATABASE_URL;
const scopeStorage = new AsyncLocalStorage<ScopeContext>();

const INITIAL_SETTINGS: AppSettings = {
  model: 'gemini-3.6-flash',
  promptVersion: 'v1.0-react',
  groundingEnabled: true,
  defaultWorkflow: 'react',
  demoModeEnabled: true,
};

const DEMO_TASKS: (StructuredTask & { createdAt: string; updatedAt: string })[] = [
  {
    id: 'demo-task-frontend',
    task: 'Complete the frontend dashboard',
    owner: 'Rahul Sharma',
    deadline: 'Friday',
    priority: 'High',
    dependencies: [],
    confidence: 96,
    evidence: 'Rahul will complete the frontend dashboard by Friday.',
    status: 'Pending',
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-task-api',
    task: 'Complete the backend API',
    owner: 'Ankit Verma',
    deadline: 'Monday',
    priority: 'High',
    dependencies: [],
    confidence: 94,
    evidence: 'Ankit will finish the backend API by Monday.',
    status: 'In Progress',
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'demo-task-evaluation',
    task: 'Run the responsible AI evaluation suite',
    owner: 'Siddharth Kumar',
    deadline: 'Next Tuesday',
    priority: 'Medium',
    dependencies: ['demo-task-frontend', 'demo-task-api'],
    confidence: 90,
    evidence: 'The team will review the complete system next Tuesday.',
    status: 'Pending',
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z',
  },
];

const INITIAL_KNOWLEDGE: KnowledgeDocument[] = [
  {
    id: 'doc-team-1',
    title: 'team_members.txt',
    category: 'Team Directory',
    content: `SmartPay Team Directory and Responsibilities:\n- Rahul Sharma: Lead Frontend Developer. Responsible for React dashboard, UI components, client-side routing, and styling.\n- Ankit Verma: Senior Backend Developer. Responsible for Node.js Express APIs, database schemas, and microservice integration.\n- Siddharth Kumar: Machine Learning Engineer. Responsible for salary prediction models, PyTorch pipelines, and AI evaluation metrics.\n- Priya Nair: QA & Security Engineer. Responsible for test suites, end-to-end testing, and credential audit.`,
    tags: ['team', 'roles', 'assignment', 'smartpay'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'doc-guidelines-2',
    title: 'project_guidelines.txt',
    category: 'Process Guidelines',
    content: `SmartPay Sprint Workflow Guidelines:\n1. Task Assignment: Frontend UI tasks must be assigned directly to Rahul. Backend API or database endpoints must be assigned to Ankit. Model training and AI tasks belong to Siddharth.\n2. Sprint Deadlines: Weekly sprints conclude every Tuesday at 4:00 PM IST. Any task slated for "Friday" refers to end of working week (5:00 PM IST).\n3. Review Protocols: All system reviews require full team attendance. Meeting invites must have agreed time slots before calendar dispatch.\n4. Code Reviews: No direct pushes to main branch. All PRs must have at least 1 approval before staging deployment.`,
    tags: ['guidelines', 'workflow', 'sprint', 'smartpay'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'doc-security-3',
    title: 'security_policy.txt',
    category: 'Security & Compliance',
    content: `SmartPay Security and Financial Authorization Policies:\n1. Consequential Actions: Financial disbursements (payments, vendor wire transfers, refunds) require dual-authorization and human sign-off. Never execute transfers programmatically without explicit user approval.\n2. Credential Protection: Private passwords, API secrets, database credentials, and SSH keys must NEVER be shared, output, or transmitted via transcripts or AI responses.\n3. External Communications: Sending emails or broadcasting messages to clients, vendors, or public channels requires user confirmation before dispatch.\n4. Data Deletion: Dropping database tables or purging logs requires supervisor confirmation.`,
    tags: ['guidelines', 'workflow', 'sprint', 'smartpay'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const MAX_TASKS = 500;
const MAX_KNOWLEDGE_DOCUMENTS = 50;
const MAX_KNOWLEDGE_BYTES = 2 * 1024 * 1024;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function queryRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

function freshGuestData(): DatabaseSchema {
  return {
    tasks: clone(DEMO_TASKS),
    analyses: [],
    auditLogs: [],
    evaluations: [],
    knowledgeDocuments: clone(INITIAL_KNOWLEDGE),
    settings: { ...INITIAL_SETTINGS },
  };
}

function personalKnowledge(displayName: string): KnowledgeDocument[] {
  return [{
    id: 'doc-personal-demo',
    title: `${displayName}'s demo context.txt`,
    category: 'Personal Demo',
    content: `${displayName}'s private demo context: Use this document to test grounded retrieval. Frontend questions should be routed to Rahul Sharma, backend questions to Ankit Verma, and AI evaluation questions to Siddharth Kumar.`,
    tags: ['demo', 'grounding', 'personal'],
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z',
  }];
}

function freshUserData(displayName: string): DatabaseSchema {
  return {
    tasks: [],
    analyses: [],
    auditLogs: [],
    evaluations: [],
    knowledgeDocuments: personalKnowledge(displayName),
    settings: { ...INITIAL_SETTINGS },
  };
}

function normalizeData(value: Partial<DatabaseSchema>, scope: string, displayName: string): DatabaseSchema {
  const defaults = scope === 'guest' ? freshGuestData() : freshUserData(displayName);
  return {
    tasks: Array.isArray(value.tasks) ? value.tasks : defaults.tasks,
    analyses: Array.isArray(value.analyses) ? value.analyses : defaults.analyses,
    auditLogs: Array.isArray(value.auditLogs) ? value.auditLogs : defaults.auditLogs,
    evaluations: Array.isArray(value.evaluations) ? value.evaluations : defaults.evaluations,
    knowledgeDocuments: Array.isArray(value.knowledgeDocuments) ? value.knowledgeDocuments : defaults.knowledgeDocuments,
    settings: { ...INITIAL_SETTINGS, ...(value.settings || {}) },
  };
}

function parseVersion(value: unknown): number {
  const version = Number(value);
  return Number.isFinite(version) && version >= 0 ? version : 0;
}

export class DatabaseService {
  private readonly sql: ReturnType<typeof neon> | null;
  private readonly dataFile: string;
  private readonly legacyDataFile: string | null;
  private readonly production: boolean;
  private defaultData: DatabaseSchema = freshGuestData();
  private scopedData = new Map<string, DatabaseSchema>();
  private localRateLimits = new Map<string, { start: number; count: number }>();
  private initializationError: unknown;
  private readyPromise: Promise<void>;

  constructor(
    sql: ReturnType<typeof neon> | null = DATABASE_URL ? neon(DATABASE_URL) : null,
    dataFile = DB_FILE,
    production = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
    legacyDataFile = dataFile === DB_FILE ? path.join(path.dirname(dataFile), 'store.json') : null,
  ) {
    this.sql = sql;
    this.dataFile = dataFile;
    this.legacyDataFile = legacyDataFile === dataFile ? null : legacyDataFile;
    this.production = production;
    this.readyPromise = this.initialize().catch((error) => {
      this.initializationError = error;
    });
  }

  async ready(): Promise<void> {
    await this.readyPromise;
    if (this.initializationError) throw this.initializationError;
  }

  async checkHealth(): Promise<{ configured: boolean; available: boolean; persistent: boolean }> {
    if (!this.sql) {
      return { configured: false, available: !this.production, persistent: false };
    }
    try {
      await this.ready();
      await this.sql`SELECT 1`;
      return { configured: true, available: true, persistent: true };
    } catch {
      return { configured: true, available: false, persistent: false };
    }
  }

  async prepareScope(scope: string, displayName = 'your workspace'): Promise<void> {
    if (!scope || (scope !== 'guest' && scope === 'default')) {
      throw new Error('Invalid data scope');
    }
    const safeName = displayName.trim().slice(0, 80) || 'your workspace';
    await this.ready();

    if (!this.sql) {
      if (scope === 'guest') {
        this.scopedData.set(scope, this.defaultData);
      } else if (!this.scopedData.has(scope)) {
        const userDataFile = this.localUserDataFile(scope);
        if (fs.existsSync(userDataFile)) {
          const saved = JSON.parse(fs.readFileSync(userDataFile, 'utf8')) as Partial<DatabaseSchema>;
          this.scopedData.set(scope, normalizeData(saved, scope, safeName));
        } else {
          this.scopedData.set(scope, freshUserData(safeName));
        }
      }
      return;
    }

    let rows = queryRows<{ data: Partial<DatabaseSchema>; version: number }>(await this.sql`SELECT data, version FROM app_state WHERE id = ${scope}`);
    if (!rows.length) {
      const initial = scope === 'guest' ? freshGuestData() : freshUserData(safeName);
      await this.sql`
        INSERT INTO app_state (id, data, version, updated_at)
        VALUES (${scope}, ${JSON.stringify(initial)}::jsonb, 0, NOW())
        ON CONFLICT (id) DO NOTHING
      `;
      rows = queryRows<{ data: Partial<DatabaseSchema>; version: number }>(await this.sql`SELECT data, version FROM app_state WHERE id = ${scope}`);
    }
    if (!rows.length) throw new Error('Unable to initialize workspace state');

    const saved = normalizeData(rows[0].data as Partial<DatabaseSchema>, scope, safeName);
    this.scopedData.set(scope, saved);
  }

  runWithScope<T>(scope: string, next: () => T): T {
    const data = this.scopedData.get(scope);
    if (!data) throw new Error('Workspace scope was not prepared');
    return scopeStorage.run({ scope, data }, next);
  }

  getCurrentScope(): string {
    return scopeStorage.getStore()?.scope || 'guest';
  }

  getStorageMode(): 'neon' | 'local' {
    return this.sql ? 'neon' : 'local';
  }

  private get data(): DatabaseSchema {
    return scopeStorage.getStore()?.data || this.defaultData;
  }

  private async initialize(): Promise<void> {
    if (!this.sql) {
      if (this.production) throw new Error('DATABASE_URL is required in production');
      this.loadLocalData();
      return;
    }

    await this.sql`
      CREATE TABLE IF NOT EXISTS app_state (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        version BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await this.sql`ALTER TABLE app_state ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0`;
    await this.sql`
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        id TEXT PRIMARY KEY,
        window_started_at TIMESTAMPTZ NOT NULL,
        request_count INTEGER NOT NULL
      )
    `;
    await this.sql`CREATE INDEX IF NOT EXISTS api_rate_limits_window_idx ON api_rate_limits(window_started_at)`;
  }

  private loadLocalData(): void {
    try {
      const directory = path.dirname(this.dataFile);
      if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
      const sourceFile = fs.existsSync(this.dataFile)
        ? this.dataFile
        : this.legacyDataFile && fs.existsSync(this.legacyDataFile)
          ? this.legacyDataFile
          : null;
      if (!sourceFile) {
        this.persistLocal(this.defaultData);
        return;
      }
      const parsed = JSON.parse(fs.readFileSync(sourceFile, 'utf8')) as Partial<DatabaseSchema>;
      const restored = normalizeData(parsed, 'guest', 'your workspace');
      if (sourceFile === this.legacyDataFile) {
        if (restored.tasks.length === 0) restored.tasks = clone(DEMO_TASKS);
        if (restored.knowledgeDocuments.length === 0) restored.knowledgeDocuments = clone(INITIAL_KNOWLEDGE);
      }
      this.defaultData = restored;
      if (sourceFile === this.legacyDataFile) this.persistLocal(restored);
    } catch (error) {
      console.error('Unable to read local application data:', error);
    }
  }

  private localUserDataFile(scope: string): string {
    const id = createHash('sha256').update(scope).digest('hex');
    return path.join(path.dirname(this.dataFile), 'users', `${id}.json`);
  }

  private persistLocal(data: DatabaseSchema, scope = 'guest'): void {
    const filename = scope === 'guest' ? this.dataFile : this.localUserDataFile(scope);
    const directory = path.dirname(filename);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    const temporaryFile = `${filename}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(temporaryFile, filename);
  }

  private async mutate<T>(operation: (data: DatabaseSchema) => { result: T; changed: boolean }): Promise<T> {
    const context = scopeStorage.getStore();
    const scope = context?.scope || 'guest';

    if (!this.sql) {
      const source = context?.data || this.defaultData;
      const draft = clone(source);
      const outcome = operation(draft);
      if (outcome.changed) {
        if (context) context.data = draft;
        this.scopedData.set(scope, draft);
        if (scope === 'guest') this.defaultData = draft;
        this.persistLocal(draft, scope);
      }
      return outcome.result;
    }

    await this.ready();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const rows = queryRows<{ data: Partial<DatabaseSchema>; version: number }>(await this.sql`SELECT data, version FROM app_state WHERE id = ${scope}`);
      if (!rows.length) throw new Error('Workspace state is missing');
      const version = parseVersion(rows[0].version);
      const draft = normalizeData(rows[0].data as Partial<DatabaseSchema>, scope, 'your workspace');
      const outcome = operation(draft);
      if (!outcome.changed) return outcome.result;

      const updated = queryRows<{ version: number }>(await this.sql`
        UPDATE app_state
        SET data = ${JSON.stringify(draft)}::jsonb, version = version + 1, updated_at = NOW()
        WHERE id = ${scope} AND version = ${version}
        RETURNING version
      `);
      if (updated.length) {
        this.scopedData.set(scope, draft);
        if (context) context.data = draft;
        return outcome.result;
      }
    }
    throw new Error('Workspace changed too often to save this update; please retry');
  }

  async consumeRateLimit(id: string, limit: number, windowMs: number): Promise<boolean> {
    if (this.sql) {
      await this.ready();
      const rows = await this.sql`
        INSERT INTO api_rate_limits (id, window_started_at, request_count)
        VALUES (${id}, NOW(), 1)
        ON CONFLICT (id) DO UPDATE SET
          window_started_at = CASE
            WHEN api_rate_limits.window_started_at <= NOW() - ${windowMs} * INTERVAL '1 millisecond' THEN NOW()
            ELSE api_rate_limits.window_started_at
          END,
          request_count = CASE
            WHEN api_rate_limits.window_started_at <= NOW() - ${windowMs} * INTERVAL '1 millisecond' THEN 1
            ELSE api_rate_limits.request_count + 1
          END
        RETURNING request_count
      `;
      await this.sql`DELETE FROM api_rate_limits WHERE window_started_at < NOW() - INTERVAL '1 day'`;
      return Number(rows[0]?.request_count || 0) <= limit;
    }

    const now = Date.now();
    const current = this.localRateLimits.get(id);
    if (!current || now - current.start >= windowMs) {
      this.localRateLimits.set(id, { start: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  }

  getTasks(): (StructuredTask & { createdAt: string; updatedAt: string })[] {
    return clone(this.data.tasks);
  }

  async saveTasks(tasks: StructuredTask[]): Promise<boolean> {
    return this.mutate((data) => {
      const now = new Date().toISOString();
      const newTasks = tasks.filter((task) => !data.tasks.some((item) => item.id === task.id));
      if (data.tasks.length + newTasks.length > MAX_TASKS) return { result: false, changed: false };
      for (const task of tasks) {
        const existing = data.tasks.findIndex((item) => item.id === task.id);
        if (existing >= 0) {
          data.tasks[existing] = { ...data.tasks[existing], ...task, updatedAt: now };
        } else {
          data.tasks.unshift({ ...task, status: task.status || 'Pending', createdAt: now, updatedAt: now });
        }
      }
      return { result: true, changed: tasks.length > 0 };
    });
  }

  async updateTask(id: string, updates: Partial<StructuredTask>): Promise<(StructuredTask & { createdAt: string; updatedAt: string }) | null> {
    return this.mutate((data) => {
      const index = data.tasks.findIndex((task) => task.id === id);
      if (index === -1) return { result: null, changed: false };
      data.tasks[index] = { ...data.tasks[index], ...updates, userEdited: true, updatedAt: new Date().toISOString() };
      return { result: data.tasks[index], changed: true };
    });
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.mutate((data) => {
      const previousLength = data.tasks.length;
      data.tasks = data.tasks.filter((task) => task.id !== id);
      return { result: data.tasks.length !== previousLength, changed: data.tasks.length !== previousLength };
    });
  }

  getAnalyses() {
    return clone(this.data.analyses);
  }

  async saveAnalysis(analysis: { id: string; inputType: string; transcript: string; output: AIAnalysisOutput }) {
    const record = { ...analysis, timestamp: new Date().toISOString() };
    await this.mutate((data) => {
      data.analyses = [record, ...data.analyses].slice(0, 100);
      return { result: undefined, changed: true };
    });
    return record;
  }

  getAuditLogs(filter?: { riskLevel?: string; confirmationStatus?: string; search?: string }): AuditRecord[] {
    let logs = clone(this.data.auditLogs);
    if (filter) {
      if (filter.riskLevel && filter.riskLevel !== 'ALL') logs = logs.filter((log) => log.riskLevel === filter.riskLevel);
      if (filter.confirmationStatus && filter.confirmationStatus !== 'ALL') logs = logs.filter((log) => log.confirmationStatus === filter.confirmationStatus);
      if (filter.search) {
        const query = filter.search.toLowerCase();
        logs = logs.filter((log) => log.transcript.toLowerCase().includes(query) || log.aiOutput.summary.toLowerCase().includes(query) || log.id.toLowerCase().includes(query));
      }
    }
    return logs;
  }

  async saveAuditRecord(record: AuditRecord): Promise<AuditRecord> {
    await this.mutate((data) => {
      data.auditLogs = [record, ...data.auditLogs].slice(0, 200);
      return { result: undefined, changed: true };
    });
    return record;
  }

  async updateAuditOutput(id: string, output: AIAnalysisOutput): Promise<AuditRecord | null> {
    return this.mutate((data) => {
      const log = data.auditLogs.find((record) => record.id === id);
      if (!log) return { result: null, changed: false };
      log.userEdits = output;
      log.finalOutput = output;
      return { result: log, changed: true };
    });
  }

  async updateAuditConfirmation(id: string, actionId: string, confirmationStatus: 'CONFIRMED' | 'CANCELLED', executionNote?: string) {
    return this.mutate((data) => {
      const log = data.auditLogs.find((record) => record.id === id);
      const action = log?.aiOutput.proposed_actions.find((item) => item.id === actionId);
      if (!log || !action || action.status !== 'AWAITING_CONFIRMATION') return { result: null, changed: false };

      const confirmedAt = new Date().toISOString();
      action.status = confirmationStatus;
      action.executedAt = confirmedAt;
      action.executionNote = executionNote;
      if (!log.executedActions) log.executedActions = [];
      log.executedActions.push({
        actionId,
        action: action.action,
        status: confirmationStatus,
        confirmedAt,
        note: executionNote || `Action marked as ${confirmationStatus.toLowerCase()} by user.`,
      });
      if (log.aiOutput.proposed_actions.every((item) => item.status !== 'AWAITING_CONFIRMATION')) {
        log.confirmationStatus = log.aiOutput.proposed_actions.some((item) => item.status === 'CONFIRMED')
          ? 'CONFIRMED'
          : 'CANCELLED';
      }
      return { result: log, changed: true };
    });
  }

  async clearAuditLogs(): Promise<void> {
    await this.mutate((data) => {
      const changed = data.auditLogs.length > 0;
      data.auditLogs = [];
      return { result: undefined, changed };
    });
  }

  getKnowledgeDocuments(): KnowledgeDocument[] {
    return clone(this.data.knowledgeDocuments);
  }

  async addKnowledgeDocument(doc: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeDocument | null> {
    const now = new Date().toISOString();
    const newDoc: KnowledgeDocument = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.mutate((data) => {
      const storedBytes = data.knowledgeDocuments.reduce((total, item) => total + Buffer.byteLength(item.content, 'utf8'), 0);
      const nextBytes = Buffer.byteLength(newDoc.content, 'utf8');
      if (data.knowledgeDocuments.length >= MAX_KNOWLEDGE_DOCUMENTS || storedBytes + nextBytes > MAX_KNOWLEDGE_BYTES) {
        return { result: null, changed: false };
      }
      data.knowledgeDocuments.unshift(newDoc);
      return { result: newDoc, changed: true };
    });
  }

  async deleteKnowledgeDocument(id: string): Promise<boolean> {
    return this.mutate((data) => {
      const previousLength = data.knowledgeDocuments.length;
      data.knowledgeDocuments = data.knowledgeDocuments.filter((document) => document.id !== id);
      return { result: data.knowledgeDocuments.length !== previousLength, changed: data.knowledgeDocuments.length !== previousLength };
    });
  }

  getEvaluations(): EvalResult[] {
    return clone(this.data.evaluations);
  }

  async saveEvaluation(result: EvalResult): Promise<EvalResult> {
    await this.mutate((data) => {
      data.evaluations = [result, ...data.evaluations.filter((item) => item.id !== result.id)].slice(0, 50);
      return { result: undefined, changed: true };
    });
    return result;
  }

  getSettings(): AppSettings {
    return clone(this.data.settings);
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    return this.mutate((data) => {
      data.settings = { ...data.settings, ...updates };
      return { result: clone(data.settings), changed: true };
    });
  }

  async resetData(): Promise<void> {
    const scope = this.getCurrentScope();
    await this.mutate((data) => {
      const defaults = scope === 'guest' ? freshGuestData() : freshUserData('your workspace');
      Object.assign(data, defaults);
      return { result: undefined, changed: true };
    });
  }

  getDashboardStats() {
    const totalTasks = this.data.tasks.length;
    const completedTasks = this.data.tasks.filter((task) => task.status === 'Completed').length;
    const inProgressTasks = this.data.tasks.filter((task) => task.status === 'In Progress').length;
    const pendingTasks = this.data.tasks.filter((task) => !task.status || task.status === 'Pending').length;
    const pendingConfirmation = this.data.auditLogs.filter((log) => log.confirmationStatus === 'AWAITING_CONFIRMATION').length;
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      pendingConfirmation,
      totalAnalyses: this.data.analyses.length,
      totalAuditRecords: this.data.auditLogs.length,
      highRiskAnalyses: this.data.auditLogs.filter((log) => log.riskLevel === 'HIGH').length,
    };
  }
}

export const db = new DatabaseService();
