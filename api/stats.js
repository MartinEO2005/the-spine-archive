import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  try {
    const rawRanking = await redis.zrange('ranking_authors', 0, 4, { rev: true, withScores: true });
    
    const ranking = [];
    for (let i = 0; i < rawRanking.length; i += 2) {
      ranking.push({ author: rawRanking[i], clicks: rawRanking[i + 1] });
    }

    return res.status(200).json({ ranking });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}