@echo off
REM ====================================================================
REM OPEN STREAM SUITE — INSTALADOR AUTOMÁTICO PARA WINDOWS
REM ====================================================================
cd /d "%~dp0.."
set "ROOT_DIR=%CD%"
set "APP_DIR=%ROOT_DIR%\app"

echo ============================================================
echo   OPEN STREAM SUITE - Instalacion y Configuracion (Windows)
echo ============================================================
echo Directorio: %ROOT_DIR%
echo.

REM 1. Comprobar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Descarga e instala Python desde https://www.python.org/
    echo Asegurate de marcar la casilla "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)

REM 2. Crear entorno virtual
if not exist "%APP_DIR%\venv" (
    echo Creando entorno virtual en app\venv...
    python -m venv "%APP_DIR%\venv"
)

REM 3. Instalar dependencias
echo Instalando dependencias...
"%APP_DIR%\venv\Scripts\python.exe" -m pip install --upgrade pip
"%APP_DIR%\venv\Scripts\python.exe" -m pip install -r "%APP_DIR%\requirements.txt"

REM 4. Crear .env si no existe
if not exist "%APP_DIR%\.env" (
    echo Creando app\.env desde app\.env.example...
    copy "%APP_DIR%\.env.example" "%APP_DIR%\.env"
)

echo.
echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo Puedes iniciar la suite haciendo doble clic en:
echo   "Iniciar Open Stream Suite.bat"
echo ============================================================
pause
