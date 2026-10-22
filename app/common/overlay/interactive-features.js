/**
 * ====================================================================
 * OPEN STREAM SUITE — MOTOR DE FUNCIONES INTERACTIVAS Y SWITCHABLES
 * ====================================================================
 * app/common/overlay/interactive-features.js
 *
 * Dota a todas las escenas de los 4 packs de interactividad completa:
 *  1. Maker & Print: Conmutación de fases de proyecto (.phase-item),
 *     estados técnicos del sistema (SYS: OK / DEV: ACTIVE / RUNNING),
 *     cámara auxiliar (PC / Microscopio / Taller) y tarjetas de modo.
 *  2. Cozy Lo-Fi: Reloj Pomodoro funcional completo (inicio/pausa/reset/descanso),
 *     tareas chequeables (.task-item), reproductor lofi interactivo (vinilo + pistas),
 *     paleta de colores interactiva, pinceles y contador de metas.
 *  3. Gamer Pro: Pozo de vetos de mapas (PICK / BAN / DECIDER / READY),
 *     simulador de telemetría gamer (FPS/Ping), conmutador de formato de partida (BO3/BO5)
 *     y splits de speedrun.
 *  4. Open Stream: Conmutación de tareas de escritorio, conmutador de cámara de orador
 *     en podcast y selector de modos de pantalla.
 */

