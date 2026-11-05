# IEEE Paper Outline

## Title and abstract

Use a specific title about evidence-grounded, risk-aware action extraction. The abstract must state the problem, method, dataset, baselines, measured results, and limitations. Do not include results until experiments are run.

## 1. Introduction

Motivate meeting follow-up errors, unsupported task fields, and unsafe action automation. State research questions and contributions. Avoid presenting a deployed prototype as proof of novelty.

## 2. Background and related work

Cover meeting summarization/action extraction, RAG and faithfulness, hallucination evaluation, agent/prompt-injection safety, and human confirmation. Compare tasks and datasets in a table.

## 3. Problem formulation

Define transcript, workspace evidence, extracted task tuple, evidence span, unknown/abstention state, risk label, and confirmation decision. Define field-level metrics.

## 4. Proposed methodology

Show ingestion, segmentation, retrieval, reranking, structured generation, evidence verification, uncertainty, risk policy, and review boundary. Include pseudocode and decision rules.

## 5. System architecture and implementation

Describe the existing React/Express/Gemini/Neon system, model configuration, storage, privacy boundary, and failure handling. Clearly separate engineering from research components.

## 6. Experimental setup

Describe data sources, annotation, splits, baselines, hardware, prompts, model IDs, retrieval index, and statistical tests.

## 7. Results

Report field F1, evidence faithfulness, safety recall, calibration, retrieval metrics, latency, and cost with confidence intervals. All tables and figures must be generated from raw runs.

## 8. Ablation and robustness

Remove grounding, evidence verification, uncertainty, guardrails, and reranking. Add noise, conflict, stale context, prompt injection, and cross-domain tests.

## 9. Discussion and limitations

Discuss error cases, domain transfer, privacy, ASR dependence, human burden, model drift, and non-execution boundary.

## 10. Conclusion and future work

Summarize only demonstrated findings. Future work may include multilingual speech, diarization, local inference, and real user studies.

## Required visuals

Architecture diagram; data/annotation pipeline; retrieval and verification flow; error taxonomy; quality-safety-latency plot; ablation chart; calibration plot; confusion matrix for risk/confirmation.
