/**
 * app/widgets/chat/js/styles.js — Gestión de temas, estilos reactivos y CSS dinámico del chat
 */

window.ChatStyles = (function() {
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get('preview') === 'true';
  const themeParam = urlParams.get('theme');
  const layoutParam = urlParams.get('layout');
  const posParam = urlParams.get('pos');

  let chatConfig = {
    themePreset: "maker_glass",
    shape: "rounded",
    bgType: "glass",
    bgColor: "#191D21",
    bgGradient: "#0B0D0F",
    borderColor: "#57D6C4",
    borderStyle: "left_neon",
    borderWidth: 3,
    glowIntensity: 40,
    fontFamily: "outfit",
    fontSize: 14,
    bgOpacity: 88,
    accentColor: "#57D6C4",
    fadeSeconds: 18,
    maxMessages: 12,
    showBadges: true,
    hideBotCommands: true,
    hideBotUsers: true,
    soundNotify: false,
    autoParticles: true,
    roleColors: {
      broadcaster: "#EF4444",
      moderator: "#22C55E",
      vip: "#EC4899",
      subscriber: "#F59E0B",
      artist: "#8B5CF6"
    },
    customCSS: ""
  };

  function hexToRgba(hex, alpha = 1) {
    if (!hex || hex === 'transparent') return 'transparent';
    let cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) return `rgba(25, 29, 33, ${alpha})`;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyChatConfig(newConfig) {
    if (!newConfig) return;
    chatConfig = Object.assign({}, chatConfig, newConfig);

    const activeTheme = themeParam || chatConfig.themePreset || chatConfig.activePreset || 'maker_glass';

    const keepEmbedded = document.body.classList.contains('embedded');
    document.body.className = '';
    if (keepEmbedded) document.body.classList.add('embedded');
    if (isPreviewMode) {
      document.body.classList.add('is-preview');
    }
    if (layoutParam === 'box' || isPreviewMode) {
      document.body.classList.add('layout-box');
    } else if (posParam) {
      document.body.classList.add(`pos-${posParam}`);
    }
    document.body.classList.add(`theme-${activeTheme}`);

    const shapeParam = urlParams.get('shape') || window.OSS_WIDGET_SHAPE || null;
    const bgTypeParam = urlParams.get('bgtype') || urlParams.get('bg_type');
    const opacityParam = urlParams.get('opacity');
    const fontParam = urlParams.get('font');
    const sizeParam = urlParams.get('size');
    const borderParam = urlParams.get('border');
    const borderStyleParam = urlParams.get('borderstyle');

    const shape = shapeParam || chatConfig.shape || (
      activeTheme === 'bubble' ? 'bubble' :
      activeTheme === 'scifi' || activeTheme === 'cyberpunk' || activeTheme === 'gamer_pro' ? 'scifi' :
      activeTheme === 'arcade' || activeTheme === 'retro' ? 'arcade' :
      activeTheme === 'pill' ? 'pill' :
      activeTheme === 'cozy_lofi' || activeTheme === 'kawaii' ? 'soft_card' :
      activeTheme === 'ghost' ? 'box' : 'rounded'
    );

    const bgType = bgTypeParam || chatConfig.bgType || (
      activeTheme === 'ghost' ? 'transparent' :
      activeTheme === 'bubble' || activeTheme === 'synthwave' || activeTheme === 'candy' ? 'gradient' :
      activeTheme === 'cyberpunk' || activeTheme === 'retro' || activeTheme === 'matrix' || activeTheme === 'gamer_pro' ? 'solid' : 'glass'
    );

    const fontFamily = fontParam || chatConfig.fontFamily || (
      activeTheme === 'cyberpunk' ? 'courier' :
      activeTheme === 'retro' ? 'press_start' :
      activeTheme === 'pill' ? 'inter' :
      activeTheme === 'matrix' ? 'mono' :
      activeTheme === 'gamer_pro' ? 'orbitron' : 'outfit'
    );

    const borderStyle = borderStyleParam || chatConfig.borderStyle || (
      activeTheme === 'ghost' ? 'none' :
      activeTheme === 'retro' ? 'double' :
      activeTheme === 'maker_glass' || activeTheme === 'matrix' || activeTheme === 'cozy_lofi' ? 'left_neon' : 'full'
    );

    const borderWidth = (chatConfig.borderWidth !== undefined) ? chatConfig.borderWidth : (borderStyle === 'double' ? 3 : 2);
    const borderColor = borderParam ? ('#' + borderParam.replace('#', '')) : (chatConfig.borderColor || '#57D6C4');
    const bgColor = chatConfig.bgColor || '#191D21';
    const bgGradient = chatConfig.bgGradient || '#0B0D0F';
    const glow = (chatConfig.glowIntensity !== undefined) ? chatConfig.glowIntensity : 35;
    const opacity = (opacityParam !== null && opacityParam !== undefined ? parseInt(opacityParam, 10) : (chatConfig.bgOpacity !== undefined ? chatConfig.bgOpacity : (activeTheme === 'ghost' ? 0 : 88))) / 100;
    const fSize = (sizeParam ? parseInt(sizeParam, 10) : null) || chatConfig.fontSize || 14;

    document.documentElement.style.setProperty('--chat-accent', borderColor);
    if (chatConfig.roleColors) {
      const rc = chatConfig.roleColors;
      if (rc.broadcaster) document.documentElement.style.setProperty('--color-broadcaster', rc.broadcaster);
      if (rc.moderator) document.documentElement.style.setProperty('--color-moderator', rc.moderator);
      if (rc.vip) document.documentElement.style.setProperty('--color-vip', rc.vip);
      if (rc.subscriber) document.documentElement.style.setProperty('--color-subscriber', rc.subscriber);
      if (rc.artist) document.documentElement.style.setProperty('--color-artist', rc.artist);
      if (rc.follower) document.documentElement.style.setProperty('--color-follower', rc.follower);
      if (rc.viewer) document.documentElement.style.setProperty('--color-viewer', rc.viewer);
    }

    let shapeCss = 'border-radius: 6px !important;';
    if (shape === 'box') {
      shapeCss = 'border-radius: 2px !important;';
    } else if (shape === 'bubble') {
      shapeCss = 'border-radius: 20px 20px 20px 4px !important; padding: 12px 18px !important;';
    } else if (shape === 'scifi') {
      shapeCss = 'clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)) !important; border-radius: 0 !important;';
    } else if (shape === 'pill') {
      shapeCss = 'border-radius: 9999px !important; padding: 8px 20px !important;';
    } else if (shape === 'arcade') {
      shapeCss = 'border-radius: 0 !important;';
    } else if (shape === 'tag') {
      shapeCss = 'clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%) !important; border-radius: 0 !important; padding: 10px 18px !important;';
    } else if (shape === 'slant') {
      shapeCss = 'clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%) !important; border-radius: 0 !important; padding: 10px 22px !important;';
    } else if (shape === 'soft_card') {
      shapeCss = 'border-radius: 18px !important; padding: 12px 18px !important;';
    }

    let bgCss = '';
    if (bgType === 'transparent' || opacity === 0 || activeTheme === 'ghost') {
      bgCss = 'background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; border: none !important;';
    } else if (bgType === 'solid') {
      bgCss = `background: ${hexToRgba(bgColor, opacity)} !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important;`;
    } else if (bgType === 'gradient') {
      bgCss = `background: linear-gradient(135deg, ${hexToRgba(bgColor, opacity)}, ${hexToRgba(bgGradient, opacity)}) !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important;`;
    } else {
      bgCss = `background: ${hexToRgba(bgColor, opacity)} !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important;`;
    }

    let borderCss = '';
    if (bgType === 'transparent' || borderStyle === 'none' || activeTheme === 'ghost') {
      borderCss = 'border: none !important;';
    } else if (borderStyle === 'left_neon') {
      borderCss = `border: 1px solid rgba(255, 255, 255, 0.08) !important; border-left: ${borderWidth}px solid ${borderColor} !important;`;
    } else if (borderStyle === 'double') {
      borderCss = `border: ${borderWidth}px double ${borderColor} !important;`;
    } else {
      borderCss = `border: ${borderWidth}px solid ${borderColor} !important;`;
    }

    let shadowCss = '';
    if (bgType === 'transparent' || opacity === 0 || activeTheme === 'ghost') {
      shadowCss = 'box-shadow: none !important;';
    } else if (shape === 'arcade' || activeTheme === 'retro') {
      shadowCss = 'box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.95) !important;';
    } else if (glow > 0) {
      shadowCss = `box-shadow: 0 0 ${Math.round(glow * 0.35)}px ${hexToRgba(borderColor, (glow / 100) * 0.55)}, 0 4px 20px rgba(0, 0, 0, 0.5) !important;`;
    } else {
      shadowCss = 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;';
    }

    let fontCss = "font-family: 'Outfit', sans-serif !important;";
    if (fontFamily === 'inter') {
      fontCss = "font-family: 'Inter', -apple-system, sans-serif !important;";
    } else if (fontFamily === 'poppins') {
      fontCss = "font-family: 'Poppins', sans-serif !important;";
    } else if (fontFamily === 'montserrat') {
      fontCss = "font-family: 'Montserrat', sans-serif !important; font-weight: 600;";
    } else if (fontFamily === 'rajdhani') {
      fontCss = "font-family: 'Rajdhani', sans-serif !important; font-weight: 600; letter-spacing: 0.5px;";
    } else if (fontFamily === 'orbitron') {
      fontCss = "font-family: 'Orbitron', sans-serif !important; font-weight: 600; letter-spacing: 0.5px;";
    } else if (fontFamily === 'russo_one') {
      fontCss = "font-family: 'Russo One', sans-serif !important;";
    } else if (fontFamily === 'comfortaa') {
      fontCss = "font-family: 'Comfortaa', cursive, sans-serif !important; font-weight: 700;";
    } else if (fontFamily === 'mono') {
      fontCss = "font-family: 'JetBrains Mono', monospace !important;";
    } else if (fontFamily === 'courier') {
      fontCss = "font-family: 'Courier New', Courier, monospace !important;";
    } else if (fontFamily === 'press_start') {
      fontCss = "font-family: 'Press Start 2P', monospace, cursive !important; letter-spacing: 0.5px;";
    } else if (fontFamily === 'silkscreen') {
      fontCss = "font-family: 'Silkscreen', monospace !important; letter-spacing: 0.5px;";
    }

    const customStyleEl = document.getElementById('custom-user-css');
    if (customStyleEl) {
      customStyleEl.textContent = `
        .chat-msg {
          font-size: ${fSize}px !important;
          ${fontCss}
          ${shapeCss}
          ${bgCss}
          ${borderCss}
          ${shadowCss}
        }
        .msg-body {
          font-size: ${fSize}px !important;
          ${fontCss}
          ${(bgType === 'transparent' || opacity <= 0.4 || activeTheme === 'ghost' || activeTheme === 'screen_no_overlay') ? 'text-shadow: 0 1px 3px #000, 0 2px 8px rgba(0,0,0,0.95), 0 0 14px #000 !important; font-weight: 600;' : ''}
        }
        .username-text {
          ${fontCss}
          ${(bgType === 'transparent' || opacity <= 0.4 || activeTheme === 'ghost' || activeTheme === 'screen_no_overlay') ? 'text-shadow: 0 1px 4px #000, 0 0 8px rgba(0,0,0,0.95) !important;' : ''}
          ${shape === 'arcade' || activeTheme === 'retro' ? 'text-transform: uppercase;' : ''}
        }
        ${chatConfig.customCSS || ''}
      `;
    }
  }

  return {
    get config() { return chatConfig; },
    set config(v) { chatConfig = v; },
    isPreviewMode,
    hexToRgba,
    applyChatConfig
  };
})();
