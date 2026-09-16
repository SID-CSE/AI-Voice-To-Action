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

`server.ts` runs an Express API and serves the Vite-built single-page application in production. The API provides:

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

`server/gemini.ts` calls the Google GenAI SDK when `GEMINI_API_KEY` is configured. It uses separate baseline and ReAct-style prompts, requests JSON output, normalizes the model response, and retries across configured model candidates.

When the API key is absent or the model is unavailable, a deterministic local heuristic parser keeps the product usable for demos and basic task extraction. This fallback is not a replacement for production model quality.

### 4. Grounded retrieval

`server/rag.ts` loads the knowledge documents, splits them into chunks, tokenizes the request, scores term overlap, and returns the most relevant excerpts. Retrieved excerpts are included in the ReAct prompt only when the request contains relevant knowledge-base terms.

### 5. Safety controls

`server/guardrails.ts` validates input and scans it for consequential patterns. The scan covers financial actions, deletion, credential access, communication, and permissions. The model output is merged with this server-authoritative result so a client or model response cannot remove a detected confirmation requirement.

The application does not execute real financial, email, deletion, or access-control operations. The confirmation endpoint records an authorization decision as a safe simulation.

### 6. Storage

`server/db.ts` currently uses an atomic local JSON file. The path is configurable:

- `DATA_DIR` sets the storage directory.
- `DB_FILE` sets the full JSON file path.

This is suitable for local development, a single-instance demo, or a persistent mounted disk. It is not suitable as-is for a horizontally scaled multi-user production deployment because instances do not share memory and concurrent writes are not coordinated across replicas.

For production shared use, replace the JSON store with a managed database such as PostgreSQL, Azure SQL, or Cosmos DB. Add authentication, user/workspace ownership on tasks and documents, authorization on destructive endpoints, encrypted secrets, backups, retention controls, and rate limiting before exposing it to unrelated users.

## Deployment readiness

The application is buildable as a Vite frontend plus bundled Node/Express server:

```text
npm run build
npm start
```

Required runtime configuration:

```env
GEMINI_API_KEY=your_server_side_key
PORT=3000
DATA_DIR=/path/to/persistent/data
```

The app can run without `GEMINI_API_KEY` using its local fallback, but production AI quality and model-backed evaluation require the key. Never expose the key to browser code.

## Presentation summary

This project demonstrates a responsible AI workflow that turns unstructured voice or text into actionable work. Its differentiators are grounded team context, evidence-linked structured output, explicit uncertainty handling, server-enforced safety guardrails, human confirmation for consequential actions, and an auditable history of every analysis.

The honest production qualification is that the current repository is ready for a single-instance deployment or controlled demonstration after build validation. A true shared multi-user deployment still needs managed shared storage and authentication/authorization.
