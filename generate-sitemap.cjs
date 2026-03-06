const fs = require('fs');
const path = require('path');
// URL base de tu sitio
const BASE_URL = 'https://thespinearchive.vercel.app';
// Ajustamos la ruta para que encuentre el database.json correctamente
const DATABASE_PATH = path.join(process.cwd(), 'public', 'database.json');
const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');

try {
  const data = fs.readFileSync(DATABASE_PATH, 'utf8');
  const spines = JSON.parse(data);
  const today = new Date().toISOString().split('T')[0];

  console.log(`🚀 Generando sitemap para ${spines.length} juegos...`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <priority>1.0</priority>
  </url>`;

  spines.forEach(spine => {
    // Limpiamos el título para la URL: minúsculas, sin caracteres especiales y guiones por espacios
    const slug = spine.title
      ? spine.title.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Quita símbolos raros
          .replace(/\s+/g, '-')         // Espacios por guiones
      : spine.id;

    xml += `
  <url>
    <loc>${BASE_URL}/?search=${encodeURIComponent(slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  xml += `\n</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log('✅ ¡Sitemap generado con éxito en /public/sitemap.xml!');

} catch (err) {
  console.error('❌ Error generando el sitemap:', err);
}