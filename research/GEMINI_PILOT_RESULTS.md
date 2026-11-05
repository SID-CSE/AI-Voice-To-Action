# Gemini AMI Pilot Results

The 100-record AMI pilot was evaluated with the Gemini baseline on 2026-11-04.

## Run provenance

- Dataset: `actionflow_annotated_pilot_100.json`
- Workflow: `gemini-baseline`
- Model: `gemini-flash-lite-latest`
- Records: 100
- Scored records: 100
- Successful Gemini responses: 100
- Heuristic fallbacks: 0
- Grounding: disabled for this comparison

## Metrics

| Metric | Gemini |
|---|---:|
| Macro task extraction accuracy | 51% |
| Macro owner assignment accuracy | 74% |
| Macro deadline extraction | 82% |
| Macro evidence faithfulness | 82% |
| Macro risk classification accuracy | 99% |
| Macro confirmation accuracy | 63% |

The complete machine-readable output is `research_data/ami_pilot_gemini_results.json`.

## Gemini ReAct pilot

The same 100 records were evaluated with the ReAct workflow. This run returned 87 Gemini responses and 13 local heuristic fallbacks after the Gemini free-tier request quota was exhausted. It therefore measures a mixed workflow condition, not a pure 100-response Gemini comparison.

| Metric | Gemini baseline | Gemini ReAct |
|---|---:|---:|
| Macro task extraction accuracy | 51% | 56% |
| Macro owner assignment accuracy | 74% | 80% |
| Macro deadline extraction | 82% | 85% |
| Macro evidence faithfulness | 82% | 80% |
| Macro risk classification accuracy | 99% | 99% |
| Macro confirmation accuracy | 63% | 99% |

The ReAct output is `research_data/ami_pilot_gemini_react_results.json`. Grounding was disabled in both Gemini conditions. Because the ReAct run includes fallbacks and no repeated trials, the apparent differences are exploratory and should not be treated as evidence that ReAct improves model performance.

## Gemini 3.1 Flash Lite model condition

The 100-record baseline was also run with `gemini-3.1-flash-lite`. All 100 requests returned Gemini responses and no heuristic fallbacks.

| Metric | Gemini baseline | Gemini 3.1 Flash Lite |
|---|---:|---:|
| Macro task extraction accuracy | 51% | 43% |
| Macro owner assignment accuracy | 74% | 74% |
| Macro deadline extraction | 82% | 79% |
| Macro evidence faithfulness | 82% | 79% |
| Macro risk classification accuracy | 99% | 96% |
| Macro confirmation accuracy | 63% | 28% |

The machine-readable output is `research_data/ami_pilot_gemini_31_flash_lite_results.json`. Grounding was disabled. This is a single pilot run, so the differences are descriptive rather than statistically conclusive.

## Gemini 3.1 Flash Lite Preview model condition

The same 100-record baseline was run with `gemini-3.1-flash-lite-preview`. All 100 requests returned Gemini responses and no heuristic fallbacks.

| Metric | Gemini baseline | Gemini 3.1 Flash Lite Preview |
|---|---:|---:|
| Macro task extraction accuracy | 51% | 45% |
| Macro owner assignment accuracy | 74% | 74% |
| Macro deadline extraction | 82% | 80% |
| Macro evidence faithfulness | 82% | 80% |
| Macro risk classification accuracy | 99% | 98% |
| Macro confirmation accuracy | 63% | 34% |

The machine-readable output is `research_data/ami_pilot_gemini_31_flash_lite_preview_results.json`. Grounding was disabled. This is a single pilot run and does not establish a definitive model ranking.

## Gemini 3.5 Flash Lite model condition

The same 100-record baseline was run with `gemini-3.5-flash-lite`. All 100 requests returned Gemini responses and no heuristic fallbacks.

| Metric | Gemini baseline | Gemini 3.5 Flash Lite |
|---|---:|---:|
| Macro task extraction accuracy | 51% | 50% |
| Macro owner assignment accuracy | 74% | 76% |
| Macro deadline extraction | 82% | 81% |
| Macro evidence faithfulness | 82% | 80% |
| Macro risk classification accuracy | 99% | 97% |
| Macro confirmation accuracy | 63% | 45% |

The machine-readable output is `research_data/ami_pilot_gemini_35_flash_lite_results.json`. Grounding was disabled. This is a single pilot run and does not establish a definitive model ranking.

## Consolidated model comparison

| Condition | Gemini responses | Fallbacks | Task | Owner | Deadline | Evidence | Risk | Confirmation |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Local heuristic | — | — | 40% | 83% | 83% | 78% | 97% | 97% |
| Gemini baseline (`gemini-flash-lite-latest`) | 100 | 0 | **51%** | 74% | **82%** | **82%** | **99%** | 63% |
| Gemini ReAct | 87 | 13 | **56%** | **80%** | **85%** | 80% | 99% | **99%** |
| `gemini-3.5-flash-lite` | 100 | 0 | 50% | 76% | 81% | 80% | 97% | 45% |
| `gemini-3.1-flash-lite-preview` | 100 | 0 | 45% | 74% | 80% | 80% | 98% | 34% |
| `gemini-3.1-flash-lite` | 100 | 0 | 43% | 74% | 79% | 79% | 96% | 28% |

The baseline `gemini-flash-lite-latest` remains the most balanced pure-Gemini condition in this pilot. `gemini-3.5-flash-lite` is a reasonable alternative for owner assignment, while the ReAct row is not directly comparable because it includes 13 heuristic fallbacks. These observations are descriptive; repeated runs and an adjudicated action-balanced dataset are required for model selection claims.

## Bootstrap intervals and error analysis

The local analysis artifact `research_data/ami_pilot_statistical_analysis.json` contains deterministic percentile-bootstrap 95% intervals over the 100 per-case scores for each pure-Gemini condition, plus the ten lowest task-extraction cases per condition. The bootstrap summarizes uncertainty in this pilot; it does not correct for annotation bias, repeated model sampling, or the absence of independent adjudication.

## Expanded 500-record offline baselines

The adjudicated expansion was evaluated without API calls. The original deterministic heuristic achieved 11% macro task-extraction accuracy. The candidate-detector plus evidence-validator hybrid achieved 25% task-extraction accuracy, 57% owner accuracy, 58% deadline extraction, 56% evidence faithfulness, 96% risk accuracy, and 96% confirmation accuracy. This is an initial generalization diagnostic; the hybrid must still be compared with Gemini on the same 500-record test set.

## Offline comparison

| Metric | Local heuristic | Gemini |
|---|---:|---:|
| Task extraction accuracy | 40% | 51% |
| Owner assignment accuracy | 83% | 74% |
| Deadline extraction | 83% | 82% |
| Evidence faithfulness | 78% | 82% |
| Risk classification accuracy | 97% | 99% |
| Confirmation accuracy | 97% | 63% |

These are pilot diagnostics, not final publication claims. The combined dataset has 100 records but only 25 positive action records after adjudication. Thirty-five disagreements in the action-rich batch were resolved by an independent human adjudication pass; the pilot remains small and requires expansion, stronger balance, and repeated runs before drawing general conclusions.
