# GUÍA DE CONFIGURACIÓN PASO A PASO EN OBS STUDIO

<p align="center">
  <b>Español</b> | <a href="OBS_SETUP.en.md">English</a>
</p>

Esta guía detalla el método de integración correcto, las URLs locales del servidor, las coordenadas, los tamaños de las ventanas de cámara y el orden de capas exacto para configurar todas las escenas de **Open Stream Suite** en **OBS Studio**.

---

## 1. Conceptos Fundamentales de Integración en OBS

### A. Método de Carga: Fuente de Navegador (Browser Source) por URL
> [!IMPORTANT]
> **NO utilices «Archivo local» (*Local file*)**. 
> Todas las escenas de Open Stream Suite son aplicaciones web interactivas conectadas en tiempo real mediante WebSockets al motor local en Python (`http://127.0.0.1:8080`). Cargar los archivos con `file:///` bloquea la sincronización en vivo de temas, los sonidos sintetizados, la edición de textos en caliente y las alertas.

1. Abre **OBS Studio**.
2. Comprueba la resolución del lienzo en **Ajustes** → **Vídeo**:
   - **Resolución de la base (lienzo)**: `1920x1080`
   - **Resolución de salida (escalada)**: `1920x1080`
   - **Valores comunes de FPS**: `60`
3. En la lista de **Fuentes** de tu escena, pulsa **`+`** → **Navegador** (*Browser*).
4. **Desmarca** la casilla «Archivo local» si estuviese activa.
5. Pega la **URL** correspondiente de la escena (ejemplo: `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/maker_desk/index.html`).
   > [!TIP]
   > Desde el panel de control (`http://127.0.0.1:8080`), cada tarjeta de escena dispone del botón **«📋 Copiar URL OBS»**, que genera automáticamente la URL con el tema asignado y los parámetros de bloqueo necesarios (`?theme=...&lock=1`).
6. Configura las propiedades de la fuente Navegador:
   - **Ancho**: `1920`
   - **Alto**: `1080`
   - **FPS**: `60`
   - **Controlar audio vía OBS**: *Desmarcado* (salvo que quieras capturar el sonido del overlay en un canal de audio separado).
   - **Apagar la fuente cuando no sea visible**: *Recomendado* para ahorrar RAM cuando cambies de escena.
   - **Actualizar el navegador cuando la escena se active**: *Marcado*.

### B. Jerarquía de Capas (Orden Z en OBS)
1. **La fuente de Overlay siempre debe colocarse en la PARTE SUPERIOR de la lista de fuentes**, por encima de cámaras, capturas de pantalla y juegos.
2. Los marcos técnicos, barras de estado y decoraciones del overlay poseen recortes transparentes exactos (*SVG aperture masks*) para que el vídeo de tus fuentes se vea a través de ellos sin perder bordes ni esquinas anguladas.
3. Las cámaras y capturas de ventana se sitúan **debajo** del overlay.

---

## 2. Catálogo de Escenas y Coordenadas por Pack (27 Escenas)

### Pack 1: Maker Theme Pack (Taller, CAD & Electrónica)

| Escena | URL en OBS | Coordenadas y Tamaño de Cámara / Captura |
| :--- | :--- | :--- |
| **1. Game** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/game/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Facecam**: 360×203 (x: 48, y: 767)<br>• **Juego**: 1920×1080 (x:0, y:0) |
| **2. Maker Desk** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/maker_desk/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Rostro**: 456×257 (x: 1432, y: 112)<br>• **Captura Aux**: 456×257 (x: 1432, y: 389)<br>• **Cámara Mesa**: 1376×774 (x: 32, y: 112) |
| **3. Maker PC** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/maker_pc/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Rostro**: 456×257 (x: 1432, y: 112)<br>• **Cámara Aux**: 456×257 (x: 1432, y: 389)<br>• **Captura Pantalla**: 1376×774 (x: 32, y: 112) |
| **4. Print Machine** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/print_machine/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Rostro**: 456×257 (x: 1432, y: 112)<br>• **Cámara Detalle**: 456×257 (x: 1432, y: 389)<br>• **Cámara Máquina**: 1376×774 (x: 32, y: 112) |
| **5. Print Design** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/print_design/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Rostro**: 456×257 (x: 1432, y: 112)<br>• **Cámara Proceso**: 456×257 (x: 1432, y: 389)<br>• **Captura App CAD**: 1376×774 (x: 32, y: 112) |
| **6. Chill** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/chill/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Principal**: 1280×720 (x: 32, y: 112)<br>• **Chat Box**: 544×800 (x: 1344, y: 154) |
| **7. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/screens/starting-soon/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **8. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/screens/coffee-break/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **9. Ending** | `http://127.0.0.1:8080/streamthemes/Maker_Theme_Pack/overlays/screens/ending/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |

---

### Pack 2: Open Stream Pack (Broadcast Estudio Neo-Glass)

| Escena | URL en OBS | Coordenadas y Distribución |
| :--- | :--- | :--- |
| **1. Just Chatting** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/just_chatting/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Gran Angular**: 1280×720 (x: 48, y: 140)<br>• **Columna Lateral Chat**: 512×860 (x: 1360, y: 140) |
| **2. Desktop Share** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/desktop_share/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Captura Pantalla**: 1380×776 (x: 48, y: 140)<br>• **PiP Facecam**: 440×248 (x: 1432, y: 140) |
| **3. Podcast Talk** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/podcast_talk/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Presentador (Host)**: 880×495 (x: 54, y: 220)<br>• **Cámara Invitado (Guest)**: 880×495 (x: 986, y: 220) |
| **4. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **5. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/screens/coffee-break/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **6. Ending** | `http://127.0.0.1:8080/streamthemes/Open_stream_Pack/overlays/screens/ending/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |

