const card = document.getElementById('so-card');
    const corner = document.getElementById('so-corner');
    const avatarBox = document.getElementById('so-avatar-box');
    const avatar = document.getElementById('so-avatar');
    const ring = document.getElementById('so-ring');
    const mediaBox = document.getElementById('so-media-box');
    const mediaImg = document.getElementById('so-media-img');
    const eyebrow = document.getElementById('so-eyebrow-text');
    const pricePill = document.getElementById('so-price');
    const name = document.getElementById('so-name');
    const game = document.getElementById('so-game');
    const msg = document.getElementById('so-msg');
    const url = document.getElementById('so-url');
    const qrBox = document.getElementById('so-qr-box');
    const qrImg = document.getElementById('so-qr-img');
    const qrCenterBadge = document.getElementById('so-qr-center-badge');
    const qrCenterImg = document.getElementById('so-qr-center-img');
    const qrLabel = document.getElementById('so-qr-label');
    const clipBox = document.getElementById('so-clip-box');
    const clipFrame = document.getElementById('so-clip-frame');
    const clipChannel = document.getElementById('so-clip-channel');
    const customCssTag = document.getElementById('so-custom-injected-css');

    let hideTimeout = null;

    function playChime() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.12);
        osc.frequency.setValueAtTime(783.99, now + 0.24);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } catch (e) {}
    }

    function applyPromoStyles(styles = {}, fallbackColor = '#57D6C4') {
      const color = styles.borderColor || styles.accentColor || fallbackColor;
      const glow = styles.glowIntensity !== undefined ? styles.glowIntensity : 40;
      const font = styles.fontFamily || 'outfit';
      const shape = styles.shape || 'rounded';
      const bgType = styles.bgType || 'glass';
      const bgColor = styles.bgColor || '#191D21';
      const bgGrad = styles.bgGradient || '#0B0D0F';
      const bgOpacity = (styles.bgOpacity !== undefined ? styles.bgOpacity : 94) / 100;
      const borderStyle = styles.borderStyle || 'left_neon';
      const borderWidth = styles.borderWidth || 4;

      // Actualizar variables CSS
      document.documentElement.style.setProperty('--promo-accent', color);
      document.documentElement.style.setProperty('--promo-glow', `${glow}px`);

      // Tipografía
      const fontMap = {
        'outfit': "'Outfit', sans-serif",
        'inter': "'Inter', sans-serif",
        'rajdhani': "'Rajdhani', sans-serif",
        'orbitron': "'Orbitron', sans-serif",
        'press_start': "'Press Start 2P', monospace",
        'jetbrains_mono': "'JetBrains Mono', monospace"
      };
      card.style.fontFamily = fontMap[font] || fontMap['outfit'];

      // Silueta / Forma
      card.className = card.className.replace(/\bshape-\w+/g, '');
      card.classList.add(`shape-${shape}`);

      // Fondo
      if (bgType === 'solid') {
        card.style.background = bgColor;
      } else if (bgType === 'gradient') {
        card.style.background = `linear-gradient(135deg, ${bgColor}, ${bgGrad})`;
      } else if (bgType === 'transparent') {
        card.style.background = 'transparent';
      } else {
        // glass
        card.style.background = `rgba(25, 29, 33, ${bgOpacity})`;
      }

      // Bordes y Brillo Neón
      card.style.border = 'none';
      card.style.borderLeft = 'none';

      if (borderStyle === 'left_neon') {
        card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        card.style.borderLeft = `${borderWidth}px solid ${color}`;
        card.style.boxShadow = `0 14px 38px rgba(0, 0, 0, 0.7), -4px 0 ${glow}px ${color}55`;
      } else if (borderStyle === 'full_neon') {
        card.style.border = `${borderWidth}px solid ${color}`;
        card.style.boxShadow = `0 14px 38px rgba(0, 0, 0, 0.7), 0 0 ${glow}px ${color}66`;
      } else if (borderStyle === 'subtle') {
        card.style.border = '1px solid rgba(255, 255, 255, 0.15)';
        card.style.boxShadow = '0 14px 38px rgba(0, 0, 0, 0.7)';
      } else {
        card.style.boxShadow = '0 14px 38px rgba(0, 0, 0, 0.7)';
      }

      if (corner) corner.style.borderColor = color;
      if (ring) ring.style.borderColor = color;
      if (avatar) {
        avatar.style.borderColor = color;
        avatar.style.boxShadow = `0 0 16px ${color}66`;
      }
      if (mediaBox) {
        mediaBox.style.borderColor = color;
        mediaBox.style.boxShadow = `0 4px 16px ${color}44`;
      }

      // CSS Personalizado
      if (styles.customCSS) {
        customCssTag.textContent = styles.customCSS;
      } else {
        customCssTag.textContent = '';
      }
    }

    function showShoutout(data) {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      const type = data.promo_type || 'shoutout';
      const color = data.color || '#57D6C4';

      // 1. Resolver y aplicar estilos
      let activeStyles = data.styles || {};
      if (data.inherit_chat_styles && data.chat_styles) {
        activeStyles = data.chat_styles;
      }
      applyPromoStyles(activeStyles, color);

      // 2. Animación de entrada
      const anim = data.animation || activeStyles.animation || 'slide_up';
      card.className = card.className.replace(/\banim-\w+/g, '');
      card.classList.add(`anim-${anim}`);

      // 3. Contenido según tipo de promoción
      const customEyebrow = data.eyebrow;

      if (type === 'product') {
        eyebrow.textContent = customEyebrow || '🛒 PRODUCTO / CREACIÓN MAKER';
        eyebrow.style.color = color;
        name.textContent = data.title || data.display_name || 'Creación del Taller';
        game.textContent = data.subtitle || data.game || 'Hecho a mano en directo';
        if (data.price) {
          pricePill.textContent = data.price;
          pricePill.style.display = 'inline-block';
        } else {
          pricePill.style.display = 'none';
        }
        url.textContent = data.link ? data.link.replace(/^https?:\/\//, '') : 'Enlace en el chat';
      } else if (type === 'custom' || type === 'social') {
        eyebrow.textContent = customEyebrow || (type === 'social' ? '💬 COMUNIDAD & REDES' : '⚡ DESTACADO DEL TALLER');
        eyebrow.style.color = color;
        name.textContent = data.title || data.display_name || 'Promoción Especial';
        game.textContent = data.subtitle || data.game || 'Echa un vistazo al enlace';
        if (data.price) {
          pricePill.textContent = data.price;
          pricePill.style.display = 'inline-block';
        } else {
          pricePill.style.display = 'none';
        }
        url.textContent = data.link ? data.link.replace(/^https?:\/\//, '') : 'twitch.tv/andorina';
      } else {
        // Streamer Shoutout
        eyebrow.textContent = customEyebrow || '📢 CANAL RECOMENDADO';
        eyebrow.style.color = color;
        name.textContent = data.display_name || data.streamer || 'Streamer Amigo';
        game.textContent = data.game ? `🎮 ${data.game}` : '🛠️ Creatividad & Directos';
        pricePill.style.display = 'none';
        const userLogin = (data.streamer || data.display_name || '').toLowerCase().replace(/\s+/g, '');
        url.textContent = data.link ? data.link.replace(/^https?:\/\//, '') : `twitch.tv/${userLogin}`;
      }

      // Mensaje o Frase Personalizada
      if (data.message && data.message.trim()) {
        msg.textContent = `"${data.message.trim()}"`;
        msg.style.display = 'block';
      } else {
        msg.style.display = 'none';
      }

      // Media vs Avatar
      if (data.image_url || data.media_url) {
        mediaImg.src = data.image_url || data.media_url;
        mediaBox.style.display = 'block';
        avatarBox.style.display = 'none';
      } else {
        mediaBox.style.display = 'none';
        avatarBox.style.display = 'block';
        if (data.avatar) {
          avatar.src = data.avatar;
        } else {
          avatar.src = "https://static-cdn.jtvnw.net/jtv_user_pictures/e33e6764-4631-48b0-9f1d-4cc6e5afc6fd-profile_image-300x300.png";
        }
      }

      // Código QR Dinámico (Soporte Enlaces, vCard, Wi-Fi, Email, Texto y Logo Central)
      const targetQR = data.qr_data || data.link || (type === 'shoutout' ? `https://twitch.tv/${(data.streamer || '').toLowerCase()}` : '');
      if (data.show_qr !== false && targetQR) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=H&margin=0&data=${encodeURIComponent(targetQR)}`;

        if (qrLabel) {
          if (data.qr_label) {
            qrLabel.textContent = data.qr_label;
          } else if (data.qr_type === 'vcard') {
            qrLabel.textContent = '📇 CONTACTO';
          } else if (data.qr_type === 'wifi') {
            qrLabel.textContent = '📶 WI-FI';
          } else if (data.qr_type === 'email') {
            qrLabel.textContent = '✉️ CORREO';
          } else {
            qrLabel.textContent = '📱 ESCANEAR';
          }
        }

        const logo = data.qr_logo;
        if (logo && logo !== 'none' && qrCenterBadge && qrCenterImg) {
          const logoMap = {
            twitch: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239146FF"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>',
            discord: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%235865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
            instagram: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
            youtube: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
            maker: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2357D6C4"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
            shop: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23F59E0B"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>'
          };
          qrCenterImg.src = logoMap[logo] || logo;
          qrCenterBadge.style.display = 'flex';
        } else if (qrCenterBadge) {
          qrCenterBadge.style.display = 'none';
        }

        qrBox.style.display = 'flex';
      } else {
        qrBox.style.display = 'none';
      }

      // Reproductor de Clip Embebido
      const clipSlug = data.clip_slug || (data.clip_url ? data.clip_url.split('/').pop() : '');
      if (data.play_clip && (clipSlug || data.clip_embed_url)) {
        const hostname = window.location.hostname || 'localhost';
        const embedUrl = data.clip_embed_url ? `${data.clip_embed_url}&parent=${hostname}&autoplay=true&muted=false` : `https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${hostname}&autoplay=true&muted=false`;
        clipFrame.src = embedUrl;
        clipChannel.textContent = (data.display_name || data.streamer || 'CANAL').toUpperCase();
        clipBox.style.display = 'flex';
      } else {
        clipBox.style.display = 'none';
        clipFrame.src = '';
      }

      // Mostrar Tarjeta y emitir sonido
      card.classList.add('visible');
      if (data.soundChime !== false) {
        playChime();
      }

      // Auto-ocultar tras la duración configurada
      const duration = data.duration || 8000;
      hideTimeout = setTimeout(() => {
        card.classList.remove('visible');
        setTimeout(() => {
          clipFrame.src = '';
          clipBox.style.display = 'none';
        }, 500);
      }, duration);
    }

    function connectWS() {
      const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'shoutout') {
            showShoutout(data);
          } else if (data.type === 'theme_change' && data.theme) {
            document.body.setAttribute('data-theme', data.theme);
          }
        } catch (e) {}
      };

      ws.onclose = () => setTimeout(connectWS, 3000);
    }

    // Modo Previsualización para pruebas
    if (window.location.search.includes('preview=true')) {
      setTimeout(() => showShoutout({
        promo_type: 'product',
        title: 'Pegatinas Holográficas Maker',
        subtitle: 'Vinilo troquelado impermeable para portátil',
        price: '3.50€',
        link: 'https://twitch.tv/andorina',
        message: '¡Nuevos diseños disponibles este mes!',
        show_qr: true,
        color: '#FF783F',
        duration: 12000
      }), 400);
    }

    connectWS();
