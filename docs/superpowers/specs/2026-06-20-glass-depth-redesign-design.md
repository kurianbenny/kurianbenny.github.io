# Glass-Depth Visual Redesign — Design Spec

Date: 2026-06-20

## Summary

Visually refresh the existing one-page portfolio (`index.html` + `css/style.css` + `js/main.js`) from its current flat slate/green theme to a "glass depth / layered" aesthetic — frosted glass surfaces, ambient glow blobs, and scroll-driven parallax — to read as a contemporary 2026-era developer site rather than a generic 2022 template. This is a redesign of an already-complete page: no new sections, no content changes, no structural reordering. Content, copy, and the six existing sections (Hero, About, Skills, Projects, Services, Contact) stay exactly as they are.

The original build constraint of "no external JS libraries" is relaxed for this redesign: GSAP + ScrollTrigger is added via CDN `<script>` tags to drive the parallax effect. No build step, no npm, no bundler — that constraint stays intact.

## Visual System

### Color tokens

Dark (default):
```
--color-background: #0B1120
--color-surface: rgba(255,255,255,0.05)        /* glass panel fill */
--color-surface-solid: #131B2E                  /* header/footer base under blur */
--color-text: #F8FAFC
--color-text-muted: #94A3B8
--color-border: rgba(255,255,255,0.10)
--color-accent: #22D3EE                         /* cyan glow, primary */
--color-accent-2: #2563EB                       /* deep blue, ambient blobs only */
```

Light (`[data-theme="light"]`):
```
--color-background: #F1F5F9
--color-surface: rgba(255,255,255,0.6)
--color-surface-solid: #FFFFFF
--color-text: #0F172A
--color-text-muted: #475569
--color-border: rgba(15,23,42,0.10)
--color-accent: #0891B2                         /* darker cyan, needed for AA contrast on light bg */
--color-accent-2: #2563EB
```

All existing components that currently use `--color-surface` as a solid fill switch to the glass recipe below; no component keeps a flat opaque surface except where explicitly noted (`--color-surface-solid`, used only as the under-blur base for header/footer so text stays legible before/without backdrop-filter support).

### Glass surface recipe

Applied to: header/nav bar, hero avatar ring, skill tag chips, project cards, service cards, contact panel.

```css
.glass {
  background: var(--color-surface);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--color-border);
}
.glass:hover, .glass:focus-visible {
  box-shadow: 0 0 24px 0 color-mix(in srgb, var(--color-accent) 20%, transparent);
}
```

Browsers without `backdrop-filter` support fall back to the solid `--color-surface-solid` value via `@supports not (backdrop-filter: blur(1px))`.

### Ambient depth layer

2–3 fixed-position `<div>` elements (`aria-hidden="true"`, e.g. `.ambient-blob`), each a large blurred radial gradient in `--color-accent` or `--color-accent-2`, positioned behind all content (`z-index: -1`, sitting above `--color-background` but below everything else). These are what the glass panels' blur picks up, and what the parallax effect (below) animates.

### Typography

Keep the existing Space Grotesk (headings) / Archivo (body) pairing — already a validated modern combination, no font change needed. Push the scale and weight further for a bolder feel:

- `h1`: 48px → 72px desktop (responsive down to ~40px on mobile), weight 700, letter-spacing `-0.02em`
- `h2`: 32px → 40px, weight 700
- `h3`: unchanged at 24px, weight 600
- Body and tag/chip text sizes unchanged (16px / 14px)

## Per-Section Treatment

No section is restructured, reordered, or has content added/removed. Only the surface material and motion change:

1. **Header/nav** — floating glass pill bar (rounded corners, not edge-to-edge), sticky, `.glass`. Active nav link gets a small cyan glow dot/underline instead of a plain color swap.
2. **Hero** — near-full-viewport height. Ambient blobs visible behind content through the glass. Headline at the new 72px scale. Avatar (`<img class="hero__avatar">`) gets a `.glass` ring treatment with a cyan glow border. Primary CTA (`.btn--primary`) gets a stronger glow; secondary CTA becomes a `.glass` outline button.
3. **About** — summary + highlights wrapped in one `.glass` panel. Highlight items become small glass chips instead of plain bulleted text.
4. **Skills** — `.tag` pills become `.glass` chips with a glow lift on hover (currently flat `--color-surface` pills with a static border).
5. **Projects** — `.project-card` becomes a `.glass` panel with hover lift (`translateY(-4px)`) + glow border + slight scale (`scale(1.02)`). This is the section where the layered-depth feel should be most visible.
6. **Services** — `.service-card` gets the same `.glass` treatment, flatter/simpler than project cards (no hover scale, just glow).
7. **Contact** — centered `.glass` panel; `.contact-link` items get a glow on hover instead of a plain color change.
8. **Footer** — `.glass` divider line with a faint glow instead of a hard `border-top`.

