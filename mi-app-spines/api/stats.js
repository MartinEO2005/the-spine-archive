import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    // Traemos los 5 mejores. Redis devuelve [autor, score, autor, score...]
    const rawRanking = await redis.zrange('ranking_authors', 0, 4, { rev: true, withScores: true });
    
    // Lo formateamos para que sea fácil de leer en React
    const ranking = [];
    for (let i = 0; i < rawRanking.length; i += 2) {
      ranking.push({
        author: rawRanking[i],
        clicks: rawRanking[i + 1]
      });
    }

    res.status(200).json({ ranking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
}