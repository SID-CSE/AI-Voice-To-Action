# ActionFlow AI

**Turn conversations into clear, reviewable work.** ActionFlow AI is a voice-and-text productivity workspace that extracts proposed tasks from meeting notes, connects them to relevant team context, and keeps people in control of what is saved or confirmed.

[Live application: action-flow-ten.vercel.app](https://action-flow-ten.vercel.app/)

The application is deployed as a Vercel project with a React frontend and an Express serverless API. The live deployment is the recommended way to demonstrate the complete guest workflow; private workspace behavior additionally depends on the configured Clerk environment.

The application offers two deliberately separate experiences:

- **Guest demo:** open access to one shared, public, mutable workspace. Everyone using guest mode can see and change the same guest data. Never enter confidential or personal information here.
- **Private workspace:** Clerk sign-in provides a separate persistent workspace for each verified account. The API derives the workspace from the server-verified Clerk identity, not a user ID sent by the browser.

ActionFlow AI is intended for project teams, team leads, students, and software builders who want to organize meeting follow-ups, stand-up notes, and project discussions.

## What the application does

1. Capture speech using the browser's speech-recognition support, or enter a transcript directly.
2. Analyze the transcript with Gemini when configured, or use the built-in heuristic fallback.
3. Retrieve relevant workspace knowledge documents to provide context for analysis.
4. Present suggested tasks with owners, deadlines, priority, confidence, and supporting evidence where available.
5. Let people review and manage tasks, inspect analysis history, and export task data.
6. Apply server-side input validation and deterministic safety checks to flag consequential requests.
7. Record analysis and confirmation state in the active workspace. Confirmations are records only; the application does not execute external actions.

## Access and data behavior

| Experience | Identity | Data scope | Important note |
| --- | --- | --- | --- |
| Guest demo | No account required | One shared `guest` workspace | Public, mutable data; do not enter sensitive information. |
| Private workspace | Clerk sign-in | One workspace per verified Clerk user ID | Isolated from guest mode and other users. |

Neon PostgreSQL provides persistent hosted state. The runtime stores a versioned JSONB snapshot per workspace and uses version-checked updates to preserve concurrent changes. Local development can use JSON files; production requires Neon and fails closed rather than treating serverless disk as durable storage. The tracked `data/store.json` is not automatically imported into Neon.

## Product experience

The public landing page explains the application and offers guest demo, sign-in, and account creation paths. Signed-in users are taken to their private workspace. Guest visitors see a clear warning before entering the shared experience and another notice while using it.

Inside the workspace:

- **Voice Assistant:** record speech where supported, enter text, run analysis, review evidence, and refine results.
- **Dashboard:** view task, analysis, and review summaries.
- **Tasks:** create, update, filter, and export structured tasks.
- **Knowledge Base:** add and search workspace-scoped context; upload supported TXT, MD, and CSV files.
- **Audit Logs:** inspect workspace analysis and confirmation history. Records are capped and can be cleared; this is not an immutable compliance archive.
- **Evaluation:** compare the configured ReAct and baseline analysis flows using the included test cases.
- **Settings:** configure available analysis behavior and reset the active workspace after confirmation.

### Result preference models

The Settings page persists the selected processing model through `PATCH /api/settings`. The choices are:

| Display option | Persisted model |
| --- | --- |
| Standard | `gemini-3.6-flash` |
| Fast | `gemini-3.1-flash-lite` |
| Latest stable | `gemini-flash-latest` |

The selected value is read back from the server after saving and remains active for subsequent analysis requests. Failed settings requests are surfaced to the user instead of silently reverting to Standard.

## Architecture

The deployed system combines a browser client, a Vercel serverless boundary, identity-aware workspace scoping, responsible-AI controls, optional Gemini generation, and durable Neon storage. The diagrams below show both the runtime topology and the internal request flow.

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer"]
        Browser["React 19 and TypeScript"]
        Speech["Browser speech recognition"]
    end
    subgraph VercelLayer["Vercel Deployment"]
        Static["Vite static assets"]
        Function["Express serverless function"]
        Rewrite["API rewrite and SPA fallback"]
    end
    subgraph ControlLayer["Application Controls"]
        Clerk["Clerk identity verification"]
        Scope["Workspace scope selection"]
        Validate["Validation and guardrails"]
        Budget["Gemini workflow budgets"]
        RAG["Knowledge retrieval"]
    end
    subgraph ProviderLayer["External Providers"]
        Gemini["Google Gemini API"]
        Blob["Vercel Blob guest originals"]
    end
    subgraph DataLayer["Persistent Data"]
        Neon[("Neon PostgreSQL JSONB")]
        Limits[("Atomic rate limit counters")]
    end

    Browser -->|"loads"| Static
    Browser -->|"same origin API requests"| Rewrite
    Rewrite -->|"routes /api requests"| Function
    Speech -->|"transcript input"| Browser
    Function -->|"verifies sessions"| Clerk
    Function -->|"selects guest or private scope"| Scope
    Scope -->|"checks request data"| Validate
    Validate -->|"enforces weighted usage"| Budget
    Validate -->|"retrieves context"| RAG
    RAG -->|"reads workspace knowledge"| Neon
    Budget -->|"stores shared counters"| Limits
    Validate -->|"generates structured output"| Gemini
    Validate -->|"uploads guest originals"| Blob
    Validate -->|"persists tasks and analyses"| Neon
```

### Detailed request and deployment flow

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
```mermaid
flowchart LR
    subgraph PresentationLayer["Presentation"]
        cLanding["Landing page"]
        cAssistant["Assistant screen"]
        cSettings["Settings screen"]
        cWorkspace["Workspace views"]
    end
    subgraph ApiLayer["API and Middleware"]
        cEntry["Vercel API entry"]
        cExpress["Express application"]
        cHeaders["Security headers and logging"]
        cAuth["Clerk middleware"]
        cWorkspaceScope["Workspace initialization"]
        cRate["Request and Gemini limits"]
    end
    subgraph AiLayer["Analysis Pipeline"]
        cValidation["Input validation"]
        cGuardrails["Risk guardrails"]
        cKnowledge["RAG relevance scoring"]
        cGemini["Gemini model fallback"]
        cHeuristic["Deterministic fallback"]
        cPersistence["Version checked persistence"]
    end
    subgraph StorageLayer["Storage and Providers"]
        cNeon[("Neon PostgreSQL")]
        cBlob["Vercel Blob"]
        cProvider["Google Gemini"]
    end

    cLanding -->|"opens"| cAssistant
    cAssistant -->|"calls /api/analyze"| cEntry
    cSettings -->|"calls /api/settings"| cEntry
    cWorkspace -->|"calls task and history APIs"| cEntry
    cEntry -->|"lazy loads"| cExpress
    cExpress -->|"adds"| cHeaders
    cHeaders -->|"authenticates"| cAuth
    cAuth -->|"selects"| cWorkspaceScope
    cWorkspaceScope -->|"limits"| cRate
    cRate -->|"validates"| cValidation
    cValidation -->|"checks risk"| cGuardrails
    cValidation -->|"retrieves context"| cKnowledge
    cKnowledge -->|"reads"| cNeon
    cGuardrails -->|"allows structured analysis"| cGemini
    cGemini -->|"calls"| cProvider
    cGemini -.->|"provider unavailable"| cHeuristic
    cGemini -->|"returns output"| cPersistence
    cHeuristic -->|"returns output"| cPersistence
    cPersistence -->|"writes workspace state"| cNeon
    cValidation -->|"guest file original"| cBlob
```

### Runtime integration

1. Vercel serves the Vite-built React assets and rewrites `/api/*` to the lazy-loaded Express function.
2. Express applies security headers, request logging, Clerk verification, workspace selection, and persistent rate limits.
3. Validation and guardrails run before AI generation. Knowledge retrieval adds workspace context, while weighted Gemini budgets prevent uncontrolled provider usage.
4. Gemini output is normalized and stored with tasks, analyses, settings, and audit records in Neon. If Gemini is unavailable or unconfigured, the deterministic fallback keeps the workflow usable.

### Repository architecture map

The original project map is retained below as a complementary view. The runtime diagrams above explain deployment and request flow; this map explains where the implementation lives in the repository.

```text
/
├── api/
│   └── index.ts                    # Vercel serverless entry point
├── server.ts                       # Express app and API route handlers
├── dev-server.ts                   # Local Vite and standalone server startup
├── server/
│   ├── db.ts                       # Neon and local persistence, scopes, rate limits
│   ├── gemini.ts                   # Gemini integration, retries, fallback models
│   ├── guardrails.ts                # Server-side risk and safety checks
│   ├── rag.ts                       # Workspace knowledge retrieval
│   ├── prompts.ts                   # Baseline and ReAct prompt definitions
│   ├── validation.ts                # Request, task, audit, and upload validation
│   └── *.test.ts                    # Backend and validation regression tests
├── src/
│   ├── App.tsx                      # Workspace state and navigation
│   ├── main.tsx                     # React and Clerk browser entry point
│   ├── types.ts                     # Shared TypeScript domain types
│   ├── services/
│   │   └── api.ts                  # Same-origin browser API client
│   ├── components/                  # Shared navigation, forms, cards, dialogs
│   └── pages/                       # Assistant, dashboard, tasks, knowledge,
│       │                             # audit, evaluation, settings, landing
├── db/
│   └── schema.sql                   # Neon schema reference
├── dist/                            # Generated Vite and production server output
├── metadata.json                    # Platform capability metadata
├── package.json                     # Scripts and dependency manifest
├── tsconfig.json                    # TypeScript compiler configuration
└── vercel.json                      # Build, API rewrite, SPA fallback, headers
```

The Express API runs as a Vercel serverless function at `/api`. Frontend requests use same-origin relative `/api` routes. Clerk session tokens are sent by the client and verified by the server. The API then selects either the fixed guest scope or the verified user's scope. `api/index.ts` loads `server.js` lazily, while `dev-server.ts` contains the Vite-only local startup path; Vite is never imported by the Vercel function.

### File uploads and knowledge retrieval

Supported uploads are TXT, Markdown, and CSV files up to 512 KB. Guest originals can be sent to Vercel Blob when configured; those originals are public. Signed-in uploads keep indexed text in the private workspace and do not store the original file in Blob. Workspace knowledge is limited by document count and total indexed-text size. PDF and DOCX extraction are not supported.

## Technology

- React 19, TypeScript, Vite, Tailwind CSS
- Express 4 and Node.js 20+
- Clerk for account authentication
- Neon PostgreSQL for hosted persistence and rate-limit state
- Google Gemini for optional model-backed analysis
- Vercel Blob for optional public guest file originals
- Vercel for the frontend and serverless API: [live deployment](https://action-flow-ten.vercel.app/)
- Node test runner with `tsx` for backend and validation tests

## Repository structure

```text
api/index.ts                 Vercel serverless Express entry point
server.ts                    Express application and API routes
dev-server.ts                Local Vite development and production server
server/db.ts                 Neon workspaces, local JSON storage, rate limits
server/validation.ts         Request and upload validation
server/guardrails.ts         Deterministic safety checks
server/gemini.ts             Gemini integration and heuristic fallback
server/prompts.ts            Model prompts
server/rag.ts                Workspace-scoped knowledge retrieval
src/main.tsx                 React entry point and Clerk setup
src/App.tsx                  Workspace state and application navigation
src/pages/LandingPage.tsx    Public product landing page
src/pages/                   Dashboard, assistant, tasks, knowledge, logs, evaluation, settings
src/services/api.ts          Same-origin API client
db/schema.sql                Runtime Neon schema reference
vercel.json                  Build, API rewrite, SPA fallback, and response headers
DEPLOYMENT_GUIDE.md          Step-by-step Vercel and provider setup
PRODUCTION_CHECKLIST.md       Preview and production verification checklist
TECH_STACK.md                Complete technology inventory and rationale
```

## Run and verify locally

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run dev
```

The local application is served at `http://localhost:3000`. To run the project checks and production build:

```bash
npm run lint
npm test
npm run build:client
npm run build
```

`npm test` runs the input/guardrail, workspace persistence and isolation, concurrency, storage-limit, confirmation, and API validation tests. The current suite contains 18 passing tests.

### Environment variables

Use a local `.env` file for local configuration. Never commit it. Configure deployment secrets in Vercel's encrypted environment settings and keep Preview and Production values/data appropriately separated.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string; required for durable production storage. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Public Clerk key embedded in the browser bundle. |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key used by the server. Must match the browser key. |
| `CLERK_SECRET_KEY` | Server-only Clerk secret. Required with both publishable-key settings for private accounts. |
| `GEMINI_API_KEY` | Optional server-side Gemini access. The heuristic analyzer is used when not configured. |
| `GEMINI_WORKFLOW_LIMIT_PER_MINUTE` | Optional weighted Gemini workflow limit per guest IP or signed-in workspace; defaults to `12`. |
| `GEMINI_WORKFLOW_LIMIT_PER_DAY` | Optional rolling 24-hour weighted Gemini workflow limit per guest IP or signed-in workspace; defaults to `100`. |
| `BLOB_READ_WRITE_TOKEN` | Optional Vercel Blob access for public guest originals. |
| `PORT` | Local server port; defaults to `3000`. |
| `DATA_DIR`, `DB_FILE` | Optional paths for local JSON persistence. |

For a deployment with both guest mode and private accounts, configure all three Clerk variables together and configure `DATABASE_URL`. Partial Clerk configuration causes API requests to fail rather than silently selecting an unintended workspace. Do not prefix server secrets with `VITE_`.

## Deployment

### Live deployment

- Application: [https://action-flow-ten.vercel.app/](https://action-flow-ten.vercel.app/)
- Health check: [https://action-flow-ten.vercel.app/api/health](https://action-flow-ten.vercel.app/api/health)
- API routing: `/api/:path*` is rewritten to the Vercel function before the SPA fallback.
- Build command: `npm run build:client`
- Output directory: `dist`

The Vercel function must receive `DATABASE_URL` and the required Clerk variables for the intended environment. `GEMINI_API_KEY` enables Gemini-backed analysis; without it, the deterministic fallback keeps the demo available. `BLOB_READ_WRITE_TOKEN` is required only for guest original-file uploads.

### Gemini usage controls

Gemini access is limited at the workflow boundary, before a provider call is started. `/api/analyze` and `/api/refine` consume one workflow unit; `/api/evaluate` consumes two because it runs both baseline and ReAct analyses. Each guest IP or signed-in workspace is limited to 12 weighted units per minute and 100 weighted units in a rolling 24-hour window by default. The limits can be adjusted with `GEMINI_WORKFLOW_LIMIT_PER_MINUTE` and `GEMINI_WORKFLOW_LIMIT_PER_DAY`.

The existing general API limit remains 180 requests per minute, and the short expensive-route limit still protects upload-token and other expensive endpoints. Neon stores the counters atomically in `api_rate_limits`, so limits are shared across Vercel function instances. Local development uses in-memory counters. Gemini retries and model fallback remain separate resilience behavior and do not bypass these application limits.

Deploy the frontend and API together as one Vercel project. Use the repository's Vercel settings: `npm run build:client` and output directory `dist`; `vercel.json` routes `/api/*` to the serverless API and other paths to the single-page application.

Before Production, verify the Preview deployment with the actual provider accounts: guest access and warning, Clerk sign-in, two-user isolation, persistence after refresh and a later function instance, `/api/health`, and any enabled Gemini or Blob flows. The health endpoint reports configuration/readiness signals but does not replace real read/write and isolation tests.

See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for the detailed setup, provider configuration, troubleshooting, rollback, and update process. Use [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) to track verification.

## Security and product boundaries

- Private workspace selection uses the verified Clerk user ID; browser-supplied identity does not authorize access.
- Guest data is intentionally public and shared. Guest uploads may store public originals in Blob.
- Gemini and database credentials remain server-side.
- API inputs, editable task fields, upload types/paths, and public Blob URLs are validated.
- Request limits and storage caps help bound abuse and workspace growth; public services still require monitoring and provider usage controls.
- Transcripts, refinements, and retrieved documents are treated as untrusted model input. Deterministic server-side rules supplement model output.
- Confirmation dialogs record a decision in workspace history; they do not trigger payments, emails, deletions, or other external effects.
- Audit history is workspace-scoped and capped, but users can clear it. Do not present it as tamper-proof or regulatory compliance storage.

## Known limitations

- Speech recognition depends on browser support and microphone permission; text entry is available as an alternative.
- PDF and DOCX uploads are not supported.
- Private file originals are not stored; signed-in uploads retain indexed text only.
- Guest data and guest Blob originals are public by design.
- The Neon runtime uses versioned JSONB workspace snapshots rather than normalized per-entity tables.
- Public guest access can be abused across multiple IP addresses; monitor usage and set provider spending controls.
- The production JavaScript bundle currently emits a size advisory; this does not prevent a successful build.

## API overview

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/health` | `GET` | Safe integration and database readiness status. |
| `/api/session` | `GET` | Report the active workspace mode. |
| `/api/analyze`, `/api/refine` | `POST` | Analyze or refine a transcript result. |
| `/api/tasks` | `GET`, `POST` | Read or create workspace tasks. |
| `/api/tasks/:id` | `PATCH`, `DELETE` | Update or remove a workspace task. |
| `/api/knowledge` | `GET`, `POST` | Read or add indexed knowledge. |
| `/api/knowledge/search` | `POST` | Search workspace knowledge. |
| `/api/knowledge/upload-token` | `POST` | Request a constrained guest Blob upload token. |
| `/api/audit-logs` | `GET`, `DELETE` | Read or clear workspace audit history. |
| `/api/execute-action` | `POST` | Record confirmation or cancellation; no external side effect. |
| `/api/evaluation/cases`, `/api/evaluate` | `GET`, `POST` | Read benchmark cases or run an evaluation. |
| `/api/settings` | `GET`, `PATCH` | Read or update workspace settings. |
| `/api/reset` | `POST` | Restore the active workspace's built-in demo state. |

## Project summary

ActionFlow AI demonstrates an end-to-end responsible-AI workflow: browser-based voice or text input, grounded task extraction, reviewable evidence, deterministic safety checks, workspace-scoped history, authenticated data isolation, persistent storage, and a deployable Vercel architecture. It is an educational and productivity application; model suggestions should be reviewed by a person before being used for consequential decisions.
