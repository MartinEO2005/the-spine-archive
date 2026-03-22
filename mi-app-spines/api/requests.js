import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // 1. OBTENER TODAS LAS PETICIONES (GET)
  if (req.method === 'GET') {
    try {
      // Buscamos todas las llaves que empiecen por "request:"
      const keys = await kv.keys('request:*');
      if (keys.length === 0) return res.status(200).json([]);

      // Traemos el contenido de todas esas llaves
      const requests = await kv.mget(...keys);
      
      // Ordenamos para que las más nuevas aparezcan primero
      const sortedRequests = requests
        .filter(r => r !== null)
        .sort((a, b) => b.createdAt - a.createdAt);

      return res.status(200).json(sortedRequests);
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching requests' });
    }
  }

  // 2. CREAR NUEVA PETICIÓN (POST)
  if (req.method === 'POST') {
    try {
      const { gameTitle, description, requester } = JSON.parse(req.body);
      const id = Date.now().toString(); // ID simple basado en tiempo
      
      const newRequest = {
        id,
        gameTitle,
        description,
        requester: requester || 'Anonymous',
        status: 'pending',
        claimedBy: null,
        createdAt: Date.now()
      };

      // Guardamos la petición con un TTL de 14 días (1,209,600 segundos)
      await kv.set(`request:${id}`, newRequest, { ex: 1209600 });

      return res.status(200).json(newRequest);
    } catch (error) {
      return res.status(500).json({ error: 'Error creating request' });
    }
  }

  // 3. RECLAMAR PETICIÓN (PATCH)
  if (req.method === 'PATCH') {
    try {
      const { requestId, artistName } = JSON.parse(req.body);
      
      // Buscamos la petición actual
      const key = `request:${requestId}`;
      const currentRequest = await kv.get(key);

      if (!currentRequest) {
        return res.status(404).json({ error: 'Request not found or expired' });
      }

      // Actualizamos los datos
      const updatedRequest = {
        ...currentRequest,
        status: 'in-progress',
        claimedBy: artistName
      };

      // Guardamos de nuevo y extendemos el tiempo 7 días más desde hoy
      await kv.set(key, updatedRequest, { ex: 604800 });

      return res.status(200).json(updatedRequest);
    } catch (error) {
      return res.status(500).json({ error: 'Error updating request' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}