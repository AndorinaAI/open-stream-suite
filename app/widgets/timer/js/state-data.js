/**
 * app/widgets/timer/js/state-data.js — Estado, utilidades y formatos del temporizador
 */

window.TimerState = (function() {
  const timerConfig = {
    activePreset: 'maker_glass',
    mode: 'down',
    defaultSeconds: 300,
    initialSeconds: 300,
    targetSeconds: 0,
    title: 'TEMPORIZADOR',
    subtitle: 'FASE ACTUAL',
    unitLabel: 'MIN',
    timeFormat: 'mm:ss',
    formatLayout: 'prefix_time_unit_sub',
    customTemplate: '{prefix} {time} {unit} - {sub}',
    styles: {
      shape: 'rounded',
      bgType: 'glass',
      bgColor: '#191D21',
      bgGradient: '#0B0D0F',
      borderColor: '#57D6C4',
      borderStyle: 'left_neon',
      borderWidth: 3,
      glowIntensity: 40,
      bgOpacity: 94,
      fontFamily: 'outfit',
      timeDigits: { color: '#F2EEE5', fontSize: 38, fontFamily: 'outfit', glow: true },
      unit: { color: '#57D6C4', fontSize: 12, fontFamily: 'outfit' },
      prefix: { color: '#57D6C4', fontSize: 11, fontFamily: 'outfit' },
      subtitle: { color: '#8B969C', fontSize: 11, fontFamily: 'outfit' },
      progressBar: { show: true, height: 6, color: '#57D6C4', trackColor: 'rgba(46, 54, 59, 0.6)' },
      statusChip: { show: true, color: '#57D6C4' },
      customCSS: ''
    },
    alerts: {
      finalAlarm: { enabled: true, sound: 'bell', flashScreen: true },
      warningThreshold: { enabled: true, seconds: 30, color: '#EF4444' },
      periodic: { enabled: false, everyMinutes: 15, sound: 'beep_digital', flash: true, message: '💧 Recordatorio de Hidratación / Descanso' },
      milestones: [
        { atSeconds: 300, message: '¡5 minutos restantes!', sound: 'bell', flash: true },
        { atSeconds: 60, message: '¡Último minuto!', sound: 'beep_digital', flash: true }
      ]
    }
  };

  let totalSeconds = 300;
  let initialSeconds = 300;
  let targetSeconds = 0;
  let timerMode = 'down'; // 'down' | 'up'
  let isRunning = false;

  function formatTimeDigits(secs, format = 'mm:ss') {
    const s = Math.max(0, secs);
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const remSecs = s % 60;

    if (format === 'hh:mm:ss' || hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
    } else if (format === 'ss') {
      return `${s}s`;
    } else if (format === 'human') {
      if (mins > 0) return `${mins}m ${String(remSecs).padStart(2, '0')}s`;
      return `${remSecs}s`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  }

  function getStatusText() {
    if (totalSeconds === 0 && timerMode === 'down') return '¡COMPLETADO!';
    if (isRunning) return timerMode === 'up' ? 'CRONÓMETRO' : 'EN CURSO';
    return 'PAUSADO';
  }

  function computeProgressPercent() {
    if (timerMode === 'up') {
      const target = targetSeconds || initialSeconds || 3600;
      return Math.min(100, (totalSeconds / target) * 100);
    } else {
      const base = initialSeconds > 0 ? initialSeconds : 300;
      return Math.max(0, Math.min(100, (totalSeconds / base) * 100));
    }
  }

  function getFontStack(f) {
    if (f === 'outfit') return "'Outfit', sans-serif";
    if (f === 'poppins') return "'Poppins', sans-serif";
    if (f === 'inter') return "'Inter', sans-serif";
    if (f === 'montserrat') return "'Montserrat', sans-serif";
    if (f === 'rajdhani') return "'Rajdhani', sans-serif";
    if (f === 'orbitron') return "'Orbitron', sans-serif";
    if (f === 'russo' || f === 'russo_one') return "'Russo One', sans-serif";
    if (f === 'comfortaa') return "'Comfortaa', cursive, sans-serif";
    if (f === 'mono') return "'JetBrains Mono', monospace";
    if (f === 'retro' || f === 'press_start') return "'Press Start 2P', monospace";
    if (f === 'silkscreen') return "'Silkscreen', monospace";
    if (f === 'bungee') return "'Bungee', cursive, sans-serif";
    if (f === 'righteous') return "'Righteous', cursive, sans-serif";
    if (f === 'cinzel') return "'Cinzel', serif";
    return "'Outfit', sans-serif";
  }

  function hexToRgba(hex, alpha = 1) {
    if (!hex || hex === 'transparent') return 'transparent';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return hex;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return {
    config: timerConfig,
    get totalSeconds() { return totalSeconds; },
    set totalSeconds(v) { totalSeconds = v; },
    get initialSeconds() { return initialSeconds; },
    set initialSeconds(v) { initialSeconds = v; },
    get targetSeconds() { return targetSeconds; },
    set targetSeconds(v) { targetSeconds = v; },
    get timerMode() { return timerMode; },
    set timerMode(v) { timerMode = v; },
    get isRunning() { return isRunning; },
    set isRunning(v) { isRunning = v; },
    formatTimeDigits,
    getStatusText,
    computeProgressPercent,
    getFontStack,
    hexToRgba,
    escapeHtml
  };
})();
