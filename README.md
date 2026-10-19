# TALLER LIVE — SISTEMA COMPLETO DE OVERLAYS PARA TWITCH Y OBS STUDIO

> **JUGAR · CREAR · TRASTEAR**  
> Identidad visual contemporánea, modular y ligera para streaming de videojuegos, electrónica, programación, plotter de corte, sublimación y charlas de taller.

---

## 1. Introducción

**Taller Live** es un paquete de overlays profesionales diseñado específicamente para creadores multidisciplinares. En lugar de plantillas genéricas o recargadas con estética gamer estridente, este sistema se basa en la estética limpia de un **taller digital y laboratorio maker**: marcas de registro técnico, tipografía monoespaciada para metadatos, toques sutiles de turquesa electrónico y naranja de taller, y un respeto absoluto por el contenido del directo.

### Características Clave
- **100% Offline (Sin conexión a Internet obligatoria para overlays)**: Las tipografías están descargadas en local en `common/fonts/` y servidas por el backend. Funciona de manera local en tu ordenador sin CDNs externas.
- **Rendimiento ultra-ligero**: Desarrollado en HTML5 nativo, CSS y Vanilla JS. Sin frameworks pesados ni dependencias npm para el frontend.
- **Transparencia real**: Las escenas de directo tienen fondo transparente real para que tus juegos, terminales y cámaras se vean debajo sin filtros oscuros molestos.
- **Configuración centralizada**: Modifica el nombre del canal, los títulos de los proyectos, las fases activas y las redes sociales desde [`config.js`](config.js).
- **Catálogo interactivo**: Incluye un visualizador local en [`index.html`](index.html) para probar todas las escenas con fondos simulados antes de entrar a OBS.
- **Seguridad Robusta**: Control de subida de archivos con lista blanca y protección anti path-traversal, CORS restringido a localhost/dominio propio y autenticación con token local criptográfico en llamadas POST.

---

## 2. Estructura del Proyecto

```text
twitchoverlay/
├── README.md               # Este documento explicativo
├── CONVENTIONS.md          # Estándares de arquitectura y guía para IA/desarrollo
├── config.js               # Archivo central de personalización del stream
├── index.html              # Catálogo interactivo de previsualización local
├── server.py               # Servidor backend Python (aiohttp + WebSockets)
├── requirements.txt        # Dependencias Python
├── iniciar_alertas.sh      # Lanzador del panel y servidor de alertas
├── iniciar_preview.sh      # Lanzador del catálogo de escenas
│
├── overlays/               # Paquetes de escenas para OBS Studio (Canónico)
│   ├── game/               # Gameplay + cámara
│   ├── chill/              # Just Chatting con marco de chat
│   ├── maker/              # Pack Maker (desk = cámara cenital, pc = terminal)
│   ├── print/              # Pack Print (machine = plotter, design = CAD/diseño)
│   └── screens/            # starting-soon, be-right-back, ending
│
├── widgets/                # Widgets modulares (Panel + OBS Overlay)
│   ├── chat/               # Chat en pantalla con física de emotes
│   ├── goal/               # Metas de followers, subs y bits
│   ├── shoutout/           # Promociones y tarjetas de creador
│   ├── ticker/             # Tira de noticias, prompter y donaciones
│   └── timer/              # Cronómetro y temporizador de taller
│
├── alerts/                 # Suite de alertas y panel de control
│   ├── panel.html          # Panel de control web del streamer
│   ├── index.html          # Fuente de navegador para alertas en OBS
│   └── media/              # Archivos locales de audio, vídeo e imágenes
│
├── common/                 # Estilos compartidos, fuentes locales y utilidades
│   ├── fonts/              # Archivos de fuentes woff2 locales (100% offline)
│   ├── fonts.css           # Declaraciones @font-face locales
│   ├── styles.css          # Variables CSS, resets y diseño base
│   └── themes.css          # Paletas y temas visuales
│
└── tests/                  # Smoke tests automatizados
    └── test_smoke.py       # Pruebas de endpoints, CORS y seguridad
```

---

## 3. Guía Paso a Paso para Configurar OBS Studio

Las overlays son páginas HTML locales que se añaden a OBS como **Fuentes de Navegador** (*Browser Sources*).

### Paso 1: Configurar el lienzo base
1. Abre **OBS Studio**.
2. Ve a **Ajustes** → **Vídeo**.
3. Asegúrate de que la **Resolución de la base (Lienzo)** y la **Resolución de salida** estén en **`1920x1080`**.

