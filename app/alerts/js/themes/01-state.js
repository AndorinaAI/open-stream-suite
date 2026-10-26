// ====================================================================
// GESTOR MODULAR DE TEMAS, PACKS EN CARPETAS Y EDITOR DE CÓDIGO/AJUSTES
// ====================================================================
//
// NOTA DE INTEGRACIÓN (T4) — claves de escena y sincronización de estado:
//   * Las claves canónicas de escena viven en 05-scenes-data.js (OSS_SCENES) y
//     son las ÚNICAS que se persisten en themes_state.json / fusions.json.
//   * `normalizeSceneKey()` (definido en 05-scenes-data.js) acepta también las
//     variantes heredadas (camelCase, kebab-case, snake_case y rutas de carpeta
//     tipo `maker/desk` o `screens/starting-soon`) y devuelve siempre la clave
//     canónica. Todo el panel debe normalizar antes de leer/escribir estado.
//   * El estado global se publica en `window` de forma explícita: al usar `let`
//     los valores NO son propiedades de window y otros módulos que los leen vía
//     `window.cachedThemePacks` recibían `undefined` (bug real de integración).

// Helpers compartidos por los módulos de temas. Los nombres de pack/tema y
// sus colores vienen de disco o de la API y nunca deben interpretarse como
// HTML/CSS ejecutable.
function themeEscapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function themeJsArg(value) {
  return themeEscapeHtml(JSON.stringify(String(value == null ? '' : value)));
}

function themeColor(value, fallback) {
  const candidate = String(value == null ? '' : value).trim();
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate : fallback;
}

var cachedThemePacks = window.cachedThemePacks || [];
var currentOpenPackId = null;
var currentEditingTheme = null;
var currentEditingPackId = null;
var currentActiveThemeId = 'maker';
var currentActivePackId = 'Maker_Theme_Pack';
window.selectedFusionScenes = window.selectedFusionScenes || new Set();

// Temas originales de fábrica por escena. Solo claves canónicas de escena
// (las 27 de OSS_SCENES). Las secciones de textos ('maker', 'print', …) NO son
// escenas y no deben entrar aquí: contaminaban themes_state.json.
const DEFAULT_OVERLAY_THEMES = Object.assign(
  {},
  (window.OSS_CONFIG && (window.OSS_CONFIG.defaultOverlayThemes || window.OSS_CONFIG.overlayThemes)) || {}
);

var cachedOverlayThemes = Object.assign({}, DEFAULT_OVERLAY_THEMES);

/**
 * Normaliza un mapa {claveEscena: valor} al espacio de claves canónicas,
 * descartando claves desconocidas (estado huérfano tipo "starting": "ambient").
 * Nunca lanza: si el normalizador no está disponible devuelve el mapa tal cual.
 */
function sanitizeOverlayMap(map, options) {
  const opts = options || {};
  const out = {};
  const dropped = [];
  const renamed = {};
  if (!map || typeof map !== 'object') return {map: out, dropped, renamed};
  const canNormalize = (typeof window.normalizeSceneKey === 'function');
  Object.keys(map).forEach(rawKey => {
    if (rawKey === null || rawKey === undefined || rawKey === '') { dropped.push(rawKey); return; }
    const canonical = canNormalize ? window.normalizeSceneKey(rawKey) : rawKey;
    if (!canonical) { dropped.push(rawKey); return; }
    if (canonical !== rawKey) renamed[rawKey] = canonical;
    out[canonical] = map[rawKey];
  });
  if (dropped.length && console && console.warn && !opts.silent) {
    console.warn('[OSS] Claves de escena desconocidas descartadas del estado:', dropped);
  }
  return {map: out, dropped, renamed};
}

/** Sanea `cachedOverlayThemes` / `window.cachedOverlayShapes` en su sitio. */
function sanitizeOverlayState(options) {
  const t = sanitizeOverlayMap(cachedOverlayThemes, options);
  cachedOverlayThemes = Object.assign({}, t.map);
  window.cachedOverlayThemes = cachedOverlayThemes;
  const s = sanitizeOverlayMap(window.cachedOverlayShapes || {}, options);
  window.cachedOverlayShapes = s.map;
  return {droppedThemes: t.dropped, renamedThemes: t.renamed, droppedShapes: s.dropped, renamedShapes: s.renamed};
}

/** Devuelve el tema asignado a una escena normalizando la clave. */
function getAssignedThemeForScene(sceneKey) {
  const canonical = (typeof window.normalizeSceneKey === 'function') ? window.normalizeSceneKey(sceneKey) : sceneKey;
  if (canonical && cachedOverlayThemes && cachedOverlayThemes[canonical]) return cachedOverlayThemes[canonical];
  return currentActiveThemeId || 'maker';
}

/** Devuelve la forma física asignada a una escena normalizando la clave. */
function getAssignedShapeForScene(sceneKey) {
  const canonical = (typeof window.normalizeSceneKey === 'function') ? window.normalizeSceneKey(sceneKey) : sceneKey;
  const shapes = window.cachedOverlayShapes || {};
  return (canonical && shapes[canonical]) || 'auto';
}

/** Claves canónicas de escena presentes en el estado (sin huérfanas). */
function getCanonicalSceneKeys() {
  const scenes = window.OSS_SCENES || [];
  return scenes.map(s => s.key);
}

// Publicación explícita en window (imprescindible para los módulos que leen
// window.cachedThemePacks / window.cachedOverlayThemes / window.DEFAULT_OVERLAY_THEMES)
window.cachedThemePacks = cachedThemePacks;
window.cachedOverlayThemes = cachedOverlayThemes;
window.DEFAULT_OVERLAY_THEMES = DEFAULT_OVERLAY_THEMES;
window.sanitizeOverlayState = sanitizeOverlayState;
window.sanitizeOverlayMap = sanitizeOverlayMap;
window.getAssignedThemeForScene = getAssignedThemeForScene;
window.getAssignedShapeForScene = getAssignedShapeForScene;
window.getCanonicalSceneKeys = getCanonicalSceneKeys;
