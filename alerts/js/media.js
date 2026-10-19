// ====================================================================
// GESTOR DE MEDIOS (VÍDEOS, AUDIOS, IMÁGENES) Y SUBIDA DRAG & DROP
// ====================================================================

let cachedMedia = [];

async function loadMedia() {
  try {
    const data = await API.getMedia();
    cachedMedia = data.files || [];
    renderMedia();
    populateMediaSelect();
  } catch (e) {
    console.error('Error al cargar medios:', e);
  }
}

function renderMedia() {
  const grid = document.getElementById('media-items-grid');
  const badge = document.getElementById('media-total-badge');
  if (!grid) return;
  if (badge) badge.textContent = `${cachedMedia.length} ARCHIVOS`;

  if (cachedMedia.length === 0) {
    grid.innerHTML = '<div style="color: var(--color-text-dim); font-size: 13px;">No hay archivos aún. Arrastra vídeos o audios arriba.</div>';
    return;
  }

  grid.innerHTML = '';
  cachedMedia.forEach(f => {
    const card = document.createElement('div');
    card.className = 'dash-card';
    card.style.padding = '14px';
    const icon = f.type === 'video' ? '🎬' : (f.type === 'sound' ? '🎵' : '🖼️');
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; font-size: 13px; word-break: break-all;">${icon} ${f.name}</span>
        <span style="font-family: var(--font-tech); font-size: 10px; color: var(--color-text-dim);">${f.size_kb} KB</span>
      </div>
      <div style="display: flex; gap: 6px; margin-top: 6px;">
        <button class="btn-action-test" style="flex:1;" onclick="previewMedia('${f.url}', '${f.type}')">▶️ Probar</button>
        <button class="btn-action-test" onclick="copyText('${f.url}')">📋 URL</button>
        <button class="btn-action-danger" onclick="deleteMedia('${f.url.replace('/media/', '')}')">🗑️</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function populateMediaSelect() {
  const selMedia = document.getElementById('trig-media-file');
  const selSound = document.getElementById('trig-sound-file');

  if (selMedia) {
    selMedia.innerHTML = '<option value="">-- Seleccionar archivo visual subido --</option>';
    cachedMedia.forEach(f => {
      if (currentVisualType === 'video' && f.type !== 'video') return;
      if (currentVisualType === 'image' && f.type !== 'image') return;
      const opt = document.createElement('option');
      opt.value = f.url;
      opt.textContent = `[${f.type.toUpperCase()}] ${f.name}`;
      selMedia.appendChild(opt);
    });
  }

  if (selSound) {
    selSound.innerHTML = '<option value="">-- Seleccionar archivo de sonido subido --</option>';
    cachedMedia.filter(f => f.type === 'sound' || f.name.endsWith('.mp3') || f.name.endsWith('.wav')).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.url;
      opt.textContent = `🎵 ${f.name} (${f.size_kb} KB)`;
      selSound.appendChild(opt);
    });
  }
}

function previewMedia(url, type) {
  if (type === 'sound') {
    const snd = new Audio(url);
    snd.play().catch(() => {});
  } else {
    API.testAlert({ type: 'video', video_url: url, duration: 6000 }).catch(() => {});
  }
}

async function deleteMedia(relPath) {
  if (!confirm(`¿Eliminar ${relPath}?`)) return;
  await API.deleteMedia(relPath);
  loadMedia();
}

async function uploadFiles(files) {
  const progress = document.getElementById('upload-progress-box');
  if (progress) {
    progress.style.display = 'block';
    progress.textContent = `Subiendo ${files.length} archivo(s)...`;
  }

  const fd = new FormData();
  for (let i = 0; i < files.length; i++) {
    fd.append('file_' + i, files[i]);
  }

  try {
    const data = await API.uploadMedia(fd);
    if (progress) {
      progress.textContent = `✓ ¡${data.uploaded?.length || 0} archivo(s) subidos con éxito!`;
      setTimeout(() => progress.style.display = 'none', 3000);
    }
    loadMedia();
  } catch (e) {
    if (progress) progress.textContent = '❌ Error al subir.';
  }
}

function initMediaDropzone() {
  const dropZone = document.getElementById('media-dropzone');
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(n => {
    dropZone.addEventListener(n, e => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(n => {
    dropZone.addEventListener(n, e => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length) uploadFiles(files);
  });
}
