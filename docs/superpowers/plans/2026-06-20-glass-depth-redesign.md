# Glass-Depth Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing one-page portfolio (`index.html` + `css/style.css` + `js/main.js`) from its current flat slate/green theme into a glass-depth aesthetic — frosted glass surfaces, ambient glow blobs, cyan/blue accents, and scroll-driven parallax — with no content, copy, or structural changes.

**Architecture:** CSS-only restyle of existing selectors (no new HTML wrapper elements except three decorative ambient-blob divs), plus one new JS function (`initParallaxBackground()`) added alongside the existing `init*()` functions in `js/main.js`. GSAP + ScrollTrigger loaded via CDN drives the parallax; everything else stays vanilla.

**Tech Stack:** Plain HTML5/CSS3/vanilla JS (unchanged), plus GSAP 3.12.5 core + ScrollTrigger loaded from `cdn.jsdelivr.net` via `<script defer>` tags — the one approved exception to the original "no external JS libraries" rule.

## Global Constraints

- No build tooling, no `package.json`, no bundler. GSAP via CDN `<script>` tag is the only exception to "no external JS libraries" — do not add further dependencies.
- No content/copy changes and no reordering of the six existing sections (`#hero #about #skills #projects #services #contact`).
- Respect `prefers-reduced-motion: reduce` — ambient blobs must render but stay static; the existing `.reveal` fade-up system is untouched.
- All interactive elements stay ≥44×44px touch target, with a visible `:focus-visible` ring using `--color-accent` — must still hold against new glass surfaces.
- No horizontal scroll at any breakpoint: 375 / 768 / 1024 / 1440px.
- Color tokens (exact values, both themes), used verbatim everywhere:
  - Dark: `--color-background:#0B1120; --color-surface:rgba(255,255,255,0.05); --color-surface-solid:#131B2E; --color-text:#F8FAFC; --color-text-muted:#94A3B8; --color-border:rgba(255,255,255,0.10); --color-accent:#22D3EE; --color-accent-2:#2563EB;`
  - Light (`[data-theme="light"]`): `--color-background:#F1F5F9; --color-surface:rgba(255,255,255,0.6); --color-surface-solid:#FFFFFF; --color-text:#0F172A; --color-text-muted:#475569; --color-border:rgba(15,23,42,0.10); --color-accent:#0E7490; --color-accent-2:#2563EB;` (originally `#0891B2`; darkened during the Task 10 QA pass after measuring 3.36:1 against `#F1F5F9`, below the 4.5:1 AA floor — `#0E7490` measures 4.89:1)
- Glass recipe (apply verbatim wherever "glass treatment" is specified): `background: var(--color-surface); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid var(--color-border);` plus an `@supports not (backdrop-filter: blur(1px))` fallback setting `background: var(--color-surface-solid);`.
- Typography stays Space Grotesk (headings) / Archivo (body) — no font change, only scale/weight.

---

### Task 1: Color tokens, glass-blur variable, typography scale

