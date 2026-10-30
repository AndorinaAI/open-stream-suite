/**
 * alerts-studio/06-preview-test.js — Motor de previsualización en vivo, simulación y guardado
 */
function previewEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function previewColor(value, fallback) {
  const s = String(value == null ? '' : value).trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}
function previewClass(value, fallback) {
  const s = String(value == null ? '' : value).replace(/[^A-Za-z0-9_-]/g, '');
  return s || fallback;
}
function previewFont(value) {
  const s = String(value == null ? '' : value).trim();
  return /^[A-Za-z0-9 ,'()_-]+$/.test(s) ? s : 'var(--font-tech), monospace';
}

Object.assign(AlertsStudio, {
  updatePreview(animate = false) {
    const box = document.getElementById('preview-alert-box');
    if (!box) return;

    const c = this.config ? this.config.alerts[this.currentType] : null;
    if (!c) return;

    const user = (document.getElementById('sim-user') || {}).value || 'AndorinaDev';
    const extraVal = (document.getElementById('sim-extra-val') || {}).value || '10.00 EUR';
    const msg = (document.getElementById('sim-msg') || {}).value || '¡Gran directo!';
    const chosenPlat = (document.getElementById('sim-plat-choice') || {}).value || this.currentDonationPlatform || 'kofi';

    const platNames = { kofi: 'Ko-fi', paypal: 'PayPal', buymeacoffee: 'Buy Me a Coffee', streamlabs: 'Streamlabs' };
    const displayPlat = platNames[chosenPlat] || chosenPlat;

    const resolveTpl = (tpl) => {
      return (tpl || '')
        .replace(/\{user\}/gi, user)
        .replace(/\{username\}/gi, user)
        .replace(/\{amount\}/gi, extraVal)
        .replace(/\{months\}/gi, extraVal)
        .replace(/\{viewers\}/gi, extraVal)
        .replace(/\{bits\}/gi, extraVal)
        .replace(/\{currency\}/gi, 'EUR')
        .replace(/\{platform\}/gi, displayPlat)
        .replace(/\{message\}/gi, msg);
    };

    let titleTpl = c.titleTemplate || c.templateTitle || '¡ALERTA DE DIRECTO!';
    let subtitleTpl = c.subtitleTemplate || c.templateMessage || '';
    let effectiveMediaMode = c.mediaMode || 'banner';
    let effectiveMediaUrl = c.mediaUrl || '';
    let effectiveBannerStyle = previewClass(c.bannerStyle || 'cyberpunk', 'cyberpunk');
    let effectiveBorderColor = previewColor(c.bannerBorderColor || c.borderColor || '#57D6C4', '#57D6C4');
    let effectiveTextColor = previewColor(c.bannerTextColor || '#FFFFFF', '#FFFFFF');
    let effectiveBadge = '';

    const typeMeta = this.ALERT_TYPES.find(t => t.id === this.currentType) || this.ALERT_TYPES[0];
    effectiveBadge = typeMeta.badge.replace('{months}', extraVal).replace('{amount}', extraVal).replace('{viewers}', extraVal);

    // Si es donación y está activado perPlatform
    if (this.currentType === 'donation' && c.perPlatformEnabled && c.platforms && c.platforms[chosenPlat]) {
      const p = c.platforms[chosenPlat];
      if (p.titleTemplate) titleTpl = p.titleTemplate;
      if (p.subtitleTemplate) subtitleTpl = p.subtitleTemplate;
      if (p.badge) effectiveBadge = p.badge;
      else effectiveBadge = displayPlat.toUpperCase();

      if (p.mediaMode === 'banner') {
        effectiveMediaMode = 'banner';
        if (p.bannerStyle) effectiveBannerStyle = previewClass(p.bannerStyle, 'cyberpunk');
        if (p.bannerBorderColor) effectiveBorderColor = previewColor(p.bannerBorderColor, '#57D6C4');
      } else if (p.mediaMode === 'media') {
        effectiveMediaMode = 'media';
        if (p.mediaUrl) effectiveMediaUrl = p.mediaUrl;
      }
    }

    const titleText = previewEscape(resolveTpl(titleTpl));
    const subtitleText = previewEscape(resolveTpl(subtitleTpl));
    const badgeText = previewEscape(effectiveBadge);
    const userText = previewEscape(user);
    const anim = previewClass(c.bannerAnimation || 'pop', 'pop');
    const font = previewFont(c.bannerFontFamily || 'var(--font-tech), monospace');

    // Tema de pack asignado al miembro que se previsualiza. Sin esto el
    // simulador solo pintaba el sistema antiguo (banner-theme-*), así que
    // asignar un tema de pack parecía no hacer nada: el cambio solo se veía al
    // abrir la fuente en OBS. themes.css declara los tokens con selector
    // genérico [data-theme="x"], así que basta el atributo en el nodo.
    const previewKey = effectiveMediaMode === 'banner' ? 'alert:banner' : 'alert:card';
    const previewTheme = (window.ComponentThemes && ComponentThemes.themeStateFor)
      ? (ComponentThemes.themeStateFor(previewKey) || {})
      : {};
    const packAttrs = [
      ' data-oss-panel="true"',
      previewTheme.theme ? ` data-theme="${previewEscape(previewTheme.theme)}"` : '',
      previewTheme.shape ? ` data-theme-shape="${previewEscape(previewTheme.shape)}"` : ''
    ].join('');

    if (effectiveMediaMode === 'banner') {
      box.innerHTML = `
        <div id="preview-alert-element" class="banner-alert-root banner-theme-${effectiveBannerStyle} anim-${anim}"${packAttrs} style="--banner-border: ${effectiveBorderColor}; --banner-accent: ${effectiveBorderColor}; --banner-text: ${effectiveTextColor}; font-family: ${font};">
          <div class="banner-icon-box" style="width: 52px; height: 52px; font-size: 24px; display: flex; align-items: center; justify-content: center; border-color: ${effectiveBorderColor}66; color: ${effectiveBorderColor};">
            ${this.getAlertIconSvg(this.currentType, chosenPlat)}
          </div>
          <div class="banner-text-col" style="margin-left: 14px;">
            <div class="banner-badge-tag" style="color: ${effectiveBorderColor}; border-color: ${effectiveBorderColor}44;">
              ${badgeText}
            </div>
            <div class="banner-primary-title" style="color: ${effectiveBorderColor}; font-size: 11px;">
              ${titleText}
            </div>
            <div class="banner-user-display" style="font-size: 22px; color: ${effectiveTextColor};">
              ${userText}
            </div>
            ${subtitleText ? `<div class="banner-subtitle-msg" style="font-size: 11px;">${subtitleText}</div>` : ''}
          </div>
        </div>
      `;
    } else {
      // Modo Multimedia
      const isVideo = effectiveMediaUrl && (effectiveMediaUrl.endsWith('.webm') || effectiveMediaUrl.endsWith('.mp4'));
      box.innerHTML = `
        <div id="preview-alert-element" class="preview-media-container anim-${anim}"${packAttrs} style="position: relative; width: 340px; text-align: center;">
          ${effectiveMediaUrl ? (isVideo ? `
            <video src="${previewEscape(effectiveMediaUrl)}" autoplay loop muted playsinline style="max-width: 100%; max-height: 180px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);"></video>
          ` : `
            <img src="${previewEscape(effectiveMediaUrl)}" style="max-width: 100%; max-height: 180px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);" alt="Media Preview">
          `) : `
            <div style="background: rgba(255,255,255,0.05); border: 2px dashed #475569; border-radius: 8px; padding: 24px; color: var(--color-text-dim); font-size: 11px;">
              [No has seleccionado archivo multimedia]<br>Elige un archivo de vídeo o GIF en el menú.
            </div>
          `}
          <div style="margin-top: 8px; display: inline-block; padding: 6px 14px; background: rgba(18, 22, 26, 0.94); border: 2px solid ${effectiveBorderColor}; border-radius: 6px; font-weight: 800; font-size: 12px; color: #FFF; box-shadow: 0 0 16px rgba(87, 214, 196, 0.3);">
            ${titleText}: ${userText}
          </div>
        </div>
      `;
    }

    if (animate) {
      this.playPreviewAnimation();
    }
  },

  playPreviewAnimation() {
    const el = document.getElementById('preview-alert-element');
    if (!el) return;

    const c = this.config.alerts[this.currentType] || {};
    const anim = c.bannerAnimation || 'pop';

    // Eliminar clases y forzar reflow
    el.classList.remove('preview-play-anim');
    this.ANIMATIONS_LIST.forEach(a => el.classList.remove(`anim-${a.id}`));
    void el.offsetWidth;

    // Aplicar animación
    el.classList.add('preview-play-anim', `anim-${anim}`);

    // Si tiene sonido activado para preview, reproducir
    const soundChk = document.getElementById('cfg-preview-sound');
    if (soundChk && soundChk.checked && typeof AudioEngine !== 'undefined') {
      const soundMode = c.soundMode || 'synth';
      if (soundMode === 'synth') {
        const tone = c.synthTone || (this.currentType === 'donation' ? 'coin' : 'sub');
        AudioEngine.playChime(tone);
      } else if (soundMode === 'custom' && c.soundUrl) {
        const snd = new Audio(c.soundUrl);
        snd.volume = typeof c.soundVolume === 'number' ? (c.soundVolume / 100) : 0.8;
        snd.play().catch(() => {});
      }
    }
  },

  togglePreviewLoop(enabled) {
    if (this.previewLoopTimer) {
      clearInterval(this.previewLoopTimer);
      this.previewLoopTimer = null;
    }
    if (enabled) {
      this.playPreviewAnimation();
      this.previewLoopTimer = setInterval(() => {
        this.playPreviewAnimation();
      }, 4000);
    }
  },

  async saveConfig() {
    try {
      const res = await fetch('/api/alerts/config', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ alerts: this.config.alerts })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        // Se envia el bloque de alertas COMPLETO: se limpian todas las claves
        // 'alert:*' (no solo la activa), sin tocar las de los widgets.
        if (window.UI && UI.clearDirtyScope) UI.clearDirtyScope('alert');
        this.showToast('✓ Configuración de alertas guardada con éxito.');
      } else {
        if (window.UI && UI.showToast) UI.showToast('No se pudo guardar: ' + (data.error || 'Respuesta inesperada'), 'error');
      }
    } catch (e) {
      if (window.UI && UI.showToast) UI.showToast('Error de conexión al guardar: ' + e, 'error');
    }
  },

  async triggerCurrentTest() {
    const user = (document.getElementById('sim-user') || {}).value || 'AndorinaDev';
    const extraVal = (document.getElementById('sim-extra-val') || {}).value || '10.00 EUR';
    const msg = (document.getElementById('sim-msg') || {}).value || '¡Saludos!';
    const chosenPlat = (document.getElementById('sim-plat-choice') || {}).value || 'kofi';

    const testPayload = {
      alertType: this.currentType,
      user: user,
      message: msg,
      months: extraVal,
      amount: extraVal,
      currency: 'EUR',
      viewers: extraVal,
      platform: chosenPlat
    };

    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.showToast(`🚀 Alerta de [${this.currentType.toUpperCase()}] emitida a OBS`);
      } else {
        alert('Error en prueba: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Error enviando prueba: ' + e);
    }
  }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  AlertsStudio.init();
});

