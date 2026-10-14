# Kurian Benny — personal website

A static Astro portfolio for `https://kurianbenny.github.io`. Content is kept in Markdown and generated as HTML at build time. No backend is required.

## Local development

```sh
npm ci
npm run dev
```

`npm run check` checks TypeScript and Astro templates. `npm run build` creates `dist/`. `npm run preview` serves the production build.

## Edit content

- Blog: `src/content/blog/*.md`. Use `title`, `description`, `date` (YYYY-MM-DD), `category`, optional `draft`, and `image` / `imageAlt` frontmatter. The filename determines `/blog/filename/`. Drafts are excluded from listings and generated pages. Start with the included draft and set `draft: false` when ready.
- Services: `src/content/services/*.md`. Use `title`, `description`, `order`, and `label`. Each file generates `/services/filename/` and appears in the service listings.
- FAQs: `src/content/faq/*.md`. Use `title` (question), `description`, and `order`. The Markdown body is the answer, rendered in the FAQ page.
- About profile: `src/content/profile/about.md`. Technical background: `src/data/expertise.ts`.
- Profile/homepage: `src/pages/index.astro`. Navigation and footer: `src/layouts/Base.astro`. Styling: `src/styles/global.css`.

Keep filenames lowercase with hyphens and use flat content folders. Frontmatter is validated during the build. Content changes appear after the site rebuilds; Markdown is not edited by visitors.

## GitHub Pages

The included workflow builds and deploys pushes to `master` and can be run manually. In repository Settings → Pages, select **GitHub Actions** as the source. Verify the deployment branch before pushing if using a different branch. `astro.config.mjs` uses the root user-site domain, so no repository base path is needed. Nothing has been pushed or deployed by the local rebuild.

The contact page includes disabled email and WhatsApp placeholders, with GitHub as the current usable contact link. Update the configuration below before enabling enquiries. Service and article copy should be reviewed before publication.

Deployment approach reference: [Astro GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/).

## Contact form and WhatsApp setup

`src/config/contact.ts` holds the temporary email (`hello@example.com`) and WhatsApp number (`910000000000`). These are explicitly disabled placeholders. Name, email, phone (optional), message, and an optional service selection are on `/contact/`.

1. Replace `email` with the real inbox and set `formEnabled: true`. The form uses a standard POST to [FormSubmit](https://formsubmit.co/documentation), with the provider’s reCAPTCHA enabled and an additional honeypot. Human verification occurs on the provider’s page; it is not a simulated checkbox or a client-only security check.
2. After deploying, complete FormSubmit’s email activation, then test delivery to your own inbox and verify the return page. Delivery and CAPTCHA have not been tested with the dummy email.
3. Replace `whatsappNumber` with the real international digits, without `+` or spaces, and set `whatsappEnabled: true`. Update `whatsappMessage` if desired. Both the contact page and floating button use this configuration.
4. Rebuild. Placeholder checks prevent enabling the included example email and number by accident.

No messages are sent while the placeholder configuration is active. A short privacy page explains the form processor and contact channels.

## Search and AI search foundations

The build generates `/sitemap.xml` and `/rss.xml`, excluding drafts. Canonical URLs, page descriptions, Open Graph/Twitter previews, and Person/WebSite/WebPage structured data are included. Blog articles additionally use BlogPosting data; service pages use Service data. Confirmation and 404 pages use `noindex`. Social preview art is in `public/social-card.svg` and the rendered PNG is `public/social-card.png`.

These are technical foundations, not guarantees of indexing, rankings, or AI citations. The eight published Markdown articles cover SEO, AI website building, professional launch support, hosting, MVP development, customer tracking, server migration, and legacy upgrades. Google’s [AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) recommends the same foundational SEO practices for AI features. Review article copy before publishing under your name.

After deployment, add the site to your own Search Console account, submit the sitemap, and inspect key URLs. These account-level actions have not been performed.

## Personal design refresh

The homepage includes a portrait, an expanded introduction, technical background, services, an approach section, project starting points, and recent writing. `/about/` renders the Markdown profile. The portrait in `public/kurian-benny.jpg` was recovered from the original site backup. No unverified projects, employers, client logos, testimonials, or outcomes have been added.

The profile now presents full-stack development and DevOps across React, Next.js, major PHP frameworks and CMS platforms, Django Ninja, FastAPI, Ruby on Rails, ERPNext, AWS, DigitalOcean, VPS hosting, and server management. The backend service is `/services/backend-development/`.

## Technology logos and readability

Recognizable technology logos are stored locally under `public/icons/`; their source information is recorded in `public/icons/ATTRIBUTION.md`. `src/components/TechIcon.astro` renders them with readable text labels. `src/data/technologies.ts` controls the featured toolkit. MySQL and NoSQL are included in the expertise data, profile, FAQ, and backend service.

Navigation, footer, labels, and body copy use larger type and stronger contrast. The mobile/tablet menu provides larger targets, and the footer reserves room for the floating WhatsApp button.

## Blog cover images

Every published article requires `image` (a local `/images/blog/slug.webp` path) and `imageAlt`. Hidden drafts may omit them. Covers are 1280 × 720 WebP, with matching `-960.webp` and `-480.webp` responsive versions. Cards and article pages use the appropriate size through `srcset`; each article’s cover is also used in its social and structured metadata.

All 24 current WebP files are below 400,000 bytes. Image measurements are recorded in `docs/blog-image-assets.json`. The images were created with the built-in image generation tool; the exact prompt set is in `docs/blog-image-prompts.json`. Final assets live in `public/images/blog/`. The illustrations are conceptual, rather than screenshots of client products.

## Microsoft Clarity

The shared head in `src/layouts/Base.astro` loads the official asynchronous tracking snippet for project `yxlkv78ov4`. It runs only on `https://kurianbenny.github.io`, excluding localhost and preview hosts. This uses the manual installation method, so the NPM SDK is not needed. If the production domain changes, update the origin guard. The contact form has `data-clarity-mask="True"`, and the privacy page discloses analytics.

After deploying, verify requests to `https://www.clarity.ms/collect` and activity in the Clarity dashboard. Dashboard collection and project consent settings have not been verified locally. See [Microsoft’s installation guide](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup).
