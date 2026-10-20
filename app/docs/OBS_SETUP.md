# GUÍA DE CONFIGURACIÓN PASO A PASO EN OBS STUDIO

Esta guía detalla las coordenadas, tamaños y el orden de capas exacto para configurar cada una de las 9 escenas en **OBS Studio**.

---

## 1. Conceptos Fundamentales de OBS

1. **Resolución de la Escena (Lienzo)**:
   - Configura el lienzo base y la salida en **1920 × 1080** a 60 fps (en *Ajustes → Vídeo*).
2. **Cómo añadir el overlay**:
   - En la lista de **Fuentes**, pulsa **`+`** → **Navegador** (*Browser Source*).
   - Marca la casilla **«Archivo local»** (*Local file*).
   - Pulsa *Examinar* y selecciona el `index.html` de la escena correspondiente.
   - Ancho: **1920**
   - Alto: **1080**
   - Asegúrate de marcar **«Apagar la fuente cuando no sea visible»** y **«Actualizar el navegador cuando la escena se active»**.
3. **Orden de las capas**:
   - La fuente de **Overlay** siempre debe colocarse en la **parte superior de la lista de fuentes**, por encima de las cámaras y capturas, para que los marcos técnicos y las etiquetas queden sobre el vídeo.
   - Si una cámara se sale del marco, puedes recortarla manteniendo pulsada la tecla **`Alt`** y arrastrando los bordes en la vista previa de OBS.

---

## 2. Coordenadas y Dimensiones por Escena

### 1. ESCENA GAME
* **Uso**: Videojuegos a pantalla completa.
* **Archivo**: `scenes/game/index.html`
* **Capas (de arriba a abajo)**:
  1. `Overlay GAME` (Navegador: 1920×1080, x:0, y:0)
  2. `Cámara Rostro` (Dispositivo de captura de vídeo: 360×203, **x: 48, y: 767**)
  3. `Captura del Juego` (Captura de juego o ventana: 1920×1080, x:0, y:0)

---

### 2. ESCENA PRINCIPAL — CÁMARA + WEBCAM
* **Uso**: Cámara principal sobre mesa, cámara frontal, cámara aérea o cualquier toma principal con ventana auxiliar.
* **Archivo**: `scenes/maker-desk/index.html`
* **Capas (de arriba a abajo)**:
  1. `Overlay MAKER MESA` (Navegador: 1920×1080, x:0, y:0)
  2. `Cámara Rostro` (Dispositivo de captura: 456×257, **x: 1432, y: 112**)
  3. `Captura PC Auxiliar` (Captura de pantalla: 456×257, **x: 1432, y: 389**)
  4. `Cámara Cenital Mesa` (Cámara de trabajo: 1376×774, **x: 32, y: 112**)

---

### 3. ESCENA PANTALLA PC — CAPTURA + WEBCAM
* **Uso**: Programación, terminal, configuración de Linux, IA.
* **Archivo**: `scenes/maker-pc/index.html`
* **Capas (de arriba a abajo)**:
  1. `Overlay MAKER PC` (Navegador: 1920×1080, x:0, y:0)
  2. `Cámara Rostro` (Dispositivo de captura: 456×257, **x: 1432, y: 112**)
  3. `Cámara Mesa Auxiliar` (Cámara auxiliar opcional: 456×257, **x: 1432, y: 389**)
  4. `Captura Principal PC` (Captura de monitor: 1376×774, **x: 32, y: 112**)

---

### 4. ESCENA CÁMARA SECUNDARIA — PROCESO/ACCIÓN
* **Uso**: Cámara directa sobre cualquier proceso, máquina o acción (soldadura, impresión, craft, cocina, etc.).
* **Archivo**: `scenes/print-machine/index.html`
* **Capas (de arriba a abajo)**:
  1. `Overlay PRINT MÁQUINAS` (Navegador: 1920×1080, x:0, y:0)
  2. `Cámara Rostro` (Dispositivo de captura: 456×257, **x: 1432, y: 112**)
  3. `Cámara Macro / Detalle` (Cámara de detalle: 456×257, **x: 1432, y: 389**)
  4. `Cámara Principal Proceso` (Cámara sobre el proceso en curso: 1376×774, **x: 32, y: 112**)

---

### 5. ESCENA PANTALLA DISEÑO — APP FULL SCREEN
* **Uso**: Cualquier app a pantalla completa: diseño vectorial, CAD, edición de vídeo, IDE, etc.
* **Archivo**: `scenes/print-design/index.html`
* **Capas (de arriba a abajo)**:
  1. `Overlay PRINT DISEÑO` (Navegador: 1920×1080, x:0, y:0)
  2. `Cámara Rostro` (Dispositivo de captura: 456×257, **x: 1432, y: 112**)
  3. `Cámara Auxiliar Proceso` (Cámara auxiliar de proceso: 456×257, **x: 1432, y: 389**)
  4. `Captura PC Inkscape` (Captura de pantalla: 1376×774, **x: 32, y: 112**)

---

### 6. ESCENA CHILL — CHARLA
* **Uso**: Just Chatting, preguntas y respuestas, comunidad.
* **Archivo**: `scenes/chill/index.html`
* **Capas (de arriba a abajo)**:
  1. `Overlay CHILL` (Navegador: 1920×1080, x:0, y:0)
  2. `Fuente de Chat de Twitch` (Navegador de StreamElements/Botrix/Twitch: 544×800, **x: 1344, y: 154**)
  3. `Cámara Rostro Principal` (Cámara gran angular: 1280×720, **x: 32, y: 112**)

---

### 7. ESCENA STARTING SOON
* **Uso**: Pantalla completa antes de iniciar emisión.
* **Archivo**: `scenes/starting-soon/index.html`
* **Capas**:
  1. `Overlay STARTING SOON` (Navegador: 1920×1080, x:0, y:0)
  2. *(Opcional)* Fuente de audio/música de fondo libre de copyright.

---

### 8. ESCENA BE RIGHT BACK
* **Uso**: Pausa técnica o descanso.
* **Archivo**: `scenes/be-right-back/index.html`
* **Capas**:
  1. `Overlay BE RIGHT BACK` (Navegador: 1920×1080, x:0, y:0)
  2. *(Opcional)* Música de fondo.

---

### 9. ESCENA ENDING
* **Uso**: Despedida y cierre del directo.
* **Archivo**: `scenes/ending/index.html`
* **Capas**:
  1. `Overlay ENDING` (Navegador: 1920×1080, x:0, y:0)
  2. *(Opcional)* Música de cierre.

---

## 3. Ajuste Rápido de Cámaras en OBS

Si tu cámara tiene una relación de aspecto o resolución distinta (por ejemplo 4:3 o 1080p sin escalar):
1. Selecciona la cámara en la vista previa de OBS.
2. Pulsa `Ctrl + E` (*Transformar → Editar transformación*).
3. Escribe directamente el valor en **Posición** (X, Y) y **Tamaño** (Ancho, Alto) según la tabla anterior.
4. Si la cámara sobresale del marco, mantén pulsada la tecla **`Alt`** y arrastra los manipuladores rojos para recortar el sobrante con precisión milimétrica.
