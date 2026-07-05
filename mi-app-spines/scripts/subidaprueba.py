import os
from io import BytesIO
from dotenv import load_dotenv
from supabase import create_client

# Cargamos las variables de entorno de tu archivo .env de forma segura
load_dotenv()

import os
from io import BytesIO
from dotenv import load_dotenv
from supabase import create_client

# 1. Detectamos la posición real de este script (dentro de /scripts)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Apuntamos al .env principal que está en la RAÍZ (un nivel arriba de /scripts)
RAIZ_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
ENV_PATH = os.path.join(RAIZ_DIR, ".env")

# 3. Cargamos el archivo de configuración
load_dotenv(ENV_PATH)

# Imprimimos esto para comprobar en tu terminal si está leyendo el archivo correcto
print(f"📁 Buscando archivo de configuración en: {ENV_PATH}")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = "spines"

# 4. Buscamos la carpeta 'public/spines' saliendo de /scripts y entrando en /public/spines
FOLDER_PATH = os.path.join(RAIZ_DIR, "public", "spines")

# Validación de seguridad por si acaso
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: No se encontraron las variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en tu .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

if os.path.exists(FOLDER_PATH):
    archivos = [f for f in os.listdir(FOLDER_PATH) if f.endswith('.webp')]
    total = len(archivos)
    print(f"🚀 Conectado de forma segura. Detectados {total} lomos locales. Iniciando subida...")

    for index, filename in enumerate(archivos, 1):
        local_file_path = os.path.join(FOLDER_PATH, filename)
        storage_path = f"{filename}" 
        
        try:
            with open(local_file_path, 'rb') as f:
                supabase.storage.from_(BUCKET_NAME).upload(
                    path=storage_path,
                    file=f,
                    file_options={"content-type": "image/webp"}
                )
            print(f"[{index}/{total}] ✅ ¡Subido!: {filename}")
        except Exception as e:
            if "Duplicate" in str(e) or "already exists" in str(e).lower():
                print(f"[{index}/{total}] 🟡 Ya existía en la nube: {filename}")
            else:
                print(f"❌ Error con {filename}: {e}")
                
    print("\n🎉 ¡Proceso terminado con éxito!")
else:
    print(f"❌ Error: No se encontró la carpeta en {FOLDER_PATH}.")