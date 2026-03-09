// IMPORTANTE: En Vite/React, no puedes importar archivos de la carpeta /public 
// directamente con 'import'. 
// La mejor solución es mover el JSON a src/data/nombres_juegos.json 
// O usar este formato si quieres mantenerlo ahí:

import juegosData from '../../public/nombres_juegos.json';

export const FUN_FACTS = juegosData;