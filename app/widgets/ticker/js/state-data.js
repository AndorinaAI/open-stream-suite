// widgets/ticker/js/state-data.js - Estado de datos, tokens y formateo de métricas para Ticker

window.TickerStateData = (function() {
  const tickerState = {
    stream: {
      channel: 'Andorina',
      lastFollower: 'Andorina',
      lastSub: 'StreamFan99',
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
      lastChat: '¡Saludos a todos!'
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
      activePreset: 'cyber_stream',
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
          badge: 'OPEN STREAM SUITE',
          icon: '🛠️',
          text: 'JUGAR · CREAR · COMPARTIR · ¡Bienvenidos al stream!'
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

  function getActivePrompterItems() {
    const cfg = tickerState.config;
    const items = [];

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

    if (source === 'both' || source === 'phrases') {
      const phrases = Array.isArray(cfg.phrases) ? cfg.phrases : [];
      phrases.forEach(p => {
        if (p.text && p.text.trim()) {
          items.push({
            id: p.id || 'phrase_' + Math.random(),
            badge: p.badge || 'LIVE',
            badgeClass: 'topic-badge',
            icon: p.icon || '📌',
            text: replaceTokens(p.text)
          });
        }
      });
    }

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
        text: '¡Bienvenidos al directo de Open Stream Suite! Sigue el canal para más contenido.'
      });
    }

    return items;
  }

  return {
    state: tickerState,
    replaceTokens,
    getActiveEventChips,
    getActivePrompterItems
  };
})();
