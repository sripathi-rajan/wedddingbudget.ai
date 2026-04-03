@echo off
echo ============================================
echo  Vivah AI -- Wedding Decor Price Predictor
echo ============================================

pip install flask flask-cors scikit-learn joblib numpy pillow -q

if not exist models\v1\cost_predictor.joblib (
    echo Generating training data and training model...
    python scripts/generate_seed_data.py
)

echo.
echo Starting ML API on http://localhost:5001
echo Open wedding_planner.html in your browser
echo Press Ctrl+C to stop.
echo.
python backend/app.py
