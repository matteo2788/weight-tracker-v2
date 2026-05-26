(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setupWheel() {
    const scroller = document.querySelector('.stage-scroll');
    const stage = document.querySelector('.stage');
    if (!scroller || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.float-card'));
    if (!cards.length) return;

    let raf = null;

    function update() {
      raf = null;
      const scrollerRect = scroller.getBoundingClientRect();
      const center = scrollerRect.left + scrollerRect.width / 2;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const raw = (cardCenter - center) / (rect.width * 0.72);
        const offset = clamp(raw, -1.35, 1.35);
        const abs = Math.min(Math.abs(offset), 1.25);

        card.style.setProperty('--wheel-offset', offset.toFixed(3));
        card.style.setProperty('--wheel-abs', abs.toFixed(3));
      });
    }

    function requestUpdate() {
      if (raf) return;
      raf = requestAnimationFrame(update);
    }

    scroller.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    setTimeout(() => {
      const target = cards[0];
      const scrollTo = target.offsetLeft - (scroller.clientWidth - target.clientWidth) / 2;
      scroller.scrollLeft = Math.max(0, scrollTo);
      update();
    }, 250);

    setTimeout(update, 600);
    update();
  }

  window.addEventListener('load', setupWheel);
  document.addEventListener('DOMContentLoaded', setupWheel);
  setTimeout(setupWheel, 800);
})();
