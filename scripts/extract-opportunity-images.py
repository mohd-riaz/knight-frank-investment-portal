"""Extract original embedded property photos and link reviewed opportunity records.

Usage: python scripts/extract-opportunity-images.py path/to/tracker.pdf
Requires pdfplumber, pypdf and Pillow. Uses page/column provenance, not PDF object order.
"""

import hashlib
import json
from pathlib import Path
import sys

import pdfplumber
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
extraction = json.loads((root / "data/october-2024-source.json").read_text(encoding="utf-8"))
if source_hash != extraction["sha256"]:
    raise ValueError("PDF does not match the reviewed dataset's source file")
catalog_path = root / "src/datasets/october-2024.json"
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
panels = sorted({(r["page"], r["column"]) for p in catalog for r in p["sourcePanels"][:1]})
output = root / "public/assets/images/october-2024"
output.mkdir(parents=True, exist_ok=True)
reader = PdfReader(source)
manifest = []
with pdfplumber.open(source) as pdf:
    for page_number, column in panels:
        page = pdf.pages[page_number - 1]
        edges = [0, 480, 960] if page_number == 6 else [0, 330, 650, 960]
        left, right = edges[column - 1:column + 1]
        # Ignore the header logo; choose the photograph above this listing panel.
        candidates = [im for im in page.images
                      if 80 <= im["top"] < 275
                      and left <= (im["x0"] + im["x1"]) / 2 < right]
        if len(candidates) != 1:
            raise ValueError(f"Expected one photo on page {page_number}, column {column}")
        placement = candidates[0]
        embedded = reader.pages[page_number - 1].images["/" + placement["name"]]
        stem = f"october-2024/page-{page_number:02d}-column-{column}"
        target = root / f"public/assets/images/{stem}.jpg"
        # Keep original JPEG bytes wherever possible; no screenshot or upscaling.
        if embedded.image.format == "JPEG":
            target.write_bytes(embedded.data)
        else:
            embedded.image.convert("RGB").save(target, "JPEG", quality=95)
        manifest.append({
            "image": stem,
            "page": page_number,
            "column": column,
            "pdfImage": placement["name"],
            "width": embedded.image.width,
            "height": embedded.image.height,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        })
for property in catalog:
    panel = property["sourcePanels"][0]
    property["image"] = f"october-2024/page-{panel['page']:02d}-column-{panel['column']}"
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(root / "src/datasets/october-2024-images.json").write_text(
    json.dumps({"sourceSha256": source_hash, "images": manifest}, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {len(manifest)} original photos and linked {len(catalog)} opportunities")
