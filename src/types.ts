export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ConfirmationStatus = 'NOT_REQUIRED' | 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface StructuredTask {
  id: string;
  task: string;
  owner: string;
  deadline: string;
  priority: TaskPriority | string;
  dependencies: string[];
  confidence: number;
  evidence: string;
  status?: TaskStatus;
  userEdited?: boolean;
}

export interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
  confidence: number;
  evidence: string;
}

export interface ProposedAction {
  id: string;
  action: string;
  reason: string;
  requires_confirmation: boolean;
  category?: 'financial' | 'communication' | 'deletion' | 'security' | 'legal' | 'general';
  status: ConfirmationStatus;
  executedAt?: string;
  executionNote?: string;
}

export interface GroundedSource {
  docId: string;
  docTitle: string;
  excerpt: string;
  relevanceScore: number;
}

export interface AIAnalysisOutput {
  summary: string;
  intent: string;
  tasks: StructuredTask[];
  action_items: ActionItem[];
  uncertainties: string[];
  assumptions: string[];
  unsupported_requests: string[];
  risk_level: RiskLevel;
  confirmation_required: boolean;
  proposed_actions: ProposedAction[];
  grounded_sources?: GroundedSource[];
  workflow_type?: 'react' | 'baseline';
  processing_stages?: WorkflowStage[];
}

export interface WorkflowStage {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  detail?: string;
  timestamp?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  inputType: 'voice' | 'text' | 'demo' | 'eval';
  originalInput: string;
  transcript: string;
  promptVersion: string;
  model: string;
  retrievedContext: GroundedSource[];
  riskLevel: RiskLevel;
  confirmationRequired: boolean;
  confirmationStatus: ConfirmationStatus;
  aiOutput: AIAnalysisOutput;
  userEdits?: Partial<AIAnalysisOutput>;
  finalOutput?: AIAnalysisOutput;
  executedActions?: {
    actionId: string;
    action: string;
    status: ConfirmationStatus;
    confirmedAt?: string;
    note?: string;
  }[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationResult {
  id: string;
  testCaseName: string;
  input: string;
  baseline: {
    output: AIAnalysisOutput;
    durationMs: number;
    metrics: EvaluationMetrics;
  };
  react: {
    output: AIAnalysisOutput;
    durationMs: number;
    metrics: EvaluationMetrics;
  };
  comparisonNotes: string[];
}

export interface EvaluationMetrics {
  taskCount: number;
  uncertaintiesCount: number;
  assumptionsIdentified: number;
  riskDetected: boolean;
  groundingUsed: boolean;
  completenessScore: number; // 0-100 based on extracted vs expected elements
  safetyComplianceScore: number; // 0-100
}

export interface AppSettings {
  model: string;
  modelName?: string;
  promptVersion: string;
  groundingEnabled: boolean;
  guardrailsStrict?: boolean;
  defaultWorkflow: 'react' | 'baseline';
  demoModeEnabled: boolean;
  confidenceThreshold?: number;
  audioSensitivity?: string;
}

export type SystemSettings = AppSettings;

export interface EvalTestCase {
  id: string;
  name: string;
  category: string;
  transcript: string;
  expectedTasksCount: number;
  expectedRisk: RiskLevel;
  expectedConfirmation: boolean;
}

export interface EvalResult {
  id: string;
  testCaseName: string;
  input: string;
  baselineOutput?: AIAnalysisOutput;
  reactOutput?: AIAnalysisOutput;
  baselineMetrics?: {
    taskExtractionAccuracy: number;
    ownerAssignmentAccuracy: number;
    deadlineExtraction: number;
  };
  reactMetrics?: {
    taskExtractionAccuracy: number;
    ownerAssignmentAccuracy: number;
    deadlineExtraction: number;
  };
  comparisonNotes?: string[];
}
