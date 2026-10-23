# 🎨 Guía de Desarrollo de Temas para el Chat en Pantalla

<p align="center">
  <b>Español</b> | <a href="CHAT_THEMES.en.md">English</a>
</p>

Esta guía documenta la arquitectura técnica, la jerarquía DOM y las clases CSS del widget de chat de **Open Stream Suite**, permitiendo a diseñadores y desarrolladores crear temas personalizados tanto para **cajas de overlay** como para **emisión flotante directa en pantalla**.

---

## 1. Modos de Uso y Parámetros URL

El widget de chat (`/widgets/chat/index.html`) soporta dos modos de integración en OBS Studio:

### Modo 1: Enmarcado en Cuadro de Overlay (`?layout=box`)
Úsalo cuando insertes el chat dentro del marco de una plantilla o recuadro de cámara (ej. ancho 400px, alto 650px).
- **URL**: `http://localhost:8080/widgets/chat/?layout=box`
- **Comportamiento**: Ocupa el 100% del contenedor con auto-ajuste y apilado inferior.

### Modo 2: Flotante en Pantalla Directa (Sin Marco / Transparente)
Úsalo como fuente de navegador de 1920×1080 directamente sobre el gameplay o la cámara del stream, sin gráficos de fondo.
- **URL estándar**: `http://localhost:8080/widgets/chat/`
- **Con esquina inferior derecha**: `http://localhost:8080/widgets/chat/?pos=bottom-right`
- **Con esquina superior izquierda**: `http://localhost:8080/widgets/chat/?pos=top-left`

### Modo 3: Enlaces OBS Multi-Estilo por Perfil de Escena (`?profile=<id>`)
Permite usar estilos visuales completamente diferentes en cada escena de OBS Studio simplemente añadiendo el parámetro `?profile=...` a la URL:
- **🌿 Escena Cozy (Just Chatting / Relax)**: `http://localhost:8080/widgets/chat/index.html?profile=cozy_lofi` (tarjeta suave polaroid, fondo cálido translúcido al 85%, acento pastel)
- **⚡ Escena Gamer (Gameplay / Esports)**: `http://localhost:8080/widgets/chat/index.html?profile=gamer_pro` (biselado sci-fi 45°, brillo neón cian/esmeralda, fuente Orbitron)
- **🛠️ Escena Maker (Taller / CAD / 3D)**: `http://localhost:8080/widgets/chat/index.html?profile=maker_glass` (cristal frosted tech, corchete lateral cyan)
- **📺 Escena Pantalla Completa (Sin Overlay)**: `http://localhost:8080/widgets/chat/index.html?profile=screen_no_overlay` (píldora translúcida ultra-limpia al 28%)
- **👻 Escena Minimalista 100% Transparente**: `http://localhost:8080/widgets/chat/index.html?profile=ghost` (sin fondo ni bordes, sombras profundas en el texto)
- **💬 Escena Cómic / Pop**: `http://localhost:8080/widgets/chat/index.html?profile=bubble` (bocadillo asimétrico con degradado dual)

#### Parámetros Opcionales de Ajuste Fino en la URL:
Puedes sobreescribir cualquier propiedad directamente en la URL del navegador en OBS:
- `&shape=rounded|soft_card|scifi|bubble|pill|arcade|box|tag|slant` (silueta del mensaje)
- `&bgtype=glass|solid|gradient|transparent` (tipo de fondo)
- `&opacity=0..100` (opacidad del fondo)
- `&size=12..24` (tamaño de fuente en px)
- `&font=outfit|orbitron|inter|jetbrains_mono|montserrat|rajdhani|press_start_2p|comfortaa|quicksand|share_tech_mono|teko|poppins|bebas_neue|fira_code` (tipografías locales incluidas sin conexión a internet)
- `&border=57D6C4` (color hexadecimal de borde)
- `&borderstyle=none|full|left_neon|double` (estilo de borde del mensaje)

---

## 2. Jerarquía del DOM (HTML)

El widget genera dinámicamente la siguiente estructura en el documento:

