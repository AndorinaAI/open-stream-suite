// ====================================================================
// MÓDULO WIDGET: CHAT, PARTÍCULAS Y PERSONALIZACIÓN VISUAL/CSS
// ====================================================================

function renderChatShortcuts() {
  const container = document.getElementById('chat-shortcuts-container');
  if (!container || !cachedWidgetsConfig.chat) return;

  const shortcuts = (cachedWidgetsConfig.chat.shortcuts || []).filter(s => s.pinned !== false);
  container.innerHTML = '';

  shortcuts.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'widget-shortcut-btn';
    const color = s.color || '#EC4899';
    btn.style.borderColor = `${color}60`;
    btn.style.boxShadow = `0 0 10px ${color}15`;
    btn.innerHTML = `
      <span>${s.label}</span>
    `;
    btn.title = `Lluvia de: ${s.emoji} (${s.count || 40} partículas)`;
    btn.onclick = () => triggerChatShortcut(s.id);
    container.appendChild(btn);
  });
}



async function triggerChatShortcut(shortcutId) {
  const sc = (cachedWidgetsConfig?.chat?.shortcuts || []).find(s => s.id === shortcutId);
  if (!sc) return;
  await API.triggerWidgetAction('chat', 'explode', {
    emoji: sc.emoji,
    count: sc.count || 40
  });
}


