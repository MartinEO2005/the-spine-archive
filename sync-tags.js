import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Tus credenciales de Supabase (puedes ponerlas directas o leerlas de .env)
const supabaseUrl = 'https://suzqcdasxchkbfwnhrcg.supabase.co';
const supabaseKey = 'TU_CLAVE_PUBLICA_O_SERVICE_ROLE'; // service_role si quieres actualizar estados
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTags() {
  console.log("📥 Consultando sugerencias en Supabase...");

  // 1. Obtener todas las solicitudes pendientes
  const { data: requests, error } = await supabase
    .from('tag_requests')
    .select('*')
    .eq('status', 'pending');

  if (error) {
    console.error("❌ Error al obtener solicitudes:", error);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log("✨ No hay nuevas sugerencias pendientes para sincronizar.");
    return;
  }

  console.log(`🔍 Se encontraron ${requests.length} sugerencias pendientes.`);

  // 2. Leer el database.json local
  const dbPath = path.join(process.cwd(), 'public', 'database.json');
  if (!fs.existsSync(dbPath)) {
    console.error("❌ No se encontró el archivo public/database.json");
    return;
  }

  let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  let updatedCount = 0;

  // 3. Cruzar los datos y actualizar los tags
  for (const req of requests) {
    const spineIndex = db.findIndex(s => s.id === req.spine_id);
    
    if (spineIndex !== -1) {
      // Actualizamos los tags del spine con los propuestos por el usuario
      db[spineIndex].tags = req.proposed_tags;
      updatedCount++;
      console.log(`✅ Actualizado spine: "${db[spineIndex].title}" (ID: ${req.spine_id})`);

      // Opcional: Marcar la solicitud como 'applied' en Supabase para no procesarla dos veces
      await supabase
        .from('tag_requests')
        .update({ status: 'applied' })
        .eq('id', req.id);
    } else {
      console.warn(`⚠️ No se encontró el spine con ID ${req.spine_id} en el database.json local.`);
    }
  }

  // 4. Guardar el database.json actualizado
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`🎉 ¡Sincronización completa! Se actualizaron ${updatedCount} spines en public/database.json.`);
}

syncTags();