# Deployment Guide

This guide is for deploying the project as one Vercel application with a shared public guest demo and Clerk-backed private user workspaces. It uses service placeholders only. Never paste real credentials into chat or commit them to Git.

## 1. What We Are Deploying

```text
                         ┌── Guest / public demo ── shared data
Visitor ── Vercel ───────┤
                         └── Clerk sign-in ── verified private user data
                              │
                              └── Express API at /api
                                   ├── Neon PostgreSQL: saved workspaces
                                   ├── Gemini: AI transcript analysis (optional)
                                   └── Vercel Blob: public guest file originals (optional)
```

- **Vercel** builds and serves the React website and runs its Express API as serverless functions. A serverless function is a short-lived server process started to handle a request. Its local disk is not a durable database.
- **Neon** hosts PostgreSQL, a relational database. The application stores each workspace as one versioned JSON document in the `app_state` table.
- **Clerk** provides sign-up and sign-in. Authentication identifies a user. Authorization decides which data that user can access. The API verifies Clerk on the server and uses its verified user ID; it never accepts a browser-supplied user ID as authority.
- **Gemini** analyzes transcripts. Its API key is read by the server, not the browser. If the key is absent, the application uses its heuristic fallback.
- **Vercel Blob** stores original guest-upload files outside the serverless filesystem. Guest uploads are public. Signed-in uploads store indexed text in Neon but do not store an original file in Blob.

Guest visitors share one public workspace identified by `guest`. Signed-in users have private workspaces keyed by verified Clerk IDs. Never place confidential information in guest mode.

## STEP 0 — Prerequisites and what each tool is for

Use a Windows computer with VS Code, an internet connection, and these tools/accounts:

