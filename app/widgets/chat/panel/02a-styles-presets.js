// widgets/chat/panel/02a-styles-presets.js - Generador HTML de presets, formas, fondos y colores por rol

function buildChatStylesPresetsHtml(c, presets, activePresetId) {
  let presetsOptionsHtml = '';
  presets.forEach(p => {
    const isSel = (p.id === activePresetId) ? 'selected' : '';
    const tag = p.isBuiltin ? '' : ' ⭐ [Personalizado]';
    presetsOptionsHtml += `<option value="${p.id}" ${isSel}>${p.name}${tag}</option>`;
  });

  return `
    <!-- 1. Presets de Diseño y Apariencia -->
    <div class="miniapp-section-card">
      <div class="miniapp-section-header">
        <div class="miniapp-section-title">
          <span>🎨</span>
          <span>Presets de Diseño y Apariencia Visual</span>
        </div>
      </div>

      <div style="background: rgba(87,214,196,0.08); border: 1px solid rgba(87,214,196,0.35); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: #57D6C4; margin-bottom: 4px;">
          🎨 El aspecto lo define el tema del pack
        </div>
        <div style="font-size: 11px; color: var(--color-text-dim); line-height: 1.5;">
          Los 15 presets visuales de chat ya no se ofrecen: no correspondían a ningún
          tema de los packs. Elige el tema en la pestaña <strong>🎨 Tema</strong> de
          esta mini-app y usa los ajustes de abajo solo para personalizar por encima
          (color, fondo, fuente, forma).
        </div>
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
        <!-- 3. Colores de Fondo -->
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
  `;
}
