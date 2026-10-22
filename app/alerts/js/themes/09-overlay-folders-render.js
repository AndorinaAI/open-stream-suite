
function renderOverlayFolders() {
  populateGlobalThemeSelect();

  const foldersView = document.getElementById('overlays-folders-view');
  const detailsView = document.getElementById('overlays-folder-details-view');
  const breadcrumbs = document.getElementById('overlays-breadcrumbs');
  const btnBack = document.getElementById('overlays-btn-back-folders');
  const foldersGrid = document.getElementById('overlays-folders-grid');
  const scenesGrid = document.getElementById('overlays-scenes-in-folder-grid');
  const subfilterContainer = document.getElementById('folder-subfilter-container');
  const globalToolbar = document.getElementById('overlays-global-actions-toolbar');

  if (currentOpenOverlayFolderId) {
    const rawFolder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId) || OVERLAY_FOLDERS[0];
    const folder = getFolderLocalized(rawFolder);

    if (foldersView) foldersView.style.display = 'none';
    if (detailsView) detailsView.style.display = 'block';
    if (globalToolbar) globalToolbar.style.display = 'none';

    const crumbRoot = (window.i18n && window.i18n.tr('themes.folder_crumb_root')) || '📁 Carpetas de Overlays';
    if (breadcrumbs) {
      breadcrumbs.innerHTML = `
        <span class="crumb-item" onclick="showOverlayFoldersView()">${crumbRoot}</span>
        <span class="crumb-divider">/</span>
        <span class="crumb-item active">${folder.icon} ${folder.name}</span>
      `;
    }

    const folderNameEl = document.getElementById('folder-detail-name');
    const folderBadgeEl = document.getElementById('folder-detail-badge');
    const folderDescEl = document.getElementById('folder-detail-desc');
    const countBadge = document.getElementById('overlays-count-in-folder-badge');
    const insideThemeSelect = document.getElementById('folder-inside-theme-select');

    if (folderNameEl) folderNameEl.textContent = folder.name;
    if (folderBadgeEl) folderBadgeEl.textContent = folder.badge;
    if (folderDescEl) folderDescEl.textContent = folder.desc;
    if (insideThemeSelect) insideThemeSelect.innerHTML = buildThemeOptionsHtml(currentActiveThemeId);

    // Subfiltros dinámicos según el pack abierto
    const filterTitle = (window.i18n && window.i18n.tr('themes.folder_filter_activity')) || '🔍 FILTRAR ACTIVIDAD:';
    if (subfilterContainer && folder.subfilters) {
      subfilterContainer.innerHTML = `
        <span style="font-family: var(--font-tech); font-size: 11px; color: var(--color-accent-cyan); font-weight: 700;">
          ${filterTitle}
        </span>
        ${folder.subfilters.map(sf => {
          const isActive = (currentFolderSubFilter === sf.cat);
          return `
            <button type="button" class="btn-action-test folder-subfilter-pill ${isActive ? 'active' : ''}" id="subfilter-pill-${sf.cat}" onclick="filterFolderSubCategory('${sf.cat}')" style="font-size: 11px; padding: 5px 12px; border-radius: 20px; font-weight: 700; ${isActive ? 'border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); background: rgba(87, 214, 196, 0.15);' : ''}">
              ${sf.label}
            </button>
          `;
        }).join('')}
      `;
    }

    let scenesInFolder = OSS_SCENES.filter(sc => folder.keys.includes(sc.key));
    if (currentFolderSubFilter && currentFolderSubFilter !== 'all') {
      scenesInFolder = scenesInFolder.filter(sc => sc.category === currentFolderSubFilter || sc.key.startsWith(currentFolderSubFilter));
    }

    const scenesAvailableTpl = (window.i18n && window.i18n.tr('themes.folder_scenes_available', { count: scenesInFolder.length })) || `${scenesInFolder.length} ESCENAS DISPONIBLES`;
    if (countBadge) {
      countBadge.textContent = scenesAvailableTpl;
    }

    if (scenesGrid) {
      scenesGrid.innerHTML = scenesInFolder.map(s => buildSceneCardHtml(s)).join('');
    }
    if (typeof updateFolderSelectAllButton === 'function') {
      updateFolderSelectAllButton();
    }
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(detailsView);
    }
  } else {
    if (foldersView) foldersView.style.display = 'block';
    if (detailsView) detailsView.style.display = 'none';
    if (btnBack) btnBack.style.display = 'none';
    if (globalToolbar) globalToolbar.style.display = 'flex';

    const crumbTitle = (window.i18n && window.i18n.tr('themes.folder_crumb_title')) || '📁 Carpetas de Actividades del Stream';
    if (breadcrumbs) {
      breadcrumbs.innerHTML = `<span class="crumb-item active" onclick="showOverlayFoldersView()">${crumbTitle}</span>`;
    }

    if (foldersGrid) {
      const applyAllLabel = (window.i18n && window.i18n.tr('themes.folder_apply_all')) || '🎨 Aplicar Estilo Visual a todos los Overlays de la carpeta:';
      const restoreStylesLabel = (window.i18n && window.i18n.tr('themes.folder_restore_styles')) || '🔄 Restaurar Estilos Originales';
      const restoreTextsLabel = (window.i18n && window.i18n.tr('themes.folder_restore_texts')) || '📝 Restaurar Textos';
      const applyBtnLabel = (window.i18n && window.i18n.tr('themes.folder_btn_apply_all')) || '✨ Aplicar a Todos en OBS';
      const actTitleLabel = (window.i18n && window.i18n.tr('themes.folder_activities_title')) || 'ACTIVIDADES INCLUIDAS DENTRO DE ESTA CARPETA:';

      foldersGrid.innerHTML = OVERLAY_FOLDERS.map(rawF => {
        const f = getFolderLocalized(rawF);
        const openBtnLabel = (window.i18n && window.i18n.tr('themes.folder_open_scenes', { count: f.keys.length })) || `📂 Entrar a la Carpeta de Overlays y Editar (${f.keys.length} Escenas) →`;
        return `
          <div class="dash-card theme-pack-card pack-folder-card" style="padding: 22px; border: 1.5px solid rgba(87, 214, 196, 0.35); border-radius: 10px; background: rgba(14, 18, 24, 0.95); box-shadow: 0 8px 24px rgba(0,0,0,0.45); cursor: pointer; transition: all 0.2s;" onclick="openOverlayFolder('${f.id}')" onmouseover="this.style.borderColor='var(--color-accent-cyan)'" onmouseout="this.style.borderColor='rgba(87, 214, 196, 0.35)'">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 38px;">${f.icon}</span>
                <div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 18px; font-weight: 800; color: #FFFFFF;">📁 ${f.name}</span>
                    <span class="badge-pill" style="font-size: 11px; background: rgba(87, 214, 196, 0.18); color: var(--color-accent-cyan); font-weight: 800;">
                      ${f.badge}
                    </span>
                  </div>
                  <div style="font-size: 12px; color: var(--color-text-dim); margin-top: 4px;">
                    ${f.desc}
                  </div>
                </div>
              </div>
            </div>

            <!-- CONTROL DESDE FUERA DE LA CARPETA: APLICAR ESTILO A TODOS Y RESTAURAR ESTILOS -->
            <div style="background: rgba(0,0,0,0.5); border: 1.5px solid rgba(87, 214, 196, 0.4); border-radius: 8px; padding: 12px 16px; margin: 12px 0;" onclick="event.stopPropagation()">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <span style="font-size: 12px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 6px;">
                  <span>🎨</span> ${applyAllLabel}
                </span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn-action-test" style="font-size: 11px; padding: 5px 12px; color: var(--color-accent-cyan); border-color: var(--color-accent-cyan); font-weight: 800; background: rgba(87, 214, 196, 0.15); cursor: pointer;" onclick="restoreFolderThemes('${f.id}')" title="Restablecer todas las escenas de este pack a sus temas originales">
                    ${restoreStylesLabel}
                  </button>
                  <button type="button" class="btn-action-test" style="font-size: 11px; padding: 5px 12px; color: #FF783F; border-color: rgba(255, 120, 63, 0.6); font-weight: 800; background: rgba(255, 120, 63, 0.12); cursor: pointer;" onclick="restoreFolderTexts('${f.id}')" title="Restablecer textos del pack a los de fábrica">
                    ${restoreTextsLabel}
                  </button>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <select id="folder-theme-select-${f.id}" class="form-select" style="flex: 1; min-width: 200px; font-size: 12px; padding: 7px 10px; background: #0E1216; color: #FFFFFF; border: 1px solid rgba(87, 214, 196, 0.5); border-radius: 4px;">
                  ${buildThemeOptionsHtml(currentActiveThemeId)}
                </select>
                <button type="button" class="btn-action-primary" style="font-size: 12px; padding: 7px 16px; font-weight: 800;" onclick="applyThemeToAllOverlaysFromFolderCard('${f.id}')">
                  ${applyBtnLabel}
                </button>
              </div>
            </div>

            <div style="font-size: 11px; font-family: var(--font-tech); color: var(--color-accent-cyan); margin-bottom: 6px; font-weight: 700;">
              ${actTitleLabel}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;">
              ${(f.activities || []).map(act => `
                <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #FFFFFF;">
                  <span>${act.icon}</span> <b>${act.name}</b>
                </span>
              `).join('')}
            </div>

            <button type="button" class="btn-action-primary" style="width: 100%; font-size: 13px; font-weight: 800; padding: 11px; display: inline-flex; justify-content: center; align-items: center; gap: 8px;" onclick="openOverlayFolder('${f.id}')">
              ${openBtnLabel}
            </button>
          </div>
        `;
      }).join('');
    }
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(foldersView);
    }
  }
}

