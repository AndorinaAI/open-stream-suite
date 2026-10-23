/**
 * app/alerts/js/themes/13-fusions.js — Gestor Frontend de "Fusiones" (Fusions)
 * Permite crear packs híbridos personalizados combinando overlays de diferentes packs
 * y aplicar estilos visuales en lote a todas las escenas de la fusión.
 */

let cachedFusions = [];
let currentOpenFusionId = null;

async function loadAndRenderFusions() {
  const grid = document.getElementById('fusions-grid');
  if (grid) {
    grid.innerHTML = '<div style="padding: 24px; color: var(--color-text-dim); text-align: center;">⏳ Cargando fusiones...</div>';
  }

  try {
    const res = await API.getFusions();
    cachedFusions = (res && res.fusions) ? res.fusions : [];
  } catch (e) {
    console.error('Error cargando fusiones:', e);
    cachedFusions = [];
  }

  renderFusionsList();
}

function renderFusionsList() {
  const listView = document.getElementById('fusions-list-view');
  const detailsView = document.getElementById('fusion-details-view');
  const grid = document.getElementById('fusions-grid');
  const countBadge = document.getElementById('fusions-total-count-badge');

  if (currentOpenFusionId) {
    if (listView) listView.style.display = 'none';
    if (detailsView) detailsView.style.display = 'block';
    renderFusionDetails(currentOpenFusionId);
    return;
  }

  if (listView) listView.style.display = 'block';
  if (detailsView) detailsView.style.display = 'none';

  if (countBadge) {
    const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
    countBadge.textContent = tr('fusions.badge_total', `${cachedFusions.length} FUSIONES ACTIVAS`, { count: cachedFusions.length });
  }

  if (!grid) return;

  if (cachedFusions.length === 0) {
    const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: rgba(14, 18, 24, 0.6); border: 1.5px dashed rgba(87, 214, 196, 0.3); border-radius: 8px;">
        <span style="font-size: 40px; display: block; margin-bottom: 12px;">⚡</span>
        <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
          ${tr('fusions.empty_title', 'Aún no tienes ninguna Fusión creada')}
        </div>
        <div style="font-size: 12px; color: var(--color-text-dim); max-width: 500px; margin: 0 auto 18px auto;">
          ${tr('fusions.empty_desc', 'Crea una Fusión para combinar escenas de diferentes packs (ej. la cámara de taller Maker, la pantalla de charla Cozy y el HUD Gamer) y gestionarlas juntas.')}
        </div>
        <button type="button" class="btn-action-primary" onclick="openNewFusionModal()" style="font-size: 12px; padding: 8px 18px;">
          ${tr('fusions.btn_create_first', '➕ Crear Mi Primera Fusión')}
        </button>
      </div>
    `;
    return;
  }

  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  grid.innerHTML = cachedFusions.map(fusion => {
    const sceneCount = (fusion.scenes || []).length;
    const badgeText = tr('fusions.card_scene_count', `${sceneCount} OVERLAYS COMBINADOS`, { count: sceneCount });
    const openBtnText = tr('fusions.btn_open_fusion', '⚡ Abrir Fusión y Gestionar →');
    const batchBtnText = tr('fusions.btn_batch_style', '🎨 Estilo en Lote');

    // Muestreo de procedencia de packs en la fusión
    const scenePackBadges = (fusion.scenes || []).map(scKey => {
      const sc = OSS_SCENES.find(s => s.key === scKey);
      if (!sc) return '';
      const pack = OVERLAY_FOLDERS.find(f => f.id === sc.packId) || { name: sc.packId, icon: '📁' };
      return `<span style="font-size: 10px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.12); color: var(--color-text-light);" title="${sc.name}">${pack.icon} ${sc.name}</span>`;
    }).join(' ');

    return `
      <div class="dash-card theme-pack-card" style="padding: 20px; border: 1.5px solid rgba(87, 214, 196, 0.35); border-radius: 10px; background: rgba(14, 18, 24, 0.95); box-shadow: 0 8px 24px rgba(0,0,0,0.45); display: flex; flex-direction: column; justify-content: space-between; gap: 14px; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--color-accent-cyan)'" onmouseout="this.style.borderColor='rgba(87, 214, 196, 0.35)'">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 32px;">${fusion.icon || '⚡'}</span>
              <div>
                <div style="font-size: 16px; font-weight: 800; color: #FFFFFF;">${escapeHtml(fusion.name)}</div>
                <span class="badge-pill" style="font-size: 10px; background: rgba(87, 214, 196, 0.15); color: var(--color-accent-cyan); font-weight: 800;">
                  ${badgeText}
                </span>
              </div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-action-test" onclick="openEditFusionModal('${fusion.id}')" title="${tr('fusions.title_edit', 'Editar esta fusión')}" style="padding: 4px 8px; font-size: 11px;">
                ✏️
              </button>
              <button type="button" class="btn-action-danger" onclick="deleteFusionPrompt('${fusion.id}')" title="${tr('fusions.title_delete', 'Eliminar esta fusión')}" style="padding: 4px 8px; font-size: 11px;">
                🗑️
              </button>
            </div>
          </div>

          <div style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4; margin-bottom: 12px;">
            ${escapeHtml(fusion.description || '')}
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">
            ${scenePackBadges}
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid rgba(87, 214, 196, 0.15); padding-top: 12px;">
          <button type="button" class="btn-action-primary" onclick="openFusionDetails('${fusion.id}')" style="flex: 2; font-size: 11px; padding: 7px 12px; font-weight: 800;">
            ${openBtnText}
          </button>
          <div style="display: flex; align-items: center; gap: 4px; flex: 1;">
            <select id="fusion-quick-theme-${fusion.id}" class="monitor-select" style="font-size: 11px; padding: 4px 8px; width: 100%;">
              ${buildThemeOptionsHtml(fusion.defaultTheme || 'maker')}
            </select>
            <button type="button" class="btn-action-test" onclick="applyQuickFusionTheme('${fusion.id}')" title="${batchBtnText}" style="padding: 5px 8px; font-size: 11px;">
              ✨
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openFusionDetails(fusionId) {
  currentOpenFusionId = fusionId;
  renderFusionsList();
}

function showFusionsListView() {
  currentOpenFusionId = null;
  renderFusionsList();
}

function renderFusionDetails(fusionId) {
  const fusion = cachedFusions.find(f => f.id === fusionId);
  if (!fusion) {
    showFusionsListView();
    return;
  }

  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  const nameEl = document.getElementById('fusion-detail-name');
  const iconEl = document.getElementById('fusion-detail-icon');
  const badgeEl = document.getElementById('fusion-detail-badge');
  const descEl = document.getElementById('fusion-detail-desc');
  const themeSelect = document.getElementById('fusion-batch-theme-select');
  const scenesGrid = document.getElementById('fusion-scenes-grid');

  if (nameEl) nameEl.textContent = fusion.name;
  if (iconEl) iconEl.textContent = fusion.icon || '⚡';
  if (descEl) descEl.textContent = fusion.description || '';

  const sceneCount = (fusion.scenes || []).length;
  if (badgeEl) {
    badgeEl.textContent = tr('fusions.badge_scenes_in_fusion', `${sceneCount} OVERLAYS EN ESTA FUSIÓN`, { count: sceneCount });
  }

  if (themeSelect) {
    themeSelect.innerHTML = buildThemeOptionsHtml(fusion.defaultTheme || 'maker');
  }

  const shapeSelect = document.getElementById('fusion-batch-shape-select');
  if (shapeSelect) {
    shapeSelect.innerHTML = buildShapeOptionsHtml(fusion.defaultShape || 'original');
  }

  if (!scenesGrid) return;

  const scenesInFusion = (fusion.scenes || []).map(scKey => {
    return OSS_SCENES.find(s => s.key === scKey);
  }).filter(Boolean);

  if (scenesInFusion.length === 0) {
    scenesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--color-text-dim); background: rgba(0,0,0,0.3); border-radius: 8px;">
        ${tr('fusions.no_scenes_warning', 'Esta fusión no tiene ningún overlay seleccionado.')}
        <br><br>
        <button type="button" class="btn-action-primary" onclick="openEditFusionModal('${fusion.id}')" style="font-size: 11px; padding: 6px 14px;">
          ${tr('fusions.btn_select_scenes', '➕ Seleccionar Overlays para esta Fusión')}
        </button>
      </div>
    `;
    return;
  }

  scenesGrid.innerHTML = scenesInFusion.map(scene => {
    const packObj = OVERLAY_FOLDERS.find(f => f.id === scene.packId) || { name: scene.packId, icon: '📁' };
    const currentTheme = (cachedOverlayThemes && cachedOverlayThemes[scene.key]) || fusion.defaultTheme || 'maker';
    const currentShape = (window.cachedOverlayShapes && window.cachedOverlayShapes[scene.key]) || fusion.defaultShape || 'original';

    return `
      <div class="dash-card scene-card" id="fusion-scene-card-${scene.key}" style="border: 1px solid rgba(87, 214, 196, 0.3); padding: 14px; border-radius: 8px; background: rgba(14, 18, 24, 0.95); display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 10px; font-family: var(--font-tech); font-weight: 800; background: rgba(255,255,255,0.08); color: var(--color-accent-cyan); padding: 2px 8px; border-radius: 3px; border: 1px solid rgba(87, 214, 196, 0.3);">
              ${packObj.icon} ${packObj.name}
            </span>
            <span style="font-size: 10px; color: var(--color-text-dim); font-family: var(--font-tech);">
              ${scene.key}
            </span>
          </div>

          <div style="font-size: 15px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">
            ${escapeHtml(scene.name)}
          </div>
          <div style="font-size: 11px; color: var(--color-text-dim); margin-bottom: 10px;">
            ${escapeHtml(scene.desc || '')}
          </div>
        </div>

        <div>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 10px; color: var(--color-text-dim); font-weight: 700; width: 42px;">Color:</span>
              <select class="monitor-select" style="font-size: 10px; padding: 3px 6px; flex: 1;" onchange="assignThemeToScene('${scene.key}', this.value)">
                ${buildThemeOptionsHtml(currentTheme)}
              </select>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 10px; color: var(--color-text-dim); font-weight: 700; width: 42px;">Forma:</span>
              <select class="monitor-select" style="font-size: 10px; padding: 3px 6px; flex: 1;" onchange="assignShapeToScene('${scene.key}', this.value)">
                ${buildShapeOptionsHtml(currentShape)}
              </select>
            </div>
          </div>

          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-action-primary" onclick="copyOverlaySceneUrl('${scene.key}')" style="flex: 1; font-size: 10px; padding: 5px 8px;" title="Copiar URL para OBS">
              📋 Copiar OBS
            </button>
            <button type="button" class="btn-action-test" onclick="openOverlayFullscreen('${scene.key}')" style="font-size: 10px; padding: 5px 8px;" title="Abrir y probar">
              👁️ Probar
            </button>
            <button type="button" class="btn-action-test" onclick="openSceneEditor('${scene.key}')" style="font-size: 10px; padding: 5px 8px;" title="Editar textos">
              ✏️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function applyBatchThemeToCurrentFusion() {
  if (!currentOpenFusionId) return;
  const sel = document.getElementById('fusion-batch-theme-select');
  if (!sel || !sel.value) return;
  const chosenTheme = sel.value;
  await applyFusionThemeAction(currentOpenFusionId, chosenTheme);
}

async function applyQuickFusionTheme(fusionId) {
  const sel = document.getElementById(`fusion-quick-theme-${fusionId}`);
  if (!sel || !sel.value) return;
  const chosenTheme = sel.value;
  await applyFusionThemeAction(fusionId, chosenTheme);
}

async function applyFusionThemeAction(fusionId, themeId) {
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  try {
    const res = await API.applyFusionTheme(fusionId, themeId);
    // Sincronizar estado en frontend
    if (res.appliedScenes) {
      res.appliedScenes.forEach(k => {
        cachedOverlayThemes[k] = themeId;
      });
    }

    const fusion = cachedFusions.find(f => f.id === fusionId);
    if (fusion) fusion.defaultTheme = themeId;

    if (currentOpenFusionId === fusionId) {
      renderFusionDetails(fusionId);
    } else {
      renderFusionsList();
    }

    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(tr('fusions.toast_theme_applied', `✓ Estilo "${themeId}" aplicado en lote a toda la fusión`), 'success');
    }
  } catch (e) {
    console.error('Error aplicando estilo a la fusión:', e);
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(tr('fusions.toast_theme_error', 'Error aplicando estilo en lote'), 'error');
    }
  }
}

function buildShapeOptionsHtml(selectedShape = 'auto') {
  let html = `
    <option value="auto" ${selectedShape === 'auto' ? 'selected' : ''}>⚡ Forma: Automática (según estilo)</option>
    <option value="original" ${selectedShape === 'original' ? 'selected' : ''}>📐 Forma: Original del Pack</option>
  `;
  if (window.cachedThemePacks && window.cachedThemePacks.length > 0) {
    window.cachedThemePacks.forEach(p => {
      if (p.shapes && p.shapes.length > 0) {
        html += `<optgroup label="${p.icon || '📁'} ${p.name}">`;
        p.shapes.forEach(s => {
          const val = s.id;
          const isSel = (val === selectedShape || s.id === selectedShape);
          html += `<option value="${val}" ${isSel ? 'selected' : ''}>${s.icon || '📐'} ${s.name}</option>`;
        });
        html += `</optgroup>`;
      }
    });
  } else {
    html += `
      <optgroup label="☕ Cozy Lo-Fi & Arte">
        <option value="cozy_polaroid" ${selectedShape === 'cozy_polaroid' ? 'selected' : ''}>☕ Polaroid Vintage con Cinta</option>
        <option value="cozy_canvas" ${selectedShape === 'cozy_canvas' ? 'selected' : ''}>🎨 Lienzo de Arte con Chinchetas</option>
        <option value="cozy_soft" ${selectedShape === 'cozy_soft' ? 'selected' : ''}>☁️ Píldora Soft Minimal</option>
      </optgroup>
      <optgroup label="🎮 Gamer Pro & Esports">
        <option value="gamer_mecha" ${selectedShape === 'gamer_mecha' ? 'selected' : ''}>🎮 Mecha Tournament 45°</option>
        <option value="gamer_tactical_hud" ${selectedShape === 'gamer_tactical_hud' ? 'selected' : ''}>🎯 Tactical FPS HUD</option>
        <option value="gamer_stealth" ${selectedShape === 'gamer_stealth' ? 'selected' : ''}>🕶️ Stealth Dark Cyber</option>
        <option value="gamer_hex_shield" ${selectedShape === 'gamer_hex_shield' ? 'selected' : ''}>🛡️ Hex Shield Blindaje</option>
        <option value="gamer_cyber_glitch" ${selectedShape === 'gamer_cyber_glitch' ? 'selected' : ''}>⚡ Cyber Glitch Neón</option>
        <option value="gamer_arcade_retro" ${selectedShape === 'gamer_arcade_retro' ? 'selected' : ''}>👾 Arcade 8-Bit Pixel</option>
      </optgroup>
      <optgroup label="🛠️ Maker & Taller">
        <option value="maker_blueprint" ${selectedShape === 'maker_blueprint' ? 'selected' : ''}>🛠️ Blueprint Técnico CAD</option>
        <option value="maker_workbench" ${selectedShape === 'maker_workbench' ? 'selected' : ''}>📐 Banco de Trabajo Studio</option>
        <option value="maker_circuit_pcb" ${selectedShape === 'maker_circuit_pcb' ? 'selected' : ''}>📟 Placa de Circuito PCB</option>
      </optgroup>
      <optgroup label="⚡ Open Stream Suite">
        <option value="openstream_glass" ${selectedShape === 'openstream_glass' ? 'selected' : ''}>⚡ Swiss Frosted Glass</option>
        <option value="openstream_studio" ${selectedShape === 'openstream_studio' ? 'selected' : ''}>🎙️ Broadcast Pro Studio</option>
      </optgroup>
      <optgroup label="📜 Fantasía, Rol & Terror">
        <option value="fantasy_parchment" ${selectedShape === 'fantasy_parchment' ? 'selected' : ''}>📜 Pergamino Rol & Sello Cera</option>
        <option value="fantasy_runic_stone" ${selectedShape === 'fantasy_runic_stone' ? 'selected' : ''}>🗿 Piedra Rúnica Mística</option>
        <option value="gothic_vampire" ${selectedShape === 'gothic_vampire' ? 'selected' : ''}>🦇 Gótico Victoriano Dark</option>
      </optgroup>
      <optgroup label="💥 Cómic, Pop Art & Retro TV">
        <option value="comic_manga_action" ${selectedShape === 'comic_manga_action' ? 'selected' : ''}>💥 Manga / Shonen Comic</option>
        <option value="pop_synth_neon" ${selectedShape === 'pop_synth_neon' ? 'selected' : ''}>🌆 Synthwave 80s Grid</option>
        <option value="vintage_crt_monitor" ${selectedShape === 'vintage_crt_monitor' ? 'selected' : ''}>📺 Monitor CRT Retro 90s</option>
      </optgroup>
    `;
  }
  return html;
}

async function assignShapeToScene(sceneKey, shapeId) {
  if (typeof window.cachedOverlayShapes === 'undefined') window.cachedOverlayShapes = {};
  window.cachedOverlayShapes[sceneKey] = shapeId;
  try {
    await API.setOverlayTheme(sceneKey, null, shapeId);
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(`📐 Forma "${shapeId}" asignada a ${sceneKey}`, 'success');
    }
  } catch (e) {
    console.warn('Error al asignar forma a escena:', e);
  }
}

