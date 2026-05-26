(function () {
  function isMobileWheel() {
    return window.matchMedia('(max-width: 820px)').matches;
  }

  function nearestCircularDiff(index, current, total) {
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

    // Start with the middle card centered. This stays continuous forever,
    // so looping from last card back to first card does not jump/glitch.
    let targetIndex = Math.floor(total / 2);
    let currentIndex = targetIndex;
    let velocity = 0;
    let raf = null;

    let pointerDown = false;
    let startX = 0;
    let activePointerId = null;
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
      const baseY = 12;
      const wheelRadiusX = Math.min(viewport.clientWidth * 0.86, 335);
      const wheelRadiusY = 118;
      const maxVisible = 1.72;

      cards.forEach((card, index) => {
        const diff = nearestCircularDiff(index, currentIndex, total);
        const abs = Math.abs(diff);
        const w = cardWidth(index);
        const h = cardHeight(index);

        forceSolidBackground(card, index);
        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';

        // Far cards are hidden completely. Only the centered card and side peeks show.
        if (abs > maxVisible) {
          const hiddenX = centerX - w / 2 + Math.sign(diff || 1) * viewport.clientWidth * 0.85;
          card.style.transform = `translate3d(${hiddenX}px, ${baseY + 150}px, 0) rotate(${Math.sign(diff || 1) * 22}deg) scale(.64)`;
          card.style.zIndex = '1';
          card.style.opacity = '0';
          card.style.filter = 'none';
          card.style.pointerEvents = 'none';
          return;
        }

        // Real arc math: cards travel around a lower half-wheel.
        const angle = diff * 0.92;
        const xOffset = Math.sin(angle) * wheelRadiusX;
        const yOffset = (1 - Math.cos(angle)) * wheelRadiusY + Math.pow(abs, 1.7) * 14;

        const scale = 1 - Math.min(abs * 0.18, 0.34);
        const rotate = diff * 18;

        // Center and near cards stay solid. Only almost-hidden cards fade.
        let opacity = 1;
        if (abs > 1.22) opacity = Math.max(0, 1 - (abs - 1.22) / 0.5);

        const z = Math.round(100 - abs * 30);
        const x = centerX - w / 2 + xOffset;
        const y = baseY + yOffset;

        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        card.style.zIndex = String(z);
        card.style.opacity = String(opacity);
        card.style.filter = 'none';
        card.style.pointerEvents = abs < 0.55 ? 'auto' : 'none';
      });
    }

    function normalizeWhenResting() {
      if (Math.abs(targetIndex) < total * 3) return;
      const shift = Math.floor(targetIndex / total) * total;
      targetIndex -= shift;
      currentIndex -= shift;
    }

    function animate() {
      if (!isMobileWheel()) {
        render();
        raf = null;
        return;
      }

      const distance = targetIndex - currentIndex;

      // Smooth spring animation: less snap, less flicker, cleaner lap-around.
      velocity += distance * 0.075;
      velocity *= 0.78;
      currentIndex += velocity;

      if (Math.abs(distance) < 0.0015 && Math.abs(velocity) < 0.0015) {
        currentIndex = targetIndex;
        velocity = 0;
        render();
        normalizeWhenResting();
        raf = null;
        return;
      }

      render();
      raf = requestAnimationFrame(animate);
    }

    function go(delta) {
      const now = Date.now();
      if (now - lastMoveTime < 160) return;
      lastMoveTime = now;

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
      const delta = event.clientX - startX;
      activePointerId = null;

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
