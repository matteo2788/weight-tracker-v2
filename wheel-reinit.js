(function () {
  function mobile() {
    return window.matchMedia('(max-width: 820px)').matches;
  }

  function diff(index, pos, count) {
    let d = index - pos;
    d -= Math.round(d / count) * count;
    return d;
  }

  function setup() {
    if (!mobile()) return;

    const viewport = document.querySelector('.stage-scroll');
    const stage = document.querySelector('.stage');
    if (!viewport || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.float-card'));
    if (!cards.length) return;

    if (stage.dataset.wheelMounted === 'true' || stage.dataset.wheelRescue === 'true') {
      stage.classList.add('wheel-ready');
      return;
    }

    stage.dataset.wheelRescue = 'true';

    const order = [0, 1, 2, 5, 3, 4].filter((i) => i < cards.length);
    const map = new Map(order.map((cardIndex, orderIndex) => [cardIndex, orderIndex]));
    const count = order.length;
    let pos = 0;
    let target = 0;
    let velocity = 0;
    let down = false;
    let startX = 0;
    let startPos = 0;
    let raf = null;

    function place() {
      const cx = viewport.clientWidth / 2;
      const cy = 22;
      const side = Math.min(viewport.clientWidth * 0.62, 250);
      const far = Math.min(viewport.clientWidth * 0.95, 380);
      const w = Math.min(window.innerWidth * 0.82, 326);
      const h = 206;

      cards.forEach((card, i) => {
        const ordered = map.has(i) ? map.get(i) : i;
        const d = diff(ordered, pos, count);
        const a = Math.abs(d);
        const isDark = i === 5 || (card.textContent || '').toLowerCase().includes('insight');

        card.style.width = Math.round(w) + 'px';
        card.style.height = h + 'px';
        card.style.minHeight = h + 'px';
        card.style.overflow = 'hidden';
        card.style.transition = 'none';
        card.style.background = isDark ? '#171614' : '#fffaf2';
        card.style.backdropFilter = 'none';
        card.style.filter = 'none';

        let x, y, scale, rotate, opacity, z, pointer;
        if (a <= 2.15) {
          x = cx - w / 2 + d * side;
          y = cy + Math.pow(a, 1.35) * 82;
          scale = 1 - Math.min(a * 0.22, 0.38);
          rotate = d * 22;
          opacity = a > 1.62 ? Math.max(0, 1 - (a - 1.62) / 0.53) : 1;
          z = Math.round(100 - a * 24);
          pointer = a < 0.45 ? 'auto' : 'none';
        } else {
          const s = d < 0 ? -1 : 1;
          x = cx - w / 2 + s * far;
          y = cy + 170;
          scale = 0.55;
          rotate = s * 34;
          opacity = 0;
          z = 1;
          pointer = 'none';
        }

        const t = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rotate + 'deg) scale(' + scale + ')';
        card.style.setProperty('--wheel-transform', t);
        card.style.setProperty('--wheel-z', String(z));
        card.style.transform = t;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(z);
        card.style.pointerEvents = pointer;
      });

      stage.classList.add('wheel-ready');
    }

    function animate() {
      const distance = target - pos;
      velocity += distance * 0.1;
      velocity *= 0.72;
      pos += velocity;
      place();
      if (Math.abs(distance) < 0.001 && Math.abs(velocity) < 0.001) {
        pos = target;
        velocity = 0;
        place();
        raf = null;
        return;
      }
      raf = requestAnimationFrame(animate);
    }

    function startAnim() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(animate);
    }

    viewport.addEventListener('pointerdown', function (e) {
      down = true;
      startX = e.clientX;
      startPos = pos;
      target = pos;
      velocity = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!down) return;
      e.preventDefault();
      const dist = Math.min(viewport.clientWidth * 0.55, 220);
      pos = startPos - (e.clientX - startX) / dist;
      target = pos;
      velocity = 0;
      place();
    }, { passive: false });

    viewport.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      target = Math.round(pos);
      startAnim();
    });

    viewport.addEventListener('pointercancel', function () {
      down = false;
      target = Math.round(pos);
      startAnim();
    });

    window.addEventListener('resize', place);
    place();
  }

  function runSoon() {
    setup();
    setTimeout(setup, 80);
    setTimeout(setup, 300);
  }

  document.addEventListener('click', function () {
    setTimeout(runSoon, 120);
  });

  new MutationObserver(runSoon).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', runSoon);
  document.addEventListener('DOMContentLoaded', runSoon);
  setTimeout(runSoon, 800);
})();
