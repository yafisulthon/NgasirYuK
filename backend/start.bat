@echo off
echo Menjalankan NgasirYuK Backend...
echo.
cd /d "%~dp0"
python -m uvicorn app.main:app --reload --port 8000
