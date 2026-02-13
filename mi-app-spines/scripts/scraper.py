import os
import json
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Cargamos las claves del archivo .env
load_dotenv()

# Configuración de Cloudinary (Segura)
cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

# Rutas (Ajustadas a tu estructura de carpetas)
ruta_fotos = os.path.join("mi-app-spines", "public", "spines")
ruta_db = os.path.join("mi-app-spines", "src", "database.json")

def limpiar_titulo(nombre_archivo):
    # Quitamos extensión y cambiamos guiones por espacios para que quede bien
    nombre_sin_ext = os.path.splitext(nombre_archivo)[0]
    return nombre_sin_ext.replace('_', ' ').replace('-', ' ').title()

def ejecutar_subida():
    if not os.path.exists(ruta_fotos):
        print(f"❌ Error: No encuentro la carpeta en {ruta_fotos}")
        return

    # Buscamos solo imágenes de verdad
    imagenes = [f for f in os.listdir(ruta_fotos) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"🚀 He encontrado {len(imagenes)} imágenes. Empezando subida...")

    base_datos = []

    for archivo in imagenes:
        ruta_completa = os.path.join(ruta_fotos, archivo)
        print(f"🔍 Procesando: {archivo}...")

        try:
            # Subimos a Cloudinary (dentro de una carpeta llamada 'spines')
            resultado = cloudinary.uploader.upload(ruta_completa, folder="spines_archive")
            
            # Creamos el objeto para nuestro JSON
            base_datos.append({
                "id": archivo,
                "title": limpiar_titulo(archivo),
                "image": resultado['secure_url'] # La URL de internet
            })
            print(f"✅ ¡Subido! {archivo}")
        except Exception as e:
            print(f"❌ Fallo al subir {archivo}: {e}")

    # Guardamos el resultado en el database.json
    with open(ruta_db, 'w', encoding='utf-8') as f:
        json.dump(base_datos, f, indent=2, ensure_ascii=False)
    
    print(f"✨ ¡LISTO! {len(base_datos)} enlaces guardados en database.json")

if __name__ == "__main__":
    ejecutar_subida()