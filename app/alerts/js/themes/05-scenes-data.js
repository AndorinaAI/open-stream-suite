
var OSS_SCENES = window.OSS_SCENES || [
  // ==========================================
  // PACK 1: MAKER & TALLER (Maker_Theme_Pack)
  // ==========================================
  {
    key: 'maker-desk',
    packId: 'Maker_Theme_Pack',
    category: 'maker',
    name: 'Overlay: Escena Principal (Cámara + Webcam)',
    icon: '🛠️',
    path: '/streamthemes/Maker_Theme_Pack/overlays/maker/desk/index.html',
    badge: 'ESCENA PRINCIPAL · CÁMARA',
    desc: 'Escena principal con cámara frontal o aérea, barra inferior con fases del proyecto y ventana auxiliar.'
  },
  {
    key: 'maker-pc',
    packId: 'Maker_Theme_Pack',
    category: 'maker',
    name: 'Overlay: Pantalla Compartida (PC + Webcam)',
    icon: '💻',
    path: '/streamthemes/Maker_Theme_Pack/overlays/maker/pc/index.html',
    badge: 'PANTALLA COMPARTIDA · PC',
    desc: 'Escena de pantalla compartida con barra inferior de fases activas y ventana para webcam/cámara.'
  },
  {
    key: 'print-machine',
    packId: 'Maker_Theme_Pack',
    category: 'print',
    name: 'Overlay: Cámara Secundaria (Proceso / Acción)',
    icon: '🖨️',
    path: '/streamthemes/Maker_Theme_Pack/overlays/print/machine/index.html',
    badge: 'CÁMARA SECUNDARIA · PROCESO',
    desc: 'Cámara directa sobre el proceso o acción en curso, con indicador de estado y fases.'
  },
  {
    key: 'print-design',
    packId: 'Maker_Theme_Pack',
    category: 'print',
    name: 'Overlay: Pantalla Diseño / CAD (Full Screen)',
    icon: '📐',
    path: '/streamthemes/Maker_Theme_Pack/overlays/print/design/index.html',
    badge: 'PANTALLA COMPLETA · DISEÑO',
    desc: 'Pantalla completa para diseño, programación o cualquier app a pantalla completa con cámara secundaria.'
  },
  {
    key: 'game',
    packId: 'Maker_Theme_Pack',
    category: 'stream',
    name: 'Overlay: Gameplay (Juego + Cámara)',
    icon: '🎮',
    path: '/streamthemes/Maker_Theme_Pack/overlays/game/index.html',
    badge: 'GAMEPLAY + WEBCAM',
    desc: 'Capa limpia para videojuegos. Marco de webcam en esquina con insignia técnica y soporte de alertas.'
  },
  {
    key: 'chill',
    packId: 'Maker_Theme_Pack',
    category: 'stream',
    name: 'Overlay: Charla y Chat (Just Chatting)',
    icon: '💬',
    path: '/streamthemes/Maker_Theme_Pack/overlays/chill/index.html',
    badge: 'JUST CHATTING',
    desc: 'Cámara amplia con marco para el chat de Twitch en OBS y cinta inferior con el tema de conversación.'
  },
  {
    key: 'startingSoon',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Inicio de Stream (Starting Soon)',
    icon: '⏳',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/starting-soon/index.html',
    badge: 'INICIO DE EMISIÓN',
    desc: 'Pantalla completa de bienvenida con cuenta atrás regresiva, titular con acento neón y redes.'
  },
  {
    key: 'beRightBack',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa Técnica (Be Right Back)',
    icon: '☕',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/be-right-back/index.html',
    badge: 'PAUSA TÉCNICA',
    desc: 'Pausa con escáner técnico animado y rotación automática de frases personalizables.'
  },
  {
    key: 'ending',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Despedida (Ending)',
    icon: '🎬',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/ending/index.html',
    badge: 'FIN DE TRANSMISIÓN',
    desc: 'Cierre de directo con tarjeta de agradecimiento a suscriptores, etiqueta de despedida y redes.'
  },

  // ==========================================
  // PACK 2: OPEN STREAM SUITE (Open_stream_Pack)
  // ==========================================
  {
    key: 'oss_chatting',
    packId: 'Open_stream_Pack',
    category: 'chat',
    name: 'Overlay: Just Chatting & Talk',
    icon: '💬',
    path: '/streamthemes/Open_stream_Pack/overlays/just_chatting/index.html',
    badge: 'JUST CHATTING PRO',
    desc: 'Cámara amplia optimizada para interacción con el chat de Twitch, cinta informativa y widgets.'
  },
  {
    key: 'oss_desktop',
    packId: 'Open_stream_Pack',
    category: 'screen',
    name: 'Overlay: Pantalla Compartida (Escritorio + PiP)',
    icon: '🖥️',
    path: '/streamthemes/Open_stream_Pack/overlays/desktop_share/index.html',
    badge: 'ESCRITORIO + WEBCAM',
    desc: 'Captura de monitor ultra nítida con webcam en ventana Picture-in-Picture personalizable.'
  },
  {
    key: 'oss_podcast',
    packId: 'Open_stream_Pack',
    category: 'chat',
    name: 'Overlay: Podcast & Entrevista (Dual Cam)',
    icon: '🎙️',
    path: '/streamthemes/Open_stream_Pack/overlays/podcast_talk/index.html',
    badge: 'PODCAST & ENTREVISTA',
    desc: 'Dos marcos equilibrados de cámara para entrevistas, co-hosts o debate con rótulos.'
  },
  {
    key: 'oss_starting',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Inicio de Stream (Starting Soon)',
    icon: '⏳',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/index.html',
    badge: 'INICIO DE EMISIÓN',
    desc: 'Pantalla regresiva de espera previa con bienvenida neón y aviso de directo próximo.'
  },
  {
    key: 'oss_brb',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa Técnica (Be Right Back)',
    icon: '⏸️',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/be-right-back/index.html',
    badge: 'PAUSA TÉCNICA',
    desc: 'Pausa intermedia con radar animado y mensajes dinámicos de regreso en breves minutos.'
  },
  {
    key: 'oss_ending',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Despedida y Créditos (Ending)',
    icon: '🎬',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/ending/index.html',
    badge: 'FIN DE TRANSMISIÓN',
    desc: 'Pantalla de cierre de emisión con agradecimientos y lista de próximas citas.'
  },

  // ==========================================
  // PACK 3: GAMER PRO & ESPORTS (Gamer_Pro_Pack)
  // ==========================================
  {
    key: 'gamer_gameplay',
    packId: 'Gamer_Pro_Pack',
    category: 'game',
    name: 'Overlay: Gameplay HUD Táctico',
    icon: '🎯',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html',
    badge: 'GAMEPLAY HUD ESPORTS',
    desc: 'Marco biselado para webcam con HUD angular militar, indicadores de alertas y estado en vivo.'
  },
  {
    key: 'gamer_speedrun',
    packId: 'Gamer_Pro_Pack',
    category: 'game',
    name: 'Overlay: Speedrun & Splits HUD',
    icon: '⏱️',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/speedrun_split/index.html',
    badge: 'SPEEDRUN & SPLITS',
    desc: 'Panel lateral con cronómetro de segmentos, comparación de marcas (PB/WR) y webcam.'
  },
  {
    key: 'gamer_victory',
    packId: 'Gamer_Pro_Pack',
    category: 'event',
    name: 'Overlay: Victoria & Clutch Showcase',
    icon: '🏆',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/victory_clutch/index.html',
    badge: 'VICTORIA & CLUTCH',
    desc: 'Escena central para celebrar victorias épicas con animaciones doradas y laureles.'
  },
  {
    key: 'gamer_starting',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: Calentamiento & Start (Esports)',
    icon: '🚀',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/starting-soon/index.html',
    badge: 'CALENTAMIENTO · START',
    desc: 'Cuenta atrás táctica militar con radar y aviso de partida inminente.'
  },
  {
    key: 'gamer_brb',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: Intermisión Táctica (Be Right Back)',
    icon: '🛑',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/be-right-back/index.html',
    badge: 'INTERMISIÓN TÁCTICA',
    desc: 'Pausa táctica entre partidas o mapas con radar de combate y estado de sesión.'
  },
  {
    key: 'gamer_ending',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: GG & Fin de Partida (Ending)',
    icon: '👾',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/ending/index.html',
    badge: 'GG · FIN DE PARTIDA',
    desc: 'Despedida gamer con estadísticas finales del día, GG y agradecimientos.'
  },

  // ==========================================
  // PACK 4: COZY LO-FI & ARTE (Cozy_LoFi_Pack)
  // ==========================================
  {
    key: 'cozy_pomodoro',
    packId: 'Cozy_LoFi_Pack',
    category: 'study',
    name: 'Overlay: Study & Pomodoro (25:00)',
    icon: '📖',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/study_pomodoro/index.html',
    badge: 'POMODORO & ESTUDIO',
    desc: 'Temporizador Pomodoro integrado con ciclo activo de concentración y descanso con música lo-fi.'
  },
  {
    key: 'cozy_art',
    packId: 'Cozy_LoFi_Pack',
    category: 'creative',
    name: 'Overlay: Arte & Lienzo Dual Cam',
    icon: '🎨',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/art_dual_cam/index.html',
    badge: 'ARTE & LIENZO DUAL',
    desc: 'Cámara cenital principal para ilustrar, pintar o escribir con webcam auxiliar en tonos pastel.'
  },
  {
    key: 'cozy_cafe',
    packId: 'Cozy_LoFi_Pack',
    category: 'creative',
    name: 'Overlay: Café & Charla Chill',
    icon: '☕',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html',
    badge: 'CAFÉ & CHARLA CHILL',
    desc: 'Escena cálida y relajada para conversar con chat integrado y ambientación tranquila.'
  },
  {
    key: 'cozy_starting',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Bienvenida Acogedora (Starting Soon)',
    icon: '🌅',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/starting-soon/index.html',
    badge: 'BIENVENIDA ACOGEDORA',
    desc: 'Pantalla de inicio suave con cuenta atrás calmada y animación de vapor de café.'
  },
  {
    key: 'cozy_brb',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa de Café (Coffee Break)',
    icon: '🫖',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/coffee-break/index.html',
    badge: 'PAUSA DE CAFÉ',
    desc: 'Pausa acogedora para recargar la taza de café o té y estirar las piernas.'
  },
  {
    key: 'cozy_ending',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Hasta Pronto & Buenas Noches (Ending)',
    icon: '🌙',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/ending/index.html',
    badge: 'HASTA PRONTO · RELAX',
    desc: 'Despedida calmada con luces tenues, música tranquila y mensaje de buenas noches.'
  }
];
// ====================================================================
// REGISTRO CANÓNICO DE ESCENAS + NORMALIZACIÓN DE CLAVES  (T4)
// ====================================================================
// Las claves de OSS_SCENES son la ÚNICA forma canónica que se persiste en el
// estado (themes_state.json / fusions.json) y que viaja por la API. El resto de
// formas (camelCase, kebab-case, snake_case, nombre de carpeta o ruta de
// overlay) se aceptan como ALIAS y se traducen aquí, de modo que ya no importa
// qué convención use un enlace, un OBS antiguo o un documento.
(function buildSceneKeyRegistry() {
  const ALIAS_OVERRIDES = {
    // Formas heredadas de las pantallas del pack Maker
    'starting-soon': 'startingSoon',
    'starting_soon': 'startingSoon',
    'screens/starting-soon': 'startingSoon',
    'maker-starting-soon': 'startingSoon',
    'brb': 'beRightBack',
    'be-right-back': 'beRightBack',
    'be_right_back': 'beRightBack',
    'screens/be-right-back': 'beRightBack',
    'screens/ending': 'ending',
    // Nombres de carpeta -> clave canónica (Maker anida escenas)
    'desk': 'maker-desk',
    'maker/desk': 'maker-desk',
    'maker_desk': 'maker-desk',
    'pc': 'maker-pc',
    'maker/pc': 'maker-pc',
    'maker_pc': 'maker-pc',
    'machine': 'print-machine',
    'print/machine': 'print-machine',
    'print_machine': 'print-machine',
    'design': 'print-design',
    'print/design': 'print-design',
    'print_design': 'print-design',
    // Carpetas propias de cada pack
    'just_chatting': 'oss_chatting',
    'just-chatting': 'oss_chatting',
    'desktop_share': 'oss_desktop',
    'desktop-share': 'oss_desktop',
    'podcast_talk': 'oss_podcast',
    'podcast-talk': 'oss_podcast',
    'gameplay_hud': 'gamer_gameplay',
    'speedrun_split': 'gamer_speedrun',
    'victory_clutch': 'gamer_victory',
    'study_pomodoro': 'cozy_pomodoro',
    'art_dual_cam': 'cozy_art',
    'cafe_chat': 'cozy_cafe',
    'coffee-break': 'cozy_brb',
    'coffee_break': 'cozy_brb'
  };

  const aliases = Object.assign({}, ALIAS_OVERRIDES);
  const byKey = {};

  OSS_SCENES.forEach(scene => {
    const key = scene.key;
    byKey[key] = scene;

    // 1. La propia clave canónica
    aliases[key] = key;
    // 2. Variantes de separador de la propia clave (snake <-> kebab)
    aliases[key.replace(/_/g, '-')] = key;
    aliases[key.replace(/-/g, '_')] = key;
    // 3. Ruta relativa completa sin extensión: 'maker/desk', 'screens/ending'
    const rel = scene.path.match(/\/overlays\/(.+)\/index\.html$/);
    if (rel && rel[1]) {
      if (!(rel[1] in aliases)) aliases[rel[1]] = key;
    }
    // 4. Último segmento de carpeta: 'desk', 'just_chatting', 'ending'
    const folder = (scene.path.split('/').filter(Boolean).slice(-2, -1)[0] || '').replace('.html', '');
    if (folder && !(folder in aliases)) aliases[folder] = key;
  });

  // obsSource calculado con el host real (antes: 27 URLs a http://localhost:8080
  // fijas, que apuntaban a un puerto/host erróneo al servir en otro sitio).
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? window.location.origin
    : '';
  OSS_SCENES.forEach(scene => {
    scene.obsSource = origin ? origin + scene.path : scene.path;
    scene.aliases = Object.keys(aliases).filter(a => aliases[a] === scene.key);
  });

  /** Traduce cualquier forma de clave de escena a la clave canónica (o null). */
  function normalizeSceneKey(rawKey) {
    if (!rawKey || typeof rawKey !== 'string') return null;
    const k = rawKey.trim().replace(/^\/+|\/+$/g, '');
    if (!k) return null;
    if (aliases[k]) return aliases[k];
    const lower = k.toLowerCase();
    if (aliases[lower]) return aliases[lower];
    // Sin distinguir separadores
    const squashed = lower.replace(/[-_]/g, '');
    const hit = Object.keys(aliases).find(a => a.toLowerCase().replace(/[-_]/g, '') === squashed);
    return hit ? aliases[hit] : null;
  }

  function getSceneByKey(rawKey) {
    const canonical = normalizeSceneKey(rawKey);
    return canonical ? byKey[canonical] : null;
  }

  window.OSS_SCENES = OSS_SCENES;
  window.OSS_SCENE_BY_KEY = byKey;
  window.OSS_SCENE_ALIASES = aliases;
  window.OSS_SCENE_KEYS = OSS_SCENES.map(s => s.key);
  window.normalizeSceneKey = normalizeSceneKey;
  window.getSceneByKey = getSceneByKey;
})();