**Files:**
- Modify: `css/style.css:10-40` (`:root` and `[data-theme="light"]` token blocks)
- Modify: `css/style.css:62-65` (`h1, h2, h3` rules)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: CSS custom properties `--color-background`, `--color-surface`, `--color-surface-solid`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`, `--color-accent-2`, `--glass-blur` on `:root` and `[data-theme="light"]`; new `h1`/`h2`/`h3` font sizes. Every later task relies on these exact token names and on `--glass-blur` for backdrop-filter values.

- [ ] **Step 1: Replace the `:root` token block**

In `css/style.css`, replace:

```css
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
```

with:

```css
:root {
  --color-background: #0B1120;
  --color-surface: rgba(255, 255, 255, 0.05);
  --color-surface-solid: #131B2E;
  --color-surface-alt: #334155;
  --color-text: #F8FAFC;
  --color-text-muted: #94A3B8;
  --color-border: rgba(255, 255, 255, 0.10);
  --color-accent: #22D3EE;
  --color-accent-2: #2563EB;

  --font-heading: "Space Grotesk", system-ui, sans-serif;
  --font-body: "Archivo", system-ui, sans-serif;

  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-8: 64px;

  --max-width: 1100px;
  --glass-blur: blur(16px) saturate(150%);
}
```

(`--color-surface-alt` stays for now — its sole consumer, `.hero__avatar`, is rewritten in Task 3, which also removes this token.)

- [ ] **Step 2: Replace the `[data-theme="light"]` token block**

Replace:

```css
[data-theme="light"] {
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-alt: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-border: #CBD5E1;
  --color-accent: #15803D;
}
```

with:

```css
[data-theme="light"] {
  --color-background: #F1F5F9;
  --color-surface: rgba(255, 255, 255, 0.6);
  --color-surface-solid: #FFFFFF;
  --color-surface-alt: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #475569;
  --color-border: rgba(15, 23, 42, 0.10);
  --color-accent: #0E7490;
  --color-accent-2: #2563EB;
}
```

(This light-mode `--color-accent` value was corrected from `#0891B2` to `#0E7490` during the Task 10 QA pass — see Global Constraints note above.)

- [ ] **Step 3: Replace the heading scale**

Replace:

```css
h1, h2, h3 { font-family: var(--font-heading); line-height: 1.2; }
h1 { font-size: 48px; }
h2 { font-size: 32px; }
h3 { font-size: 24px; }
```

with:

```css
h1, h2, h3 { font-family: var(--font-heading); line-height: 1.2; font-weight: 700; letter-spacing: -0.02em; }
h1 { font-size: 40px; }
h2 { font-size: 28px; }
h3 { font-size: 20px; font-weight: 600; letter-spacing: normal; }

@media (min-width: 768px) {
  h1 { font-size: 56px; }
  h2 { font-size: 32px; }
}

@media (min-width: 1024px) {
  h1 { font-size: 72px; }
  h2 { font-size: 40px; }
}
```

- [ ] **Step 4: Verify token and scale values**

```bash
grep -q -- '--color-accent: #22D3EE;' css/style.css && grep -q -- '--color-accent: #0E7490;' css/style.css && grep -q -- '--glass-blur: blur(16px) saturate(150%);' css/style.css && echo PASS
```

Expected: `PASS`

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html`.
2. Resize to `1440x900`.
3. Evaluate: `() => getComputedStyle(document.querySelector('h1')).fontSize` — expect `"72px"`.
4. Resize to `375x800`, reload, evaluate the same — expect `"40px"`.

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "Update color tokens and heading scale for glass-depth redesign"
```

---

### Task 2: Ambient glow blobs

**Files:**
- Modify: `index.html:14-15` (inside `<body>`, before the skip link)
- Modify: `css/style.css` (append new "Ambient depth layer" section; modify the `body` rule)

**Interfaces:**
- Consumes: `--color-accent`, `--color-accent-2` from Task 1.
- Produces: three `.ambient-blob` elements (`.ambient-blob--1/2/3`) each with a `data-speed` attribute, in the DOM directly under `<body>`. Task 9's `initParallaxBackground()` queries `document.querySelectorAll('.ambient-blob')` and reads `blob.dataset.speed`.

- [ ] **Step 1: Add blob markup**

In `index.html`, replace:

```html
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>
```

with:

```html
<body>
  <div class="ambient-blob ambient-blob--1" data-speed="0.2" aria-hidden="true"></div>
  <div class="ambient-blob ambient-blob--2" data-speed="0.4" aria-hidden="true"></div>
  <div class="ambient-blob ambient-blob--3" data-speed="0.6" aria-hidden="true"></div>
  <a href="#main-content" class="skip-link">Skip to content</a>
```

- [ ] **Step 2: Add blob CSS and clip horizontal overflow**

In `css/style.css`, replace the `body` rule:

```css
body {
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  transition: background-color 200ms ease, color 200ms ease;
}
```

with:

```css
body {
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  transition: background-color 200ms ease, color 200ms ease;
  overflow-x: hidden;
}
```

