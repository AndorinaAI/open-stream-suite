@echo off
REM ====================================================================
REM OPEN STREAM SUITE — INICIADOR PARA WINDOWS
REM ====================================================================
cd /d "%~dp0"

if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXEC=venv\Scripts\python.exe"
) else (
    set "PYTHON_EXEC=python"
)

echo Iniciando Open Stream Suite Launcher...
start "" %PYTHON_EXEC% launcher.py