async function applyBatchShapeToCurrentFusion() {
  if (!currentOpenFusionId) return;
  const sel = document.getElementById('fusion-batch-shape-select');
  if (!sel || !sel.value) return;
  const chosenShape = sel.value;

  try {
    const res = await API.applyFusionShape(currentOpenFusionId, chosenShape);
    if (res.appliedScenes) {
      if (typeof window.cachedOverlayShapes === 'undefined') window.cachedOverlayShapes = {};
      res.appliedScenes.forEach(k => {
        window.cachedOverlayShapes[k] = chosenShape;
      });
    }

    const fusion = cachedFusions.find(f => f.id === currentOpenFusionId);
    if (fusion) fusion.defaultShape = chosenShape;

    renderFusionDetails(currentOpenFusionId);

    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(`✓ Forma "${chosenShape}" aplicada en lote a toda la fusión`, 'success');
    }
  } catch (e) {
    console.error('Error aplicando forma a la fusión:', e);
  }
}

function openNewFusionModal() {
  openFusionEditorModal(null);
}

function openEditFusionModal(fusionId) {
  const fusion = cachedFusions.find(f => f.id === fusionId);
  openFusionEditorModal(fusion);
}

function openFusionEditorModal(fusion = null) {
  const modal = document.getElementById('modal-fusion-editor');
  if (!modal) return;

  const titleEl = document.getElementById('fusion-modal-title');
  const idInput = document.getElementById('fusion-modal-id');
  const nameInput = document.getElementById('fusion-modal-name');
  const iconInput = document.getElementById('fusion-modal-icon');
  const descInput = document.getElementById('fusion-modal-desc');
  const themeSelect = document.getElementById('fusion-modal-theme');
  const shapeSelect = document.getElementById('fusion-modal-shape');
  const scenesContainer = document.getElementById('fusion-modal-scenes-list');

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;

  if (titleEl) {
    titleEl.textContent = fusion ? tr('fusions.modal_edit_title', '✏️ Editar Fusión de Overlays') : tr('fusions.modal_new_title', '⚡ Crear Nueva Fusión de Overlays');
  }

  if (idInput) idInput.value = fusion ? fusion.id : '';
  if (nameInput) nameInput.value = fusion ? fusion.name : '';
  if (iconInput) iconInput.value = (fusion && fusion.icon) ? fusion.icon : '⚡';
  if (descInput) descInput.value = (fusion && fusion.description) ? fusion.description : '';
  if (themeSelect) themeSelect.innerHTML = buildThemeOptionsHtml((fusion && fusion.defaultTheme) ? fusion.defaultTheme : 'maker');
  if (shapeSelect) shapeSelect.innerHTML = buildShapeOptionsHtml((fusion && fusion.defaultShape) ? fusion.defaultShape : 'original');

  // Renderizar checkboxes de escenas agrupadas por Pack
  if (scenesContainer) {
    let initialScenes = [];
    if (fusion && fusion.scenes) {
      initialScenes = fusion.scenes;
    } else if (window.selectedFusionScenes && window.selectedFusionScenes.size > 0) {
      initialScenes = Array.from(window.selectedFusionScenes);
    } else {
      initialScenes = ['oss_chatting', 'maker-desk'];
    }
    const selectedScenes = new Set(initialScenes);

    scenesContainer.innerHTML = OVERLAY_FOLDERS.map(folder => {
      const folderScenes = OSS_SCENES.filter(s => folder.keys.includes(s.key));
      return `
        <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(87, 214, 196, 0.25); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 800; color: var(--color-accent-cyan);">
              ${folder.icon} ${folder.name}
            </span>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-action-test" onclick="toggleFolderScenesSelection('${folder.id}', true)" style="font-size: 10px; padding: 2px 6px;">
                ✓ Todos
              </button>
              <button type="button" class="btn-action-test" onclick="toggleFolderScenesSelection('${folder.id}', false)" style="font-size: 10px; padding: 2px 6px;">
                ✕ Ninguno
              </button>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;">
            ${folderScenes.map(sc => {
              const isChecked = selectedScenes.has(sc.key);
              return `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--color-text-light); background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 4px; cursor: pointer;">
                  <input type="checkbox" class="fusion-scene-checkbox folder-checkbox-${folder.id}" value="${sc.key}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
                  <span>${escapeHtml(sc.name)}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  modal.style.display = 'flex';
}

function toggleFolderScenesSelection(folderId, selectAll) {
  document.querySelectorAll(`.folder-checkbox-${folderId}`).forEach(cb => {
    cb.checked = !!selectAll;
  });
}

function closeFusionModal() {
  const modal = document.getElementById('modal-fusion-editor');
  if (modal) modal.style.display = 'none';
}

async function saveFusionFromModal(event) {
  if (event) event.preventDefault();

  const idInput = document.getElementById('fusion-modal-id');
  const nameInput = document.getElementById('fusion-modal-name');
  const iconInput = document.getElementById('fusion-modal-icon');
  const descInput = document.getElementById('fusion-modal-desc');
  const themeSelect = document.getElementById('fusion-modal-theme');
  const shapeSelect = document.getElementById('fusion-modal-shape');

  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    alert('Por favor introduce un nombre para la fusión');
    return;
  }

  const selectedScenes = [];
  document.querySelectorAll('.fusion-scene-checkbox:checked').forEach(cb => {
    selectedScenes.push(cb.value);
  });

  const payload = {
    id: idInput ? idInput.value.trim() : '',
    name: name,
    icon: iconInput ? iconInput.value.trim() : '⚡',
    description: descInput ? descInput.value.trim() : '',
    defaultTheme: themeSelect ? themeSelect.value : 'maker',
    defaultShape: shapeSelect ? shapeSelect.value : 'original',
    scenes: selectedScenes
  };

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  try {
    const res = await API.saveFusion(payload);
    closeFusionModal();
    await loadAndRenderFusions();

    if (currentOpenFusionId === payload.id) {
      renderFusionDetails(payload.id);
    }

    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(tr('fusions.toast_saved', '✓ Fusión guardada correctamente'), 'success');
    }
  } catch (e) {
    console.error('Error guardando fusión:', e);
    alert('Error al guardar la fusión: ' + e.message);
  }
}

