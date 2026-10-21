
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
