// ====================================================================
// MÓDULO WIDGET: TEMPORIZADOR (CONTROLES, PRESETS, ACCIONES Y PIP)
// ====================================================================

function renderTimerShortcuts() {
  const container = document.getElementById('timer-shortcuts-container');
  if (!container || !cachedWidgetsConfig.timer) return;

  const shortcuts = (cachedWidgetsConfig.timer.shortcuts || []).filter(s => s.pinned !== false);
  container.innerHTML = '';

  shortcuts.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'widget-shortcut-btn';
    const color = s.color || '#57D6C4';
    btn.style.borderColor = `${color}60`;
    btn.style.boxShadow = `0 0 10px ${color}15`;
    btn.innerHTML = `
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></span>
      <span>${s.label}</span>
    `;
    btn.title = `Lanzar: ${s.title} (${s.seconds}s)`;
    btn.onclick = () => triggerTimerShortcut(s.id);
    container.appendChild(btn);
  });

  // Botón Pausar
  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.className = 'widget-shortcut-btn';
  pauseBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  pauseBtn.style.color = '#F87171';
  pauseBtn.innerHTML = `<span>⏸️ Pausar</span>`;
  pauseBtn.onclick = () => API.triggerWidgetAction('timer', 'pause');
  container.appendChild(pauseBtn);
}


async function triggerTimerShortcut(shortcutId) {
  const sc = (cachedWidgetsConfig?.timer?.shortcuts || []).find(s => s.id === shortcutId);
  if (!sc) return;
  await API.triggerWidgetAction('timer', 'start', {
    seconds: sc.seconds,
    title: sc.title || sc.label,
    mode: sc.mode || 'down',
    unit: sc.unit || 'MIN',
    subtitle: sc.subtitle || ''
  });
}


