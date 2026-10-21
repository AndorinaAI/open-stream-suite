
// ====================================================================
// ÁRBOL DE CARPETAS (SIDEBAR) CON SOPORTE DRAG & DROP
// ====================================================================

function renderFolderTree() {
  const container = document.getElementById('media-folder-tree');
  if (!container) return;

  // Raíz principal
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  let html = `
    <div class="tree-node ${currentFolder === '' ? 'active' : ''}" 
         onclick="navigateMediaFolder('')"
         ondragover="onFolderDragOver(event)"
         ondragleave="onFolderDragLeave(event)"
         ondrop="onFolderDrop(event, '')"
         data-folder="">
      <span class="tree-node-name">📁 ${tr('media.root_library', 'Biblioteca Raíz')}</span>
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
        const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
        return `
          <div class="folder-card" 
               onclick="navigateMediaFolder('${sf}')"
               ondragover="onFolderDragOver(event)"
               ondragleave="onFolderDragLeave(event)"
               ondrop="onFolderDrop(event, '${sf}')"
               title="${tr('media.folder_card_tooltip', 'Doble clic para entrar o arrastra archivos aquí para moverlos')}">
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

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const typeClass = f.type === 'video' ? 'type-video' : (f.type === 'sound' ? 'type-sound' : 'type-image');
  const typeLabel = f.type === 'video' ? tr('media.type_video', '🎬 VÍDEO') : (f.type === 'sound' ? tr('media.type_sound', '🎵 AUDIO') : tr('media.type_image', '🖼️ IMAGEN'));

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
        <button class="btn-action-test" style="flex: 1; padding: 4px;" onclick="openMediaPreview('${f.rel_path}')" title="${tr('media.btn_view_tooltip', 'Vista Previa y Reproductor')}">
          ▶️ ${tr('media.btn_view_short', 'Ver')}
        </button>
        <button class="btn-action-test" style="padding: 4px 6px;" onclick="copyText('${f.url}')" title="${tr('media.btn_copy_url_tooltip', 'Copiar URL relativa para OBS')}">
          📋 ${tr('media.btn_copy_url_short', 'URL')}
        </button>
        <button class="btn-action-test" style="padding: 4px 6px;" onclick="assignPathToCurrentTrigger('${f.url}', '${f.type}')" title="${tr('media.btn_trigger_tooltip', 'Asignar al Trigger actual')}">
          ⚡ ${tr('media.btn_trigger_short', 'Trigger')}
        </button>
        <button class="btn-action-danger" style="padding: 4px 6px;" onclick="deleteMediaSingle('${f.rel_path}')" title="${tr('media.btn_delete_tooltip', 'Eliminar archivo')}">
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
