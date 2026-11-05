"""Convert the second manually reviewed AMI pilot and merge both pilots."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from convert_ami_pilot import build_record


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "research_data" / "actionflow_action_pilot_50_annotated.csv"
REVIEW = ROOT / "research_data" / "actionflow_action_pilot_annotation_review.csv"
ADJUDICATION = ROOT / "research_data" / "actionflow_action_pilot_disagreements_adjudicated.csv"
OUTPUT = ROOT / "research_data" / "actionflow_action_pilot_50.json"
MERGED = ROOT / "research_data" / "actionflow_annotated_pilot_100.json"
MANIFEST = ROOT / "research_data" / "action_pilot_manifest.json"


def main() -> None:
    with INPUT.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    with REVIEW.open(newline="", encoding="utf-8-sig") as handle:
        reviews = {row["recordId"]: row for row in csv.DictReader(handle)}
    with ADJUDICATION.open(newline="", encoding="utf-8-sig") as handle:
        adjudications = {row["recordId"]: row for row in csv.DictReader(handle)}
    if len(rows) != 50:
        raise ValueError(f"Expected 50 rows, found {len(rows)}")

    meeting_ids = sorted({row["meetingId"] for row in rows})
    split_count = max(1, len(meeting_ids) // 5)
    splits = {
        meeting_id: (
            "test"
            if index < split_count
            else "validation"
            if index < split_count * 2
            else "train"
        )
        for index, meeting_id in enumerate(meeting_ids)
    }
    records = []
    for row in rows:
        adjudication = adjudications.get(row["recordId"])
        if adjudication:
            row["isAction"] = adjudication["adjudicated_isAction"]
            row["task"] = adjudication["adjudicated_task"]
            row["owner"] = adjudication["adjudicated_owner"]
            row["deadline"] = adjudication["adjudicated_deadline"]
            row["riskLevel"] = adjudication["adjudicated_riskLevel"]
            row["confirmationRequired"] = adjudication["adjudicated_confirmationRequired"]
            evidence_candidates = [adjudication["primary_evidence"], adjudication["annotator2_evidence"]]
            row["evidence"] = next(
                (evidence for evidence in evidence_candidates if evidence and evidence in row["transcript"]),
                "",
            )
            row["notes"] = adjudication["adjudication_notes"]
        review = reviews.get(row["recordId"])
        if review and review["annotationStatus"] == "REVIEW_REQUIRED" and not adjudication:
            row["notes"] = f"{row['notes'].strip()} Review flag: {review['reviewReason']}.".strip()
        records.append(build_record(row, splits[row["meetingId"]], adjudicated=bool(adjudication)))

    OUTPUT.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    first = json.loads((ROOT / "research_data" / "actionflow_pilot_50.json").read_text(encoding="utf-8"))
    merged = first + records
    MERGED.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest = {
        "dataset": "AMI Meeting Corpus",
        "license": "CC BY 4.0 (AMI manual annotations release 1.6.2)",
        "recordCount": len(records),
        "actionRecordCount": sum(bool(record["tasks"]) for record in records),
        "reviewRequiredCount": sum(
            review["annotationStatus"] == "REVIEW_REQUIRED" for review in reviews.values()
        ),
        "mergedRecordCount": len(merged),
        "mergedActionRecordCount": sum(bool(record["tasks"]) for record in merged),
        "warning": "35 disagreement rows have independent human adjudication; the remaining rows have one primary annotation and the pilot remains too small for final publication claims.",
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    print(f"Wrote {MERGED}")
    print(f"Wrote {MANIFEST}")


if __name__ == "__main__":
    main()