function renderTimerControls(container) {
  if (!container || !cachedWidgetsConfig) return;
    const t = cachedWidgetsConfig.timer || {};
    const s = t.styles || {};
    const presets = t.presets || [];
    const activePresetId = t.activePreset || s.themePreset || 'maker_glass';
    const alerts = t.alerts || {};
    const periodic = alerts.periodic || {};
    const sameAsChat = t.sameStyleAsChat === true;

    let presetsOptionsHtml = '';
    presets.forEach(p => {
      const isSel = (p.id === activePresetId) ? 'selected' : '';
      const tag = p.isBuiltin ? '' : ' ⭐ [Personalizado]';
      presetsOptionsHtml += `<option value="${p.id}" ${isSel}>${p.name}${tag}</option>`;
    });

    const currentMode = t.mode || 'down';
    const initialSec = t.initialSeconds !== undefined ? t.initialSeconds : (t.defaultSeconds || 300);
    const targetSec = t.targetSeconds || 0;
    const timeFmt = t.timeFormat || 'mm:ss';
    const formatLayout = t.formatLayout || 'prefix_time_unit_sub';
    const customTemplate = t.customTemplate || '{prefix} {time} {unit} - {sub}';
    const titleVal = t.title || 'EN BREVE COMENZAMOS';
    const unitVal = t.unitLabel || t.unit || 'MIN';
    const subVal = t.subtitle || 'FASE ACTUAL';

    // Simplified styles
    const shape = s.shape || 'rounded';
    const bgType = s.bgType || 'glass';
    const bgColor = s.bgColor || '#191D21';
    const borderColor = s.borderColor || '#57D6C4';
    const glowIntensity = s.glowIntensity !== undefined ? s.glowIntensity : 40;
    const fontFamily = s.fontFamily || (s.timeDigits && s.timeDigits.fontFamily) || 'outfit';
    const digitsSize = (s.timeDigits && s.timeDigits.fontSize) || 38;
    const digitsColor = (s.timeDigits && s.timeDigits.color) || '#F2EEE5';
    const barShow = s.progressBar?.show !== false;

    // Alerts
    const alarmSound = t.alarmSound || alerts.finalAlarm?.sound || 'bell';
    const screenFlash = alerts.finalAlarm?.flashScreen !== false;
    const warnSecs = t.warningSeconds !== undefined ? t.warningSeconds : (alerts.warningThreshold?.seconds || 30);
    const periodicEnabled = periodic.enabled === true;
    const periodicMin = periodic.everyMinutes || 15;
    const periodicMsg = periodic.message || '💧 ¡Hora de beber agua y estirar!';
    const periodicSound = periodic.sound || 'beep_digital';
    const milestonesStr = (alerts.milestones || []).map(m => Math.round(m.atSeconds / 60)).filter(n => n > 0).join(', ') || '5, 1';

    container.innerHTML = `
      <!-- BARRA DE ACCIÓN RÁPIDA EN DIRECTO -->
      <div style="background: linear-gradient(135deg, rgba(87,214,196,0.1), rgba(25,29,33,0.8)); border: 1px solid rgba(87,214,196,0.3); border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">⏱️</span>
          <div>
            <strong style="font-size: 13px; color: #fff;">Control Remoto en Directo</strong>
            <div style="font-size: 11px; color: var(--color-text-dim);">Transmite órdenes inmediatas por WebSocket a OBS Studio</div>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 12px;" onclick="sendTimerAction('start')">▶️ Iniciar</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 12px;" onclick="sendTimerAction('pause')">⏸️ Pausar</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 12px;" onclick="sendTimerAction('reset', { seconds: parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300, mode: document.getElementById('cfg-timer-mode')?.value || 'down' })">🔄 Reiniciar</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 10px; color: #57D6C4;" onclick="sendTimerAction('add', { seconds: 60 })">➕ +1 Min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 10px; color: #57D6C4;" onclick="sendTimerAction('add', { seconds: 300 })">➕ +5 Min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 6px 10px; color: #EF4444;" onclick="sendTimerAction('stop')">🛑 Detener</button>
        </div>
      </div>

      <!-- 1. CONFIGURACIÓN DEL TEMPORIZADOR Y TEXTOS (PRIMERO) -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>⚙️</span>
            <span>1. Configuración del Temporizador y Textos</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Modo de Conteo:</label>
            <select id="cfg-timer-mode" class="form-select" onchange="updateTimerPipPreview()">
              <option value="down" ${currentMode === 'down' ? 'selected' : ''}>⏳ Cuenta Atrás (Hacia Cero)</option>
              <option value="up" ${currentMode === 'up' ? 'selected' : ''}>⏱️ Cronómetro (Hacia Adelante)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Tiempo Inicial (segundos):</label>
            <input type="number" id="cfg-timer-initial-sec" class="form-input" value="${initialSec}" min="0" max="86400" oninput="updateTimerPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Formato del Reloj:</label>
            <select id="cfg-timer-time-format" class="form-select" onchange="updateTimerPipPreview()">
              <option value="mm:ss" ${timeFmt === 'mm:ss' ? 'selected' : ''}>05:00 (Minutos y Segundos)</option>
              <option value="hh:mm:ss" ${timeFmt === 'hh:mm:ss' ? 'selected' : ''}>00:05:00 (Con Horas)</option>
              <option value="human" ${timeFmt === 'human' ? 'selected' : ''}>5m 00s (Texto Compacto)</option>
              <option value="ss" ${timeFmt === 'ss' ? 'selected' : ''}>300s (Solo Segundos)</option>
            </select>
          </div>
        </div>

        <!-- Botones de preajuste rápido -->
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 4px;">
          <span style="font-size: 11px; color: var(--color-text-dim); font-family: var(--font-tech); margin-right: 6px;">⚡ Tiempos rápidos:</span>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(0)">0s (Crono)</button>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(60)">1 min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(180)">3 min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(300)">5 min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(600)">10 min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(900)">15 min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(1800)">30 min</button>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="setTimerPresetSeconds(3600)">1 hora</button>
        </div>

        <!-- Textos -->
        <div style="display: grid; grid-template-columns: 1fr 140px 1fr; gap: 14px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Texto Principal / Título:</label>
            <input type="text" id="cfg-timer-title" class="form-input" value="${titleVal}" placeholder="Ej: EN BREVE COMENZAMOS" oninput="updateTimerPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Medida de Tiempo:</label>
            <input type="text" id="cfg-timer-unit" class="form-input" value="${unitVal}" placeholder="Ej: MIN, S, HRS..." oninput="updateTimerPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Subtítulo / Mensaje Secundario:</label>
            <input type="text" id="cfg-timer-subtitle" class="form-input" value="${subVal}" placeholder="Ej: ¡Prepara algo para beber!" oninput="updateTimerPipPreview()">
          </div>
        </div>

        <!-- Distribución / Orden de bloques -->
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: flex-end; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Orden y Distribución de Bloques:
            </label>
            <select id="cfg-timer-format-layout" class="form-select" onchange="onTimerLayoutChange(this.value)">
              <option value="prefix_time_unit_sub" ${formatLayout === 'prefix_time_unit_sub' ? 'selected' : ''}>🏷️ Texto + ⏱️ X + 📏 Medida + 💬 Subtítulo</option>
              <option value="time_unit_prefix" ${formatLayout === 'time_unit_prefix' ? 'selected' : ''}>⏱️ X + 📏 Medida + 🏷️ Texto</option>
              <option value="prefix_unit_time" ${formatLayout === 'prefix_unit_time' ? 'selected' : ''}>🏷️ Texto + 📏 Medida + ⏱️ X</option>
              <option value="time_only" ${formatLayout === 'time_only' ? 'selected' : ''}>⏱️ Solo Dígitos X</option>
              <option value="custom_template" ${formatLayout === 'custom_template' ? 'selected' : ''}>🛠️ Personalizado (Escribe el orden que quieras con tokens)</option>
            </select>
          </div>
          <div style="margin-top: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 6px 8px;">
            <div style="font-size: 10px; font-weight: 700; color: var(--color-accent-cyan); margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
              <span>💡 Pulsa cualquier etiqueta para insertarla en la plantilla:</span>
              <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 1px 5px;" onclick="openWidgetDevGuideModal('timer')">📖 Guía Tokens</button>
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #57D6C4;" onclick="insertTimerToken('{time}')" title="Tiempo formateado según minutos y segundos (ej: 04:59)">⏱️ {time} = Tiempo</button>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #38BDF8;" onclick="insertTimerToken('{unit}')" title="Etiqueta de unidad configurada (ej: MIN)">📏 {unit} = Unidad</button>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #A78BFA;" onclick="insertTimerToken('{prefix}')" title="Título o prefijo principal (ej: EN BREVE)">🏷️ {prefix} = Título</button>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #F59E0B;" onclick="insertTimerToken('{sub}')" title="Subtítulo o fase actual (ej: FASE 1)">💬 {sub} = Subtítulo</button>
            </div>
          </div>
        </div>

        <div id="box-timer-custom-template" class="form-group" style="display: ${formatLayout === 'custom_template' ? 'block' : 'none'}; margin-bottom: 0; background: rgba(0,0,0,0.3); border: 1px dashed var(--color-border-dim); border-radius: 4px; padding: 10px;">
          <label style="font-size: 11px; font-weight: 600; color: var(--color-accent-cyan); margin-bottom: 4px; display: block;">
            Plantilla Libre de Tokens (ej: <code>{prefix} {unit} {time} {sub}</code>):
          </label>
          <input type="text" id="cfg-timer-custom-template" class="form-input" style="font-family: monospace;" value="${customTemplate}" oninput="updateTimerPipPreview()">
        </div>
      </div>

      <!-- 2. ALERTAS Y AVISOS -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🔔</span>
            <span>2. Alertas, Avisos y Recordatorios</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Sonido Alarma Final:</label>
            <div style="display: flex; gap: 6px;">
              <select id="cfg-timer-alarm-sound" class="form-select" style="flex: 1;">
                <option value="bell" ${alarmSound === 'bell' ? 'selected' : ''}>🔔 Campana Cristalina</option>
                <option value="beep_digital" ${alarmSound === 'beep_digital' ? 'selected' : ''}>📟 Pitido Digital</option>
                <option value="coin" ${alarmSound === 'coin' ? 'selected' : ''}>🪙 Moneda Retro</option>
                <option value="victory" ${alarmSound === 'victory' ? 'selected' : ''}>🎺 Fanfarria Victoria</option>
                <option value="boom" ${alarmSound === 'boom' ? 'selected' : ''}>💥 Punch Profundo</option>
                <option value="retro_pulse" ${alarmSound === 'retro_pulse' ? 'selected' : ''}>👾 Pulso Arcade</option>
                <option value="none" ${alarmSound === 'none' ? 'selected' : ''}>🔇 Sin Sonido</option>
              </select>
              <button type="button" class="btn-stage-preset" onclick="testTimerSound(document.getElementById('cfg-timer-alarm-sound').value)" title="Probar sonido">🔊</button>
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Destello Final en Pantalla:</label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; height: 36px;">
              <input type="checkbox" id="cfg-timer-flash" ${screenFlash ? 'checked' : ''}>
              <span style="font-size: 12px; color: #fff;">Flash Rojo Neón</span>
            </label>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Aviso Advertencia (últimos seg):</label>
            <input type="number" id="cfg-timer-warn-sec" class="form-input" value="${warnSecs}" min="0" max="600">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <!-- Recordatorio periódico -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 700; color: #57D6C4;">💧 Recordatorio Periódico</span>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff;">
                <input type="checkbox" id="cfg-timer-periodic-enable" ${periodicEnabled ? 'checked' : ''}>
                <span>Activar</span>
              </label>
            </div>
            <div style="display: grid; grid-template-columns: 100px 1fr; gap: 8px; margin-bottom: 8px;">
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Cada (min):</label>
                <input type="number" id="cfg-timer-periodic-min" class="form-input" min="1" max="180" value="${periodicMin}">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Sonido:</label>
                <select id="cfg-timer-periodic-sound" class="form-select">
                  <option value="beep_digital" ${periodicSound === 'beep_digital' ? 'selected' : ''}>📟 Pitido Digital</option>
                  <option value="bell" ${periodicSound === 'bell' ? 'selected' : ''}>🔔 Campana</option>
                  <option value="coin" ${periodicSound === 'coin' ? 'selected' : ''}>🪙 Moneda</option>
                </select>
              </div>
            </div>
            <div>
              <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Mensaje en Banner de OBS:</label>
              <input type="text" id="cfg-timer-periodic-msg" class="form-input" value="${periodicMsg}">
            </div>
          </div>

          <!-- Avisos en minutos concretos -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 12px;">
            <span style="font-size: 12px; font-weight: 700; color: #57D6C4; display: block; margin-bottom: 8px;">🎯 Avisos en Minutos Concretos (Hitos)</span>
            <div class="form-group" style="margin-bottom: 8px;">
              <label style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 4px; display: block;">Minutos para avisar (separados por coma):</label>
              <input type="text" id="cfg-timer-milestones" class="form-input" value="${milestonesStr}" placeholder="Ej: 10, 5, 1">
              <span style="font-size: 10px; color: var(--color-text-dim); margin-top: 4px; display: block;">Dispara un banner y sonido cuando queden exactamente esos minutos.</span>
            </div>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; color: #CBD5E1;">
              <input type="checkbox" id="cfg-timer-points" ${t.allowChannelPointsAdd !== false ? 'checked' : ''}>
              <span>Permitir que el chat sume +60s con Puntos de Canal Twitch</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 3. PRESETS Y ACCIONES RÁPIDAS (ATAJOS) -->
      <div class="miniapp-section-card" style="border-color: rgba(87,214,196,0.3); background: rgba(87,214,196,0.03);">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>⚡</span>
            <span>3. Presets y Acciones Rápidas (Atajos)</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <!-- Gestor de Presets del Temporizador -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="font-size: 13px; color: #fff;">💾 Gestor de Presets del Temporizador</strong>
              <span style="font-size: 10px; font-family: var(--font-tech); color: var(--color-text-dim);">Carga, edita o crea temas</span>
            </div>
            
            <div class="form-group" style="margin-bottom: 8px;">
              <select id="cfg-timer-preset-select" class="form-select" onchange="onTimerPresetChange(this.value)">
                ${presetsOptionsHtml}
              </select>
            </div>

            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 5px 10px;" onclick="onTimerPresetChange(document.getElementById('cfg-timer-preset-select').value)" title="Cargar los valores de este preset en el formulario">
                📥 Cargar
              </button>
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 5px 10px;" onclick="saveCurrentTimerPreset()" title="Guardar cambios de tiempos, textos y diseño en este preset">
                💾 Guardar Cambios
              </button>
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 5px 8px;" onclick="renameCurrentTimerPreset()" title="Renombrar este preset">
                ✏️ Renombrar
              </button>
              <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 5px 10px;" onclick="saveCurrentTimerAsPreset()" title="Guardar la configuración actual como un nuevo preset">
                ➕ Guardar Nuevo...
              </button>
              <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 5px 8px; color: #EF4444;" onclick="deleteCurrentTimerPreset()" title="Eliminar preset si es personalizado">
                🗑️
              </button>
            </div>
            <p style="font-size: 10px; color: var(--color-text-dim); margin-bottom: 0;">
              Al pulsar <strong>Cargar</strong> o seleccionar un preset se restauran sus tiempos, textos, sonidos y diseño. Puedes modificarlos y pulsar <strong>Guardar Cambios</strong>.
            </p>
          </div>

          <!-- Mandar a Acción Rápida -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <strong style="font-size: 13px; color: #57D6C4; display: block; margin-bottom: 4px;">⚡ Mandar a Acción Rápida (Atajo)</strong>
            <p style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 10px;">
              Crea un botón de un clic con este tiempo y título exacto para lanzarlo en directo.
            </p>
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 8px;">
              <input type="text" id="cfg-timer-shortcut-label" class="form-input" placeholder="Nombre botón (ej. '☕ Pausa 5 Min')" value="${titleVal}">
              <input type="color" id="cfg-timer-shortcut-color" value="#57D6C4" style="height: 36px; width: 44px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" title="Color del botón de acceso rápido">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff;">
                <input type="checkbox" id="cfg-timer-shortcut-pinned" checked>
                <span>👁️ Mostrar fuera en la tarjeta principal</span>
              </label>
              <button type="button" class="btn-stage-preset" style="color: #57D6C4; border-color: #57D6C4; font-size: 11px; padding: 6px 12px; font-weight: 700;" onclick="saveCurrentTimerAsShortcut()">
                ➕ Añadir Atajo
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. APARIENCIA VISUAL (AL FINAL Y SIMPLIFICADA) -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🎨</span>
            <span>4. Apariencia y Personalización Visual</span>
          </div>
        </div>

        <!-- CASILLA: MISMO ESTILO QUE EL CHAT -->
        <div style="background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(87,214,196,0.12)); border: 1px solid rgba(139,92,246,0.4); border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13px; font-weight: 700; color: #fff;">
            <input type="checkbox" id="cfg-timer-same-as-chat" ${sameAsChat ? 'checked' : ''} onchange="toggleSameStyleAsChat(this.checked)">
            <span>🔗 Mismo estilo que el Chat (Heredar silueta, colores, fuentes y fondo automáticamente)</span>
          </label>
          <span id="badge-chat-synced" style="font-size: 10px; font-family: var(--font-tech); padding: 4px 10px; border-radius: 4px; background: rgba(87,214,196,0.2); color: #57D6C4; font-weight: 700; display: ${sameAsChat ? 'inline-block' : 'none'};">
            🟢 ENLAZADO AL CHAT
          </span>
        </div>

        <!-- CONTROLES VISUALES LIMPIOS (SIN SATURAR) -->
        <div id="timer-style-controls-wrapper" style="opacity: ${sameAsChat ? '0.45' : '1'}; pointer-events: ${sameAsChat ? 'none' : 'auto'}; transition: opacity 0.2s ease;">
          <!-- Forma, Fondo, Tipografía y Acento (LIMPIOS Y DIRECTOS) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Silueta / Forma:</label>
              <select id="cfg-timer-shape" class="form-select" onchange="updateTimerPipPreview()">
                <option value="rounded" ${shape === 'rounded' ? 'selected' : ''}>🟦 Esquinas Suaves (Glassmorphism)</option>
                <option value="box" ${shape === 'box' ? 'selected' : ''}>🔲 Cuadrado Técnico (Minimal)</option>
                <option value="bubble" ${shape === 'bubble' ? 'selected' : ''}>💬 Bocadillo Cómic</option>
                <option value="scifi" ${shape === 'scifi' ? 'selected' : ''}>⚡ Sci-Fi Biselado</option>
                <option value="pill" ${shape === 'pill' ? 'selected' : ''}>💊 Píldora Redondeada</option>
                <option value="arcade" ${shape === 'arcade' ? 'selected' : ''}>👾 Arcade Retro 8-Bit</option>
                <option value="tag" ${shape === 'tag' ? 'selected' : ''}>🏷️ Etiqueta Maker</option>
                <option value="slant" ${shape === 'slant' ? 'selected' : ''}>🎮 Slant Inclinado</option>
                <option value="soft_card" ${shape === 'soft_card' ? 'selected' : ''}>🌸 Tarjeta Kawaii</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Capa de Fondo:</label>
              <select id="cfg-timer-bgtype" class="form-select" onchange="updateTimerPipPreview()">
                <option value="glass" ${bgType === 'glass' ? 'selected' : ''}>💎 Cristal Frosted (Glassmorphism)</option>
                <option value="gradient" ${bgType === 'gradient' ? 'selected' : ''}>🎨 Degradado Dual</option>
                <option value="solid" ${bgType === 'solid' ? 'selected' : ''}>⬛ Color Sólido</option>
                <option value="transparent" ${bgType === 'transparent' ? 'selected' : ''}>👻 100% Transparente (Directo)</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Tipografía Principal:</label>
              <select id="cfg-timer-digits-font" class="form-select" onchange="updateTimerPipPreview()">
                ${buildTimerFontOptions(fontFamily)}
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Color de Dígitos:</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="color" id="cfg-timer-digits-color" value="${digitsColor}" style="height: 36px; width: 44px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateTimerPipPreview()">
                <input type="range" id="cfg-timer-digits-size" min="20" max="80" value="${digitsSize}" oninput="updateTimerPipPreview();" style="flex: 1;" title="Tamaño de los dígitos">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Color de Borde / Acento:</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="color" id="cfg-timer-border" value="${borderColor}" style="height: 36px; width: 44px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="document.getElementById('cfg-timer-border-hex').value=this.value; updateTimerPipPreview()">
                <input type="text" id="cfg-timer-border-hex" class="form-input" value="${borderColor}" style="flex: 1; font-family: monospace;" oninput="document.getElementById('cfg-timer-border').value=this.value; updateTimerPipPreview()">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Color de Fondo:</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="color" id="cfg-timer-bgcolor" value="${bgColor}" style="height: 36px; width: 44px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="document.getElementById('cfg-timer-bgcolor-hex').value=this.value; updateTimerPipPreview()">
                <input type="text" id="cfg-timer-bgcolor-hex" class="form-input" value="${bgColor}" style="flex: 1; font-family: monospace;" oninput="document.getElementById('cfg-timer-bgcolor').value=this.value; updateTimerPipPreview()">
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Resplandor Neón Glow:</label>
              <input type="range" id="cfg-timer-glow" min="0" max="100" value="${glowIntensity}" oninput="updateTimerPipPreview()" style="width: 100%;">
            </div>
            <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; justify-content: space-between; height: 100%;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
                <input type="checkbox" id="cfg-timer-bar-show" ${barShow ? 'checked' : ''} onchange="updateTimerPipPreview()">
                <span>📊 Mostrar Barra de Progreso</span>
              </label>
            </div>
          </div>

          <!-- Inputs ocultos para mantener compatibilidad total con el motor de render -->
          <input type="hidden" id="cfg-timer-bggrad" value="${s.bgGradient || '#0B0D0F'}">
          <input type="hidden" id="cfg-timer-borderstyle" value="${s.borderStyle || 'left_neon'}">
          <input type="hidden" id="cfg-timer-borderwidth" value="${s.borderWidth !== undefined ? s.borderWidth : 3}">
          <input type="hidden" id="cfg-timer-opacity" value="${s.bgOpacity !== undefined ? s.bgOpacity : 94}">
          <input type="hidden" id="cfg-timer-target-sec" value="${targetSec}">
          <input type="hidden" id="cfg-timer-unit-font" value="${fontFamily}">
          <input type="hidden" id="cfg-timer-unit-size" value="11">
          <input type="hidden" id="cfg-timer-unit-color" value="${borderColor}">
          <input type="hidden" id="cfg-timer-prefix-font" value="${fontFamily}">
          <input type="hidden" id="cfg-timer-prefix-size" value="11">
          <input type="hidden" id="cfg-timer-prefix-color" value="${borderColor}">
          <input type="hidden" id="cfg-timer-sub-size" value="11">
          <input type="hidden" id="cfg-timer-sub-color" value="#8B969C">
          <input type="hidden" id="cfg-timer-bar-height" value="6">
          <input type="hidden" id="cfg-timer-bar-color" value="${borderColor}">
          <input type="hidden" id="cfg-timer-bar-track" value="#2E363B">
        </div>

        <div style="margin-top: 12px;">
          <details style="font-size: 11px; color: var(--color-text-dim);">
            <summary style="cursor: pointer; font-weight: 600; color: #57D6C4;">💻 CSS Personalizado para OBS (Opcional)</summary>
            <textarea id="cfg-timer-custom-css" placeholder="/* Inyecta cualquier CSS adicional */" style="width: 100%; height: 60px; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 8px; box-sizing: border-box; resize: vertical; margin-top: 6px;" oninput="updateTimerPipPreview()">${s.customCSS || ''}</textarea>
          </details>
        </div>
      </div>

      <!-- BOTÓN PRINCIPAL DE GUARDADO Y GUÍAS -->
      <div style="margin-top: 16px; margin-bottom: 20px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" class="btn-action-primary" style="flex: 1; padding: 12px; font-size: 13px;" onclick="saveMiniAppControls('timer')">
          💾 Guardar Ajustes del Temporizador
        </button>
        <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 10px 14px; color: #57D6C4; border-color: rgba(87,214,196,0.4);" onclick="openWidgetDevGuideModal('timer')">
          📖 Guía de Tokens & Stream Deck
        </button>
        <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 10px 14px; color: #38BDF8; border-color: rgba(56,189,248,0.4);" onclick="openWidgetCssGuideModal('timer')">
          🎨 Guía CSS & Clases
        </button>
      </div>
    `;

}


