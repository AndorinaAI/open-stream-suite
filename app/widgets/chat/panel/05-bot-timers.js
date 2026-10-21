
// ----------------------------------------------------------------------
// BOT TIMERS
// ----------------------------------------------------------------------
async function toggleBotTimer(timerId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const timers = cachedWidgetsConfig.chat.botTimers || [];
  const timer = timers.find(t => t.id === timerId);
  if (!timer) return;
  timer.enabled = (timer.enabled === false) ? true : false;
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
}

async function testBotTimer(timerId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const timers = cachedWidgetsConfig.chat.botTimers || [];
  const timer = timers.find(t => t.id === timerId);
  if (!timer) return;
  const res = await API.triggerWidgetAction('chat', 'send', { message: timer.message });
  if (res && res.sent) {
    alert(`✓ ¡Mensaje enviado al chat de Twitch!: "${timer.message}"`);
  } else {
    alert(`✓ Mensaje emitido al overlay suite: "${timer.message}" (Asegúrate de tener token en config.py para publicar en Twitch Helix).`);
  }
}

async function deleteBotTimer(timerId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  if (!confirm('¿Seguro que deseas eliminar este mensaje automático?')) return;
  cachedWidgetsConfig.chat.botTimers = (cachedWidgetsConfig.chat.botTimers || []).filter(t => t.id !== timerId);
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
}

function openBotTimerModal(timerId) {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer || !cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;

  const timers = cachedWidgetsConfig.chat.botTimers || [];
  const existing = timerId ? timers.find(t => t.id === timerId) : null;

  const id = existing ? existing.id : ('bt_' + Date.now());
  const name = existing ? existing.name : 'Recordatorio Discord';
  const intervalMinutes = existing ? existing.intervalMinutes : 15;
  const minChatLines = existing ? (existing.minChatLines || 4) : 4;
  const message = existing ? existing.message : '📢 ¡Únete a nuestro Discord! https://discord.gg/tucanal';
  const enabled = existing ? (existing.enabled !== false) : true;

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box">
        <div class="miniapp-modal-header">
          <div style="font-family: var(--font-tech); font-size: 14px; font-weight: 700; color: var(--color-accent-cyan); display: flex; align-items: center; gap: 8px;">
            <span>🤖</span>
            <span>${existing ? 'Editar Mensaje Automático' : 'Nuevo Mensaje Automático de Chat'}</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕</button>
        </div>

        <div class="miniapp-modal-body">
          <div class="form-group">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Nombre del Recordatorio:</label>
            <input type="text" id="modal-timer-name" class="form-input" value="${name}" placeholder="Ej: Discord, Normas, Redes Sociales...">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Intervalo (minutos):</label>
              <input type="number" id="modal-timer-interval" class="form-input" min="1" max="120" value="${intervalMinutes}">
            </div>
            <div class="form-group">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Mínimo de líneas de chat:</label>
              <input type="number" id="modal-timer-lines" class="form-input" min="1" max="50" value="${minChatLines}">
              <div style="font-size: 10px; color: var(--color-text-dim); margin-top: 2px;">Evita enviar si el chat está inactivo.</div>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 0;">Mensaje para enviar a Twitch:</label>
              <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #57D6C4;" onclick="openWidgetDevGuideModal('chat')">📖 Guía Tokens</button>
            </div>
            <textarea id="modal-timer-message" class="form-input" style="height: 75px; resize: vertical;">${message}</textarea>
            
            <!-- CHIPS DE ETIQUETAS DINÁMICAS {} -->
            <div style="margin-top: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 6px 8px;">
              <div style="font-size: 10px; font-weight: 700; color: var(--color-accent-cyan); margin-bottom: 4px;">
                💡 Etiquetas Dinámicas {} Disponibles (Clic para insertar):
              </div>
              <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #57D6C4;" onclick="insertBotTimerToken('{channel}')" title="Nombre del canal">{channel} = Canal</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #38BDF8;" onclick="insertBotTimerToken('{game}')" title="Categoría o juego actual">{game} = Categoría</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #A78BFA;" onclick="insertBotTimerToken('{title}')" title="Título del directo">{title} = Título</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #F59E0B;" onclick="insertBotTimerToken('{uptime}')" title="Tiempo que lleva el directo emitido">{uptime} = Tiempo Live</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 6px; color: #10B981;" onclick="insertBotTimerToken('{discord}')" title="Enlace al Discord oficial">{discord} = Discord</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
              <input type="checkbox" id="modal-timer-enabled" ${enabled ? 'checked' : ''}>
              <span>Activar automáticamente este temporizador</span>
            </label>
          </div>
        </div>

        <div class="miniapp-modal-footer">
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()">Cancelar</button>
          <button type="button" class="btn-action-primary" onclick="saveBotTimerFromModal('${id}')">💾 Guardar Mensaje Automático</button>
        </div>
      </div>
    </div>
  `;
}

async function saveBotTimerFromModal(timerId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const name = document.getElementById('modal-timer-name')?.value.trim() || 'Recordatorio';
  const intervalMinutes = parseInt(document.getElementById('modal-timer-interval')?.value, 10) || 15;
  const minChatLines = parseInt(document.getElementById('modal-timer-lines')?.value, 10) || 4;
  const message = document.getElementById('modal-timer-message')?.value.trim() || '';
  const enabled = document.getElementById('modal-timer-enabled')?.checked !== false;

  if (!message) {
    alert('Por favor escribe un mensaje.');
    return;
  }

  if (!cachedWidgetsConfig.chat.botTimers) cachedWidgetsConfig.chat.botTimers = [];
  const existingIdx = cachedWidgetsConfig.chat.botTimers.findIndex(t => t.id === timerId);

  const timerObj = {
    id: timerId,
    name,
    intervalMinutes,
    minChatLines,
    message,
    enabled
  };

  if (existingIdx >= 0) {
    cachedWidgetsConfig.chat.botTimers[existingIdx] = timerObj;
  } else {
    cachedWidgetsConfig.chat.botTimers.push(timerObj);
  }

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  closeMiniAppModal();
  renderMiniAppControls();
  alert('✓ Mensaje automático guardado con éxito.');
}

function insertBotTimerToken(token) {
  const textarea = document.getElementById('modal-timer-message');
  if (!textarea) return;
  const start = textarea.selectionStart || textarea.value.length;
  const end = textarea.selectionEnd || textarea.value.length;
  const oldVal = textarea.value;
  textarea.value = oldVal.substring(0, start) + ' ' + token + ' ' + oldVal.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + token.length + 2, start + token.length + 2);
}
window.insertBotTimerToken = insertBotTimerToken;
