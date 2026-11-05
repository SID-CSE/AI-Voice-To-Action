"""Convert the manually reviewed AMI CSV pilot into ActionFlow JSON records."""

from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "research_data" / "actionflow_pilot_50_annotated.csv"
OUTPUT = ROOT / "research_data" / "actionflow_pilot_50.json"
MANIFEST = ROOT / "research_data" / "pilot_manifest.json"
LICENSE = "CC BY 4.0 (AMI manual annotations release 1.6.2)"


def truth(value: str) -> bool:
    return value.strip().lower() == "yes"


def build_record(row: dict[str, str], split: str, adjudicated: bool = False) -> dict:
    transcript = row["transcript"].strip()
    tasks = []
    if truth(row["isAction"]):
        evidence = row["evidence"].strip()
        evidence_start = transcript.find(evidence)
        if evidence_start < 0:
            raise ValueError(f"{row['recordId']}: evidence is not contained in transcript")
        task = {
            "task": row["task"].strip(),
            "owner": row["owner"].strip(),
            "deadline": row["deadline"].strip(),
            "evidence": evidence,
            "ownerStatus": "unknown" if row["owner"].strip() == "Not specified" else "explicit",
            "deadlineStatus": "unknown" if row["deadline"].strip() == "Not specified" else "explicit",
            "evidenceSpan": {
                "start": evidence_start,
                "end": evidence_start + len(evidence),
                "text": evidence,
            },
        }
        tasks.append(task)

    categories = [
        category.strip()
        for category in row["riskCategory"].split(",")
        if category.strip()
    ]
    return {
        "schemaVersion": "1.0",
        "caseId": row["recordId"],
        "split": split,
        "source": {
            "dataset": "AMI Meeting Corpus",
            "license": LICENSE,
            "meetingId": row["meetingId"],
            "transcript": transcript,
        },
        "tasks": tasks,
        "uncertaintyLabels": (
            ["hedged commitment"] if "guess" in row["notes"].lower() else []
        ),
        "risk": {
            "level": row["riskLevel"].strip(),
            "confirmationRequired": truth(row["confirmationRequired"]),
            "categories": categories,
        },
        "annotation": {
            "annotatorIds": (
                ["primary-human", "independent-human-2"]
                if adjudicated
                else ["primary-human"]
            ),
            "adjudicated": adjudicated,
            "notes": row["notes"].strip(),
        },
    }


def main() -> None:
    with INPUT.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 50:
        raise ValueError(f"Expected 50 rows, found {len(rows)}")

    meeting_ids = sorted({row["meetingId"] for row in rows})
    test_count = max(1, len(meeting_ids) // 5)
    validation_count = max(1, len(meeting_ids) // 5)
    splits = {
        meeting_id: (
            "test"
            if index < test_count
            else "validation"
            if index < test_count + validation_count
            else "train"
        )
        for index, meeting_id in enumerate(meeting_ids)
    }
    records = [build_record(row, splits[row["meetingId"]]) for row in rows]

    OUTPUT.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest = {
        "dataset": "AMI Meeting Corpus",
        "license": LICENSE,
        "source": "https://groups.inf.ed.ac.uk/ami/download/",
        "annotationSchema": "1.0",
        "recordCount": len(records),
        "actionRecordCount": sum(bool(record["tasks"]) for record in records),
        "meetingCount": len(meeting_ids),
        "splits": {
            split: sorted({record["source"]["meetingId"] for record in records if record["split"] == split})
            for split in ("train", "validation", "test")
        },
        "warning": "Pilot has only two positive action records; do not report final model performance from this pilot.",
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} records to {OUTPUT}")
    print(f"Wrote manifest to {MANIFEST}")


if __name__ == "__main__":
    main()
