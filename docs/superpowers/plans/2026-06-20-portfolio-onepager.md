# One-Page Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page personal portfolio (`index.html` + `css/style.css` + `js/main.js`) from the content in `README.md`, with no frameworks, no build step, and no external JS libraries.

**Architecture:** One static HTML document with seven anchor-linked sections (Hero, About/Experience, Skills, Projects, Services, Contact). One CSS file using custom properties for a dark-default/light-toggle theme. One JS file with four independent init functions (theme toggle, smooth-scroll nav, mobile nav, scroll-reveal), wired up on `DOMContentLoaded`.

**Tech Stack:** Plain HTML5, CSS3 (custom properties, flexbox/grid), vanilla JS (`IntersectionObserver`, `localStorage`). Google Fonts (Space Grotesk + Archivo) is the only external dependency.

## Global Constraints

- No CSS/JS frameworks, no build tooling, no `package.json`, no bundler — files are served as-is.
- Single `css/style.css` and single `js/main.js`; no additional JS files or inline `<script>` blocks beyond the one `src="js/main.js"` tag.
- Only external network dependency: the Google Fonts stylesheet link.
- Dark theme is default; light theme is a toggle, persisted in `localStorage` under key `"theme"`.
- Color tokens (exact values, both themes) — defined once in Task 1, used verbatim everywhere:
  - Dark: `--color-background:#0F172A; --color-surface:#1E293B; --color-surface-alt:#334155; --color-text:#F8FAFC; --color-text-muted:#94A3B8; --color-border:#475569; --color-accent:#22C55E;`
  - Light (`[data-theme="light"]`): `--color-background:#F8FAFC; --color-surface:#FFFFFF; --color-surface-alt:#E2E8F0; --color-text:#0F172A; --color-text-muted:#475569; --color-border:#CBD5E1; --color-accent:#16A34A;`
- Typography: headings use `Space Grotesk`, body uses `Archivo`, loaded with `font-display: swap`. Type scale: 12/14/16/18/24/32/48px.
- Breakpoints: 375px (base/mobile), 768px (tablet), 1024px (desktop), 1440px (wide). Max content width: 1100px. Spacing scale: multiples of 8px.
- All interactive elements ≥44×44px touch target, visible `:focus-visible` ring using `--color-accent`.
- Respect `prefers-reduced-motion: reduce` — no scroll-reveal animation or transitions when set.
- Featured Projects are descriptive cards only — no `<a href>` links on project cards.
- No resume download button or broken links anywhere in the markup.

---

## File Structure

```
index.html              All markup, all 7 sections, single page
css/style.css           Reset, theme variables, layout, components — single file
js/main.js              initThemeToggle(), initSmoothScrollNav(), initMobileNav(), initScrollReveal()
assets/images/.gitkeep  Placeholder dir for the profile photo (added later by user)
```

## Shared Naming Reference (used across tasks — keep consistent)

- Section ids: `#hero`, `#about`, `#skills`, `#projects`, `#services`, `#contact`
- Skip link: `<a href="#main-content" class="skip-link">` / `<main id="main-content">`
- Nav: `<nav id="primary-nav">` containing `<a class="nav-link" data-section="hero" href="#hero">` (one per section, `data-section` matches the section id)
- Theme toggle button: `<button id="theme-toggle" type="button" aria-label="Toggle color theme">`
- Mobile menu toggle: `<button id="nav-toggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false">`
- Mobile menu open state: class `is-open` added to `#primary-nav`
- Active nav link state: class `is-active` added to the matching `.nav-link`
- Scroll-reveal: class `reveal` on each `<section>`, JS adds `is-visible` when intersecting
- `<html>` gets `data-theme="dark"` or `data-theme="light"`; `localStorage` key `"theme"`

---

### Task 1: Document skeleton, theme tokens, nav/footer chrome, base CSS

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `assets/images/.gitkeep`

**Interfaces:**
- Produces: section ids `#hero #about #skills #projects #services #contact` referenced as empty `<section>` placeholders with real heading text but no body content yet (filled by Tasks 2–6); `#primary-nav`, `#theme-toggle`, `#nav-toggle` buttons (unwired, no JS yet); CSS custom properties listed in Global Constraints, available to every later task.
- Consumes: nothing (first task).

