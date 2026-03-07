import { createClient } from 'redis';

export default async function handler(req, res) {
  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'No author' });

  // Conexión usando la variable que Vercel inyectó (REDIS_URL)
  const client = createClient({ url: process.env.REDIS_URL });
  
  try {
    await client.connect();
    await client.zIncrBy('ranking_authors', 1, author);
    await client.disconnect();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}