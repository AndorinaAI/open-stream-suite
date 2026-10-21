
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
