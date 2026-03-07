const { createClient } = require('redis');

module.exports = async (req, res) => {
  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'Falta autor' });

  const client = createClient({ url: process.env.REDIS_URL });

  try {
    await client.connect();
    // Usamos el mismo nombre de conjunto: 'ranking_authors'
    await client.zIncrBy('ranking_authors', 1, author);
    await client.quit();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error en Click:", error.message);
    return res.status(500).json({ error: error.message });
  }
};