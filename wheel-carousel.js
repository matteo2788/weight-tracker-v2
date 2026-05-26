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

    if (stage.dataset.wheelMounted === 'true') return;
    stage.dataset.wheelMounted = 'true';

    const total = cards.length;

    // Visual wheel order. This keeps the black Insight card from appearing immediately beside Today.
    // DOM index 0 = Today, 1 = This week, 2 = 30 days, 5 = Insight, 3 = Streak, 4 = Month range.
    const wheelOrder = [0, 1, 2, 5, 3, 4].filter((index) => index < total);
    const orderLength = wheelOrder.length;
    const orderPositionByCard = new Map(wheelOrder.map((cardIndex, orderIndex) => [cardIndex, orderIndex]));

    // Always open on Today / logged weight.
    let position = 0;
    let targetPosition = position;
    let velocity = 0;
    let pointerDown = false;
    let startX = 0;
    let startPosition = position;
    let activePointerId = null;
    let raf = null;
    let lastWheelMove = 0;

    function circularDiff(index, current, totalCount) {
      let diff = index - current;
      diff -= Math.round(diff / totalCount) * totalCount;
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

    function setCard(card, transform, opacity, z, pointer) {
      card.style.setProperty('--wheel-transform', transform);
      card.style.setProperty('--wheel-z', String(z));
      card.style.transform = transform;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(z);
      card.style.pointerEvents = pointer;
    }

    function clearDesktopInlineStyles() {
      stage.classList.remove('wheel-ready');
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

    function normalizePosition() {
      if (Math.abs(position) < orderLength * 2 && Math.abs(targetPosition) < orderLength * 2) return;
      const shift = Math.round(position / orderLength) * orderLength;
      position -= shift;
      targetPosition -= shift;
      startPosition -= shift;
    }

    function render() {
      if (!isMobileWheel()) {
        clearDesktopInlineStyles();
        return;
      }

      normalizePosition();

      const centerX = viewport.clientWidth / 2;
      const centerY = 22;
      const sideX = Math.min(viewport.clientWidth * 0.62, 250);
      const farX = Math.min(viewport.clientWidth * 0.95, 380);
      const size = cardSize();

      cards.forEach((card, index) => {
        const orderedIndex = orderPositionByCard.has(index) ? orderPositionByCard.get(index) : index;
        const diff = circularDiff(orderedIndex, position, orderLength);
        const abs = Math.abs(diff);
        const w = size.width;
        const h = size.height;

        forceSolidBackground(card, index);
        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';
        card.style.minHeight = h + 'px';
        card.style.overflow = 'hidden';
        card.style.transition = 'none';
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
        setCard(card, transform, opacity, z, pointer);
      });

      stage.classList.add('wheel-ready');
    }

    function animateToTarget() {
      if (!isMobileWheel()) {
        render();
        raf = null;
        return;
      }

      const distance = targetPosition - position;
      velocity += distance * 0.10;
      velocity *= 0.72;
      position += velocity;

      if (Math.abs(distance) < 0.001 && Math.abs(velocity) < 0.001) {
        position = targetPosition;
        velocity = 0;
        render();
        raf = null;
        return;
      }

      render();
      raf = requestAnimationFrame(animateToTarget);
    }

    function startAnimation() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(animateToTarget);
    }

    viewport.addEventListener('pointerdown', (event) => {
      if (!isMobileWheel()) return;
      pointerDown = true;
      startX = event.clientX;
      startPosition = position;
      targetPosition = position;
      velocity = 0;
      activePointerId = event.pointerId;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      try { viewport.setPointerCapture(event.pointerId); } catch (e) {}
      render();
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!isMobileWheel() || !pointerDown) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      event.preventDefault();
      const delta = event.clientX - startX;
      const dragDistance = Math.min(viewport.clientWidth * 0.55, 220);
      position = startPosition - delta / dragDistance;
      targetPosition = position;
      velocity = 0;
      render();
    }, { passive: false });

    viewport.addEventListener('pointerup', (event) => {
      if (!isMobileWheel() || !pointerDown) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      pointerDown = false;
      activePointerId = null;
      targetPosition = Math.round(position);
      startAnimation();
    });

    viewport.addEventListener('pointercancel', () => {
      pointerDown = false;
      activePointerId = null;
      targetPosition = Math.round(position);
      startAnimation();
    });

    viewport.addEventListener('wheel', (event) => {
      if (!isMobileWheel()) return;
      if (Math.abs(event.deltaX) + Math.abs(event.deltaY) < 12) return;
      event.preventDefault();
      const now = Date.now();
      if (now - lastWheelMove < 120) return;
      lastWheelMove = now;
      targetPosition = Math.round(targetPosition + ((event.deltaX || event.deltaY) > 0 ? 1 : -1));
      startAnimation();
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
