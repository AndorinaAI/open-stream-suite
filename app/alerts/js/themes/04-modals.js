
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

  const targetPack = currentOpenPackId || 'Maker_Theme_Pack';

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
  const btnFusions = document.getElementById('tab-btn-fusions');
  const viewOverlays = document.getElementById('tab-view-overlays');
  const viewThemes = document.getElementById('tab-view-themes');
  const viewFusions = document.getElementById('tab-view-fusions');

  if (btnOverlays) btnOverlays.classList.toggle('active', tab === 'overlays');
  if (btnThemes) btnThemes.classList.toggle('active', tab === 'themes');
  if (btnFusions) btnFusions.classList.toggle('active', tab === 'fusions');

  if (viewOverlays) viewOverlays.style.display = (tab === 'overlays') ? 'block' : 'none';
  if (viewThemes) viewThemes.style.display = (tab === 'themes') ? 'block' : 'none';
  if (viewFusions) viewFusions.style.display = (tab === 'fusions') ? 'block' : 'none';

  if (tab === 'overlays') {
    renderThemeScenes();
  } else if (tab === 'themes') {
    if (typeof renderThemePacks === 'function') {
      if (currentOpenPackId) {
        openThemePack(currentOpenPackId);
      } else {
        renderThemePacks();
      }
    }
  } else if (tab === 'fusions') {
    if (typeof loadAndRenderFusions === 'function') {
      loadAndRenderFusions();
    }
  }
}