```html
<body class="theme-maker_glass layout-box">

  <!-- 1. Lienzo de partículas reactivas (hype y confeti) -->
  <canvas id="particle-canvas"></canvas>

  <!-- 2. Tarjeta de Mensaje Destacado (Spotlight / Pin) -->
  <div id="chat-spotlight-box">
    <div class="spotlight-card">
      <div class="spotlight-badge">📌 MENSAJE DESTACADO DEL DIRECTO</div>
      <div id="spotlight-author" class="spotlight-user">NombreUsuario</div>
      <div id="spotlight-content" class="spotlight-text">Pregunta o texto destacado...</div>
    </div>
  </div>

  <!-- 3. Contenedor de mensajes de chat -->
  <div id="chat-box" class="chat-container">

    <!-- Mensaje individual con clases de roles automáticas -->
    <div class="chat-msg role-moderator" data-role="moderator" data-user="viewer">
      <div class="msg-header">
        <div class="user-badges">
          <!-- Insignias según rol -->
          <span class="badge-chip broadcaster">👑</span>
          <span class="badge-chip moderator">🛡️</span>
          <span class="badge-chip vip">💎</span>
          <span class="badge-chip subscriber">⭐</span>
          <span class="badge-chip artist">🎨</span>
        </div>
        <span class="username-text" style="color: #22C55E;">NombreUsuario</span>
      </div>
      <div class="msg-body">
        Texto del espectador con emoticonos <img class="twitch-emote" src="...">
      </div>
    </div>

  </div>

</body>
```

---

## 3. Clases y Selectores CSS Clave

| Selector CSS | Descripción y Uso |
| :--- | :--- |
| `.chat-container` | Contenedor flex vertical que sostiene los mensajes. |
| `.chat-msg` | Tarjeta del mensaje individual. Admite fondos, degradados, bordes, desenfoques (`backdrop-filter`) y sombras. |
| `.chat-msg.role-broadcaster` | Mensajes enviados por el streamer titular del canal (👑). |
| `.chat-msg.role-moderator` | Mensajes enviados por moderadores (🛡️). |
| `.chat-msg.role-vip` | Mensajes enviados por usuarios VIP (💎). |
| `.chat-msg.role-subscriber` | Mensajes enviados por suscriptores del canal (⭐). |
| `.chat-msg.role-artist` | Mensajes enviados por artistas oficiales del canal (🎨). |
| `.chat-msg.role-follower` | Mensajes enviados por seguidores normales del canal (💜). |
| `.chat-msg.role-viewer` | Mensajes enviados por espectadores sin rol ni suscripción (👤). |
| `.chat-msg.fading` | Clase aplicada automáticamente cuando el mensaje cumple su tiempo de desvanecimiento (`fadeSeconds`). |
| `.msg-header` | Cabecera flex que agrupa insignias y nombre del usuario. |
| `.user-badges` | Contenedor horizontal de chips de insignias. |
| `.badge-chip` | Chip base de insignia. |
| `.badge-chip.broadcaster` | Insignia exclusiva del streamer (Rojo / Corona 👑). |
| `.badge-chip.moderator` | Insignia de moderador (Verde / Escudo 🛡️). |
| `.badge-chip.vip` | Insignia VIP de Twitch (Rosa neón / Diamante 💎). |
| `.badge-chip.subscriber` | Insignia de suscriptor del canal (Dorado / Estrella ⭐). |
| `.badge-chip.artist` | Insignia de artista oficial reconocido (Morado / Paleta 🎨). |
| `.badge-chip.follower` | Insignia de seguidor normal (Celeste neón / Corazón 💜). |
| `.badge-chip.viewer` | Insignia de espectador general (Gris neutro 👤). |
| `.username-text` | Nombre del usuario espectador (aplica el color de Twitch o del rol). |
| `.msg-body` | Contenido del texto del mensaje. |
| `.msg-body img.twitch-emote` | Imagen de emoticono de Twitch, BTTV o 7TV (altura estándar 28px). |
| `#chat-spotlight-box` | Contenedor exterior del mensaje fijado en pantalla. |
| `.spotlight-card` | Tarjeta destacada con borde neón animado y sombra intensa. |
| `#particle-canvas` | Canvas a pantalla completa para la física de confeti o emotes. |