// ----------------------------------------------------------------------
// TEMPORIZADOR: PRESET MANAGEMENT, LIVE REFLECTION & CHAT SYNC
// ----------------------------------------------------------------------
function buildTimerFontOptions(selectedFont = 'outfit') {
  const fonts = [
    { id: 'outfit', label: '🌐 Outfit (Moderna & Redonda)' },
    { id: 'inter', label: '💻 Inter (Limpia & Minimalista)' },
    { id: 'mono', label: '📟 JetBrains Mono (Terminal & Tech)' },
    { id: 'orbitron', label: '🛸 Orbitron (Cyberpunk & Futurista)' },
    { id: 'retro', label: '👾 Press Start 2P (Pixel Art 8-Bit)' },
    { id: 'bungee', label: '💥 Bungee (Gaming & Punch)' },
    { id: 'righteous', label: '⚡ Righteous (Synthwave & Retro 80s)' },
    { id: 'comfortaa', label: '🌸 Comfortaa (Kawaii & Dulce)' },
    { id: 'russo', label: '🏆 Russo One (Esports & Potente)' },
    { id: 'cinzel', label: '👑 Cinzel (Elegante & Épica)' },
    { id: 'montserrat', label: '📰 Montserrat (Editorial & Clara)' },
    { id: 'rajdhani', label: '⚡ Rajdhani (Cyber & Robótica)' },
    { id: 'silkscreen', label: '🕹️ Silkscreen (Pixel HD Moderno)' }
  ];
  return fonts.map(f => {
    const isSel = (f.id === selectedFont || (selectedFont === 'press_start' && f.id === 'retro') || (selectedFont === 'russo_one' && f.id === 'russo')) ? 'selected' : '';
    return `<option value="${f.id}" ${isSel}>${f.label}</option>`;
  }).join('');
}

function onTimerPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const presets = cachedWidgetsConfig.timer.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.timer.activePreset = presetId;

  // 1. Cargar Configuración Funcional (Tiempos, Textos, Modo, Formato, Layout, Alertas)
  if (preset.mode) {
    cachedWidgetsConfig.timer.mode = preset.mode;
    const modeEl = document.getElementById('cfg-timer-mode');
    if (modeEl) modeEl.value = preset.mode;
  }
  if (preset.initialSeconds !== undefined || preset.defaultSeconds !== undefined) {
    const secs = preset.initialSeconds !== undefined ? preset.initialSeconds : preset.defaultSeconds;
    cachedWidgetsConfig.timer.initialSeconds = secs;
    cachedWidgetsConfig.timer.defaultSeconds = secs;
    const secEl = document.getElementById('cfg-timer-initial-sec');
    if (secEl) secEl.value = secs;
  }
  if (preset.timeFormat) {
    cachedWidgetsConfig.timer.timeFormat = preset.timeFormat;
    const fmtEl = document.getElementById('cfg-timer-time-format');
    if (fmtEl) fmtEl.value = preset.timeFormat;
  }
  if (preset.formatLayout) {
    cachedWidgetsConfig.timer.formatLayout = preset.formatLayout;
    const layoutEl = document.getElementById('cfg-timer-format-layout');
    if (layoutEl) {
      layoutEl.value = preset.formatLayout;
      onTimerLayoutChange(preset.formatLayout);
    }
  }
  if (preset.customTemplate) {
    cachedWidgetsConfig.timer.customTemplate = preset.customTemplate;
    const tmplEl = document.getElementById('cfg-timer-custom-template');
    if (tmplEl) tmplEl.value = preset.customTemplate;
  }
  if (preset.title) {
    cachedWidgetsConfig.timer.title = preset.title;
    const titleEl = document.getElementById('cfg-timer-title');
    if (titleEl) titleEl.value = preset.title;
    const scLabelEl = document.getElementById('cfg-timer-shortcut-label');
    if (scLabelEl) scLabelEl.value = preset.title;
  }
  if (preset.unitLabel || preset.unit) {
    const uVal = preset.unitLabel || (typeof preset.unit === 'string' ? preset.unit : preset.unit?.label) || 'MIN';
    cachedWidgetsConfig.timer.unitLabel = uVal;
    const unitEl = document.getElementById('cfg-timer-unit');
    if (unitEl) unitEl.value = uVal;
  }
  if (preset.subtitle !== undefined) {
    const subVal = typeof preset.subtitle === 'string' ? preset.subtitle : (preset.subtitle?.text || '');
    cachedWidgetsConfig.timer.subtitle = subVal;
    const subEl = document.getElementById('cfg-timer-subtitle');
    if (subEl) subEl.value = subVal;
  }
  if (preset.alarmSound) {
    cachedWidgetsConfig.timer.alarmSound = preset.alarmSound;
    const soundEl = document.getElementById('cfg-timer-alarm-sound');
    if (soundEl) soundEl.value = preset.alarmSound;
  }

  // 2. Cargar Estilos Visuales
  if (!cachedWidgetsConfig.timer.styles) cachedWidgetsConfig.timer.styles = {};
  const s = cachedWidgetsConfig.timer.styles;

  s.themePreset = presetId;
  s.activePreset = presetId;
  s.shape = preset.shape || 'rounded';
  s.bgType = preset.bgType || 'glass';
  s.bgColor = preset.bgColor || '#191D21';
  s.bgGradient = preset.bgGradient || '#0B0D0F';
  s.borderStyle = preset.borderStyle || 'left_neon';
  s.borderWidth = preset.borderWidth !== undefined ? preset.borderWidth : 3;
  s.borderColor = preset.borderColor || '#57D6C4';
  s.accentColor = s.borderColor;
  s.glowIntensity = preset.glowIntensity !== undefined ? preset.glowIntensity : 40;
  s.bgOpacity = preset.bgOpacity !== undefined ? preset.bgOpacity : 94;
  s.customCSS = preset.customCSS || '';

  if (preset.timeDigits) s.timeDigits = Object.assign({}, preset.timeDigits);
  if (preset.unit && typeof preset.unit === 'object') s.unit = Object.assign({}, preset.unit);
  if (preset.prefix) s.prefix = Object.assign({}, preset.prefix);
  if (preset.subtitle && typeof preset.subtitle === 'object') s.subtitle = Object.assign({}, preset.subtitle);
  if (preset.progressBar) s.progressBar = Object.assign({}, preset.progressBar);

  if (cachedWidgetsConfig.timer.sameStyleAsChat !== true) {
    syncTimerDomFromStyles(s);
  }

  const sel = document.getElementById('cfg-timer-preset-select');
  if (sel && sel.value !== presetId) sel.value = presetId;

  updateTimerPipPreview();
}

