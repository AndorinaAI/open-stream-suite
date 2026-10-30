function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

// Valor seguro para un atributo HTML (incluye comillas).
function escapeAttr(value) {
  return escapeHtml(value);
}

// Argumento seguro para un handler inline: JSON.stringify conserva los
// caracteres especiales de JS y escapeHtml evita romper el atributo.
function inlineArg(value) {
  return escapeAttr(JSON.stringify(String(value == null ? "" : value)));
}

function safeMediaType(value) {
  return ["video", "sound", "image"].includes(value) ? value : "other";
}


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
      <span class="tree-node-name">📁 ${escapeHtml(tr('media.root_library', 'Biblioteca Raíz'))}</span>
      <span class="tree-node-badge">${Number(cachedMedia.length) || 0}</span>
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
           style="padding-left: ${Number(indentPx) || 0}px;"
           onclick="navigateMediaFolder(${inlineArg(fPath)})"
           ondragover="onFolderDragOver(event)"
           ondragleave="onFolderDragLeave(event)"
           ondrop="onFolderDrop(event, ${inlineArg(fPath)})"
           data-folder="${escapeAttr(fPath)}">
        <span class="tree-node-name">
          <span>${escapeHtml(getFolderIcon(folderName))}</span>
          <span>${escapeHtml(folderName)}</span>
        </span>
        <span class="tree-node-badge">${Number(count) || 0}</span>
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
               onclick="navigateMediaFolder(${inlineArg(sf)})"
               ondragover="onFolderDragOver(event)"
               ondragleave="onFolderDragLeave(event)"
               ondrop="onFolderDrop(event, ${inlineArg(sf)})"
               title="${escapeAttr(tr('media.folder_card_tooltip', 'Doble clic para entrar o arrastra archivos aquí para moverlos'))}">
            <span style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 12px;">
              <span style="font-size: 16px;">${escapeHtml(getFolderIcon(sfName))}</span>
              <span>${escapeHtml(sfName)}</span>
            </span>
            <span class="tree-node-badge">${Number(count) || 0}</span>
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
          <b data-i18n="media.empty_folder_title">${escapeHtml(emptyTitle)}</b><br>
          <span style="font-size: 11px;" data-i18n="media.empty_folder_desc">${escapeHtml(emptyDesc)}</span>
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
  const type = safeMediaType(f.type);
  const isSelected = selectedMediaPaths.has(f.rel_path);
  const isCut = mediaClipboard.mode === 'cut' && mediaClipboard.paths.includes(f.rel_path);
  const sizeText = f.size_kb > 1024 ? `${(f.size_kb / 1024).toFixed(1)} MB` : `${f.size_kb} KB`;
  const mdate = f.mtime ? new Date(f.mtime).toLocaleDateString() : '';
  const safeUrl = escapeAttr(f.url);
  const safeName = escapeHtml(f.name);
  const safeRelPath = escapeAttr(f.rel_path);

  // Miniatura según tipo
  let thumbHTML = '';
  if (type === 'video') {
    thumbHTML = `
      <video src="${safeUrl}" preload="metadata" muted onmouseover="this.play()" onmouseout="this.pause();this.currentTime=0;"></video>
    `;
  } else if (type === 'image') {
    thumbHTML = `<img src="${safeUrl}" alt="${safeName}" loading="lazy">`;
  } else {
    thumbHTML = `
      <div class="media-audio-preview-visual">
        <span style="font-size: 32px;">🎵</span>
        <span style="font-size: 10px; font-family: var(--font-tech);">AUDIO</span>
      </div>
    `;
  }

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const typeClass = type === 'video' ? 'type-video' : (type === 'sound' ? 'type-sound' : 'type-image');
  const typeLabel = type === 'video' ? tr('media.type_video', '🎬 VÍDEO') : (type === 'sound' ? tr('media.type_sound', '🎵 AUDIO') : tr('media.type_image', '🖼️ IMAGEN'));

  return `
    <div class="media-card ${isSelected ? 'selected' : ''} ${isCut ? 'is-cut' : ''}" 
         draggable="true" 
         ondragstart="onMediaDragStart(event, ${inlineArg(f.rel_path)})"
         ondblclick="openMediaPreview(${inlineArg(f.rel_path)})"
         data-path="${safeRelPath}">
      
      <input type="checkbox" class="media-select-checkbox" 
             ${isSelected ? 'checked' : ''} 
             onclick="toggleMediaSelection(event, ${inlineArg(f.rel_path)})">
      
      <span class="media-type-badge ${typeClass}">${escapeHtml(typeLabel)}</span>

      <div class="media-thumb-box" onclick="openMediaPreview(${inlineArg(f.rel_path)})">
        ${thumbHTML}
      </div>

      <div class="media-card-info">
        <div class="media-card-title" title="${safeName}">${safeName}</div>
        <div class="media-card-meta">
          <span>${sizeText}</span>
          <span>${mdate}</span>
        </div>
      </div>

      <div class="media-card-actions">
        <button class="btn-action-test" style="flex: 1; padding: 4px;" onclick="openMediaPreview(${inlineArg(f.rel_path)})" title="${escapeAttr(tr('media.btn_view_tooltip', 'Vista Previa y Reproductor'))}">
          ▶️ ${escapeHtml(tr('media.btn_view_short', 'Ver'))}
        </button>
        <button class="btn-action-test" style="padding: 4px 6px;" onclick="copyText(${inlineArg(f.url)})" title="${escapeAttr(tr('media.btn_copy_url_tooltip', 'Copiar URL relativa para OBS'))}">
          📋 ${escapeHtml(tr('media.btn_copy_url_short', 'URL'))}
        </button>
        <button class="btn-action-test" style="padding: 4px 6px;" onclick="assignPathToCurrentTrigger(${inlineArg(f.url)}, ${inlineArg(type)})" title="${escapeAttr(tr('media.btn_trigger_tooltip', 'Asignar al Trigger actual'))}">
          ⚡ ${escapeHtml(tr('media.btn_trigger_short', 'Trigger'))}
        </button>
        <button class="btn-action-danger" style="padding: 4px 6px;" onclick="deleteMediaSingle(${inlineArg(f.rel_path)})" title="${escapeAttr(tr('media.btn_delete_tooltip', 'Eliminar archivo'))}">
          🗑️
        </button>
      </div>
    </div>
  `;
}

