import type { APIRoute } from 'astro';

const BASE_URL = 'https://elhombredeamarillo.vercel.app';

const staticPages = [
  { path: '', lastmod: '2026-08-19' },
  { path: '/videos', lastmod: '2026-08-19' },
  { path: '/expedientes', lastmod: '2026-08-19' },
];

export const GET: APIRoute = () => {
  const pages = staticPages
    .map(
      ({ path, lastmod }) => `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