function renderChatControls(container) {
  if (!container || !cachedWidgetsConfig) return;
    const c = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.styles) || {};
    const sp = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.spotlight) || {};
    const presets = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.presets) || [];
    const botTimers = (cachedWidgetsConfig.chat && cachedWidgetsConfig.chat.botTimers) || [];
    const activePresetId = cachedWidgetsConfig.chat.activePreset || c.themePreset || 'maker_glass';

    let presetsOptionsHtml = '';
    presets.forEach(p => {
      const isSel = (p.id === activePresetId) ? 'selected' : '';
      const tag = p.isBuiltin ? '' : ' ⭐ [Personalizado]';
      presetsOptionsHtml += `<option value="${p.id}" ${isSel}>${p.name}${tag}</option>`;
    });

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

    container.innerHTML = `
      <!-- 1. Presets de Diseño y Apariencia -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🎨</span>
            <span>Presets de Diseño y Apariencia Visual</span>
          </div>
        </div>

        <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 14px; flex-wrap: wrap;">
          <div class="form-group" style="margin-bottom: 0; min-width: 260px; flex: 1;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Tema / Preset Visual Activo:
            </label>
            <select id="cfg-chat-preset-select" class="form-select" onchange="onChatPresetChange(this.value)">
              ${presetsOptionsHtml}
            </select>
          </div>
          <button type="button" class="btn-stage-preset" onclick="onChatPresetChange(document.getElementById('cfg-chat-preset-select').value)" title="Recargar valores originales de este preset">
            📥 Cargar
          </button>
          <button type="button" class="btn-stage-preset" onclick="saveCurrentChatPreset()" title="Guardar ajustes actuales sobre este preset">
            💾 Guardar en este Preset
          </button>
          <button type="button" class="btn-stage-preset" onclick="renameCurrentChatPreset()" title="Renombrar este preset">
            ✏️ Renombrar
          </button>
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 12px;" onclick="createNewChatPreset()">
            ➕ Guardar Como Nuevo Preset...
          </button>
          <button type="button" class="btn-stage-preset" style="color: #EF4444;" onclick="deleteCurrentChatPreset()" title="Eliminar preset si es personalizado">
            🗑️
          </button>
        </div>

        <!-- CONTROLES VISUALES AVANZADOS DEL PRESET -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <!-- 1. Forma / Silueta -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              🟦 Forma Visual / Silueta del Mensaje:
            </label>
            <select id="cfg-chat-shape" class="form-select" onchange="updateChatPipPreview()">
              <option value="rounded" ${c.shape === 'rounded' || !c.shape ? 'selected' : ''}>🟦 Esquinas Suaves (Glassmorphism)</option>
              <option value="box" ${c.shape === 'box' ? 'selected' : ''}>🔲 Cuadrado Técnico (Minimal)</option>
              <option value="bubble" ${c.shape === 'bubble' ? 'selected' : ''}>💬 Bocadillo Cómic (Pico Asimétrico)</option>
              <option value="scifi" ${c.shape === 'scifi' ? 'selected' : ''}>⚡ Sci-Fi Biselado (Hexagonal CRT)</option>
              <option value="pill" ${c.shape === 'pill' ? 'selected' : ''}>💊 Píldora (Ultra Redondeada 9999px)</option>
              <option value="arcade" ${c.shape === 'arcade' ? 'selected' : ''}>👾 Arcade Retro (8-Bit Cabinet)</option>
              <option value="tag" ${c.shape === 'tag' ? 'selected' : ''}>🏷️ Etiqueta Maker (Corte Diagonal)</option>
              <option value="slant" ${c.shape === 'slant' ? 'selected' : ''}>🎮 Slant Inclinado (Esports Arena)</option>
              <option value="soft_card" ${c.shape === 'soft_card' ? 'selected' : ''}>🌸 Tarjeta Curva (Nube Kawaii)</option>
            </select>
          </div>

          <!-- 2. Tipo de Fondo -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              💎 Capa de Fondo del Mensaje:
            </label>
            <select id="cfg-chat-bgtype" class="form-select" onchange="updateChatPipPreview()">
              <option value="glass" ${c.bgType === 'glass' || !c.bgType ? 'selected' : ''}>💎 Cristal Frosted (Glassmorphism)</option>
              <option value="gradient" ${c.bgType === 'gradient' ? 'selected' : ''}>🎨 Degradado Dual Dinámico</option>
              <option value="solid" ${c.bgType === 'solid' ? 'selected' : ''}>⬛ Color Sólido Opaco</option>
              <option value="transparent" ${c.bgType === 'transparent' ? 'selected' : ''}>👻 100% Transparente (Directo en Pantalla)</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <!-- 3. Colores de Fondo (Primario y Gradiente Secundario) -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Color Fondo Principal:
            </label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="color" id="cfg-chat-bgcolor" value="${c.bgColor || '#191D21'}" style="height: 36px; width: 50px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="document.getElementById('cfg-chat-bgcolor-hex').value = this.value; updateChatPipPreview()">
              <input type="text" id="cfg-chat-bgcolor-hex" class="form-input" value="${c.bgColor || '#191D21'}" style="width: 100px; font-family: monospace;" oninput="document.getElementById('cfg-chat-bgcolor').value = this.value; updateChatPipPreview();">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Color Fondo Secundario (Degradado):
            </label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="color" id="cfg-chat-bggrad" value="${c.bgGradient || '#0B0D0F'}" style="height: 36px; width: 50px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="document.getElementById('cfg-chat-bggrad-hex').value = this.value; updateChatPipPreview()">
              <input type="text" id="cfg-chat-bggrad-hex" class="form-input" value="${c.bgGradient || '#0B0D0F'}" style="width: 100px; font-family: monospace;" oninput="document.getElementById('cfg-chat-bggrad').value = this.value; updateChatPipPreview();">
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <!-- 4. Estilo de Borde y Grosor -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Estilo de Borde:
            </label>
            <select id="cfg-chat-borderstyle" class="form-select" onchange="updateChatPipPreview()">
              <option value="left_neon" ${c.borderStyle === 'left_neon' || !c.borderStyle ? 'selected' : ''}>▎ Barra Neón Izquierda (Acento)</option>
              <option value="full" ${c.borderStyle === 'full' ? 'selected' : ''}>🔲 Contorno Completo</option>
              <option value="double" ${c.borderStyle === 'double' ? 'selected' : ''}>⏸️ Doble Línea Arcade</option>
              <option value="none" ${c.borderStyle === 'none' ? 'selected' : ''}>🚫 Sin Borde</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Grosor del Borde: <span id="lbl-chat-bw" style="color: var(--color-accent-cyan); font-family: monospace;">${c.borderWidth !== undefined ? c.borderWidth : 3}px</span>
            </label>
            <input type="range" id="cfg-chat-borderwidth" min="0" max="8" value="${c.borderWidth !== undefined ? c.borderWidth : 3}" oninput="document.getElementById('lbl-chat-bw').textContent = this.value + 'px'; updateChatPipPreview();" style="width: 100%;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <!-- 5. Color de Borde y Resplandor Glow -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Color de Borde / Neón:
            </label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="color" id="cfg-chat-border" value="${c.borderColor || '#57D6C4'}" style="height: 36px; width: 50px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="document.getElementById('cfg-chat-border-hex').value = this.value; updateChatPipPreview()">
              <input type="text" id="cfg-chat-border-hex" class="form-input" value="${c.borderColor || '#57D6C4'}" style="width: 100px; font-family: monospace;" oninput="document.getElementById('cfg-chat-border').value = this.value; updateChatPipPreview();">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Resplandor / Glow Neón: <span id="lbl-chat-glow" style="color: var(--color-accent-cyan); font-family: monospace;">${c.glowIntensity !== undefined ? c.glowIntensity : 40}%</span>
            </label>
            <input type="range" id="cfg-chat-glow" min="0" max="100" value="${c.glowIntensity !== undefined ? c.glowIntensity : 40}" oninput="document.getElementById('lbl-chat-glow').textContent = this.value + '%'; updateChatPipPreview();" style="width: 100%;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <!-- 6. Tipografía, Tamaño y Opacidad -->
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Tipografía:
            </label>
            <select id="cfg-chat-font" class="form-select" onchange="updateChatPipPreview()">
              <option value="outfit" ${c.fontFamily === 'outfit' || !c.fontFamily ? 'selected' : ''}>Outfit (Moderno Streamer)</option>
              <option value="poppins" ${c.fontFamily === 'poppins' ? 'selected' : ''}>Poppins (Flotante / Alta Lectura)</option>
              <option value="inter" ${c.fontFamily === 'inter' ? 'selected' : ''}>Inter (Limpio & Neutro)</option>
              <option value="montserrat" ${c.fontFamily === 'montserrat' ? 'selected' : ''}>Montserrat (Elegante Maker)</option>
              <option value="rajdhani" ${c.fontFamily === 'rajdhani' ? 'selected' : ''}>Rajdhani (Tecnológico / Cyber)</option>
              <option value="orbitron" ${c.fontFamily === 'orbitron' ? 'selected' : ''}>Orbitron (Sci-Fi Espacial)</option>
              <option value="russo_one" ${c.fontFamily === 'russo_one' ? 'selected' : ''}>Russo One (Esports Impact)</option>
              <option value="comfortaa" ${c.fontFamily === 'comfortaa' ? 'selected' : ''}>Comfortaa (Kawaii Redondeado)</option>
              <option value="mono" ${c.fontFamily === 'mono' ? 'selected' : ''}>JetBrains Mono (Tech Hacker)</option>
              <option value="courier" ${c.fontFamily === 'courier' ? 'selected' : ''}>Courier CRT (Terminal Retro)</option>
              <option value="press_start" ${c.fontFamily === 'press_start' ? 'selected' : ''}>Press Start 2P (Pixel Arcade)</option>
              <option value="silkscreen" ${c.fontFamily === 'silkscreen' ? 'selected' : ''}>Silkscreen (Pixel HD Moderno)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Tamaño de Fuente (px):
            </label>
            <input type="number" id="cfg-chat-size" class="form-input" min="10" max="28" value="${c.fontSize || 14}" oninput="updateChatPipPreview()">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Opacidad del Fondo: <span id="lbl-chat-op" style="color: var(--color-accent-cyan); font-family: monospace;">${c.bgOpacity !== undefined ? c.bgOpacity : 88}%</span>
            </label>
            <input type="range" id="cfg-chat-opacity" min="0" max="100" value="${c.bgOpacity !== undefined ? c.bgOpacity : 88}" oninput="document.getElementById('lbl-chat-op').textContent = this.value + '%'; updateChatPipPreview();" style="width: 100%;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Desvanecer tras (segundos):
            </label>
            <input type="number" id="cfg-chat-fade" class="form-input" min="0" max="120" value="${c.fadeSeconds || 18}" title="0 para mantener en pantalla siempre">
            <div style="font-size: 10px; color: var(--color-text-dim); margin-top: 4px;">Pon 0 para que los mensajes no se oculten nunca en OBS.</div>
          </div>
        </div>

        <!-- 7. Colores por Rol de Twitch -->
        <details style="margin-top: 8px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
          <summary style="cursor: pointer; font-size: 12px; font-weight: 700; color: #57D6C4; font-family: var(--font-tech);">👑 Personalizar Colores Reactivos por Rol de Twitch (Seguidores, Subs, Mods...)</summary>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 10px;">
            <div>
              <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">👑 Streamer:</label>
              <input type="color" id="cfg-chat-role-broadcaster" value="${(c.roleColors && c.roleColors.broadcaster) || '#EF4444'}" style="width: 100%; height: 32px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateChatPipPreview()">
            </div>
            <div>
              <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">🛡️ Moderador:</label>
              <input type="color" id="cfg-chat-role-moderator" value="${(c.roleColors && c.roleColors.moderator) || '#22C55E'}" style="width: 100%; height: 32px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateChatPipPreview()">
            </div>
            <div>
              <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">💎 VIP:</label>
              <input type="color" id="cfg-chat-role-vip" value="${(c.roleColors && c.roleColors.vip) || '#EC4899'}" style="width: 100%; height: 32px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateChatPipPreview()">
            </div>
            <div>
              <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">⭐ Suscriptor:</label>
              <input type="color" id="cfg-chat-role-subscriber" value="${(c.roleColors && c.roleColors.subscriber) || '#F59E0B'}" style="width: 100%; height: 32px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateChatPipPreview()">
            </div>
            <div>
              <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">🎨 Artista:</label>
              <input type="color" id="cfg-chat-role-artist" value="${(c.roleColors && c.roleColors.artist) || '#8B5CF6'}" style="width: 100%; height: 32px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateChatPipPreview()">
            </div>
            <div>
              <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">💜 Seguidor Normal:</label>
              <input type="color" id="cfg-chat-role-follower" value="${(c.roleColors && c.roleColors.follower) || '#38BDF8'}" style="width: 100%; height: 32px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateChatPipPreview()">
            </div>
            <div>
              <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">👤 Sin Rol / Espectador:</label>
              <input type="color" id="cfg-chat-role-viewer" value="${(c.roleColors && c.roleColors.viewer) || '#94A3B8'}" style="width: 100%; height: 32px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateChatPipPreview()">
            </div>
          </div>
        </details>
      </div>

      <!-- 2. Filtros Inteligentes e Insignias -->
      <div class="miniapp-section-card">
        <div class="miniapp-section-header">
          <div class="miniapp-section-title">
            <span>🛡️</span>
            <span>Filtros Inteligentes y Efectos Reactivos</span>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
            <input type="checkbox" id="cfg-chat-hide-cmd" ${c.hideBotCommands !== false ? 'checked' : ''}>
            <span>Ocultar comandos de chat (mensajes con <code>!</code>)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
            <input type="checkbox" id="cfg-chat-hide-bots" ${c.hideBotUsers !== false ? 'checked' : ''}>
            <span>Ocultar bots conocidos (Nightbot, Wizebot...)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
            <input type="checkbox" id="cfg-chat-badges" ${c.showBadges !== false ? 'checked' : ''}>
            <span>Mostrar insignias oficiales (👑 Streamer, 🛡️ Mod, 💎 VIP, ⭐ Sub)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
            <input type="checkbox" id="cfg-chat-particles" ${c.autoParticles !== false ? 'checked' : ''}>
            <span>Partículas reactivas de hype en chat (gg, hype, ole, fiesta...)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
            <input type="checkbox" id="cfg-chat-sound" ${c.soundNotify ? 'checked' : ''}>
            <span>Sonido pop sutil al recibir mensaje (Web Audio)</span>
          </label>
        </div>
      </div>

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
        <textarea id="cfg-chat-custom-css" placeholder="/* Escribe aquí CSS adicional para inyectar directamente en OBS Studio */" style="width: 100%; height: 80px; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 10px; box-sizing: border-box; resize: vertical;" oninput="updateChatPipPreview()">${c.customCSS || ''}</textarea>
        <div style="display: flex; gap: 10px; align-items: center; justify-content: flex-end;">
          <button type="button" class="btn-action-primary" onclick="saveMiniAppControls('chat')">💾 Guardar Todos los Ajustes del Chat</button>
        </div>
      </div>
    `;

    // Cargar feed de chat inicial
    setTimeout(refreshChatLiveFeed, 100);

}


