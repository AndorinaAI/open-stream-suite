// ====================================================================
// GESTOR Y EXPLORADOR DE MEDIOS (VÍDEOS, MEMES, AUDIOS E IMÁGENES)
// Clasificación automática, árbol de carpetas, drag & drop y cortar/copiar/pegar
// ====================================================================

let cachedMedia = [];
let cachedFolders = [];
let cachedTree = null;
let cachedStats = null;

let currentFolder = ''; // '' = raíz de alerts/media/
let currentViewMode = 'grid'; // 'grid' | 'list'
let currentFilterType = 'all'; // 'all' | 'video' | 'sound' | 'image'
let currentSortBy = 'recent'; // 'recent' | 'name_asc' | 'name_desc' | 'size_desc'
let mediaSearchQuery = '';

let selectedMediaPaths = new Set();
let mediaClipboard = { mode: null, paths: [] }; // mode: 'cut' | 'copy' | null
let currentPreviewItem = null;

// ====================================================================
// CARGA Y SINCRONIZACIÓN CON EL BACKEND
// ====================================================================

async function loadMedia() {
  try {
    const data = await API.getMedia();
    cachedMedia = data.files || [];
    cachedFolders = data.folders || ['', 'images', 'sounds', 'videos'];
    cachedTree = data.tree || null;
    cachedStats = data.stats || null;

    updateMediaStatsUI();
    renderBreadcrumbs();
    renderFolderTree();
    renderMediaExplorer();
    populateMediaSelect();
  } catch (e) {
    console.error('Error al cargar medios:', e);
  }
}

function updateMediaStatsUI() {
  const totalBadge = document.getElementById('media-total-badge');
  const statVideos = document.getElementById('media-stat-videos');
  const statSounds = document.getElementById('media-stat-sounds');
  const statImages = document.getElementById('media-stat-images');
  const statStorage = document.getElementById('media-stat-storage');
  const barFill = document.getElementById('media-storage-bar-fill');
  const percText = document.getElementById('media-storage-percentage-text');

  const count = cachedMedia.length;
  if (totalBadge) totalBadge.textContent = `${count} ARCHIVOS`;

  const vCount = cachedMedia.filter(f => f.type === 'video').length;
  const sCount = cachedMedia.filter(f => f.type === 'sound').length;
  const iCount = cachedMedia.filter(f => f.type === 'image').length;

  if (statVideos) statVideos.textContent = vCount;
  if (statSounds) statSounds.textContent = sCount;
  if (statImages) statImages.textContent = iCount;

  const totalMb = cachedStats ? cachedStats.total_size_mb : 
    (cachedMedia.reduce((acc, f) => acc + (f.size_kb || 0), 0) / 1024).toFixed(2);

  if (statStorage) statStorage.textContent = `${totalMb} MB`;

  // Estimación de barra (referencia 1000 MB de límite local recomendado para overlay ligero)
  const pct = Math.min(Math.round((parseFloat(totalMb) / 1000) * 100), 100);
  if (barFill) barFill.style.width = `${Math.max(pct, 2)}%`;
  if (percText) percText.textContent = `${pct}%`;
}

// ====================================================================
// NAVEGACIÓN Y BREADCRUMBS
// ====================================================================

function navigateMediaFolder(target) {
  if (target === '..') {
    if (!currentFolder) return;
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    currentFolder = parts.join('/');
  } else if (target === '' || target === '/') {
    currentFolder = '';
  } else {
    // Normalizar ruta relativa
    currentFolder = target.replace(/^\/+|\/+$/g, '');
  }

  // Deseleccionar al cambiar de carpeta
  selectedMediaPaths.clear();
  updateMediaActionButtons();

  renderBreadcrumbs();
  renderFolderTree();
  renderMediaExplorer();
}

