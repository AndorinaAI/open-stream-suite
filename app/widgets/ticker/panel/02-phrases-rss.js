
// Navegación de Pestañas
function switchTickerSubTab(tabName) {
  currentTickerTab = tabName;
  const container = document.getElementById('miniapp-controls-content');
  if (container) {
    renderTickerControls(container);
  }
}

// Gestión de Frases
function addTickerPhrase() {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  if (!Array.isArray(cachedWidgetsConfig.ticker.phrases)) {
    cachedWidgetsConfig.ticker.phrases = [];
  }
  cachedWidgetsConfig.ticker.phrases.push({
    id: 'p_' + Date.now(),
    icon: '⚡',
    badge: 'NUEVO TEMA',
    text: 'Escribe aquí el texto que se desplazará en la marquesina...'
  });
  renderTickerControls(document.getElementById('miniapp-controls-content'));
  updateTickerPipPreview();
}

function deleteTickerPhrase(index) {
  if (!cachedWidgetsConfig || !cachedWidgetsConfig.ticker) return;
  if (!Array.isArray(cachedWidgetsConfig.ticker.phrases)) return;
  cachedWidgetsConfig.ticker.phrases.splice(index, 1);
  renderTickerControls(document.getElementById('miniapp-controls-content'));
  updateTickerPipPreview();
}

// Presets de RSS
function setRssFeedPreset(type) {
  const urlInput = document.getElementById('cfg-rss-url');
  const prefixInput = document.getElementById('cfg-rss-prefix');
  if (!urlInput || !prefixInput) return;

  if (type === 'bbc') {
    urlInput.value = 'https://feeds.bbci.co.uk/news/world/rss.xml';
    prefixInput.value = 'BBC MUNDO';
  } else if (type === 'hackaday') {
    urlInput.value = 'https://hackaday.com/feed/';
    prefixInput.value = 'HACKADAY MAKER';
  } else if (type === 'techcrunch') {
    urlInput.value = 'https://techcrunch.com/feed/';
    prefixInput.value = 'TECHCRUNCH';
  }
  updateTickerPipPreview();
  testRssFeedFetch();
}

async function testRssFeedFetch() {
  const url = document.getElementById('cfg-rss-url')?.value;
  const statusEl = document.getElementById('rss-test-status');
  if (!url) return;

  if (statusEl) statusEl.textContent = '⏳ Comprobando feed RSS...';
  try {
    const resp = await fetch(`/api/rss/feed?url=${encodeURIComponent(url)}`);
    const data = await resp.json();
    if (data.status === 'ok') {
      if (statusEl) statusEl.textContent = `✓ ${data.count} noticias de "${data.feed_title}"`;
      updateTickerPipPreview(true);
    } else {
      if (statusEl) statusEl.textContent = `⚠️ Error: ${data.error}`;
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = `⚠️ Error conectando: ${err.message}`;
  }
}

function syncColorInput(textId, colorId) {
  const txt = document.getElementById(textId);
  const col = document.getElementById(colorId);
  if (txt && col && /^#[0-9A-Fa-f]{6}$/.test(txt.value)) {
    col.value = txt.value;
  }
}

// Recoger frases actuales de los inputs
function collectPhrasesFromDOM() {
  const phrases = [];
  const items = document.querySelectorAll('#ticker-phrases-list > div');
  items.forEach(el => {
    const icon = el.querySelector('.phrase-icon')?.value || '📌';
    const badge = el.querySelector('.phrase-badge')?.value || 'TEMA';
    const text = el.querySelector('.phrase-text')?.value || '';
    if (text.trim()) {
      phrases.push({ id: 'p_' + Math.random(), icon, badge, text });
    }
  });
  return phrases;
}
