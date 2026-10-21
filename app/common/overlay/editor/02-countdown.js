/**
 * app/common/overlay/editor/02-countdown.js
 * Controles flotantes de cuenta atrás (Starting Soon) y temporizadores Pomodoro.
 */

window.OSSEditor = window.OSSEditor || {};

(function() {
  let countdownInterval = null;

  function isCountdownScene(sceneKey) {
    return ['startingSoon', 'oss_starting', 'gamer_starting', 'cozy_starting', 'cozy_pomodoro'].includes(sceneKey)
      || window.location.pathname.includes('/starting-soon/')
      || window.location.pathname.includes('/study_pomodoro/')
      || document.querySelector('.starting-countdown') !== null
      || document.querySelector('.pomo-time') !== null;
  }

  function setupCountdown(sceneKey) {
    if (!isCountdownScene(sceneKey)) return null;
    if (document.getElementById('oss-countdown-control')) return document.getElementById('oss-countdown-control');

    const isPomo = sceneKey === 'cozy_pomodoro'
      || window.location.pathname.includes('/study_pomodoro/')
      || document.querySelector('.pomo-time') !== null;

    const countdownControl = document.createElement('div');
    countdownControl.id = 'oss-countdown-control';
    countdownControl.style.cssText = `
      position: fixed; top: 50%; right: 18px; transform: translateY(-50%);
      z-index: 999998; background: rgba(14,18,24,0.96); backdrop-filter: blur(14px);
      border: 1px solid rgba(87,214,196,0.45); border-radius: 8px;
      padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: #F0F6FC; box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(87,214,196,0.15);
      display: flex; flex-direction: column; gap: 10px; width: 230px;
    `;

    const presets = isPomo
      ? [ { label: '🍅 25m', val: 25 }, { label: '🍅 50m', val: 50 }, { label: '☕ 5m', val: 5 }, { label: '☕ 10m', val: 10 } ]
      : [ { label: '3 min', val: 3 }, { label: '5 min', val: 5 }, { label: '10 min', val: 10 }, { label: '15 min', val: 15 } ];

    countdownControl.innerHTML = `
      <div class="hud-drag-handle" style="font-weight:700; color:#57D6C4; letter-spacing:0.5px; border-bottom:1px solid rgba(87,214,196,0.2); padding-bottom:7px; display:flex; justify-content:space-between; align-items:center; cursor:grab;" title="Arrastra desde aquí para mover este menú">
        <span>${isPomo ? '🍅 POMODORO FOCUS' : '⏱️ CUENTA ATRÁS'}</span>
        <span style="display:flex; align-items:center; gap:4px;">
          <span id="oss-cd-status" style="font-size:10px; color:#3FB950;">EN MARCHA</span>
          <span style="color:#6E7681; font-size:11px;">⋮⋮</span>
        </span>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <span style="color:#8B949E; font-size:10px;">AJUSTES RÁPIDOS:</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
          ${presets.map(p => `<button type="button" class="hud-btn oss-cd-preset" data-mins="${p.val}" style="padding:4px 6px; font-size:10px; justify-content:center;">${p.label}</button>`).join('')}
        </div>
        <div style="display:flex; gap:4px; margin-top:2px;">
          <button id="oss-cd-plus-1m" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px;">+1 Min</button>
          <button id="oss-cd-minus-1m" type="button" class="hud-btn" style="flex:1; justify-content:center; font-size:10px;">-1 Min</button>
        </div>
      </div>
      <label style="display:flex; flex-direction:column; gap:4px;">
        <span style="color:#8B949E; font-size:10px;">MINUTOS TOTALES:</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <input id="oss-cd-minutes" type="number" min="1" max="180" step="1" value="${isPomo ? '25' : '5'}"
            style="width:65px; background:#161B22; color:#F0F6FC; border:1px solid rgba(87,214,196,0.4);
                   border-radius:4px; padding:4px 8px; font-size:13px; font-family:inherit;
                   font-weight:700; outline:none; text-align:center;"
          >
          <span style="color:#8B949E;">min</span>
          <span id="oss-cd-preview" style="color:#57D6C4; font-size:13px; font-weight:700; margin-left:auto;">${isPomo ? '25:00' : '05:00'}</span>
        </div>
      </label>
      <div style="display:flex; gap:6px;">
        <button id="oss-cd-toggle" type="button" class="hud-btn" style="flex:1; justify-content:center;">⏸ Pausar</button>
        <button id="oss-cd-reset" type="button" class="hud-btn" style="flex:1; justify-content:center;">🔄 Reiniciar</button>
      </div>
      <button id="oss-cd-apply" type="button" class="hud-btn btn-save" style="width:100%; justify-content:center; padding:6px;">💾 Guardar y Aplicar</button>
    `;
    document.body.appendChild(countdownControl);

    let timerRunning = true;
    let totalMins = isPomo ? 25 : 5;
    let currentSecondsRemaining = totalMins * 60;
    let totalSecondsInitial = totalMins * 60;

    const countdownEl = document.querySelector('.starting-countdown, .pomo-time, .pomodoro-countdown');
    const progressFill = document.querySelector('.tech-progress-fill');
    const statusSpan = document.getElementById('oss-cd-status');
    const toggleBtn = document.getElementById('oss-cd-toggle');

    function updateClockDisplay() {
      const mins = Math.floor(currentSecondsRemaining / 60);
      const secs = currentSecondsRemaining % 60;
      const formatted = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
      if (countdownEl) countdownEl.textContent = formatted;
      const prev = document.getElementById('oss-cd-preview');
      if (prev) prev.textContent = formatted;

      if (progressFill && totalSecondsInitial > 0) {
        const pct = Math.min(100, Math.max(0, ((totalSecondsInitial - currentSecondsRemaining) / totalSecondsInitial) * 100));
        progressFill.style.width = `${pct}%`;
      }
    }

    function startTimerEngine(mins) {
      if (countdownInterval) clearInterval(countdownInterval);
      totalMins = mins;
      totalSecondsInitial = totalMins * 60;
      currentSecondsRemaining = totalSecondsInitial;
      timerRunning = true;
      if (statusSpan) { statusSpan.textContent = 'EN MARCHA'; statusSpan.style.color = '#3FB950'; }
      if (toggleBtn) toggleBtn.textContent = '⏸ Pausar';

      updateClockDisplay();
      countdownInterval = setInterval(() => {
        if (!timerRunning) return;
        if (currentSecondsRemaining > 0) {
          currentSecondsRemaining--;
          updateClockDisplay();
        } else {
          if (countdownEl) countdownEl.textContent = isPomo ? '00:00 - ¡DESCANSO!' : '00:00 - ¡EMPEZANDO!';
          if (statusSpan) { statusSpan.textContent = 'FINALIZADO'; statusSpan.style.color = '#FF783F'; }
          if (toggleBtn) toggleBtn.textContent = '▶ Reanudar';
          timerRunning = false;
          clearInterval(countdownInterval);
        }
      }, 1000);
    }

    // Sincronizar valor inicial de config
    const syncCdInput = () => {
      const cfg = window.OSS_CONFIG || window.TALLER_CONFIG;
      const mins = isPomo ? (cfg?.pomodoroMinutes || 25) : cfg?.startingSoon?.countdownMinutes;
      if (mins && mins > 0) {
        const inp = document.getElementById('oss-cd-minutes');
        if (inp) inp.value = mins;
        startTimerEngine(mins);
      }
    };
    setTimeout(syncCdInput, 800);

    // Presets rápidos
    countdownControl.querySelectorAll('.oss-cd-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const mins = parseInt(btn.dataset.mins) || 5;
        const inp = document.getElementById('oss-cd-minutes');
        if (inp) inp.value = mins;
        startTimerEngine(mins);
        window.OSSEditor.showHudToast(`⏱️ Temporizador fijado a ${mins} min`);
      });
    });

    // Botón Pausar / Reanudar
    toggleBtn?.addEventListener('click', () => {
      timerRunning = !timerRunning;
      toggleBtn.textContent = timerRunning ? '⏸ Pausar' : '▶ Reanudar';
      if (statusSpan) {
        statusSpan.textContent = timerRunning ? 'EN MARCHA' : 'PAUSADO';
        statusSpan.style.color = timerRunning ? '#3FB950' : '#FF783F';
      }
      window.OSSEditor.showHudToast(timerRunning ? '▶ Temporizador reanudado' : '⏸ Temporizador pausado');
    });

    // Botón Reiniciar
    document.getElementById('oss-cd-reset')?.addEventListener('click', () => {
      const inp = document.getElementById('oss-cd-minutes');
      const m = parseInt(inp?.value) || totalMins;
      startTimerEngine(m);
      window.OSSEditor.showHudToast(`🔄 Temporizador reiniciado a ${m} min`);
    });

    // Botones +1 Min / -1 Min
    document.getElementById('oss-cd-plus-1m')?.addEventListener('click', () => {
      currentSecondsRemaining += 60;
      totalSecondsInitial += 60;
      updateClockDisplay();
      window.OSSEditor.showHudToast('⏱️ +1 Minuto añadido');
    });
    document.getElementById('oss-cd-minus-1m')?.addEventListener('click', () => {
      if (currentSecondsRemaining > 60) {
        currentSecondsRemaining -= 60;
        totalSecondsInitial = Math.max(60, totalSecondsInitial - 60);
        updateClockDisplay();
        window.OSSEditor.showHudToast('⏱️ -1 Minuto restado');
      }
    });

    // Clic directo en el reloj de la pantalla para Iniciar / Pausar
    if (countdownEl) {
      countdownEl.style.cursor = 'pointer';
      countdownEl.title = 'Haz clic para Iniciar / Pausar el temporizador';
      countdownEl.addEventListener('click', (e) => {
        if (window.__OSS_IS_EDITING__) return;
        e.stopPropagation();
        toggleBtn?.click();
      });
    }

    // Guardar y Aplicar en el servidor
    document.getElementById('oss-cd-apply')?.addEventListener('click', async () => {
      const inp = document.getElementById('oss-cd-minutes');
      const newMins = parseInt(inp?.value) || 5;
      if (newMins < 1 || newMins > 180) {
        window.OSSEditor.showHudToast('⚠️ El valor debe ser entre 1 y 180 minutos');
        return;
      }

      startTimerEngine(newMins);

      try {
        const res = await fetch('/api/overlays/texts');
        const serverData = await res.json();
        const texts = serverData.texts || {};
        if (!texts.startingSoon) texts.startingSoon = {};
        texts.startingSoon.countdownMinutes = newMins;
        if (isPomo) texts.pomodoroMinutes = newMins;

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
        window.OSSEditor.showHudToast(`💾 Tiempo guardado: ${newMins} min sincronizado con OBS Studio`);
      } catch(e) {
        window.OSSEditor.showHudToast('⚠️ Tiempo actualizado localmente (error al persistir)');
      }
    });

    if (window.OSSEditor.makeDraggable) {
      window.OSSEditor.makeDraggable(countdownControl, '.hud-drag-handle');
    }

    return countdownControl;
  }

  window.OSSEditor.isCountdownScene = isCountdownScene;
  window.OSSEditor.setupCountdown = setupCountdown;
})();
