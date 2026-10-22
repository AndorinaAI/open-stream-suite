/**
 * ====================================================================
 * OPEN STREAM SUITE — MOTOR DE FUNCIONES INTERACTIVAS Y SWITCHABLES
 * ====================================================================
 * app/common/overlay/interactive-features.js
 *
 * Dota a todas las escenas de los 4 packs de interactividad completa:
 *  1. Maker & Print: Conmutación de fases de proyecto (.phase-item) y tarjetas de modo (.stream-mode-card).
 *  2. Cozy Lo-Fi: Reloj Pomodoro interactivo, tareas chequeables (.task-item), reproductor lofi interactivo
 *     (cambio de pista y giro del vinilo), paleta de colores editable y contador de metas diario.
 *  3. Gamer Pro: Pozo de vetos de mapas interactivo (.map-pill: PICK / BAN / DECIDER), control de telemetría y splits.
 *  4. Open Stream: Conmutación de tareas de escritorio y conmutador de cámaras en podcast.
 */

(function () {
  'use strict';

  window.OSSInteractive = window.OSSInteractive || {};

  function initInteractiveFeatures() {
    // -------------------------------------------------------------
    // 🛠️ 1. PACK MAKER & PRINT: Fases de Proyecto Interactivas
    // -------------------------------------------------------------
    function setupProjectPhases() {
      const phaseContainers = document.querySelectorAll('.project-phases');
      phaseContainers.forEach(container => {
        container.addEventListener('click', (e) => {
          if (window.__OSS_IS_EDITING__) return;
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

          if (window.showHudToast) {
            window.showHudToast(`🛠️ Fase activa cambiada a: ${phaseName}`);
          }
        });
      });

      // Modos en pantalla de inicio de Maker
      const modeCards = document.querySelectorAll('.stream-mode-card');
      modeCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.setAttribute('title', 'Haz clic para activar o desactivar este modo de emisión');
        card.addEventListener('click', () => {
          if (window.__OSS_IS_EDITING__) return;
          card.classList.toggle('active-cyan');
          if (window.showHudToast) {
            const label = card.querySelector('.ss-mode-label')?.textContent?.trim() || 'Modo';
            window.showHudToast(`⚡ Estado alternado: ${label}`);
          }
        });
      });
    }

    // -------------------------------------------------------------
    // ☕ 2. PACK COZY LO-FI: Pomodoro, Tareas, Música y Paleta
    // -------------------------------------------------------------
    function setupCozyFeatures() {
      // A) Tareas del Cuaderno de Estudio (Click para marcar/desmarcar)
      const tasksCard = document.querySelector('.tasks-card');
      if (tasksCard) {
        tasksCard.addEventListener('click', (e) => {
          if (window.__OSS_IS_EDITING__) return;
          const item = e.target.closest('.task-item');
          if (!item) return;

          item.classList.toggle('done');
          const checkSpan = item.querySelector('.task-check');
          if (checkSpan) {
            checkSpan.textContent = item.classList.contains('done') ? '✓' : '○';
          }
        });
      }

      // B) Círculos de Ciclo Pomodoro (.cycle-dot)
      const cycleDots = document.querySelectorAll('.cycle-dot');
      cycleDots.forEach((dot, idx) => {
        dot.style.cursor = 'pointer';
        dot.setAttribute('title', `Ciclo ${idx + 1}: Haz clic para alternar completado`);
        dot.addEventListener('click', (e) => {
          if (window.__OSS_IS_EDITING__) return;
          e.stopPropagation();
          dot.classList.toggle('active');
          const activeCount = document.querySelectorAll('.cycle-dot.active').length;
          const cycleText = document.querySelector('.pomodoro-card div:nth-child(3)');
          if (cycleText && !cycleText.isContentEditable) {
            cycleText.textContent = `Ciclo ${activeCount} de 4 antes del descanso largo`;
          }
        });
      });

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
          { title: 'Midnight City Lights', author: 'Chillwave · 80 BPM' }
        ];
        let trackIdx = 0;

        if (vinyl) {
          vinyl.style.cursor = 'pointer';
          vinyl.setAttribute('title', 'Haz clic para pausar o girar el disco');
          vinyl.addEventListener('click', (e) => {
            if (window.__OSS_IS_EDITING__) return;
            e.stopPropagation();
            const isPaused = vinyl.style.animationPlayState === 'paused';
            vinyl.style.animationPlayState = isPaused ? 'running' : 'paused';
            if (window.showHudToast) {
              window.showHudToast(isPaused ? '▶ Música Lofi en reproducción' : '⏸ Música Lofi en pausa');
            }
          });
        }

        // Clic en la barra para cambiar de pista musical
        lofiPlayer.style.cursor = 'pointer';
        lofiPlayer.setAttribute('title', 'Haz clic para pasar a la siguiente pista Lofi');
        lofiPlayer.addEventListener('click', (e) => {
          if (window.__OSS_IS_EDITING__) return;
          if (e.target.closest('.vinyl-icon')) return;
          trackIdx = (trackIdx + 1) % playlist.length;
          const track = playlist[trackIdx];
          if (trackTitle && !trackTitle.isContentEditable) trackTitle.textContent = track.title;
          if (trackAuthor && !trackAuthor.isContentEditable) trackAuthor.textContent = track.author;
          if (window.showHudToast) {
            window.showHudToast(`🎵 Pista Lofi: ${track.title}`);
          }
        });
      }

      // D) Contador de metas diarias (Incrementar al hacer clic)
      const goalPill = document.querySelector('.daily-goal-pill');
      if (goalPill) {
        const goalCount = goalPill.querySelector('.goal-count');
        if (goalCount) {
          goalCount.style.cursor = 'pointer';
          goalCount.setAttribute('title', 'Haz clic para sumar +1 a la meta diaria');
          goalCount.addEventListener('click', (e) => {
            if (window.__OSS_IS_EDITING__) return;
            e.stopPropagation();
            const text = goalCount.textContent.trim();
            const m = text.match(/(\d+)\s*\/\s*(\d+)/);
            if (m) {
              let cur = parseInt(m[1], 10) + 1;
              const max = parseInt(m[2], 10);
              goalCount.textContent = `${cur} / ${max}`;
              if (window.showHudToast) {
                window.showHudToast(`🎯 Meta actualizada: ${cur} / ${max}`);
              }
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
          if (window.__OSS_IS_EDITING__) return;
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
            if (window.showHudToast) {
              window.showHudToast(`🎨 Color de muestra actualizado a ${picker.value}`);
            }
          };
          picker.click();
        });
      });
    }

    // -------------------------------------------------------------
    // ⚡ 3. PACK GAMER PRO: Pozo de Mapas (Veto) y Telemetría
    // -------------------------------------------------------------
    function setupGamerProFeatures() {
      const mapPills = document.querySelectorAll('.map-pill');
      mapPills.forEach(pill => {
        pill.style.cursor = 'pointer';
        pill.setAttribute('title', 'Haz clic para alternar estado: PICK -> BAN -> DECIDER -> LIBRE');
        pill.addEventListener('click', () => {
          if (window.__OSS_IS_EDITING__) return;
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
            if (statusSpan) { statusSpan.textContent = 'PICK'; statusSpan.style.color = '#57D6C4'; }
          } else if (isPicked) {
            // Pasar a BAN
            pill.classList.remove('picked');
            pill.dataset.banned = 'true';
            pill.dataset.decider = 'false';
            pill.style.textDecoration = 'line-through';
            pill.style.opacity = '0.5';
            if (statusSpan) { statusSpan.textContent = 'BAN'; statusSpan.style.color = '#EF4444'; }
          } else if (isBanned) {
            // Pasar a DECIDER
            pill.classList.remove('picked');
            pill.dataset.banned = 'false';
            pill.dataset.decider = 'true';
            pill.style.textDecoration = 'none';
            pill.style.opacity = '1';
            pill.style.borderColor = 'var(--color-accent-orange, #FF783F)';
            if (statusSpan) { statusSpan.textContent = 'DECIDER'; statusSpan.style.color = '#FF783F'; }
          } else {
            // Reset a normal
            pill.classList.remove('picked');
            pill.dataset.banned = 'false';
            pill.dataset.decider = 'false';
            pill.style.textDecoration = 'none';
            pill.style.opacity = '1';
            pill.style.borderColor = '';
            if (statusSpan) { statusSpan.textContent = 'READY'; statusSpan.style.color = '#64748B'; }
          }
        });
      });

      // Frases rotativas BRB (Clic para pasar a la siguiente)
      const brbStatusBox = document.querySelector('.brb-status-box, .brb-status-phrase');
      if (brbStatusBox) {
        brbStatusBox.style.cursor = 'pointer';
        brbStatusBox.setAttribute('title', 'Haz clic para pasar a la siguiente frase');
        brbStatusBox.addEventListener('click', (e) => {
          if (window.__OSS_IS_EDITING__) return;
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
            if (phraseEl) {
              const cur = phraseEl.textContent.trim();
              const idx = phrases.indexOf(cur);
              const next = phrases[(idx + 1) % phrases.length];
              phraseEl.textContent = next;
            }
          }
        });
      }

      // Conmutación de Cámara Auxiliar (.camera-aux)
      const auxCam = document.querySelector('.camera-aux');
      if (auxCam) {
        const tr = auxCam.querySelector('.frame-corner-tr');
        if (tr) {
          tr.style.cursor = 'pointer';
          tr.setAttribute('title', 'Doble clic en la esquina para ocultar/mostrar cámara auxiliar');
          tr.addEventListener('dblclick', () => {
            auxCam.style.display = auxCam.style.display === 'none' ? '' : 'none';
          });
        }
      }
    }

    // Inicializar todos los controladores
    setupProjectPhases();
    setupCozyFeatures();
    setupGamerProFeatures();
  }

  window.OSSInteractive.init = initInteractiveFeatures;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveFeatures);
  } else {
    initInteractiveFeatures();
  }
})();
