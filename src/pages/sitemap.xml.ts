import type { APIRoute } from 'astro';

const pages = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/videos/', changefreq: 'weekly', priority: '0.9' },
  { path: '/expedientes/', changefreq: 'weekly', priority: '0.8' },
  { path: '/trivial/', changefreq: 'monthly', priority: '0.7' },
  { path: '/the-road/', changefreq: 'monthly', priority: '0.7' },
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://elhombredeamarillo.vercel.app');
  // En un sitio estático no hay fecha de contenido por página: usamos la del build.
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = pages
    .map(
      ({ path, changefreq, priority }) => `  <url>
    <loc>${new URL(path, base).href}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