---

## 4. Variables CSS del Sistema (Colores Globales y Roles)

El widget expone variables CSS nativas que puedes redefinir en cualquier tema o en tu CSS personalizado:

```css
:root {
  /* Acento general */
  --chat-accent: #57D6C4;       /* Color de acento neón configurado en el panel */
  --font-primary: 'Outfit', sans-serif;
  --font-tech: 'JetBrains Mono', monospace;

  /* Colores de roles (afectan insignias, nombres y bordes) */
  --color-broadcaster: #EF4444; /* Rojo Streamer 👑 */
  --color-moderator:   #22C55E; /* Verde Moderador 🛡️ */
  --color-vip:         #EC4899; /* Rosa Neón VIP 💎 */
  --color-subscriber:  #F59E0B; /* Dorado Suscriptor ⭐ */
  --color-artist:      #8B5CF6; /* Violeta Artista 🎨 */
  --color-follower:    #38BDF8; /* Celeste Seguidor 💜 */
  --color-viewer:      #94A3B8; /* Gris Neutro Espectador 👤 */
}
```

---

## 5. Formas, Degradados, Fondos y Sombras en CSS

Todo el diseño visual de los presets se puede transformar mediante CSS estándar:

### A. Formas Personalizadas (Bordes y Recortes)

#### 1. Estilo Bocadillo de Cómic con Pico Asimétrico
```css
.chat-msg {
  border-radius: 18px 18px 18px 4px !important;
  border-left: 2px solid var(--chat-accent) !important;
}
```

#### 2. Estilo Sci-Fi Biselado / Hexagonal (`clip-path`)
```css
.chat-msg {
  border-radius: 0 !important;
  clip-path: polygon(
    0 0, 
    calc(100% - 14px) 0, 
    100% 14px, 
    100% 100%, 
    14px 100%, 
    0 calc(100% - 14px)
  ) !important;
}
```

#### 3. Estilo Píldora Flotante Redondeada
```css
.chat-msg {
  border-radius: 30px !important;
  padding: 8px 18px !important;
}
```

---

### B. Degradados (Gradients)

Puedes aplicar gradientes en fondos, tarjetas y cabeceras:

#### 1. Fondo Oscuro Tech con Degradado Diagonal
```css
.chat-msg {
  background: linear-gradient(135deg, rgba(20, 26, 36, 0.95), rgba(9, 11, 15, 0.9)) !important;
}
```

#### 2. Degradado Neón Synthwave (Magenta a Púrpura)
```css
.chat-msg {
  background: linear-gradient(135deg, rgba(217, 70, 239, 0.2), rgba(15, 10, 25, 0.92)) !important;
  border: 1px solid #D946EF !important;
  border-left: 4px solid #8B5CF6 !important;
}
```

---

### C. Fondos y Efectos de Cristal (Glassmorphism)

Para lograr un acabado translúcido que deje entrever el juego o stream:

```css
.chat-msg {
  background: rgba(18, 22, 28, 0.6) !important;
  backdrop-filter: blur(14px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
```

---

### D. Sombras y Resplandores Neón (Shadows & Glow)

#### 1. Doble Sombra (Profundidad 3D + Aura Neón)
```css
.chat-msg {
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.7), 
    0 0 15px rgba(87, 214, 196, 0.35) !important;
}
```

#### 2. Texto con Resplandor de Neón Luminoso
```css
.username-text {
  text-shadow: 0 0 8px currentColor, 0 1px 3px #000 !important;
}
```

---

## 6. Personalización Completa de Colores y Estilos de Roles

El widget añade automáticamente las clases `.role-broadcaster`, `.role-moderator`, `.role-vip`, `.role-subscriber` y `.role-artist` a cada mensaje.

### Opción 1: Cambiar los Colores de los Roles con Variables
Si solo quieres cambiar los colores de los bordes e insignias:
```css
:root {
  --color-moderator:   #00FF88 !important; /* Verde esmeralda brillante */
  --color-vip:         #FF007F !important; /* Fucsia eléctrico */
  --color-subscriber:  #FFD700 !important; /* Oro puro */
}
```

