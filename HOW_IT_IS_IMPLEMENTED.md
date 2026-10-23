# AI Voice-to-Action Assistant

## What the project does

The AI Voice-to-Action Assistant converts spoken instructions, meeting notes, or typed transcripts into structured, reviewable work. It extracts tasks, owners, deadlines, priorities, dependencies, evidence quotes, uncertainties, and executive summaries.

It is designed for responsible automation rather than autonomous execution. Financial transfers, destructive operations, credential requests, permission changes, and external communications are detected by server-side guardrails and require explicit human confirmation. Confirmations and cancellations are recorded in the audit history.

## How it is implemented

### 1. Frontend application

The React 19 and TypeScript frontend is organized around a single application shell in `src/App.tsx`:

- Dashboard: workflow overview, counts, and recent analyses.
- Voice Assistant: microphone capture, text entry, transcript editing, analysis progress, results, and refinement.
- Tasks: task filtering, status changes, inline editing, manual task creation, and export.
- Knowledge Base: documents used for grounded retrieval and searchable excerpts.
- Audit Logs: searchable risk and confirmation history with detailed JSON inspection.
- Evaluation: baseline versus ReAct benchmark cases.
- Settings: model, grounding, guardrail, and reset controls.

The browser uses the Web Speech API for live transcription when supported and always provides typed transcript input as a fallback.

### 2. Backend API

`server.ts` exports the Express application and API routes. `dev-server.ts` owns local Vite middleware and the standalone production server. `api/index.ts` loads the Express app lazily as a Vercel function. The API provides:

- `/api/analyze` for transcript analysis.
- `/api/refine` for user-guided result refinement.
- `/api/tasks` for task management.
- `/api/analyses` and `/api/audit-logs` for history.
- `/api/knowledge` and `/api/knowledge/search` for grounding documents.
- `/api/execute-action` for recording explicit confirmation or cancellation.
- `/api/evaluation/*` for benchmark execution.
- `/api/health` for deployment health checks.

The server accepts `PORT` from the hosting platform and binds to `0.0.0.0`.

### 3. AI and fallback processing

`server/gemini.ts` calls the Google GenAI SDK when `GEMINI_API_KEY` is configured. It uses separate baseline and ReAct-style prompts, requests JSON output, normalizes the model response, and retries across configured model candidates. Before these routes run, `server.ts` applies weighted Gemini workflow budgets: analysis and refinement cost one unit, while evaluation costs two because it runs baseline and ReAct analysis. The defaults are 12 weighted units per minute and 100 weighted units per rolling 24 hours per identity, configurable with `GEMINI_WORKFLOW_LIMIT_PER_MINUTE` and `GEMINI_WORKFLOW_LIMIT_PER_DAY`.

When the API key is absent or the model is unavailable, a deterministic local heuristic parser keeps the product usable for demos and basic task extraction. This fallback is not a replacement for production model quality.

### 4. Grounded retrieval

`server/rag.ts` loads the knowledge documents, splits them into chunks, tokenizes the request, scores term overlap, and returns the most relevant excerpts. Retrieved excerpts are included in the ReAct prompt only when the request contains relevant knowledge-base terms.

### 5. Safety controls

`server/guardrails.ts` validates input and scans it for consequential patterns. The scan covers financial actions, deletion, credential access, communication, and permissions. The model output is merged with this server-authoritative result so a client or model response cannot remove a detected confirmation requirement.

The application does not execute real financial, email, deletion, or access-control operations. The confirmation endpoint records an authorization decision as a safe simulation.

### 6. Storage

`server/db.ts` supports local JSON storage for development and Neon PostgreSQL for deployed environments. The local path is configurable:

- `DATA_DIR` sets the storage directory.
- `DB_FILE` sets the full JSON file path.

When `DATABASE_URL` is configured, the deployment uses Neon and stores versioned workspace state in PostgreSQL. Without it, local development can use JSON storage; production fails closed rather than treating ephemeral serverless disk as durable.

### 7. Settings and model selection

The Settings page sends model changes to `PATCH /api/settings`. The server validates the supported IDs and persists them in the active workspace. The current choices are:

- Standard: `gemini-3.6-flash`
- Fast: `gemini-3.1-flash-lite`
- Latest stable: `gemini-flash-latest`

The client checks HTTP failures and synchronizes its local form with the saved server response, so a failed save cannot silently reset the visible choice.

## Deployment readiness

The application is deployed at [https://action-flow-ten.vercel.app/](https://action-flow-ten.vercel.app/) as a Vite frontend plus a Vercel serverless Express API:

```text
npm run build
npm start
```

Required deployment configuration:

```env
GEMINI_API_KEY=your_server_side_key
GEMINI_WORKFLOW_LIMIT_PER_MINUTE=12
GEMINI_WORKFLOW_LIMIT_PER_DAY=100
PORT=3000
DATABASE_URL=your_neon_connection_string
CLERK_PUBLISHABLE_KEY=your_server_key
CLERK_SECRET_KEY=your_server_secret
```

The app can run without `GEMINI_API_KEY` using its local fallback, but production AI quality and model-backed evaluation require the key. Never expose the key to browser code.

Gemini usage limits are enforced before provider calls. In Neon mode, the `api_rate_limits` table provides atomic counters shared across Vercel instances; local mode uses process memory. A 429 response means the caller reached either the per-minute or rolling daily Gemini workflow budget. SDK retries and model fallback are bounded resilience behavior, not an alternate path around the budget.

## Presentation summary

This project demonstrates a responsible AI workflow that turns unstructured voice or text into actionable work. Its differentiators are grounded team context, evidence-linked structured output, explicit uncertainty handling, server-enforced safety guardrails, human confirmation for consequential actions, and an auditable history of every analysis.

The current live Vercel deployment demonstrates the guest flow and supports private workspaces when Clerk and Neon environment variables are configured. Check `/api/health` and Vercel Runtime Logs before diagnosing browser symptoms.
