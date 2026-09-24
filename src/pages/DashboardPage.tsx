import React from 'react';
import { 
  CheckSquare, 
  Clock, 
  ShieldAlert,
  Sparkles,
  Mic, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Database,
  Search,
  ExternalLink
} from 'lucide-react';
import { RiskLevel } from '../types';

interface DashboardProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    pendingConfirmation: number;
    totalAnalyses: number;
    totalAuditRecords: number;
    knowledgeSources: number;
    highRiskActions: number;
  };
  recentAnalyses: any[];
  onNavigateToVoice: () => void;
  onNavigateToText: () => void;
  onTryDemo: () => void;
  onViewAnalysis: (analysis: any) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({
  stats,
  recentAnalyses,
  onNavigateToVoice,
  onNavigateToText,
  onTryDemo,
  onViewAnalysis,
}) => {
  const workflowSteps = [
    { title: 'Input', desc: 'Voice or Text', icon: Mic },
    { title: 'Speech-to-Text', desc: 'Continuous stream', icon: Volume2Icon },
    { title: 'Validation', desc: 'Length & integrity', icon: CheckCircle2 },
    { title: 'Retrieval', desc: 'RAG Knowledge base', icon: Database },
    { title: 'Gemini', desc: 'Reasoning model', icon: Sparkles },
    { title: 'Structured Output', desc: 'Tasks & dependencies', icon: Layers },
    { title: 'Guardrails', desc: 'Consequential check', icon: ShieldAlert },
    { title: 'Confirmation', desc: 'Human authorization', icon: AlertTriangle },
    { title: 'Audit', desc: 'Immutable log', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-400">Workspace pulse</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Turn conversations into accountable work.</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">A live view of the tasks, grounding sources, and human reviews moving through ActionFlow AI.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-[11px] text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Workspace protected by guardrails</div>
      </div>

      {/* Metric Cards (Section 5) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Open Tasks</span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {stats.totalTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalTasks === 0 ? 'No data yet' : `${stats.pendingTasks + stats.inProgressTasks} need attention`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {stats.completedTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalTasks > 0
              ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% completion rate`
              : '0% completed'}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          stats.pendingConfirmation > 0
            ? 'bg-amber-950/30 border-amber-800/60 shadow-md shadow-amber-950/20'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className={`text-xs font-semibold ${stats.pendingConfirmation > 0 ? 'text-amber-400 font-bold' : ''}`}>
              Pending Conf.
            </span>
            <ShieldAlert className={`w-4 h-4 ${stats.pendingConfirmation > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono ${
            stats.pendingConfirmation > 0 ? 'text-amber-400' : 'text-white'
          }`}>
            {stats.pendingConfirmation}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Consequential actions
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">AI Analyses</span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {stats.totalAnalyses}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Transcripts processed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Audit Records</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {stats.totalAuditRecords}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalAuditRecords === 0 ? 'No data yet' : 'Logged event traces'}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2"><span className="text-xs font-semibold">Knowledge</span><Database className="w-4 h-4 text-sky-400" /></div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.knowledgeSources}</div>
          <div className="text-[11px] text-slate-500 mt-1">Grounding sources</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2"><span className="text-xs font-semibold">High Risk</span><ShieldAlert className="w-4 h-4 text-red-400" /></div>
          <div className="text-2xl sm:text-3xl font-bold text-red-300 font-mono">{stats.highRiskActions}</div>
          <div className="text-[11px] text-slate-500 mt-1">{stats.highRiskActions === 0 ? 'No blocked actions' : 'Review required'}</div>
        </div>
      </div>

      {/* System Workflow Visualization (Section 5 & 19) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Responsible AI Workflow Architecture
            </h3>
            <p className="text-xs text-slate-400">
              End-to-end execution path with RAG grounding and mandatory confirmation guardrails
            </p>
          </div>
          <button onClick={onTryDemo} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Demo Flow</span>
          </button>
        </div>

        {/* Interactive Step Chain */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 pt-2">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center space-y-1 hover:border-indigo-500/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mb-1">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-200 leading-tight">
                  {step.title}
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State / Welcome Hero (Section 34) */}
      {recentAnalyses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 sm:p-12 text-center bg-slate-900/30 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Mic className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Turn conversations into action.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Speak naturally or paste a transcript. The assistant extracts tasks, owners, deadlines, action items, and uncertainties.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="empty-start-voice-btn"
              onClick={onNavigateToVoice}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Start Voice Assistant</span>
            </button>
            <button
              id="empty-enter-text-btn"
              onClick={onNavigateToText}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Enter Text</span>
            </button>
              <button onClick={onTryDemo} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer">
              <Sparkles className="w-4 h-4" />
              <span>Try Demo</span>
            </button>
          </div>
        </div>
      ) : (
        /* Recent Analyses Table (Section 5) */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Recent Analyses
            </h3>
            <span className="text-xs text-slate-400">
              {recentAnalyses.length} total entries
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 uppercase font-bold text-[10px] text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Input Type</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Tasks</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentAnalyses.slice(0, 8).map((an) => {
                  const dateStr = new Date(an.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const outputData = an.aiOutput || an.output;
                  const riskLevel = an.riskLevel || outputData?.risk_level || 'LOW';
                  const summaryText = outputData?.summary || an.transcript || 'No summary available';
                  const taskCount = outputData?.tasks?.length ?? 0;
                  const isAwaitingConf = 
                    an.confirmationStatus === 'AWAITING_CONFIRMATION' ||
                    (an.confirmationRequired ?? outputData?.confirmation_required);
                  const confStatus = an.confirmationStatus || (outputData?.confirmation_required ? 'AWAITING_CONFIRMATION' : 'NOT_REQUIRED');

                  return (
                    <tr key={an.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-slate-800 text-slate-300">
                          {an.inputType || 'text'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-sm truncate" title={summaryText}>
                        {summaryText}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400 font-bold">
                        {taskCount}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          riskLevel === 'HIGH'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {confStatus === 'CONFIRMED' ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            Confirmed
                          </span>
                        ) : confStatus === 'CANCELLED' ? (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                            Cancelled
                          </span>
                        ) : isAwaitingConf ? (
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                            Awaiting Conf.
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400">
                            Processed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewAnalysis(an)}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] hover:underline cursor-pointer"
                        >
                          View Result
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function Volume2Icon(props: any) {
  return (
    <svg 
      {...props} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      viewBox="0 0 24 24"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  );
}
