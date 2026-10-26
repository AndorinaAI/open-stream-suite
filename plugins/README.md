# 🎮 OPEN STREAM SUITE — PLUGINS Y PERFILES PARA STREAM DECKS
### Control físico para Ajazz AKP, Elgato Stream Deck y OpenDeck / Bitfocus Companion

<p align="center">
  <b>Español</b> | <a href="README.en.md">English</a>
</p>

Esta carpeta contiene los plugins y perfiles preconfigurados para controlar **Open Stream Suite** desde una consola de macros o un teclado LCD. Está **fuera de la carpeta `app/`** a propósito, para que sea fácil de encontrar.

---

## ✅ Antes de instalar nada

1. Arranca Open Stream Suite (el servidor debe estar activo en `http://localhost:8080`).
2. Comprueba que responde abriendo en el navegador: <http://localhost:8080/api/deck/status>. Debe devolver `"status": "ok"`.
3. Ese mismo servidor es el que reciben todos los plugins. **Todos funcionan en local, sin cuentas ni nube.**

> [!NOTE]
> Por seguridad el servidor escucha **solo en tu propio equipo** (`127.0.0.1`). Si tu deck está en el mismo PC, no hace falta tocar nada. Si necesitas controlarlo desde otro equipo de tu red, mira la sección [Usar el deck desde otro equipo](#-usar-el-deck-desde-otro-equipo).

---

## 📁 Qué plugin necesito

| Tengo… | Carpeta | Qué instalar |
| :--- | :--- | :--- |
| **Ajazz AKP05 / AKP05E** (10 teclas LCD + pantalla táctil + 4 diales) con **OpenDeck** | [`ajazz/`](./ajazz/) | Importar `opendeck_akp05_config.json` y `akp05_profile_10keys_touch_4knobs.json`. |
| **Ajazz AKP153 / AKP03 / AKP846** | [`ajazz/`](./ajazz/) | Perfil `akp_profile_15keys.json` + script puente `ajazz_live_bridge.py`. |
| **Elgato Stream Deck** (Mini, Standard, XL, +) | [`stream_deck/`](./stream_deck/) | Copiar la carpeta `com.openstreamsuite.deck.sdPlugin` a la carpeta de plugins de Elgato. |
| **Bitfocus Companion u OpenDeck** (cualquier consola) | [`opendeck_companion/`](./opendeck_companion/) | Importar `open_stream_suite_companion_page.json`. |
| Iconos para las teclas | [`assets/`](./assets/) | SVG listos para LCD de 144×144 px. |

Cada carpeta tiene su propio `README.md` con los pasos detallados.

---

## 🚀 Instalación rápida

### Ajazz AKP05 con OpenDeck
1. Instala **OpenDeck** (Linux, Windows o macOS) y conecta tu AKP05.
2. Importa [`ajazz/opendeck_akp05_config.json`](./ajazz/opendeck_akp05_config.json).
3. Pulsa una tecla para probarla: debe reaccionar el overlay en OBS.
4. Detalles de teclas, pantalla táctil y diales: [`ajazz/README.md`](./ajazz/README.md) ([English](./ajazz/README.en.md)).

### Elgato Stream Deck (Windows y macOS)
1. Cierra la aplicación **Stream Deck**.
2. Copia `stream_deck/com.openstreamsuite.deck.sdPlugin` en:
   - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
3. Abre de nuevo la aplicación; verás la categoría **Open Stream Suite**.
4. En **Linux** no existe la aplicación oficial de Elgato: usa **OpenDeck** con el perfil de [`opendeck_companion/`](./opendeck_companion/).

### Bitfocus Companion / OpenDeck
1. Importa [`opendeck_companion/open_stream_suite_companion_page.json`](./opendeck_companion/open_stream_suite_companion_page.json).
2. Asegúrate de que la conexión HTTP apunta a `http://localhost:8080`.

### ¿Y si mi deck no está en la lista?
Cualquier botón puede lanzar una **petición HTTP** a la API. Puedes ver todas las acciones listas para copiar en <http://localhost:8080/api/deck/actions>. Por ejemplo:

```text
http://localhost:8080/api/deck/trigger?id=susto
http://localhost:8080/api/deck/timer?action=start&seconds=300
http://localhost:8080/api/deck/knob?knob=theme&action=next
```

---

## 🌐 Usar el deck desde otro equipo

Solo si tu deck está conectado a **otro ordenador** de la misma red:

1. En `app/.env` añade:
   ```ini
   SERVER_HOST=0.0.0.0
   DECK_TOKEN=pon_aqui_una_clave_larga_y_aleatoria
   ```
2. Reinicia el servidor.
3. En el deck, envía la clave con cada petición: cabecera `X-Deck-Token: <tu clave>` o parámetro `?deck_token=<tu clave>`.
4. Sustituye `localhost` por la IP de tu PC (por ejemplo `http://192.168.1.20:8080`).

> [!WARNING]
> No expongas el servidor a internet sin una clave. `DECK_TOKEN` protege los endpoints de `/api/deck/`. Las acciones del panel de control siguen exigiendo un token que solo se entrega al propio equipo, pero otros equipos de tu red podrán ver las páginas. Úsalo solo en una red de confianza.

---

## 🌟 Qué marca la diferencia

1. **Feedback bidireccional en tiempo real.** Los botones leen el WebSocket local (`ws://localhost:8080/ws`): el temporizador muestra el tiempo restante y el botón de tema se ilumina con el color activo.
2. **Doble capa: OBS Studio + overlays.** Separa los mandos de cambio de escena de los de efectos visuales (memes, temas, widgets).
3. **Todo en local.** Respuesta inmediata y sin suscripciones.

---

## 📚 Más documentación
- Guía completa de integración de decks: [`app/docs/GUIA_INTEGRACION_DECKS.md`](../app/docs/GUIA_INTEGRACION_DECKS.md) ([English](../app/docs/GUIA_INTEGRACION_DECKS.en.md))
- Guía para desarrolladores y temas: [`app/docs/GUIA_DESARROLLO_Y_TEMAS.md`](../app/docs/GUIA_DESARROLLO_Y_TEMAS.md) ([English](../app/docs/GUIA_DESARROLLO_Y_TEMAS.en.md))
