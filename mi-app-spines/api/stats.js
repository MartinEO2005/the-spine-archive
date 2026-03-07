import { createClient } from 'redis';

export default async function handler(req, res) {
  const client = createClient({
    url: process.env.REDIS_URL
  });

  try {
    await client.connect();
    const rawRanking = await client.zRangeWithScores('ranking_authors', 0, 4, { REV: true });
    await client.quit();

    const ranking = rawRanking.map(item => ({
      author: item.value,
      clicks: item.score
    }));

    return res.status(200).json({ ranking });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}