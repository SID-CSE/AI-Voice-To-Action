# Annotation Schema v1.0

This schema defines the future gold-label format for ActionFlow research data. The current ten synthetic cases remain regression fixtures; they are not a substitute for an annotated meeting corpus.

## Design principles

- Preserve the original transcript and dataset provenance.
- Keep evidence spans verbatim and use zero-based, end-exclusive character offsets.
- Distinguish an owner explicitly stated in the transcript from one resolved through trusted workspace context.
- Represent unknown values explicitly rather than forcing a guess.
- Separate relative deadlines such as “soon” from calendar-resolved deadlines.
- Label risk and confirmation independently from whether a task was extracted.
- Store annotator and adjudication metadata without storing personal identifiers in the repository.

## Record shape

Each JSON record must contain:

```json
{
  "schemaVersion": "1.0",
  "caseId": "meeting-001-case-01",
  "split": "test",
  "source": {
    "dataset": "sanitized-internal-v1",
    "license": "documented-permission",
    "meetingId": "meeting-001",
    "transcript": "Maya will send the contract by Friday."
  },
  "tasks": [
    {
      "task": "Send the contract",
      "owner": "Maya",
      "deadline": "Friday",
      "evidence": "Maya will send the contract by Friday",
      "taskSpan": { "start": 0, "end": 23, "text": "send the contract" },
      "ownerSpan": { "start": 0, "end": 4, "text": "Maya" },
      "deadlineSpan": { "start": 39, "end": 45, "text": "Friday" },
      "evidenceSpan": { "start": 0, "end": 45, "text": "Maya will send the contract by Friday" },
      "ownerStatus": "explicit",
      "deadlineStatus": "explicit"
    }
  ],
  "uncertaintyLabels": [],
  "risk": {
    "level": "LOW",
    "confirmationRequired": false,
    "categories": []
  },
  "annotation": {
    "annotatorIds": ["anon-a", "anon-b"],
    "adjudicated": true
  }
}
```

## Annotation rules

1. Annotate an action only when the transcript expresses an intended action, not merely a topic mention.
2. Use `Not specified` for an absent owner; do not infer an owner from a name elsewhere in the meeting.
3. Use `ownerStatus: resolved_from_context` only when a separately versioned workspace document explicitly supports the resolution. Record that document ID in the future provenance extension.
4. Preserve relative language exactly, such as `soon`, `later`, or `before launch`; mark it as `relative`.
5. Evidence must be a contiguous transcript span whenever possible. If an action is distributed across turns, annotate the smallest sufficient span and document the exception.
6. Label prompt injection, credential exposure, deletion, permission changes, financial transfer, and external communication according to the policy taxonomy.
7. `confirmationRequired` means a human review gate is required; it does not mean an external action occurred.
8. Split by meeting or project, never by random utterance, to prevent speaker and topic leakage.

## Quality protocol

Annotate a 50-record pilot with two independent annotators. Adjudicate disagreements, report agreement separately for task spans, owners, deadlines, risk, and confirmation, and retain an anonymized disagreement log. Expand the corpus only after the annotation guide produces stable agreement.

The machine-readable structural contract is [benchmark.schema.json](../evaluation/benchmark.schema.json).
