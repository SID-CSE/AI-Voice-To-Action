# ActionFlow AI Technology Stack

This document lists the technologies used by ActionFlow AI, why each one is used, and how the pieces work together in local development and the deployed Vercel environment.

## 1. Product and application shape

| Technology or capability | Used for | Why it is used |
| --- | --- | --- |
| Full-stack web application | Browser workspace plus server API | Keeps the user experience accessible from a browser while allowing secrets, validation, persistence, and AI calls to remain server-side. |
| Single-page application | Client-side navigation between Assistant, Dashboard, Tasks, Knowledge, Audit Logs, Evaluation, and Settings | Provides fast navigation without full-page reloads and keeps workspace state coordinated in one client application. |
| Same-origin API | Browser communication with `/api/*` | Avoids unnecessary CORS configuration and ensures the deployed frontend talks to the API belonging to the same Vercel deployment. |

## 2. Runtime and programming languages

| Technology | Version or source | Used for | Why it is used |
| --- | --- | --- | --- |
| TypeScript | `~5.8.2` | Frontend, backend, shared types, and tests | Adds compile-time type checking across the browser and server boundary, reducing invalid API shapes and unsafe field handling. |
| JavaScript | ECMAScript modules | Runtime output and package execution | Supports the Node.js and browser ecosystems used by the project. |
| Node.js | `20+` declared in `package.json` | Local server, Vercel function, scripts, and tests | Provides the server runtime required by Express, the Google GenAI SDK, Neon client, and Vercel deployment. |
| npm | Lockfile and package scripts | Dependency installation and task execution | Provides reproducible installation and standard commands for development, validation, testing, and builds. |

## 3. Frontend stack

| Technology | Package or version | Used for | Why it is used |
| --- | --- | --- | --- |
| React | `^19.0.1` | UI components and application state | Supports a component-based interface with reusable pages, dialogs, forms, result cards, and workspace views. |
| React DOM | `^19.0.1` | Mounting React into the browser | Connects the React component tree to the browser DOM. |
| Vite | `^6.2.3` | Local development server and client bundling | Provides fast development feedback and produces the static frontend deployed to Vercel. |
| Tailwind CSS | `^4.1.14` | Responsive styling and design system | Enables consistent utility-based styling for the dark dashboard, landing page, forms, risk states, and responsive layouts. |
| `@tailwindcss/vite` | `^4.1.14` | Tailwind and Vite integration | Integrates Tailwind processing into the Vite build without a separate CSS build pipeline. |
| Lucide React | `^0.546.0` | Interface icons | Supplies consistent, accessible SVG icons for navigation, controls, status indicators, and actions. |
| Motion | `^12.23.24` | UI transitions and visual feedback | Makes workflow stages, panels, dialogs, and state changes easier to understand without changing application behavior. |
| Web Speech API | Browser platform capability | Speech recognition and transcript capture | Allows supported browsers to capture speech without sending raw audio to the application server. Manual text input remains available when speech recognition is unavailable. |

## 4. Backend and API stack

| Technology | Package or file | Used for | Why it is used |
| --- | --- | --- | --- |
| Express | `^4.21.2` | HTTP API, middleware, and route handling | Provides a small, familiar server layer for health checks, analysis, tasks, settings, knowledge, evaluations, and audit routes. |
| `@types/express` | `^4.17.21` | Express type definitions | Keeps request, response, middleware, and route code type-safe. |
| `dotenv` | `^17.2.3` | Loading local environment variables | Makes local configuration available without committing secrets. Vercel supplies deployment variables through its environment configuration. |
| Node `crypto` | Built into Node.js | Request identity hashing and IDs | Hashes rate-limit identities and generates request identifiers without adding another dependency. |
| AsyncLocalStorage | Built into Node.js | Request-scoped workspace context | Keeps guest or verified-user workspace scope available across asynchronous database operations without trusting browser-supplied ownership fields. |
| JSON API | Express routes in `server.ts` | Browser-to-server communication | Provides explicit, testable contracts for analysis, persistence, settings, uploads, and safety workflows. |

## 5. AI and responsible-AI stack

