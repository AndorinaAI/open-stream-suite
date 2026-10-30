/**
 * app/widgets/chat/js/parser.js — Parser de badges, emotes, sintaxis y disparadores inteligentes
 */

window.ChatParser = (function() {
  let chatShortcuts = [];

  function setShortcuts(shortcuts) {
    chatShortcuts = shortcuts || [];
  }

  function parseBadges(badgesStr) {
    const chatConfig = window.ChatStyles?.config || {};
    if (!badgesStr || !chatConfig.showBadges) return '';
    const chips = [];
    const parts = badgesStr.split(',');
    parts.forEach(p => {
      const [badgeType] = p.split('/');
      if (badgeType === 'broadcaster') chips.push('<span class="badge-chip broadcaster" title="Streamer">👑</span>');
      else if (badgeType === 'moderator') chips.push('<span class="badge-chip moderator" title="Moderador">🛡️</span>');
      else if (badgeType === 'vip') chips.push('<span class="badge-chip vip" title="VIP">💎</span>');
      else if (badgeType === 'subscriber') chips.push('<span class="badge-chip subscriber" title="Suscriptor">⭐</span>');
      else if (badgeType === 'artist-badge' || badgeType === 'artist') chips.push('<span class="badge-chip artist" title="Artista">🎨</span>');
      else if (badgeType === 'follower') chips.push('<span class="badge-chip follower" title="Seguidor">💜</span>');
      else if (badgeType === 'viewer') chips.push('<span class="badge-chip viewer" title="Espectador">👤</span>');
    });
    return chips.length ? `<span class="user-badges">${chips.join('')}</span>` : '';
  }

  function normalizeSpanishChat(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/(.)\1{2,}/g, '$1$1');
  }

  function checkKeywordMatch(normalizedMsg, tokens, rawKeyword) {
    let kw = normalizeSpanishChat(rawKeyword.trim());
    if (!kw) return false;

    if (kw.endsWith('*')) {
      const stem = kw.slice(0, -1);
      return tokens.some(t => t.startsWith(stem)) || normalizedMsg.includes(stem);
    }

    if (tokens.includes(kw)) return true;

    if (kw.endsWith('o') || kw.endsWith('a')) {
      const root = kw.slice(0, -1);
      const variations = [root + 'o', root + 'a', root + 'os', root + 'as', root + 'e', root + 'es', root + '@'];
      if (tokens.some(t => variations.includes(t))) return true;
    }
    if (kw.endsWith('on')) {
      const root = kw;
      const variations = [root, root + 'a', root + 'es', root + 'as'];
      if (tokens.some(t => variations.includes(t))) return true;
    }

    if (kw.length >= 4 && normalizedMsg.includes(kw)) return true;

    return false;
  }

  function checkChatParticleTriggers(rawText) {
    const chatConfig = window.ChatStyles?.config || {};
    if (!chatConfig.autoParticles || !chatShortcuts || !chatShortcuts.length) return false;
    const normalizedMsg = normalizeSpanishChat(rawText);
    const tokens = normalizedMsg.split(/[\s,.;:!?¡¿\-_()]+/).filter(Boolean);

    for (const sc of chatShortcuts) {
      if (sc.autoTrigger === false || !sc.keywords) continue;
      const kwList = sc.keywords.split(',');
      for (const rawKw of kwList) {
        if (checkKeywordMatch(normalizedMsg, tokens, rawKw)) {
          if (window.ParticleEngine) {
            window.ParticleEngine.explode(sc.emoji || '🎉', sc.count || 40);
          }
          return true;
        }
      }
    }
    return false;
  }

  function formatEmotes(text, emotesTag) {
    const safeText = (text === null || text === undefined) ? '' : String(text);
    if (!emotesTag) return escapeHtml(safeText);
    const emoteList = [];
    emotesTag.split('/').forEach(emoteData => {
      if (!emoteData) return;
      const [id, ranges] = emoteData.split(':');
      ranges.split(',').forEach(range => {
        const [start, end] = range.split('-').map(Number);
        emoteList.push({ id, start, end });
      });
    });

    emoteList.sort((a, b) => b.start - a.start);
    // El texto de IRC de Twitch es contenido de usuario sin escapar: puede
    // traer <script> o atributos onerror=. Se escapa ANTES de insertar las
    // etiquetas <img> de los emotes, porque los índices del emotesTag se
    // refieren a las posiciones del texto original (sin entidades HTML).
    let html = escapeHtml(safeText);
    emoteList.forEach(e => {
      // escapeHtml sustituye carácter a carácter, así que la longitud del
      // prefijo escapado da la posición equivalente dentro del HTML. Se
      // calcula por separado el desplazamiento de inicio y el de fin.
      const rawBefore = safeText.slice(0, e.start);
      const rawEmote = safeText.slice(e.start, e.end + 1);
      const startOffset = escapeHtml(rawBefore).length - rawBefore.length;
      const endOffset = escapeHtml(rawBefore + rawEmote).length - (rawBefore + rawEmote).length;
      const before = html.slice(0, e.start + startOffset);
      const after = html.slice(e.end + 1 + endOffset);
      const imgTag = `<img class="twitch-emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/2.0" alt="emote">`;
      html = before + imgTag + after;
    });

    return html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  return {
    setShortcuts,
    parseBadges,
    normalizeSpanishChat,
    checkKeywordMatch,
    checkChatParticleTriggers,
    formatEmotes,
    escapeHtml
  };
})();