function syncTimerDomFromStyles(s) {
  if (!s) return;
  const shapeEl = document.getElementById('cfg-timer-shape');
  const bgTypeEl = document.getElementById('cfg-timer-bgtype');
  const bgColorEl = document.getElementById('cfg-timer-bgcolor');
  const bgColorHexEl = document.getElementById('cfg-timer-bgcolor-hex');
  const bgGradEl = document.getElementById('cfg-timer-bggrad');
  const bgGradHexEl = document.getElementById('cfg-timer-bggrad-hex');
  const borderStyleEl = document.getElementById('cfg-timer-borderstyle');
  const borderWidthEl = document.getElementById('cfg-timer-borderwidth');
  const borderWdLbl = document.getElementById('lbl-timer-bw');
  const borderEl = document.getElementById('cfg-timer-border');
  const borderHexEl = document.getElementById('cfg-timer-border-hex');
  const glowEl = document.getElementById('cfg-timer-glow');
  const glowLbl = document.getElementById('lbl-timer-glow');
  const opEl = document.getElementById('cfg-timer-opacity');
  const opLbl = document.getElementById('lbl-timer-op');
  const cssEl = document.getElementById('cfg-timer-custom-css');

  if (shapeEl && s.shape) shapeEl.value = s.shape;
  if (bgTypeEl && s.bgType) bgTypeEl.value = s.bgType;
  if (bgColorEl && s.bgColor) bgColorEl.value = s.bgColor;
  if (bgColorHexEl && s.bgColor) bgColorHexEl.value = s.bgColor;
  if (bgGradEl && s.bgGradient) bgGradEl.value = s.bgGradient;
  if (bgGradHexEl && s.bgGradient) bgGradHexEl.value = s.bgGradient;
  if (borderStyleEl && s.borderStyle) borderStyleEl.value = s.borderStyle;
  if (borderWidthEl && s.borderWidth !== undefined) {
    borderWidthEl.value = s.borderWidth;
    if (borderWdLbl) borderWdLbl.textContent = s.borderWidth + 'px';
  }
  if (borderEl && s.borderColor) borderEl.value = s.borderColor;
  if (borderHexEl && s.borderColor) borderHexEl.value = s.borderColor;
  if (glowEl && s.glowIntensity !== undefined) {
    glowEl.value = s.glowIntensity;
    if (glowLbl) glowLbl.textContent = s.glowIntensity + '%';
  }
  if (opEl && s.bgOpacity !== undefined) {
    opEl.value = s.bgOpacity;
    if (opLbl) opLbl.textContent = s.bgOpacity + '%';
  }
  if (cssEl && s.customCSS !== undefined) cssEl.value = s.customCSS;

  // Individual element controls
  if (s.timeDigits) {
    const dFont = document.getElementById('cfg-timer-digits-font');
    const dSize = document.getElementById('cfg-timer-digits-size');
    const dColor = document.getElementById('cfg-timer-digits-color');
    const dLbl = document.getElementById('lbl-timer-digits-sz');
    if (dFont && s.timeDigits.fontFamily) dFont.value = s.timeDigits.fontFamily;
    if (dSize && s.timeDigits.fontSize) {
      dSize.value = s.timeDigits.fontSize;
      if (dLbl) dLbl.textContent = s.timeDigits.fontSize + 'px';
    }
    if (dColor && s.timeDigits.color) dColor.value = s.timeDigits.color;
  }

  if (s.unit) {
    const uFont = document.getElementById('cfg-timer-unit-font');
    const uSize = document.getElementById('cfg-timer-unit-size');
    const uColor = document.getElementById('cfg-timer-unit-color');
    const uLbl = document.getElementById('lbl-timer-unit-sz');
    if (uFont && s.unit.fontFamily) uFont.value = s.unit.fontFamily;
    if (uSize && s.unit.fontSize) {
      uSize.value = s.unit.fontSize;
      if (uLbl) uLbl.textContent = s.unit.fontSize + 'px';
    }
    if (uColor && s.unit.color) uColor.value = s.unit.color;
  }

  if (s.prefix) {
    const pFont = document.getElementById('cfg-timer-prefix-font');
    const pSize = document.getElementById('cfg-timer-prefix-size');
    const pColor = document.getElementById('cfg-timer-prefix-color');
    const pLbl = document.getElementById('lbl-timer-prefix-sz');
    if (pFont && s.prefix.fontFamily) pFont.value = s.prefix.fontFamily;
    if (pSize && s.prefix.fontSize) {
      pSize.value = s.prefix.fontSize;
      if (pLbl) pLbl.textContent = s.prefix.fontSize + 'px';
    }
    if (pColor && s.prefix.color) pColor.value = s.prefix.color;
  }

  if (s.subtitle) {
    const subSize = document.getElementById('cfg-timer-sub-size');
    const subColor = document.getElementById('cfg-timer-sub-color');
    if (subSize && s.subtitle.fontSize) subSize.value = s.subtitle.fontSize;
    if (subColor && s.subtitle.color) subColor.value = s.subtitle.color;
  }

  if (s.progressBar) {
    const barShow = document.getElementById('cfg-timer-bar-show');
    const barHeight = document.getElementById('cfg-timer-bar-height');
    const barColor = document.getElementById('cfg-timer-bar-color');
    const barTrack = document.getElementById('cfg-timer-bar-track');
    if (barShow && s.progressBar.show !== undefined) barShow.checked = s.progressBar.show !== false;
    if (barHeight && s.progressBar.height) barHeight.value = s.progressBar.height;
    if (barColor && s.progressBar.color) barColor.value = s.progressBar.color;
    if (barTrack && s.progressBar.trackColor) barTrack.value = s.progressBar.trackColor;
  }
}

