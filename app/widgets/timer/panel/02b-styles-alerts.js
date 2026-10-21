// widgets/timer/panel/02b-styles-alerts.js - Generador HTML de presets, atajos y apariencia visual

function buildTimerStylesPresetsHtml(t, s, presets, activePresetId) {
  const sameAsChat = t.sameStyleAsChat === true;
  const titleVal = t.title || 'EN BREVE COMENZAMOS';
  const targetSec = t.targetSeconds || 0;

  let presetsOptionsHtml = '';
  presets.forEach(p => {
    const isSel = (p.id === activePresetId) ? 'selected' : '';
    const tag = p.isBuiltin ? '' : ' ⭐ [Personalizado]';
    presetsOptionsHtml += `<option value="${p.id}" ${isSel}>${p.name}${tag}</option>`;
  });

  const shape = s.shape || 'rounded';
  const bgType = s.bgType || 'glass';
  const bgColor = s.bgColor || '#191D21';
  const borderColor = s.borderColor || '#57D6C4';
  const glowIntensity = s.glowIntensity !== undefined ? s.glowIntensity : 40;
  const fontFamily = s.fontFamily || (s.timeDigits && s.timeDigits.fontFamily) || 'outfit';
  const digitsSize = (s.timeDigits && s.timeDigits.fontSize) || 38;
  const digitsColor = (s.timeDigits && s.timeDigits.color) || '#F2EEE5';
  const barShow = s.progressBar?.show !== false;

  return `
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

      <!-- CONTROLES VISUALES -->
      <div id="timer-style-controls-wrapper" style="opacity: ${sameAsChat ? '0.45' : '1'}; pointer-events: ${sameAsChat ? 'none' : 'auto'}; transition: opacity 0.2s ease;">
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
