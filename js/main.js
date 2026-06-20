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

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
});
