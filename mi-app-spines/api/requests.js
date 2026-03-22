import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Manejo de GET: Leer peticiones
  if (req.method === 'GET') {
    try {
      const keys = await kv.keys('request:*');
      if (!keys || keys.length === 0) return res.status(200).json([]);

      const requests = await kv.mget(...keys);
      const sortedRequests = requests
        .filter(r => r !== null)
        .sort((a, b) => b.createdAt - a.createdAt);

      return res.status(200).json(sortedRequests);
    } catch (error) {
      console.error("GET Error:", error);
      return res.status(500).json({ error: 'Failed to fetch' });
    }
  }

  // Manejo de POST: Crear petición
  if (req.method === 'POST') {
    try {
      // FIX: Vercel a veces ya parsea el body automáticamente
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { gameTitle, description, requester } = body;

      if (!gameTitle) return res.status(400).json({ error: 'Title required' });

      const id = Date.now().toString();
      const newRequest = {
        id,
        gameTitle,
        description,
        requester: requester || 'Anonymous',
        status: 'pending',
        claimedBy: null,
        createdAt: Date.now()
      };

      // Guardar con TTL de 14 días
      await kv.set(`request:${id}`, newRequest, { ex: 1209600 });
      return res.status(200).json(newRequest);
    } catch (error) {
      console.error("POST Error:", error);
      return res.status(500).json({ error: 'Failed to save' });
    }
  }

  // Manejo de PATCH: Reclamar
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { requestId, artistName } = body;
      
      const key = `request:${requestId}`;
      const current = await kv.get(key);

      if (!current) return res.status(404).json({ error: 'Not found' });

      const updated = { ...current, status: 'in-progress', claimedBy: artistName };
      await kv.set(key, updated, { ex: 604800 }); // 7 días extra al reclamar

      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Update failed' });
    }
  }

  return res.status(405).end();
}