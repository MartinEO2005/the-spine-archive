import os
import json
import signal
import sys
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_JSON = os.path.join(BASE_DIR, "public", "database.json")
RUTA_FOTOS = os.path.join(BASE_DIR, "public", "spines")

datos_globales = []
hubo_cambios = False

def guardar_y_salir(signum, frame):
    print("\n\n🛑 INTERRUPCIÓN. Guardando progreso...")
    if hubo_cambios:
        with open(RUTA_JSON, 'w', encoding='utf-8') as f:
            json.dump(datos_globales, f, indent=2, ensure_ascii=False)
    sys.exit(0)

signal.signal(signal.SIGINT, guardar_y_salir)

def ejecutar_limpio():
    global datos_globales, hubo_cambios
    
    if not os.path.exists(RUTA_JSON):
        print("❌ No encuentro el database.json")
        return

    with open(RUTA_JSON, 'r', encoding='utf-8') as f:
        datos_globales = json.load(f)

    print(f"📊 Total entradas en JSON: {len(datos_globales)}")

    actualizados = 0
    saltados = 0

    for libro in datos_globales:
        # 1. Si ya tiene URL de Cloudinary, saltar
        if "image" in libro and "res.cloudinary.com" in libro["image"]:
            saltados += 1
            continue
        
        # 2. Intentar encontrar el archivo (probando extensiones)
        id_libro = str(libro.get("id"))
        
        # Probamos con .webp, .jpg, .png...
        archivo_encontrado = None
        for ext in ['.webp', '.jpg', '.jpeg', '.png', '.JPG']:
            posible_ruta = os.path.join(RUTA_FOTOS, id_libro + ext)
            if os.path.exists(posible_ruta):
                archivo_encontrado = posible_ruta
                break
        
        if archivo_encontrado:
            try:
                print(f"📤 Subiendo ({actualizados + 1}): {id_libro}...")
                res = cloudinary.uploader.upload(archivo_encontrado, folder="spines_archive")
                # GUARDAMOS LA URL EN EL CAMPO "image"
                libro["image"] = res["secure_url"]
                actualizados += 1
                hubo_cambios = True
            except Exception as e:
                print(f"❌ Error con {id_libro}: {e}")
        else:
            # Si el ID ya incluía la extensión, probamos directo
            ruta_directa = os.path.join(RUTA_FOTOS, id_libro)
            if os.path.exists(ruta_directa):
                try:
                    print(f"📤 Subiendo directo: {id_libro}...")
                    res = cloudinary.uploader.upload(ruta_directa, folder="spines_archive")
                    libro["image"] = res["secure_url"]
                    actualizados += 1
                    hubo_cambios = True
                except Exception as e:
                    print(f"❌ Error con {id_libro}: {e}")
            else:
                print(f"⚠️  No encuentro la foto para el ID: {id_libro} en la carpeta spines")

    if hubo_cambios:
        with open(RUTA_JSON, 'w', encoding='utf-8') as f:
            json.dump(datos_globales, f, indent=2, ensure_ascii=False)
    
    print(f"\n✨ FIN. Actualizados: {actualizados}, Ya listos: {saltados}, Total: {len(datos_globales)}")

if __name__ == "__main__":
    ejecutar_limpio()