// widgets/goal/js/render.js - Motor de renderizado visual y barras de progreso de metas

window.GoalRenderer = (function() {
  function hexToRgba(hex, alpha = 1) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function formatSubtext(format, current, target, pct) {
    if (!format) return `${pct}% COMPLETADO`;
    return format
      .replace(/{current}/g, current)
      .replace(/{target}/g, target)
      .replace(/{remaining}/g, Math.max(0, target - current))
      .replace(/{pct}/g, pct);
  }

  function renderGoal(goalState, currentRotationIndex) {
    const card = document.getElementById('goal-card');
    const itemsContainer = document.getElementById('goal-items-container');
    if (!card || !itemsContainer) return false;

    const s = goalState.styles || {};
    const accent = s.accentColor || s.borderColor || '#57D6C4';
    const barStart = s.barColorStart || accent;
    const barEnd = s.barColorEnd || '#38BDF8';
    const glow = s.glowIntensity !== undefined ? s.glowIntensity : 40;

    card.style.setProperty('--goal-accent', accent);
    card.style.setProperty('--goal-bar-start', barStart);
    card.style.setProperty('--goal-bar-end', barEnd);
    card.style.setProperty('--goal-glow-color', hexToRgba(barStart, (glow / 100) * 0.8));

    const font = s.fontFamily || 'outfit';
    const fontMap = {
      'outfit': "'Outfit', sans-serif",
      'inter': "'Inter', sans-serif",
      'rajdhani': "'Rajdhani', sans-serif",
      'orbitron': "'Orbitron', sans-serif",
      'space_grotesk': "'Space Grotesk', sans-serif",
      'arcade': "'Press Start 2P', monospace",
      'fredoka': "'Fredoka', sans-serif",
      'montserrat': "'Montserrat', sans-serif"
    };
    card.style.fontFamily = fontMap[font] || fontMap['outfit'];

    const bgOpacity = s.bgOpacity !== undefined ? (s.bgOpacity / 100) : 0.94;
    if (s.bgType === 'transparent') {
      card.style.background = 'transparent';
      card.style.backdropFilter = 'none';
      card.style.webkitBackdropFilter = 'none';
    } else if (s.bgType === 'solid') {
      card.style.background = s.bgColor || '#191D21';
      card.style.backdropFilter = 'none';
      card.style.webkitBackdropFilter = 'none';
    } else if (s.bgType === 'gradient') {
      const c1 = hexToRgba(s.bgColor || '#191D21', bgOpacity);
      const c2 = hexToRgba(s.bgGradient || '#0B0D0F', bgOpacity);
      card.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
      card.style.backdropFilter = 'blur(14px)';
      card.style.webkitBackdropFilter = 'blur(14px)';
    } else {
      card.style.background = hexToRgba(s.bgColor || '#191D21', bgOpacity);
      card.style.backdropFilter = 'blur(14px)';
      card.style.webkitBackdropFilter = 'blur(14px)';
    }

    const bWidth = s.borderWidth !== undefined ? s.borderWidth : 3;
    const bColor = s.borderColor || accent;
    card.style.borderColor = bColor;

    card.classList.remove('border-none', 'border-left_neon', 'border-all_neon', 'border-tech_corners');
    const bStyle = s.borderStyle || 'left_neon';
    if (bStyle === 'none') {
      card.classList.add('border-none');
    } else if (bStyle === 'left_neon') {
      card.classList.add('border-left_neon');
      card.style.borderLeftWidth = `${bWidth}px`;
      card.style.borderRightWidth = '1px';
      card.style.borderTopWidth = '1px';
      card.style.borderBottomWidth = '1px';
    } else if (bStyle === 'all_neon') {
      card.classList.add('border-all_neon');
      card.style.borderWidth = `${bWidth}px`;
    } else if (bStyle === 'tech_corners') {
      card.classList.add('border-tech_corners');
      card.style.borderWidth = `${Math.max(1, bWidth)}px`;
    }

    const glowAlpha = Math.min(0.9, (glow / 100) * 0.7);
    card.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 ${glow * 0.4}px ${hexToRgba(bColor, glowAlpha)}`;

    card.classList.remove('shape-rounded', 'shape-scifi', 'shape-arcade', 'shape-pill', 'shape-slant', 'shape-soft_card');
    card.classList.add(`shape-${s.shape || 'rounded'}`);

    let goalsList = (goalState.goals || []).filter(g => g.active !== false);
    if (goalsList.length === 0) {
      goalsList = [{
        id: 'default',
        title: goalState.title || 'OBJETIVO',
        current: goalState.current || 0,
        target: goalState.target || 100,
        prefix: goalState.prefix || '',
        suffix: goalState.suffix || '',
        subtextFormat: goalState.subtextFormat || '{pct}% COMPLETADO',
        color: accent,
        barColorStart: barStart,
        barColorEnd: barEnd,
        icon: '🎯'
      }];
    }

    const mode = goalState.displayMode || 'stacked';
    let displayedGoals = [];

    if (mode === 'single') {
      const single = goalsList.find(g => g.id === goalState.activeGoalId) || goalsList[0];
      displayedGoals = [single];
    } else if (mode === 'rotative') {
      if (currentRotationIndex >= goalsList.length) currentRotationIndex = 0;
      displayedGoals = [goalsList[currentRotationIndex] || goalsList[0]];
    } else {
      displayedGoals = goalsList;
    }

    itemsContainer.innerHTML = '';
    let anyCompleted = false;

    displayedGoals.forEach((g) => {
      const curr = Math.max(0, parseInt(g.current) || 0);
      const targ = Math.max(1, parseInt(g.target) || 100);
      const pct = Math.min(100, Math.round((curr / targ) * 100));
      const isCompleted = curr >= targ;
      if (isCompleted) anyCompleted = true;

      const itemDiv = document.createElement('div');
      itemDiv.className = `goal-item ${isCompleted ? 'goal-completed' : ''}`;

      const icon = g.icon || '🎯';
      const prefix = g.prefix || '';
      const suffix = g.suffix || '';
      const customSubtext = formatSubtext(g.subtextFormat || '{pct}% COMPLETADO', curr, targ, pct);

      // El color de cada meta es configurable: se aclara lo justo para leerse
      // sobre el panel oscuro sin cambiar el tono elegido (oss-contrast.js).
      const gColor = window.OSSContrast
        ? OSSContrast.ensureReadable(g.color || accent, OSSContrast.themeBackground('#191D21'))
        : (g.color || accent);
      const gBarStart = g.barColorStart || barStart;
      const gBarEnd = g.barColorEnd || barEnd;

      itemDiv.innerHTML = `
        <div class="goal-item-header">
          <div class="goal-item-title-box">
            <span class="goal-item-icon">${icon}</span>
            <span class="goal-item-title" style="color: ${gColor};">${g.title || 'META'}</span>
          </div>
          <div class="goal-item-count">
            <span class="count-curr">${prefix}${curr}${suffix}</span>
            <span class="count-div">/</span>
            <span class="count-target">${prefix}${targ}${suffix}</span>
          </div>
        </div>

        <div class="goal-progress-track">
          <div class="goal-progress-bar" style="width: ${pct}%; background: linear-gradient(90deg, ${gBarStart}, ${gBarEnd});"></div>
        </div>

        <div class="goal-item-footer">
          <span class="goal-subtext">${customSubtext}</span>
          <span class="goal-pct" style="color: ${gBarStart};">${pct}%</span>
        </div>
      `;

      itemsContainer.appendChild(itemDiv);
    });

    return anyCompleted;
  }

  return {
    hexToRgba,
    formatSubtext,
    renderGoal
  };
})();
