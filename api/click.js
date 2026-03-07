import { Redis } from '@upstash/redis';

// Usamos el constructor automático que lee las variables de Vercel
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const { author } = req.query;
  
  if (!author) return res.status(400).json({ error: 'No author' });

  try {
    // IMPORTANTE: Asegúrate de que el nombre coincide con el de stats.js
    await redis.zincrby('ranking_authors', 1, author);
    return res.status(200).json({ success: true, author });
  } catch (error) {
    console.error("Error en Redis:", error);
    return res.status(500).json({ error: error.message });
  }
}