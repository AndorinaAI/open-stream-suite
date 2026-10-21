// app/common/audio-synth.js — Sintetizador Web Audio API compartido sin dependencias externas
// Proporciona generación de tonos puros y fanfarrias sintéticas para widgets, alertas y panel.

(function (window) {
  'use strict';

  let _sharedCtx = null;

  function getAudioContext() {
    if (!_sharedCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        _sharedCtx = new AudioCtx();
      }
    }
    if (_sharedCtx && _sharedCtx.state === 'suspended') {
      _sharedCtx.resume().catch(() => {});
    }
    return _sharedCtx;
  }

  const SoundSynth = {
    playTone(soundType = 'bell', volume = 0.3) {
      if (soundType === 'none' || soundType === 'silent') return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(Math.min(1.0, Math.max(0.01, volume)), now);
        masterGain.connect(ctx.destination);

        if (soundType === 'bell') {
          // Campana limpia armónica
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(880, now);
          osc2.frequency.setValueAtTime(1760, now);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.2);
          osc2.stop(now + 1.2);

        } else if (soundType === 'beep_digital') {
          // Doble beep neón tech
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1046.5, now);
          osc.frequency.setValueAtTime(1318.5, now + 0.12);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.35);

        } else if (soundType === 'coin') {
          // Moneda retro 8-Bit
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(987.77, now);
          osc.frequency.setValueAtTime(1318.51, now + 0.08);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.45);

        } else if (soundType === 'victory') {
          // Fanfarria victoria
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.25, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.4);
          });

        } else if (soundType === 'boom') {
          // Bajo punch profundo
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.65);

        } else if (soundType === 'retro_pulse') {
          // Alarma retro pulsante
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(880, now + 0.25);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.5);

        } else if (soundType === 'pop') {
          // Pop sutil de chat
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.1);
        }
      } catch (err) {
        // Ignorar excepciones de audio en navegadores sin interacción de usuario
      }
    }
  };

  window.SoundSynth = SoundSynth;
})(window);