function renderThemeScenes() {
  renderOverlayFolders();
}

async function applyThemeToAllFromInside() {
  const sel = document.getElementById('folder-inside-theme-select');
  if (!sel || !sel.value) return;
  const chosenTheme = sel.value;
  const themeObj = getThemeObjectById(chosenTheme);

  const folder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId) || OVERLAY_FOLDERS[0];
  for (const k of folder.keys) {
    cachedOverlayThemes[k] = chosenTheme;
    try {
      await API.setOverlayTheme(k, chosenTheme);
    } catch (e) {}
  }
  renderOverlayFolders();

  if (window.OverlayTexts && OverlayTexts.showToast) {
    OverlayTexts.showToast(`✓ Estilo "${themeObj.name}" aplicado a todos los overlays de "${folder.name}" en OBS Studio`, 'success');
  }
}

async function applyThemeToCurrentOpenFolder() {
  applyThemeToAllFromInside();
}

async function restoreCurrentFolderTexts() {
  if (!currentOpenOverlayFolderId) return;
  const folder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId);
  const name = folder ? folder.name : currentOpenOverlayFolderId;

  if (!confirm(`¿Restaurar todos los textos de la carpeta "${name}" a los valores originales de fábrica?`)) {
    return;
  }

  // Mapear folder a section del backend
  let section = currentOpenOverlayFolderId;
  if (section === 'stream') {
    // Restaurar game y chill
    if (window.OverlayTexts) {
      await OverlayTexts.reset('game');
      await OverlayTexts.reset('chill');
      return;
    }
  } else if (section === 'screens') {
    if (window.OverlayTexts) {
      await OverlayTexts.reset('startingSoon');
      await OverlayTexts.reset('beRightBack');
      await OverlayTexts.reset('ending');
      return;
    }
  }

  if (window.OverlayTexts) {
    await OverlayTexts.reset(section);
  }
}

