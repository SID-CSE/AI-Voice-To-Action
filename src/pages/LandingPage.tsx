import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  LockKeyhole,
  Mic,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

interface LandingPageProps {
  clerkEnabled: boolean;
  onEnterDemo: () => void;
  onTrySample: () => void;
}

const steps = [
  { number: '01', title: 'Capture the conversation', detail: 'Speak naturally or paste notes from a meeting, planning session, or quick voice memo.', icon: AudioLines },
  { number: '02', title: 'Turn it into structured work', detail: 'Get proposed tasks with owners, deadlines, evidence, and clear confidence signals.', icon: Workflow },
  { number: '03', title: 'Review before you act', detail: 'Inspect the result, check safety signals, and keep a useful record of what the AI suggested.', icon: ShieldCheck },
];

const audiences = [
  { title: 'Project teams', detail: 'Convert stand-up updates and planning discussions into a shared action list.', icon: UsersRound },
  { title: 'Team leads', detail: 'Keep owners, deadlines, and follow-ups visible without rewriting every conversation.', icon: Check },
  { title: 'Students and builders', detail: 'Organize project meetings, research notes, and the next steps for a team project.', icon: Sparkles },
];

export function LandingPage({ clerkEnabled, onEnterDemo, onTrySample }: LandingPageProps) {
  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#070b18] text-white selection:bg-violet-400/30 selection:text-white">
      <div className="landing-grid pointer-events-none fixed inset-0 opacity-40" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="#home" className="flex items-center gap-3" aria-label="ActionFlow AI home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-violet-950/50">
            <Mic className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-base font-bold tracking-tight">ActionFlow <span className="text-indigo-300">AI</span></span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Conversation to action</span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex" aria-label="Landing page">
          <a className="transition hover:text-white" href="#how-it-works">How it works</a>
          <a className="transition hover:text-white" href="#who-its-for">Who it’s for</a>
          <a className="transition hover:text-white" href="#privacy">Privacy</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {clerkEnabled ? (
            <>
              <SignInButton mode="modal">
                <button type="button" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4">Log in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="rounded-xl border border-white/10 bg-white px-3.5 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-white/5 transition hover:bg-indigo-100 sm:px-4">Create account</button>
              </SignUpButton>
            </>
          ) : (
            <a href="#get-started" className="rounded-xl border border-white/10 bg-white px-3.5 py-2 text-sm font-bold text-slate-950 transition hover:bg-indigo-100">Get started</a>
          )}
        </div>
      </header>

      <main id="home" className="relative z-0">
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:px-12 lg:pb-28 lg:pt-24">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-400/[0.08] px-3.5 py-2 text-xs font-semibold text-indigo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              A thoughtful workspace for turning talk into teamwork
            </div>
            <h1 className="font-display text-[2.8rem] font-semibold leading-[1.06] tracking-[-0.055em] sm:text-6xl lg:text-[4.35rem]">
              Good conversations deserve <span className="landing-gradient-text">great follow-through.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              ActionFlow AI turns meeting notes and voice updates into organized, reviewable tasks—so teams can spend less time sorting notes and more time moving work forward.
            </p>
            <div id="get-started" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={onEnterDemo} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-950/40 transition hover:-translate-y-0.5 hover:from-indigo-400 hover:to-violet-400">
                Explore the guest demo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button type="button" onClick={onTrySample} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-indigo-300/30 hover:bg-white/[0.07]">
                <AudioLines className="h-4 w-4 text-indigo-300" /> See a sample analysis
              </button>
            </div>
            <p className="mt-4 flex max-w-xl items-start gap-2 text-xs leading-5 text-amber-200/80">
              <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              Guest demo data is shared and public. Please do not enter confidential, personal, or sensitive information.
            </p>
            {!clerkEnabled && <p className="mt-3 text-xs text-slate-500">Private sign-in is not configured in this environment. You can still explore the guest demo.</p>}
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.08] pt-6 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" />Human-reviewed suggestions</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5 text-indigo-300" />Private workspaces for accounts</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px] lg:ml-auto">
            <div className="landing-orb landing-orb-one" aria-hidden="true" />
            <div className="landing-orb landing-orb-two" aria-hidden="true" />
            <div className="relative rounded-[1.65rem] border border-white/[0.12] bg-[#0c1223]/90 p-3 shadow-[0_35px_100px_-35px_rgba(79,70,229,0.55)] backdrop-blur-xl sm:p-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-2 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300"><Mic className="h-3.5 w-3.5" /></span>
                  <span className="text-xs font-semibold text-slate-200">Meeting follow-up</span>
                </div>
                <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">Ready to review</span>
              </div>
              <div className="p-2 pt-4 sm:p-3">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"><AudioLines className="h-3.5 w-3.5 text-violet-300" /> Conversation</div>
                  <p className="text-sm leading-6 text-slate-300">“Maya will share the revised design by Thursday. I’ll review it, and Jordan can prepare the release checklist.”</p>
                </div>
                <div className="my-4 flex items-center gap-3 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500"><span className="h-px flex-1 bg-white/[0.08]" /><Sparkles className="h-3.5 w-3.5 text-indigo-300" /> Suggested actions <span className="h-px flex-1 bg-white/[0.08]" /></div>
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-indigo-300/15 bg-indigo-400/[0.055] p-3.5">
                    <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-semibold text-white">Share revised design</div><div className="mt-1.5 text-[10px] text-slate-400">Owner <span className="text-slate-200">Maya</span><span className="mx-2 text-slate-600">·</span>Due <span className="text-slate-200">Thursday</span></div></div><span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold text-emerald-300">High confidence</span></div>
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-500"><Check className="h-3 w-3 text-emerald-400" /> Evidence linked to the conversation</div>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                    <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-semibold text-slate-200">Prepare release checklist</div><div className="mt-1.5 text-[10px] text-slate-500">Owner <span className="text-slate-300">Jordan</span><span className="mx-2 text-slate-600">·</span>Needs a deadline</div></div><span className="rounded-md bg-amber-400/10 px-2 py-1 text-[9px] font-semibold text-amber-200">Review needed</span></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.08] px-2 pt-3">
                <span className="text-[10px] text-slate-500">Suggestions stay reviewable before saving</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.07] px-2.5 py-1.5 text-[9px] font-semibold text-slate-300">Open workspace <ChevronRight className="h-3 w-3" /></span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#10182a]/95 p-3.5 shadow-xl backdrop-blur-xl sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck className="h-4 w-4" /></span>
              <span><span className="block text-[10px] font-semibold text-white">Human in control</span><span className="mt-0.5 block text-[9px] text-slate-500">Review every suggestion</span></span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-white/[0.07] bg-white/[0.018]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">How it works</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">A clear path from words to work.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">ActionFlow is an AI-assisted productivity workspace. It helps organize what people said, while keeping people responsible for deciding what happens next.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map(({ number, title, detail, icon: Icon }) => (
                <article key={number} className="rounded-2xl border border-white/[0.08] bg-[#0b1120]/80 p-6 transition hover:-translate-y-1 hover:border-indigo-300/20">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[0.15em] text-indigo-300">{number}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300"><Icon className="h-5 w-5" /></span></div>
                  <h3 className="mt-7 text-base font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="who-its-for" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Who can use it</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Built for people doing work together.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">Whether you are coordinating a project, running a small team, or learning how to build safer AI workflows, ActionFlow helps make next steps easier to see.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {audiences.map(({ title, detail, icon: Icon }) => (
                <article key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                  <Icon className="h-5 w-5 text-indigo-300" />
                  <h3 className="mt-5 text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="border-y border-white/[0.07] bg-gradient-to-br from-indigo-950/35 via-[#0c1222] to-[#090d19]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-12 lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">A workspace that is clear about data</p>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Try openly. Work privately.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">Choose the experience that fits what you are doing. The guest demo is shared by everyone; signed-in workspaces are separated by account.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200"><UsersRound className="h-5 w-5" /></div>
                <h3 className="mt-5 text-base font-semibold text-white">Guest demo · shared</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Explore the application without creating an account. Guest tasks and demo data are visible to other visitors and can be changed by them.</p>
                <p className="mt-4 text-xs font-semibold text-amber-200">Do not enter confidential or personal information.</p>
              </article>
              <article className="rounded-2xl border border-indigo-300/15 bg-indigo-300/[0.035] p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-300/10 text-indigo-200"><LockKeyhole className="h-5 w-5" /></div>
                <h3 className="mt-5 text-base font-semibold text-white">Your account · private</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to use a workspace associated with your verified account. Your saved workspace is separate from the public guest demo and other users.</p>
                <p className="mt-4 text-xs font-semibold text-indigo-200">Use this mode for your own project workspace.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 lg:px-12 lg:py-20">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-300"><FileText className="h-5 w-5" /></span>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">Make the next step the easy part.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">Explore the guest demo, or create a private workspace for your own work.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={onEnterDemo} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:from-indigo-400 hover:to-violet-400">Try the guest demo <ArrowRight className="h-4 w-4" /></button>
            {clerkEnabled ? <SignUpButton mode="modal"><button type="button" className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">Create a private account</button></SignUpButton> : <a href="#home" className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200">Back to top</a>}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:px-8 lg:px-12">
          <a href="#home" className="flex items-center gap-2 font-semibold text-slate-300"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300"><Mic className="h-3 w-3" /></span>ActionFlow AI</a>
          <span>AI-assisted task organization. People stay in control.</span>
          <a href="#home" className="inline-flex items-center gap-1 transition hover:text-slate-300">Back to top <ArrowDown className="h-3 w-3 rotate-180" /></a>
        </div>
      </footer>
    </div>
  );
}
