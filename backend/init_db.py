import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from database import DB_PATH, get_connection, create_all

# Remove existing DB
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"Removed existing DB at {DB_PATH}")

create_all()

SEED_COST_ITEMS = [
    # Artists
    ("artist", "Local DJ",          50_000,  150_000, "flat"),
    ("artist", "Regional Singer",   80_000,  200_000, "flat"),
    ("artist", "Live Band",        120_000,  300_000, "flat"),
    ("artist", "Anchor",            25_000,   75_000, "flat"),
    ("artist", "Folk Troupe",       60_000,  150_000, "flat"),
    # Catering
    ("catering", "Veg Standard",       350,     700,  "per head"),
    ("catering", "NonVeg",             500,     900,  "per head"),
    ("catering", "Full Bar",           800,   2_000,  "per head"),
    ("catering", "Chaat Counter",   20_000,  35_000,  "flat"),
    # Logistics
    ("logistics", "Ghodi",          10_000,  15_000,  "flat"),
    ("logistics", "Dholi",           2_000,   3_500,  "per hour"),
    ("logistics", "Cold Pyro",       6_000,  10_000,  "per unit"),
]

conn = get_connection()
conn.executemany(
    "INSERT INTO cost_items (category, name, cost_low, cost_high, unit) VALUES (?, ?, ?, ?, ?)",
    SEED_COST_ITEMS,
)
conn.commit()
conn.close()

print("DB ready. Tables created.")
