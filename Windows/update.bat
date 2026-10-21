@echo off
REM ====================================================================
REM OPEN STREAM SUITE — ACTUALIZADOR AUTOMÁTICO VÍA GIT (WINDOWS)
REM ====================================================================
cd /d "%~dp0.."

set "BRANCH=%~1"
if "%BRANCH%"=="" set "BRANCH=main"

echo ============================================================
echo   ACTUALIZADOR DE OPEN STREAM SUITE
echo ============================================================
echo Canal / Rama seleccionada: %BRANCH%
echo.

if not exist ".git" (
    echo [AVISO] Esta carpeta no fue clonada con Git.
    echo Descarga la ultima version desde: https://github.com/AndorinaAI/open-stream-suite/releases
    pause
    exit /b 1
)

echo Descargando ultimos cambios desde GitHub (rama: %BRANCH%)...
git checkout %BRANCH%
git pull origin %BRANCH%

echo.
echo Actualizando dependencias...
if exist "app\venv\Scripts\pip.exe" (
    app\venv\Scripts\pip.exe install -r app\requirements.txt
)

echo.
echo ============================================================
echo   ACTUALIZACION COMPLETADA CON EXITO
echo ============================================================
echo Reinicia la aplicacion para aplicar todos los cambios.
echo ============================================================
pause