// ----------------------------------------------------------------------
// CHAT: PRESET MANAGEMENT & LIVE REFLECTION
// ----------------------------------------------------------------------
function onChatPresetChange(presetId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;

  cachedWidgetsConfig.chat.activePreset = presetId;
  if (!cachedWidgetsConfig.chat.styles) cachedWidgetsConfig.chat.styles = {};
  const s = cachedWidgetsConfig.chat.styles;

  // Sync state
  s.themePreset = preset.themePreset || presetId;
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
  s.fontFamily = preset.fontFamily || 'outfit';
  s.fontSize = preset.fontSize || 14;
  s.bgOpacity = preset.bgOpacity !== undefined ? preset.bgOpacity : 88;
  s.fadeSeconds = preset.fadeSeconds !== undefined ? preset.fadeSeconds : 18;
  s.customCSS = preset.customCSS || '';
  if (preset.roleColors) s.roleColors = Object.assign({}, preset.roleColors);

  // Update DOM inputs
  const shapeEl = document.getElementById('cfg-chat-shape');
  const bgTypeEl = document.getElementById('cfg-chat-bgtype');
  const bgColorEl = document.getElementById('cfg-chat-bgcolor');
  const bgColorHexEl = document.getElementById('cfg-chat-bgcolor-hex');
  const bgGradEl = document.getElementById('cfg-chat-bggrad');
  const bgGradHexEl = document.getElementById('cfg-chat-bggrad-hex');
  const borderStyleEl = document.getElementById('cfg-chat-borderstyle');
  const borderWidthEl = document.getElementById('cfg-chat-borderwidth');
  const borderWdLbl = document.getElementById('lbl-chat-bw');
  const borderEl = document.getElementById('cfg-chat-border');
  const borderHexEl = document.getElementById('cfg-chat-border-hex');
  const glowEl = document.getElementById('cfg-chat-glow');
  const glowLbl = document.getElementById('lbl-chat-glow');
  const fontEl = document.getElementById('cfg-chat-font');
  const sizeEl = document.getElementById('cfg-chat-size');
  const opEl = document.getElementById('cfg-chat-opacity');
  const opLbl = document.getElementById('lbl-chat-op');
  const fadeEl = document.getElementById('cfg-chat-fade');
  const cssEl = document.getElementById('cfg-chat-custom-css');

  if (shapeEl) shapeEl.value = s.shape;
  if (bgTypeEl) bgTypeEl.value = s.bgType;
  if (bgColorEl) bgColorEl.value = s.bgColor;
  if (bgColorHexEl) bgColorHexEl.value = s.bgColor;
  if (bgGradEl) bgGradEl.value = s.bgGradient;
  if (bgGradHexEl) bgGradHexEl.value = s.bgGradient;
  if (borderStyleEl) borderStyleEl.value = s.borderStyle;
  if (borderWidthEl) borderWidthEl.value = s.borderWidth;
  if (borderWdLbl) borderWdLbl.textContent = s.borderWidth + 'px';
  if (borderEl) borderEl.value = s.borderColor;
  if (borderHexEl) borderHexEl.value = s.borderColor;
  if (glowEl) glowEl.value = s.glowIntensity;
  if (glowLbl) glowLbl.textContent = s.glowIntensity + '%';
  if (fontEl) fontEl.value = s.fontFamily;
  if (sizeEl) sizeEl.value = s.fontSize;
  if (opEl) opEl.value = s.bgOpacity;
  if (opLbl) opLbl.textContent = s.bgOpacity + '%';
  if (fadeEl) fadeEl.value = s.fadeSeconds;
  if (cssEl) cssEl.value = s.customCSS;

  if (preset.roleColors) {
    const rc = preset.roleColors;
    const rBroad = document.getElementById('cfg-chat-role-broadcaster');
    const rMod = document.getElementById('cfg-chat-role-moderator');
    const rVip = document.getElementById('cfg-chat-role-vip');
    const rSub = document.getElementById('cfg-chat-role-subscriber');
    const rArt = document.getElementById('cfg-chat-role-artist');
    const rFollow = document.getElementById('cfg-chat-role-follower');
    const rViewer = document.getElementById('cfg-chat-role-viewer');
    if (rBroad && rc.broadcaster) rBroad.value = rc.broadcaster;
    if (rMod && rc.moderator) rMod.value = rc.moderator;
    if (rVip && rc.vip) rVip.value = rc.vip;
    if (rSub && rc.subscriber) rSub.value = rc.subscriber;
    if (rArt && rc.artist) rArt.value = rc.artist;
    if (rFollow && rc.follower) rFollow.value = rc.follower;
    if (rViewer && rc.viewer) rViewer.value = rc.viewer;
  }

  updateChatPipPreview();
  if (cachedWidgetsConfig.timer && cachedWidgetsConfig.timer.sameStyleAsChat) {
    copyStylesFromChatToTimer(false);
  }
}

