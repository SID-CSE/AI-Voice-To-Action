import React from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  CheckSquare, 
  BookOpen, 
  ShieldAlert, 
  GitCompare, 
  Settings, 
  Cpu, 
  Wifi, 
  Sparkles,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  apiConnected: boolean;
  modelName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
  apiConnected,
  modelName,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'Voice Assistant', icon: Mic, highlight: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
    { id: 'evaluation', label: 'Evaluation', icon: GitCompare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight">AI Voice-to-Action</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">ReAct Productivity Agent</p>
            </div>
          </div>

          <button
            id="close-mobile-sidebar-btn"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Status Panel (Section 4) */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Model:
              </span>
              <span className="text-slate-200 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                {modelName}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                API Status:
              </span>
              <span className={`inline-flex items-center gap-1 font-medium text-[10px] ${
                apiConnected ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${apiConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                {apiConnected ? 'Connected' : 'Active (Local Mode)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-800/60 text-[10px]">
              <span>System Version</span>
              <span className="font-mono">v1.0.0-react</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
