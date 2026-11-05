# Technical Roadmap

## Essential for a research contribution

1. **Gold dataset and annotation schema.** Store transcript spans, normalized task fields, explicit/unknown labels, evidence spans, source-document IDs, risk category, and confirmation label. Double annotate and report agreement.
2. **Reproducible evaluator.** Replace fixed scores in `/api/evaluate` with exact-set/field precision, recall and F1, evidence span overlap, unsupported-field rate, risk precision/recall, confirmation recall, calibration error, latency, tokens and cost.
3. **Retrieval study.** Preserve current lexical retrieval as a baseline; add embeddings or a documented hybrid index, top-k recall, MRR/nDCG, reranking, source freshness and contradiction tests.
4. **Faithfulness and abstention.** Verify every owner/deadline against transcript or retrieved evidence; mark unknown rather than infer. Add contradiction and no-answer cases.
5. **Adversarial safety set.** Expand beyond one prompt-injection case: direct injection, indirect malicious knowledge documents, credential requests, paraphrased financial/deletion/permission requests, and benign near-misses.
6. **Ablations.** Remove grounding, evidence constraints, uncertainty policy, deterministic guardrails, and reranking one at a time.

## Strongly recommended

- Replace hard-coded heuristic names/evidence with sentence segmentation and conservative generic extraction.
- Add stable model/provider/version configuration and capture token usage.
- Add transcript and source provenance offsets.
- Add seed, dataset version, prompt hash, model ID, and environment to evaluation records.
- Separate offline benchmark code from the production server and export machine-readable results.
- Add long-context, noisy-transcript, contradiction, stale-document, and cross-domain splits.

## Optional

- Speaker diarization and timestamps.
- Multilingual/code-switching support.
- Privacy-preserving local ASR.
- Human usability study and active-learning annotation UI.

## File impact

- `server/rag.ts`: retrieval abstraction, provenance, hybrid ranking.
- `server/gemini.ts` and `server/prompts.ts`: evidence-span schema, abstention and stable configs.
- `server/guardrails.ts`: taxonomy and labeled policy decisions.
- `server.ts`: evaluator endpoints should call the real scorer, not constants.
- `src/types.ts`: annotation/evaluation/provenance types.
- New `evaluation/` module: dataset loader, scorers, statistical report.
- `data/`: do not put sensitive research data in the repository; use documented external storage or sanitized fixtures.

## Phases

1. Freeze current behavior and schema.
2. Build annotation guide and pilot 50 examples.
3. Implement evaluator and validate it with hand-calculated cases.
4. Add retrieval/evidence improvements.
5. Run baselines and ablations.
6. Run adversarial, robustness, latency, and cost studies.
7. Analyze significance, limitations, and reproducibility.

## Completed first increment

The initial evaluation foundation is now implemented:

- Ten synthetic benchmark cases now have a version identifier and server-side gold task labels.
- The public case endpoint omits gold labels to prevent answer-key leakage.
- Evaluation scores are calculated from predicted-versus-gold task matches, owner/deadline fields, evidence, risk, confirmation, and uncertainty counts.
- The previous fixed ReAct/baseline accuracy constants were removed.
- Focused scorer tests cover exact matches and missing/unsupported fields.

This does not yet constitute a sufficiently large benchmark or a publication result. Public/de-identified dataset integration, annotation, retrieval experiments, ablations, and statistical analysis remain pending.

## Completed annotation increment

- Added the v1.0 annotation guide in [ANNOTATION_SCHEMA.md](./ANNOTATION_SCHEMA.md).
- Added the machine-readable contract in [../evaluation/benchmark.schema.json](../evaluation/benchmark.schema.json).
- Added TypeScript types for transcript spans, explicit versus context-resolved values, and adjudication metadata.

The schema is ready for a pilot annotation set; no real or sensitive meeting data has been added.

The deterministic validator in [../evaluation/annotation.ts](../evaluation/annotation.ts) now checks schema version, required fields, evidence containment, and character-span integrity. A sanitized one-record pilot fixture is available at [../evaluation/pilot.json](../evaluation/pilot.json).

The dataset loader in [../evaluation/dataset.ts](../evaluation/dataset.ts) rejects malformed records, duplicate case IDs, and records that fail annotation validation before they can be used by an evaluator.

Validated annotation records can now be adapted to the shared scorer, and [../server/evaluation.ts](../server/evaluation.ts) provides macro-averaged per-case aggregation without treating missing model outputs as zero or fabricated results.

The scorer now also reports a confidence-calibration score based on predicted task confidence versus task-match correctness. This is a preliminary per-example diagnostic; reliability diagrams and expected calibration error remain pending for the larger corpus.

The offline runner in [../evaluation/runner.ts](../evaluation/runner.ts) now validates a dataset before invoking an analyzer and returns versioned workflow plus macro/per-case results. It is intentionally analyzer-agnostic so baseline, ReAct, local heuristics, or future retrieval variants can be compared under the same protocol.
