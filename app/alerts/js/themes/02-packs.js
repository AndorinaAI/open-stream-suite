
// Cargar estado inicial al abrir la sección
async function loadThemePacks() {
  try {
    const data = await API.getThemePacks();
    cachedThemePacks = data.packs || [];
    currentActiveThemeId = data.activeTheme || 'maker';
    currentActivePackId = data.activePack || 'pack_open_stream_suite';
    if (data.overlayThemes) {
      cachedOverlayThemes = Object.assign({}, cachedOverlayThemes, data.overlayThemes);
    }

    updateActiveThemeBadge();
    if (currentOpenPackId) {
      const exists = cachedThemePacks.find(p => p.id === currentOpenPackId);
      if (exists) {
        openThemePack(currentOpenPackId);
      } else {
        showThemePacksView();
      }
    } else {
      renderThemePacks();
    }
    renderThemeScenes();
  } catch (e) {
    console.error('Error al cargar packs de temas:', e);
  }
}

function updateActiveThemeBadge() {
  const lbl = document.getElementById('lbl-active-theme-name');
  if (!lbl) return;

  let themeName = currentActiveThemeId;
  cachedThemePacks.forEach(p => {
    (p.themes || []).forEach(t => {
      if (t.id === currentActiveThemeId) {
        themeName = `${t.name} (${p.name})`;
      }
    });
  });
  lbl.textContent = themeName;
}

// ====================================================================
// VISTA 1: NAVEGACIÓN Y CARPETAS DE PACKS
// ====================================================================

function getPackLocalized(pack) {
  if (!pack) return pack;
  if (window.i18n && typeof window.i18n.tr === 'function') {
    const nameKey = `folder_catalog.${pack.id}.name`;
    const badgeKey = `folder_catalog.${pack.id}.badge`;
    const descKey = `folder_catalog.${pack.id}.desc`;
    const name = window.i18n.tr(nameKey);
    const badge = window.i18n.tr(badgeKey);
    const desc = window.i18n.tr(descKey);
    return {
      ...pack,
      name: (name && name !== nameKey) ? name : pack.name,
      badge: (badge && badge !== badgeKey) ? badge : (pack.badge || 'PACK'),
      description: (desc && desc !== descKey) ? desc : pack.description
    };
  }
  return pack;
}

