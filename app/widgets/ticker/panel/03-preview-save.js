
// Actualización en tiempo real del Iframe PiP (postMessage)
function updateTickerPipPreview(forceRss = false) {
  const iframe = document.getElementById('miniapp-live-iframe');
  if (!iframe || !iframe.contentWindow) return;

  const layoutMode = document.querySelector('input[name="tk-layout-mode"]:checked')?.value || 'two_tier';
  const speed = parseInt(document.getElementById('cfg-ticker-speed')?.value, 10) || 45;
  const rotAnim = document.getElementById('cfg-ticker-rot-anim')?.value || 'slide';
  const topicSeparator = document.getElementById('cfg-ticker-topic-sep')?.value || '///';
  const eventSeparator = document.getElementById('cfg-ticker-event-sep')?.value || '│';

  const contentSource = document.getElementById('cfg-ticker-content-source')?.value || 'both';
  const phrases = collectPhrasesFromDOM();

  const rssEnable = document.getElementById('cfg-rss-enable')?.checked;
  const rssUrl = document.getElementById('cfg-rss-url')?.value || '';
  const rssPrefix = document.getElementById('cfg-rss-prefix')?.value || 'NOTICIAS MUNDO';
  const rssMax = parseInt(document.getElementById('cfg-rss-max')?.value, 10) || 6;

  const showFollows = document.getElementById('cfg-chip-follows')?.checked;
  const showSubs = document.getElementById('cfg-chip-subs')?.checked;
  const showResubs = document.getElementById('cfg-chip-resubs')?.checked;
  const showLastBits = document.getElementById('cfg-chip-last-bits')?.checked;
  const showTopBits = document.getElementById('cfg-chip-top-bits')?.checked;
  const showRaids = document.getElementById('cfg-chip-raids')?.checked;
  const showTips = document.getElementById('cfg-chip-tips')?.checked;
  const showKofi = document.getElementById('cfg-chip-kofi')?.checked;
  const showPaypal = document.getElementById('cfg-chip-paypal')?.checked;
  const showBmc = document.getElementById('cfg-chip-bmc')?.checked;
  const showGoal = document.getElementById('cfg-chip-goal')?.checked;
  const showViewers = document.getElementById('cfg-chip-viewers')?.checked;
  const showLastChat = document.getElementById('cfg-chip-last-chat')?.checked;

  const shape = document.getElementById('cfg-ticker-shape')?.value || 'rounded';
  const bgType = document.getElementById('cfg-ticker-bg-type')?.value || 'glass';
  const borderStyle = document.getElementById('cfg-ticker-border-style')?.value || 'left_neon';
  const accentColor = document.getElementById('cfg-ticker-accent')?.value || '#57D6C4';
  const bgColor = document.getElementById('cfg-ticker-bg')?.value || '#191D21';
  const bgGradient = document.getElementById('cfg-ticker-bg-grad')?.value || '#0B0D0F';
  const bgOpacity = parseInt(document.getElementById('cfg-ticker-opacity')?.value, 10) || 92;

  const followColor = document.getElementById('cfg-ticker-col-follow')?.value || '#F43F5E';
  const subColor = document.getElementById('cfg-ticker-col-sub')?.value || '#A78BFA';
  const bitsColor = document.getElementById('cfg-ticker-col-bits')?.value || '#FBBF24';
  const raidColor = document.getElementById('cfg-ticker-col-raid')?.value || '#38BDF8';

  const fontFamily = document.getElementById('cfg-ticker-font')?.value || 'rajdhani';
  const fontSize = parseInt(document.getElementById('cfg-ticker-font-size')?.value, 10) || 13;
  const glowIntensity = parseInt(document.getElementById('cfg-ticker-glow')?.value, 10) || 35;
  const customCSS = document.getElementById('cfg-ticker-custom-css')?.value || '';

  const cfg = {
    layoutMode,
    speed,
    rotatorAnimation: rotAnim,
    topicSeparator,
    eventSeparator,
    contentSource,
    phrases: phrases.length > 0 ? phrases : undefined,
    rss: {
      enabled: rssEnable !== false,
      url: rssUrl,
      prefix: rssPrefix,
      maxItems: rssMax
    },
    eventChips: {
      showFollows: showFollows !== false,
      showSubs: showSubs !== false,
      showResubs: showResubs === true,
      showLastBits: showLastBits !== false,
      showTopBits: showTopBits === true,
      showRaids: showRaids !== false,
      showTips: showTips === true,
      showKofi: showKofi !== false,
      showPaypal: showPaypal !== false,
      showBmc: showBmc !== false,
      showGoal: showGoal !== false,
      showViewers: showViewers === true,
      showLastChat: showLastChat === true
    },
    styles: {
      shape,
      bgType,
      borderStyle,
      borderColor: accentColor,
      accentColor,
      bgColor,
      bgGradient,
      bgOpacity,
      topTierShape: document.getElementById('cfg-top-shape')?.value || 'capsule',
      topTierChipStyle: document.getElementById('cfg-top-chip-style')?.value || 'badge_filled',
      topTierBgColor: document.getElementById('cfg-top-bg')?.value || '#121518',
      topTierBgOpacity: parseInt(document.getElementById('cfg-top-opacity')?.value, 10) || 88,
      topTierBorderColor: document.getElementById('cfg-top-border')?.value || '#57D6C4',
      topTierFontSize: parseInt(document.getElementById('cfg-top-font-size')?.value, 10) || 12,
      topTierSpacing: parseInt(document.getElementById('cfg-top-spacing')?.value, 10) || 8,
      topTierAlign: document.getElementById('cfg-top-align')?.value || 'center',
      followColor,
      subColor,
      resubColor: document.getElementById('cfg-ticker-col-resub')?.value || '#818CF8',
      bitsColor,
      topBitsColor: document.getElementById('cfg-ticker-col-top-bits')?.value || '#F59E0B',
      raidColor,
      tipColor: document.getElementById('cfg-ticker-col-tip')?.value || '#10B981',
      kofiColor: document.getElementById('cfg-ticker-col-kofi')?.value || '#29ABE2',
      paypalColor: document.getElementById('cfg-ticker-col-paypal')?.value || '#0079C1',
      bmcColor: document.getElementById('cfg-ticker-col-bmc')?.value || '#FFDD00',
      goalColor: document.getElementById('cfg-ticker-col-goal')?.value || '#57D6C4',
      fontFamily,
      fontSize,
      glowIntensity,
      customCSS
    }
  };

  try {
    iframe.contentWindow.postMessage({
      type: 'apply_ticker_config',
      config: cfg,
      forceRss: forceRss
    }, '*');
  } catch (e) {}
}

