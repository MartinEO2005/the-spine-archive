const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://thespinearchive.com'; // Asegúrate de que sea tu dominio definitivo
const DATABASE_PATH = path.join(process.cwd(), 'public', 'database.json');
const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');

try {
  if (!fs.existsSync(DATABASE_PATH)) {
    throw new Error(`No se encontró el archivo database.json en ${DATABASE_PATH}`);
  }

  const data = fs.readFileSync(DATABASE_PATH, 'utf8');
  const spines = JSON.parse(data);
  const today = new Date().toISOString().split('T')[0];

  console.log(`🚀 Generando sitemap con imágenes para ${spines.length} juegos...`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <priority>1.0</priority>
  </url>`;

  // Secciones secundarias usando parámetros query (compatibles con tu App sin router)
  ['stats', 'requests', 'about', 'legal'].forEach(view => {
    xml += `
  <url>
    <loc>${BASE_URL}/?view=${view}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.6</priority>
  </url>`;
  });

  // URLs dinámicas para cada Spine
  spines.forEach(spine => {
    const slug = spine.title
      ? spine.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')
      : spine.id;
    const imgUrl = spine.image || spine.src;
    const cleanTitle = (spine.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    xml += `
  <url>
    <loc>${BASE_URL}/?search=${encodeURIComponent(slug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>`;
    if (imgUrl) {
      xml += `
    <image:image>
      <image:loc>${imgUrl}</image:loc>
      <image:title>${cleanTitle}</image:title>
    </image:image>`;
    }
    xml += `
  </url>`;
  });

  xml += `\n</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log('✅ ¡Sitemap generado con éxito en /public/sitemap.xml!');

} catch (err) {
  console.error('❌ Error generando el sitemap:', err.message);
  process.exit(1);
}