async function restoreCurrentSceneTexts() {
  if (!currentEditingScene) return;
  const key = currentEditingScene.key;
  let section = 'all';
  if (key.startsWith('maker')) section = 'maker';
  else if (key.startsWith('print')) section = 'print';
  else if (key === 'game') section = 'game';
  else if (key === 'chill') section = 'chill';
  else if (key === 'startingSoon') section = 'startingSoon';
  else if (key === 'beRightBack') section = 'beRightBack';
  else if (key === 'ending') section = 'ending';

  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  const locSceneName = currentEditingScene.name || currentEditingScene.key;
  if (!confirm(tr('themes.confirm_restore_scene_texts', `¿Restaurar los textos de esta escena (${locSceneName}) a sus valores originales de fábrica?`, { name: locSceneName }))) {
    return;
  }

  if (window.OverlayTexts) {
    await OverlayTexts.reset(section);
  }
}

async function restoreSceneTexts(sceneKey) {
  let section = 'all';
  if (sceneKey.startsWith('maker')) section = 'maker';
  else if (sceneKey.startsWith('print')) section = 'print';
  else if (sceneKey === 'game') section = 'game';
  else if (sceneKey === 'chill') section = 'chill';
  else if (sceneKey === 'startingSoon') section = 'startingSoon';
  else if (sceneKey === 'beRightBack') section = 'beRightBack';
  else if (sceneKey === 'ending') section = 'ending';

  if (!confirm(`¿Restaurar los textos de la escena "${sceneKey}" a los valores originales de fábrica?`)) {
    return;
  }

  if (window.OverlayTexts) {
    await OverlayTexts.reset(section);
  }
}

async function restoreAllOverlaysTexts() {
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('themes.confirm_restore_all_scenes_texts', '¿Restaurar TODOS los textos de todas las 9 escenas a sus valores originales de fábrica?'))) {
    return;
  }
  if (window.OverlayTexts) {
    await OverlayTexts.reset('all');
  }
}
