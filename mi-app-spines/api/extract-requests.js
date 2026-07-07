import { createClient } from 'redis';
import fs from 'fs';
import 'dotenv/config'; 

const extractRequests = async () => {
  const client = createClient({ url: process.env.REDIS_URL });

  try {
    await client.connect();
    console.log("Conectado a Redis. Buscando peticiones...");

    const keys = await client.keys('request:*');
    
    if (keys.length === 0) {
      console.log("No hay peticiones en la base de datos.");
      await client.quit();
      return;
    }

    const data = await Promise.all(keys.map(key => client.get(key)));
    const searchTerms = [];

    data.forEach(item => {
      if (item !== null) {
        const parsed = JSON.parse(item);
        if (parsed.gameTitle) {
          const title = parsed.gameTitle.trim();
          
          // Generamos la variante original y la versión en minúsculas
          searchTerms.push(title);
          searchTerms.push(title.toLowerCase());
        }
      }
    });

    // Eliminamos duplicados
    const uniqueSearchTerms = [...new Set(searchTerms)];

    // Guardamos el resultado en un archivo JSON local
    fs.writeFileSync(
      'scraper_queue.json', 
      JSON.stringify(uniqueSearchTerms, null, 2)
    );

    console.log(`¡Éxito! Se han guardado ${uniqueSearchTerms.length} términos de búsqueda en 'scraper_queue.json'.`);

  } catch (error) {
    console.error("Error extrayendo los datos:", error);
  } finally {
    if (client.isOpen) await client.quit();
    process.exit(0);
  }
};

extractRequests();