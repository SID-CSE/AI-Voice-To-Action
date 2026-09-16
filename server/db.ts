import fs from 'fs';
import path from 'path';
import { 
  StructuredTask, 
  AuditRecord, 
  KnowledgeDocument, 
  AppSettings, 
  AIAnalysisOutput 
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
  knowledgeDocuments: KnowledgeDocument[];
  settings: AppSettings;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'store.json');

const INITIAL_SETTINGS: AppSettings = {
  model: 'gemini-3.6-flash',
  promptVersion: 'v1.0-react',
  groundingEnabled: true,
  defaultWorkflow: 'react',
  demoModeEnabled: true,
};

const INITIAL_KNOWLEDGE: KnowledgeDocument[] = [
  {
    id: 'doc-team-1',
    title: 'team_members.txt',
    category: 'Team Directory',
    content: `SmartPay Team Directory and Responsibilities:
- Rahul Sharma: Lead Frontend Developer. Responsible for React dashboard, UI components, client-side routing, and styling.
- Ankit Verma: Senior Backend Developer. Responsible for Node.js Express APIs, database schemas, and microservice integration.
- Siddharth Kumar: Machine Learning Engineer. Responsible for salary prediction models, PyTorch pipelines, and AI evaluation metrics.
- Priya Nair: QA & Security Engineer. Responsible for test suites, end-to-end testing, and credential audit.`,
    tags: ['team', 'roles', 'assignment', 'smartpay'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'doc-guidelines-2',
    title: 'project_guidelines.txt',
    category: 'Process Guidelines',
    content: `SmartPay Sprint Workflow Guidelines:
1. Task Assignment: Frontend UI tasks must be assigned directly to Rahul. Backend API or database endpoints must be assigned to Ankit. Model training and AI tasks belong to Siddharth.
2. Sprint Deadlines: Weekly sprints conclude every Tuesday at 4:00 PM IST. Any task slated for "Friday" refers to end of working week (5:00 PM IST).
3. Review Protocols: All system reviews require full team attendance. Meeting invites must have agreed time slots before calendar dispatch.
4. Code Reviews: No direct pushes to main branch. All PRs must have at least 1 approval before staging deployment.`,
    tags: ['guidelines', 'workflow', 'sprint', 'smartpay'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'doc-security-3',
    title: 'security_policy.txt',
    category: 'Security & Compliance',
    content: `SmartPay Security and Financial Authorization Policies:
1. Consequential Actions: Financial disbursements (payments, vendor wire transfers, refunds) require dual-authorization and human sign-off. Never execute transfers programmatically without explicit user approval.
2. Credential Protection: Private passwords, API secrets, database credentials, and SSH keys must NEVER be shared, output, or transmitted via transcripts or AI responses.
3. External Communications: Sending emails or broadcasting messages to clients, vendors, or public channels requires user confirmation before dispatch.
4. Data Deletion: Dropping database tables or purging logs requires supervisor confirmation.`,
    tags: ['security', 'compliance', 'financial', 'safety'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  }
];

class DatabaseService {
  private data: DatabaseSchema;
  private initialized: boolean = false;

  constructor() {
    this.data = {
      tasks: [],
      analyses: [],
      auditLogs: [],
      knowledgeDocuments: INITIAL_KNOWLEDGE,
      settings: INITIAL_SETTINGS,
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          tasks: parsed.tasks || [],
          analyses: parsed.analyses || [],
          auditLogs: parsed.auditLogs || [],
          knowledgeDocuments: parsed.knowledgeDocuments && parsed.knowledgeDocuments.length > 0 
            ? parsed.knowledgeDocuments 
            : INITIAL_KNOWLEDGE,
          settings: (() => {
            const s = { ...INITIAL_SETTINGS, ...(parsed.settings || {}) };
            if (s.model && (s.model.includes('2.5') || s.model.includes('2.0') || s.model.includes('1.5') || s.model === 'gemini-3.8-flash')) {
              s.model = 'gemini-3.6-flash';
            }
            return s;
          })(),
        };
      } else {
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error initializing database file, using in-memory fallback:', err);
      this.data = {
        tasks: [],
        analyses: [],
        auditLogs: [],
        knowledgeDocuments: INITIAL_KNOWLEDGE,
        settings: INITIAL_SETTINGS,
      };
      this.initialized = true;
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Tasks
  getTasks(): (StructuredTask & { createdAt: string; updatedAt: string })[] {
    return [...this.data.tasks];
  }

  saveTasks(tasks: StructuredTask[]): void {
    const now = new Date().toISOString();
    for (const task of tasks) {
      const existingIdx = this.data.tasks.findIndex(t => t.id === task.id);
      if (existingIdx >= 0) {
        this.data.tasks[existingIdx] = {
          ...this.data.tasks[existingIdx],
          ...task,
          updatedAt: now,
        };
      } else {
        this.data.tasks.unshift({
          ...task,
          status: task.status || 'Pending',
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    this.persist();
  }

  updateTask(id: string, updates: Partial<StructuredTask>): (StructuredTask & { createdAt: string; updatedAt: string }) | null {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      userEdited: true,
      updatedAt: now,
    };
    this.persist();
    return this.data.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const prevLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    const deleted = this.data.tasks.length !== prevLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Analyses
  getAnalyses() {
    return [...this.data.analyses];
  }

  saveAnalysis(analysis: { id: string; inputType: string; transcript: string; output: AIAnalysisOutput }) {
    const record = {
      ...analysis,
      timestamp: new Date().toISOString(),
    };
    this.data.analyses.unshift(record);
    // Limit to 100 entries
    if (this.data.analyses.length > 100) {
      this.data.analyses = this.data.analyses.slice(0, 100);
    }
    this.persist();
    return record;
  }

  // Audit Logs
  getAuditLogs(filter?: { riskLevel?: string; confirmationStatus?: string; search?: string }): AuditRecord[] {
    let logs = [...this.data.auditLogs];
    if (filter) {
      if (filter.riskLevel && filter.riskLevel !== 'ALL') {
        logs = logs.filter(l => l.riskLevel === filter.riskLevel);
      }
      if (filter.confirmationStatus && filter.confirmationStatus !== 'ALL') {
        logs = logs.filter(l => l.confirmationStatus === filter.confirmationStatus);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        logs = logs.filter(l => 
          l.transcript.toLowerCase().includes(q) || 
          l.aiOutput.summary.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
        );
      }
    }
    return logs;
  }

  saveAuditRecord(record: AuditRecord): AuditRecord {
    this.data.auditLogs.unshift(record);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.persist();
    return record;
  }

  updateAuditConfirmation(id: string, confirmationStatus: 'CONFIRMED' | 'CANCELLED', executionNote?: string) {
    const log = this.data.auditLogs.find(l => l.id === id);
    if (log) {
      log.confirmationStatus = confirmationStatus;
      if (!log.executedActions) log.executedActions = [];
      log.executedActions.push({
        actionId: id,
        action: log.aiOutput.proposed_actions.map(p => p.action).join(', ') || 'Proposed Action',
        status: confirmationStatus,
        confirmedAt: new Date().toISOString(),
        note: executionNote || `Action marked as ${confirmationStatus.toLowerCase()} by user.`,
      });
      this.persist();
      return log;
    }
    return null;
  }

  clearAuditLogs(): void {
    this.data.auditLogs = [];
    this.persist();
  }

  // Knowledge Documents
  getKnowledgeDocuments(): KnowledgeDocument[] {
    return [...this.data.knowledgeDocuments];
  }

  addKnowledgeDocument(doc: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeDocument {
    const now = new Date().toISOString();
    const newDoc: KnowledgeDocument = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.knowledgeDocuments.unshift(newDoc);
    this.persist();
    return newDoc;
  }

  deleteKnowledgeDocument(id: string): boolean {
    const prev = this.data.knowledgeDocuments.length;
    this.data.knowledgeDocuments = this.data.knowledgeDocuments.filter(d => d.id !== id);
    const deleted = this.data.knowledgeDocuments.length !== prev;
    if (deleted) this.persist();
    return deleted;
  }

  // Settings
  getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
    };
    this.persist();
    return { ...this.data.settings };
  }

  // Reset to initial seed state
  resetData(): void {
    this.data = {
      tasks: [],
      analyses: [],
      auditLogs: [],
      knowledgeDocuments: INITIAL_KNOWLEDGE,
      settings: INITIAL_SETTINGS,
    };
    this.persist();
  }

  // Stats for Dashboard
  getDashboardStats() {
    const totalTasks = this.data.tasks.length;
    const completedTasks = this.data.tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = this.data.tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = this.data.tasks.filter(t => !t.status || t.status === 'Pending').length;
    const pendingConfirmation = this.data.auditLogs.filter(a => a.confirmationStatus === 'AWAITING_CONFIRMATION').length;
    const totalAnalyses = this.data.analyses.length;
    const totalAuditRecords = this.data.auditLogs.length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      pendingConfirmation,
      totalAnalyses,
      totalAuditRecords,
      highRiskAnalyses: this.data.auditLogs.filter(a => a.riskLevel === 'HIGH').length,
    };
  }
}

export const db = new DatabaseService();
