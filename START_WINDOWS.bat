@echo off
echo.
echo  =========================================
echo    weddingbudget.AI — Wedding Planner Setup
echo  =========================================
echo.

:: ─── Check Node.js ───────────────────────────────────────
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js not found!
    echo  Please install from: https://nodejs.org  (LTS version)
    echo  Then re-run this script.
    pause
    exit /b 1
)
echo  ✅ Node.js found

:: ─── Check Python ────────────────────────────────────────
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Python not found!
    echo  Please install from: https://python.org  (3.10+)
    echo  IMPORTANT: Check "Add Python to PATH" during install!
    pause
    exit /b 1
)
echo  ✅ Python found

echo.
echo  📦 Installing backend dependencies...
echo  (This takes ~2 minutes the first time)
echo.
cd backend
python -m pip install --quiet fastapi uvicorn pydantic python-multipart scikit-learn numpy Pillow reportlab openpyxl httpx
if %errorlevel% neq 0 (
    echo  ❌ Backend install failed. Try: pip install -r requirements.txt manually
    pause
    exit /b 1
)
echo  ✅ Backend packages installed

echo.
echo  🤖 Training AI Decor Model...
cd ml
python train.py
cd ..
echo  ✅ AI model trained and ready

echo.
echo  📦 Installing frontend dependencies...
cd ..\frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo  ❌ Frontend install failed
    pause
    exit /b 1
)
echo  ✅ Frontend packages installed

echo.
echo  =========================================
echo   🚀 LAUNCHING weddingbudget.AI
echo  =========================================
echo.
echo  Backend API  →  http://localhost:8000
echo  Frontend App →  http://localhost:3000
echo.
echo  Press Ctrl+C to stop
echo.

:: Start backend in a new window
start "weddingbudget.AI Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

:: Give backend 3 seconds to start
timeout /t 3 /nobreak >nul

:: Start frontend
cd ..\frontend
start "weddingbudget.AI Frontend" cmd /k "npm run dev"

:: Open browser
timeout /t 4 /nobreak >nul
start http://localhost:3000

echo  ✅ App launched! Browser should open automatically.
echo  If not, visit: http://localhost:3000
echo.
pause
