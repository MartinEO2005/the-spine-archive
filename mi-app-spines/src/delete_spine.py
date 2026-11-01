import os
import json
import shutil
import re
import boto3
from datetime import datetime
from dotenv import load_dotenv

# Forzamos recargar variables de entorno
load_dotenv(override=True)

# --- CONFIGURACIÓN DE RUTAS Y B2 ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Intentamos detectar la ruta base de React
PUBLIC_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "public"))
if not os.path.exists(PUBLIC_DIR):
    PUBLIC_DIR = os.path.normpath(os.path.join(BASE_DIR, "public"))

DB_JSON_PATH = os.path.join(PUBLIC_DIR, "database.json")
IMAGES_DIR = os.path.join(PUBLIC_DIR, "spines")
LOG_FILE_PATH = os.path.join(BASE_DIR, "deleted_spines_log.txt")

# Cliente AWS S3 / Backblaze B2
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('B2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('B2_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('B2_SECRET_KEY')
)
B2_BUCKET_NAME = os.getenv('B2_BUCKET_NAME')

def load_database():
    if not os.path.exists(DB_JSON_PATH):
        print(f"❌ Error: No se encontró el archivo {DB_JSON_PATH}")
        return None
    with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_database(data):
    backup_path = f"{DB_JSON_PATH}.bak"
    shutil.copy2(DB_JSON_PATH, backup_path)
    
    with open(DB_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def log_deleted_items(items):
    with open(LOG_FILE_PATH, 'a', encoding='utf-8') as f:
        f.write(f"\n--- SESIÓN DE ELIMINACIÓN: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---\n")
        for item in items:
            log_line = f"ELIMINADO: [{item['id']}] - {item['title']} | Autor: {item['author']}\n"
            f.write(log_line)
        f.write("-" * 50 + "\n")

def delete_spines():
    data = load_database()
    if data is None: return

    print("=============================================")
    print("🗑️ ELIMINADOR DE LOMOS (B2 + LOCAL + BBDD)")
    print("=============================================")
    query = input("🔍 Introduce la ID, URL (.webp), Título o Autor: ").strip().lower()

    if not query:
        print("⚠️ Búsqueda vacía. Cancelando.")
        return

    # Extraer ID limpia si pegan una URL tipo .../spines/1xcfrl1.webp
    match = re.search(r'([a-z0-9_]+)\.webp', query)
    clean_query = match.group(1) if match else query.replace('.webp', '')

    # Coincidencias por ID exacta, ID contenida, título o autor
    matches = [
        item for item in data 
        if clean_query == item['id'].lower()
        or clean_query in item['id'].lower()
        or clean_query in item['title'].lower() 
        or clean_query in item['author'].lower()
    ]

    if not matches:
        print(f"❌ No se encontraron resultados para: '{query}'")
        return

    print(f"\n✅ Se encontraron {len(matches)} coincidencias:")
    for i, item in enumerate(matches):
        print(f"  [{i}] ID: {item['id']} | Título: {item['title']} | Autor: {item['author']}")

    choice = input("\n👉 Índices a borrar (ej: 0,1,2), 'all' o 'q' para salir: ").strip().lower()
    if choice == 'q': return
    
    indices = []
    if choice == 'all':
        indices = list(range(len(matches)))
    else:
        try:
            indices = [int(x.strip()) for x in choice.split(',')]
        except ValueError:
            print("❌ Error en el formato de números.")
            return

    targets = [matches[i] for i in indices if 0 <= i < len(matches)]
    
    if not targets:
        print("❌ Selección vacía.")
        return

    print(f"\n⚠️ Vas a eliminar permanentemente {len(targets)} lomo(s) en Backblaze B2, Local y database.json.")
    if input("¿Confirmar eliminación? (s/n): ").lower() == 's':
        ids_to_remove = {t['id'] for t in targets}
        
        # 1. Registrar en el archivo de Log
        log_deleted_items(targets)
        
        # 2. Actualizar database.json (crea copia .bak)
        new_data = [item for item in data if item['id'] not in ids_to_remove]
        save_database(new_data)
        print("💾 Base de datos 'database.json' actualizada.")
        
        # 3. Borrado físico local y en la nube Backblaze B2
        for t in targets:
            target_id = t['id']

            # A. Borrado en local
            local_path = os.path.join(IMAGES_DIR, f"{target_id}.webp")
            if os.path.exists(local_path):
                try:
                    os.remove(local_path)
                    print(f"🗑️ [Local] Archivo borrado: {target_id}.webp")
                except Exception as e:
                    print(f"❌ Error al borrar local {target_id}.webp: {e}")
            else:
                print(f"⚠️ [Local] No se encontró el archivo local: {target_id}.webp")

            # B. Borrado en Backblaze B2
            b2_file_key = f"spines/{target_id}.webp"
            try:
                s3_client.delete_object(
                    Bucket=B2_BUCKET_NAME,
                    Key=b2_file_key
                )
                print(f"☁️ [Backblaze B2] Archivo borrado: {b2_file_key}")
            except Exception as e:
                print(f"❌ Error al borrar en Backblaze B2 ({b2_file_key}): {e}")

        print(f"\n✨ Operación finalizada. Historial guardado en '{os.path.basename(LOG_FILE_PATH)}'.")

if __name__ == "__main__":
    delete_spines()