function renderBreadcrumbs() {
  const container = document.getElementById('media-breadcrumbs');
  const btnUp = document.getElementById('media-btn-up');
  const lblDest = document.getElementById('lbl-current-folder-dest');
  const statusPath = document.getElementById('media-status-path');

  if (btnUp) btnUp.disabled = !currentFolder;

  const displayFolder = currentFolder ? `/${currentFolder}/` : 'Biblioteca raíz';
  if (lblDest) lblDest.textContent = displayFolder;
  if (statusPath) statusPath.textContent = `/media/${currentFolder ? currentFolder + '/' : ''}`;

  if (!container) return;

  const parts = currentFolder ? currentFolder.split('/').filter(Boolean) : [];
  let html = `<span class="crumb-item ${parts.length === 0 ? 'active' : ''}" onclick="navigateMediaFolder('')">📁 media</span>`;

  let accumulated = '';
  parts.forEach((p, idx) => {
    accumulated += (accumulated ? '/' : '') + p;
    const isLast = idx === parts.length - 1;
    const pathRef = accumulated;
    html += ` <span class="crumb-sep">/</span> `;
    html += `<span class="crumb-item ${isLast ? 'active' : ''}" onclick="navigateMediaFolder('${pathRef}')">${getFolderIcon(p)} ${p}</span>`;
  });

  container.innerHTML = html;
}

function getFolderIcon(folderName) {
  const fn = folderName.toLowerCase();
  if (fn === 'videos') return '🎬';
  if (fn === 'sounds' || fn === 'audio') return '🎵';
  if (fn === 'images' || fn === 'fotos') return '🖼️';
  if (fn === 'memes') return '🤡';
  return '📁';
}

// ====================================================================
// ÁRBOL DE CARPETAS (SIDEBAR) CON SOPORTE DRAG & DROP
// ====================================================================

