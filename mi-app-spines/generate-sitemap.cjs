const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://thespinearchive.vercel.app';
// process.cwd() apunta a la raíz del proyecto en Vercel
const DATABASE_PATH = path.join(process.cwd(), 'public', 'database.json');
const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');

try {
  if (!fs.existsSync(DATABASE_PATH)) {
    throw new Error(`No se encontró el archivo database.json en ${DATABASE_PATH}`);
  }

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
    // Generar slug limpio: minúsculas, solo letras/números y guiones
    const slug = spine.title
      ? spine.title.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
          .replace(/\s+/g, '-')
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
  console.error('❌ Error generando el sitemap:', err.message);
  // Salimos con error para que Vercel detenga el build si el sitemap falla
  process.exit(1);
}