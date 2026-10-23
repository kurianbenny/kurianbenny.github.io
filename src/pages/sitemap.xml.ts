import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { escapeXml } from '../lib/xml';
export const GET: APIRoute = async ({ site }) => {
 const services=await getCollection('services');
 const posts=await getCollection('blog',({data})=>!data.draft);
 const totalPages=Math.ceil(posts.length/9);
 const blogPages=Array.from({length:totalPages-1},(_,i)=>`/blog/${i+2}/`);
 const routes=['/about/','/','/services/','/blog/',...blogPages,'/faq/','/contact/','/privacy/',...services.map(s=>`/services/${s.id}/`),...posts.map(p=>`/blog/${p.id}/`)];
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path=>`<url><loc>${escapeXml(new URL(path,site).href)}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