async function saveCurrentTimerPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const activePresetId = cachedWidgetsConfig.timer.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.timer.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  // Actualizar configuración funcional (tiempos, textos, modo, formato, alertas)
  preset.mode = document.getElementById('cfg-timer-mode')?.value || 'down';
  preset.initialSeconds = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
  preset.defaultSeconds = preset.initialSeconds;
  preset.timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
  preset.formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
  preset.customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
  preset.title = document.getElementById('cfg-timer-title')?.value.trim() || 'TEMPORIZADOR';
  preset.unitLabel = document.getElementById('cfg-timer-unit')?.value.trim() || 'MIN';
  preset.subtitle = document.getElementById('cfg-timer-subtitle')?.value.trim() || '';
  preset.alarmSound = document.getElementById('cfg-timer-alarm-sound')?.value || 'bell';

  // Actualizar estilos visuales
  preset.shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
  preset.bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
  preset.bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
  preset.bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
  preset.borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
  preset.borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
  preset.borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
  preset.accentColor = preset.borderColor;
  preset.glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
  preset.bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;
  preset.customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

  preset.timeDigits = {
    fontFamily: document.getElementById('cfg-timer-digits-font')?.value || 'outfit',
    fontSize: parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38,
    color: document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5'
  };

  preset.unit = {
    fontFamily: document.getElementById('cfg-timer-unit-font')?.value || 'outfit',
    fontSize: parseInt(document.getElementById('cfg-timer-unit-size')?.value, 10) || 11,
    color: document.getElementById('cfg-timer-unit-color')?.value || '#57D6C4'
  };

  preset.prefix = {
    fontFamily: document.getElementById('cfg-timer-prefix-font')?.value || 'outfit',
    fontSize: parseInt(document.getElementById('cfg-timer-prefix-size')?.value, 10) || 11,
    color: document.getElementById('cfg-timer-prefix-color')?.value || '#57D6C4'
  };

  preset.subtitleObj = {
    fontSize: parseInt(document.getElementById('cfg-timer-sub-size')?.value, 10) || 11,
    color: document.getElementById('cfg-timer-sub-color')?.value || '#8B969C'
  };

  preset.progressBar = {
    show: document.getElementById('cfg-timer-bar-show')?.checked !== false,
    height: parseInt(document.getElementById('cfg-timer-bar-height')?.value, 10) || 6,
    color: document.getElementById('cfg-timer-bar-color')?.value || preset.borderColor,
    trackColor: document.getElementById('cfg-timer-bar-track')?.value || '#2E363B'
  };

  // Sync with active styles
  cachedWidgetsConfig.timer.styles = Object.assign({}, cachedWidgetsConfig.timer.styles, preset);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateTimerPipPreview();
  alert(`✓ ¡Cambios guardados con éxito en el preset "${preset.name}"!`);
}

async function renameCurrentTimerPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const activePresetId = cachedWidgetsConfig.timer.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.timer.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const newName = prompt('Nuevo nombre para este preset de Temporizador:', preset.name);
  if (!newName || !newName.trim() || newName.trim() === preset.name) return;

  preset.name = newName.trim();
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert(`✓ Preset de Temporizador renombrado a "${preset.name}".`);
}

async function deleteCurrentTimerPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  const activePresetId = cachedWidgetsConfig.timer.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.timer.presets || [];

  if (presets.length <= 1) {
    alert('No puedes eliminar el único preset existente.');
    return;
  }

  const p = presets.find(item => item.id === activePresetId);
  if (p && p.isBuiltin) {
    alert('⚠️ Los presets integrados de fábrica no se pueden eliminar. Puedes guardar tus modificaciones en un preset nuevo con "➕ Guardar Nuevo...".');
    return;
  }

  const ok = confirm(`¿Estás seguro de que quieres eliminar el preset personalizado "${p ? p.name : activePresetId}"?`);
  if (!ok) return;

  cachedWidgetsConfig.timer.presets = presets.filter(item => item.id !== activePresetId);
  const fallback = cachedWidgetsConfig.timer.presets[0].id;
  cachedWidgetsConfig.timer.activePreset = fallback;

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  onTimerPresetChange(fallback);
  alert('✓ Preset eliminado.');
}

async function toggleSameStyleAsChat(checked) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;
  cachedWidgetsConfig.timer.sameStyleAsChat = checked === true;

  const styleControls = document.getElementById('timer-style-controls-wrapper');
  const badge = document.getElementById('badge-chat-synced');

  if (checked) {
    if (styleControls) {
      styleControls.style.opacity = '0.45';
      styleControls.style.pointerEvents = 'none';
    }
    if (badge) badge.style.display = 'inline-block';
    await copyStylesFromChatToTimer(false);
  } else {
    if (styleControls) {
      styleControls.style.opacity = '1';
      styleControls.style.pointerEvents = 'auto';
    }
    if (badge) badge.style.display = 'none';
    await API.saveWidgetsConfig(cachedWidgetsConfig);
    updateTimerPipPreview();
  }
}

async function saveCurrentTimerAsShortcut() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;

  const initialSec = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
  const modeVal = document.getElementById('cfg-timer-mode')?.value || 'down';
  const titleVal = document.getElementById('cfg-timer-title')?.value.trim() || 'TEMPORIZADOR';
  const unitVal = document.getElementById('cfg-timer-unit')?.value.trim() || 'MIN';
  const subVal = document.getElementById('cfg-timer-subtitle')?.value.trim() || '';

  const labelInput = document.getElementById('cfg-timer-shortcut-label');
  const labelVal = labelInput?.value.trim() || titleVal || 'Temporizador';
  const colorVal = document.getElementById('cfg-timer-shortcut-color')?.value || '#57D6C4';
  const isPinned = document.getElementById('cfg-timer-shortcut-pinned')?.checked !== false;

  const newSc = {
    id: 'sc_timer_' + Date.now(),
    label: labelVal,
    seconds: initialSec,
    mode: modeVal,
    title: titleVal,
    unit: unitVal,
    subtitle: subVal,
    color: colorVal,
    pinned: isPinned
  };

  if (!cachedWidgetsConfig.timer.shortcuts) {
    cachedWidgetsConfig.timer.shortcuts = [];
  }
  cachedWidgetsConfig.timer.shortcuts.push(newSc);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();

  alert(`✓ ¡Acción Rápida "${labelVal}" creada con éxito!\n${isPinned ? '👁️ Añadida a los botones de la tarjeta principal exterior.' : 'Guardada en la lista de atajos del temporizador.'}`);
}

async function saveCurrentTimerAsPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.timer) return;

  const titleVal = document.getElementById('cfg-timer-title')?.value.trim() || '';
  const defaultName = titleVal ? `Preset ${titleVal}` : 'Mi Temporizador';
  const name = prompt('Nombre para este nuevo preset de temporizador:', defaultName);
  if (!name || !name.trim()) return;

  const newId = 'preset_timer_' + Date.now();
  const shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
  const bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;
  const fontFamily = document.getElementById('cfg-timer-digits-font')?.value || 'outfit';
  const digitsSize = parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38;
  const digitsColor = document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5';
  const barShow = document.getElementById('cfg-timer-bar-show')?.checked !== false;
  const customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

  const mode = document.getElementById('cfg-timer-mode')?.value || 'down';
  const initialSeconds = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
  const timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
  const formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
  const customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
  const unitLabel = document.getElementById('cfg-timer-unit')?.value || 'MIN';
  const subtitle = document.getElementById('cfg-timer-subtitle')?.value || '';
  const alarmSound = document.getElementById('cfg-timer-alarm-sound')?.value || 'bell';

  const newPreset = {
    id: newId,
    name: name.trim(),
    isBuiltin: false,
    mode,
    initialSeconds,
    defaultSeconds: initialSeconds,
    timeFormat,
    formatLayout,
    customTemplate,
    title: titleVal,
    unitLabel,
    subtitle,
    alarmSound,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    bgOpacity,
    timeDigits: {
      fontFamily,
      fontSize: digitsSize,
      color: digitsColor
    },
    unit: {
      fontFamily,
      fontSize: 11,
      color: borderColor
    },
    prefix: {
      fontFamily,
      fontSize: 11,
      color: borderColor
    },
    subtitleObj: {
      fontSize: 11,
      color: '#8B969C'
    },
    progressBar: {
      show: barShow,
      height: 6,
      color: borderColor,
      trackColor: '#2E363B'
    },
    customCSS
  };

  if (!cachedWidgetsConfig.timer.presets) cachedWidgetsConfig.timer.presets = [];
  cachedWidgetsConfig.timer.presets.push(newPreset);
  cachedWidgetsConfig.timer.activePreset = newId;
  cachedWidgetsConfig.timer.styles = Object.assign({}, cachedWidgetsConfig.timer.styles, newPreset);

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  updateTimerPipPreview();
  alert(`✓ ¡Nuevo preset "${name.trim()}" guardado con éxito!`);
}