function createMediaTableRowHTML(f) {
  const type = safeMediaType(f.type);
  const isSelected = selectedMediaPaths.has(f.rel_path);
  const isCut = mediaClipboard.mode === 'cut' && mediaClipboard.paths.includes(f.rel_path);
  const sizeText = f.size_kb > 1024 ? `${(f.size_kb / 1024).toFixed(1)} MB` : `${f.size_kb} KB`;
  const mdate = f.mtime ? new Date(f.mtime).toLocaleString() : '';
  const icon = type === 'video' ? '🎬' : (type === 'sound' ? '🎵' : '🖼️');

  return `
    <tr class="${isSelected ? 'selected' : ''} ${isCut ? 'is-cut' : ''}" 
        draggable="true" 
        ondragstart="onMediaDragStart(event, ${inlineArg(f.rel_path)})"
        ondblclick="openMediaPreview(${inlineArg(f.rel_path)})"
        data-path="${escapeAttr(f.rel_path)}">
      <td>
        <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="toggleMediaSelection(event, ${inlineArg(f.rel_path)})" style="accent-color: var(--color-accent-cyan);">
      </td>
      <td style="font-weight: 700; cursor: pointer;" onclick="openMediaPreview(${inlineArg(f.rel_path)})">
        <span>${icon}</span> ${escapeHtml(f.name)}
      </td>
      <td style="color: var(--color-text-dim);">${escapeHtml(f.folder || "raíz")}</td>
      <td>
        <span class="media-type-badge type-${type}" style="position: static; font-size: 9px;">${escapeHtml(type.toUpperCase())}</span>
      </td>
      <td>${sizeText}</td>
      <td style="color: var(--color-text-dim); font-size: 11px;">${mdate}</td>
      <td style="text-align: right; white-space: nowrap;">
        <button class="btn-action-test" style="padding: 3px 6px; font-size: 10px;" onclick="openMediaPreview(${inlineArg(f.rel_path)})" title="Ver" aria-label="Ver">▶️</button>
        <button class="btn-action-test" style="padding: 3px 6px; font-size: 10px;" onclick="copyText(${inlineArg(f.url)})" title="Copiar URL" aria-label="Copiar URL">📋</button>
        <button class="btn-action-test" style="padding: 3px 6px; font-size: 10px;" onclick="openRenameModal(${inlineArg(f.rel_path)}, ${inlineArg(f.name)})" title="Renombrar" aria-label="Renombrar">✏️</button>
        <button class="btn-action-danger" style="padding: 3px 6px; font-size: 10px;" onclick="confirmDeleteMediaSingle(${inlineArg(f.rel_path)})" title="Eliminar archivo" aria-label="Eliminar archivo">🗑️</button>
      </td>
    </tr>
  `;
}

/* Confirmacion antes de borrar un archivo del disco. */
window.confirmDeleteMediaSingle = function (relPath) {
  if (!window.UI || !window.UI.confirmAction) { return deleteMediaSingle(relPath); }
  window.UI.confirmAction({
    title: 'Eliminar archivo',
    detail: 'Se borrara del disco: ' + relPath,
    confirmLabel: 'Eliminar',
    danger: true
  }).then(function (ok) { if (ok) { deleteMediaSingle(relPath); } });
};
