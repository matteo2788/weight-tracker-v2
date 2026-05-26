(function () {
  function isMobileWheel() {
    return window.matchMedia('(max-width: 820px)').matches;
  }

  function circularDiff(index, current, total) {
    let diff = index - current;
    diff -= Math.round(diff / total) * total;
    return diff;
  }

  function setupWheel() {
    const viewport = document.querySelector('.stage-scroll');
    const stage = document.querySelector('.stage');
    if (!viewport || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.float-card'));
    if (!cards.length) return;

    if (stage.dataset.wheelReady === 'true') return;
    stage.dataset.wheelReady = 'true';

    const total = cards.length;
    let targetIndex = Math.floor(total / 2);
    let currentIndex = targetIndex;
    let startX = 0;
    let pointerDown = false;
    let activePointerId = null;
    let raf = null;
    let lastMoveTime = 0;

    function clearDesktopInlineStyles() {
      cards.forEach((card) => {
        card.style.removeProperty('width');
        card.style.removeProperty('height');
        card.style.removeProperty('opacity');
        card.style.removeProperty('filter');
        card.style.removeProperty('pointer-events');
        card.style.removeProperty('z-index');
        card.style.removeProperty('transform');
        card.style.removeProperty('background');
        card.style.removeProperty('backdrop-filter');
      });
    }

    function cardWidth(index) {
      const vw = window.innerWidth;
      if (index === 0) return Math.min(vw * 0.86, 342);
      if (index === 5) return Math.min(vw * 0.82, 322);
      return Math.min(vw * 0.80, 316);
    }

    function cardHeight(index) {
      if (index === 0) return 214;
      if (index === 5) return 164;
      return 184;
    }

    function forceSolidBackground(card, index) {
      const text = (card.textContent || '').toLowerCase();
      const isDark = index === 5 || card.className.includes('dark') || text.includes('insight');
      card.style.backdropFilter = 'none';
      card.style.background = isDark ? '#171614' : '#fffaf2';
    }

    function render() {
      if (!isMobileWheel()) {
        clearDesktopInlineStyles();
        return;
      }

      const centerX = viewport.clientWidth / 2;
      const baseY = 18;
      const spacing = Math.min(viewport.clientWidth * 0.66, 268);
      const lift = 74;

      cards.forEach((card, index) => {
        const diff = circularDiff(index, currentIndex, total);
        const abs = Math.abs(diff);
        const w = cardWidth(index);
        const h = cardHeight(index);

        forceSolidBackground(card, index);
        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';

        if (abs > 2.02) {
          card.style.transform = `translate3d(${centerX - w / 2}px, ${baseY + 130}px, 0) scale(.68) rotate(0deg)`;
          card.style.zIndex = '1';
          card.style.opacity = '0';
          card.style.filter = 'none';
          card.style.pointerEvents = 'none';
          return;
        }

        const direction = diff < 0 ? -1 : diff > 0 ? 1 : 0;
        const x = centerX - w / 2 + diff * spacing;
        const y = baseY + Math.pow(abs, 1.55) * lift;
        const rotate = direction * (12 + Math.min(abs, 1.4) * 7);
        const scale = 1 - Math.min(abs * 0.155, 0.34);
        const opacity = abs > 1.25 ? 0.42 : 1;
        const z = Math.round(100 - abs * 25);

        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        card.style.zIndex = String(z);
        card.style.opacity = String(opacity);
        card.style.filter = 'none';
        card.style.pointerEvents = abs > 1.7 ? 'none' : 'auto';
      });
    }

    function normalizeIndexesIfNeeded() {
      if (Math.abs(targetIndex) < total * 4) return;
      const shift = Math.round(targetIndex / total) * total;
      targetIndex -= shift;
      currentIndex -= shift;
    }

    function animate() {
      if (!isMobileWheel()) {
        render();
        raf = null;
        return;
      }

      const diff = targetIndex - currentIndex;
      currentIndex += diff * 0.16;

      if (Math.abs(diff) < 0.002) {
        currentIndex = targetIndex;
        render();
        normalizeIndexesIfNeeded();
        raf = null;
        return;
      }

      render();
      raf = requestAnimationFrame(animate);
    }

    function go(delta) {
      const now = Date.now();
      if (now - lastMoveTime < 190) return;
      lastMoveTime = now;

      // Continuous index fixes the left-wrap sticking bug.
      // Do not modulo here. The render function wraps visually.
      targetIndex += delta;
      if (!raf) raf = requestAnimationFrame(animate);
    }

    viewport.addEventListener('pointerdown', (event) => {
      if (!isMobileWheel()) return;
      pointerDown = true;
      startX = event.clientX;
      activePointerId = event.pointerId;
      try { viewport.setPointerCapture(event.pointerId); } catch (e) {}
    });

    viewport.addEventListener('pointerup', (event) => {
      if (!isMobileWheel() || !pointerDown) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      pointerDown = false;
      activePointerId = null;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 28) go(delta < 0 ? 1 : -1);
    });

    viewport.addEventListener('pointercancel', () => {
      pointerDown = false;
      activePointerId = null;
    });

    viewport.addEventListener('wheel', (event) => {
      if (!isMobileWheel()) return;
      if (Math.abs(event.deltaX) + Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      go((event.deltaX || event.deltaY) > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener('resize', render);
    render();
    setTimeout(render, 300);
    setTimeout(render, 700);
  }

  window.addEventListener('load', setupWheel);
  document.addEventListener('DOMContentLoaded', setupWheel);
  setTimeout(setupWheel, 800);
})();
