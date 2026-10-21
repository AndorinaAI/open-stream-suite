/**
 * particles.js — Motor de explosión de partículas 2D para chat en vivo
 * Simula física con gravedad, rotación, desvanecimiento y soporte de emojis e imágenes.
 */
window.ParticleEngine = {
  canvas: null,
  ctx: null,
  particles: [],
  isRunning: false,

  init(canvasId = 'particle-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  explode(emoteSrcOrEmoji, count = 35) {
    if (!this.canvas || !this.ctx) return;
    const rawStr = String(emoteSrcOrEmoji || '🎉');
    const isImage = rawStr.startsWith('http');
    let img = null;
    if (isImage) {
      img = new Image();
      img.src = rawStr;
    }

    const emojiList = isImage ? [] : rawStr.split(',').map(e => e.trim()).filter(Boolean);
    const startX = window.innerWidth * 0.5;
    const startY = window.innerHeight * 0.6;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 6;
      const pickedEmoji = isImage ? null : (emojiList.length ? emojiList[Math.floor(Math.random() * emojiList.length)] : '🎉');
      this.particles.push({
        isImage,
        img,
        emoji: pickedEmoji,
        x: startX + (Math.random() - 0.5) * 120,
        y: startY + (Math.random() - 0.5) * 120,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        gravity: 0.35,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        size: Math.random() * 20 + 28,
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

      if (p.isImage && p.img && p.img.complete) {
        this.ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        this.ctx.font = `${p.size}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(p.emoji, 0, 0);
      }
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.isRunning = false;
    }
  }
};