async function saveCurrentChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const activePresetId = cachedWidgetsConfig.chat.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  preset.shape = document.getElementById('cfg-chat-shape')?.value || 'rounded';
  preset.bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
  preset.bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
  preset.bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
  preset.borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
  preset.borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
  preset.borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
  preset.accentColor = preset.borderColor;
  preset.glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
  preset.fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
  preset.fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
  preset.bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
  preset.fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
  preset.customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

  preset.roleColors = {
    broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
    moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
    vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
    subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
    artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
    follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
    viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
  };

  // Sincronizar también con styles
  cachedWidgetsConfig.chat.styles = Object.assign({}, cachedWidgetsConfig.chat.styles, {
    activePreset: activePresetId,
    themePreset: preset.themePreset || activePresetId,
    shape: preset.shape,
    bgType: preset.bgType,
    bgColor: preset.bgColor,
    bgGradient: preset.bgGradient,
    borderStyle: preset.borderStyle,
    borderWidth: preset.borderWidth,
    borderColor: preset.borderColor,
    accentColor: preset.borderColor,
    glowIntensity: preset.glowIntensity,
    fontFamily: preset.fontFamily,
    fontSize: preset.fontSize,
    bgOpacity: preset.bgOpacity,
    fadeSeconds: preset.fadeSeconds,
    roleColors: preset.roleColors,
    customCSS: preset.customCSS
  });

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateChatPipPreview();
  alert(`✓ ¡Preset "${preset.name}" guardado con éxito!`);
}

async function createNewChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const name = prompt('Nombre del nuevo Preset de Chat (ej. "Cyberpunk Neón Azul", "Bocadillo Cómic"):');
  if (!name || !name.trim()) return;

  const newId = 'preset_' + Date.now();
  const themePreset = document.getElementById('cfg-chat-preset-select')?.value || 'maker_glass';
  const shape = document.getElementById('cfg-chat-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
  const fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
  const fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
  const bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
  const fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
  const customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

  const roleColors = {
    broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
    moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
    vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
    subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
    artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
    follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
    viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
  };

  const newPreset = {
    id: newId,
    name: name.trim(),
    isBuiltin: false,
    themePreset,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    fontFamily,
    fontSize,
    bgOpacity,
    fadeSeconds,
    roleColors,
    customCSS
  };

  if (!cachedWidgetsConfig.chat.presets) cachedWidgetsConfig.chat.presets = [];
  cachedWidgetsConfig.chat.presets.push(newPreset);
  cachedWidgetsConfig.chat.activePreset = newId;

  // Sincronizar también con styles
  cachedWidgetsConfig.chat.styles = Object.assign({}, cachedWidgetsConfig.chat.styles, {
    activePreset: newId,
    themePreset: themePreset,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    fontFamily,
    fontSize,
    bgOpacity,
    fadeSeconds,
    roleColors,
    customCSS
  });

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  updateChatPipPreview();
  alert(`✓ ¡Nuevo preset "${name}" creado y activado!`);
}

async function renameCurrentChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const activePresetId = cachedWidgetsConfig.chat.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === activePresetId);
  if (!preset) return;

  const newName = prompt('Nuevo nombre para este preset de Chat:', preset.name);
  if (!newName || !newName.trim() || newName.trim() === preset.name) return;

  preset.name = newName.trim();
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert(`✓ Preset de Chat renombrado a "${preset.name}".`);
}

async function deleteCurrentChatPreset() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const activePresetId = cachedWidgetsConfig.chat.activePreset || 'maker_glass';
  const presets = cachedWidgetsConfig.chat.presets || [];
  const preset = presets.find(p => p.id === activePresetId);

  if (!preset) return;
  if (preset.isBuiltin) {
    alert('⚠️ Los presets integrados de fábrica del sistema no se pueden eliminar. Puedes guardar tus modificaciones en un preset nuevo con "➕ Guardar Como Nuevo Preset...".');
    return;
  }

  if (!confirm(`¿Seguro que deseas eliminar el preset personalizado "${preset.name}"?`)) return;

  cachedWidgetsConfig.chat.presets = presets.filter(p => p.id !== activePresetId);
  cachedWidgetsConfig.chat.activePreset = 'maker_glass';
  await API.saveWidgetsConfig(cachedWidgetsConfig);
  renderMiniAppControls();
  alert('✓ Preset personalizado eliminado.');
}

function updateChatPipPreview() {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || currentMiniAppWidget !== 'chat') return;

  const presetId = document.getElementById('cfg-chat-preset-select')?.value || 'maker_glass';
  const shape = document.getElementById('cfg-chat-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
  const bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
  const borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
  const borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
  const borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
  const glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
  const fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
  const fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
  const bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
  const fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
  const customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

  const roleColors = {
    broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
    moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
    vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
    subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
    artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
    follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
    viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
  };

  const styles = {
    themePreset: presetId,
    activePreset: presetId,
    shape,
    bgType,
    bgColor,
    bgGradient,
    borderStyle,
    borderWidth,
    borderColor,
    accentColor: borderColor,
    glowIntensity,
    fontFamily,
    fontSize,
    bgOpacity,
    fadeSeconds,
    roleColors,
    customCSS
  };

  try {
    if (iframe.contentWindow && iframe.contentWindow.applyChatConfig) {
      iframe.contentWindow.applyChatConfig(styles);
    }
  } catch (e) {}
}

