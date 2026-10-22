/**
 * app/widgets/chat/panel/09-profiles-links.js
 * Gestor de Perfiles de Chat Multi-Estilo y Generador de Enlaces OBS independientes por escena.
 * Permite a los streamers crear, guardar, personalizar y copiar URLs específicas para OBS Browser Source
 * según la estética visual de cada escena (Cozy, Gamer, Maker, Minimal, etc.).
 */

(function() {
  let activeProfilesFilter = 'all';

  function getBaseChatUrl(profileId) {
    const host = window.location.hostname || 'localhost';
    const port = window.location.port || '8080';
    return `http://${host}:${port}/widgets/chat/index.html?profile=${encodeURIComponent(profileId)}`;
  }

  function getShapeLabel(shape) {
    const shapes = {
      rounded: '🟦 Esquinas Suaves (Glass)',
      soft_card: '🌸 Tarjeta Curva (Cozy)',
      scifi: '⚡ Sci-Fi Biselado (Gamer)',
      bubble: '💬 Bocadillo Cómic',
      pill: '💊 Píldora Minimal',
      arcade: '👾 Arcade 8-Bit',
      box: '🔲 Cuadrado Técnico',
      tag: '🏷️ Etiqueta Técnica',
      slant: '🎮 Slant Inclinado'
    };
    return shapes[shape] || shape || 'Esquinas Suaves';
  }

  function getBgTypeLabel(bgType) {
    const types = {
      glass: '💎 Cristal Frosted',
      solid: '⬛ Sólido Opaco',
      gradient: '🎨 Degradado Dual',
      transparent: '👻 Transparente'
    };
    return types[bgType] || bgType || 'Cristal';
  }

  function renderChatProfilesManager(container) {
    const target = container || document.getElementById('miniapp-view-chat-profiles');
    if (!target) return;

    if (!window.cachedWidgetsConfig || !window.cachedWidgetsConfig.chat) {
      target.innerHTML = '<div style="padding: 24px; color: var(--color-text-dim);">⏳ Cargando configuración de chat...</div>';
      return;
    }

    const chatData = window.cachedWidgetsConfig.chat;
    const presets = chatData.presets || [];
    const activePresetId = chatData.activePreset || (chatData.styles && chatData.styles.activePreset) || 'maker_glass';

    const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;

    // Filtrar presets si hay filtro activo
    const filteredPresets = presets.filter(p => {
      if (activeProfilesFilter === 'all') return true;
      if (activeProfilesFilter === 'cozy') return p.id.includes('cozy') || p.id.includes('kawaii');
      if (activeProfilesFilter === 'gamer') return p.id.includes('gamer') || p.id.includes('cyber') || p.id.includes('esports');
      if (activeProfilesFilter === 'maker') return p.id.includes('maker') || p.id.includes('ticket') || p.id.includes('matrix');
      if (activeProfilesFilter === 'minimal') return p.id.includes('screen') || p.id.includes('ghost') || p.id.includes('pill');
      if (activeProfilesFilter === 'custom') return !p.isBuiltin;
      return true;
    });

    target.innerHTML = `
      <div style="margin-bottom: 20px;">
        <!-- Banner Explicativo -->
        <div style="background: rgba(14, 18, 24, 0.9); border: 1.5px solid rgba(87, 214, 196, 0.35); border-radius: 8px; padding: 16px 20px; margin-bottom: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                <span style="font-size: 22px;">🔗</span>
                <span style="font-family: var(--font-tech); font-size: 15px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;">
                  ${tr('widgets.chat.profiles_title', 'ENLACES DE CHAT OBS POR ESTILO & ESCENA')}
                </span>
                <span class="badge-pill" style="font-size: 10px; background: rgba(87, 214, 196, 0.15); color: var(--color-accent-cyan); font-weight: 800;">
                  ${presets.length} PERFILES CONFIGURADOS
                </span>
              </div>
              <div style="font-size: 12px; color: var(--color-text-dim); line-height: 1.5; max-width: 680px;">
                ${tr('widgets.chat.profiles_desc', 'Copia un enlace diferente para cada una de tus escenas de OBS. Por ejemplo, pon el perfil <b>🌿 Cozy Lo-Fi</b> en tu escena de Just Chatting, <b>⚡ Gamer Pro</b> en tu escena de Juego, y <b>💎 Maker Glass</b> en tu escena de Taller. ¡Cualquier cambio que guardes se sincronizará automáticamente sin recargar OBS!')}
              </div>
            </div>
            <button type="button" class="btn-action-primary" style="font-size: 12px; padding: 8px 16px; font-weight: 700; white-space: nowrap;" onclick="createNewChatProfilePrompt()">
              ➕ Crear Nuevo Perfil de Chat
            </button>
          </div>

          <!-- Filtros de categoría -->
          <div style="display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
            <button type="button" class="btn-stage-preset ${activeProfilesFilter === 'all' ? 'active-filter' : ''}" style="font-size: 11px; padding: 4px 10px;" onclick="filterChatProfiles('all')">Todos (${presets.length})</button>
            <button type="button" class="btn-stage-preset ${activeProfilesFilter === 'cozy' ? 'active-filter' : ''}" style="font-size: 11px; padding: 4px 10px;" onclick="filterChatProfiles('cozy')">🌿 Cozy / Kawaii</button>
            <button type="button" class="btn-stage-preset ${activeProfilesFilter === 'gamer' ? 'active-filter' : ''}" style="font-size: 11px; padding: 4px 10px;" onclick="filterChatProfiles('gamer')">⚡ Gamer / Sci-Fi</button>
            <button type="button" class="btn-stage-preset ${activeProfilesFilter === 'maker' ? 'active-filter' : ''}" style="font-size: 11px; padding: 4px 10px;" onclick="filterChatProfiles('maker')">🛠️ Maker / Terminal</button>
            <button type="button" class="btn-stage-preset ${activeProfilesFilter === 'minimal' ? 'active-filter' : ''}" style="font-size: 11px; padding: 4px 10px;" onclick="filterChatProfiles('minimal')">👻 Minimal / Pantalla</button>
            <button type="button" class="btn-stage-preset ${activeProfilesFilter === 'custom' ? 'active-filter' : ''}" style="font-size: 11px; padding: 4px 10px;" onclick="filterChatProfiles('custom')">⭐ Mis Perfiles (${presets.filter(p => !p.isBuiltin).length})</button>
          </div>
        </div>

        <!-- Grid de Tarjetas de Perfil -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px;">
          ${filteredPresets.map(preset => {
            const isCurrentActive = (preset.id === activePresetId);
            const obsUrl = getBaseChatUrl(preset.id);
            const borderCol = preset.borderColor || '#57D6C4';
            const bgCol = preset.bgColor || '#191D21';
            const opacity = preset.bgOpacity !== undefined ? preset.bgOpacity : 85;

            return `
              <div class="dash-card" style="padding: 16px; border: 1.5px solid ${isCurrentActive ? 'var(--color-accent-cyan)' : 'rgba(87, 214, 196, 0.25)'}; border-radius: 8px; background: rgba(14, 18, 24, 0.95); display: flex; flex-direction: column; justify-content: space-between; gap: 12px; transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--color-accent-cyan)'" onmouseout="this.style.borderColor='${isCurrentActive ? 'var(--color-accent-cyan)' : 'rgba(87, 214, 196, 0.25)'}'">
                <div>
                  <!-- Encabezado Perfil -->
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
                    <div>
                      <div style="font-size: 14px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 6px;">
                        <span>${escapeHtml(preset.name)}</span>
                        ${isCurrentActive ? '<span style="font-size: 10px; background: rgba(87, 214, 196, 0.2); color: var(--color-accent-cyan); padding: 1px 6px; border-radius: 3px; font-weight: 800;">ACTIVO GLOBAL</span>' : ''}
                      </div>
                      <div style="font-size: 10px; color: var(--color-text-dim); font-family: var(--font-tech); margin-top: 2px;">
                        ID: <code style="color: var(--color-accent-cyan); background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 2px;">${preset.id}</code>
                        ${preset.isBuiltin ? ' · Integrado de fábrica' : ' · ⭐ Creado por ti'}
                      </div>
                    </div>

                    <!-- Muestra de color / estilo -->
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <span title="Color de Borde" style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${borderCol}; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 0 6px ${borderCol};"></span>
                      <span title="Fondo" style="display: inline-block; width: 14px; height: 14px; border-radius: 3px; background: ${bgCol}; border: 1px solid rgba(255,255,255,0.3);"></span>
                    </div>
                  </div>

                  <!-- Insignias de Propiedades de Estilo -->
                  <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
                    <span style="font-size: 10px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); color: var(--color-text-light);">
                      ${getShapeLabel(preset.shape)}
                    </span>
                    <span style="font-size: 10px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); color: var(--color-text-light);">
                      ${getBgTypeLabel(preset.bgType)} (${opacity}%)
                    </span>
                    <span style="font-size: 10px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); color: var(--color-text-light);">
                      🔤 ${preset.fontFamily || 'outfit'} (${preset.fontSize || 14}px)
                    </span>
                  </div>

                  <!-- Caja de Enlace OBS Browser Source -->
                  <div style="background: #0B0D0F; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 6px 8px; display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
                    <span style="font-size: 12px;">🌐</span>
                    <input type="text" readonly value="${obsUrl}" id="obs-chat-url-${preset.id}" style="width: 100%; font-family: monospace; font-size: 11px; background: transparent; border: none; color: #57D6C4; outline: none; text-overflow: ellipsis;" onclick="this.select()">
                  </div>
                </div>

                <!-- Botones de Acción -->
                <div>
                  <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                    <button type="button" class="btn-action-primary" style="flex: 2; font-size: 11px; padding: 6px 10px; font-weight: 700;" onclick="copyChatProfileUrl('${preset.id}')" id="btn-copy-chat-${preset.id}">
                      📋 Copiar Enlace OBS
                    </button>
                    <button type="button" class="btn-stage-preset" style="flex: 1; font-size: 11px; padding: 6px 8px;" onclick="previewChatProfileInPip('${preset.id}')" title="Ver cómo se ve este perfil en el visor en vivo">
                      👁️ Probar
                    </button>
                    <button type="button" class="btn-stage-preset" style="flex: 1; font-size: 11px; padding: 6px 8px;" onclick="editChatProfileInControls('${preset.id}')" title="Abrir y editar colores/fuentes en controles visuales">
                      ✏️ Editar
                    </button>
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;">
                    <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px;" onclick="duplicateChatProfile('${preset.id}')">
                      📄 Duplicar
                    </button>
                    ${!preset.isBuiltin ? `
                      <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 2px 8px; color: #EF4444;" onclick="deleteChatProfileDirect('${preset.id}')">
                        🗑️ Eliminar
                      </button>
                    ` : `
                      <span style="font-size: 10px; color: var(--color-text-dim);">🛡️ Preset del Sistema</span>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function filterChatProfiles(filterKey) {
    activeProfilesFilter = filterKey;
    renderChatProfilesManager();
  }

  function copyChatProfileUrl(presetId) {
    const input = document.getElementById(`obs-chat-url-${presetId}`);
    if (!input) return;
    const url = input.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showCopyFeedback(presetId);
      }).catch(() => fallbackCopy(input, presetId));
    } else {
      fallbackCopy(input, presetId);
    }
  }

  function fallbackCopy(inputEl, presetId) {
    inputEl.select();
    try {
      document.execCommand('copy');
      showCopyFeedback(presetId);
    } catch (e) {
      alert('Enlace OBS:\n' + inputEl.value);
    }
  }

  function showCopyFeedback(presetId) {
    const btn = document.getElementById(`btn-copy-chat-${presetId}`);
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = '✓ ¡Copiado para OBS!';
      btn.style.background = '#10B981';
      setTimeout(() => {
        btn.textContent = oldText;
        btn.style.background = '';
      }, 1800);
    }
    if (window.OverlayTexts && window.OverlayTexts.showToast) {
      window.OverlayTexts.showToast('✓ Enlace OBS de chat copiado al portapapeles', 'success');
    }
  }

  function previewChatProfileInPip(presetId) {
    const pip = document.getElementById('miniapp-live-iframe');
    if (!pip) return;
    pip.src = `/widgets/chat/index.html?preview=true&profile=${encodeURIComponent(presetId)}&t=` + Date.now();

    setTimeout(() => {
      if (typeof simulateChatMessage === 'function') {
        simulateChatMessage('normal');
        setTimeout(() => simulateChatMessage('sub'), 400);
      }
    }, 500);

    if (window.OverlayTexts && window.OverlayTexts.showToast) {
      window.OverlayTexts.showToast(`👁️ Previsualizando perfil "${presetId}" en PiP`, 'info');
    }
  }

  function editChatProfileInControls(presetId) {
    if (typeof onChatPresetChange === 'function') {
      onChatPresetChange(presetId);
    }
    if (typeof switchMiniAppTab === 'function') {
      switchMiniAppTab('controls');
    }
  }

  async function createNewChatProfilePrompt() {
    if (!window.cachedWidgetsConfig || !window.cachedWidgetsConfig.chat) return;
    const name = prompt('Nombre para el nuevo Perfil de Chat (ej. "Cozy Relax Verde", "Gamer Mecha Neón", "Just Chatting"):');
    if (!name || !name.trim()) return;

    const basePresetId = window.cachedWidgetsConfig.chat.activePreset || 'cozy_lofi';
    const presets = window.cachedWidgetsConfig.chat.presets || [];
    const basePreset = presets.find(p => p.id === basePresetId) || presets[0] || {};

    const newId = 'profile_' + Date.now();
    const newProfile = Object.assign({}, basePreset, {
      id: newId,
      name: name.trim(),
      isBuiltin: false
    });

    presets.push(newProfile);
    window.cachedWidgetsConfig.chat.presets = presets;

    try {
      await window.API.saveWidgetsConfig(window.cachedWidgetsConfig);
      renderChatProfilesManager();
      if (window.OverlayTexts && window.OverlayTexts.showToast) {
        window.OverlayTexts.showToast(`✓ Nuevo perfil "${name}" creado con éxito`, 'success');
      }
    } catch (e) {
      console.error('Error guardando nuevo perfil:', e);
      alert('Error al guardar el nuevo perfil: ' + e.message);
    }
  }

  async function duplicateChatProfile(presetId) {
    if (!window.cachedWidgetsConfig || !window.cachedWidgetsConfig.chat) return;
    const presets = window.cachedWidgetsConfig.chat.presets || [];
    const target = presets.find(p => p.id === presetId);
    if (!target) return;

    const newName = prompt('Nombre de la copia:', target.name + ' (Copia)');
    if (!newName || !newName.trim()) return;

    const newId = 'profile_' + Date.now();
    const duplicate = Object.assign({}, target, {
      id: newId,
      name: newName.trim(),
      isBuiltin: false
    });

    presets.push(duplicate);
    window.cachedWidgetsConfig.chat.presets = presets;

    try {
      await window.API.saveWidgetsConfig(window.cachedWidgetsConfig);
      renderChatProfilesManager();
      if (window.OverlayTexts && window.OverlayTexts.showToast) {
        window.OverlayTexts.showToast(`✓ Perfil duplicado como "${newName}"`, 'success');
      }
    } catch (e) {
      alert('Error duplicando perfil: ' + e.message);
    }
  }

  async function deleteChatProfileDirect(presetId) {
    if (!window.cachedWidgetsConfig || !window.cachedWidgetsConfig.chat) return;
    const presets = window.cachedWidgetsConfig.chat.presets || [];
    const target = presets.find(p => p.id === presetId);
    if (!target) return;

    if (target.isBuiltin) {
      alert('Los perfiles integrados de fábrica no se pueden eliminar.');
      return;
    }

    if (!confirm(`¿Seguro que deseas eliminar el perfil "${target.name}"?`)) return;

    window.cachedWidgetsConfig.chat.presets = presets.filter(p => p.id !== presetId);
    try {
      await window.API.saveWidgetsConfig(window.cachedWidgetsConfig);
      renderChatProfilesManager();
      if (window.OverlayTexts && window.OverlayTexts.showToast) {
        window.OverlayTexts.showToast(`🗑️ Perfil "${target.name}" eliminado`, 'success');
      }
    } catch (e) {
      alert('Error eliminando perfil: ' + e.message);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Exportar a window
  window.renderChatProfilesManager = renderChatProfilesManager;
  window.copyChatProfileUrl = copyChatProfileUrl;
  window.previewChatProfileInPip = previewChatProfileInPip;
  window.editChatProfileInControls = editChatProfileInControls;
  window.createNewChatProfilePrompt = createNewChatProfilePrompt;
  window.duplicateChatProfile = duplicateChatProfile;
  window.deleteChatProfileDirect = deleteChatProfileDirect;
  window.filterChatProfiles = filterChatProfiles;
})();
