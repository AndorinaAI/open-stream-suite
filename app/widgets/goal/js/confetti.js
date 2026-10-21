// widgets/goal/js/confetti.js - Motor Canvas de física de confeti de celebración

window.GoalConfetti = (function() {
  let confettiCanvas = null;
  let confettiCtx = null;
  let confettiParticles = [];
  let confettiAnimId = null;

  function init() {
    confettiCanvas = document.getElementById('goal-confetti-canvas');
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);
  }

  function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = confettiCanvas.parentElement?.clientWidth || 520;
    confettiCanvas.height = confettiCanvas.parentElement?.clientHeight || 120;
  }

  function triggerBurst() {
    if (!confettiCanvas) init();
    if (!confettiCanvas || !confettiCtx) return;
    resizeConfetti();
    confettiParticles = [];
    const colors = ['#57D6C4', '#38BDF8', '#F59E0B', '#EC4899', '#A855F7', '#10B981', '#FFFFFF'];
    const total = 65;

    for (let i = 0; i < total; i++) {
      confettiParticles.push({
        x: confettiCanvas.width / 2 + (Math.random() * 60 - 30),
        y: confettiCanvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.85) * 14,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.01
      });
    }

    if (!confettiAnimId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    if (!confettiCtx || !confettiCanvas) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    for (let p of confettiParticles) {
      if (p.alpha > 0.01) {
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.globalAlpha = Math.max(0, p.alpha);
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        confettiCtx.restore();
      }
    }

    if (alive) {
      confettiAnimId = requestAnimationFrame(animateConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiAnimId = null;
    }
  }

  return {
    init,
    triggerBurst,
    resizeConfetti
  };
})();
