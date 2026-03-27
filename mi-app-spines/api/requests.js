import { createClient } from 'redis';

export default async function handler(req, res) {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.log('Redis Client Error', err));

  const ADMIN_PASSWORD = "TU_CONTRASEÑA_AQUI"; 

  try {
    await client.connect();

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

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      // RECUPERAMOS switchVersion DEL BODY
      const { gameTitle, description, requester, switchVersion } = body; 
      
      const id = Date.now().toString();
      const newRequest = {
        id,
        gameTitle,
        description,
        requester: requester || 'Anonymous',
        // AÑADIMOS switchVersion AL OBJETO QUE SE GUARDA (Por defecto 'Both' si no llega nada)
        switchVersion: switchVersion || 'Both', 
        status: 'pending',
        claimedBy: [], 
        createdAt: Date.now()
      };

      await client.set(`request:${id}`, JSON.stringify(newRequest), { EX: 1209600 });
      await client.quit();
      return res.status(200).json(newRequest);
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { requestId, artistName } = body;
      
      const key = `request:${requestId}`;
      const currentRaw = await client.get(key);
      
      if (!currentRaw) {
        await client.quit();
        return res.status(404).json({ error: 'Request not found' });
      }

      const current = JSON.parse(currentRaw);
      
      const currentClaims = Array.isArray(current.claimedBy) ? current.claimedBy : (current.claimedBy ? [current.claimedBy] : []);
      if (!currentClaims.includes(artistName)) {
        currentClaims.push(artistName);
      }

      const updated = { 
        ...current, 
        status: 'in-progress', 
        claimedBy: currentClaims 
      };
      
      await client.set(key, JSON.stringify(updated), { EX: 604800 });
      await client.quit();
      return res.status(200).json(updated);
    }

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
    console.error("API ERROR:", error);
    if (client.isOpen) await client.quit();
    return res.status(500).json({ error: error.message });
  }
}