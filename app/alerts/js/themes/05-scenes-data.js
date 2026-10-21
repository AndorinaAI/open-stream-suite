
const OSS_SCENES = [
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
    desc: 'Escena principal con cámara frontal o aérea, barra inferior con fases del proyecto y ventana auxiliar.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/maker/desk/index.html'
  },
  {
    key: 'maker-pc',
    packId: 'Maker_Theme_Pack',
    category: 'maker',
    name: 'Overlay: Pantalla Compartida (PC + Webcam)',
    icon: '💻',
    path: '/streamthemes/Maker_Theme_Pack/overlays/maker/pc/index.html',
    badge: 'PANTALLA COMPARTIDA · PC',
    desc: 'Escena de pantalla compartida con barra inferior de fases activas y ventana para webcam/cámara.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/maker/pc/index.html'
  },
  {
    key: 'print-machine',
    packId: 'Maker_Theme_Pack',
    category: 'print',
    name: 'Overlay: Cámara Secundaria (Proceso / Acción)',
    icon: '🖨️',
    path: '/streamthemes/Maker_Theme_Pack/overlays/print/machine/index.html',
    badge: 'CÁMARA SECUNDARIA · PROCESO',
    desc: 'Cámara directa sobre el proceso o acción en curso, con indicador de estado y fases.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/print/machine/index.html'
  },
  {
    key: 'print-design',
    packId: 'Maker_Theme_Pack',
    category: 'print',
    name: 'Overlay: Pantalla Diseño / CAD (Full Screen)',
    icon: '📐',
    path: '/streamthemes/Maker_Theme_Pack/overlays/print/design/index.html',
    badge: 'PANTALLA COMPLETA · DISEÑO',
    desc: 'Pantalla completa para diseño, programación o cualquier app a pantalla completa con cámara secundaria.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/print/design/index.html'
  },
  {
    key: 'game',
    packId: 'Maker_Theme_Pack',
    category: 'stream',
    name: 'Overlay: Gameplay (Juego + Cámara)',
    icon: '🎮',
    path: '/streamthemes/Maker_Theme_Pack/overlays/game/index.html',
    badge: 'GAMEPLAY + WEBCAM',
    desc: 'Capa limpia para videojuegos. Marco de webcam en esquina con insignia técnica y soporte de alertas.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/game/index.html'
  },
  {
    key: 'chill',
    packId: 'Maker_Theme_Pack',
    category: 'stream',
    name: 'Overlay: Charla y Chat (Just Chatting)',
    icon: '💬',
    path: '/streamthemes/Maker_Theme_Pack/overlays/chill/index.html',
    badge: 'JUST CHATTING',
    desc: 'Cámara amplia con marco para el chat de Twitch en OBS y cinta inferior con el tema de conversación.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/chill/index.html'
  },
  {
    key: 'startingSoon',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Inicio de Stream (Starting Soon)',
    icon: '⏳',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/starting-soon/index.html',
    badge: 'INICIO DE EMISIÓN',
    desc: 'Pantalla completa de bienvenida con cuenta atrás regresiva, titular con acento neón y redes.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'beRightBack',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa Técnica (Be Right Back)',
    icon: '☕',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/be-right-back/index.html',
    badge: 'PAUSA TÉCNICA',
    desc: 'Pausa con escáner técnico animado y rotación automática de frases personalizables.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/screens/be-right-back/index.html'
  },
  {
    key: 'ending',
    packId: 'Maker_Theme_Pack',
    category: 'screens',
    name: 'Pantalla: Despedida (Ending)',
    icon: '🎬',
    path: '/streamthemes/Maker_Theme_Pack/overlays/screens/ending/index.html',
    badge: 'FIN DE TRANSMISIÓN',
    desc: 'Cierre de directo con tarjeta de agradecimiento a suscriptores, etiqueta de despedida y redes.',
    obsSource: 'http://localhost:8080/streamthemes/Maker_Theme_Pack/overlays/screens/ending/index.html'
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
    desc: 'Cámara amplia optimizada para interacción con el chat de Twitch, cinta informativa y widgets.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/just_chatting/index.html'
  },
  {
    key: 'oss_desktop',
    packId: 'Open_stream_Pack',
    category: 'screen',
    name: 'Overlay: Pantalla Compartida (Escritorio + PiP)',
    icon: '🖥️',
    path: '/streamthemes/Open_stream_Pack/overlays/desktop_share/index.html',
    badge: 'ESCRITORIO + WEBCAM',
    desc: 'Captura de monitor ultra nítida con webcam en ventana Picture-in-Picture personalizable.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/desktop_share/index.html'
  },
  {
    key: 'oss_podcast',
    packId: 'Open_stream_Pack',
    category: 'chat',
    name: 'Overlay: Podcast & Entrevista (Dual Cam)',
    icon: '🎙️',
    path: '/streamthemes/Open_stream_Pack/overlays/podcast_talk/index.html',
    badge: 'PODCAST & ENTREVISTA',
    desc: 'Dos marcos equilibrados de cámara para entrevistas, co-hosts o debate con rótulos.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/podcast_talk/index.html'
  },
  {
    key: 'oss_starting',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Inicio de Stream (Starting Soon)',
    icon: '⏳',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/index.html',
    badge: 'INICIO DE EMISIÓN',
    desc: 'Pantalla regresiva de espera previa con bienvenida neón y aviso de directo próximo.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'oss_brb',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa Técnica (Be Right Back)',
    icon: '⏸️',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/be-right-back/index.html',
    badge: 'PAUSA TÉCNICA',
    desc: 'Pausa intermedia con radar animado y mensajes dinámicos de regreso en breves minutos.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/screens/be-right-back/index.html'
  },
  {
    key: 'oss_ending',
    packId: 'Open_stream_Pack',
    category: 'screens',
    name: 'Pantalla: Despedida y Créditos (Ending)',
    icon: '🎬',
    path: '/streamthemes/Open_stream_Pack/overlays/screens/ending/index.html',
    badge: 'FIN DE TRANSMISIÓN',
    desc: 'Pantalla de cierre de emisión con agradecimientos y lista de próximas citas.',
    obsSource: 'http://localhost:8080/streamthemes/Open_stream_Pack/overlays/screens/ending/index.html'
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
    desc: 'Marco biselado para webcam con HUD angular militar, indicadores de alertas y estado en vivo.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/gameplay_hud/index.html'
  },
  {
    key: 'gamer_speedrun',
    packId: 'Gamer_Pro_Pack',
    category: 'game',
    name: 'Overlay: Speedrun & Splits HUD',
    icon: '⏱️',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/speedrun_split/index.html',
    badge: 'SPEEDRUN & SPLITS',
    desc: 'Panel lateral con cronómetro de segmentos, comparación de marcas (PB/WR) y webcam.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/speedrun_split/index.html'
  },
  {
    key: 'gamer_victory',
    packId: 'Gamer_Pro_Pack',
    category: 'event',
    name: 'Overlay: Victoria & Clutch Showcase',
    icon: '🏆',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/victory_clutch/index.html',
    badge: 'VICTORIA & CLUTCH',
    desc: 'Escena central para celebrar victorias épicas con animaciones doradas y laureles.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/victory_clutch/index.html'
  },
  {
    key: 'gamer_starting',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: Calentamiento & Start (Esports)',
    icon: '🚀',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/starting-soon/index.html',
    badge: 'CALENTAMIENTO · START',
    desc: 'Cuenta atrás táctica militar con radar y aviso de partida inminente.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'gamer_brb',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: Intermisión Táctica (Be Right Back)',
    icon: '🛑',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/be-right-back/index.html',
    badge: 'INTERMISIÓN TÁCTICA',
    desc: 'Pausa táctica entre partidas o mapas con radar de combate y estado de sesión.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/be-right-back/index.html'
  },
  {
    key: 'gamer_ending',
    packId: 'Gamer_Pro_Pack',
    category: 'screens',
    name: 'Pantalla: GG & Fin de Partida (Ending)',
    icon: '👾',
    path: '/streamthemes/Gamer_Pro_Pack/overlays/screens/ending/index.html',
    badge: 'GG · FIN DE PARTIDA',
    desc: 'Despedida gamer con estadísticas finales del día, GG y agradecimientos.',
    obsSource: 'http://localhost:8080/streamthemes/Gamer_Pro_Pack/overlays/screens/ending/index.html'
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
    desc: 'Temporizador Pomodoro integrado con ciclo activo de concentración y descanso con música lo-fi.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/study_pomodoro/index.html'
  },
  {
    key: 'cozy_art',
    packId: 'Cozy_LoFi_Pack',
    category: 'creative',
    name: 'Overlay: Arte & Lienzo Dual Cam',
    icon: '🎨',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/art_dual_cam/index.html',
    badge: 'ARTE & LIENZO DUAL',
    desc: 'Cámara cenital principal para ilustrar, pintar o escribir con webcam auxiliar en tonos pastel.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/art_dual_cam/index.html'
  },
  {
    key: 'cozy_cafe',
    packId: 'Cozy_LoFi_Pack',
    category: 'creative',
    name: 'Overlay: Café & Charla Chill',
    icon: '☕',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html',
    badge: 'CAFÉ & CHARLA CHILL',
    desc: 'Escena cálida y relajada para conversar con chat integrado y ambientación tranquila.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/cafe_chat/index.html'
  },
  {
    key: 'cozy_starting',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Bienvenida Acogedora (Starting Soon)',
    icon: '🌅',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/starting-soon/index.html',
    badge: 'BIENVENIDA ACOGEDORA',
    desc: 'Pantalla de inicio suave con cuenta atrás calmada y animación de vapor de café.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/starting-soon/index.html'
  },
  {
    key: 'cozy_brb',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Pausa de Café (Coffee Break)',
    icon: '🫖',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/coffee-break/index.html',
    badge: 'PAUSA DE CAFÉ',
    desc: 'Pausa acogedora para recargar la taza de café o té y estirar las piernas.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/coffee-break/index.html'
  },
  {
    key: 'cozy_ending',
    packId: 'Cozy_LoFi_Pack',
    category: 'screens',
    name: 'Pantalla: Hasta Pronto & Buenas Noches (Ending)',
    icon: '🌙',
    path: '/streamthemes/Cozy_LoFi_Pack/overlays/screens/ending/index.html',
    badge: 'HASTA PRONTO · RELAX',
    desc: 'Despedida calmada con luces tenues, música tranquila y mensaje de buenas noches.',
    obsSource: 'http://localhost:8080/streamthemes/Cozy_LoFi_Pack/overlays/screens/ending/index.html'
  }
];
