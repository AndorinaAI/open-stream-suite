// widgets/ticker/js/network.js - Conexión WebSocket, Fetch RSS y Sincronización en vivo

window.TickerNetwork = (function() {
  const S = window.TickerStateData;
  const R = window.TickerRenderer;

  async function fetchRSSFeed(force = false) {
    const rssCfg = S.state.config.rss;
    if (!rssCfg || !rssCfg.enabled || !rssCfg.url) return;

    const now = Date.now();
    const intervalMs = Math.max(3, rssCfg.refreshMinutes || 10) * 60 * 1000;
    if (!force && (now - S.state.lastRssFetch < intervalMs) && S.state.rssItems.length > 0) {
      return;
    }

    try {
      const resp = await fetch(`/api/rss/feed?url=${encodeURIComponent(rssCfg.url)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'ok' && Array.isArray(data.items)) {
          S.state.rssItems = data.items;
          S.state.lastRssFetch = now;
          R.renderBottomTier();
        }
      }
    } catch (e) {
      console.warn('No se pudo actualizar el RSS feed:', e);
    }
  }

  function syncGoalData(goalCfg) {
    if (!goalCfg) return;
    const goals = goalCfg.goals || [];
    const active = goals.find(g => g.id === goalCfg.activeGoalId) || goals[0];
    if (active) {
      S.state.stream.goalTitle = active.title || 'OBJETIVO';
      S.state.stream.goalCurrent = active.current || 0;
      S.state.stream.goalTarget = active.target || 100;
      const pct = Math.min(100, Math.round((S.state.stream.goalCurrent / S.state.stream.goalTarget) * 100));
      S.state.stream.goalPct = `${pct}%`;
    }
  }

  async function loadInitialConfig() {
    try {
      const resp = await fetch('/api/widgets/config');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.config) {
          if (data.config.ticker) {
            S.state.config = Object.assign({}, S.state.config, data.config.ticker);
          }
          if (data.config.goal) {
            syncGoalData(data.config.goal);
          }
        }
      }
    } catch (e) {
      console.warn('Aviso: no se pudo cargar configuración inicial:', e);
    }
    R.renderTicker();
    fetchRSSFeed(true);

    if (S.state.rssTimer) clearInterval(S.state.rssTimer);
    S.state.rssTimer = setInterval(() => fetchRSSFeed(), 5 * 60 * 1000);
  }

  const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
  let ws;

  function connectWS() {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('✓ Ticker Dual conectado al WebSocket local.');
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);

        if (d.type === 'follow') {
          S.state.stream.lastFollower = d.user || d.name || 'Viewer';
          R.renderTopTier();
        } else if (d.type === 'sub' || d.type === 'subscription') {
          S.state.stream.lastSub = d.user || d.name || 'Subscriber';
          S.state.stream.lastSubTier = d.tier || 'Tier 1';
          if (d.months) S.state.stream.lastResub = `${d.months} meses`;
          R.renderTopTier();
        } else if (d.type === 'bits') {
          const amt = d.bits || d.amount || 100;
          S.state.stream.lastBits = `${d.user || 'Viewer'} (${amt})`;
          S.state.stream.topBits = `${d.user || 'Viewer'} (${amt})`;
          R.renderTopTier();
        } else if (d.type === 'raid') {
          const viewers = d.viewers || d.amount || 20;
          S.state.stream.lastRaid = `${d.user || 'Colega'} (${viewers} viewers)`;
          R.renderTopTier();
        } else if (d.type === 'tip') {
          const user = d.user || 'Donante';
          const amt = d.amount || '5€';
          const plat = (d.platform || 'kofi').toLowerCase();
          if (plat === 'kofi') {
            S.state.stream.lastKofi = `${user} (${amt})`;
            S.state.stream.lastTip = `${user} (${amt}) [Ko-fi]`;
          } else if (plat === 'buymeacoffee' || plat === 'bmc') {
            S.state.stream.lastBmc = `${user} (${amt})`;
            S.state.stream.lastTip = `${user} (${amt}) [BMC]`;
          } else if (plat === 'paypal') {
            S.state.stream.lastPaypal = `${user} (${amt})`;
            S.state.stream.lastTip = `${user} (${amt}) [PayPal]`;
          } else {
            S.state.stream.lastTip = `${user} (${amt})`;
          }
          R.renderTopTier();
        } else if (d.type === 'goal_update' || d.type === 'update_goal') {
          if (d.title) S.state.stream.goalTitle = d.title;
          if (d.current !== undefined) S.state.stream.goalCurrent = d.current;
          if (d.target !== undefined) S.state.stream.goalTarget = d.target;
          const pct = Math.min(100, Math.round((S.state.stream.goalCurrent / S.state.stream.goalTarget) * 100));
          S.state.stream.goalPct = `${pct}%`;
          R.renderTopTier();
        } else if (d.type === 'chat_message' && d.message) {
          S.state.stream.lastChat = d.message;
          R.renderTopTier();
        } else if (d.type === 'ticker_message') {
          if (d.message) {
            S.state.config.phrases.unshift({
              id: 'rt_' + Date.now(),
              badge: 'AVISO',
              icon: '📢',
              text: d.message
            });
            R.renderBottomTier();
          }
        } else if (d.type === 'ticker_flash') {
          S.state.flashNews = d.message;
          if (S.state.flashTimeout) clearTimeout(S.state.flashTimeout);
          R.renderBottomTier();
          const duration = (d.duration || 12) * 1000;
          S.state.flashTimeout = setTimeout(() => {
            S.state.flashNews = null;
            R.renderBottomTier();
          }, duration);
        } else if (d.type === 'ticker_pause') {
          S.state.isPaused = !S.state.isPaused;
          R.renderBottomTier();
        } else if (d.type === 'ticker_update' && d.config) {
          S.state.config = Object.assign({}, S.state.config, d.config);
          R.renderTicker();
          fetchRSSFeed();
        } else if (d.type === 'widgets_config_updated' && d.config && d.config.ticker) {
          S.state.config = Object.assign({}, S.state.config, d.config.ticker);
          R.renderTicker();
          fetchRSSFeed();
        }
      } catch (err) {
        console.error('Error procesando WebSocket en Ticker:', err);
      }
    };

    ws.onclose = () => setTimeout(connectWS, 2500);
    ws.onerror = () => { try { ws.close(); } catch(e){} };
  }

  function setupEventListeners() {
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'apply_ticker_config') {
        S.state.config = Object.assign({}, S.state.config, e.data.config);
        R.renderTicker();
        if (e.data.forceRss) {
          fetchRSSFeed(true);
        }
      }
    });

    window.addEventListener('resize', R.adjustPreviewScale);
  }

  return {
    fetchRSSFeed,
    loadInitialConfig,
    connectWS,
    setupEventListeners
  };
})();
