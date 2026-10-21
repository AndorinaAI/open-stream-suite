
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
