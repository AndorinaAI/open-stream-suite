// ====================================================================
// EDITOR DE TEMA - PARTE A: MODAL, AJUSTES VISUALES Y PREVIEW EN VIVO
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

  let frameRad = '8px';
  let panelRad = '8px';
  let badgeRad = '4px';
  let clipPath = 'none';
  let borderStyleVal = 'solid';
  let borderWidthVal = '2px';

  if (borderStyle === 'pill') {
    frameRad = '28px';
    panelRad = '24px';
    badgeRad = '50px';
  } else if (borderStyle === 'square') {
    frameRad = '0px';
    panelRad = '0px';
    badgeRad = '0px';
  } else if (borderStyle === 'chamfer') {
    frameRad = '0px';
    panelRad = '0px';
    badgeRad = '0px';
    clipPath = 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))';
  } else if (borderStyle === 'double') {
    borderStyleVal = 'double';
    borderWidthVal = '3px';
    frameRad = '6px';
  } else if (borderStyle === 'blueprint') {
    borderStyleVal = 'dashed';
    borderWidthVal = '1.5px';
    frameRad = '2px';
  } else if (borderStyle === 'comic') {
    borderWidthVal = '3px';
    frameRad = '4px';
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
  --frame-radius: ${frameRad};
  --panel-radius: ${panelRad};
  --badge-radius: ${badgeRad};
  --frame-border-style: ${borderStyleVal};
  --frame-border-width: ${borderWidthVal};
  --frame-clip-path: ${clipPath};
}${animRules}`;

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
  window.open(url, '_blank', 'noopener,noreferrer');
}
