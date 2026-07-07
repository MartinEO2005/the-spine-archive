import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const host = req.headers.host || '';
    const referer = req.headers.referer || '';

    // Filtros de acceso para Previews y Localhost
    const isLocal = host.includes('localhost') || referer.includes('localhost');
    const isVercelPreview = host.includes('vercel.app') || referer.includes('vercel.app');
    const isProduction = referer.includes('thespinearchive.xyz');

    if (!isLocal && !isVercelPreview && !isProduction) {
      return res.status(403).json({ error: "Acceso denegado." });
    }

    // AL ESTAR EN LA MISMA CARPETA, LA RUTA NUNCA FALLA:
    const filePath = path.join(__dirname, 'database.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: `Archivo no encontrado en la ruta interna de la API.` });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(jsonData);
  } catch (error) {
    return res.status(500).json({ error: "Error en servidor", detalle: error.message });
  }
}