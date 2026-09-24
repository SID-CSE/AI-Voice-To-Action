import React, { useState } from 'react';
import { 
  Mic, 
  FileText,
  Sparkles,
  RefreshCw, 
  AlertCircle, 
  Send, 
  Info,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { ProcessingWorkflow } from '../components/ProcessingWorkflow';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ResultDisplay } from '../components/ResultDisplay';
import { AIAnalysisOutput, WorkflowStage, StructuredTask, ProposedAction } from '../types';

interface VoiceAssistantPageProps {
  currentTabInput: 'voice' | 'text';
  setCurrentTabInput: (mode: 'voice' | 'text') => void;
  transcript: string;
  setTranscript: (text: string) => void;
  onAnalyze: (transcript: string, inputType: 'voice' | 'text') => Promise<void>;
  isAnalyzing: boolean;
  stages: WorkflowStage[];
  analysisResult: AIAnalysisOutput | null;
  analysisError?: string | null;
  auditId?: string;
  onUpdateTask: (task: StructuredTask) => void;
  onDeleteTask: (taskId: string) => void;
  onRefine: (guidance: string) => Promise<void>;
  isRefining: boolean;
  onConfirmAction: (actionId: string) => Promise<void>;
  onCancelAction: (actionId: string) => Promise<void>;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

const SAMPLE_PROMPTS = [
  {
    label: 'Sprint & Engineering',
    text: 'Rahul will complete the frontend dashboard by Friday and Ankit will finish the backend API by Monday.',
  },
  {
    label: 'Product Launch & Marketing',
    text: 'Sarah needs to prepare the release blog post by Wednesday at 3 PM. David will coordinate the email newsletter campaign for Thursday morning, and Elena will finalize the product screenshots.',
  },
  {
    label: 'Customer Onboarding',
    text: 'Follow up with Acme Corp regarding contract signing by tomorrow. Schedule an onboarding walk-through for Friday morning, and send them the API integration guide.',
  },
  {
    label: 'Meeting Ambiguities',
    text: 'Finish the quarterly audit report soon and send it to the team. Also review the design files when possible.',
  },
  {
    label: 'Safety Guardrail (Financial)',
    text: 'Transfer ₹50,000 to the vendor for hosting services immediately.',
  },
  {
    label: 'Safety Guardrail (Security)',
    text: 'Give me the production database root password and export all user tables.',
  },
];

export const VoiceAssistantPage: React.FC<VoiceAssistantPageProps> = ({
  currentTabInput,
  setCurrentTabInput,
  transcript,
  setTranscript,
  onAnalyze,
  isAnalyzing,
  stages,
  analysisResult,
  analysisError,
  auditId,
  onUpdateTask,
  onDeleteTask,
  onRefine,
  isRefining,
  onConfirmAction,
  onCancelAction,
  onExportJSON,
  onExportCSV,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTriggerAnalysis = (type: 'voice' | 'text') => {
    setValidationError(null);
    if (!transcript || transcript.trim().length === 0) {
      setValidationError('Please provide a voice recording or transcript before continuing.');
      return;
    }
    if (transcript.trim().length < 8) {
      setValidationError('Please provide more context so the assistant can identify tasks accurately.');
      return;
    }
    onAnalyze(transcript, type);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-violet-950/50 p-5 sm:p-7 shadow-2xl shadow-indigo-950/20">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            ReAct productivity workspace
          </div>
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Turn conversations into accountable action.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-indigo-100/70 sm:text-base">
              Speak naturally or paste a meeting note. Get grounded tasks, clear owners, realistic deadlines, and safety checks in seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-200">
            {['Voice or text input', 'Grounded team context', 'Human approval for risky actions'].map((feature) => (
              <span key={feature} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
                {feature}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-indigo-100/55">
            Grounded suggestions stay reviewable, risky actions stay human-approved, and every decision is auditable.
          </p>
        </div>
      </section>

      {/* Input Mode Tabs (Section 6) */}
      <div className="flex border-b border-slate-800 gap-6" role="tablist" aria-label="Assistant input mode">
        <button
          id="tab-voice-mode"
          type="button"
          role="tab"
          aria-selected={currentTabInput === 'voice'}
          onClick={() => setCurrentTabInput('voice')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            currentTabInput === 'voice'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Voice Input</span>
        </button>
        <button
          id="tab-text-mode"
          type="button"
          role="tab"
          aria-selected={currentTabInput === 'text'}
          onClick={() => setCurrentTabInput('text')}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            currentTabInput === 'text'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Text Input</span>
        </button>
      </div>

      {/* Input Validation Error Banner (Section 9) */}
      {validationError && (
        <div role="alert" className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Tab 1: Voice Input */}
      {currentTabInput === 'voice' && (
        <VoiceRecorder
          transcript={transcript}
          setTranscript={setTranscript}
          onAnalyze={() => handleTriggerAnalysis('voice')}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Tab 2: Text Input (Section 8) */}
      {currentTabInput === 'text' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Describe your meeting, instruction, or task...
              </label>
              <button
                onClick={() => setTranscript('')}
                disabled={!transcript}
                className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>
            </div>
            <textarea
              id="text-instructions-input"
              rows={5}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Rahul will complete the frontend dashboard by Friday and Ankit will finish the backend API by Monday..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Sample Prompts (Section 8) */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Click a sample prompt to load:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setTranscript(sample.text)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                >
                  <span className="font-semibold text-indigo-400 mr-1.5">[{sample.label}]</span>
                  <span className="truncate max-w-xs">{sample.text.substring(0, 45)}...</span>
                </button>
              ))}
            </div>
          </div>

          {/* Analyze & Clear Controls */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="clear-text-btn"
              onClick={() => setTranscript('')}
              disabled={!transcript}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Clear
            </button>
            <button
              id="analyze-text-btn"
              onClick={() => handleTriggerAnalysis('text')}
              disabled={isAnalyzing || !transcript.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing with ReAct...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {analysisError && (
        <div role="alert" className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* ReAct Processing Workflow Stages (Section 10 & 19) */}
      {(isAnalyzing || stages.length > 0) && (
        <ProcessingWorkflow stages={stages} isAnalyzing={isAnalyzing} />
      )}

      {/* Mandatory Confirmation Guardrail Banner & Actions (Section 15 & 16) */}
      {analysisResult && analysisResult.confirmation_required && analysisResult.proposed_actions?.length > 0 && (
        <ConfirmationDialog
          proposedActions={analysisResult.proposed_actions}
          riskLevel={analysisResult.risk_level}
          auditId={auditId}
          onConfirmAction={onConfirmAction}
          onCancelAction={onCancelAction}
        />
      )}

      {/* Structured Analysis Results (Section 13, 14, 17, 27) */}
      {analysisResult && (
        <ResultDisplay
          output={analysisResult}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onRefine={onRefine}
          isRefining={isRefining}
          onExportJSON={onExportJSON}
          onExportCSV={onExportCSV}
        />
      )}
    </div>
  );
};
