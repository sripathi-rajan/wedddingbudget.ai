# weddingbudget.AI — AI-Powered Wedding Budget Planner

> Full-stack hackathon project: AI decor cost prediction + PSO budget optimizer for Indian weddings.

---

## Features

| Tab | What it does |
|-----|-------------|
| Style | Wedding type, date (weekend +15% uplift), event selector |
| Venue | Venue type, city, guest count, rooms auto-calculator |
| Decor AI | ML cost predictor (MobileNetV2 + RandomForest) + similarity search |
| Food | Meal tiers, bar type, specialty counters, live per-head estimate |
| Artists | Named artist selector with negotiated fee ranges |
| Sundries | Room baskets, hampers, rituals — auto-calculated |
| Logistics | Fleet calculator, Ghodi, Dholi, SFX, distance-based transfers |
| Budget | PSO Optimizer, pie chart, itemised table, PDF/JSON export |
| Admin | Pricing control, booking requests, negotiation log |

---

## Quick Start

### Windows
```
Double-click: START_WINDOWS.bat
```

### Mac / Linux
```bash
chmod +x start_mac_linux.sh && ./start_mac_linux.sh
```

The script checks Node.js + Python, installs packages, trains the AI model, then opens the app.

---

## Prerequisites

- **Node.js** v18+ — https://nodejs.org (LTS)
- **Python** 3.10+ — https://python.org
  - Windows: tick **"Add Python to PATH"** during install

---

## Project Structure

```
weddingbudget.ai/
├── frontend/                  # React 18 + Vite
│   └── src/
│       ├── App.jsx            # Root + tab navigation
│       ├── context/           # Global wedding state (WeddingContext)
│       ├── pages/             # Tab1Style … Tab8Budget, AdminPage
│       └── components/        # ImageCard
│
├── backend/                   # FastAPI (Python)
│   ├── main.py                # App entry + CORS
│   ├── models/cost_tables.py  # All cost data (admin-editable)
│   ├── services/budget_engine.py  # Budget calc + PSO optimizer
│   ├── routers/               # /budget, /decor, /admin endpoints
│   └── ml/train.py            # ML pipeline (MobileNetV2 + RF)
│
├── START_WINDOWS.bat          # One-click Windows launcher
├── start_mac_linux.sh         # One-click Mac/Linux launcher
└── render.yaml                # Render.com deploy config
```

---

## AI Components

### Decor Cost Predictor (Tab 3)
- Model: RandomForestRegressor
- Features: MobileNetV2 image embeddings (1280-dim) + one-hot style tags
- Output: Predicted cost ± 20% range + top-3 similar designs (cosine similarity)

### PSO Budget Optimizer (Tab 8)
- Algorithm: Particle Swarm Optimization — 30 particles × 50 iterations
- Levers: Venue tier, Food tier, Hotel tier, Decor, Artists, Logistics
- Output: Itemised recommendations to hit the user's target budget

---

## Manual Start (if scripts fail)

**Terminal 1 — Backend**
```bash
py -3.11 -m venv .venv
cd backend
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python ml/train.py
pip install greenlet --force-reinstall
python -m uvicorn main:app --reload --port 8000
```

cd backend
.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

---

## Deploy (Free)

| Service | Purpose | Cost |
|---------|---------|------|
| Render | FastAPI backend | Free (sleeps after 15 min idle) |
| Vercel | React frontend | Free |

See [DEPLOY_ONLINE.md](DEPLOY_ONLINE.md) for step-by-step instructions.

---

Built for Hackathon 2026.
