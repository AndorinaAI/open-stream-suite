// ====================================================================
// GESTOR MODULAR DE TEMAS, PACKS EN CARPETAS Y EDITOR DE CÓDIGO/AJUSTES
// ====================================================================

let cachedThemePacks = [];
let currentOpenPackId = null;
let currentEditingTheme = null;
let currentEditingPackId = null;
let currentActiveThemeId = 'maker';
let currentActivePackId = 'pack_open_stream_suite';
const DEFAULT_OVERLAY_THEMES = {
  'game': 'arcade_8bit',
  'maker': 'maker',
  'maker-desk': 'maker',
  'maker-pc': 'terminal',
  'print': 'print',
  'print-machine': 'print',
  'print-design': 'print',
  'chill': 'chill',
  'startingSoon': 'synthwave',
  'beRightBack': 'vapor_sunset',
  'ending': 'synthwave'
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

function renderThemePacks() {
  const container = document.getElementById('themes-packs-grid');
  const badge = document.getElementById('themes-total-packs-badge');
  const btnBack = document.getElementById('themes-btn-back-packs');
  const btnAddTheme = document.getElementById('themes-btn-add-theme');
  const breadcrumbs = document.getElementById('themes-breadcrumbs');
  const packsView = document.getElementById('themes-packs-view');
  const detailsView = document.getElementById('themes-pack-details-view');

  if (packsView) packsView.style.display = 'block';
  if (detailsView) detailsView.style.display = 'none';
  if (btnBack) btnBack.style.display = 'none';
  if (btnAddTheme) btnAddTheme.style.display = 'none';
  if (breadcrumbs) {
    breadcrumbs.innerHTML = `<span class="crumb-item active" onclick="showThemePacksView()">📁 Packs de Temas</span>`;
  }

  if (badge) badge.textContent = `${cachedThemePacks.length} PACKS`;
  if (!container) return;

  if (cachedThemePacks.length === 0) {
    container.innerHTML = '<div style="color: var(--color-text-dim); padding: 24px;">No hay packs creados. Haz clic en "+ Nuevo Pack" para crear uno.</div>';
    return;
  }

  container.innerHTML = cachedThemePacks.map(pack => {
    const isPackActive = pack.id === currentActivePackId;
    return `
      <div class="pack-folder-card ${isPackActive ? 'active-pack' : ''}" onclick="openThemePack('${pack.id}')">
        <div class="pack-folder-header">
          <div class="pack-folder-title">
            <span style="font-size: 24px;">${pack.icon || '📁'}</span>
            <div>
              <div>${pack.name}</div>
              <div style="font-family: var(--font-tech); font-size: 10px; color: var(--color-text-dim);">themes/${pack.id}/</div>
            </div>
          </div>
          <span class="badge-pill" style="font-size: 10px; background: rgba(87, 214, 196, 0.15); color: var(--color-accent-cyan);">
            ${pack.themesCount || 0} TEMAS
          </span>
        </div>

        <div style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4;">
          ${pack.description || 'Pack modular de temas y escenas.'}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-family: var(--font-tech); font-size: 11px;">
          <span style="color: ${isPackActive ? 'var(--color-accent-cyan)' : 'var(--color-text-dim)'}; font-weight: 700;">
            ${isPackActive ? '🟢 Pack Activo en OBS' : '📦 Colección local'}
          </span>
          <button class="btn-action-test" style="padding: 4px 10px; font-size: 11px;">
            Abrir Carpeta ➜
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
  const pack = cachedThemePacks.find(p => p.id === packId);
  if (!pack) return;

  currentOpenPackId = packId;
  const packsView = document.getElementById('themes-packs-view');
  const detailsView = document.getElementById('themes-pack-details-view');
  const btnBack = document.getElementById('themes-btn-back-packs');
  const btnAddTheme = document.getElementById('themes-btn-add-theme');
  const breadcrumbs = document.getElementById('themes-breadcrumbs');

  if (packsView) packsView.style.display = 'none';
  if (detailsView) detailsView.style.display = 'block';
  if (btnBack) btnBack.style.display = 'inline-flex';
  if (btnAddTheme) btnAddTheme.style.display = 'inline-flex';

  if (breadcrumbs) {
    breadcrumbs.innerHTML = `
      <span class="crumb-item" onclick="showThemePacksView()">📁 Packs de Temas</span>
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
  if (dPath) dPath.textContent = `themes/${pack.id}/`;
  if (dCount) dCount.textContent = `${(pack.themes || []).length} TEMAS`;

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
            ${isChatAnchored ? '🔗 Chat Anclado' : '✨ Chat Derivado'}
          </span>
          <span style="color: var(--color-text-dim); font-size: 10px;">
            Glow: ${t.glowIntensity || 50}%
          </span>
        </div>

        <!-- Overlays Vinculadas a este Estilo -->
        <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255, 120, 63, 0.3); padding: 8px; border-radius: 4px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; margin-bottom: 5px;">
            <span style="color: var(--color-text-dim);">🎬 Overlays que usan este estilo:</span>
            <span style="color: var(--color-accent-orange); font-family: var(--font-tech); font-weight: 700;">
              ${OSS_SCENES.filter(sc => (cachedOverlayThemes[sc.key] || currentActiveThemeId) === t.id).length} ENLAZADA${OSS_SCENES.filter(sc => (cachedOverlayThemes[sc.key] || currentActiveThemeId) === t.id).length === 1 ? '' : 'S'}
            </span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; max-height: 52px; overflow-y: auto;">
            ${(() => {
              const linked = OSS_SCENES.filter(sc => (cachedOverlayThemes[sc.key] || currentActiveThemeId) === t.id);
              if (linked.length === 0) {
                return '<span style="font-size: 10px; color: var(--color-text-dim); font-style: italic;">Sin overlays asignadas (se puede asignar en la pestaña Overlays)</span>';
              }
              return linked.map(sc => `
                <button type="button" class="badge-pill" style="cursor: pointer; border: 1px solid rgba(255, 120, 63, 0.4); background: rgba(255, 120, 63, 0.15); color: #FF783F; font-size: 9px; padding: 2px 6px;" onclick="openSceneEditor('${sc.key}')" title="Clic para editar los textos de ${sc.name}">
                  ${sc.icon} ${sc.name.split(':')[0]} ✏️
                </button>
              `).join('');
            })()}
          </div>
        </div>

        <!-- Botones de Acción -->
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
          <div style="display: flex; gap: 6px;">
            <select class="monitor-select" style="flex: 1; font-size: 11px; padding: 6px;" onchange="if(this.value){ assignThemeToScene(this.value, '${t.id}'); this.value=''; }" title="Asignar este estilo a una escena específica de OBS">
              <option value="">🎯 Asignar a una Escena...</option>
              ${OSS_SCENES.map(sc => `<option value="${sc.key}">➔ ${sc.icon} ${sc.name.split(':')[0]}</option>`).join('')}
            </select>
            <button class="btn-action-test" style="font-size: 11px; padding: 6px 12px;" onclick="openThemeEditor('${pack.id}', '${t.id}')" title="Editar colores, paleta y código CSS">
              🛠️ Editar
            </button>
          </div>

          <button class="btn-action-primary" style="width: 100%; font-size: 11px; padding: 6px; display: inline-flex; justify-content: center; align-items: center; gap: 5px;" onclick="applyThemeToAllScenes('${t.id}', '${pack.id}')" title="Vestir todas las 9 escenas de OBS con este estilo">
            🎨 Aplicar a Todas las Escenas en OBS
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
  if (!confirm(`¿Deseas aplicar el estilo "${info.name}" a todas las 9 escenas de OBS Studio?`)) return;
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
    OverlayTexts.showToast(`✓ Estilo "${info.name}" aplicado a todas las escenas en OBS`, 'success');
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
  if (mPath) mPath.textContent = `themes/${packId}/${themeId}/style.css & theme.json`;

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
    alert(`✓ ¡Tema "${payload.name}" guardado en themes/${currentEditingPackId}/${payload.id}/ y common/themes.css sincronizado!`);
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
  if (!confirm(`¿Restablecer el estilo "${themeName}" a sus colores y código CSS original de fábrica?\n\nSe revertirán todas las modificaciones guardadas en este tema.`)) {
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
  {
    key: 'game',
    name: 'Overlay: Gameplay (Juego + Cámara)',
    icon: '🎮',
    path: '/scenes/game/index.html',
    badge: 'GAMEPLAY + WEBCAM',
    desc: 'Capa limpia para videojuegos. Marco de webcam en esquina con insignia técnica y soporte de alertas.',
    obsSource: 'http://localhost:8080/scenes/game/index.html'
  },
  {
    key: 'maker-desk',
    name: 'Overlay: Escena Principal (Cámara + Webcam)',
    icon: '🛠️',
    path: '/scenes/maker-desk/index.html',
    badge: 'ESCENA PRINCIPAL · CÁMARA',
    desc: 'Escena principal con cámara frontal o aérea, barra inferior con fases del proyecto y ventana auxiliar.',
    obsSource: 'http://localhost:8080/scenes/maker-desk/index.html'
  },
  {
    key: 'maker-pc',
    name: 'Overlay: Pantalla Compartida (PC + Webcam)',
    icon: '💻',
    path: '/scenes/maker-pc/index.html',
    badge: 'PANTALLA COMPARTIDA · PC',
    desc: 'Escena de pantalla compartida con barra inferior de fases activas y ventana para webcam/cámara.',
    obsSource: 'http://localhost:8080/scenes/maker-pc/index.html'
  },
  {
    key: 'print-machine',
    name: 'Overlay: Cámara Secundaria (Proceso / Acción)',
    icon: '🖨️',
    path: '/scenes/print-machine/index.html',
    badge: 'CÁMARA SECUNDARIA · PROCESO',
    desc: 'Cámara directa sobre el proceso o acción en curso, con indicador de estado y fases.',
    obsSource: 'http://localhost:8080/scenes/print-machine/index.html'
  },
  {
    key: 'print-design',
    name: 'Overlay: Pantalla Diseño / CAD (Full Screen)',
    icon: '📐',
    path: '/scenes/print-design/index.html',
    badge: 'PANTALLA COMPLETA · DISEÑO',
    desc: 'Pantalla completa para diseño, programación o cualquier app a pantalla completa con cámara secundaria.',
    obsSource: 'http://localhost:8080/scenes/print-design/index.html'
  },
  {
    key: 'chill',
    name: 'Overlay: Charla y Chat (Just Chatting)',
    icon: '💬',
    path: '/scenes/chill/index.html',
    badge: 'JUST CHATTING',
    desc: 'Cámara amplia con marco para el chat de Twitch en OBS y cinta inferior con el tema de conversación.',
    obsSource: 'http://localhost:8080/scenes/chill/index.html'
  },
  {
    key: 'startingSoon',
    name: 'Pantalla: Inicio de Stream (Starting Soon)',
    icon: '⏳',
    path: '/scenes/starting-soon/index.html',
    badge: 'INICIO DE EMISIÓN',
    desc: 'Pantalla completa de bienvenida con cuenta atrás regresiva, titular con acento neón y redes.',
    obsSource: 'http://localhost:8080/scenes/starting-soon/index.html'
  },
  {
    key: 'beRightBack',
    name: 'Pantalla: Pausa Técnica (Be Right Back)',
    icon: '☕',
    path: '/scenes/be-right-back/index.html',
    badge: 'PAUSA TÉCNICA',
    desc: 'Pausa con escáner técnico animado y rotación automática de frases personalizables.',
    obsSource: 'http://localhost:8080/scenes/be-right-back/index.html'
  },
  {
    key: 'ending',
    name: 'Pantalla: Despedida (Ending)',
    icon: '🎬',
    path: '/scenes/ending/index.html',
    badge: 'FIN DE TRANSMISIÓN',
    desc: 'Cierre de directo con tarjeta de agradecimiento a suscriptores, etiqueta de despedida y redes.',
    obsSource: 'http://localhost:8080/scenes/ending/index.html'
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
    id: 'taller',
    name: 'Mis Overlays (Open Stream Suite)',
    icon: '🛠️',
    badge: '9 OVERLAYS · SUITE COMPLETA',
    path: 'overlays/*',
    desc: 'Carpeta principal con todos los overlays listos para OBS: Escenas de cámara, pantalla, gameplay, charla y pantallas de emisión.',
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
  }
];

let currentOpenOverlayFolderId = null;
let currentFolderSubFilter = 'all';

function showOverlayFoldersView() {
  currentOpenOverlayFolderId = null;
  renderOverlayFolders();
}

function openOverlayFolder(folderId) {
  currentOpenOverlayFolderId = folderId || 'taller';
  renderOverlayFolders();
}

function filterFolderSubCategory(cat) {
  currentFolderSubFilter = cat || 'all';
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

async function applyThemeToAllOverlaysFromFolderCard(folderId = 'taller') {
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

function renderOverlayFolders() {
  populateGlobalThemeSelect();

  const foldersView = document.getElementById('overlays-folders-view');
  const detailsView = document.getElementById('overlays-folder-details-view');
  const breadcrumbs = document.getElementById('overlays-breadcrumbs');
  const btnBack = document.getElementById('overlays-btn-back-folders');
  const foldersGrid = document.getElementById('overlays-folders-grid');
  const scenesGrid = document.getElementById('overlays-scenes-in-folder-grid');

  if (currentOpenOverlayFolderId) {
    const folder = OVERLAY_FOLDERS.find(f => f.id === currentOpenOverlayFolderId) || OVERLAY_FOLDERS[0];

    if (foldersView) foldersView.style.display = 'none';
    if (detailsView) detailsView.style.display = 'block';
    if (btnBack) btnBack.style.display = 'inline-flex';

    if (breadcrumbs) {
      breadcrumbs.innerHTML = `
        <span class="crumb-item" onclick="showOverlayFoldersView()">📁 Carpetas de Overlays</span>
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

    let scenesInFolder = OSS_SCENES.filter(sc => folder.keys.includes(sc.key));
    if (currentFolderSubFilter === 'maker') {
      scenesInFolder = scenesInFolder.filter(sc => sc.key.startsWith('maker'));
    } else if (currentFolderSubFilter === 'print') {
      scenesInFolder = scenesInFolder.filter(sc => sc.key.startsWith('print'));
    } else if (currentFolderSubFilter === 'stream') {
      scenesInFolder = scenesInFolder.filter(sc => sc.key === 'game' || sc.key === 'chill');
    } else if (currentFolderSubFilter === 'screens') {
      scenesInFolder = scenesInFolder.filter(sc => sc.key === 'startingSoon' || sc.key === 'beRightBack' || sc.key === 'ending');
    }

    if (countBadge) {
      countBadge.textContent = `${scenesInFolder.length} ESCENAS DISPONIBLES`;
    }

    if (scenesGrid) {
      scenesGrid.innerHTML = scenesInFolder.map(s => buildSceneCardHtml(s)).join('');
    }
  } else {
    if (foldersView) foldersView.style.display = 'block';
    if (detailsView) detailsView.style.display = 'none';
    if (btnBack) btnBack.style.display = 'none';

    if (breadcrumbs) {
      breadcrumbs.innerHTML = `<span class="crumb-item active" onclick="showOverlayFoldersView()">📁 Carpetas de Actividades del Stream</span>`;
    }

    if (foldersGrid) {
      foldersGrid.innerHTML = OVERLAY_FOLDERS.map(f => {
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
                  <span>🎨</span> Aplicar Estilo Visual a todos los Overlays de la carpeta:
                </span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn-action-test" style="font-size: 11px; padding: 5px 12px; color: var(--color-accent-cyan); border-color: var(--color-accent-cyan); font-weight: 800; background: rgba(87, 214, 196, 0.15); cursor: pointer;" onclick="restoreAllOverlaysToDefaultThemes()" title="Restablecer todas las overlays a sus temas visuales de fábrica">
                    🔄 Restaurar Estilos Originales
                  </button>
                  <button type="button" class="btn-action-test" style="font-size: 11px; padding: 5px 12px; color: #FF783F; border-color: rgba(255, 120, 63, 0.6); font-weight: 800; background: rgba(255, 120, 63, 0.12); cursor: pointer;" onclick="restoreAllOverlaysTexts()" title="Restablecer todos los textos de fábrica">
                    📝 Restaurar Textos
                  </button>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <select id="folder-theme-select-${f.id}" class="form-select" style="flex: 1; min-width: 200px; font-size: 12px; padding: 7px 10px; background: #0E1216; color: #FFFFFF; border: 1px solid rgba(87, 214, 196, 0.5); border-radius: 4px;">
                  ${buildThemeOptionsHtml(currentActiveThemeId)}
                </select>
                <button type="button" class="btn-action-primary" style="font-size: 12px; padding: 7px 16px; font-weight: 800;" onclick="applyThemeToAllOverlaysFromFolderCard('${f.id}')">
                  ✨ Aplicar a Todos en OBS
                </button>
              </div>
            </div>

            <div style="font-size: 11px; font-family: var(--font-tech); color: var(--color-accent-cyan); margin-bottom: 6px; font-weight: 700;">
              ACTIVIDADES INCLUIDAS DENTRO DE ESTA CARPETA:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;">
              ${(f.activities || []).map(act => `
                <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #FFFFFF;">
                  <span>${act.icon}</span> <b>${act.name}</b>
                </span>
              `).join('')}
            </div>

            <button type="button" class="btn-action-primary" style="width: 100%; font-size: 13px; font-weight: 800; padding: 11px; display: inline-flex; justify-content: center; align-items: center; gap: 8px;" onclick="openOverlayFolder('${f.id}')">
              📂 Entrar a la Carpeta de Overlays y Editar (9 Escenas) →
            </button>
          </div>
        `;
      }).join('');
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

  if (!confirm(`¿Restaurar los textos de esta escena (${currentEditingScene.name}) a sus valores originales de fábrica?`)) {
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
  if (!confirm('¿Restaurar TODOS los textos de todas las 9 escenas a sus valores originales de fábrica?')) {
    return;
  }
  if (window.OverlayTexts) {
    await OverlayTexts.reset('all');
  }
}

function buildSceneCardHtml(s) {
  const assignedThemeId = cachedOverlayThemes[s.key] || currentActiveThemeId;
  const assignedThemeObj = getThemeObjectById(assignedThemeId);
  const defaultThemeId = DEFAULT_OVERLAY_THEMES[s.key] || 'maker';
  const defaultInfo = getThemeDisplayNameById(defaultThemeId);
  const isModified = (assignedThemeId !== defaultThemeId);

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
          <span style="font-size: 11px; color: var(--color-text-dim);">🎨 Estilo Visual Asignado:</span>
          <button type="button" class="btn-action-test" style="font-size: 10px; padding: 2px 8px; border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); cursor: pointer;" onclick="openThemeEditorByThemeId('${assignedThemeId}')" title="Clic para ir directo a personalizar colores, neón y CSS de este estilo">
            🎨 Editar Estilo ↗
          </button>
        </div>
        <div style="display: flex; gap: 6px; align-items: stretch;">
          <select id="scene-theme-select-${s.key}" class="form-select" style="flex: 1; min-width: 0; font-size: 11px; padding: 5px 8px; background: #0E1216; color: #FFFFFF; border: 1px solid ${isModified ? 'rgba(255,120,63,0.5)' : 'rgba(87,214,196,0.35)'}; border-radius: 4px;" onchange="previewOverlayThemeChange('${s.key}', this.value)" title="Elige un estilo y pulsa Guardar para aplicarlo en OBS">
            ${buildThemeOptionsHtml(assignedThemeId, defaultThemeId)}
          </select>
          <button type="button" id="scene-theme-save-${s.key}" class="btn-action-primary" style="font-size: 11px; padding: 5px 10px; font-weight: 800; white-space: nowrap;" onclick="saveOverlayThemeFromCard('${s.key}')" title="Guardar este estilo para esta escena y aplicarlo en OBS">
            💾 Guardar
          </button>
        </div>
        <div id="scene-theme-pending-${s.key}" style="display: none; font-size: 10px; color: #FFD166; margin-top: 4px;">● Cambio sin guardar — pulsa 💾 Guardar para aplicarlo en OBS</div>

        <!-- Indicador y Botón de Restauración al Estilo de Fábrica -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding: 4px 8px; border-radius: 4px; ${isModified ? 'background: rgba(255, 120, 63, 0.12); border: 1px solid rgba(255, 120, 63, 0.35);' : 'background: rgba(87, 214, 196, 0.08); border: 1px solid rgba(87, 214, 196, 0.2);'}">
          <span style="font-size: 10px; color: ${isModified ? '#FF783F' : 'var(--color-accent-cyan)'};">
            ${isModified ? `⚠️ Personalizado (Original: <b>${defaultInfo.name}</b>)` : `⭐ Original de fábrica: <b>${defaultInfo.name}</b>`}
          </span>
          ${isModified ? `
            <button type="button" class="btn-action-test" style="font-size: 9px; padding: 2px 7px; color: #FF783F; border-color: #FF783F; cursor: pointer; background: rgba(255,120,63,0.15);" onclick="restoreOverlayTheme('${s.key}')" title="Restaurar al estilo visual original de fábrica (${defaultInfo.name})">
              🔄 Restaurar Original
            </button>
          ` : ''}
        </div>
      </div>

      <p style="font-size: 12px; color: var(--color-text-dim); line-height: 1.4; margin: 8px 0; min-height: 40px;">
        ${s.desc}
      </p>

      <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
        <button class="btn-action-primary" style="width: 100%; font-size: 11px; padding: 7px 12px; display: inline-flex; justify-content: center; align-items: center; gap: 6px;" onclick="openSceneEditor('${s.key}')">
          ✏️ Editar Textos y Ver Vista Rápida
        </button>
        <div style="display: flex; gap: 6px;">
          <button class="btn-action-test" style="flex: 1; font-size: 11px; padding: 6px 8px; display: inline-flex; justify-content: center; align-items: center; gap: 4px;" onclick="openOverlayFullscreen('${s.key}', '${s.path}')" title="Ver a resolución nativa 1080p con el estilo ${assignedThemeObj.name}">
            🖥️ Pantalla Completa ↗
          </button>
          <button class="btn-action-test" style="flex: 1; font-size: 11px; padding: 6px 8px; display: inline-flex; justify-content: center; align-items: center; gap: 4px;" onclick="copyOverlaySceneUrl('${s.key}', '${s.path}')" title="Copiar URL con el tema ${assignedThemeObj.name} para OBS Studio">
            📋 Copiar URL OBS
          </button>
        </div>
        <button class="btn-action-test" style="font-size: 10px; padding: 4px 8px; color: #FF783F; border-color: rgba(255,120,63,0.3); display: inline-flex; justify-content: center; align-items: center; gap: 4px; margin-top: 2px;" onclick="restoreSceneTexts('${s.key}')" title="Restaurar textos de fábrica para esta escena">
          🔄 Restaurar Textos de Fábrica
        </button>
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
  if (!confirm('¿Deseas restaurar todas las 9 overlays a sus estilos visuales originales de fábrica?')) return;
  for (const [key, defaultThemeId] of Object.entries(DEFAULT_OVERLAY_THEMES)) {
    cachedOverlayThemes[key] = defaultThemeId;
    try {
      await API.setOverlayTheme(key, defaultThemeId);
    } catch (e) {}
  }
  renderThemeScenes();
  if (window.OverlayTexts && OverlayTexts.showToast) {
    OverlayTexts.showToast('↺ Todas las overlays han sido restauradas a sus estilos originales de fábrica', 'success');
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
      OverlayTexts.showToast(`✓ Estilo "${themeObj.name}" asignado a la escena`, 'success');
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
      OverlayTexts.showToast(`📋 URL copiada para OBS: ${fullUrl}`, 'success');
    } else {
      alert(`URL copiada al portapapeles:\n${fullUrl}\n\nPégala en OBS Studio como Fuente Navegador (1920×1080).`);
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
  if (key === 'maker' || key === 'maker-desk' || key === 'maker-pc') {
    titleVal = document.getElementById('txt-maker-project')?.value?.trim() || 'NAS CON RASPBERRY PI';
    const phaseVal = document.getElementById('txt-maker-phase')?.value?.trim() || '02 MONTAJE';
    const detVal = document.getElementById('txt-maker-detail')?.value?.trim() || 'Armbian OS · PCB v1.2';
    subtitleVal = `Fase: ${phaseVal} · ${detVal}`;
  } else if (key === 'game') {
    titleVal = document.getElementById('txt-game-badge')?.value?.trim() || 'GAME MODE';
    subtitleVal = document.getElementById('txt-game-tagline')?.value?.trim() || 'MODO JUEGO / GAMEPLAY';
  } else if (key === 'print' || key === 'print-machine' || key === 'print-design') {
    titleVal = document.getElementById('txt-print-project')?.value?.trim() || 'PEGATINAS PERSONALIZADAS';
    const matVal = document.getElementById('txt-print-material')?.value?.trim() || 'Vinilo Holográfico';
    const phaseVal = document.getElementById('txt-print-phase')?.value?.trim() || 'CORTE DE VINILO';
    subtitleVal = `Material: ${matVal} · Fase: ${phaseVal}`;
  } else if (key === 'chill') {
    titleVal = document.getElementById('txt-chill-chat-title')?.value?.trim() || 'CHAT EN DIRECTO';
    subtitleVal = document.getElementById('txt-chill-topic')?.value?.trim() || 'Tema del día, proyectos y preguntas';
  } else if (key === 'startingSoon') {
    titleVal = document.getElementById('txt-ss-title')?.value?.trim() || 'ENSEGUIDA';
    subtitleVal = document.getElementById('txt-ss-subtitle')?.value?.trim() || 'PREPARANDO EL DIRECTO...';
  } else if (key === 'beRightBack') {
    titleVal = document.getElementById('txt-brb-title')?.value?.trim() || 'AHORA VUELVO';
    subtitleVal = document.getElementById('txt-brb-subtitle')?.value?.trim() || 'PAUSA TÉCNICA';
  } else if (key === 'ending') {
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
    'ending': 'text-pane-ending'
  };

  const targetPaneId = paneMapping[sceneKey];
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
