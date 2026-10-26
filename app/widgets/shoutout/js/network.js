/**
 * app/widgets/shoutout/js/network.js
 * Conexión WebSocket para recibir eventos de shoutout y cambios de tema en vivo.
 */

window.ShoutoutNetwork = {
  ws: null,

  connectWS() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Tema nativo de packs
        if ((data.type === 'theme_change' && data.theme) || (data.type === 'widget_theme_change' && (!data.id || data.id === window.OSS_WIDGET_ID))) {
          window.OSSTheme.handleMessage(data);
          return;
        }
        if (data.type === 'shoutout') {
          if (window.ShoutoutRenderer) {
            window.ShoutoutRenderer.showShoutout(data);
          }
        } else if ((data.type === 'theme_change' && data.theme) || (data.type === 'widget_theme_change' && (!data.id || data.id === window.OSS_WIDGET_ID))) {
          window.OSSTheme.handleMessage(data);
          return;
        }
      } catch (e) {}
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connectWS(), 3000);
    };
  },

  checkPreviewMode() {
    if (window.location.search.includes('preview=true')) {
      setTimeout(() => {
        if (window.ShoutoutRenderer) {
          window.ShoutoutRenderer.showShoutout({
            promo_type: 'product',
            title: 'Pegatinas Holográficas Maker',
            subtitle: 'Vinilo troquelado impermeable para portátil',
            price: '3.50€',
            link: 'https://twitch.tv/andorina',
            message: '¡Nuevos diseños disponibles este mes!',
            show_qr: true,
            color: '#FF783F',
            duration: 12000
          });
        }
      }, 400);
    }
  }
};
