/**
 * app/common/overlay/editor/03-speedrun.js
 * Controles de Speedrun en vivo, gestión de tramos (splits) y cronómetro interactivo.
 */

window.OSSEditor = window.OSSEditor || {};

(function() {
  function isSpeedrunScene(sceneKey) {
    return ['gamer_speedrun'].includes(sceneKey)
      || window.location.pathname.includes('/speedrun_split/')
      || document.querySelector('.sidebar-splits') !== null;
  }

  function setupSpeedrun(sceneKey) {
    if (!isSpeedrunScene(sceneKey)) return null;
    if (document.getElementById('oss-speedrun-control')) return document.getElementById('oss-speedrun-control');

    const speedControl = document.createElement('div');
    speedControl.id = 'oss-speedrun-control';
    speedControl.style.cssText = `
      position: fixed; top: 50%; right: 18px; transform: translateY(-50%);
      z-index: 999998; background: rgba(14,18,24,0.96); backdrop-filter: blur(14px);
      border: 1px solid rgba(87,214,196,0.45); border-radius: 8px;
      padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: #F0F6FC; box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(87,214,196,0.15);
      display: flex; flex-direction: column; gap: 8px; width: 250px;
    `;

    speedControl.innerHTML = `
      <div class="hud-drag-handle" style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; display:flex; justify-content:space-between; align-items:center; cursor:grab;" title="Arrastra desde aquí para mover este menú">
        <span>⚡ SPEEDRUN LIVE</span>
        <span style="display:flex; align-items:center; gap:4px;">
          <span id="oss-sr-state" style="font-size:10px; color:#8B949E;">LISTO</span>
          <span style="color:#6E7681; font-size:11px;">⋮⋮</span>
        </span>
      </div>
      <div style="font-size:26px; font-weight:900; color:#FF783F; text-align:center; padding:6px; background:#161B22; border-radius:4px; border:1px solid rgba(255,120,63,0.3); cursor:pointer;" id="oss-sr-readout" title="Clic para Iniciar / Pausar">
        00:09:15
      </div>
      <div style="display:flex; gap:6px;">
        <button id="oss-sr-toggle" type="button" class="hud-btn" style="flex:1; justify-content:center;">▶ Iniciar</button>
        <button id="oss-sr-split" type="button" class="hud-btn" style="flex:1; justify-content:center; background:rgba(87,214,196,0.15); color:#57D6C4; border-color:rgba(87,214,196,0.4);">⚡ Split</button>
      </div>
      <div style="display:flex; gap:6px;">
        <button id="oss-sr-prev-split" type="button" class="hud-btn" style="flex:1; justify-content:center;" title="Retroceder al tramo anterior">⏮ Split Prev</button>
        <button id="oss-sr-reset" type="button" class="hud-btn" style="flex:1; justify-content:center;">🔄 Reset 00:00</button>
      </div>
      <div style="display:flex; gap:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
        <button id="oss-sr-add-split" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px;">➕ Añadir Tramo</button>
        <button id="oss-sr-del-split" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px; color:#F85149;" title="Eliminar el tramo activo">🗑️ Eliminar</button>
      </div>
      <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
        <span style="color:#8B949E; font-size:10px;">TIEMPO:</span>
        <input id="oss-sr-custom-time" type="text" value="00:09:15" placeholder="hh:mm:ss"
          style="flex:1; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                 border-radius:4px; padding:3px 6px; font-size:11px; font-family:inherit; text-align:center;">
        <button id="oss-sr-set-time" type="button" class="hud-btn" style="padding:3px 6px; font-size:10px;">Fijar</button>
      </div>
      <button id="oss-sr-save" type="button" class="hud-btn btn-save" style="width:100%; justify-content:center; padding:6px; margin-top:2px;">💾 Guardar Tramos y Tiempos</button>
    `;
    document.body.appendChild(speedControl);

    let srInterval = null;
    let srSeconds = 555; // 09:15 inicial
    let srRunning = false;
    const srTimerEl = document.getElementById('speedrun-timer') || document.querySelector('.timer-big');
    const srReadout = document.getElementById('oss-sr-readout');
    const srToggleBtn = document.getElementById('oss-sr-toggle');
    const srStateSpan = document.getElementById('oss-sr-state');

    function formatSrTime(s) {
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    }

    function updateSrDisplay() {
      const formatted = formatSrTime(srSeconds);
      if (srReadout) srReadout.textContent = formatted;
      if (srTimerEl) srTimerEl.textContent = formatted;
      const customInput = document.getElementById('oss-sr-custom-time');
      if (customInput && document.activeElement !== customInput) {
        customInput.value = formatted;
      }
    }
    updateSrDisplay();

    // Clic directo en el reloj de pantalla o en visor para Iniciar / Pausar
    if (srTimerEl) {
      srTimerEl.style.cursor = 'pointer';
      srTimerEl.title = 'Haz clic para Iniciar / Pausar el cronómetro';
      srTimerEl.addEventListener('click', (e) => {
        if (window.__OSS_IS_EDITING__) return;
        e.stopPropagation();
        srToggleBtn?.click();
      });
    }
    srReadout?.addEventListener('click', () => {
      srToggleBtn?.click();
    });

    srToggleBtn?.addEventListener('click', () => {
      srRunning = !srRunning;
      srToggleBtn.textContent = srRunning ? '⏸ Pausar' : '▶ Reanudar';
      if (srStateSpan) {
        srStateSpan.textContent = srRunning ? 'CORRIENDO' : 'PAUSA';
        srStateSpan.style.color = srRunning ? '#3FB950' : '#FF783F';
      }
      if (srRunning) {
        srInterval = setInterval(() => {
          srSeconds++;
          updateSrDisplay();
        }, 1000);
        window.OSSEditor.showHudToast('▶ Cronómetro de Speedrun en marcha');
      } else {
        if (srInterval) clearInterval(srInterval);
        window.OSSEditor.showHudToast('⏸ Cronómetro pausado');
      }
    });

    // Split siguiente con captura de tiempo
    document.getElementById('oss-sr-split')?.addEventListener('click', () => {
      const rows = document.querySelectorAll('.split-row');
      if (rows.length > 0) {
        let curIdx = -1;
        rows.forEach((r, idx) => { if (r.classList.contains('active')) curIdx = idx; });
        if (curIdx >= 0) {
          const activeRow = rows[curIdx];
          const timeEl = activeRow.querySelector('.split-time');
          if (timeEl) timeEl.textContent = formatSrTime(srSeconds).substring(3); // mm:ss
          activeRow.classList.remove('active');
        }
        const nextIdx = curIdx < rows.length - 1 ? curIdx + 1 : 0;
        rows[nextIdx].classList.add('active');
        rows[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const nextName = rows[nextIdx].querySelector('.split-name')?.textContent?.trim() || `Tramo ${nextIdx+1}`;
        window.OSSEditor.showHudToast(`⚡ Split registrado (${formatSrTime(srSeconds)}) → Siguiente: "${nextName}"`);
      } else {
        window.OSSEditor.showHudToast('⚡ Split registrado');
      }
    });

    // Split anterior
    document.getElementById('oss-sr-prev-split')?.addEventListener('click', () => {
      const rows = document.querySelectorAll('.split-row');
      if (rows.length > 0) {
        let curIdx = -1;
        rows.forEach((r, idx) => { if (r.classList.contains('active')) curIdx = idx; });
        if (curIdx >= 0) rows[curIdx].classList.remove('active');
        const prevIdx = curIdx <= 0 ? rows.length - 1 : curIdx - 1;
        rows[prevIdx].classList.add('active');
        rows[prevIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const prevName = rows[prevIdx].querySelector('.split-name')?.textContent?.trim() || `Tramo ${prevIdx+1}`;
        window.OSSEditor.showHudToast(`⏮ Retrocedido a: "${prevName}"`);
      }
    });

    // Añadir nuevo tramo
    document.getElementById('oss-sr-add-split')?.addEventListener('click', () => {
      const container = document.querySelector('.splits-list');
      if (!container) return;
      const count = container.querySelectorAll('.split-row').length + 1;
      const numStr = String(count).padStart(2, '0');
      const newRow = document.createElement('div');
      newRow.className = 'split-row';
      newRow.innerHTML = `
        <span class="split-name">${numStr} NUEVO TRAMO</span>
        <div class="split-times">
          <span class="split-delta negative">-00:10</span>
          <span class="split-time">--:--</span>
        </div>
      `;
      container.appendChild(newRow);
      newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      window.OSSEditor.showHudToast(`➕ Añadido tramo ${numStr} a la lista`);
    });

    // Eliminar tramo activo
    document.getElementById('oss-sr-del-split')?.addEventListener('click', () => {
      const rows = document.querySelectorAll('.split-row');
      if (rows.length <= 1) {
        window.OSSEditor.showHudToast('⚠️ Debe quedar al menos un tramo');
        return;
      }
      const activeRow = document.querySelector('.split-row.active') || rows[rows.length - 1];
      const nextActive = activeRow.previousElementSibling || activeRow.nextElementSibling;
      activeRow.remove();
      if (nextActive && nextActive.classList.contains('split-row')) {
        nextActive.classList.add('active');
      } else {
        document.querySelector('.split-row')?.classList.add('active');
      }
      window.OSSEditor.showHudToast('🗑️ Tramo eliminado');
    });

    // Fijar tiempo manualmente
    document.getElementById('oss-sr-set-time')?.addEventListener('click', () => {
      const inp = document.getElementById('oss-sr-custom-time');
      if (!inp) return;
      const parts = inp.value.trim().split(':').map(Number);
      let s = 0;
      if (parts.length === 3) s = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
      else if (parts.length === 2) s = (parts[0] * 60) + parts[1];
      else if (parts.length === 1) s = parts[0];
      if (!isNaN(s) && s >= 0) {
        srSeconds = s;
        updateSrDisplay();
        window.OSSEditor.showHudToast(`⏱️ Tiempo fijado a ${formatSrTime(srSeconds)}`);
      }
    });

    // Guardar tramos y tiempos
    document.getElementById('oss-sr-save')?.addEventListener('click', async () => {
      const btn = document.getElementById('oss-sr-save');
      btn.textContent = '⏳ Guardando...';
      if (window.OSSEditor.saveTexts) {
        await window.OSSEditor.saveTexts();
      }
      btn.textContent = '💾 Guardar Tramos y Tiempos';
      window.OSSEditor.showHudToast('💾 Tramos y tiempos guardados con éxito');
    });

    // Reset
    document.getElementById('oss-sr-reset')?.addEventListener('click', () => {
      srRunning = false;
      if (srInterval) clearInterval(srInterval);
      srSeconds = 0;
      updateSrDisplay();
      if (srToggleBtn) srToggleBtn.textContent = '▶ Iniciar';
      if (srStateSpan) { srStateSpan.textContent = 'LISTO'; srStateSpan.style.color = '#8B949E'; }
      const rows = document.querySelectorAll('.split-row');
      rows.forEach((r, idx) => {
        r.classList.toggle('active', idx === 0);
      });
      window.OSSEditor.showHudToast('🔄 Cronómetro reseteado a 00:00:00 y vuelto al tramo 1');
    });

    if (window.OSSEditor.makeDraggable) {
      window.OSSEditor.makeDraggable(speedControl, '.hud-drag-handle');
    }

    return speedControl;
  }

  window.OSSEditor.isSpeedrunScene = isSpeedrunScene;
  window.OSSEditor.setupSpeedrun = setupSpeedrun;
})();
