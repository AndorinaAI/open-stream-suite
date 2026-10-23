
function updateModalMiniPreview(themeId) {
  if (!currentEditingScene) return;
  const tId = themeId || (cachedOverlayThemes[currentEditingScene.key]) || currentActiveThemeId;
  const theme = getThemeObjectById(tId);

  const frame = document.getElementById('scene-modal-preview-frame');
  if (!frame) return;

  const isCozy = currentEditingScene.key.startsWith('cozy_');
  const isRounded = theme.borderStyle === 'rounded' || isCozy;
  const isSquare = theme.borderStyle === 'square' && !isCozy;
  const bRadius = isCozy ? '16px' : (isRounded ? '8px' : (isSquare ? '0px' : '4px'));
  const camRadius = isCozy ? '14px' : (isRounded ? '6px' : (isSquare ? '0px' : '3px'));
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
  const shapeSelect = document.getElementById('scene-modal-shape-select');
  const defaultHintEl = document.getElementById('scene-modal-default-theme-hint');

  if (themeSelect) themeSelect.innerHTML = buildThemeOptionsHtml(assignedThemeId, defaultThemeId);
  const assignedShapeId = (window.cachedOverlayShapes && window.cachedOverlayShapes[sceneKey]) || 'auto';
  if (shapeSelect) {
    shapeSelect.innerHTML = (typeof buildShapeOptionsHtml === 'function')
      ? buildShapeOptionsHtml(assignedShapeId)
      : '<option value="auto">Auto (Por defecto)</option>';
  }
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

async function onSceneModalShapeChange(shapeId) {
  if (!currentEditingScene) return;
  const sceneKey = currentEditingScene.key;
  if (typeof window.cachedOverlayShapes === 'undefined') window.cachedOverlayShapes = {};
  if (shapeId === 'auto') {
    delete window.cachedOverlayShapes[sceneKey];
  } else {
    window.cachedOverlayShapes[sceneKey] = shapeId;
  }
  try {
    await API.setOverlayTheme(sceneKey, null, shapeId);
    if (window.OverlayTexts && OverlayTexts.showToast) {
      OverlayTexts.showToast(`✓ Forma física "${shapeId}" aplicada a la escena`, 'success');
    }
  } catch (e) {
    console.error('Error aplicando forma a escena:', e);
  }
}
window.onSceneModalShapeChange = onSceneModalShapeChange;

async function restoreOverlayThemeFromModal() {
  if (!currentEditingScene) return;
  const defaultThemeId = DEFAULT_OVERLAY_THEMES[currentEditingScene.key] || 'maker';
  const themeSelect = document.getElementById('scene-modal-theme-select');
  if (themeSelect) themeSelect.value = defaultThemeId;
  const shapeSelect = document.getElementById('scene-modal-shape-select');
  if (shapeSelect) shapeSelect.value = 'auto';
  if (typeof window.cachedOverlayShapes === 'undefined') window.cachedOverlayShapes = {};
  delete window.cachedOverlayShapes[currentEditingScene.key];
  cachedOverlayThemes[currentEditingScene.key] = defaultThemeId;
  try {
    await API.setOverlayTheme(currentEditingScene.key, defaultThemeId, 'auto');
  } catch (e) {}
  const defaultInfo = getThemeDisplayNameById(defaultThemeId);
  const defaultHintEl = document.getElementById('scene-modal-default-theme-hint');
  if (defaultHintEl) {
    defaultHintEl.innerHTML = `⭐ Original de fábrica: <b>${defaultInfo.name}</b>`;
  }
  updateModalMiniPreview(defaultThemeId);
  if (window.OverlayTexts && OverlayTexts.showToast) {
    OverlayTexts.showToast(`↺ Estilo original "${defaultInfo.name}" y forma física restaurados`, 'success');
  }
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
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}

function copyCurrentSceneUrl() {
  if (!currentEditingScene) return;
  const assignedTheme = (cachedOverlayThemes && cachedOverlayThemes[currentEditingScene.key]) || currentActiveThemeId;
  const fullUrl = `${currentEditingScene.path}?theme=${encodeURIComponent(assignedTheme)}`;
  copySceneUrl(fullUrl);
}
