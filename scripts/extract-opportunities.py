"""Extract the October 2024 tracker's columns without interleaving properties.

Usage: python scripts/extract-opportunities.py path/to/tracker.pdf
Requires pdfplumber. Reviewed/normalized records live in src/datasets/.
"""

import hashlib
import json
from pathlib import Path
import sys

import pdfplumber

source = Path(sys.argv[1])
destination = Path(__file__).resolve().parents[1] / "data" / "october-2024-source.json"
with pdfplumber.open(source) as pdf:
    if len(pdf.pages) != 23:
        raise ValueError("Expected the 23-page October 2024 tracker")
    entries = []
    for number in range(3, 23):
        page = pdf.pages[number - 1]
        # The South West page has two wide columns; all others have three.
        edges = [0, 480, 960] if number == 6 else [0, 330, 650, 960]
        for column, (left, right) in enumerate(zip(edges, edges[1:]), 1):
            text = page.crop((left, 275, right, 540)).extract_text() or ""
            entries.append({
                "page": number,
                "column": column,
                "text": text.replace("\u200b", "").strip(),
            })
    result = {
        "document": source.name,
        "asOf": "2024-10",
        "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "pageCount": len(pdf.pages),
        "entries": entries,
    }
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {len(entries)} property panels to {destination}")
