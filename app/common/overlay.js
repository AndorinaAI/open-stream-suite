/**
 * ====================================================================
 * OPEN STREAM SUITE — MOTOR DE OVERLAY COMÚN
 * ====================================================================
 * Carga la configuración local, inyecta textos, gestiona visibilidad,
 * sincroniza temas por escena y actualiza elementos interactivos.
 * Submódulos auxiliares en app/common/overlay/:
 *   - icons.js: Diccionario de iconos SVG optimizados
 *   - dom-injector.js: Inyección de configuraciones al DOM
 *   - editor.js / editor/: Editor en pantalla completa (HUD interactivo)
 */

(function () {
  // Asegurar submódulos auxiliares si se cargaron antes o bajo demanda
  const basePath = (function() {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      if (s.src && s.src.includes('overlay.js')) {
        return s.src.replace(/overlay\.js(\?.*)?$/, 'overlay/');
      }
    }
    return '/common/overlay/';
  })();

  function ensureScript(name, checkFn) {
    if (checkFn()) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = basePath + name + '?v=50';
      s.onload = () => resolve();
      s.onerror = () => resolve(); // Modo resiliente
      document.head.appendChild(s);
    });
  }

  function applyConfigToDOM(config) {
    if (window.OSSDomInjector && typeof window.OSSDomInjector.applyConfigToDOM === 'function') {
      window.OSSDomInjector.applyConfigToDOM(config);
    } else {
      ensureScript('dom-injector.js', () => window.OSSDomInjector)
        .then(() => {
          if (window.OSSDomInjector) window.OSSDomInjector.applyConfigToDOM(config);
        });
    }
  }

  function initOverlay() {
    const config = window.OSS_CONFIG || {
      channel: { name: "ANDORINA", tagline: "JUGAR · CREAR · COMPARTIR", visible: true, showLiveIndicator: true },
      maker: { projectName: "NAS CON RASPBERRY PI", currentPhase: "02 MONTAJE", phases: ["01 PLAN", "02 MONTAJE", "03 SOFTWARE", "04 PRUEBAS"] },
      print: { projectName: "PEGATINAS PERSONALIZADAS", material: "Vinilo Holográfico", currentPhase: "CORTE DE VINILO", phases: ["01 DISEÑO", "02 CORTE", "03 PELADO", "04 APLICACIÓN"] },
      chill: { showChatPanel: true },
      performance: { enableAnimations: true }
    };

    // 1. Inyección de iconos con data-icon="nombre"
    function injectIcons() {
      if (window.OSSDomInjector && typeof window.OSSDomInjector.injectIcons === 'function') {
        window.OSSDomInjector.injectIcons();
      } else if (window.OSSIcons) {
        document.querySelectorAll('[data-icon]').forEach(el => {
          const k = el.getAttribute('data-icon');
          if (window.OSSIcons[k]) el.innerHTML = window.OSSIcons[k];
        });
      }
    }

    if (window.OSSIcons) {
      injectIcons();
    } else {
      ensureScript('icons.js', () => window.OSSIcons).then(injectIcons);
    }

    // 1.05 Inyección del motor de fondos con recorte y apertura de cámaras
    if (!window.OSSAperture) {
      ensureScript('backdrop-aperture.js', () => window.OSSAperture);
    }

    // 1.06 Inyección del motor de interactividad y elementos switchables
    if (!window.OSSInteractive) {
      ensureScript('interactive-features.js', () => window.OSSInteractive);
    }

    // 1.1 Detección de clave de escena para estilos independientes
    function detectCurrentSceneKey() {
      const p = window.location.pathname;
      if (p.includes('/Open_stream_Pack/')) {
        if (p.includes('/just_chatting/')) return 'oss_chatting';
        if (p.includes('/desktop_share/')) return 'oss_desktop';
        if (p.includes('/podcast_talk/')) return 'oss_podcast';
        if (p.includes('/starting-soon/')) return 'oss_starting';
        if (p.includes('/be-right-back/')) return 'oss_brb';
        if (p.includes('/ending/')) return 'oss_ending';
      }
      if (p.includes('/Gamer_Pro_Pack/')) {
        if (p.includes('/gameplay_hud/')) return 'gamer_gameplay';
        if (p.includes('/speedrun_split/')) return 'gamer_speedrun';
        if (p.includes('/victory_clutch/')) return 'gamer_victory';
        if (p.includes('/starting-soon/')) return 'gamer_starting';
        if (p.includes('/be-right-back/')) return 'gamer_brb';
        if (p.includes('/ending/')) return 'gamer_ending';
      }
      if (p.includes('/Cozy_LoFi_Pack/')) {
        if (p.includes('/study_pomodoro/')) return 'cozy_pomodoro';
        if (p.includes('/art_dual_cam/')) return 'cozy_art';
        if (p.includes('/cafe_chat/')) return 'cozy_cafe';
        if (p.includes('/starting-soon/')) return 'cozy_starting';
        if (p.includes('/coffee-break/')) return 'cozy_brb';
        if (p.includes('/ending/')) return 'cozy_ending';
      }
      if (p.includes('/game/')) return 'game';
      if (p.includes('/maker/desk/') || p.includes('/maker-desk/')) return 'maker-desk';
      if (p.includes('/maker/pc/') || p.includes('/maker-pc/')) return 'maker-pc';
      if (p.includes('/print/machine/') || p.includes('/print-machine/')) return 'print-machine';
      if (p.includes('/print/design/') || p.includes('/print-design/')) return 'print-design';
      if (p.includes('/chill/')) return 'chill';
      if (p.includes('/starting-soon/')) return 'startingSoon';
      if (p.includes('/be-right-back/')) return 'beRightBack';
      if (p.includes('/ending/')) return 'ending';
      return document.body.dataset.scene || document.body.dataset.mode || null;
    }

    function detectCurrentPack() {
      const p = window.location.pathname;
      if (p.includes('/Cozy_LoFi_Pack/')) return 'cozy';
      if (p.includes('/Gamer_Pro_Pack/')) return 'gamer';
      if (p.includes('/Open_stream_Pack/')) return 'openstream';
      if (p.includes('/Maker_Theme_Pack/') || p.includes('/maker/') || p.includes('/print/') || p.includes('/game/') || p.includes('/chill/')) return 'maker';
      return document.body.dataset.pack || 'maker';
    }

    function getThemeArchetype(themeName) {
      if (!themeName) return null;
      const t = themeName.toLowerCase();
      if (t.includes('cozy') || t.includes('latte') || t.includes('matcha') || t.includes('sakura') || t.includes('lavender') || t.includes('nordic') || t.includes('kawaii') || t.includes('chill') || t.includes('warm') || t.includes('lofi')) {
        return 'cozy';
      }
      if (t.includes('gamer') || t.includes('cyber') || t.includes('toxic') || t.includes('glory') || t.includes('esport') || t.includes('stealth') || t.includes('arcade') || t.includes('matrix')) {
        return 'gamer';
      }
      if (t.includes('maker') || t.includes('terminal') || t.includes('print') || t.includes('blueprint') || t.includes('circuit')) {
        return 'maker';
      }
      if (t.includes('openstream') || t.includes('clean') || t.includes('streamer') || t.includes('sunset') || t.includes('pulse') || t.includes('synthwave') || t.includes('candy')) {
        return 'openstream';
      }
      return null;
    }

    function adaptAtmosphereForArchetype(arch) {
      if (!arch) return;
      const modeBadge = document.querySelector('.mode-badge span:last-child');
      const headerSub = document.querySelector('.header-subtitle');
      const mainCamLabel = document.querySelector('.camera-main .frame-label span:last-child');
      
      if (arch === 'cozy') {
        if (modeBadge && (modeBadge.textContent.includes('MAKER') || modeBadge.textContent.includes('GAMER') || modeBadge.textContent.includes('MODE'))) {
          modeBadge.textContent = 'COZY CHILL';
        }
        if (headerSub && (headerSub.textContent.includes('RASPBERRY') || headerSub.textContent.includes('ELECTRÓNICA') || headerSub.textContent.includes('MATCH'))) {
          headerSub.textContent = 'Música Lo-Fi · Charla Relajada · Café';
        }
        if (mainCamLabel && (mainCamLabel.textContent.includes('CENITAL') || mainCamLabel.textContent.includes('OVERVIEW'))) {
          mainCamLabel.textContent = 'Cámara Principal';
        }
      } else if (arch === 'gamer') {
        if (modeBadge && (modeBadge.textContent.includes('MAKER') || modeBadge.textContent.includes('COZY') || modeBadge.textContent.includes('CHILL'))) {
          modeBadge.textContent = 'ESPORTS HUD';
        }
        if (headerSub && (headerSub.textContent.includes('RASPBERRY') || headerSub.textContent.includes('Música') || headerSub.textContent.includes('Café'))) {
          headerSub.textContent = 'LIVE MATCH // COMPETITIVE TOURNAMENT';
        }
        if (mainCamLabel && (mainCamLabel.textContent.includes('CENITAL') || mainCamLabel.textContent.includes('Principal'))) {
          mainCamLabel.textContent = 'CAM 01 // OVERVIEW';
        }
      } else if (arch === 'maker') {
        if (modeBadge && (modeBadge.textContent.includes('ESPORTS') || modeBadge.textContent.includes('COZY') || modeBadge.textContent.includes('CHILL'))) {
          modeBadge.textContent = 'MAKER MODE';
        }
        if (headerSub && (headerSub.textContent.includes('LIVE MATCH') || headerSub.textContent.includes('Música'))) {
          headerSub.textContent = 'RASPBERRY PI / ELECTRÓNICA / PROGRAMACIÓN';
        }
        if (mainCamLabel && mainCamLabel.textContent.includes('OVERVIEW')) {
          mainCamLabel.textContent = 'CÁMARA CENITAL · BANCO DE TRABAJO';
        }
      }
    }

    function applyActiveThemeToBody(themeName) {
      if (!themeName) return;
      document.body.setAttribute('data-theme', themeName);
      const arch = getThemeArchetype(themeName);
      if (arch) {
        document.body.setAttribute('data-theme-archetype', arch);
        adaptAtmosphereForArchetype(arch);
      }
    }

    const currentSceneKey = detectCurrentSceneKey();
    const currentPack = detectCurrentPack();
    document.body.setAttribute('data-pack', currentPack);
    if (currentSceneKey) {
      document.body.setAttribute('data-scene', currentSceneKey);
    }

    // 1.2 Resolución y aplicación de temas dinámicos
    const urlParams = new URLSearchParams(window.location.search);
    const inOBS = typeof window.obsstudio !== 'undefined';
    const rawUrlTheme = urlParams.get('theme');
    const themeFromUrl = (inOBS && urlParams.get('lockTheme') !== '1') ? null : rawUrlTheme;
    let activeTheme = themeFromUrl;
    if (!activeTheme && config.overlayThemes && currentSceneKey && config.overlayThemes[currentSceneKey]) {
      activeTheme = config.overlayThemes[currentSceneKey];
    }
    if (!activeTheme) {
      if (currentPack === 'cozy') activeTheme = 'latte_caramel';
      else if (currentPack === 'gamer') activeTheme = 'cyber_glitch';
      else if (currentPack === 'openstream') activeTheme = 'neon_streamer';
      else activeTheme = config.activeTheme || config.themeName || 'maker';
    }
    if (activeTheme) {
      applyActiveThemeToBody(activeTheme);
    }

    // Consultar mapeo de temas por escena desde el servidor local
    function syncThemeFromServer() {
      if (themeFromUrl) return;
      fetch('/api/themes/packs', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const fallbackByPack = (currentPack === 'cozy' ? 'latte_caramel' : (currentPack === 'gamer' ? 'cyber_glitch' : (currentPack === 'openstream' ? 'neon_streamer' : data.activeTheme)));
          const t = (data.overlayThemes && currentSceneKey && data.overlayThemes[currentSceneKey]) || fallbackByPack;
          if (t) applyActiveThemeToBody(t);
        })
        .catch(() => {});
    }

    function syncTextsFromServer() {
      fetch('/api/overlays/texts', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data && data.texts) applyConfigToDOM(data.texts); })
        .catch(() => { /* Modo offline o standalone en OBS */ });
    }
    syncThemeFromServer();

    // 2. Detección de entorno: OBS Studio vs Navegador Web normal
    const isOBS = inOBS;
    if (!isOBS && !document.body.classList.contains('catalog-body')) {
      document.body.classList.add('browser-preview-mode');
      setupFullScreenEditor(currentSceneKey);
    }

    // 3. Cargar dom-injector y aplicar configuración base
    ensureScript('dom-injector.js', () => window.OSSDomInjector).then(() => {
      applyConfigToDOM(config);
      syncTextsFromServer();
    });

    // 4. Escuchar cambios de temas y textos en vivo vía WebSocket local (con reconexión)
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = window.location.port || '8080';
    let wsRetry = 0;
    function connectLiveSocket() {
      let ws;
      try {
        ws = new WebSocket(`ws://${wsHost}:${wsPort}/ws`);
      } catch (e) { return; }
      ws.onopen = () => {
        if (wsRetry > 0) { syncThemeFromServer(); syncTextsFromServer(); }
        wsRetry = 0;
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'overlay_theme_change' && msg.theme) {
            if (!msg.overlayKey || msg.overlayKey === currentSceneKey) {
              if (!themeFromUrl) applyActiveThemeToBody(msg.theme);
            }
          } else if (msg.type === 'theme_change') {
            syncThemeFromServer();
          } else if (msg.type === 'overlay_texts_update' && msg.texts) {
            applyConfigToDOM(msg.texts);
          } else if (msg.type === 'overlay_backdrop_change' && msg.backdrop) {
            if (window.OSSAperture) window.OSSAperture.setBackdrop(msg.backdrop);
          }
        } catch (err) {}
      };
      ws.onclose = () => {
        wsRetry++;
        setTimeout(connectLiveSocket, Math.min(10000, 1000 * wsRetry));
      };
    }
    connectLiveSocket();
  }

  // Delegado para el editor en pantalla completa (cargado bajo demanda en navegador web)
  function setupFullScreenEditor(sceneKey) {
    if (typeof window.obsstudio !== 'undefined') return;
    if (typeof window.setupFullScreenEditor === 'function' && window.setupFullScreenEditor !== setupFullScreenEditor) {
      window.setupFullScreenEditor(sceneKey, { applyConfigToDOM });
      return;
    }
    const editorSrc = basePath + 'editor.js';
    const script = document.createElement('script');
    script.src = editorSrc;
    script.onload = () => {
      if (typeof window.setupFullScreenEditor === 'function' && window.setupFullScreenEditor !== setupFullScreenEditor) {
        window.setupFullScreenEditor(sceneKey, { applyConfigToDOM });
      }
    };
    document.head.appendChild(script);
  }

  function showHudToast(msg) {
    if (window.OSSEditor && typeof window.OSSEditor.showHudToast === 'function') {
      window.OSSEditor.showHudToast(msg);
      return;
    }
    const prev = document.querySelector('.hud-toast');
    if (prev) prev.remove();
    const toast = document.createElement('div');
    toast.className = 'hud-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Exportar utilidades globales
  window.OSSOverlay = {
    init: initOverlay,
    get icons() { return window.OSSIcons || {}; },
    applyConfigToDOM: applyConfigToDOM,
    showHudToast: showHudToast
  };
  window.applyConfigToDOM = applyConfigToDOM;

  // Autoejecutar al cargar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOverlay);
  } else {
    initOverlay();
  }
})();
