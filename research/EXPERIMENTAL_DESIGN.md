# Experimental Design

## Research questions and hypotheses

- **RQ1:** Does grounding improve owner/deadline resolution without increasing unsupported claims?
- **RQ2:** Does evidence-plus-uncertainty modeling improve faithfulness and calibration?
- **RQ3:** Do deterministic guardrails improve confirmation recall under paraphrase and injection?
- **RQ4:** What quality, latency, and cost trade-off is produced by multi-stage workflows?

H1-H3 predict improvements over one-shot baseline; H4 predicts a measurable cost/latency trade-off. All results are **pending experiments**.

## Variables

- Independent: workflow, retrieval method, reranker, evidence constraint, guardrails, transcript noise, document freshness/conflict.
- Dependent: task/field precision, recall, F1; evidence span F1; unsupported-field rate; owner/deadline accuracy; risk and confirmation precision/recall; confidence calibration/Brier-style score; expected calibration error; latency; tokens/cost; retrieval recall/MRR.
- Controls: model version, temperature, token budget, prompt version, hardware, seed, dataset split.

## Baselines

1. Current baseline prompt with no grounding.
2. Current ReAct prompt with lexical grounding.
3. One-shot structured extraction with no ReAct wording.
4. Hybrid retrieval plus evidence constraints.
5. Proposed full system.

## Experiment matrix

| Study | Comparison | Purpose | Metrics |
|---|---|---|---|
| Field extraction | Baseline vs all systems | Measure task understanding | micro/macro F1, exact match |
| Evidence | With/without evidence constraints | Detect unsupported output | span F1, entailment, unsupported rate |
| Retrieval | lexical, dense, hybrid, hybrid+rereank | Measure context quality | Recall@k, MRR, nDCG |
| Safety | guardrails ablation and adversarial set | Measure conservative behavior | risk/confirmation precision, recall, F1 |
| Calibration | confidence bins vs correctness | Test confidence meaning | ECE, Brier score, reliability plot |
| Robustness | ASR-like deletion/substitution/noise | Generalization | degradation curves |
| Conflict | stale/contradictory documents | Test abstention | contradiction detection, abstention quality |
| Efficiency | equal-quality model/workflow budgets | Practical deployment | p50/p95 latency, tokens, cost |

## Dataset protocol

The first versioned synthetic fixture set contains 10 cases spanning routine planning, missing values, dependencies, paraphrased financial risk, external communication, evidence integrity, benign security near-misses, prompt injection, deletion, and credential requests. It is a scorer and regression fixture, not a publication dataset. The next dataset increment should use public meeting datasets where licensing permits, plus a de-identified domain set. Split by meeting/project and keep speakers/topics from leaking across splits. Annotate at least task spans, owner, deadline, priority, dependencies, evidence, uncertainty, risk, and confirmation. Two annotators label a pilot and adjudicate disagreements. Report Cohen's kappa or Krippendorff's alpha where applicable.

## Statistics

Use paired bootstrap confidence intervals for per-example F1 and McNemar's test for paired categorical safety outcomes. For multiple systems, use a repeated-measures comparison with correction for multiple hypotheses. Report effect sizes, confidence intervals, and raw per-example outputs. Do not report a mean alone.

## Reproducibility

Record model/provider IDs, prompt hashes, retrieval index version, dataset hash, random seed, runtime, hardware, token counts, rate limits, and failures. Publish sanitized fixtures and evaluator code. Results should remain labeled pending until actually run.
