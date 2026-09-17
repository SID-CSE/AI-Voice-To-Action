import React, { useState } from 'react';
import { 
  Settings, 

  ShieldCheck, 
  Database, 
  Sliders, 
  Volume2, 

  CheckCircle2, 

  Lock,
  Info
} from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsPageProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  onResetData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
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
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-slate-400">
          Manage assistant behavior, knowledge grounding, and safety preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System configuration saved successfully.</span>
        </div>
      )}

      {/* Model & Reasoning Configuration */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Result Preferences</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">AI Processing Model</label>
            <select
              value={localSettings.model || 'gemini-3.6-flash'}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value, modelName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-3.6-flash">Standard</option>
              <option value="gemini-3.1-flash-lite">Fast</option>
              <option value="gemini-flash-latest">Latest stable</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">The server accepts only supported model choices and keeps safety checks enabled.</p>
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
              Lower-confidence results are shown with their confidence percentage for review.
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

      <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3">
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
          <span>Data Management</span>
        </div>
        <p className="text-xs text-slate-400">Reset stored tasks, audit records, custom documents, and settings to the built-in sample state.</p>
        {showResetConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-300 font-semibold">This cannot be undone.</span>
            <button onClick={async () => { await onResetData(); setShowResetConfirm(false); }} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold">Confirm Reset</button>
            <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-900/40 text-slate-300 text-xs font-medium border border-slate-700">Reset to Factory Defaults</button>
        )}
      </div>
    </div>
  );
};
