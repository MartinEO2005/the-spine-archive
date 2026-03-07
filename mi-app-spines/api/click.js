import { createClient } from 'redis';

export default async function handler(req, res) {
  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'Falta autor' });

  const client = createClient({
    url: process.env.REDIS_URL
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  try {
    await client.connect();
    await client.zIncrBy('ranking_authors', 1, author);
    await client.quit();
    
    return res.status(200).json({ success: true, author });
  } catch (error) {
    console.error("ERROR REDIS:", error.message);
    return res.status(500).json({ error: error.message });
  }
}