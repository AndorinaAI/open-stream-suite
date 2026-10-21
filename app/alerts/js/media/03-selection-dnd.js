
// ====================================================================
// SELECCIÓN MÚLTIPLE Y ACCIONES EN LOTE
// ====================================================================

function toggleMediaSelection(event, path) {
  event.stopPropagation();
  if (selectedMediaPaths.has(path)) {
    selectedMediaPaths.delete(path);
  } else {
    selectedMediaPaths.add(path);
  }
  updateMediaActionButtons();
  // Actualizar estilos sin re-renderizar todo
  document.querySelectorAll(`[data-path="${path}"]`).forEach(el => {
    el.classList.toggle('selected', selectedMediaPaths.has(path));
  });
}

function selectAllMedia(select) {
  if (select) {
    const currentFiles = cachedMedia.filter(f => !currentFolder ? (f.folder === '' || mediaSearchQuery) : f.folder === currentFolder);
    currentFiles.forEach(f => selectedMediaPaths.add(f.rel_path));
  } else {
    selectedMediaPaths.clear();
  }
  renderMediaExplorer();
}

function updateMediaActionButtons() {
  const count = selectedMediaPaths.size;
  const countBadge = document.getElementById('media-selected-count-label');
  const btnCut = document.getElementById('media-btn-cut');
  const btnCopy = document.getElementById('media-btn-copy');
  const btnDelete = document.getElementById('media-btn-delete-selected');
  const btnPaste = document.getElementById('media-btn-paste');
  const pasteBadge = document.getElementById('media-paste-badge');
  const clipIndicator = document.getElementById('media-clipboard-indicator');
  const clipText = document.getElementById('media-clipboard-text');

  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (countBadge) {
    countBadge.style.display = count > 0 ? 'inline' : 'none';
    countBadge.textContent = tr('media.selected_count', `(${count} seleccionados)`, { count });
  }

  if (btnCut) btnCut.disabled = count === 0;
  if (btnCopy) btnCopy.disabled = count === 0;
  if (btnDelete) btnDelete.disabled = count === 0;

  // Portapapeles
  const hasClipboard = mediaClipboard.mode && mediaClipboard.paths.length > 0;
  if (btnPaste) btnPaste.disabled = !hasClipboard;
  if (pasteBadge) {
    pasteBadge.style.display = hasClipboard ? 'inline' : 'none';
    pasteBadge.textContent = hasClipboard ? mediaClipboard.paths.length : '0';
  }

  if (clipIndicator && clipText) {
    if (hasClipboard) {
      clipIndicator.style.display = 'flex';
      const verb = mediaClipboard.mode === 'cut' ? tr('media.cutting', '✂️ Cortando') : tr('media.copying', '📋 Copiando');
      const itemWord = tr('media.items_word', `${mediaClipboard.paths.length} elemento(s)`, { count: mediaClipboard.paths.length });
      clipText.textContent = `${verb} ${itemWord}`;
    } else {
      clipIndicator.style.display = 'none';
    }
  }
}

// ====================================================================
// CORTAR, COPIAR Y PEGAR
// ====================================================================

function cutSelectedMedia() {
  if (selectedMediaPaths.size === 0) return;
  mediaClipboard = {
    mode: 'cut',
    paths: Array.from(selectedMediaPaths)
  };
  updateMediaActionButtons();
  renderMediaExplorer();
}

function copySelectedMedia() {
  if (selectedMediaPaths.size === 0) return;
  mediaClipboard = {
    mode: 'copy',
    paths: Array.from(selectedMediaPaths)
  };
  updateMediaActionButtons();
}

function clearMediaClipboard() {
  mediaClipboard = { mode: null, paths: [] };
  updateMediaActionButtons();
  renderMediaExplorer();
}

async function pasteMedia() {
  if (!mediaClipboard.mode || mediaClipboard.paths.length === 0) return;

  const progress = document.getElementById('upload-progress-box');
  if (progress) {
    progress.style.display = 'block';
    progress.textContent = `Procesando ${mediaClipboard.paths.length} elemento(s)...`;
  }

  try {
    if (mediaClipboard.mode === 'cut') {
      await API.moveMedia(mediaClipboard.paths, currentFolder);
      mediaClipboard = { mode: null, paths: [] };
    } else if (mediaClipboard.mode === 'copy') {
      await API.copyMedia(mediaClipboard.paths, currentFolder);
    }

    if (progress) {
      progress.textContent = '✓ ¡Operación completada con éxito!';
      setTimeout(() => progress.style.display = 'none', 2500);
    }
    selectedMediaPaths.clear();
    await loadMedia();
  } catch (e) {
    if (progress) progress.textContent = '❌ Error al pegar elementos.';
  }
}

// ====================================================================
// DRAG AND DROP AVANZADO (ENTRE CARPETAS Y DESDE EL PC)
// ====================================================================

function onMediaDragStart(event, path) {
  // Si el elemento arrastrado no está en la selección, seleccionarlo
  if (!selectedMediaPaths.has(path)) {
    selectedMediaPaths.clear();
    selectedMediaPaths.add(path);
    updateMediaActionButtons();
  }
  const dragPayload = Array.from(selectedMediaPaths);
  event.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
  event.dataTransfer.effectAllowed = 'move';
}

function onFolderDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  const target = event.currentTarget;
  if (target) target.classList.add('drag-target');
}

function onFolderDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.currentTarget;
  if (target) target.classList.remove('drag-target');
}

async function onFolderDrop(event, targetFolder) {
  event.preventDefault();
  event.stopPropagation();
  const target = event.currentTarget;
  if (target) target.classList.remove('drag-target');

  // Comprobar si son archivos del sistema operativo
  if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
    uploadFiles(event.dataTransfer.files, targetFolder);
    return;
  }

  // Si son archivos arrastrados internamente dentro del explorador
  try {
    const raw = event.dataTransfer.getData('text/plain');
    if (!raw) return;
    let sources = [];
    try {
      sources = JSON.parse(raw);
    } catch {
      sources = [raw];
    }
    if (!Array.isArray(sources) || sources.length === 0) return;

    await API.moveMedia(sources, targetFolder);
    selectedMediaPaths.clear();
    await loadMedia();
  } catch (e) {
    console.error('Error al mover elementos con drag & drop:', e);
  }
}

function initMediaDropzone() {
  const dropZone = document.getElementById('media-dropzone');
  const mainPane = document.getElementById('media-drop-target-main');

  [dropZone, mainPane].filter(Boolean).forEach(zone => {
    ['dragenter', 'dragover'].forEach(n => {
      zone.addEventListener(n, e => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(n => {
      zone.addEventListener(n, e => {
        e.preventDefault();
        zone.classList.remove('dragover');
      });
    });

    zone.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFiles(files);
      }
    });
  });

  // Atajos de teclado en el explorador (Ctrl+X, Ctrl+C, Ctrl+V, Delete)
  window.addEventListener('keydown', e => {
    // No interceptar si el usuario está escribiendo en un input o textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    const mediaSec = document.getElementById('sec-media');
    if (!mediaSec || !mediaSec.classList.contains('active')) return;

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        cutSelectedMedia();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        copySelectedMedia();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        pasteMedia();
      }
    } else if (e.key === 'Delete') {
      if (selectedMediaPaths.size > 0) {
        e.preventDefault();
        deleteSelectedMedia();
      }
    }
  });
}
