/**
 * alerts-studio/04-themes.js — Gestión de temas visuales y estilos de alertas
 */
Object.assign(AlertsStudio, {
  selectAndApplyTheme(themeId) {
    if (!this.themesConfig || !this.themesConfig.themes) return;
    const theme = this.themesConfig.themes[themeId];
    if (!theme) return;

    this.selectedThemeId = themeId;
    const c = this.config.alerts[this.currentType];
    if (!c) return;

    c.bannerStyle = theme.style || theme.id;
    c.bannerBorderColor = theme.borderColor || theme.accentColor || '#57D6C4';
    c.bannerAccentColor = theme.accentColor || '#57D6C4';
    c.bannerTextColor = theme.textColor || '#FFFFFF';
    c.bannerFontFamily = theme.fontFamily || 'var(--font-tech), monospace';
    c.bannerAnimation = theme.animation || 'pop';
    c.chatStyleLinked = false;

    // Actualizar campos de input
    const bColor = document.getElementById('cfg-banner-border-color');
    const bHex = document.getElementById('cfg-banner-border-hex');
    const tColor = document.getElementById('cfg-banner-text-color');
    const tHex = document.getElementById('cfg-banner-text-hex');
    const fontEl = document.getElementById('cfg-banner-font');
    const animEl = document.getElementById('cfg-banner-anim');
    const nameEl = document.getElementById('cfg-theme-name');
    const styleEl = document.getElementById('cfg-theme-style');

    if (bColor) bColor.value = c.bannerBorderColor;
    if (bHex) bHex.value = c.bannerBorderColor;
    if (tColor) tColor.value = c.bannerTextColor;
    if (tHex) tHex.value = c.bannerTextColor;
    if (fontEl) fontEl.value = c.bannerFontFamily;
    if (animEl) animEl.value = c.bannerAnimation;
    if (nameEl) nameEl.value = theme.name;
    if (styleEl) styleEl.value = theme.style || 'cyberpunk';

    this.renderThemesGallery();
    this.updateChatLinkStatus();
    this.updatePreview(true); // actualiza y reproduce animación automáticamente
    this.showToast(`✨ Tema '${theme.name}' cargado en el editor.`);
  },

  onAnimationChange(anim) {
    this.onFieldChange('bannerAnimation', anim);
    const animObj = this.ANIMATIONS_LIST.find(a => a.id === anim);
    const animLbl = document.getElementById('lbl-preview-anim-name');
    if (animLbl && animObj) animLbl.textContent = animObj.name;
    this.playPreviewAnimation();
  },

  onThemeNameChange(name) {
    if (!name) return;
    const theme = this.themesConfig.themes[this.selectedThemeId];
    if (theme) {
      theme.name = name;
    }
    const lblEl = document.getElementById('lbl-editing-theme-name');
    if (lblEl) lblEl.textContent = name;
  },

  onThemeStyleChange(style) {
    this.onFieldChange('bannerStyle', style);
    const theme = this.themesConfig.themes[this.selectedThemeId];
    if (theme) {
      theme.style = style;
    }
    this.updatePreview(true);
  },

  /**
   * Guarda y sobrescribe el tema actual en el catálogo de temas
   */
  async saveCurrentThemeOverwrite() {
    const c = this.config.alerts[this.currentType];
    const themeId = this.selectedThemeId || 'cyberpunk';
    let theme = this.themesConfig.themes[themeId];

    const inputName = (document.getElementById('cfg-theme-name') || {}).value || (theme ? theme.name : 'Tema Personalizado');

    if (!theme) {
      theme = { id: themeId };
      this.themesConfig.themes[themeId] = theme;
    }

    theme.name = inputName;
    theme.style = (document.getElementById('cfg-theme-style') || {}).value || c.bannerStyle || 'cyberpunk';
    theme.accentColor = c.bannerBorderColor || '#57D6C4';
    theme.borderColor = c.bannerBorderColor || '#57D6C4';
    theme.textColor = c.bannerTextColor || '#FFFFFF';
    theme.fontFamily = c.bannerFontFamily || 'var(--font-tech), monospace';
    theme.animation = c.bannerAnimation || 'pop';
    theme.desc = `Tema editado y personalizado (${new Date().toLocaleDateString()}).`;

    try {
      const res = await fetch('/api/alerts/themes', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ theme: theme, themes: this.themesConfig.themes, activeTheme: themeId })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.renderThemesGallery();
        this.showToast(`✓ Tema '${theme.name}' guardado y actualizado con éxito.`);
      } else {
        alert('Error guardando tema: ' + (data.error || 'Respuesta inesperada'));
      }
    } catch (e) {
      alert('Error de conexión al guardar tema: ' + e);
    }
  },

  /**
   * Guarda como un nuevo tema independiente en el catálogo
   */
  async saveThemeAsNew() {
    const defaultName = ((document.getElementById('cfg-theme-name') || {}).value || 'Mi Tema') + ' (Nuevo)';
    const name = prompt('Escribe el nombre para tu nuevo tema de alertas:', defaultName);
    if (!name || !name.trim()) return;

    const c = this.config.alerts[this.currentType];
    const newId = 'custom_' + Date.now().toString(36) + '_' + name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);

    const newTheme = {
      id: newId,
      name: name.trim(),
      style: (document.getElementById('cfg-theme-style') || {}).value || c.bannerStyle || 'cyberpunk',
      badge: 'CUSTOM',
      accentColor: c.bannerBorderColor || '#57D6C4',
      borderColor: c.bannerBorderColor || '#57D6C4',
      textColor: c.bannerTextColor || '#FFFFFF',
      fontFamily: c.bannerFontFamily || 'var(--font-tech), monospace',
      animation: c.bannerAnimation || 'pop',
      desc: 'Tema personalizado creado desde el editor.'
    };

    this.themesConfig.themes[newId] = newTheme;
    this.selectedThemeId = newId;

    try {
      const res = await fetch('/api/alerts/themes', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ theme: newTheme, themes: this.themesConfig.themes, activeTheme: newId })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.renderThemesGallery();
        this.selectAndApplyTheme(newId);
        this.showToast(`🎉 ¡Nuevo tema '${newTheme.name}' añadido al catálogo!`);
      } else {
        alert('Error creando nuevo tema: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Error al crear nuevo tema: ' + e);
    }
  },

  /**
   * Elimina un tema personalizado
   */
  async deleteCurrentTheme() {
    const themeId = this.selectedThemeId;
    const theme = this.themesConfig.themes[themeId];
    if (!theme) return;

    if (!confirm(`¿Seguro que deseas eliminar el tema '${theme.name}' de tu catálogo?`)) {
      return;
    }

    try {
      const res = await fetch('/api/alerts/themes', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ deleteThemeId: themeId })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        delete this.themesConfig.themes[themeId];
        this.selectedThemeId = 'cyberpunk';
        this.selectAndApplyTheme('cyberpunk');
        this.showToast(`🗑️ Tema '${theme.name}' eliminado.`);
      }
    } catch (e) {
      alert('Error eliminando tema: ' + e);
    }
  },

  async applyThemeToAll() {
    const currentStyle = (this.config.alerts[this.currentType] || {}).bannerStyle || 'cyberpunk';
    const theme = this.themesConfig.themes[this.selectedThemeId] || Object.values(this.themesConfig.themes).find(t => t.style === currentStyle || t.id === currentStyle) || this.themesConfig.themes.cyberpunk;

    if (!confirm(`¿Deseas aplicar el tema '${theme.name}' a TODAS las alertas de tu canal para unificar el diseño?`)) {
      return;
    }

    try {
      const res = await fetch('/api/alerts/apply-theme', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ themeId: theme.id, target: 'all' })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.config.alerts = data.alerts;
        this.selectType(this.currentType);
        this.showToast(`🌐 ¡Tema '${theme.name}' unificado en todas las alertas!`);
      }
    } catch (e) {
      alert('Error aplicando tema global: ' + e);
    }
  }
});
