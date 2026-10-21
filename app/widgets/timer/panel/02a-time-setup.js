// widgets/timer/panel/02a-time-setup.js - Generador HTML de control remoto, configuración de tiempos y alertas

function buildTimerTimeSetupHtml(t, alerts, periodic) {
  const currentMode = t.mode || 'down';
  const initialSec = t.initialSeconds !== undefined ? t.initialSeconds : (t.defaultSeconds || 300);
  const timeFmt = t.timeFormat || 'mm:ss';
  const formatLayout = t.formatLayout || 'prefix_time_unit_sub';
  const customTemplate = t.customTemplate || '{prefix} {time} {unit} - {sub}';
  const titleVal = t.title || 'EN BREVE COMENZAMOS';
  const unitVal = t.unitLabel || t.unit || 'MIN';
  const subVal = t.subtitle || 'FASE ACTUAL';

  const alarmSound = t.alarmSound || alerts.finalAlarm?.sound || 'bell';
  const screenFlash = alerts.finalAlarm?.flashScreen !== false;
  const warnSecs = t.warningSeconds !== undefined ? t.warningSeconds : (alerts.warningThreshold?.seconds || 30);
  const periodicEnabled = periodic.enabled === true;
  const periodicMin = periodic.everyMinutes || 15;
  const periodicMsg = periodic.message || '💧 ¡Hora de beber agua y estirar!';
  const periodicSound = periodic.sound || 'beep_digital';
  const milestonesStr = (alerts.milestones || []).map(m => Math.round(m.atSeconds / 60)).filter(n => n > 0).join(', ') || '5, 1';

  return `
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

    <!-- 1. CONFIGURACIÓN DEL TEMPORIZADOR Y TEXTOS -->
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
  `;
}