(function () {
  'use strict';

  window.OSSInteractive = window.OSSInteractive || {};

  function isEditingMode() {
    return !!(window.__OSS_IS_EDITING__ || document.body.classList.contains('oss-editing-active'));
  }

  function notify(msg) {
    if (window.showHudToast) {
      window.showHudToast(msg);
    } else if (window.OSSEditor && typeof window.OSSEditor.showHudToast === 'function') {
      window.OSSEditor.showHudToast(msg);
    }
  }

  // Sintetizador Web Audio API para campana suave de Pomodoro / Notificaciones
  function playSoftChime(freq = 587.33, duration = 0.6) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function initInteractiveFeatures() {

    // =============================================================
    // 🛠️ 1. PACK MAKER & PRINT: Fases, Estado Técnico y Cámaras
    // =============================================================
    function setupMakerAndPrintFeatures() {
      // A) Fases de Proyecto Interactivas (.phase-item)
      const phaseContainers = document.querySelectorAll('.project-phases');
      phaseContainers.forEach(container => {
        container.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          const item = e.target.closest('.phase-item');
          if (!item) return;

          if (window.OSSEditor && typeof window.OSSEditor.activatePhase === 'function') {
            window.OSSEditor.activatePhase(item);
            return;
          }

          container.querySelectorAll('.phase-item').forEach(p => p.classList.remove('active'));
          item.classList.add('active');

          const phaseName = item.textContent.trim();
          document.querySelectorAll('.panel-project-phase').forEach(el => {
            el.textContent = phaseName;
          });

          notify(`🛠️ Fase activa cambiada a: ${phaseName}`);
        });
      });

      // B) Estado del Sistema en Panel Lateral (SYS: OK / DEV: ACTIVE / RUNNING)
      const panelStatusSpans = document.querySelectorAll('.side-info-panel .panel-header span:last-child');
      const systemStatuses = ['SYS: OK', 'DEV: ACTIVE', 'BUILD: PASS', 'TESTING', 'RUNNING', 'LIVE: DEPLOY'];
      panelStatusSpans.forEach(span => {
        span.style.cursor = 'pointer';
        span.setAttribute('title', 'Haz clic para alternar estado técnico del proyecto');
        span.addEventListener('click', () => {
          if (isEditingMode()) return;
          const cur = span.textContent.trim();
          let idx = systemStatuses.indexOf(cur);
          idx = (idx + 1) % systemStatuses.length;
          span.textContent = systemStatuses[idx];
          notify(`⚡ Estado del sistema: ${systemStatuses[idx]}`);
        });
      });

      // C) Conmutador de Material / Especificaciones en Print Mode
      const materialRows = document.querySelectorAll('.panel-project-detail');
      const makerMaterials = [
        'Vinilo Holográfico Adhesivo · Cuchilla 45°',
        'PLA Mate Carbono · Boquilla 0.4mm · 210°C',
        'PETG Translúcido Alta Resistencia',
        'PCB Fabricación v1.3 · SMD Soldering',
        'Armbian Linux · Docker Containers · Hermes AI'
      ];
      materialRows.forEach(row => {
        row.style.cursor = 'pointer';
        row.setAttribute('title', 'Haz clic para alternar material o notas de fabricación');
        row.addEventListener('click', () => {
          if (isEditingMode()) return;
          const cur = row.textContent.trim();
          let idx = makerMaterials.indexOf(cur);
          idx = (idx + 1) % makerMaterials.length;
          row.textContent = makerMaterials[idx];
          notify(`📦 Material/Notas: ${makerMaterials[idx]}`);
        });
      });

      // D) Conmutador de Cámara Auxiliar (.camera-aux)
      const auxCams = document.querySelectorAll('.camera-aux');
      const auxLabels = ['PC / TERMINAL', 'MICROSCOPIO 40X', 'BANCO HARDWARE', 'IMPRESORA 3D', 'MACRO CORTE'];
      auxCams.forEach(cam => {
        const labelEl = cam.querySelector('.frame-label span:last-child') || cam.querySelector('.frame-label');
        if (labelEl) {
          labelEl.style.cursor = 'pointer';
          labelEl.setAttribute('title', 'Haz clic para alternar etiqueta de fuente auxiliar');
          labelEl.addEventListener('click', (e) => {
            if (isEditingMode()) return;
            e.stopPropagation();
            const cur = labelEl.textContent.trim();
            let idx = auxLabels.indexOf(cur);
            idx = (idx + 1) % auxLabels.length;
            labelEl.textContent = auxLabels[idx];
            notify(`📹 Cámara auxiliar: ${auxLabels[idx]}`);
          });
        }

        const corner = cam.querySelector('.frame-corner-tr');
        if (corner) {
          corner.style.cursor = 'pointer';
          corner.setAttribute('title', 'Doble clic en la esquina para ocultar o mostrar esta cámara');
          corner.addEventListener('dblclick', () => {
            if (isEditingMode()) return;
            const isHidden = cam.style.opacity === '0';
            cam.style.transition = 'opacity 0.3s ease';
            cam.style.opacity = isHidden ? '1' : '0';
            notify(isHidden ? '📹 Cámara auxiliar visible' : '📹 Cámara auxiliar oculta');
          });
        }
      });

      // E) Modos en pantalla de inicio de Maker (.stream-mode-card)
      const modeCards = document.querySelectorAll('.stream-mode-card');
      modeCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.setAttribute('title', 'Haz clic para activar o desactivar este modo de emisión');
        card.addEventListener('click', () => {
          if (isEditingMode()) return;
          card.classList.toggle('active-cyan');
          const label = card.querySelector('.ss-mode-label')?.textContent?.trim() || 'Modo';
          notify(`⚡ Estado alternado: ${label}`);
        });
      });

      // F) Modo Game en Maker: Conmutación de insignia y posición webcam
      const gameBadgeUnder = document.querySelector('.game-mode-badge-under');
      const gameModes = ['GAME MODE', 'CASUAL PLAY', 'COMPETITIVE RANKED', 'SPEEDRUN RUN', 'RETRO ARCADE'];
      if (gameBadgeUnder) {
        const span = gameBadgeUnder.querySelector('span:last-child') || gameBadgeUnder;
        span.style.cursor = 'pointer';
        span.setAttribute('title', 'Haz clic para alternar modo de juego');
        span.addEventListener('click', () => {
          if (isEditingMode()) return;
          const cur = span.textContent.trim();
          let idx = gameModes.indexOf(cur);
          idx = (idx + 1) % gameModes.length;
          span.textContent = gameModes[idx];
          notify(`🎮 Modo de juego: ${gameModes[idx]}`);
        });
      }

      // Conmutador de esquina de Webcam en Game
      const webcamGameContainer = document.querySelector('.webcam-game-container');
      if (webcamGameContainer) {
        const regMark = webcamGameContainer.querySelector('.reg-mark');
        if (regMark) {
          regMark.style.cursor = 'pointer';
          regMark.setAttribute('title', 'Haz clic para cambiar webcam de esquina (Izquierda <-> Derecha)');
          regMark.addEventListener('click', () => {
            if (isEditingMode()) return;
            const isRight = webcamGameContainer.style.left === 'auto';
            if (isRight) {
              webcamGameContainer.style.left = '48px';
              webcamGameContainer.style.right = 'auto';
              notify('📹 Webcam movida a la izquierda');
            } else {
              webcamGameContainer.style.left = 'auto';
              webcamGameContainer.style.right = '48px';
              notify('📹 Webcam movida a la derecha');
            }
          });
        }
      }

      // G) Conmutador de estado de Chat en Chill Mode
      const chatStatusDot = document.querySelector('.chat-status-dot');
      if (chatStatusDot) {
        const chatStates = [
          { color: '#10B981', name: 'Chat Activo' },
          { color: '#F59E0B', name: 'Modo Lento (30s)' },
          { color: '#8B5CF6', name: 'Solo Suscriptores' }
        ];
        let chatStateIdx = 0;
        chatStatusDot.style.cursor = 'pointer';
        chatStatusDot.setAttribute('title', 'Haz clic para cambiar estado del chat');
        chatStatusDot.addEventListener('click', () => {
          if (isEditingMode()) return;
          chatStateIdx = (chatStateIdx + 1) % chatStates.length;
          const st = chatStates[chatStateIdx];
          chatStatusDot.style.backgroundColor = st.color;
          chatStatusDot.style.boxShadow = `0 0 8px ${st.color}`;
          notify(`💬 Estado del chat: ${st.name}`);
        });
      }

      // H) Conmutador de Frases Chill en Footer
      const chillPrompt = document.querySelector('[data-i18n="themes.placeholder_chill_prompt"]');
      if (chillPrompt) {
        const prompts = [
          '¡Escribe en el chat para participar!',
          '¿Qué proyecto estás montando hoy?',
          'Pregunta lo que quieras sobre el hardware',
          '¡Comparte tus dudas de programación!'
        ];
        let pIdx = 0;
        chillPrompt.style.cursor = 'pointer';
        chillPrompt.setAttribute('title', 'Haz clic para alternar frase de invitación al chat');
        chillPrompt.addEventListener('click', () => {
          if (isEditingMode()) return;
          pIdx = (pIdx + 1) % prompts.length;
          chillPrompt.textContent = prompts[pIdx];
          notify(`💬 Frase actualizada`);
        });
      }

      // I) Indicador EN DIRECTO universal
      const liveIndicators = document.querySelectorAll('.live-indicator');
      liveIndicators.forEach(ind => {
        ind.style.cursor = 'pointer';
        ind.setAttribute('title', 'Haz clic para alternar estado de emisión');
        ind.addEventListener('click', () => {
          if (isEditingMode()) return;
          const textSpan = ind.querySelector('span:last-child');
          const dot = ind.querySelector('.live-dot');
          const cur = textSpan?.textContent?.trim() || '';

          if (cur === 'EN DIRECTO' || cur === 'LIVE') {
            if (textSpan) textSpan.textContent = 'PAUSA TÉCNICA';
            if (dot) {
              dot.style.backgroundColor = '#FF783F';
              dot.style.boxShadow = '0 0 8px #FF783F';
            }
            notify('⏸ Emisión en pausa técnica');
          } else if (cur === 'PAUSA TÉCNICA') {
            if (textSpan) textSpan.textContent = 'TRANSMISIÓN INICIANDO';
            if (dot) {
              dot.style.backgroundColor = '#57D6C4';
              dot.style.boxShadow = '0 0 8px #57D6C4';
            }
            notify('⏳ Transmisión iniciando');
          } else {
            if (textSpan) textSpan.textContent = 'EN DIRECTO';
            if (dot) {
              dot.style.backgroundColor = '#EF4444';
              dot.style.boxShadow = '0 0 8px #EF4444';
            }
            notify('🔴 Estado cambiado a: EN DIRECTO');
          }
        });
      });
    }

    // =============================================================
    // ☕ 2. PACK COZY LO-FI: Pomodoro Funcional, Tareas y Lofi
    // =============================================================
    function setupCozyFeatures() {
      // A) MOTOR COMPLETO DE RELOJ POMODORO
      const pomoCard = document.querySelector('.pomodoro-card');
      const pomoTimeEl = document.querySelector('.pomo-time');
      const pomoBadgeEl = document.querySelector('.pomo-badge');
      const pomoBar = document.querySelector('.pomo-progress');
      const cycleDots = document.querySelectorAll('.cycle-dot');

      if (pomoTimeEl) {
        let pomoInterval = null;
        let pomoRemaining = 25 * 60;
        let pomoTotal = 25 * 60;
        let isRunning = false;
        let currentMode = 'work'; // 'work' | 'break'

        function formatPomo(seconds) {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        function updatePomoDisplay() {
          if (!pomoTimeEl.isContentEditable) {
            pomoTimeEl.textContent = formatPomo(pomoRemaining);
          }
          if (pomoBar) {
            const pct = Math.max(0, Math.min(100, ((pomoTotal - pomoRemaining) / pomoTotal) * 100));
            pomoBar.style.width = `${pct}%`;
          }
        }

        function startPomo() {
          if (isRunning) return;
          isRunning = true;
          pomoTimeEl.style.opacity = '1';
          notify(`▶ Pomodoro iniciado (${formatPomo(pomoRemaining)})`);
          pomoInterval = setInterval(() => {
            if (pomoRemaining > 0) {
              pomoRemaining--;
              updatePomoDisplay();
            } else {
              // Fin de sesión
              clearInterval(pomoInterval);
              pomoInterval = null;
              isRunning = false;
              playSoftChime(587.33, 1.2);

              if (currentMode === 'work') {
                // Completar un ciclo dot
                const inactiveDots = document.querySelectorAll('.cycle-dot:not(.active)');
                if (inactiveDots.length > 0) inactiveDots[0].classList.add('active');

                currentMode = 'break';
                pomoTotal = 5 * 60;
                pomoRemaining = 5 * 60;
                if (pomoBadgeEl && !pomoBadgeEl.isContentEditable) pomoBadgeEl.textContent = 'DESCANSO CORTO';
                notify('🔔 ¡Sesión completada! Tiempo para un descanso corto (5:00)');
              } else {
                currentMode = 'work';
                pomoTotal = 25 * 60;
                pomoRemaining = 25 * 60;
                if (pomoBadgeEl && !pomoBadgeEl.isContentEditable) pomoBadgeEl.textContent = 'SESIÓN DE CONCENTRACIÓN';
                notify('🔔 ¡Descanso terminado! Volviendo a sesión de estudio (25:00)');
              }
              updatePomoDisplay();
            }
          }, 1000);
        }

        function pausePomo() {
          if (!isRunning) return;
          clearInterval(pomoInterval);
          pomoInterval = null;
          isRunning = false;
          notify(`⏸ Pomodoro pausado en ${formatPomo(pomoRemaining)}`);
        }

        function resetPomo(minutes = 25) {
          pausePomo();
          pomoTotal = minutes * 60;
          pomoRemaining = minutes * 60;
          updatePomoDisplay();
          notify(`↺ Pomodoro reiniciado a ${minutes}:00`);
        }

        // Clic en el tiempo: Alternar Inicio / Pausa
        pomoTimeEl.style.cursor = 'pointer';
        pomoTimeEl.setAttribute('title', 'Haz clic para iniciar/pausar · Doble clic para reiniciar a 25:00');
        pomoTimeEl.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          e.stopPropagation();
          if (isRunning) {
            pausePomo();
          } else {
            startPomo();
          }
        });

        pomoTimeEl.addEventListener('dblclick', (e) => {
          if (isEditingMode()) return;
          e.stopPropagation();
          resetPomo(currentMode === 'work' ? 25 : 5);
        });

        // Clic en la insignia: Alternar Sesión de Estudio / Descanso Corto / Descanso Largo
        if (pomoBadgeEl) {
          pomoBadgeEl.style.cursor = 'pointer';
          pomoBadgeEl.setAttribute('title', 'Haz clic para alternar: 25m Estudio / 5m Descanso / 15m Descanso largo');
          pomoBadgeEl.addEventListener('click', (e) => {
            if (isEditingMode()) return;
            e.stopPropagation();
            if (currentMode === 'work') {
              currentMode = 'break';
              pomoBadgeEl.textContent = 'DESCANSO CORTO (5m)';
              resetPomo(5);
            } else if (pomoRemaining === 5 * 60) {
              currentMode = 'break';
              pomoBadgeEl.textContent = 'DESCANSO LARGO (15m)';
              resetPomo(15);
            } else {
              currentMode = 'work';
              pomoBadgeEl.textContent = 'SESIÓN DE CONCENTRACIÓN (25m)';
              resetPomo(25);
            }
          });
        }
      }

      // Círculos de Ciclo Pomodoro (.cycle-dot)
      cycleDots.forEach((dot, idx) => {
        dot.style.cursor = 'pointer';
        dot.setAttribute('title', `Ciclo ${idx + 1}: Haz clic para alternar completado`);
        dot.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          e.stopPropagation();
          dot.classList.toggle('active');
          const activeCount = document.querySelectorAll('.cycle-dot.active').length;
          const cycleText = document.querySelector('.pomodoro-card div:nth-child(3)');
          if (cycleText && !cycleText.isContentEditable) {
            cycleText.textContent = `Ciclo ${activeCount} de 4 antes del descanso largo`;
          }
        });
      });

      // B) Tareas del Cuaderno de Estudio (Click para marcar/desmarcar)
      const tasksCard = document.querySelector('.tasks-card');
      if (tasksCard) {
        tasksCard.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          const item = e.target.closest('.task-item');
          if (!item) return;

          item.classList.toggle('done');
          const checkSpan = item.querySelector('.task-check');
          if (checkSpan) {
            checkSpan.textContent = item.classList.contains('done') ? '✓' : '○';
          }
          const taskText = item.querySelector('span:last-child')?.textContent?.trim() || '';
          notify(item.classList.contains('done') ? `✅ Tarea completada: ${taskText}` : `○ Tarea pendiente: ${taskText}`);
        });
      }

      // C) Mini Reproductor Lofi en Café & Charla
      const lofiPlayer = document.querySelector('.lofi-player-bar');
      if (lofiPlayer) {
        const vinyl = lofiPlayer.querySelector('.vinyl-icon');
        const trackTitle = lofiPlayer.querySelector('.track-title');
        const trackAuthor = lofiPlayer.querySelector('.track-author');

        const playlist = [
          { title: 'Coffee Beans & Raindrops', author: 'Lo-Fi Beats · 72 BPM' },
          { title: 'Late Night Matcha Study', author: 'Chillhop Records · 68 BPM' },
          { title: 'Warm Blanket & Cat Purr', author: 'Cozy Melodies · 70 BPM' },
          { title: 'Autumn Breeze Outside', author: 'Acoustic Lofi · 75 BPM' },
          { title: 'Midnight City Lights', author: 'Chillwave · 80 BPM' },
          { title: 'Sunday Morning Coffee', author: 'Jazzhop Lounge · 74 BPM' }
        ];
        let trackIdx = 0;

        if (vinyl) {
          vinyl.style.cursor = 'pointer';
          vinyl.setAttribute('title', 'Haz clic para pausar o girar el disco de vinilo');
          vinyl.addEventListener('click', (e) => {
            if (isEditingMode()) return;
            e.stopPropagation();
            const isPaused = vinyl.style.animationPlayState === 'paused';
            vinyl.style.animationPlayState = isPaused ? 'running' : 'paused';
            notify(isPaused ? '▶ Música Lofi en reproducción' : '⏸ Música Lofi en pausa');
          });
        }

        // Clic en la barra para cambiar de pista musical
        lofiPlayer.style.cursor = 'pointer';
        lofiPlayer.setAttribute('title', 'Haz clic para pasar a la siguiente pista Lofi');
        lofiPlayer.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          if (e.target.closest('.vinyl-icon')) return;
          trackIdx = (trackIdx + 1) % playlist.length;
          const track = playlist[trackIdx];
          if (trackTitle && !trackTitle.isContentEditable) trackTitle.textContent = track.title;
          if (trackAuthor && !trackAuthor.isContentEditable) trackAuthor.textContent = track.author;
          notify(`🎵 Pista Lofi: ${track.title}`);
        });
      }

      // D) Contador de metas diarias (Incrementar al hacer clic)
      const goalPill = document.querySelector('.daily-goal-pill');
      if (goalPill) {
        const goalCount = goalPill.querySelector('.goal-count');
        if (goalCount) {
          goalCount.style.cursor = 'pointer';
          goalCount.setAttribute('title', 'Haz clic para sumar +1 a la meta diaria · Doble clic para reiniciar a 0');
          goalCount.addEventListener('click', (e) => {
            if (isEditingMode()) return;
            e.stopPropagation();
            const text = goalCount.textContent.trim();
            const m = text.match(/(\d+)\s*\/\s*(\d+)/);
            if (m) {
              let cur = parseInt(m[1], 10) + 1;
              const max = parseInt(m[2], 10);
              goalCount.textContent = `${cur} / ${max}`;
              notify(`🎯 Meta actualizada: ${cur} / ${max}`);
            }
          });
          goalCount.addEventListener('dblclick', (e) => {
            if (isEditingMode()) return;
            e.stopPropagation();
            const text = goalCount.textContent.trim();
            const m = text.match(/(\d+)\s*\/\s*(\d+)/);
            if (m) {
              goalCount.textContent = `0 / ${m[2]}`;
              notify(`🎯 Meta reiniciada a 0 / ${m[2]}`);
            }
          });
        }
      }

      // E) Muestras de Color en Arte (Lienzo & Paleta)
      const swatches = document.querySelectorAll('.palette-swatches .swatch');
      swatches.forEach(swatch => {
        swatch.style.cursor = 'pointer';
        swatch.setAttribute('title', 'Haz clic para cambiar este color de la paleta');
        swatch.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          e.stopPropagation();

          let picker = document.getElementById('oss-temp-color-picker');
          if (!picker) {
            picker = document.createElement('input');
            picker.type = 'color';
            picker.id = 'oss-temp-color-picker';
            picker.style.position = 'fixed';
            picker.style.opacity = '0';
            picker.style.pointerEvents = 'none';
            document.body.appendChild(picker);
          }

          picker.onchange = () => {
            swatch.style.backgroundColor = picker.value;
            swatch.title = picker.value;
            notify(`🎨 Color de paleta actualizado a ${picker.value}`);
          };
          picker.click();
        });
      });

      // F) Pinceles y Herramientas en Arte (.tools-palette-bar)
      const toolBar = document.querySelector('.tools-palette-bar');
      if (toolBar) {
        const tools = ['🖌️ PINCEL ÓLEO SUAVE', '✏️ LÁPIZ GRAFITO 2B', '🎨 ACUARELA DIGITAL', '✒️ ENTINTADO G-PEN', '🖍️ PASTEL SECO'];
        let toolIdx = 0;
        toolBar.style.cursor = 'pointer';
        toolBar.setAttribute('title', 'Haz clic para cambiar de herramienta artística activa');
        toolBar.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          toolIdx = (toolIdx + 1) % tools.length;
          const toolEl = toolBar.querySelector('b') || toolBar;
          toolEl.textContent = tools[toolIdx];
          notify(`🎨 Pincel activo: ${tools[toolIdx]}`);
        });
      }

      // G) Píldoras de Ambiente (.ambient-pill span)
      const ambientSpans = document.querySelectorAll('.ambient-pill span');
      ambientSpans.forEach(span => {
        if (span.textContent.includes('•')) return;
        span.style.cursor = 'pointer';
        span.setAttribute('title', 'Haz clic para ajustar nivel o sonido de fondo');
        span.addEventListener('click', (e) => {
          if (isEditingMode()) return;
          e.stopPropagation();
          const txt = span.textContent.trim();
          if (txt.includes('%')) {
            const m = txt.match(/(\d+)%/);
            if (m) {
              let val = parseInt(m[1], 10) + 15;
              if (val > 100) val = 15;
              span.textContent = txt.replace(/\d+%/, `${val}%`);
              notify(`🌧️ Volumen ambiental: ${val}%`);
            }
          } else {
            notify(`🎧 Sonido ambiental activo: ${txt}`);
          }
        });
      });
    }

    // =============================================================
    // ⚡ 3. PACK GAMER PRO: Veto de Mapas, Telemetría y Formato
    // =============================================================
    function setupGamerProFeatures() {
      // A) Pozo de Mapas (Veto interactivo completo)
      const mapPills = document.querySelectorAll('.map-pill');
      mapPills.forEach(pill => {
        pill.style.cursor = 'pointer';
        pill.setAttribute('title', 'Haz clic para alternar: READY -> PICK -> BAN -> DECIDER');
        pill.addEventListener('click', () => {
          if (isEditingMode()) return;
          const statusSpan = pill.querySelector('span:last-child');
          const isPicked = pill.classList.contains('picked');
          const isBanned = pill.dataset.banned === 'true';
          const isDecider = pill.dataset.decider === 'true';

          if (!isPicked && !isBanned && !isDecider) {
            // Pasar a PICK
            pill.classList.add('picked');
            pill.dataset.banned = 'false';
            pill.dataset.decider = 'false';
            pill.style.textDecoration = 'none';
            pill.style.opacity = '1';
            pill.style.borderColor = 'var(--color-accent-cyan, #57D6C4)';
            if (statusSpan) { statusSpan.textContent = 'PICK'; statusSpan.style.color = '#57D6C4'; }
            notify(`🗺️ Mapa ELEGIDO (PICK): ${pill.querySelector('span:first-child')?.textContent || 'Mapa'}`);
          } else if (isPicked) {
            // Pasar a BAN
            pill.classList.remove('picked');
            pill.dataset.banned = 'true';
            pill.dataset.decider = 'false';
            pill.style.textDecoration = 'line-through';
            pill.style.opacity = '0.5';
            pill.style.borderColor = '#EF4444';
            if (statusSpan) { statusSpan.textContent = 'BAN'; statusSpan.style.color = '#EF4444'; }
            notify(`🚫 Mapa BANEADO: ${pill.querySelector('span:first-child')?.textContent || 'Mapa'}`);
          } else if (isBanned) {
            // Pasar a DECIDER
            pill.classList.remove('picked');
            pill.dataset.banned = 'false';
            pill.dataset.decider = 'true';
            pill.style.textDecoration = 'none';
            pill.style.opacity = '1';
            pill.style.borderColor = 'var(--color-accent-orange, #FF783F)';
            if (statusSpan) { statusSpan.textContent = 'DECIDER'; statusSpan.style.color = '#FF783F'; }
            notify(`🔥 Mapa DECIDER: ${pill.querySelector('span:first-child')?.textContent || 'Mapa'}`);
          } else {
            // Reset a normal READY
            pill.classList.remove('picked');
            pill.dataset.banned = 'false';
            pill.dataset.decider = 'false';
            pill.style.textDecoration = 'none';
            pill.style.opacity = '1';
            pill.style.borderColor = '';
            if (statusSpan) { statusSpan.textContent = 'READY'; statusSpan.style.color = '#64748B'; }
            notify(`🔄 Mapa listo para selección: ${pill.querySelector('span:first-child')?.textContent || 'Mapa'}`);
          }
        });
      });

      // B) Formato de Partida (.match-badge span)
      const matchBadge = document.querySelector('.match-badge');
      if (matchBadge) {
        const span = matchBadge.querySelector('span:last-child') || matchBadge;
        const formats = ['BEST OF 3 · MAP 1', 'BEST OF 3 · MAP 2', 'BEST OF 3 · MAP 3 (DECIDER)', 'BEST OF 5 · FINAL', 'GRAND FINALS · SHOWMATCH'];
        let fIdx = 0;
        span.style.cursor = 'pointer';
        span.setAttribute('title', 'Haz clic para cambiar fase de la partida');
        span.addEventListener('click', () => {
          if (isEditingMode()) return;
          fIdx = (fIdx + 1) % formats.length;
          span.textContent = formats[fIdx];
          notify(`🏆 Formato de partida: ${formats[fIdx]}`);
        });
      }

      // C) Telemetría Gamer (.telemetry-pills)
      const telemetryPills = document.querySelector('.telemetry-pills');
      if (telemetryPills) {
        telemetryPills.style.cursor = 'pointer';
        telemetryPills.setAttribute('title', 'Haz clic para simular valores reales de telemetría (FPS/Ping/CPU)');
        telemetryPills.addEventListener('click', () => {
          if (isEditingMode()) return;
          const fpsEl = telemetryPills.querySelector('[data-telemetry="fps"] .val') || telemetryPills.querySelector('.val:nth-child(1)');
          const pingEl = telemetryPills.querySelector('[data-telemetry="ping"] .val') || telemetryPills.querySelector('.val:nth-child(2)');
          const cpuEl = telemetryPills.querySelector('[data-telemetry="cpu"] .val') || telemetryPills.querySelector('.val:nth-child(3)');

          if (fpsEl && !fpsEl.isContentEditable) {
            const fpsValues = ['144', '165', '240', '360', '180'];
            fpsEl.textContent = fpsValues[Math.floor(Math.random() * fpsValues.length)];
          }
          if (pingEl && !pingEl.isContentEditable) {
            const pingValues = ['12ms', '15ms', '18ms', '22ms', '9ms'];
            pingEl.textContent = pingValues[Math.floor(Math.random() * pingValues.length)];
          }
          if (cpuEl && !cpuEl.isContentEditable) {
            const cpuValues = ['38%', '45%', '52%', '41%', '34%'];
            cpuEl.textContent = cpuValues[Math.floor(Math.random() * cpuValues.length)];
          }
          notify('📊 Telemetría actualizada');
        });
      }

      // D) Rol / Héroe / Agente (.hero-tag)
      const heroTag = document.querySelector('.hero-tag');
      if (heroTag) {
        const roles = [
          'DUELIST // JETT',
          'CONTROLLER // OMEN',
          'INITIATOR // SOVA',
          'SENTINEL // KILLJOY',
          'ENTRY FRAGGER // REYNA'
        ];
        let rIdx = 0;
        heroTag.style.cursor = 'pointer';
        heroTag.setAttribute('title', 'Haz clic para alternar rol o agente');
        heroTag.addEventListener('click', () => {
          if (isEditingMode()) return;
          rIdx = (rIdx + 1) % roles.length;
          heroTag.textContent = roles[rIdx];
          notify(`🎮 Agente/Rol activo: ${roles[rIdx]}`);
        });
      }

      // E) Speedrun Splits (.split-row)
      const splitRows = document.querySelectorAll('.split-row, .split-item');
      splitRows.forEach((row, i) => {
        row.style.cursor = 'pointer';
        row.setAttribute('title', 'Haz clic para marcar segmento completado');
        row.addEventListener('click', () => {
          if (isEditingMode()) return;
          const deltaSpan = row.querySelector('.split-delta');
          const isDone = row.classList.contains('split-done');
          if (!isDone) {
            row.classList.add('split-done');
            if (deltaSpan) {
              const deltas = ['-0.42', '-1.15', '-0.08', '+0.34', 'GOLD'];
              deltaSpan.textContent = deltas[i % deltas.length];
              deltaSpan.style.color = deltaSpan.textContent.startsWith('-') || deltaSpan.textContent === 'GOLD' ? '#10B981' : '#EF4444';
            }
            notify(`⏱️ Split completado: ${row.querySelector('.split-name')?.textContent || 'Segmento'}`);
          } else {
            row.classList.remove('split-done');
            if (deltaSpan) deltaSpan.textContent = '--';
            notify(`⏱️ Split reiniciado`);
          }
        });
      });
    }

    // =============================================================
    // 🌐 4. PACK OPEN STREAM: Agenda, Podcasts y Compartir
    // =============================================================
    function setupOpenStreamFeatures() {
      // A) Agenda de Tareas de Escritorio (.agenda-item)
      const agendaItems = document.querySelectorAll('.agenda-item, .desktop-task-pill');
      agendaItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.setAttribute('title', 'Haz clic para alternar tarea completada');
        item.addEventListener('click', () => {
          if (isEditingMode()) return;
          item.classList.toggle('done');
          notify(item.classList.contains('done') ? '✅ Tarea completada' : '○ Tarea pendiente');
        });
      });

      // B) Selector de Orador en Podcast Talk (.pod-cam-box)
      const podCams = document.querySelectorAll('.pod-cam-box, .podcast-cam');
      podCams.forEach(cam => {
        cam.style.cursor = 'pointer';
        cam.setAttribute('title', 'Haz clic para destacar al orador activo');
        cam.addEventListener('click', () => {
          if (isEditingMode()) return;
          podCams.forEach(c => {
            c.classList.remove('speaker-active');
            c.style.borderColor = '';
            c.style.boxShadow = '';
          });
          cam.classList.add('speaker-active');
          cam.style.borderColor = 'var(--color-accent-cyan, #57D6C4)';
          cam.style.boxShadow = '0 0 16px rgba(87, 214, 196, 0.4)';
          const name = cam.querySelector('.guest-nameplate')?.textContent?.trim() || 'Orador';
          notify(`🎙️ Orador activo: ${name}`);
        });
      });

      // C) Modo de Escritorio (.desktop-mode-pill)
      const desktopModePill = document.querySelector('.desktop-mode-pill');
      if (desktopModePill) {
        const dModes = ['SCREEN SHARE', 'FULL DESKTOP', 'IDE / CODE DEMO', 'BROWSER DEMO'];
        let dIdx = 0;
        desktopModePill.style.cursor = 'pointer';
        desktopModePill.setAttribute('title', 'Haz clic para cambiar modo de escritorio');
        desktopModePill.addEventListener('click', () => {
          if (isEditingMode()) return;
          dIdx = (dIdx + 1) % dModes.length;
          desktopModePill.textContent = dModes[dIdx];
          notify(`🖥️ Modo de pantalla: ${dModes[dIdx]}`);
        });
      }
    }

    // =============================================================
    // ⏳ 5. CONTROL UNIVERSAL: Cuenta Atrás y Frases BRB
    // =============================================================
    function setupUniversalControls() {
      // A) Frases rotativas BRB
      const brbStatusBox = document.querySelector('.brb-status-box, .brb-status-phrase');
      if (brbStatusBox) {
        brbStatusBox.style.cursor = 'pointer';
        brbStatusBox.setAttribute('title', 'Haz clic para pasar a la siguiente frase');
        brbStatusBox.addEventListener('click', () => {
          if (isEditingMode()) return;
          const nextBtn = document.getElementById('oss-brb-next-phrase');
          if (nextBtn) {
            nextBtn.click();
          } else {
            const phraseEl = document.querySelector('.brb-status-phrase');
            const phrases = (window.OSS_CONFIG?.beRightBack?.statusPhrases) || [
              'TOMANDO UN CAFÉ...',
              'REVISANDO EL HARDWARE...',
              'CALIBRANDO MOTORES...',
              'VOLVEMOS EN BREVE...'
            ];
            if (phraseEl && !phraseEl.isContentEditable) {
              const cur = phraseEl.textContent.trim();
              const idx = phrases.indexOf(cur);
              const next = phrases[(idx + 1) % phrases.length];
              phraseEl.textContent = next;
              notify(`💬 Frase: ${next}`);
            }
          }
        });
      }

      // B) Clic en Countdown en pantallas Starting Soon para Iniciar / Pausar
      const countdownDisplays = document.querySelectorAll('.countdown-display, .starting-countdown');
      countdownDisplays.forEach(cd => {
        cd.style.cursor = 'pointer';
        cd.setAttribute('title', 'Haz clic para pausar o reanudar cuenta atrás');
        cd.addEventListener('click', () => {
          if (isEditingMode()) return;
          const toggleBtn = document.getElementById('oss-btn-toggle-timer');
          if (toggleBtn) {
            toggleBtn.click();
          }
        });
      });
    }

    // Ejecutar todos los instaladores
    setupMakerAndPrintFeatures();
    setupCozyFeatures();
    setupGamerProFeatures();
    setupOpenStreamFeatures();
    setupUniversalControls();
  }

  window.OSSInteractive.init = initInteractiveFeatures;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveFeatures);
  } else {
    initInteractiveFeatures();
  }
})();
