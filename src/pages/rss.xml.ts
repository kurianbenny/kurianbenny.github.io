import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { escapeXml } from '../lib/xml';
export const GET: APIRoute = async ({ site }) => {
 const posts=(await getCollection('blog',({data})=>!data.draft)).sort((a,b)=>b.data.date.valueOf()-a.data.date.valueOf());
 const items=posts.map(post=>{const url=escapeXml(new URL(`/blog/${post.id}/`,site).href);return `<item><title>${escapeXml(post.data.title)}</title><description>${escapeXml(post.data.description)}</description><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${post.data.date.toUTCString()}</pubDate></item>`;}).join('');
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Kurian Benny — Writing</title><link>${escapeXml(new URL('/blog/',site).href)}</link><description>Development notes and perspectives from Kurian Benny.</description><language>en</language>${items}</channel></rss>`,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
};
