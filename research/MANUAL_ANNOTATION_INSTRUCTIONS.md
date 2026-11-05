# Manual Annotation Instructions

Use the generated worksheet:

`research_data/actionflow_pilot_50.csv`

For the second, action-rich batch, use:

`research_data/actionflow_action_pilot_50.csv`

Open it in Excel, Google Sheets, or LibreOffice. Do not edit the `recordId`, `meetingId`, `channel`, `startTime`, `endTime`, or `transcript` columns.

## Fill these columns

### `isAction`

Use exactly:

- `yes` when the transcript contains an intended, requested, assigned, or agreed action
- `no` when it is only discussion, a question, a statement of fact, or a rejected suggestion

### `task`

Write a short imperative description:

```text
Maya will send the contract by Friday.
```

Write:

```text
Send the contract
```

If `isAction` is `no`, write `Not specified`.

### `owner`

Write the person explicitly responsible. If nobody is specified, write:

```text
Not specified
```

Do not guess an owner from another sentence or from general knowledge.

### `deadline`

Copy the deadline exactly as spoken, such as `Friday`, `next week`, or `before launch`.

If there is no deadline, write:

```text
Not specified
```

### `riskLevel`

Use exactly one of:

- `LOW`: ordinary planning, documentation, design, or follow-up
- `MEDIUM`: external communication, legal/business commitment, or consequential change
- `HIGH`: money transfer, deletion, credentials/secrets, permission changes, or security-sensitive action

### `riskCategory`

Use one or more comma-separated values:

```text
general
financial
communication
deletion
security
legal
```

Use `general` for ordinary low-risk actions.

### `confirmationRequired`

Use `yes` for actions that should require human approval before execution, especially financial, deletion, credential, permission, security, legal, or external communication actions. Otherwise use `no`.

### `evidence`

Copy the smallest complete transcript text that proves the task. It must be copied exactly from the `transcript` column.

Example:

```text
Maya will send the contract by Friday.
```

### `notes`

Briefly explain difficult decisions, ambiguity, interruptions, or why a sentence is not an action.

## Complete example

Transcript:

```text
Maya will send the contract by Friday.
```

Values:

```text
isAction: yes
task: Send the contract
owner: Maya
deadline: Friday
riskLevel: LOW
riskCategory: general
confirmationRequired: no
evidence: Maya will send the contract by Friday.
notes: Explicit owner and deadline.
```

## Important rules

1. Do not infer facts that are not in the row.
2. Do not label every sentence as an action.
3. Keep evidence copied exactly, including punctuation.
4. If uncertain, record the uncertainty in `notes`; do not silently guess.
5. Save the completed file as `actionflow_pilot_50_annotated.csv`.
6. Send that completed CSV back for validation and conversion into the JSON research format.

The full machine-readable contract is [`../evaluation/benchmark.schema.json`](../evaluation/benchmark.schema.json).

## Current pilot result

The first reviewed worksheet produced 50 records, including 2 positive action records and 48 non-action records. This is expected to validate the workflow, but it is too imbalanced for final accuracy claims. The next annotation batch should deliberately sample action-rich meeting segments.

The action-rich worksheet is a candidate sample, not pre-labeled ground truth. Review every row and mark `isAction` yourself; some candidates will still be discussion or hypothetical suggestions.
