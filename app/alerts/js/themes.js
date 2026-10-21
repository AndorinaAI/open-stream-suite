// ====================================================================
// GESTOR MODULAR DE TEMAS, PACKS EN CARPETAS Y EDITOR DE CÓDIGO/AJUSTES
// ====================================================================

let cachedThemePacks = [];
let currentOpenPackId = null;
let currentEditingTheme = null;
let currentEditingPackId = null;
let currentActiveThemeId = 'maker';
let currentActivePackId = 'Maker_Theme_Pack';
const DEFAULT_OVERLAY_THEMES = {
  // Maker_Theme_Pack
  'game': 'cyberpunk',
  'maker': 'maker',
  'maker-desk': 'maker',
  'maker-pc': 'terminal',
  'print': 'print',
  'print-machine': 'print',
  'print-design': 'print',
  'chill': 'chill',
  'startingSoon': 'synthwave',
  'beRightBack': 'synthwave',
  'ending': 'synthwave',

  // Open_stream_Pack
  'oss_chatting': 'neon_streamer',
  'oss_desktop': 'clean_minimal',
  'oss_podcast': 'sunset_glow',
  'oss_starting': 'crimson_pulse',
  'oss_brb': 'emerald_matrix',
  'oss_ending': 'neon_streamer',

  // Gamer_Pro_Pack
  'gamer_gameplay': 'cyber_glitch',
  'gamer_speedrun': 'toxic_rad',
  'gamer_victory': 'golden_glory',
  'gamer_starting': 'crimson_esport',
  'gamer_brb': 'stealth_mono',
  'gamer_ending': 'golden_glory',

  // Cozy_LoFi_Pack
  'cozy_pomodoro': 'latte_caramel',
  'cozy_art': 'sakura_sunset',
  'cozy_cafe': 'matcha_bamboo',
  'cozy_starting': 'lavender_dream',
  'cozy_brb': 'latte_caramel',
  'cozy_ending': 'nordic_twilight'
};
let cachedOverlayThemes = Object.assign({}, DEFAULT_OVERLAY_THEMES);

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

// ====================================================================
// EDITOR DE TEMA: AJUSTES VISUALES + EDITOR DE CÓDIGO DIRECTO
// ====================================================================

function openThemeEditor(packId, themeId) {
  const pack = cachedThemePacks.find(p => p.id === packId);
  if (!pack) return;
  const theme = (pack.themes || []).find(t => t.id === themeId);
  if (!theme) return;

  currentEditingPackId = packId;
  currentEditingTheme = JSON.parse(JSON.stringify(theme));

  const modal = document.getElementById('theme-editor-modal');
  const mTitle = document.getElementById('modal-theme-title');
  const mPackBadge = document.getElementById('modal-theme-pack-badge');
  const mPath = document.getElementById('modal-theme-path');

  if (mTitle) mTitle.textContent = `Tema: ${theme.name}`;
  if (mPackBadge) mPackBadge.textContent = pack.name.toUpperCase();
  if (mPath) mPath.textContent = `streamthemes/${packId}/styles/${themeId}/style.css & theme.json`;

  // 1. Cargar Ajustes Visuales
  document.getElementById('edit-theme-name').value = theme.name || '';
  document.getElementById('edit-theme-badge').value = theme.badge || '';

  setPickerAndHex('cyan', theme.accentCyan || '#57D6C4');
  setPickerAndHex('orange', theme.accentOrange || '#FF783F');
  setPickerAndHex('bg', theme.bgDark || '#191D21');
  setPickerAndHex('text', theme.textLight || '#F2EEE5');

  const borderSelect = document.getElementById('edit-theme-border-style');
  if (borderSelect) borderSelect.value = theme.borderStyle || 'rounded';

  const animSelect = document.getElementById('edit-theme-animation-effect');
  if (animSelect) animSelect.value = theme.animationEffect || 'none';

  const glowSlider = document.getElementById('edit-theme-glow');
  const glowLbl = document.getElementById('lbl-theme-glow');
  if (glowSlider) glowSlider.value = theme.glowIntensity || 60;
  if (glowLbl) glowLbl.textContent = `${theme.glowIntensity || 60}%`;

  // 2. Chat Anchoring
  const chatAnchoredCheckbox = document.getElementById('edit-theme-chat-anchored');
  const isAnchored = theme.chatAnchored !== false;
  if (chatAnchoredCheckbox) chatAnchoredCheckbox.checked = isAnchored;
  onChatAnchorCheckboxChange(isAnchored);

  if (theme.chatDerivative) {
    const shapeSel = document.getElementById('edit-chat-shape');
    const opSlider = document.getElementById('edit-chat-opacity');
    if (shapeSel) shapeSel.value = theme.chatDerivative.shape || 'rounded';
    if (opSlider) opSlider.value = theme.chatDerivative.bgOpacity || 90;
  }

  // 3. Cargar Código Directo
  const cssArea = document.getElementById('theme-code-css-textarea');
  const jsonArea = document.getElementById('theme-code-json-textarea');
  if (cssArea) cssArea.value = theme.css || '';
  if (jsonArea) jsonArea.value = JSON.stringify(theme, null, 2);

  // Abrir pestaña CSS por defecto
  switchThemeEditorTab('css');

  // Forzar actualización inicial de preview
  const iframe = document.getElementById('theme-preview-iframe');
  if (iframe) iframe.removeAttribute('data-loaded-path');

  if (modal) {
    modal.style.display = 'flex';
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(modal);
    }
  }
}

function closeThemeEditor() {
  const modal = document.getElementById('theme-editor-modal');
  if (modal) modal.style.display = 'none';
  currentEditingTheme = null;
  currentEditingPackId = null;
}

function setPickerAndHex(type, val) {
  const picker = document.getElementById(`edit-theme-${type}-color`);
  const hex = document.getElementById(`edit-theme-${type}-hex`);
  if (picker) picker.value = val.startsWith('#') && val.length === 7 ? val : '#57D6C4';
  if (hex) hex.value = val;
}

function updateHexFromPicker(type) {
  const picker = document.getElementById(`edit-theme-${type}-color`);
  const hex = document.getElementById(`edit-theme-${type}-hex`);
  if (picker && hex) hex.value = picker.value.toUpperCase();
}

function updatePickerFromHex(type) {
  const picker = document.getElementById(`edit-theme-${type}-color`);
  const hex = document.getElementById(`edit-theme-${type}-hex`);
  if (picker && hex && hex.value.startsWith('#') && hex.value.length === 7) {
    picker.value = hex.value;
  }
}

// Al cambiar cualquier ajuste visual, regenerar dinámicamente el CSS en el editor de código
function onVisualSettingChange() {
  if (!currentEditingTheme) return;

  const cyan = document.getElementById('edit-theme-cyan-hex').value.trim() || '#57D6C4';
  const orange = document.getElementById('edit-theme-orange-hex').value.trim() || '#FF783F';
  const bg = document.getElementById('edit-theme-bg-hex').value.trim() || '#191D21';
  const text = document.getElementById('edit-theme-text-hex').value.trim() || '#F2EEE5';
  const glow = document.getElementById('edit-theme-glow')?.value || 60;
  const borderStyle = document.getElementById('edit-theme-border-style')?.value || 'rounded';
  const animEffect = document.getElementById('edit-theme-animation-effect')?.value || 'none';
  const themeId = currentEditingTheme.id;

  let borderRules = '';
  if (borderStyle === 'pill') {
    borderRules = `\nbody[data-theme="${themeId}"] .camera-frame,\nbody[data-theme="${themeId}"] .side-info-panel,\nbody[data-theme="${themeId}"] .bottom-project-bar {\n  border-radius: 14px !important;\n}`;
  } else if (borderStyle === 'square') {
    borderRules = `\nbody[data-theme="${themeId}"] .camera-frame,\nbody[data-theme="${themeId}"] .side-info-panel,\nbody[data-theme="${themeId}"] .bottom-project-bar {\n  border-radius: 0px !important;\n}`;
  } else if (borderStyle === 'double') {
    borderRules = `\nbody[data-theme="${themeId}"] .camera-frame,\nbody[data-theme="${themeId}"] .side-info-panel {\n  border: 2px solid ${cyan} !important;\n  box-shadow: 0 0 0 2px ${orange}66, 0 0 16px ${cyan}44 !important;\n}`;
  } else if (borderStyle === 'comic') {
    borderRules = `\nbody[data-theme="${themeId}"] .camera-frame,\nbody[data-theme="${themeId}"] .side-info-panel,\nbody[data-theme="${themeId}"] .bottom-project-bar {\n  border: 3px solid #111116 !important;\n  box-shadow: 4px 4px 0 #111116 !important;\n  border-radius: 2px !important;\n}`;
  } else if (borderStyle === 'blueprint') {
    borderRules = `\nbody[data-theme="${themeId}"] .camera-frame,\nbody[data-theme="${themeId}"] .side-info-panel {\n  border: 1.5px dashed ${cyan} !important;\n  box-shadow: inset 0 0 10px ${cyan}22, 0 0 12px ${cyan}44 !important;\n}`;
  }

  let animRules = '';
  if (animEffect === 'pulse') {
    animRules = `\nbody[data-theme="${themeId}"] .camera-frame {\n  animation: themePulse 3s ease-in-out infinite;\n}\n@keyframes themePulse {\n  0%, 100% { box-shadow: 0 0 ${Math.round(glow * 0.15)}px ${cyan}66; }\n  50% { box-shadow: 0 0 ${Math.round(glow * 0.35)}px ${cyan}cc; }\n}`;
  } else if (animEffect === 'scanner') {
    animRules = `\nbody[data-theme="${themeId}"] .camera-frame::after {\n  content: '';\n  position: absolute;\n  top: 0; left: 0; right: 0; height: 2px;\n  background: linear-gradient(90deg, transparent, ${cyan}, transparent);\n  animation: scanLaser 3s linear infinite;\n  pointer-events: none;\n}\n@keyframes scanLaser {\n  0% { top: 0%; opacity: 0; }\n  10% { opacity: 1; }\n  90% { opacity: 1; }\n  100% { top: 100%; opacity: 0; }\n}`;
  } else if (animEffect === 'shimmer') {
    animRules = `\nbody[data-theme="${themeId}"] .brand-badge {\n  animation: themeShimmer 4s ease-in-out infinite;\n}\n@keyframes themeShimmer {\n  0%, 100% { filter: brightness(1); }\n  50% { filter: brightness(1.25) drop-shadow(0 0 8px ${cyan}); }\n}`;
  } else if (animEffect === 'float') {
    animRules = `\nbody[data-theme="${themeId}"] .brand-badge {\n  animation: themeFloat 3.5s ease-in-out infinite;\n}\n@keyframes themeFloat {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-3px); }\n}`;
  }

  const generatedCss = `body[data-theme="${themeId}"] {
  --color-bg-dark: ${bg};
  --color-text-light: ${text};
  --color-accent-cyan: ${cyan};
  --color-accent-orange: ${orange};
  --color-panel-bg: rgba(46, 54, 59, 0.85);
  --color-text-dim: #8B969C;
  --color-border-cyan: ${cyan}66;
  --color-border-cyan-bright: ${cyan};
  --theme-glow: 0 0 ${Math.round(glow * 0.25)}px ${cyan}88;
}${borderRules}${animRules}`;

  const cssArea = document.getElementById('theme-code-css-textarea');
  if (cssArea) cssArea.value = generatedCss;

  currentEditingTheme.borderStyle = borderStyle;
  currentEditingTheme.animationEffect = animEffect;
  currentEditingTheme.glowIntensity = parseInt(glow, 10);

  // Actualizar también preview en vivo
  refreshThemePreview();
}