- [ ] **Step 1: Create the HTML skeleton**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kurian Benny — Full-Stack Developer & Cloud Engineer</title>
  <meta name="description" content="Full-Stack Developer and Cloud Engineer with 12+ years of experience in PHP, Python, JavaScript, Laravel, Django, React, AWS, Azure, and DevOps.">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230F172A'/%3E%3Ctext x='32' y='42' font-size='28' font-family='sans-serif' font-weight='700' fill='%2322C55E' text-anchor='middle'%3EKB%3C/text%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header class="site-header">
    <div class="container site-header__inner">
      <a href="#hero" class="brand">Kurian Benny</a>
      <nav id="primary-nav" class="nav">
        <a class="nav-link" data-section="hero" href="#hero">Home</a>
        <a class="nav-link" data-section="about" href="#about">About</a>
        <a class="nav-link" data-section="skills" href="#skills">Skills</a>
        <a class="nav-link" data-section="projects" href="#projects">Projects</a>
        <a class="nav-link" data-section="services" href="#services">Services</a>
        <a class="nav-link" data-section="contact" href="#contact">Contact</a>
      </nav>
      <div class="header-actions">
        <button id="theme-toggle" type="button" aria-label="Toggle color theme">
          <svg class="icon icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="icon icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </button>
        <button id="nav-toggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false">
          <svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>
  </header>

  <main id="main-content">
    <section id="hero" class="section hero reveal"></section>
    <section id="about" class="section about reveal"></section>
    <section id="skills" class="section skills reveal"></section>
    <section id="projects" class="section projects reveal"></section>
    <section id="services" class="section services reveal"></section>
    <section id="contact" class="section contact reveal"></section>
  </main>

  <footer class="site-footer">
    <div class="container site-footer__inner">
      <p>&copy; 2026 Kurian Benny. All rights reserved.</p>
    </div>
  </footer>

  <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `assets/images/.gitkeep`**

```bash
mkdir -p assets/images && touch assets/images/.gitkeep
```

- [ ] **Step 3: Create the base CSS — reset, theme tokens, layout primitives, header/footer/nav**

Create `css/style.css`:

```css
/* ---------- Reset ---------- */
*, *::before, *::after { box-sizing: border-box; }
html, body, h1, h2, h3, p, ul, figure { margin: 0; }
ul { padding: 0; list-style: none; }
img { max-width: 100%; display: block; }
button { font: inherit; background: none; border: none; cursor: pointer; color: inherit; }
a { color: inherit; text-decoration: none; }

/* ---------- Theme tokens ---------- */
:root {
  --color-background: #0F172A;
  --color-surface: #1E293B;
  --color-surface-alt: #334155;
  --color-text: #F8FAFC;
  --color-text-muted: #94A3B8;
  --color-border: #475569;
  --color-accent: #22C55E;

  --font-heading: "Space Grotesk", system-ui, sans-serif;
  --font-body: "Archivo", system-ui, sans-serif;

  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-8: 64px;

  --max-width: 1100px;
}

[data-theme="light"] {
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-alt: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-border: #CBD5E1;
  --color-accent: #16A34A;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}

/* ---------- Base ---------- */
body {
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  transition: background-color 200ms ease, color 200ms ease;
}

h1, h2, h3 { font-family: var(--font-heading); line-height: 1.2; }
h1 { font-size: 48px; }
h2 { font-size: 32px; }
h3 { font-size: 24px; }

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.container {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--space-3);
}

.section { padding-block: var(--space-8); }

.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--color-accent);
  color: #0F172A;
  padding: var(--space-1) var(--space-2);
  z-index: 100;
}
.skip-link:focus {
  left: var(--space-2);
  top: var(--space-2);
}

/* ---------- Scroll reveal base state ---------- */
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 400ms ease, transform 400ms ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; }
}

/* ---------- Header / Nav ---------- */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}
.brand {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 18px;
}
.nav {
  display: flex;
  gap: var(--space-3);
}
.nav-link {
  color: var(--color-text-muted);
  padding: var(--space-1) 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.nav-link.is-active,
.nav-link:hover {
  color: var(--color-accent);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
#theme-toggle, #nav-toggle {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
}
#nav-toggle { display: none; }

/* Dark (default): show moon, hide sun. Light: show sun, hide moon. */
#theme-toggle .icon-sun { display: none; }
[data-theme="light"] #theme-toggle .icon-moon { display: none; }
[data-theme="light"] #theme-toggle .icon-sun { display: inline-flex; }

@media (max-width: 767px) {
  .nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-2) var(--space-3);
    display: none;
  }
  .nav.is-open { display: flex; }
  #nav-toggle { display: inline-flex; }
}

/* ---------- Footer ---------- */
.site-footer {
  border-top: 1px solid var(--color-border);
  padding-block: var(--space-3);
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
```

