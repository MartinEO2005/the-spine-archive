import os
import json
import requests

# Utilizamos las mismas rutas base que tu scraper actual
BASE_DIR = r"C:\Users\MartinEO\Desktop\the-spine-archive\mi-app-spines"
DB_JSON_PATH = os.path.join(BASE_DIR, "api", "database.json")
LOCAL_SPINES_DIR = os.path.join(BASE_DIR, "public", "spines")

# Aseguramos que la carpeta local exista
os.makedirs(LOCAL_SPINES_DIR, exist_ok=True)

def sync_bucket_to_local():
    if not os.path.exists(DB_JSON_PATH):
        print(f"❌ No se encontró la base de datos en: {DB_JSON_PATH}")
        return

    # Cargamos el JSON
    with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"📊 Base de datos cargada: {len(data)} entradas encontradas.")
    print(f"📁 Destino local: {LOCAL_SPINES_DIR}")
    print("Iniciando sincronización...\n")

    descargadas = 0
    existentes = 0

    for entry in data:
        # Obtenemos el ID para construir el nombre del archivo (ej: 12345.webp)
        u_id = entry.get('id')
        image_url = entry.get('image')
        
        if not u_id or not image_url:
            continue
            
        file_name = f"{u_id}.webp"
        local_path = os.path.join(LOCAL_SPINES_DIR, file_name)

        # Si la imagen ya existe en tu carpeta local, nos la saltamos
        if os.path.exists(local_path):
            existentes += 1
            continue

        # Si no existe, la descargamos
        try:
            response = requests.get(image_url, timeout=15)
            if response.status_code == 200:
                with open(local_path, 'wb') as img_file:
                    img_file.write(response.content)
                print(f"📥 Descargada: {file_name}")
                descargadas += 1
            else:
                print(f"⚠️ Error {response.status_code} al descargar: {file_name}")
        except Exception as e:
            print(f"❌ Error de red con {file_name}: {e}")

    print("\n=============================================")
    print(f"✨ Sincronización completada.")
    print(f"📂 Imágenes preexistentes (ignoradas): {existentes}")
    print(f"💾 Nuevas imágenes descargadas: {descargadas}")
    print("=============================================")

if __name__ == "__main__":
    sync_bucket_to_local()