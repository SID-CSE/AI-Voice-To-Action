import { 
  AIAnalysisOutput, 
  WorkflowStage, 
  StructuredTask, 
  AuditRecord, 
  KnowledgeDocument, 
  AppSettings, 
  SystemSettings,
  EvaluationResult,
  EvalResult,
  EvalTestCase 
} from '../types';

const BASE_URL = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${BASE_URL}/stats`);
    return res.json();
  },

  async analyze(data: {
    transcript: string;
    inputType?: 'voice' | 'text' | 'demo' | 'eval';
    workflowType?: 'react' | 'baseline';
    enableGrounding?: boolean;
  }): Promise<{
    output: AIAnalysisOutput;
    stages: WorkflowStage[];
    durationMs: number;
    auditId: string;
    analysisId: string;
  }> {
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(errData.error || `Error ${res.status}: Failed to analyze transcript`);
    }

    return res.json();
  },

  async analyzeTranscript(
    transcript: string, 
    inputType: 'voice' | 'text' | 'demo' | 'eval' = 'text',
    workflowType: 'react' | 'baseline' = 'react',
    enableGrounding = true
  ) {
    return this.analyze({ transcript, inputType, workflowType, enableGrounding });
  },

  async refine(data: {
    currentOutput: AIAnalysisOutput;
    userGuidance: string;
    auditId?: string;
  }): Promise<{ output: AIAnalysisOutput; auditId?: string }> {
    const res = await fetch(`${BASE_URL}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Refinement failed' }));
      throw new Error(err.error || 'Refinement failed');
    }

    const dataRes = await res.json();
    return { output: dataRes.refinedOutput, auditId: dataRes.auditId || data.auditId };
  },

  async refineAnalysis(currentOutput: AIAnalysisOutput, userGuidance: string, auditId?: string) {
    return this.refine({ currentOutput, userGuidance, auditId });
  },

  async executeAction(
    actionIdOrData: string | { auditId: string; actionId: string; confirmed: boolean },
    actionStatus?: 'CONFIRM' | 'CANCEL',
    auditId?: string
  ): Promise<{ success: boolean; status: string; message: string; auditRecord?: AuditRecord }> {
    let payload: any;
    if (typeof actionIdOrData === 'string') {
      payload = {
        actionId: actionIdOrData,
        confirmed: actionStatus === 'CONFIRM',
        auditId: auditId || 'active',
      };
    } else {
      payload = actionIdOrData;
    }

    const res = await fetch(`${BASE_URL}/execute-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Execution failed' }));
      throw new Error(err.error || 'Action execution failed');
    }

    return res.json();
  },

  async getEvaluationTestCases(): Promise<EvalTestCase[]> {
    const res = await fetch(`${BASE_URL}/evaluation/cases`);
    return res.json();
  },

  async evaluate(data: {
    transcript?: string;
    testCaseId?: string;
    testCaseName?: string;
  }): Promise<EvalResult> {
    const res = await fetch(`${BASE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Evaluation failed' }));
      throw new Error(err.error || 'Evaluation failed');
    }

    return res.json();
  },

  async runEvaluation(testCaseId: string): Promise<EvalResult> {
    return this.evaluate({ testCaseId });
  },

  async getEvaluations(): Promise<EvalResult[]> {
    const res = await fetch(`${BASE_URL}/evaluations`);
    return res.json();
  },

  async getTasks(): Promise<(StructuredTask & { createdAt?: string; updatedAt?: string })[]> {
    const res = await fetch(`${BASE_URL}/tasks`);
    return res.json();
  },

  async createTask(taskData: Partial<StructuredTask>): Promise<StructuredTask> {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    return res.json();
  },

  async addTask(taskData: Partial<StructuredTask>): Promise<StructuredTask> {
    return this.createTask(taskData);
  },

  async updateTask(taskOrId: StructuredTask | string, updates?: Partial<StructuredTask>) {
    const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
    const body = typeof taskOrId === 'string' ? updates : taskOrId;

    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async deleteTask(id: string) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getAnalyses() {
    const res = await fetch(`${BASE_URL}/analyses`);
    return res.json();
  },

  async clearAuditLogs() {
    const res = await fetch(`${BASE_URL}/audit-logs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
    return res.json();
  },

  async getAuditLogs(params?: {
    riskLevel?: string;
    confirmationStatus?: string;
    search?: string;
  }): Promise<AuditRecord[]> {
    const query = new URLSearchParams();
    if (params?.riskLevel) query.append('riskLevel', params.riskLevel);
    if (params?.confirmationStatus) query.append('confirmationStatus', params.confirmationStatus);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${BASE_URL}/audit-logs?${query.toString()}`);
    return res.json();
  },

  async getKnowledge(): Promise<KnowledgeDocument[]> {
    const res = await fetch(`${BASE_URL}/knowledge`);
    return res.json();
  },

  async getDocuments(): Promise<KnowledgeDocument[]> {
    return this.getKnowledge();
  },

  async addKnowledge(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }): Promise<KnowledgeDocument> {
    const res = await fetch(`${BASE_URL}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addDocument(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }): Promise<KnowledgeDocument> {
    return this.addKnowledge(data);
  },

  async uploadDocument(file: File, category = 'General', tags: string[] = []): Promise<KnowledgeDocument> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    const res = await fetch(`${BASE_URL}/knowledge/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'text/plain',
        contentBase64: btoa(binary),
        category,
        tags,
      }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'File upload failed' }));
      throw new Error(error.error || 'File upload failed');
    }
    return res.json();
  },

  async deleteKnowledge(id: string) {
    const res = await fetch(`${BASE_URL}/knowledge/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async deleteDocument(id: string) {
    return this.deleteKnowledge(id);
  },

  async searchKnowledge(query: string) {
    const res = await fetch(`${BASE_URL}/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Knowledge search failed' }));
      throw new Error(error.error || 'Knowledge search failed');
    }
    return res.json();
  },

  async searchDocuments(query: string) {
    return this.searchKnowledge(query);
  },

  async resetData() {
    const res = await fetch(`${BASE_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
    return res.json();
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    const data = await res.json();
    const model = data.model || 'standard';
    return {
      model,
      modelName: model,
      promptVersion: 'current',
      groundingEnabled: data.groundingEnabled !== false,
      guardrailsStrict: data.guardrailsStrict !== false,
      defaultWorkflow: data.defaultWorkflow || 'react',
      demoModeEnabled: false,
      confidenceThreshold: data.confidenceThreshold || 75,
      audioSensitivity: data.audioSensitivity || 'Normal',
    };
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    const model = data.model || 'standard';
    return {
      model,
      modelName: model,
      promptVersion: 'current',
      groundingEnabled: data.groundingEnabled !== false,
      guardrailsStrict: data.guardrailsStrict !== false,
      defaultWorkflow: data.defaultWorkflow || 'react',
      demoModeEnabled: false,
      confidenceThreshold: data.confidenceThreshold || 75,
      audioSensitivity: data.audioSensitivity || 'Normal',
    };
  },

};
