/**
 * app/alerts/js/overlay/03-alert-queue.js
 * Cola de Alertas y Triggers para OBS: Renderizado de Banner Creator, Memes/Vídeos, Sonidos y Rótulos.
 */

// Iconos SVG limpios y enriquecidos
window.ALERT_ICONS = {
  follow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  sub: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  prime: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>`,
  bits: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 9l10 13 10-13-10-7z"></path></svg>`,
  raid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>`,
  donation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><line x1="12" y1="6" x2="12" y2="8"></line><line x1="12" y1="16" x2="12" y2="18"></line></svg>`,
  trigger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
};

const ICONS = window.ALERT_ICONS;

// Cola de alertas para que no se superpongan
window.AlertQueue = {
  queue: [],
  isPlaying: false,

  push(item) {
    this.queue.push(item);
    if (!this.isPlaying) {
      this.playNext();
    }
  },

  playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const item = this.queue.shift();

    // Alerta configurable de nueva generación (Banner Creator o Multimedia)
    if (item.type === 'custom_alert' || item.alertType) {
      this.playCustomAlert(item);
    } else if (item.video_url) {
      this.playVideoTrigger(item);
    } else if (item.image_url) {
      this.playImageTrigger(item);
    } else {
      this.playCardAlert(item);
    }
  },

  playCustomAlert(item) {
    // Explosión de partículas si está habilitado
    if (item.showParticles !== false && window.ParticleEngine) {
      const emojiMap = {
        sub_prime: '👑', sub_t1: '⭐', sub_t2: '🌟', sub_t3: '💫',
        resub: '🎉', sub_gift: '🎁', sub_community_gift: '🎁',
        cheer: '💎', raid: '🚀', donation: '💰', follow: '❤️'
      };
      const emoji = item.particleEmoji || emojiMap[item.alertType] || '🎉';
      window.ParticleEngine.explode(emoji, 45);
    }

    if (item.mediaMode === 'banner') {
      this.playBannerAlert(item);
    } else {
      this.playMediaAlert(item);
    }
  },

  playBannerAlert(item) {
    const root = document.getElementById('banner-alert-root');
    const icon = document.getElementById('banner-icon-container');
    const badge = document.getElementById('banner-alert-badge');
    const title = document.getElementById('banner-alert-title');
    const user = document.getElementById('banner-alert-user');
    const msg = document.getElementById('banner-alert-msg');
    if (!root) { this.playNext(); return; }

    // Selección de icono
    const type = item.alertType || 'follow';
    let iconKey = 'follow';
    if (type === 'sub_prime') iconKey = 'prime';
    else if (type.includes('gift')) iconKey = 'gift';
    else if (type.startsWith('sub') || type === 'resub') iconKey = 'sub';
    else if (type === 'cheer') iconKey = 'bits';
    else if (type === 'raid') iconKey = 'raid';
    else if (type === 'donation') iconKey = 'donation';
    if (icon) icon.innerHTML = ICONS[iconKey] || ICONS.follow;

    // Badge superior
    const badges = {
      follow: 'NUEVO FOLLOWER',
      sub_prime: 'PRIME GAMING',
      sub_t1: 'SUSCRIPCIÓN TIER 1',
      sub_t2: 'SUSCRIPCIÓN TIER 2',
      sub_t3: 'SUSCRIPCIÓN TIER 3',
      resub: `${item.months || 'X'} MESES RECURRENTE`,
      sub_gift: 'SUB REGALADA',
      sub_community_gift: `${item.amount || 'X'} SUBS DE REGALO`,
      cheer: `${item.amount || 'BITS'} BITS`,
      raid: `RAID (${item.viewers || '0'} VIEWERS)`,
      donation: `${item.amount || 'DONACIÓN'}`
    };
    if (badge) badge.textContent = item.badge || badges[type] || 'ALERTA EN DIRECTO';

    if (title) title.textContent = item.title || '¡GRACIAS POR EL APOYO!';
    if (user) user.textContent = item.user || 'Espectador';
    if (msg) {
      msg.textContent = item.message || '';
      msg.style.display = item.message ? 'block' : 'none';
    }

    // The pack theme wins over the legacy "base style": with a pack theme
    // assigned the banner-theme-* class is skipped, because it carries its own
    // borders and backgrounds that would cover the theme tokens.
    // The user can still mix: colour, font and animation are inline values and
    // win over the tokens, so customising keeps working on top of the pack.
    const theme = item.bannerStyle || 'cyberpunk';
    const packTheme = !!(window.AlertShapes && AlertShapes.effectiveTheme && AlertShapes.effectiveTheme('banner'));
    root.className = `banner-alert-root anim-${item.bannerAnimation || 'pop'}`
      + (packTheme ? '' : ` banner-theme-${theme}`);

    if (item.bannerBgColor) root.style.background = item.bannerBgColor;
    else root.style.background = '';

    if (item.bannerBorderColor) {
      root.style.setProperty('--banner-border', item.bannerBorderColor);
      root.style.setProperty('--banner-accent', item.bannerAccentColor || item.bannerBorderColor);
    } else {
      root.style.removeProperty('--banner-border');
      root.style.removeProperty('--banner-accent');
    }

    if (item.bannerTextColor) {
      root.style.setProperty('--banner-text', item.bannerTextColor);
      if (user) user.style.color = item.bannerTextColor;
    } else {
      if (user) user.style.color = '';
    }

    if (window.AlertShapes) window.AlertShapes.applyAll('banner');

    if (item.bannerFontFamily) {
      root.style.fontFamily = item.bannerFontFamily;
      if (user) user.style.fontFamily = item.bannerFontFamily;
    } else {
      root.style.fontFamily = '';
      if (user) user.style.fontFamily = '';
    }

    // Sonido configurable
    if (item.soundMode === 'custom' && item.soundUrl) {
      const snd = new Audio(item.soundUrl);
      snd.volume = typeof item.soundVolume === 'number' ? (item.soundVolume / 100) : 0.8;
      snd.play().catch(() => {});
    } else if (item.soundMode === 'synth' || !item.soundMode) {
      if (window.AudioEngine) {
        window.AudioEngine.playChime(item.synthTone || (type.startsWith('sub') ? 'sub' : (type === 'donation' ? 'coin' : 'victory')));
      }
    }

    root.style.display = 'flex';
    void root.offsetWidth; // Forzar reflow para animación
    root.classList.add('visible');

    const dur = item.duration || 5000;
    setTimeout(() => {
      root.classList.remove('visible');
      setTimeout(() => {
        root.style.display = 'none';
        this.playNext();
      }, 400);
    }, dur);
  },

  playMediaAlert(item) {
    const container = document.getElementById('trigger-container');
    const video = document.getElementById('trigger-video');
    const img = document.getElementById('trigger-image');
    const caption = document.getElementById('trigger-caption');
    if (!container) { this.playNext(); return; }

    const posMode = item.position || 'center';
    this.applyTriggerPosition(container, posMode, item.customX, item.customY, item.mediaSize || 'medium');

    const isVideo = item.mediaType === 'video' || (item.mediaUrl && (item.mediaUrl.endsWith('.webm') || item.mediaUrl.endsWith('.mp4')));

    if (isVideo) {
      img.style.display = 'none';
      video.style.display = 'block';
      video.src = item.mediaUrl;

      // Sonido del propio video vs sonido externo superpuesto vs synth
      if (item.soundMode === 'video') {
        video.muted = false;
        video.volume = typeof item.videoVolume === 'number' ? (item.videoVolume / 100) : 0.8;
      } else if (item.soundMode === 'custom' && item.soundUrl) {
        video.muted = true;
        const snd = new Audio(item.soundUrl);
        snd.volume = typeof item.soundVolume === 'number' ? (item.soundVolume / 100) : 0.8;
        snd.play().catch(() => {});
      } else if (item.soundMode === 'synth') {
        video.muted = true;
        if (window.AudioEngine) window.AudioEngine.playChime(item.synthTone || 'victory');
      } else {
        video.muted = true;
      }

      // Rótulo / Texto de alerta
      this.applyTriggerCaption(caption, {
        ...item,
        banner_text: item.showCaption !== false ? `${item.title || ''}: ${item.user || ''}` : ''
      });

      container.classList.add('visible');

      video.onended = () => {
        container.classList.remove('visible');
        setTimeout(() => this.playNext(), 400);
      };
      video.onerror = () => {
        container.classList.remove('visible');
        this.playNext();
      };
      video.play().catch(() => {
        setTimeout(() => {
          container.classList.remove('visible');
          this.playNext();
        }, item.duration || 5000);
      });
    } else {
      // Imagen / GIF
      video.style.display = 'none';
      img.style.display = 'block';
      img.src = item.mediaUrl;

      if (item.soundMode === 'custom' && item.soundUrl) {
        const snd = new Audio(item.soundUrl);
        snd.volume = typeof item.soundVolume === 'number' ? (item.soundVolume / 100) : 0.8;
        snd.play().catch(() => {});
      } else if (item.soundMode === 'synth') {
        if (window.AudioEngine) window.AudioEngine.playChime(item.synthTone || 'coin');
      }

      this.applyTriggerCaption(caption, {
        ...item,
        banner_text: item.showCaption !== false ? `${item.title || ''}: ${item.user || ''}` : ''
      });

      container.classList.add('visible');

      setTimeout(() => {
        container.classList.remove('visible');
        setTimeout(() => this.playNext(), 400);
      }, item.duration || 5000);
    }
  },

  playCardAlert(item) {
    const card = document.getElementById('alert-card');
    const icon = document.getElementById('alert-icon');
    const title = document.getElementById('alert-title');
    const user = document.getElementById('alert-user');
    const msg = document.getElementById('alert-msg');

    if (!card) {
      this.playNext();
      return;
    }

    const alertType = item.type || 'follow';
    if (icon) icon.innerHTML = ICONS[alertType] || ICONS.follow;
    if (title) title.textContent = item.title || (alertType === 'sub' ? '¡NUEVO SUSCRIPTOR!' : (alertType === 'bits' ? '¡CHEER CON BITS!' : (alertType === 'raid' ? '¡RAID RECIBIDA!' : '¡NUEVO SEGUIDOR!')));
    if (user) user.textContent = item.user || item.user_name || item.reward_title || 'Usuario';
    if (msg) msg.textContent = item.message || '';

    // Audio
    if (item.sound_url) {
      const snd = new Audio(item.sound_url);
      snd.volume = typeof item.sound_volume === 'number' ? item.sound_volume : (typeof item.volume === 'number' ? item.volume : 0.8);
      snd.play().catch(() => {});
    } else if (item.audio_type === 'chime' || !item.sound_url) {
      if (window.AudioEngine) {
        window.AudioEngine.playChime(item.chime_type || (alertType === 'sub' ? 'sub' : 'follow'));
      }
    }

    if (window.AlertShapes) window.AlertShapes.applyAll('card');
    card.classList.add('visible');

    setTimeout(() => {
      card.classList.remove('visible');
      setTimeout(() => this.playNext(), 400);
    }, item.duration || 5000);
  },

  applyTriggerPosition(container, pos, customX, customY, size) {
    container.style.top = '';
    container.style.left = '';
    container.style.right = '';
    container.style.bottom = '';
    container.style.transform = '';

    // Ajuste de tamaño
    if (size === 'small') {
      container.style.maxWidth = '360px';
      container.style.maxHeight = '270px';
    } else if (size === 'large') {
      container.style.maxWidth = '960px';
      container.style.maxHeight = '720px';
    } else if (size === 'fullscreen') {
      container.style.maxWidth = '1920px';
      container.style.maxHeight = '1080px';
      container.style.width = '1920px';
      container.style.height = '1080px';
    } else {
      container.style.maxWidth = '580px';
      container.style.maxHeight = '440px';
    }

    // Posición
    if (pos === 'random') {
      const randX = Math.floor(Math.random() * 65 + 15);
      const randY = Math.floor(Math.random() * 55 + 20);
      container.style.top = `${randY}%`;
      container.style.left = `${randX}%`;
      container.style.transform = 'translate(-50%, -50%)';
    } else if (pos === 'custom' && typeof customX === 'number' && typeof customY === 'number') {
      container.style.top = `${customY}%`;
      container.style.left = `${customX}%`;
      container.style.transform = 'translate(-50%, -50%)';
    } else if (pos === 'bottom-right') {
      container.style.bottom = '40px';
      container.style.right = '40px';
    } else if (pos === 'bottom-left') {
      container.style.bottom = '40px';
      container.style.left = '40px';
    } else if (pos === 'top-right') {
      container.style.top = '40px';
      container.style.right = '40px';
    } else if (pos === 'top-left') {
      container.style.top = '40px';
      container.style.left = '40px';
    } else {
      container.style.top = '50%';
      container.style.left = '50%';
      container.style.transform = 'translate(-50%, -50%)';
    }
  },

  applyTriggerCaption(caption, item) {
    if (!caption) return;
    const rawText = item.banner_text || item.title || '';
    if (item.show_banner_text !== false && rawText) {
      const user = item.user || item.user_name || 'Espectador';
      const reward = item.reward_title || '';
      const cost = item.cost ? `${item.cost} pts` : '';
      const text = rawText
        .replace(/\{user\}/gi, user)
        .replace(/\{reward\}/gi, reward)
        .replace(/\{cost\}/gi, cost);

      caption.textContent = text;

      // Personalización de estilos
      const textColor = item.banner_text_color || '#FFFFFF';
      const borderColor = item.banner_border_color || item.accent || '#57D6C4';
      const fontSize = item.banner_font_size === 'small' ? '14px' : (item.banner_font_size === 'large' ? '24px' : (item.banner_font_size === 'xlarge' ? '32px' : '18px'));
      const fontFamily = item.banner_font_family === 'pixel' ? 'monospace' : (item.banner_font_family === 'impact' ? 'Impact, sans-serif' : (item.banner_font_family === 'sans' ? 'var(--font-primary)' : 'var(--font-tech)'));

      caption.style.color = textColor;
      caption.style.borderColor = borderColor;
      caption.style.fontSize = fontSize;
      caption.style.fontFamily = fontFamily;
      caption.style.boxShadow = `0 0 24px ${borderColor}66, 0 8px 24px rgba(0,0,0,0.6)`;

      if (item.banner_bg_style === 'solid_black') {
        caption.style.background = '#0E1012';
        caption.style.borderWidth = '2px';
        caption.style.textShadow = 'none';
      } else if (item.banner_bg_style === 'accent') {
        caption.style.background = `${borderColor}33`;
        caption.style.borderWidth = '2px';
        caption.style.textShadow = 'none';
      } else if (item.banner_bg_style === 'none') {
        caption.style.background = 'transparent';
        caption.style.border = 'none';
        caption.style.boxShadow = 'none';
        caption.style.textShadow = `0 2px 10px #000, 0 0 16px ${borderColor}`;
      } else {
        caption.style.background = 'rgba(18, 22, 26, 0.94)';
        caption.style.borderWidth = '2px';
        caption.style.textShadow = 'none';
      }

      const anim = item.banner_animation || 'pop';
      const pos = item.banner_position || 'below';
      if (pos === 'bottom_screen') {
        const viewport = document.querySelector('.overlay-viewport');
        if (viewport && caption.parentElement !== viewport) {
          viewport.appendChild(caption);
        }
      } else {
        const container = document.getElementById('trigger-container');
        if (container && caption.parentElement !== container) {
          container.appendChild(caption);
        }
      }
      caption.className = `trigger-caption-banner anim-${anim} pos-${pos}`;
      caption.style.display = 'block';
    } else {
      caption.style.display = 'none';
    }
  },

  playVideoTrigger(item) {
    const container = document.getElementById('trigger-container');
    const video = document.getElementById('trigger-video');
    const img = document.getElementById('trigger-image');
    const caption = document.getElementById('trigger-caption');

    const posMode = item.position_mode || item.position || 'center';
    this.applyTriggerPosition(container, posMode, item.custom_x, item.custom_y, item.size);

    img.style.display = 'none';
    video.style.display = 'block';
    video.src = item.video_url;

    // Audio del vídeo o personalizado
    if (item.sound_url && item.audio_type === 'custom') {
      video.muted = true;
      const snd = new Audio(item.sound_url);
      snd.volume = typeof item.sound_volume === 'number' ? item.sound_volume : 0.8;
      snd.play().catch(() => {});
    } else if (item.audio_type === 'chime') {
      video.muted = true;
      if (window.AudioEngine) window.AudioEngine.playChime(item.chime_type || 'susto');
    } else {
      video.muted = item.audio_type === 'none';
      video.volume = typeof item.sound_volume === 'number' ? item.sound_volume : (typeof item.volume === 'number' ? item.volume : 0.8);
    }

    // Texto en pantalla
    this.applyTriggerCaption(caption, item);

    container.classList.add('visible');

    video.onended = () => {
      container.classList.remove('visible');
      setTimeout(() => this.playNext(), 400);
    };

    video.onerror = () => {
      container.classList.remove('visible');
      this.playNext();
    };

    video.play().catch(() => {
      setTimeout(() => {
        container.classList.remove('visible');
        this.playNext();
      }, item.duration || 5000);
    });
  },

  playImageTrigger(item) {
    const container = document.getElementById('trigger-container');
    const video = document.getElementById('trigger-video');
    const img = document.getElementById('trigger-image');
    const caption = document.getElementById('trigger-caption');

    const posMode = item.position_mode || item.position || 'center';
    this.applyTriggerPosition(container, posMode, item.custom_x, item.custom_y, item.size);

    video.style.display = 'none';
    img.style.display = 'block';
    img.src = item.image_url;

    // Reproducir audio combinado
    if (item.sound_url) {
      const snd = new Audio(item.sound_url);
      snd.volume = typeof item.sound_volume === 'number' ? item.sound_volume : (typeof item.volume === 'number' ? item.volume : 0.8);
      snd.play().catch(() => {});
    } else if (item.audio_type === 'chime') {
      if (window.AudioEngine) window.AudioEngine.playChime(item.chime_type || 'sub');
    }

    // Texto en pantalla
    this.applyTriggerCaption(caption, item);

    container.classList.add('visible');

    setTimeout(() => {
      container.classList.remove('visible');
      setTimeout(() => this.playNext(), 400);
    }, item.duration || 5000);
  }
};