## Animation System

### Parallax mechanics

GSAP + `ScrollTrigger`, loaded via two CDN `<script defer>` tags (before `js/main.js`). Each `.ambient-blob` gets a different scroll-speed factor (via a `data-speed` attribute), and `ScrollTrigger` with `scrub: true` ties each blob's `y` translate to scroll progress — different blobs move at different rates, producing the depth illusion as the user scrolls past the glass panels in front of them.

Implementation: one new function, `initParallaxBackground()`, added to `js/main.js`:
- Transforms only (`gsap.to(blob, { y: ..., ease: 'none', scrollTrigger: { scrub: true, ... } })`) — no layout properties animated, stays GPU-cheap.
- Gated by `gsap.matchMedia()`:
  - `(prefers-reduced-motion: no-preference) and (min-width: 768px)` → parallax active.
  - Otherwise → blobs render but stay static (no scroll-triggered transform).
- Guarded by `typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'` — if the CDN fails to load, `initParallaxBackground()` no-ops and every other `init*()` function (theme toggle, smooth-scroll nav, mobile nav, scroll-reveal) continues to work exactly as today, since they have no dependency on GSAP.

### Existing scroll-reveal untouched

The current vanilla `IntersectionObserver`-based `.reveal` / `.is-visible` fade-up system (in `initScrollReveal()`) stays exactly as it is — it already respects `prefers-reduced-motion` and already works correctly. The new parallax layer is purely additive and independent of it.

## Technical Implementation

**Files touched** (no new files):

- `index.html` — add 2–3 `.ambient-blob` divs (likely as a direct child of `<body>`, before `<header>`, so they sit behind everything via `z-index`), add two GSAP CDN `<script defer>` tags before the existing `<script src="js/main.js">` tag.
- `css/style.css` — new color tokens (replacing the current `--color-surface`/`--color-border`/`--color-accent` values), new `.glass` utility class with `@supports` fallback, `.ambient-blob` styles, updated `h1`/`h2` type scale, glass treatment applied to existing `.site-header`, `.tag`, `.project-card`, `.service-card`, `.contact__inner`, `.hero__avatar`, `.btn--secondary` rules (no new class names needed beyond `.glass` and `.ambient-blob` — existing component classes get the glass styles merged in).
- `js/main.js` — new `initParallaxBackground()` function, called from the existing `DOMContentLoaded` listener alongside `initThemeToggle()`, `initSmoothScrollNav()`, `initMobileNav()`, `initScrollReveal()`.

**External dependency added**: GSAP core + ScrollTrigger via `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js` and the matching `ScrollTrigger.min.js`, loaded with `defer`. This is the one exception to the original "no external JS libraries" constraint, explicitly approved for this redesign.

## Testing / QA

Re-run the checks from the original portfolio plan's QA pass, plus new checks for this redesign:

- Responsive: no horizontal scroll at 375 / 768 / 1024 / 1440px, in both themes.
- Contrast: new `--color-accent` (`#22D3EE` dark / `#0891B2` light) meets 4.5:1 against its respective background and against `--color-surface-solid` wherever used as text.
- Keyboard nav: focus rings (`:focus-visible`, accent-colored) remain visible against translucent `.glass` surfaces in both themes.
- `prefers-reduced-motion: reduce`: ambient blobs render but stay static; existing `.reveal` sections still appear instantly (already covered by current CSS).
- Mobile (`<768px`): parallax is inactive (gated by `matchMedia`); blobs still render statically behind content without causing layout shift or horizontal overflow.
- Resilience: simulate GSAP CDN failure (block the script URLs) and confirm theme toggle, nav, mobile menu, and scroll-reveal all continue to work — only the parallax motion is absent.
- Visual: glass panels remain legible (text contrast holds) over the ambient blobs in both themes, at both light and dark blob-overlap areas.

## Out of Scope

- No content changes, no new sections, no reordering of the six existing sections.
- No change to the existing theme-toggle, smooth-scroll-nav, mobile-nav, or scroll-reveal JS logic beyond adding the new parallax function alongside them.
- No build tooling, no npm/package.json, no bundler — GSAP is the one CDN-script exception, not a precedent for further dependencies.
- No horizontal-scroll project showcase, no scroll-pinned hero, no scroll-progress nav indicator — only ambient-blob parallax depth, per the approved scope.