- [ ] **Step 4: Verify the skeleton renders with correct structure**

Run:

```bash
grep -c '<section id=' index.html
```

Expected: `6`

```bash
grep -q 'id="theme-toggle"' index.html && grep -q 'id="nav-toggle"' index.html && grep -q 'id="primary-nav"' index.html && echo PASS
```

Expected: `PASS`

```bash
grep -q -- '--color-accent: #22C55E;' css/style.css && grep -q -- '--color-accent: #16A34A;' css/style.css && echo PASS
```

Expected: `PASS`

```bash
grep -q 'icon-sun' index.html && grep -q 'icon-moon' index.html && grep -q 'icon-sun { display: none; }' css/style.css && echo PASS
```

Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css assets/images/.gitkeep
git commit -m "Add page skeleton, theme tokens, and nav/footer chrome"
```

---

### Task 2: Hero section

**Files:**
- Modify: `index.html` (fill `<section id="hero">`)
- Modify: `css/style.css` (append `.hero` styles)

**Interfaces:**
- Consumes: `.section`, `.container`, theme tokens, `var(--space-*)` from Task 1.
- Produces: `.hero__avatar` element (a styled initials placeholder — later swapped for a real `<img>` by the site owner, no other task depends on its internals).

- [ ] **Step 1: Add hero markup**

Replace `<section id="hero" class="section hero reveal"></section>` in `index.html` with:

```html
<section id="hero" class="section hero reveal">
  <div class="container hero__inner">
    <div class="hero__content">
      <p class="hero__eyebrow">Hi, I'm</p>
      <h1>Kurian Benny</h1>
      <p class="hero__title">Full-Stack Developer &amp; Cloud Engineer</p>
      <p class="hero__pitch">Building scalable web platforms, cloud infrastructure, and AI-powered automation for over 12 years.</p>
      <div class="hero__actions">
        <a href="#projects" class="btn btn--primary">View Work</a>
        <a href="#contact" class="btn btn--secondary">Contact</a>
      </div>
    </div>
    <div class="hero__avatar" aria-hidden="true">KB</div>
  </div>
