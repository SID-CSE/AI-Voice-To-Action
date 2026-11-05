# Manual Research Inputs Required

Provide these inputs before the remaining dataset integration and experiment automation can be completed.

## Recommended dataset strategy

### Primary: AMI Meeting Corpus

Use the official AMI corpus as the primary dataset because it provides:

- Multi-party spoken meetings
- Orthographic transcripts
- Audio and multiple microphone conditions
- Speaker and dialogue annotations
- Scenario and naturally occurring meetings
- Publicly released annotations under the corpus terms, including CC BY 4.0 materials

Official source: <https://groups.inf.ed.ac.uk/ami/>

AMI is the best fit for this application’s voice-to-action research, but it does not directly provide every ActionFlow label. We must annotate task spans, owners, deadlines, evidence, uncertainty, risk, and confirmation labels.

### Secondary: MeetingBank

Use MeetingBank for external generalization because it provides 1,366 public meetings, transcripts, summaries, agenda metadata, and audio/transcript resources.

Official source: <https://meetingbank.github.io/>

MeetingBank is larger and highly reproducible, but city-council meetings differ from software-team meetings and its labels are primarily summarization-oriented. It should not be the only dataset for this application.

### Optional: QMSum

Use QMSum for query-focused retrieval experiments, not as the primary action-extraction dataset.

Official paper and dataset references: <https://aclanthology.org/2021.naacl-main.472/>

## Files to provide manually

Place the files outside Git-tracked source, for example:

```text
research_data/
├── source/
│   ├── ami/                         # downloaded AMI transcripts/annotations
│   └── meetingbank/                 # optional external dataset
├── actionflow_annotations.jsonl     # our gold annotations
├── splits.json                      # meeting-level train/validation/test IDs
├── dataset_manifest.json            # versions, hashes, licenses, and counts
├── annotation_guide_answers.md     # project-specific decisions and edge cases
└── consent_and_license.md          # permissions, license, privacy, retention
```

Do not commit raw recordings, confidential transcripts, credentials, or personally identifying information.

## Minimum file contents

### `actionflow_annotations.jsonl`

One record per line matching [`../evaluation/benchmark.schema.json`](../evaluation/benchmark.schema.json), including:

- `schemaVersion`
- `caseId`
- `split`
- `source.dataset`
- `source.license`
- `source.meetingId`
- `source.transcript`
- Task, owner, deadline, and evidence labels
- Character spans where applicable
- Unknown and relative-value states
- Risk level and confirmation requirement
- Annotator and adjudication metadata

### `splits.json`

```json
{
  "version": "v1",
  "train": ["meeting-id-001"],
  "validation": ["meeting-id-002"],
  "test": ["meeting-id-003"]
}
```

Splits must be by meeting or project, not random utterance, to prevent speaker and topic leakage.

### `dataset_manifest.json`

Include:

- Dataset name and official URL
- License and permitted use
- Download/version date
- File SHA-256 hashes
- Number of meetings and records
- Number of records per split
- Whether audio, transcript, or derived annotations are included
- Anonymization status
- Annotation schema version

### `annotation_guide_answers.md`

Answer these decisions:

1. What counts as an actionable task?
2. How are multiple actions in one sentence split?
3. When is a person an owner versus merely mentioned?
4. Which workspace documents may resolve an unknown owner?
5. How are “soon”, “later”, and “before launch” represented?
6. What qualifies as financial, deletion, security, legal, or communication risk?
7. When is confirmation required?
8. How are contradictions between transcript and knowledge documents labeled?
9. How are unclear or incomplete utterances handled?
10. Which cases are excluded for privacy, quality, or licensing reasons?

### `consent_and_license.md`

Document:

- Dataset license and citation requirement
- Institutional approval or exemption
- Participant consent status for any non-public data
- Redaction procedure
- Retention and deletion policy
- Who may access raw and sanitized data
- Whether the final paper may redistribute derived annotations

## What happens after these files are provided

The remaining implementation can then:

1. Validate every annotation record.
2. Verify meeting-level split integrity.
3. Generate dataset statistics.
4. Convert records into evaluator inputs.
5. Run baseline and ReAct workflows offline.
6. Add retrieval and evidence ablations.
7. Produce per-case metrics and machine-readable result files.
8. Add bootstrap confidence intervals and calibration plots.
9. Generate reproducibility tables for the paper.

The current 10-case synthetic benchmark should remain as a regression suite and must not be mixed with real-data results.
