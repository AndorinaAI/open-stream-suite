/**
 * app/alerts/js/overlay/02-particle-engine.js
 * Motor de Partículas para Explosión de Emoticonos y Celebraciones en el Lienzo Canvas.
 */

window.ParticleEngine = {
  canvas: null,
  ctx: null,
  particles: [],
  isRunning: false,
  init() {
    this.canvas = document.getElementById('fx-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },
  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth || 1920;
    this.canvas.height = window.innerHeight || 1080;
  },
  explode(emoji = '🎉', count = 45) {
    this.init();
    if (!this.canvas || !this.ctx) return;
    const startX = this.canvas.width / 2;
    const startY = this.canvas.height / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 18 + 6;
      this.particles.push({
        x: startX + (Math.random() - 0.5) * 100,
        y: startY + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        gravity: 0.38,
        size: Math.random() * 26 + 32,
        emoji: emoji,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 14,
        alpha: 1,
        decay: Math.random() * 0.012 + 0.008
      });
    }
    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  },
  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.canvas.height + 60) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.font = `${p.size}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(p.emoji, 0, 0);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.isRunning = false;
    }
  }
};
