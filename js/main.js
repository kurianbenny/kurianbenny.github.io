function initThemeToggle() {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');

  if (stored === 'light' || stored === 'dark') {
    root.dataset.theme = stored;
  }

  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
  });
}

function initSmoothScrollNav() {
  const links = document.querySelectorAll('.nav-link');
  const sections = Array.from(links).map(link =>
    document.getElementById(link.dataset.section)
  );

  const setActive = (id) => {
    links.forEach(link => {
      link.classList.toggle('is-active', link.dataset.section === id);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    if (visible.length > 0) {
      setActive(visible[0].target.id);
    }
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(section => observer.observe(section));
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSmoothScrollNav();
});
