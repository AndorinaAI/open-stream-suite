// ============================================================================
// TEMAS DE COMPONENTES — asignación nativa de tema/forma a widgets y alertas
// Fuente de verdad: /api/themes/packs (incluye overlayThemes/overlayShapes)
// ============================================================================
window.ComponentThemes = (function () {
  let packs = [];
  let catalog = { widgets: [], alerts: [] };
  let state = { overlayThemes: {}, overlayShapes: {} };
  let fusions = [];
  let shapeMeta = {};
  let themeMeta = {};  // id -> {name} para el chip de estado
  const MOUNTS = { widget: 'component-themes-panel', alert: 'alert-themes-panel' };

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Etiquetas legibles para las 9 formas genéricas; las de pack ya traen su
  // `shapes[]` con icon+name. Sin esto el select mostraba "pill" o "soft_card".
  const GENERIC_SHAPE_LABELS = {
    rounded: 'Redondeada', box: 'Caja', bubble: 'Burbuja', scifi: 'Sci-Fi bisel',
    pill: 'Píldora', arcade: 'Arcade', tag: 'Etiqueta', slant: 'Inclinada',
    soft_card: 'Tarjeta suave'
  };
  function shapeLabel(id) {
    const meta = shapeMeta[id];
    if (meta) return `${meta.icon || '📐'} ${meta.name || id}`;
    return tr(`widgets.shape_${id}`, GENERIC_SHAPE_LABELS[id] || id);
  }

  function themeOptions(selected) {
    let html = `<option value="">— ${tr('widgets.theme_none', 'sin asignar')} —</option>`;
    for (const pack of packs) {
      const themes = pack.themes || [];
      if (!themes.length) continue;
      // V3-01: nombre/icono/id vienen de disco (pack.json/theme.json) y se
      // insertan con innerHTML → siempre escapados.
      html += `<optgroup label="${esc(pack.icon || '')} ${esc(pack.name || pack.id)}">`;
      for (const t of themes) {
        const id = t.id || t.themeId || t.key;
        const name = t.name || id;
        html += `<option value="${esc(id)}" ${id === selected ? 'selected' : ''}>${esc(name)}</option>`;
      }
      html += '</optgroup>';
    }
    return html;
  }

  function shapeOptions(shapes, selected) {
    let html = `<option value="">— ${tr('widgets.shape_none', 'sin forma')} —</option>`;
    for (const s of shapes) {
      html += `<option value="${s}" ${s === selected ? 'selected' : ''}>${esc(shapeLabel(s))}</option>`;
    }
    return html;
  }

  function fusionOptions() {
    if (!fusions.length) return '<option value="">— sin fusiones —</option>';
    return '<option value="">— fusión —</option>' + fusions.map(f => `<option value="${f.id}">${esc(f.name || f.id)}</option>`).join('');
  }

  function row(kind, id, shapes) {
    const key = `${kind}:${id}`;
    // ancla para expandFor()/resaltado desde el boton de la tarjeta
    const theme = state.overlayThemes[key] || '';
    const shape = state.overlayShapes[key] || '';
    const fullName = kind === 'widget'
      ? tr(`widgets.${id}.name`, id)
      : tr(`widgets.alert_${id}_name`, id);
    const shortName = String(fullName).replace(/^[^\p{L}\p{N}]+/u, '');
    const label = `${kind === 'widget' ? '🧩' : '🔔'} <span title="${esc(fullName)}" style="display:inline-block;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom;">${esc(shortName)}</span>`;
    // V3-02: cada select lleva nombre accesible propio (incluye el componente),
    // porque el placeholder ("sin asignar"/"sin forma") no dice de qué es cada uno.
    const ariaTheme = esc(`${tr('widgets.col_theme', 'Tema')}: ${fullName}`);
    const ariaShape = esc(`${tr('widgets.col_shape', 'Forma')}: ${fullName}`);
    const ariaFusion = esc(`${tr('widgets.col_fusion', 'Fusión')}: ${fullName}`);
    const shapeCell = shapes && shapes.length
      ? `<select data-role="shape" data-key="${key}" aria-label="${ariaShape}" style="font-size:11px;padding:3px 6px;">${shapeOptions(shapes, shape)}</select>`
      : `<span style="font-size:10px;color:var(--color-text-dim);" title="${tr('widgets.shape_unsupported', 'Este componente no admite formas')}">${tr('widgets.shape_unsupported_short', 'no aplica')}</span>`;
    return `<div data-ct-key="${key}" style="display:grid;grid-template-columns:200px 1fr 130px auto auto auto;gap:8px;align-items:center;background:rgba(255,255,255,0.03);padding:7px 10px;border-radius:5px;">
      <span style="font-size:12px;font-weight:700;color:var(--color-text-light);">${label}</span>
      <select data-role="theme" data-key="${key}" aria-label="${ariaTheme}" style="font-size:11px;padding:3px 6px;">${themeOptions(theme)}</select>
      ${shapeCell}
      <button type="button" class="btn-action-primary" style="font-size:10px;padding:3px 9px;" aria-label="${esc(`${tr('widgets.btn_apply_theme', 'Aplicar')}: ${fullName}`)}" onclick="ComponentThemes.apply('${key}')">${tr('widgets.btn_apply_theme', 'Aplicar')}</button>
      <button type="button" class="btn-action-test" style="font-size:10px;padding:3px 9px;" aria-label="${esc(`${tr('widgets.btn_reset_theme', '↺ Reset')}: ${fullName}`)}" onclick="ComponentThemes.reset('${key}')">${tr('widgets.btn_reset_theme', '↺ Reset')}</button>
      <span style="display:inline-flex;gap:4px;align-items:center;">
        <select data-role="fusion" data-key="${key}" aria-label="${ariaFusion}" style="font-size:10px;padding:2px 4px;">${fusionOptions()}</select>
        <button type="button" class="btn-action-test" style="font-size:10px;padding:3px 7px;" title="${tr('widgets.btn_add_to_fusion', 'Añadir a fusión')}" aria-label="${ariaFusion}" onclick="ComponentThemes.addToFusion('${key}')">➕</button>
      </span>
    </div>`;
  }

  // V3-02: cabecera de columnas para que se vea qué select es tema y cuál forma.
  function headerRow() {
    const cell = 'font-size:10px;font-weight:700;color:var(--color-text-dim);text-transform:uppercase;letter-spacing:0.4px;';
    return `<div style="display:grid;grid-template-columns:200px 1fr 130px auto auto auto;gap:8px;align-items:center;padding:0 10px 2px 10px;">
      <span style="${cell}">${esc(tr('widgets.col_component', 'Componente'))}</span>
      <span style="${cell}">${esc(tr('widgets.col_theme', 'Tema'))}</span>
      <span style="${cell}">${esc(tr('widgets.col_shape', 'Forma'))}</span>
      <span style="${cell}">${esc(tr('widgets.btn_apply_theme', 'Aplicar'))}</span>
      <span style="${cell}">${esc(tr('widgets.btn_reset_theme', '↺ Reset'))}</span>
      <span style="${cell}">${esc(tr('widgets.col_fusion', 'Fusión'))}</span>
    </div>`;
  }

  function mountFor(key) {
    const kind = String(key).split(':')[0];
    return document.getElementById(MOUNTS[kind] || MOUNTS.widget) || document.getElementById('component-themes-panel');
  }

  // ------------------------------------------------------------- carga perezosa
  // Single-flight: si ya hay una carga en vuelo se reutiliza la MISMA promesa.
  // Antes, dos load() en paralelo pintaban dos veces y ganaba la respuesta
  // que llegara ultima (parpadeo + estado incoherente).
  let inflight = null;
  let bindCount = 0;

  async function load(opts) {
    opts = opts || {};
    const acc = document.getElementById('widget-themes-accordion');
    const alertAcc = document.getElementById('alert-themes-accordion');
    const closed = [acc, alertAcc].filter(Boolean).every(d => !d.open);
    // Perezoso: con los acordeones cerrados no se repinta (ni se hace fetch).
    if (closed && !opts.force) return null;
    if (inflight) return inflight;

    const boxes = Object.values(MOUNTS).map(id => document.getElementById(id)).filter(Boolean);
    if (!boxes.length) return null;
    inflight = (async () => {
      boxes.forEach(box => { box.innerHTML = `<div style="font-size:11px;color:var(--color-text-dim);">${tr('common.loading', 'Cargando…')}</div>`; });
      try {
        const [packsRes, catRes, fusRes] = await Promise.all([
          fetch('/api/themes/packs').then(r => r.json()),
          API.getComponentsCatalog(),
          API.getFusions().catch(() => ({ fusions: [] }))
        ]);
        packs = packsRes.packs || [];
        shapeMeta = {};
        packs.forEach(p => (p.shapes || []).forEach(sh => { if (sh && sh.id) shapeMeta[sh.id] = sh; }));
        themeMeta = {};
        packs.forEach(p => (p.themes || []).forEach(th => { if (th && th.id) themeMeta[th.id] = th; }));
        fusions = (fusRes && fusRes.fusions) || [];
        state.overlayThemes = packsRes.overlayThemes || {};
        state.overlayShapes = packsRes.overlayShapes || {};
        catalog = catRes || { widgets: [], alerts: [] };
        const render = (kind, items) => {
          const box = document.getElementById(MOUNTS[kind]);
          if (!box) return;
          const rows = items.map(x => row(kind, x.id, x.shapes));
          box.innerHTML = rows.length
            ? headerRow() + rows.join('')
            : `<div style="font-size:11px;color:var(--color-text-dim);">${tr('widgets.no_components', 'Sin componentes disponibles')}</div>`;
        };
        render('widget', catalog.widgets || []);
        render('alert', catalog.alerts || []);
        paintStatusChips();
      } catch (e) {
        boxes.forEach(box => {
          box.innerHTML = `<div style="font-size:11px;color:#F87171;">${tr('widgets.components_load_error', 'No se pudo cargar el catálogo de componentes:')} ${esc(e && e.message)}</div>`;
        });
      } finally {
        inflight = null;
      }
      return true;
    })();
    return inflight;
  }

  /** Chip de estado en cada tarjeta: "Tema: X · Forma: Y" sin abrir nada. */
  function paintStatusChips() {
    document.querySelectorAll('[data-status-chip]').forEach(el => {
      const kind = el.getAttribute('data-status-chip');
      const id = el.getAttribute('data-status-id') || '';
      const key = `${kind}:${id}`;
      const themeId = state.overlayThemes[key] || '';
      const shapeId = state.overlayShapes[key] || '';
      const meta = themeMeta[themeId];
      if (window.UI && UI.renderStatusChip) {
        el.innerHTML = UI.renderStatusChip({
          theme: themeId, themeName: meta ? meta.name : '',
          shape: shapeId, shapeName: shapeMeta[shapeId] ? shapeMeta[shapeId].name : ''
        });
      }
    });
  }

  /** Abre el acordeón, hace scroll a la fila y la resalta 2 s. */
  function expandFor(kind, id) {
    const acc = document.getElementById('widget-themes-accordion');
    if (!acc) return;
    acc.open = true;
    bindAccordionOnce();
    load({ force: true }).then(() => {
      const rowEl = acc.querySelector(`[data-ct-key="${kind}:${id}"]`);
      if (!rowEl) return;
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      rowEl.classList.add('ct-row-highlight');
      setTimeout(() => rowEl.classList.remove('ct-row-highlight'), 2000);
    });
  }

  /** Registra los listeners UNA sola vez (abrir/cerrar N veces no acumula). */
  function bindAccordionOnce() {
    if (bindCount > 0) return bindCount;
    const acc = document.getElementById('widget-themes-accordion');
    const alertAcc = document.getElementById('alert-themes-accordion');
    [acc, alertAcc].forEach(d => {
      if (!d) return;
      d.addEventListener('toggle', () => { if (d.open) load(); });
    });
    bindCount = 1;
    return bindCount;
  }

  async function apply(key) {
    const scope = mountFor(key);
    const themeSel = scope.querySelector(`select[data-role="theme"][data-key="${key}"]`);
    const shapeSel = scope.querySelector(`select[data-role="shape"][data-key="${key}"]`);
    const themeValue = themeSel ? themeSel.value : '';
    const shapeValue = shapeSel ? shapeSel.value : '';
    if (!themeValue && !shapeValue) {
      if (window.OverlayTexts && OverlayTexts.showToast) {
        OverlayTexts.showToast(tr('widgets.select_theme_or_shape', 'Selecciona un tema o una forma'), 'info');
      }
      return;
    }
    try {
      if (themeValue) {
        await API.assignComponent(key, { themeId: themeValue });
        state.overlayThemes[key] = themeValue;
      }
      if (shapeValue) {
        await API.assignComponent(key, { shapeId: shapeValue });
        state.overlayShapes[key] = shapeValue;
      }
      if (window.OverlayTexts && OverlayTexts.showToast) OverlayTexts.showToast(tr('widgets.toast_theme_saved', '✓ Tema aplicado'), 'success');
    } catch (e) {
      alert(tr('widgets.theme_apply_error', 'No se pudo aplicar: ') + e.message);
    }
  }

  async function addToFusion(key) {
    const sel = mountFor(key).querySelector(`select[data-role="fusion"][data-key="${key}"]`);
    if (!sel || !sel.value) return;
    const fusion = fusions.find(f => f.id === sel.value);
    if (!fusion) return;
    const [kind, compId] = key.split(':');
    const field = kind === 'widget' ? 'widgets' : 'alerts';
    const list = Array.isArray(fusion[field]) ? fusion[field] : [];
    if (list.includes(compId)) {
      if (window.OverlayTexts && OverlayTexts.showToast) OverlayTexts.showToast(tr('widgets.already_in_fusion', 'Ya pertenece a esa fusión'), 'info');
      return;
    }
    const payload = {
      id: fusion.id, name: fusion.name, icon: fusion.icon, description: fusion.description,
      defaultTheme: fusion.defaultTheme || 'maker', defaultShape: fusion.defaultShape || 'original',
      scenes: [...(fusion.scenes || [])], widgets: [...(fusion.widgets || [])], alerts: [...(fusion.alerts || [])]
    };
    payload[field] = [...list, compId];
    try {
      await API.saveFusion(payload);
      if (typeof loadAndRenderFusions === 'function') await loadAndRenderFusions();
      await load();
      if (window.OverlayTexts && OverlayTexts.showToast) OverlayTexts.showToast(tr('widgets.toast_added_to_fusion', '✓ Añadido a la fusión'), 'success');
    } catch (e) {
      alert(tr('widgets.add_to_fusion_error', 'No se pudo añadir a la fusión: ') + e.message);
    }
  }

  async function reset(key) {
    try {
      await API.resetComponent(key);
      delete state.overlayThemes[key];
      delete state.overlayShapes[key];
      await load();
      if (window.OverlayTexts && OverlayTexts.showToast) OverlayTexts.showToast(tr('widgets.toast_theme_reset', '↺ Componente restaurado'), 'success');
    } catch (e) {
      alert(tr('widgets.theme_reset_error', 'No se pudo restaurar: ') + e.message);
    }
  }

  // Una carga inicial para pintar los chips de estado; despues es perezosa.
  document.addEventListener('DOMContentLoaded', () => { bindAccordionOnce(); load({ force: true }); });
  // Repintar cuando el diccionario i18n esté listo o cambie el idioma
  if (window.i18n && window.i18n.onLoad) window.i18n.onLoad(load);
  window.addEventListener('oss-lang-change', load);
  return {
    load, apply, reset, addToFusion,
    expandFor, bindAccordionOnce, paintStatusChips,
    themeStateFor(key) {
      const themeId = state.overlayThemes[key] || "";
      const shapeId = state.overlayShapes[key] || "";
      const theme = themeMeta[themeId];
      const shape = shapeMeta[shapeId];
      return { theme: themeId, themeName: theme ? theme.name : "", shape: shapeId, shapeName: shape ? shape.name : "" };
    },
    _debug() { return { bindCount, inflight: !!inflight }; }
  };
})();
