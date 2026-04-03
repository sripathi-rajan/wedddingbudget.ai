"""
scrape_decor.py — Download decor images via Bing and seed labels.csv.

Usage (from repo root):
    pip install icrawler
    python scripts/scrape_decor.py

Images land in:  decor_dataset/data/images/{category}/
Labels appended: decor_dataset/data/labels.csv
"""

import csv
import os
from icrawler.builtin import BingImageCrawler

QUERIES = {
    "mandap":    "indian wedding mandap decoration",
    "stage":     "indian wedding stage decoration",
    "entrance":  "indian wedding entrance decoration",
    "floral":    "indian wedding floral decoration",
    "reception": "indian wedding reception decoration",
    "table":     "indian wedding table centerpiece",
}

IMAGES_PER_QUERY = 50
BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "decor_dataset", "data")
IMAGES_ROOT = os.path.join(BASE_DIR, "images")
LABELS_CSV = os.path.join(BASE_DIR, "labels.csv")

LABELS_FIELDNAMES = ["filename", "category", "complexity", "cost"]


def _existing_filenames() -> set:
    """Return filenames already recorded in labels.csv."""
    if not os.path.exists(LABELS_CSV):
        return set()
    with open(LABELS_CSV, newline="", encoding="utf-8") as f:
        return {row["filename"] for row in csv.DictReader(f)}


def _append_rows(rows: list[dict]):
    """Append new label rows to labels.csv, creating the file if needed."""
    os.makedirs(os.path.dirname(LABELS_CSV), exist_ok=True)
    write_header = not os.path.exists(LABELS_CSV)
    with open(LABELS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=LABELS_FIELDNAMES)
        if write_header:
            writer.writeheader()
        writer.writerows(rows)


def scrape():
    existing = _existing_filenames()

    for category, query in QUERIES.items():
        out_dir = os.path.join(IMAGES_ROOT, category)
        os.makedirs(out_dir, exist_ok=True)

        # icrawler names files 000001.jpg … so we tell it where to save
        crawler = BingImageCrawler(
            storage={"root_dir": out_dir},
            downloader_threads=4,
        )
        crawler.crawl(
            keyword=query,
            max_num=IMAGES_PER_QUERY,
            filters={"size": "medium", "type": "photo"},
        )

        # Collect images written during this crawl
        new_rows = []
        for fname in sorted(os.listdir(out_dir)):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue
            # Store path relative to images root so the admin API can serve it
            rel = os.path.join(category, fname)
            if rel not in existing:
                new_rows.append({
                    "filename":   rel,
                    "category":   category,
                    "complexity": "Medium",
                    "cost":       0,
                })
                existing.add(rel)

        _append_rows(new_rows)
        print(f"Scraped {len(new_rows)} images for {category}")

    print("\nDone. Label costs via the Admin → Label Images panel.")


if __name__ == "__main__":
    scrape()