Then append this new section directly after the `@media (prefers-reduced-motion: no-preference)` block and before `/* ---------- Base ---------- */`:

```css
/* ---------- Ambient depth layer ---------- */
.ambient-blob {
  position: absolute;
  z-index: -1;
  width: 60vw;
  height: 60vw;
  max-width: 640px;
  max-height: 640px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
  will-change: transform;
}
.ambient-blob--1 {
  background: var(--color-accent);
  top: -10vh;
  left: -10vw;
}
.ambient-blob--2 {
  background: var(--color-accent-2);
  top: 90vh;
  right: -15vw;
}
.ambient-blob--3 {
  background: var(--color-accent);
  top: 220vh;
  left: 15vw;
  opacity: 0.25;
}

@media (prefers-reduced-motion: reduce) {
  .ambient-blob { opacity: 0.15; }
}
```

- [ ] **Step 3: Verify**

```bash
grep -c 'ambient-blob' index.html
```

Expected: `3`

```bash
grep -q 'overflow-x: hidden;' css/style.css && echo PASS
```

Expected: `PASS`

Use the Playwright browser tool, for widths `375` and `1440`:
1. Resize to `<width>x900`, navigate to `file:///<absolute-path-to-repo>/index.html`.
2. Evaluate: `() => document.querySelectorAll('.ambient-blob').length` — expect `3`.
3. Evaluate: `() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` — expect `true`.

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "Add ambient glow blobs as the parallax depth layer"
```

---

### Task 3: Header/nav, hero avatar, and button glass treatment

**Files:**
- Modify: `css/style.css` (`.site-header`, `.section`/`#main-content` scroll-margin, `.nav-link` block, `.hero__avatar`, `.btn--primary`/`.btn--secondary`/`.btn:hover`, and removal of `--color-surface-alt` token)

**Interfaces:**
- Consumes: `--glass-blur`, `--color-surface-solid`, `--color-accent`, `--color-accent-2` from Task 1.
- Produces: nothing consumed by later tasks (purely visual).

- [ ] **Step 1: Float the header as a glass pill and adjust scroll offsets**

Replace:

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
```

with:

```css
.site-header {
  position: sticky;
  top: var(--space-2);
  z-index: 50;
  margin-inline: var(--space-2);
  border-radius: 16px;
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
}
@supports not (backdrop-filter: blur(1px)) {
  .site-header { background: var(--color-surface-solid); }
}
```

Replace:

```css
.section { padding-block: var(--space-8); scroll-margin-top: 64px; }

#main-content { scroll-margin-top: 64px; }
```

with:

```css
.section { padding-block: var(--space-8); scroll-margin-top: 96px; }

