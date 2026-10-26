
function buildSceneCardHtml(rawS) {
  if (!rawS) return '';
  const s = getSceneLocalized(rawS) || rawS;
  // Clave canónica: la tarjeta y todos sus botones operan siempre con el mismo
  // espacio de claves que persiste el servidor (evita temas que "no se aplican"
  // cuando la tarjeta venía de una lista con alias).
  const sceneKey = (typeof window.normalizeSceneKey === 'function' && window.normalizeSceneKey(s.key)) || s.key;
  const assignedThemeId = getAssignedThemeForScene(sceneKey) || currentActiveThemeId || 'maker';
  const assignedThemeObj = getThemeObjectById(assignedThemeId);
  const defaultThemeId = (DEFAULT_OVERLAY_THEMES && DEFAULT_OVERLAY_THEMES[sceneKey]) || 'maker';
  const defaultInfo = getThemeDisplayNameById(defaultThemeId) || { name: 'Maker' };
  const defaultName = (defaultInfo && defaultInfo.name) || 'Original';
  const isModified = (assignedThemeId !== defaultThemeId);

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const cardAssignedStyle = tr('themes.card_assigned_style', '🎨 Estilo Visual Asignado:');
  const cardEditStyle = tr('themes.card_edit_style', '🎨 Editar Estilo ↗');
  const cardSave = tr('themes.card_save', '💾 Guardar');
  const cardPending = tr('themes.card_pending_change', '● Cambio sin guardar — pulsa 💾 Guardar para aplicarlo en OBS');
  // V3-01: el nombre del tema por defecto viene de theme.json (disco) y este
  // bloque se inserta con innerHTML → escapado.
  const defaultNameSafe = themeEscapeHtml(defaultName);
  const cardCustomized = tr('themes.card_customized', '⚠️ Personalizado (Original: <b>{name}</b>)').replace('{name}', defaultNameSafe);
  const cardOriginal = tr('themes.card_factory_original', '⭐ Original de fábrica: <b>{name}</b>').replace('{name}', defaultNameSafe);
  const cardRestoreOrig = tr('themes.card_restore_original', '🔄 Restaurar Original');
  const cardViewFs = tr('themes.card_view_fullscreen', '🖥️ Ver Pantalla Completa');
  const cardEditTexts = tr('themes.card_edit_texts', '✏️ Editar Textos');
  const cardCopyObs = tr('themes.card_copy_obs', '📋 Copiar URL OBS');
  const cardRestoreTexts = tr('themes.card_restore_texts', '🔄 Restaurar Textos');
  const isFusionChecked = !!(window.selectedFusionScenes && window.selectedFusionScenes.has && window.selectedFusionScenes.has(sceneKey));

  return `
    <div class="dash-card theme-card-rich" data-scene-key="${sceneKey}" style="border-top: 3px solid ${isModified ? '#FF783F' : 'var(--color-accent-cyan)'}; margin-bottom: 0;">
      <div class="card-header-bar" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; row-gap: 4px;">
        <span class="card-header-title" style="flex: 1 1 auto; min-width: 0; white-space: normal; overflow-wrap: anywhere; line-height: 1.25;">${s.badge}</span>
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; flex: 0 0 auto;">
          <span style="font-family: var(--font-tech); font-size: 10px; color: var(--color-accent-cyan); white-space: nowrap;">1920×1080</span>
          <label style="display: inline-flex; align-items: center; gap: 5px; font-size: 10px; cursor: pointer; background: rgba(87, 214, 196, 0.12); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(87, 214, 196, 0.35); color: var(--color-accent-cyan); white-space: nowrap;" title="Marcar este overlay para añadir o crear un Pack de Fusión">
            <input type="checkbox" class="cb-fusion-scene-picker" data-key="${sceneKey}" onchange="toggleSceneForFusionSelection('${sceneKey}', this.checked)" ${isFusionChecked ? 'checked' : ''} style="cursor: pointer; width: 13px; height: 13px; accent-color: var(--color-accent-cyan); margin: 0;">
            <span style="font-weight: 800;">⚡ Fusión</span>
          </label>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
        <span style="font-size: 22px;">${s.icon}</span>
        <div style="font-size: 14px; font-weight: 800; color: var(--color-text-light);">
          ${s.name}
        </div>
      </div>

      <!-- Previsualización Visual Mínima en Directo (Colores, Bordes y Neón) -->
      ${buildSceneMiniMockupHtml(sceneKey, assignedThemeObj)}

      <!-- Selector Interactivo de Estilo Visual -->
      <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(87, 214, 196, 0.25); padding: 8px 10px; border-radius: 4px; margin: 8px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-size: 11px; color: var(--color-text-dim);">${cardAssignedStyle}</span>
          <button type="button" class="btn-action-test" style="font-size: 10px; padding: 2px 8px; border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); cursor: pointer;" onclick="openThemeEditorByThemeId('${assignedThemeId}')" title="${cardEditStyle}">
            ${cardEditStyle}
          </button>
        </div>
        <div style="display: flex; gap: 6px; align-items: stretch;">
          <select id="scene-theme-select-${sceneKey}" class="form-select" style="flex: 1; min-width: 0; font-size: 11px; padding: 5px 8px; background: #0E1216; color: #FFFFFF; border: 1px solid ${isModified ? 'rgba(255,120,63,0.5)' : 'rgba(87,214,196,0.35)'}; border-radius: 4px;" onchange="previewOverlayThemeChange('${sceneKey}', this.value)">
            ${buildThemeOptionsHtml(assignedThemeId, defaultThemeId)}
          </select>
          <button type="button" id="scene-theme-save-${sceneKey}" class="btn-action-primary" style="font-size: 11px; padding: 5px 10px; font-weight: 800; white-space: nowrap;" onclick="saveOverlayThemeFromCard('${sceneKey}')">
            ${cardSave}
          </button>
        </div>
        <div id="scene-theme-pending-${sceneKey}" style="display: none; font-size: 10px; color: #FFD166; margin-top: 4px;">${cardPending}</div>

        <!-- Indicador y Botón de Restauración al Estilo de Fábrica -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding: 4px 8px; border-radius: 4px; ${isModified ? 'background: rgba(255, 120, 63, 0.12); border: 1px solid rgba(255, 120, 63, 0.35);' : 'background: rgba(87, 214, 196, 0.08); border: 1px solid rgba(87, 214, 196, 0.2);'}">
          <span style="font-size: 10px; color: ${isModified ? '#FF783F' : 'var(--color-accent-cyan)'};">
            ${isModified ? cardCustomized : cardOriginal}
          </span>
          ${isModified ? `
            <button type="button" class="btn-action-test" style="font-size: 9px; padding: 2px 7px; color: #FF783F; border-color: #FF783F; cursor: pointer; background: rgba(255,120,63,0.15);" onclick="restoreOverlayTheme('${sceneKey}')">
              ${cardRestoreOrig}
            </button>
          ` : ''}
        </div>
      </div>

      <p style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4; margin: 8px 0; min-height: 40px;">
        ${s.desc}
      </p>

      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
        <button class="btn-action-primary" style="width: 100%; padding: 8px 10px; display: flex; justify-content: center; align-items: center; gap: 5px; line-height: 1.25;" onclick="openOverlayFullscreen('${sceneKey}', '${s.path}')">
          <span style="font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">${cardViewFs}</span>
        </button>
        <button type="button" class="btn-action-test" style="width: 100%; padding: 6px 10px; font-size: 11px; display: inline-flex; justify-content: center; align-items: center; gap: 5px;" onclick="openSceneEditor('${sceneKey}')" title="Abrir el editor de textos de esta ventana">
          <span style="font-weight: 800;">${cardEditTexts}</span>
        </button>
        <div style="display: flex; gap: 6px;">
          <button class="btn-action-test" style="flex: 1; font-size: 11px; padding: 6px 8px; display: inline-flex; justify-content: center; align-items: center; gap: 4px;" onclick="copyOverlaySceneUrl('${sceneKey}', '${s.path}')">
            ${cardCopyObs}
          </button>
          <button class="btn-action-test" style="font-size: 10px; padding: 6px 8px; color: #FF783F; border-color: rgba(255,120,63,0.3); display: inline-flex; justify-content: center; align-items: center; gap: 4px;" onclick="restoreSceneTexts('${sceneKey}')">
            ${cardRestoreTexts}
          </button>
        </div>
      </div>
    </div>
  `;
}

