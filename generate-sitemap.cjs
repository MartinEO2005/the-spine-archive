const fs = require('fs');
const path = require('path');

// 1. Configuración
const BASE_URL = 'https://thespinearchive.vercel.app';
const DATABASE_PATH = path.join(__dirname, 'public', 'database.json');
const SITEMAP_PATH = path.join(__dirname, 'public', 'sitemap.xml');

try {
  // 2. Leer la base de datos
  const data = fs.readFileSync(DATABASE_PATH, 'utf8');
  const spines = JSON.parse(data);

  console.log(`Generando sitemap para ${spines.length} juegos...`);

  // 3. Crear el encabezado del XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <priority>1.0</priority>
  </url>`;

  // 4. Añadir cada juego (usando el título para la URL si es posible)
  spines.forEach(spine => {
    // Creamos una URL amigable (ej: "Super Mario" -> "super-mario")
    const slug = spine.title
      ? encodeURIComponent(spine.title.toLowerCase().replace(/\s+/g, '-'))
      : spine.id;

    xml += `
  <url>
    <loc>${BASE_URL}/?search=${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `\n</urlset>`;

  // 5. Guardar el archivo
  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log('¡Sitemap generado con éxito en /public/sitemap.xml!');

} catch (err) {
  console.error('Error generando el sitemap:', err);
}