async function copyStylesFromChatToTimer(showAlert = true) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat || !cachedWidgetsConfig.timer) return;
  const chatStyles = cachedWidgetsConfig.chat.styles || {};
  const chatActivePreset = cachedWidgetsConfig.chat.activePreset || chatStyles.themePreset || 'maker_glass';

  // 1. Si existe un preset en timer con el mismo ID, lo seleccionamos
  const timerPresets = cachedWidgetsConfig.timer.presets || [];
  const matchingPreset = timerPresets.find(p => p.id === chatActivePreset);
  if (matchingPreset) {
    cachedWidgetsConfig.timer.activePreset = matchingPreset.id;
    const sel = document.getElementById('cfg-timer-preset-select');
    if (sel) sel.value = matchingPreset.id;
  }

  // 2. Copiamos los atributos visuales clave del chat al timer
  if (!cachedWidgetsConfig.timer.styles) cachedWidgetsConfig.timer.styles = {};
  const ts = cachedWidgetsConfig.timer.styles;

  ts.shape = chatStyles.shape || 'rounded';
  ts.bgType = chatStyles.bgType || 'glass';
  ts.bgColor = chatStyles.bgColor || '#191D21';
  ts.bgGradient = chatStyles.bgGradient || '#0B0D0F';
  ts.borderStyle = chatStyles.borderStyle || 'left_neon';
  ts.borderWidth = chatStyles.borderWidth !== undefined ? chatStyles.borderWidth : 3;
  ts.borderColor = chatStyles.borderColor || '#57D6C4';
  ts.accentColor = ts.borderColor;
  ts.glowIntensity = chatStyles.glowIntensity !== undefined ? chatStyles.glowIntensity : 40;
  ts.bgOpacity = chatStyles.bgOpacity !== undefined ? chatStyles.bgOpacity : 94;
  ts.customCSS = chatStyles.customCSS || '';

  // Actualizar también tipografías y acentos individuales acordes
  const chatFont = chatStyles.fontFamily || 'outfit';
  if (!ts.timeDigits) ts.timeDigits = {};
  ts.timeDigits.fontFamily = chatFont;
  ts.timeDigits.color = '#F2EEE5';

  if (!ts.unit) ts.unit = {};
  ts.unit.fontFamily = chatFont;
  ts.unit.color = ts.borderColor;

  if (!ts.prefix) ts.prefix = {};
  ts.prefix.fontFamily = chatFont;
  ts.prefix.color = ts.borderColor;

  if (!ts.progressBar) ts.progressBar = {};
  ts.progressBar.color = ts.borderColor;

  // Actualizar DOM inputs del temporizador
  syncTimerDomFromStyles(ts);

  // Actualizar el preset activo si existe
  const activePresetId = cachedWidgetsConfig.timer.activePreset;
  const currentP = timerPresets.find(p => p.id === activePresetId);
  if (currentP) {
    Object.assign(currentP, {
      shape: ts.shape,
      bgType: ts.bgType,
      bgColor: ts.bgColor,
      bgGradient: ts.bgGradient,
      borderStyle: ts.borderStyle,
      borderWidth: ts.borderWidth,
      borderColor: ts.borderColor,
      glowIntensity: ts.glowIntensity,
      bgOpacity: ts.bgOpacity,
      timeDigits: Object.assign({}, ts.timeDigits),
      unit: Object.assign({}, ts.unit),
      prefix: Object.assign({}, ts.prefix),
      progressBar: Object.assign({}, ts.progressBar),
      customCSS: ts.customCSS
    });
  }

  // Guardar y refrescar preview en vivo
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateTimerPipPreview();
  if (showAlert) {
    alert(`✓ ¡Estilos del Chat sincronizados con el Temporizador con éxito!\nTema: "${chatActivePreset}" | Color Acento: ${ts.borderColor} | Silueta: ${ts.shape}`);
  }
}

function updateTimerPipPreview() {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || currentMiniAppWidget !== 'timer') return;

  const mode = document.getElementById('cfg-timer-mode')?.value || 'down';
  const timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
  const formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
  const customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
  const title = document.getElementById('cfg-timer-title')?.value || 'EN BREVE COMENZAMOS';
  const unitLabel = document.getElementById('cfg-timer-unit')?.value || 'MIN';
  const subtitle = document.getElementById('cfg-timer-subtitle')?.value || 'FASE ACTUAL';

  const shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
  const bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;

  const digitsFont = document.getElementById('cfg-timer-digits-font')?.value || 'outfit';
  const digitsSize = parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38;
  const digitsColor = document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5';

  const unitFont = document.getElementById('cfg-timer-unit-font')?.value || 'outfit';
  const unitSize = parseInt(document.getElementById('cfg-timer-unit-size')?.value, 10) || 11;
  const unitColor = document.getElementById('cfg-timer-unit-color')?.value || '#57D6C4';

  const prefixFont = document.getElementById('cfg-timer-prefix-font')?.value || 'outfit';
  const prefixSize = parseInt(document.getElementById('cfg-timer-prefix-size')?.value, 10) || 11;
  const prefixColor = document.getElementById('cfg-timer-prefix-color')?.value || '#57D6C4';

  const subSize = parseInt(document.getElementById('cfg-timer-sub-size')?.value, 10) || 11;
  const subColor = document.getElementById('cfg-timer-sub-color')?.value || '#8B969C';

  const barShow = document.getElementById('cfg-timer-bar-show')?.checked !== false;
  const barHeight = parseInt(document.getElementById('cfg-timer-bar-height')?.value, 10) || 6;
  const barColor = document.getElementById('cfg-timer-bar-color')?.value || borderColor;
  const barTrackColor = document.getElementById('cfg-timer-bar-track')?.value || '#2E363B';

  const customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

  const cfg = {
    mode,
    timeFormat,
    formatLayout,
    customTemplate,
    title,
    unitLabel,
    subtitle,
    styles: {
      shape,
      bgType,
      bgColor,
      bgGradient,
      borderStyle,
      borderWidth,
      borderColor,
      glowIntensity,
      bgOpacity,
      timeDigits: { fontFamily: digitsFont, fontSize: digitsSize, color: digitsColor },
      unit: { fontFamily: unitFont, fontSize: unitSize, color: unitColor },
      prefix: { fontFamily: prefixFont, fontSize: prefixSize, color: prefixColor },
      subtitle: { fontSize: subSize, color: subColor },
      progressBar: { show: barShow, height: barHeight, color: barColor, trackColor: barTrackColor },
      customCSS
    }
  };

  try {
    if (iframe.contentWindow && iframe.contentWindow.applyTimerConfig) {
      iframe.contentWindow.applyTimerConfig(cfg);
    }
  } catch (e) {}
}

async function sendTimerAction(action, extraParams = {}) {
  await API.triggerWidgetAction('timer', action, extraParams);
}

function setTimerPresetSeconds(secs) {
  const el = document.getElementById('cfg-timer-initial-sec');
  if (el) {
    el.value = secs;
    updateTimerPipPreview();
  }
}

