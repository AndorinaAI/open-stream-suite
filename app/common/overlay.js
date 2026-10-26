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
      if (document.body.dataset.scene) return document.body.dataset.scene;
      if (document.body.dataset.mode) return document.body.dataset.mode;
      const m = p.match(/\/overlays\/(?:screens\/)?([^/]+)/);
      if (m && m[1]) return m[1];
      return null;
    }

    function detectCurrentPack() {
      const raw = (document.body.dataset.pack || '').toLowerCase();
      const p = (window.location.pathname || '').toLowerCase();
      const combined = raw + ' ' + p;
      if (combined.includes('cozy')) return 'cozy';
      if (combined.includes('gamer')) return 'gamer';
      if (combined.includes('openstream') || combined.includes('open_stream')) return 'openstream';
      if (combined.includes('maker') || combined.includes('print') || combined.includes('taller')) return 'maker';
      const m = p.match(/\/streamthemes\/([^/]+)/);
      if (m && m[1]) {
        const sl = m[1].toLowerCase();
        if (sl.includes('cozy')) return 'cozy';
        if (sl.includes('gamer')) return 'gamer';
        if (sl.includes('openstream')) return 'openstream';
        if (sl.includes('maker')) return 'maker';
      }
      return 'maker';
    }

    window.__THEME_ARCHETYPES = window.__THEME_ARCHETYPES || {};

    function getThemeArchetype(themeName) {
      if (!themeName) return null;
      if (window.__THEME_ARCHETYPES && window.__THEME_ARCHETYPES[themeName]) {
        return window.__THEME_ARCHETYPES[themeName];
      }
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
      return 'openstream';
    }

    function tagSemanticElements() {
      // 1. Cámaras y visores
      const camSelectors = [
        '.camera-frame', '.cam-frame', '.camera-main', '.camera-face', '.camera-aux',
        '.cam-box', '.hud-cam-box', '.stream-frame', '.polaroid-frame', '.canvas-frame',
        '.face-frame', '.desktop-main-viewport', '.gameplay-box', '.game-box',
        '.game-viewport-box', '.runner-cam-box', '.stream-cam-card', '.pip-cam-box',
        '[data-cutout="true"]'
      ];
      document.querySelectorAll(camSelectors.join(',')).forEach(el => {
        if (!el.hasAttribute('data-oss-cam')) {
          const isSmall = el.matches('.camera-face, .camera-aux, .pip-cam-box, .runner-cam-box, .host-cam-frame, .guest-cam-frame');
          el.setAttribute('data-oss-cam', isSmall ? 'secondary' : 'main');
        }
      });

      // 2. Paneles, tarjetas y contenedores de información
      const panelSelectors = [
        '.side-info-panel', '.side-panel-box', '.panel-card', '.pomodoro-card',
        '.tasks-card', '.cozy-chat-card', '.hud-chat-box', '.stream-chat-card',
        '.stream-info-card', '.splits-board', '.tactical-panel', '.victory-podium',
        '.chat-panel-frame', '.warm-card', '.starting-side-modes', '.match-hero-card',
        '.agenda-card', '.project-card', '.canvas-card', '.art-palette-card',
        '.ending-farewell-card'
      ];
      document.querySelectorAll(panelSelectors.join(',')).forEach(el => {
        if (!el.hasAttribute('data-oss-panel')) {
          el.setAttribute('data-oss-panel', 'true');
        }
      });

      // 3. Barras de cabecera y pie de página
      document.querySelectorAll('.scene-header, .tactical-telemetry-bar, .broadcast-header, .header-bar, .lofi-player-bar, .arena-top-bar, .top-bar, .hud-top-bar, .game-tag-bar, .starting-top-bar').forEach(el => {
        if (!el.hasAttribute('data-oss-bar')) el.setAttribute('data-oss-bar', 'top');
      });
      document.querySelectorAll('.bottom-project-bar, .daily-goal-pill, .now-playing-pill, .tools-palette-bar, .bottom-hud-bar, .broadcast-footer, .footer-bar, .ticker-bar').forEach(el => {
        if (!el.hasAttribute('data-oss-bar')) el.setAttribute('data-oss-bar', 'bottom');
      });

      // 4. Badges, etiquetas y chips
      document.querySelectorAll('.mode-badge, .frame-label, .live-match-chip, .cam-header-tag, .cam-footer-tag, .on-air-pill, .live-badge, .chat-live-badge, .pomo-badge, .ambient-pill, .canvas-tag, .phase-item, .phase-step, .brand-badge, .live-indicator, .prep-pill, .screen-pill, .clutch-badge, .match-badge, .sponsor-badge, .cam-label').forEach(el => {
        if (!el.hasAttribute('data-oss-badge')) el.setAttribute('data-oss-badge', 'true');
      });

      // 5. Visores interiores de cámara (transparent cutouts)
      const viewportSelectors = [
        '.cam-inner-viewport', '.cam-viewport', '.cam-inner-box',
        '.face-viewport', '.desk-viewport', '.desk-cam',
        '.cam-screen-area', '.viewport-window', '.camera-feed'
      ];
      document.querySelectorAll(viewportSelectors.join(',')).forEach(el => {
        if (!el.hasAttribute('data-oss-viewport')) el.setAttribute('data-oss-viewport', 'true');
      });

      // 6. Etiquetas y títulos de cámara (adaptables a chinchetas, polaroid, etc.)
      const camLabelSelectors = [
        '.cam-header-tag', '.cam-footer-tag', '.polaroid-handwritten',
        '.canvas-tag', '.cam-label', '.camera-main .frame-label',
        '.camera-frame .frame-label', '.stream-cam-card .frame-label'
      ];
      document.querySelectorAll(camLabelSelectors.join(',')).forEach(el => {
        if (!el.hasAttribute('data-oss-cam-label')) el.setAttribute('data-oss-cam-label', 'true');
      });

      // 7. Detección y etiquetado automático de orientación (horizontal vs vertical)
      document.querySelectorAll('[data-oss-cam], [data-oss-panel], [data-oss-bar]').forEach(el => {
        if (!el.hasAttribute('data-oss-orientation')) {
          const barType = el.getAttribute('data-oss-bar');
          if (barType === 'left' || barType === 'right') {
            el.setAttribute('data-oss-orientation', 'vertical');
          } else if (barType === 'top' || barType === 'bottom') {
            el.setAttribute('data-oss-orientation', 'horizontal');
          } else {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const isVertical = rect.height > rect.width * 1.05;
              el.setAttribute('data-oss-orientation', isVertical ? 'vertical' : 'horizontal');
            }
          }
        }
      });
    }

    const SHAPE_ARCHETYPE_MAP = {
      cozy_polaroid: 'cozy',
      cozy_canvas: 'cozy',
      cozy_soft: 'cozy',
      cozy: 'cozy',
      gamer_mecha: 'gamer',
      gamer_tactical_hud: 'gamer',
      gamer_stealth: 'gamer',
      gamer_hex_shield: 'gamer',
      gamer_cyber_glitch: 'gamer',
      gamer_arcade_retro: 'gamer',
      gamer: 'gamer',
      maker_blueprint: 'maker',
      maker_workbench: 'maker',
      maker_circuit_pcb: 'maker',
      maker: 'maker',
      openstream_glass: 'openstream',
      openstream_studio: 'openstream',
      openstream: 'openstream',
      fantasy_parchment: 'cozy',
      fantasy_runic_stone: 'gamer',
      gothic_vampire: 'gamer',
      comic_manga_action: 'openstream',
      pop_synth_neon: 'openstream',
      vintage_crt_monitor: 'cozy',
    };

    const ARCHETYPE_DEFAULT_SHAPE_MAP = {
      cozy: 'cozy_polaroid',
      gamer: 'gamer_mecha',
      maker: 'maker_blueprint',
      openstream: 'openstream_glass',
    };

    function resolveArchetypeAndShape(theme, shape) {
      const normPack = detectCurrentPack();
      if (shape === 'original') {
        return {
          archetype: normPack,
          shape: 'original',
          mode: 'original',
          effectiveShape: 'original'
        };
      }
      if (shape && shape !== 'auto' && shape !== '__auto__' && shape !== 'none' && shape !== 'null') {
        const arch = SHAPE_ARCHETYPE_MAP[shape] || getThemeArchetype(theme) || normPack;
        return {
          archetype: arch,
          shape: shape,
          mode: 'manual',
          effectiveShape: shape
        };
      }
      // Modo auto: Si el tema corresponde al pack nativo de la escena, mantener la forma original nativa
      const themeArch = getThemeArchetype(theme) || normPack;
      if (themeArch === normPack) {
        return {
          archetype: normPack,
          shape: 'auto',
          mode: 'auto',
          effectiveShape: 'original'
        };
      }
      // Si el tema es de un pack diferente (fusión / crossover), aplicar la forma del arquetipo
      const effectiveShape = ARCHETYPE_DEFAULT_SHAPE_MAP[themeArch] || 'openstream_glass';
      return {
        archetype: themeArch,
        shape: 'auto',
        mode: 'auto',
        effectiveShape: effectiveShape
      };
    }

    /**
     * Escribe un rótulo solo si el texto cabe en su contenedor.
     *
     * Los rótulos de ventana (cabeceras de panel, badges, subtítulos) tienen ancho
     * fijo con `overflow: hidden`, así que sustituir un texto corto por otro largo
     * (p.ej. 'CAM 01 // OVERVIEW' -> 'CÁMARA CENITAL · BANCO DE TRABAJO') dejaba el
     * título CORTADO. Si el texto nuevo desborda, se conserva el original.
     */
    function setFittedText(el, text) {
      if (!el || !text) return false;
      const original = el.textContent;
      if (original === text) return true;
      el.textContent = text;
      const fits = el.scrollWidth <= el.clientWidth + 1 || el.clientWidth === 0;
      if (!fits) {
        el.textContent = original;
        return false;
      }
      return true;
    }

    function adaptAtmosphereForArchetype(arch, effectiveShape) {
      if (!arch) return;
      tagSemanticElements();
      const modeBadge = document.querySelector('.mode-badge span:last-child, .live-match-chip, .live-badge');
      const headerSub = document.querySelector('.header-subtitle, .track-author, .episode-tag');
      const mainCamLabel = document.querySelector('.camera-main .frame-label span:last-child, .cam-label');

      if (arch === 'cozy') {
        if (modeBadge && (modeBadge.textContent.includes('MAKER') || modeBadge.textContent.includes('GAMER') || modeBadge.textContent.includes('MODE') || modeBadge.textContent.includes('LIVE'))) {
          setFittedText(modeBadge, 'COZY CHILL');
        }
        if (headerSub && (headerSub.textContent.includes('RASPBERRY') || headerSub.textContent.includes('ELECTRÓNICA') || headerSub.textContent.includes('MATCH') || headerSub.textContent.includes('COMPETITIVE'))) {
          setFittedText(headerSub, 'Música Lo-Fi · Charla Relajada · Café');
        }
        if (mainCamLabel && (mainCamLabel.textContent.includes('CENITAL') || mainCamLabel.textContent.includes('OVERVIEW') || mainCamLabel.textContent.includes('RUNNER'))) {
          setFittedText(mainCamLabel, 'Cámara Principal');
        }
      } else if (arch === 'gamer') {
        if (modeBadge && (modeBadge.textContent.includes('MAKER') || modeBadge.textContent.includes('COZY') || modeBadge.textContent.includes('CHILL'))) {
          setFittedText(modeBadge, 'ESPORTS HUD');
        }
        if (headerSub && (headerSub.textContent.includes('RASPBERRY') || headerSub.textContent.includes('Música') || headerSub.textContent.includes('Café'))) {
          setFittedText(headerSub, 'LIVE MATCH // COMPETITIVE TOURNAMENT');
        }
        if (mainCamLabel && (mainCamLabel.textContent.includes('CENITAL') || mainCamLabel.textContent.includes('Principal'))) {
          setFittedText(mainCamLabel, 'CAM 01 // OVERVIEW');
        }
      } else if (arch === 'maker') {
        if (modeBadge && (modeBadge.textContent.includes('ESPORTS') || modeBadge.textContent.includes('COZY') || modeBadge.textContent.includes('CHILL') || modeBadge.textContent.includes('HUD'))) {
          setFittedText(modeBadge, 'MAKER MODE');
        }
        if (headerSub && (headerSub.textContent.includes('LIVE MATCH') || headerSub.textContent.includes('Música') || headerSub.textContent.includes('Café'))) {
          setFittedText(headerSub, 'RASPBERRY PI / ELECTRÓNICA / PROGRAMACIÓN');
        }
        if (mainCamLabel && (mainCamLabel.textContent.includes('OVERVIEW') || mainCamLabel.textContent.includes('Principal'))) {
          setFittedText(mainCamLabel, 'CÁMARA CENITAL · BANCO DE TRABAJO');
        }
      } else if (arch === 'openstream') {
        if (modeBadge && (modeBadge.textContent.includes('MAKER') || modeBadge.textContent.includes('COZY') || modeBadge.textContent.includes('ESPORTS'))) {
          setFittedText(modeBadge, 'BROADCAST');
        }
      }
    }
    window.setFittedText = setFittedText;

    function applyActiveShapeToBody(shapeName) {
      if (typeof updateOverlayThemeAndShape === 'function') {
        updateOverlayThemeAndShape(activeTheme, shapeName);
      }
    }
    window.applyActiveShapeToBody = applyActiveShapeToBody;

    function applyActiveThemeToBody(themeName, updateShape = true) {
      if (!themeName) return;
      activeTheme = themeName;
      if (updateShape) {
        if (typeof updateOverlayThemeAndShape === 'function') {
          updateOverlayThemeAndShape(themeName, activeShape);
        }
      } else {
        document.body.setAttribute('data-theme', themeName);
      }
    }
    window.applyActiveThemeToBody = applyActiveThemeToBody;

    const currentSceneKey = detectCurrentSceneKey();
    const currentPack = detectCurrentPack();
    document.body.setAttribute('data-pack', currentPack);
    if (currentSceneKey) {
      document.body.setAttribute('data-scene', currentSceneKey);
      window.__CURRENT_SCENE_KEY__ = currentSceneKey;
    }

    // 1.2 Resolución inicial y control de bloqueo por URL
    const urlParams = new URLSearchParams(window.location.search);
    const inOBS = typeof window.obsstudio !== 'undefined';
    const rawUrlTheme = urlParams.get('theme');
    const rawUrlShape = urlParams.get('shape');
    // lock=1 o lockTheme=1 congela la escena permanentemente a lo que diga la URL
    const isLocked = urlParams.get('lock') === '1' || urlParams.get('lockTheme') === '1';

    const explicitThemes = config.overlayThemeExplicit || {};
    let hasExplicitTheme = !!(currentSceneKey && explicitThemes[currentSceneKey]);
    let activeGlobalTheme = config.globalThemeActive ? (config.activeTheme || null) : null;
    let activeTheme = rawUrlTheme;
    if (!activeTheme && currentSceneKey) {
      // Asignación explícita > tema global > valor de fábrica de la escena/pack.
      if (hasExplicitTheme && config.overlayThemes && config.overlayThemes[currentSceneKey]) {
        activeTheme = config.overlayThemes[currentSceneKey];
      } else if (config.globalThemeActive && config.activeTheme) {
        activeTheme = config.activeTheme;
      } else if (config.overlayThemes && config.overlayThemes[currentSceneKey]) {
        activeTheme = config.overlayThemes[currentSceneKey];
      }
    }
    if (!activeTheme) {
      if (currentPack === 'cozy') activeTheme = 'latte_caramel';
      else if (currentPack === 'gamer') activeTheme = 'cyber_glitch';
      else if (currentPack === 'openstream') activeTheme = 'neon_streamer';
      else activeTheme = config.activeTheme || config.themeName || 'maker';
    }

    let activeShape = rawUrlShape;
    if (!activeShape && config.overlayShapes && currentSceneKey && config.overlayShapes[currentSceneKey]) {
      activeShape = config.overlayShapes[currentSceneKey];
    }

    // Una sola fuente: el servidor publica los 27 defaults canónicos en
    // config.defaultOverlayThemes. Si el config es antiguo, overlayThemes ya
    // contiene los valores de fábrica de cada escena.
    const DEFAULT_OVERLAY_THEMES = Object.assign(
      {},
      config.defaultOverlayThemes || config.overlayThemes || {}
    );
    window.__DEFAULT_OVERLAY_THEMES = DEFAULT_OVERLAY_THEMES;

    function updateOverlayThemeAndShape(newTheme, newShape) {
      if (newTheme) {
        activeTheme = newTheme;
        document.body.setAttribute('data-theme', newTheme);
      }
      if (newShape !== undefined) {
        activeShape = (newShape === null || newShape === '' || newShape === 'none') ? 'original' : newShape;
      }
      const res = resolveArchetypeAndShape(activeTheme, activeShape);

      // Idempotencia: si el tema y la forma resueltos no cambian, no se vuelve a
      // ejecutar el pipeline pesado (rótulos + etiquetado + recálculo de
      // aperturas). Ese re-pipeline se disparaba SIEMPRE al abrir una escena
      // (el HTML declara un data-theme y `syncThemeFromServer()` lo re-aplicaba
      // después del primer pintado) y era la causa de que los elementos
      // apareciesen descolocados y se "recolocasen" al cambiar de escena.
      const applied = window.__OSS_APPLIED_THEME__;
      if (applied && applied.theme === activeTheme && applied.shape === res.effectiveShape
          && applied.archetype === res.archetype && applied.mode === res.mode) {
        return;
      }
      window.__OSS_APPLIED_THEME__ = {
        theme: activeTheme, shape: res.effectiveShape, archetype: res.archetype, mode: res.mode
      };

      document.body.setAttribute('data-theme-archetype', res.archetype);
      document.body.setAttribute('data-theme-shape-mode', res.mode);
      document.body.setAttribute('data-theme-shape', res.effectiveShape);

      adaptAtmosphereForArchetype(res.archetype, res.effectiveShape);
      tagSemanticElements();

      // Recalcular aperturas SVG para cámaras/fondos
      if (window.OSSAperture && typeof window.OSSAperture.recalculateApertures === 'function') {
        window.OSSAperture.recalculateApertures();
      }

      try {
        window.dispatchEvent(new CustomEvent('oss:themechange', {
          detail: {
            theme: activeTheme,
            shape: activeShape,
            effectiveShape: res.effectiveShape,
            mode: res.mode,
            archetype: res.archetype
          }
        }));
      } catch (e) {}
    }
    window.updateOverlayThemeAndShape = updateOverlayThemeAndShape;

    // Inicializar semántica y tema activo
    tagSemanticElements();
    updateOverlayThemeAndShape(activeTheme, activeShape);

    // Observador para etiquetar elementos dinámicos automáticamente
    let tagDebounce = null;
    try {
      const observer = new MutationObserver(() => {
        if (tagDebounce) clearTimeout(tagDebounce);
        tagDebounce = setTimeout(() => {
          tagSemanticElements();
        }, 80);
      });
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    } catch (e) {}

    // Consultar mapeo de temas y formas por escena desde el servidor local
    function syncThemeFromServer() {
      fetch('/api/themes/packs', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          if (data.packs) {
            data.packs.forEach(p => {
              const pArch = p.archetype || getThemeArchetype(p.id);
              (p.themes || []).forEach(th => {
                window.__THEME_ARCHETYPES[th.id] = th.archetype || pArch || getThemeArchetype(th.id);
              });
            });
          }
          if (isLocked) return;
          let th = null;
          let sh = null;
          const explicitMap = data.overlayThemeExplicit || {};
          if (currentSceneKey) hasExplicitTheme = !!explicitMap[currentSceneKey];
          activeGlobalTheme = data.globalThemeActive ? (data.activeTheme || null) : null;
          if (!rawUrlTheme && currentSceneKey) {
            if (hasExplicitTheme && data.overlayThemes && data.overlayThemes[currentSceneKey]) {
              th = data.overlayThemes[currentSceneKey];
            } else if (data.globalThemeActive && data.activeTheme) {
              th = data.activeTheme;
            } else if (data.overlayThemes && data.overlayThemes[currentSceneKey]) {
              th = data.overlayThemes[currentSceneKey];
            }
          }
          if (!rawUrlShape && data.overlayShapes && currentSceneKey && data.overlayShapes[currentSceneKey]) {
            sh = data.overlayShapes[currentSceneKey];
          }
          if (!sh && !rawUrlShape && data.activeShape) {
            sh = data.activeShape;
          }
          if (th || sh) {
            updateOverlayThemeAndShape(th, sh);
          } else if (activeTheme) {
            updateOverlayThemeAndShape(activeTheme, activeShape);
          }
          if (data.backdrops && currentSceneKey && data.backdrops[currentSceneKey] && window.OSSAperture) {
            window.OSSAperture.setBackdrop(data.backdrops[currentSceneKey]);
          }
        })
        .catch(() => {});
    }

    // Idioma de la escena: manda el parámetro `?lang=` de la URL (lo que se pega
    // en OBS) y, si no hay, el idioma elegido en el panel (`oss-lang`).
    function currentLang() {
      try {
        const fromUrl = new URLSearchParams(window.location.search).get('lang');
        if (fromUrl) return String(fromUrl).toLowerCase();
        if (typeof localStorage === 'undefined') return '';
        return String(localStorage.getItem('oss-lang') || '').toLowerCase();
      } catch (e) {
        return '';
      }
    }

    function syncTextsFromServer() {
      // Antes se pedía `/api/overlays/texts` sin el idioma, así que el `?lang=en`
      // documentado en las guías nunca llegaba a la escena de OBS.
      const lang = currentLang();
      const endpoint = lang ? `/api/overlays/texts?lang=${encodeURIComponent(lang)}` : '/api/overlays/texts';
      fetch(endpoint, { cache: 'no-store' })
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
      tagSemanticElements();
    });

    // 4. Escuchar cambios de temas y textos en vivo vía WebSocket local (con reconexión)
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = window.location.port ? `:${window.location.port}` : '';
    let wsRetry = 0;
    function connectLiveSocket() {
      let ws;
      try {
        ws = new WebSocket(`${wsProto}//${wsHost}${wsPort}/ws`);
      } catch (e) { return; }
      ws.onopen = () => {
        if (wsRetry > 0) { syncThemeFromServer(); syncTextsFromServer(); }
        wsRetry = 0;
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'overlay_theme_change') {
            if (!msg.overlayKey || msg.overlayKey === currentSceneKey) {
              hasExplicitTheme = !!msg.explicit;
              if (!isLocked) {
                const nextShape = (msg.shape !== undefined && msg.shape !== null) ? msg.shape : activeShape;
                // Tras un reset, si hay tema global activo, se recupera de inmediato.
                const nextTheme = (!hasExplicitTheme && activeGlobalTheme) ? activeGlobalTheme : msg.theme;
                updateOverlayThemeAndShape(nextTheme, nextShape);
              }
            }
          } else if (msg.type === 'theme_change') {
            // Una asignación explícita de esta escena gana al tema global.
            activeGlobalTheme = msg.theme || null;
            if (!isLocked && !hasExplicitTheme) {
              const nextShape = (msg.shape !== undefined && msg.shape !== null) ? msg.shape : activeShape;
              updateOverlayThemeAndShape(msg.theme, nextShape);
            }
          } else if (msg.type === 'global_shape_change') {
            if (!isLocked) {
              updateOverlayThemeAndShape(null, msg.shape);
            }
          } else if ((msg.type === 'overlay_texts_update' || msg.type === 'overlay_texts_updated') && msg.texts) {
            // Con un idioma distinto al español el evento en vivo trae los textos
            // guardados (ES): se vuelven a pedir en el idioma de la escena para no
            // revertir una escena en inglés.
            const liveLang = currentLang();
            if (liveLang && liveLang !== 'es') syncTextsFromServer();
            else applyConfigToDOM(msg.texts);
          } else if (msg.type === 'overlay_backdrop_change' && msg.backdrop) {
            if (!msg.overlayKey || msg.overlayKey === currentSceneKey) {
              if (window.OSSAperture) window.OSSAperture.setBackdrop(msg.backdrop);
            }
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
