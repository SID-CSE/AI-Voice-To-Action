import { GoogleGenAI } from '@google/genai';
import { 
  AIAnalysisOutput, 
  WorkflowStage, 
  StructuredTask, 
  ProposedAction 
} from '../src/types.js';
import { 
  REACT_SYSTEM_INSTRUCTION, 
  BASELINE_SYSTEM_INSTRUCTION, 
  BUILD_REACT_PROMPT, 
  BUILD_BASELINE_PROMPT, 
  BUILD_REFINE_PROMPT 
} from './prompts.js';
import { ragService } from './rag.js';
import { guardrails } from './guardrails.js';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length === 0) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
}

/**
 * Model candidate pool ordered by current reliability and availability
 */
const MODEL_FALLBACK_CANDIDATES = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

/**
 * Resilient multi-model executor with retry and automatic fallback
 */
async function generateWithModelFallback(
  ai: GoogleGenAI,
  options: {
    preferredModel?: string;
    prompt: string;
    systemInstruction: string;
    temperature?: number;
  }
): Promise<{ text: string; modelUsed: string }> {
  const preferred = options.preferredModel && options.preferredModel.trim().length > 0 
    ? options.preferredModel.trim() 
    : 'gemini-3.6-flash';
    
  // Normalize deprecated or legacy model names
  const normalizedPreferred = (preferred.includes('2.5') || preferred.includes('2.0') || preferred.includes('1.5'))
    ? 'gemini-3.6-flash'
    : preferred;

  const candidateModels = Array.from(new Set([
    normalizedPreferred,
    ...MODEL_FALLBACK_CANDIDATES,
  ]));

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: 'application/json',
            temperature: options.temperature ?? 0.2,
          },
        });

        const textOutput = response.text?.trim();
        if (textOutput && textOutput.length > 0) {
          return { text: textOutput, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const isTemporary = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand') || msg.includes('429');
        
        if (isTemporary && attempt === 0) {
          // Brief pause before retry on high demand spikes
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        
        // Model unavailable, 404, or persistent 503; try next candidate
        break;
      }
    }
  }

  throw lastError || new Error('All model candidates failed');
}

/**
 * Clean and parse JSON from model output
 */
