import React from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  CircleDot, 
  AlertCircle, 
  ShieldCheck, 
  Cpu, 
  Database, 
  ArrowRight 
} from 'lucide-react';
import { WorkflowStage } from '../types';

interface ProcessingWorkflowProps {
  stages: WorkflowStage[];
  isAnalyzing: boolean;
  activeStageIndex?: number;
}

const DEFAULT_STAGES: WorkflowStage[] = [
  { id: 's1', label: 'Input received', status: 'completed', detail: 'Spoken transcript or text instructions captured.' },
  { id: 's2', label: 'Input validated', status: 'completed', detail: 'Integrity, length, and formatting checks passed.' },
  { id: 's3', label: 'Understanding request', status: 'completed', detail: 'Semantics, intent, and entities classified.' },
  { id: 's4', label: 'Checking relevant context', status: 'completed', detail: 'Cross-referenced project knowledge base.' },
  { id: 's5', label: 'Extracting tasks', status: 'completed', detail: 'Structured tasks, owners, deadlines, and dependencies extracted.' },
  { id: 's6', label: 'Applying safety checks', status: 'completed', detail: 'Consequential action detection and guardrails evaluated.' },
  { id: 's7', label: 'Preparing result', status: 'completed', detail: 'Structured JSON ready with evidence citations.' },
];

export const ProcessingWorkflow: React.FC<ProcessingWorkflowProps> = ({
  stages = [],
  isAnalyzing,
}) => {
  const displayStages = stages.length > 0 ? stages : DEFAULT_STAGES;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            ReAct Processing Workflow
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            High-Level Agent Stages
          </span>
        </div>
      </div>

      {/* Horizontal / Grid Workflow Step Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {displayStages.map((stage, idx) => {
          const isDone = stage.status === 'completed';
          const isInProgress = stage.status === 'in_progress';
          const isFailed = stage.status === 'failed';

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-950/60 border-indigo-900/40 text-slate-200'
                  : isInProgress
                  ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 shadow-sm shadow-indigo-500/10'
                  : isFailed
                  ? 'bg-red-950/30 border-red-800 text-red-300'
                  : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                  Step {idx + 1}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : isInProgress ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                ) : isFailed ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ) : (
                  <CircleDot className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </div>

              <div className="text-[11px] font-semibold leading-snug line-clamp-2">
                {stage.label}
              </div>

              {stage.detail && (
                <div className="mt-1 text-[10px] text-slate-400 line-clamp-2 font-normal">
                  {stage.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
