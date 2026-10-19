// Estado local del widget
    let goalState = {
      activeGoalId: 'goal_followers',
      displayMode: 'stacked',
      rotationInterval: 10,
      celebrateOnFinish: true,
      celebrateSound: true,
      sameStyleAsChat: false,
      goals: [
        {
          id: 'goal_followers',
          active: true,
          title: 'OBJETIVO: SEGUIDORES',
          category: 'twitch',
          type: 'followers',
          current: 0,
          target: 100,
          prefix: '',
          suffix: ' follows',
          subtextFormat: '{pct}% COMPLETADO · ¡FALTAN {remaining}!',
          color: '#57D6C4',
          barColorStart: '#57D6C4',
          barColorEnd: '#38BDF8',
          icon: '❤️'
        }
      ],
      styles: {
        shape: 'rounded',
        bgType: 'glass',
        bgColor: '#191D21',
        bgGradient: '#0B0D0F',
        bgOpacity: 94,
        borderStyle: 'left_neon',
        borderWidth: 3,
        borderColor: '#57D6C4',
        glowIntensity: 40,
        accentColor: '#57D6C4',
        barPattern: 'striped',
        barHeight: 'medium',
        barColorStart: '#57D6C4',
        barColorEnd: '#38BDF8',
        barTrackColor: 'rgba(46, 54, 59, 0.7)',
        fontFamily: 'outfit',
        customCSS: ''
      }
    };

    let hasCelebrated = false;
    let rotationTimer = null;
    let currentRotationIndex = 0;

    // --- Audio Fanfare con Web Audio API (Sin archivos externos requeridos) ---
    function playCelebrationFanfare() {
      if (!goalState.celebrateSound) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const notes = [
          { f: 523.25, d: 0.12, t: 0.00 }, // C5
          { f: 659.25, d: 0.12, t: 0.12 }, // E5
          { f: 783.99, d: 0.12, t: 0.24 }, // G5
          { f: 1046.50, d: 0.45, t: 0.36 } // C6
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);

          gain.gain.setValueAtTime(0.001, ctx.currentTime + n.t);
          gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + n.t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n.t + n.d);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + n.t);
          osc.stop(ctx.currentTime + n.t + n.d + 0.05);
        });
      } catch (err) {}
    }

    // --- Confetti Canvas System ---
    const confettiCanvas = document.getElementById('goal-confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    let confettiParticles = [];
    let confettiAnimId = null;

    function resizeConfetti() {
      confettiCanvas.width = confettiCanvas.parentElement.clientWidth || 520;
      confettiCanvas.height = confettiCanvas.parentElement.clientHeight || 120;
    }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    function triggerConfettiBurst() {
      resizeConfetti();
      confettiParticles = [];
      const colors = ['#57D6C4', '#38BDF8', '#F59E0B', '#EC4899', '#A855F7', '#10B981', '#FFFFFF'];
      const total = 65;

      for (let i = 0; i < total; i++) {
        confettiParticles.push({
          x: confettiCanvas.width / 2 + (Math.random() * 60 - 30),
          y: confettiCanvas.height - 20,
          vx: (Math.random() - 0.5) * 9,
          vy: - (Math.random() * 6 + 4),
          size: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.01
        });
      }

      if (!confettiAnimId) {
        animateConfetti();
      }
    }

    function animateConfetti() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;

      for (let p of confettiParticles) {
        if (p.alpha > 0.01) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18;
          p.rotation += p.rotSpeed;
          p.alpha -= p.decay;

          confettiCtx.save();
          confettiCtx.translate(p.x, p.y);
          confettiCtx.rotate((p.rotation * Math.PI) / 180);
          confettiCtx.fillStyle = p.color;
          confettiCtx.globalAlpha = Math.max(0, p.alpha);
          confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          confettiCtx.restore();
        }
      }

      if (alive) {
        confettiAnimId = requestAnimationFrame(animateConfetti);
      } else {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confettiAnimId = null;
      }
    }

    // --- Aplicación Visual y Datos Multi-Meta ---
    function renderGoal() {
      const card = document.getElementById('goal-card');
      const itemsContainer = document.getElementById('goal-items-container');
      if (!card || !itemsContainer) return;

      const s = goalState.styles || {};
      const accent = s.accentColor || s.borderColor || '#57D6C4';
      const barStart = s.barColorStart || accent;
      const barEnd = s.barColorEnd || '#38BDF8';
      const glow = s.glowIntensity !== undefined ? s.glowIntensity : 40;

      card.style.setProperty('--goal-accent', accent);
      card.style.setProperty('--goal-bar-start', barStart);
      card.style.setProperty('--goal-bar-end', barEnd);
      card.style.setProperty('--goal-glow-color', hexToRgba(barStart, (glow / 100) * 0.8));

      // 1. Tipografía
      const font = s.fontFamily || 'outfit';
      const fontMap = {
        'outfit': "'Outfit', sans-serif",
        'inter': "'Inter', sans-serif",
        'rajdhani': "'Rajdhani', sans-serif",
        'orbitron': "'Orbitron', sans-serif",
        'space_grotesk': "'Space Grotesk', sans-serif",
        'arcade': "'Press Start 2P', monospace",
        'fredoka': "'Fredoka', sans-serif",
        'montserrat': "'Montserrat', sans-serif"
      };
      card.style.fontFamily = fontMap[font] || fontMap['outfit'];

      // 2. Fondo (Glass, Gradient, Solid, Transparent)
      const bgOpacity = s.bgOpacity !== undefined ? (s.bgOpacity / 100) : 0.94;
      if (s.bgType === 'transparent') {
        card.style.background = 'transparent';
        card.style.backdropFilter = 'none';
        card.style.webkitBackdropFilter = 'none';
      } else if (s.bgType === 'solid') {
        card.style.background = s.bgColor || '#191D21';
        card.style.backdropFilter = 'none';
        card.style.webkitBackdropFilter = 'none';
      } else if (s.bgType === 'gradient') {
        const c1 = hexToRgba(s.bgColor || '#191D21', bgOpacity);
        const c2 = hexToRgba(s.bgGradient || '#0B0D0F', bgOpacity);
        card.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
        card.style.backdropFilter = 'blur(14px)';
        card.style.webkitBackdropFilter = 'blur(14px)';
      } else {
        card.style.background = hexToRgba(s.bgColor || '#191D21', bgOpacity);
        card.style.backdropFilter = 'blur(14px)';
        card.style.webkitBackdropFilter = 'blur(14px)';
      }

      // 3. Bordes y Glow
      const bWidth = s.borderWidth !== undefined ? s.borderWidth : 3;
      const bColor = s.borderColor || accent;
      card.style.borderColor = bColor;

      card.classList.remove('border-none', 'border-left_neon', 'border-all_neon', 'border-tech_corners');
      const bStyle = s.borderStyle || 'left_neon';
      if (bStyle === 'none') {
        card.classList.add('border-none');
      } else if (bStyle === 'left_neon') {
        card.classList.add('border-left_neon');
        card.style.borderLeftWidth = `${bWidth}px`;
        card.style.borderRightWidth = '1px';
        card.style.borderTopWidth = '1px';
        card.style.borderBottomWidth = '1px';
      } else if (bStyle === 'all_neon') {
        card.classList.add('border-all_neon');
        card.style.borderWidth = `${bWidth}px`;
      } else if (bStyle === 'tech_corners') {
        card.classList.add('border-tech_corners');
        card.style.borderWidth = `${Math.max(1, bWidth)}px`;
      }

      const glowAlpha = Math.min(0.9, (glow / 100) * 0.7);
      card.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 ${glow * 0.4}px ${hexToRgba(bColor, glowAlpha)}`;

      // 4. Formas de la tarjeta
      card.classList.remove('shape-rounded', 'shape-scifi', 'shape-arcade', 'shape-pill', 'shape-slant', 'shape-soft_card');
      card.classList.add(`shape-${s.shape || 'rounded'}`);

      // 5. Metas a mostrar
      let goalsList = (goalState.goals || []).filter(g => g.active !== false);
      if (goalsList.length === 0) {
        goalsList = [{
          id: 'default',
          title: goalState.title || 'OBJETIVO',
          current: goalState.current || 0,
          target: goalState.target || 100,
          prefix: goalState.prefix || '',
          suffix: goalState.suffix || '',
          subtextFormat: goalState.subtextFormat || '{pct}% COMPLETADO',
          color: accent,
          barColorStart: barStart,
          barColorEnd: barEnd,
          icon: '🎯'
        }];
      }

      const mode = goalState.displayMode || 'stacked';
      let displayedGoals = [];

      if (mode === 'single') {
        const single = goalsList.find(g => g.id === goalState.activeGoalId) || goalsList[0];
        displayedGoals = [single];
      } else if (mode === 'rotative') {
        if (currentRotationIndex >= goalsList.length) currentRotationIndex = 0;
        displayedGoals = [goalsList[currentRotationIndex] || goalsList[0]];
      } else {
        // stacked
        displayedGoals = goalsList;
      }

      itemsContainer.innerHTML = '';
      let anyCompleted = false;

      displayedGoals.forEach((g, idx) => {
        const curr = Math.max(0, parseInt(g.current) || 0);
        const targ = Math.max(1, parseInt(g.target) || 100);
        const pfx = g.prefix || '';
        const sfx = g.suffix || '';
        const pct = Math.min(100, Math.round((curr / targ) * 100));
        const remaining = Math.max(0, targ - curr);

        if (pct >= 100) anyCompleted = true;

        const gStart = (g.syncStyleWithChat && window.cachedChatStyles) ? (window.cachedChatStyles.borderColor || barStart) : (g.barColorStart || barStart);
        const gEnd = (g.syncStyleWithChat && window.cachedChatStyles) ? (window.cachedChatStyles.bgGradient || barEnd) : (g.barColorEnd || barEnd);
        const gAccent = (g.syncStyleWithChat && window.cachedChatStyles) ? (window.cachedChatStyles.borderColor || accent) : (g.color || gStart || accent);

        const subFmt = g.subtextFormat || goalState.subtextFormat || '{pct}% COMPLETADO · ¡FALTAN {remaining}!';
        const formattedSub = subFmt
          .replace(/{pct}/g, pct)
          .replace(/{current}/g, `${pfx}${curr}${sfx}`)
          .replace(/{target}/g, `${pfx}${targ}${sfx}`)
          .replace(/{remaining}/g, `${pfx}${remaining}${sfx}`)
          .replace(/{prefix}/g, pfx)
          .replace(/{suffix}/g, sfx)
          .replace(/{title}/g, g.title || '');

        const itemEl = document.createElement('div');
        itemEl.className = 'goal-item-row';
        if (idx > 0) {
          itemEl.style.marginTop = '14px';
          itemEl.style.paddingTop = '12px';
          itemEl.style.borderTop = '1px dashed rgba(255, 255, 255, 0.1)';
        }

        itemEl.innerHTML = `
          <div class="goal-top-row">
            <div class="goal-title-wrapper">
              <span style="font-size: 14px; flex-shrink: 0;">${g.icon || '🎯'}</span>
              <span class="goal-title" style="color: ${gAccent};">${g.title || 'OBJETIVO'}</span>
            </div>
            <div class="goal-count-label">
              <span>${pfx}${curr}${sfx}</span>
              <span style="opacity: 0.5;">/</span>
              <span>${pfx}${targ}${sfx}</span>
              <span class="goal-pct-chip" style="background: ${hexToRgba(gAccent, 0.2)}; color: #fff; border: 1px solid ${hexToRgba(gAccent, 0.4)};">${pct}%</span>
            </div>
          </div>
          <div class="goal-track bar-${s.barHeight || 'medium'}" style="margin-top: 8px;">
            <div class="goal-fill pattern-${s.barPattern || 'striped'}" style="width: ${pct}%; --goal-bar-start: ${gStart}; --goal-bar-end: ${gEnd};"></div>
          </div>
          <div class="goal-subtext" style="margin-top: 5px;">${formattedSub}</div>
        `;

        itemsContainer.appendChild(itemEl);
      });

      // 6. Celebración
      if (anyCompleted) {
        card.classList.add('goal-card-completed');
        if (!hasCelebrated && goalState.celebrateOnFinish) {
          hasCelebrated = true;
          triggerConfettiBurst();
          playCelebrationFanfare();
        }
      } else {
        card.classList.remove('goal-card-completed');
        hasCelebrated = false;
      }

      // 7. CSS personalizado
      let styleTag = document.getElementById('goal-custom-css-tag');
      if (s.customCSS && s.customCSS.trim()) {
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'goal-custom-css-tag';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = s.customCSS;
      } else if (styleTag) {
        styleTag.textContent = '';
      }

      // 8. Ajuste de escala para preview sin desbordamiento
      adjustPreviewScale();
    }

    function setupRotation() {
      if (rotationTimer) clearInterval(rotationTimer);
      if (goalState.displayMode === 'rotative') {
        const sec = Math.max(3, parseInt(goalState.rotationInterval, 10) || 10);
        rotationTimer = setInterval(() => {
          const activeGoals = (goalState.goals || []).filter(g => g.active !== false);
          if (activeGoals.length > 1) {
            rotateToNextGoal(activeGoals);
          }
        }, sec * 1000);
      }
    }

    function rotateToNextGoal(activeGoals) {
      const animType = goalState.rotationAnimation || 'slide_horizontal';
      const row = itemsContainer.querySelector('.goal-item-row');
      if (row) {
        row.classList.add(`anim-${animType}-exit`);
        setTimeout(() => {
          currentRotationIndex = (currentRotationIndex + 1) % activeGoals.length;
          renderGoal();
          const newRow = itemsContainer.querySelector('.goal-item-row');
          if (newRow) {
            newRow.classList.add(`anim-${animType}-enter`);
          }
        }, 360);
      } else {
        currentRotationIndex = (currentRotationIndex + 1) % activeGoals.length;
        renderGoal();
      }
    }

    function adjustPreviewScale() {
      const isPrev = document.body.classList.contains('is-preview') || window.self !== window.top;
      if (isPrev) {
        document.body.classList.add('is-preview');
        const container = document.querySelector('.goal-widget-container');
        const card = document.querySelector('.goal-widget-card');
        if (!container || !card) return;

        container.style.transform = 'none';
        const availableW = window.innerWidth - 8;
        const neededW = card.scrollWidth;

        if (neededW > availableW && availableW > 80) {
          const scale = availableW / neededW;
          container.style.transform = `scale(${scale.toFixed(3)})`;
          container.style.transformOrigin = 'center center';
        } else {
          container.style.transform = 'none';
        }
      }
    }
    window.addEventListener('resize', adjustPreviewScale);
    if (window.location.search.includes('preview=true') || window.name === 'miniapp-live-iframe' || window.self !== window.top) {
      document.body.classList.add('is-preview');
    }

    function hexToRgba(hex, alpha = 1) {
      if (!hex || typeof hex !== 'string') return `rgba(87, 214, 196, ${alpha})`;
      if (hex.startsWith('rgba')) return hex;
      if (hex.startsWith('rgb')) return hex.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      if (c.length < 6) return `rgba(87, 214, 196, ${alpha})`;
      const r = parseInt(c.substring(0, 2), 16) || 0;
      const g = parseInt(c.substring(2, 4), 16) || 0;
      const b = parseInt(c.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // --- Carga Inicial de Configuración ---
    async function loadInitialConfig() {
      try {
        const resp = await fetch('/api/widgets/config');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.config && data.config.goal) {
            applyConfigUpdate(data.config.goal, data.config.chat);
          }
        }
      } catch (e) {
        console.warn('No se pudo cargar la configuración inicial:', e);
      }
      renderGoal();
      setupRotation();
    }

    function applyConfigUpdate(g, chat) {
      if (!g) return;
      if (chat && chat.styles) {
        window.cachedChatStyles = chat.styles;
      }
      if (g.displayMode !== undefined) goalState.displayMode = g.displayMode;
      if (g.rotationInterval !== undefined) goalState.rotationInterval = g.rotationInterval;
      if (g.rotationAnimation !== undefined) goalState.rotationAnimation = g.rotationAnimation;
      if (g.activeGoalId !== undefined) goalState.activeGoalId = g.activeGoalId;
      if (g.celebrateOnFinish !== undefined) goalState.celebrateOnFinish = g.celebrateOnFinish;
      if (g.celebrateSound !== undefined) goalState.celebrateSound = g.celebrateSound;
      if (g.sameStyleAsChat !== undefined) goalState.sameStyleAsChat = g.sameStyleAsChat;
      if (g.goals && Array.isArray(g.goals)) goalState.goals = g.goals;

      // Si sincroniza con chat a nivel global
      if (goalState.sameStyleAsChat && chat && chat.styles) {
        goalState.styles = Object.assign({}, goalState.styles || {}, g.styles || {});
        const cs = chat.styles;
        if (cs.shape) goalState.styles.shape = cs.shape;
        if (cs.bgType) goalState.styles.bgType = cs.bgType;
        if (cs.bgColor) goalState.styles.bgColor = cs.bgColor;
        if (cs.bgGradient) goalState.styles.bgGradient = cs.bgGradient;
        if (cs.borderStyle) goalState.styles.borderStyle = cs.borderStyle;
        if (cs.borderWidth !== undefined) goalState.styles.borderWidth = cs.borderWidth;
        if (cs.borderColor) {
          goalState.styles.borderColor = cs.borderColor;
          goalState.styles.accentColor = cs.borderColor;
          goalState.styles.barColorStart = cs.borderColor;
        }
        if (cs.glowIntensity !== undefined) goalState.styles.glowIntensity = cs.glowIntensity;
        if (cs.bgOpacity !== undefined) goalState.styles.bgOpacity = cs.bgOpacity;
        if (cs.fontFamily) goalState.styles.fontFamily = cs.fontFamily;
      } else if (g.styles) {
        goalState.styles = Object.assign({}, goalState.styles || {}, g.styles);
      }

      renderGoal();
      setupRotation();
    }

    // Exponer función global para actualización directa desde el iframe de preview
    window.applyGoalConfig = function(cfg) {
      if (!cfg) return;
      applyConfigUpdate(cfg, cfg.chat);
    };

    window.addEventListener('message', (e) => {
      if (e.data && (e.data.type === 'apply_goal_config' || e.data.type === 'goal_update')) {
        window.applyGoalConfig(e.data.config || e.data);
      }
    });

    // --- WebSocket en Tiempo Real ---
    const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
    let ws;

    function connectWS() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => console.log('✓ Goal Widget conectado al WebSocket local.');
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          
          if (d.type === 'goal_update') {
            if (d.displayMode !== undefined) goalState.displayMode = d.displayMode;
            if (d.rotationInterval !== undefined) goalState.rotationInterval = d.rotationInterval;
            if (d.activeGoalId !== undefined) goalState.activeGoalId = d.activeGoalId;
            if (d.goals && Array.isArray(d.goals)) goalState.goals = d.goals;
            if (d.styles) goalState.styles = Object.assign({}, goalState.styles, d.styles);
            if (d.celebrateOnFinish !== undefined) goalState.celebrateOnFinish = d.celebrateOnFinish;
            if (d.celebrateSound !== undefined) goalState.celebrateSound = d.celebrateSound;
            if (d.sameStyleAsChat !== undefined) goalState.sameStyleAsChat = d.sameStyleAsChat;
            renderGoal();
            setupRotation();
          } else if (d.type === 'update_goal') {
            // Actualización legacy
            if (d.current !== undefined && goalState.goals && goalState.goals[0]) {
              goalState.goals[0].current = d.current;
              goalState.goals[0].target = d.target || goalState.goals[0].target;
              if (d.title) goalState.goals[0].title = d.title;
              renderGoal();
            }
          } else if (d.type === 'widgets_config_updated' && d.config && d.config.goal) {
            applyConfigUpdate(d.config.goal, d.config.chat);
          } else if (d.type === 'follow') {
            // Auto incremento en followers si existe la meta
            if (goalState.goals) {
              goalState.goals.forEach(g => {
                if (g.type === 'followers') g.current = (parseInt(g.current) || 0) + 1;
              });
              renderGoal();
            }
          } else if (d.type === 'subscription' || d.type === 'sub') {
            if (goalState.goals) {
              goalState.goals.forEach(g => {
                if (g.type === 'subscribers' || g.type === 'subs') g.current = (parseInt(g.current) || 0) + 1;
              });
              renderGoal();
            }
          } else if (d.type === 'bits') {
            const added = parseInt(d.bits || d.amount || 0);
            if (added > 0 && goalState.goals) {
              goalState.goals.forEach(g => {
                if (g.type === 'bits') g.current = (parseInt(g.current) || 0) + added;
              });
              renderGoal();
            }
          }
        } catch (err) {
          console.error('Error procesando mensaje WebSocket en Goal:', err);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWS, 2500);
      };
      ws.onerror = () => {
        try { ws.close(); } catch(e){}
      };
    }

    // Inicializar
    loadInitialConfig();
    connectWS();
