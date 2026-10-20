@echo off
REM ====================================================================
REM OPEN STREAM SUITE — INICIADOR DIRECTO (WINDOWS)
REM ====================================================================
cd /d "%~dp0app"

if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXEC=venv\Scripts\python.exe"
) else (
    set "PYTHON_EXEC=python"
)

echo Iniciando Open Stream Suite...
start "" %PYTHON_EXEC% launcher.py %*
