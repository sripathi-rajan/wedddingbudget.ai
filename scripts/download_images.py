from icrawler.builtin import GoogleImageCrawler
import os, shutil, csv
from PIL import Image

SEARCHES = [
    ("indian wedding mandap decoration",      "Mandap",    150000),
    ("wedding sangeet stage decoration india", "Stage",    100000),
    ("mehendi ceremony decoration setup",      "Entrance",  45000),
    ("indian wedding floral decoration",       "Floral",    55000),
    ("wedding reception stage india",          "Reception", 120000),
    ("haldi ceremony decoration india",        "Table",     35000),
]

os.makedirs("data/images", exist_ok=True)
os.makedirs("data/embeddings", exist_ok=True)
os.makedirs("models/v1", exist_ok=True)

rows = []
counter = 1

for query, func_type, base_cost in SEARCHES:
    folder = f"data/raw/{func_type.lower()}"
    os.makedirs(folder, exist_ok=True)

    print(f"\nDownloading: {query}")
    crawler = GoogleImageCrawler(storage={"root_dir": folder})
    crawler.crawl(keyword=query, max_num=30,
                  filters={"size": "medium", "type": "photo"})

    # Move and rename downloaded images
    saved = 0
    for fname in os.listdir(folder):
        if not fname.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        src = os.path.join(folder, fname)
        try:
            img = Image.open(src).convert("RGB")
            w, h = img.size
            if w < 150 or h < 150:
                continue
            dst = f"data/images/decor_{counter:03d}.jpg"
            img.save(dst, "JPEG", quality=85)
            rows.append([
                f"decor_{counter:03d}.jpg",
                func_type, "", "", base_cost
            ])
            counter += 1
            saved += 1
        except Exception as e:
            print(f"  skip {fname}: {e}")
    print(f"  Saved {saved} images for {func_type}")

# Write labels CSV with function_type pre-filled
with open("data/labels.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["filename", "function_type", "style", "complexity", "base_cost"])
    w.writerows(rows)

print(f"\nDone! {counter - 1} total images saved.")
print("Labels CSV written to data/labels.csv")
print("Style and complexity are blank — will use defaults in training.")
print("Next: python ml/extract_embeddings.py")
