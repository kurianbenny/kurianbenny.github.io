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

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  const firstLink = nav.querySelector('.nav-link');

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen && firstLink) {
      firstLink.focus();
    }
  });

  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav();
      toggle.focus();
    }
  });
}

function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const targets = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(target => observer.observe(target));
}

function initParallaxBackground() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add(
    '(prefers-reduced-motion: no-preference) and (min-width: 768px)',
    () => {
      const blobs = document.querySelectorAll('.ambient-blob');
      blobs.forEach((blob) => {
        const speed = parseFloat(blob.dataset.speed) || 0.3;
        gsap.to(blob, {
          y: () => window.innerHeight * speed * 4,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        });
      });
    }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSmoothScrollNav();
  initMobileNav();
  initScrollReveal();
  initParallaxBackground();
});
