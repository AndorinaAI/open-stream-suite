/**
 * ====================================================================
 * OPEN STREAM SUITE — MOTOR DE FONDOS CON APERTURA Y RECORTE (CUTOUTS)
 * ====================================================================
 * app/common/overlay/backdrop-aperture.js
 *
 * Permite aplicar fondos (imágenes, patrones temáticos o degradados) a
 * las escenas de streaming SIN tapar las capturas de OBS (cámaras, gameplays
 * o pantallas) que se sitúan detrás de la capa del navegador web.
 *
 * Utiliza una máscara SVG de alta precisión (<mask id="oss-aperture-mask">)
 * calculada dinámicamente según las coordenadas, dimensiones, border-radius
 * y clip-paths de cada contenedor de cámara/juego.
 */

(function () {
  'use strict';

  window.OSSAperture = window.OSSAperture || {};

  // Preset visual backdrops por pack temático
  const PRESET_BACKDROPS = {
    // ☕ Cozy Lo-Fi Pack (Sin neón, orgánico, texturas cálidas y naturales)
    cozy_warm_paper: {
      name: "Cozy Papel Kraft & Textura Suave",
      type: "gradient",
      value: "radial-gradient(circle at 50% 30%, #fbf9f5 0%, #ede6db 60%, #e3d9cb 100%)"
    },
    cozy_tatami_wood: {
      name: "Cozy Madera Natural & Botánica",
      type: "gradient",
      value: "linear-gradient(135deg, #2d2621 0%, #1f1a16 50%, #181411 100%)"
    },
    cozy_matcha_ambient: {
      name: "Cozy Verde Matcha & Bambú",
      type: "gradient",
      value: "radial-gradient(ellipse at 80% 20%, #222d25 0%, #151c17 65%, #0f1411 100%)"
    },

    // ⚡ Gamer Pro Pack (Táctico, esports, fibra de carbono y mallas oscuras)
    gamer_carbon_mesh: {
      name: "Gamer Fibra de Carbono Oscura",
      type: "pattern",
      value: "radial-gradient(#1e293b 15%, transparent 16%) 0 0 / 16px 16px, linear-gradient(to right, #090d16, #020617)"
    },
    gamer_cyber_grid: {
      name: "Gamer Matriz Táctica Hexagonal",
      type: "gradient",
      value: "radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)"
    },

    // 🛠️ Maker & Taller Pack (CAD azul milimetrado, tapiz de corte)
    maker_cad_blueprint: {
      name: "Maker Cuadrícula CAD Milimetrada",
      type: "pattern",
      value: "linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, #0b1329 1px) 0 0 / 20px 20px"
    },
    maker_workshop_mat: {
      name: "Maker Tapiz de Corte Verde Taller",
      type: "gradient",
      value: "linear-gradient(145deg, #13241c 0%, #0c1712 100%)"
    },

    // 🎙️ Open Stream Pack (Estudio de grabación, paneles acústicos pizarra)
    studio_acoustic_slate: {
      name: "Studio Paneles Acústicos Gris Pizarra",
      type: "gradient",
      value: "radial-gradient(ellipse at top, #1e293b 0%, #0f172a 70%, #020617 100%)"
    },
    studio_frosted_glass: {
      name: "Studio Cristal Glaseado Suizo",
      type: "gradient",
      value: "linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)"
    }
  };

  const CUTOUT_SELECTORS = [
    '[data-oss-cam]',
    '[data-oss-viewport]',
    '.camera-frame',
    '.cam-box',
    '.cam-frame',
    '.cam-viewport',
    '.cam-inner-viewport',
    '.camera-feed',
    '.face-viewport',
    '.desk-viewport',
    '.desk-cam',
    '.cam-container > .cam-box',
    '.cam-stage > .stream-frame',
    '.stream-frame',
    '.guest-cam',
    '.floating-cam',
    '.pip-cam-box',
    '.game-box',
    '.gameplay-box',
    '.canvas-area',
    '.desk-canvas-box',
    '.gameplay-window',
    '[data-cutout="true"]',
    '[data-aperture="true"]'
  ];

  let backdropLayerEl = null;
  let maskEl = null;
  let currentBgConfig = { mode: 'none', preset: null, customUrl: null };

  /**
   * Crea e inyecta la capa HTML con máscara SVG y defs
   */
  function injectApertureDOM() {
    if (document.getElementById('oss-backdrop-aperture-layer')) {
      backdropLayerEl = document.getElementById('oss-backdrop-aperture-layer');
      maskEl = document.getElementById('oss-aperture-mask');
      return;
    }

    // 1. Capa HTML de fondo que soporta gradientes CSS, imágenes y texturas
    const layer = document.createElement('div');
    layer.id = 'oss-backdrop-aperture-layer';
    layer.style.position = 'fixed';
    layer.style.top = '0';
    layer.style.left = '0';
    layer.style.width = '1920px';
    layer.style.height = '1080px';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '0'; // Se ubica detrás del contenido pero dentro del lienzo
    layer.style.mask = 'url(#oss-aperture-mask)';
    layer.style.webkitMask = 'url(#oss-aperture-mask)';
    layer.style.transition = 'opacity 0.4s ease, background 0.4s ease';
    layer.style.background = 'transparent';
    layer.style.display = 'none';

    // 2. SVG que aloja la máscara recortadora
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'oss-aperture-svg-defs';
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', 'oss-aperture-mask');
    mask.setAttribute('maskUnits', 'userSpaceOnUse');

    // Fondo blanco base de la máscara (todo el fondo es visible inicialmente)
    const baseWhite = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    baseWhite.setAttribute('x', '0');
    baseWhite.setAttribute('y', '0');
    baseWhite.setAttribute('width', '1920');
    baseWhite.setAttribute('height', '1080');
    baseWhite.setAttribute('fill', '#ffffff');
    mask.appendChild(baseWhite);

    defs.appendChild(mask);
    svg.appendChild(defs);

    if (document.body.firstChild) {
      document.body.insertBefore(svg, document.body.firstChild);
      document.body.insertBefore(layer, document.body.firstChild);
    } else {
      document.body.appendChild(svg);
      document.body.appendChild(layer);
    }

    backdropLayerEl = layer;
    maskEl = mask;
  }

  let isUpdatingCutouts = false;

  /**
   * Recalcula y dibuja los huecos negros en la máscara SVG
   */
  function updateCutouts() {
    if (!maskEl || isUpdatingCutouts) return;
    isUpdatingCutouts = true;
    try {
      // Eliminar recortes anteriores (conservando el baseWhite inicial)
      while (maskEl.childNodes.length > 1) {
        maskEl.removeChild(maskEl.lastChild);
      }

    // Coordenadas respecto al lienzo 1920x1080
    const canvasEl = document.querySelector('.overlay-canvas') || document.body;
    const canvasRect = canvasEl.getBoundingClientRect();
    const scaleX = 1920 / (canvasRect.width || 1920);
    const scaleY = 1080 / (canvasRect.height || 1080);

    const elements = document.querySelectorAll(CUTOUT_SELECTORS.join(', '));

    elements.forEach(el => {
      // Ignorar si está oculto o es hijo de un marco ya recortado
      if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) return;
      if (el.closest('.open-stream-suite-screen-hud')) return;

      const rect = el.getBoundingClientRect();
      const x = (rect.left - canvasRect.left) * scaleX;
      const y = (rect.top - canvasRect.top) * scaleY;
      const w = rect.width * scaleX;
      const h = rect.height * scaleY;

      if (w <= 10 || h <= 10) return;

      const style = window.getComputedStyle(el);

      // Manejo de clip-path poligonal (ej: esquinas biseladas a 45° en Gamer Pro)
      const clipPath = style.clipPath;
      if (clipPath && clipPath.includes('polygon(')) {
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = parseClipPathPolygon(clipPath, x, y, w, h);
        if (pointsStr) {
          poly.setAttribute('points', pointsStr);
          poly.setAttribute('fill', '#000000');
          maskEl.appendChild(poly);
          return;
        }
      }

      // Manejo de esquinas redondeadas (ej: Cozy o Swiss Broadcast)
      const bRad = parseFloat(style.borderRadius) || 0;
      const cutRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      cutRect.setAttribute('x', Math.round(x));
      cutRect.setAttribute('y', Math.round(y));
      cutRect.setAttribute('width', Math.round(w));
      cutRect.setAttribute('height', Math.round(h));
      if (bRad > 0) {
        cutRect.setAttribute('rx', Math.round(bRad * scaleX));
        cutRect.setAttribute('ry', Math.round(bRad * scaleY));
      }
      cutRect.setAttribute('fill', '#000000');
      maskEl.appendChild(cutRect);
    });
    } finally {
      // Defer reset of flag to next animation frame so DOM mutations triggered by this update are ignored
      requestAnimationFrame(() => {
        isUpdatingCutouts = false;
      });
    }
  }

  /**
   * Divide `str` por los separadores de primer nivel (ignora lo que está dentro
   * de paréntesis, p. ej. `calc(100% - 22px)`).
   */
  function splitTopLevel(str, separator) {
    const out = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && separator.test(ch)) {
        if (current.trim()) out.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) out.push(current.trim());
    return out;
  }

  /**
   * Evalúa el cuerpo de un `calc()` con sumas/restas/productos de longitudes.
   * Devuelve `null` si no se puede resolver con certeza (nunca NaN).
   */
  function evaluateCalc(expression, size, depth) {
    const tokens = [];
    let current = '';
    let parens = 0;
    for (let i = 0; i < expression.length; i++) {
      const ch = expression[i];
      if (ch === '(') parens++;
      else if (ch === ')') parens = Math.max(0, parens - 1);
      const isOperator = parens === 0 && (ch === '+' || ch === '*' || ch === '/' || (ch === '-' && current.trim() !== ''));
      if (isOperator) {
        if (current.trim()) tokens.push(current.trim());
        tokens.push(ch);
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) tokens.push(current.trim());

    let acc = null;
    let operator = null;
    for (const token of tokens) {
      if (token === '+' || token === '-' || token === '*' || token === '/') {
        operator = token;
        continue;
      }
      const value = resolveLength(token, size, depth);
      if (value === null) return null;
      if (acc === null) {
        acc = value;
      } else if (operator === '+') {
        acc += value;
      } else if (operator === '-') {
        acc -= value;
      } else if (operator === '*') {
        acc *= value;
      } else if (operator === '/') {
        if (!value) return null;
        acc /= value;
      }
      operator = null;
    }
    return acc;
  }

  /**
   * Convierte una longitud CSS (`18`, `12px`, `40%`, `calc(100% - 22px)`) a
   * píxeles relativos a `size` (ancho o alto de la caja). `null` si es inválida.
   */
  function resolveLength(token, size, depth) {
    const level = depth || 0;
    if (level > 4 || token === null || token === undefined) return null;
    const text = String(token).trim();
    if (!text) return null;

    const calcMatch = text.match(/^calc\(([\s\S]*)\)$/i);
    if (calcMatch) return evaluateCalc(calcMatch[1], size, level + 1);

    if (text.endsWith('%')) {
      const percent = parseFloat(text);
      return Number.isFinite(percent) ? (percent / 100) * size : null;
    }
    const pxMatch = text.match(/^(-?[\d.]+)px$/i);
    if (pxMatch) {
      const px = parseFloat(pxMatch[1]);
      return Number.isFinite(px) ? px : null;
    }
    const bare = parseFloat(text);
    return Number.isFinite(bare) ? bare : null;
  }

  /**
   * Parsea un clip-path CSS `polygon(...)` a puntos SVG absolutos.
   *
   * Soporta `%`, `px` y `calc(<longitud> <op> <longitud>)`, con separadores de
   * coma o de espacio tanto entre puntos como entre coordenadas.
   *
   * BUG CORREGIDO (T4): la versión anterior hacía `pair.split(/\s+/)`, que
   * partía DENTRO de `calc(100% - 22px)` → `['calc(100%', '-', '22px)']`. Como
   * `'calc(100%'.endsWith('%')` es true, se evaluaba `parseFloat('calc(100%')`
   * → NaN y el `<polygon>` del bisel quedaba con puntos NaN
   * (`Expected number, "48,767 NaN,767 408,791 …"`), así que el bisel no se
   * dibujaba en `game`, `gameplay_hud`, `speedrun_split` y `victory_clutch`.
   * Además la rama `px.includes('calc(')` era inalcanzable: el `%` la sombreaba.
   */
  function parseClipPathPolygon(cssPolygon, x, y, w, h) {
    try {
      const match = String(cssPolygon).match(/polygon\(([\s\S]*)\)\s*$/i);
      if (!match) return null;

      // Modificador de relleno opcional antes del primer punto: polygon(evenodd, …)
      const inner = match[1].trim().replace(/^(evenodd|nonzero)\s*,\s*/i, '');
      const pairs = splitTopLevel(inner, /,/);
      const points = [];

      for (const pair of pairs) {
        const parts = splitTopLevel(pair, /\s/);
        if (parts.length < 2) continue;
        const offsetX = resolveLength(parts[0], w, 0);
        const offsetY = resolveLength(parts[1], h, 0);
        if (offsetX === null || offsetY === null) return null;
        points.push(`${Math.round(x + offsetX)},${Math.round(y + offsetY)}`);
      }

      if (points.length < 3) return null;
      return points.join(' ');
    } catch (e) {
      return null;
    }
  }

  /**
   * Aplica un fondo al sistema recortado
   */
  function setBackdrop(config) {
    injectApertureDOM();
    if (!config) config = { mode: 'none' };
    currentBgConfig = Object.assign({}, currentBgConfig, config);

    if (!backdropLayerEl) return;

    if (config.mode === 'preset' && PRESET_BACKDROPS[config.preset]) {
      const p = PRESET_BACKDROPS[config.preset];
      backdropLayerEl.style.background = p.value;
      backdropLayerEl.style.display = 'block';
      backdropLayerEl.style.opacity = '1';
    } else if (config.mode === 'image' && config.customUrl) {
      backdropLayerEl.style.background = `url("${config.customUrl}") center center / cover no-repeat`;
      backdropLayerEl.style.display = 'block';
      backdropLayerEl.style.opacity = '1';
    } else if (config.mode === 'color' && config.color) {
      backdropLayerEl.style.background = config.color;
      backdropLayerEl.style.display = 'block';
      backdropLayerEl.style.opacity = '1';
    } else {
      // Modo 'none': Transparente por defecto
      backdropLayerEl.style.background = 'transparent';
      backdropLayerEl.style.display = 'none';
      backdropLayerEl.style.opacity = '0';
    }

    updateCutouts();
  }

  /**
   * Inicialización y escuchadores de cambios dinámicos
   */
  function init() {
    injectApertureDOM();

    // Comprobar parámetros de URL o atributos data
    const urlParams = new URLSearchParams(window.location.search);
    const bgPreset = urlParams.get('bg') || document.body.dataset.sceneBg;
    const bgUrl = urlParams.get('bg_url') || document.body.dataset.sceneBgUrl;

    if (bgUrl) {
      setBackdrop({ mode: 'image', customUrl: bgUrl });
    } else if (bgPreset && PRESET_BACKDROPS[bgPreset]) {
      setBackdrop({ mode: 'preset', preset: bgPreset });
    } else {
      updateCutouts();
    }

    // Recalcular ante redimensionamiento de ventana o cambio de estilo / tema
    window.addEventListener('resize', () => {
      setTimeout(updateCutouts, 100);
    });
    window.addEventListener('oss:themechange', () => {
      setTimeout(updateCutouts, 50);
    });

    // Observar mutaciones en el DOM para reposicionamientos dinámicos
    if (window.MutationObserver) {
      let debounceTimer = null;
      const observer = new MutationObserver((mutations) => {
        if (isUpdatingCutouts) return;
        const relevant = mutations.some(m => {
          const t = m.target;
          if (!t) return false;
          if (t.id === 'oss-backdrop-aperture-layer' || t.id === 'oss-aperture-svg-defs' || t.id === 'oss-aperture-mask') return false;
          if (t.closest && (t.closest('#oss-aperture-svg-defs') || t.closest('#oss-backdrop-aperture-layer') || t.closest('.open-stream-suite-screen-hud'))) return false;
          return true;
        });
        if (!relevant) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          updateCutouts();
        }, 150);
      });
      observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class', 'data-theme', 'data-theme-shape'] });
    }
  }

  window.OSSAperture = {
    init: init,
    setBackdrop: setBackdrop,
    updateCutouts: updateCutouts,
    recalculateApertures: updateCutouts,
    presets: PRESET_BACKDROPS,
    getConfig: () => currentBgConfig
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