function renderFolderTree() {
  const container = document.getElementById('media-folder-tree');
  if (!container) return;

  // Raíz principal
  let html = `
    <div class="tree-node ${currentFolder === '' ? 'active' : ''}" 
         onclick="navigateMediaFolder('')"
         ondragover="onFolderDragOver(event)"
         ondragleave="onFolderDragLeave(event)"
         ondrop="onFolderDrop(event, '')"
         data-folder="">
      <span class="tree-node-name">📁 Biblioteca Raíz</span>
      <span class="tree-node-badge">${cachedMedia.length}</span>
    </div>
  `;

  // Directorios conocidos (asegurar videos, sounds, images + subdirectorios)
  const uniqueFolders = Array.from(new Set(cachedFolders.filter(Boolean))).sort();

  uniqueFolders.forEach(fPath => {
    const depth = fPath.split('/').length - 1;
    const indentPx = 8 + depth * 14;
    const folderName = fPath.split('/').pop();
    const count = cachedMedia.filter(f => f.folder === fPath || f.folder.startsWith(fPath + '/')).length;
    const isActive = currentFolder === fPath;

    html += `
      <div class="tree-node ${isActive ? 'active' : ''}" 
           style="padding-left: ${indentPx}px;"
           onclick="navigateMediaFolder('${fPath}')"
           ondragover="onFolderDragOver(event)"
           ondragleave="onFolderDragLeave(event)"
           ondrop="onFolderDrop(event, '${fPath}')"
           data-folder="${fPath}">
        <span class="tree-node-name">
          <span>${getFolderIcon(folderName)}</span>
          <span>${folderName}</span>
        </span>
        <span class="tree-node-badge">${count}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ====================================================================
// EXPLORADOR PRINCIPAL: FILTRADO, ORDENACIÓN Y RENDERIZADO
// ====================================================================

function renderMediaExplorer() {
  const gridContainer = document.getElementById('media-items-grid');
  const tableContainer = document.getElementById('media-items-table-container');
  const tableBody = document.getElementById('media-items-table-body');
  const subfoldersContainer = document.getElementById('media-subfolders-container');
  const countLabel = document.getElementById('media-items-count-label');
  const statusInfo = document.getElementById('media-status-info');

  if (!gridContainer) return;

  // 1. Obtener subcarpetas directas de currentFolder
  const directSubfolders = cachedFolders.filter(f => {
    if (!f) return false;
    if (!currentFolder) {
      return !f.includes('/');
    } else {
      if (!f.startsWith(currentFolder + '/')) return false;
      const rel = f.slice(currentFolder.length + 1);
      return !rel.includes('/');
    }
  });

  // Renderizar subcarpetas en tarjetas navegables
  if (subfoldersContainer) {
    if (directSubfolders.length > 0 && !mediaSearchQuery) {
      subfoldersContainer.style.display = 'grid';
      subfoldersContainer.innerHTML = directSubfolders.map(sf => {
        const sfName = sf.split('/').pop();
        const count = cachedMedia.filter(f => f.folder === sf || f.folder.startsWith(sf + '/')).length;
        return `
          <div class="folder-card" 
               onclick="navigateMediaFolder('${sf}')"
               ondragover="onFolderDragOver(event)"
               ondragleave="onFolderDragLeave(event)"
               ondrop="onFolderDrop(event, '${sf}')"
               title="Doble clic para entrar o arrastra archivos aquí para moverlos">
            <span style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 12px;">
              <span style="font-size: 16px;">${getFolderIcon(sfName)}</span>
              <span>${sfName}</span>
            </span>
            <span class="tree-node-badge">${count}</span>
          </div>
        `;
      }).join('');
    } else {
      subfoldersContainer.style.display = 'none';
      subfoldersContainer.innerHTML = '';
    }
  }

  // 2. Filtrar archivos
  let filtered = cachedMedia.filter(f => {
    // Si hay búsqueda activa, buscar en toda la biblioteca
    if (mediaSearchQuery) {
      return f.name.toLowerCase().includes(mediaSearchQuery.toLowerCase());
    }
    // Si no hay búsqueda, mostrar solo archivos de la carpeta actual
    return (f.folder || '') === currentFolder;
  });

  // Filtrar por tipo
  if (currentFilterType !== 'all') {
    filtered = filtered.filter(f => f.type === currentFilterType);
  }

  // 3. Ordenar archivos
  filtered.sort((a, b) => {
    if (currentSortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (currentSortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (currentSortBy === 'size_desc') return (b.size_bytes || 0) - (a.size_bytes || 0);
    // recent
    return (b.mtime || 0) - (a.mtime || 0);
  });

  // Actualizar indicadores de conteo
  const totalCount = filtered.length;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (countLabel) {
    countLabel.textContent = mediaSearchQuery ? 
      tr('media.found_files', `Encontrados ${totalCount} archivo(s) para "${mediaSearchQuery}"`, { count: totalCount, query: mediaSearchQuery }) :
      tr('media.showing_files', `Mostrando ${totalCount} archivo(s)`, { count: totalCount });
  }
  if (statusInfo) {
    const rootName = tr('media.root_folder', 'raíz');
    statusInfo.textContent = tr('media.files_in_folder', `${totalCount} archivo(s) en ${currentFolder || rootName}`, { count: totalCount, folder: currentFolder || rootName });
  }

  // 4. Mostrar según modo de vista
  if (currentViewMode === 'grid') {
    if (gridContainer) gridContainer.style.display = 'grid';
    if (tableContainer) tableContainer.style.display = 'none';

    if (totalCount === 0) {
      const emptyTitle = tr('media.empty_folder_title', 'No hay archivos en esta carpeta.');
      const emptyDesc = tr('media.empty_folder_desc', 'Arrastra archivos aquí o haz clic en "Subir Archivos" para añadirlos.');
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px 16px; text-align: center; color: var(--color-text-dim); font-size: 13px;">
          <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
          <b data-i18n="media.empty_folder_title">${emptyTitle}</b><br>
          <span style="font-size: 11px;" data-i18n="media.empty_folder_desc">${emptyDesc}</span>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = filtered.map(f => createMediaCardHTML(f)).join('');
  } else {
    // Modo Lista (Tabla)
    if (gridContainer) gridContainer.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    if (totalCount === 0) {
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 32px; color: var(--color-text-dim);">
              No hay archivos en esta carpeta.
            </td>
          </tr>
        `;
      }
      return;
    }

    if (tableBody) {
      tableBody.innerHTML = filtered.map(f => createMediaTableRowHTML(f)).join('');
    }
  }

  updateMediaActionButtons();
}