</section>
```

- [ ] **Step 2: Add hero CSS**

Append to `css/style.css`:

```css
/* ---------- Hero ---------- */
.hero__inner {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-4);
  align-items: center;
  text-align: center;
}
.hero__eyebrow {
  color: var(--color-accent);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 14px;
}
.hero__title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}
.hero__pitch {
  margin-top: var(--space-2);
  max-width: 520px;
  color: var(--color-text-muted);
}
.hero__actions {
  margin-top: var(--space-3);
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}
.btn {
  min-height: 44px;
  padding: 0 var(--space-3);
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  font-weight: 500;
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.btn--primary {
  background: var(--color-accent);
  color: #0F172A;
  box-shadow: 0 0 16px 0 color-mix(in srgb, var(--color-accent) 50%, transparent);
}
.btn--secondary {
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
.btn:hover { transform: translateY(-2px); }

.hero__avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  border: 2px solid var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 48px;
  font-weight: 700;
  color: var(--color-accent);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .hero__inner {
    flex-direction: row;
    text-align: left;
    justify-content: space-between;
  }
  .hero__actions { justify-content: flex-start; }
}
```

- [ ] **Step 3: Verify**

```bash
grep -q 'Full-Stack Developer &amp; Cloud Engineer' index.html && grep -q 'hero__avatar' css/style.css && echo PASS
```

Expected: `PASS`

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "Add hero section content and styles"
```

---

### Task 3: About + Experience Highlights section

**Files:**
- Modify: `index.html` (fill `<section id="about">`)
- Modify: `css/style.css` (append `.about` styles)

**Interfaces:**
- Consumes: `.section`, `.container`, theme tokens from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add about markup**

Replace `<section id="about" class="section about reveal"></section>` in `index.html` with:

```html
<section id="about" class="section about reveal">
  <div class="container">
    <h2>About Me</h2>
    <p class="about__summary">I am a Full-Stack Developer and Cloud Engineer with over 12 years of experience designing, building, deploying, and maintaining scalable web applications and digital platforms. My expertise spans backend development, frontend engineering, cloud infrastructure, DevOps, AI integrations, and automation. I specialize in transforming business ideas into production-ready solutions using modern frameworks, scalable architectures, and cloud technologies.</p>

    <h3 class="about__subheading">Experience Highlights</h3>
    <ul class="highlights">
      <li class="highlights__item">12+ years of software development experience</li>
      <li class="highlights__item">Built and deployed multiple SaaS platforms</li>
      <li class="highlights__item">Designed AI-powered hiring and recruitment systems</li>
      <li class="highlights__item">Developed scalable multi-tenant applications</li>
      <li class="highlights__item">Managed infrastructure across multiple cloud providers</li>
      <li class="highlights__item">Implemented CI/CD pipelines and DevOps workflows</li>
      <li class="highlights__item">Delivered enterprise-grade web applications</li>
      <li class="highlights__item">Led end-to-end product development from concept to deployment</li>
    </ul>
  </div>
</section>
```

- [ ] **Step 2: Add about CSS**

Append to `css/style.css`:

```css
/* ---------- About ---------- */
.about__summary {
  max-width: 720px;
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}
.about__subheading {
  margin-top: var(--space-6);
}
.highlights {
  margin-top: var(--space-3);
  display: grid;
  gap: var(--space-2);
  grid-template-columns: 1fr;
}
.highlights__item {
  position: relative;
  padding-left: var(--space-3);
  color: var(--color-text);
}
.highlights__item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
}

@media (min-width: 768px) {
  .highlights { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 3: Verify**

```bash
grep -c 'highlights__item' index.html
```

Expected: `8`

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "Add about and experience highlights section"
```

---

### Task 4: Technical Skills section

**Files:**
- Modify: `index.html` (fill `<section id="skills">`)
- Modify: `css/style.css` (append `.skills` styles)

**Interfaces:**
- Consumes: `.section`, `.container`, theme tokens from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add skills markup**

Replace `<section id="skills" class="section skills reveal"></section>` in `index.html` with:

```html
<section id="skills" class="section skills reveal">
  <div class="container">
    <h2>Technical Skills</h2>
    <div class="skills__grid">
      <div class="skills__group">
        <h3>Languages</h3>
        <ul class="tags">
          <li class="tag">PHP</li><li class="tag">Python</li><li class="tag">JavaScript</li>
          <li class="tag">Ruby</li><li class="tag">TypeScript</li><li class="tag">SQL</li>
        </ul>
      </div>
      <div class="skills__group">
        <h3>Backend</h3>
        <ul class="tags">
          <li class="tag">Laravel</li><li class="tag">Django</li><li class="tag">Django Ninja</li>
          <li class="tag">WordPress</li><li class="tag">WooCommerce</li><li class="tag">Node.js</li>
          <li class="tag">REST APIs</li><li class="tag">GraphQL</li>
        </ul>
      </div>
      <div class="skills__group">
        <h3>Frontend</h3>
        <ul class="tags">
          <li class="tag">React</li><li class="tag">Next.js</li><li class="tag">HTML5</li>
          <li class="tag">CSS3</li><li class="tag">Tailwind CSS</li><li class="tag">Bootstrap</li>
        </ul>
      </div>
      <div class="skills__group">
        <h3>Databases</h3>
        <ul class="tags">
          <li class="tag">PostgreSQL</li><li class="tag">MySQL</li><li class="tag">MongoDB</li><li class="tag">Redis</li>
        </ul>
      </div>
      <div class="skills__group">
        <h3>Cloud Platforms</h3>
        <ul class="tags">
          <li class="tag">AWS</li><li class="tag">Azure</li><li class="tag">DigitalOcean</li><li class="tag">Hostinger</li>
        </ul>
      </div>
      <div class="skills__group">
        <h3>AWS Services</h3>
        <ul class="tags">
          <li class="tag">EC2</li><li class="tag">RDS</li><li class="tag">S3</li><li class="tag">CloudFront</li>
          <li class="tag">Route 53</li><li class="tag">Amplify</li><li class="tag">IAM</li><li class="tag">Secrets Manager</li>
        </ul>
      </div>
      <div class="skills__group">
        <h3>DevOps &amp; Infrastructure</h3>
        <ul class="tags">
          <li class="tag">Docker</li><li class="tag">Docker Compose</li><li class="tag">Nginx</li>
          <li class="tag">GitHub Actions</li><li class="tag">CI/CD Pipelines</li><li class="tag">Linux Administration</li>
          <li class="tag">PM2</li><li class="tag">Certbot</li><li class="tag">SSL Management</li><li class="tag">Infrastructure Automation</li>
        </ul>
      </div>
      <div class="skills__group">
        <h3>AI &amp; Automation</h3>
        <ul class="tags">
          <li class="tag">AI Chatbots</li><li class="tag">Resume Parsing</li><li class="tag">OCR Pipelines</li>
          <li class="tag">LLM Integration</li><li class="tag">Recruitment Automation</li><li class="tag">Workflow Automation</li>
        </ul>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add skills CSS**

Append to `css/style.css`:

```css
/* ---------- Skills ---------- */
.skills__grid {
  margin-top: var(--space-3);
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}
.skills__group h3 { font-size: 18px; }
.tags {
  margin-top: var(--space-1);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.tag {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px var(--space-2);
  font-size: 14px;
  color: var(--color-text-muted);
}

@media (min-width: 768px) {
  .skills__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .skills__grid { grid-template-columns: repeat(3, 1fr); }
}
```

- [ ] **Step 3: Verify**

```bash
grep -c 'class="tag"' index.html
```

Expected: `48`

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "Add technical skills section"
```

---

### Task 5: Featured Projects section

**Files:**
- Modify: `index.html` (fill `<section id="projects">`)
- Modify: `css/style.css` (append `.projects` styles)

**Interfaces:**
- Consumes: `.section`, `.container`, `.tag` (from Task 4), theme tokens from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add projects markup**

Replace `<section id="projects" class="section projects reveal"></section>` in `index.html` with:

```html
<section id="projects" class="section projects reveal">
  <div class="container">
    <h2>Featured Projects</h2>
    <div class="project-grid">
      <article class="project-card">
        <h3>AI Recruitment Platform</h3>
        <p>An AI-powered hiring platform that streamlines candidate sourcing, resume analysis, job management, and recruitment workflows.</p>
        <ul class="tags">
          <li class="tag">Next.js</li><li class="tag">Django Ninja</li><li class="tag">PostgreSQL</li><li class="tag">AWS</li><li class="tag">AI APIs</li>
        </ul>
      </article>
      <article class="project-card">
        <h3>Multi-Tenant SaaS Applications</h3>
        <p>Secure, scalable SaaS solutions with isolated tenant architecture and cloud deployment.</p>
        <ul class="tags">
          <li class="tag">Python</li><li class="tag">Django</li><li class="tag">PostgreSQL</li><li class="tag">Redis</li><li class="tag">Docker</li>
        </ul>
      </article>
      <article class="project-card">
        <h3>E-Commerce Solutions</h3>
        <p>Custom e-commerce platforms and online stores built with WordPress, WooCommerce, and Laravel.</p>
        <ul class="tags">
          <li class="tag">PHP</li><li class="tag">Laravel</li><li class="tag">WooCommerce</li><li class="tag">MySQL</li>
        </ul>
      </article>
      <article class="project-card">
        <h3>OCR and Document Processing Platform</h3>
        <p>High-volume document processing pipelines for automated OCR, extraction, and data processing.</p>
        <ul class="tags">
          <li class="tag">Python</li><li class="tag">Docker</li><li class="tag">OCR</li><li class="tag">Queue Workers</li>
        </ul>
      </article>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add projects CSS**

Append to `css/style.css`:

```css
/* ---------- Projects ---------- */
.project-grid {
  margin-top: var(--space-3);
  display: grid;
  gap: var(--space-3);
  grid-template-columns: 1fr;
}
.project-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--space-3);
}
.project-card p {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
}
.project-card .tags { margin-top: var(--space-2); }

