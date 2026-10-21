
// ====================================================================
// FILTROS Y CONTROLES DE LA BARRA
// ====================================================================

function onMediaSearch(query) {
  mediaSearchQuery = query.trim();
  renderMediaExplorer();
}

function clearMediaSearch() {
  const input = document.getElementById('media-search-input');
  if (input) input.value = '';
  mediaSearchQuery = '';
  renderMediaExplorer();
}

function onMediaFilterChange(type) {
  currentFilterType = type;
  renderMediaExplorer();
}

function onMediaSortChange(sortBy) {
  currentSortBy = sortBy;
  renderMediaExplorer();
}

function setMediaViewMode(mode) {
  currentViewMode = mode;
  const btnGrid = document.getElementById('media-btn-view-grid');
  const btnList = document.getElementById('media-btn-view-list');
  if (btnGrid) btnGrid.classList.toggle('active', mode === 'grid');
  if (btnList) btnList.classList.toggle('active', mode === 'list');
  renderMediaExplorer();
}

// ====================================================================
// COMPATIBILIDAD CON FORMULARIO DE TRIGGERS
// ====================================================================

function populateMediaSelect() {
  const selMedia = document.getElementById('trig-media-file');
  const selSound = document.getElementById('trig-sound-file');

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  if (selMedia) {
    const prevVal = selMedia.value;
    selMedia.innerHTML = `<option value="">-- ${tr('triggers.select_visual_file', 'Seleccionar archivo visual subido')} --</option>`;
    cachedMedia.forEach(f => {
      if (typeof currentVisualType !== 'undefined') {
        if (currentVisualType === 'video' && f.type !== 'video') return;
        if (currentVisualType === 'image' && f.type !== 'image') return;
      }
      const opt = document.createElement('option');
      opt.value = f.url;
      const folderPrefix = f.folder ? `[${f.folder}] ` : '';
      opt.textContent = `[${f.type.toUpperCase()}] ${folderPrefix}${f.name}`;
      selMedia.appendChild(opt);
    });
    if (prevVal) selMedia.value = prevVal;
  }

  if (selSound) {
    const prevSound = selSound.value;
    selSound.innerHTML = `<option value="">-- ${tr('triggers.select_sound_file', 'Seleccionar archivo de sonido subido')} --</option>`;
    cachedMedia.filter(f => f.type === 'sound' || f.name.endsWith('.mp3') || f.name.endsWith('.wav')).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.url;
      const folderPrefix = f.folder ? `[${f.folder}] ` : '';
      opt.textContent = `🎵 ${folderPrefix}${f.name} (${f.size_kb} KB)`;
      selSound.appendChild(opt);
    });
    if (prevSound) selSound.value = prevSound;
  }
}

// Para compatibilidad hacia atrás
function previewMedia(url, type) {
  openMediaPreview(url.replace(/^\/media\//, ''));
}

async function deleteMedia(relPath) {
  deleteMediaSingle(relPath);
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
  initMediaDropzone();
});
