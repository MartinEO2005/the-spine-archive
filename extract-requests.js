import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const extractRequests = async () => {
  const client = createClient({ url: process.env.REDIS_URL });

  try {
    console.log("Conectando a Vercel Redis y extrayendo peticiones...");
    await client.connect();

    // Buscar las llaves de las peticiones
    const keys = await client.keys('request:*');

    if (!keys || keys.length === 0) {
      console.log("No hay peticiones activas en la base de datos.");
      await client.quit();
      return;
    }

    // Traer todos los datos de golpe
    const data = await Promise.all(keys.map(key => client.get(key)));
    const searchTerms = [];

    data.forEach(item => {
      if (item !== null) {
        const parsed = JSON.parse(item);
        if (parsed.gameTitle) {
          // Guardamos ÚNICAMENTE la versión en minúsculas
          const titleLower = parsed.gameTitle.trim().toLowerCase();
          searchTerms.push(titleLower);
        }
      }
    });

    // Eliminar duplicados si varios usuarios pidieron el mismo juego
    const uniqueSearchTerms = [...new Set(searchTerms)];

    // --- LÓGICA DE CARPETA Y FECHA ---
    const folderName = 'extractions';
    
    // Si la carpeta 'extractions' no existe en la raíz, el script la crea sola
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
      console.log(`Carpeta '${folderName}' creada en la raíz.`);
    }

    // Generar la fecha actual en formato AAAA-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const fileName = path.join(folderName, `${today}.json`);

    // Guardar el archivo JSON dentro de la carpeta
    fs.writeFileSync(
      fileName, 
      JSON.stringify(uniqueSearchTerms, null, 2)
    );

    console.log(`¡Éxito! Se han guardado ${uniqueSearchTerms.length} términos en '${fileName}'.`);

    await client.quit();
  } catch (error) {
    console.error("Error extrayendo los datos:", error);
    if (client.isOpen) await client.quit();
  } finally {
    process.exit(0);
  }
};

extractRequests();