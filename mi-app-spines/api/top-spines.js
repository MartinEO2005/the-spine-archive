import { createClient } from 'redis';

export default async function handler(req, res) {
  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'Falta autor' });

  const client = createClient({ url: process.env.REDIS_URL });

  try {
    await client.connect();
    // Traemos las 5 spines con más puntuación de ese autor
    const rawRanking = await client.zRangeWithScores(`spines_${author}`, 0, 4, { REV: true });
    await client.quit();

    const topSpines = rawRanking.map(item => ({
      spineId: item.value,
      clicks: item.score
    }));

    return res.status(200).json({ topSpines });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}