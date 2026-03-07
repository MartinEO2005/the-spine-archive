import { createClient } from 'redis';

export default async function handler(req, res) {
  const { author } = req.query;
  if (!author) return res.status(400).json({ error: 'Autor no proporcionado' });

  // Usamos REDIS_URL que ya tienes en tus variables de Vercel
  const client = createClient({
    url: process.env.REDIS_URL
  });

  // Capturamos errores de la librería para que no crashee el servidor
  client.on('error', err => console.error('Error de Cliente Redis:', err));

  try {
    await client.connect();
    // Registramos el incremento en el Sorted Set
    await client.zIncrBy('ranking_authors', 1, author);
    await client.quit();
    
    return res.status(200).json({ success: true, message: `Voto registrado para ${author}` });
  } catch (error) {
    // Si falla la conexión, devolvemos el error pero con formato JSON
    return res.status(500).json({ 
      error: "Error de conexión a la base de datos",
      details: error.message 
    });
  }
}