@echo off
title Ollama Discord Bot - Installation
cd /d "%~dp0"

echo ==============================================
echo      Ollama Discord Bot - Installation
echo ==============================================
echo.

:: 1. Creation du virtual environment Python
echo [1/3] Creation du virtual environment Python...
if exist "venv" (
    echo       venv existe deja, skip.
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [ERREUR] Impossible de creer le venv. Verifie que Python est installe et dans le PATH.
        pause
        exit /b 1
    )
    echo       venv cree.
)
echo.

:: 2. Installation des dependances Python
echo [2/3] Installation des dependances Python (requirements.txt)...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERREUR] Echec de l'installation des dependances Python.
    pause
    exit /b 1
)
echo       Dependances Python installees.
echo.

:: 3. Installation des dependances npm (frontend)
echo [3/3] Installation des dependances npm (frontend)...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] npm introuvable. Verifie que Node.js est installe et dans le PATH.
    pause
    exit /b 1
)
cd frontend
call npm install
if errorlevel 1 (
    echo [ERREUR] Echec du npm install dans frontend.
    cd ..
    pause
    exit /b 1
)
cd ..
echo       Dependances frontend installees.
echo.

:: Termine
echo ==============================================
echo   Installation terminee avec succes !
echo   Lance start.bat pour demarrer le projet.
echo ==============================================
pause
