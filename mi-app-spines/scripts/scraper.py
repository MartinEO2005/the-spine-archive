import os
import json
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Cargamos las claves
load_dotenv()

# --- CONFIGURACIÓN A LO BRUTO ---
# He puesto la ruta basada en tu mensaje de error. 
# Si tu carpeta spines no está aquí, cámbialo por lo que copiaste en el Paso 1.
# La 'r' delante es OBLIGATORIA para Windows.
RUTA_OBLIGATORIA = r"C:\Users\MartinEO\Desktop\the-spine-archive\mi-app-spines\public\spines"
RUTA_JSON = r"C:\Users\MartinEO\Desktop\the-spine-archive\mi-app-spines\public\database.json"

# Configuración Cloudinary
cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

def forzar_subida():
    print(f"--- 🛑 MODO FUERZA BRUTA ---")
    print(f"Mirando fijamente en: {RUTA_OBLIGATORIA}")

    # 1. VERIFICACIÓN VISUAL
    if not os.path.exists(RUTA_OBLIGATORIA):
        print("❌ ¡LA RUTA NO EXISTE! Revisa que hayas copiado bien el path.")
        return

    # Listar TODO lo que hay, sea imagen o no
    todo_el_contenido = os.listdir(RUTA_OBLIGATORIA)
    print(f"📂 Archivos detectados en la carpeta (Totales): {len(todo_el_contenido)}")
    
    # Filtrar imágenes
    imagenes = [f for f in todo_el_contenido if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    
    if len(imagenes) == 0:
        print("⚠️  LA CARPETA EXISTE PERO NO VEO IMÁGENES.")
        print(f"Contenido exacto: {todo_el_contenido}")
        print("¿Tienen extensión .jpg? ¿Son carpetas?")
        return

    print(f"🚀 ¡AHORA SÍ! Encontradas {len(imagenes)} imágenes. Subiendo...")

    db = []
    for archivo in imagenes:
        ruta_completa = os.path.join(RUTA_OBLIGATORIA, archivo)
        try:
            print(f"📤 Subiendo: {archivo}")
            res = cloudinary.uploader.upload(ruta_completa, folder="spines_archive")
            
            db.append({
                "id": archivo,
                "title": archivo.split('.')[0].replace('_', ' ').replace('-', ' ').title(),
                "image": res['secure_url']
            })
        except Exception as e:
            print(f"❌ Error con {archivo}: {e}")

    # Guardar JSON
    with open(RUTA_JSON, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    
    print(f"✨ ¡VICTORIA! {len(db)} enlaces guardados en: {RUTA_JSON}")

if __name__ == "__main__":
    forzar_subida()