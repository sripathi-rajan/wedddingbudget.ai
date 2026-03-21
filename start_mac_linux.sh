#!/bin/bash

echo ""
echo "  ========================================="
echo "    weddingbudget.AI — Wedding Planner Setup"
echo "  ========================================="
echo ""

# ─── Check Node.js ───────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "  ❌ Node.js not found!"
    echo "  Install from: https://nodejs.org (LTS)"
    echo "  Or via brew: brew install node"
    exit 1
fi
echo "  ✅ Node.js found: $(node --version)"

# ─── Check Python ────────────────────────────────────────
if ! command -v python3 &> /dev/null; then
    echo "  ❌ Python 3 not found!"
    echo "  Install from: https://python.org"
    echo "  Or via brew: brew install python3"
    exit 1
fi
echo "  ✅ Python found: $(python3 --version)"

echo ""
echo "  📦 Installing backend dependencies..."
cd backend
pip3 install --quiet fastapi uvicorn pydantic python-multipart scikit-learn numpy Pillow reportlab openpyxl httpx
echo "  ✅ Backend packages installed"

echo ""
echo "  🤖 Training AI Decor Model..."
cd ml
python3 train.py
cd ..
echo "  ✅ AI model ready"

echo ""
echo "  📦 Installing frontend dependencies..."
cd ../frontend
npm install --silent
echo "  ✅ Frontend packages installed"

echo ""
echo "  ========================================="
echo "   🚀 LAUNCHING weddingbudget.AI"
echo "  ========================================="
echo ""
echo "  Backend API  →  http://localhost:8000"
echo "  Frontend App →  http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

# Start backend
cd ../backend
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "  ✅ Backend started (PID: $BACKEND_PID)"

sleep 2

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "  ✅ Frontend started (PID: $FRONTEND_PID)"

sleep 3

# Open browser
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

echo ""
echo "  🎊 weddingbudget.AI is running!"
echo "  Open http://localhost:3000 in your browser"
echo ""
echo "  To stop: Press Ctrl+C"
wait
