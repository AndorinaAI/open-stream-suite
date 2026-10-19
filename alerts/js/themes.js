// ====================================================================
// GESTOR DE TEMAS CROMÁTICOS, ESTILOS Y OVERLAYS
// ====================================================================

const THEMES = {
  presets: {
    maker: {
      id: 'maker',
      name: 'Maker Electrónico',
      badge: '01',
      accentCyan: '#57D6C4',
      accentOrange: '#FF783F',
      bgDark: '#191D21',
      desc: 'Turquesa electrónico sobre grafito oscuro. El tono insignia del banco de pruebas.'
    },
    print: {
      id: 'print',
      name: 'Print & Vinilo',
      badge: '02',
      accentCyan: '#FF783F',
      accentOrange: '#FF9B42',
      bgDark: '#1E1B18',
      desc: 'Naranja de taller sobre carbón. Inspirado en corte, sublimación e impresión.'
    },
    terminal: {
      id: 'terminal',
      name: 'Retro Terminal',
      badge: '03',
      accentCyan: '#22C55E',
      accentOrange: '#EAB308',
      bgDark: '#0A0C0E',
      desc: 'Verde fósforo CRT Matrix sobre negro puro para programación y Linux.'
    },
    chill: {
      id: 'chill',
      name: 'Chill Lavender',
      badge: '04',
      accentCyan: '#89B4FA',
      accentOrange: '#CBA6F7',
      bgDark: '#181825',
      desc: 'Azul noche pastel y acentos violetas suaves. Ideal para charla y relax.'
    },
    cyberpunk: {
      id: 'cyberpunk',
      name: 'Cyberpunk Industrial',
      badge: '05',
      accentCyan: '#FFE600',
      accentOrange: '#FF0055',
      bgDark: '#0F0F14',
      desc: 'Amarillo neón industrial y fucsia eléctrico. Alto contraste y máxima energía.'
    },
    synthwave: {
      id: 'synthwave',
      name: 'Synthwave Retro',
      badge: '06',
      accentCyan: '#00F9FF',
      accentOrange: '#FF2A85',
      bgDark: '#1A1028',
      desc: 'Rosa neón 80s con cian láser sobre fondo purpúreo. Atmósfera arcade.'
    }
  },

  currentTheme: 'maker',

  // Cambiar tema visual en caliente
  async changeTheme(themeId) {
    if (!this.presets[themeId]) themeId = 'maker';
    this.currentTheme = themeId;

    document.body.setAttribute('data-theme', themeId);

    const themeSelect = document.getElementById('quick-theme-select');
    if (themeSelect) themeSelect.value = themeId;

    try {
      await API.theme(themeId);
    } catch (e) {
      console.warn('No se pudo enviar cambio de tema al servidor:', e);
    }
  }
};

// Función global accesible desde HTML
async function changeLiveTheme(theme) {
  await THEMES.changeTheme(theme);
}
