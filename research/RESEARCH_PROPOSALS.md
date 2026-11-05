# Research Proposals

## Direction A — recommended

**Title:** Evidence-Grounded and Risk-Aware Action Extraction from Noisy Multi-Party Conversations.

**Hypothesis:** A pipeline that combines span-level evidence extraction, workspace retrieval, explicit uncertainty, and deterministic risk adjudication will improve field-level F1, evidence faithfulness, calibration, and safety recall over a one-shot LLM baseline at an acceptable latency cost.

**Novelty:** The contribution is the jointly measured task, not the use of Gemini, RAG, or ReAct individually.

**Changes:** add annotated data format, span offsets, embedding/hybrid retrieval, reranking, evidence entailment/contradiction checks, calibrated confidence, and a reproducible evaluation runner.

**Risks:** annotation cost, domain dependence, and unclear novelty if the benchmark is too small.

## Direction B

**Title:** Contradiction-Aware Workspace Grounding for Team-Role and Deadline Resolution.

Study lexical versus embedding versus hybrid retrieval when documents disagree, are stale, or contain malicious instructions. Measure retrieval recall, owner resolution accuracy, abstention, and injection resistance.

## Direction C

**Title:** Calibrated Human Confirmation for Consequential AI-Suggested Actions.

Learn a risk/uncertainty policy that chooses automatic presentation, clarification, or confirmation. Evaluate safety recall, false alarms, calibration, user burden, and time to review. This requires a carefully labeled action-risk corpus and simulated or approved human studies.

## Direction D

**Title:** Robust Voice-to-Action Extraction under ASR Noise and Code-Switching.

Compare browser ASR, cloud ASR, and controlled transcript corruption. Evaluate WER, task/field F1, evidence span preservation, risk recall, latency, and cost across noise levels and languages. This is feasible but requires a larger speech dataset and is less aligned with the current text-centric implementation.

## Direction E

**Title:** Efficient Multi-Stage Meeting Action Extraction under Latency and Cost Budgets.

Compare one-shot, staged, and ensemble workflows under equal token/time budgets. The novelty would be a quality-cost-risk frontier, not a claim that a particular prompt style is inherently superior.

## Recommendation

Choose Direction A, with Direction B as its central ablation and Direction C as the safety evaluation layer. It uses the existing architecture, is measurable without executing external actions, and can produce a reusable benchmark. Do not claim acceptance or guaranteed novelty until the literature and experiments are complete.
