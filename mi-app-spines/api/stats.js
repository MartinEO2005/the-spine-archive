import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    // zrange con rev: true y withScores: true nos devuelve los IDs ordenados del más al menos popular
    const ranking = await redis.zrange('ranking_spines', 0, -1, { rev: true, withScores: true });
    res.status(200).json(ranking);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
}