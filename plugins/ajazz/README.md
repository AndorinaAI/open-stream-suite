# ⌨️ TECLADOS Y DIALES AJAZZ AKP — PERFIL COMPLETO Y OPENDECK
### Soporte Nativo para: Ajazz AKP05 / AKP05E (10 Teclas + Pantalla Táctil + 4 Knobs) y AKP153 (15 Teclas)

<p align="center">
  <b>Español</b> | <a href="README.en.md">English</a>
</p>

Esta carpeta contiene la configuración integral y los perfiles oficiales para usar tu controladora de macros Ajazz con **Open Stream Suite** tanto en **Linux (OpenDeck)** como en Windows/macOS (AKP Studio).

---

## 🎮 Tu Hardware: Ajazz AKP05 (10 Teclas + Tira Táctil + 4 Diales)

El modelo **AKP05 / AKP05E** es la controladora más completa del mercado maker, con tres niveles de control físico:

```text
┌─────────────────────────────────────────────────────────────┐
│ [ 01 GAME ] [ 02 MESA ] [ 03 PC ] [ 04 CHAT ] [ 05 PAUSA ] │ ➔ 10 Teclas Cuadradas LCD
│ [ 06 MAKER] [ 07 CYBER] [ 08 SUSTO] [ 09 CONF] [ 10 PROMO ] │   (Escenas OBS, Temas, Memes)
├─────────────────────────────────────────────────────────────┤
│  [ T1: TIMER ]   [ T2: TEMA ]   [ T3: META ]   [ T4: FX ]   │ ➔ Pantalla Táctil Alargada
├─────────────────────────────────────────────────────────────┤
│     ( 🎛️ 1 )        ( 🎛️ 2 )       ( 🎛️ 3 )       ( 🎛️ 4 )    │ ➔ 4 Knobs Giratorios + Click
│   Cronómetro      Temas Neón     Metas Stream   Efectos & Chime
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 1. Mapeo de las 10 Teclas Cuadradas LCD

| Tecla | Etiqueta | Tipo de Acción | Qué hace |
| :---: | :--- | :--- | :--- |
| **01** | `GAMEPLAY` | OBS Studio | Conmuta a la escena de juego. |
| **02** | `MAKER MESA` | OBS Studio | Conmuta a cámara cenital de electrónica / banco. |
| **03** | `MAKER PC` | OBS Studio | Conmuta a monitor de programación y terminal. |
| **04** | `CHARLA CHILL`| OBS Studio | Conmuta a Just Chatting con marco de chat. |
| **05** | `PAUSA BRB` | OBS Studio | Conmuta a pantalla de pausa animada. |
| **06** | `TEMA MAKER` | HTTP GET | Viste los overlays de Turquesa Neón (`/api/deck/theme?id=maker`). |
| **07** | `TEMA CYBER` | HTTP GET | Viste los overlays de Cyberpunk Neón (`/api/deck/theme?id=cyberpunk`). |
| **08** | `MEME SUSTO` | HTTP GET | Dispara el vídeo/meme de susto en OBS (`/api/deck/trigger?id=susto`). |
| **09** | `CONFETI FX` | HTTP GET | Lluvia de confeti de celebración (`/api/deck/explode?emoji=🎉&count=40`). |
| **10** | `SHOUTOUT` | HTTP GET | Lanza tarjeta de recomendación de streamer (`/api/deck/widget?widget=promo&action=trigger`). |

---

## 📱 2. Mapeo de la Pantalla Táctil Panorámica (4 Zonas)

| Zona Táctil | Ubicación | Al pulsar la pantalla táctil | Feedback en Vivo (WebSocket) |
| :---: | :--- | :--- | :--- |
| **T1** | Encima de Knob 1 | Inicia cuenta atrás de 5 minutos en el overlay | Muestra los minutos y segundos restantes `mm:ss` |
| **T2** | Encima de Knob 2 | Vuelve al tema predeterminado (Maker Turquesa) | Muestra el nombre del tema activo |
| **T3** | Encima de Knob 3 | Dispara animación de meta alcanzada | Muestra el progreso numérico de la meta activa |
| **T4** | Encima de Knob 4 | Hace sonar el timbre (*chime ding*) en directo | Muestra icono de efectos |

---

## 🎛️ 3. Mapeo de los 4 Knobs Rotatorios (Diales Físicos)

Cada dial permite giro bidireccional continuo y pulsación hacia dentro:

### Knob 1 — Cronómetro / Temporizador
* ↺ **Giro Izquierda:** Resta 1 minuto al cronómetro (`/api/deck/knob?knob=timer&ticks=-1`).
* ↻ **Giro Derecha:** Suma 1 minuto al cronómetro (`/api/deck/knob?knob=timer&ticks=1`).
* 🔘 **Pulsación (Click):** Pausa o reanuda la cuenta atrás (`/api/deck/knob?knob=timer&action=press`).

### Knob 2 — Selector de Temas Neón
* ↺ **Giro Izquierda:** Aplica el tema visual anterior en vivo (`/api/deck/knob?knob=theme&action=prev`).
* ↻ **Giro Derecha:** Aplica el siguiente tema neón en vivo (`/api/deck/knob?knob=theme&action=next`).
* 🔘 **Pulsación (Click):** Vuelve al tema predeterminado de tu stream (`/api/deck/theme?id=maker`).

### Knob 3 — Contador de Metas (Goals)
* ↺ **Giro Izquierda:** Resta 1 unidad a la meta activa (`/api/deck/knob?knob=goal&ticks=-1`).
* ↻ **Giro Derecha:** Suma 1 unidad a la meta activa (`/api/deck/knob?knob=goal&ticks=1`).
* 🔘 **Pulsación (Click):** Lanza lluvia de confeti de celebración (`/api/deck/knob?knob=goal&action=press`).

### Knob 4 — Efectos Audiovisuales & FX
* ↺ **Giro Izquierda:** Lanza lluvia de corazones ❤️ (`/api/deck/knob?knob=fx&ticks=-1`).
* ↻ **Giro Derecha:** Lanza lluvia de confeti 🎉 (`/api/deck/knob?knob=fx&ticks=1`).
* 🔘 **Pulsación (Click):** Reproduce sonido de aviso chime / ding (`/api/deck/knob?knob=fx&action=press`).

---

## 🐧 Cómo Conectar tu Ajazz en Linux con OpenDeck

En Linux (ZorinOS / Ubuntu / Arch), el estándar recomendado es **OpenDeck**:

1. **Abre OpenDeck** en tu sistema.
2. Comprueba que detecta tu dispositivo **Ajazz AKP05** (vía driver `opendeck-akp05` o sidecar USB).
3. **Importa el perfil:**
   - Ve a Ajustes / Perfiles de OpenDeck.
   - Selecciona el archivo: [`opendeck_akp05_config.json`](./opendeck_akp05_config.json) (o copia las llamadas web de [`akp05_profile_10keys_touch_4knobs.json`](./akp05_profile_10keys_touch_4knobs.json)).
4. **Instalar el plugin nativo OpenAction (Opcional):**
   - También puedes copiar [`../stream_deck/com.openstreamsuite.deck.sdPlugin`](../stream_deck/com.openstreamsuite.deck.sdPlugin) en la carpeta de plugins de OpenDeck (`~/.local/share/opendeck/plugins/`).
   - Tendrás widgets nativos con cuenta atrás en pantalla y diales ya cableados.

---

## 🛠️ Script de Prueba: `ajazz_live_bridge.py`

Puedes probar y simular cualquiera de tus teclas, zonas táctiles o knobs desde la terminal:

```bash
# Ver mapa completo del dispositivo
python3 ajazz_live_bridge.py list

# Probar tecla 1 (Gameplay) o tecla 8 (Susto)
python3 ajazz_live_bridge.py key 1
python3 ajazz_live_bridge.py key 8

# Probar zona táctil 1 (Timer OSD)
python3 ajazz_live_bridge.py touch 1

# Probar Knobs:
python3 ajazz_live_bridge.py knob 1 right   # Knob 1 ↻: +1 min al cronómetro
python3 ajazz_live_bridge.py knob 1 press   # Knob 1 🔘: Pausar/Reanudar cronómetro
python3 ajazz_live_bridge.py knob 2 right   # Knob 2 ↻: Siguiente tema de color en OBS
python3 ajazz_live_bridge.py knob 3 right   # Knob 3 ↻: +1 a la meta de seguidores
python3 ajazz_live_bridge.py knob 4 press   # Knob 4 🔘: Chime ding en directo
```
