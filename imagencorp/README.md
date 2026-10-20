# 🎨 IMAGENCORP — Identidad Visual y Recursos de Marca
### Open Stream Suite · Manual de Identidad y Recursos Gráficos

Esta carpeta contiene todos los recursos gráficos oficiales, logotipos vectoriales minimalistas, banners para GitHub y capturas de pantalla de **Open Stream Suite**.

---

## 💎 1. Filosofía de Identidad y Logotipo

El logotipo de **Open Stream Suite** ha sido diseñado bajo los principios del diseño gráfico de software contemporáneo (geométrico, minimalista, atemporal y sin elementos artificiosos generados por IA):

- **Isotipo geométrico**:
  - **Arco exterior cian (`#57D6C4` / `#38BDF8`)**: Representa la apertura de señal, la transparencia del código abierto y las ondas de broadcast en tiempo real hacia la comunidad.
  - **Arco interior coral (`#FF9E3B` / `#FF5252`)**: Representa el dinamismo de la interacción en vivo, los triggers de alertas y la energía del directo.
  - **Núcleo central blanco puro**: Un prisma direccional de transmisión (*play/trigger*), el foco de atención que es el contenido del creador.
- **Tipografía**: Sans-serif técnica de trazo limpio con gran legibilidad en pantallas de alta densidad y tamaños reducidos.

---

## 🎨 2. Paleta Oficial de Colores

| Color | Hex | Rol en la Identidad |
| :--- | :--- | :--- |
| **Obsidian Dark** | `#0B0E14` | Fondo primario, canvas nocturno de transmisión |
| **Surface Dark** | `#161B22` | Tarjetas, contenedores y paneles elevados |
| **Border Dim** | `#30363D` | Líneas de división y marcos sutiles |
| **Cyber Cyan** | `#57D6C4` | Acento principal, WebSocket, tecnología y estado activo |
| **Electric Sky** | `#38BDF8` | Gradiente de inicio del haz de broadcast |
| **Coral Sunset** | `#FF783F` | Acento secundario, alertas, interacción y decks |
| **Crimson Coral** | `#FF5252` | Fin de gradiente cálido |
| **White Glow** | `#F0F6FC` | Tipografía principal de alto contraste |
| **Muted Grey** | `#8B949E` | Metadatos técnicos, subtítulos y badges |

---

## 📁 3. Inventario de Logotipos y Formatos

Todos los archivos vectoriales SVG son matemáticamente precisos y se escalan a cualquier resolución sin pérdida de calidad.

### A. Cabeceras y Banners
* **[banner_github_header.svg](./banner_github_header.svg)** (1280 × 400 px): Banner principal para la cabecera del `README.md` de GitHub, con fondo obsidian, isotipo central y badges oficiales.
* **[banner_github_header.png](./banner_github_header.png)**: Renderizado rasterizado de alta definición listo para previsualización social o GitHub Releases.

### B. Logotipos Horizontales
* **[logos/logo_horizontal.svg](./logos/logo_horizontal.svg)** (840 × 220 px): Isotipo + Tipografía "OPEN STREAM SUITE" + descriptor "MODULAR BROADCAST & OVERLAYS" + badges.
* **[logos/logo_horizontal.png](./logos/logo_horizontal.png)**: Versión PNG transparente para usar en sitios web, headers o firmas.

### C. Isotipos y Símbolos Cuadrados
* **[logos/logo_symbol.svg](./logos/logo_symbol.svg)** (512 × 512 px): Icono cuadrado con squircle curvado para icono de aplicación de escritorio (.desktop, .exe, .app) y avatar de perfil de GitHub/Discord.
* **[logos/logo_symbol.png](./logos/logo_symbol.png)**: Renderizado a 512×512 píxeles.
* **[logos/logo_transparent.svg](./logos/logo_transparent.svg)**: El isotipo limpio sin fondo contenedor, ideal para estampar sobre cualquier fondo o interfaz.

### D. Favicons
* **[logos/favicon.svg](./logos/favicon.svg)**: Favicon vectorial nativo para navegadores modernos.
* **[logos/favicon-64.png](./logos/favicon-64.png)**: Favicon PNG 64×64 px.
* **[logos/favicon-32.png](./logos/favicon-32.png)**: Favicon PNG 32×32 px.

---

## 📸 4. Galería de Capturas del Sistema en Vivo

Capturas de pantalla reales en alta resolución (1920 × 1080 px) del software en ejecución, listas para ilustrar la documentación o la página web del proyecto:

| Captura | Archivo | Contenido |
| :--- | :--- | :--- |
| **Dashboard Principal** | [screenshots/panel_dashboard.png](./screenshots/panel_dashboard.png) | Panel de control web del streamer con estado en vivo, clientes OBS, triggers y consola. |
| **Estudio de Temas** | [screenshots/panel_themes.png](./screenshots/panel_themes.png) | Selector de paletas neón (Cyberpunk, Maker, Synthwave, Lofi, Blueprint) y restaurador. |
| **Catálogo de Escenas** | [screenshots/catalog_scenes.png](./screenshots/catalog_scenes.png) | Visualizador interactivo de todas las overlays y plantillas para OBS Studio. |
| **Overlay Gameplay** | [screenshots/overlay_game.png](./screenshots/overlay_game.png) | Escena en directo para videojuegos con marco de cámara y ticker de eventos. |
| **Overlay Multicámara** | [screenshots/overlay_multicam.png](./screenshots/overlay_multicam.png) | Escena técnica con cámara secundaria y telemetría de emisión. |

---

## 💡 5. Ejemplos de Inclusión en Markdown de GitHub

### Añadir el Banner de Cabecera:
```markdown
<p align="center">
  <img src="imagencorp/banner_github_header.png" alt="Open Stream Suite" width="100%">
</p>
```

### Añadir el Logo Horizontal:
```markdown
<p align="center">
  <img src="imagencorp/logos/logo_horizontal.png" alt="Open Stream Suite Logo" width="550">
</p>
```

### Badge de Versión e Icono:
```markdown
<img src="imagencorp/logos/favicon-32.png" width="20" height="20" align="absmiddle"> **Open Stream Suite v1.0.0-Alpha**
```
