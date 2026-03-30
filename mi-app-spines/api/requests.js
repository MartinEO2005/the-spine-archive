import { createClient } from 'redis';

export default async function handler(req, res) {
  const client = createClient({ url: process.env.REDIS_URL });
  const ADMIN_PASSWORD = "TU_CONTRASEÑA_AQUI"; // Recuerda cambiar esto

  try {
    await client.connect();

    // GET: Obtener todas las peticiones
    if (req.method === 'GET') {
      const keys = await client.keys('request:*');
      if (keys.length === 0) { 
        await client.quit(); 
        return res.status(200).json([]); 
      }
      const data = await Promise.all(keys.map(key => client.get(key)));
      const requests = data
        .filter(item => item !== null)
        .map(item => JSON.parse(item))
        .sort((a, b) => b.createdAt - a.createdAt);
      
      await client.quit();
      return res.status(200).json(requests);
    }

    // POST: Crear nueva petición
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { gameTitle, description, requester, switchVersion, language } = body; 
      
      const id = Date.now().toString();
      const newRequest = { 
        id, 
        gameTitle, 
        description, 
        requester: requester || 'Anonymous', 
        switchVersion: switchVersion || 'Both', 
        language: language || 'English', // Guardamos el nuevo campo
        status: 'pending', 
        claimedBy: [], 
        createdAt: Date.now() 
      };

      await client.set(`request:${id}`, JSON.stringify(newRequest), { EX: 1209600 });
      await client.quit();
      return res.status(200).json(newRequest);
    }

    // PATCH: Actualizar (Claim o añadir Link de referencia)
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { requestId, artistName, refLink } = body; 
      
      const key = `request:${requestId}`;
      const currentRaw = await client.get(key);
      if (!currentRaw) { 
        await client.quit(); 
        return res.status(404).json({ error: 'Not found' }); 
      }

      const current = JSON.parse(currentRaw);
      
      // Si un artista reclama la petición
      if (artistName) {
        const currentClaims = Array.isArray(current.claimedBy) ? current.claimedBy : [];
        if (!currentClaims.includes(artistName)) currentClaims.push(artistName);
        current.claimedBy = currentClaims;
        current.status = 'in-progress';
      }

      // Si alguien aporta un enlace de referencia
      if (refLink) {
        current.refLink = refLink;
      }

      await client.set(key, JSON.stringify(current), { EX: 604800 });
      await client.quit();
      return res.status(200).json(current);
    }

    // DELETE: Borrar petición (Solo admin/artista con contraseña)
    if (req.method === 'DELETE') {
      const { requestId, password } = req.query;
      if (password !== ADMIN_PASSWORD) { 
        await client.quit(); 
        return res.status(401).json({ error: 'Unauthorized' }); 
      }
      await client.del(`request:${requestId}`);
      await client.quit();
      return res.status(200).json({ success: true });
    }

    await client.quit();
    return res.status(405).end();
  } catch (error) {
    if (client.isOpen) await client.quit();
    return res.status(500).json({ error: error.message });
  }
}