function openOverlayFullscreen(sceneKey, scenePath) {
  const canonical = (typeof window.normalizeSceneKey === 'function' && window.normalizeSceneKey(sceneKey)) || sceneKey;
  const scene = (typeof window.getSceneByKey === 'function') ? window.getSceneByKey(canonical) : null;
  const path = scenePath || (scene ? scene.path : null);
  if (!path) {
    console.warn('[OSS] openOverlayFullscreen sin ruta para la escena', sceneKey);
    return;
  }
  const assignedTheme = getAssignedThemeForScene(canonical) || currentActiveThemeId;
  const fullUrl = `${path}?theme=${encodeURIComponent(assignedTheme)}`;
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}

function copyOverlaySceneUrl(sceneKey, scenePath) {
  // URL limpia SIN ?theme=: así OBS lee el estilo guardado en el servidor
  // y se actualiza en vivo cada vez que lo cambias desde el panel.
  copySceneUrl(scenePath);
}

function previewOverlayThemeChange(sceneKey, themeId) {
  const canonical = (typeof window.normalizeSceneKey === 'function' && window.normalizeSceneKey(sceneKey)) || sceneKey;
  sceneKey = canonical;
  const themeObj = getThemeObjectById(themeId);
  const mockupEl = document.getElementById(`scene-card-preview-${sceneKey}`);
  if (mockupEl) mockupEl.outerHTML = buildSceneMiniMockupHtml(sceneKey, themeObj);
  const saved = getAssignedThemeForScene(sceneKey) || currentActiveThemeId;
  const pending = document.getElementById(`scene-theme-pending-${sceneKey}`);
  if (pending) pending.style.display = (themeId !== saved) ? 'block' : 'none';
}

