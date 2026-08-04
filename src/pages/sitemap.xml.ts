import type { APIRoute } from 'astro';

const BASE_URL = 'https://elhombredeamarillo.com';

const staticPages = ['', '/videos', '/expedientes'];

export const GET: APIRoute = () => {
  const pages = staticPages
    .map(
      (path) => `  <url>
    <loc>${BASE_URL}${path}</loc>
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
