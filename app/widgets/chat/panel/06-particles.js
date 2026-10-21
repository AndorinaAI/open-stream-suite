
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
    { label: '🎮 Stream', val: '🎮,⚡,💡' },
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
                <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 7px;" onclick="appendKeywordsToModal('stream, directo, game, gameplay, gaming, clips, hype')">+ Pack Stream</button>
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
