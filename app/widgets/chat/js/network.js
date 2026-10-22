/**
 * app/widgets/chat/js/network.js — Conexión oficial a Twitch IRC y WebSocket local
 */

window.ChatNetwork = (function() {
  const urlParams = new URLSearchParams(window.location.search);
  const channelName = (urlParams.get('channel') || window.OSS_CONFIG?.channel?.twitch || window.OSS_CONFIG?.channel?.name || "andorina").toLowerCase().trim();

  const profileParam = urlParams.get('profile') || urlParams.get('preset');

  function resolveChatStyles(chatData) {
    if (!chatData) return null;
    let s = chatData.styles || {};
    if (profileParam && chatData.presets && Array.isArray(chatData.presets)) {
      const match = chatData.presets.find(p => p.id === profileParam);
      if (match) {
        s = Object.assign({}, s, match);
      }
    }
    return s;
  }

  async function fetchInitialConfig() {
    try {
      const res = await fetch('/api/widgets/config');
      if (res.ok) {
        const data = await res.json();
        if (data && data.config && data.config.chat) {
          if (data.config.chat.shortcuts && window.ChatParser) {
            window.ChatParser.setShortcuts(data.config.chat.shortcuts);
          }
          const s = resolveChatStyles(data.config.chat);
          if (s && window.ChatStyles) {
            window.ChatStyles.applyChatConfig(s);
          }
          if (data.config.chat.spotlight && window.ChatRenderer) {
            window.ChatRenderer.handleSpotlightMessage(data.config.chat.spotlight);
          }
        }
      }
    } catch (e) {}
  }

  function connectTwitchIRC() {
    let socket;
    try {
      socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    } catch(e) {
      setTimeout(connectTwitchIRC, 4000);
      return;
    }

    socket.onopen = () => {
      socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      socket.send('PASS oauth:dummytoken');
      socket.send(`NICK justinfan${Math.floor(Math.random() * 80000 + 10000)}`);
      socket.send(`JOIN #${channelName}`);
    };

    socket.onmessage = (event) => {
      const raw = event.data;
      if (raw.startsWith('PING')) {
        socket.send('PONG :tmi.twitch.tv');
        return;
      }

      if (raw.includes('PRIVMSG')) {
        const parts = raw.split(' :');
        const tagPart = parts[0];
        const messageText = parts.slice(2).join(' :').trim();

        const tags = {};
        tagPart.split(';').forEach(kv => {
          const [k, v] = kv.split('=');
          tags[k.replace('@', '')] = v;
        });

        const username = tags['display-name'] || 'Usuario';
        const color = tags['color'] || '#57D6C4';
        const emotesTag = tags['emotes'] || '';
        const badges = tags['badges'] || '';

        if (window.ChatRenderer) {
          window.ChatRenderer.renderMessage(username, color, messageText, emotesTag, badges);
        }
      }
    };

    socket.onclose = () => setTimeout(connectTwitchIRC, 4000);
  }

  function connectLocalWS() {
    const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch(e) {
      setTimeout(connectLocalWS, 3000);
      return;
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const R = window.ChatRenderer;
        const P = window.ChatParser;
        const S = window.ChatStyles;

        if (data.type === 'explode_emotes') {
          if (window.ParticleEngine) window.ParticleEngine.explode(data.emoji || '🎉', data.count || 45);
        } else if (data.type === 'chat_message') {
          if (R) R.renderMessage(data.user || 'Viewer', data.color || '#57D6C4', data.message || '', '', data.badges || '');
        } else if (data.type === 'chat_spotlight') {
          if (R) R.handleSpotlightMessage(data);
        } else if (data.type === 'chat_clear') {
          if (R) R.clearChat();
        } else if (data.type === 'widgets_config_updated' && data.config?.chat) {
          if (data.config.chat.shortcuts && P) P.setShortcuts(data.config.chat.shortcuts);
          const s = resolveChatStyles(data.config.chat);
          if (s && S) S.applyChatConfig(s);
        } else if (data.type === 'sub' || data.type === 'raid') {
          if (window.ParticleEngine) window.ParticleEngine.explode('⭐', 40);
        } else if (data.type === 'follow') {
          if (window.ParticleEngine) window.ParticleEngine.explode('❤️', 30);
        }
      } catch (e) {}
    };

    ws.onclose = () => setTimeout(connectLocalWS, 3000);
  }

  return {
    fetchInitialConfig,
    connectTwitchIRC,
    connectLocalWS
  };
})();
