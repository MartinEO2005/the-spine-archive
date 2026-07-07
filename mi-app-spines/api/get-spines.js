// api/get-spines.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // 1. FILTRO DE SEGURIDAD: Validamos el origen (Referer)
    // Modifica el filtro de seguridad en api/get-spines.js para que quede así:
    const referer = req.headers.referer || '';

// Permitir tu dominio principal, localhost y cualquier despliegue de prueba de vercel.app
    if (
    !referer.includes('thespinearchive.xyz') && 
    !referer.includes('localhost') && 
    !referer.includes('vercel.app')
    ) {
    return res.status(403).json({ error: "Acceso denegado. No autorizado." });
    }

    // 2. LECTURA PRIVADA: Buscamos el archivo en la carpeta raíz /data/
    // 'process.cwd()' apunta a la raíz del proyecto en el servidor de Vercel
    const filePath = path.join(process.cwd(), 'data', 'Database.json');
    
    // Leemos el archivo de forma síncrona
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parseamos el contenido a JSON para asegurar que viaja correctamente
    const jsonData = JSON.parse(fileContent);

    // 3. RESPUESTA: Enviamos los datos al cliente con código de éxito (200)
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(jsonData);

  } catch (error) {
    console.error("Error leyendo la base de datos:", error);
    return res.status(500).json({ error: "Error interno del servidor al cargar los datos." });
  }
}