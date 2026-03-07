import { createClient } from 'redis';

export default async function handler(req, res) {
  // Solo permitimos clics, ignoramos otras peticiones
  if (req.method !== 'GET') return res.status(405).end();

  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'Falta autor' });

  const client = createClient({
    url: process.env.REDIS_URL
  });

  try {
    await client.connect();
    // Registramos en el ranking
    await client.zIncrBy('ranking_authors', 1, author);
    await client.quit();
    
    // Respondemos éxito
    return res.status(200).json({ success: true, author });
  } catch (error) {
    // Si hay error de conexión, lo veremos en los logs de Vercel
    console.error("Detalle del error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}