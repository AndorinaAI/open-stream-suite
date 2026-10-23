
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
    name: 'Maker',
    pack: 'Maker Theme Pack',
    packId: 'Maker_Theme_Pack',
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

function buildSceneMiniMockupHtml(sceneKey, rawTheme) {
  const theme = rawTheme || getThemeObjectById('maker') || {};
  const glow = Math.round((typeof theme.glowIntensity === 'number' ? theme.glowIntensity : 50) * 0.25);
  const accentCyan = theme.accentCyan || '#57D6C4';
  const accentOrange = theme.accentOrange || '#FF783F';
  const bgDark = theme.bgDark || '#191D21';
  const textLight = theme.textLight || '#FFFFFF';
  const textDim = theme.textDim || '#8B969C';
  const themeName = theme.name || 'Maker';

  let bRadius = '6px';
  let bStyle = `2px solid ${accentCyan}`;
  let bShadow = `0 0 ${glow}px ${accentCyan}80`;

  const isCozy = sceneKey.startsWith('cozy_') || sceneKey.includes('pomodoro') || sceneKey.includes('cafe') || sceneKey.includes('art');
  if (isCozy) {
    bRadius = '14px';
  } else if (theme.borderStyle === 'square') {
    bRadius = '0px';
  } else if (theme.borderStyle === 'pill') {
    bRadius = '14px';
  } else if (theme.borderStyle === 'double') {
    bRadius = '4px';
    bShadow = `0 0 0 2px ${accentOrange}, 0 0 ${glow}px ${accentCyan}80`;
  } else if (theme.borderStyle === 'comic') {
    bRadius = '2px';
    bStyle = '3px solid #111116';
    bShadow = '4px 4px 0 #111116';
  } else if (theme.borderStyle === 'blueprint') {
    bRadius = '0px';
    bStyle = `1.5px dashed ${accentCyan}`;
    bShadow = `inset 0 0 8px ${accentCyan}33, 0 0 10px ${accentCyan}55`;
  }

  return `
    <div id="scene-card-preview-${sceneKey}" style="
      background: ${bgDark};
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
        <span style="font-size: 8px; font-weight: 800; color: ${accentCyan}; font-family: monospace; background: rgba(0,0,0,0.55); padding: 1px 5px; border-radius: 2px; border: 1px solid ${accentCyan}80;">
          VISTA RÁPIDA OBS
        </span>
        <span style="font-size: 8px; color: ${accentOrange}; font-weight: 800;">
          ● EN DIRECTO
        </span>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 38px; height: 32px; border: 1.5px solid ${accentCyan}; box-shadow: 0 0 6px ${accentCyan}40; border-radius: 3px; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-size: 12px;">
          📹
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          <div style="height: 5px; width: 80%; background: ${textLight}; opacity: 0.9; border-radius: 2px;"></div>
          <div style="height: 4px; width: 50%; background: ${accentOrange}; border-radius: 2px;"></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 3px;">
        <span style="font-size: 8px; color: ${textDim}; font-family: monospace;">1920×1080</span>
        <span style="font-size: 8px; font-weight: 800; color: ${accentCyan};">${themeName}</span>
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