async function deleteFusionPrompt(fusionId) {
  const fusion = cachedFusions.find(f => f.id === fusionId);
  const name = fusion ? fusion.name : fusionId;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;

  if (!confirm(tr('fusions.confirm_delete', `¿Seguro que deseas eliminar la fusión "${name}"?`, { name }))) {
    return;
  }

  try {
    await API.deleteFusion(fusionId);
    if (currentOpenFusionId === fusionId) {
      currentOpenFusionId = null;
    }
    await loadAndRenderFusions();
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(tr('fusions.toast_deleted', `🗑️ Fusión "${name}" eliminada`), 'success');
    }
  } catch (e) {
    console.error('Error eliminando fusión:', e);
    alert('Error al eliminar fusión: ' + e.message);
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

// ====================================================================
// GESTOR DE MULTI-SELECCIÓN DE ESCENAS PARA FUSIONES & BARRA FLOTANTE
// ====================================================================

window.selectedFusionScenes = window.selectedFusionScenes || new Set();

function toggleSceneForFusionSelection(sceneKey, isChecked) {
  window.selectedFusionScenes = window.selectedFusionScenes || new Set();
  if (isChecked) {
    window.selectedFusionScenes.add(sceneKey);
  } else {
    window.selectedFusionScenes.delete(sceneKey);
  }
  updateFolderSelectAllButton();
  updateFusionFloatingBar();
}

function updateFolderSelectAllButton() {
  const btn = document.getElementById('btn-toggle-folder-fusion');
  if (!btn) return;
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const folder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId);
  if (!folder) return;
  window.selectedFusionScenes = window.selectedFusionScenes || new Set();
  const allSelected = folder.keys.length > 0 && folder.keys.every(k => window.selectedFusionScenes.has(k));
  if (allSelected) {
    btn.textContent = tr('fusions.btn_deselect_all_fusion', '☐ Desmarcar Fusión');
    btn.style.color = '#FF783F';
    btn.style.borderColor = 'rgba(255, 120, 63, 0.5)';
  } else {
    btn.textContent = tr('fusions.btn_select_all_fusion', '☑️ Marcar todos para Fusión');
    btn.style.color = 'var(--color-accent-cyan)';
    btn.style.borderColor = 'var(--color-accent-cyan)';
  }
}

