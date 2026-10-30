/**
 * alerts-studio/02b-gallery-toast.js — Galería de presets de temas, iconos y notificaciones toast
 */

window.AlertsStudio = window.AlertsStudio || {};

function galleryEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function galleryJsArg(value) {
  return galleryEscape(JSON.stringify(String(value == null ? '' : value)));
}
function galleryColor(value, fallback) {
  const s = String(value == null ? '' : value).trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

Object.assign(AlertsStudio, {

  getAlertIconSvg(type, plat) {
    if (type === 'donation') {
      if (plat === 'kofi') return '☕';
      if (plat === 'paypal') return '🅿️';
      if (plat === 'buymeacoffee') return '🟡';
      return '💰';
    }
    const icons = {
      follow: '❤️',
      sub_prime: '👑',
      sub_t1: '⭐',
      sub_t2: '🌟',
      sub_t3: '💫',
      resub: '🔄',
      sub_gift: '🎁',
      sub_community_gift: '📦',
      cheer: '💎',
      raid: '🚀'
    };
    return icons[type] || '✨';
  },

  showToast(msg) {
    if (window.i18n && typeof window.i18n.tr === 'function') {
      msg = window.i18n.tr(msg);
    }
    let toast = document.getElementById('alerts-studio-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'alerts-studio-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.padding = '12px 20px';
      toast.style.background = '#1E293B';
      toast.style.color = '#57D6C4';
      toast.style.border = '1px solid #57D6C4';
      toast.style.borderRadius = '8px';
      toast.style.fontFamily = 'var(--font-tech, monospace)';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '700';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      toast.style.zIndex = '9999';
      toast.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
  }
});
