import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckSquare, FileText, Keyboard, Mic, Search, Settings, ShieldAlert, X } from 'lucide-react';
import { AuditRecord, KnowledgeDocument, StructuredTask } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onStartVoice: () => void;
  tasks: StructuredTask[];
  documents: KnowledgeDocument[];
  auditLogs: AuditRecord[];
}

const navigation = [
  { id: 'dashboard', label: 'Open dashboard', icon: ArrowRight },
  { id: 'assistant', label: 'Open voice assistant', icon: Mic },
  { id: 'tasks', label: 'Open tasks', icon: CheckSquare },
  { id: 'knowledge', label: 'Open knowledge base', icon: FileText },
  { id: 'audit', label: 'Open audit logs', icon: ShieldAlert },
  { id: 'settings', label: 'Open settings', icon: Settings },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onNavigate,
  onStartVoice,
  tasks,
  documents,
  auditLogs,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const commands = [
      { id: 'voice', label: 'Start voice capture', hint: 'Begin a new transcript', icon: Mic, action: onStartVoice },
      ...navigation.map((item) => ({ ...item, action: () => onNavigate(item.id) })),
      ...tasks.slice(0, 5).map((task) => ({ id: `task-${task.id}`, label: task.task, hint: `Task · ${task.owner}`, icon: CheckSquare, action: () => onNavigate('tasks') })),
      ...documents.slice(0, 5).map((doc) => ({ id: `doc-${doc.id}`, label: doc.title, hint: `Knowledge · ${doc.category}`, icon: FileText, action: () => onNavigate('knowledge') })),
      ...auditLogs.slice(0, 5).map((log) => ({ id: `audit-${log.id}`, label: log.aiOutput?.summary || 'Audit event', hint: `Audit · ${log.riskLevel}`, icon: ShieldAlert, action: () => onNavigate('audit') })),
    ];
    return normalized
      ? commands.filter((item) => `${item.label} ${item.hint || ''}`.toLowerCase().includes(normalized))
      : commands.slice(0, 9);
  }, [auditLogs, documents, onNavigate, onStartVoice, query, tasks]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center bg-slate-950/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-slate-950/50" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-800 px-4">
          <Search className="h-4 w-4 text-indigo-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands, tasks, knowledge..."
            className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            aria-label="Search commands"
          />
          <kbd className="hidden items-center gap-1 rounded-md border border-slate-700 px-1.5 py-1 text-[10px] text-slate-500 sm:flex"><Keyboard className="h-3 w-3" />ESC</kbd>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Close command palette"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-slate-500">No matching commands or workspace records.</p>
          ) : results.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { item.action(); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-indigo-500/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-indigo-400"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-100">{item.label}</span><span className="block truncate text-[11px] text-slate-500">{item.hint || 'Command'}</span></span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5 text-[10px] text-slate-500"><span>ActionFlow command palette</span><span>Use ↑ ↓ and Enter</span></div>
      </div>
    </div>
  );
};