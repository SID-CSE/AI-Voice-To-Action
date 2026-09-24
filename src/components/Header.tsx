import React from 'react';
import { Menu, ShieldCheck, Database, Sparkles, Search, Sun, Moon, Bell } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, useClerk, useUser } from '@clerk/clerk-react';
import { LogOut } from 'lucide-react';

const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const ClerkStatusBadge: React.FC = () => {
  const { isSignedIn } = useUser();
  return <span>{isSignedIn ? 'Clerk Auth' : 'Shared Demo'}</span>;
};

const PublicWorkspaceBanner: React.FC = () => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold text-white">You are using the shared Guest Demo</p>
      <p className="text-[11px] text-slate-400">This public workspace contains sample data. Configure Clerk to enable private accounts.</p>
    </div>
    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">Public data</span>
  </div>
);

const WorkspaceBanner: React.FC = () => {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();

  if (isSignedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-white">Private workspace active</p>
          <p className="text-[11px] text-slate-400">Your tasks, analyses, and knowledge are isolated from the public demo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="light-theme-logout inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-white">You are using the shared Guest Demo</p>
        <p className="text-[11px] text-slate-400">Sign in or create an account to keep your tasks, analyses, and knowledge private.</p>
      </div>
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <button type="button" className="px-3.5 py-2 rounded-xl border border-indigo-400/40 text-indigo-100 text-xs font-semibold hover:bg-indigo-500/10 transition-colors">Sign in</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-950/20">Create account</button>
        </SignUpButton>
      </div>
    </div>
  );
};

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onTryDemo: () => void;
  title: string;
  subtitle?: string;
  groundingEnabled?: boolean;
  onOpenCommandPalette: () => void;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
  pendingNotifications: number;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onTryDemo,
  title,
  subtitle,
  groundingEnabled = true,
  onOpenCommandPalette,
  theme,
  onToggleTheme,
  pendingNotifications,
  onOpenNotifications,
}) => {
  return (
    <>
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
          <button type="button" onClick={onOpenCommandPalette} className="hidden h-9 w-48 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 text-left text-[11px] text-slate-500 transition-colors hover:border-indigo-500/50 hover:text-slate-300 md:flex" aria-label="Open command palette">
            <Search className="h-3.5 w-3.5 text-indigo-400" /><span className="flex-1">Search workspace</span><kbd className="rounded border border-slate-700 px-1 py-0.5 text-[9px]">Ctrl K</kbd>
          </button>
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

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${clerkEnabled ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
            {clerkEnabled ? <ClerkStatusBadge /> : <span>Shared Demo</span>}
          </div>
        </div>

        <button type="button" onClick={onToggleTheme} className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white sm:block" aria-label="Cycle dark, light, and system theme" title={`Theme: ${theme}`}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onOpenNotifications} className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={`${pendingNotifications} notifications`} title="Open audit activity">
          <Bell className="h-4 w-4" />
          {pendingNotifications > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400" />}
        </button>
        <button
          id="global-try-demo-btn"
          type="button"
          onClick={onTryDemo}
          className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try Demo</span>
        </button>
      </div>
      </header>
      <div className="sticky top-16 z-20 border-b border-indigo-500/20 bg-indigo-950/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-7xl">
          {clerkEnabled ? <WorkspaceBanner /> : <PublicWorkspaceBanner />}
        </div>
      </div>
    </>
  );
};
