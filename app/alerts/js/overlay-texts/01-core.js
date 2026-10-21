// ====================================================================
// OVERLAY TEXTS - OBJETO BASE, PESTAÑAS Y UTILIDADES
// ====================================================================

window.OverlayTexts = window.OverlayTexts || {
  currentTexts: null,
  activeTab: 'channel',

  async init() {
    this.bindTabEvents();
    await this.load();
  },

  bindTabEvents() {
    const tabs = document.querySelectorAll('.text-scene-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        this.switchTab(target);
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.text-scene-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.target === tabId);
    });
    document.querySelectorAll('.text-tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `text-pane-${tabId}`);
    });
  },

  setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  },

  setChecked(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  },

  showToast(msg, type = 'info') {
    if (window.i18n && typeof window.i18n.tr === 'function') {
      msg = window.i18n.tr(msg);
    }
    let toast = document.getElementById('overlay-texts-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'overlay-texts-toast';
      toast.className = 'overlay-texts-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `overlay-texts-toast show ${type}`;
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};
