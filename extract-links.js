import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const extractLinks = async () => {
  const client = createClient({ url: process.env.REDIS_URL });

  try {
    console.log("Conectando a Vercel Redis y extrayendo links de referencia...");
    await client.connect();

    // Buscar las llaves de las peticiones
    const keys = await client.keys('request:*');

    if (!keys || keys.length === 0) {
      console.log("No hay peticiones activas en la base de datos.");
      await client.quit();
      return;
    }

    // Traer todos los datos
    const data = await Promise.all(keys.map(key => client.get(key)));
    const redditLinks = [];

    data.forEach(item => {
      if (item !== null) {
        const parsed = JSON.parse(item);
        // Si la petición tiene un refLink y es de Reddit, lo guardamos
        if (parsed.refLink && parsed.refLink.toLowerCase().includes('reddit.com')) {
          redditLinks.push(parsed.refLink.trim());
        }
      }
    });

    // Eliminar duplicados si enviaron el mismo link
    const uniqueLinks = [...new Set(redditLinks)];

    if (uniqueLinks.length === 0) {
        console.log("No se encontraron links de Reddit pendientes en las peticiones.");
        await client.quit();
        return;
    }

    const folderName = 'extractions';
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }

    // Usamos el prefijo 'links-' para no sobreescribir el JSON de los nombres de juegos
    const today = new Date().toISOString().split('T')[0];
    const fileName = path.join(folderName, `links-${today}.json`);

    fs.writeFileSync(
      fileName, 
      JSON.stringify(uniqueLinks, null, 2)
    );

    console.log(`¡Éxito! Se han guardado ${uniqueLinks.length} links en '${fileName}'.`);

    await client.quit();
  } catch (error) {
    console.error("Error extrayendo los links:", error);
    if (client.isOpen) await client.quit();
  } finally {
    process.exit(0);
  }
};

extractLinks();