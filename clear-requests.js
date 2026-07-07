import { createClient } from 'redis';
import 'dotenv/config';

const clearRequests = async () => {
  const client = createClient({ url: process.env.REDIS_URL });

  try {
    console.log("Conectando a Vercel Redis para iniciar limpieza...");
    await client.connect();

    const keys = await client.keys('request:*');

    if (!keys || keys.length === 0) {
      console.log("La base de datos ya está completamente limpia.");
      await client.quit();
      return;
    }

    // Borramos todas las peticiones encontradas de golpe
    await Promise.all(keys.map(key => client.del(key)));

    console.log(`¡Limpieza completada! Se han eliminado ${keys.length} registros.`);
    await client.quit();
  } catch (error) {
    console.error("Error al limpiar la base de datos:", error);
    if (client.isOpen) await client.quit();
  } finally {
    process.exit(0);
  }
};

clearRequests();