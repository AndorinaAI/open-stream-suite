/**
 * app/widgets/shoutout/js/styles.js
 * Aplicación reactiva de estilos visuales, colores, formas y CSS personalizado para la tarjeta de Shoutout.
 */

window.ShoutoutStyles = {
  applyPromoStyles(styles = {}, fallbackColor = '#57D6C4') {
    const card = document.getElementById('so-card');
    const corner = document.getElementById('so-corner');
    const avatar = document.getElementById('so-avatar');
    const ring = document.getElementById('so-ring');
    const mediaBox = document.getElementById('so-media-box');
    const customCssTag = document.getElementById('so-custom-injected-css');
    if (!card) return;

    const color = styles.borderColor || styles.accentColor || fallbackColor;
    const glow = styles.glowIntensity !== undefined ? styles.glowIntensity : 40;
    const font = styles.fontFamily || 'outfit';
    const shape = styles.shape || 'rounded';
    const bgType = styles.bgType || 'glass';
    const bgColor = styles.bgColor || '#191D21';
    const bgGrad = styles.bgGradient || '#0B0D0F';
    const bgOpacity = (styles.bgOpacity !== undefined ? styles.bgOpacity : 94) / 100;
    const borderStyle = styles.borderStyle || 'left_neon';
    const borderWidth = styles.borderWidth || 4;

    // Actualizar variables CSS
    document.documentElement.style.setProperty('--promo-accent', color);
    document.documentElement.style.setProperty('--promo-glow', `${glow}px`);

    // Tipografía
    const fontMap = {
      'outfit': "'Outfit', sans-serif",
      'inter': "'Inter', sans-serif",
      'rajdhani': "'Rajdhani', sans-serif",
      'orbitron': "'Orbitron', sans-serif",
      'press_start': "'Press Start 2P', monospace",
      'jetbrains_mono': "'JetBrains Mono', monospace"
    };
    card.style.fontFamily = fontMap[font] || fontMap['outfit'];

    // Silueta / Forma
    card.className = card.className.replace(/\bshape-\w+/g, '');
    card.classList.add(`shape-${shape}`);

    // Fondo
    if (bgType === 'solid') {
      card.style.background = bgColor;
    } else if (bgType === 'gradient') {
      card.style.background = `linear-gradient(135deg, ${bgColor}, ${bgGrad})`;
    } else if (bgType === 'transparent') {
      card.style.background = 'transparent';
    } else {
      // glass
      card.style.background = `rgba(25, 29, 33, ${bgOpacity})`;
    }

    // Bordes y Brillo Neón
    card.style.border = 'none';
    card.style.borderLeft = 'none';

    if (borderStyle === 'left_neon') {
      card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      card.style.borderLeft = `${borderWidth}px solid ${color}`;
      card.style.boxShadow = `0 14px 38px rgba(0, 0, 0, 0.7), -4px 0 ${glow}px ${color}55`;
    } else if (borderStyle === 'full_neon') {
      card.style.border = `${borderWidth}px solid ${color}`;
      card.style.boxShadow = `0 14px 38px rgba(0, 0, 0, 0.7), 0 0 ${glow}px ${color}66`;
    } else if (borderStyle === 'subtle') {
      card.style.border = '1px solid rgba(255, 255, 255, 0.15)';
      card.style.boxShadow = '0 14px 38px rgba(0, 0, 0, 0.7)';
    } else {
      card.style.boxShadow = '0 14px 38px rgba(0, 0, 0, 0.7)';
    }

    if (corner) corner.style.borderColor = color;
    if (ring) ring.style.borderColor = color;
    if (avatar) {
      avatar.style.borderColor = color;
      avatar.style.boxShadow = `0 0 16px ${color}66`;
    }
    if (mediaBox) {
      mediaBox.style.borderColor = color;
      mediaBox.style.boxShadow = `0 4px 16px ${color}44`;
    }

    // CSS Personalizado
    if (customCssTag) {
      customCssTag.textContent = styles.customCSS || '';
    }
  }
};
