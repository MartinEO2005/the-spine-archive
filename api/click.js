import { createClient } from 'redis';

export default async function handler(req, res) {
  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'Falta autor' });

  // Vercel inyecta automáticamente la variable REDIS_URL 
  // cuando conectas el proyecto en el panel de Storage.
  const client = createClient({
    url: process.env.REDIS_URL
  });

  try {
    await client.connect();
    // Registramos el click
    await client.zIncrBy('ranking_authors', 1, author);
    await client.quit();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error Redis:", error);
    return res.status(500).json({ error: error.message });
  }
}