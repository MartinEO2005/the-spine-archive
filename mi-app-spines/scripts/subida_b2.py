import os
import boto3
import requests
import json

print("🚀 Saltando lectura de .env. Usando credenciales directas...")

# 🛠️ PEGA AQUÍ TUS DATOS DIRECTAMENTE (Cópialos de tu imagen image_464824.png)
ENDPOINT_URL = "https://s3.us-east-005.backblazeb2.com"  # Asegúrate de poner el tuyo completo
ACCESS_KEY = "0053822670777370000000001" # Tu keyID completo
SECRET_KEY = "K005Wh/dC6GL+3YpQlBa/SJxwCQTQuk" # Tu applicationKey completa
BUCKET_NAME = "the-spine-archive-storage" # El nombre completo de tu bucket

# ==========================================================

s3_client = boto3.client(
    's3',
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAIZ_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
FOLDER_PATH = os.path.join(RAIZ_DIR, "public", "spines")

# 2. Leer archivos .webp locales
if not os.path.exists(FOLDER_PATH):
    print(f"❌ No se encontró la carpeta de lomos en {FOLDER_PATH}")
    exit(1)

archivos_locales = [f for f in os.listdir(FOLDER_PATH) if f.endswith('.webp')]
total_archivos = len(archivos_locales)
print(f"📁 Encontrados {total_archivos} lomos físicos en tu carpeta local.")

# 3. Obtener qué archivos YA están subidos en Backblaze para no duplicar trabajo
print("🔍 Comprobando qué archivos ya existen en el bucket...")
archivos_en_b2 = set()
paginator = s3_client.get_paginator('list_objects_v2')

try:
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix='spines/'):
        if 'Contents' in page:
            for obj in page['Contents']:
                # Guardamos solo el nombre del archivo (ej: yclyat.webp)
                filename = obj['Key'].split('/')[-1]
                if filename:
                    archivos_en_b2.add(filename)
except Exception as e:
    print(f"⚠️ Error listando el bucket (puede estar vacío): {e}")

print(f"☁️ Backblaze ya tiene {len(archivos_en_b2)} lomos registrados.")

# 4. Filtrar los lomos que quedan por subir
lomos_por_subir = [f for f in archivos_locales if f not in archivos_en_b2]
total_por_subir = len(lomos_por_subir)

print(f"📤 Quedan por subir exactamente {total_por_subir} lomos locales.")

if total_por_subir == 0:
    print("✨ ¡Todo el catálogo ya está subido en Backblaze! No hace falta hacer nada.")
    exit()

# 5. Bucle de subida masiva eficiente
for index, filename in enumerate(lomos_por_subir, 1):
    local_path = os.path.join(FOLDER_PATH, filename)
    storage_path = f"spines/{filename}"
    
    try:
        with open(local_path, 'rb') as data:
            s3_client.upload_fileobj(
                data, 
                BUCKET_NAME, 
                storage_path,
                ExtraArgs={'ContentType': 'image/webp'}
            )
        # Mostramos progreso cada 50 archivos para no colapsar la terminal, o de uno en uno
        if index % 50 == 0 or index == total_por_subir:
            print(f"⏳ Progreso: [{index}/{total_por_subir}] lomos subidos...")
            
    except Exception as e:
        print(f"❌ Error al subir {filename}: {e}")

print("\n🎉 ¡Ahora SÍ! El 100% de las imágenes están en Backblaze. Ya puedes proceder al Ctrl+H.")