#main-content { scroll-margin-top: 96px; }
```

- [ ] **Step 2: Add the active-nav-link glow indicator**

Replace:

```css
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
```

with:

```css
.nav-link {
  color: var(--color-text-muted);
  padding: var(--space-1) 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  position: relative;
}
.nav-link.is-active,
.nav-link:hover {
  color: var(--color-accent);
}
.nav-link.is-active::after {
  content: "";
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--color-accent);
  box-shadow: 0 0 8px 0 var(--color-accent);
}
```

- [ ] **Step 3: Rewrite the hero avatar as a glass ring and remove the now-unused `--color-surface-alt` token**

Replace:

```css
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
  object-fit: cover;
}
```

with:

```css
.hero__avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 2px solid var(--color-accent);
  box-shadow: 0 0 32px 0 color-mix(in srgb, var(--color-accent) 35%, transparent);
  flex-shrink: 0;
  object-fit: cover;
}
@supports not (backdrop-filter: blur(1px)) {
  .hero__avatar { background: var(--color-surface-solid); }
}
```

Remove the `--color-surface-alt` line from both the `:root` block and the `[data-theme="light"]` block (it has no remaining consumer after this step).

- [ ] **Step 4: Update button styles**

Replace:

```css
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
```

with:

```css
.btn--primary {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
  color: #0B1120;
  box-shadow: 0 0 24px 0 color-mix(in srgb, var(--color-accent) 55%, transparent);
}
.btn--secondary {
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
@supports not (backdrop-filter: blur(1px)) {
  .btn--secondary { background: var(--color-surface-solid); }
}
.btn:hover { transform: translateY(-2px); }
.btn--primary:hover {
  box-shadow: 0 0 32px 0 color-mix(in srgb, var(--color-accent) 70%, transparent);
}
```

- [ ] **Step 5: Verify**

```bash
grep -q -- '--color-surface-alt' css/style.css && echo "FAIL: token still present" || echo PASS
```

Expected: `PASS`

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html` at `1440x900`.
2. Evaluate: `() => getComputedStyle(document.querySelector('.site-header')).borderRadius` — expect `"16px"`.
3. Evaluate: `() => getComputedStyle(document.querySelector('.hero__avatar')).boxShadow !== 'none'` — expect `true`.
4. Click a `.nav-link`, scroll its section into view, evaluate: `() => getComputedStyle(document.querySelector('.nav-link.is-active'), '::after').content !== 'none'` — expect `true`.

- [ ] **Step 6: Commit**

```bash
git add css/style.css
git commit -m "Apply glass treatment to header, hero avatar, and buttons"
```

---

### Task 4: About panel and highlight chips

**Files:**
- Modify: `css/style.css` (`.about__summary`/`.highlights`/`.highlights__item` block; new `#about .container` rule)

**Interfaces:**
- Consumes: `--glass-blur`, `--color-surface-solid` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Wrap the About section in a glass panel and restyle highlight items as chips**

Replace:

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

with:

```css
/* ---------- About ---------- */
#about .container {
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: var(--space-4) var(--space-3);
}
@supports not (backdrop-filter: blur(1px)) {
  #about .container { background: var(--color-surface-solid); }
}

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
  padding: var(--space-2);
  border-radius: 10px;
  background: var(--color-surface-solid);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 14px;
}

@media (min-width: 768px) {
  .highlights { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 2: Verify**

```bash
grep -q '#about .container' css/style.css && grep -c 'highlights__item' index.html
```

Expected: `8` (the `grep -c` count, confirming markup is untouched)

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html` at `1440x900`.
2. Evaluate: `() => getComputedStyle(document.querySelector('#about .container')).borderRadius` — expect `"16px"`.
3. Evaluate: `() => getComputedStyle(document.querySelector('.highlights__item')).backgroundColor !== 'rgba(0, 0, 0, 0)'` — expect `true`.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "Add glass panel to About section and chip-style highlight items"
```

---

### Task 5: Skill tag chips

**Files:**
- Modify: `css/style.css` (`.tag` rule)

**Interfaces:**
- Consumes: `--glass-blur`, `--color-surface-solid`, `--color-accent` from Task 1.
- Produces: nothing consumed by later tasks. Shared by both Skills (`#skills .tag`) and Projects (`.project-card .tag`) markup — no markup change needed since both already use the `.tag` class.

- [ ] **Step 1: Add glass treatment and hover glow to `.tag`**

Replace:

```css
.tag {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px var(--space-2);
  font-size: 14px;
  color: var(--color-text-muted);
}
```

with:

```css
.tag {
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px var(--space-2);
  font-size: 14px;
  color: var(--color-text-muted);
  transition: box-shadow 200ms ease, transform 200ms ease;
}
@supports not (backdrop-filter: blur(1px)) {
  .tag { background: var(--color-surface-solid); }
}
.tag:hover {
  box-shadow: 0 0 12px 0 color-mix(in srgb, var(--color-accent) 35%, transparent);
  transform: translateY(-1px);
}
```

- [ ] **Step 2: Verify**

```bash
grep -c 'class="tag"' index.html
```

Expected: `52`

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html` at `1440x900`.
2. Evaluate: `() => getComputedStyle(document.querySelector('.tag')).backdropFilter !== 'none'` — expect `true` (or confirm the `@supports` fallback background is opaque if the browser doesn't support `backdrop-filter`).
3. Scroll through the Skills section and confirm visually no layout jank (manual check — open DevTools Performance panel, record 2s of scrolling through `#skills`, confirm no dropped-frame warnings).

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "Add glass treatment and hover glow to skill/tech tag chips"
```

---

### Task 6: Project cards

**Files:**
- Modify: `css/style.css` (`.project-card` rule)

**Interfaces:**
- Consumes: `--glass-blur`, `--color-surface-solid`, `--color-accent` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add glass treatment with hover lift and glow**

Replace:

```css
.project-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--space-3);
}
```

with:

```css
.project-card {
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--space-3);
  transition: transform 200ms ease, box-shadow 200ms ease;
}
@supports not (backdrop-filter: blur(1px)) {
  .project-card { background: var(--color-surface-solid); }
}
.project-card:hover,
.project-card:focus-within {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 0 32px 0 color-mix(in srgb, var(--color-accent) 25%, transparent);
}
```

- [ ] **Step 2: Verify**

```bash
grep -c 'class="project-card"' index.html
```

Expected: `4`

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html` at `1440x900`.
2. Hover the first `.project-card`, evaluate: `() => getComputedStyle(document.querySelector('.project-card')).boxShadow !== 'none'` — expect `true`.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "Add glass treatment and hover lift to project cards"
```

---

### Task 7: Service cards

**Files:**
- Modify: `css/style.css` (`.service-card` rule)

**Interfaces:**
- Consumes: `--glass-blur`, `--color-surface-solid`, `--color-accent` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add glass treatment with hover glow**

Replace:

```css
.service-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--space-3);
  font-weight: 500;
}
```

with:

```css
.service-card {
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--space-3);
  font-weight: 500;
  transition: box-shadow 200ms ease;
}
@supports not (backdrop-filter: blur(1px)) {
  .service-card { background: var(--color-surface-solid); }
}
.service-card:hover {
  box-shadow: 0 0 24px 0 color-mix(in srgb, var(--color-accent) 20%, transparent);
}
```

- [ ] **Step 2: Verify**

```bash
grep -c 'class="service-card"' index.html
```

Expected: `8`

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html` at `1440x900`.
2. Hover the first `.service-card`, evaluate: `() => getComputedStyle(document.querySelector('.service-card')).boxShadow !== 'none'` — expect `true`.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "Add glass treatment and hover glow to service cards"
```

---

### Task 8: Contact panel and footer divider

**Files:**
- Modify: `css/style.css` (`.contact__inner`, `.contact-link`, `.site-footer` rules)

**Interfaces:**
- Consumes: `--glass-blur`, `--color-surface-solid`, `--color-accent` from Task 1.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Turn the contact section into a glass panel**

Replace:

```css
/* ---------- Contact ---------- */
.contact__inner { text-align: center; }
```

with:

```css
/* ---------- Contact ---------- */
.contact__inner {
  text-align: center;
  background: var(--color-surface);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: var(--space-4) var(--space-3);
}
@supports not (backdrop-filter: blur(1px)) {
  .contact__inner { background: var(--color-surface-solid); }
}
```

- [ ] **Step 2: Add glow to contact links**

Replace:

```css
.contact-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 44px;
  color: var(--color-text);
}
.contact-link:hover { color: var(--color-accent); }
```

with:

```css
.contact-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 44px;
  padding-inline: var(--space-2);
  border-radius: 8px;
  color: var(--color-text);
  transition: color 150ms ease, box-shadow 150ms ease;
}
.contact-link:hover,
.contact-link:focus-visible {
  color: var(--color-accent);
  box-shadow: 0 0 16px 0 color-mix(in srgb, var(--color-accent) 30%, transparent);
}
```

- [ ] **Step 3: Add a glow to the footer divider**

Replace:

```css
.site-footer {
  border-top: 1px solid var(--color-border);
  padding-block: var(--space-3);
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
```

with:

```css
.site-footer {
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -1px 16px 0 color-mix(in srgb, var(--color-accent) 12%, transparent);
  padding-block: var(--space-3);
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
```

- [ ] **Step 4: Verify**

```bash
grep -q 'mailto:kurianbenny@gmail.com' index.html && grep -q 'github.com/kurianbenny' index.html && grep -q 'linkedin.com/in/kurian-benny' index.html && echo PASS
```

Expected: `PASS` (confirms markup untouched)

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html` at `1440x900`.
2. Evaluate: `() => getComputedStyle(document.querySelector('.contact__inner')).borderRadius` — expect `"16px"`.

- [ ] **Step 5: Commit**

```bash
git add css/style.css
git commit -m "Add glass panel to contact section and glow to links/footer"
```

---

### Task 9: GSAP-driven parallax background

**Files:**
- Modify: `index.html:221-222` (script tags before `</body>`)
- Modify: `js/main.js` (add `initParallaxBackground()`, call it from the existing `DOMContentLoaded` listener)

**Interfaces:**
- Consumes: `.ambient-blob` elements with `data-speed` attributes from Task 2.
- Produces: `initParallaxBackground()` function. No-ops cleanly if `gsap`/`ScrollTrigger` are undefined (CDN load failure), so it has no hard dependency for the rest of `js/main.js` to function.

- [ ] **Step 1: Load GSAP and ScrollTrigger via CDN**

In `index.html`, replace:

```html
  <script src="js/main.js"></script>
</body>
</html>
```

with:

```html
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" integrity="sha384-g4NTh/Iv5PPU4xPyhEWqPcwtNXOvdaDI8LLnyYfyNZOjKJeYQyjzQ9X5275eBjpt" crossorigin="anonymous" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js" integrity="sha384-Z3REaz79l2IaAZqJsSABtTbhjgOUYyV3p90XNnAPCSHg3EMTz1fouunq9WZRtj3d" crossorigin="anonymous" defer></script>
  <script src="js/main.js"></script>
</body>
</html>
```

The `integrity` values are SHA-384 digests computed directly from the GSAP 3.12.5 files at these pinned URLs (not copied from a third-party listing) — if the CDN ever serves different bytes at this version-pinned path, the browser refuses to execute the script rather than silently running tampered code.

- [ ] **Step 2: Add `initParallaxBackground()` to `js/main.js`**

Add this function above the `document.addEventListener('DOMContentLoaded', ...)` block:

```javascript
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
```

Update the `DOMContentLoaded` listener to:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSmoothScrollNav();
  initMobileNav();
  initScrollReveal();
  initParallaxBackground();
});
```

- [ ] **Step 3: Verify**

```bash
grep -q 'function initParallaxBackground' js/main.js && grep -q 'initParallaxBackground();' js/main.js && grep -c 'integrity="sha384-' index.html
```

Expected: `function initParallaxBackground` and `initParallaxBackground();` both found, and the final `grep -c` prints `2` (one `integrity` attribute per GSAP script tag).

Use the Playwright browser tool:
1. Navigate to `file:///<absolute-path-to-repo>/index.html` at `1440x900` (online, GSAP loads normally).
2. Evaluate: `() => typeof gsap !== 'undefined'` — expect `true`.
3. Evaluate the initial transform: `() => getComputedStyle(document.querySelector('.ambient-blob--1')).transform`, record the value.
4. Scroll to the bottom of the page (`window.scrollTo(0, document.body.scrollHeight)`), wait briefly, re-evaluate the same transform — expect it to differ from the recorded value (parallax is active).
5. Resize to `375x800`, reload, scroll to the bottom, re-check the transform of `.ambient-blob--1` — expect it to remain `"none"` (parallax gated off below 768px).
6. Emulate `prefers-reduced-motion: reduce`, resize back to `1440x900`, reload, scroll to the bottom, re-check the transform — expect it to remain `"none"`.

