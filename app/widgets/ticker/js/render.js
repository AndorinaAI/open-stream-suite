// widgets/ticker/js/render.js - Motor de renderizado y visualización de Fila Superior y Prompter

window.TickerRenderer = (function() {
  const S = window.TickerStateData;

  function buildPrompterGroupHTML(items) {
    const topicSep = S.state.config.topicSeparator || '///';
    let html = '<div class="prompter-group">';
    
    items.forEach((item) => {
      html += `
        <div class="prompter-item">
          ${item.badge ? `
            <span class="${item.badgeClass}">
              <span>${item.icon || '📌'}</span>
              <span>${item.badge}</span>
            </span>
          ` : ''}
          <span class="prompter-text">${item.text}</span>
        </div>
      `;
      html += `<span class="topic-separator">${topicSep}</span>`;
    });

    html += '</div>';
    return html;
  }

  function renderTopTier() {
    const topTierEl = document.getElementById('ticker-top-tier');
    if (!topTierEl) return;

    const layout = S.state.config.layoutMode || 'two_tier';
    if (layout === 'single_bar') {
      topTierEl.style.display = 'none';
      return;
    }

    const items = S.getActiveEventChips();
    if (items.length === 0) {
      topTierEl.style.display = 'none';
      return;
    }

    topTierEl.style.display = 'inline-flex';
    const s = S.state.config.styles || {};
    topTierEl.className = `ticker-top-tier top-shape-${s.topTierShape || 'capsule'} top-chips-${s.topTierChipStyle || 'badge_filled'}`;
    topTierEl.style.justifyContent = s.topTierAlign || 'center';
    const sep = S.state.config.eventSeparator || '│';

    let html = '';
    items.forEach((item, idx) => {
      html += `
        <div class="metric-chip">
          <span class="metric-chip-icon ${item.colorClass}">${item.icon}</span>
          <span class="metric-chip-label">${item.label}</span>
          <span class="metric-chip-value ${item.colorClass}">${item.value}</span>
        </div>
      `;
      if (idx < items.length - 1) {
        html += `<span class="metric-chip-sep">${sep}</span>`;
      }
    });

    topTierEl.innerHTML = html;
  }

  function renderRotatorItem(items) {
    const track = document.getElementById('prompter-track');
    if (!track || items.length === 0) return;

    const anim = S.state.config.rotatorAnimation || 'slide';
    const index = S.state.rotatorIndex % items.length;
    const item = items[index];

    track.innerHTML = `
      <div class="prompter-item anim-${anim}-in" style="justify-content: center;">
        ${item.badge ? `
          <span class="${item.badgeClass}">
            <span>${item.icon || '📌'}</span>
            <span>${item.badge}</span>
          </span>
        ` : ''}
        <span class="prompter-text">${item.text}</span>
      </div>
    `;
    adjustPreviewScale();
  }

  function renderBottomTier() {
    const bottomTier = document.getElementById('ticker-bottom-tier');
    const track = document.getElementById('prompter-track');
    if (!bottomTier || !track) return;

    const cfg = S.state.config;
    const layout = cfg.layoutMode || 'two_tier';

    let prompterItems = S.getActivePrompterItems();
    if (layout === 'single_bar') {
      const eventChips = S.getActiveEventChips();
      const eventPrompterItems = eventChips.map(c => ({
        id: 'event_' + c.id,
        badge: c.label.replace(':', ''),
        badgeClass: 'topic-badge',
        icon: c.icon,
        text: c.value
      }));
      prompterItems = [...eventPrompterItems, ...prompterItems];
    }

    if (S.state.rotatorTimer) {
      clearInterval(S.state.rotatorTimer);
      S.state.rotatorTimer = null;
    }

    if (layout === 'rotator') {
      track.style.display = 'flex';
      track.className = 'rotator-viewport';
      track.style.animation = 'none';
      renderRotatorItem(prompterItems);

      const intervalMs = Math.max(3000, (cfg.rotationInterval || 6) * 1000);
      S.state.rotatorTimer = setInterval(() => {
        if (!S.state.isPaused) {
          S.state.rotatorIndex = (S.state.rotatorIndex + 1) % prompterItems.length;
          renderRotatorItem(prompterItems);
        }
      }, intervalMs);

    } else {
      track.style.display = 'inline-flex';
      track.className = 'prompter-track';

      const groupA = buildPrompterGroupHTML(prompterItems);
      const groupB = buildPrompterGroupHTML(prompterItems);
      track.innerHTML = groupA + groupB;

      if (S.state.isPaused) {
        track.style.animationPlayState = 'paused';
      } else {
        track.style.animationPlayState = 'running';
      }
    }
  }

  function renderTicker() {
    const wrapper = document.getElementById('ticker-wrapper');
    const bottomTier = document.getElementById('ticker-bottom-tier');
    const customStyleTag = document.getElementById('ticker-custom-injected-css');
    if (!wrapper || !bottomTier) return;

    const cfg = S.state.config;
    const s = cfg.styles || {};

    const root = document.documentElement;
    const accent = s.accentColor || s.borderColor || '#57D6C4';
    const bg = s.bgColor || '#191D21';
    const bgGrad = s.bgGradient || '#0B0D0F';
    const opacity = (s.bgOpacity !== undefined ? s.bgOpacity : 92) / 100;
    
    let r = 25, g = 29, b = 33;
    if (bg.startsWith('#') && bg.length >= 7) {
      r = parseInt(bg.slice(1, 3), 16);
      g = parseInt(bg.slice(3, 5), 16);
      b = parseInt(bg.slice(5, 7), 16);
    }
    const rgbaBg = `rgba(${r}, ${g}, ${b}, ${opacity})`;

    root.style.setProperty('--tk-accent', accent);
    root.style.setProperty('--tk-bg', rgbaBg);
    root.style.setProperty('--tk-bg-gradient', bgGrad);
    root.style.setProperty('--tk-border', s.borderColor || accent);
    root.style.setProperty('--tk-glow', `${s.glowIntensity !== undefined ? s.glowIntensity : 35}px`);
    root.style.setProperty('--tk-speed', `${cfg.speed || 45}s`);
    root.style.setProperty('--tk-font-size', `${s.fontSize || 13}px`);
    root.style.setProperty('--tk-follow', s.followColor || '#F43F5E');
    root.style.setProperty('--tk-sub', s.subColor || '#A78BFA');
    root.style.setProperty('--tk-resub', s.resubColor || '#818CF8');
    root.style.setProperty('--tk-bits', s.bitsColor || '#FBBF24');
    root.style.setProperty('--tk-top-bits', s.topBitsColor || '#F59E0B');
    root.style.setProperty('--tk-raid', s.raidColor || '#38BDF8');
    root.style.setProperty('--tk-tip', s.tipColor || '#10B981');
    root.style.setProperty('--tk-kofi', s.kofiColor || '#29ABE2');
    root.style.setProperty('--tk-paypal', s.paypalColor || '#0079C1');
    root.style.setProperty('--tk-bmc', s.bmcColor || '#FFDD00');
    root.style.setProperty('--tk-goal', s.goalColor || accent);

    const topBg = s.topTierBgColor || '#121518';
    const topOpacity = (s.topTierBgOpacity !== undefined ? s.topTierBgOpacity : 88) / 100;
    let tr = 18, tg = 21, tb = 24;
    if (topBg.startsWith('#') && topBg.length >= 7) {
      tr = parseInt(topBg.slice(1, 3), 16);
      tg = parseInt(topBg.slice(3, 5), 16);
      tb = parseInt(topBg.slice(5, 7), 16);
    }
    root.style.setProperty('--tk-top-bg', `rgba(${tr}, ${tg}, ${tb}, ${topOpacity})`);
    root.style.setProperty('--tk-top-border', s.topTierBorderColor || 'rgba(255, 255, 255, 0.14)');
    root.style.setProperty('--tk-top-glow', `${s.topTierGlow !== undefined ? s.topTierGlow : 15}px`);
    root.style.setProperty('--tk-top-font-size', `${s.topTierFontSize || 12}px`);
    root.style.setProperty('--tk-top-spacing', `${s.topTierSpacing || 8}px`);

    bottomTier.className = 'ticker-bottom-tier';
    bottomTier.classList.add(`shape-${s.shape || 'rounded'}`);
    bottomTier.classList.add(`bg-${s.bgType || 'glass'}`);
    bottomTier.classList.add(`border-${s.borderStyle || 'left_neon'}`);
    bottomTier.classList.add(`font-${s.fontFamily || 'rajdhani'}`);

    if (cfg.pauseOnHover) {
      bottomTier.classList.add('pause-on-hover');
    }

    wrapper.className = 'ticker-main-wrapper';
    wrapper.classList.add(`mode-${cfg.layoutMode || 'two_tier'}`);

    if (customStyleTag) {
      customStyleTag.textContent = s.customCSS || '';
    }

    renderTopTier();
    renderBottomTier();
    adjustPreviewScale();
  }

  function adjustPreviewScale() {
    if (window.self !== window.top || window.location.search.includes('preview=true')) {
      document.body.classList.add('is-preview');
      const wrapper = document.getElementById('ticker-wrapper');
      if (wrapper) {
        const params = new URLSearchParams(window.location.search);
        const zoomParam = params.get('zoom');
        let sc = 1.0;
        if (zoomParam === 'fit') {
          const availW = window.innerWidth - 24;
          const naturalW = Math.max(wrapper.clientWidth, 520);
          sc = Math.min(1.0, Math.max(0.75, availW / naturalW));
        } else if (zoomParam) {
          sc = parseFloat(zoomParam) || 1.0;
        }
        wrapper.style.transform = sc !== 1.0 ? `scale(${sc.toFixed(2)})` : 'none';
        wrapper.style.transformOrigin = 'center center';
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '100%';
      }
    }
  }

  return {
    renderTicker,
    renderTopTier,
    renderBottomTier,
    adjustPreviewScale
  };
})();
