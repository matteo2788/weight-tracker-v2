(function () {
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

    const total = cards.length;
    let active = Math.floor(total / 2);
    let pointerDown = false;
    let startX = 0;
    let currentX = 0;
    let activePointerId = null;
    let dragOffset = 0;
    let raf = null;
    let lastMoveTime = 0;

    function clearDesktopInlineStyles() {
      cards.forEach((card) => {
        card.style.removeProperty('width');
        card.style.removeProperty('height');
        card.style.removeProperty('min-height');
        card.style.removeProperty('overflow');
        card.style.removeProperty('opacity');
        card.style.removeProperty('filter');
        card.style.removeProperty('pointer-events');
        card.style.removeProperty('z-index');
        card.style.removeProperty('--wheel-z');
        card.style.removeProperty('transform');
        card.style.removeProperty('--wheel-transform');
        card.style.removeProperty('background');
        card.style.removeProperty('backdrop-filter');
        card.style.removeProperty('transition');
      });
    }

    function circularDiff(index, current, total) {
      let diff = index - current;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      return diff;
    }

    function cardSize() {
      const vw = window.innerWidth;
      return {
        width: Math.min(vw * 0.82, 326),
        height: 206
      };
    }

    function forceSolidBackground(card, index) {
      const text = (card.textContent || '').toLowerCase();
      const isDark = index === 5 || card.className.includes('dark') || text.includes('insight');
      card.style.backdropFilter = 'none';
      card.style.background = isDark ? '#171614' : '#fffaf2';
    }

    function applyTransform(card, transform) {
      card.style.setProperty('--wheel-transform', transform);
      card.style.transform = transform;
    }

    function applyZ(card, z) {
      card.style.setProperty('--wheel-z', String(z));
      card.style.zIndex = String(z);
    }

    function requestRender(isDragging) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        render(isDragging);
      });
    }

    function render(isDragging) {
      if (!isMobileWheel()) {
        clearDesktopInlineStyles();
        return;
      }

      const centerX = viewport.clientWidth / 2;
      const centerY = 22;
      const sideX = Math.min(viewport.clientWidth * 0.62, 250);
      const farX = Math.min(viewport.clientWidth * 0.95, 380);
      const size = cardSize();
      const displayIndex = active + dragOffset;

      cards.forEach((card, index) => {
        const diff = circularDiff(index, displayIndex, total);
        const abs = Math.abs(diff);
        const w = size.width;
        const h = size.height;

        forceSolidBackground(card, index);
        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';
        card.style.minHeight = h + 'px';
        card.style.overflow = 'hidden';
        card.style.transition = isDragging
          ? 'none'
          : 'transform 260ms cubic-bezier(.2,.9,.25,1), opacity 200ms ease';
        card.style.filter = 'none';

        let x;
        let y;
        let scale;
        let rotate;
        let opacity;
        let z;
        let pointer;

        if (abs <= 2.15) {
          x = centerX - w / 2 + diff * sideX;
          y = centerY + Math.pow(abs, 1.35) * 82;
          scale = 1 - Math.min(abs * 0.22, 0.38);
          rotate = diff * 22;
          opacity = abs > 1.62 ? Math.max(0, 1 - (abs - 1.62) / 0.53) : 1;
          z = Math.round(100 - abs * 24);
          pointer = abs < 0.45 ? 'auto' : 'none';
        } else {
          const side = diff < 0 ? -1 : 1;
          x = centerX - w / 2 + side * farX;
          y = centerY + 170;
          scale = 0.55;
          rotate = side * 34;
          opacity = 0;
          z = 1;
          pointer = 'none';
        }

        const transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        applyTransform(card, transform);
        card.style.opacity = String(opacity);
        applyZ(card, z);
        card.style.pointerEvents = pointer;
      });
    }

    function settle(moveBy) {
      const now = Date.now();
      if (now - lastMoveTime < 45) return;
      lastMoveTime = now;

      active = ((active + moveBy) % total + total) % total;
      dragOffset = 0;
      render(false);
    }

    viewport.addEventListener('pointerdown', (event) => {
      if (!isMobileWheel()) return;
      pointerDown = true;
      startX = event.clientX;
      currentX = event.clientX;
      dragOffset = 0;
      activePointerId = event.pointerId;
      try { viewport.setPointerCapture(event.pointerId); } catch (e) {}
      render(true);
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!isMobileWheel() || !pointerDown) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      event.preventDefault();
      currentX = event.clientX;
      const delta = currentX - startX;
      const dragDistance = Math.min(viewport.clientWidth * 0.55, 220);

      // Continuous drag: no magnetic clamp while your finger is moving.
      dragOffset = -delta / dragDistance;
      requestRender(true);
    }, { passive: false });

    viewport.addEventListener('pointerup', (event) => {
      if (!isMobileWheel() || !pointerDown) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      pointerDown = false;
      activePointerId = null;
      const delta = event.clientX - startX;
      const dragDistance = Math.min(viewport.clientWidth * 0.55, 220);
      const rawOffset = -delta / dragDistance;
      const moveBy = Math.abs(rawOffset) > 0.18 || Math.abs(delta) > 34
        ? Math.round(rawOffset)
        : 0;
      dragOffset = 0;
      settle(moveBy);
    });

    viewport.addEventListener('pointercancel', () => {
      pointerDown = false;
      activePointerId = null;
      dragOffset = 0;
      render(false);
    });

    viewport.addEventListener('wheel', (event) => {
      if (!isMobileWheel()) return;
      if (Math.abs(event.deltaX) + Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      settle((event.deltaX || event.deltaY) > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener('resize', () => render(false));
    render(false);
    setTimeout(() => render(false), 300);
    setTimeout(() => render(false), 700);
  }

  window.addEventListener('load', setupWheel);
  document.addEventListener('DOMContentLoaded', setupWheel);
  setTimeout(setupWheel, 800);
})();
