"""Create a manual ActionFlow annotation worksheet from AMI NXT annotations."""

from __future__ import annotations

import csv
import re
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AMI = ROOT / "research_data" / "source" / "ami" / "manual"
OUTPUT = ROOT / "research_data" / "actionflow_pilot_50.csv"
NS = {"nite": "http://nite.sourceforge.net/"}
WORD_RANGE = re.compile(r"words(\d+)\)\.\.id\([^)]*words(\d+)\)")


def words_for_file(path: Path) -> list[tuple[str, str]]:
    root = ET.parse(path).getroot()
    words = []
    for element in root.findall(".//w"):
        identifier = element.attrib.get("{http://nite.sourceforge.net/}id", "")
        index_match = re.search(r"words(\d+)$", identifier)
        if index_match and element.text:
            words.append((index_match.group(1), element.text))
    return words


def render(values: list[str]) -> str:
    punctuation = {".", ",", "?", "!", ";", ":", ")", "]"}
    text = ""
    for value in values:
        if value in punctuation:
            text = text.rstrip() + value
        elif value in {"'s", "n't", "'re", "'ll", "'ve", "'d", "'m"}:
            text = text.rstrip() + value
        else:
            text += (" " if text else "") + value
    return text.strip()


def build_rows() -> list[dict[str, str]]:
    rows = []
    for segment_path in sorted((AMI / "segments").glob("*.segments.xml")):
        meeting_id = segment_path.name.split(".")[0]
        channel = segment_path.name.split(".")[1]
        word_path = AMI / "words" / f"{meeting_id}.{channel}.words.xml"
        if not word_path.exists():
            continue
        word_pairs = words_for_file(word_path)
        word_map = {index: value for index, value in word_pairs}
        root = ET.parse(segment_path).getroot()
        for segment in root.findall(".//segment"):
            child = segment.find("nite:child", NS)
            if child is None:
                continue
            match = WORD_RANGE.search(child.attrib.get("href", ""))
            if not match:
                continue
            start, end = int(match.group(1)), int(match.group(2))
            text = render([word_map[str(index)] for index in range(start, end + 1) if str(index) in word_map])
            if 8 <= len(text.split()) <= 60:
                rows.append(
                    {
                        "recordId": f"ami-pilot-{len(rows) + 1:03d}",
                        "meetingId": meeting_id,
                        "channel": channel,
                        "startTime": segment.attrib.get("transcriber_start", ""),
                        "endTime": segment.attrib.get("transcriber_end", ""),
                        "transcript": text,
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
                break
        if len(rows) >= 50:
            break
    if len(rows) < 50:
        raise RuntimeError(f"Only found {len(rows)} qualifying records; expected 50.")
    return rows


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    rows = build_rows()
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} records to {OUTPUT}")


if __name__ == "__main__":
    main()
