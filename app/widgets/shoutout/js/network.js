/**
 * app/widgets/shoutout/js/network.js
 * Conexión WebSocket para recibir eventos de shoutout y cambios de tema en vivo.
 */

window.ShoutoutNetwork = {
  ws: null,

  connectWS() {
    const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'shoutout') {
          if (window.ShoutoutRenderer) {
            window.ShoutoutRenderer.showShoutout(data);
          }
        } else if (data.type === 'theme_change' && data.theme) {
          document.body.setAttribute('data-theme', data.theme);
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
