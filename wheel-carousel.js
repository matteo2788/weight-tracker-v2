(function () {
  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function isMobileWheel() {
    return window.matchMedia('(max-width: 820px)').matches;
  }

  function setupWheel() {
    const viewport = document.querySelector('.stage-scroll');
    const stage = document.querySelector('.stage');
    if (!viewport || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.float-card'));
    if (!cards.length) return;

    if (stage.dataset.wheelReady === 'true') return;
    stage.dataset.wheelReady = 'true';

    let targetIndex = Math.floor(cards.length / 2);
    let currentIndex = targetIndex;

    let startX = 0;
    let dragging = false;
    let raf = null;

    function clearDesktopInlineStyles() {
      cards.forEach((card) => {
        card.style.removeProperty('width');
        card.style.removeProperty('height');
        card.style.removeProperty('opacity');
        card.style.removeProperty('filter');
        card.style.removeProperty('pointerEvents');
        card.style.removeProperty('zIndex');
        card.style.removeProperty('transform');
      });
    }

    function circularDiff(index, current, total) {
      let diff = index - current;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      return diff;
    }

    function cardWidth(index) {
      const vw = window.innerWidth;
      if (index === 0) return Math.min(vw * 0.82, 326);
      if (index === 5) return Math.min(vw * 0.78, 300);
      return Math.min(vw * 0.72, 286);
    }

    function cardHeight(index) {
      if (index === 0) return 204;
      if (index === 5) return 154;
      return 176;
    }

    function render() {
      if (!isMobileWheel()) {
        clearDesktopInlineStyles();
        return;
      }

      const total = cards.length;
      const centerX = viewport.clientWidth / 2;
      const wheelRadiusX = Math.min(viewport.clientWidth * 0.34, 130);
      const wheelRadiusY = 72;
      const baseY = 18;

      cards.forEach((card, index) => {
        const diff = circularDiff(index, currentIndex, total);

        // Hide really far cards so the wheel stays clean
        if (Math.abs(diff) > 2.4) {
          card.style.opacity = '0';
          card.style.pointerEvents = 'none';
          return;
        }

        const w = cardWidth(index);
        const h = cardHeight(index);

        // Turn diff into an arc angle
        // center = 0, left/right move around the wheel
        const angle = diff * 0.72;

        // Arc positions
        const xOffset = Math.sin(angle) * wheelRadiusX;
        const yOffset = (1 - Math.cos(angle)) * wheelRadiusY;

        // Better wheel feel
        const scale = 1 - Math.min(Math.abs(diff) * 0.12, 0.28);
        const rotate = diff * -13;
        const opacity = 1 - Math.min(Math.abs(diff) * 0.22, 0.55);
        const blur = Math.abs(diff) > 1.7 ? 1.1 : 0;
        const z = Math.round(100 - Math.abs(diff) * 20);

        const x = centerX - w / 2 + xOffset;
        const y = baseY + yOffset;

        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';
        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        card.style.zIndex = String(z);
        card.style.opacity = String(opacity);
        card.style.filter = blur ? `blur(${blur}px)` : 'none';
        card.style.pointerEvents = 'auto';
      });
    }

    function animate() {
      if (!isMobileWheel()) {
        render();
        raf = null;
        return;
      }

      let diff = targetIndex - currentIndex;
      const total = cards.length;

      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;

      currentIndex += diff * 0.16;

      if (Math.abs(diff) < 0.001) {
        currentIndex = targetIndex;
      }

      render();

      if (Math.abs(diff) > 0.001) {
        raf = requestAnimationFrame(animate);
      } else {
        raf = null;
      }
    }

    function go(delta) {
      targetIndex = mod(targetIndex + delta, cards.length);
      if (!raf) raf = requestAnimationFrame(animate);
    }

    viewport.addEventListener(
      'touchstart',
      (event) => {
        if (!isMobileWheel()) return;
        dragging = true;
        startX = event.touches[0].clientX;
      },
      { passive: true }
    );

    viewport.addEventListener(
      'touchend',
      (event) => {
        if (!isMobileWheel() || !dragging) return;
        dragging = false;
        const endX = event.changedTouches[0].clientX;
        const delta = endX - startX;
        if (Math.abs(delta) > 28) go(delta < 0 ? 1 : -1);
      },
      { passive: true }
    );

    viewport.addEventListener('pointerdown', (event) => {
      if (!isMobileWheel()) return;
      dragging = true;
      startX = event.clientX;
    });

    viewport.addEventListener('pointerup', (event) => {
      if (!isMobileWheel() || !dragging) return;
      dragging = false;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 28) go(delta < 0 ? 1 : -1);
    });

    window.addEventListener('resize', () => {
      render();
    });

    render();
    setTimeout(render, 300);
    setTimeout(render, 700);
  }

  window.addEventListener('load', setupWheel);
  document.addEventListener('DOMContentLoaded', setupWheel);
  setTimeout(setupWheel, 800);
})();