@media (min-width: 768px) {
  .project-grid { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 3: Verify**

```bash
grep -c 'class="project-card"' index.html
```

Expected: `4`

```bash
grep -A2 'project-card' index.html | grep -q '<a href' && echo "FAIL: link found" || echo PASS
```

Expected: `PASS`

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "Add featured projects section"
```

---

### Task 6: Services + Contact/Footer content

**Files:**
- Modify: `index.html` (fill `<section id="services">`, `<section id="contact">`)
- Modify: `css/style.css` (append `.services` and `.contact` styles)

**Interfaces:**
- Consumes: `.section`, `.container`, theme tokens from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add services markup**

Replace `<section id="services" class="section services reveal"></section>` in `index.html` with:

```html
<section id="services" class="section services reveal">
  <div class="container">
    <h2>Services</h2>
    <ul class="service-grid">
      <li class="service-card">Full-Stack Web Development</li>
      <li class="service-card">Cloud Architecture and Migration</li>
      <li class="service-card">DevOps and Infrastructure Automation</li>
      <li class="service-card">AI Integration and Automation</li>
      <li class="service-card">CMS Development</li>
      <li class="service-card">E-Commerce Development</li>
      <li class="service-card">Performance Optimization</li>
      <li class="service-card">Technical Consulting</li>
    </ul>
  </div>
</section>
```

- [ ] **Step 2: Add contact markup**

Replace `<section id="contact" class="section contact reveal"></section>` in `index.html` with:

```html
<section id="contact" class="section contact reveal">
  <div class="container contact__inner">
    <h2>Get In Touch</h2>
    <p class="contact__pitch">Open to full-stack, cloud, and AI integration opportunities — reach out any time.</p>
    <ul class="contact-links">
      <li>
        <a class="contact-link" href="mailto:kurianbenny@gmail.com">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="m22 6-10 7L2 6"/></svg>
          kurianbenny@gmail.com
        </a>
      </li>
      <li>
        <a class="contact-link" href="https://github.com/kurianbenny" target="_blank" rel="noopener noreferrer">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.5c0-1 .1-1.4-.5-2 2-.2 4.5-1 4.5-4.5 0-1-.5-2-1-2.5.5-1.5.5-3 0-4 0 0-1.5-.5-3.5 1a12 12 0 0 0-7 0C7 5.5 5.5 6 5.5 6c-.5 1-.5 2.5 0 4-.5.5-1 1.5-1 2.5 0 3.5 2.5 4.3 4.5 4.5-.6.6-.5 1-.5 2V22"/></svg>
          github.com/kurianbenny
        </a>
      </li>
      <li>
        <a class="contact-link" href="https://linkedin.com/in/kurian-benny" target="_blank" rel="noopener noreferrer">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.6A6 6 0 0 1 16 8Z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          linkedin.com/in/kurian-benny
        </a>
      </li>
    </ul>
  </div>
</section>
```

- [ ] **Step 3: Add services + contact CSS**

Append to `css/style.css`:

```css
/* ---------- Services ---------- */
.service-grid {
  margin-top: var(--space-3);
  display: grid;
  gap: var(--space-2);
  grid-template-columns: 1fr;
}
.service-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--space-3);
  font-weight: 500;
}
@media (min-width: 768px) {
  .service-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .service-grid { grid-template-columns: repeat(4, 1fr); }
}

