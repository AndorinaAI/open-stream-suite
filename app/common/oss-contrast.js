/**
 * oss-contrast.js — Legibilidad de colores configurables (auditoría 1.0.2).
 *
 * Los widgets permiten elegir colores propios (paletas de metas, azul de PayPal…).
 * Algunos de esos tonos quedan por debajo de 4.5:1 sobre el panel oscuro. Este
 * helper devuelve el mismo color aclarado lo justo para cumplir el mínimo,
 * conservando el tono elegido (gemelo en JS de `_readable_text_variant`).
 *
 *   OSSContrast.ensureReadable('#0079C1', '#121518')  ->  '#268DCA'
 */
window.OSSContrast = (function () {
  function parse(value) {
    const text = String(value || '').trim();
    let m = /^#([0-9a-fA-F]{6})$/.exec(text);
    if (m) {
      const h = m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /^rgba?\(([^)]+)\)$/.exec(text);
    if (m) {
      const parts = m[1].split(',').slice(0, 3).map(p => parseFloat(p));
      if (parts.every(n => !isNaN(n))) return parts;
    }
    return null;
  }

  function luminance(rgb) {
    const channel = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }

  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function ensureReadable(color, background, minimum) {
    const min = minimum === undefined ? 4.5 : minimum;
    const rgb = parse(color), bg = parse(background);
    if (!rgb || !bg || contrast(rgb, bg) >= min) return color;
    for (let step = 1; step <= 20; step++) {
      const t = step / 20;
      const mixed = rgb.map(c => Math.round(c + (255 - c) * t));
      if (contrast(mixed, bg) >= min) {
        return '#' + mixed.map(c => c.toString(16).padStart(2, '0').toUpperCase()).join('');
      }
    }
    return '#FFFFFF';
  }

  function themeBackground(fallback) {
    try {
      const value = getComputedStyle(document.body).getPropertyValue('--color-bg-dark').trim();
      return value || fallback || '#121518';
    } catch (e) {
      return fallback || '#121518';
    }
  }

  return { ensureReadable: ensureReadable, themeBackground: themeBackground, contrast: contrast };
})();
