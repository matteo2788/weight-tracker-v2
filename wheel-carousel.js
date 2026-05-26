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
        card.style.removeProperty('pointer-events');
        card.style.removeProperty('z-index');
        card.style.removeProperty('transform');
        card.style.removeProperty('background');
        card.style.removeProperty('backdrop-filter');
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
      const isDark = index === 5 || card.className.includes('dark') || card.textContent.toLowerCase().includes('insight');
      card.style.backdropFilter = 'none';
      if (isDark) card.style.background = '#171614';
      else card.style.background = '#fffaf2';
    }

    function render() {
      if (!isMobileWheel()) {
        clearDesktopInlineStyles();
        return;
      }

      const total = cards.length;
      const centerX = viewport.clientWidth / 2;
      const baseY = 18;
      const spacing = Math.min(viewport.clientWidth * 0.66, 268);
      const lift = 74;

      cards.forEach((card, index) => {
        const diff = circularDiff(index, currentIndex, total);
        const abs = Math.abs(diff);
        const roundedAbs = Math.round(abs * 1000) / 1000;
        const w = cardWidth(index);
        const h = cardHeight(index);

        forceSolidBackground(card, index);
        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';

        if (roundedAbs > 2.02) {
          card.style.transform = `translate3d(${centerX - w / 2}px, ${baseY + 130}px, 0) scale(.68) rotate(0deg)`;
          card.style.zIndex = '1';
          card.style.opacity = '0';
          card.style.filter = 'none';
          card.style.pointerEvents = 'none';
          return;
        }

        const direction = diff < 0 ? -1 : diff > 0 ? 1 : 0;
        const sidePower = Math.min(abs, 1.35);
        const x = centerX - w / 2 + diff * spacing;
        const y = baseY + Math.pow(abs, 1.55) * lift;
        const rotate = direction * (12 + Math.min(abs, 1.4) * 7);
        const scale = 1 - Math.min(abs * 0.155, 0.34);

        let opacity = 1;
        if (abs > 1.25) opacity = 0.42;
        else opacity = 1;

        const z = Math.round(100 - abs * 25);

        card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
        card.style.zIndex = String(z);
        card.style.opacity = String(opacity);
        card.style.filter = 'none';
        card.style.pointerEvents = abs > 1.7 ? 'none' : 'auto';
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

      currentIndex += diff * 0.18;
      if (Math.abs(diff) < 0.002) currentIndex = targetIndex;

      render();

      if (Math.abs(diff) > 0.002) raf = requestAnimationFrame(animate);
      else raf = null;
    }

    function go(delta) {
      targetIndex = mod(targetIndex + delta, cards.length);
      if (!raf) raf = requestAnimationFrame(animate);
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
      if (Math.abs(delta) > 26) go(delta < 0 ? 1 : -1);
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
      if (Math.abs(delta) > 26) go(delta < 0 ? 1 : -1);
    });

    viewport.addEventListener('wheel', (event) => {
      if (!isMobileWheel()) return;
      if (Math.abs(event.deltaX) + Math.abs(event.deltaY) < 10) return;
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
