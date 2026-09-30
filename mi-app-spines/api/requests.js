import { createClient } from 'redis';

export default async function handler(req, res) {
  const client = createClient({ url: process.env.REDIS_URL });
  const ADMIN_PASSWORD = "TU_CONTRASEÑA_AQUI"; 
  const EXPIRE_45_DAYS = 45 * 24 * 60 * 60; // 3,888,000 segundos

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

    // POST: Crear nueva petición con restricción de 5 por usuario
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { gameTitle, description, requester, switchVersion, language } = body; 
      
      const userClean = (requester || 'Anonymous').trim().toLowerCase();

      // Verificar peticiones actuales del usuario
      const keys = await client.keys('request:*');
      const allData = await Promise.all(keys.map(k => client.get(k)));
      const activeUserRequests = allData
        .filter(Boolean)
        .map(raw => JSON.parse(raw))
        .filter(item => (item.requester || '').trim().toLowerCase() === userClean);

      if (activeUserRequests.length >= 5) {
        await client.quit();
        return res.status(400).json({ error: 'You have reached the maximum limit of 5 active requests.' });
      }

      const id = Date.now().toString();
      const newRequest = { 
        id, 
        gameTitle, 
        description, 
        requester: requester || 'Anonymous', 
        switchVersion: switchVersion || 'Both', 
        language: language || 'English',
        status: 'pending', 
        claimedBy: [], 
        createdAt: Date.now() 
      };

      // Guardar con expiración de 45 días
      await client.set(`request:${id}`, JSON.stringify(newRequest), { EX: EXPIRE_45_DAYS });
      await client.quit();
      return res.status(200).json(newRequest);
    }

    // PATCH: Actualizar
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
      
      if (artistName) {
        const currentClaims = Array.isArray(current.claimedBy) ? current.claimedBy : [];
        if (!currentClaims.includes(artistName)) currentClaims.push(artistName);
        current.claimedBy = currentClaims;
        current.status = 'in-progress';
      }

      if (refLink) {
        current.refLink = refLink;
      }

      await client.set(key, JSON.stringify(current), { KEEPTTL: true });
      await client.quit();
      return res.status(200).json(current);
    }

    // DELETE: Borrar petición
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