function renderThemePacks() {
  const container = document.getElementById('themes-packs-grid');
  const badge = document.getElementById('themes-total-packs-badge');
  const btnBack = document.getElementById('themes-btn-back-packs');
  const btnAddTheme = document.getElementById('themes-btn-add-theme');
  const breadcrumbs = document.getElementById('themes-breadcrumbs');
  const packsView = document.getElementById('themes-packs-view');
  const detailsView = document.getElementById('themes-pack-details-view');

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const crumbPacks = tr('themes.crumb_packs', '📁 Packs de Temas');

  if (packsView) packsView.style.display = 'block';
  if (detailsView) detailsView.style.display = 'none';
  if (btnBack) btnBack.style.display = 'none';
  if (btnAddTheme) btnAddTheme.style.display = 'none';
  if (breadcrumbs) {
    breadcrumbs.innerHTML = `<span class="crumb-item active" onclick="showThemePacksView()">${crumbPacks}</span>`;
  }

  const badgeTotalPacks = tr('themes.badge_total_theme_packs', `${cachedThemePacks.length} PACKS`).replace('{count}', cachedThemePacks.length);
  if (badge) badge.textContent = badgeTotalPacks;
  if (!container) return;

  if (cachedThemePacks.length === 0) {
    container.innerHTML = `<div style="color: var(--color-text-dim); padding: 24px;">${tr('themes.no_packs', 'No hay packs creados. Haz clic en "+ Nuevo Pack" para crear uno.')}</div>`;
    return;
  }

  const activeObs = tr('themes.pack_active_obs', '🟢 Pack Activo en OBS');
  const localCol = tr('themes.pack_local_col', '📦 Colección local');
  const openFolderBtn = tr('themes.btn_open_folder', 'Abrir Carpeta ➜');
  const themesLabel = tr('themes.themes_count_label', '{count} TEMAS');

  container.innerHTML = cachedThemePacks.map(rawPack => {
    const pack = getPackLocalized(rawPack);
    const isPackActive = pack.id === currentActivePackId;
    const countText = themesLabel.replace('{count}', pack.themesCount || 0);
    return `
      <div class="pack-folder-card ${isPackActive ? 'active-pack' : ''}" onclick="openThemePack('${pack.id}')">
        <div class="pack-folder-header">
          <div class="pack-folder-title">
            <span style="font-size: 24px;">${pack.icon || '📁'}</span>
            <div>
              <div>${pack.name}</div>
              <div style="font-family: var(--font-tech); font-size: 10px; color: var(--color-text-dim);">streamthemes/${pack.id}/</div>
            </div>
          </div>
          <span class="badge-pill" style="font-size: 10px; background: rgba(87, 214, 196, 0.15); color: var(--color-accent-cyan);">
            ${countText}
          </span>
        </div>

        <div style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4;">
          ${pack.description || 'Pack modular de temas y escenas.'}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-family: var(--font-tech); font-size: 11px;">
          <span style="color: ${isPackActive ? 'var(--color-accent-cyan)' : 'var(--color-text-dim)'}; font-weight: 700;">
            ${isPackActive ? activeObs : localCol}
          </span>
          <button class="btn-action-test" style="padding: 4px 10px; font-size: 11px;">
            ${openFolderBtn}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function showThemePacksView() {
  currentOpenPackId = null;
  renderThemePacks();
}

// ====================================================================
// VISTA 2: DENTRO DE UN PACK (TEMAS Y OVERLAYS)
// ====================================================================

function openThemePack(packId) {
  const rawPack = cachedThemePacks.find(p => p.id === packId);
  if (!rawPack) return;
  const pack = getPackLocalized(rawPack);

  currentOpenPackId = packId;
  const packsView = document.getElementById('themes-packs-view');
  const detailsView = document.getElementById('themes-pack-details-view');
  const btnBack = document.getElementById('themes-btn-back-packs');
  const btnAddTheme = document.getElementById('themes-btn-add-theme');
  const breadcrumbs = document.getElementById('themes-breadcrumbs');

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const crumbPacks = tr('themes.crumb_packs', '📁 Packs de Temas');

  if (packsView) packsView.style.display = 'none';
  if (detailsView) detailsView.style.display = 'block';
  if (btnBack) btnBack.style.display = 'inline-flex';
  if (btnAddTheme) btnAddTheme.style.display = 'inline-flex';

  if (breadcrumbs) {
    breadcrumbs.innerHTML = `
      <span class="crumb-item" onclick="showThemePacksView()">${crumbPacks}</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-item active">${pack.icon || '📁'} ${pack.name}</span>
    `;
  }

  // Actualizar cabecera del pack
  const dIcon = document.getElementById('pack-detail-icon');
  const dName = document.getElementById('pack-detail-name');
  const dBadge = document.getElementById('pack-detail-badge');
  const dDesc = document.getElementById('pack-detail-desc');
  const dPath = document.getElementById('pack-detail-path');
  const dCount = document.getElementById('themes-count-in-pack-badge');

  if (dIcon) dIcon.textContent = pack.icon || '📁';
  if (dName) dName.textContent = pack.name;
  if (dBadge) dBadge.textContent = pack.badge || 'PACK';
  if (dDesc) dDesc.textContent = pack.description || '';
  if (dPath) dPath.textContent = `streamthemes/${pack.id}/`;
  const themesCountText = tr('themes.themes_count_label', '{count} TEMAS').replace('{count}', (pack.themes || []).length);
  if (dCount) dCount.textContent = themesCountText;

  // Renderizar tarjetas de temas
  const container = document.getElementById('themes-cards-grid');
  if (!container) return;

  const themes = pack.themes || [];
  if (themes.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 36px; text-align: center; color: var(--color-text-dim);">
        <div style="font-size: 32px; margin-bottom: 8px;">🎨</div>
        <b>No hay temas en este pack todavía.</b><br>
        <button class="btn-action-primary" style="margin-top: 12px;" onclick="openNewThemeModal()">+ Crear Primer Tema</button>
      </div>
    `;
    return;
  }

  container.innerHTML = themes.map(t => {
    const isCurrentActive = t.id === currentActiveThemeId;
    const isChatAnchored = t.chatAnchored !== false;
    const cyan = t.accentCyan || '#57D6C4';
    const orange = t.accentOrange || '#FF783F';
    const bg = t.bgDark || '#191D21';
    const txt = t.textLight || '#F2EEE5';

    return `
      <div class="dash-card theme-card-rich ${isCurrentActive ? 'is-active-theme' : ''}" style="border-top: 4px solid ${cyan};">
        <div class="card-header-bar">
          <span class="card-header-title">${t.badge || t.name}</span>
          ${isCurrentActive ? '<span style="font-size: 10px; color: var(--color-accent-cyan); font-family: var(--font-tech); font-weight: 700;">● EN VIVO</span>' : ''}
        </div>

        <div style="font-size: 14px; font-weight: 800; color: var(--color-text-light); margin-top: 4px;">
          ${t.name}
        </div>

        <p style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4; min-height: 36px;">
          ${t.desc || 'Estilo visual para todas las escenas y overlays.'}
        </p>

        <!-- Muestrario de Colores (Swatches) -->
        <div class="theme-swatch-row" title="Colores del tema: Primario, Secundario, Fondo y Texto">
          <div class="theme-swatch-block" style="background: ${cyan};" title="Acento 1: ${cyan}"></div>
          <div class="theme-swatch-block" style="background: ${orange};" title="Acento 2: ${orange}"></div>
          <div class="theme-swatch-block" style="background: ${bg};" title="Fondo: ${bg}"></div>
          <div class="theme-swatch-block" style="background: ${txt};" title="Texto: ${txt}"></div>
        </div>

        <!-- Estado de Chat -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-family: var(--font-tech); font-size: 11px; margin-top: 4px;">
          <span style="color: ${isChatAnchored ? 'var(--color-accent-cyan)' : 'var(--color-accent-orange)'};">
            ${isChatAnchored ? tr('themes.chat_anchored', '🔗 Chat Anclado') : tr('themes.chat_derivative', '✨ Chat Derivado')}
          </span>
          <span style="color: var(--color-text-dim); font-size: 10px;">
            Glow: ${t.glowIntensity || 50}%
          </span>
        </div>

        <!-- Overlays Vinculadas a este Estilo -->
        <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255, 120, 63, 0.3); padding: 8px; border-radius: 4px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; margin-bottom: 5px;">
            <span style="color: var(--color-text-dim);">${tr('themes.overlays_using_style', '🎬 Overlays que usan este estilo:')}</span>
            <span style="color: var(--color-accent-orange); font-family: var(--font-tech); font-weight: 700;">
              ${tr('themes.linked_badge', '{count} ENLAZADAS').replace('{count}', OSS_SCENES.filter(sc => (cachedOverlayThemes[sc.key] || currentActiveThemeId) === t.id).length)}
            </span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; max-height: 52px; overflow-y: auto;">
            ${(() => {
              const linked = OSS_SCENES.filter(sc => (cachedOverlayThemes[sc.key] || currentActiveThemeId) === t.id);
              if (linked.length === 0) {
                return `<span style="font-size: 10px; color: var(--color-text-dim); font-style: italic;">${tr('themes.no_overlays_linked', 'Sin overlays asignadas (se puede asignar en la pestaña Overlays)')}</span>`;
              }
              return linked.map(sc => {
                const localizedSc = getSceneLocalized(sc);
                return `
                <button type="button" class="badge-pill" style="cursor: pointer; border: 1px solid rgba(255, 120, 63, 0.4); background: rgba(255, 120, 63, 0.15); color: #FF783F; font-size: 9px; padding: 2px 6px;" onclick="openOverlayFullscreen('${sc.key}', '${sc.path}')" title="${localizedSc.name}">
                  ${localizedSc.icon} ${localizedSc.name.split(':')[0]} 🖥️✏️
                </button>
              `;
              }).join('');
            })()}
          </div>
        </div>

        <!-- Botones de Acción -->
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
          <div style="display: flex; gap: 6px;">
            <select class="monitor-select" style="flex: 1; font-size: 11px; padding: 6px;" onchange="if(this.value){ assignThemeToScene(this.value, '${t.id}'); this.value=''; }">
              <option value="">${tr('themes.assign_to_scene', '🎯 Asignar a una Escena...')}</option>
              ${OSS_SCENES.map(sc => {
                const locSc = getSceneLocalized(sc);
                return `<option value="${sc.key}">➔ ${locSc.icon} ${locSc.name.split(':')[0]}</option>`;
              }).join('')}
            </select>
            <button class="btn-action-test" style="font-size: 11px; padding: 6px 12px;" onclick="openThemeEditor('${pack.id}', '${t.id}')">
              ${tr('themes.btn_edit_theme', '🛠️ Editar')}
            </button>
          </div>

          <button class="btn-action-primary" style="width: 100%; font-size: 11px; padding: 6px; display: inline-flex; justify-content: center; align-items: center; gap: 5px;" onclick="applyThemeToAllScenes('${t.id}', '${pack.id}')">
            ${tr('themes.btn_apply_all_scenes_obs', '🎨 Aplicar a Todas las Escenas en OBS')}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ====================================================================
// ACTIVACIÓN DE TEMA EN OBS STUDIO
// ====================================================================

async function activateTheme(themeId, packId) {
  try {
    currentActiveThemeId = themeId;
    currentActivePackId = packId || currentActivePackId;

    await API.applyThemePack(themeId, currentActivePackId);

    updateActiveThemeBadge();
    if (currentOpenPackId) {
      openThemePack(currentOpenPackId);
    } else {
      renderThemePacks();
    }
  } catch (e) {
    console.warn('Error al activar tema en OBS:', e);
  }
}

async function assignThemeToScene(sceneKey, themeId) {
  await onOverlayThemeChange(sceneKey, themeId);
}

async function applyThemeToAllScenes(themeId, packId) {
  const info = getThemeDisplayNameById(themeId);
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('themes.confirm_apply_all', `¿Deseas aplicar el estilo "${info.name}" a todas las 9 escenas de OBS Studio?`, { name: info.name }))) return;
  for (const sc of OSS_SCENES) {
    cachedOverlayThemes[sc.key] = themeId;
    try {
      await API.setOverlayTheme(sc.key, themeId);
    } catch (e) {}
  }
  await API.applyThemePack(themeId, packId);
  currentActiveThemeId = themeId;
  currentActivePackId = packId;
  updateActiveThemeBadge();
  renderThemeScenes();
  if (currentOpenPackId) openThemePack(currentOpenPackId);
  if (window.OverlayTexts && OverlayTexts.showToast) {
    const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  OverlayTexts.showToast(tr('themes.toast_applied_all', `✓ Estilo "${info.name}" aplicado a todas las escenas en OBS`, { name: info.name }), 'success');
  }
}

async function changeLiveTheme(themeId) {
  let targetPackId = currentActivePackId;
  cachedThemePacks.forEach(p => {
    (p.themes || []).forEach(t => {
      if (t.id === themeId) targetPackId = p.id;
    });
  });
  await activateTheme(themeId, targetPackId);
}
