// ====================================================================
// MOTOR DE AUDIO SINTETIZADO (Web Audio API) Y PREESCUCHA
// ====================================================================

const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playChime(type = 'sub') {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'susto') {
      // Tono grave sub-bajo con disonancia rápida
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (type === 'boom') {
      // Punch profundo
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.start(now);
      osc.stop(now + 0.75);
    } else if (type === 'coin') {
      // Moneda retro de 2 tonos B5 -> E6
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'victory') {
      // Arpegio heroico C5 - E5 - G5 - C6
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.50, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'bell') {
      // Campana limpia
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);
    } else {
      // Chime suave por defecto
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  }
};

function previewCurrentSound() {
  const selUrl = document.getElementById('trig-sound-file')?.value || document.getElementById('trig-sound-custom-url')?.value;
  const vol = (parseInt(document.getElementById('trig-volume')?.value, 10) || 85) / 100;
  if (!selUrl) {
    alert('Por favor selecciona o escribe la URL de un archivo de sonido primero.');
    return;
  }
  const snd = new Audio(selUrl);
  snd.volume = vol;
  snd.play().catch(e => alert('No se pudo reproducir: ' + e.message));
}
