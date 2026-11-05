# ActionFlow AI 500-Record Comparison

Dataset: `ami-pilot-v2-500`

| Condition | Model | Cases | Scored | Task F1 | Precision | Recall | Owner | Deadline | Evidence | Risk | Confirmation |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gemini-baseline-batched | gemini-3.1-flash-lite | 500 | 500 | 54% | 54% | 54% | 55% | 55% | 54% | 98% | 60% |
| gemini-baseline-no-evidence-raw-batched | gemini-3.1-flash-lite | 500 | 500 | 54% | 54% | 54% | 54% | 54% | 54% | 98% | 35% |
| gemini-baseline-no-safety-raw-batched | gemini-3.1-flash-lite | 500 | 500 | 53% | 53% | 53% | 54% | 54% | 54% | 98% | 69% |
| gemini-baseline-no-uncertainty-raw-batched | gemini-3.1-flash-lite | 500 | 500 | 54% | 54% | 54% | 54% | 54% | 54% | 98% | 52% |
| gemini-react-batched | gemini-3.1-flash-lite | 500 | 500 | 40% | 40% | 41% | 65% | 67% | 60% | 98% | 98% |
| gemini-react-no-safety-guardrails-batched | gemini-3.1-flash-lite | 500 | 500 | 47% | 47% | 48% | 62% | 67% | 56% | 99% | 98% |
| heuristic-local | local | 500 | 500 | 11% | 10% | 13% | 57% | 59% | 56% | 96% | 96% |
| hybrid-offline | local | 500 | 500 | 25% | 24% | 25% | 56% | 57% | 56% | 96% | 96% |

Generated from saved JSON result files; incomplete conditions are excluded.
