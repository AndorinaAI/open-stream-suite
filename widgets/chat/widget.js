// -------------------------------------------------------------
    // 1. CONFIGURACIÓN REACTIVA & ESTILOS DINÁMICOS
    // -------------------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const isPreviewMode = urlParams.get('preview') === 'true';

    let chatShortcuts = [];

    let chatConfig = {
      themePreset: "maker_glass",
      shape: "rounded",
      bgType: "glass",
      bgColor: "#191D21",
      bgGradient: "#0B0D0F",
      borderColor: "#57D6C4",
      borderStyle: "left_neon",
      borderWidth: 3,
      glowIntensity: 40,
      fontFamily: "outfit",
      fontSize: 14,
      bgOpacity: 88,
      accentColor: "#57D6C4",
      fadeSeconds: 18,
      maxMessages: 12,
      showBadges: true,
      hideBotCommands: true,
      hideBotUsers: true,
      soundNotify: false,
      autoParticles: true,
      roleColors: {
        broadcaster: "#EF4444",
        moderator: "#22C55E",
        vip: "#EC4899",
        subscriber: "#F59E0B",
        artist: "#8B5CF6"
      },
      customCSS: ""
    };

    const themeParam = urlParams.get('theme');
    const layoutParam = urlParams.get('layout');
    const posParam = urlParams.get('pos');

    function hexToRgba(hex, alpha = 1) {
      if (!hex || hex === 'transparent') return 'transparent';
      let cleanHex = hex.replace('#', '').trim();
      if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
      }
      if (cleanHex.length !== 6) return `rgba(25, 29, 33, ${alpha})`;
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function applyChatConfig(newConfig) {
      if (!newConfig) return;
      chatConfig = Object.assign({}, chatConfig, newConfig);

      // Determinar tema activo
      const activeTheme = themeParam || chatConfig.themePreset || chatConfig.activePreset || 'maker_glass';

      // Aplicar clases al body
      document.body.className = '';
      if (isPreviewMode) {
        document.body.classList.add('is-preview');
      }
      if (layoutParam === 'box' || isPreviewMode) {
        document.body.classList.add('layout-box');
      } else if (posParam) {
        document.body.classList.add(`pos-${posParam}`);
      }
      document.body.classList.add(`theme-${activeTheme}`);

      // Parámetros visuales del preset
      const shape = chatConfig.shape || (
        activeTheme === 'bubble' ? 'bubble' :
        activeTheme === 'scifi' || activeTheme === 'cyberpunk' ? 'scifi' :
        activeTheme === 'arcade' || activeTheme === 'retro' ? 'arcade' :
        activeTheme === 'pill' ? 'pill' :
        activeTheme === 'ghost' ? 'box' : 'rounded'
      );

      const bgType = chatConfig.bgType || (
        activeTheme === 'ghost' ? 'transparent' :
        activeTheme === 'bubble' || activeTheme === 'synthwave' || activeTheme === 'candy' ? 'gradient' :
        activeTheme === 'cyberpunk' || activeTheme === 'retro' || activeTheme === 'matrix' ? 'solid' : 'glass'
      );

      const fontFamily = chatConfig.fontFamily || (
        activeTheme === 'cyberpunk' ? 'courier' :
        activeTheme === 'retro' ? 'press_start' :
        activeTheme === 'pill' ? 'inter' :
        activeTheme === 'matrix' ? 'mono' : 'outfit'
      );

      const borderStyle = chatConfig.borderStyle || (
        activeTheme === 'ghost' ? 'none' :
        activeTheme === 'retro' ? 'double' :
        activeTheme === 'maker_glass' || activeTheme === 'matrix' ? 'left_neon' : 'full'
      );

      const borderWidth = (chatConfig.borderWidth !== undefined) ? chatConfig.borderWidth : (borderStyle === 'double' ? 3 : 2);
      const borderColor = chatConfig.borderColor || '#57D6C4';
      const bgColor = chatConfig.bgColor || '#191D21';
      const bgGradient = chatConfig.bgGradient || '#0B0D0F';
      const glow = (chatConfig.glowIntensity !== undefined) ? chatConfig.glowIntensity : 35;
      const opacity = (chatConfig.bgOpacity !== undefined ? chatConfig.bgOpacity : (activeTheme === 'ghost' ? 0 : 88)) / 100;
      const fSize = chatConfig.fontSize || 14;

      // Variables CSS de rol y acento
      document.documentElement.style.setProperty('--chat-accent', borderColor);
      if (chatConfig.roleColors) {
        const rc = chatConfig.roleColors;
        if (rc.broadcaster) document.documentElement.style.setProperty('--color-broadcaster', rc.broadcaster);
        if (rc.moderator) document.documentElement.style.setProperty('--color-moderator', rc.moderator);
        if (rc.vip) document.documentElement.style.setProperty('--color-vip', rc.vip);
        if (rc.subscriber) document.documentElement.style.setProperty('--color-subscriber', rc.subscriber);
        if (rc.artist) document.documentElement.style.setProperty('--color-artist', rc.artist);
        if (rc.follower) document.documentElement.style.setProperty('--color-follower', rc.follower);
        if (rc.viewer) document.documentElement.style.setProperty('--color-viewer', rc.viewer);
      }

      // 1. SILUETA / SHAPE CSS
      let shapeCss = 'border-radius: 6px !important;';
      if (shape === 'box') {
        shapeCss = 'border-radius: 2px !important;';
      } else if (shape === 'bubble') {
        shapeCss = 'border-radius: 20px 20px 20px 4px !important; padding: 12px 18px !important;';
      } else if (shape === 'scifi') {
        shapeCss = 'clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)) !important; border-radius: 0 !important;';
      } else if (shape === 'pill') {
        shapeCss = 'border-radius: 9999px !important; padding: 8px 20px !important;';
      } else if (shape === 'arcade') {
        shapeCss = 'border-radius: 0 !important;';
      } else if (shape === 'tag') {
        shapeCss = 'clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%) !important; border-radius: 0 !important; padding: 10px 18px !important;';
      } else if (shape === 'slant') {
        shapeCss = 'clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%) !important; border-radius: 0 !important; padding: 10px 22px !important;';
      } else if (shape === 'soft_card') {
        shapeCss = 'border-radius: 18px !important; padding: 12px 18px !important;';
      }

      // 2. FONDO / BACKGROUND CSS
      let bgCss = '';
      if (bgType === 'transparent' || opacity === 0 || activeTheme === 'ghost') {
        bgCss = 'background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; border: none !important;';
      } else if (bgType === 'solid') {
        bgCss = `background: ${hexToRgba(bgColor, opacity)} !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important;`;
      } else if (bgType === 'gradient') {
        bgCss = `background: linear-gradient(135deg, ${hexToRgba(bgColor, opacity)}, ${hexToRgba(bgGradient, opacity)}) !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important;`;
      } else { // glass
        bgCss = `background: ${hexToRgba(bgColor, opacity)} !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important;`;
      }

      // 3. BORDE Y GLOW CSS
      let borderCss = '';
      if (bgType === 'transparent' || borderStyle === 'none' || activeTheme === 'ghost') {
        borderCss = 'border: none !important;';
      } else if (borderStyle === 'left_neon') {
        borderCss = `border: 1px solid rgba(255, 255, 255, 0.08) !important; border-left: ${borderWidth}px solid ${borderColor} !important;`;
      } else if (borderStyle === 'double') {
        borderCss = `border: ${borderWidth}px double ${borderColor} !important;`;
      } else { // full
        borderCss = `border: ${borderWidth}px solid ${borderColor} !important;`;
      }

      let shadowCss = '';
      if (bgType === 'transparent' || opacity === 0 || activeTheme === 'ghost') {
        shadowCss = 'box-shadow: none !important;';
      } else if (shape === 'arcade' || activeTheme === 'retro') {
        shadowCss = 'box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.95) !important;';
      } else if (glow > 0) {
        shadowCss = `box-shadow: 0 0 ${Math.round(glow * 0.35)}px ${hexToRgba(borderColor, (glow / 100) * 0.55)}, 0 4px 20px rgba(0, 0, 0, 0.5) !important;`;
      } else {
        shadowCss = 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;';
      }

      // 4. TIPOGRAFÍA CSS
      let fontCss = "font-family: 'Outfit', sans-serif !important;";
      if (fontFamily === 'inter') {
        fontCss = "font-family: 'Inter', -apple-system, sans-serif !important;";
      } else if (fontFamily === 'poppins') {
        fontCss = "font-family: 'Poppins', sans-serif !important;";
      } else if (fontFamily === 'montserrat') {
        fontCss = "font-family: 'Montserrat', sans-serif !important; font-weight: 600;";
      } else if (fontFamily === 'rajdhani') {
        fontCss = "font-family: 'Rajdhani', sans-serif !important; font-weight: 600; letter-spacing: 0.5px;";
      } else if (fontFamily === 'orbitron') {
        fontCss = "font-family: 'Orbitron', sans-serif !important; font-weight: 600; letter-spacing: 0.5px;";
      } else if (fontFamily === 'russo_one') {
        fontCss = "font-family: 'Russo One', sans-serif !important;";
      } else if (fontFamily === 'comfortaa') {
        fontCss = "font-family: 'Comfortaa', cursive, sans-serif !important; font-weight: 700;";
      } else if (fontFamily === 'mono') {
        fontCss = "font-family: 'JetBrains Mono', monospace !important;";
      } else if (fontFamily === 'courier') {
        fontCss = "font-family: 'Courier New', Courier, monospace !important;";
      } else if (fontFamily === 'press_start') {
        fontCss = "font-family: 'Press Start 2P', monospace, cursive !important; letter-spacing: 0.5px;";
      } else if (fontFamily === 'silkscreen') {
        fontCss = "font-family: 'Silkscreen', monospace !important; letter-spacing: 0.5px;";
      }

      // Inyección en custom-user-css
      const customStyleEl = document.getElementById('custom-user-css');
      if (customStyleEl) {
        customStyleEl.textContent = `
          .chat-msg {
            font-size: ${fSize}px !important;
            ${fontCss}
            ${shapeCss}
            ${bgCss}
            ${borderCss}
            ${shadowCss}
          }
          .msg-body {
            font-size: ${fSize}px !important;
            ${fontCss}
            ${(bgType === 'transparent' || opacity <= 0.4 || activeTheme === 'ghost' || activeTheme === 'screen_no_overlay') ? 'text-shadow: 0 1px 3px #000, 0 2px 8px rgba(0,0,0,0.95), 0 0 14px #000 !important; font-weight: 600;' : ''}
          }
          .username-text {
            ${fontCss}
            ${(bgType === 'transparent' || opacity <= 0.4 || activeTheme === 'ghost' || activeTheme === 'screen_no_overlay') ? 'text-shadow: 0 1px 4px #000, 0 0 8px rgba(0,0,0,0.95) !important;' : ''}
            ${shape === 'arcade' || activeTheme === 'retro' ? 'text-transform: uppercase;' : ''}
          }
          ${chatConfig.customCSS || ''}
        `;
      }
    }

    async function fetchInitialConfig() {
      try {
        const res = await fetch('/api/widgets/config');
        if (res.ok) {
          const data = await res.json();
          if (data && data.config && data.config.chat) {
            if (data.config.chat.shortcuts) chatShortcuts = data.config.chat.shortcuts;
            if (data.config.chat.styles) applyChatConfig(data.config.chat.styles);
            if (data.config.chat.spotlight) handleSpotlightMessage(data.config.chat.spotlight);
          }
        }
      } catch (e) {}
    }

    // -------------------------------------------------------------
    // 2. MOTOR DE EXPLOSIÓN DE EMOTICONOS (CANVAS 2D CON FÍSICA)
    // -------------------------------------------------------------
    const ParticleEngine = {
      canvas: document.getElementById('particle-canvas'),
      ctx: null,
      particles: [],
      isRunning: false,

      init() {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
      },

      resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      },

      explode(emoteSrcOrEmoji, count = 35) {
        const rawStr = String(emoteSrcOrEmoji || '🎉');
        const isImage = rawStr.startsWith('http');
        let img = null;
        if (isImage) {
          img = new Image();
          img.src = rawStr;
        }

        const emojiList = isImage ? [] : rawStr.split(',').map(e => e.trim()).filter(Boolean);
        const startX = window.innerWidth * 0.5;
        const startY = window.innerHeight * 0.6;

        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 14 + 6;
          const pickedEmoji = isImage ? null : (emojiList.length ? emojiList[Math.floor(Math.random() * emojiList.length)] : '🎉');
          this.particles.push({
            isImage,
            img,
            emoji: pickedEmoji,
            x: startX + (Math.random() - 0.5) * 120,
            y: startY + (Math.random() - 0.5) * 120,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 6,
            gravity: 0.35,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 8,
            size: Math.random() * 20 + 28,
            alpha: 1,
            decay: Math.random() * 0.012 + 0.008
          });
        }

        if (!this.isRunning) {
          this.isRunning = true;
          this.loop();
        }
      },

      loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.rotation += p.rotSpeed;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > this.canvas.height + 60) {
            this.particles.splice(i, 1);
            continue;
          }

          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, p.alpha);
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);

          if (p.isImage && p.img && p.img.complete) {
            this.ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
          } else {
            this.ctx.font = `${p.size}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.emoji, 0, 0);
          }
          this.ctx.restore();
        }

        if (this.particles.length > 0) {
          requestAnimationFrame(() => this.loop());
        } else {
          this.isRunning = false;
        }
      }
    };
    ParticleEngine.init();

    // -------------------------------------------------------------
    // 3. SINTETIZADOR DE AUDIO SUAVE (WEB AUDIO API)
    // -------------------------------------------------------------
    function playChatPopSound() {
      if (!chatConfig.soundNotify) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {}
    }

    // -------------------------------------------------------------
    // 4. PARSEO DE MENSAJES Y RENDERIZADO
    // -------------------------------------------------------------
    const channelName = (urlParams.get('channel') || window.TALLER_CONFIG?.channel?.twitch || window.TALLER_CONFIG?.channel?.name || "andorina").toLowerCase().trim();
    const chatBox = document.getElementById('chat-box');
    const KNOWN_BOTS = ['nightbot', 'streamelements', 'streamlabs', 'wizebot', 'fossabot', 'moobot', 'botisimo'];

    function parseBadges(badgesStr) {
      if (!badgesStr || !chatConfig.showBadges) return '';
      const chips = [];
      const parts = badgesStr.split(',');
      parts.forEach(p => {
        const [badgeType] = p.split('/');
        if (badgeType === 'broadcaster') chips.push('<span class="badge-chip broadcaster" title="Streamer">👑</span>');
        else if (badgeType === 'moderator') chips.push('<span class="badge-chip moderator" title="Moderador">🛡️</span>');
        else if (badgeType === 'vip') chips.push('<span class="badge-chip vip" title="VIP">💎</span>');
        else if (badgeType === 'subscriber') chips.push('<span class="badge-chip subscriber" title="Suscriptor">⭐</span>');
        else if (badgeType === 'artist-badge' || badgeType === 'artist') chips.push('<span class="badge-chip artist" title="Artista">🎨</span>');
        else if (badgeType === 'follower') chips.push('<span class="badge-chip follower" title="Seguidor">💜</span>');
        else if (badgeType === 'viewer') chips.push('<span class="badge-chip viewer" title="Espectador">👤</span>');
      });
      return chips.length ? `<span class="user-badges">${chips.join('')}</span>` : '';
    }

    function normalizeSpanishChat(text) {
      if (!text) return '';
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes (campeón -> campeon)
        .replace(/(.)\1{2,}/g, '$1$1'); // Normalizar alargamiento de chat (hypeeeee -> hypee)
    }

    function checkKeywordMatch(normalizedMsg, tokens, rawKeyword) {
      let kw = normalizeSpanishChat(rawKeyword.trim());
      if (!kw) return false;

      // 1. Si termina en '*' es un stem/raíz (ej: 'campeon*' cubre 'campeon', 'campeona', 'campeones', 'campeonas')
      if (kw.endsWith('*')) {
        const stem = kw.slice(0, -1);
        return tokens.some(t => t.startsWith(stem)) || normalizedMsg.includes(stem);
      }

      // 2. Coincidencia exacta con algún token
      if (tokens.includes(kw)) return true;

      // 3. Soporte automático de terminaciones de género y número en español (-o, -a, -os, -as, -e, -es, -@)
      if (kw.endsWith('o') || kw.endsWith('a')) {
        const root = kw.slice(0, -1);
        const variations = [root + 'o', root + 'a', root + 'os', root + 'as', root + 'e', root + 'es', root + '@'];
        if (tokens.some(t => variations.includes(t))) return true;
      }
      if (kw.endsWith('on')) {
        const root = kw;
        const variations = [root, root + 'a', root + 'es', root + 'as'];
        if (tokens.some(t => variations.includes(t))) return true;
      }

      // 4. Inclusión de subcadena si es una palabra de 4 o más caracteres
      if (kw.length >= 4 && normalizedMsg.includes(kw)) return true;

      return false;
    }

    function checkChatParticleTriggers(rawText) {
      if (!chatConfig.autoParticles || !chatShortcuts || !chatShortcuts.length) return false;
      const normalizedMsg = normalizeSpanishChat(rawText);
      const tokens = normalizedMsg.split(/[\s,.;:!?¡¿\-_()]+/).filter(Boolean);

      for (const sc of chatShortcuts) {
        if (sc.autoTrigger === false || !sc.keywords) continue;
        const kwList = sc.keywords.split(',');
        for (const rawKw of kwList) {
          if (checkKeywordMatch(normalizedMsg, tokens, rawKw)) {
            ParticleEngine.explode(sc.emoji || '🎉', sc.count || 40);
            return true;
          }
        }
      }
      return false;
    }

    function renderMessage(username, color, text, emotesTag, badgesStr = '') {
      if (!text) return;

      // Filtro de comandos de bots (!uptime, !redes...)
      if (chatConfig.hideBotCommands && text.startsWith('!')) return;

      // Filtro de usuarios bots
      if (chatConfig.hideBotUsers && KNOWN_BOTS.includes(username.toLowerCase())) return;

      const roleClasses = [];
      if (badgesStr) {
        if (badgesStr.includes('broadcaster')) roleClasses.push('role-broadcaster');
        if (badgesStr.includes('moderator')) roleClasses.push('role-moderator');
        if (badgesStr.includes('vip')) roleClasses.push('role-vip');
        if (badgesStr.includes('subscriber')) roleClasses.push('role-subscriber');
        if (badgesStr.includes('artist')) roleClasses.push('role-artist');
        if (badgesStr.includes('follower')) roleClasses.push('role-follower');
      }
      if (roleClasses.length === 0) {
        roleClasses.push('role-viewer');
      }

      // Asignar color de rol si no viene especificado o coincide con color neutro
      let finalColor = color;
      const roleColors = chatConfig.roleColors || {};
      if (!finalColor || finalColor === '#57D6C4' || finalColor === '#FFFFFF') {
        if (roleClasses.includes('role-broadcaster') && roleColors.broadcaster) finalColor = roleColors.broadcaster;
        else if (roleClasses.includes('role-moderator') && roleColors.moderator) finalColor = roleColors.moderator;
        else if (roleClasses.includes('role-vip') && roleColors.vip) finalColor = roleColors.vip;
        else if (roleClasses.includes('role-subscriber') && roleColors.subscriber) finalColor = roleColors.subscriber;
        else if (roleClasses.includes('role-artist') && roleColors.artist) finalColor = roleColors.artist;
        else if (roleClasses.includes('role-follower') && roleColors.follower) finalColor = roleColors.follower;
        else if (roleClasses.includes('role-viewer') && roleColors.viewer) finalColor = roleColors.viewer;
      }
      if (!finalColor) finalColor = roleColors.viewer || '#94A3B8';

      const msgEl = document.createElement('div');
      msgEl.className = `chat-msg ${roleClasses.join(' ')}`.trim();
      msgEl.style.setProperty('--user-color', finalColor);
      msgEl.setAttribute('data-user', username.toLowerCase());
      if (roleClasses.length) {
        msgEl.setAttribute('data-role', roleClasses[0].replace('role-', ''));
      }

      const badgesHtml = parseBadges(badgesStr);

      // Cabecera
      const header = document.createElement('div');
      header.className = 'msg-header';
      header.innerHTML = `
        ${badgesHtml}
        <span class="username-text" style="color: ${finalColor};">${escapeHtml(username)}</span>
      `;
      msgEl.appendChild(header);

      // Cuerpo con emoticonos
      const body = document.createElement('div');
      body.className = 'msg-body';
      body.innerHTML = formatEmotes(text, emotesTag);
      msgEl.appendChild(body);

      chatBox.appendChild(msgEl);
      playChatPopSound();

      // Mantener límite de mensajes en pantalla
      const max = chatConfig.maxMessages || 12;
      while (chatBox.children.length > max) {
        chatBox.firstElementChild.remove();
      }

      // Desvanecer después de N segundos (en modo preview los mantenemos visibles para ver el diseño)
      const fadeSec = isPreviewMode ? 0 : (chatConfig.fadeSeconds || 18);
      if (fadeSec > 0) {
        setTimeout(() => {
          msgEl.classList.add('fading');
          setTimeout(() => msgEl.remove(), 600);
        }, fadeSec * 1000);
      }

      // Físicas reactivas automáticas inteligentes
      if (chatConfig.autoParticles) {
        const triggered = checkChatParticleTriggers(text);
        if (!triggered) {
          const lower = text.toLowerCase();
          if (lower.includes('🎉') || lower.includes('!fiesta')) ParticleEngine.explode('🎉', 35);
          else if (lower.includes('🔥') || lower.includes('!hype')) ParticleEngine.explode('🔥', 35);
          else if (lower.includes('🚀') || lower.includes('!despegue')) ParticleEngine.explode('🚀', 30);
          else if (lower.includes('❤️') || lower.includes('!amor')) ParticleEngine.explode('❤️', 30);
          else if (lower.includes('⭐') || lower.includes('!gg')) ParticleEngine.explode('⭐', 35);
        }
      }
    }

    function handleSpotlightMessage(data) {
      const box = document.getElementById('chat-spotlight-box');
      if (!box) return;

      if (!data || !data.active || !data.message) {
        box.style.display = 'none';
        return;
      }

      document.getElementById('spotlight-author').textContent = data.user || 'Espectador';
      document.getElementById('spotlight-author').style.color = data.color || '#57D6C4';
      document.getElementById('spotlight-content').textContent = data.message;
      box.style.display = 'block';

      // Auto-ocultar a los 25 segundos opcionalmente
      if (data.autoDismiss !== false) {
        setTimeout(() => {
          if (box.style.display === 'block') box.style.display = 'none';
        }, 25000);
      }
    }

    function formatEmotes(text, emotesTag) {
      if (!emotesTag) return escapeHtml(text);
      const emoteList = [];
      emotesTag.split('/').forEach(emoteData => {
        if (!emoteData) return;
        const [id, ranges] = emoteData.split(':');
        ranges.split(',').forEach(range => {
          const [start, end] = range.split('-').map(Number);
          emoteList.push({ id, start, end });
        });
      });

      emoteList.sort((a, b) => b.start - a.start);
      let html = text;
      emoteList.forEach(e => {
        const before = html.slice(0, e.start);
        const after = html.slice(e.end + 1);
        const imgTag = `<img class="twitch-emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/2.0" alt="emote">`;
        html = before + imgTag + after;
      });

      return html;
    }

    function escapeHtml(str) {
      return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[tag] || tag));
    }

    // -------------------------------------------------------------
    // 5. CONEXIÓN A TWITCH IRC OFICIAL & WEBSOCKET LOCAL
    // -------------------------------------------------------------
    function connectTwitchIRC() {
      const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

      socket.onopen = () => {
        socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        socket.send('PASS oauth:dummytoken');
        socket.send(`NICK justinfan${Math.floor(Math.random() * 80000 + 10000)}`);
        socket.send(`JOIN #${channelName}`);
      };

      socket.onmessage = (event) => {
        const raw = event.data;
        if (raw.startsWith('PING')) {
          socket.send('PONG :tmi.twitch.tv');
          return;
        }

        if (raw.includes('PRIVMSG')) {
          const parts = raw.split(' :');
          const tagPart = parts[0];
          const messageText = parts.slice(2).join(' :').trim();

          const tags = {};
          tagPart.split(';').forEach(kv => {
            const [k, v] = kv.split('=');
            tags[k.replace('@', '')] = v;
          });

          const username = tags['display-name'] || 'Usuario';
          const color = tags['color'] || '#57D6C4';
          const emotesTag = tags['emotes'] || '';
          const badges = tags['badges'] || '';

          renderMessage(username, color, messageText, emotesTag, badges);
        }
      };

      socket.onclose = () => setTimeout(connectTwitchIRC, 4000);
    }

    function connectLocalWS() {
      const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'explode_emotes') {
            ParticleEngine.explode(data.emoji || '🎉', data.count || 45);
          } else if (data.type === 'chat_message') {
            renderMessage(data.user || 'Viewer', data.color || '#57D6C4', data.message || '', '', data.badges || '');
          } else if (data.type === 'chat_spotlight') {
            handleSpotlightMessage(data);
          } else if (data.type === 'chat_clear') {
            chatBox.innerHTML = '';
          } else if (data.type === 'widgets_config_updated' && data.config?.chat) {
            if (data.config.chat.shortcuts) chatShortcuts = data.config.chat.shortcuts;
            if (data.config.chat.styles) applyChatConfig(data.config.chat.styles);
          } else if (data.type === 'sub' || data.type === 'raid') {
            ParticleEngine.explode('⭐', 40);
          } else if (data.type === 'follow') {
            ParticleEngine.explode('❤️', 30);
          }
        } catch (e) {}
      };

      ws.onclose = () => setTimeout(connectLocalWS, 3000);
    }

    window.addEventListener('DOMContentLoaded', () => {
      fetchInitialConfig();
      if (urlParams.get('preview') === 'true') {
        document.body.classList.add('is-preview');
        renderMessage('AndorinaDev', '#EF4444', '¡Bienvenidos al taller en directo! 🛠️', '', 'broadcaster/1');
        renderMessage('MakerFan', '#F59E0B', '¿Qué filamento usas para esa pieza? ⭐', '', 'subscriber/6');
        renderMessage('AlexTech', '#38BDF8', '¡Nuevo seguidor por aquí, qué buena pinta! 💜', '', 'follower/1');
        renderMessage('AnonUser', '#94A3B8', 'Hola a todos, probando el chat sin lag 👤', '', '');
      }
      connectTwitchIRC();
      connectLocalWS();
    });