function updateFusionFloatingBar() {
  const bar = document.getElementById('fusion-selection-floating-bar');
  const countEl = document.getElementById('fusion-floating-count');
  const themeSelect = document.getElementById('floating-batch-theme-select');
  if (!bar) return;

  const count = window.selectedFusionScenes.size;
  if (count > 0) {
    bar.style.display = 'flex';
    if (countEl) {
      const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
      countEl.textContent = tr('fusions.floating_selected', `${count} OVERLAYS SELECCIONADOS`, { count });
    }
    if (themeSelect && themeSelect.children.length === 0) {
      themeSelect.innerHTML = buildThemeOptionsHtml(currentActiveThemeId || 'maker');
    }
  } else {
    bar.style.display = 'none';
  }
}

function clearFusionSelection() {
  window.selectedFusionScenes.clear();
  document.querySelectorAll('.cb-fusion-scene-picker').forEach(cb => {
    cb.checked = false;
  });
  updateFolderSelectAllButton();
  updateFusionFloatingBar();
}

function toggleAllInCurrentFolderForFusion() {
  const folder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId);
  if (!folder) return;

  const allSelected = folder.keys.length > 0 && folder.keys.every(k => window.selectedFusionScenes.has(k));
  if (allSelected) {
    folder.keys.forEach(k => window.selectedFusionScenes.delete(k));
  } else {
    folder.keys.forEach(k => window.selectedFusionScenes.add(k));
  }

  document.querySelectorAll('.cb-fusion-scene-picker').forEach(cb => {
    const key = cb.getAttribute('data-key');
    if (folder.keys.includes(key)) {
      cb.checked = !allSelected;
    }
  });

  updateFolderSelectAllButton();
  updateFusionFloatingBar();
}

