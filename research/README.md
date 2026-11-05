# Research Workspace

This folder contains the research assessment, reproducibility artifacts, and final paper for ActionFlow AI. All reported 500-record results are generated from saved result files; no result is inferred from an incomplete run.

## Current status

- The application and evaluation milestone are complete.
- The final benchmark contains 500 records, 230 action-positive records, and 244 adjudicated disagreements.
- Eight complete comparison conditions, bootstrap intervals, and an overlapping error taxonomy are saved under `research_data/`.
- The final paper is [`ActionFlow_AI_IEEE_Paper_Final.docx`](./ActionFlow_AI_IEEE_Paper_Final.docx).
- The paper figures and generated architecture documentation are versioned separately from disposable raw corpus material and checkpoints.
- RAG retrieval quality and semantic equivalence scoring remain future extensions, not claimed results.

## Research tooling

| Path | Purpose |
| --- | --- |
| [`../evaluation/benchmark.schema.json`](../evaluation/benchmark.schema.json) | Machine-readable annotation contract |
| [`../evaluation/pilot.json`](../evaluation/pilot.json) | Sanitized one-record pilot fixture |
| [`../evaluation/annotation.ts`](../evaluation/annotation.ts) | Evidence and character-span validator |
| [`../evaluation/dataset.ts`](../evaluation/dataset.ts) | Validated annotation loader and scorer adapter |
| [`../evaluation/runner.ts`](../evaluation/runner.ts) | Analyzer-agnostic offline experiment runner |
| [`../server/evaluation.ts`](../server/evaluation.ts) | Gold scorer and macro aggregation |

## Validation commands

```bash
npm ci
npm test
npm run lint
npm run build
```

## Manual research work still required

See [`MANUAL_INPUT_CHECKLIST.md`](./MANUAL_INPUT_CHECKLIST.md) for the exact files and decisions required. The recommended strategy is AMI as the primary voice/multi-party corpus, MeetingBank for external generalization, and QMSum only for query-focused retrieval experiments.

## Imported AMI pilot

The first manually reviewed pilot is now available locally under `research_data/`:

- `actionflow_pilot_50_annotated.csv` — human-reviewed worksheet
- `actionflow_pilot_50.json` — schema-compatible records
- `pilot_manifest.json` — provenance, split, and count metadata
- `actionflow_action_pilot_50.csv` — second action-rich worksheet awaiting review
- `actionflow_action_pilot_50_annotated.csv` — completed second worksheet
- `actionflow_action_pilot_50.json` — validated second pilot
- `actionflow_annotated_pilot_100.json` — combined 100-record pilot
- `action_pilot_manifest.json` — second-pilot counts and review flags
- `ami_pilot_heuristic_results.json` — deterministic offline baseline results
- `ami_pilot_gemini_results.json` — Gemini baseline results
- `ami_pilot_gemini_react_results.json` — exploratory Gemini ReAct workflow results
- `ami_pilot_gemini_31_flash_lite_results.json` — `gemini-3.1-flash-lite` model condition
- `ami_pilot_gemini_31_flash_lite_preview_results.json` — `gemini-3.1-flash-lite-preview` model condition
- `ami_pilot_gemini_35_flash_lite_results.json` — `gemini-3.5-flash-lite` model condition
- `ami_pilot_statistical_analysis.json` — deterministic bootstrap intervals and per-case error analysis
- `actionflow_action_pilot_expansion_400_annotated.csv` — independently annotated and adjudicated expansion worksheet
- `actionflow_expansion_400.json` — validated 400-record expansion
- `actionflow_annotated_pilot_500.json` — combined 500-record evaluation dataset
- `actionflow_500_manifest.json` — 500-record provenance and adjudication metadata
- `ami_pilot_heuristic_500_results.json` — 500-record deterministic heuristic baseline
- `ami_pilot_hybrid_500_results.json` — 500-record offline hybrid candidate/evidence baseline
- [`GEMINI_PILOT_RESULTS.md`](./GEMINI_PILOT_RESULTS.md) — Gemini provenance and comparison

The first pilot contains 50 transcript segments from 13 AMI meetings and the second action-rich pilot contains 50 segments from 38 meetings. These records are retained as historical pilot diagnostics; the completed publication-oriented evaluation uses the expanded 500-record manifest below.

The deterministic offline heuristic was run over all 100 records as a pipeline smoke test. It achieved 40 macro task-extraction accuracy, 45 macro task recall, 97 macro risk accuracy, and 97 macro confirmation accuracy under the current scorer. These are preliminary pilot diagnostics only: the sample is small, action labels are not independently adjudicated, and the heuristic is not a publication baseline.

The Gemini baseline was then run over all 100 records with 100 successful Gemini responses and zero heuristic fallbacks. It achieved 51 macro task-extraction accuracy, 74 owner accuracy, 82 deadline extraction, 82 evidence faithfulness, 99 risk accuracy, and 63 confirmation accuracy. See [`GEMINI_PILOT_RESULTS.md`](./GEMINI_PILOT_RESULTS.md); these remain pilot diagnostics rather than final publication claims.

An exploratory ReAct run over the same 100 records achieved 56 macro task-extraction accuracy, 80 owner accuracy, 85 deadline extraction, 80 evidence faithfulness, 99 risk accuracy, and 99 confirmation accuracy. It produced 87 Gemini responses and 13 heuristic fallbacks after quota exhaustion, so it is a mixed-condition diagnostic rather than a pure Gemini comparison. Repeated quota-safe runs are required before interpreting differences from the baseline.

The `gemini-3.1-flash-lite` condition completed all 100 records with 100 Gemini responses and zero fallbacks. It achieved 43 macro task-extraction accuracy, 74 owner accuracy, 79 deadline extraction, 79 evidence faithfulness, 96 risk accuracy, and 28 confirmation accuracy. This is a single model-condition pilot and should not be treated as a definitive model ranking.

The `gemini-3.1-flash-lite-preview` condition also completed all 100 records with 100 Gemini responses and zero fallbacks. It achieved 45 macro task-extraction accuracy, 74 owner accuracy, 80 deadline extraction, 80 evidence faithfulness, 98 risk accuracy, and 34 confirmation accuracy. This remains an exploratory single run.

The `gemini-3.5-flash-lite` condition completed all 100 records with 100 Gemini responses and zero fallbacks. It achieved 50 macro task-extraction accuracy, 76 owner accuracy, 81 deadline extraction, 80 evidence faithfulness, 97 risk accuracy, and 45 confirmation accuracy. The consolidated comparison is in [`GEMINI_PILOT_RESULTS.md`](./GEMINI_PILOT_RESULTS.md).

The expanded AMI benchmark contains 500 records, including 230 action-positive records. The 400-record expansion was independently labeled by two annotators, and 244 disagreements were adjudicated. The combined dataset passes the project loader with zero validation errors. The original 50-record pilot remains lower-confidence and is identified separately in publication analyses.

The first 500-record offline comparison shows the need for the hybrid method: the original heuristic achieved 11% macro task extraction accuracy, while the candidate-detector plus evidence-validator hybrid achieved 25%. The hybrid also achieved 57% owner accuracy, 58% deadline extraction, 56% evidence faithfulness, and 96% for both risk and confirmation accuracy. These are baseline diagnostics; Gemini evaluation on the expanded dataset remains a separate API-dependent experiment.

Remaining optional publication extensions are semantic equivalence scoring, formal inter-annotator agreement, a labeled workspace-context RAG benchmark, repeated latency and cost measurements, and conversion to the official IEEE two-column template. The current paper is complete as a reproducible evaluation and safety study, but those extensions should be added before making stronger generalization claims.