- [ ] **Step 4: Commit**

```bash
git add index.html js/main.js
git commit -m "Add GSAP-driven parallax for ambient background blobs"
```

---

### Task 10: Cross-device QA pass (responsive, contrast, keyboard, reduced-motion, CDN-failure resilience)

**Files:**
- Modify: `css/style.css` (only if a check below fails)

**Interfaces:**
- Consumes: the complete redesigned page from Tasks 1–9.
- Produces: nothing — verification-only. If a check fails, fix the specific CSS rule and re-run that check; do not restructure markup.

- [ ] **Step 1: Re-confirm no horizontal scroll at every breakpoint**

Use the Playwright browser tool, for each width `375, 768, 1024, 1440`:
1. Resize to `<width>x900`, navigate to `file:///<absolute-path-to-repo>/index.html`.
2. Evaluate: `() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` — expect `true` at every width.

- [ ] **Step 2: Verify accent contrast in both themes**

Use the Playwright browser tool:
1. Navigate to the page in dark mode (default). Evaluate:
```javascript
() => {
  const lum = (hex) => {
    const [r, g, b] = hex.match(/\w\w/g).map(c => parseInt(c, 16) / 255)
      .map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return ratio(lum('22D3EE'), lum('0B1120'));
}
```
Expect a value `>= 4.5`.
2. Click `#theme-toggle`. Evaluate the same formula with `lum('0E7490')` and `lum('F1F5F9')` — expect `>= 4.5`.