async function saveOverlayThemeFromCard(sceneKey) {
  const canonical = (typeof window.normalizeSceneKey === 'function' && window.normalizeSceneKey(sceneKey)) || sceneKey;
  const sel = document.getElementById(`scene-theme-select-${canonical}`);
  if (!sel || !sel.value) return;
  await onOverlayThemeChange(canonical, sel.value);
}

async function restoreOverlayTheme(sceneKey) {
  const canonical = (typeof window.normalizeSceneKey === 'function' && window.normalizeSceneKey(sceneKey)) || sceneKey;
  sceneKey = canonical;
  const defaultThemeId = DEFAULT_OVERLAY_THEMES[sceneKey] || 'maker';
  if (typeof window.cachedOverlayShapes === 'undefined') window.cachedOverlayShapes = {};
  delete window.cachedOverlayShapes[sceneKey];
  cachedOverlayThemes[sceneKey] = defaultThemeId;
  window.cachedOverlayThemes = cachedOverlayThemes;
  const themeObj = getThemeObjectById(defaultThemeId);

  // Actualizar la miniatura visual en la tarjeta inmediatamente
  const mockupEl = document.getElementById(`scene-card-preview-${sceneKey}`);
  if (mockupEl) {
    mockupEl.outerHTML = buildSceneMiniMockupHtml(sceneKey, themeObj);
  }

  // Actualizar selectores en la interfaz si existen
  const sel = document.getElementById(`scene-theme-select-${sceneKey}`);
  if (sel) sel.value = defaultThemeId;
  const shapeSel = document.getElementById(`scene-shape-select-${sceneKey}`);
  if (shapeSel) shapeSel.value = 'auto';

  try {
    await API.setOverlayTheme(sceneKey, defaultThemeId, 'auto');
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(`↺ Estilo original "${themeObj.name}" y forma física restaurados`, 'success');
    }
  } catch (err) {
    console.error('Error restaurando estilo de overlay:', err);
  }
}