/* ---------- Contact ---------- */
.contact__inner { text-align: center; }
.contact__pitch {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  max-width: 480px;
  margin-inline: auto;
}
.contact-links {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
}
.contact-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 44px;
  color: var(--color-text);
}
.contact-link:hover { color: var(--color-accent); }
```

- [ ] **Step 4: Verify**

```bash
grep -c 'class="service-card"' index.html
```

Expected: `8`

```bash
grep -q 'mailto:kurianbenny@gmail.com' index.html && grep -q 'github.com/kurianbenny' index.html && grep -q 'linkedin.com/in/kurian-benny' index.html && echo PASS
```

Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css
git commit -m "Add services and contact sections"
```

---

### Task 7: Theme toggle behavior

**Files:**
- Create: `js/main.js`

**Interfaces:**
- Consumes: `#theme-toggle` button, `data-theme` attribute on `<html>` (from Task 1). Icon swap is handled entirely by the `[data-theme="light"] #theme-toggle .icon-*` CSS rules already in Task 1 — this task only needs to flip the attribute.
- Produces: `initThemeToggle()` function; sets `document.documentElement.dataset.theme` and `localStorage["theme"]`. Later tasks (8, 9, 10) add their own `init*()` functions to the same file and call them alongside this one inside one `DOMContentLoaded` listener — do not overwrite the listener, append to it.