### Paso 2: Crear tus escenas
Crea una escena en el panel *Escenas* para cada uno de tus modos habituales de directo:
- `1 - GAME`
- `2 - MAKER MESA`
- `3 - MAKER PC`
- `4 - PRINT MÁQUINA`
- `5 - PRINT DISEÑO`
- `6 - CHILL`
- `7 - STARTING SOON`
- `8 - PAUSA`
- `9 - ENDING`

### Paso 3: Añadir la overlay a una escena
1. Selecciona la escena en OBS (por ejemplo `2 - MAKER MESA`).
2. En la lista de **Fuentes**, pulsa en el botón **`+`** y selecciona **Navegador** (*Browser*).
3. Nómbrala `Overlay - Maker Mesa`.
4. En las propiedades de la fuente:
   - Marca la casilla **Archivo local** (*Local file*).
   - Pulsa **Examinar** y busca el archivo `overlays/maker/desk/index.html` (o usa la URL `http://localhost:8080/overlays/maker/desk/index.html`).
   - **Ancho**: `1920`
   - **Alto**: `1080`
   - Marca **Apagar la fuente cuando no sea visible**.
   - Marca **Actualizar el navegador cuando la escena se active**.
5. Pulsa **Aceptar**.

### Paso 4: Colocar las cámaras y capturas de vídeo
Añade tus dispositivos de captura de vídeo o capturas de pantalla **debajo de la fuente del overlay**:
- **Orden de capas**:
  1. `Overlay` *(siempre arriba para que los marcos dibujen sobre el vídeo)*.
  2. `Cámaras secundarias` *(rostro, auxiliar)*.
  3. `Cámara o captura principal` *(mesa, monitor, juego)*.

Para alinear tus cámaras exactamente con los marcos, consulta las medidas de [docs/OBS_SETUP.md](docs/OBS_SETUP.md).

---

## 4. Servidor Local de Alertas y Triggers

El proyecto incluye un servidor backend local en Python (`server.py`) que conecta directamente con la API oficial de **Twitch EventSub WebSocket**, eliminando herramientas de terceros:

### Cómo Iniciar el Sistema:
```bash
./iniciar_alertas.sh
```
O manualmente:
```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python3 server.py
```

### URLs del Sistema en Vivo:
- **🎛️ Panel de Control del Streamer**: [http://localhost:8080/alerts/panel.html](http://localhost:8080/alerts/panel.html)
- **🚨 Fuente de Alertas y Memes para OBS**: [http://localhost:8080/alerts/index.html](http://localhost:8080/alerts/index.html) *(1920×1080)*
- **📰 Visualizador de Catálogo**: [http://localhost:8080/index.html](http://localhost:8080/index.html)

---

## 5. Widgets Modulares para OBS

Puedes añadir estos widgets independientes como fuentes de Navegador en cualquier escena:

| Widget | URL Local | Tamaño Recomendado | Descripción |
| :--- | :--- | :--- | :--- |
| **🚨 Alertas & Triggers** | `http://localhost:8080/alerts/index.html` | `1920 × 1080` | Alertas animadas + Memes/vídeos en pantalla. |
| **💬 Chat & Partículas** | `http://localhost:8080/widgets/chat/index.html` | `440 × 850` | Conexión directa a Twitch IRC + física de emotes. |
| **⏱️ Temporizador Taller** | `http://localhost:8080/widgets/timer/index.html` | `400 × 140` | Cronómetro controlado desde el panel (curado, pomodoro). |
| **📢 Shoutout Streamer** | `http://localhost:8080/widgets/shoutout/index.html` | `600 × 200` | Tarjeta holográfica con avatar y juego del streamer. |
| **🎯 Barra de Objetivo** | `http://localhost:8080/widgets/goal/index.html` | `460 × 120` | Progreso de seguidores o suscripciones. |
| **📰 Ticker de Eventos** | `http://localhost:8080/widgets/ticker/index.html` | `800 × 60` | Cinta minimalista de último follow, sub y top bits. |

---

## 6. Documentación Adicional y Tests

- **Arquitectura y Convenciones**: [CONVENTIONS.md](CONVENTIONS.md)
- **Guía Técnica de Desarrollo y Temas**: [docs/GUIA_DESARROLLO_Y_TEMAS.md](docs/GUIA_DESARROLLO_Y_TEMAS.md)
- **Medidas de Escenas para OBS**: [docs/OBS_SETUP.md](docs/OBS_SETUP.md)
- **Ejecutar Smoke Tests**:
  ```bash
  ./venv/bin/python3 -m unittest -v tests/test_smoke.py
  ```

¡A disfrutar trasteando, creando y emitiendo en directo! 🛠️🚀
