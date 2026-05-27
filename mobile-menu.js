(function () {
  function loadMobileModalPolish() {
    if (document.querySelector('link[href="log-modal-mobile-polish.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'log-modal-mobile-polish.css';
    document.head.appendChild(link);
  }

  function setupMobileMenu() {
    loadMobileModalPolish();
    if (document.querySelector('.mobile-clean-menu-button')) return;

    const homeButton = document.createElement('button');
    homeButton.className = 'mobile-clean-home-button';
    homeButton.type = 'button';
    homeButton.setAttribute('aria-label', 'Go to dashboard');
    homeButton.textContent = 'Drift';

    const button = document.createElement('button');
    button.className = 'mobile-clean-menu-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open menu');
    button.textContent = 'v';

    const menu = document.createElement('div');
    menu.className = 'mobile-clean-menu';
    menu.innerHTML = `
      <button type="button" data-screen="dashboard">Dashboard <span>-></span></button>
      <button type="button" data-screen="trends">Trends <span>-></span></button>
      <button type="button" data-screen="goals">Goals <span>-></span></button>
      <button type="button" data-screen="history">History <span>-></span></button>
      <button type="button" data-screen="insights">Insights <span>-></span></button>
      <button type="button" data-screen="settings">Settings <span>-></span></button>
    `;

    document.body.appendChild(homeButton);
    document.body.appendChild(button);
    document.body.appendChild(menu);

    function closeMenu() {
      document.body.classList.remove('mobile-menu-open');
      button.textContent = 'v';
      button.setAttribute('aria-label', 'Open menu');
    }

    function openMenu() {
      document.body.classList.add('mobile-menu-open');
      button.textContent = 'x';
      button.setAttribute('aria-label', 'Close menu');
    }

    function goToScreen(target) {
      closeMenu();
      const existingButton = Array.from(document.querySelectorAll('button, a')).find(function (el) {
        return (el.textContent || '').trim().toLowerCase() === target;
      });

      if (existingButton && typeof existingButton.click === 'function') {
        existingButton.click();
      }
    }

    homeButton.addEventListener('click', function () {
      goToScreen('dashboard');
    });

    button.addEventListener('click', function () {
      if (document.body.classList.contains('mobile-menu-open')) closeMenu();
      else openMenu();
    });

    menu.addEventListener('click', function (event) {
      const item = event.target.closest('[data-screen]');
      if (!item) return;
      goToScreen(item.getAttribute('data-screen'));
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  }

  window.addEventListener('load', setupMobileMenu);
  document.addEventListener('DOMContentLoaded', setupMobileMenu);
  setTimeout(setupMobileMenu, 800);
})();