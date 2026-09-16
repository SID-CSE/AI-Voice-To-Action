import React from 'react';
import { Menu, Sparkles, ShieldCheck, Database, Volume2 } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onTryDemo: () => void;
  title: string;
  subtitle?: string;
  groundingEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onTryDemo,
  title,
  subtitle,
  groundingEnabled = true,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          id="open-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-400 truncate max-w-md">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Guardrail & Grounding Badges */}
        <div className="hidden md:flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardrails Active</span>
          </div>

          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${
            groundingEnabled 
              ? 'bg-indigo-950/40 border-indigo-700/40 text-indigo-300' 
              : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
          }`}>
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>{groundingEnabled ? 'RAG Grounding' : 'Grounding Off'}</span>
          </div>
        </div>

        {/* Try Demo Action Button */}
        <button
          id="global-try-demo-btn"
          onClick={onTryDemo}
          className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try Demo</span>
        </button>
      </div>
    </header>
  );
};
