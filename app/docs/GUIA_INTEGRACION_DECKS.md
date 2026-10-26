# 🎮 GUÍA DE INTEGRACIÓN: ELGATO STREAM DECK, AJAZZ AKP Y OPENDECK (COMPANION)
### Open Stream Suite — Control Físico de Escenas, Memes, Temas, Widgets y Temporizadores

<p align="center">
  <b>Español</b> | <a href="GUIA_INTEGRACION_DECKS.en.md">English</a>
</p>

Esta guía te explica de forma clara y directa **cómo conectar tu dispositivo físico (Elgato Stream Deck, teclados Ajazz AKP, OpenDeck o Bitfocus Companion)** con tu directo de streaming y con la suite de Open Stream Suite.

---

## 📑 ÍNDICE
1. [¿Cómo funciona la conexión?](#1-cómo-funciona-la-conexión)
2. [El Cambio de Escenas en OBS (Integración Nativa)](#2-el-cambio-de-escenas-en-obs-integración-nativa)
3. [Control de Memes, Triggers, Temas y Temporizadores (API REST y WebSocket)](#3-control-de-memes-triggers-temas-y-temporizadores)
4. [Cómo Configurar tu Ajazz (AKP Studio / AKP153, AKP03, AKP846)](#4-cómo-configurar-tu-ajazz-akp-studio)
5. [Cómo Configurar Elgato Stream Deck](#5-cómo-configurar-elgato-stream-deck)
6. [Cómo Configurar OpenDeck y Bitfocus Companion](#6-cómo-configurar-opendeck-y-bitfocus-companion)
7. [Control Universal de Widgets (Promo, Goal, Ticker, Chat)](#7-control-universal-de-widgets)
8. [Tabla Rápida de Acciones y URLs de 1-Clic](#8-tabla-rápida-de-acciones-y-urls-de-1-clic)

---

## 1. ¿Cómo funciona la conexión?

> [!TIP]
> **Respuesta rápida: NO tienes que programar nada complejo.**
> Todos los botones se controlan mediante dos vías estándar ya preparadas:

1. **Para cambiar de escena en OBS (Game, Maker, Charla, Pausa):**
   * Se hace a través del **OBS WebSocket oficial** que viene integrado dentro de OBS Studio. Todos los softwares de Decks (Elgato, Ajazz, Companion) disponen de acción nativa para conmutar escenas.
2. **Para disparar memes, cambiar temas de color del overlay, controlar widgets o el cronómetro:**
   * La suite expone una **API HTTP de 1-Clic (`/api/deck/...`)**: en tu teclado o macro pad solo tienes que pegar una URL (GET o POST) y se ejecuta al instante con respuesta inmediata en red local.
   * Además, el WebSocket local (`ws://localhost:8080/ws`) está siempre activo para feedback bidireccional en las pantallas LCD.

> [!IMPORTANT]
> **Seguridad de red.** Por defecto el servidor escucha **solo en tu propio equipo** (`127.0.0.1`), así que un deck conectado al mismo PC funciona sin configurar nada. Si tu deck está en **otro equipo** de la red, añade en `app/.env`:
> ```ini
> SERVER_HOST=0.0.0.0
> DECK_TOKEN=una_clave_larga_y_aleatoria
> ```
> y envía esa clave en cada petición, con la cabecera `X-Deck-Token` o con `?deck_token=...`. Si `DECK_TOKEN` está vacío y el servidor escucha en `0.0.0.0` o llega por túnel/proxy, `/api/deck/*` se rechaza: no hay modo deck sin token fuera de loopback. Las peticiones que llegan desde una página web externa (otros orígenes del navegador) se rechazan siempre. Guía de instalación de los plugins: [`plugins/README.md`](../../plugins/README.md) ([English](../../plugins/README.en.md)).

---

## 2. El Cambio de Escenas en OBS (Integración Nativa)

Para conmutar las pantallas de tu directo, la conexión se realiza directamente entre tu Deck y OBS Studio.

### Activar OBS WebSocket en OBS Studio
1. En OBS Studio, ve al menú superior: **Herramientas → Ajustes del servidor WebSocket**.
2. Marca la casilla **✅ Habilitar el servidor WebSocket**.
3. Puerto predeterminado: **`4455`**.
4. Puedes desmarcar la contraseña para red local o anotar la clave generada.

### Configurar el botón en tu Deck
En el software de tu Deck (Stream Deck, AKP Studio o Companion):
* Añade la acción nativa: **OBS Studio ➔ Cambiar Escena** (*Switch Scene*).
* Selecciona la escena deseada: `Gameplay`, `Maker Mesa`, `Maker PC`, `Charla` o `Be Right Back`.
* Al pulsar la tecla física, OBS cambiará de escena al instante.

---

## 3. Control de Memes, Triggers, Temas y Temporizadores

Nuestra suite local (`http://localhost:8080`) expone rutas diseñadas para activarse con una simple llamada web sin dependencias externas:

* **Método 1 (HTTP GET de 1-Clic - El más fácil):** Cualquier dispositivo que pueda hacer una petición web o abrir una URL en segundo plano.
* **Método 2 (WebSocket JSON):** Para OpenDeck, Bitfocus Companion o scripts que mantengan conexión en `ws://localhost:8080/ws`.

---

## 4. Cómo Configurar tu Ajazz (AKP05 con 10 Teclas, Pantalla Táctil y 4 Knobs / OpenDeck en Linux)

Si tienes el modelo **Ajazz AKP05 / AKP05E** (10 teclas cuadradas LCD, pantalla táctil panorámica alargada y 4 diales/knobs giratorios inferiores), dispones de un perfil completo diseñado a medida en [`plugins/ajazz/`](../../plugins/ajazz/):

### Mapeo de la Controladora:
1. **10 Teclas Cuadradas LCD (2 filas de 5):**
   * Fila 1 (Teclas 1-5): Escenas nativas de OBS Studio (`Gameplay`, `Maker Mesa`, `Maker PC`, `Charla`, `Be Right Back`).
   * Fila 2 (Teclas 6-10): Temas Neón (Maker y Cyberpunk), Meme Susto (`/api/deck/trigger?id=susto`), Lluvia de Confeti (`🎉`) y Shoutout Streamer.
2. **Pantalla Táctil Alargada (4 ranuras alineadas sobre cada knob):**
   * **T1 (Timer):** Toca para iniciar 5 min (muestra tiempo restante `mm:ss` por WebSocket).
   * **T2 (Tema):** Toca para volver al tema predeterminado (muestra nombre de paleta activa).
   * **T3 (Meta):** Toca para celebrar meta alcanzada (muestra progreso actual vs objetivo).
   * **T4 (FX):** Toca para hacer sonar el timbre chime en directo.
3. **4 Knobs Giratorios con Pulsación:**
   * **Knob 1 (Cronómetro):** Gira a la derecha para +1 min, a la izquierda para -1 min, pulsa para pausar/reanudar.
   * **Knob 2 (Selector de Temas Neón):** Gira a la derecha/izquierda para navegar entre los 21 temas de color en vivo (todos los packs), pulsa para tema base.
   * **Knob 3 (Metas de Twitch):** Gira para sumar (+1) o restar (-1) unidades a la meta del stream, pulsa para confeti.
   * **Knob 4 (Efectos FX):** Gira a la derecha para confeti 🎉, a la izquierda para corazones ❤️, pulsa para ding chime 🔊.

### Cómo Usarlo en Linux con OpenDeck:
1. Abre **OpenDeck** (el software libre para Linux que gestiona hardware de streaming).
2. Asegúrate de que OpenDeck detecta tu **Ajazz AKP05**.
3. Importa el archivo de perfil preconfigurado:
   [`plugins/ajazz/opendeck_akp05_config.json`](../../plugins/ajazz/opendeck_akp05_config.json).
4. También puedes copiar el plugin [`plugins/stream_deck/com.openstreamsuite.deck.sdPlugin`](../../plugins/stream_deck/com.openstreamsuite.deck.sdPlugin) en `~/.local/share/opendeck/plugins/` para disponer de acciones nativas de Encoders/Diales.

### Prueba en Vivo desde la Terminal (`ajazz_live_bridge.py`):
Ejecuta estos comandos desde la carpeta raíz del proyecto (la que contiene `app/` y `plugins/`), con el servidor en marcha:
```bash
python3 plugins/ajazz/ajazz_live_bridge.py list                      # Ver mapa completo
python3 plugins/ajazz/ajazz_live_bridge.py key 1                    # Conmutar escena Gameplay
python3 plugins/ajazz/ajazz_live_bridge.py touch 1                  # Iniciar temporizador 5m
python3 plugins/ajazz/ajazz_live_bridge.py knob 1 right             # Añadir +1 min con Knob 1
python3 plugins/ajazz/ajazz_live_bridge.py knob 2 right             # Pasar al siguiente tema neón
python3 plugins/ajazz/ajazz_live_bridge.py knob 3 right             # Sumar +1 a la meta de followers
python3 plugins/ajazz/ajazz_live_bridge.py knob 4 press             # Tocar chime ding con Knob 4
```

---

## 5. Cómo Configurar Elgato Stream Deck

### Opción A: Usar el Plugin Nativo Oficial
1. En la carpeta [`plugins/stream_deck/`](../../plugins/stream_deck/), copia el directorio `com.openstreamsuite.deck.sdPlugin` en la carpeta de plugins de Elgato Stream Deck:
   * **Linux / Wine:** `~/.local/share/Elgato/StreamDeck/Plugins/`
   * **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   * **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
2. Reinicia la aplicación Stream Deck.
3. Aparecerá la categoría **Open Stream Suite** con acciones dedicadas:
   * *Disparar Meme / Trigger*
   * *Aplicar Paleta de Tema*
   * *Temporizador con Cuenta Atrás visible en el LCD*
   * *Lluvia de Emotes / Confeti*

### Opción B: Botón Estándar de Stream Deck (Sin Instalar Plugins)
Si no quieres instalar plugins adicionales, puedes usar las funciones nativas de Elgato:
1. En la lista de acciones derecha de Stream Deck, arrastra **System ➔ Website** (o **API Request**).
2. Pega la URL directa de 1-Clic (por ejemplo, `http://localhost:8080/api/deck/timer?action=start&seconds=300`).
3. Marca la casilla **GET request in background** (o abrir en segundo plano).

---

## 6. Cómo Configurar OpenDeck y Bitfocus Companion

**Bitfocus Companion** y el hardware **OpenDeck** son la solución estándar para broadcast profesional y control multicámara.

### Importar la Página Preconfigurada en Companion
1. Abre tu interfaz de Companion en el navegador (`http://localhost:8888`).
2. Ve a la pestaña **Import / Export**.
3. En la sección **Import Page**, selecciona el archivo:  
   [`open_stream_suite_companion_page.json`](../../plugins/opendeck_companion/open_stream_suite_companion_page.json).
4. Elige el número de página de tu consola (por ejemplo, Página 1) y pulsa **Import**.
5. Los 32 bancos quedarán mapeados con colores de contraste y llamadas a `http://localhost:8080/api/deck/...`.

### Conexión WebSocket Directa (Para Scripts y Hardware OpenDeck)
Puedes conectar cualquier microcontrolador, Arduino o script OpenDeck al WebSocket `ws://localhost:8080/ws` y enviar mensajes JSON simples:

```json
{
  "action": "trigger",
  "id": "susto"
}
```
O para aplicar temas:
```json
{
  "action": "theme",
  "id": "maker"
}
```

---

## 7. Control Universal de Widgets

Todos los widgets de la suite pueden controlarse desde cualquier Deck usando `/api/deck/widget`:

| Widget | Acción | URL de 1-Clic |
| :--- | :--- | :--- |
| **Promo / Shoutout** | Destacar Streamer amigo | `http://localhost:8080/api/deck/widget?widget=promo&streamer=NOMBRE_CANAL` |
| **Metas (Goal)** | Añadir +1 o +5 a la meta | `http://localhost:8080/api/deck/widget?widget=goal&action=add&amount=1` |
| **Marquesina (Ticker)** | Enviar aviso en directo | `http://localhost:8080/api/deck/widget?widget=ticker&action=message&text=HOLA+STREAM` |
| **Chat Overlay** | Limpiar mensajes de pantalla | `http://localhost:8080/api/deck/widget?widget=chat&action=clear` |

---

## 8. Tabla Rápida de Acciones y URLs de 1-Clic

| Acción Deseada | URL Local (GET / POST) | Parámetros Opcionales |
| :--- | :--- | :--- |
| **Estado del Sistema** | `http://localhost:8080/api/deck/status` | *(Devuelve JSON de salud y estado)* |
| **Disparar Meme / Trigger** | `http://localhost:8080/api/deck/trigger?id=ID_TRIGGER` | `&user=Nombre` |
| **Aplicar Tema Visual a OBS** | `http://localhost:8080/api/deck/theme?id=ID_TEMA` | `&pack=pack_id` |
| **Iniciar Temporizador** | `http://localhost:8080/api/deck/timer?action=start&seconds=300` | `&title=DESCANSO` |
| **Pausar Temporizador** | `http://localhost:8080/api/deck/timer?action=pause` | — |
| **Resetear Temporizador** | `http://localhost:8080/api/deck/timer?action=reset` | — |
| **Lluvia de Confeti** | `http://localhost:8080/api/deck/explode?emoji=🎉&count=40` | `&emoji=❤️` |
| **Alerta Simulada (Follow)** | `http://localhost:8080/api/deck/alert?type=follow` | `&user=Nombre` |
| **Alerta Simulada (Sub)** | `http://localhost:8080/api/deck/alert?type=sub` | `&user=Nombre` |
| **Mandos Giratorios / Knobs** | `http://localhost:8080/api/deck/knob?knob=timer&action=rotate&ticks=1` | `&knob=theme\|goal\|fx`, `&delta=...` |
| **Control de Widget** | `http://localhost:8080/api/deck/widget?widget=WIDGET&action=ACCION` | `&params...` |
| **Catálogo Dinámico de URLs** | `http://localhost:8080/api/deck/actions` | *(Devuelve JSON con todos tus triggers listos)* |

> [!NOTE]
> Puedes abrir `http://localhost:8080/api/deck/actions` en cualquier momento en tu navegador para ver la lista completa actualizada de todos los triggers y botones que tienes creados en tu suite con sus enlaces directos para copiar y pegar en tu software de macros.
