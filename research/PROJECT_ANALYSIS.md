# ActionFlow AI: Project Analysis

## Scope and evidence

This assessment is based on the repository source, configuration, tracked documentation, database schema, tests, and the local build executed on 2026-11-03. It describes the implementation as it exists; no experimental result is inferred from the UI.

## Problem and current solution

ActionFlow AI converts a spoken or typed meeting instruction into reviewable tasks and action items. It captures speech with the browser Web Speech API, validates the transcript, optionally retrieves workspace documents, asks Gemini for schema-constrained JSON, applies deterministic risk checks, and stores the result in a workspace-scoped history.

The application is a React 19/Vite client with a TypeScript Express API. Clerk supplies optional verified identity, Neon PostgreSQL stores production workspace snapshots and rate-limit counters, Vercel Blob stores selected guest originals, and a JSON-file adapter supports local development. The system intentionally records confirmations but does not send emails, transfer money, delete records, or execute external tools.

## Runtime pipeline

1. `VoiceRecorder` requests microphone permission and uses browser speech recognition; text entry is the fallback.
2. `/api/analyze` validates request shape and transcript length.
3. `guardrails.validateInput` rejects empty, very short, or non-alphanumeric input.
4. `ragService.retrieveContext` splits workspace documents into paragraph/bullet chunks and scores lexical overlap and phrase matches.
5. `GeminiService` runs either a baseline or ReAct prompt, requests JSON, retries/falls back across model names, parses and normalizes output, and falls back to deterministic heuristics when Gemini is unavailable.
6. `guardrails.evaluateRisk` deterministically detects financial, deletion, credential, communication, and permission patterns.
7. Tasks, analysis, audit state, grounding sources, and workflow stages are persisted.

## Strengths

- Clear human-in-the-loop boundary: confirmation is required for detected consequential actions and no external side effect is claimed.
- Server-side identity-derived workspace scope; browser-supplied user IDs are not used for authorization.
- Validation, rate limiting, storage caps, security headers, provider retries, and production fail-closed storage are more mature than a typical demo.
- Structured output includes evidence, uncertainty, assumptions, confidence, risk, and proposed actions.
- The code has focused tests for storage isolation, optimistic concurrency, validation, risk detection, uploads, and rate limits.
- The baseline/ReAct comparison creates a useful starting point for controlled research.

## Weaknesses and limitations

- Retrieval is lexical only. There are no embeddings, reranking, query expansion, document-level relevance labels, or retrieval benchmarks. A fallback returns the first chunk even when lexical relevance is zero, which is useful for UX but weak evidence of grounding.
- Chunking is paragraph-based and may discard short but important bullets (`length > 20`); it has no speaker, time, provenance span, or version metadata.
- The heuristic fallback is strongly coupled to demo names and phrases and produces hard-coded evidence sentences that may not be verbatim input. It is a reliability fallback, not a general extraction algorithm.
- Gemini model names, retries, and a 5.5-second budget are engineering choices, not a reproducible model study.
- The evaluation suite currently has ten handcrafted synthetic cases. It now compares predictions against server-side gold task/owner/deadline/evidence/risk labels and includes preliminary calibration diagnostics, but the benchmark is still too small for research claims and the displayed guardrail catch rate remains a product presentation value rather than a complete safety study.
- Risk detection is regex-based and can miss paraphrases or create false positives. Model output is supplemented, but not evaluated with a labeled safety dataset.
- Browser speech recognition is provider/browser dependent. There is no controlled ASR comparison, word-error-rate measurement, noise test, diarization, or multilingual evaluation.
- No statistical significance, confidence intervals, annotator agreement, cross-domain test, ablation, latency-cost-quality frontier, or adversarial test report is currently generated.
- JSONB snapshots and mutable, clearable audit logs are practical persistence choices, not an immutable compliance record.

## Engineering versus research

The React/Express deployment, Clerk/Neon integration, rate limiting, UI, and confirmation records are valuable engineering. They are not by themselves novel research contributions. The potentially researchable core is the combination of meeting action extraction, workspace-grounded role resolution, evidence/uncertainty representation, and conservative human confirmation. To become research, that combination needs a precise task definition, a labeled benchmark, strong baselines, ablations, adversarial evaluation, and reproducible statistical evidence.

## Baseline verification

- `npm test`: 19 tests passed.
- `npm run lint`: TypeScript check passed.
- No source files were modified during this assessment.

## Initial publication assessment

Current status: **promising prototype, insufficient evidence for publication**. The most defensible direction is a benchmarked, evidence-grounded and risk-aware meeting action extraction system, not a claim that a prompt labeled “ReAct” is novel.
