/**
 * ====================================================================
 * TALLER LIVE — CONFIGURACIÓN CENTRALIZADA DE OVERLAYS
 * ====================================================================
 * Modifica los valores de este archivo para personalizar todo tu stream.
 * No necesitas editar el código HTML ni CSS de las escenas.
 *
 * NOTA: Funciona cargando archivos locales en OBS sin necesidad de servidor
 * ni conexión a Internet.
 */

window.TALLER_CONFIG = {
  // ------------------------------------------------------------------
  // 1. IDENTIDAD DEL CANAL
  // ------------------------------------------------------------------
  channel: {
    // Nombre que se mostrará en las cabeceras y pantallas
    name: "ANDORINA", // Puedes cambiarlo a tu nombre o nick preferido
    
    // Lema o subtítulo oficial
    tagline: "JUGAR · CREAR · TRASTEAR",

    // Mostrar u ocultar la marca en las escenas
    visible: true,

    // Mostrar indicador parpadeante de "EN DIRECTO"
    showLiveIndicator: true,
    liveText: "EN DIRECTO",

    // Redes sociales (permanecen ocultas por defecto hasta que se configuren)
    // Pon visible: true y rellena el usuario cuando quieras mostrarlas.
    socials: {
      visible: false,
      twitch: "andorina",
      youtube: "andorina",
      twitter: "andorina",
      instagram: "andorina",
      github: "andorina"
    }
  },

  // ------------------------------------------------------------------
  // 2. PROYECTOS Y FASES (Modo MAKER y PRINT)
  // ------------------------------------------------------------------
  maker: {
    projectName: "NAS CON RASPBERRY PI",
    currentPhase: "02 MONTAJE",
    detail: "Armbian OS · PCB v1.2 · Caja a medida",
    phases: [
      "01 PLAN",
      "02 MONTAJE",
      "03 SOFTWARE",
      "04 PRUEBAS"
    ],
    // Muestra u oculta la cámara/captura auxiliar pequeña (x: 1432, y: 389)
    showAuxView: true
  },

  print: {
    projectName: "PEGATINAS PERSONALIZADAS",
    material: "Vinilo Holográfico Adhesivo",
    currentPhase: "CORTE DE VINILO",
    phases: [
      "01 DISEÑO",
      "02 CORTE",
      "03 PELADO",
      "04 APLICACIÓN"
    ],
    // Muestra u oculta la cámara de detalle/máquina auxiliar
    showAuxView: true
  },

  // ------------------------------------------------------------------
  // 3. ESCENA DE CHARLA (CHILL)
  // ------------------------------------------------------------------
  chill: {
    subtitle: "CHARLA / DUDAS / IDEAS / COMUNIDAD",
    // Muestra el marco para el chat lateral de Twitch.
    // Si se pone en false, la cámara se centra y se adapta elegantemente.
    showChatPanel: true,
    chatTitle: "CHAT DEL TALLER"
  },

  // ------------------------------------------------------------------
  // 4. PANTALLAS COMPLETAS (Starting Soon, BRB, Ending)
  // ------------------------------------------------------------------
  startingSoon: {
    title: "ENSEGUIDA",
    highlight: "ESTAMOS EN DIRECTO",
    subtitle: "PREPARANDO EL TALLER...",
    // Cuenta atrás opcional en minutos. Pon 0 para modo barra decorativa sin reloj.
    countdownMinutes: 5,
    showModesOverview: true
  },

  beRightBack: {
    title: "AHORA VUELVO",
    subtitle: "UN MOMENTO...",
    // Frases que rotan suavemente en pantalla
    statusPhrases: [
      "TOMANDO UN CAFÉ...",
      "ORDENANDO EL TALLER...",
      "PROBANDO COSAS...",
      "VOLVEMOS ENSEGUIDA"
    ],
    phraseIntervalSeconds: 6
  },

  ending: {
    title: "GRACIAS POR PASARTE",
    subtitle: "NOS VEMOS EN EL PRÓXIMO DIRECTO",
    farewellMessage: "¡Gracias por acompañar el proceso de cacharreo y creación!"
  },

  // ------------------------------------------------------------------
  // 5. ANIMACIONES Y RENDIMIENTO
  // ------------------------------------------------------------------
  performance: {
    // Activa o desactiva animaciones decorativas suaves
    enableAnimations: true
  },

  // ------------------------------------------------------------------
  // 6. COLORES PRINCIPALES (Opcional, respeta las variables CSS por defecto)
  // ------------------------------------------------------------------
  theme: {
    bgDark: "#191D21",
    textLight: "#F2EEE5",
    accentCyan: "#57D6C4",   // Turquesa electrónico
    accentOrange: "#FF783F", // Naranja taller
    panelBg: "#2E363B",
    textDim: "#8B969C"
  }
};