function openCreateFusionFromSelected() {
  openFusionEditorModal(null);
}

function openAddToExistingFusionModal() {
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;

  if (!cachedFusions || cachedFusions.length === 0) {
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(tr('fusions.empty_title', 'Aún no tienes ninguna Fusión creada. ¡Crea tu primera Fusión!'), 'info');
    }
    openCreateFusionFromSelected();
    return;
  }

  const modal = document.getElementById('modal-add-to-existing-fusion');
  const select = document.getElementById('select-target-fusion');
  const preview = document.getElementById('modal-add-fusion-scenes-preview');
  const hint = document.getElementById('modal-add-fusion-hint');

  if (hint) {
    hint.textContent = tr('fusions.label_choose_fusion', `Elige la Fusión donde añadir las ${window.selectedFusionScenes.size} escenas seleccionadas:`, { count: window.selectedFusionScenes.size });
  }

  if (select) {
    select.innerHTML = cachedFusions.map(f => {
      const count = (f.scenes || []).length;
      return `<option value="${f.id}">${f.icon || '⚡'} ${escapeHtml(f.name)} (${count} overlays)</option>`;
    }).join('');
  }

  if (preview) {
    const names = Array.from(window.selectedFusionScenes).map(k => {
      const sc = OSS_SCENES.find(s => s.key === k);
      return sc ? sc.name : k;
    });
    preview.innerHTML = `<b>Escenas a añadir (${names.length}):</b><br>` + names.join(' · ');
  }

  if (modal) modal.style.display = 'flex';
}