| Technology | Package or file | Used for | Why it is used |
| --- | --- | --- | --- |
| Google Gemini | `@google/genai` `^2.4.0` | Optional transcript analysis, refinement, and evaluation | Produces structured task proposals, summaries, evidence, uncertainties, and assumptions from natural-language input. |
| Gemini model preferences | Settings API and workspace settings | Standard, Fast, and Latest stable model selection | Lets users choose the desired speed or model profile while persisting the choice per workspace. |
| Gemini model fallback | `server/gemini.ts` | Alternate model selection after temporary provider failures | Improves resilience when a selected model is unavailable or under temporary demand. |
| Deterministic heuristic analyzer | `server/gemini.ts` | Local fallback when Gemini is missing or unavailable | Keeps demos and controlled local use functional without pretending that a provider response was received. |
| Weighted Gemini budgets | `server.ts` and `server/db.ts` | Per-minute and rolling daily usage protection | Prevents uncontrolled provider use. Analyze/refine consume one unit; evaluation consumes two because it runs two analyses. |
| Server-side guardrails | `server/guardrails.ts` | Risk detection and confirmation requirements | Ensures high-risk financial, destructive, credential, permission, and communication requests cannot silently become approved actions. |
| Human confirmation workflow | Confirmation API and UI | Recording confirm/cancel decisions | Keeps consequential actions human-reviewed; the current application records safe simulations rather than executing real external actions. |
| Lightweight RAG | `server/rag.ts` | Workspace knowledge retrieval | Adds relevant team or project context to analysis without requiring a separate vector database. |

## 6. Authentication and authorization

| Technology | Package or variable | Used for | Why it is used |
| --- | --- | --- | --- |
| Clerk | `@clerk/clerk-react` `^5.45.0` | Browser sign-in and account UI integration | Provides the user-facing authentication experience. |
| Clerk Express middleware | `@clerk/express` `^1.6.0` | Server-side session verification | Allows the API to derive a private workspace from a verified Clerk identity instead of trusting a client-provided user ID. |
| Guest workspace | Application behavior | Public demo access | Makes the live demonstration usable without sign-in, while clearly treating guest data as shared and non-confidential. |
| Workspace scoping | `server/db.ts` and `server.ts` | Data isolation | Separates guest data from each signed-in user's data and applies rate limits to the relevant identity. |

## 7. Data, persistence, and file services

| Technology | Package or variable | Used for | Why it is used |
| --- | --- | --- | --- |
| Neon PostgreSQL | `@neondatabase/serverless` `^0.10.4` | Durable deployed persistence | Provides managed PostgreSQL storage that works with serverless execution and persists workspace state across Vercel function instances. |
| PostgreSQL JSONB | Neon schema and `app_state` | Storing workspace snapshots | Stores tasks, analyses, settings, knowledge documents, and audit records as versioned workspace data while keeping the database model compact. |
| Version-checked writes | `server/db.ts` | Concurrent update protection | Prevents one serverless request from silently overwriting a newer workspace snapshot. |
| `api_rate_limits` table | Neon database | Shared request and Gemini usage counters | Makes rate limiting atomic and consistent across multiple serverless instances. |
| Local JSON storage | `data/local-store.json` | Development fallback | Allows local development without a database. It is not used as durable production storage. |
| Vercel Blob | `@vercel/blob` `^2.8.1` | Optional guest original-file storage | Stores public guest TXT, Markdown, and CSV originals when configured. Authenticated uploads retain indexed text privately rather than publishing the original. |
| File validation | `server/validation.ts` | Upload type, size, and path validation | Limits uploads to supported text formats and prevents unsafe or unintended blob paths. |

## 8. Deployment and hosting

| Technology | File or setting | Used for | Why it is used |
| --- | --- | --- | --- |
| Vercel | `vercel.json` | Hosting frontend and serverless API | Provides HTTPS deployment, static asset delivery, serverless execution, environment management, rewrites, and preview deployments. |
| Vercel static output | `dist` | Built React frontend | Delivers optimized browser assets generated by `vite build`. |
| Vercel serverless function | `api/index.ts` | Production API entry point | Lazily loads the Express application and avoids importing the Vite development server into the production function. |
| API rewrite | `vercel.json` | `/api/:path*` to `/api` | Ensures API requests reach the serverless handler before the single-page-app fallback. |
| SPA fallback | `vercel.json` | Non-API routes to `index.html` | Allows React client-side navigation and direct route refreshes. |
| Explicit ESM import | `api/index.ts` imports `../server.js` | Vercel module resolution | Avoids native ESM directory-import failures in the Vercel runtime. |
| Vercel environment settings | Preview and Production variables | Deployment configuration | Keeps secrets and environment-specific values outside source control and allows separate preview/production behavior. |

