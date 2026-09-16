import React, { useState } from 'react';
import { 
  Settings, 
  Cpu, 
  ShieldCheck, 
  Database, 
  Sliders, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Server,
  Lock,
  Info
} from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsPageProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  onResetData: () => Promise<void>;
  apiConnected: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  apiConnected,
}) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = async () => {
    await onUpdateSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>System Settings & Architecture Configuration</span>
        </h2>
        <p className="text-xs text-slate-400">
          Tune agent reasoning parameters, RAG grounding, risk thresholds, and inspect backend health.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System configuration saved successfully.</span>
        </div>
      )}

      {/* Backend & Environment Health Status */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Runtime Environment & Backend Health</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[11px]">Server Proxy</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-white">
              <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>Express API :3000</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Status: Active</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[11px]">Storage Engine</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Local JSON Store</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Persistence: Enabled</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[11px]">Gemini Reasoning API</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Server-Side Orchestration</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Model: {localSettings.modelName}</span>
          </div>
        </div>
      </div>

      {/* Model & Reasoning Configuration */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Model & Reasoning Parameters</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium block">
                Active Gemini Model
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 font-medium">
                Auto-Failover Enabled
              </span>
            </div>
            <select
              value={localSettings.modelName || localSettings.model || 'gemini-3.6-flash'}
              onChange={(e) => setLocalSettings({ ...localSettings, modelName: e.target.value, model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended — High-Speed & Resilient)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Low-Latency Lightweight)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest (Standard Production Channel)</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Advanced Reasoning with Auto-Retry)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              If upstream capacity spikes occur (e.g. 503 unavailable), the server automatically retries and falls over to backup models without interrupting your session.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-medium">Task Confidence Threshold</span>
              <span className="font-mono text-indigo-400">{localSettings.confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={localSettings.confidenceThreshold}
              onChange={(e) => setLocalSettings({ ...localSettings, confidenceThreshold: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Extracted tasks scoring below this confidence will be flagged as uncertainties.
            </p>
          </div>
        </div>
      </div>

      {/* Grounding & Guardrail Settings */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Safety & Guardrail Controls</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">RAG Grounding Integration</span>
              <span className="text-[11px] text-slate-400">
                Cross-reference team roster, sprint deadlines, and security documents before output generation.
              </span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.groundingEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, groundingEnabled: e.target.checked })}
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">Strict Guardrail Mode</span>
              <span className="text-[11px] text-slate-400">
                Require human confirmation for medium and high consequential tasks (financials, external communications).
              </span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.guardrailsStrict}
              onChange={(e) => setLocalSettings({ ...localSettings, guardrailsStrict: e.target.checked })}
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Application Data */}
      <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3">
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Data Management</span>
        </div>
        <p className="text-xs text-slate-400">
          Reset all stored tasks, audit records, and custom uploaded documents back to factory demonstration defaults.
        </p>

        {showResetConfirm ? (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-red-300 font-semibold">Are you sure?</span>
            <button
              onClick={async () => {
                await onResetData();
                setShowResetConfirm(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Defaults</span>
          </button>
        )}
      </div>
    </div>
  );
};
