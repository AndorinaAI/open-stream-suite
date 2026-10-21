/**
 * app/common/overlay/editor.js — Editor visual e interactivo en pantalla completa
 * Coordinador modular que carga y orquesta los submódulos de app/common/overlay/editor/:
 *   - 01-toast-hud.js: Notificaciones toast, estilos CSS, toolbar base, docking y auto-fit
 *   - 02-countdown.js: Controles flotantes de cuenta atrás y temporizadores Pomodoro
 *   - 03-speedrun.js: Controles de speedrun en vivo, tramos y cronómetro
 *   - 04-phrases-theme.js: Frases rotativas (BRB), selector de temas y fases de proyecto
 *   - 05-inline-editor.js: Edición directa sobre elementos, selección rápida y guardado en vivo
 */

(function() {
  window.OSSEditor = window.OSSEditor || {};

  function initSubmodules(sceneKey) {
    if (typeof window.obsstudio !== 'undefined') return;
    if (document.getElementById('open-stream-suite-screen-hud')) return;

    const editor = window.OSSEditor;
    if (!editor.createHud) return;

    // 1. Barra HUD principal
    const hud = editor.createHud(sceneKey);

    // 2. Controles específicos por tipo de escena
    if (editor.setupCountdown) editor.setupCountdown(sceneKey);
    if (editor.setupSpeedrun) editor.setupSpeedrun(sceneKey);
    if (editor.setupPhrases) editor.setupPhrases(sceneKey);

    // 3. Estilos, temas, fases y podcast
    if (editor.setupThemeSelector) editor.setupThemeSelector(hud, sceneKey);
    if (editor.setupPhasesAndPodcast) editor.setupPhasesAndPodcast(hud, sceneKey);

    // 4. Edición de texto directa y atajos
    if (editor.setupInlineEditor) editor.setupInlineEditor(hud, sceneKey);
  }

  function loadSubmodulesSequentially(sceneKey) {
    const modules = [
      '01-toast-hud.js',
      '02-countdown.js',
      '03-speedrun.js',
      '04-phrases-theme.js',
      '05a-extract-texts.js',
      '05-inline-editor.js'
    ];

    // Determinar ruta base a partir del script actual o fallback absoluto
    const basePath = (function() {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        if (s.src && s.src.includes('overlay/editor.js')) {
          return s.src.replace(/editor\.js(\?.*)?$/, 'editor/');
        }
      }
      return '/common/overlay/editor/';
    })();

    function loadScript(fileName) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = basePath + fileName + '?v=50';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    return modules.reduce((p, m) => p.then(() => loadScript(m)), Promise.resolve())
      .then(() => initSubmodules(sceneKey))
      .catch(err => {
        console.error('Error al cargar submódulos del editor visual:', err);
      });
  }

  window.setupFullScreenEditor = function(sceneKey, ctx) {
    if (typeof window.obsstudio !== 'undefined') return;
    if (ctx && ctx.applyConfigToDOM) {
      window._oss_applyConfigToDOM = ctx.applyConfigToDOM;
    }

    if (window.OSSEditor && window.OSSEditor.createHud && window.OSSEditor.setupInlineEditor) {
      initSubmodules(sceneKey);
    } else {
      loadSubmodulesSequentially(sceneKey);
    }
  };

  window.showHudToast = function(msg) {
    if (window.OSSEditor && typeof window.OSSEditor.showHudToast === 'function') {
      window.OSSEditor.showHudToast(msg);
    } else {
      console.log('[HUD Toast]', msg);
    }
  };
})();
