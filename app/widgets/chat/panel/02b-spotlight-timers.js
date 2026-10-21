// widgets/chat/panel/02b-spotlight-timers.js - Generador HTML de Spotlight, Bot Timers y Simuladores

function buildChatSpotlightTimersHtml(sp, botTimers, customCSS) {
  let botTimersHtml = '';
  if (botTimers.length === 0) {
    botTimersHtml = '<div style="font-size: 12px; color: var(--color-text-dim); padding: 8px;">No hay mensajes automáticos configurados. Haz clic en "Añadir Mensaje" arriba.</div>';
  } else {
    botTimers.forEach(bt => {
      const isEnabled = bt.enabled !== false;
      botTimersHtml += `
        <div class="bot-timer-item ${isEnabled ? 'active-timer' : 'paused-timer'}">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <strong style="font-size: 13px; color: #fff;">${bt.name}</strong>
              <span style="font-size: 10px; font-family: var(--font-tech); padding: 2px 6px; border-radius: 3px; background: rgba(87,214,196,0.15); color: #57D6C4;">
                ⏱️ Cada ${bt.intervalMinutes} min (Mín. ${bt.minChatLines || 4} líneas)
              </span>
              <span style="font-size: 10px; color: ${isEnabled ? '#10B981' : '#94A3B8'}; font-weight: 700;">
                ${isEnabled ? '🟢 ACTIVO' : '⚪ EN PAUSA'}
              </span>
            </div>
            <div style="font-size: 12px; color: #CBD5E1; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              "${bt.message}"
            </div>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 10px;" onclick="toggleBotTimer('${bt.id}')">
              ${isEnabled ? '⏸️ Pausar' : '▶️ Activar'}
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 10px;" onclick="testBotTimer('${bt.id}')" title="Enviar ahora a Twitch">
              🚀 Enviar Ya
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="openBotTimerModal('${bt.id}')">
              ✏️
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px; color: #EF4444;" onclick="deleteBotTimer('${bt.id}')">
              🗑️
            </button>
          </div>
        </div>
      `;
    });
  }

  return `
    <!-- 3. 📌 Mensaje Destacado en Pantalla (Spotlight) -->
    <div class="miniapp-section-card" style="border-color: rgba(87, 214, 196, 0.4);">
      <div class="miniapp-section-header">
        <div class="miniapp-section-title">
          <span>📌</span>
          <span>Mensaje Destacado en Pantalla (Spotlight)</span>
        </div>
      </div>

      <div style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4;">
        ¿Por qué Spotlight? Durante el directo, los espectadores hacen preguntas clave o comentarios divertidos. En vez de escribirlos a mano, haz <strong>1 clic en 📌 Destacar</strong> directamente en el mensaje recibido abajo, o tus moderadores pueden escribir <code>!destacar @usuario [mensaje]</code> en Twitch. Aparecerá en grande con brillo neón en OBS.
      </div>

      <!-- Estado actual del spotlight -->
      <div id="spotlight-active-banner" style="background: ${sp.active ? 'rgba(87,214,196,0.12)' : 'rgba(0,0,0,0.3)'}; border: 1px solid ${sp.active ? 'var(--color-accent-cyan)' : 'var(--color-border-dim)'}; border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: ${sp.active ? '#57D6C4' : '#94A3B8'}; font-family: var(--font-tech);">
            ${sp.active ? '🟢 DESTACADO EN OBS AHORA MISMO:' : '⚪ NINGÚN MENSAJE FIJADO EN OBS'}
          </span>
          ${sp.active ? `<div style="font-size: 13px; color: #fff; margin-top: 2px;"><strong>${sp.user}:</strong> "${sp.message}"</div>` : ''}
        </div>
        ${sp.active ? `<button type="button" class="btn-stage-preset" style="color: #EF4444; border-color: #EF4444; font-size: 11px; padding: 4px 10px;" onclick="triggerSpotlightAction(false)">✕ Quitar de Pantalla</button>` : ''}
      </div>

      <!-- Feed en vivo con botón 1-clic para destacar -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="font-size: 11px; font-family: var(--font-tech); color: var(--color-accent-cyan); text-transform: uppercase; font-weight: 700;">
            📨 Feed de Chat en Directo (Haz clic en 📌 Destacar en cualquier mensaje):
          </label>
          <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="refreshChatLiveFeed()">🔄 Actualizar Feed</button>
        </div>
        <div id="chat-live-feed-list" class="chat-live-feed">
          <div style="font-size: 12px; color: var(--color-text-dim); text-align: center; padding: 12px;">Cargando mensajes recientes...</div>
        </div>
      </div>

      <!-- Entrada manual de respaldo -->
      <details style="font-size: 12px; color: var(--color-text-dim);">
        <summary style="cursor: pointer; font-family: var(--font-tech); font-size: 11px; color: var(--color-text-dim);">✍️ Entrada Manual / Anuncio Personalizado de Respaldo</summary>
        <div style="display: grid; grid-template-columns: 160px 1fr auto; gap: 8px; margin-top: 8px; align-items: center;">
          <input type="text" id="cfg-spotlight-user" class="form-input" placeholder="Usuario espectador" value="${sp.user || 'ViewerDestacado'}">
          <input type="text" id="cfg-spotlight-msg" class="form-input" placeholder="Pregunta o frase a destacar..." value="${sp.message || '¿Qué tipo de filamento estás usando para imprimir esa pieza?'}">
          <button type="button" class="btn-action-primary" style="white-space: nowrap; font-size: 11px; padding: 6px 12px;" onclick="triggerSpotlightAction(true)">📌 Destacar Manual</button>
        </div>
      </details>
    </div>

    <!-- 4. 🤖 Mensajes Automáticos del Chat (Bot Timers) -->
    <div class="miniapp-section-card">
      <div class="miniapp-section-header">
        <div class="miniapp-section-title">
          <span>🤖</span>
          <span>Mensajes Automáticos Programados (Bot Timers)</span>
        </div>
        <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 4px 10px;" onclick="openBotTimerModal(null)">
          ➕ Añadir Mensaje Automático
        </button>
      </div>

      <div style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4;">
        Publica automáticamente tus redes sociales, servidor de Discord, normas del canal o tienda cada X minutos cuando haya actividad en el chat de Twitch, sin necesidad de bots externos.
      </div>

      <div id="bot-timers-list-container" style="display: flex; flex-direction: column; gap: 10px;">
        ${botTimersHtml}
      </div>
    </div>

    <!-- 5. 🧪 Simulador de Mensajes en Vivo -->
    <div class="miniapp-section-card">
      <div class="miniapp-section-header">
        <div class="miniapp-section-title">
          <span>🧪</span>
          <span>Simulador de Mensajes en Vivo (Pruebas OBS)</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" class="btn-action-test" onclick="simulateChatMessage('normal')">👤 Sin Rol / Espectador</button>
        <button type="button" class="btn-action-test" style="border-color: rgba(56,189,248,0.5);" onclick="simulateChatMessage('follower')">💜 Seguidor</button>
        <button type="button" class="btn-action-test" style="border-color: rgba(245,158,11,0.5);" onclick="simulateChatMessage('sub')">⭐ Suscriptor</button>
        <button type="button" class="btn-action-test" style="border-color: rgba(34,197,94,0.5);" onclick="simulateChatMessage('mod')">🛡️ Moderador</button>
        <button type="button" class="btn-action-test" style="border-color: rgba(236,72,153,0.5);" onclick="simulateChatMessage('vip')">💎 VIP</button>
        <button type="button" class="btn-action-test" style="border-color: rgba(239,68,68,0.5);" onclick="simulateChatMessage('broadcaster')">👑 Streamer</button>
        <button type="button" class="btn-action-test" style="border-color: rgba(139,92,246,0.5);" onclick="simulateChatMessage('emotes')">🎉 Con Emotes</button>
        <button type="button" class="btn-stage-preset" style="color: #F87171;" onclick="API.triggerWidgetAction('chat', 'clear')">🧹 Limpiar Chat</button>
      </div>
    </div>

    <!-- 6. CSS Personalizado y Guía -->
    <div class="miniapp-section-card">
      <div class="miniapp-section-header">
        <div class="miniapp-section-title">
          <span>💻</span>
          <span>CSS Personalizado Adicional</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-stage-preset" style="color: #57D6C4; border-color: rgba(87,214,196,0.5);" onclick="openWidgetDevGuideModal('chat')">
            📖 Guía de Tokens & API
          </button>
          <button type="button" class="btn-stage-preset" style="color: var(--color-accent-cyan); border-color: var(--color-accent-cyan);" onclick="openChatThemeGuideModal()">
            🎨 Ver Guía de Temas CSS
          </button>
        </div>
      </div>
      <textarea id="cfg-chat-custom-css" placeholder="/* Escribe aquí CSS adicional para inyectar directamente en OBS Studio */" style="width: 100%; height: 80px; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 10px; box-sizing: border-box; resize: vertical;" oninput="updateChatPipPreview()">${customCSS || ''}</textarea>
      <div style="display: flex; gap: 10px; align-items: center; justify-content: flex-end;">
        <button type="button" class="btn-action-primary" onclick="saveMiniAppControls('chat')">💾 Guardar Todos los Ajustes del Chat</button>
      </div>
    </div>
  `;
}