// Guardado de Controles
async function saveTickerControls() {
  if (!cachedWidgetsConfig) return;
  if (!cachedWidgetsConfig.ticker) cachedWidgetsConfig.ticker = {};
  const tk = cachedWidgetsConfig.ticker;

  tk.layoutMode = document.querySelector('input[name="tk-layout-mode"]:checked')?.value || tk.layoutMode || 'two_tier';
  tk.speed = parseInt(document.getElementById('cfg-ticker-speed')?.value, 10) || tk.speed || 45;
  tk.rotatorAnimation = document.getElementById('cfg-ticker-rot-anim')?.value || tk.rotatorAnimation || 'slide';
  tk.topicSeparator = document.getElementById('cfg-ticker-topic-sep')?.value || tk.topicSeparator || '///';
  tk.eventSeparator = document.getElementById('cfg-ticker-event-sep')?.value || tk.eventSeparator || '│';

  tk.contentSource = document.getElementById('cfg-ticker-content-source')?.value || tk.contentSource || 'both';

  const collectedPhrases = collectPhrasesFromDOM();
  if (collectedPhrases.length > 0) {
    tk.phrases = collectedPhrases;
  }

  if (!tk.rss) tk.rss = {};
  tk.rss.enabled = document.getElementById('cfg-rss-enable')?.checked !== false;
  tk.rss.url = document.getElementById('cfg-rss-url')?.value || tk.rss.url;
  tk.rss.prefix = document.getElementById('cfg-rss-prefix')?.value || tk.rss.prefix;
  tk.rss.maxItems = parseInt(document.getElementById('cfg-rss-max')?.value, 10) || tk.rss.maxItems || 6;

  if (!tk.eventChips) tk.eventChips = {};
  tk.eventChips.showFollows = document.getElementById('cfg-chip-follows')?.checked !== false;
  tk.eventChips.showSubs = document.getElementById('cfg-chip-subs')?.checked !== false;
  tk.eventChips.showResubs = document.getElementById('cfg-chip-resubs')?.checked === true;
  tk.eventChips.showLastBits = document.getElementById('cfg-chip-last-bits')?.checked !== false;
  tk.eventChips.showTopBits = document.getElementById('cfg-chip-top-bits')?.checked === true;
  tk.eventChips.showRaids = document.getElementById('cfg-chip-raids')?.checked !== false;
  tk.eventChips.showTips = document.getElementById('cfg-chip-tips')?.checked === true;
  tk.eventChips.showKofi = document.getElementById('cfg-chip-kofi')?.checked !== false;
  tk.eventChips.showPaypal = document.getElementById('cfg-chip-paypal')?.checked !== false;
  tk.eventChips.showBmc = document.getElementById('cfg-chip-bmc')?.checked !== false;
  tk.eventChips.showGoal = document.getElementById('cfg-chip-goal')?.checked !== false;
  tk.eventChips.showViewers = document.getElementById('cfg-chip-viewers')?.checked === true;
  tk.eventChips.showLastChat = document.getElementById('cfg-chip-last-chat')?.checked === true;

  if (!tk.styles) tk.styles = {};
  tk.styles.shape = document.getElementById('cfg-ticker-shape')?.value || tk.styles.shape || 'rounded';
  tk.styles.bgType = document.getElementById('cfg-ticker-bg-type')?.value || tk.styles.bgType || 'glass';
  tk.styles.borderStyle = document.getElementById('cfg-ticker-border-style')?.value || tk.styles.borderStyle || 'left_neon';
  
  const accent = document.getElementById('cfg-ticker-accent')?.value || tk.styles.accentColor || '#57D6C4';
  tk.styles.accentColor = accent;
  tk.styles.borderColor = accent;
  tk.styles.bgColor = document.getElementById('cfg-ticker-bg')?.value || tk.styles.bgColor || '#191D21';
  tk.styles.bgGradient = document.getElementById('cfg-ticker-bg-grad')?.value || tk.styles.bgGradient || '#0B0D0F';
  tk.styles.bgOpacity = parseInt(document.getElementById('cfg-ticker-opacity')?.value, 10) || tk.styles.bgOpacity || 92;

  tk.styles.topTierShape = document.getElementById('cfg-top-shape')?.value || tk.styles.topTierShape || 'capsule';
  tk.styles.topTierChipStyle = document.getElementById('cfg-top-chip-style')?.value || tk.styles.topTierChipStyle || 'badge_filled';
  tk.styles.topTierBgColor = document.getElementById('cfg-top-bg')?.value || tk.styles.topTierBgColor || '#121518';
  tk.styles.topTierBgOpacity = parseInt(document.getElementById('cfg-top-opacity')?.value, 10) || tk.styles.topTierBgOpacity || 88;
  tk.styles.topTierBorderColor = document.getElementById('cfg-top-border')?.value || tk.styles.topTierBorderColor || '#57D6C4';
  tk.styles.topTierFontSize = parseInt(document.getElementById('cfg-top-font-size')?.value, 10) || tk.styles.topTierFontSize || 12;
  tk.styles.topTierSpacing = parseInt(document.getElementById('cfg-top-spacing')?.value, 10) || tk.styles.topTierSpacing || 8;
  tk.styles.topTierAlign = document.getElementById('cfg-top-align')?.value || tk.styles.topTierAlign || 'center';

  tk.styles.followColor = document.getElementById('cfg-ticker-col-follow')?.value || tk.styles.followColor || '#F43F5E';
  tk.styles.subColor = document.getElementById('cfg-ticker-col-sub')?.value || tk.styles.subColor || '#A78BFA';
  tk.styles.resubColor = document.getElementById('cfg-ticker-col-resub')?.value || tk.styles.resubColor || '#818CF8';
  tk.styles.bitsColor = document.getElementById('cfg-ticker-col-bits')?.value || tk.styles.bitsColor || '#FBBF24';
  tk.styles.topBitsColor = document.getElementById('cfg-ticker-col-top-bits')?.value || tk.styles.topBitsColor || '#F59E0B';
  tk.styles.raidColor = document.getElementById('cfg-ticker-col-raid')?.value || tk.styles.raidColor || '#38BDF8';
  tk.styles.tipColor = document.getElementById('cfg-ticker-col-tip')?.value || tk.styles.tipColor || '#10B981';
  tk.styles.kofiColor = document.getElementById('cfg-ticker-col-kofi')?.value || tk.styles.kofiColor || '#29ABE2';
  tk.styles.paypalColor = document.getElementById('cfg-ticker-col-paypal')?.value || tk.styles.paypalColor || '#0079C1';
  tk.styles.bmcColor = document.getElementById('cfg-ticker-col-bmc')?.value || tk.styles.bmcColor || '#FFDD00';
  tk.styles.goalColor = document.getElementById('cfg-ticker-col-goal')?.value || tk.styles.goalColor || '#57D6C4';

  tk.styles.fontFamily = document.getElementById('cfg-ticker-font')?.value || tk.styles.fontFamily || 'rajdhani';
  tk.styles.fontSize = parseInt(document.getElementById('cfg-ticker-font-size')?.value, 10) || tk.styles.fontSize || 13;
  tk.styles.glowIntensity = parseInt(document.getElementById('cfg-ticker-glow')?.value, 10) || tk.styles.glowIntensity || 35;
  tk.styles.customCSS = document.getElementById('cfg-ticker-custom-css')?.value || tk.styles.customCSS || '';

  await API.saveWidgetsConfig(cachedWidgetsConfig);
  updateTickerPipPreview(true);
  renderTickerShortcuts();
  alert('✓ Configuración del Ticker guardada correctamente.');
}
