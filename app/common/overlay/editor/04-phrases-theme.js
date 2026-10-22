/**
 * app/common/overlay/editor/04-phrases-theme.js
 * Gestión de frases rotativas (BRB), selector de temas, fases de proyecto (Maker/Print) y cámaras podcast.
 */

window.OSSEditor = window.OSSEditor || {};

(function() {
  function isBrbScene(sceneKey) {
    return ['beRightBack', 'oss_brb', 'gamer_brb', 'cozy_brb'].includes(sceneKey)
      || window.location.pathname.includes('/be-right-back/')
      || window.location.pathname.includes('/coffee-break/')
      || document.querySelector('.brb-status-phrase') !== null;
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
      display: flex; flex-direction: column; gap: 10px; width: 260px;
    `;
    phrasesControl.innerHTML = `
      <div class="hud-drag-handle" style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; display:flex; justify-content:space-between; align-items:center; cursor:grab;" title="Arrastra desde aquí para mover este menú">
        <span>🔄 FRASES EN ROTACIÓN</span>
        <span style="display:flex; align-items:center; gap:4px;">
          <span id="oss-brb-phrase-counter" style="font-size:10px; color:#8B949E;">1 / 1</span>
          <span style="color:#6E7681; font-size:11px;">⋮⋮</span>
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

    if (window.OSSEditor.makeDraggable) {
      window.OSSEditor.makeDraggable(phrasesControl, '.hud-drag-handle');
    }

    return phrasesControl;
  }

  function setupThemeSelector(hud, sceneKey) {
    const themeSelect = hud.querySelector('#hud-theme-select');
    if (!themeSelect) return;

    function getDefaultThemeForScene() {
      const p = (document.body.dataset.pack || '').toLowerCase();
      if (p.includes('cozy')) return 'latte_caramel';
      if (p.includes('gamer')) return 'cyber_glitch';
      if (p.includes('openstream') || p.includes('open_stream')) return 'neon_streamer';
      return 'maker';
    }

    fetch('/api/themes/packs')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.packs) return;
        const currentTheme = document.body.getAttribute('data-theme') || data.activeTheme || getDefaultThemeForScene();
        const defaultTheme = getDefaultThemeForScene();

        let html = `<option value="__default__" style="font-weight:700;">🔄 Tema Original de la Escena (${defaultTheme})</option>`;
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
      })
      .catch(() => {});

    themeSelect.addEventListener('change', () => {
      let selected = themeSelect.value;
      if (!selected) return;

      const currentUrl = new URL(window.location.href);

      if (selected === '__default__') {
        selected = getDefaultThemeForScene();
        // Limpiar el parámetro de la URL
        currentUrl.searchParams.delete('theme');
        window.history.replaceState({}, '', currentUrl.toString());

        if (typeof window.applyActiveThemeToBody === 'function') {
          window.applyActiveThemeToBody(selected);
        } else {
          document.body.setAttribute('data-theme', selected);
        }

        if (sceneKey) {
          fetch('/api/themes/overlay-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ overlayKey: sceneKey, themeId: selected })
          }).catch(() => {});
        }

        themeSelect.value = selected;
        window.OSSEditor.showHudToast(`🔄 Escena restaurada a su tema original: ${selected}`);
        return;
      }

      // Actualizar el parámetro en la URL dinámicamente
      currentUrl.searchParams.set('theme', selected);
      window.history.replaceState({}, '', currentUrl.toString());

      // Aplicar tema completo con su arquetipo
      if (typeof window.applyActiveThemeToBody === 'function') {
        window.applyActiveThemeToBody(selected);
      } else {
        document.body.setAttribute('data-theme', selected);
      }

      if (sceneKey) {
        fetch('/api/themes/overlay-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overlayKey: sceneKey, themeId: selected })
        }).catch(() => {});
      }

      window.OSSEditor.showHudToast(`🎨 Estilo aplicado a esta escena: ${selected}`);
    });
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

  window.OSSEditor.isBrbScene = isBrbScene;
  window.OSSEditor.setupPhrases = setupPhrases;
  window.OSSEditor.setupThemeSelector = setupThemeSelector;
  window.OSSEditor.setupPhasesAndPodcast = setupPhasesAndPodcast;
  window.OSSEditor.activatePhase = activatePhase;
})();