- [ ] **Step 3: Verify keyboard navigation still works against glass surfaces**

Use the Playwright browser tool:
1. Navigate to the page.
2. Press `Tab` repeatedly through the header controls (`.nav-link`, `#theme-toggle`, `#nav-toggle`).
3. Evaluate after each tab: `() => getComputedStyle(document.activeElement).outlineStyle !== 'none'` — expect `true` for every focused control.

- [ ] **Step 4: Verify reduced-motion behavior end-to-end**

Use the Playwright browser tool:
1. Emulate `prefers-reduced-motion: reduce`.
2. Navigate to the page, evaluate: `() => document.getElementById('hero').classList.contains('is-visible')` — expect `true` immediately (existing `.reveal` behavior, unchanged).
3. Evaluate: `() => getComputedStyle(document.querySelector('.ambient-blob--1')).opacity` — expect `"0.15"` (the reduced-motion blob opacity from Task 2).
4. Scroll to the bottom and confirm `.ambient-blob--1`'s transform is still `"none"`.

- [ ] **Step 5: Verify the page still functions if the GSAP CDN fails**

```bash
sed -i 's#https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js#https://cdn.invalid-test-domain.example/gsap.min.js#' index.html
```

Use the Playwright browser tool:
1. Navigate to the page.
2. Evaluate: `() => typeof gsap === 'undefined'` — expect `true`.
3. Click `#theme-toggle`, evaluate: `() => document.documentElement.dataset.theme` — expect it to have flipped to `"light"` (confirms the rest of `main.js` runs fine without GSAP).
4. Check the browser console for uncaught JS errors (only the expected network failure for the broken script URL should appear — no `ReferenceError` from `main.js`).

Then revert the deliberate breakage:

```bash
git checkout -- index.html
```

- [ ] **Step 6: Final structural sanity check**

```bash
grep -c '<section' index.html
```

Expected: `6`

```bash
grep -c 'ambient-blob' index.html
```

Expected: `3`

```bash
python3 -c "
import re
html = open('index.html').read()
ids = re.findall(r'id=\"([a-z-]+)\"', html)
required = {'hero','about','skills','projects','services','contact','main-content','theme-toggle','nav-toggle','primary-nav'}
missing = required - set(ids)
print('PASS' if not missing else f'FAIL missing: {missing}')
"
```

Expected: `PASS`

- [ ] **Step 7: Commit (only if Step 1, 2, or 3 required a CSS fix; otherwise skip)**

```bash
git add css/style.css
git commit -m "Fix responsive/contrast/focus issues found in glass-depth QA pass"
```
