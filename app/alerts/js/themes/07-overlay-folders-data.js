
var OVERLAY_FOLDERS = window.OVERLAY_FOLDERS || [
  {
    id: 'maker_theme_pack',
    packId: 'Maker_Theme_Pack',
    name: 'Pack Maker & Taller',
    icon: '🛠️',
    badge: '9 OVERLAYS · TALLER & MAKER',
    path: 'streamthemes/Maker_Theme_Pack/overlays/*',
    desc: 'Carpeta insignia para creadores, talleres, electrónica, programación CAD e impresión 3D con 9 pantallas listas.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (9)', cat: 'all' },
      { id: 'maker', label: '🛠️ Mesa & PC (2)', cat: 'maker' },
      { id: 'print', label: '📷 Cámara Secundaria (2)', cat: 'print' },
      { id: 'stream', label: '🎮 Directo & Charla (2)', cat: 'stream' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Escena Principal (Cámara)', icon: '🎥', desc: 'Cámara principal con barra de fases y ventana auxiliar' },
      { name: 'PC & Código (Terminal)', icon: '💻', desc: 'Pantalla completa de programación o CAD y cámara de apoyo' },
      { name: 'Cámara Secundaria (Proceso)', icon: '📷', desc: 'Cámara directa sobre el proceso en curso con indicador de estado' },
      { name: 'Diseño CAD & Slicer', icon: '📐', desc: 'Modelado 3D (Fusion, FreeCAD) o laminado slicer con webcam' },
      { name: 'Gameplay & Cámara', icon: '🎮', desc: 'Capa limpia para juegos con cámara técnica y alertas' },
      { name: 'Charla & Chat (Just Chatting)', icon: '💬', desc: 'Cámara amplia, caja de Twitch chat integrada y tema' },
      { name: 'Pantallas de Emisión (3)', icon: '📺', desc: 'Starting Soon regresivo, Pausa BRB y Despedida Ending' }
    ],
    keys: ['maker-desk', 'maker-pc', 'print-machine', 'print-design', 'game', 'chill', 'startingSoon', 'beRightBack', 'ending']
  },
  {
    id: 'open_stream_pack',
    packId: 'Open_stream_Pack',
    name: 'Pack Open Stream (General)',
    icon: '⚡',
    badge: '6 OVERLAYS · STREAMING PRO',
    path: 'streamthemes/Open_stream_Pack/overlays/*',
    desc: 'Pack moderno todo-en-uno para streamers generales, variedad, podcasts, charlas y pantallas de emisión completas.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (6)', cat: 'all' },
      { id: 'chat', label: '💬 Charla & Podcast (2)', cat: 'chat' },
      { id: 'screen', label: '🖥️ Pantalla Compartida (1)', cat: 'screen' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Just Chatting & Talk', icon: '💬', desc: 'Cámara amplia con caja de chat interactivo Twitch y widgets' },
      { name: 'Pantalla Compartida', icon: '🖥️', desc: 'Captura de monitor con PiP de webcam en marco flotante' },
      { name: 'Podcast & Entrevista', icon: '🎙️', desc: 'Dos cámaras equilibradas para entrevistas y co-hosts con rótulos' },
      { name: 'Inicio de Emisión', icon: '⏳', desc: 'Cuenta atrás regresiva de bienvenida con acento neón' },
      { name: 'Pausa Técnica', icon: '⏸️', desc: 'Pausa intermedia con radar animado y mensajes dinámicos' },
      { name: 'Fin de Stream', icon: '🎬', desc: 'Pantalla de cierre de directo con agradecimientos y redes' }
    ],
    keys: ['oss_chatting', 'oss_desktop', 'oss_podcast', 'oss_starting', 'oss_brb', 'oss_ending']
  },
  {
    id: 'gamer_pro_pack',
    packId: 'Gamer_Pro_Pack',
    name: 'Pack Gamer Pro & Esports',
    icon: '🎮',
    badge: '6 OVERLAYS · ESPORTS & HUD',
    path: 'streamthemes/Gamer_Pro_Pack/overlays/*',
    desc: 'Estética HUD táctica militar, bordes angulares biselados y alta adrenalina para gaming competitivo y speedruns.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (6)', cat: 'all' },
      { id: 'game', label: '🎯 Gameplay & HUD (2)', cat: 'game' },
      { id: 'event', label: '🏆 Victoria & Clutch (1)', cat: 'event' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Gameplay HUD Táctico', icon: '🎯', desc: 'Marco biselado para webcam con HUD angular militar y alertas' },
      { name: 'Speedrun & Splits', icon: '⏱️', desc: 'Panel lateral de splits, cronómetro de segmentos y webcam' },
      { name: 'Victoria & Clutch', icon: '🏆', desc: 'Cámara central épica con laureles de victoria y animaciones' },
      { name: 'Calentamiento & Start', icon: '🚀', desc: 'Cuenta regresiva táctica de preparación de partida' },
      { name: 'Intermisión Táctica', icon: '🛑', desc: 'Pausa de torneo/partida con radar y estado del equipo' },
      { name: 'GG & Fin de Partida', icon: '👾', desc: 'Despedida con resumen de estadísticas y créditos' }
    ],
    keys: ['gamer_gameplay', 'gamer_speedrun', 'gamer_victory', 'gamer_starting', 'gamer_brb', 'gamer_ending']
  },
  {
    id: 'cozy_lofi_pack',
    packId: 'Cozy_LoFi_Pack',
    name: 'Pack Cozy Lo-Fi & Arte',
    icon: '☕',
    badge: '6 OVERLAYS · CHILL & RELAX',
    path: 'streamthemes/Cozy_LoFi_Pack/overlays/*',
    desc: 'Bordes redondeados, tonos pastel y atmósfera relajante para estudio, dibujo digital, café y música lo-fi.',
    subfilters: [
      { id: 'all', label: '📁 Todos los Overlays (6)', cat: 'all' },
      { id: 'study', label: '📖 Pomodoro & Estudio (1)', cat: 'study' },
      { id: 'creative', label: '🎨 Arte & Charla (2)', cat: 'creative' },
      { id: 'screens', label: '📺 Pantallas de Emisión (3)', cat: 'screens' }
    ],
    activities: [
      { name: 'Study & Pomodoro (25:00)', icon: '📖', desc: 'Temporizador Pomodoro integrado con ciclo de concentración y descanso' },
      { name: 'Arte & Lienzo Dual Cam', icon: '🎨', desc: 'Cámara cenital sobre el lienzo/tableta y webcam de apoyo' },
      { name: 'Café & Charla Chill', icon: '☕', desc: 'Escena acogedora para conversar con música de fondo suave' },
      { name: 'Bienvenida Acogedora', icon: '🌅', desc: 'Pantalla de inicio con cuenta atrás suave y vapor de café' },
      { name: 'Pausa de Café', icon: '🫖', desc: 'Pausa para estirar y recargar la taza de té o café' },
      { name: 'Hasta Pronto & Buenas Noches', icon: '🌙', desc: 'Despedida con luces tenues y música relajante' }
    ],
    keys: ['cozy_pomodoro', 'cozy_art', 'cozy_cafe', 'cozy_starting', 'cozy_brb', 'cozy_ending']
  }
];

window.OVERLAY_FOLDERS = OVERLAY_FOLDERS;
var currentOpenOverlayFolderId = window.currentOpenOverlayFolderId || null;
var currentFolderSubFilter = window.currentFolderSubFilter || 'all';
