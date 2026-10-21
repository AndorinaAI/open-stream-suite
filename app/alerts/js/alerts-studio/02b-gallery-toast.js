/**
 * alerts-studio/02b-gallery-toast.js — Galería de presets de temas, iconos y notificaciones toast
 */

window.AlertsStudio = window.AlertsStudio || {};

Object.assign(AlertsStudio, {
  renderThemesGallery() {
    const gallery = document.getElementById('themes-preset-gallery');
    if (!gallery || !this.themesConfig || !this.themesConfig.themes) return;

    const currentThemeId = this.selectedThemeId || 'cyberpunk';
    const themesList = Object.values(this.themesConfig.themes);

    gallery.innerHTML = themesList.map(t => {
      const isSelected = (currentThemeId === t.id);
      const isCustom = t.id.startsWith('custom_') || t.badge === 'CUSTOM';
      return `
        <div class="banner-style-card" id="card-theme-${t.id}" onclick="AlertsStudio.selectAndApplyTheme('${t.id}')" style="cursor: pointer; padding: 10px; border-radius: 6px; border: ${isSelected ? '2px solid #57D6C4' : '1px solid var(--color-border-dim)'}; background: ${isSelected ? 'rgba(87, 214, 196, 0.15)' : 'rgba(255,255,255,0.03)'}; transition: all 0.2s ease; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 11px; color: ${t.accentColor || '#57D6C4'};">${t.name}</span>
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${t.accentColor || '#57D6C4'}; box-shadow: 0 0 6px ${t.accentColor || '#57D6C4'};"></span>
          </div>
          <div style="font-size: 9px; color: var(--color-text-dim); line-height: 1.25;">${t.desc || 'Tema para alertas.'}</div>
          ${isCustom ? `<span style="position: absolute; bottom: 4px; right: 6px; font-size: 8px; font-weight: 700; color: #F59E0B;">PERSONALIZADO</span>` : ''}
        </div>
      `;
    }).join('');

    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(gallery);
    }

    // Actualizar nombre en cabecera del editor
    const activeTheme = this.themesConfig.themes[currentThemeId] || this.themesConfig.themes.cyberpunk;
    const lblEl = document.getElementById('lbl-editing-theme-name');
    if (lblEl && activeTheme) {
      lblEl.textContent = activeTheme.name;
    }

    const delBtn = document.getElementById('btn-delete-theme');
    if (delBtn) {
      const isCustom = activeTheme && (activeTheme.id.startsWith('custom_') || activeTheme.badge === 'CUSTOM');
      delBtn.style.display = isCustom ? 'inline-block' : 'none';
    }
  },

  getAlertIconSvg(type, plat) {
    if (type === 'donation') {
      if (plat === 'kofi') return '☕';
      if (plat === 'paypal') return '🅿️';
      if (plat === 'buymeacoffee') return '🟡';
      return '💰';
    }
    const icons = {
      follow: '❤️',
      sub_prime: '👑',
      sub_t1: '⭐',
      sub_t2: '🌟',
      sub_t3: '💫',
      resub: '🔄',
      sub_gift: '🎁',
      sub_community_gift: '📦',
      cheer: '💎',
      raid: '🚀'
    };
    return icons[type] || '✨';
  },

  showToast(msg) {
    if (window.i18n && typeof window.i18n.tr === 'function') {
      msg = window.i18n.tr(msg);
    }
    let toast = document.getElementById('alerts-studio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'alerts-studio-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.padding = '12px 20px';
      toast.style.background = '#1E293B';
      toast.style.color = '#57D6C4';
      toast.style.border = '1px solid #57D6C4';
      toast.style.borderRadius = '8px';
      toast.style.fontFamily = 'var(--font-tech, monospace)';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '700';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      toast.style.zIndex = '9999';
      toast.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }
});
