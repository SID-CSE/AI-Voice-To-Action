"""Create an action-rich AMI annotation worksheet for manual review."""

from __future__ import annotations

import csv
import re
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AMI = ROOT / "research_data" / "source" / "ami" / "manual"
OUTPUT = ROOT / "research_data" / "actionflow_action_pilot_expansion_400.csv"
TARGET_COUNT = 400
EXISTING_DATASET = ROOT / "research_data" / "actionflow_annotated_pilot_100.json"
NS = {"nite": "http://nite.sourceforge.net/"}
WORD_RANGE = re.compile(r"words(\d+)\)\.\.id\([^)]*words(\d+)\)")
ACTION_PATTERN = re.compile(
    r"\b("
    r"need to|have to|has to|should|must|will|going to|gonna|"
    r"can you|could you|would you|let's|let us|i can|i'll|i will|"
    r"we can|we should|we need|take|send|check|make|write|review|"
    r"add|remove|update|change|design|finish|prepare|look|ask|"
    r"follow up|talk to|call|meet|decide|choose|test|implement|"
    r"create|build|fix|bring|show|give|provide|discuss"
    r")\b",
    re.IGNORECASE,
)


def words_for_file(path: Path) -> dict[str, str]:
    root = ET.parse(path).getroot()
    result = {}
    for element in root.findall(".//w"):
        identifier = element.attrib.get("{http://nite.sourceforge.net/}id", "")
        match = re.search(r"words(\d+)$", identifier)
        if match and element.text:
            result[match.group(1)] = element.text
    return result


def render(values: list[str]) -> str:
    punctuation = {".", ",", "?", "!", ";", ":", ")", "]"}
    text = ""
    for value in values:
        if value in punctuation or value in {"'s", "n't", "'re", "'ll", "'ve", "'d", "'m"}:
            text = text.rstrip() + value
        else:
            text += (" " if text else "") + value
    return text.strip()


def candidates() -> list[dict[str, str]]:
    existing_texts: set[str] = set()
    if EXISTING_DATASET.exists():
        import json
        existing_texts = {
            record["source"]["transcript"].strip()
            for record in json.loads(EXISTING_DATASET.read_text(encoding="utf-8"))
        }
    scored: list[tuple[int, dict[str, str]]] = []
    for segment_path in sorted((AMI / "segments").glob("*.segments.xml")):
        meeting_id, channel = segment_path.name.split(".")[:2]
        word_path = AMI / "words" / f"{meeting_id}.{channel}.words.xml"
        if not word_path.exists():
            continue
        word_map = words_for_file(word_path)
        root = ET.parse(segment_path).getroot()
        for segment in root.findall(".//segment"):
            child = segment.find("nite:child", NS)
            if child is None:
                continue
            match = WORD_RANGE.search(child.attrib.get("href", ""))
            if not match:
                continue
            start, end = int(match.group(1)), int(match.group(2))
            text = render([word_map[str(i)] for i in range(start, end + 1) if str(i) in word_map])
            if not 6 <= len(text.split()) <= 60:
                continue
            matches = ACTION_PATTERN.findall(text)
            if not matches:
                continue
            score = len(matches) * 10
            if re.search(r"\b(i|we|you|he|she|they|someone|somebody)\b", text, re.I):
                score += 2
            if re.search(r"\b(by|before|after|tomorrow|today|week|month|deadline)\b", text, re.I):
                score += 3
            scored.append(
                (
                    score,
                    {
                        "meetingId": meeting_id,
                        "channel": channel,
                        "startTime": segment.attrib.get("transcriber_start", ""),
                        "endTime": segment.attrib.get("transcriber_end", ""),
                        "transcript": text,
                    },
                )
            )
    scored.sort(key=lambda item: (-item[0], item[1]["meetingId"], item[1]["channel"], item[1]["startTime"]))
    selected: list[dict[str, str]] = []
    seen_text: set[str] = set()
    for _, row in scored:
        if row["transcript"] in seen_text or row["transcript"] in existing_texts:
            continue
        selected.append(row)
        seen_text.add(row["transcript"])
        if len(selected) == TARGET_COUNT:
            break
    if len(selected) < TARGET_COUNT:
        raise RuntimeError(f"Only found {len(selected)} action candidates.")
    for index, row in enumerate(selected, 1):
        row.update(
            {
                "recordId": f"ami-expansion-{index:03d}",
                "isAction": "",
                "task": "",
                "owner": "",
                "deadline": "",
                "riskLevel": "",
                "riskCategory": "",
                "confirmationRequired": "",
                "evidence": "",
                "notes": "",
            }
        )
    return selected


def main() -> None:
    rows = candidates()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "recordId", "meetingId", "channel", "startTime", "endTime", "transcript",
        "isAction", "task", "owner", "deadline", "riskLevel", "riskCategory",
        "confirmationRequired", "evidence", "notes",
    ]
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} records to {OUTPUT}")


if __name__ == "__main__":
    main()
