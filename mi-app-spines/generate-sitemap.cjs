const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://thespinearchive.com';
const DATABASE_PATH = path.join(process.cwd(), 'public', 'database.json');
const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');

// Función helper para escapar caracteres XML de forma segura en URLs y textos
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

try {
  if (!fs.existsSync(DATABASE_PATH)) {
    throw new Error(`No se encontró el archivo database.json en ${DATABASE_PATH}`);
  }

  const data = fs.readFileSync(DATABASE_PATH, 'utf8');
  const spines = JSON.parse(data);
  const today = new Date().toISOString().split('T')[0];

  console.log(`🚀 Generando sitemap con imágenes para ${spines.length} juegos...`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Página principal
  xml += `  <url>\n`;
  xml += `    <loc>${escapeXml(BASE_URL)}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Secciones secundarias esenciales (se incluye 'privacy' indispensable para AdSense)
  const staticViews = ['about', 'legal', 'privacy', 'requests', 'stats'];

  staticViews.forEach(view => {
    const url = `${BASE_URL}/?view=${view}`;
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(url)}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  });

  // URLs dinámicas para cada Spine
  spines.forEach(spine => {
    const rawSlug = spine.title
      ? spine.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')
      : (spine.id || '');

    if (!rawSlug) return; // Omitir elementos sin título o ID válido

    const pageUrl = `${BASE_URL}/?search=${encodeURIComponent(rawSlug)}`;

    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(pageUrl)}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;

    // Procesamiento y sanitización de imagen
    const rawImgUrl = spine.image || spine.src;
    if (rawImgUrl) {
      // Google exige URLs absolutas para las imágenes
      let fullImgUrl = rawImgUrl;
      if (!rawImgUrl.startsWith('http://') && !rawImgUrl.startsWith('https://')) {
        fullImgUrl = `${BASE_URL}${rawImgUrl.startsWith('/') ? '' : '/'}${rawImgUrl}`;
      }

      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(fullImgUrl)}</image:loc>\n`;
      if (spine.title) {
        xml += `      <image:title>${escapeXml(spine.title)}</image:title>\n`;
      }
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log('✅ ¡Sitemap generado con éxito sin errores en /public/sitemap.xml!');

} catch (err) {
  console.error('❌ Error generando el sitemap:', err.message);
  process.exit(1);
}