// ----------------------------------------------------------------------
// LIVE FEED & SPOTLIGHT
// ----------------------------------------------------------------------
async function refreshChatLiveFeed() {
  const container = document.getElementById('chat-live-feed-list');
  if (!container) return;

  try {
    const res = await API.triggerWidgetAction('chat', 'get_recent');
    const messages = (res && res.messages) || [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="font-size: 12px; color: var(--color-text-dim); text-align: center; padding: 14px;">
          💬 No hay mensajes en el buffer de chat todavía.<br>
          <span style="font-size: 11px;">Escribe algo en Twitch o pulsa un botón en el simulador abajo para probar.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    // Mostrar del más reciente al más antiguo
    const reversed = [...messages].reverse();
    reversed.forEach(m => {
      const row = document.createElement('div');
      row.className = 'chat-feed-row';
      const userColor = m.color || '#57D6C4';
      const safeUser = (m.user || 'Viewer').replace(/"/g, '&quot;');
      const safeMsg = (m.message || '').replace(/"/g, '&quot;');

      row.innerHTML = `
        <div class="chat-feed-user" style="color: ${userColor}; min-width: 120px;">
          <span>👤</span>
          <span>${m.user}</span>
        </div>
        <div class="chat-feed-text" title="${safeMsg}">
          ${m.message}
        </div>
        <button type="button" class="btn-action-primary" style="white-space: nowrap; font-size: 10px; padding: 3px 8px;" onclick="triggerSpotlightFromFeed('${safeUser}', '${safeMsg}', '${userColor}')">
          📌 Destacar
        </button>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = '<div style="font-size: 11px; color: #EF4444; padding: 8px;">Error al cargar mensajes del feed.</div>';
  }
}

async function triggerSpotlightFromFeed(user, message, color) {
  await API.triggerWidgetAction('chat', 'spotlight', { active: true, user, message, color: color || '#57D6C4' });
  if (cachedWidgetsConfig && cachedWidgetsConfig.chat) {
    cachedWidgetsConfig.chat.spotlight = { active: true, user, message, color: color || '#57D6C4' };
  }
  const banner = document.getElementById('spotlight-active-banner');
  if (banner) {
    banner.style.background = 'rgba(87,214,196,0.12)';
    banner.style.borderColor = 'var(--color-accent-cyan)';
    banner.innerHTML = `
      <div>
        <span style="font-size: 11px; font-weight: 700; color: #57D6C4; font-family: var(--font-tech);">
          🟢 DESTACADO EN OBS AHORA MISMO:
        </span>
        <div style="font-size: 13px; color: #fff; margin-top: 2px;"><strong>${user}:</strong> "${message}"</div>
      </div>
      <button type="button" class="btn-stage-preset" style="color: #EF4444; border-color: #EF4444; font-size: 11px; padding: 4px 10px;" onclick="triggerSpotlightAction(false)">✕ Quitar de Pantalla</button>
    `;
  }
}

async function triggerSpotlightAction(active) {
  if (!active) {
    await API.triggerWidgetAction('chat', 'spotlight', { active: false });
    if (cachedWidgetsConfig && cachedWidgetsConfig.chat) {
      cachedWidgetsConfig.chat.spotlight = { active: false, user: '', message: '', color: '#57D6C4' };
    }
    const banner = document.getElementById('spotlight-active-banner');
    if (banner) {
      banner.style.background = 'rgba(0,0,0,0.3)';
      banner.style.borderColor = 'var(--color-border-dim)';
      banner.innerHTML = `
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #94A3B8; font-family: var(--font-tech);">
            ⚪ NINGÚN MENSAJE FIJADO EN OBS
          </span>
        </div>
      `;
    }
    return;
  }
  const user = document.getElementById('cfg-spotlight-user')?.value.trim() || 'ViewerDestacado';
  const message = document.getElementById('cfg-spotlight-msg')?.value.trim() || '¿Podrías enseñar el esquema de conexiones de la placa?';
  await triggerSpotlightFromFeed(user, message, '#57D6C4');
}

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
  const message = existing ? existing.message : '📢 ¡Únete a nuestro Discord oficial del Taller! https://discord.gg/andorina';
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

// ----------------------------------------------------------------------
// VISUAL SHORTCUT / PARTICLE EXPLOSION EDITOR
// ----------------------------------------------------------------------
function openParticleEditorModal(shortcutId) {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer || !cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;

  const shortcuts = cachedWidgetsConfig.chat.shortcuts || [];
  const existing = shortcutId ? shortcuts.find(s => s.id === shortcutId) : null;

  const id = existing ? existing.id : ('c_' + Date.now());
  const label = existing ? existing.label : '🎉 Fiesta Confeti';
  const emoji = existing ? existing.emoji : '🎉';
  const count = existing ? (existing.count || 45) : 45;
  const color = existing ? (existing.color || '#10B981') : '#10B981';
  const pinned = existing ? (existing.pinned !== false) : true;
  const autoTrigger = existing ? (existing.autoTrigger !== false) : true;
  const keywords = existing ? (existing.keywords || '') : 'fiesta, fiestas, festejo, festivo, festiva, fieston, viva';

  const presets = [
    { label: '🎉 Confeti', val: '🎉' },
    { label: '🔥 Fuegos', val: '🔥' },
    { label: '🛠️ Taller', val: '🛠️,⚡,💡' },
    { label: '❤️ Hype', val: '❤️,✨,⭐' },
    { label: '🚀 Despegue', val: '🚀' },
    { label: '⭐ Victoria', val: '⭐,🏆' },
    { label: '🪙 Monedas', val: '🪙,💰' },
    { label: '⚡ Rayos', val: '⚡' },
    { label: '👾 Arcade', val: '👾,🕹️' },
    { label: '🍻 Brindis', val: '🍻,🎉' }
  ];

  let presetsHtml = '';
  presets.forEach(p => {
    presetsHtml += `
      <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="document.getElementById('modal-part-emoji').value = '${p.val}'; document.getElementById('modal-part-label').value = '${p.label}';">
        ${p.label}
      </button>
    `;
  });

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box" style="max-width: 620px;">
        <div class="miniapp-modal-header">
          <div style="font-family: var(--font-tech); font-size: 14px; font-weight: 700; color: var(--color-accent-cyan); display: flex; align-items: center; gap: 8px;">
            <span>💥</span>
            <span>${existing ? 'Editar Acción Rápida de Partículas' : 'Nueva Acción Rápida de Partículas'}</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕</button>
        </div>

        <div class="miniapp-modal-body">
          <div class="form-group">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Nombre de la Acción:</label>
            <input type="text" id="modal-part-label" class="form-input" value="${label}" placeholder="Ej: 🎉 Fiesta Confeti">
          </div>

          <div class="form-group">
            <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
              Elige un Preset Visual de Emojis:
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
              ${presetsHtml}
            </div>
            <label style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 4px; display: block;">O escribe emojis personalizados (separados por coma):</label>
            <input type="text" id="modal-part-emoji" class="form-input" value="${emoji}">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">
                Cantidad de Partículas: <span id="lbl-modal-count" style="color: var(--color-accent-cyan); font-family: monospace;">${count}</span>
              </label>
              <input type="range" id="modal-part-count" min="10" max="100" value="${count}" oninput="document.getElementById('lbl-modal-count').textContent = this.value" style="width: 100%;">
            </div>
            <div class="form-group">
              <label style="font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px; display: block;">Color del Botón:</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="color" id="modal-part-color" value="${color}" style="height: 36px; width: 50px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="document.getElementById('modal-part-color-hex').value = this.value">
                <input type="text" id="modal-part-color-hex" class="form-input" value="${color}" style="font-family: monospace;" oninput="document.getElementById('modal-part-color').value = this.value">
              </div>
            </div>
          </div>

          <!-- SECCIÓN DE DISPARADORES / KEYWORDS POR CHAT -->
          <div style="background: rgba(87, 214, 196, 0.08); border: 1px solid rgba(87, 214, 196, 0.3); border-radius: 6px; padding: 12px; margin-top: 6px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-family: var(--font-tech); font-size: 12px; font-weight: 700; color: #57D6C4; display: flex; align-items: center; gap: 6px;">
                <span>🎯</span>
                <span>Palabras Clave de Activación en Chat (Triggers)</span>
              </span>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff;">
                <input type="checkbox" id="modal-part-autotrigger" ${autoTrigger ? 'checked' : ''}>
                <span>Activar con Chat</span>
              </label>
            </div>

            <div style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 8px; line-height: 1.4;">
              Escribe las palabras separadas por comas. El motor reconoce automáticamente acentos (<code>campeón</code> = <code>campeon</code>), mayúsculas y alargamientos (<code>hypeee</code> -> <code>hype</code>).
              <br>Puedes usar un comodín (ej: <code>campeon*</code>) para abarcar masculino, femenino y plurales (<em>campeón, campeona, campeones, campeonas</em>).
            </div>

            <div style="margin-bottom: 8px;">
              <div style="font-size: 11px; color: #57D6C4; margin-bottom: 4px; font-weight: 600;">⚡ Añadir sugerencias y variaciones en 1 clic:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 7px;" onclick="appendKeywordsToModal('fiesta, fiestas, festejo, festejos, festivo, festiva, fieston, fiestuki, viva')">+ Pack Fiesta</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 7px;" onclick="appendKeywordsToModal('campeon, campeona, campeones, campeonas, ganamos, victoria, victorias, ganador, ganadora, ganadores, gg, ggs')">+ Pack Campeón/a</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 7px;" onclick="appendKeywordsToModal('guapo, guapa, guapos, guapas, crack, fiera, grande, amor, corazon, corazones, tqm, ilove')">+ Pack Cariño/Hype</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 7px;" onclick="appendKeywordsToModal('fuego, fuegos, hype, hypee, quemando, arde, caliente, flama, flamas, ardiente')">+ Pack Fuego</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 7px;" onclick="appendKeywordsToModal('taller, circuito, circuitos, soldar, soldadura, invento, inventos, maker, placa, cacharreo')">+ Pack Taller Maker</button>
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 7px;" onclick="appendKeywordsToModal('moneda, monedas, pasta, dinero, rico, rica, sub, subs, ggwp')">+ Pack Monedas/GG</button>
              </div>
            </div>

            <textarea id="modal-part-keywords" class="form-input" style="height: 60px; font-family: monospace; font-size: 11px; resize: vertical;" placeholder="ej: fiesta, fiestas, festejo, festivo, festiva, fieston, viva">${keywords}</textarea>
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: #fff;">
              <input type="checkbox" id="modal-part-pinned" ${pinned ? 'checked' : ''}>
              <span>Mostrar acceso directo en la tarjeta exterior principal del widget</span>
            </label>
          </div>
        </div>

        <div class="miniapp-modal-footer">
          <button type="button" class="btn-stage-preset" onclick="testParticleFromModal()">▶ Probar Partículas en Vivo</button>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()">Cancelar</button>
          <button type="button" class="btn-action-primary" onclick="saveParticleFromModal('${id}')">💾 Guardar Acción</button>
        </div>
      </div>
    </div>
  `;
}

function appendKeywordsToModal(newKwStr) {
  const el = document.getElementById('modal-part-keywords');
  if (!el) return;
  const current = el.value.trim();
  if (!current) {
    el.value = newKwStr;
  } else {
    const existingList = current.split(',').map(s => s.trim().toLowerCase());
    const newItems = newKwStr.split(',').map(s => s.trim().toLowerCase()).filter(s => !existingList.includes(s));
    if (newItems.length) {
      el.value = current + ', ' + newItems.join(', ');
    }
  }
}

function testParticleFromModal() {
  const emoji = document.getElementById('modal-part-emoji')?.value || '🎉';
  const count = parseInt(document.getElementById('modal-part-count')?.value, 10) || 45;
  API.triggerWidgetAction('chat', 'explode', { emoji, count });
}

async function saveParticleFromModal(shortcutId) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.chat) return;
  const label = document.getElementById('modal-part-label')?.value.trim() || 'Acción';
  const emoji = document.getElementById('modal-part-emoji')?.value.trim() || '🎉';
  const count = parseInt(document.getElementById('modal-part-count')?.value, 10) || 45;
  const color = document.getElementById('modal-part-color')?.value || '#57D6C4';
  const pinned = document.getElementById('modal-part-pinned')?.checked !== false;
  const autoTrigger = document.getElementById('modal-part-autotrigger')?.checked !== false;
  const keywords = document.getElementById('modal-part-keywords')?.value.trim() || '';

  if (!cachedWidgetsConfig.chat.shortcuts) cachedWidgetsConfig.chat.shortcuts = [];
  const existingIdx = cachedWidgetsConfig.chat.shortcuts.findIndex(s => s.id === shortcutId);

  const scObj = {
    id: shortcutId,
    label,
    emoji,
    count,
    color,
    pinned,
    autoTrigger,
    keywords
  };

  if (existingIdx >= 0) {
    cachedWidgetsConfig.chat.shortcuts[existingIdx] = scObj;
  } else {
    cachedWidgetsConfig.chat.shortcuts.push(scObj);
  }

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  closeMiniAppModal();
  renderWidgetsGrid();
  renderMiniAppShortcutsManager();
  alert('✓ Acción rápida de partículas guardada con éxito.');
}

function insertCssTemplateIntoChat(templateKey) {
  const cssEl = document.getElementById('cfg-chat-custom-css');
  if (!cssEl) return;
  const templates = {
    cyber_neon: `/* Preset Neón Cyber Gamer */
.chat-msg {
  background: linear-gradient(135deg, rgba(14, 18, 26, 0.94), rgba(5, 7, 12, 0.96)) !important;
  border-left: 4px solid var(--chat-accent, #57D6C4) !important;
  border-right: 1px solid rgba(87, 214, 196, 0.25) !important;
  border-radius: 4px 14px 14px 4px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 16px rgba(87, 214, 196, 0.35) !important;
}
.username-text {
  text-shadow: 0 0 8px currentColor !important;
}`,
    floating_clean: `/* Flotante Directo en Pantalla (Alta Legibilidad) */
.chat-msg {
  background: rgba(10, 14, 20, 0.32) !important;
  border-radius: 30px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-left: 3px solid #38BDF8 !important;
  backdrop-filter: blur(10px) !important;
  padding: 8px 16px !important;
}
.msg-body, .username-text {
  text-shadow: 0 1px 3px #000, 0 2px 8px rgba(0,0,0,0.95), 0 0 14px #000 !important;
}`,
    esports_slant: `/* Esports Slant Inclinado */
.chat-msg {
  clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%) !important;
  border-radius: 0 !important;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.22), rgba(18, 18, 24, 0.96)) !important;
  border-left: 4px solid #EF4444 !important;
  padding: 10px 22px !important;
}
.chat-msg .username-text {
  text-transform: uppercase;
  letter-spacing: 1px;
}`,
    kawaii_soft: `/* Nube Kawaii Pastel */
.chat-msg {
  border-radius: 18px !important;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.22), rgba(30, 20, 45, 0.92)) !important;
  border: 1.5px solid rgba(244, 114, 182, 0.4) !important;
  box-shadow: 0 8px 24px rgba(244, 114, 182, 0.2) !important;
}
.badge-chip { border-radius: 12px !important; }`,
    retro_pixel: `/* Retro 8-Bit Arcade */
.chat-msg {
  border-radius: 0 !important;
  border: 2px solid var(--chat-accent, #57D6C4) !important;
  background: #0B0E14 !important;
  box-shadow: 4px 4px 0 #000 !important;
}
.username-text {
  text-transform: uppercase;
}`
  };

  const code = templates[templateKey];
  if (!code) return;
  cssEl.value = (cssEl.value ? cssEl.value.trim() + '\n\n' : '') + code;
  updateChatPipPreview();
  alert('✓ Plantilla CSS insertada en la casilla de CSS Personalizado y aplicada a la vista previa.');
}

function openChatThemeGuideModal() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box" style="max-width: 860px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="miniapp-modal-header" style="flex-shrink: 0;">
          <div style="font-family: var(--font-tech); font-size: 14px; font-weight: 700; color: var(--color-accent-cyan); display: flex; align-items: center; gap: 8px;">
            <span>📖</span>
            <span>Manual Técnico y Guía Integral de Estilos CSS para el Chat</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕ Cerrar</button>
        </div>

        <div class="miniapp-modal-body" style="font-size: 13px; color: #E2E8F0; line-height: 1.6; overflow-y: auto; padding-right: 12px;">
          
          <!-- SECCIÓN 1: MODOS DE USO Y OBS -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>🎯</span> 1. Modos de Uso y Parámetros URL en OBS Studio
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 8px;">
              El widget detecta automáticamente el modo de despliegue mediante parámetros en la URL de OBS:
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
              <li><strong>Enmarcado en caja de overlay (Box)</strong>: <code>/widgets/chat/?layout=box</code> (ocupa el 100% del cuadro asignado en tu plantilla, ideal para columnas de chat laterales).</li>
              <li><strong>Flotante Directo en Pantalla</strong>: <code>/widgets/chat/?theme=screen_no_overlay</code> (diseñado para fuentes de 1920×1080 sobre gameplay con fondo sutil y sombras de alto contraste).</li>
              <li><strong>100% Transparente sin bordes (Ghost)</strong>: <code>/widgets/chat/?theme=ghost</code> (solo el texto y emoticonos flotando con sombra profunda).</li>
              <li><strong>Posicionamiento automático en pantalla</strong>: <code>?pos=bottom-left</code>, <code>?pos=bottom-right</code>, <code>?pos=top-left</code> o <code>?pos=top-right</code>.</li>
            </ul>
          </div>

          <!-- SECCIÓN 2: JERARQUÍA DEL DOM Y SELECTORES -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>📐</span> 2. Jerarquía del DOM y Selectores CSS Clave
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 10px;">
              Todos los elementos del chat cuentan con clases semánticas identificables para control total con CSS:
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--color-border-dim); color: var(--color-accent-cyan);">
                    <th style="padding: 6px 8px;">Selector CSS</th>
                    <th style="padding: 6px 8px;">Elemento Representado</th>
                    <th style="padding: 6px 8px;">Propiedades Útiles</th>
                  </tr>
                </thead>
                <tbody style="color: #CBD5E1;">
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-container</td>
                    <td style="padding: 6px 8px;">Contenedor vertical de mensajes</td>
                    <td style="padding: 6px 8px;">gap, max-width, justify-content</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-msg</td>
                    <td style="padding: 6px 8px;">Burbuja / tarjeta del mensaje individual</td>
                    <td style="padding: 6px 8px;">background, border, border-radius, clip-path, box-shadow</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-msg.role-*</td>
                    <td style="padding: 6px 8px;">Variantes por rango (broadcaster, moderator, vip, subscriber, artist, follower, viewer)</td>
                    <td style="padding: 6px 8px;">border-left-color, background, box-shadow</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.msg-header</td>
                    <td style="padding: 6px 8px;">Cabecera (insignias + nombre)</td>
                    <td style="padding: 6px 8px;">display: flex, align-items: center, gap</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.badge-chip</td>
                    <td style="padding: 6px 8px;">Insignias individuales (👑, 🛡️, 💎, ⭐, 🎨, 💜, 👤)</td>
                    <td style="padding: 6px 8px;">background, border-radius, font-size</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.username-text</td>
                    <td style="padding: 6px 8px;">Nombre del espectador de Twitch</td>
                    <td style="padding: 6px 8px;">font-weight, text-transform, text-shadow</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.msg-body</td>
                    <td style="padding: 6px 8px;">Cuerpo de texto del mensaje</td>
                    <td style="padding: 6px 8px;">color, line-height, text-shadow, font-size</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.msg-body img.twitch-emote</td>
                    <td style="padding: 6px 8px;">Emoticonos de Twitch, BTTV y 7TV</td>
                    <td style="padding: 6px 8px;">height (por defecto 28px), margin</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-msg.fading</td>
                    <td style="padding: 6px 8px;">Estado de desvanecimiento tras N segundos</td>
                    <td style="padding: 6px 8px;">opacity, transform, transition</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">#chat-spotlight-box</td>
                    <td style="padding: 6px 8px;">Tarjeta de mensaje fijado (Spotlight)</td>
                    <td style="padding: 6px 8px;">top, left, width, animation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SECCIÓN 3: VARIABLES CSS DEL SISTEMA -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>🎨</span> 3. Variables CSS Nativas (:root)
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 8px;">
              Puedes redefinir los colores de roles, acentos y fuentes globales con solo reasignar estas variables:
            </div>
            <pre style="background: #080A0C; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 10px; font-size: 11px; color: #57D6C4; margin: 0; overflow-x: auto;">
:root {
  /* Acento Neón Global */
  --chat-accent: #57D6C4;

  /* Colores Reactivos por Rol */
  --color-broadcaster: #EF4444; /* 👑 Streamer */
  --color-moderator:   #22C55E; /* 🛡️ Moderador */
  --color-vip:         #EC4899; /* 💎 VIP */
  --color-subscriber:  #F59E0B; /* ⭐ Suscriptor */
  --color-artist:      #8B5CF6; /* 🎨 Artista */
  --color-follower:    #38BDF8; /* 💜 Seguidor Normal */
  --color-viewer:      #94A3B8; /* 👤 Espectador sin rol */
}</pre>
          </div>

          <!-- SECCIÓN 4: RECETAS LISTAS PARA APLICAR -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>🚀</span> 4. Biblioteca de Recetas CSS Listas para Usar (1 Clic)
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 12px;">
              Haz clic en cualquier receta para insertarla instantáneamente en tu casilla de CSS Personalizado y verla en la previsualización:
            </div>

            <!-- Receta 1: Neón Cyber Gamer -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #57D6C4; font-size: 12px;">⚡ 1. Neón Cyber Gamer (Glow + Borde Asimétrico)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('cyber_neon')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  background: linear-gradient(135deg, rgba(14, 18, 26, 0.94), rgba(5, 7, 12, 0.96)) !important;
  border-left: 4px solid var(--chat-accent, #57D6C4) !important;
  border-right: 1px solid rgba(87, 214, 196, 0.25) !important;
  border-radius: 4px 14px 14px 4px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.8), 0 0 16px rgba(87, 214, 196, 0.35) !important;
}
.username-text { text-shadow: 0 0 8px currentColor !important; }</pre>
            </div>

            <!-- Receta 2: Flotante Alta Lectura Directo Pantalla -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #38BDF8; font-size: 12px;">📺 2. Flotante Directo en Pantalla (Máxima Lectura sobre Juegos)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('floating_clean')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  background: rgba(10, 14, 20, 0.32) !important;
  border-radius: 30px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-left: 3px solid #38BDF8 !important;
  backdrop-filter: blur(10px) !important;
  padding: 8px 16px !important;
}
.msg-body, .username-text {
  text-shadow: 0 1px 3px #000, 0 2px 8px rgba(0,0,0,0.95), 0 0 14px #000 !important;
}</pre>
            </div>

            <!-- Receta 3: Esports Slant Inclinado -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #EF4444; font-size: 12px;">🎮 3. Esports Arena (Corte Inclinado con Clip-Path)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('esports_slant')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%) !important;
  border-radius: 0 !important;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.22), rgba(18, 18, 24, 0.96)) !important;
  border-left: 4px solid #EF4444 !important;
  padding: 10px 22px !important;
}
.chat-msg .username-text { text-transform: uppercase; letter-spacing: 1px; }</pre>
            </div>

            <!-- Receta 4: Nube Kawaii Pastel -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #F472B6; font-size: 12px;">🌸 4. Nube Kawaii Pastel (Ultra Curvo Suave)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('kawaii_soft')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  border-radius: 18px !important;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.22), rgba(30, 20, 45, 0.92)) !important;
  border: 1.5px solid rgba(244, 114, 182, 0.4) !important;
  box-shadow: 0 8px 24px rgba(244, 114, 182, 0.2) !important;
}
.badge-chip { border-radius: 12px !important; }</pre>
            </div>

            <!-- Receta 5: Retro Arcade 8-Bit -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #F59E0B; font-size: 12px;">👾 5. Retro Arcade 8-Bit (Caja Sólida con Sombra Pixel)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('retro_pixel')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  border-radius: 0 !important;
  border: 2px solid var(--chat-accent, #57D6C4) !important;
  background: #0B0E14 !important;
  box-shadow: 4px 4px 0 #000 !important;
}
.username-text { text-transform: uppercase; }</pre>
            </div>
          </div>

          <!-- SECCIÓN 5: ANIMACIONES Y FÍSICAS -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>✨</span> 5. Animación de Entrada Personalizada (@keyframes)
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 8px;">
              Cambia la animación por defecto de los mensajes que van apareciendo en el stream:
            </div>
            <pre style="background: #080A0C; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 10px; font-size: 11px; color: #57D6C4; margin: 0; overflow-x: auto;">
