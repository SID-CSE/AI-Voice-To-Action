# Research Gap and Opportunity

## What is already solved

- Meeting summarization and extractive meeting understanding have public datasets and strong baselines.
- Generic LLM task extraction, RAG, and prompt-based agent workflows are established.
- Prompt injection and hallucination are recognized safety problems with public benchmarks.
- Human confirmation is a product control, not a novel algorithm by itself.

## Unresolved gap relevant to ActionFlow

There is an opportunity to study **evidence-grounded, uncertainty-calibrated and risk-aware action extraction from noisy multi-party speech under organization-specific context**. The system must distinguish:

1. what was explicitly said;
2. what can be resolved from trusted workspace context;
3. what remains unknown or contradictory;
4. what should be abstained from or require confirmation.

The project currently demonstrates this design but does not measure it rigorously.

## Testable gap statement

Existing meeting summarizers optimize content coverage or summary quality. Existing RAG evaluations often use question answering. Existing agent safety benchmarks emphasize tool execution. A focused benchmark could measure whether an assistant extracts task fields with verbatim evidence, refuses unsupported fields, resolves owners only when supported by workspace documents, and escalates consequential actions under noisy transcripts and malicious context.

## Threats to validity

- A small private dataset can overfit to names and templates.
- LLM-as-judge scores can be biased and must be calibrated against human labels.
- Speech errors may confound extraction and safety; ASR quality must be measured separately.
- “ReAct” may add latency without causal benefit; compare against equally budgeted structured baselines.
- RAG can introduce malicious or stale instructions; retrieval quality and prompt-injection resistance must be separate metrics.

## Minimum evidence needed

- At least several hundred de-identified examples or a transparent synthetic-plus-real protocol.
- Double annotation of task spans, owners, deadlines, dependencies, uncertainty, risk, and required confirmation.
- Inter-annotator agreement and adjudication rules.
- Exact train/dev/test split with speaker/topic/domain separation.
- Gold-based metrics and confidence calibration, not fixed display scores.
- Baselines, ablations, adversarial tests, and confidence intervals.
