import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- Línea nueva para arreglar el error

// ESTO SOLUCIONA EL ERROR "__dirname is not defined" EN ES MODULES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
  try {
    const host = req.headers.host || '';
    const referer = req.headers.referer || '';

    // Filtros de acceso para Previews de Vercel y Localhost
    const isLocal = host.includes('localhost') || referer.includes('localhost');
    const isVercelPreview = host.includes('vercel.app') || referer.includes('vercel.app');
    const isProduction = referer.includes('thespinearchive.xyz');

    if (!isLocal && !isVercelPreview && !isProduction) {
      return res.status(403).json({ error: "Acceso denegado." });
    }

    // Ahora que __dirname funciona, la ruta al JSON que está a su lado es infalible
    const filePath = path.join(__dirname, 'database.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: "El archivo database.json no se encuentra dentro de la carpeta api/." });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(jsonData);
  } catch (error) {
    return res.status(500).json({ error: "Error en servidor", detalle: error.message });
  }
}