### Opción 2: Estilizar Tarjetas Enteras Según el Rol
Puedes darle un fondo y brillo completamente diferente a los moderadores o VIPs:

```css
/* Tarjeta de Moderador: fondo verde translúcido y resplandor */
.chat-msg.role-moderator {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.22), rgba(10, 20, 15, 0.94)) !important;
  border: 1px solid rgba(34, 197, 94, 0.5) !important;
  border-left: 5px solid #22C55E !important;
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.35) !important;
}
.chat-msg.role-moderator .username-text {
  color: #22C55E !important;
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.8) !important;
}

/* Tarjeta VIP: aura diamante magenta */
.chat-msg.role-vip {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(25, 10, 20, 0.94)) !important;
  border: 1px solid rgba(236, 72, 153, 0.5) !important;
  border-left: 5px solid #EC4899 !important;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.4) !important;
}
.chat-msg.role-vip .username-text {
  color: #EC4899 !important;
  text-shadow: 0 0 8px rgba(236, 72, 153, 0.8) !important;
}

/* Tarjeta del Streamer: corona dorada y borde rojo */
.chat-msg.role-broadcaster {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(20, 10, 10, 0.95)) !important;
  border: 1px solid rgba(239, 68, 68, 0.6) !important;
  border-left: 5px solid #EF4444 !important;
  box-shadow: 0 0 22px rgba(239, 68, 68, 0.45) !important;
}
```

### Opción 3: Personalizar las Insignias (Chips)
```css
/* Insignias con bordes circulares y brillo */
.badge-chip {
  border-radius: 9999px !important;
  padding: 3px 6px !important;
  font-size: 10px !important;
}
.badge-chip.moderator {
  background: #22C55E !important;
  color: #000 !important;
  box-shadow: 0 0 10px #22C55E !important;
}
.badge-chip.vip {
  background: #EC4899 !important;
  color: #fff !important;
  box-shadow: 0 0 10px #EC4899 !important;
}
```

---

## 7. Temas Predefinidos Nativos

El atributo `class` de `<body>` incluye la clase del tema activo:

1. **`theme-screen_no_overlay`**: Estilo flotante de alta legibilidad sobre gameplay o cámara con píldora translúcida al 28% y acento cian.
2. **`theme-maker_glass`**: Cristal translúcido con desenfoque de 8px, borde cyan y sombra oscura profunda.
3. **`theme-ghost`**: Fondo 100% transparente (`rgba(0,0,0,0)`), sin bordes, con texto de alto contraste (`text-shadow`) para emisión directa en pantalla.
4. **`theme-cyberpunk`**: Terminal retro estilo CRT con tipografía monospace, prefijo `> ` de comando y bordes neón amarillo/magenta.
5. **`theme-bubble`**: Burbujas de cómic redondeadas con sombra flotante y degradado dual.
6. **`theme-retro`**: Estilo 8-bit con bordes stepped dobles y sombras duras estilo arcade.
7. **`theme-cozy_lofi`**: Tarjeta suave polaroid, fondo cálido translúcido al 85%, acento pastel y borde izquierdo neón suave.
8. **`theme-gamer_pro`**: Biselado sci-fi 45°, brillo neón cian/esmeralda, fuente Orbitron y borde de alta intensidad.
9. **`theme-matrix`**: Terminal verde fósforo con tipografía mono y borde vertical esmeralda.
10. **`theme-pill`**: Píldora moderna minimalista con esquinas redondeadas completas (9999px) y tipografía Inter.
11. **`theme-scifi`**: Geometría angular de polígono recortado a 45° con corte en esquinas opuestas.

---

## 8. Comandos de Moderación para Spotlight

Cualquier moderador o el propio streamer pueden controlar el mensaje destacado desde el chat de Twitch:
- **`!destacar @usuario mensaje`** o **`!pin mensaje`**: Fija el mensaje en pantalla con animación.
- **`!quitar`** o **`!unpin`**: Oculta el mensaje destacado.
