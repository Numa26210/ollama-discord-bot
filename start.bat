@echo off
title Ollama Discord Bot - Launcher

echo ==============================================
echo        Ollama Discord Bot - Launcher
echo ==============================================
echo   1. Backend API    (port 8000)
echo   2. Discord Bot
echo   3. Frontend       (port 3000)
echo ==============================================
echo.

cd /d "%~dp0"

:: Check venv
if not exist "venv\Scripts\activate.bat" (
    echo [ERREUR] venv introuvable. Crée-le avec: python -m venv venv
    pause
    exit /b 1
)

:: Activate venv
call venv\Scripts\activate.bat

:: Check node_modules
if not exist "frontend\node_modules" (
    echo [INFO] Installation des dependances frontend...
    cd frontend
    call npm install
    cd ..
)

echo [1/3] Lancement du Backend API...
start "Ollama Discord Bot - Backend" cmd /k "cd /d "%~dp0" && call venv\Scripts\activate.bat && cd backend && python run.py"

timeout /t 2 /nobreak >nul

echo [2/3] Lancement du Bot Discord...
start "Ollama Discord Bot - Bot" cmd /k "cd /d "%~dp0" && call venv\Scripts\activate.bat && cd bot && python run_bot.py"

timeout /t 1 /nobreak >nul

echo [3/3] Lancement du Frontend...
start "Ollama Discord Bot - Frontend" cmd /k "cd /d "%~dp0\frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Tout est lance !
echo.
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:3000
echo.
echo Ferme cette fenetre quand tu veux. Les 3 services tournent dans leurs propres fenetres.
pause
