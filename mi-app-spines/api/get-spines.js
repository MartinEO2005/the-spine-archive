// api/get-spines.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // 1. Obtener el host y el referer
    const host = req.headers.host || '';
    const referer = req.headers.referer || '';

    // 2. FILTRO INTELIGENTE PARA PRUEBAS:
    // Si estamos en localhost o en una URL de previsualización de Vercel (*.vercel.app),
    // saltamos la validación estricta para que puedas ver el preview sin errores.
    const isLocal = host.includes('localhost') || referer.includes('localhost');
    const isVercelPreview = host.includes('vercel.app') || referer.includes('vercel.app');
    const isProduction = referer.includes('thespinearchive.xyz');

    if (!isLocal && !isVercelPreview && !isProduction) {
      return res.status(403).json({ error: "Acceso denegado. No autorizado." });
    }

    // 3. RUTA DEL ARCHIVO (Forzada a minúscula tal como confirmas)
    const filePath = path.join(process.cwd(), 'data', 'database.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: "El archivo database.json no existe en la carpeta /data" });
    }

    // 4. LECTURA Y RESPUESTA
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(jsonData);

  } catch (error) {
    console.error("Error en la API get-spines:", error);
    return res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
}