/* Entrada con rebote y escala elástica */
@keyframes msg-pop-in {
  0%   { opacity: 0; transform: scale(0.85) translateY(10px); }
  70%  { opacity: 1; transform: scale(1.03) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.chat-msg {
  animation: msg-pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
}</pre>
          </div>

        </div>

        <div class="miniapp-modal-footer" style="flex-shrink: 0; padding-top: 12px; border-top: 1px solid var(--color-border-dim);">
          <button type="button" class="btn-action-primary" onclick="closeMiniAppModal()">Cerrar Manual</button>
        </div>
      </div>
    </div>
  `;
}

function closeMiniAppModal() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (modalContainer) modalContainer.innerHTML = '';
}

function simulateChatMessage(type) {
  if (type === 'normal') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'LurkerCurioso', message: '¡Buenas a todos, primer día que paso por el directo!', color: '#94A3B8', badges: '' });
  } else if (type === 'follower') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'MakerFan', message: '¡Acabo de dejar mi follow! Me encanta el proyecto y el setup. 💜', color: '#38BDF8', badges: 'follower/1' });
  } else if (type === 'sub') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'AlexSub', message: '¡Renuevo la sub de nivel 1! 🛠️ A tope con el canal.', color: '#F59E0B', badges: 'subscriber/6' });
  } else if (type === 'mod') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'SuperMod', message: 'Recordad que tenéis los enlaces del taller en la descripción.', color: '#22C55E', badges: 'moderator/1' });
  } else if (type === 'vip') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'ColaboradorVIP', message: '¿A qué temperatura pusiste la plancha térmica?', color: '#EC4899', badges: 'vip/1' });
  } else if (type === 'broadcaster') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'AndorinaStreamer', message: '¡Gracias por acompañarme en este directo! 👑', color: '#EF4444', badges: 'broadcaster/1' });
  } else if (type === 'emotes') {
    API.triggerWidgetAction('chat', 'simulate', { user: 'HypeMachine', message: '¡Vamoooos que funciona a la primera! 🎉🔥🚀', color: '#8B5CF6', badges: 'subscriber/12,artist-badge/1' });
  }
  setTimeout(refreshChatLiveFeed, 300);
}



async function saveChatControls() {
  if (!cachedWidgetsConfig) return;
    if (!cachedWidgetsConfig.chat.styles) cachedWidgetsConfig.chat.styles = {};
    const s = cachedWidgetsConfig.chat.styles;
    const presetId = document.getElementById('cfg-chat-preset-select')?.value || 'maker_glass';
    cachedWidgetsConfig.chat.activePreset = presetId;
    s.themePreset = presetId;
    s.activePreset = presetId;
    s.shape = document.getElementById('cfg-chat-shape')?.value || 'rounded';
    s.bgType = document.getElementById('cfg-chat-bgtype')?.value || 'glass';
    s.bgColor = document.getElementById('cfg-chat-bgcolor')?.value || '#191D21';
    s.bgGradient = document.getElementById('cfg-chat-bggrad')?.value || '#0B0D0F';
    s.borderStyle = document.getElementById('cfg-chat-borderstyle')?.value || 'left_neon';
    s.borderWidth = parseInt(document.getElementById('cfg-chat-borderwidth')?.value, 10) || 3;
    s.borderColor = document.getElementById('cfg-chat-border')?.value || '#57D6C4';
    s.accentColor = s.borderColor;
    s.glowIntensity = parseInt(document.getElementById('cfg-chat-glow')?.value, 10) || 40;
    s.fontFamily = document.getElementById('cfg-chat-font')?.value || 'outfit';
    s.fontSize = parseInt(document.getElementById('cfg-chat-size')?.value, 10) || 14;
    s.bgOpacity = parseInt(document.getElementById('cfg-chat-opacity')?.value, 10) || 88;
    s.fadeSeconds = parseInt(document.getElementById('cfg-chat-fade')?.value, 10) || 18;
    s.showBadges = document.getElementById('cfg-chat-badges')?.checked !== false;
    s.hideBotCommands = document.getElementById('cfg-chat-hide-cmd')?.checked !== false;
    s.hideBotUsers = document.getElementById('cfg-chat-hide-bots')?.checked !== false;
    s.soundNotify = document.getElementById('cfg-chat-sound')?.checked === true;
    s.autoParticles = document.getElementById('cfg-chat-particles')?.checked !== false;
    s.customCSS = document.getElementById('cfg-chat-custom-css')?.value || '';

    s.roleColors = {
      broadcaster: document.getElementById('cfg-chat-role-broadcaster')?.value || '#EF4444',
      moderator: document.getElementById('cfg-chat-role-moderator')?.value || '#22C55E',
      vip: document.getElementById('cfg-chat-role-vip')?.value || '#EC4899',
      subscriber: document.getElementById('cfg-chat-role-subscriber')?.value || '#F59E0B',
      artist: document.getElementById('cfg-chat-role-artist')?.value || '#8B5CF6',
      follower: document.getElementById('cfg-chat-role-follower')?.value || '#38BDF8',
      viewer: document.getElementById('cfg-chat-role-viewer')?.value || '#94A3B8'
    };

    // Actualizar también en el array de presets si existe
    const curP = (cachedWidgetsConfig.chat.presets || []).find(p => p.id === presetId);
    if (curP) {
      curP.shape = s.shape;
      curP.bgType = s.bgType;
      curP.bgColor = s.bgColor;
      curP.bgGradient = s.bgGradient;
      curP.borderStyle = s.borderStyle;
      curP.borderWidth = s.borderWidth;
      curP.borderColor = s.borderColor;
      curP.accentColor = s.borderColor;
      curP.glowIntensity = s.glowIntensity;
      curP.fontFamily = s.fontFamily;
      curP.fontSize = s.fontSize;
      curP.bgOpacity = s.bgOpacity;
      curP.fadeSeconds = s.fadeSeconds;
      curP.roleColors = s.roleColors;
      curP.customCSS = s.customCSS;
    }
    if (cachedWidgetsConfig.timer && cachedWidgetsConfig.timer.sameStyleAsChat) {
      await copyStylesFromChatToTimer(false);
    }

}



// Registro del módulo Chat
window.renderChatShortcuts = renderChatShortcuts;
window.triggerChatShortcut = triggerChatShortcut;
window.renderChatControls = renderChatControls;
window.saveChatControls = saveChatControls;

window.WidgetModules = window.WidgetModules || {};
window.WidgetModules['chat'] = {
  renderControls: renderChatControls,
  saveControls: saveChatControls,
  renderShortcuts: renderChatShortcuts,
  updatePreview: typeof updateChatPipPreview === 'function' ? updateChatPipPreview : () => {}
};

