
function buildSceneCardHtml(rawS) {
  const s = getSceneLocalized(rawS);
  const assignedThemeId = cachedOverlayThemes[s.key] || currentActiveThemeId;
  const assignedThemeObj = getThemeObjectById(assignedThemeId);
  const defaultThemeId = DEFAULT_OVERLAY_THEMES[s.key] || 'maker';
  const defaultInfo = getThemeDisplayNameById(defaultThemeId);
  const isModified = (assignedThemeId !== defaultThemeId);

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const cardAssignedStyle = tr('themes.card_assigned_style', '🎨 Estilo Visual Asignado:');
  const cardEditStyle = tr('themes.card_edit_style', '🎨 Editar Estilo ↗');
  const cardSave = tr('themes.card_save', '💾 Guardar');
  const cardPending = tr('themes.card_pending_change', '● Cambio sin guardar — pulsa 💾 Guardar para aplicarlo en OBS');
  const cardCustomized = tr('themes.card_customized', '⚠️ Personalizado (Original: <b>{name}</b>)').replace('{name}', defaultInfo.name);
  const cardOriginal = tr('themes.card_factory_original', '⭐ Original de fábrica: <b>{name}</b>').replace('{name}', defaultInfo.name);
  const cardRestoreOrig = tr('themes.card_restore_original', '🔄 Restaurar Original');
  const cardViewFs = tr('themes.card_view_fullscreen', '🖥️ Ver Pantalla Completa');
  const cardEditTexts = tr('themes.card_edit_texts', '✏️ Editar Textos');
  const cardCopyObs = tr('themes.card_copy_obs', '📋 Copiar URL OBS');
  const cardRestoreTexts = tr('themes.card_restore_texts', '🔄 Restaurar Textos');

  return `
    <div class="dash-card theme-card-rich" style="border-top: 3px solid ${isModified ? '#FF783F' : 'var(--color-accent-cyan)'}; margin-bottom: 0;">
      <div class="card-header-bar">
        <span class="card-header-title">${s.badge}</span>
        <span style="font-family: var(--font-tech); font-size: 10px; color: var(--color-accent-cyan);">1920×1080</span>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
        <span style="font-size: 22px;">${s.icon}</span>
        <div style="font-size: 14px; font-weight: 800; color: var(--color-text-light);">
          ${s.name}
        </div>
      </div>

      <!-- Previsualización Visual Mínima en Directo (Colores, Bordes y Neón) -->
      ${buildSceneMiniMockupHtml(s.key, assignedThemeObj)}

      <!-- Selector Interactivo de Estilo Visual -->
      <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(87, 214, 196, 0.25); padding: 8px 10px; border-radius: 4px; margin: 8px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-size: 11px; color: var(--color-text-dim);">${cardAssignedStyle}</span>
          <button type="button" class="btn-action-test" style="font-size: 10px; padding: 2px 8px; border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); cursor: pointer;" onclick="openThemeEditorByThemeId('${assignedThemeId}')" title="${cardEditStyle}">
            ${cardEditStyle}
          </button>
        </div>
        <div style="display: flex; gap: 6px; align-items: stretch;">
          <select id="scene-theme-select-${s.key}" class="form-select" style="flex: 1; min-width: 0; font-size: 11px; padding: 5px 8px; background: #0E1216; color: #FFFFFF; border: 1px solid ${isModified ? 'rgba(255,120,63,0.5)' : 'rgba(87,214,196,0.35)'}; border-radius: 4px;" onchange="previewOverlayThemeChange('${s.key}', this.value)">
            ${buildThemeOptionsHtml(assignedThemeId, defaultThemeId)}
          </select>
          <button type="button" id="scene-theme-save-${s.key}" class="btn-action-primary" style="font-size: 11px; padding: 5px 10px; font-weight: 800; white-space: nowrap;" onclick="saveOverlayThemeFromCard('${s.key}')">
            ${cardSave}
          </button>
        </div>
        <div id="scene-theme-pending-${s.key}" style="display: none; font-size: 10px; color: #FFD166; margin-top: 4px;">${cardPending}</div>

        <!-- Indicador y Botón de Restauración al Estilo de Fábrica -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding: 4px 8px; border-radius: 4px; ${isModified ? 'background: rgba(255, 120, 63, 0.12); border: 1px solid rgba(255, 120, 63, 0.35);' : 'background: rgba(87, 214, 196, 0.08); border: 1px solid rgba(87, 214, 196, 0.2);'}">
          <span style="font-size: 10px; color: ${isModified ? '#FF783F' : 'var(--color-accent-cyan)'};">
            ${isModified ? cardCustomized : cardOriginal}
          </span>
          ${isModified ? `
            <button type="button" class="btn-action-test" style="font-size: 9px; padding: 2px 7px; color: #FF783F; border-color: #FF783F; cursor: pointer; background: rgba(255,120,63,0.15);" onclick="restoreOverlayTheme('${s.key}')">
              ${cardRestoreOrig}
            </button>
          ` : ''}
        </div>
      </div>

      <p style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4; margin: 8px 0; min-height: 40px;">
        ${s.desc}
      </p>

      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
        <button class="btn-action-primary" style="width: 100%; padding: 8px 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 2px; line-height: 1.25;" onclick="openOverlayFullscreen('${s.key}', '${s.path}')">
          <span style="font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">${cardViewFs}</span>
          <span style="font-size: 10px; font-weight: 700; color: #0D1117; opacity: 0.95;">${cardEditTexts}</span>
        </button>
        <div style="display: flex; gap: 6px;">
          <button class="btn-action-test" style="flex: 1; font-size: 11px; padding: 6px 8px; display: inline-flex; justify-content: center; align-items: center; gap: 4px;" onclick="copyOverlaySceneUrl('${s.key}', '${s.path}')">
            ${cardCopyObs}
          </button>
          <button class="btn-action-test" style="font-size: 10px; padding: 6px 8px; color: #FF783F; border-color: rgba(255,120,63,0.3); display: inline-flex; justify-content: center; align-items: center; gap: 4px;" onclick="restoreSceneTexts('${s.key}')">
            ${cardRestoreTexts}
          </button>
        </div>
      </div>
    </div>
  `;
}

