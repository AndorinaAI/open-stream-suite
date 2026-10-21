// widgets/goal/js/network.js - Conexión WebSocket, sincronización y rotación de metas

window.GoalNetwork = (function() {
  const R = window.GoalRenderer;
  const C = window.GoalConfetti;

  let goalState = {
    title: 'SEGUIDORES',
    current: 142,
    target: 200,
    prefix: '',
    suffix: '',
    subtextFormat: '{pct}% COMPLETADO',
    displayMode: 'stacked',
    rotationInterval: 8,
    activeGoalId: 'followers',
    celebrateAnimation: true,
    celebrateSound: true,
    goals: [],
    styles: {}
  };

  let currentRotationIndex = 0;
  let rotationTimer = null;
  let lastWasCompleted = false;

  function getState() {
    return goalState;
  }

  function setState(newState) {
    goalState = Object.assign(goalState, newState);
  }

  function playCelebrationFanfare() {
    if (!goalState.celebrateSound) return;
    if (window.SoundSynth) {
      window.SoundSynth.playTone('victory');
    }
  }

  function triggerCelebration() {
    if (goalState.celebrateAnimation) {
      C.triggerBurst();
    }
    playCelebrationFanfare();
  }

  function update() {
    const isCompleted = R.renderGoal(goalState, currentRotationIndex);
    if (isCompleted && !lastWasCompleted) {
      triggerCelebration();
    }
    lastWasCompleted = isCompleted;
  }

  function startRotationTimer() {
    if (rotationTimer) clearInterval(rotationTimer);
    if (goalState.displayMode === 'rotative') {
      const ms = Math.max(3000, (goalState.rotationInterval || 8) * 1000);
      rotationTimer = setInterval(() => {
        const activeList = (goalState.goals || []).filter(g => g.active !== false);
        if (activeList.length > 1) {
          currentRotationIndex = (currentRotationIndex + 1) % activeList.length;
          update();
        }
      }, ms);
    }
  }

  async function loadConfig() {
    try {
      const resp = await fetch('/api/widgets/config');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.config && data.config.goal) {
          setState(data.config.goal);
        }
      }
    } catch (err) {
      console.warn('Aviso: no se pudo cargar configuración inicial del widget de metas:', err);
    }

    update();
    startRotationTimer();
  }

  const wsUrl = `ws://${window.location.hostname || 'localhost'}:8080/ws`;
  let ws;

  function connectWS() {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('✓ Goal Widget conectado al WebSocket local.');
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'goal_update' || data.type === 'update_goal') {
          if (data.goalId && Array.isArray(goalState.goals)) {
            const found = goalState.goals.find(g => g.id === data.goalId);
            if (found) {
              if (data.current !== undefined) found.current = data.current;
              if (data.target !== undefined) found.target = data.target;
              if (data.title) found.title = data.title;
            }
          }
          if (data.current !== undefined) goalState.current = data.current;
          if (data.target !== undefined) goalState.target = data.target;
          if (data.title) goalState.title = data.title;
          update();

        } else if (data.type === 'goal_celebrate') {
          triggerCelebration();

        } else if (data.type === 'goal_config_update' && data.config) {
          setState(data.config);
          update();
          startRotationTimer();

        } else if (data.type === 'widgets_config_updated' && data.config && data.config.goal) {
          setState(data.config.goal);
          update();
          startRotationTimer();
        }
      } catch (err) {
        console.error('Error parseando mensaje WebSocket en Goal Widget:', err);
      }
    };

    ws.onclose = () => setTimeout(connectWS, 2500);
    ws.onerror = () => { try { ws.close(); } catch(e){} };
  }

  function setupEventListeners() {
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'apply_goal_config') {
        setState(e.data.config);
        update();
        startRotationTimer();
      }
    });
  }

  return {
    getState,
    setState,
    loadConfig,
    connectWS,
    setupEventListeners,
    triggerCelebration,
    update
  };
})();
