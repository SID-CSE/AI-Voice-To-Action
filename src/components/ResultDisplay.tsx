import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  AlertTriangle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Send, 
  Download, 
  FileText, 
  Table, 
  LayoutGrid, 
  ShieldCheck, 
  ShieldAlert, 
  BookOpen, 
  Link2,
  ExternalLink,
  Check
} from 'lucide-react';
import { AIAnalysisOutput, StructuredTask, TaskPriority, TaskStatus, GroundedSource } from '../types';

interface ResultDisplayProps {
  output: AIAnalysisOutput;
  onUpdateTask: (task: StructuredTask) => void;
  onDeleteTask: (taskId: string) => void;
  onRefine: (guidance: string) => Promise<void>;
  isRefining: boolean;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  output,
  onUpdateTask,
  onDeleteTask,
  onRefine,
  isRefining,
  onExportJSON,
  onExportCSV,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [refinementInput, setRefinementInput] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StructuredTask>>({});

  const toggleEvidence = (id: string) => {
    setExpandedEvidence(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEdit = (task: StructuredTask) => {
    setEditingTaskId(task.id);
    setEditForm({ ...task });
  };

  const handleSaveEdit = () => {
    if (editingTaskId && editForm) {
      onUpdateTask(editForm as StructuredTask);
      setEditingTaskId(null);
    }
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementInput.trim() || isRefining) return;
    await onRefine(refinementInput);
    setRefinementInput('');
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const getStatusBadgeClass = (status?: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Intent & Summary Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Detected Intent:</span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-xs">
              {output.intent || 'Sprint Planning'}
            </span>
          </div>

          {/* Export and Views */}
          <div className="flex items-center gap-2">
            <button
              id="export-csv-btn"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              id="export-json-btn"
              onClick={onExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Executive Summary
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            {output.summary}
          </p>
        </div>

        {/* Risk & Safety Assessment Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          output.risk_level === 'HIGH'
            ? 'bg-red-950/30 border-red-800/60 text-red-300'
            : output.risk_level === 'MEDIUM'
            ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {output.risk_level === 'LOW' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-xs">Risk Assessment: {output.risk_level}</span>
              <p className="text-[11px] opacity-85 mt-0.5">
                {output.risk_level === 'HIGH' 
                  ? 'High consequential actions detected. Mandatory human authorization required before execution.'
                  : output.risk_level === 'MEDIUM'
                  ? 'Potential stakeholder communications or non-trivial workflow impact detected.'
                  : 'Low risk. Routine task extraction without irreversible state modifications.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section (Section 13 & 14) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Structured Tasks ({output.tasks?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-400">
              Interactive & Editable
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Table view"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {output.tasks?.map((task) => {
              const isEditing = editingTaskId === task.id;
              const isEvidenceOpen = !!expandedEvidence[task.id];

              if (isEditing) {
                return (
                  <div key={task.id} className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/50 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Task Title</label>
                      <input
                        type="text"
                        value={editForm.task || ''}
                        onChange={(e) => setEditForm({ ...editForm, task: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Owner</label>
                        <input
                          type="text"
                          value={editForm.owner || ''}
                          onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Deadline</label>
                        <input
                          type="text"
                          value={editForm.deadline || ''}
                          onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Priority</label>
                        <select
                          value={editForm.priority || 'Medium'}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold">Status</label>
                        <select
                          value={editForm.status || 'Pending'}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingTaskId(null)}
                        className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {task.task}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority || 'Medium'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-200 font-medium">{task.owner}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-300">{task.deadline}</span>
                      </span>
                      {task.confidence && (
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                          {task.confidence}% match
                        </span>
                      )}
                    </div>

                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Link2 className="w-3 h-3 text-amber-400" />
                        <span>Depends on: {task.dependencies.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Evidence accordion (Section 13: "Why was this task extracted?") */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleEvidence(task.id)}
                      className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-indigo-300 py-1 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3 h-3 text-indigo-400" />
                        Why was this task extracted?
                      </span>
                      {isEvidenceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isEvidenceOpen && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 font-mono italic">
                        "{task.evidence || 'Extracted directly from provided statement.'}"
                      </div>
                    )}
                  </div>

                  {/* Task Actions and Status selector */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => onUpdateTask({ ...task, status, userEdited: true })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                            task.status === status
                              ? getStatusBadgeClass(status)
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit Task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 uppercase font-bold text-[10px] text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {output.tasks?.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white max-w-xs">{task.task}</td>
                    <td className="py-3 px-4 text-slate-300">{task.owner}</td>
                    <td className="py-3 px-4 text-slate-300">{task.deadline}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{task.confidence}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(task.status)}`}>
                        {task.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-slate-400 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Items Cards (Section 13) */}
      {output.action_items && output.action_items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Action Items Flow
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {output.action_items.map((act, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <User className="w-3.5 h-3.5" />
                  <span>{act.owner}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-300">{act.deadline}</span>
                </div>
                <p className="text-xs text-white font-medium">
                  {act.action}
                </p>
                {act.evidence && (
                  <p className="text-[10px] text-slate-500 italic line-clamp-1">
                    "{act.evidence}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uncertainties & Assumptions Grid (Section 9 & 13) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Uncertainties */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Detected Uncertainties ({output.uncertainties?.length || 0})
            </h4>
          </div>
          {output.uncertainties && output.uncertainties.length > 0 ? (
            <ul className="space-y-1.5">
              {output.uncertainties.map((unc, idx) => (
                <li key={idx} className="text-xs text-amber-200/90 flex items-start gap-2 bg-amber-950/20 p-2 rounded-lg border border-amber-900/30">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{unc}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No significant uncertainties detected.</p>
          )}
        </div>

        {/* Assumptions (Clearly separated from facts) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-400">
            <HelpCircle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Assumptions vs Facts ({output.assumptions?.length || 0})
            </h4>
          </div>
          {output.assumptions && output.assumptions.length > 0 ? (
            <ul className="space-y-1.5">
              {output.assumptions.map((assump, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{assump}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No unverified assumptions made.</p>
          )}
        </div>
      </div>

      {/* Grounded Sources Panel (Section 17) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Grounded Context (RAG)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            {output.grounded_sources && output.grounded_sources.length > 0
              ? `${output.grounded_sources.length} document citation(s)`
              : 'Direct Transcript Analysis'}
          </span>
        </div>

        {output.grounded_sources && output.grounded_sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {output.grounded_sources.map((src, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{src.docTitle}</span>
                  <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    {src.relevanceScore}% relevance
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-3 italic">
                  "{src.excerpt}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400 italic">
            Grounding was not required for this request.
          </div>
        )}
      </div>

      {/* Refine Result Component (Section 27) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Refine Generated Result
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Instruct the assistant to adjust priorities or filter tasks
          </span>
        </div>

        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            id="refine-instruction-input"
            type="text"
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            disabled={isRefining}
            placeholder="e.g. 'Make priorities more conservative', 'Only show tasks assigned to Rahul'..."
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            id="refine-submit-btn"
            type="submit"
            disabled={isRefining || !refinementInput.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isRefining ? 'Refining...' : 'Apply Refinement'}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span>Quick Refinements:</span>
          <button
            type="button"
            onClick={() => onRefine('Make the task priorities more conservative.')}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
          >
            Conservative Priorities
          </button>
          <button
            type="button"
            onClick={() => onRefine('Only show tasks assigned to me or user.')}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
          >
            Only My Tasks
          </button>
        </div>
      </div>
    </div>
  );
};