function openOverlayFullscreen(sceneKey, scenePath) {
  const assignedTheme = (cachedOverlayThemes && cachedOverlayThemes[sceneKey]) || currentActiveThemeId;
  const fullUrl = `${scenePath}?theme=${encodeURIComponent(assignedTheme)}`;
  window.open(fullUrl, '_blank');
}

function copyOverlaySceneUrl(sceneKey, scenePath) {
  // URL limpia SIN ?theme=: así OBS lee el estilo guardado en el servidor
  // y se actualiza en vivo cada vez que lo cambias desde el panel.
  copySceneUrl(scenePath);
}

function previewOverlayThemeChange(sceneKey, themeId) {
  const themeObj = getThemeObjectById(themeId);
  const mockupEl = document.getElementById(`scene-card-preview-${sceneKey}`);
  if (mockupEl) mockupEl.outerHTML = buildSceneMiniMockupHtml(sceneKey, themeObj);
  const saved = (cachedOverlayThemes && cachedOverlayThemes[sceneKey]) || currentActiveThemeId;
  const pending = document.getElementById(`scene-theme-pending-${sceneKey}`);
  if (pending) pending.style.display = (themeId !== saved) ? 'block' : 'none';
}

async function saveOverlayThemeFromCard(sceneKey) {
  const sel = document.getElementById(`scene-theme-select-${sceneKey}`);
  if (!sel || !sel.value) return;
  await onOverlayThemeChange(sceneKey, sel.value);
}

async function restoreOverlayTheme(sceneKey) {
  const defaultThemeId = DEFAULT_OVERLAY_THEMES[sceneKey] || 'maker';
  await onOverlayThemeChange(sceneKey, defaultThemeId);
  const info = getThemeDisplayNameById(defaultThemeId);
  if (window.OverlayTexts && OverlayTexts.showToast) {
    OverlayTexts.showToast(`↺ Estilo original "${info.name}" restaurado para esta overlay`, 'success');
  }
}

async function restoreAllOverlaysToDefaultThemes() {
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('themes.confirm_restore_all_scenes_themes', '¿Deseas restaurar todas las 9 overlays a sus estilos visuales originales de fábrica?'))) return;
  for (const [key, defaultThemeId] of Object.entries(DEFAULT_OVERLAY_THEMES)) {
    cachedOverlayThemes[key] = defaultThemeId;
    try {
      await API.setOverlayTheme(key, defaultThemeId);
    } catch (e) {}
  }
  renderThemeScenes();
  if (window.OverlayTexts && OverlayTexts.showToast) {
    const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  OverlayTexts.showToast(tr('themes.toast_all_themes_restored', '↺ Todas las overlays han sido restauradas a sus estilos originales de fábrica'), 'success');
  }
}

async function onOverlayThemeChange(sceneKey, themeId) {
  cachedOverlayThemes[sceneKey] = themeId;
  const themeObj = getThemeObjectById(themeId);

  // Actualizar la miniatura visual en la tarjeta inmediatamente
  const mockupEl = document.getElementById(`scene-card-preview-${sceneKey}`);
  if (mockupEl) {
    mockupEl.outerHTML = buildSceneMiniMockupHtml(sceneKey, themeObj);
  }

  try {
    await API.setOverlayTheme(sceneKey, themeId);
    if (window.OverlayTexts && OverlayTexts.showToast) {
      const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  OverlayTexts.showToast(tr('themes.toast_style_assigned', `✓ Estilo "${themeObj.name}" asignado a la escena`, { name: themeObj.name }), 'success');
    }
  } catch (err) {
    console.error('Error asignando tema a overlay:', err);
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