- [ ] **Step 1: Create `js/main.js` with the theme toggle**

```javascript
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
```

- [ ] **Step 2: Verify with a headless browser check**

```bash
grep -q "id='theme-toggle'\|theme-toggle" js/main.js && echo PASS
```

Expected: `PASS`

Use the Playwright browser tool to confirm runtime behavior:
1. Navigate to `file:///<absolute-path-to-repo>/index.html`.
2. Evaluate: `() => document.documentElement.dataset.theme` — expect `"dark"`.
3. Click the element matching `#theme-toggle`.
4. Evaluate: `() => document.documentElement.dataset.theme` — expect `"light"`.
5. Evaluate: `() => localStorage.getItem('theme')` — expect `"light"`.
6. Reload the page, evaluate the same dataset.theme check — expect it to still be `"light"` (persisted).

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Add theme toggle with localStorage persistence"
```

---

### Task 8: Smooth-scroll nav with active-link highlighting

**Files:**
- Modify: `js/main.js` (add `initSmoothScrollNav()`, call it from the existing `DOMContentLoaded` listener)

**Interfaces:**
- Consumes: `.nav-link[data-section]`, section elements with matching `id`, from Task 1.
- Produces: `initSmoothScrollNav()` function; toggles `.is-active` on `.nav-link` elements.

- [ ] **Step 1: Add the function and wire it into `DOMContentLoaded`**

Add to `js/main.js`, above the `document.addEventListener('DOMContentLoaded', ...)` block:

```javascript
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
```

Update the `DOMContentLoaded` listener to:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSmoothScrollNav();
});
```

- [ ] **Step 2: Verify**

```bash
grep -q 'initSmoothScrollNav();' js/main.js && grep -q 'function initSmoothScrollNav' js/main.js && echo PASS
```

Expected: `PASS`

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html`.
2. Evaluate: scroll `#skills` into view (`document.getElementById('skills').scrollIntoView()`), wait briefly.
3. Evaluate: `() => document.querySelector('.nav-link[data-section="skills"]').classList.contains('is-active')` — expect `true`.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Add scroll-spy active nav highlighting"
```

---

### Task 9: Mobile nav toggle

**Files:**
- Modify: `js/main.js` (add `initMobileNav()`, call it from `DOMContentLoaded`)

**Interfaces:**
- Consumes: `#nav-toggle` button, `#primary-nav` element, `.is-open` class from Task 1's CSS.
- Produces: `initMobileNav()` function.

- [ ] **Step 1: Add the function and wire it in**

Add to `js/main.js`, above the `DOMContentLoaded` block:

```javascript
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeNav();
  });
}
```

Update `DOMContentLoaded` to:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSmoothScrollNav();
  initMobileNav();
});
```

- [ ] **Step 2: Verify**

```bash
grep -q 'function initMobileNav' js/main.js && grep -q 'initMobileNav();' js/main.js && echo PASS
```

Expected: `PASS`

Use the Playwright browser tool with a mobile viewport (e.g. 375×800):
1. Navigate to `file:///<absolute-path-to-repo>/index.html`.
2. Click `#nav-toggle`.
3. Evaluate: `() => document.getElementById('primary-nav').classList.contains('is-open')` — expect `true`.
4. Click a `.nav-link`.
5. Evaluate the same check — expect `false`.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Add mobile nav toggle behavior"
```

---

### Task 10: Scroll-reveal animation

**Files:**
- Modify: `js/main.js` (add `initScrollReveal()`, call it from `DOMContentLoaded`)

**Interfaces:**
- Consumes: `.reveal` class on `<section>` elements and the `.is-visible` / `prefers-reduced-motion` CSS already defined in Task 1.
- Produces: `initScrollReveal()` function.

- [ ] **Step 1: Add the function and wire it in**

Add to `js/main.js`, above the `DOMContentLoaded` block:

```javascript
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
```

Update `DOMContentLoaded` to:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSmoothScrollNav();
  initMobileNav();
  initScrollReveal();
});
```

