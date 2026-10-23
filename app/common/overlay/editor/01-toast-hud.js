/**
 * app/common/overlay/editor/01-toast-hud.js
 * Sistema de notificaciones flotantes, estilos CSS e interfaz principal HUD.
 */

window.OSSEditor = window.OSSEditor || {};

(function() {
  function showHudToast(msg) {
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

  function injectHudStyles() {
    if (document.getElementById('oss-hud-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'oss-hud-styles';
    styleEl.textContent = `
      .open-stream-suite-screen-hud {
        position: fixed;
        bottom: 18px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(14, 18, 24, 0.96);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(87, 214, 196, 0.45);
        padding: 6px 12px;
        border-radius: 8px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.8), 0 0 15px rgba(87, 214, 196, 0.2);
        font-family: 'JetBrains Mono', 'Segoe UI', monospace;
        font-size: 11px;
        color: #F0F6FC;
        user-select: none;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .open-stream-suite-screen-hud.docked-top {
        bottom: auto !important;
        top: 14px !important;
      }
      .open-stream-suite-screen-hud.minimized {
        padding: 5px 12px;
        background: rgba(14, 18, 24, 0.9);
      }
      .open-stream-suite-screen-hud.minimized .hud-content {
        display: none !important;
      }
      .hud-drag-handle {
        cursor: grab;
        display: flex;
        align-items: center;
        gap: 6px;
        padding-right: 6px;
        border-right: 1px solid rgba(255,255,255,0.12);
      }
      .hud-drag-handle:active {
        cursor: grabbing;
      }
      .hud-btn {
        background: #21262D;
        color: #F0F6FC;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 4px;
        padding: 4px 9px;
        font-size: 11px;
        font-family: inherit;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
        transition: all 0.2s;
      }
      .hud-btn:hover {
        background: #30363D;
        border-color: #57D6C4;
        color: #57D6C4;
      }
      .hud-btn.active-editing {
        background: rgba(255, 120, 63, 0.25) !important;
        border-color: #FF783F !important;
        color: #FF783F !important;
        box-shadow: 0 0 10px rgba(255, 120, 63, 0.4);
      }
      .hud-btn.btn-save {
        background: #57D6C4;
        color: #0D1117;
        border-color: #57D6C4;
        font-weight: 700;
      }
      .hud-btn.btn-save:hover {
        background: #6FE3D3;
      }
      .hud-select {
        background: #161B22;
        color: #F0F6FC;
        border: 1px solid rgba(87, 214, 196, 0.4);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 11px;
        font-family: inherit;
        outline: none;
        cursor: pointer;
      }
      .editable-screen-element.editing-active {
        box-shadow: inset 0 0 0 1.5px #57D6C4, 0 0 8px rgba(87, 214, 196, 0.25) !important;
        background: rgba(87, 214, 196, 0.14) !important;
        border-radius: 3px;
        cursor: pointer !important;
        position: relative;
        z-index: 10;
        outline: none !important;
        display: inline-block;
        padding: 1px 4px !important;
        margin: 1px !important;
        transition: box-shadow 0.15s, background 0.15s;
      }
      .editable-screen-element.editing-active:hover {
        box-shadow: inset 0 0 0 2px #FF783F, 0 0 12px rgba(255, 120, 63, 0.45) !important;
        background: rgba(255, 120, 63, 0.24) !important;
        z-index: 100;
      }
      .editable-screen-element.editing-active:focus {
        box-shadow: inset 0 0 0 2px #57D6C4, 0 0 16px rgba(87, 214, 196, 0.6) !important;
        background: rgba(14, 18, 24, 0.95) !important;
        color: #FFFFFF !important;
        z-index: 200;
        outline: none !important;
        cursor: text !important;
      }
      .hud-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000000;
        background: #161B22;
        border: 1px solid #57D6C4;
        color: #FFFFFF;
        padding: 10px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-family: 'JetBrains Mono', monospace;
        box-shadow: 0 6px 20px rgba(0,0,0,0.6);
        animation: hudToastIn 0.3s ease-out;
      }
      @keyframes hudToastIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleEl);
  }

  function makeDraggable(el, handleSelector) {
    if (!el) return;
    const handle = handleSelector ? (el.querySelector(handleSelector) || el) : el;
    handle.style.cursor = 'grab';

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initLeft = 0;
    let initTop = 0;

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(e.target.tagName)) return;
      if (e.target.isContentEditable) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;

      el.style.bottom = 'auto';
      el.style.right = 'auto';
      el.style.transform = 'none';
      el.style.left = initLeft + 'px';
      el.style.top = initTop + 'px';
      handle.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      function onPointerMove(me) {
        if (!isDragging) return;
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        const maxLeft = Math.max(10, window.innerWidth - el.offsetWidth - 10);
        const maxTop = Math.max(10, window.innerHeight - el.offsetHeight - 10);
        el.style.left = Math.max(10, Math.min(maxLeft, initLeft + dx)) + 'px';
        el.style.top = Math.max(10, Math.min(maxTop, initTop + dy)) + 'px';
      }

      function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        handle.style.cursor = 'grab';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });
  }

  let autoFitEnabled = true;
  function applyAutoFit() {
    if (typeof window.obsstudio !== 'undefined' || window.location.search.includes('obs=1')) {
      document.documentElement.classList.remove('browser-preview-fit');
      document.body.classList.remove('browser-preview-fit');
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.position = '';
      document.body.style.left = '';
      document.body.style.top = '';
      const c = document.querySelector('.overlay-canvas');
      if (c) c.style.transform = '';
      return;
    }

    const canvas = document.querySelector('.overlay-canvas');

    if (autoFitEnabled) {
      document.documentElement.classList.add('browser-preview-fit');
      document.body.classList.add('browser-preview-fit');
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      const scale = Math.min(scaleX, scaleY);

      if (canvas) {
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'center center';
      } else {
        document.body.style.transform = `scale(${scale})`;
        document.body.style.transformOrigin = 'top left';
        const offsetX = Math.max(0, (window.innerWidth - (1920 * scale)) / 2);
        const offsetY = Math.max(0, (window.innerHeight - (1080 * scale)) / 2);
        document.body.style.position = 'absolute';
        document.body.style.left = `${offsetX}px`;
        document.body.style.top = `${offsetY}px`;
      }
    } else {
      document.documentElement.classList.remove('browser-preview-fit');
      document.body.classList.remove('browser-preview-fit');
      if (canvas) canvas.style.transform = '';
      document.body.style.transform = '';
      document.body.style.position = '';
      document.body.style.left = '';
      document.body.style.top = '';
    }
  }

  function createHud(sceneKey) {
    if (document.getElementById('open-stream-suite-screen-hud')) {
      return document.getElementById('open-stream-suite-screen-hud');
    }

    injectHudStyles();

    const hud = document.createElement('div');
    hud.className = 'open-stream-suite-screen-hud';
    hud.id = 'open-stream-suite-screen-hud';

    hud.innerHTML = `
      <div class="hud-drag-handle" title="Arrastra desde aquí para mover la barra a cualquier parte de la pantalla">
        <span>🛠️</span>
        <span style="font-weight:700; color:#57D6C4; letter-spacing:0.5px;">EDITOR</span>
        <span style="color:#8B949E; font-size:10px;">[${(sceneKey || 'ESCENA').toUpperCase()}]</span>
        <span style="color:#6E7681; font-size:10px; margin-left:2px;">⋮⋮</span>
      </div>

      <div class="hud-content" style="display:flex; align-items:center; gap:6px;">
        <button type="button" class="hud-btn" id="hud-btn-toggle-dock" title="Mover barra arriba / abajo para no tapar textos">
          ↕️ Mover
        </button>

        <button type="button" class="hud-btn" id="hud-btn-toggle-fit" title="Auto-ajustar 1080p a la ventana">
          📐 Ajustar: <span id="hud-fit-state" style="color:#57D6C4;">ON</span>
        </button>

        <button type="button" class="hud-btn" id="hud-btn-toggle-edit" title="Hacer clic para editar cualquier texto">
          ✏️ Edición: <span id="hud-edit-state" style="color:#FF783F;">OFF</span>
        </button>

        <select class="hud-select" id="hud-quick-jump-select" style="display:none; max-width:140px;">
          <option value="">🎯 Ir a Texto...</option>
        </select>

        <!-- 1. Selector de Forma Física de Escena -->
        <div style="display:flex; align-items:center; gap:3px;" title="Forma física y estética de marcos, paneles y accesorios">
          <span style="color:#8B949E; font-size:10px;">📐</span>
          <select class="hud-select" id="hud-shape-select" style="max-width:180px; font-size:10px; text-overflow:ellipsis; white-space:nowrap;">
            <option value="auto">⚡ Forma: Automática (según estilo)</option>
            <option value="original">📐 Forma: Original del Pack</option>
            <optgroup label="☕ Cozy Lo-Fi & Arte">
              <option value="cozy_polaroid">☕ Polaroid Vintage con Cinta</option>
              <option value="cozy_canvas">🎨 Lienzo de Arte con Chinchetas</option>
              <option value="cozy_soft">☁️ Píldora Soft Minimal</option>
            </optgroup>
            <optgroup label="🎮 Gamer Pro & Esports">
              <option value="gamer_mecha">🎮 Mecha Tournament 45°</option>
              <option value="gamer_tactical_hud">🎯 Tactical FPS HUD</option>
              <option value="gamer_stealth">🕶️ Stealth Dark Cyber</option>
              <option value="gamer_hex_shield">🛡️ Hex Shield Blindaje</option>
              <option value="gamer_cyber_glitch">⚡ Cyber Glitch Neón</option>
              <option value="gamer_arcade_retro">👾 Arcade 8-Bit Pixel</option>
            </optgroup>
            <optgroup label="🛠️ Maker & Taller">
              <option value="maker_blueprint">🛠️ Blueprint Técnico CAD</option>
              <option value="maker_workbench">📐 Banco de Trabajo Studio</option>
              <option value="maker_circuit_pcb">📟 Placa de Circuito PCB</option>
            </optgroup>
            <optgroup label="⚡ Open Stream Suite">
              <option value="openstream_glass">⚡ Swiss Frosted Glass</option>
              <option value="openstream_studio">🎙️ Broadcast Pro Studio</option>
            </optgroup>
            <optgroup label="📜 Fantasía, Rol & Terror">
              <option value="fantasy_parchment">📜 Pergamino Rol & Sello Cera</option>
              <option value="fantasy_runic_stone">🗿 Piedra Rúnica Mística</option>
              <option value="gothic_vampire">🦇 Gótico Victoriano Dark</option>
            </optgroup>
            <optgroup label="💥 Cómic, Pop Art & Retro TV">
              <option value="comic_manga_action">💥 Manga / Shonen Comic</option>
              <option value="pop_synth_neon">🌆 Synthwave 80s Grid</option>
              <option value="vintage_crt_monitor">📺 Monitor CRT Retro 90s</option>
            </optgroup>
          </select>
        </div>

        <!-- 2. Selector de Paleta de Color -->
        <div style="display:flex; align-items:center; gap:3px;" title="Paleta de colores del tema">
          <span style="color:#8B949E; font-size:10px;">🎨</span>
          <select class="hud-select" id="hud-theme-select" style="max-width:160px; font-size:10px; text-overflow:ellipsis; white-space:nowrap;">
            <option value="">Cargando colores...</option>
          </select>
        </div>

        <button type="button" class="hud-btn" id="hud-btn-toggle-chat" title="Mostrar u ocultar el chat integrado en esta escena (ideal si usas una fuente de chat independiente en OBS)">
          💬 Chat: <span id="hud-chat-state" style="color:#57D6C4;">ON</span>
        </button>

        <button type="button" class="hud-btn" id="hud-btn-copy-obs-url" title="Copiar enlace limpio y reactivo para pegar en OBS Studio">
          🔗 Enlace OBS
        </button>

        <button type="button" class="hud-btn btn-save" id="hud-btn-save-texts" title="Guardar cambios de texto y emitirlos a OBS">
          💾 Guardar Textos
        </button>

        <button type="button" class="hud-btn" id="hud-btn-reset-style" style="color:#57D6C4; border-color:rgba(87,214,196,0.4);" title="Restaurar paleta de color y forma física originales de fábrica para esta escena">
          ↺ Restaurar Estilo
        </button>

        <button type="button" class="hud-btn" id="hud-btn-reset-texts" style="color:#FF783F; border-color:rgba(255,120,63,0.4);" title="Restaurar textos editables de esta escena a valores originales de fábrica">
          ↺ Restaurar Textos
        </button>

        <button type="button" class="hud-btn" id="hud-btn-toggle-bg" title="Alternar fondo transparente u oscuro de prueba">
          👁️ Fondo OBS
        </button>

        <!-- Selector de Fondo con Apertura y Recorte de Cámaras -->
        <div class="hud-select-wrapper" title="Aplicar fondo decorativo con recorte automático de cámaras/juegos">
          <span style="font-size:11px;">🖼️</span>
          <select id="hud-aperture-bg-select" class="hud-select" style="max-width:135px; font-size:10px;">
            <option value="none">Fondo: Transparente</option>
            <optgroup label="☕ Cozy Lo-Fi">
              <option value="cozy_warm_paper">Papel Kraft</option>
              <option value="cozy_tatami_wood">Madera Tatami</option>
              <option value="cozy_matcha_ambient">Matcha & Bambú</option>
            </optgroup>
            <optgroup label="⚡ Gamer Pro">
              <option value="gamer_carbon_mesh">Fibra de Carbono</option>
              <option value="gamer_cyber_grid">Matriz Táctica</option>
            </optgroup>
            <optgroup label="🛠️ Maker & Taller">
              <option value="maker_cad_blueprint">Cuadrícula CAD</option>
              <option value="maker_workshop_mat">Tapiz de Corte</option>
            </optgroup>
            <optgroup label="🎙️ Open Stream">
              <option value="studio_acoustic_slate">Paneles Acústicos</option>
              <option value="studio_frosted_glass">Cristal Glaseado</option>
            </optgroup>
            <option value="custom_url">🔗 URL Imagen...</option>
          </select>
        </div>

        <div id="hud-phase-switcher" style="display:none; align-items:center; gap:4px; padding:0 6px; border-left:1px solid rgba(255,255,255,0.15);">
          <span style="color:#57D6C4; font-size:10px; font-weight:700;">FASE:</span>
          <div id="hud-phase-buttons" style="display:flex; gap:3px;"></div>
          <button type="button" class="hud-btn" id="hud-btn-add-phase" style="padding:2px 6px; font-size:10px;" title="Añadir una nueva fase al proyecto">➕</button>
          <button type="button" class="hud-btn" id="hud-btn-del-phase" style="padding:2px 6px; font-size:10px; color:#F85149;" title="Eliminar la fase activa">🗑️</button>
        </div>

        <div id="hud-podcast-switcher" style="display:none; align-items:center; gap:4px; padding:0 6px; border-left:1px solid rgba(255,255,255,0.15);">
          <span style="color:#57D6C4; font-size:10px; font-weight:700;">👥 CÁMARAS:</span>
          <button type="button" class="hud-btn hud-pod-cam-btn" data-cams="2" style="padding:2px 6px; font-size:10px;">2 Cams</button>
          <button type="button" class="hud-btn hud-pod-cam-btn" data-cams="3" style="padding:2px 6px; font-size:10px;">3 Cams</button>
          <button type="button" class="hud-btn hud-pod-cam-btn" data-cams="4" style="padding:2px 6px; font-size:10px;">4 Cams</button>
        </div>

        <button type="button" class="hud-btn" id="hud-btn-toggle-countdown" style="display:none; color:#57D6C4; border-color:rgba(87,214,196,0.4);" title="Abrir/Cerrar panel de Temporizador / Cuenta Atrás">
          ⏱️ Temporizador
        </button>
        <button type="button" class="hud-btn" id="hud-btn-toggle-speedrun" style="display:none; color:#FF783F; border-color:rgba(255,120,63,0.4);" title="Abrir/Cerrar panel de Speedrun y Tramos">
          ⚡ Splits
        </button>
        <button type="button" class="hud-btn" id="hud-btn-toggle-brb" style="display:none; color:#57D6C4; border-color:rgba(87,214,196,0.4);" title="Abrir/Cerrar panel de Frases en Rotación">
          🔄 Frases BRB
        </button>
      </div>

      <button type="button" class="hud-btn" id="hud-btn-toggle-min" style="padding:4px 6px; font-size:10px;" title="Minimizar barra">
        ▲
      </button>
    `;
    document.body.appendChild(hud);

    // Mover barra (Alternar arriba / abajo)
    let isDockedTop = false;
    const btnToggleDock = hud.querySelector('#hud-btn-toggle-dock');
    if (btnToggleDock) {
      btnToggleDock.addEventListener('click', () => {
        isDockedTop = !isDockedTop;
        hud.style.left = '50%';
        hud.style.transform = 'translateX(-50%)';
        if (isDockedTop) {
          hud.style.top = '18px';
          hud.style.bottom = 'auto';
          btnToggleDock.textContent = '↕️ Abajo';
          showHudToast('↕️ Barra fijada arriba');
        } else {
          hud.style.bottom = '18px';
          hud.style.top = 'auto';
          btnToggleDock.textContent = '↕️ Arriba';
          showHudToast('↕️ Barra fijada abajo');
        }
      });
    }

    // Alternadores de paneles flotantes
    const btnCd = hud.querySelector('#hud-btn-toggle-countdown');
    if (btnCd) {
      const checkCd = () => {
        if (window.OSSEditor.isCountdownScene && window.OSSEditor.isCountdownScene(sceneKey)) {
          btnCd.style.display = 'inline-flex';
        }
      };
      checkCd();
      setTimeout(checkCd, 120);
      btnCd.addEventListener('click', () => {
        if (window.OSSEditor.toggleCountdown) window.OSSEditor.toggleCountdown();
      });
    }

    const btnSr = hud.querySelector('#hud-btn-toggle-speedrun');
    if (btnSr) {
      const checkSr = () => {
        if (window.OSSEditor.isSpeedrunScene && window.OSSEditor.isSpeedrunScene(sceneKey)) {
          btnSr.style.display = 'inline-flex';
        }
      };
      checkSr();
      setTimeout(checkSr, 120);
      btnSr.addEventListener('click', () => {
        if (window.OSSEditor.toggleSpeedrun) window.OSSEditor.toggleSpeedrun();
      });
    }

    const btnBrb = hud.querySelector('#hud-btn-toggle-brb');
    if (btnBrb) {
      const checkBrb = () => {
        if (window.OSSEditor.isBrbScene && window.OSSEditor.isBrbScene(sceneKey)) {
          btnBrb.style.display = 'inline-flex';
        }
      };
      checkBrb();
      setTimeout(checkBrb, 120);
      btnBrb.addEventListener('click', () => {
        if (window.OSSEditor.togglePhrases) window.OSSEditor.togglePhrases();
      });
    }

    // Auto-ajuste de escala
    window.addEventListener('resize', applyAutoFit);
    setTimeout(applyAutoFit, 60);

    const btnToggleFit = hud.querySelector('#hud-btn-toggle-fit');
    const lblFitState = hud.querySelector('#hud-fit-state');
    if (btnToggleFit) {
      btnToggleFit.addEventListener('click', () => {
        autoFitEnabled = !autoFitEnabled;
        lblFitState.textContent = autoFitEnabled ? 'ON' : 'OFF (1:1)';
        lblFitState.style.color = autoFitEnabled ? '#57D6C4' : '#8B949E';
        applyAutoFit();
        showHudToast(autoFitEnabled ? '📐 Auto-Ajuste activado (sin scrollbars)' : '🔍 Escala original 100% (1920×1080)');
      });
    }

    // Alternar fondo OBS
    const btnToggleBg = hud.querySelector('#hud-btn-toggle-bg');
    if (btnToggleBg) {
      btnToggleBg.addEventListener('click', () => {
        document.body.classList.toggle('browser-preview-mode');
        const isTrans = !document.body.classList.contains('browser-preview-mode');
        btnToggleBg.textContent = isTrans ? '🔳 Modo OBS (Transp)' : '👁️ Fondo OBS';
      });
    }

    // Selector de fondo decorativo con apertura / recorte de cámaras
    const selApertureBg = hud.querySelector('#hud-aperture-bg-select');
    if (selApertureBg) {
      if (window.OSSAperture && window.OSSAperture.getConfig) {
        const currentBg = window.OSSAperture.getConfig();
        if (currentBg) {
          if (currentBg.mode === 'none') selApertureBg.value = 'none';
          else if (currentBg.mode === 'preset' && currentBg.preset) selApertureBg.value = currentBg.preset;
          else if (currentBg.mode === 'image') selApertureBg.value = 'custom_url';
        }
      }

      function persistBackdrop(bgConfig) {
        const p = new URLSearchParams(window.location.search);
        const token = p.get('token') || (window.CONFIG && window.CONFIG.localToken) || '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['X-Local-Token'] = token;
        fetch('/api/themes/backdrop', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ overlayKey: sceneKey, backdrop: bgConfig })
        }).catch(() => {});
      }

      selApertureBg.addEventListener('change', () => {
        const val = selApertureBg.value;
        if (!window.OSSAperture) return;

        if (val === 'none') {
          const cfg = { mode: 'none' };
          window.OSSAperture.setBackdrop(cfg);
          persistBackdrop(cfg);
          showHudToast('🔳 Fondo transparente restaurado');
        } else if (val === 'custom_url') {
          const url = prompt('Introduce la URL de la imagen de fondo:');
          if (url && url.trim()) {
            const cfg = { mode: 'image', customUrl: url.trim() };
            window.OSSAperture.setBackdrop(cfg);
            persistBackdrop(cfg);
            showHudToast('🖼️ Fondo personalizado con recorte de cámaras aplicado');
          } else {
            selApertureBg.value = 'none';
          }
        } else {
          const cfg = { mode: 'preset', preset: val };
          window.OSSAperture.setBackdrop(cfg);
          persistBackdrop(cfg);
          showHudToast(`🖼️ Fondo [${val}] con recorte automático aplicado`);
        }
      });
    }

    // Minimizar / Restaurar
    const btnMin = hud.querySelector('#hud-btn-toggle-min');
    if (btnMin) {
      btnMin.addEventListener('click', () => {
        hud.classList.toggle('minimized');
        btnMin.textContent = hud.classList.contains('minimized') ? '🛠️ Editor' : '▲';
      });
    }

    makeDraggable(hud, '.hud-drag-handle');

    return hud;
  }

  window.OSSEditor.showHudToast = showHudToast;
  window.OSSEditor.makeDraggable = makeDraggable;
  window.OSSEditor.createHud = createHud;
  window.OSSEditor.applyAutoFit = applyAutoFit;
  window.showHudToast = showHudToast;
})();
