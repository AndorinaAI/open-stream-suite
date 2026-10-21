// widgets/timer/panel/02-controls.js - Coordinador del formulario del panel del Temporizador

function renderTimerControls(container) {
  if (!container || !cachedWidgetsConfig) return;
  const t = cachedWidgetsConfig.timer || {};
  const s = t.styles || {};
  const presets = t.presets || [];
  const activePresetId = t.activePreset || s.themePreset || 'maker_glass';
  const alerts = t.alerts || {};
  const periodic = alerts.periodic || {};

  const partA = buildTimerTimeSetupHtml(t, alerts, periodic);
  const partB = buildTimerStylesPresetsHtml(t, s, presets, activePresetId);

  container.innerHTML = partA + partB;
}