// ====================================================================
// GENERADORES HTML DE ELEMENTOS (CARD & ROW)
// ====================================================================

function createMediaCardHTML(f) {
  const isSelected = selectedMediaPaths.has(f.rel_path);
  const isCut = mediaClipboard.mode === 'cut' && mediaClipboard.paths.includes(f.rel_path);
  const sizeText = f.size_kb > 1024 ? `${(f.size_kb / 1024).toFixed(1)} MB` : `${f.size_kb} KB`;
  const mdate = f.mtime ? new Date(f.mtime).toLocaleDateString() : '';

  // Miniatura según tipo
  let thumbHTML = '';
  if (f.type === 'video') {
    thumbHTML = `
      <video src="${f.url}" preload="metadata" muted onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>
    `;
  } else if (f.type === 'image') {
    thumbHTML = `<img src="${f.url}" alt="${f.name}" loading="lazy">`;
  } else {
    thumbHTML = `
      <div class="media-audio-preview-visual">
        <span style="font-size: 32px;">🎵</span>
        <span style="font-size: 10px; font-family: var(--font-tech);">AUDIO</span>
      </div>
    `;
  }

  const typeClass = f.type === 'video' ? 'type-video' : (f.type === 'sound' ? 'type-sound' : 'type-image');
  const typeLabel = f.type === 'video' ? '🎬 VÍDEO' : (f.type === 'sound' ? '🎵 AUDIO' : '🖼️ IMAGEN');

  return `
    <div class="media-card ${isSelected ? 'selected' : ''} ${isCut ? 'is-cut' : ''}" 
         draggable="true" 
         ondragstart="onMediaDragStart(event, '${f.rel_path}')"
         ondblclick="openMediaPreview('${f.rel_path}')"
         data-path="${f.rel_path}">
      
      <input type="checkbox" class="media-select-checkbox" 
             ${isSelected ? 'checked' : ''} 
             onclick="toggleMediaSelection(event, '${f.rel_path}')">
      
      <span class="media-type-badge ${typeClass}">${typeLabel}</span>

      <div class="media-thumb-box" onclick="openMediaPreview('${f.rel_path}')">
        ${thumbHTML}
      </div>

      <div class="media-card-info">
        <div class="media-card-title" title="${f.name}">${f.name}</div>
        <div class="media-card-meta">
          <span>${sizeText}</span>
          <span>${mdate}</span>
        </div>
      </div>

      <div class="media-card-actions">
        <button class="btn-action-test" style="flex: 1; padding: 4px;" onclick="openMediaPreview('${f.rel_path}')" title="Vista Previa y Reproductor">
          ▶️ Ver
        </button>
        <button class="btn-action-test" style="padding: 4px 6px;" onclick="copyText('${f.url}')" title="Copiar URL relativa para OBS">
          📋 URL
        </button>
        <button class="btn-action-test" style="padding: 4px 6px;" onclick="assignPathToCurrentTrigger('${f.url}', '${f.type}')" title="Asignar al Trigger actual">
          ⚡ Trigger
        </button>
        <button class="btn-action-danger" style="padding: 4px 6px;" onclick="deleteMediaSingle('${f.rel_path}')" title="Eliminar archivo">
          🗑️
        </button>
      </div>
    </div>
  `;
}

