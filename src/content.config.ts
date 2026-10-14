import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const common = { title: z.string(), description: z.string() };
const blog = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/blog' }), schema: z.object({ ...common, date: z.coerce.date(), category: z.string(), draft: z.boolean().default(false), image: z.string().regex(/^\/images\/blog\/[a-z0-9-]+\.webp$/).optional(), imageAlt: z.string().min(1).optional() }).refine(data => data.draft || Boolean(data.image && data.imageAlt), { message: "Published blog posts need a WebP cover image and descriptive imageAlt." }) });
const services = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/services' }), schema: z.object({ ...common, order: z.number(), label: z.string() }) });
const faq = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/faq' }), schema: z.object({ ...common, order: z.number() }) });
const profile = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/profile' }), schema: z.object(common) });
export const collections = { blog, services, faq, profile };
