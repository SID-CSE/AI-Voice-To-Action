import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  ArrowRight,
  Info
} from 'lucide-react';
import { ProposedAction, RiskLevel } from '../types';

interface ConfirmationDialogProps {
  proposedActions: ProposedAction[];
  riskLevel: RiskLevel;
  auditId?: string;
  onConfirmAction: (actionId: string) => Promise<void>;
  onCancelAction: (actionId: string) => Promise<void>;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  proposedActions,
  riskLevel,
  auditId,
  onConfirmAction,
  onCancelAction,
}) => {
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  if (!proposedActions || proposedActions.length === 0) {
    return null;
  }

  const handleConfirm = async (actionId: string) => {
    setLoadingActionId(actionId);
    try {
      await onConfirmAction(actionId);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCancel = async (actionId: string) => {
    setLoadingActionId(actionId);
    try {
      await onCancelAction(actionId);
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 space-y-4 shadow-lg shadow-amber-950/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Mandatory Confirmation Guardrail
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                riskLevel === 'HIGH'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {riskLevel} RISK ACTION DETECTED
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              The AI detected operations with significant real-world consequences. Explicit user authorization is required.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Safety Notice (Section 15) */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-100">Execution Status:</span>
          <span className="text-slate-300">No action has been executed automatically.</span>
        </div>
        <span className="text-[11px] font-mono text-amber-400 font-medium">Awaiting Authorization</span>
      </div>

      {/* Proposed Actions List */}
      <div className="space-y-3">
        {proposedActions.map((item, idx) => {
          const isConfirmed = item.status === 'CONFIRMED';
          const isCancelled = item.status === 'CANCELLED';
          const isPending = !isConfirmed && !isCancelled;
          const isLoading = loadingActionId === item.id;

          return (
            <div
              key={item.id || idx}
              className={`p-4 rounded-xl border transition-all ${
                isConfirmed
                  ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-200'
                  : isCancelled
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                  : 'bg-slate-900 border-amber-700/50 text-slate-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.category || 'Consequential Action'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {item.action}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Risk Reason:</span> {item.reason}
                  </p>
                </div>

                {/* Status or Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {isConfirmed ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmed (Demo Logged)</span>
                    </div>
                  ) : isCancelled ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
                      <XCircle className="w-4 h-4" />
                      <span>Cancelled by User</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        id={`cancel-action-btn-${idx}`}
                        onClick={() => handleCancel(item.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id={`confirm-action-btn-${idx}`}
                        onClick={() => handleConfirm(item.id)}
                        disabled={isLoading}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {isLoading ? 'Recording...' : 'Authorize Action'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isConfirmed && item.executionNote && (
                <div className="mt-2.5 pt-2 border-t border-emerald-900/40 text-[11px] text-emerald-300/90 font-mono">
                  ✓ {item.executionNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
