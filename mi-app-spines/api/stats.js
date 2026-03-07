const { createClient } = require('redis');

module.exports = async (req, res) => {
  // Solo permitimos GET
  if (req.method !== 'GET') return res.status(405).end();

  const client = createClient({ url: process.env.REDIS_URL });
  
  try {
    await client.connect();
    // Obtenemos los 5 mejores
    const rawRanking = await client.zRangeWithScores('ranking_authors', 0, 4, { REV: true });
    await client.quit();

    // Formateamos como espera tu StatsView: { ranking: [...] }
    const ranking = rawRanking.map(item => ({
      author: item.value,
      clicks: item.score
    }));

    return res.status(200).json({ ranking });
  } catch (error) {
    console.error("Error en Stats:", error.message);
    return res.status(500).json({ ranking: [], error: error.message });
  }
};