function createMediaTableRowHTML(f) {
  const isSelected = selectedMediaPaths.has(f.rel_path);
  const isCut = mediaClipboard.mode === 'cut' && mediaClipboard.paths.includes(f.rel_path);
  const sizeText = f.size_kb > 1024 ? `${(f.size_kb / 1024).toFixed(1)} MB` : `${f.size_kb} KB`;
  const mdate = f.mtime ? new Date(f.mtime).toLocaleString() : '';
  const icon = f.type === 'video' ? '🎬' : (f.type === 'sound' ? '🎵' : '🖼️');

  return `
    <tr class="${isSelected ? 'selected' : ''} ${isCut ? 'is-cut' : ''}" 
        draggable="true" 
        ondragstart="onMediaDragStart(event, '${f.rel_path}')"
        ondblclick="openMediaPreview('${f.rel_path}')"
        data-path="${f.rel_path}">
      <td>
        <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="toggleMediaSelection(event, '${f.rel_path}')" style="accent-color: var(--color-accent-cyan);">
      </td>
      <td style="font-weight: 700; cursor: pointer;" onclick="openMediaPreview('${f.rel_path}')">
        <span>${icon}</span> ${f.name}
      </td>
      <td style="color: var(--color-text-dim);">${f.folder || 'raíz'}</td>
      <td>
        <span class="media-type-badge type-${f.type}" style="position: static; font-size: 9px;">${f.type.toUpperCase()}</span>
      </td>
      <td>${sizeText}</td>
      <td style="color: var(--color-text-dim); font-size: 11px;">${mdate}</td>
      <td style="text-align: right; white-space: nowrap;">
        <button class="btn-action-test" style="padding: 3px 6px; font-size: 10px;" onclick="openMediaPreview('${f.rel_path}')">▶️</button>
        <button class="btn-action-test" style="padding: 3px 6px; font-size: 10px;" onclick="copyText('${f.url}')">📋</button>
        <button class="btn-action-test" style="padding: 3px 6px; font-size: 10px;" onclick="openRenameModal('${f.rel_path}', '${f.name}')">✏️</button>
        <button class="btn-action-danger" style="padding: 3px 6px; font-size: 10px;" onclick="deleteMediaSingle('${f.rel_path}')">🗑️</button>
      </td>
    </tr>
  `;
}

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

// ====================================================================
// SUBIDA DE ARCHIVOS CON AUTO-CLASIFICACIÓN INTELIGENTE
// ====================================================================

async function uploadFiles(files, forcedFolder = null) {
  if (!files || files.length === 0) return;

  const progress = document.getElementById('upload-progress-box');
  const autoClassifyCheckbox = document.getElementById('media-auto-classify-toggle');
  const autoClassify = autoClassifyCheckbox ? autoClassifyCheckbox.checked : true;
  const targetFolder = forcedFolder !== null ? forcedFolder : (autoClassify ? '' : currentFolder);

  if (progress) {
    progress.style.display = 'block';
    progress.textContent = `Subiendo ${files.length} archivo(s)... ${autoClassify ? '(Auto-clasificando vídeos, audios e imágenes)' : `(a ${targetFolder || 'raíz'})`}`;
  }

  const fd = new FormData();
  for (let i = 0; i < files.length; i++) {
    fd.append('file_' + i, files[i]);
  }
  fd.append('auto_classify', autoClassify ? 'true' : 'false');
  fd.append('folder', targetFolder);

  try {
    const query = `auto_classify=${autoClassify ? 'true' : 'false'}&folder=${encodeURIComponent(targetFolder)}`;
    const data = await API.uploadMedia(fd, query);

    if (progress) {
      const num = data.uploaded?.length || files.length;
      progress.textContent = `✓ ¡${num} archivo(s) subidos y clasificados con éxito!`;
      setTimeout(() => progress.style.display = 'none', 3500);
    }
    await loadMedia();
  } catch (e) {
    if (progress) progress.textContent = '❌ Error al subir los archivos.';
  }
}

// ====================================================================
// OPERACIONES DE BORRADO, RENOMBRADO Y NUEVA CARPETA
// ====================================================================

async function deleteMediaSingle(relPath) {
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('media.confirm_delete_single', `¿Eliminar definitivamente "${relPath}"?`, { path: relPath }))) return;
  await API.deleteMedia(relPath);
  selectedMediaPaths.delete(relPath);
  await loadMedia();
}

