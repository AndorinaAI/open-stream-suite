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
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  if (totalBadge) totalBadge.textContent = `${count} ${tr('media.files_count_badge', 'ARCHIVOS')}`;

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

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const displayFolder = currentFolder ? `/${currentFolder}/` : tr('media.root_library', 'Biblioteca raíz');
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