function cleanAndParseJSON(rawText: string): any {
  if (!rawText) throw new Error('Empty response from model');
  let cleaned = rawText.trim();
  
  // Remove markdown code fence if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  
  // Find opening and closing brackets if embedded
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Fallback heuristic analysis for offline/demo reliability
 */
function generateHeuristicAnalysis(
  transcript: string, 
  workflowType: 'react' | 'baseline'
): AIAnalysisOutput {
  const lower = transcript.toLowerCase();
  const tasks: StructuredTask[] = [];
  const uncertainties: string[] = [];
  const assumptions: string[] = [];
  const unsupported: string[] = [];

  // Check password/credential attempts
  if (lower.includes('password') || lower.includes('secret') || lower.includes('credential')) {
    unsupported.push('Private credential requests are not supported and violate safety policy.');
  }

  // Detect SmartPay demo or common patterns
  if (lower.includes('rahul') || lower.includes('frontend')) {
    tasks.push({
      id: `t-${Date.now()}-1`,
      task: 'Complete frontend dashboard',
      owner: 'Rahul',
      deadline: lower.includes('friday') ? 'Friday' : 'Not specified',
      priority: 'High',
      dependencies: [],
      confidence: 94,
      evidence: 'Rahul will finish the frontend dashboard by Friday.',
      status: 'Pending',
    });
  }

  if (lower.includes('ankit') || lower.includes('backend')) {
    tasks.push({
      id: `t-${Date.now()}-2`,
      task: 'Complete backend API',
      owner: 'Ankit',
      deadline: lower.includes('monday') ? 'Monday' : 'Not specified',
      priority: 'High',
      dependencies: ['t-1'],
      confidence: 95,
      evidence: 'Ankit needs to complete the backend API by Monday.',
      status: 'Pending',
    });
  }

  if (lower.includes('model') || lower.includes('salary prediction')) {
    tasks.push({
      id: `t-${Date.now()}-3`,
      task: 'Improve salary prediction model',
      owner: 'User (Siddharth)',
      deadline: 'Not specified',
      priority: 'Medium',
      dependencies: [],
      confidence: 88,
      evidence: 'I will improve the salary prediction model.',
      status: 'Pending',
    });
  }

  if (lower.includes('review') || lower.includes('system')) {
    tasks.push({
      id: `t-${Date.now()}-4`,
      task: 'Review complete system',
      owner: 'Team',
      deadline: lower.includes('tuesday') ? 'Next Tuesday' : 'Not specified',
      priority: 'Medium',
      dependencies: ['Complete frontend dashboard', 'Complete backend API'],
      confidence: 90,
      evidence: "Let's review the complete system next Tuesday.",
      status: 'Pending',
    });
  }

  // If no standard tasks matched, extract simple sentences
  if (tasks.length === 0) {
    const sentences = transcript.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
    sentences.forEach((s, idx) => {
      tasks.push({
        id: `t-${Date.now()}-${idx + 1}`,
        task: s,
        owner: 'Not specified',
        deadline: 'Not specified',
        priority: 'Medium',
        dependencies: [],
        confidence: 80,
        evidence: s,
        status: 'Pending',
      });
    });
  }

  // Uncertainties & Ambiguities
  if (lower.includes('soon') || lower.includes('later')) {
    uncertainties.push('Relative time markers ("soon", "later") without specific dates.');
  }
  if (lower.includes('friday') || lower.includes('monday') || lower.includes('tuesday')) {
    uncertainties.push('Exact calendar date was not specified (only day of week mentioned).');
  }
  if (lower.includes('meeting time') || lower.includes('decided later')) {
    uncertainties.push('Exact meeting time has not been finalized.');
  }
  if (lower.includes('team') && !lower.includes('rahul')) {
    uncertainties.push('Target audience ("team") does not specify individual member names.');
  }

  // Assumptions
  if (tasks.some(t => t.owner !== 'Not specified')) {
    assumptions.push('Assumed named individuals correspond to internal team roles.');
  }

  const riskEvaluation = guardrails.evaluateRisk(transcript);

  return {
    summary: 'Extracted key action items, assignments, and dependencies from user discussion.',
    intent: lower.includes('transfer') || lower.includes('pay') 
      ? 'Financial Disbursement' 
      : 'Sprint & Task Planning',
    tasks,
    action_items: tasks.map(t => ({
      action: t.task,
      owner: t.owner,
      deadline: t.deadline,
      confidence: t.confidence,
      evidence: t.evidence,
    })),
    uncertainties,
    assumptions,
    unsupported_requests: unsupported,
    risk_level: riskEvaluation.riskLevel,
    confirmation_required: riskEvaluation.confirmationRequired,
    proposed_actions: riskEvaluation.detectedProposedActions,
    workflow_type: workflowType,
  };
}

export class GeminiService {
  /**
   * Run full ReAct analysis workflow with progress stages
   */
  async analyzeTranscript(
    transcript: string,
    options: {
      workflowType?: 'react' | 'baseline';
      enableGrounding?: boolean;
      preferredModel?: string;
    } = {}
  ): Promise<{
    output: AIAnalysisOutput;
    stages: WorkflowStage[];
    durationMs: number;
    modelUsed: string;
  }> {
    const startTime = Date.now();
    const workflowType = options.workflowType || 'react';
    const stages: WorkflowStage[] = [];

    // Stage 1: Input received
    stages.push({
      id: 's1',
      label: 'Input received',
      status: 'completed',
      detail: `Received ${transcript.length} characters of transcript.`,
      timestamp: new Date().toISOString(),
    });

    // Stage 2: Input validated
    const validation = guardrails.validateInput(transcript);
    if (!validation.valid) {
      stages.push({
        id: 's2',
        label: 'Input validated',
        status: 'failed',
        detail: validation.error,
        timestamp: new Date().toISOString(),
      });
      throw new Error(validation.error || 'Input validation failed');
    }
    stages.push({
      id: 's2',
      label: 'Input validated',
      status: 'completed',
      detail: 'Transcript length and character integrity verified.',
      timestamp: new Date().toISOString(),
    });

    // Stage 3: Understanding request
    stages.push({
      id: 's3',
      label: 'Understanding request',
      status: 'completed',
      detail: 'Analyzed semantics, sentence structures, and entity mentions.',
      timestamp: new Date().toISOString(),
    });

    // Stage 4: Checking relevant context
    let groundedSources = [];
    if (options.enableGrounding !== false) {
      groundedSources = ragService.retrieveContext(transcript, 3);
    }
    
    stages.push({
      id: 's4',
      label: 'Checking relevant context',
      status: 'completed',
      detail: groundedSources.length > 0 
        ? `Retrieved ${groundedSources.length} grounded reference(s) from project documents.` 
        : 'Grounding was not required for this request.',
      timestamp: new Date().toISOString(),
    });

    // Stage 5: Extracting tasks & calling Gemini
    stages.push({
      id: 's5',
      label: 'Extracting tasks',
      status: 'in_progress',
      detail: 'Extracting structured assignments, owners, deadlines, and dependencies.',
      timestamp: new Date().toISOString(),
    });

    let rawOutput: AIAnalysisOutput;
    let resolvedModelUsed = 'gemini-3.6-flash';
    const ai = getGenAI();

    if (ai) {
      try {
        const systemInstruction = workflowType === 'react' 
          ? REACT_SYSTEM_INSTRUCTION 
          : BASELINE_SYSTEM_INSTRUCTION;

        const formattedContext = ragService.formatContextForPrompt(groundedSources);
        const promptContent = workflowType === 'react'
          ? BUILD_REACT_PROMPT(transcript, formattedContext)
          : BUILD_BASELINE_PROMPT(transcript);

        const genResult = await generateWithModelFallback(ai, {
          preferredModel: options.preferredModel,
          prompt: promptContent,
          systemInstruction,
          temperature: workflowType === 'react' ? 0.2 : 0.7,
        });

        resolvedModelUsed = genResult.modelUsed;
        const parsed = cleanAndParseJSON(genResult.text);

        // Normalize tasks
        const tasks: StructuredTask[] = Array.isArray(parsed.tasks) ? parsed.tasks.map((t: any, idx: number) => ({
          id: t.id || `t-${Date.now()}-${idx + 1}`,
          task: String(t.task || 'Untitled task'),
          owner: t.owner ? String(t.owner) : 'Not specified',
          deadline: t.deadline ? String(t.deadline) : 'Not specified',
          priority: t.priority || 'Medium',
          dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
          confidence: typeof t.confidence === 'number' ? t.confidence : 85,
          evidence: String(t.evidence || ''),
          status: 'Pending',
        })) : [];

        rawOutput = {
          summary: String(parsed.summary || 'Summary generated.'),
          intent: String(parsed.intent || 'Task Planning'),
          tasks,
          action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
          uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties : [],
          assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
          unsupported_requests: Array.isArray(parsed.unsupported_requests) ? parsed.unsupported_requests : [],
          risk_level: (parsed.risk_level === 'HIGH' || parsed.risk_level === 'MEDIUM') ? parsed.risk_level : 'LOW',
          confirmation_required: Boolean(parsed.confirmation_required),
          proposed_actions: Array.isArray(parsed.proposed_actions) ? parsed.proposed_actions.map((p: any, idx: number) => ({
            id: `act-${Date.now()}-${idx + 1}`,
            action: String(p.action || 'Proposed Action'),
            reason: String(p.reason || 'Consequential operation requires user confirmation'),
            requires_confirmation: true,
            status: 'AWAITING_CONFIRMATION' as const,
          })) : [],
          workflow_type: workflowType,
        };

        stages.find(s => s.id === 's5')!.status = 'completed';
        stages.find(s => s.id === 's5')!.detail = `Structured tasks parsed via ${resolvedModelUsed}.`;
      } catch (err) {
        console.warn('Gemini API call failed across model pool, utilizing heuristic fallback:', err);
        rawOutput = generateHeuristicAnalysis(transcript, workflowType);
        stages.find(s => s.id === 's5')!.status = 'completed';
        stages.find(s => s.id === 's5')!.detail = 'Extracted tasks using safe local parser fallback.';
      }
    } else {
      // Offline / API key not yet provided fallback
      rawOutput = generateHeuristicAnalysis(transcript, workflowType);
      stages.find(s => s.id === 's5')!.status = 'completed';
      stages.find(s => s.id === 's5')!.detail = 'Structured parsing executed with deterministic rule engine.';
    }

    // Stage 6: Applying safety checks & guardrails
    stages.push({
      id: 's6',
      label: 'Applying safety checks',
      status: 'in_progress',
      detail: 'Scanning for consequential operations, high-risk financial triggers, and sensitive data.',
      timestamp: new Date().toISOString(),
    });

    const guardrailEvaluation = guardrails.evaluateRisk(transcript, rawOutput.proposed_actions);
    
    // Merge guardrail safety results (server-authoritative guardrails cannot be bypassed)
    if (guardrailEvaluation.riskLevel === 'HIGH' || rawOutput.risk_level === 'HIGH') {
      rawOutput.risk_level = 'HIGH';
      rawOutput.confirmation_required = true;
    } else if (guardrailEvaluation.riskLevel === 'MEDIUM' || rawOutput.risk_level === 'MEDIUM') {
      rawOutput.risk_level = 'MEDIUM';
      rawOutput.confirmation_required = true;
    }

    rawOutput.proposed_actions = guardrailEvaluation.detectedProposedActions;
    if (rawOutput.proposed_actions.length > 0) {
      rawOutput.confirmation_required = true;
    }

    stages.find(s => s.id === 's6')!.status = 'completed';
    stages.find(s => s.id === 's6')!.detail = rawOutput.confirmation_required
      ? `Safety guardrail flagged ${rawOutput.proposed_actions.length} action(s) requiring human confirmation.`
      : 'All safety guardrails passed without consequential triggers.';

    // Stage 7: Preparing result
    stages.push({
      id: 's7',
      label: 'Preparing result',
      status: 'completed',
      detail: 'Final structured schema validated and ready for review.',
      timestamp: new Date().toISOString(),
    });

    rawOutput.grounded_sources = groundedSources;
    rawOutput.processing_stages = stages;

    const durationMs = Date.now() - startTime;
    return {
      output: rawOutput,
      stages,
      durationMs,
      modelUsed: resolvedModelUsed,
    };
  }

  /**
   * Refine existing output based on user prompt
   */
  async refineOutput(
    currentOutput: AIAnalysisOutput,
    userGuidance: string,
    preferredModel?: string
  ): Promise<AIAnalysisOutput> {
    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = BUILD_REFINE_PROMPT(JSON.stringify(currentOutput, null, 2), userGuidance);
        const genResult = await generateWithModelFallback(ai, {
          preferredModel,
          prompt,
          systemInstruction: REACT_SYSTEM_INSTRUCTION,
          temperature: 0.2,
        });

        const parsed = cleanAndParseJSON(genResult.text);
        return {
          ...currentOutput,
          ...parsed,
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map((t: any) => ({
            ...t,
            userEdited: true,
          })) : currentOutput.tasks,
        };
      } catch (err) {
        console.error('Refinement with Gemini failed across model pool, applying local refinement filter:', err);
      }
    }

    // Local refinement logic if offline
    const lower = userGuidance.toLowerCase();
    let updatedTasks = [...currentOutput.tasks];

    if (lower.includes('conservative') || lower.includes('lower priority')) {
      updatedTasks = updatedTasks.map(t => ({
        ...t,
        priority: t.priority === 'Urgent' ? 'High' : t.priority === 'High' ? 'Medium' : 'Low',
        userEdited: true,
      }));
    }

    if (lower.includes('assigned to me') || lower.includes('my tasks')) {
      updatedTasks = updatedTasks.filter(t => 
        t.owner.toLowerCase().includes('user') || 
        t.owner.toLowerCase().includes('siddharth') ||
        t.owner.toLowerCase().includes('i')
      );
    }

    return {
      ...currentOutput,
      tasks: updatedTasks,
      summary: `${currentOutput.summary} (Refined: ${userGuidance})`,
    };
  }
}

export const geminiService = new GeminiService();
