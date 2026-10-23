/**
 * app/common/overlay/editor/04-phrases-theme.js
 * Gestión de frases rotativas (BRB), selector de temas, fases de proyecto (Maker/Print) y cámaras podcast.
 */

window.OSSEditor = window.OSSEditor || {};

(function() {
  function isBrbScene(sceneKey) {
    return ['beRightBack', 'oss_brb', 'gamer_brb', 'cozy_brb'].includes(sceneKey)
      || window.location.pathname.includes('/be-right-back/')
      || document.querySelector('.brb-status-phrase, .brb-container, [data-brb="true"]') !== null;
  }

  function setupPhrases(sceneKey) {
    if (!isBrbScene(sceneKey)) return null;
    if (document.getElementById('oss-brb-phrases-control')) return document.getElementById('oss-brb-phrases-control');

    const phrasesControl = document.createElement('div');
    phrasesControl.id = 'oss-brb-phrases-control';
    phrasesControl.style.cssText = `
      position: fixed; top: 50%; right: 18px; transform: translateY(-50%);
      z-index: 999998; background: rgba(14,18,24,0.96); backdrop-filter: blur(14px);
      border: 1px solid rgba(87,214,196,0.45); border-radius: 8px;
      padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: #F0F6FC; box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(87,214,196,0.15);
      display: none; flex-direction: column; gap: 10px; width: 260px;
    `;
    phrasesControl.innerHTML = `
      <div class="hud-drag-handle" style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; display:flex; justify-content:space-between; align-items:center; cursor:grab;" title="Arrastra desde aquí para mover este menú">
        <span>🔄 FRASES EN ROTACIÓN</span>
        <span style="display:flex; align-items:center; gap:6px;">
          <span id="oss-brb-phrase-counter" style="font-size:10px; color:#8B949E;">1 / 1</span>
          <span style="color:#6E7681; font-size:11px;">⋮⋮</span>
          <button type="button" id="oss-brb-close" style="background:none; border:none; color:#8B949E; cursor:pointer; font-size:12px; padding:0 2px; line-height:1;" title="Cerrar panel">✕</button>
        </span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <button id="oss-brb-prev-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center; padding:3px 6px;">◀ Anterior</button>
        <button id="oss-brb-next-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center; padding:3px 6px;">Siguiente ▶</button>
      </div>
      <label style="display:flex; flex-direction:column; gap:4px;">
        <span style="color:#8B949E; font-size:10px;">EDITAR FRASE SELECCIONADA:</span>
        <textarea id="oss-brb-active-text" rows="2"
          style="width:100%; box-sizing:border-box; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                 border-radius:4px; padding:6px 8px; font-size:12px; font-family:inherit; outline:none; resize:none;"
        ></textarea>
      </label>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <span style="color:#8B949E; font-size:10px;">CAMBIAR CADA:</span>
        <div style="display:flex; align-items:center; gap:4px;">
          <input id="oss-brb-interval" type="number" min="2" max="60" value="6"
            style="width:45px; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                   border-radius:4px; padding:3px 6px; font-size:11px; font-family:inherit; text-align:center;"
          >
          <span style="color:#8B949E; font-size:10px;">seg</span>
        </div>
      </div>
      <div style="display:flex; gap:6px;">
        <button id="oss-brb-add-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center;">➕ Añadir</button>
        <button id="oss-brb-delete-phrase" type="button" class="hud-btn" style="flex:1; justify-content:center; color:#F85149;">🗑️ Borrar</button>
        <button id="oss-brb-save-phrases" type="button" class="hud-btn btn-save" style="flex:1.2; justify-content:center;">💾 Guardar</button>
      </div>
    `;
    document.body.appendChild(phrasesControl);

    let currentPhrases = [
      'TOMANDO UN CAFÉ...',
      'PREPARANDO TODO...',
      'PROBANDO COSAS...',
      'VOLVEMOS ENSEGUIDA'
    ];
    let activeIndex = 0;

    const syncPhrasesUI = () => {
      const cfg = window.OSS_CONFIG || window.TALLER_CONFIG;
      if (cfg?.beRightBack?.statusPhrases?.length) {
        currentPhrases = [...cfg.beRightBack.statusPhrases];
      }
      if (cfg?.beRightBack?.phraseIntervalSeconds) {
        const inpInt = document.getElementById('oss-brb-interval');
        if (inpInt) inpInt.value = cfg.beRightBack.phraseIntervalSeconds;
      }
      renderCurrentPhrase();
    };

    const renderCurrentPhrase = () => {
      if (activeIndex >= currentPhrases.length) activeIndex = 0;
      if (activeIndex < 0) activeIndex = Math.max(0, currentPhrases.length - 1);
      const counter = document.getElementById('oss-brb-phrase-counter');
      const txtArea = document.getElementById('oss-brb-active-text');
      if (counter) counter.textContent = `${activeIndex + 1} / ${currentPhrases.length}`;
      if (txtArea) txtArea.value = currentPhrases[activeIndex] || '';
      const brbEl = document.querySelector('.brb-status-phrase');
      if (brbEl && currentPhrases[activeIndex]) {
        brbEl.textContent = currentPhrases[activeIndex];
      }
    };

    setTimeout(syncPhrasesUI, 800);

    document.getElementById('oss-brb-prev-phrase')?.addEventListener('click', () => {
      window.__OSS_IS_EDITING__ = true;
      activeIndex = (activeIndex - 1 + currentPhrases.length) % currentPhrases.length;
      renderCurrentPhrase();
    });

    document.getElementById('oss-brb-next-phrase')?.addEventListener('click', () => {
      window.__OSS_IS_EDITING__ = true;
      activeIndex = (activeIndex + 1) % currentPhrases.length;
      renderCurrentPhrase();
    });

    document.getElementById('oss-brb-active-text')?.addEventListener('input', (e) => {
      window.__OSS_IS_EDITING__ = true;
      currentPhrases[activeIndex] = e.target.value;
      const brbEl = document.querySelector('.brb-status-phrase');
      if (brbEl) brbEl.textContent = e.target.value;
    });

    document.getElementById('oss-brb-add-phrase')?.addEventListener('click', () => {
      window.__OSS_IS_EDITING__ = true;
      currentPhrases.push('NUEVA FRASE EN ROTACIÓN...');
      activeIndex = currentPhrases.length - 1;
      renderCurrentPhrase();
      window.OSSEditor.showHudToast('➕ Nueva frase añadida a la lista');
    });

    document.getElementById('oss-brb-delete-phrase')?.addEventListener('click', () => {
      if (currentPhrases.length <= 1) {
        window.OSSEditor.showHudToast('⚠️ Debe haber al menos una frase');
        return;
      }
      window.__OSS_IS_EDITING__ = true;
      currentPhrases.splice(activeIndex, 1);
      if (activeIndex >= currentPhrases.length) activeIndex = currentPhrases.length - 1;
      renderCurrentPhrase();
      window.OSSEditor.showHudToast('🗑️ Frase eliminada');
    });

    document.getElementById('oss-brb-save-phrases')?.addEventListener('click', async () => {
      try {
        const sec = parseInt(document.getElementById('oss-brb-interval')?.value) || 6;
        if (!window.OSS_CONFIG) window.OSS_CONFIG = {};
        if (!window.OSS_CONFIG.beRightBack) window.OSS_CONFIG.beRightBack = {};
        window.OSS_CONFIG.beRightBack.statusPhrases = currentPhrases.filter(Boolean);
        window.OSS_CONFIG.beRightBack.phraseIntervalSeconds = sec;

        const res = await fetch('/api/overlays/texts');
        const serverData = await res.json();
        const texts = serverData.texts || {};
        if (!texts.beRightBack) texts.beRightBack = {};
        texts.beRightBack.statusPhrases = currentPhrases.filter(Boolean);
        texts.beRightBack.phraseIntervalSeconds = sec;

        let localToken = window.__LOCAL_AUTH_TOKEN__ || (typeof localStorage !== 'undefined' ? localStorage.getItem('local_auth_token') : '') || '';
        if (!localToken) {
          try {
            const tokRes = await fetch('/api/local-token');
            if (tokRes.ok) { const td = await tokRes.json(); localToken = td.token || ''; }
          } catch(e){}
        }
        await fetch('/api/overlays/texts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(localToken ? {'X-Local-Token': localToken} : {}) },
          body: JSON.stringify({ texts })
        });
        window.OSSEditor.showHudToast('💾 Frases en rotación guardadas con éxito');
      } catch(e) {
        window.OSSEditor.showHudToast('⚠️ Error al guardar frases en el servidor');
      }
    });

    document.getElementById('oss-brb-close')?.addEventListener('click', () => {
      phrasesControl.style.display = 'none';
    });

    if (window.OSSEditor.makeDraggable) {
      window.OSSEditor.makeDraggable(phrasesControl, '.hud-drag-handle');
    }

    return phrasesControl;
  }

  function setupThemeSelector(hud, sceneKey) {
    const shapeSelect = hud.querySelector('#hud-shape-select');
    const themeSelect = hud.querySelector('#hud-theme-select');
    if (!themeSelect) return;

    const DEFAULT_OVERLAY_THEMES = window.__DEFAULT_OVERLAY_THEMES || {
      'game': 'cyberpunk',
      'maker': 'maker',
      'maker-desk': 'maker',
      'maker-pc': 'terminal',
      'print': 'print',
      'print-machine': 'print',
      'print-design': 'print',
      'chill': 'chill',
      'startingSoon': 'synthwave',
      'beRightBack': 'synthwave',
      'ending': 'synthwave',
      'oss_chatting': 'neon_streamer',
      'oss_desktop': 'clean_minimal',
      'oss_podcast': 'sunset_glow',
      'oss_starting': 'crimson_pulse',
      'oss_brb': 'emerald_matrix',
      'oss_ending': 'neon_streamer',
      'gamer_gameplay': 'cyber_glitch',
      'gamer_speedrun': 'toxic_rad',
      'gamer_victory': 'golden_glory',
      'gamer_starting': 'crimson_esport',
      'gamer_brb': 'stealth_mono',
      'gamer_ending': 'golden_glory',
      'cozy_pomodoro': 'latte_caramel',
      'cozy_art': 'sakura_sunset',
      'cozy_cafe': 'matcha_bamboo',
      'cozy_starting': 'lavender_dream',
      'cozy_brb': 'latte_caramel',
      'cozy_ending': 'nordic_twilight'
    };

    function getDefaultThemeForScene(k) {
      const sk = k || sceneKey || (typeof detectCurrentSceneKey === 'function' ? detectCurrentSceneKey() : null) || document.body.dataset.scene;
      if (sk && DEFAULT_OVERLAY_THEMES[sk]) return DEFAULT_OVERLAY_THEMES[sk];
      const p = (document.body.dataset.pack || '').toLowerCase();
      if (p.includes('cozy')) return 'latte_caramel';
      if (p.includes('gamer')) return 'cyber_glitch';
      if (p.includes('openstream') || p.includes('open_stream')) return 'neon_streamer';
      return 'maker';
    }

    async function getLocalToken() {
      if (window.__LOCAL_AUTH_TOKEN__) return window.__LOCAL_AUTH_TOKEN__;
      if (typeof localStorage !== 'undefined' && localStorage.getItem('local_auth_token')) {
        return localStorage.getItem('local_auth_token');
      }
      try {
        const r = await fetch('/api/local-token');
        if (r.ok) {
          const d = await r.json();
          if (d.token) {
            window.__LOCAL_AUTH_TOKEN__ = d.token;
            if (typeof localStorage !== 'undefined') localStorage.setItem('local_auth_token', d.token);
            return d.token;
          }
        }
      } catch (e) {}
      return '';
    }
    if (window.OSSEditor) window.OSSEditor.getLocalToken = getLocalToken;

    async function postOverlayAssignment(payload) {
      try {
        const token = await getLocalToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['X-Local-Token'] = token;
        return await fetch('/api/themes/overlay-assignment', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn('Error en postOverlayAssignment:', e);
      }
    }

    const currentUrl = new URL(window.location.href);

    // 1. Configuración del Selector de Forma Física de Escena
    if (shapeSelect) {
      const urlShape = currentUrl.searchParams.get('shape');
      const activeShape = urlShape || 'auto';
      shapeSelect.value = activeShape;

      shapeSelect.addEventListener('change', () => {
        const selectedShape = shapeSelect.value;
        const url = new URL(window.location.href);

        if (selectedShape === 'auto') {
          url.searchParams.delete('shape');
          window.history.replaceState({}, '', url.toString());
          let curTheme = themeSelect ? themeSelect.value : document.body.getAttribute('data-theme');
          if (curTheme === '__default__') curTheme = getDefaultThemeForScene(sceneKey);
          if (typeof window.updateOverlayThemeAndShape === 'function') {
            window.updateOverlayThemeAndShape(curTheme, 'auto');
          } else if (typeof window.applyActiveShapeToBody === 'function') {
            window.applyActiveShapeToBody('auto');
          }
          if (sceneKey) {
            postOverlayAssignment({ overlayKey: sceneKey, shapeId: 'auto' });
          }
          window.OSSEditor.showHudToast(`⚡ Forma sincronizada automáticamente con el tema`);
          return;
        }

        if (selectedShape === 'original') {
          url.searchParams.set('shape', 'original');
        } else {
          url.searchParams.set('shape', selectedShape);
        }
        window.history.replaceState({}, '', url.toString());

        let curTheme = themeSelect ? themeSelect.value : document.body.getAttribute('data-theme');
        if (curTheme === '__default__') curTheme = getDefaultThemeForScene(sceneKey);
        if (typeof window.updateOverlayThemeAndShape === 'function') {
          window.updateOverlayThemeAndShape(curTheme, selectedShape);
        } else if (typeof window.applyActiveShapeToBody === 'function') {
          window.applyActiveShapeToBody(selectedShape);
        }

        if (sceneKey) {
          postOverlayAssignment({ overlayKey: sceneKey, shapeId: selectedShape });
        }

        window.OSSEditor.showHudToast(`📐 Forma de escena cambiada a: ${selectedShape}`);
      });
    }

    // 2. Configuración del Selector de Paleta de Color
    fetch('/api/themes/packs')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.packs) return;
        const currentTheme = document.body.getAttribute('data-theme') || data.activeTheme || getDefaultThemeForScene();
        const defaultTheme = getDefaultThemeForScene();

        let html = `<option value="__default__" style="font-weight:700;">🔄 Color Original (${defaultTheme})</option>`;
        data.packs.forEach(p => {
          html += `<optgroup label="${p.icon || '📁'} ${p.name}">`;
          (p.themes || []).forEach(t => {
            html += `<option value="${t.id}" ${t.id === currentTheme ? 'selected' : ''}>${t.name}</option>`;
          });
          html += `</optgroup>`;
        });
        themeSelect.innerHTML = html;
        if (currentTheme) {
          themeSelect.value = currentTheme;
        }

        // Poblar Selector de Forma Física dinámicamente con las variantes reales de cada pack
        if (shapeSelect) {
          const url = new URL(window.location.href);
          const currentShape = url.searchParams.get('shape') || (data.overlayShapes && sceneKey && data.overlayShapes[sceneKey]) || 'auto';

          const STANDARD_SHAPE_GROUPS = [
            {
              name: '☕ Cozy Lo-Fi & Arte',
              shapes: [
                { id: 'cozy_polaroid', name: 'Polaroid Clásica Cálida', icon: '📸' },
                { id: 'cozy_canvas', name: 'Lienzo Artístico & Washitape', icon: '🎨' },
                { id: 'cozy_soft', name: 'Píldora Soft Minimal', icon: '☁️' }
              ]
            },
            {
              name: '🎮 Gamer Pro & Esports',
              shapes: [
                { id: 'gamer_mecha', name: 'Mecha Tournament 45°', icon: '🎮' },
                { id: 'gamer_tactical_hud', name: 'Tactical FPS HUD', icon: '🎯' },
                { id: 'gamer_stealth', name: 'Stealth Dark Cyber', icon: '🕶️' },
                { id: 'gamer_hex_shield', name: 'Hex Shield Blindaje', icon: '🛡️' },
                { id: 'gamer_cyber_glitch', name: 'Cyber Glitch Neón', icon: '⚡' },
                { id: 'gamer_arcade_retro', name: 'Arcade 8-Bit Pixel', icon: '👾' }
              ]
            },
            {
              name: '🛠️ Maker & Taller',
              shapes: [
                { id: 'maker_blueprint', name: 'Blueprint Técnico CAD', icon: '🛠️' },
                { id: 'maker_workbench', name: 'Banco de Trabajo Studio', icon: '📐' },
                { id: 'maker_circuit_pcb', name: 'Placa de Circuito PCB', icon: '📟' }
              ]
            },
            {
              name: '⚡ Open Stream Suite',
              shapes: [
                { id: 'openstream_glass', name: 'Swiss Frosted Glass', icon: '⚡' },
                { id: 'openstream_studio', name: 'Broadcast Pro Studio', icon: '🎙️' }
              ]
            },
            {
              name: '📜 Fantasía, Rol & Terror',
              shapes: [
                { id: 'fantasy_parchment', name: 'Pergamino Rol & Sello Cera', icon: '📜' },
                { id: 'fantasy_runic_stone', name: 'Piedra Rúnica Mística', icon: '🗿' },
                { id: 'gothic_vampire', name: 'Gótico Victoriano Dark', icon: '🦇' }
              ]
            },
            {
              name: '💥 Cómic, Pop Art & Retro TV',
              shapes: [
                { id: 'comic_manga_action', name: 'Manga / Shonen Comic', icon: '💥' },
                { id: 'pop_synth_neon', name: 'Synthwave 80s Grid', icon: '🌆' },
                { id: 'vintage_crt_monitor', name: 'Monitor CRT Retro 90s', icon: '📺' }
              ]
            }
          ];

          // Base estándar completa con las 20 formas físicas de Open Stream Suite
          const knownShapeIds = new Set();
          STANDARD_SHAPE_GROUPS.forEach(g => g.shapes.forEach(s => knownShapeIds.add(s.id)));

          const extraPackShapes = [];
          if (Array.isArray(data.packs)) {
            data.packs.forEach(p => {
              if (Array.isArray(p.shapes)) {
                p.shapes.forEach(s => {
                  if (!knownShapeIds.has(s.id)) {
                    extraPackShapes.push(s);
                    knownShapeIds.add(s.id);
                  }
                });
              }
            });
          }

          const groups = [...STANDARD_SHAPE_GROUPS];
          if (extraPackShapes.length > 0) {
            groups.push({
              name: '✨ Formas Personalizadas de Packs',
              shapes: extraPackShapes
            });
          }

          let shapeHtml = `<option value="auto">⚡ Forma: Automática (según estilo)</option><option value="original">📐 Forma: Original del Pack</option>`;
          groups.forEach(g => {
            shapeHtml += `<optgroup label="${g.name}">`;
            g.shapes.forEach(s => {
              const isSel = (s.id === currentShape);
              shapeHtml += `<option value="${s.id}" ${isSel ? 'selected' : ''}>${s.icon || '📐'} ${s.name}</option>`;
            });
            shapeHtml += `</optgroup>`;
          });

          shapeSelect.innerHTML = shapeHtml;
          shapeSelect.value = currentShape;
        }
      })
      .catch(() => {});

    themeSelect.addEventListener('change', () => {
      let selected = themeSelect.value;
      if (!selected) return;

      const url = new URL(window.location.href);

      if (selected === '__default__') {
        selected = getDefaultThemeForScene();
        url.searchParams.delete('theme');
        window.history.replaceState({}, '', url.toString());

        if (typeof window.applyActiveThemeToBody === 'function') {
          window.applyActiveThemeToBody(selected, true);
        } else {
          document.body.setAttribute('data-theme', selected);
        }

        if (sceneKey) {
          postOverlayAssignment({ overlayKey: sceneKey, themeId: selected });
        }

        themeSelect.value = selected;
        window.OSSEditor.showHudToast(`🔄 Color restaurado al original: ${selected}`);
        return;
      }

      url.searchParams.set('theme', selected);
      window.history.replaceState({}, '', url.toString());

      if (typeof window.applyActiveThemeToBody === 'function') {
        window.applyActiveThemeToBody(selected, true);
      } else {
        document.body.setAttribute('data-theme', selected);
      }

      if (sceneKey) {
        postOverlayAssignment({ overlayKey: sceneKey, themeId: selected });
      }

      window.OSSEditor.showHudToast(`🎨 Color cambiado a: ${selected}`);
    });

    // 3. Toggle de Chat Integrado en Escena
    const btnToggleChat = hud.querySelector('#hud-btn-toggle-chat');
    const chatStateSpan = hud.querySelector('#hud-chat-state');
    if (btnToggleChat && chatStateSpan) {
      const isChatHidden = localStorage.getItem('oss_chat_hidden_' + (sceneKey || 'scene')) === 'true';
      if (isChatHidden) {
        document.body.classList.add('hide-scene-chat');
        chatStateSpan.textContent = 'OFF';
        chatStateSpan.style.color = '#8B949E';
      }

      btnToggleChat.addEventListener('click', () => {
        const currentlyHidden = document.body.classList.toggle('hide-scene-chat');
        chatStateSpan.textContent = currentlyHidden ? 'OFF' : 'ON';
        chatStateSpan.style.color = currentlyHidden ? '#8B949E' : '#57D6C4';
        localStorage.setItem('oss_chat_hidden_' + (sceneKey || 'scene'), currentlyHidden ? 'true' : 'false');
        window.OSSEditor.showHudToast(
          currentlyHidden 
            ? '💬 Chat integrado ocultado (espacio libre para fuente OBS)' 
            : '💬 Chat integrado visible en la escena'
        );
      });
    }

    // 4. Copiar Enlace Limpio y Reactivo para OBS Studio
    const btnCopyObsUrl = hud.querySelector('#hud-btn-copy-obs-url');
    if (btnCopyObsUrl) {
      btnCopyObsUrl.addEventListener('click', () => {
        const cleanUrl = window.location.origin + window.location.pathname;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cleanUrl).then(() => {
            window.OSSEditor.showHudToast('🔗 ¡Enlace limpio de OBS copiado! Cambia temas por WebSocket sin tocarlo.');
          }).catch(() => {
            prompt('Copia este enlace limpio para OBS:', cleanUrl);
          });
        } else {
          prompt('Copia este enlace limpio para OBS:', cleanUrl);
        }
      });
    }

    // 5. Botón Universal de Restaurar Estilo y Formas Originales
    const btnResetStyle = hud.querySelector('#hud-btn-reset-style');
    if (btnResetStyle && !btnResetStyle.dataset.bound) {
      btnResetStyle.dataset.bound = 'true';
      btnResetStyle.addEventListener('click', async () => {
        const defaultTheme = getDefaultThemeForScene(sceneKey);

        // 1. Limpiar query params de la URL para que no fuercen tema o forma
        const url = new URL(window.location.href);
        url.searchParams.delete('theme');
        url.searchParams.delete('shape');
        window.history.replaceState({}, '', url.toString());

        // 2. Restablecer controles select del HUD
        if (themeSelect) {
          themeSelect.value = defaultTheme;
          if (!themeSelect.value) themeSelect.value = '__default__';
        }
        if (shapeSelect) {
          shapeSelect.value = 'auto';
          if (!shapeSelect.value) shapeSelect.value = 'original';
        }

        // 3. Aplicar tema y forma original nativa al DOM de inmediato
        if (typeof window.updateOverlayThemeAndShape === 'function') {
          window.updateOverlayThemeAndShape(defaultTheme, 'auto');
        } else if (typeof window.applyActiveThemeToBody === 'function') {
          window.applyActiveThemeToBody(defaultTheme, true);
        }

        // 4. Persistir la restauración en el backend (elimina forma forzada y restaura color)
        if (sceneKey) {
          await postOverlayAssignment({
            overlayKey: sceneKey,
            themeId: defaultTheme,
            shapeId: 'auto'
          });
        }

        window.OSSEditor.showHudToast(`↺ Estilo original restaurado: Tema "${defaultTheme}" y forma nativa`);
      });
    }
  }

  async function activatePhase(targetPi) {
    const allPhases = document.querySelectorAll('.project-phases .phase-item');
    allPhases.forEach(p => p.classList.remove('active'));
    targetPi.classList.add('active');
    const phaseText = targetPi.textContent.trim();

    // Sincronizar FASE ACTUAL inmediatamente en el panel lateral
    document.querySelectorAll('.panel-project-phase').forEach(pp => {
      pp.textContent = phaseText;
    });

    if (typeof window.__refreshHudPhases === 'function') {
      window.__refreshHudPhases();
    }
    window.OSSEditor.showHudToast(`🏷️ Fase seleccionada: ${phaseText}`);

    // Persistir al servidor para sincronizar con OBS Studio
    try {
      const isPrintMode = document.body.dataset.mode === 'print';
      const section = isPrintMode ? 'print' : 'maker';
      const res = await fetch('/api/overlays/texts');
      if (!res.ok) return;
      const serverData = await res.json();
      const texts = serverData.texts || {};
      if (!texts[section]) texts[section] = {};
      texts[section].currentPhase = phaseText;

      let localToken = window.__LOCAL_AUTH_TOKEN__ || (typeof localStorage !== 'undefined' ? localStorage.getItem('local_auth_token') : '') || '';
      if (!localToken) {
        try {
          const tokRes = await fetch('/api/local-token');
          if (tokRes.ok) { const td = await tokRes.json(); localToken = td.token || ''; }
        } catch(e){}
      }

      await fetch('/api/overlays/texts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localToken ? { 'X-Local-Token': localToken } : {})
        },
        body: JSON.stringify({ texts })
      });
    } catch(e) {
      console.error('Error al persistir fase activa:', e);
    }
  }

  function setupPhasesAndPodcast(hud, sceneKey) {
    window.__refreshHudPhases = function() {
      const hudPhaseSwitcher = hud.querySelector('#hud-phase-switcher');
      const hudPhaseButtons = hud.querySelector('#hud-phase-buttons');
      const phaseItems = document.querySelectorAll('.project-phases .phase-item');
      if (!hudPhaseButtons) return;
      if (phaseItems.length === 0) {
        if (hudPhaseSwitcher) hudPhaseSwitcher.style.display = 'none';
        return;
      }
      if (hudPhaseSwitcher) hudPhaseSwitcher.style.display = 'flex';
      hudPhaseButtons.innerHTML = '';
      phaseItems.forEach(pi => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hud-btn';
        const pText = pi.textContent.trim();
        btn.textContent = pText;
        const isActive = pi.classList.contains('active');
        if (isActive) {
          btn.style.borderColor = '#57D6C4';
          btn.style.color = '#57D6C4';
          btn.style.background = 'rgba(87,214,196,0.18)';
          btn.style.fontWeight = '700';
        }
        btn.addEventListener('click', () => {
          activatePhase(pi);
        });
        hudPhaseButtons.appendChild(btn);
      });
    };

    window.__refreshHudPhases();

    // Botón Añadir Fase en HUD
    const btnAddPhase = hud.querySelector('#hud-btn-add-phase');
    if (btnAddPhase && !btnAddPhase.dataset.bound) {
      btnAddPhase.dataset.bound = 'true';
      btnAddPhase.addEventListener('click', async () => {
        const container = document.querySelector('.project-phases');
        if (!container) return;
        const currentCount = container.querySelectorAll('.phase-item').length + 1;
        const numStr = String(currentCount).padStart(2, '0');
        const phaseName = prompt('Nombre de la nueva fase:', `${numStr} FASE ${numStr}`);
        if (!phaseName || !phaseName.trim()) return;
        const div = document.createElement('span');
        div.className = 'phase-divider';
        div.textContent = '·';
        container.appendChild(div);
        const item = document.createElement('div');
        item.className = 'phase-item';
        item.textContent = phaseName.trim();
        container.appendChild(item);
        activatePhase(item);
        if (window.OSSEditor.saveTexts) await window.OSSEditor.saveTexts();
        window.OSSEditor.showHudToast(`➕ Nueva fase añadida: "${phaseName.trim()}"`);
      });
    }

    // Botón Eliminar Fase en HUD
    const btnDelPhase = hud.querySelector('#hud-btn-del-phase');
    if (btnDelPhase && !btnDelPhase.dataset.bound) {
      btnDelPhase.dataset.bound = 'true';
      btnDelPhase.addEventListener('click', async () => {
        const container = document.querySelector('.project-phases');
        const phaseItems = container?.querySelectorAll('.phase-item');
        if (!container || !phaseItems || phaseItems.length <= 1) {
          window.OSSEditor.showHudToast('⚠️ Debe quedar al menos una fase');
          return;
        }
        const activeItem = container.querySelector('.phase-item.active') || phaseItems[phaseItems.length - 1];
        const divider = activeItem.nextElementSibling?.classList.contains('phase-divider')
          ? activeItem.nextElementSibling
          : activeItem.previousElementSibling?.classList.contains('phase-divider')
            ? activeItem.previousElementSibling
            : null;
        divider?.remove();
        const nextActive = container.querySelector('.phase-item:not(.active)') || container.querySelector('.phase-item');
        activeItem.remove();
        if (nextActive) activatePhase(nextActive);
        if (window.OSSEditor.saveTexts) await window.OSSEditor.saveTexts();
        window.OSSEditor.showHudToast('🗑️ Fase eliminada');
      });
    }

    // Gestión de cámaras para Podcast
    if (sceneKey === 'oss_podcast' || window.location.pathname.includes('/podcast_talk/')) {
      const podSwitcher = hud.querySelector('#hud-podcast-switcher');
      if (podSwitcher) podSwitcher.style.display = 'flex';
      hud.querySelectorAll('.hud-pod-cam-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const cams = parseInt(btn.dataset.cams) || 2;
          const camGrid = document.querySelector('.cam-grid');
          if (!camGrid) return;
          let currentCams = camGrid.querySelectorAll('.guest-cam');
          if (cams === 2) {
            camGrid.style.gridTemplateColumns = '1fr 1fr';
            camGrid.style.gridTemplateRows = 'none';
          } else if (cams === 3) {
            camGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
            camGrid.style.gridTemplateRows = 'none';
          } else if (cams === 4) {
            camGrid.style.gridTemplateColumns = '1fr 1fr';
            camGrid.style.gridTemplateRows = '1fr 1fr';
          }
          while (currentCams.length < cams) {
            const idx = currentCams.length + 1;
            const newCam = document.createElement('div');
            newCam.className = 'guest-cam';
            const colors = ['', 'var(--color-accent-orange)', '#A371F7', '#3FB950'];
            newCam.innerHTML = `<div class="guest-nameplate" style="border-left-color: ${colors[idx-1] || 'var(--color-accent-cyan)'};">INVITADO ${idx - 1}</div>`;
            camGrid.appendChild(newCam);
            currentCams = camGrid.querySelectorAll('.guest-cam');
          }
          while (currentCams.length > cams) {
            currentCams[currentCams.length - 1].remove();
            currentCams = camGrid.querySelectorAll('.guest-cam');
          }
          if (window.OSSEditor.saveTexts) await window.OSSEditor.saveTexts();
          window.OSSEditor.showHudToast(`🎙️ Configuración cambiada a ${cams} cámaras`);
        });
      });
    }
  }

  function togglePhrases() {
    const el = document.getElementById('oss-brb-phrases-control');
    if (!el) return;
    const isHidden = el.style.display === 'none' || getComputedStyle(el).display === 'none';
    el.style.display = isHidden ? 'flex' : 'none';
  }

  window.OSSEditor.isBrbScene = isBrbScene;
  window.OSSEditor.setupPhrases = setupPhrases;
  window.OSSEditor.togglePhrases = togglePhrases;
  window.OSSEditor.setupThemeSelector = setupThemeSelector;
  window.OSSEditor.setupPhasesAndPodcast = setupPhasesAndPodcast;
  window.OSSEditor.activatePhase = activatePhase;
})();
