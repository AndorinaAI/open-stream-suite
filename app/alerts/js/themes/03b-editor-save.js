// ====================================================================
// EDITOR DE TEMA - PARTE B: ANCLAJE DE CHAT, GUARDADO Y RESTAURACIÓN
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
