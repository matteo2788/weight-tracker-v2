(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isMobileWheel() {
    return window.matchMedia('(max-width: 820px)').matches;
  }

  function setupWheel() {
    const scroller = document.querySelector('.stage-scroll');
    const stage = document.querySelector('.stage');
    if (!scroller || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.float-card'));
    if (!cards.length) return;

    let raf = null;
    const step = 170;
    const centerBase = 520;

    function setCardSizes() {
      if (!isMobileWheel()) {
        cards.forEach((card) => {
          card.style.removeProperty('width');
          card.style.removeProperty('height');
          card.style.removeProperty('opacity');
          card.style.removeProperty('pointer-events');
          card.style.removeProperty('z-index');
          card.style.removeProperty('transform');
        });
        return;
      }

      cards.forEach((card, index) => {
        const isToday = index === 0;
        const isInsight = index === 5;
        const w = isToday ? Math.min(window.innerWidth * 0.82, 320) : Math.min(window.innerWidth * 0.72, 280);
        card.style.width = Math.round(w) + 'px';
        card.style.height = isInsight ? '150px' : isToday ? '202px' : '172px';
      });
    }

    function update() {
      raf = null;
      setCardSizes();

      if (!isMobileWheel()) return;

      const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
      const active = (viewportCenter - centerBase) / step;

      cards.forEach((card, index) => {
        const diff = clamp(index - active, -2.6, 2.6);
        const abs = Math.abs(diff);
        const width = card.offsetWidth || 280;
        const height = card.offsetHeight || 172;

        const x = centerBase + diff * 155 - width / 2;
        const y = 28 + abs * 42 + Math.pow(abs, 2) * 10;
        const rot = diff * -9;
        const scale = 1 - Math.min(abs * 0.12, 0.28);
        const opacity = abs > 2.25 ? 0.58 : 1;
        const z = Math.round(100 - abs * 20);

        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`;
        card.style.zIndex = String(z);
        card.style.opacity = String(opacity);
        card.style.pointerEvents = abs > 2.35 ? 'none' : 'auto';
      });
    }

    function requestUpdate() {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }

    scroller.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    setTimeout(() => {
      if (!isMobileWheel()) return;
      scroller.scrollLeft = centerBase - scroller.clientWidth / 2;
      update();
    }, 250);

    setTimeout(update, 600);
    update();
  }

  window.addEventListener('load', setupWheel);
  document.addEventListener('DOMContentLoaded', setupWheel);
  setTimeout(setupWheel, 800);
})();