async function restoreAllOverlaysToDefaultThemes() {
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  // V3-03: contador real del catálogo, no un literal.
  const sceneCount = (window.OSS_SCENES && window.OSS_SCENES.length) || 0;
  if (!confirm(tr('themes.confirm_restore_all_scenes_themes', `¿Deseas restaurar las ${sceneCount} overlays a sus estilos visuales y formas originales de fábrica?`, { count: sceneCount }))) return;
  if (typeof window.cachedOverlayShapes === 'undefined') window.cachedOverlayShapes = {};
  // Solo claves canónicas de escena presentes en OSS_SCENES: iterar el diccionario
  // de fábrica tal cual incluía secciones de textos ('maker', 'print') que no son
  // escenas y ensuciaban el estado del servidor.
  const restoreTargets = (typeof getCanonicalSceneKeys === 'function')
    ? getCanonicalSceneKeys().map(k => [k, DEFAULT_OVERLAY_THEMES[k] || 'maker'])
    : Object.entries(DEFAULT_OVERLAY_THEMES);
  for (const [key, defaultThemeId] of restoreTargets) {
    cachedOverlayThemes[key] = defaultThemeId;
    delete window.cachedOverlayShapes[key];
    try {
      await API.setOverlayTheme(key, defaultThemeId, 'auto');
    } catch (e) {}
  }
  window.cachedOverlayThemes = cachedOverlayThemes;
  renderThemeScenes();
  if (typeof renderOverlayFolders === 'function') renderOverlayFolders();
  if (window.OverlayTexts && OverlayTexts.showToast) {
    OverlayTexts.showToast(tr('themes.toast_all_themes_restored', '↺ Todas las overlays han sido restauradas a sus estilos y formas originales de fábrica'), 'success');
  }
}

async function onOverlayThemeChange(sceneKey, themeId) {
  const canonical = (typeof window.normalizeSceneKey === 'function' && window.normalizeSceneKey(sceneKey)) || sceneKey;
  sceneKey = canonical;
  const scene = (typeof window.getSceneByKey === 'function') ? window.getSceneByKey(sceneKey) : null;
  if (!scene) {
    console.warn('[OSS] Intento de asignar tema a una escena desconocida:', sceneKey);
    return;
  }
  const previousTheme = cachedOverlayThemes[sceneKey];
  const themeObj = getThemeObjectById(themeId);

  // Vista previa optimista sólo visual; la caché de verdad se actualiza cuando
  // la API confirma. Si falla, se repinta el estado anterior.
  const mockupEl = document.getElementById(`scene-card-preview-${sceneKey}`);
  if (mockupEl) {
    mockupEl.outerHTML = buildSceneMiniMockupHtml(sceneKey, themeObj);
  }

  try {
    await API.setOverlayTheme(sceneKey, themeId);
    cachedOverlayThemes[sceneKey] = themeId;
    window.cachedOverlayThemes = cachedOverlayThemes;
    if (window.OverlayTexts && OverlayTexts.showToast) {
      const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
      OverlayTexts.showToast(tr('themes.toast_style_assigned', `✓ Estilo "${themeObj.name}" asignado a la escena`, { name: themeObj.name }), 'success');
    }
  } catch (err) {
    console.error('Error asignando tema a overlay:', err);
    if (previousTheme === undefined) delete cachedOverlayThemes[sceneKey];
    else cachedOverlayThemes[sceneKey] = previousTheme;
    window.cachedOverlayThemes = cachedOverlayThemes;
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(`✗ No se pudo guardar el estilo en el servidor (${err.message})`, 'error');
    }
  }
  renderThemeScenes();
}

function openThemeEditorByThemeId(themeId) {
  let targetPackId = currentActivePackId;
  cachedThemePacks.forEach(p => {
    (p.themes || []).forEach(t => {
      if (t.id === themeId) {
        targetPackId = p.id;
      }
    });
  });
  switchThemesMainTab('themes');
  openThemePack(targetPackId);
  openThemeEditor(targetPackId, themeId);
}

function copySceneUrl(path) {
  const fullUrl = /^https?:\/\//i.test(path) ? path : `${window.location.origin}${path}`;
  navigator.clipboard.writeText(fullUrl).then(() => {
    if (window.OverlayTexts && OverlayTexts.showToast) {
      const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
      OverlayTexts.showToast(tr('themes.toast_url_copied', `📋 URL copiada para OBS: ${fullUrl}`, { url: fullUrl }), 'success');
    } else {
      const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
      alert(tr('themes.alert_url_copied', `URL copiada al portapapeles:\n${fullUrl}\n\nPégala en OBS Studio como Fuente Navegador (1920×1080).`, { url: fullUrl }));
    }
  });
}
