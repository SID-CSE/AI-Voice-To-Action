# AI Voice-to-Action Assistant

> Turn spoken instructions and unstructured meeting discussions into clear, structured, and auditable tasks, action items, and executive summaries with strict safety guardrails and grounded team context.

---

## Table of Contents
1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Core Architecture & Capabilities](#core-architecture--capabilities)
   - [1. Real-Time Speech Recognition & Microphone Permissions](#1-real-time-speech-recognition--microphone-permissions)
   - [2. Multi-Stage Reasoning Workflow (ReAct Framework)](#2-multi-stage-reasoning-workflow-react-framework)
   - [3. Grounded Context & Internal Knowledge Base](#3-grounded-context--internal-knowledge-base)
   - [4. Guardrails & Consequential Action Detection](#4-guardrails--consequential-action-detection)
   - [5. Task Management System](#5-task-management-system)
   - [6. Audit Trail & Compliance Logging](#6-audit-trail--compliance-logging)
   - [7. Benchmark Evaluation Suite (ReAct vs. Baseline)](#7-benchmark-evaluation-suite-react-vs-baseline)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [API Reference](#api-reference)
7. [Getting Started & Local Development](#getting-started--local-development)
8. [Configuration & Environment Variables](#configuration--environment-variables)
9. [Safety & Security Highlights](#safety--security-highlights)

---

## Overview

In day-to-day engineering and product operations, action items from standups, planning calls, or quick voice memos often get lost in ambiguous language, unassigned owners, or missing deadlines. 

The **AI Voice-to-Action Assistant** bridges this gap:
- **Listens** to real-time speech or accepts written transcripts.
- **Understands** context using internal team directories, project documents, and role definitions.
- **Structures** speech into granular tasks with owners, deadlines, priority levels, confidence scores, and verbatim evidence.
- **Protects** against unauthorized or consequential actions (e.g. money transfers, account deletions, credential leaks) through server-authoritative guardrails.
- **Audits** every extraction with full model traceability, execution latencies, and human decision records.

---

## How It Works

```
[User Audio / Transcript]
           │
           ▼
[Microphone Permission Check & Web Speech API]
           │
           ▼
[Section 9: Input Validation & Sanitization]
           │
           ▼
[Section 22: Context Retrieval & Document Grounding]
           │
           ▼
[ReAct Multi-Stage Reasoning (Gemini API)]
 ├─ Stage 1: Input received
 ├─ Stage 2: Integrity & length validation
 ├─ Stage 3: Semantic understanding & intent detection
 ├─ Stage 4: Grounded context matching
 ├─ Stage 5: Structured task extraction & synthesis
 ├─ Stage 6: Safety check & consequential action scan
 └─ Stage 7: Schema verification & presentation
           │
           ▼
[Section 15 & 16: Guardrail Evaluation]
 ├─ Low Risk    ──► Direct display in Task Board & Dashboard
 └─ High Risk   ──► Halts execution & triggers Human Confirmation Dialog
           │
           ▼
[Section 23: Complete Audit Log Persisted to Storage]
```

1. **Permission Check & Capture**: When you click the microphone button, the app explicitly asks for microphone permission via both the Web Audio/MediaDevices API and a dedicated confirmation prompt. Speech is transcribed in real-time.
2. **Context Grounding**: The assistant scans internal project files (e.g., `team_members.txt`, `project_guidelines.txt`) to correctly associate ambiguous references like *"I"* or *"assign frontend to the lead"* to the correct team member (e.g., Siddharth Kumar, Rahul Sharma).
3. **Structured Extraction**: Gemini extracts action items, estimates realistic priority and deadline metadata, and isolates specific assumptions and uncertainties.
4. **Safety & Risk Assessment**: If high-risk verbs (e.g., *transfer funds*, *delete table*, *reveal password*) are present, the app flags the output as `HIGH` or `MEDIUM` risk, generates a pending action card, and halts any downstream automation until an authorized human user explicitly clicks **Confirm** or **Cancel**.
5. **Continuous Auditability**: Every single prompt, raw transcript, token response, confidence score, and confirmation state is permanently stored in the audit registry.

---

## Core Architecture & Capabilities

### 1. Real-Time Speech Recognition & Microphone Permissions
- **User-Consent Flow**: Explicitly requests microphone authorization (`navigator.mediaDevices.getUserMedia` and Web Speech API).
- **Graceful Fallbacks**: If access is denied or unavailable, users are clearly informed how to enable permissions or switch seamlessly to manual text input.
- **Live Interim Feedback**: Words stream directly onto the screen as they are spoken, allowing users to review and manually edit before triggering analysis.

### 2. Multi-Stage Reasoning Workflow (ReAct Framework)
Unlike simple zero-shot prompts, the assistant utilizes a structured Reason + Act (ReAct) workflow:
- **Observation & Decomposition**: Analyzes sentences, entities, and temporal markers (e.g., *"by Friday"*, *"next Tuesday"*).
- **Assumptions vs. Uncertainties**: Explicitly lists what was assumed (e.g., current sprint dates) vs. what remains ambiguous (e.g., unstated meeting times).
- **Verbatim Evidence Linking**: Each generated task links directly back to the exact quote in the transcript that justified it.

### 3. Grounded Context & Internal Knowledge Base
- **Document Management**: Built-in Knowledge Base stores project guidelines, team member roles, and company policies.
- **Dynamic Retrieval**: Queries are evaluated against documents to retrieve relevant excerpts with confidence relevance scores.
- **Entity Disambiguation**: Resolves pronouns and roles to real names and titles without hallucination.

### 4. Guardrails & Consequential Action Detection
- **Multi-Category Scanning**:
  - **Financial**: Money transfers, payouts, vendor payments, disbursements.
  - **Deletion / Destruction**: Database drops, user purges, log deletions, file removals.
  - **Security & Access**: Credential retrieval, role elevation, private keys, admin grants.
  - **External Communication**: Broadcast emails, newsletters, contract dispatch.
- **Server-Authoritative Enforcement**: Even if client inputs attempt to bypass the model, backend guardrail rules enforce `HIGH` risk tagging and mandatory confirmation.

### 5. Task Management System
- **Interactive Kanban / Table**: Filter tasks by status (`Pending`, `In Progress`, `Completed`), priority, or owner.
- **Inline Editing & Quick Add**: Modify task descriptions, reassign owners, or set deadlines on the fly.
- **Export Capabilities**: Export entire task lists or individual analyses to structured JSON and CSV.

### 6. Audit Trail & Compliance Logging
- **Immutable Log Store**: Logs the exact timestamp, prompt version, input source (`voice`, `text`, `demo`), model used, execution duration, and full AI payload.
- **Confirmation State Tracking**: Tracks whether proposed high-risk actions were `CONFIRMED`, `CANCELLED`, or marked `NOT_REQUIRED`.
- **Deep Inspection Drawer**: Inspect raw JSON payloads, reasoning stages, and context grounding scores for any past transaction.

### 7. Benchmark Evaluation Suite (ReAct vs. Baseline)
- **Side-by-Side Comparison**: Pre-configured test cases evaluate the ReAct reasoning pipeline against naive single-prompt baseline extraction.
- **Metrics Evaluated**:
  - Task Extraction Accuracy (%)
  - Ambiguity Detection Rate (%)
  - Guardrail & Safety Compliance (%)
  - Owner Attribution Precision (%)

---

## Technology Stack

- **Frontend**:
  - React 19 with TypeScript
  - Tailwind CSS (v4)
  - Lucide React (Icons)
  - Motion (Fluid animations)
  - Web Speech API & MediaDevices API
- **Backend**:
  - Express 4.x running in Node.js (Full-stack architecture on port 3000)
  - `@google/genai` (Google Gen AI TypeScript SDK)
  - Local JSON persistence engine (`/data/store.json`) with thread-safe file operations
- **Build System**:
  - Vite 6 + esbuild

---

## System Architecture

```
/
├── server.ts                  # Express server entry point & API route handlers
├── server/
│   ├── db.ts                  # JSON file storage manager (tasks, analyses, audit logs)
│   ├── gemini.ts              # Gemini API service, prompt engineering & ReAct parsing
│   └── guardrails.ts          # Server-side safety guardrails & consequential action scanner
├── src/
│   ├── App.tsx                # Main application state, navigation, and API coordination
│   ├── main.tsx               # Client React DOM entry point
│   ├── types.ts               # Shared TypeScript schemas, interfaces, and enums
│   ├── components/
│   │   ├── Navigation.tsx     # App header and tab switcher
│   │   ├── VoiceRecorder.tsx  # Mic permissions, Web Speech recording & interim transcript
│   │   ├── ProcessingWorkflow.tsx # Visual progress stepper for reasoning stages
│   │   ├── ResultDisplay.tsx  # Task cards, evidence accordion, refinement & export
│   │   ├── ConfirmationDialog.tsx # High-risk human confirmation modal
│   │   └── GroundedSourceCard.tsx # Grounded knowledge base citations
│   └── pages/
│       ├── DashboardPage.tsx      # Overview metrics & synchronized recent analyses
│       ├── VoiceAssistantPage.tsx # Core voice & text input interface
│       ├── TasksPage.tsx          # Task management, filters & status updates
│       ├── KnowledgeBasePage.tsx  # Internal document search & management
│       ├── AuditLogsPage.tsx      # Full audit history & inspection
│       ├── EvaluationPage.tsx     # ReAct vs. Baseline benchmark runner
│       └── SettingsPage.tsx       # Model selection, grounding toggles & system diagnostics
└── metadata.json              # Platform capabilities and microphone permissions
```

---

## API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check & Gemini configuration status |
| `/api/analyze` | `POST` | Executes multi-stage ReAct analysis on a transcript |
| `/api/refine` | `POST` | Iteratively refines existing tasks based on user guidance |
| `/api/tasks` | `GET` | Retrieves all saved tasks |
| `/api/tasks` | `POST` | Adds a new task manually |
| `/api/tasks/:id` | `PATCH` | Updates task status, owner, priority, or deadline |
| `/api/tasks/:id` | `DELETE` | Deletes a task |
| `/api/analyses` | `GET` | Retrieves recent analysis records |
| `/api/audit-logs` | `GET` | Retrieves compliance audit records |
| `/api/audit-logs/:id/action` | `POST` | Confirms or cancels a flagged high-risk proposed action |
| `/api/knowledge-base` | `GET` | Retrieves internal reference documents |
| `/api/knowledge-base` | `POST` | Adds a new document to the knowledge store |
| `/api/knowledge-base/:id`| `DELETE`| Deletes a knowledge base document |
| `/api/eval/cases` | `GET` | Returns benchmark evaluation test cases |
| `/api/eval/run` | `POST` | Runs benchmark evaluation against a test case |

---

## Getting Started & Local Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation
1. Clone the repository or open in Google AI Studio.
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see below).

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## Configuration & Environment Variables

Create a `.env` file in the root directory:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: In Google AI Studio Build, the `GEMINI_API_KEY` is automatically managed and injected via the Settings menu.*

---

## Safety & Security Highlights

1. **Human-in-the-Loop Safeguards**: High-risk financial, security, or data modification tasks cannot execute autonomously. They generate an interactive confirmation dialog with audit logging.
2. **Audio Privacy**: Speech recognition is executed locally via browser APIs. Audio streams are terminated immediately upon stopping recording.
3. **Defense-in-Depth Risk Analysis**: High-risk detection uses both deep semantic LLM evaluation and deterministic regular-expression rule matching.
4. **Transparent Citations**: Every piece of extracted metadata cites its source sentence from the user's transcript or knowledge base document.