---

### Pack 3: Gamer Pro Pack (Tournament Esports & Speedrun)

| Escena | URL en OBS | Coordenadas y Distribución |
| :--- | :--- | :--- |
| **1. Gameplay HUD** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Facecam Hex/Chamfer**: 380×214 (x: 48, y: 770)<br>• **Captura Juego Completo**: 1920×1080 (x:0, y:0) |
| **2. Speedrun Split** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/speedrun_split/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Captura Juego Speedrun**: 1360×765 (x: 48, y: 157)<br>• **Columna Splits & Deltas**: 440×820 (x: 1432, y: 130) |
| **3. Victory Clutch** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/victory_clutch/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Victoria Showcase**: 1280×720 (x: 320, y: 180) |
| **4. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/starting-soon/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **5. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/coffee-break/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **6. Ending** | `http://127.0.0.1:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/ending/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |

---

### Pack 4: Cozy Lo-Fi Pack (Chill, Estudio & Arte)

| Escena | URL en OBS | Coordenadas y Distribución |
| :--- | :--- | :--- |
| **1. Study Pomodoro** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/study_pomodoro/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Estudio (Squircle)**: 1240×698 (x: 48, y: 150)<br>• **Panel Pomodoro & Música**: 540×800 (x: 1332, y: 140) |
| **2. Art Dual Cam** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/art_dual_cam/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Cenital Arte**: 1180×664 (x: 48, y: 150)<br>• **Facecam Polaroid**: 580×326 (x: 1280, y: 150) |
| **3. Cafe Chat** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html` | • **Overlay**: 1920×1080 (x:0, y:0)<br>• **Cámara Gran Angular**: 1200×675 (x: 48, y: 160)<br>• **Chat Box Papel Texturizado**: 560×780 (x: 1300, y: 150) |
| **4. Starting Soon** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/starting-soon/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **5. Coffee Break** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/coffee-break/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |
| **6. Ending** | `http://127.0.0.1:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/ending/index.html` | • **Overlay Pantalla Completa**: 1920×1080 (x:0, y:0) |

---

## 3. Ajuste Rápido y Recorte de Vídeo en OBS

Si tu cámara física o capturadora tiene una relación de aspecto distinta (por ejemplo, 4:3 en lugar de 16:9):

1. **Editar Transformación**:
   - Selecciona la fuente de la cámara en la lista de OBS.
   - Pulsa `Ctrl + E` (*Transformar → Editar transformación*).
   - En **Posición**, escribe los valores `X` e `Y` indicados en la tabla de tu escena.
   - En **Tamaño**, escribe el `Ancho` y `Alto` correspondiente.
2. **Recorte Preciso con Tecla Alt**:
   - Si la cámara desborda los límites del marco decorativo, mantén pulsada la tecla **`Alt`** en el teclado.
   - Arrastra los tiradores rojos de los bordes en el visor de OBS: el borde cambiará a color verde, recortando el vídeo sobrante sin deformarlo ni aplastarlo.
3. **Reactivar Fuentes de Audio**:
   - Las alertas y los sonidos interactivos se sintetizan en el overlay. Si deseas escuchar el retorno de audio de OBS, asegúrate de que el canal de Navegador esté configurado en *Monitorización y Salida* dentro del *Mezclador de audio avanzado* de OBS Studio.
