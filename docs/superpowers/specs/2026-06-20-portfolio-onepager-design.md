# One-Page Portfolio — Design Spec

Date: 2026-06-20

## Summary

Rebuild `kurianbenny.github.io` as a single-page personal portfolio site, built from the content in `README.md`. Plain HTML/CSS/JS — no frameworks, no build step, no external JS libraries. The previous framework-based site (Bootstrap, jQuery, assorted plugins) has already been removed from the working tree; this is a from-scratch build.

## Content Source of Truth

All copy content comes from `README.md`:
- Identity: **Kurian Benny** — *Full-Stack Developer & Cloud Engineer*
- Contact: email `kurianbenny@gmail.com`, GitHub `github.com/kurianbenny`, LinkedIn `linkedin.com/in/kurian-benny`
- No resume file or live project links available yet — both are explicitly deferred (see Out of Scope).
- A profile photo will be added later; hero ships with a placeholder/initials avatar.

## File Structure

```
index.html
css/style.css
js/main.js
assets/images/        (profile.jpg placeholder dropped in later)
favicon.ico
README.md
```

Single CSS file, single JS file, no bundler, no package.json. Fonts loaded via a Google Fonts `<link>` tag.

## Page Sections (in order, anchor-linked from nav)

1. **Hero** — name, title, one-line value proposition, photo slot (placeholder/initials avatar until a real photo is added), CTA buttons ("View Work" → scrolls to Projects, "Contact" → scrolls to Contact).
2. **About** — condensed version of the README's Professional Summary.
3. **Experience Highlights** — the 8 bullet highlights from the README, presented as a scannable list or stat-style row (e.g. "12+ Years", "Multiple SaaS Platforms").
4. **Technical Skills** — grouped tag/pill grid by category: Languages, Backend, Frontend, Databases, Cloud Platforms, AWS Services, DevOps & Infrastructure, AI & Automation.
5. **Featured Projects** — 4 cards from the README (AI Recruitment Platform, Multi-Tenant SaaS Applications, E-Commerce Solutions, OCR and Document Processing Platform), each with description + tech-stack tags. No links (descriptive cards only).
6. **Services** — the 8 services from the README, icon + label grid.
7. **Contact / Footer** — email, GitHub, LinkedIn links with inline SVG icons; copyright line.

Sticky nav bar across the top with: logo/name, anchor links to each section, theme toggle, mobile hamburger menu below a breakpoint.

## Visual Design

Base palette and type pairing sourced from the `ui-ux-pro-max` skill's design-system generator for a "developer / cloud engineer, dark-tech, minimal" brief, adapted with a complementary light variant since a toggle is required:

**Dark (default):**
- Background `#0F172A`, surface `#1E293B`, secondary surface `#334155`, text `#F8FAFC`, muted text `#94A3B8`, border `#475569`, accent `#22C55E`.

**Light (toggle):**
- Background `#F8FAFC`, surface `#FFFFFF`, secondary surface `#E2E8F0`, text `#0F172A`, muted text `#475569`, border `#CBD5E1`, accent `#16A34A` (darkened for AA contrast on white).

Both themes expressed as CSS custom properties on `:root` / `[data-theme="light"]`, so the rest of the CSS never branches on theme directly.

**Typography:** Space Grotesk for headings, Archivo (or system sans fallback) for body text, loaded with `font-display: swap`. Type scale: 12/14/16/18/24/32/48px steps.

**Effects:** subtle accent glow (`text-shadow`/`box-shadow` at low opacity) on key CTAs only; no skeuomorphism, no emoji-as-icon — all icons are inline SVG (skills categories, services, social links).

**Layout:** mobile-first, breakpoints at 375 / 768 / 1024 / 1440px, max content width ~1100px, 8px spacing scale throughout, no horizontal scroll at any breakpoint.

## Interactivity (`js/main.js`, vanilla JS only)

- **Theme toggle**: switches `data-theme` attribute on `<html>`, persists choice in `localStorage`, defaults to dark on first visit. Toggle icon (sun/moon) swaps accordingly.
- **Smooth scroll + active nav highlighting**: clicking a nav link scrolls to the section; an `IntersectionObserver` tracks which section is in view and highlights the corresponding nav item.
- **Mobile nav**: hamburger button toggles an off-canvas/dropdown menu below the tablet breakpoint; closes on link click or outside click.
- **Scroll-reveal**: sections fade/slide in once when they enter the viewport, via `IntersectionObserver`. Skipped entirely (no animation, content visible immediately) when `prefers-reduced-motion: reduce` is set.

## Accessibility & Performance

- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), one `h1`, sequential heading levels.
- Skip-to-content link for keyboard users.
- Minimum 4.5:1 text contrast in both themes (verified against the palettes above).
- All interactive elements (nav links, toggle, CTAs, hamburger) ≥44×44px touch target, visible focus rings.
- No layout-shift-causing animations (`transform`/`opacity` only); reserved space for the hero photo slot to avoid CLS once a real image is added.
- No external JS dependencies; only network request beyond the page itself is the Google Fonts stylesheet.

## Out of Scope

- Resume download button (no PDF available yet — markup should leave an easy slot to add later, but no broken/dead link in this version).
- Live links for the 4 featured projects (cards are descriptive-only for now).
- Any backend, build tooling, or analytics integration.

## Testing / Verification

Since this is a static site with no test framework, verification is manual:
- Open `index.html` directly and via a local static server.
- Check both themes for contrast and visual correctness.
- Resize through 375 / 768 / 1024 / 1440px and confirm no horizontal scroll or broken layout.
- Verify keyboard navigation (tab order, focus visibility, skip link) and `prefers-reduced-motion` behavior.
- Run a quick HTML/CSS validation pass and Lighthouse accessibility check if available.
