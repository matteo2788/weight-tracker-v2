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
    let activePointerId = null;
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

    function slotFor(index) {
      let diff = index - active;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      return Math.round(diff);
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

    function render() {
      if (!isMobileWheel()) {
        clearDesktopInlineStyles();
        return;
      }

      const centerX = viewport.clientWidth / 2;
      const centerY = 22;
      const sideX = Math.min(viewport.clientWidth * 0.62, 250);
      const farX = Math.min(viewport.clientWidth * 0.95, 380);
      const size = cardSize();

      cards.forEach((card, index) => {
        const slot = slotFor(index);
        const abs = Math.abs(slot);
        const w = size.width;
        const h = size.height;

        forceSolidBackground(card, index);
        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';
        card.style.minHeight = h + 'px';
        card.style.overflow = 'hidden';
        card.style.transition = 'transform 430ms cubic-bezier(.22,1,.36,1), opacity 260ms ease';
        card.style.filter = 'none';

        let x = centerX - w / 2;
        let y = centerY;
        let scale = 1;
        let rotate = 0;
        let opacity = 1;
        let z = 100;
        let pointer = 'auto';

        if (slot === -1) {
          x = centerX - w / 2 - sideX;
          y = centerY + 82;
          scale = 0.78;
          rotate = -22;
          opacity = 1;
          z = 70;
          pointer = 'none';
        } else if (slot === 1) {
          x = centerX - w / 2 + sideX;
          y = centerY + 82;
          scale = 0.78;
          rotate = 22;
          opacity = 1;
          z = 70;
          pointer = 'none';
        } else if (slot === -2) {
          x = centerX - w / 2 - farX;
          y = centerY + 150;
          scale = 0.62;
          rotate = -34;
          opacity = 0;
          z = 20;
          pointer = 'none';
        } else if (slot === 2) {
          x = centerX - w / 2 + farX;
          y = centerY + 150;
          scale = 0.62;
          rotate = 34;
          opacity = 0;
          z = 20;
          pointer = 'none';
        } else if (abs > 2) {
          x = centerX - w / 2;
          y = centerY + 170;
          scale = 0.55;
          rotate = 0;
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

    function move(delta) {
      const now = Date.now();
      if (now - lastMoveTime < 220) return;
      lastMoveTime = now;
      active = (active + delta + total) % total;
      render();
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
      if (Math.abs(delta) > 28) move(delta < 0 ? 1 : -1);
    });

    viewport.addEventListener('pointercancel', () => {
      pointerDown = false;
      activePointerId = null;
    });

    viewport.addEventListener('wheel', (event) => {
      if (!isMobileWheel()) return;
      if (Math.abs(event.deltaX) + Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      move((event.deltaX || event.deltaY) > 0 ? 1 : -1);
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
