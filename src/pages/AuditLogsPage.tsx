import React, { useState } from 'react';
import { 
  ShieldAlert,
  Search,
  Trash2,

  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Layers, 
  UserCheck, 
  Cpu,
  ChevronRight
} from 'lucide-react';
import { AuditRecord, RiskLevel, ConfirmationStatus } from '../types';

interface AuditLogsPageProps {
  logs: AuditRecord[];
  onClearLogs: () => Promise<void>;
  onRefreshLogs: () => Promise<void>;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({
  logs,
  onClearLogs,
  onRefreshLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConfirmationStatus>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.aiOutput?.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || log.riskLevel === riskFilter;
    const matchesStatus = statusFilter === 'ALL' || log.confirmationStatus === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const getStatusBadge = (status: ConfirmationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'AWAITING_CONFIRMATION':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CANCELLED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800/60 text-slate-400 border-slate-700/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <span>Audit Logs & Accountability Trail</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable trace of transcripts, model versions, retrieved context, risk levels, and human authorizations.
          </p>
        </div>
        <button
          onClick={() => { if (window.confirm('Clear all audit logs? This cannot be undone.')) onClearLogs(); }}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs font-medium border border-slate-700 disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search transcript, summary, or audit ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">LOW Risk</option>
            <option value="MEDIUM">MEDIUM Risk</option>
            <option value="HIGH">HIGH Risk</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Confirmation Statuses</option>
            <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NOT_REQUIRED">Not Required</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 uppercase font-bold text-[10px] text-slate-400 tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Transcript Preview</th>
              <th className="py-3.5 px-4">Risk Level</th>
              <th className="py-3.5 px-4">Confirmation</th>
              <th className="py-3.5 px-4">Context Grounded</th>
              <th className="py-3.5 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No audit records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                        {log.inputType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-medium text-white">
                      {log.transcript}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadge(log.riskLevel)}`}>
                        {log.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(log.confirmationStatus)}`}>
                        {log.confirmationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {log.retrievedContext?.length > 0 ? (
                        <span className="text-indigo-400">
                          {log.retrievedContext.length} source(s)
                        </span>
                      ) : (
                        <span className="text-slate-600">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(log)}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Audit Record Inspector Modal (Section 22) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Audit Record Trace</span>
                  <span className="text-xs font-mono text-slate-400">({selectedRecord.id})</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(selectedRecord.timestamp).toISOString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Risk Level</span>
                  <span className={`font-bold ${
                    selectedRecord.riskLevel === 'HIGH' ? 'text-red-400' : 'text-slate-200'
                  }`}>{selectedRecord.riskLevel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Confirmation</span>
                  <span className="font-mono text-slate-200">{selectedRecord.confirmationStatus}</span>
                </div>
              </div>

              {/* Original Transcript */}
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Original Spoken Transcript / Text:
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                  {selectedRecord.transcript}
                </div>
              </div>

              {/* Retrieved Context Sources */}
              {selectedRecord.retrievedContext && selectedRecord.retrievedContext.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Retrieved Grounded Sources:
                  </span>
                  <div className="space-y-2">
                    {selectedRecord.retrievedContext.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                        <div className="font-bold text-indigo-300">{c.docTitle} ({c.relevanceScore}% match)</div>
                        <p className="text-slate-400 italic mt-0.5">"{c.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured AI Output */}
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Full Structured AI Output JSON:
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-indigo-300 font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedRecord.aiOutput, null, 2)}
                </pre>
              </div>

              {/* Execution Action Logs */}
              {selectedRecord.executedActions && selectedRecord.executedActions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Consequential Authorization History:
                  </span>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] space-y-1 text-emerald-300">
                    {selectedRecord.executedActions.map((act, i) => (
                      <div key={i}>
                        ✓ [{act.status}] {act.action} — {act.note} ({new Date(act.confirmedAt || '').toLocaleTimeString()})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
