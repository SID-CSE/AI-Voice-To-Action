# ActionFlow AI 500-Record Evaluation Guide

## Completed

The adjudicated 500-record dataset is:

`research_data/actionflow_annotated_pilot_500.json`

Completed conditions:

- Heuristic baseline
- Offline candidate-detector plus evidence-validator hybrid
- Batched `gemini-3.1-flash-lite` baseline

The Gemini baseline output is:

`research_data/ami_pilot_gemini_31_batch_500_results.json`

It contains 500 scored records. Do not rerun it unless the prompt, model, or dataset changes.

## Safe manual commands

Run PowerShell from the repository root.

### Rebuild offline results and confidence intervals

```powershell
.\evaluation\run_all_500_evaluations.ps1 -Stage offline
```

### Recalculate confidence intervals only

```powershell
.\evaluation\run_all_500_evaluations.ps1 -Stage bootstrap
```

### Run the ReAct condition

Before starting, verify that the API key is configured and that the selected model responds to a small probe:

```powershell
npx tsx evaluation\probe_gemini_models.ts
```

Then run:

```powershell
.\evaluation\run_all_500_evaluations.ps1 `
  -Stage react `
  -Model gemini-3.1-flash-lite `
  -BatchSize 5 `
  -PacingMs 5000
```

Five records per request and a five-second interval are used, but the runner also has a hard sliding-window limiter. It will never send more than **12 API requests in any 60-second window**, including retries. If 12 requests have already been sent, it waits until the oldest request leaves the window. This rule is enforced in code and cannot be bypassed by transient-error retries.

## Abort and resume

Press `Ctrl+C`. The runner saves every successful batch before continuing. Resume with the exact same command. It reads:

`research_data/ami_pilot_gemini_react_batch_checkpoint.json`

An incomplete request is not counted. Errors are written to:

`research_data/ami_pilot_gemini_react_batch_last_error.json`

The runner handles quota errors, temporary 503 errors, timeouts, malformed JSON, wrong output counts, mismatched case IDs, and missing task fields. It retries only the current batch and never advances the checkpoint until the complete batch is valid.

## Required research conditions

1. Heuristic baseline — completed.
2. Offline hybrid — completed.
3. Gemini baseline — completed.
4. Gemini ReAct — completed; task F1 was 40%.
5. Ablation: remove evidence instruction.
6. Ablation: remove uncertainty instruction.
7. Ablation: reduce safety instruction.
8. Error taxonomy and bootstrap intervals.
9. Final paper tables and figures.

The ablations should use the same 500 records, model, batch size, pacing, and meeting-level split. Each condition needs a separate checkpoint and output filename.

## Score-improvement implementation

The extraction prompt now requires explicit commitments or agreed next steps, rejects questions and hypotheticals, and requires exact evidence. Candidate detection also recognizes “agreed to,” “next step is,” “make sure,” “I’ll,” “we’ll,” and “someone needs to.”

Validation-only threshold tuning is available:

```powershell
npx tsx evaluation\tune_validation_threshold.ts
```

The current validation result recommends:

```text
GEMINI_EVIDENCE_OVERLAP=0.70
GEMINI_TASK_OVERLAP=0.25
```

These values were selected on the 91-record validation split only. To evaluate the improved ReAct-plus-guardrails condition with them:

```powershell
.\evaluation\run_all_500_evaluations.ps1 `
  -Stage react `
  -Model gemini-3.1-flash-lite `
  -BatchSize 5 `
  -PacingMs 5000 `
  -EvidenceOverlap 0.70 `
  -TaskOverlap 0.25
```

Do not tune thresholds using the 127-record test split. After the run completes, regenerate the comparison table:

```powershell
npx tsx evaluation\generate_comparison_table.ts
npx tsx evaluation\analyze_pilot_results.ts
npx tsx evaluation\generate_error_taxonomy.ts
```

## Do we need RAG?

Do not claim that RAG improves the AMI action-extraction result yet. The current AMI records do not include a gold workspace knowledge base or relevance labels. RAG should be a separate study with meeting-specific reference documents and annotated relevant passages.

Run RAG only if you create:

- A sanitized workspace document set.
- Relevant-document or relevant-span labels.
- A fixed retrieval index version.
- A no-RAG control using the same transcripts.
- Recall@k, MRR, evidence support, and unsupported-field metrics.

For the current paper, report lexical RAG as an implemented system capability, not as a measured improvement on the 500-record AMI benchmark.

## Finalization order

1. Finish ReAct 500 evaluation.
2. Run bootstrap analysis.
3. Generate error categories from all per-record outputs.
4. Run ablations if quota permits.
5. Update the paper tables and figures.
6. Run `npm test`, `npm run lint`, and `npm run build`.
7. Verify every paper number against a saved JSON result.

Never report a condition with missing records as a complete experiment. Always include model ID, workflow, dataset version, API/fallback counts, batch size, pacing, and failures.

## ReAct interpretation

On the completed raw 500-record comparison, baseline Gemini achieved 54% task F1, while ReAct achieved 40%. ReAct improved owner accuracy from 55% to 65%, deadline accuracy from 55% to 67%, evidence faithfulness from 54% to 60%, and confirmation accuracy from 60% to 98%, but reduced task precision/recall. This raw ReAct result is not yet the final ReAct-plus-guardrails condition. Rerun ReAct with the launcher below; it applies the production evidence validator, deduplication, and server-authoritative risk guardrails before scoring.

## Running ablations manually

Run each command from the repository root:

```powershell
.\evaluation\run_ablations_500.ps1 -Ablation no-evidence
.\evaluation\run_ablations_500.ps1 -Ablation no-uncertainty
.\evaluation\run_ablations_500.ps1 -Ablation no-safety
```

Each ablation has its own checkpoint and result file. Keep the model, batch size, pacing, and dataset unchanged. Press `Ctrl+C` to stop safely and rerun the same command to resume.

## Error taxonomy and bootstrap commands

After each completed condition, run:

```powershell
npx tsx evaluation\generate_error_taxonomy.ts
npx tsx evaluation\analyze_pilot_results.ts
```

Outputs:

- `research_data/ami_pilot_error_taxonomy_500.json`
- `research_data/ami_pilot_statistical_analysis.json`

The taxonomy categories can overlap: a single record may have both a missed action and a wrong owner. These are diagnostic counts, not mutually exclusive class totals.

## Retrieval evaluation

Do not run a retrieval score on the AMI transcripts alone. The current benchmark has no gold workspace documents or relevance labels, so Recall@k and MRR would be undefined. For the paper, report RAG as an implemented capability and state that retrieval effectiveness is pending a separately labeled workspace-context dataset. To perform the retrieval study later, create meeting-specific documents and relevance labels, freeze the index, run a no-RAG control and a RAG condition, then compute Recall@k, MRR, evidence support, and unsupported-field rate.
