import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'weddingbudgetAI.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_all():
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS decor_images (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            filename        TEXT NOT NULL,
            image_path      TEXT NOT NULL,
            function_type   TEXT,
            style           TEXT,
            complexity      TEXT,
            base_cost       INTEGER,
            is_labelled     INTEGER DEFAULT 0,
            embedding_path  TEXT,
            predicted_cost  INTEGER,
            predicted_low   INTEGER,
            predicted_high  INTEGER,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS cost_items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            category    TEXT NOT NULL,
            name        TEXT NOT NULL,
            cost_low    INTEGER,
            cost_high   INTEGER,
            unit        TEXT
        );

        CREATE TABLE IF NOT EXISTS model_versions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            version     TEXT UNIQUE,
            mae         REAL,
            n_samples   INTEGER,
            model_path  TEXT,
            is_active   INTEGER DEFAULT 0,
            created_at  TEXT DEFAULT (datetime('now'))
        );
    """)

    conn.commit()
    conn.close()
