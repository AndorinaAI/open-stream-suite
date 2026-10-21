/**
 * app/common/catalog.js — Lógica de previsualización responsiva, filtrado y copia de URLs del catálogo de escenas
 */

// Ajuste responsivo automático con ResizeObserver de 1920x1080
function resizePreviews() {
  const holders = document.querySelectorAll('.preview-frame-holder');
  holders.forEach(holder => {
    const wrapper = holder.parentElement;
    if (!wrapper) return;
    const parentWidth = wrapper.clientWidth;
    if (parentWidth > 0) {
      const scale = parentWidth / 1920;
      holder.style.transform = `scale(${scale})`;
    }
  });
}

if (window.ResizeObserver) {
  const ro = new ResizeObserver(() => resizePreviews());
  document.querySelectorAll('.preview-viewport-wrapper').forEach(w => ro.observe(w));
}

window.addEventListener('resize', resizePreviews);
window.addEventListener('DOMContentLoaded', () => {
  resizePreviews();
  setTimeout(resizePreviews, 200);
  setTimeout(resizePreviews, 800);
});

// Alternar fondos simulados de prueba
let bgsVisible = true;
function toggleSimulatedBgs() {
  bgsVisible = !bgsVisible;
  const bgs = document.querySelectorAll('.simulated-bg');
  bgs.forEach(bg => {
    if (bgsVisible) {
      bg.classList.remove('hidden');
    } else {
      bg.classList.add('hidden');
    }
  });
  const btn = document.getElementById('toggle-bg-btn');
  if (btn) {
    if (bgsVisible) {
      btn.classList.add('active');
      btn.innerHTML = '<span>🖼️ Fondo de Prueba: ON</span>';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<span>🔳 Transparencia Real: ON</span>';
    }
  }
}

// Filtrar escenas
function filterScenes(cat) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }

  const cards = document.querySelectorAll('.scene-card');
  cards.forEach(card => {
    if (cat === 'all' || card.dataset.category === cat) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Copiar ruta local
function copyPath(relPath) {
  const fullUrl = window.location.href.replace('index.html', '') + relPath;
  navigator.clipboard.writeText(fullUrl).then(() => {
    alert('Ruta copiada al portapapeles:\n' + fullUrl + '\n\nPégala en OBS Studio como URL de fuente de navegador.');
  }).catch(() => {
    prompt('Copia esta ruta para OBS Studio:', fullUrl);
  });
}
