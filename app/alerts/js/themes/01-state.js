// ====================================================================
// GESTOR MODULAR DE TEMAS, PACKS EN CARPETAS Y EDITOR DE CÓDIGO/AJUSTES
// ====================================================================

let cachedThemePacks = [];
let currentOpenPackId = null;
let currentEditingTheme = null;
let currentEditingPackId = null;
let currentActiveThemeId = 'maker';
let currentActivePackId = 'Maker_Theme_Pack';
const DEFAULT_OVERLAY_THEMES = {
  // Maker_Theme_Pack
  'game': 'cyberpunk',
  'maker': 'maker',
  'maker-desk': 'maker',
  'maker-pc': 'terminal',
  'print': 'print',
  'print-machine': 'print',
  'print-design': 'print',
  'chill': 'chill',
  'startingSoon': 'synthwave',
  'beRightBack': 'synthwave',
  'ending': 'synthwave',

  // Open_stream_Pack
  'oss_chatting': 'neon_streamer',
  'oss_desktop': 'clean_minimal',
  'oss_podcast': 'sunset_glow',
  'oss_starting': 'crimson_pulse',
  'oss_brb': 'emerald_matrix',
  'oss_ending': 'neon_streamer',

  // Gamer_Pro_Pack
  'gamer_gameplay': 'cyber_glitch',
  'gamer_speedrun': 'toxic_rad',
  'gamer_victory': 'golden_glory',
  'gamer_starting': 'crimson_esport',
  'gamer_brb': 'stealth_mono',
  'gamer_ending': 'golden_glory',

  // Cozy_LoFi_Pack
  'cozy_pomodoro': 'latte_caramel',
  'cozy_art': 'sakura_sunset',
  'cozy_cafe': 'matcha_bamboo',
  'cozy_starting': 'lavender_dream',
  'cozy_brb': 'latte_caramel',
  'cozy_ending': 'nordic_twilight'
};
let cachedOverlayThemes = Object.assign({}, DEFAULT_OVERLAY_THEMES);