## 9. Environment variables

Environment variables are configuration inputs, not dependencies. They keep secrets, deployment settings, provider choices, and local paths out of source code.

| Variable | Secret? | Required when | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Durable Preview or Production storage | Neon PostgreSQL connection string. Required for persistent deployed workspaces and distributed rate limits. |
| `GEMINI_API_KEY` | Yes | Gemini-backed analysis | Server-only Google AI credential. If absent, the deterministic heuristic fallback is used. Never use a `VITE_` prefix. |
| `GEMINI_WORKFLOW_LIMIT_PER_MINUTE` | No | Optional | Weighted Gemini workflow budget per identity per minute. Default: `12`. |
| `GEMINI_WORKFLOW_LIMIT_PER_DAY` | No | Optional | Weighted Gemini workflow budget per identity per rolling 24 hours. Default: `100`. |
| `BLOB_READ_WRITE_TOKEN` | Yes | Guest original uploads | Enables Vercel Blob access for public guest originals. |
| `VITE_CLERK_PUBLISHABLE_KEY` | No | Clerk browser sign-in | Publishes the client-safe Clerk key into the browser bundle. |
| `CLERK_PUBLISHABLE_KEY` | No | Clerk server integration | Server-side counterpart that must match the browser publishable key. |
| `CLERK_SECRET_KEY` | Yes | Private signed-in workspaces | Server-only Clerk credential used to verify sessions. |
| `PORT` | No | Local or platform-specific startup | Local server port; defaults to `3000`. Vercel controls its function runtime. |
| `NODE_ENV` | No | Local/deployed behavior | Indicates development or production behavior. |
| `DATA_DIR` | No | Local JSON mode | Directory for local development data. |
| `DB_FILE` | No | Local JSON mode | Local JSON file path. |

Never commit real values. Use [.env.example](.env.example) as the safe configuration template.

## 10. Build, test, and quality tools

| Tool | Script or package | Used for | Why it is used |
| --- | --- | --- | --- |
| TypeScript compiler | `npm run lint` | Static type checking | Catches invalid types without producing build output. |
| Node test runner | `node --test` through `tsx` | Backend and validation tests | Tests persistence, isolation, rate limits, guardrails, validation, and concurrency behavior. |
| `tsx` | `^4.21.0` | Running TypeScript scripts and tests | Executes TypeScript directly in development and test commands. |
| esbuild | `^0.25.0` | Bundling the standalone production server | Produces the Node-compatible server artifact used by the local production start command. |
| Autoprefixer | `^10.4.21` | CSS compatibility processing | Adds browser-compatible CSS vendor prefixes where required. |
| Git | Repository version control | Change history and collaboration | Tracks source, deployment fixes, documentation, and reviewable changes. |

## 11. How the stack works together

1. React renders the workspace and uses the browser speech capability or manual text input.
2. Vite bundles the client; Vercel serves the resulting `dist` files.
3. Browser requests use relative `/api` URLs. Vercel rewrites them to the serverless entry point.
4. `api/index.ts` lazy-loads Express, which applies headers, logging, Clerk verification, workspace scoping, validation, guardrails, and rate limits.
5. The API retrieves workspace context from Neon and calls Gemini only when configured and within the weighted usage budget.
6. Gemini output is normalized and saved to Neon. If Gemini is unavailable, the deterministic fallback returns a safe local result.
7. Vercel Blob is used only for the optional public guest-original upload path.

## 12. Important boundaries

- Gemini and all server credentials remain server-side.
- Clerk authentication is not authorization by itself; the server still chooses the workspace scope.
- Guest mode is shared and public by design.
- Vercel serverless disk is not treated as durable storage; Neon is required for deployed persistence.
- Vercel Blob guest originals are public and must not contain confidential information.
- Provider retries improve reliability but do not replace application-level budgets or provider-side spending controls.