async function deleteSelectedMedia() {
  const count = selectedMediaPaths.size;
  if (count === 0) return;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  if (!confirm(tr('media.confirm_delete_batch', `¿Eliminar los ${count} elementos seleccionados de tu disco local?`, { count }))) return;

  const paths = Array.from(selectedMediaPaths);
  await API.deleteMediaBatch(paths);
  selectedMediaPaths.clear();
  await loadMedia();
}

// Modal Nueva Carpeta
function openCreateFolderModal() {
  const modal = document.getElementById('media-mkdir-modal');
  const lblParent = document.getElementById('lbl-mkdir-parent');
  const input = document.getElementById('mkdir-folder-name');
  if (lblParent) lblParent.textContent = currentFolder ? `/${currentFolder}/` : 'raíz de la biblioteca';
  if (input) input.value = '';
  if (modal) {
    modal.style.display = 'flex';
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(modal);
    }
  }
  setTimeout(() => input && input.focus(), 50);
}

function closeCreateFolderModal() {
  const modal = document.getElementById('media-mkdir-modal');
  if (modal) modal.style.display = 'none';
}

async function submitCreateFolder() {
  const input = document.getElementById('mkdir-folder-name');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;

  try {
    await API.mkdirMedia(name, currentFolder);
    closeCreateFolderModal();
    await loadMedia();
  } catch (e) {
    const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb; alert(tr('media.error_create_folder', 'Error al crear la carpeta. Asegúrate de usar caracteres válidos.'));
  }
}

// Modal Renombrar
function openRenameModal(path, currentName) {
  const modal = document.getElementById('media-rename-modal');
  const inputPath = document.getElementById('rename-target-path');
  const inputName = document.getElementById('rename-new-name');
  if (inputPath) inputPath.value = path;
  if (inputName) inputName.value = currentName;
  if (modal) {
    modal.style.display = 'flex';
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(modal);
    }
  }
  setTimeout(() => inputName && inputName.focus(), 50);
}

function closeRenameModal() {
  const modal = document.getElementById('media-rename-modal');
  if (modal) modal.style.display = 'none';
}

async function submitRename() {
  const inputPath = document.getElementById('rename-target-path');
  const inputName = document.getElementById('rename-new-name');
  if (!inputPath || !inputName) return;

  const oldPath = inputPath.value;
  const newName = inputName.value.trim();
  if (!oldPath || !newName) return;

  try {
    await API.renameMedia(oldPath, newName);
    closeRenameModal();
    await loadMedia();
  } catch (e) {
    const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb; alert(tr('media.error_rename', 'Error al renombrar. Verifica que el nombre no contenga caracteres inválidos.'));
  }
}

// ====================================================================
// MODAL DE PREVISUALIZACIÓN MULTIMEDIA Y PRUEBAS EN OBS
// ====================================================================

