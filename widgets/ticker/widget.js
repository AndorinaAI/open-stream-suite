// ====================================================================
// WIDGET RUNTIME: TICKER DUAL (MÉTRICAS ARRIBA + PROMPTER DE TEMAS Y RSS)
// ====================================================================

(function() {
  let tickerState = {
    stream: {
      channel: 'Andorina',
      lastFollower: 'Andorina',
      lastSub: 'TallerLover',
      lastSubTier: 'Tier 1',
      lastResub: '3 meses',
      lastBits: 'BitMaster (100)',
      topBits: 'MakerKing (500)',
      lastRaid: 'StreamerColega (42 viewers)',
      lastTip: 'KofiFan (€5)',
      lastKofi: 'KofiMaker (€5)',
      lastPaypal: 'PayPalFan (€10)',
      lastBmc: 'CafeLover (3 ☕)',
      goalTitle: 'SEGUIDORES',
      goalCurrent: 259,
      goalTarget: 300,
      goalPct: '86%',
      viewers: '45',
      lastChat: '¡Saludos a todos desde el taller!'
    },
    rssItems: [],
    lastRssFetch: 0,
    rssTimer: null,
    isPaused: false,
    flashNews: null,
    flashTimeout: null,
    rotatorIndex: 0,
    rotatorTimer: null,
    config: {
      activePreset: 'cyber_taller',
      layoutMode: 'two_tier',
      contentSource: 'both',
      speed: 45,
      rotationInterval: 6,
      rotatorAnimation: 'slide',
      topicSeparator: '///',
      eventSeparator: '│',
      pauseOnHover: true,
      phrases: [
        {
          id: 'p1',
          badge: 'TALLER LIVE',
          icon: '🛠️',
          text: 'JUGAR · CREAR · TRASTEAR · ¡Bienvenidos al directo de electrónica y diseño!'
        },
        {
          id: 'p2',
          badge: 'COMUNIDAD',
          icon: '💬',
          text: 'Únete a nuestro servidor de Discord con el comando !discord en el chat'
        },
        {
          id: 'p3',
          badge: 'PROYECTO',
          icon: '⚡',
          text: 'Montaje de PCB en vivo y pruebas de firmware con ESP32'
        }
      ],
      rss: {
        enabled: true,
        url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
        maxItems: 6,
        prefix: 'NOTICIAS MUNDO',
        icon: '📰',
        refreshMinutes: 10
      },
      eventChips: {
        showFollows: true,
        showSubs: true,
        showResubs: true,
        showLastBits: true,
        showTopBits: true,
        showRaids: true,
        showTips: true,
        showKofi: true,
        showPaypal: true,
        showBmc: true,
        showGoal: true,
        showViewers: true,
        showLastChat: false
      },
      styles: {
        shape: 'rounded',
        bgType: 'glass',
        bgColor: '#191D21',
        bgGradient: '#0B0D0F',
        bgOpacity: 92,
        borderColor: '#57D6C4',
        borderStyle: 'left_neon',
        borderWidth: 2,
        glowIntensity: 35,
        fontFamily: 'rajdhani',
        fontSize: 13,
        accentColor: '#57D6C4',
        followColor: '#F43F5E',
        subColor: '#A78BFA',
        resubColor: '#818CF8',
        bitsColor: '#FBBF24',
        topBitsColor: '#F59E0B',
        raidColor: '#38BDF8',
        tipColor: '#10B981',
        customCSS: ''
      }
    }
  };

  // Reemplazo de tokens {} dinámicos
  function replaceTokens(text) {
    if (!text) return '';
    const st = tickerState.stream;
    return text
      .replace(/\{channel\}/g, st.channel)
      .replace(/\{last_follower\}/g, st.lastFollower)
      .replace(/\{last_sub\}/g, st.lastSub)
      .replace(/\{last_sub_tier\}/g, st.lastSubTier)
      .replace(/\{last_resub\}/g, st.lastResub)
      .replace(/\{last_bits\}/g, st.lastBits)
      .replace(/\{top_bits\}/g, st.topBits)
      .replace(/\{last_raid\}/g, st.lastRaid)
      .replace(/\{last_tip\}/g, st.lastTip)
      .replace(/\{last_kofi\}/g, st.lastKofi)
      .replace(/\{last_paypal\}/g, st.lastPaypal)
      .replace(/\{last_bmc\}/g, st.lastBmc)
      .replace(/\{goal_title\}/g, st.goalTitle)
      .replace(/\{goal_current\}/g, st.goalCurrent)
      .replace(/\{goal_target\}/g, st.goalTarget)
      .replace(/\{goal_pct\}/g, st.goalPct)
      .replace(/\{viewers\}/g, st.viewers)
      .replace(/\{last_chat\}/g, st.lastChat);
  }

  // 1. Obtener lista de métricas/eventos para la Fila Superior
  function getActiveEventChips() {
    const chipsCfg = tickerState.config.eventChips || {};
    const st = tickerState.stream;
    const items = [];

    if (chipsCfg.showFollows !== false && st.lastFollower) {
      items.push({ id: 'follow', icon: '❤️', label: 'Seguidor:', value: st.lastFollower, colorClass: 'color-follow' });
    }
    if (chipsCfg.showSubs !== false && st.lastSub) {
      items.push({ id: 'sub', icon: '⭐', label: 'Sub:', value: `${st.lastSub} (${st.lastSubTier})`, colorClass: 'color-sub' });
    }
    if (chipsCfg.showResubs && st.lastResub) {
      items.push({ id: 'resub', icon: '🔄', label: 'Resub:', value: `${st.lastSub} (${st.lastResub})`, colorClass: 'color-resub' });
    }
    if (chipsCfg.showLastBits !== false && st.lastBits) {
      items.push({ id: 'last_bits', icon: '💎', label: 'Bits:', value: st.lastBits, colorClass: 'color-bits' });
    }
    if (chipsCfg.showTopBits && st.topBits) {
      items.push({ id: 'top_bits', icon: '👑', label: 'Top Bits:', value: st.topBits, colorClass: 'color-top-bits' });
    }
    if (chipsCfg.showRaids !== false && st.lastRaid) {
      items.push({ id: 'raid', icon: '🚀', label: 'Raid:', value: st.lastRaid, colorClass: 'color-raid' });
    }
    if (chipsCfg.showTips && st.lastTip) {
      items.push({ id: 'tip', icon: '💰', label: 'Donación:', value: st.lastTip, colorClass: 'color-tip' });
    }
    if (chipsCfg.showKofi && st.lastKofi) {
      items.push({ id: 'kofi', icon: '☕', label: 'Ko-fi:', value: st.lastKofi, colorClass: 'color-kofi' });
    }
    if (chipsCfg.showPaypal && st.lastPaypal) {
      items.push({ id: 'paypal', icon: '🅿️', label: 'PayPal:', value: st.lastPaypal, colorClass: 'color-paypal' });
    }
    if (chipsCfg.showBmc && st.lastBmc) {
      items.push({ id: 'bmc', icon: '🟡☕', label: 'BMC:', value: st.lastBmc, colorClass: 'color-bmc' });
    }
    if (chipsCfg.showGoal !== false && st.goalTitle) {
      items.push({ id: 'goal', icon: '🎯', label: `Meta:`, value: `${st.goalTitle} (${st.goalPct})`, colorClass: 'color-accent' });
    }
    if (chipsCfg.showViewers && st.viewers) {
      items.push({ id: 'viewers', icon: '👀', label: 'En Vivo:', value: `${st.viewers} viewers`, colorClass: 'color-accent' });
    }
    if (chipsCfg.showLastChat && st.lastChat) {
      items.push({ id: 'chat', icon: '💬', label: 'Chat:', value: `"${st.lastChat}"`, colorClass: 'color-accent' });
    }

    return items;
  }

  // 2. Obtener lista de frases y titulares RSS para el Prompter Inferior
  function getActivePrompterItems() {
    const cfg = tickerState.config;
    const items = [];

    // Prioridad: Noticia Flash de Última Hora
    if (tickerState.flashNews) {
      items.push({
        id: 'flash_news',
        badge: 'ÚLTIMA HORA',
        badgeClass: 'flash-badge',
        icon: '🚨',
        text: tickerState.flashNews
      });
      return items;
    }

    const source = cfg.contentSource || 'both';

    // A) Frases Temáticas del Streamer
    if (source === 'both' || source === 'phrases') {
      const phrases = Array.isArray(cfg.phrases) ? cfg.phrases : [];
      phrases.forEach(p => {
        if (p.text && p.text.trim()) {
          items.push({
            id: p.id || 'phrase_' + Math.random(),
            badge: p.badge || 'TALLER',
            badgeClass: 'topic-badge',
            icon: p.icon || '📌',
            text: replaceTokens(p.text)
          });
        }
      });
    }

    // B) Titulares RSS en Vivo
    if ((source === 'both' || source === 'rss') && cfg.rss && cfg.rss.enabled) {
      const rssCfg = cfg.rss;
      const max = rssCfg.maxItems || 6;
      const rssList = tickerState.rssItems.slice(0, max);
      rssList.forEach((it, idx) => {
        items.push({
          id: 'rss_' + idx,
          badge: rssCfg.prefix || 'NOTICIAS',
          badgeClass: 'topic-badge rss-badge',
          icon: rssCfg.icon || '📰',
          text: it.title
        });
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'default',
        badge: 'STREAM',
        badgeClass: 'topic-badge',
        icon: '⚡',
        text: '¡Bienvenidos al directo de Taller Live! Sigue el canal para más contenido.'
      });
    }

    return items;
  }

  // Generar bloque HTML de frases con separador de temas
  function buildPrompterGroupHTML(items) {
    const topicSep = tickerState.config.topicSeparator || '///';
    let html = '<div class="prompter-group">';
    
    items.forEach((item, index) => {
      html += `
        <div class="prompter-item">
          ${item.badge ? `
            <span class="${item.badgeClass}">
              <span>${item.icon || '📌'}</span>
              <span>${item.badge}</span>
            </span>
          ` : ''}
          <span class="prompter-text">${item.text}</span>
        </div>
      `;
      html += `<span class="topic-separator">${topicSep}</span>`;
    });

    html += '</div>';
    return html;
  }

  // Renderizar Fila Superior (Top Tier)
  function renderTopTier() {
    const topTierEl = document.getElementById('ticker-top-tier');
    if (!topTierEl) return;

    const layout = tickerState.config.layoutMode || 'two_tier';
    if (layout === 'single_bar') {
      topTierEl.style.display = 'none';
      return;
    }

    const items = getActiveEventChips();
    if (items.length === 0) {
      topTierEl.style.display = 'none';
      return;
    }

    topTierEl.style.display = 'inline-flex';
    const s = tickerState.config.styles || {};
    topTierEl.className = `ticker-top-tier top-shape-${s.topTierShape || 'capsule'} top-chips-${s.topTierChipStyle || 'badge_filled'}`;
    topTierEl.style.justifyContent = s.topTierAlign || 'center';
    const sep = tickerState.config.eventSeparator || '│';

    let html = '';
    items.forEach((item, idx) => {
      html += `
        <div class="metric-chip">
          <span class="metric-chip-icon ${item.colorClass}">${item.icon}</span>
          <span class="metric-chip-label">${item.label}</span>
          <span class="metric-chip-value ${item.colorClass}">${item.value}</span>
        </div>
      `;
      if (idx < items.length - 1) {
        html += `<span class="metric-chip-sep">${sep}</span>`;
      }
    });

    topTierEl.innerHTML = html;
  }

  // Renderizar Fila Inferior (Prompter / Noticias / Rotador)
  function renderBottomTier() {
    const bottomTier = document.getElementById('ticker-bottom-tier');
    const track = document.getElementById('prompter-track');
    const viewport = document.getElementById('prompter-viewport');
    if (!bottomTier || !track) return;

    const cfg = tickerState.config;
    const s = cfg.styles || {};
    const layout = cfg.layoutMode || 'two_tier';

    // Si es single_bar, mezclar chips de eventos al inicio
    let prompterItems = getActivePrompterItems();
    if (layout === 'single_bar') {
      const eventChips = getActiveEventChips();
      const eventPrompterItems = eventChips.map(c => ({
        id: 'event_' + c.id,
        badge: c.label.replace(':', ''),
        badgeClass: 'topic-badge',
        icon: c.icon,
        text: c.value
      }));
      prompterItems = [...eventPrompterItems, ...prompterItems];
    }

    // Limpiar rotador previo
    if (tickerState.rotatorTimer) {
      clearInterval(tickerState.rotatorTimer);
      tickerState.rotatorTimer = null;
    }

    if (layout === 'rotator') {
      track.style.display = 'flex';
      track.className = 'rotator-viewport';
      track.style.animation = 'none';
      renderRotatorItem(prompterItems);

      const intervalMs = Math.max(3000, (cfg.rotationInterval || 6) * 1000);
      tickerState.rotatorTimer = setInterval(() => {
        if (!tickerState.isPaused) {
          tickerState.rotatorIndex = (tickerState.rotatorIndex + 1) % prompterItems.length;
          renderRotatorItem(prompterItems);
        }
      }, intervalMs);

    } else {
      // Modo Marquee (o two_tier con marquesina abajo)
      track.style.display = 'inline-flex';
      track.className = 'prompter-track';

      // Duplicar para loop perfecto sin saltos
      const groupA = buildPrompterGroupHTML(prompterItems);
      const groupB = buildPrompterGroupHTML(prompterItems);
      track.innerHTML = groupA + groupB;

      if (tickerState.isPaused) {
        track.style.animationPlayState = 'paused';
      } else {
        track.style.animationPlayState = 'running';
      }
    }
  }

  function renderRotatorItem(items) {
    const track = document.getElementById('prompter-track');
    if (!track || items.length === 0) return;

    const anim = tickerState.config.rotatorAnimation || 'slide';
    const index = tickerState.rotatorIndex % items.length;
    const item = items[index];

    track.innerHTML = `
      <div class="prompter-item anim-${anim}-in" style="justify-content: center;">
        ${item.badge ? `
          <span class="${item.badgeClass}">
            <span>${item.icon || '📌'}</span>
            <span>${item.badge}</span>
          </span>
        ` : ''}
        <span class="prompter-text">${item.text}</span>
      </div>
    `;
    adjustPreviewScale();
  }

  // Render Global del Widget
  function renderTicker() {
    const wrapper = document.getElementById('ticker-wrapper');
    const bottomTier = document.getElementById('ticker-bottom-tier');
    const customStyleTag = document.getElementById('ticker-custom-injected-css');
    if (!wrapper || !bottomTier) return;

    const cfg = tickerState.config;
    const s = cfg.styles || {};

    // 1. Aplicar variables CSS
    const root = document.documentElement;
    const accent = s.accentColor || s.borderColor || '#57D6C4';
    const bg = s.bgColor || '#191D21';
    const bgGrad = s.bgGradient || '#0B0D0F';
    const opacity = (s.bgOpacity !== undefined ? s.bgOpacity : 92) / 100;
    
    let r = 25, g = 29, b = 33;
    if (bg.startsWith('#') && bg.length >= 7) {
      r = parseInt(bg.slice(1, 3), 16);
      g = parseInt(bg.slice(3, 5), 16);
      b = parseInt(bg.slice(5, 7), 16);
    }
    const rgbaBg = `rgba(${r}, ${g}, ${b}, ${opacity})`;

    root.style.setProperty('--tk-accent', accent);
    root.style.setProperty('--tk-bg', rgbaBg);
    root.style.setProperty('--tk-bg-gradient', bgGrad);
    root.style.setProperty('--tk-border', s.borderColor || accent);
    root.style.setProperty('--tk-glow', `${s.glowIntensity !== undefined ? s.glowIntensity : 35}px`);
    root.style.setProperty('--tk-speed', `${cfg.speed || 45}s`);
    root.style.setProperty('--tk-font-size', `${s.fontSize || 13}px`);
    root.style.setProperty('--tk-follow', s.followColor || '#F43F5E');
    root.style.setProperty('--tk-sub', s.subColor || '#A78BFA');
    root.style.setProperty('--tk-resub', s.resubColor || '#818CF8');
    root.style.setProperty('--tk-bits', s.bitsColor || '#FBBF24');
    root.style.setProperty('--tk-top-bits', s.topBitsColor || '#F59E0B');
    root.style.setProperty('--tk-raid', s.raidColor || '#38BDF8');
    root.style.setProperty('--tk-tip', s.tipColor || '#10B981');
    root.style.setProperty('--tk-kofi', s.kofiColor || '#29ABE2');
    root.style.setProperty('--tk-paypal', s.paypalColor || '#0079C1');
    root.style.setProperty('--tk-bmc', s.bmcColor || '#FFDD00');
    root.style.setProperty('--tk-goal', s.goalColor || accent);

    const topBg = s.topTierBgColor || '#121518';
    const topOpacity = (s.topTierBgOpacity !== undefined ? s.topTierBgOpacity : 88) / 100;
    let tr = 18, tg = 21, tb = 24;
    if (topBg.startsWith('#') && topBg.length >= 7) {
      tr = parseInt(topBg.slice(1, 3), 16);
      tg = parseInt(topBg.slice(3, 5), 16);
      tb = parseInt(topBg.slice(5, 7), 16);
    }
    root.style.setProperty('--tk-top-bg', `rgba(${tr}, ${tg}, ${tb}, ${topOpacity})`);
    root.style.setProperty('--tk-top-border', s.topTierBorderColor || 'rgba(255, 255, 255, 0.14)');
    root.style.setProperty('--tk-top-glow', `${s.topTierGlow !== undefined ? s.topTierGlow : 15}px`);
    root.style.setProperty('--tk-top-font-size', `${s.topTierFontSize || 12}px`);
    root.style.setProperty('--tk-top-spacing', `${s.topTierSpacing || 8}px`);

    // 2. Clases visuales
    bottomTier.className = 'ticker-bottom-tier';
    bottomTier.classList.add(`shape-${s.shape || 'rounded'}`);
    bottomTier.classList.add(`bg-${s.bgType || 'glass'}`);
    bottomTier.classList.add(`border-${s.borderStyle || 'left_neon'}`);
    bottomTier.classList.add(`font-${s.fontFamily || 'rajdhani'}`);

    if (cfg.pauseOnHover) {
      bottomTier.classList.add('pause-on-hover');
    }

    wrapper.className = 'ticker-main-wrapper';
    wrapper.classList.add(`mode-${cfg.layoutMode || 'two_tier'}`);

    // Inyectar CSS Personalizado
    if (customStyleTag) {
      customStyleTag.textContent = s.customCSS || '';
    }

    renderTopTier();
    renderBottomTier();
    adjustPreviewScale();
  }

  // Auto-escalado legible para previsualización PiP
  function adjustPreviewScale() {
    if (window.self !== window.top || window.location.search.includes('preview=true')) {
      document.body.classList.add('is-preview');
      const wrapper = document.getElementById('ticker-wrapper');
      if (wrapper) {
        const params = new URLSearchParams(window.location.search);
        const zoomParam = params.get('zoom');
        let sc = 1.0;
        if (zoomParam === 'fit') {
          const availW = window.innerWidth - 24;
          const naturalW = Math.max(wrapper.clientWidth, 520);
          sc = Math.min(1.0, Math.max(0.75, availW / naturalW));
        } else if (zoomParam) {
          sc = parseFloat(zoomParam) || 1.0;
        }
        wrapper.style.transform = sc !== 1.0 ? `scale(${sc.toFixed(2)})` : 'none';
        wrapper.style.transformOrigin = 'center center';
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '100%';
      }
    }
  }

  // Fetch y refresco automático de RSS Feed
  async function fetchRSSFeed(force = false) {
    const rssCfg = tickerState.config.rss;
    if (!rssCfg || !rssCfg.enabled || !rssCfg.url) return;

    const now = Date.now();
    const intervalMs = Math.max(3, rssCfg.refreshMinutes || 10) * 60 * 1000;
    if (!force && (now - tickerState.lastRssFetch < intervalMs) && tickerState.rssItems.length > 0) {
      return;
    }

    try {
      const resp = await fetch(`/api/rss/feed?url=${encodeURIComponent(rssCfg.url)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'ok' && Array.isArray(data.items)) {
          tickerState.rssItems = data.items;
          tickerState.lastRssFetch = now;
          renderBottomTier();
        }
      }
    } catch (e) {
      console.warn('No se pudo actualizar el RSS feed:', e);
    }
  }

  // Carga inicial de configuración
  async function loadInitialConfig() {
    try {
      const resp = await fetch('/api/widgets/config');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.config) {
          if (data.config.ticker) {
            tickerState.config = Object.assign({}, tickerState.config, data.config.ticker);
          }
          if (data.config.goal) {
            syncGoalData(data.config.goal);
          }
        }
      }
    } catch (e) {
      console.warn('Aviso: no se pudo cargar configuración inicial:', e);
    }
    renderTicker();
    fetchRSSFeed(true);

    // Timer periódico de refresco RSS
    if (tickerState.rssTimer) clearInterval(tickerState.rssTimer);
    tickerState.rssTimer = setInterval(() => fetchRSSFeed(), 5 * 60 * 1000);
  }

  function syncGoalData(goalCfg) {
    if (!goalCfg) return;
    const goals = goalCfg.goals || [];
    const active = goals.find(g => g.id === goalCfg.activeGoalId) || goals[0];
    if (active) {
      tickerState.stream.goalTitle = active.title || 'OBJETIVO';
      tickerState.stream.goalCurrent = active.current || 0;
      tickerState.stream.goalTarget = active.target || 100;
      const pct = Math.min(100, Math.round((tickerState.stream.goalCurrent / tickerState.stream.goalTarget) * 100));
      tickerState.stream.goalPct = `${pct}%`;
    }
  }

  // Conexión WebSocket en Tiempo Real
  const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
  let ws;

  function connectWS() {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('✓ Ticker Dual conectado al WebSocket local.');
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);

        if (d.type === 'follow') {
          tickerState.stream.lastFollower = d.user || d.name || 'Viewer';
          renderTopTier();
        } else if (d.type === 'sub' || d.type === 'subscription') {
          tickerState.stream.lastSub = d.user || d.name || 'Subscriber';
          tickerState.stream.lastSubTier = d.tier || 'Tier 1';
          if (d.months) tickerState.stream.lastResub = `${d.months} meses`;
          renderTopTier();
        } else if (d.type === 'bits') {
          const amt = d.bits || d.amount || 100;
          tickerState.stream.lastBits = `${d.user || 'Viewer'} (${amt})`;
          tickerState.stream.topBits = `${d.user || 'Viewer'} (${amt})`;
          renderTopTier();
        } else if (d.type === 'raid') {
          const viewers = d.viewers || d.amount || 20;
          tickerState.stream.lastRaid = `${d.user || 'Colega'} (${viewers} viewers)`;
          renderTopTier();
        } else if (d.type === 'tip') {
          const user = d.user || 'Donante';
          const amt = d.amount || '5€';
          const plat = (d.platform || 'kofi').toLowerCase();
          if (plat === 'kofi') {
            tickerState.stream.lastKofi = `${user} (${amt})`;
            tickerState.stream.lastTip = `${user} (${amt}) [Ko-fi]`;
          } else if (plat === 'buymeacoffee' || plat === 'bmc') {
            tickerState.stream.lastBmc = `${user} (${amt})`;
            tickerState.stream.lastTip = `${user} (${amt}) [BMC]`;
          } else if (plat === 'paypal') {
            tickerState.stream.lastPaypal = `${user} (${amt})`;
            tickerState.stream.lastTip = `${user} (${amt}) [PayPal]`;
          } else {
            tickerState.stream.lastTip = `${user} (${amt})`;
          }
          renderTopTier();
        } else if (d.type === 'goal_update' || d.type === 'update_goal') {
          if (d.title) tickerState.stream.goalTitle = d.title;
          if (d.current !== undefined) tickerState.stream.goalCurrent = d.current;
          if (d.target !== undefined) tickerState.stream.goalTarget = d.target;
          const pct = Math.min(100, Math.round((tickerState.stream.goalCurrent / tickerState.stream.goalTarget) * 100));
          tickerState.stream.goalPct = `${pct}%`;
          renderTopTier();
        } else if (d.type === 'chat_message' && d.message) {
          tickerState.stream.lastChat = d.message;
          renderTopTier();
        } else if (d.type === 'ticker_message') {
          if (d.message) {
            tickerState.config.phrases.unshift({
              id: 'rt_' + Date.now(),
              badge: 'AVISO',
              icon: '📢',
              text: d.message
            });
            renderBottomTier();
          }
        } else if (d.type === 'ticker_flash') {
          tickerState.flashNews = d.message;
          if (tickerState.flashTimeout) clearTimeout(tickerState.flashTimeout);
          renderBottomTier();
          const duration = (d.duration || 12) * 1000;
          tickerState.flashTimeout = setTimeout(() => {
            tickerState.flashNews = null;
            renderBottomTier();
          }, duration);
        } else if (d.type === 'ticker_pause') {
          tickerState.isPaused = !tickerState.isPaused;
          renderBottomTier();
        } else if (d.type === 'ticker_update' && d.config) {
          tickerState.config = Object.assign({}, tickerState.config, d.config);
          renderTicker();
          fetchRSSFeed();
        } else if (d.type === 'widgets_config_updated' && d.config && d.config.ticker) {
          tickerState.config = Object.assign({}, tickerState.config, d.config.ticker);
          renderTicker();
          fetchRSSFeed();
        }
      } catch (err) {
        console.error('Error procesando WebSocket en Ticker:', err);
      }
    };

    ws.onclose = () => setTimeout(connectWS, 2500);
    ws.onerror = () => { try { ws.close(); } catch(e){} };
  }

  // Comunicación instantánea postMessage con el Panel
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'apply_ticker_config') {
      tickerState.config = Object.assign({}, tickerState.config, e.data.config);
      renderTicker();
      if (e.data.forceRss) {
        fetchRSSFeed(true);
      }
    }
  });

  window.addEventListener('resize', adjustPreviewScale);

  // Inicializar
  loadInitialConfig();
  connectWS();
})();