function insertTimerToken(token) {
  const input = document.getElementById('cfg-timer-custom-template');
  if (!input) return;
  const start = input.selectionStart || input.value.length;
  const end = input.selectionEnd || input.value.length;
  input.value = input.value.substring(0, start) + ' ' + token + ' ' + input.value.substring(end);
  input.focus();
  updateTimerPipPreview();
}

function onTimerLayoutChange(layoutVal) {
  const customBox = document.getElementById('box-timer-custom-template');
  if (customBox) {
    customBox.style.display = (layoutVal === 'custom_template') ? 'block' : 'none';
  }
  updateTimerPipPreview();
}

function testTimerSound(soundName) {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (iframe && iframe.contentWindow && iframe.contentWindow.playAudioTone) {
    iframe.contentWindow.playAudioTone(soundName);
  }
}



async function saveTimerControls() {
  if (!cachedWidgetsConfig) return;
    if (!cachedWidgetsConfig.timer) cachedWidgetsConfig.timer = {};
    const t = cachedWidgetsConfig.timer;
    const activePresetId = document.getElementById('cfg-timer-preset-select')?.value || 'maker_glass';
    t.activePreset = activePresetId;
    t.sameStyleAsChat = document.getElementById('cfg-timer-same-as-chat')?.checked === true;

    t.mode = document.getElementById('cfg-timer-mode')?.value || 'down';
    t.initialSeconds = parseInt(document.getElementById('cfg-timer-initial-sec')?.value, 10) || 300;
    t.targetSeconds = parseInt(document.getElementById('cfg-timer-target-sec')?.value, 10) || 0;
    t.defaultSeconds = t.initialSeconds;
    t.timeFormat = document.getElementById('cfg-timer-time-format')?.value || 'mm:ss';
    t.formatLayout = document.getElementById('cfg-timer-format-layout')?.value || 'prefix_time_unit_sub';
    t.customTemplate = document.getElementById('cfg-timer-custom-template')?.value || '{prefix} {time} {unit} - {sub}';
    t.title = document.getElementById('cfg-timer-title')?.value || 'EN BREVE COMENZAMOS';
    t.unitLabel = document.getElementById('cfg-timer-unit')?.value || 'MIN';
    t.subtitle = document.getElementById('cfg-timer-subtitle')?.value || 'FASE ACTUAL';

    if (!t.styles) t.styles = {};
    const s = t.styles;
    s.themePreset = activePresetId;
    s.activePreset = activePresetId;
    s.shape = document.getElementById('cfg-timer-shape')?.value || 'rounded';
    s.bgType = document.getElementById('cfg-timer-bgtype')?.value || 'glass';
    s.bgColor = document.getElementById('cfg-timer-bgcolor')?.value || '#191D21';
    s.bgGradient = document.getElementById('cfg-timer-bggrad')?.value || '#0B0D0F';
    s.borderStyle = document.getElementById('cfg-timer-borderstyle')?.value || 'left_neon';
    s.borderWidth = parseInt(document.getElementById('cfg-timer-borderwidth')?.value, 10) || 3;
    s.borderColor = document.getElementById('cfg-timer-border')?.value || '#57D6C4';
    s.accentColor = s.borderColor;
    s.glowIntensity = parseInt(document.getElementById('cfg-timer-glow')?.value, 10) || 40;
    s.bgOpacity = parseInt(document.getElementById('cfg-timer-opacity')?.value, 10) || 94;

    s.timeDigits = {
      fontFamily: document.getElementById('cfg-timer-digits-font')?.value || 'outfit',
      fontSize: parseInt(document.getElementById('cfg-timer-digits-size')?.value, 10) || 38,
      color: document.getElementById('cfg-timer-digits-color')?.value || '#F2EEE5'
    };

    s.unit = {
      fontFamily: document.getElementById('cfg-timer-unit-font')?.value || 'outfit',
      fontSize: parseInt(document.getElementById('cfg-timer-unit-size')?.value, 10) || 11,
      color: document.getElementById('cfg-timer-unit-color')?.value || '#57D6C4'
    };

    s.prefix = {
      fontFamily: document.getElementById('cfg-timer-prefix-font')?.value || 'outfit',
      fontSize: parseInt(document.getElementById('cfg-timer-prefix-size')?.value, 10) || 11,
      color: document.getElementById('cfg-timer-prefix-color')?.value || '#57D6C4'
    };

    s.subtitle = {
      fontSize: parseInt(document.getElementById('cfg-timer-sub-size')?.value, 10) || 11,
      color: document.getElementById('cfg-timer-sub-color')?.value || '#8B969C'
    };

    s.progressBar = {
      show: document.getElementById('cfg-timer-bar-show')?.checked !== false,
      height: parseInt(document.getElementById('cfg-timer-bar-height')?.value, 10) || 6,
      color: document.getElementById('cfg-timer-bar-color')?.value || s.borderColor,
      trackColor: document.getElementById('cfg-timer-bar-track')?.value || '#2E363B'
    };

    s.customCSS = document.getElementById('cfg-timer-custom-css')?.value || '';

    // Alertas
    if (!t.alerts) t.alerts = {};
    t.alarmSound = document.getElementById('cfg-timer-alarm-sound')?.value || 'bell';
    t.warningSeconds = parseInt(document.getElementById('cfg-timer-warn-sec')?.value, 10) || 30;
    t.allowChannelPointsAdd = document.getElementById('cfg-timer-points')?.checked !== false;

    t.alerts.finalAlarm = {
      enabled: t.alarmSound !== 'none',
      sound: t.alarmSound,
      flashScreen: document.getElementById('cfg-timer-flash')?.checked !== false
    };
    t.alerts.warningThreshold = {
      enabled: t.warningSeconds > 0,
      seconds: t.warningSeconds,
      color: '#EF4444'
    };
    t.alerts.periodic = {
      enabled: document.getElementById('cfg-timer-periodic-enable')?.checked === true,
      everyMinutes: parseInt(document.getElementById('cfg-timer-periodic-min')?.value, 10) || 15,
      sound: document.getElementById('cfg-timer-periodic-sound')?.value || 'beep_digital',
      flash: true,
      message: document.getElementById('cfg-timer-periodic-msg')?.value || '💧 Recordatorio de Hidratación / Descanso'
    };

    const milestonesStr = document.getElementById('cfg-timer-milestones')?.value || '5, 1';
    t.alerts.milestones = milestonesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0).map(mins => ({
      atSeconds: mins * 60,
      message: `¡${mins} minuto${mins > 1 ? 's' : ''} restante${mins > 1 ? 's' : ''}!`,
      sound: 'bell',
      flash: true
    }));

    // Actualizar preset en la lista de presets
    const curP = (t.presets || []).find(p => p.id === activePresetId);
    if (curP) {
      curP.shape = s.shape;
      curP.bgType = s.bgType;
      curP.bgColor = s.bgColor;
      curP.bgGradient = s.bgGradient;
      curP.borderStyle = s.borderStyle;
      curP.borderWidth = s.borderWidth;
      curP.borderColor = s.borderColor;
      curP.glowIntensity = s.glowIntensity;
      curP.bgOpacity = s.bgOpacity;
      curP.timeDigits = Object.assign({}, s.timeDigits);
      curP.unit = Object.assign({}, s.unit);
      curP.prefix = Object.assign({}, s.prefix);
      curP.subtitle = Object.assign({}, s.subtitle);
      curP.progressBar = Object.assign({}, s.progressBar);
      curP.customCSS = s.customCSS;
    }

}



// Registro del módulo Timer
window.renderTimerShortcuts = renderTimerShortcuts;
window.triggerTimerShortcut = triggerTimerShortcut;
window.renderTimerControls = renderTimerControls;
window.saveTimerControls = saveTimerControls;

window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['timer'] = {
  renderControls: renderTimerControls,
  saveControls: saveTimerControls,
  renderShortcuts: renderTimerShortcuts,
  updatePreview: typeof updateTimerPipPreview === 'function' ? updateTimerPipPreview : () => {}
};

