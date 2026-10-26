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
    const theme = state.overlayThemes[key] || '';
    const shape = state.overlayShapes[key] || '';
    const fullName = kind === 'widget'
      ? tr(`widgets.${id}.name`, id)
      : tr(`widgets.alert_${id}_name`, id);
    const shortName = String(fullName).replace(/^[^\p{L}\p{N}]+/u, '');
    const label = `${kind === 'widget' ? '🧩' : '🔔'} <span title="${esc(fullName)}" style="display:inline-block;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom;">${esc(shortName)}</span>`;
    const shapeCell = shapes && shapes.length
      ? `<select data-role="shape" data-key="${key}" style="font-size:11px;padding:3px 6px;">${shapeOptions(shapes, shape)}</select>`
      : `<span style="font-size:10px;color:var(--color-text-dim);" title="${tr('widgets.shape_unsupported', 'Este componente no admite formas')}">${tr('widgets.shape_unsupported_short', 'no aplica')}</span>`;
    return `<div style="display:grid;grid-template-columns:200px 1fr 130px auto auto auto;gap:8px;align-items:center;background:rgba(255,255,255,0.03);padding:7px 10px;border-radius:5px;">
      <span style="font-size:12px;font-weight:700;color:var(--color-text-light);">${label}</span>
      <select data-role="theme" data-key="${key}" style="font-size:11px;padding:3px 6px;">${themeOptions(theme)}</select>
      ${shapeCell}
      <button type="button" class="btn-action-primary" style="font-size:10px;padding:3px 9px;" onclick="ComponentThemes.apply('${key}')">${tr('widgets.btn_apply_theme', 'Aplicar')}</button>
      <button type="button" class="btn-action-test" style="font-size:10px;padding:3px 9px;" onclick="ComponentThemes.reset('${key}')">${tr('widgets.btn_reset_theme', '↺ Reset')}</button>
      <span style="display:inline-flex;gap:4px;align-items:center;">
        <select data-role="fusion" data-key="${key}" style="font-size:10px;padding:2px 4px;">${fusionOptions()}</select>
        <button type="button" class="btn-action-test" style="font-size:10px;padding:3px 7px;" title="${tr('widgets.btn_add_to_fusion', 'Añadir a fusión')}" onclick="ComponentThemes.addToFusion('${key}')">➕</button>
      </span>
    </div>`;
  }

  function mountFor(key) {
    const kind = String(key).split(':')[0];
    return document.getElementById(MOUNTS[kind] || MOUNTS.widget) || document.getElementById('component-themes-panel');
  }

  async function load() {
    const boxes = Object.values(MOUNTS).map(id => document.getElementById(id)).filter(Boolean);
    if (!boxes.length) return;
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
      fusions = (fusRes && fusRes.fusions) || [];
      state.overlayThemes = packsRes.overlayThemes || {};
      state.overlayShapes = packsRes.overlayShapes || {};
      catalog = catRes || { widgets: [], alerts: [] };
      const render = (kind, items) => {
        const box = document.getElementById(MOUNTS[kind]);
        if (!box) return;
        const rows = items.map(x => row(kind, x.id, x.shapes));
        box.innerHTML = rows.join('') || `<div style="font-size:11px;color:var(--color-text-dim);">${tr('widgets.no_components', 'Sin componentes disponibles')}</div>`;
      };
      render('widget', catalog.widgets || []);
      render('alert', catalog.alerts || []);
    } catch (e) {
      boxes.forEach(box => {
        box.innerHTML = `<div style="font-size:11px;color:#F87171;">${tr('widgets.components_load_error', 'No se pudo cargar el catálogo de componentes:')} ${esc(e && e.message)}</div>`;
      });
    }
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

  document.addEventListener('DOMContentLoaded', load);
  // Repintar cuando el diccionario i18n esté listo o cambie el idioma
  if (window.i18n && window.i18n.onLoad) window.i18n.onLoad(load);
  window.addEventListener('oss-lang-change', load);
  return { load, apply, reset, addToFusion };
})();
