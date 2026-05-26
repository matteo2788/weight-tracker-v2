(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

    let active = 0;
    let startX = 0;
    let dragging = false;

    function clearDesktopInlineStyles() {
      cards.forEach((card) => {
        card.style.removeProperty('width');
        card.style.removeProperty('height');
        card.style.removeProperty('opacity');
        card.style.removeProperty('filter');
        card.style.removeProperty('pointer-events');
        card.style.removeProperty('z-index');
        card.style.removeProperty('transform');
      });
    }

    function cardWidth(index) {
      const vw = window.innerWidth;
      if (index === 0) return Math.min(vw * 0.82, 326);
      if (index === 5) return Math.min(vw * 0.78, 305);
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

      const centerX = viewport.clientWidth / 2;
      const baseY = 18;

      cards.forEach((card, index) => {
        const diff = clamp(index - active, -3, 3);
        const abs = Math.abs(diff);
        const w = cardWidth(index);
        const h = cardHeight(index);

        const x = centerX - w / 2 + diff * 108;
        const y = baseY + abs * 42 + Math.pow(abs, 2) * 7;
        const scale = 1 - Math.min(abs * 0.105, 0.30);
        const rotate = diff * -8;
        const opacity = abs > 2.35 ? 0.28 : abs > 1.8 ? 0.58 : 1;
        const blur = abs > 2.1 ? 1.2 : 0;
        const z = Math.round(100 - abs * 18);

        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';
        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        card.style.zIndex = String(z);
        card.style.opacity = String(opacity);
        card.style.filter = blur ? `blur(${blur}px)` : 'none';
        card.style.pointerEvents = abs > 2.3 ? 'none' : 'auto';
      });
    }

    function move(delta) {
      active = clamp(active + delta, 0, cards.length - 1);
      render();
    }

    viewport.addEventListener('touchstart', (event) => {
      if (!isMobileWheel()) return;
      dragging = true;
      startX = event.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', (event) => {
      if (!isMobileWheel() || !dragging) return;
      dragging = false;
      const endX = event.changedTouches[0].clientX;
      const delta = endX - startX;
      if (Math.abs(delta) > 34) move(delta < 0 ? 1 : -1);
    }, { passive: true });

    viewport.addEventListener('pointerdown', (event) => {
      if (!isMobileWheel()) return;
      dragging = true;
      startX = event.clientX;
    });

    viewport.addEventListener('pointerup', (event) => {
      if (!isMobileWheel() || !dragging) return;
      dragging = false;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 34) move(delta < 0 ? 1 : -1);
    });

    viewport.addEventListener('wheel', (event) => {
      if (!isMobileWheel()) return;
      if (Math.abs(event.deltaX) + Math.abs(event.deltaY) < 10) return;
      event.preventDefault();
      move((event.deltaX || event.deltaY) > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener('resize', render);
    render();
    setTimeout(render, 400);
    setTimeout(render, 900);
  }

  window.addEventListener('load', setupWheel);
  document.addEventListener('DOMContentLoaded', setupWheel);
  setTimeout(setupWheel, 800);
})();
