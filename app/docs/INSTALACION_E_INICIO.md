# 🚀 Guía de Instalación y Primer Inicio
### Open Stream Suite · Para Linux, Windows y macOS

<p align="center">
  <b>Español</b> | <a href="INSTALLATION_AND_STARTUP.md">English</a>
</p>

Esta guía explica paso a paso cómo instalar dependencias, arrancar la aplicación de control de escritorio y añadir tus primeras escenas a OBS Studio.

---

## 📋 Requisitos Previos

1. **Python 3.10 o superior** (probado con Python 3.10, 3.11 y 3.12).
   - En **Windows**: Descarga Python desde [python.org](https://www.python.org/) y asegúrate de marcar la casilla **"Add Python to PATH"** en el instalador.
   - En **Linux** (Ubuntu/Debian): `sudo apt install python3 python3-venv python3-tk`
   - En **macOS**: `brew install python python-tk` o desde python.org.
2. **OBS Studio** instalado en el mismo ordenador.
3. *(Opcional)* Cuenta de desarrollador de Twitch en [dev.twitch.tv](https://dev.twitch.tv/console/apps) si deseas recibir eventos de chat y alertas en vivo.

---

## ⚡ Método 1: Instalación Rápida Automática (Recomendado)

El proyecto incluye instaladores automáticos que preparan el entorno virtual, descargan las librerías necesarias y crean un acceso directo en tu sistema.

### 🐧 En Linux (Ubuntu, Debian, Fedora, Arch):
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
./Linux/install.sh
```
*Esto instalará las dependencias en `app/venv/` y registrará el acceso directo "Open Stream Suite" en el menú de aplicaciones de tu escritorio.*

### 🪟 En Windows (10 y 11):
1. Entra en la carpeta `Windows\`.
2. Haz **doble clic** en:
   ```text
   install.bat
   ```
*Se abrirá una ventana de comandos que configurará el entorno automáticamente.*

### 🍎 En macOS:
1. Entra en la carpeta `Mac/`.
2. Haz **doble clic** en:
   ```text
   install.command
   ```

---

## 🎮 Cómo Iniciar la Aplicación

Una vez completada la instalación, inicia la suite haciendo doble clic en el script correspondiente en la **raíz del proyecto**:

| Sistema Operativo | Archivo de Inicio |
| :--- | :--- |
| 🐧 **Linux** | Haz doble clic en `Linux/Iniciar Open Stream Suite.sh` o búscalo en tu menú de aplicaciones |
| 🪟 **Windows** | Haz doble clic en `Windows/Iniciar Open Stream Suite.bat` |
| 🍎 **macOS** | Haz doble clic en `Mac/Iniciar Open Stream Suite.command` |

> [!TIP]
> También puedes arrancar desde la terminal en cualquier momento ejecutando:
> ```bash
> ./Linux/Iniciar\ Open\ Stream\ Suite.sh
> ```

---

## 🎛️ Primeros Pasos en el Panel de Control

Al abrir el lanzador verás una ventana de control con tema oscuro y 4 pestañas:

```text
┌───────────────────────────────────────────────────────────┐
│ OPEN STREAM SUITE  v1.0.1-alpha                               │
├───────────────────────────────────────────────────────────┤
│ [🚀 Servidor]  [🟣 Twitch]  [📖 Guía]  [📜 Registro]      │
│                                                           │
│  ESTADO DEL SERVIDOR: [ ACTIVO ]                          │
│  http://127.0.0.1:8080 · WebSocket listo para OBS        │
│  Clientes OBS: 1 · Tema neón activo: maker                │
│                                                           │
│  [⏹️ Detener Servidor]  [🎛️ Abrir Panel]  [📂 Overlays]    │
└───────────────────────────────────────────────────────────┘
```

1. **Iniciar el Servidor**: Pulsa el botón **`⚡ Iniciar Servidor`** (cambiará a color verde con estado `ACTIVO`).
2. **Abrir el Panel de Control**: Pulsa el botón **`🎛️ Abrir Panel de Control`**. Se abrirá en tu navegador en [http://localhost:8080/alerts/panel.html](http://localhost:8080/alerts/panel.html).
3. **Bandeja del Sistema (Tray)**: Si minimizas o cierras la ventana, la aplicación se mantendrá activa discretamente en la barra de tareas/bandeja con accesos directos rápidos.
4. **Configurar Twitch (Opcional)**:
   - Ve a la pestaña **🟣 Twitch** en el lanzador.
   - Introduce tu *Client ID* y *Client Secret*.
   - Pulsa **Guardar Credenciales** y después **Conectar con Twitch**.

---

## 🎥 Configurar OBS Studio

Todas las escenas y widgets son páginas web locales que se añaden a OBS como **Fuentes de Navegador** (*Browser Sources*):

1. Abre **OBS Studio**.
2. En la lista de **Fuentes**, pulsa **`+`** → **Navegador** (*Browser*).
3. Introduce la URL local de la escena deseada con resolución **`1920 × 1080`**:
   - **Escena de Juego (Gameplay)**: `http://localhost:8080/overlays/game/index.html`
   - **Escena de Charla (Chill)**: `http://localhost:8080/overlays/chill/index.html`
   - **Cámara Secundaria / Multicámara**: `http://localhost:8080/overlays/print/machine/index.html`
   - **Alertas y Memes en Pantalla**: `http://localhost:8080/alerts/index.html`
4. Marca las casillas:
   - ✅ *Apagar la fuente cuando no sea visible*.
   - ✅ *Actualizar el navegador cuando la escena se active*.

> [!NOTE]
> Para ver todas las plantillas interactivas disponibles, abre el catálogo local en [http://localhost:8080/index.html](http://localhost:8080/index.html).

---

## 🛠️ Método 2: Instalación Manual para Desarrolladores

Si prefieres gestionar el entorno manualmente desde la terminal:

```bash
# 1. Entrar a la carpeta del proyecto
cd app

# 2. Crear y activar el entorno virtual
python3 -m venv venv
source venv/bin/activate       # En Linux / macOS
# venv\Scripts\activate       # En Windows

# 3. Instalar las librerías requeridas
pip install -r requirements.txt

# 4. Copiar la configuración base
cp .env.example .env

# 5. Ejecutar la app
python3 launcher.py
```

---

## ❓ Preguntas Frecuentes y Solución de Problemas

#### 1. "Python no se reconoce como un comando interno o externo" (Windows)
Reinstala Python desde [python.org](https://www.python.org/) y asegúrate de marcar la casilla **"Add Python to PATH"** en la primera pantalla del instalador.

#### 2. Permiso denegado al ejecutar el script en Linux / macOS
Si el archivo `.sh` o `.command` no tiene permisos de ejecución, otórgaselos en la terminal:
```bash
chmod +x Linux/*.sh Mac/*.command
```

#### 3. Error `ModuleNotFoundError: No module named '_tkinter'` en Linux
En algunas distribuciones mínimas de Linux, la librería gráfica Tkinter viene en un paquete separado. Instálalo con:
- **Ubuntu / Debian**: `sudo apt install python3-tk`
- **Fedora**: `sudo dnf install python3-tkinter`
- **Arch Linux**: `sudo pacman -S tk`

#### 4. ¿Puedo usar Open Stream Suite sin conexión a Internet?
**Sí, al 100%.** Todas las fuentes tipográficas están descargadas localmente en `app/common/fonts/`. Los memes, sonidos, overlays, el temporizador, el selector de temas neón y los widgets funcionan completamente sin internet. Solo necesitas conexión si deseas vincular Twitch para recibir followers y chat en directo.