function refreshThemePreview() {
  const iframe = document.getElementById('theme-preview-iframe');
  if (!iframe) return;

  const sel = document.getElementById('select-preview-scene');
  const sceneKey = sel ? sel.value : 'game';
  const cleanKey = sceneKey.replace('screens/', '');
  const themeId = currentEditingTheme ? currentEditingTheme.id : currentActiveThemeId;
  const targetPath = `/scenes/${cleanKey}/index.html`;

  const injectStyles = () => {
    try {
      const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (!doc || !doc.body) return;

      doc.body.setAttribute('data-theme', themeId);

      const cyanHex = (document.getElementById('edit-theme-cyan-hex') || {}).value || '#57D6C4';
      const orangeHex = (document.getElementById('edit-theme-orange-hex') || {}).value || '#FF783F';
      const bgHex = (document.getElementById('edit-theme-bg-hex') || {}).value || '#191D21';
      const textHex = (document.getElementById('edit-theme-text-hex') || {}).value || '#F2EEE5';
      const glowVal = (document.getElementById('edit-theme-glow') || {}).value || 60;
      const cssArea = document.getElementById('theme-code-css-textarea');
      const customCss = (cssArea && cssArea.value) ? cssArea.value : '';

      let styleEl = doc.getElementById('live-theme-preview-style');
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = 'live-theme-preview-style';
        doc.head.appendChild(styleEl);
      }

      styleEl.textContent = `
        :root, body, body[data-theme="${themeId}"] {
          --color-bg-dark: ${bgHex} !important;
          --color-text-light: ${textHex} !important;
          --color-accent-cyan: ${cyanHex} !important;
          --color-accent-orange: ${orangeHex} !important;
          --color-panel-bg: rgba(46, 54, 59, 0.85) !important;
          --color-text-dim: #8B969C !important;
          --color-border-cyan: ${cyanHex}66 !important;
          --color-border-cyan-bright: ${cyanHex} !important;
          --theme-glow: 0 0 ${Math.round(glowVal * 0.25)}px ${cyanHex}88 !important;
        }
        ${customCss}
      `;
    } catch (e) {
      console.warn('Error inyectando estilo en preview:', e);
    }
  };

  const currentLoaded = iframe.getAttribute('data-loaded-path');
  if (currentLoaded !== targetPath) {
    iframe.setAttribute('data-loaded-path', targetPath);
    iframe.src = `${targetPath}?theme=${encodeURIComponent(themeId)}&_t=${Date.now()}`;
    iframe.onload = () => {
      setTimeout(injectStyles, 100);
    };
  } else {
    injectStyles();
  }
}

function updateLiveIframePreview(cyan, orange, bg, text) {
  refreshThemePreview();
}