- [ ] **Step 2: Verify**

```bash
grep -q 'function initScrollReveal' js/main.js && grep -q 'initScrollReveal();' js/main.js && echo PASS
```

Expected: `PASS`

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html`.
2. Evaluate: `() => document.getElementById('hero').classList.contains('is-visible')` — expect `true` (hero is in view on load).
3. Evaluate: `() => document.getElementById('contact').classList.contains('is-visible')` — expect `false` (not yet scrolled into view).
4. Scroll `#contact` into view, wait briefly, re-check — expect `true`.
5. Emulate `prefers-reduced-motion: reduce`, reload, and confirm all `.reveal` sections are visible (`opacity: 1`) immediately without needing to scroll.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Add scroll-reveal animation with reduced-motion support"
```

---

### Task 11: Cross-device QA pass (responsive, contrast, keyboard, no-JS-regressions)

**Files:**
- Modify: `css/style.css` (only if a check below fails)

**Interfaces:**
- Consumes: the complete page from Tasks 1–10.
- Produces: nothing — this is a verification-only task. If a check fails, fix the specific CSS rule and re-run that check; do not restructure markup.

- [ ] **Step 1: Check for horizontal scroll at each breakpoint**

Use the Playwright browser tool, for each width `375, 768, 1024, 1440`:
1. Resize the page to `<width>x900`.
2. Navigate to `file:///<absolute-path-to-repo>/index.html`.
3. Evaluate: `() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`.
4. Expect `true` at every width. If `false`, find the overflowing element (`document.documentElement.scrollWidth` vs each section's `getBoundingClientRect().width`) and constrain it (e.g. add `min-width: 0` or `flex-wrap: wrap`) in `css/style.css`.

- [ ] **Step 2: Verify color contrast in both themes**

Use the Playwright browser tool:
1. Navigate to the page, evaluate `() => getComputedStyle(document.body).color` and `() => getComputedStyle(document.body).backgroundColor` for dark mode — confirm they match `#F8FAFC` on `#0F172A` (already AAA per the design-system source; no action expected).
2. Click `#theme-toggle`, re-run the same evaluation — confirm `#0F172A` text on `#F8FAFC` background.
3. Spot-check `.nav-link` and `.tag` text color against their background in both themes using a contrast calculation (foreground/background luminance ratio ≥ 4.5:1). If any pair fails, darken/lighten the relevant `--color-text-muted` value in `css/style.css` for that theme only.

- [ ] **Step 3: Verify keyboard navigation**

Use the Playwright browser tool:
1. Navigate to the page.
2. Press `Tab` once — evaluate `() => document.activeElement.classList.contains('skip-link')` — expect `true`.
3. Continue pressing `Tab` through the header controls — confirm `document.activeElement` moves through `.nav-link`, `#theme-toggle`, `#nav-toggle` in DOM order, and each has a visible focus ring (`getComputedStyle(document.activeElement).outlineStyle !== 'none'`).

- [ ] **Step 4: Final structural sanity check**

```bash
grep -c '<section' index.html
```

Expected: `6`

```bash
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([a-z]+)\"', html)
required = {'hero','about','skills','projects','services','contact','main-content','theme-toggle','nav-toggle','primary-nav'}
missing = required - set(ids)
print('PASS' if not missing else f'FAIL missing: {missing}')
"
```

Expected: `PASS`

- [ ] **Step 5: Commit (only if Step 1 or 2 required a CSS fix; otherwise skip)**

```bash
git add css/style.css
git commit -m "Fix responsive/contrast issues found in QA pass"
```