function openMediaPreview(relPath) {
  const item = cachedMedia.find(f => f.rel_path === relPath);
  if (!item) return;

  currentPreviewItem = item;
  const modal = document.getElementById('media-preview-modal');
  const title = document.getElementById('media-preview-title');
  const sub = document.getElementById('media-preview-sub');
  const icon = document.getElementById('media-preview-icon');
  const size = document.getElementById('media-preview-size');
  const urlCode = document.getElementById('media-preview-url-code');
  const dlLink = document.getElementById('media-preview-download-link');
  const stage = document.getElementById('media-preview-stage');

  if (title) title.textContent = item.name;
  if (sub) sub.textContent = item.url;
  if (icon) icon.textContent = item.type === 'video' ? '🎬' : (item.type === 'sound' ? '🎵' : '🖼️');
  if (size) size.textContent = item.size_kb > 1024 ? `${(item.size_kb / 1024).toFixed(2)} MB` : `${item.size_kb} KB`;
  if (urlCode) urlCode.textContent = item.url;
  if (dlLink) {
    dlLink.href = item.url;
    dlLink.download = item.name;
  }

  if (stage) {
    if (item.type === 'video') {
      stage.innerHTML = `<video src="${item.url}" controls autoplay loop style="max-height: 420px;"></video>`;
    } else if (item.type === 'image') {
      stage.innerHTML = `<img src="${item.url}" alt="${item.name}" style="max-height: 420px; object-fit: contain;">`;
    } else {
      stage.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <span style="font-size: 54px;">🎵</span>
          <audio src="${item.url}" controls autoplay style="width: 380px;"></audio>
        </div>
      `;
    }
  }

  if (modal) {
    modal.style.display = 'flex';
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(modal);
    }
  }
}

function closeMediaPreview() {
  const modal = document.getElementById('media-preview-modal');
  const stage = document.getElementById('media-preview-stage');
  if (stage) stage.innerHTML = ''; // Detener audio o vídeo
  if (modal) modal.style.display = 'none';
  currentPreviewItem = null;
}

function copyCurrentPreviewUrl() {
  if (!currentPreviewItem) return;
  copyText(currentPreviewItem.url);
}

function testCurrentPreviewAlert() {
  if (!currentPreviewItem) return;
  const isVid = currentPreviewItem.type === 'video';
  const isImg = currentPreviewItem.type === 'image';

  API.testAlert({
    type: currentPreviewItem.type === 'sound' ? 'sound' : 'custom_alert',
    video_url: isVid ? currentPreviewItem.url : '',
    image_url: isImg ? currentPreviewItem.url : '',
    sound_url: currentPreviewItem.type === 'sound' ? currentPreviewItem.url : '',
    duration: 6000,
    text: `Test de archivo: ${currentPreviewItem.name}`
  }).catch(() => {});
}

function assignPreviewToCurrentTrigger() {
  if (!currentPreviewItem) return;
  assignPathToCurrentTrigger(currentPreviewItem.url, currentPreviewItem.type);
  closeMediaPreview();
}

function assignPathToCurrentTrigger(url, type) {
  // Cambiar a la sección de triggers
  if (typeof showSection === 'function') {
    showSection('sec-triggers');
  }

  // Cambiar pestaña del editor a multimedia
  if (typeof setTriggerEditorTab === 'function') {
    setTriggerEditorTab('media');
  }

  if (type === 'video' || type === 'image') {
    const radioVid = document.querySelector('input[name="visual_type"][value="video"]');
    const radioImg = document.querySelector('input[name="visual_type"][value="image"]');
    if (type === 'video' && radioVid) {
      radioVid.checked = true;
      if (typeof setVisualType === 'function') setVisualType('video');
    } else if (type === 'image' && radioImg) {
      radioImg.checked = true;
      if (typeof setVisualType === 'function') setVisualType('image');
    }

    const selMedia = document.getElementById('trig-media-file');
    const customUrl = document.getElementById('trig-media-custom-url');
    if (customUrl) customUrl.value = url;
    if (selMedia) selMedia.value = url;
    if (typeof onVisualFileChange === 'function') onVisualFileChange(url);
  } else if (type === 'sound') {
    const radioSnd = document.querySelector('input[name="audio_source"][value="file"]');
    if (radioSnd) {
      radioSnd.checked = true;
      if (typeof setAudioSource === 'function') setAudioSource('file');
    }
    const selSound = document.getElementById('trig-sound-file');
    const customSnd = document.getElementById('trig-sound-custom-url');
    if (selSound) selSound.value = url;
    if (customSnd) customSnd.value = url;
    if (typeof onSoundFileChange === 'function') onSoundFileChange(url);
  }
}

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

  if (selMedia) {
    const prevVal = selMedia.value;
    selMedia.innerHTML = '<option value="">-- Seleccionar archivo visual subido --</option>';
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
    selSound.innerHTML = '<option value="">-- Seleccionar archivo de sonido subido --</option>';
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