function closeAddToExistingFusionModal() {
  const modal = document.getElementById('modal-add-to-existing-fusion');
  if (modal) modal.style.display = 'none';
}

async function confirmAddSelectedToFusion() {
  const select = document.getElementById('select-target-fusion');
  if (!select || !select.value) return;
  const fusionId = select.value;
  const fusion = cachedFusions.find(f => f.id === fusionId);
  if (!fusion) return;

  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  const sceneSet = new Set(fusion.scenes || []);
  let addedCount = 0;
  window.selectedFusionScenes.forEach(k => {
    if (!sceneSet.has(k)) {
      sceneSet.add(k);
      addedCount++;
    }
  });

  fusion.scenes = Array.from(sceneSet);

  try {
    await API.saveFusion(fusion);
    closeAddToExistingFusionModal();
    clearFusionSelection();
    await loadAndRenderFusions();

    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(tr('fusions.toast_added_to_fusion', `✓ ${addedCount} escenas añadidas a la fusión "${fusion.name}"`, { count: addedCount, name: fusion.name }), 'success');
    }
  } catch (e) {
    console.error('Error añadiendo escenas a la fusión:', e);
    alert('Error al añadir escenas: ' + e.message);
  }
}

async function applyBatchThemeToSelectedScenes() {
  const select = document.getElementById('floating-batch-theme-select');
  if (!select || !select.value) return;
  const themeId = select.value;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;

  if (window.selectedFusionScenes.size === 0) return;

  const count = window.selectedFusionScenes.size;
  for (const sceneKey of window.selectedFusionScenes) {
    cachedOverlayThemes[sceneKey] = themeId;
    try {
      await API.setOverlayTheme(sceneKey, themeId);
    } catch (e) {
      console.warn('Error aplicando tema a ' + sceneKey, e);
    }
  }

  // Si estamos en la vista de carpeta, re-renderizar tarjetas
  if (currentOpenOverlayFolderId) {
    renderOverlayFolders();
  }

  if (window.OverlayTexts && OverlayTexts.showToast) {
    OverlayTexts.showToast(tr('fusions.toast_batch_applied_selected', `✓ Estilo "${themeId}" aplicado a ${count} overlays seleccionados`, { theme: themeId, count }), 'success');
  }
}