| Need | Official site | Why |
|---|---|---|
| Node.js and npm | [nodejs.org](https://nodejs.org/) | Run and build the project locally. npm is installed with Node.js. |
| Git | [git-scm.com](https://git-scm.com/) | Review and safely synchronize source changes. |
| GitHub account | [github.com](https://github.com/) | Vercel imports the project repository from GitHub. |
| Vercel account | [vercel.com](https://vercel.com/) | Hosts the site and API together. |
| Neon account | [neon.tech](https://neon.tech/) | Provides hosted PostgreSQL. |
| Google account / AI Studio | [aistudio.google.com](https://aistudio.google.com/) | Creates a Gemini API key if you want AI analysis. |
| Clerk account | [clerk.com](https://clerk.com/) | Provides sign-up/sign-in and verified user identities. |

Vercel Blob is created from the Vercel dashboard for your project. Confirm current prices, quotas, and free-tier limits with each provider before enabling public AI or file uploads.

## STEP 1 — Prepare the project locally

Open VS Code's **Terminal → New Terminal**. The commands below are for Windows PowerShell, run from the repository root—the folder containing `package.json`.

```powershell
node --version
npm --version
git --version
```

Each command should print a version number. If a command is not recognized, install the corresponding tool from its official site, close and reopen VS Code, and try again.

Install exactly the dependency versions recorded in `package-lock.json`:

```powershell
npm ci
```

A successful install ends without an npm error. If it fails, preserve the complete error and check network access, Node.js compatibility, and whether the lockfile is present. Do not delete the lockfile as a troubleshooting shortcut.

The actual project scripts are:

```powershell
npm run dev
npm run lint
npm test
npm run build:client
npm run build
```

`npm run dev` starts the Express API and Vite development middleware on port 3000. Keep that terminal open while using the local app. Open `http://localhost:3000` in your browser. Stop the server with **Ctrl+C**. `npm run lint` checks TypeScript, `npm test` runs the automated tests, `build:client` creates the Vite website, and `build` builds the website plus a standalone server bundle.

## STEP 2 — Verify GitHub and push safely

Before pushing anything, protect the work already in the folder.

1. Open [github.com](https://github.com/) and sign in.
2. Open your profile/repositories and locate the repository that contains this project. Do not create a duplicate if the correct repository already exists.
3. In VS Code, open **Terminal → New Terminal** and run these read-only PowerShell commands from the repository root:

   ```powershell
   git status --short --branch
   git branch --show-current
   git remote -v
   git log -5 --oneline --decorate
   git fetch origin
   git status --short --branch
   git log --oneline --left-right HEAD...@{upstream}
   ```

   These show changed files, the current branch, configured remote addresses, recent commits, and commits that differ after fetching. `git fetch` downloads remote commit information but does not merge it into your files.

4. Review every changed file in VS Code's Source Control view. Keep your existing UI edits. Check incoming differences before synchronizing; do **not** use `git pull` blindly. If you are unsure whether a change is yours or how to resolve a conflict, stop and ask for help before proceeding.
5. Before staging, inspect `.env`, `data/store.json`, local uploads, and other files for private data. Do not commit `.env`, credentials, production data, or private uploads. `.env.example` contains names only and is safe to commit.
6. Only after reviewing the changes and resolving synchronization intentionally should you stage specific files, commit, and push. Example commands (replace the file list and message with your reviewed changes):

   ```powershell
   git add path\to\reviewed-file.ts
   git diff --cached
   git commit -m "Describe the reviewed change"
   git push origin <YOUR_BRANCH>
   ```

   `git diff --cached` lets you inspect exactly what would enter the commit. Never use `git add .` unless you have reviewed every changed and untracked file.

## STEP 3 — Create and initialize Neon

A **database connection string** is a credential-bearing address the backend uses to connect to PostgreSQL. It is a secret because it can grant access to your database.

1. Open [neon.tech](https://neon.tech/) and sign in or create an account.
2. Choose the dashboard action to create a project (the button may be called **Create project** or similar).
3. Enter a recognizable project name, such as `actionflow-production`; this is just a label, not a secret.
4. Choose a region reasonably close to your Vercel deployment region. Region availability and options depend on your provider account.
5. Create the project. Neon provisions a PostgreSQL database and role/user as part of the project setup. A **role** is a database account with permissions to access the database.
6. Open the project's connection details. Select the pooled connection option if Neon offers one for serverless applications. Copy the full PostgreSQL connection string using the dashboard's copy control. It should begin with a PostgreSQL scheme such as `postgresql://` or `postgres://` and include host, database, and credential information.
7. Do not send that value to anyone. The mapping is:

   ```text
   DATABASE_URL = <MY_DATABASE_URL>
   ```

8. The app creates `app_state` and `api_rate_limits` tables at startup and adds the `version` column safely if upgrading an existing `app_state` table. `db/schema.sql` documents those definitions. There is no separate migration command to run for a fresh database.
9. The deployed guest workspace is initialized from the demo seed data in `server/db.ts`. The local `data/store.json` is **not** imported to Neon automatically. The inspected file has empty task, analysis, audit, and knowledge arrays; keep it as a local file unless you intentionally choose a separately reviewed migration.
10. In Vercel, the connection string will later go under **Project → Settings → Environment Variables** as `DATABASE_URL`.

If Neon reports that a connection failed, confirm that you copied the complete connection string, that it belongs to the project you created, and that Vercel/local configuration has no accidental surrounding spaces. Never paste the actual string into chat or a public issue.

## STEP 4 — Configure Clerk development and production authentication

Authentication checks **who** signed in. Authorization checks **which workspace** the request may use. This app's API uses verified Clerk identity for private workspaces; a publishable UI key by itself does not secure API routes.

1. Open [clerk.com](https://clerk.com/) and sign in or create an account.
2. Create an application using a name you recognize, such as `ActionFlow`. Choose the sign-in methods you want to support from the methods Clerk offers. This project uses Clerk's standard sign-in and sign-up UI; it does not configure a separate custom OAuth callback route.
3. Use Clerk's development instance for local development and its production instance for the deployed production domain. Copy the publishable and secret keys from the matching instance; do not mix development keys with production keys.
4. In the Clerk application dashboard, locate the API keys section. Copy the **publishable key** and **secret key** separately. The publishable key is browser-safe; the secret key is server-only and must never be put in frontend code or a `VITE_` variable.
5. Configure the actual Vercel domain under Clerk's allowed/authorized domains or instance domain settings, following the current Clerk dashboard instructions. Add the production domain and any Preview domain you intend to test. Vercel supplies those domains after deployment; do not invent them.
6. These project mappings are:

   ```text
   VITE_CLERK_PUBLISHABLE_KEY = <MY_CLERK_PUBLISHABLE_KEY>
   CLERK_PUBLISHABLE_KEY = <MY_CLERK_PUBLISHABLE_KEY>
   CLERK_SECRET_KEY = <MY_CLERK_SECRET_KEY>
   ```

   `CLERK_PUBLISHABLE_KEY` is the server's non-secret configuration. `VITE_CLERK_PUBLISHABLE_KEY` is embedded in the browser bundle and therefore public. `CLERK_SECRET_KEY` stays server-side. The publishable variables must match each other and all three must belong to the same Clerk instance.
7. Set all three together for private accounts. Partial Clerk configuration causes the API to return a configuration error rather than silently mis-scope requests. Clerk verifies bearer session tokens on the server; sign-out clears the client session and the app remounts into the guest workspace.
8. After deployment, create a test user, sign in, create a test task, reload, sign out, and verify guest data appears. Use two accounts to verify that neither sees the other's task.

## STEP 5 — Create the optional Gemini API key

An **API key** is a credential that lets this server call a provider on your behalf. This one can incur usage or quota, so keep it private.

1. Open [Google AI Studio](https://aistudio.google.com/) and sign in with the Google account you intend to use for this project.
2. Find the **API keys** section in the AI Studio navigation. Google may ask you to select or create a Google project; choose one you control and can identify as this app's project.
3. Use the action to create an API key. Give it a recognizable label if the interface offers one, for example `ActionFlow Vercel`.
4. Copy the key once the dashboard shows it. Do not paste it into frontend code, `VITE_...`, GitHub, or chat.
5. The mapping is:

   ```text
   GEMINI_API_KEY = <MY_GEMINI_API_KEY>
   ```

6. Add it to the local `.env` for local testing and to Vercel's server environment settings for deployment. If you do not configure it, heuristic analysis remains available; successful deployment does not then mean Gemini is enabled.
7. Test it by submitting a short non-sensitive transcript in the app. Confirm the response is a model-backed analysis and that Vercel function logs have no provider error. Never include the key in a screenshot or log report.

## STEP 6 — Configure optional Vercel Blob uploads

**Blob storage** stores file contents as objects, rather than on the server's local disk. Serverless function disks are temporary, so they are not suitable for retaining uploads.

1. Sign in at [vercel.com](https://vercel.com/).
2. Open the project after it has been imported. Open **Storage** (the exact menu label can vary) and choose the option to create/connect a Blob store.
3. Follow the dashboard prompts to create the store and connect it to this Vercel project.
4. Find the store's read/write token or environment variable instructions. Copy the value privately.
5. The mapping is:

   ```text
   BLOB_READ_WRITE_TOKEN = <MY_BLOB_TOKEN>
   ```

6. Configure that variable in Vercel. Do not add a `VITE_` prefix. Guest uploads use the Vercel Blob client-upload flow and are limited to TXT, MD, and CSV text files up to 512 KB.
7. **Guest originals are public:** a person who obtains the Blob URL can open the uploaded file. Only upload public demonstration material—never credentials, private notes, student records, client information, or other confidential documents.
8. Signed-in users can add text files for indexing, but this app does not upload or retain their original files in Blob. Do not infer private file storage from private workspace metadata. Private originals require separate access-restricted upload authorization and a download handler that verifies Clerk identity against the document's workspace; do not enable private originals until both controls are implemented and tested.
9. Test with a small, non-sensitive TXT file. Confirm that it appears in the knowledge base and that the original URL is shown only for a guest upload. If the token is missing, uploads return a storage configuration error; text entries can still be added.

## 9. Environment Variables Master Table

| Variable | Purpose / source | Client or server | Required? | Development setting | Production setting |
|---|---|---|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | Server-only secret | Required for persistent production and distributed rate limits | Optional; blank selects local JSON storage | Required in Preview and Production |
| `CLERK_SECRET_KEY` | Clerk server verification key | Server-only secret | Required for private sign-in | Required to test Clerk private accounts | Required for guest + private production mode |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key used by server middleware | Server configuration, not secret | Required together with other Clerk keys | Same as matching Clerk development instance | Required; use the matching Production instance |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk key bundled into browser UI | Client-safe/public | Required for Clerk UI | Same as matching Clerk development instance | Required; redeploy after changing it |
| `GEMINI_API_KEY` | Google AI Studio API credential | Server-only secret | Optional; heuristic fallback is available | Optional | Optional; required only for Gemini-backed responses |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token | Server-only secret | Optional; required for public guest original uploads | Optional | Optional; required only for guest Blob uploads |
| `PORT` | Local Express listening port; defaults to 3000 | Server, non-secret | Local only | `3000` or leave unset | Do not set; Vercel manages function ports |
| `NODE_ENV` | Runtime mode | Server, non-secret | Local convenience | `development` | Vercel-managed; do not override without a reason |
| `DATA_DIR` | Local JSON data directory | Server, non-secret | Local only | `./data` or leave unset | Not a persistent Vercel storage setting |
| `DB_FILE` | Local JSON guest database file | Server, non-secret | Local only | `./data/local-store.json` or leave unset | Not a persistent Vercel storage setting |
| `VERCEL` | Supplied by the Vercel runtime to require durable database configuration | Server platform value | Platform supplied | Not normally set | Vercel supplied; do not add manually |
| `DISABLE_HMR` | Optional local Vite hot-reload switch | Development tool | No | Set `true` only if instructed for local editing | Do not set |

The Clerk variables must come from the same Clerk instance. Only `VITE_CLERK_PUBLISHABLE_KEY` is intentionally embedded in the browser bundle; never prefix a secret with `VITE_`. Per workspace, the API caps tasks at 500 and knowledge at 50 documents/2 MiB total, in addition to a 512 KiB limit per indexed file. These limits reduce accidental or abusive snapshot growth; they are not a substitute for monitoring Neon usage.

## 10. Configure Local `.env`

A `.env` file contains local settings for the application. The real file is ignored by Git. From the repository root in VS Code, create a new file named exactly `.env` and use this structure, replacing placeholders only on your computer:

```env
DATABASE_URL=<MY_DATABASE_URL>
GEMINI_API_KEY=<MY_GEMINI_API_KEY>
BLOB_READ_WRITE_TOKEN=<MY_BLOB_TOKEN>
VITE_CLERK_PUBLISHABLE_KEY=<MY_CLERK_PUBLISHABLE_KEY>
CLERK_PUBLISHABLE_KEY=<MY_CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<MY_CLERK_SECRET_KEY>
PORT=3000
NODE_ENV=development
DATA_DIR=./data
DB_FILE=./data/local-store.json
```

Remove the angle-bracket placeholders for services you have not configured, leaving those optional lines blank. Do not add spaces around `=`. Never commit or share `.env`. `.env.example` contains names and safe blank values and is suitable for GitHub.

The database module loads dotenv configuration before reading `DATABASE_URL`. Every Vercel runtime requires Neon; local development can use JSON storage if `DATABASE_URL` is blank. Local user JSON files are hashed by verified scope and kept under the ignored `data/users/` directory.

## 11. Run Database Setup and Understand Existing Data

- `data/store.json` is the existing tracked JSON file. The inspected file has empty task, analysis, audit, and knowledge arrays; it does not hold the current demo seed entries.
- Local runtime writes now use ignored `data/local-store.json`. If that file is absent and the old `data/store.json` exists, local startup copies normalized state into the new runtime file without overwriting or deleting the tracked source.
- Demo guest data is defined in `server/db.ts`. A new Neon `guest` scope is seeded from those application defaults. The local JSON file is not imported into Neon.
- The database service creates `app_state`, safely adds its `version` column, and creates `api_rate_limits` when it connects to Neon. No separate SQL command is required for the normal fresh-project deployment.
- `db/schema.sql` documents the tables. If you need to apply it manually in Neon, open the Neon SQL editor, paste the file contents, review the SQL, and run it. It creates/updates these tables without dropping existing records. This manual step is optional because the server performs the initialization on startup.
- The previous normalized design in `db/normalized-schema.sql` is not the runtime schema. Do not run it expecting this app to use those tables.
- If the local JSON file acquires information you want to preserve, make a backup before changing anything. Local startup preserves the old tracked file by copying it to the ignored runtime file if needed. This app does not provide a general JSON-to-Neon import command. A deliberate hosted migration must map and verify each field; do not overwrite a populated Neon guest workspace by importing local data.

To make a backup on Windows PowerShell, from the project folder:

```powershell
Copy-Item .\data\store.json .\data\store.backup.json
```

Confirm the backup file exists in VS Code's Explorer. Keep it local and do not commit it if it contains user data.

## 12. Start Locally

From the repository root:

```powershell
npm run dev
```

The terminal should report the local server on port `3000`. Keep it open, then visit:

```text
http://localhost:3000
```

The local API health endpoint is:

```text
http://localhost:3000/api/health
```

With local JSON mode, a healthy development response reports application status, database configured/available/persistent state, and whether Gemini, Blob, and Clerk are configured. `configured: false` for the database is expected only for local file mode; it is not acceptable for durable production storage.

## 13. Test Guest Mode Locally

1. Open the local site without signing in.
2. Confirm the banner identifies the shared Guest Demo and warns that data is public.
3. Create a clearly labeled test task.
4. Refresh the page and confirm the task remains.
5. Open another browser profile or private window and confirm it sees the same guest task. This sharing is intentional.
6. Delete the test task when finished. Be aware that deleting guest data changes the shared public demo.

### Optional local private-account check

When Clerk development keys are configured, sign in as User A, create a task, sign out to guest, sign in as User B, and verify the tasks are isolated. Repeat after restarting the local server. Local file tests do not prove hosted Neon behavior; complete STEP 10 against the deployed Preview or Production environment before inviting users.

## STEP 7 — Import and deploy the GitHub project on Vercel

1. Sign in to [vercel.com](https://vercel.com/) using the GitHub account that can access the repository. Review the GitHub access prompt and grant access only to the intended repository or repositories.
2. Choose the dashboard action to **Add New / Project / Import Project** (labels can vary).
3. Select the repository containing this project and select the branch you have reviewed and pushed. Do not deploy from an unreviewed branch with unresolved changes.
4. Set **Root Directory** to the repository folder containing `package.json`, `vercel.json`, and `api/index.ts`—the repository root for this project.
5. Confirm the framework is Vite or the equivalent auto-detected static frontend setup.
6. Confirm the project's actual Vercel configuration:

   ```text
   Build command: npm run build:client
   Output directory: dist
   ```

   The build command produces the static React site. The `api/index.ts` entry and `vercel.json` rewrite route `/api/*` to the Express handler in the same Vercel project. Do not create a separate backend project.
7. Add environment variables as described in the next section. Add Neon and Clerk before expecting persistent private accounts. Gemini and Blob are optional features.
8. Start with a **Preview** deployment if available. Choose **Deploy** and wait for the build log to complete.
9. Open the deployment details and click the generated deployment domain. This HTTPS address is the deployment URL; Vercel assigns it, so its value is not known until the project deploys.
10. If the build fails, open the deployment's **Build Logs**, find the first error above the final failure message, and address that cause. Do not treat a failed build as a deployed app.

### Configure Vercel environment variables

In Vercel, open the project → **Settings → Environment Variables** (the dashboard may rename the menu). Create each variable with the exact name below, paste its value from the named provider, select the environments, and save. Never put the actual value into this guide or a Git commit.

| Name | Copy value from | Environments |
|---|---|---|
| `DATABASE_URL` | Neon project's pooled PostgreSQL connection details | Preview and Production; Development only if using Vercel's local environment workflow |
| `CLERK_SECRET_KEY` | Clerk API keys | Preview and Production; Development only if using Clerk locally |
| `CLERK_PUBLISHABLE_KEY` | Clerk API keys | Preview and Production; Development if needed |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same Clerk publishable key | Preview and Production; Development if needed |
| `GEMINI_API_KEY` | Google AI Studio | Preview and Production if enabling Gemini there |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store settings | Preview and Production if enabling Blob uploads |

- **Production** means the live deployment attached to the production branch/domain.
- **Preview** means a test deployment created for a branch or change. Use it to test settings before promoting changes.
- **Development** means local development settings; only select this when using Vercel's local-development tooling.

Use separate Neon databases and separate Clerk instances for Preview and Production if you want test users/data isolated from the live app. If using one Neon database, remember Preview deployments will change the same shared guest workspace. Do not share test credentials between unrelated projects.

After adding or changing a variable, trigger a new deployment so Vercel rebuilds the frontend and functions with the new settings. `VITE_CLERK_PUBLISHABLE_KEY` is included in the generated browser code; that key is public, but the secret key is not. Use the Production Clerk instance and production database for the live deployment; configure Preview with a separate Clerk instance and Neon database when you need test-data isolation.

## STEP 8 — Configure the Vercel domain

1. For the default domain, open the Vercel project's **Settings → Domains** (menu names can change) and confirm the generated `*.vercel.app` domain is assigned to the production deployment.
2. In Clerk's production instance, add that exact HTTPS domain to the allowed/authorized domains. Use the domain Vercel actually assigned; do not guess it.
3. Optional custom domain: register a domain with a registrar you trust, add it in Vercel's **Settings → Domains**, and follow Vercel's displayed DNS instructions at the registrar. Do not change DNS records until you understand what existing records they replace.
4. Wait for Vercel to confirm the domain and HTTPS certificate are ready. Open the domain and `/api/health` to verify it reaches this deployment.
5. Add the custom domain to Clerk's production authorized-domain settings. If the canonical domain changes, update Clerk's allowed domain and use Vercel's domain redirect setting so one canonical host is used.
6. Add any domain used for Preview testing separately in the matching Clerk development/preview instance, if Clerk requires it. Do not mix production credentials with Preview.

## STEP 9 — Test the production deployment

Copy the actual HTTPS domain from the Vercel project overview. In the examples below replace `<MY_VERCEL_URL>` with that exact domain only—do not include `https://` twice and do not include the angle brackets.

Open the site and check:

```text
https://<MY_VERCEL_URL>/
https://<MY_VERCEL_URL>/api/health
```

Or use Windows PowerShell:

```powershell
Invoke-RestMethod -Uri "https://<MY_VERCEL_URL>/api/health"
```

A successful response should show `status: ok`, a reachable database with `configured: true`, `available: true`, `persistent: true`, and safe booleans for Gemini, Blob, and Clerk configuration. The response must not contain credentials. If the database is degraded or the route returns 503, open Vercel **Functions/Runtime Logs** and check the server-side error without sharing secrets.

Test these flows with non-sensitive data:

### Guest

- Open the site while signed out.
- Create a guest task, reload, and verify it persists.
- Open another browser profile and verify that guest data is shared.

### Private accounts

- Sign up/sign in as User A, create a task, reload, and verify it remains.
- Sign out and verify the app switches to guest data without leaving User A data on screen.
- Sign in as User B and verify User A's data is absent.
- Sign in again as User A and verify the User A task remains.
- Repeat after a new deployment or later session to check Neon restoration.

### Gemini

Submit a short transcript with no sensitive content. Verify the analysis and check function logs if the request fails. If the key is absent, the heuristic fallback is expected.

### Blob

Upload a small, non-sensitive TXT file while signed out. Verify its document appears and its original is publicly accessible by design. Test an MD and CSV similarly if desired. Do not upload private files. In a signed-in workspace, verify text can be indexed without a Blob original link.

A health response alone does not prove database durability. Test reads and writes, and verify Neon contents from its dashboard if you are comfortable doing so. A later request after the function instance has gone cold is a useful persistence check, but the platform does not provide a button that guarantees a cold start on demand.

## STEP 10 — Verify authentication and workspace isolation

Use separate browser profiles or one normal browser and one private/incognito window. Keep the Guest check signed out.

1. In Browser 1, sign in as User A. Create a uniquely named task such as `A-private-check-<date>` and a private knowledge text entry. Refresh and confirm both persist.
2. In Browser 2, sign in as User B. Confirm neither User A item appears. Create `B-private-check-<date>` and refresh.
3. In Browser 1, reload and confirm User B's task is absent. Try ordinary task update/delete controls only on User A's records; do not alter another account's data as a test.
4. In the signed-out Guest session, confirm neither private task or document appears. Create a clearly public guest task; verify it does appear for the other signed-out browser.
5. Repeat the sequence Guest → User A → User B → Guest → User A in one browser. At each transition verify the active workspace banner and data list before creating anything.
6. Sign out and ensure the guest demo appears, with no previously visible private data remaining on screen. Verify Clerk sign-in works on the exact deployed domain, not only on localhost or a Preview domain.
7. Keep test data non-sensitive and delete it from each correct workspace when finished.

## STEP 11 — Test file uploads

1. While signed out, upload a small, non-sensitive `.txt` file under 512 KB. Confirm its indexed text appears after refresh and its original Blob link is public by design.
2. Repeat with `.md` and `.csv` if needed. Do not put confidential content in any guest file.
3. Try an unsupported extension and a file larger than 512 KB; the browser should reject both before upload. Confirm no document is created.
4. Sign in as User A and upload a text file. Confirm its text is indexed in User A's workspace after refresh and there is no public original-file link. This flow stores indexed text only; it does not retain the original file.
5. Sign in as User B and verify User A's indexed content is absent. Sign out and verify it is absent from guest mode too.
6. If Blob is configured, delete the guest test document and confirm the guest Blob original is cleaned up when possible. Never use real private files for upload tests.

## STEP 12 — Exercise safe failure cases

Use a Preview deployment and test data only. Do not break Production settings or remove production credentials to simulate failure.

- **Database unavailable:** use an isolated Preview environment with an intentionally invalid `DATABASE_URL`, redeploy, and confirm `/api/health` reports degraded/unavailable and data routes return a safe error. Restore the correct Preview connection string and redeploy.
- **Gemini unavailable:** in Preview, temporarily leave `GEMINI_API_KEY` blank or use an isolated test key without quota; confirm heuristic analysis still responds and no secret is shown. Restore the desired Preview setting afterward.
- **Missing configuration:** test incomplete Clerk keys only in Preview. API routes must report configuration failure rather than claiming a signed-in private workspace is active. Restore all matching Clerk keys.
- **Invalid authentication:** send an invalid bearer token to a harmless API request from a test client; because Guest is public, the request can only resolve to guest scope, never another private user. Do not put a valid user's token in a shared script or log.
- **Invalid request:** try an invalid task status and a malformed confirmation request; the API should reject them with a 4xx response and not change stored data.
- **Rate limit:** from a single test identity, make more than 12 requests to an expensive endpoint in one minute or more than 3 reset/audit-clear requests. Expect HTTP 429, then wait for the window to expire. Avoid repeated Gemini calls that could incur cost.

## STEP 13 — Roll back a broken deployment

1. Open Vercel **Deployments** and identify the last deployment that passed the production smoke tests.
2. Use Vercel's current **Promote**, **Rollback**, or equivalent action to route the production domain back to that known-good deployment. Confirm the production domain points to the intended deployment.
3. Check `/api/health`, Guest mode, and a private test account after rollback.
4. Do not reset or restore Neon as a routine code rollback. The runtime schema changes are additive/idempotent; application code rollback does not undo user data. Do not manually edit or delete database rows to fix a deployment.
5. If environment variables caused the issue, restore the last known-good values in Vercel, save, redeploy, and verify again. Rotate a secret only if it was exposed or compromised; update every environment that uses it.
6. Keep a brief incident note with the failed deployment identifier, error, rollback action, and verification results—never include secret values.

## STEP 14 — Update the application safely

1. Make changes locally and review them in VS Code; preserve unrelated in-progress files.
2. Run `npm ci`, `npm run lint`, `npm test`, `npm run build:client`, and `npm run build`.
3. Review `git status --short --branch` and `git diff`. Stage specific reviewed files, not every file blindly. Do not force-push or rewrite history.
4. Commit the reviewed changes and push the intended branch only after checking that no `.env`, credentials, private data, or local runtime files are included.
5. Wait for Vercel Preview to build. Test health, guest mode, and the relevant private-account flows there.
6. Merge/promote through your normal reviewed workflow, wait for Vercel Production deployment, then repeat the production smoke test and retain the previous known-good deployment for rollback.

## STEP 15 — Troubleshooting

| Problem | What it means | Where to check | Fix and verification |
|---|---|---|---|
| Application failed to build | Vercel could not create the frontend/function deployment | Vercel deployment → Build Logs; locally run `npm run lint` and `npm run build` | Fix the first actual TypeScript/build error, push the reviewed fix, redeploy, and confirm the build completes. |
| `npm ci` fails | Dependency installation or lockfile/network issue | VS Code terminal output | Confirm Node/npm versions and network access. Preserve the lockfile and error; do not delete dependencies as a shortcut. |
| `/api/health` returns 503 | Neon is unavailable/missing in production, or initialization failed | Vercel Settings → Environment Variables and Runtime Logs | Verify `DATABASE_URL` is set for the active environment, redeploy, then confirm database reports available and persistent. Never print the connection string. |
| `DATABASE_URL` missing | Production persistence is not configured | Vercel environment settings; health response | Copy the Neon connection value into `DATABASE_URL`, save, redeploy, and check health again. |
| Gemini not working | Key/configuration/quota/provider error | Confirm `GEMINI_API_KEY` exists in the correct Vercel environment; inspect Runtime Logs | Add or correct the server-side key and redeploy. Do not create a `VITE_GEMINI_API_KEY`. If absent, the heuristic fallback is expected. |
| Clerk sign-in works but user data is not private | UI sign-in is not sufficient; server configuration may be incomplete or a client bundle may be stale | Confirm all Clerk variables, deployment logs, and `/api/session` in the signed-in browser | Ensure `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` are configured together and redeployed. Verify account switching and API scope behavior; never trust a browser-supplied user ID. |
| Data disappears after refresh/new deployment | Database write/read or environment selection failed | `/api/health`, Vercel Runtime Logs, Neon project data | Confirm the same expected Neon project is used for that environment and verify the API write completes. Run the two-account isolation test again. Do not import local JSON over existing guest data without a backup and reviewed migration. |
| Upload fails | Blob token, file size/type, permission, or metadata request failed | Vercel Runtime Logs; verify `BLOB_READ_WRITE_TOKEN`; browser message | Try a non-empty TXT/MD/CSV file no larger than 512 KB. Guest originals require Blob configuration and are public. Signed-in workspaces save indexed text only. |
| File too large or unsupported | Upload exceeds the 512 KB limit or is not TXT/MD/CSV | File picker and upload message | Choose a supported text file under the limit. PDF/DOCX extraction is not implemented. |
| CORS error | Browser rejected a cross-origin request | Browser developer tools → Console/Network | The intended Vercel setup is same-origin and should not require separate CORS configuration. Confirm the frontend is using relative `/api` paths and is opened from the Vercel deployment, not an unrelated domain. |
| `/api/...` returns 404 | API rewrite/function path not active or URL was typed incorrectly | Vercel deployment files/logs; inspect `vercel.json` | Confirm `api/index.ts` is deployed from the project root, `/api` is included, and the endpoint path is correct. Redeploy after fixing configuration. |
| `CLERK_*` partial-configuration error | Only some Clerk keys are set | Vercel environment settings | Configure both server secret and publishable key; configure the browser publishable key too for the UI. Save and redeploy. To intentionally disable Clerk locally, leave all Clerk keys blank. |
| 429 rate-limit response | This IP or signed-in identity exceeded the expensive-operation limit | Wait one minute; check API response and server logs | Retry after the window resets. The application uses Neon-backed limits for AI and upload-token requests; public guest access can still be abused, so monitor provider usage and set provider-side spend/usage controls. |
| Local and deployed data differ | They use different storage/environment settings | Local `.env`, Vercel environment selection, Neon project | Confirm both target the intended database. Local JSON mode is separate and is not automatically synchronized with Neon. |

## 19. Security Checklist

- Never commit `.env`, API keys, database URLs, passwords, tokens, or private production data.
- Never expose a server secret with a `VITE_` prefix.
- Never trust a browser-supplied user ID for authorization. The server derives the private scope from verified Clerk authentication.
- Guest data is intentionally shared/public. Do not enter confidential information in guest mode.
- Signed-in user records are stored under the verified Clerk user ID; test with two accounts before treating the app as private.
- Guest Blob originals are public URLs. Do not upload confidential files in guest mode.
- Rotate provider credentials immediately if a secret is exposed or committed.
- Keep Neon connection strings and server-only Clerk/Gemini/Blob values out of screenshots, logs shared publicly, and source code.
- Public AI and upload features can consume quotas or incur costs. Monitor provider usage and set provider-side limits where available.

## 20. Final Deployment Checklist

- [ ] GitHub repository and branch reviewed
- [ ] Existing changes preserved; no unreviewed merge/pull performed
- [ ] No secrets committed
- [ ] `data/store.json` reviewed and backed up if it later contains data worth preserving
- [ ] Neon database created
- [ ] `DATABASE_URL` configured for Vercel Preview and Production
- [ ] Runtime tables initialized and health reports persistent storage
- [ ] Gemini configured if model-backed analysis is wanted
- [ ] Vercel Blob configured if guest uploads are wanted
- [ ] Clerk configured together with all publishable/server keys if private accounts are wanted
- [ ] Local lint, tests, frontend build, and full build passed
- [ ] Guest mode tested as shared public data
- [ ] User signup, sign-in, sign-out, and identity switching tested
- [ ] User A and User B isolation tested
- [ ] Database persistence checked after refresh and a later/new function instance
- [ ] `/api/health` tested without exposing secrets
- [ ] TXT/MD/CSV upload tested with non-sensitive content
- [ ] Vercel deployment completed and production URL tested over HTTPS
- [ ] Vercel build and function logs reviewed
