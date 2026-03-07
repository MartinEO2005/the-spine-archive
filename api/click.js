import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const author = req.query.author;
  
  if (!author) {
    return res.status(400).json({ error: 'Falta el nombre del autor' });
  }

  try {
    // Usamos 'ranking_authors' para que coincida con lo que busca el stats
    await redis.zincrby('ranking_authors', 1, author);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error guardando el clic' });
  }
}