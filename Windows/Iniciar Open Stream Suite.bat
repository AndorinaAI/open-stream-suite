@echo off
REM ====================================================================
REM OPEN STREAM SUITE — INICIADOR DIRECTO (WINDOWS)
REM ====================================================================
cd /d "%~dp0..\app"

if exist "venv\Scripts\pythonw.exe" (
    set "PYTHON_EXEC=venv\Scripts\pythonw.exe"
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXEC=venv\Scripts\python.exe"
) else (
    set "PYTHON_EXEC=pythonw"
)

start "" "%PYTHON_EXEC%" launcher.py %*