function goToThemeEditorForCurrentPack() {
  const folder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId);
  if (!folder) return;

  // Cambiar a la pestaña de Temas
  if (typeof switchTab === 'function') {
    switchTab('themes');
  } else {
    const tabBtn = document.getElementById('tab-btn-themes');
    if (tabBtn) tabBtn.click();
  }

  // Buscar el pack correspondiente en cachedThemePacks
  const targetPack = cachedThemePacks.find(p => {
    return p.id.toLowerCase() === folder.id.toLowerCase() ||
           p.id.toLowerCase() === (folder.packId || '').toLowerCase() ||
           folder.id.toLowerCase().includes(p.id.toLowerCase());
  }) || cachedThemePacks[0];

  if (targetPack && typeof openThemePack === 'function') {
    openThemePack(targetPack.id);
  }
}

// Exportación global a window
window.loadAndRenderFusions = loadAndRenderFusions;
window.renderFusionsList = renderFusionsList;
window.openFusionDetails = openFusionDetails;
window.showFusionsListView = showFusionsListView;
window.renderFusionDetails = renderFusionDetails;
window.applyBatchThemeToCurrentFusion = applyBatchThemeToCurrentFusion;
window.applyQuickFusionTheme = applyQuickFusionTheme;
window.openNewFusionModal = openNewFusionModal;
window.openEditFusionModal = openEditFusionModal;
window.closeFusionModal = closeFusionModal;
window.saveFusionFromModal = saveFusionFromModal;
window.deleteFusionPrompt = deleteFusionPrompt;
window.toggleFolderScenesSelection = toggleFolderScenesSelection;
window.toggleSceneForFusionSelection = toggleSceneForFusionSelection;
window.updateFusionFloatingBar = updateFusionFloatingBar;
window.clearFusionSelection = clearFusionSelection;
window.toggleAllInCurrentFolderForFusion = toggleAllInCurrentFolderForFusion;
window.openCreateFusionFromSelected = openCreateFusionFromSelected;
window.openAddToExistingFusionModal = openAddToExistingFusionModal;
window.closeAddToExistingFusionModal = closeAddToExistingFusionModal;
window.confirmAddSelectedToFusion = confirmAddSelectedToFusion;
window.applyBatchThemeToSelectedScenes = applyBatchThemeToSelectedScenes;
window.goToThemeEditorForCurrentPack = goToThemeEditorForCurrentPack;
window.updateFolderSelectAllButton = updateFolderSelectAllButton;
window.applyBatchShapeToCurrentFusion = applyBatchShapeToCurrentFusion;
window.assignShapeToScene = assignShapeToScene;
window.buildShapeOptionsHtml = buildShapeOptionsHtml;