function switchThemeEditorTab(tab) {
  ['css', 'json', 'preview'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const view = document.getElementById(`editor-view-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (view) view.style.display = (t === tab) ? 'block' : 'none';
  });
  if (tab === 'preview') {
    refreshThemePreview();
  }
}

function updatePreviewScene(scenePath) {
  refreshThemePreview();
}

function openFullscreenPreview() {
  const sel = document.getElementById('select-preview-scene');
  const scenePath = sel ? sel.value : 'game';
  const cleanKey = scenePath.replace('screens/', '');
  const themeId = currentEditingTheme ? currentEditingTheme.id : currentActiveThemeId;
  const url = `/scenes/${cleanKey}/index.html?theme=${encodeURIComponent(themeId)}`;
  window.open(url, '_blank');
}

// ====================================================================
// ANCLAJE Y DERIVACIÓN DE CHAT
// ====================================================================

function onChatAnchorCheckboxChange(anchored) {
  const info = document.getElementById('chat-anchored-info');
  const panel = document.getElementById('chat-derivative-panel');
  const lbl = document.getElementById('lbl-chat-anchor-state');

  if (anchored) {
    if (info) info.style.display = 'block';
    if (panel) panel.style.display = 'none';
    if (lbl) lbl.textContent = '🔗 Anclado al tema';
  } else {
    if (info) info.style.display = 'none';
    if (panel) panel.style.display = 'block';
    if (lbl) lbl.textContent = '✨ Derivado personalizado';
  }
}

function onDerivativeChange() {
  if (!currentEditingTheme) return;
  const shape = document.getElementById('edit-chat-shape').value;
  const opacity = document.getElementById('edit-chat-opacity').value;

  currentEditingTheme.chatDerivative = {
    name: `Derivado (${currentEditingTheme.name})`,
    shape: shape,
    bgOpacity: parseInt(opacity, 10),
    borderColor: document.getElementById('edit-theme-orange-hex').value,
    bgColor: document.getElementById('edit-theme-bg-hex').value
  };
}

async function reAnchorChat() {
  const cb = document.getElementById('edit-theme-chat-anchored');
  if (cb) cb.checked = true;
  onChatAnchorCheckboxChange(true);
  if (currentEditingTheme) {
    currentEditingTheme.chatAnchored = true;
    currentEditingTheme.chatDerivative = null;
  }
}

// ====================================================================
// GUARDADO Y PERSISTENCIA EN ARCHIVOS LOCALES
// ====================================================================

async function saveCurrentThemeChanges() {
  if (!currentEditingTheme || !currentEditingPackId) return;

  const name = document.getElementById('edit-theme-name').value.trim();
  const badge = document.getElementById('edit-theme-badge').value.trim();
  const cyan = document.getElementById('edit-theme-cyan-hex').value.trim();
  const orange = document.getElementById('edit-theme-orange-hex').value.trim();
  const bg = document.getElementById('edit-theme-bg-hex').value.trim();
  const text = document.getElementById('edit-theme-text-hex').value.trim();
  const border = document.getElementById('edit-theme-border-style').value;
  const glow = parseInt(document.getElementById('edit-theme-glow').value, 10);
  const isAnchored = document.getElementById('edit-theme-chat-anchored').checked;
  const css = document.getElementById('theme-code-css-textarea').value;

  const payload = {
    packId: currentEditingPackId,
    id: currentEditingTheme.id,
    name: name || currentEditingTheme.name,
    badge: badge || currentEditingTheme.badge,
    accentCyan: cyan,
    accentOrange: orange,
    bgDark: bg,
    textLight: text,
    borderStyle: border,
    glowIntensity: glow,
    chatAnchored: isAnchored,
    chatDerivative: isAnchored ? null : currentEditingTheme.chatDerivative,
    css: css
  };

  try {
    await API.saveTheme(payload);
    alert(`✓ ¡Tema "${payload.name}" guardado en streamthemes/${currentEditingPackId}/styles/${payload.id}/ y common/themes.css sincronizado!`);
    closeThemeEditor();
    await loadThemePacks();
  } catch (e) {
    alert('Error al guardar el tema.');
  }
}

async function applyCurrentThemeLive() {
  if (!currentEditingTheme || !currentEditingPackId) return;
  await saveCurrentThemeChanges();
  await activateTheme(currentEditingTheme.id, currentEditingPackId);
}

async function resetThemeCodeToDefaults() {
  if (!currentEditingTheme || !currentEditingPackId) return;
  const themeName = currentEditingTheme.name || currentEditingTheme.id;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('themes.confirm_restore_theme', `¿Restablecer el estilo "${themeName}" a sus colores y código CSS original de fábrica?\n\nSe revertirán todas las modificaciones guardadas en este tema.`, { name: themeName }))) {
    return;
  }

  try {
    const res = await API.restoreTheme(currentEditingPackId, currentEditingTheme.id);
    if (res && res.status === 'ok') {
      currentEditingTheme = Object.assign({}, currentEditingTheme, res.theme);
      currentEditingTheme.css = res.css || '';

      // Recargar campos del editor visual y editores de código
      populateVisualEditorFields(currentEditingTheme);
      const cssEditor = document.getElementById('theme-code-css-textarea');
      const jsonEditor = document.getElementById('theme-code-json-textarea');
      if (cssEditor) cssEditor.value = currentEditingTheme.css;
      if (jsonEditor) jsonEditor.value = JSON.stringify(currentEditingTheme, null, 2);

      // Recargar iframe de previsualización
      const previewIframe = document.getElementById('theme-preview-iframe');
      if (previewIframe && previewIframe.contentWindow) {
        previewIframe.contentWindow.location.reload();
      }

      await loadThemePacks();
      alert(`✓ ¡Estilo "${themeName}" restaurado con éxito a sus valores originales de fábrica!`);
    } else {
      alert(`⚠️ No se pudo restaurar: ${res.error || 'Error desconocido'}`);
    }
  } catch (err) {
    console.error('Error restaurando tema:', err);
    alert('⚠️ Error al comunicarse con el servidor para restaurar el tema.');
  }
}

// ====================================================================
// MODALES PARA CREAR PACK Y CREAR TEMA
// ====================================================================

function openNewPackModal() {
  const modal = document.getElementById('theme-new-pack-modal');
  const nameInput = document.getElementById('new-pack-name');
  if (nameInput) nameInput.value = '';
  if (modal) {
    modal.style.display = 'flex';
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(modal);
    }
  }
  setTimeout(() => nameInput && nameInput.focus(), 50);
}

function closeNewPackModal() {
  const modal = document.getElementById('theme-new-pack-modal');
  if (modal) modal.style.display = 'none';
}

async function submitCreatePack() {
  const name = document.getElementById('new-pack-name').value.trim();
  const icon = document.getElementById('new-pack-icon').value.trim() || '📁';
  const desc = document.getElementById('new-pack-desc').value.trim();

  if (!name) {
    alert('Introduce un nombre para el pack.');
    return;
  }

  try {
    await API.createThemePack({ name, icon, description: desc });
    closeNewPackModal();
    await loadThemePacks();
  } catch (e) {
    alert('Error al crear el pack de temas.');
  }
}

function openNewThemeModal() {
  const modal = document.getElementById('theme-new-theme-modal');
  const nameInput = document.getElementById('new-theme-name');
  if (nameInput) nameInput.value = '';
  if (modal) {
    modal.style.display = 'flex';
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(modal);
    }
  }
  setTimeout(() => nameInput && nameInput.focus(), 50);
}

function closeNewThemeModal() {
  const modal = document.getElementById('theme-new-theme-modal');
  if (modal) modal.style.display = 'none';
}

async function submitCreateTheme() {
  const name = document.getElementById('new-theme-name').value.trim();
  const accent = document.getElementById('new-theme-accent').value;

  if (!name) {
    alert('Introduce un nombre para el tema.');
    return;
  }

  const targetPack = currentOpenPackId || 'pack_open_stream_suite';

  try {
    const res = await API.createTheme({
      packId: targetPack,
      name: name,
      accentCyan: accent
    });

    closeNewThemeModal();
    await loadThemePacks();

    if (res.theme) {
      openThemeEditor(targetPack, res.theme.id);
    }
  } catch (e) {
    alert('Error al crear el tema en este pack.');
  }
}

// ====================================================================
// CATÁLOGO DE ESCENAS DE OBS Y GESTIÓN CONTEXTUAL DE TEXTOS Y AJUSTES
// ====================================================================

function switchThemesMainTab(tab) {
  const btnOverlays = document.getElementById('tab-btn-overlays');
  const btnThemes = document.getElementById('tab-btn-themes');
  const viewOverlays = document.getElementById('tab-view-overlays');
  const viewThemes = document.getElementById('tab-view-themes');

  if (btnOverlays) btnOverlays.classList.toggle('active', tab === 'overlays');
  if (btnThemes) btnThemes.classList.toggle('active', tab === 'themes');

  if (viewOverlays) viewOverlays.style.display = (tab === 'overlays') ? 'block' : 'none';
  if (viewThemes) viewThemes.style.display = (tab === 'themes') ? 'block' : 'none';

  if (tab === 'overlays') {
    renderThemeScenes();
  }
}

const OSS_SCENES = [
  // ==========================================
  // PACK 1: MAKER & TALLER (Maker_Theme_Pack)
  // ==========================================
  {
    key: 'maker-desk',
    packId: 'Maker_Theme_Pack',
    category: 'maker',
    name: 'Overlay: Escena Principal (Cámara + Webcam)',
    icon: '🛠️',
    path: '/streamthemes/Maker_Theme_Pack/overlays/maker/desk/index.html',
    badge: 'ESCENA PRINCIPAL · CÁMARA',
    desc: 'Escena principal con cámara frontal o aérea, barra inferior con fases del proyecto y ventana auxiliar.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/maker/desk/index.html'
  },
  {
    key: 'maker-pc',
    packId: 'Maker_Theme_Pack',
    category: 'maker',
    name: 'Overlay: Pantalla Compartida (PC + Webcam)',
    icon: '💻',
    path: '/streamthemes/Maker_Theme_Pack/overlays/maker/pc/index.html',
    badge: 'PANTALLA COMPARTIDA · PC',
    desc: 'Escena de pantalla compartida con barra inferior de fases activas y ventana para webcam/cámara.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/maker/pc/index.html'
  },
  {
    key: 'print-machine',
    packId: 'Maker_Theme_Pack',
    category: 'print',
    name: 'Overlay: Cámara Secundaria (Proceso / Acción)',
    icon: '🖨️',
    path: '/streamthemes/Maker_Theme_Pack/overlays/print/machine/index.html',
    badge: 'CÁMARA SECUNDARIA · PROCESO',
    desc: 'Cámara directa sobre el proceso o acción en curso, con indicador de estado y fases.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/print/machine/index.html'
  },
  {
    key: 'print-design',
    packId: 'Maker_Theme_Pack',
    category: 'print',
    name: 'Overlay: Pantalla Diseño / CAD (Full Screen)',
    icon: '📐',
    path: '/streamthemes/Maker_Theme_Pack/overlays/print/design/index.html',
    badge: 'PANTALLA COMPLETA · DISEÑO',
    desc: 'Pantalla completa para diseño, programación o cualquier app a pantalla completa con cámara secundaria.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/print/design/index.html'
  },
  {
    key: 'game',
    packId: 'Maker_Theme_Pack',
    category: 'stream',
    name: 'Overlay: Gameplay (Juego + Cámara)',
    icon: '🎮',
    path: '/streamthemes/Maker_Theme_Pack/overlays/game/index.html',
    badge: 'GAMEPLAY + WEBCAM',
    desc: 'Capa limpia para videojuegos. Marco de webcam en esquina con insignia técnica y soporte de alertas.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/game/index.html'
  },
  {
    key: 'chill',
    packId: 'Maker_Theme_Pack',
    category: 'stream',
    name: 'Overlay: Charla y Chat (Just Chatting)',
    icon: '💬',
    path: '/streamthemes/Maker_Theme_Pack/overlays/chill/index.html',
    badge: 'JUST CHATTING',
    desc: 'Cámara amplia con marco para el chat de Twitch en OBS y cinta inferior con el tema de conversación.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/chill/index.html'
  },
  {
    key: 'startingSoon',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Inicio de Stream (Starting Soon)',
    icon: '⏳',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/starting-soon/index.html',
    badge: 'INICIO DE EMISIÓN',
    desc: 'Pantalla completa de bienvenida con cuenta atrás regresiva, titular con acento neón y redes.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'beRightBack',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa Técnica (Be Right Back)',
    icon: '☕',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/be-right-back/index.html',
    badge: 'PAUSA TÉCNICA',
    desc: 'Pausa con escáner técnico animado y rotación automática de frases personalizables.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/screens/be-right-back/index.html'
  },
  {
    key: 'ending',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Despedida (Ending)',
    icon: '🎬',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/ending/index.html',
    badge: 'FIN DE TRANSMISIÓN',
    desc: 'Cierre de directo con tarjeta de agradecimiento a suscriptores, etiqueta de despedida y redes.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/screens/ending/index.html'
  },

  // ==========================================
  // PACK 2: OPEN STREAM SUITE (Open_stream_Pack)
  // ==========================================
  {
    key: 'oss_chatting',
    packId: 'Open_stream_Pack',
    category: 'chat',
    name: 'Overlay: Just Chatting & Talk',
    icon: '💬',
    path: '/streamthemes/Open_stream_Pack/overlays/just_chatting/index.html',
    badge: 'JUST CHATTING PRO',
    desc: 'Cámara amplia optimizada para interacción con el chat de Twitch, cinta informativa y widgets.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/just_chatting/index.html'
  },
  {
    key: 'oss_desktop',
    packId: 'Open_stream_Pack',
    category: 'screen',
    name: 'Overlay: Pantalla Compartida (Escritorio + PiP)',
    icon: '🖥️',
    path: '/streamthemes/Open_stream_Pack/overlays/desktop_share/index.html',
    badge: 'ESCRITORIO + WEBCAM',
    desc: 'Captura de monitor ultra nítida con webcam en ventana Picture-in-Picture personalizable.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/desktop_share/index.html'
  },
  {
    key: 'oss_podcast',
    packId: 'Open_stream_Pack',
    category: 'chat',
    name: 'Overlay: Podcast & Entrevista (Dual Cam)',
    icon: '🎙️',
    path: '/streamthemes/Open_stream_Pack/overlays/podcast_talk/index.html',
    badge: 'PODCAST & ENTREVISTA',
    desc: 'Dos marcos equilibrados de cámara para entrevistas, co-hosts o debate con rótulos.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/podcast_talk/index.html'
  },
  {
    key: 'oss_starting',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Inicio de Stream (Starting Soon)',
    icon: '⏳',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/index.html',
    badge: 'INICIO DE EMISIÓN',
    desc: 'Pantalla regresiva de espera previa con bienvenida neón y aviso de directo próximo.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'oss_brb',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa Técnica (Be Right Back)',
    icon: '⏸️',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/be-right-back/index.html',
    badge: 'PAUSA TÉCNICA',
    desc: 'Pausa intermedia con radar animado y mensajes dinámicos de regreso en breves minutos.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/screens/be-right-back/index.html'
  },
  {
    key: 'oss_ending',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Despedida y Créditos (Ending)',
    icon: '🎬',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/ending/index.html',
    badge: 'FIN DE TRANSMISIÓN',
    desc: 'Pantalla de cierre de emisión con agradecimientos y lista de próximas citas.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/screens/ending/index.html'
  },

  // ==========================================
  // PACK 3: GAMER PRO & ESPORTS (Gamer_Pro_Pack)
  // ==========================================
  {
    key: 'gamer_gameplay',
    packId: 'Gamer_Pro_Pack',
    category: 'game',
    name: 'Overlay: Gameplay HUD Táctico',
    icon: '🎯',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html',
    badge: 'GAMEPLAY HUD ESPORTS',
    desc: 'Marco biselado para webcam con HUD angular militar, indicadores de alertas y estado en vivo.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html'
  },
  {
    key: 'gamer_speedrun',
    packId: 'Gamer_Pro_Pack',
    category: 'game',
    name: 'Overlay: Speedrun & Splits HUD',
    icon: '⏱️',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/speedrun_split/index.html',
    badge: 'SPEEDRUN & SPLITS',
    desc: 'Panel lateral con cronómetro de segmentos, comparación de marcas (PB/WR) y webcam.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/speedrun_split/index.html'
  },
  {
    key: 'gamer_victory',
    packId: 'Gamer_Pro_Pack',
    category: 'event',
    name: 'Overlay: Victoria & Clutch Showcase',
    icon: '🏆',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/victory_clutch/index.html',
    badge: 'VICTORIA & CLUTCH',
    desc: 'Escena central para celebrar victorias épicas con animaciones doradas y laureles.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/victory_clutch/index.html'
  },
  {
    key: 'gamer_starting',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: Calentamiento & Start (Esports)',
    icon: '🚀',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/starting-soon/index.html',
    badge: 'CALENTAMIENTO · START',
    desc: 'Cuenta atrás táctica militar con radar y aviso de partida inminente.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'gamer_brb',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: Intermisión Táctica (Be Right Back)',
    icon: '🛑',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/be-right-back/index.html',
    badge: 'INTERMISIÓN TÁCTICA',
    desc: 'Pausa táctica entre partidas o mapas con radar de combate y estado de sesión.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/be-right-back/index.html'
  },
  {
    key: 'gamer_ending',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: GG & Fin de Partida (Ending)',
    icon: '👾',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/ending/index.html',
    badge: 'GG · FIN DE PARTIDA',
    desc: 'Despedida gamer con estadísticas finales del día, GG y agradecimientos.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/ending/index.html'
  },

  // ==========================================
  // PACK 4: COZY LO-FI & ARTE (Cozy_LoFi_Pack)
  // ==========================================
  {
    key: 'cozy_pomodoro',
    packId: 'Cozy_LoFi_Pack',
    category: 'study',
    name: 'Overlay: Study & Pomodoro (25:00)',
    icon: '📖',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/study_pomodoro/index.html',
    badge: 'POMODORO & ESTUDIO',
    desc: 'Temporizador Pomodoro integrado con ciclo activo de concentración y descanso con música lo-fi.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/study_pomodoro/index.html'
  },
  {
    key: 'cozy_art',
    packId: 'Cozy_LoFi_Pack',
    category: 'creative',
    name: 'Overlay: Arte & Lienzo Dual Cam',
    icon: '🎨',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/art_dual_cam/index.html',
    badge: 'ARTE & LIENZO DUAL',
    desc: 'Cámara cenital principal para ilustrar, pintar o escribir con webcam auxiliar en tonos pastel.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/art_dual_cam/index.html'
  },
  {
    key: 'cozy_cafe',
    packId: 'Cozy_LoFi_Pack',
    category: 'creative',
    name: 'Overlay: Café & Charla Chill',
    icon: '☕',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html',
    badge: 'CAFÉ & CHARLA CHILL',
    desc: 'Escena cálida y relajada para conversar con chat integrado y ambientación tranquila.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html'
  },
  {
    key: 'cozy_starting',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Bienvenida Acogedora (Starting Soon)',
    icon: '🌅',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/starting-soon/index.html',
    badge: 'BIENVENIDA ACOGEDORA',
    desc: 'Pantalla de inicio suave con cuenta atrás calmada y animación de vapor de café.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'cozy_brb',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa de Café (Coffee Break)',
    icon: '🫖',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/coffee-break/index.html',
    badge: 'PAUSA DE CAFÉ',
    desc: 'Pausa acogedora para recargar la taza de café o té y estirar las piernas.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/coffee-break/index.html'
  },
  {
    key: 'cozy_ending',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Hasta Pronto & Buenas Noches (Ending)',
    icon: '🌙',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/ending/index.html',
    badge: 'HASTA PRONTO · RELAX',
    desc: 'Despedida calmada con luces tenues, música tranquila y mensaje de buenas noches.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/ending/index.html'
  }
];

let currentEditingScene = null;
let currentSceneModalSubTab = 'texts';

function getThemeObjectById(themeId) {
  for (const p of cachedThemePacks) {
    for (const t of (p.themes || [])) {
      if (t.id === themeId) {
        return {
          id: t.id,
          name: t.name,
          pack: p.name,
          packId: p.id,
          accentCyan: t.accentCyan || '#57D6C4',
          accentOrange: t.accentOrange || '#FF783F',
          bgDark: t.bgDark || '#191D21',
          panelBg: t.panelBg || '#2E363B',
          textLight: t.textLight || '#FFFFFF',
          textDim: t.textDim || '#8B969C',
          glowIntensity: typeof t.glowIntensity === 'number' ? t.glowIntensity : 50,
          borderStyle: t.borderStyle || 'rounded',
          animationEffect: t.animationEffect || 'none'
        };
      }
    }
  }
  return {
    id: themeId || 'maker',
    name: 'Maker Electrónico',
    pack: 'Pack Open Stream Suite',
    packId: 'pack_open_stream_suite',
    accentCyan: '#57D6C4',
    accentOrange: '#FF783F',
    bgDark: '#191D21',
    panelBg: '#2E363B',
    textLight: '#F2EEE5',
    textDim: '#8B969C',
    glowIntensity: 50,
    borderStyle: 'rounded',
    animationEffect: 'none'
  };
}

function getThemeDisplayNameById(themeId) {
  const obj = getThemeObjectById(themeId);
  return { id: obj.id, name: obj.name, pack: obj.pack, packId: obj.packId };
}

function getActiveThemeDisplayName() {
  return getThemeDisplayNameById(currentActiveThemeId);
}

function buildThemeOptionsHtml(selectedThemeId, defaultThemeId) {
  let optionsHtml = '';
  cachedThemePacks.forEach(p => {
    optionsHtml += `<optgroup label="${p.name}">`;
    (p.themes || []).forEach(t => {
      const isSel = (t.id === selectedThemeId) ? 'selected' : '';
      const isDefault = (defaultThemeId && t.id === defaultThemeId);
      const defaultTag = isDefault ? ' ⭐ (Original de fábrica)' : '';
      optionsHtml += `<option value="${t.id}" data-pack="${p.id}" ${isSel}>${t.name}${defaultTag}</option>`;
    });
    optionsHtml += `</optgroup>`;
  });
  return optionsHtml;
}

function buildSceneMiniMockupHtml(sceneKey, theme) {
  const glow = Math.round((theme.glowIntensity || 50) * 0.25);
  let bRadius = '6px';
  let bStyle = `2px solid ${theme.accentCyan || '#57D6C4'}`;
  let bShadow = `0 0 ${glow}px ${theme.accentCyan || '#57D6C4'}80`;

  if (theme.borderStyle === 'square') {
    bRadius = '0px';
  } else if (theme.borderStyle === 'pill') {
    bRadius = '14px';
  } else if (theme.borderStyle === 'double') {
    bRadius = '4px';
    bShadow = `0 0 0 2px ${theme.accentOrange || '#FF783F'}, 0 0 ${glow}px ${theme.accentCyan || '#57D6C4'}80`;
  } else if (theme.borderStyle === 'comic') {
    bRadius = '2px';
    bStyle = '3px solid #111116';
    bShadow = '4px 4px 0 #111116';
  } else if (theme.borderStyle === 'blueprint') {
    bRadius = '0px';
    bStyle = `1.5px dashed ${theme.accentCyan || '#00D2FF'}`;
    bShadow = `inset 0 0 8px ${theme.accentCyan || '#00D2FF'}33, 0 0 10px ${theme.accentCyan || '#00D2FF'}55`;
  }

  return `
    <div id="scene-card-preview-${sceneKey}" style="
      background: ${theme.bgDark || '#191D21'};
      border: ${bStyle};
      box-shadow: ${bShadow};
      border-radius: ${bRadius};
      height: 96px;
      margin: 8px 0;
      padding: 7px 10px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 8px; font-weight: 800; color: ${theme.accentCyan}; font-family: monospace; background: rgba(0,0,0,0.55); padding: 1px 5px; border-radius: 2px; border: 1px solid ${theme.accentCyan}80;">
          VISTA RÁPIDA OBS
        </span>
        <span style="font-size: 8px; color: ${theme.accentOrange}; font-weight: 800;">
          ● EN DIRECTO
        </span>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 38px; height: 32px; border: 1.5px solid ${theme.accentCyan}; box-shadow: 0 0 6px ${theme.accentCyan}40; border-radius: 3px; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-size: 12px;">
          📹
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          <div style="height: 5px; width: 80%; background: ${theme.textLight}; opacity: 0.9; border-radius: 2px;"></div>
          <div style="height: 4px; width: 50%; background: ${theme.accentOrange}; border-radius: 2px;"></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 3px;">
        <span style="font-size: 8px; color: ${theme.textDim}; font-family: monospace;">1920×1080</span>
        <span style="font-size: 8px; font-weight: 800; color: ${theme.accentCyan};">${theme.name}</span>
      </div>
    </div>
  `;
}

function populateGlobalThemeSelect() {
  const sel = document.getElementById('select-global-theme-all');
  if (!sel) return;
  sel.innerHTML = buildThemeOptionsHtml(currentActiveThemeId);
}

async function applyThemeToAllScenesFromBar() {
  const sel = document.getElementById('select-global-theme-all');
  if (!sel || !sel.value) return;
  const chosenTheme = sel.value;
  const themeObj = getThemeObjectById(chosenTheme);

  for (const s of OSS_SCENES) {
    cachedOverlayThemes[s.key] = chosenTheme;
    try {
      await API.setOverlayTheme(s.key, chosenTheme);
    } catch (e) {}
  }
  renderThemeScenes();

  if (window.OverlayTexts && OverlayTexts.showToast) {
    OverlayTexts.showToast(`✓ Estilo "${themeObj.name}" aplicado a todas las 9 escenas en OBS Studio`, 'success');
  }
}

const OVERLAY_FOLDERS = [
  {
    id: 'maker_theme_pack',
    packId: 'Maker_Theme_Pack',
    name: 'Pack Maker & Taller',
    icon: '🛠️',
    badge: '9 OVERLAYS · TALLER & MAKER',
    path: 'streamthemes/Maker_Theme_Pack/overlays/*',
    desc: 'Carpeta insignia para creadores, talleres, electrónica, programación CAD e impresión 3D con 9 pantallas listas.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (9)', cat: 'all' },
      { id: 'maker', label: '🛠️ Mesa & PC (2)', cat: 'maker' },
      { id: 'print', label: '📷 Cámara Secundaria (2)', cat: 'print' },
      { id: 'stream', label: '🎮 Directo & Charla (2)', cat: 'stream' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Escena Principal (Cámara)', icon: '🎥', desc: 'Cámara principal con barra de fases y ventana auxiliar' },
      { name: 'PC & Código (Terminal)', icon: '💻', desc: 'Pantalla completa de programación o CAD y cámara de apoyo' },
      { name: 'Cámara Secundaria (Proceso)', icon: '📷', desc: 'Cámara directa sobre el proceso en curso con indicador de estado' },
      { name: 'Diseño CAD & Slicer', icon: '📐', desc: 'Modelado 3D (Fusion, FreeCAD) o laminado slicer con webcam' },
      { name: 'Gameplay & Cámara', icon: '🎮', desc: 'Capa limpia para juegos con cámara técnica y alertas' },
      { name: 'Charla & Chat (Just Chatting)', icon: '💬', desc: 'Cámara amplia, caja de Twitch chat integrada y tema' },
      { name: 'Pantallas de Emisión (3)', icon: '📺', desc: 'Starting Soon regresivo, Pausa BRB y Despedida Ending' }
    ],
    keys: ['maker-desk', 'maker-pc', 'print-machine', 'print-design', 'game', 'chill', 'startingSoon', 'beRightBack', 'ending']
  },
  {
    id: 'open_stream_pack',
    packId: 'Open_stream_Pack',
    name: 'Pack Open Stream (General)',
    icon: '⚡',
    badge: '6 OVERLAYS · STREAMING PRO',
    path: 'streamthemes/Open_stream_Pack/overlays/*',
    desc: 'Pack moderno todo-en-uno para streamers generales, variedad, podcasts, charlas y pantallas de emisión completas.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (6)', cat: 'all' },
      { id: 'chat', label: '💬 Charla & Podcast (2)', cat: 'chat' },
      { id: 'screen', label: '🖥️ Pantalla Compartida (1)', cat: 'screen' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Just Chatting & Talk', icon: '💬', desc: 'Cámara amplia con caja de chat interactivo Twitch y widgets' },
      { name: 'Pantalla Compartida', icon: '🖥️', desc: 'Captura de monitor con PiP de webcam en marco flotante' },
      { name: 'Podcast & Entrevista', icon: '🎙️', desc: 'Dos cámaras equilibradas para entrevistas y co-hosts con rótulos' },
      { name: 'Inicio de Emisión', icon: '⏳', desc: 'Cuenta atrás regresiva de bienvenida con acento neón' },
      { name: 'Pausa Técnica', icon: '⏸️', desc: 'Pausa intermedia con radar animado y mensajes dinámicos' },
      { name: 'Fin de Stream', icon: '🎬', desc: 'Pantalla de cierre de directo con agradecimientos y redes' }
    ],
    keys: ['oss_chatting', 'oss_desktop', 'oss_podcast', 'oss_starting', 'oss_brb', 'oss_ending']
  },
  {
    id: 'gamer_pro_pack',
    packId: 'Gamer_Pro_Pack',
    name: 'Pack Gamer Pro & Esports',
    icon: '🎮',
    badge: '6 OVERLAYS · ESPORTS & HUD',
    path: 'streamthemes/Gamer_Pro_Pack/overlays/*',
    desc: 'Estética HUD táctica militar, bordes angulares biselados y alta adrenalina para gaming competitivo y speedruns.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (6)', cat: 'all' },
      { id: 'game', label: '🎯 Gameplay & HUD (2)', cat: 'game' },
      { id: 'event', label: '🏆 Victoria & Clutch (1)', cat: 'event' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Gameplay HUD Táctico', icon: '🎯', desc: 'Marco biselado para webcam con HUD angular militar y alertas' },
      { name: 'Speedrun & Splits', icon: '⏱️', desc: 'Panel lateral de splits, cronómetro de segmentos y webcam' },
      { name: 'Victoria & Clutch', icon: '🏆', desc: 'Cámara central épica con laureles de victoria y animaciones' },
      { name: 'Calentamiento & Start', icon: '🚀', desc: 'Cuenta regresiva táctica de preparación de partida' },
      { name: 'Intermisión Táctica', icon: '🛑', desc: 'Pausa de torneo/partida con radar y estado del equipo' },
      { name: 'GG & Fin de Partida', icon: '👾', desc: 'Despedida con resumen de estadísticas y créditos' }
    ],
    keys: ['gamer_gameplay', 'gamer_speedrun', 'gamer_victory', 'gamer_starting', 'gamer_brb', 'gamer_ending']
  },
  {
    id: 'cozy_lofi_pack',
    packId: 'Cozy_LoFi_Pack',
    name: 'Pack Cozy Lo-Fi & Arte',
    icon: '☕',
    badge: '6 OVERLAYS · CHILL & RELAX',
    path: 'streamthemes/Cozy_LoFi_Pack/overlays/*',
    desc: 'Bordes redondeados, tonos pastel y atmósfera relajante para estudio, dibujo digital, café y música lo-fi.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (6)', cat: 'all' },
      { id: 'study', label: '📖 Pomodoro & Estudio (1)', cat: 'study' },
      { id: 'creative', label: '🎨 Arte & Charla (2)', cat: 'creative' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Study & Pomodoro (25:00)', icon: '📖', desc: 'Temporizador Pomodoro integrado con ciclo de concentración y descanso' },
      { name: 'Arte & Lienzo Dual Cam', icon: '🎨', desc: 'Cámara cenital sobre el lienzo/tableta y webcam de apoyo' },
      { name: 'Café & Charla Chill', icon: '☕', desc: 'Escena acogedora para conversar con música de fondo suave' },
      { name: 'Bienvenida Acogedora', icon: '🌅', desc: 'Pantalla de inicio con cuenta atrás suave y vapor de café' },
      { name: 'Pausa de Café', icon: '🫖', desc: 'Pausa para estirar y recargar la taza de té o café' },
      { name: 'Hasta Pronto & Buenas Noches', icon: '🌙', desc: 'Despedida con luces tenues y música relajante' }
    ],
    keys: ['cozy_pomodoro', 'cozy_art', 'cozy_cafe', 'cozy_starting', 'cozy_brb', 'cozy_ending']
  }
];

let currentOpenOverlayFolderId = null;
let currentFolderSubFilter = 'all';

function showOverlayFoldersView() {
  currentOpenOverlayFolderId = null;
  renderOverlayFolders();
}

function openOverlayFolder(folderId) {
  currentOpenOverlayFolderId = folderId || 'maker_theme_pack';
  currentFolderSubFilter = 'all';
  renderOverlayFolders();
}

function filterFolderSubCategory(cat) {
  currentFolderSubFilter = cat || 'all';
  const folder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId) || OVERLAY_FOLDERS[0];
  document.querySelectorAll('.folder-subfilter-pill').forEach(btn => {
    const isTarget = btn.id === `subfilter-pill-${cat}`;
    btn.classList.toggle('active', isTarget);
    if (isTarget) {
      btn.style.borderColor = 'var(--color-accent-cyan)';
      btn.style.color = 'var(--color-accent-cyan)';
      btn.style.background = 'rgba(87, 214, 196, 0.15)';
    } else {
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.background = '';
    }
  });
  renderOverlayFolders();
}

async function applyThemeToAllOverlaysFromFolderCard(folderId = 'maker_theme_pack') {
  const sel = document.getElementById(`folder-theme-select-${folderId}`) || document.getElementById('select-global-theme-all');
  if (!sel || !sel.value) return;
  const chosenTheme = sel.value;
  const themeObj = getThemeObjectById(chosenTheme);

  const folder = OVERLAY_FOLDERS.find(f => f.id === folderId) || OVERLAY_FOLDERS[0];
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

async function restoreFolderThemes(folderId) {
  const folder = OVERLAY_FOLDERS.find(f => f.id === folderId);
  if (!folder) return;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('themes.confirm_restore_folder_themes', `¿Restaurar todos los overlays de la carpeta "${folder.name}" a sus estilos originales de fábrica?`, { name: folder.name }))) return;
  for (const k of folder.keys) {
    const def = DEFAULT_OVERLAY_THEMES[k] || 'maker';
    cachedOverlayThemes[k] = def;
    try {
      await API.setOverlayTheme(k, def);
    } catch (e) {}
  }
  renderOverlayFolders();
  if (window.OverlayTexts && OverlayTexts.showToast) {
    const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  OverlayTexts.showToast(tr('themes.toast_folder_themes_restored', `↺ Overlays de "${folder.name}" restauradas a sus estilos originales`, { name: folder.name }), 'success');
  }
}

async function restoreFolderTexts(folderId) {
  const folder = OVERLAY_FOLDERS.find(f => f.id === folderId);
  if (!folder) return;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('themes.confirm_restore_folder_texts', `¿Restaurar todos los textos de la carpeta "${folder.name}" a los valores originales de fábrica?`, { name: folder.name }))) return;
  if (window.OverlayTexts) {
    for (const k of folder.keys) {
      try {
        await OverlayTexts.reset(k);
      } catch (e) {}
    }
    if (OverlayTexts.showToast) {
      const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  OverlayTexts.showToast(tr('themes.toast_folder_texts_restored', `↺ Textos de "${folder.name}" restaurados a sus valores de fábrica`, { name: folder.name }), 'success');
    }
  }
}

async function restoreCurrentFolderThemes() {
  if (!currentOpenOverlayFolderId) return;
  await restoreFolderThemes(currentOpenOverlayFolderId);
}

function getSceneLocalized(s) {
  if (!s) return s;
  if (window.i18n && typeof window.i18n.tr === 'function') {
    const nameKey = `scene_catalog.${s.key}.name`;
    const badgeKey = `scene_catalog.${s.key}.badge`;
    const descKey = `scene_catalog.${s.key}.desc`;
    const name = window.i18n.tr(nameKey);
    const badge = window.i18n.tr(badgeKey);
    const desc = window.i18n.tr(descKey);
    return {
      ...s,
      name: (name && name !== nameKey) ? name : s.name,
      badge: (badge && badge !== badgeKey) ? badge : s.badge,
      desc: (desc && desc !== descKey) ? desc : s.desc
    };
  }
  return s;
}

function getFolderLocalized(f) {
  if (!f) return f;
  if (window.i18n && typeof window.i18n.tr === 'function') {
    const nameKey = `folder_catalog.${f.id}.name`;
    const badgeKey = `folder_catalog.${f.id}.badge`;
    const descKey = `folder_catalog.${f.id}.desc`;
    const name = window.i18n.tr(nameKey);
    const badge = window.i18n.tr(badgeKey);
    const desc = window.i18n.tr(descKey);

    const subfilters = (f.subfilters || []).map(sf => {
      const sfKey = `folder_catalog.${f.id}.subfilters.${sf.id}`;
      const sfLabel = window.i18n.tr(sfKey);
      return {
        ...sf,
        label: (sfLabel && sfLabel !== sfKey) ? sfLabel : sf.label
      };
    });

    const activities = (f.activities || []).map((act, idx) => {
      const actNameKey = `folder_catalog.${f.id}.activities.${idx}.name`;
      const actDescKey = `folder_catalog.${f.id}.activities.${idx}.desc`;
      const actName = window.i18n.tr(actNameKey);
      const actDesc = window.i18n.tr(actDescKey);
      return {
        ...act,
        name: (actName && actName !== actNameKey) ? actName : act.name,
        desc: (actDesc && actDesc !== actDescKey) ? actDesc : act.desc
      };
    });

    return {
      ...f,
      name: (name && name !== nameKey) ? name : f.name,
      badge: (badge && badge !== badgeKey) ? badge : f.badge,
      desc: (desc && desc !== descKey) ? desc : f.desc,
      subfilters,
      activities
    };
  }
  return f;
}

function renderOverlayFolders() {
  populateGlobalThemeSelect();

  const foldersView = document.getElementById('overlays-folders-view');
  const detailsView = document.getElementById('overlays-folder-details-view');
  const breadcrumbs = document.getElementById('overlays-breadcrumbs');
  const btnBack = document.getElementById('overlays-btn-back-folders');
  const foldersGrid = document.getElementById('overlays-folders-grid');
  const scenesGrid = document.getElementById('overlays-scenes-in-folder-grid');
  const subfilterContainer = document.getElementById('folder-subfilter-container');

  if (currentOpenOverlayFolderId) {
    const rawFolder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId) || OVERLAY_FOLDERS[0];
    const folder = getFolderLocalized(rawFolder);

    if (foldersView) foldersView.style.display = 'none';
    if (detailsView) detailsView.style.display = 'block';
    if (btnBack) btnBack.style.display = 'inline-flex';

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
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(detailsView);
    }
  } else {
    if (foldersView) foldersView.style.display = 'block';
    if (detailsView) detailsView.style.display = 'none';
    if (btnBack) btnBack.style.display = 'none';

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

function updateModalMiniPreview(themeId) {
  if (!currentEditingScene) return;
  const tId = themeId || (cachedOverlayThemes[currentEditingScene.key]) || currentActiveThemeId;
  const theme = getThemeObjectById(tId);

  const frame = document.getElementById('scene-modal-preview-frame');
  if (!frame) return;

  const isRounded = theme.borderStyle === 'rounded';
  const isSquare = theme.borderStyle === 'square';
  const bRadius = isRounded ? '8px' : (isSquare ? '0px' : '4px');
  const camRadius = isRounded ? '6px' : (isSquare ? '0px' : '3px');
  const glow = Math.round((theme.glowIntensity || 50) * 0.3);

  frame.style.background = theme.bgDark;
  frame.style.borderColor = theme.accentCyan;
  frame.style.boxShadow = `0 0 ${glow}px ${theme.accentCyan}70`;
  frame.style.borderRadius = bRadius;

  const cam = document.getElementById('preview-frame-camera');
  if (cam) {
    cam.style.borderColor = theme.accentCyan;
    cam.style.boxShadow = `0 0 10px ${theme.accentCyan}40`;
    cam.style.borderRadius = camRadius;
  }

  // Obtener valores en tiempo real de los inputs
  const brandVal = document.getElementById('txt-channel-name')?.value?.trim() || 'ANDORINA';
  const tagVal = document.getElementById('txt-channel-tagline')?.value?.trim() || '// OPEN STREAM SUITE';
  const liveVal = document.getElementById('txt-channel-live-text')?.value?.trim() || 'EN DIRECTO';

  let titleVal = currentEditingScene.name;
  let subtitleVal = currentEditingScene.badge;

  const key = currentEditingScene.key;
  if (key === 'maker' || key === 'maker-desk' || key === 'maker-pc' || key === 'oss_desktop') {
    titleVal = document.getElementById('txt-maker-project')?.value?.trim() || 'PROYECTO';
    const phaseVal = document.getElementById('txt-maker-phase')?.value?.trim() || 'FASE ACTIVA';
    const detVal = document.getElementById('txt-maker-detail')?.value?.trim() || '';
    subtitleVal = `Fase: ${phaseVal}${detVal ? ' · ' + detVal : ''}`;
  } else if (key === 'game' || key === 'gamer_gameplay' || key === 'gamer_speedrun' || key === 'gamer_victory') {
    titleVal = document.getElementById('txt-game-badge')?.value?.trim() || 'GAME MODE';
    subtitleVal = document.getElementById('txt-game-tagline')?.value?.trim() || 'MODO JUEGO / GAMEPLAY';
  } else if (key === 'print' || key === 'print-machine' || key === 'print-design' || key === 'cozy_art') {
    titleVal = document.getElementById('txt-print-project')?.value?.trim() || 'TRABAJO CREATIVO';
    const matVal = document.getElementById('txt-print-material')?.value?.trim() || 'Material';
    const phaseVal = document.getElementById('txt-print-phase')?.value?.trim() || 'PROCESO';
    subtitleVal = `${matVal} · Fase: ${phaseVal}`;
  } else if (key === 'chill' || key === 'oss_chatting' || key === 'oss_podcast' || key === 'cozy_cafe') {
    titleVal = document.getElementById('txt-chill-chat-title')?.value?.trim() || 'CHAT EN DIRECTO';
    subtitleVal = document.getElementById('txt-chill-topic')?.value?.trim() || 'Charla con la comunidad';
  } else if (key === 'startingSoon' || key === 'oss_starting' || key === 'gamer_starting' || key === 'cozy_starting' || key === 'cozy_pomodoro') {
    titleVal = document.getElementById('txt-ss-title')?.value?.trim() || 'ENSEGUIDA';
    subtitleVal = document.getElementById('txt-ss-subtitle')?.value?.trim() || 'PREPARANDO EL DIRECTO...';
  } else if (key === 'beRightBack' || key === 'oss_brb' || key === 'gamer_brb' || key === 'cozy_brb') {
    titleVal = document.getElementById('txt-brb-title')?.value?.trim() || 'AHORA VUELVO';
    subtitleVal = document.getElementById('txt-brb-subtitle')?.value?.trim() || 'PAUSA TÉCNICA';
  } else if (key === 'ending' || key === 'oss_ending' || key === 'gamer_ending' || key === 'cozy_ending') {
    titleVal = document.getElementById('txt-end-title')?.value?.trim() || 'GRACIAS POR PASARTE';
    subtitleVal = document.getElementById('txt-end-subtitle')?.value?.trim() || 'NOS VEMOS EN EL PRÓXIMO DIRECTO';
  }

  const brandEl = document.getElementById('preview-frame-brand');
  const tagEl = document.getElementById('preview-frame-tagline');
  const liveEl = document.getElementById('preview-frame-live');
  const camLabelEl = document.getElementById('preview-frame-cam-label');
  const badgeEl = document.getElementById('preview-frame-badge');
  const titleEl = document.getElementById('preview-frame-title');
  const subEl = document.getElementById('preview-frame-subtitle');
  const themeTagEl = document.getElementById('preview-frame-theme-tag');
  const packTagEl = document.getElementById('preview-frame-pack-tag');
  const botProjectEl = document.getElementById('preview-frame-bottom-project');

  if (brandEl) { brandEl.textContent = brandVal; brandEl.style.color = theme.textLight; }
  if (tagEl) { tagEl.textContent = tagVal; tagEl.style.color = theme.textDim; }
  if (liveEl) { liveEl.innerHTML = `<span style="font-size: 8px;">●</span> ${liveVal}`; liveEl.style.color = theme.accentOrange; }
  if (camLabelEl) { camLabelEl.style.color = theme.accentCyan; }
  if (badgeEl) { badgeEl.textContent = currentEditingScene.badge; badgeEl.style.color = theme.accentCyan; }
  if (titleEl) { titleEl.textContent = titleVal; titleEl.style.color = theme.textLight; }
  if (subEl) { subEl.textContent = subtitleVal; subEl.style.color = theme.textDim; }
  if (themeTagEl) { themeTagEl.textContent = theme.name; themeTagEl.style.color = theme.accentCyan; }
  if (packTagEl) { packTagEl.textContent = (theme.pack || 'PACK').toUpperCase(); packTagEl.style.color = theme.accentOrange; }
  if (botProjectEl) { botProjectEl.textContent = titleVal; botProjectEl.style.color = theme.accentCyan; }
}

async function openSceneEditor(sceneKey) {
  const scene = OSS_SCENES.find(s => s.key === sceneKey);
  if (!scene) return;
  currentEditingScene = scene;

  // 1. Mostrar de inmediato el modal para respuesta táctil instantánea
  const modal = document.getElementById('scene-editor-modal');
  if (modal) {
    modal.style.display = 'flex';
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(modal);
    }
  }

  // 2. Actualizar textos en la cabecera del modal
  const mIcon = document.getElementById('scene-modal-icon');
  const mTitle = document.getElementById('scene-modal-title');
  const mPath = document.getElementById('scene-modal-path');
  const obsUrl = document.getElementById('obs-guide-url');
  const subtabTexts = document.getElementById('scene-subtab-texts');

  if (mIcon) mIcon.textContent = scene.icon;
  if (mTitle) mTitle.textContent = `Textos de la ${scene.name}`;
  if (mPath) mPath.textContent = scene.path;
  if (obsUrl) obsUrl.textContent = `${window.location.origin}${scene.path}`;
  if (subtabTexts) subtabTexts.textContent = `📝 Textos: ${scene.name.split(':')[1] ? scene.name.split(':')[1].trim() : scene.name}`;

  // 3. Actualizar información del estilo visual enlazado específicamente a esta escena
  const assignedThemeId = cachedOverlayThemes[sceneKey] || currentActiveThemeId;
  const defaultThemeId = DEFAULT_OVERLAY_THEMES[sceneKey] || 'maker';
  const defaultInfo = getThemeDisplayNameById(defaultThemeId);
  const isModified = (assignedThemeId !== defaultThemeId);

  const themeSelect = document.getElementById('scene-modal-theme-select');
  const defaultHintEl = document.getElementById('scene-modal-default-theme-hint');

  if (themeSelect) themeSelect.innerHTML = buildThemeOptionsHtml(assignedThemeId, defaultThemeId);
  if (defaultHintEl) {
    defaultHintEl.innerHTML = isModified
      ? `⚠️ Personalizado (Original: <b>${defaultInfo.name}</b>) <button type="button" class="btn-action-test" style="font-size: 10px; padding: 2px 7px; margin-left: 6px; color: #FF783F; border-color: #FF783F; cursor: pointer; background: rgba(255,120,63,0.15);" onclick="restoreOverlayThemeFromModal()">🔄 Restaurar Original</button>`
      : `⭐ Original de fábrica: <b>${defaultInfo.name}</b>`;
  }

  // 4. Mostrar únicamente el panel de textos correspondiente a esta escena
  const paneMapping = {
    // Maker_Theme_Pack
    'game': 'text-pane-game',
    'maker': 'text-pane-maker',
    'maker-desk': 'text-pane-maker',
    'maker-pc': 'text-pane-maker',
    'print': 'text-pane-print',
    'print-machine': 'text-pane-print',
    'print-design': 'text-pane-print',
    'chill': 'text-pane-chill',
    'startingSoon': 'text-pane-starting',
    'beRightBack': 'text-pane-brb',
    'ending': 'text-pane-ending',

    // Open_stream_Pack
    'oss_chatting': 'text-pane-chill',
    'oss_desktop': 'text-pane-maker',
    'oss_podcast': 'text-pane-chill',
    'oss_starting': 'text-pane-starting',
    'oss_brb': 'text-pane-brb',
    'oss_ending': 'text-pane-ending',

    // Gamer_Pro_Pack
    'gamer_gameplay': 'text-pane-game',
    'gamer_speedrun': 'text-pane-game',
    'gamer_victory': 'text-pane-game',
    'gamer_starting': 'text-pane-starting',
    'gamer_brb': 'text-pane-brb',
    'gamer_ending': 'text-pane-ending',

    // Cozy_LoFi_Pack
    'cozy_pomodoro': 'text-pane-starting',
    'cozy_art': 'text-pane-print',
    'cozy_cafe': 'text-pane-chill',
    'cozy_starting': 'text-pane-starting',
    'cozy_brb': 'text-pane-brb',
    'cozy_ending': 'text-pane-ending'
  };

  let targetPaneId = paneMapping[sceneKey];
  if (!targetPaneId) {
    if (sceneKey.includes('starting') || sceneKey.includes('soon')) targetPaneId = 'text-pane-starting';
    else if (sceneKey.includes('brb') || sceneKey.includes('coffee') || sceneKey.includes('pause')) targetPaneId = 'text-pane-brb';
    else if (sceneKey.includes('end') || sceneKey.includes('farewell')) targetPaneId = 'text-pane-ending';
    else if (sceneKey.includes('chat') || sceneKey.includes('podcast') || sceneKey.includes('talk') || sceneKey.includes('cafe')) targetPaneId = 'text-pane-chill';
    else if (sceneKey.includes('game') || sceneKey.includes('play') || sceneKey.includes('victory') || sceneKey.includes('speedrun')) targetPaneId = 'text-pane-game';
    else if (sceneKey.includes('print') || sceneKey.includes('art')) targetPaneId = 'text-pane-print';
    else targetPaneId = 'text-pane-maker';
  }

  document.querySelectorAll('#scene-view-texts-pane .text-tab-pane').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  const activePane = document.getElementById(targetPaneId);
  if (activePane) {
    activePane.classList.add('active');
    activePane.style.display = 'block';
  }

  // 5. Activar subtab 'texts' por defecto
  switchSceneModalSubTab('texts');

  // 6. Cargar datos actualizados en el formulario
  if (window.OverlayTexts) {
    try {
      await OverlayTexts.load();
    } catch (e) {
      console.warn('Error en OverlayTexts.load():', e);
    }
  }

  // 7. Enlazar eventos de tipeo en vivo para actualizar el mini preview instantáneamente
  if (modal) {
    const modalInputs = modal.querySelectorAll('input, textarea');
    modalInputs.forEach(inp => {
      if (!inp.__previewBound) {
        inp.addEventListener('input', () => updateModalMiniPreview());
        inp.__previewBound = true;
      }
    });
  }

  // 8. Actualizar de inmediato la vista previa con el estilo y textos actuales
  updateModalMiniPreview(assignedThemeId);
}

async function onSceneModalThemeChange(themeId) {
  if (currentEditingScene) {
    await onOverlayThemeChange(currentEditingScene.key, themeId);
    const defaultThemeId = DEFAULT_OVERLAY_THEMES[currentEditingScene.key] || 'maker';
    const defaultInfo = getThemeDisplayNameById(defaultThemeId);
    const isModified = (themeId !== defaultThemeId);

    const defaultHintEl = document.getElementById('scene-modal-default-theme-hint');
    if (defaultHintEl) {
      defaultHintEl.innerHTML = isModified
        ? `⚠️ Personalizado (Original: <b>${defaultInfo.name}</b>) <button type="button" class="btn-action-test" style="font-size: 10px; padding: 2px 7px; margin-left: 6px; color: #FF783F; border-color: #FF783F; cursor: pointer; background: rgba(255,120,63,0.15);" onclick="restoreOverlayThemeFromModal()">🔄 Restaurar Original</button>`
        : `⭐ Original de fábrica: <b>${defaultInfo.name}</b>`;
    }

    updateModalMiniPreview(themeId);
  }
}

async function restoreOverlayThemeFromModal() {
  if (!currentEditingScene) return;
  const defaultThemeId = DEFAULT_OVERLAY_THEMES[currentEditingScene.key] || 'maker';
  const themeSelect = document.getElementById('scene-modal-theme-select');
  if (themeSelect) themeSelect.value = defaultThemeId;
  await onSceneModalThemeChange(defaultThemeId);
}

function goToThemeEditorFromModal() {
  const themeSelect = document.getElementById('scene-modal-theme-select');
  const themeId = (themeSelect && themeSelect.value) ? themeSelect.value : (currentEditingScene && cachedOverlayThemes[currentEditingScene.key]) || currentActiveThemeId;
  closeSceneEditor();
  openThemeEditorByThemeId(themeId);
}

function openSceneEditorFromTheme(themeOrSceneKey) {
  closeThemeEditor();
  const matchingScenes = OSS_SCENES.filter(sc => (cachedOverlayThemes[sc.key] || currentActiveThemeId) === themeOrSceneKey);
  if (matchingScenes.length > 0) {
    switchThemesMainTab('overlays');
    openSceneEditor(matchingScenes[0].key);
  } else if (OSS_SCENES.some(sc => sc.key === themeOrSceneKey)) {
    switchThemesMainTab('overlays');
    openSceneEditor(themeOrSceneKey);
  } else {
    switchThemesMainTab('overlays');
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast('ℹ️ Selecciona la overlay a la que quieras asignar este tema', 'info');
    }
  }
}

function onPreviewSceneDropdownChange(sceneKey) {
  refreshThemePreview();
}

function closeSceneEditor() {
  const modal = document.getElementById('scene-editor-modal');
  if (modal) modal.style.display = 'none';
  currentEditingScene = null;
}

function switchSceneModalSubTab(tab) {
  currentSceneModalSubTab = tab;
  ['texts', 'channel', 'obs'].forEach(t => {
    const btn = document.getElementById(`scene-subtab-${t}`);
    const pane = document.getElementById(`scene-view-${t}-pane`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
  });
}

function openCurrentSceneFullscreen() {
  if (!currentEditingScene) return;
  const assignedTheme = (cachedOverlayThemes && cachedOverlayThemes[currentEditingScene.key]) || currentActiveThemeId;
  const fullUrl = `${currentEditingScene.path}?theme=${encodeURIComponent(assignedTheme)}`;
  window.open(fullUrl, '_blank');
}

function copyCurrentSceneUrl() {
  if (!currentEditingScene) return;
  const assignedTheme = (cachedOverlayThemes && cachedOverlayThemes[currentEditingScene.key]) || currentActiveThemeId;
  const fullUrl = `${currentEditingScene.path}?theme=${encodeURIComponent(assignedTheme)}`;
  copySceneUrl(fullUrl);
}

// Exportación global explícita a window para llamadas inline desde HTML
window.openSceneEditor = openSceneEditor;
window.closeSceneEditor = closeSceneEditor;
window.switchSceneModalSubTab = switchSceneModalSubTab;
window.openCurrentSceneFullscreen = openCurrentSceneFullscreen;
window.copyCurrentSceneUrl = copyCurrentSceneUrl;
window.openSceneEditorFromTheme = openSceneEditorFromTheme;
window.onOverlayThemeChange = onOverlayThemeChange;
window.openThemeEditorByThemeId = openThemeEditorByThemeId;
window.onSceneModalThemeChange = onSceneModalThemeChange;
window.goToThemeEditorFromModal = goToThemeEditorFromModal;
window.onPreviewSceneDropdownChange = onPreviewSceneDropdownChange;
window.updatePreviewScene = updatePreviewScene;
window.openFullscreenPreview = openFullscreenPreview;
window.openOverlayFullscreen = openOverlayFullscreen;
window.copyOverlaySceneUrl = copyOverlaySceneUrl;
window.restoreOverlayTheme = restoreOverlayTheme;
window.restoreAllOverlaysToDefaultThemes = restoreAllOverlaysToDefaultThemes;
window.restoreOverlayThemeFromModal = restoreOverlayThemeFromModal;
window.assignThemeToScene = assignThemeToScene;
window.applyThemeToAllScenes = applyThemeToAllScenes;
window.refreshThemePreview = refreshThemePreview;
window.showOverlayFoldersView = showOverlayFoldersView;
window.openOverlayFolder = openOverlayFolder;
window.filterFolderSubCategory = filterFolderSubCategory;
window.applyThemeToAllOverlaysFromFolderCard = applyThemeToAllOverlaysFromFolderCard;
window.applyThemeToAllFromInside = applyThemeToAllFromInside;
window.applyThemeToCurrentOpenFolder = applyThemeToCurrentOpenFolder;
window.restoreCurrentFolderTexts = restoreCurrentFolderTexts;
window.restoreCurrentSceneTexts = restoreCurrentSceneTexts;
window.restoreSceneTexts = restoreSceneTexts;
window.restoreAllOverlaysTexts = restoreAllOverlaysTexts;
window.openThemeEditor = openThemeEditor;
window.closeThemeEditor = closeThemeEditor;

// Inicialización al cargar la sección de temas
document.addEventListener('DOMContentLoaded', () => {
  loadThemePacks();
});
