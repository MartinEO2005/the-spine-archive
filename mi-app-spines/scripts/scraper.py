import os
import requests
import json
import time
import re
import hashlib
import sys
import cloudinary
import cloudinary.uploader
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

# --- CONFIGURACIÓN ---
load_dotenv()

# Configuración de Cloudinary
cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

# CARPETA DE DESTINO:
# Si estás en la rama de pruebas, usa 'spines_test' (o lo que digas en .env).
# Si no hay variable, por seguridad usa 'spines_test'.
CLOUDINARY_FOLDER = os.getenv('CLOUDINARY_FOLDER', 'spines_test')

# Rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_JSON_PATH = os.path.join(BASE_DIR, "public", "database.json")

# Términos de búsqueda (Alfabeto + extras)
SEARCH_TERMS = [l for l in "abcdefghijklmnopqrstuvwxyz"] + ['lego', "star wars", "mario", "zelda", "pokemon"]

# Configuración de Requests para parecer un navegador
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
})

def get_image_hash(img):
    """Crea una huella digital visual pequeña para detectar duplicados visuales."""
    img_small = img.convert("L").resize((16, 16), Image.Resampling.LANCZOS)
    return hashlib.md5(img_small.tobytes()).hexdigest()

def clean_title(title):
    """Limpia el título de etiquetas como [Request] o [Switch]."""
    t = title.replace('&amp;', '&')
    t = re.sub(r'\[.*?\]', '', t).strip()
    return t

def save_db(data):
    """Guarda los datos en el JSON inmediatamente."""
    with open(DB_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def update_database():
    # 1. Cargar base de datos existente
    if os.path.exists(DB_JSON_PATH):
        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    # Crear conjuntos de búsqueda rápida para evitar duplicados
    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}
    
    print(f"\n🚀 Iniciando Scraper en modo: {CLOUDINARY_FOLDER}")
    print(f"📚 Base de datos actual: {len(existing_data)} entradas.")
    
    total_new = 0

    try:
        for term in SEARCH_TERMS:
            print(f"🔍 Escaneando término: '{term}'")
            after = None
            
            # Bucle de paginación de Reddit
            while True:
                url = f"https://www.reddit.com/r/SwitchSpines/search.json?q={term}&restrict_sr=1&sort=new&limit=50"
                if after: url += f"&after={after}"
                
                try:
                    res = session.get(url, timeout=10)
                except Exception as e:
                    print(f"⚠️ Error de conexión: {e}")
                    time.sleep(5)
                    continue

                if res.status_code == 429:
                    print("⏳ Rate limit (429). Esperando 30 segundos...")
                    time.sleep(30)
                    continue
                
                if res.status_code != 200:
                    print(f"⚠️ Error Reddit {res.status_code}")
                    break

                data = res.json().get('data', {})
                posts = data.get('children', [])
                after = data.get('after')
                
                if not posts: 
                    break

                for post in posts:
                    p = post['data']
                    image_urls = []
                    
                    # Extraer URLs de imagen (soporte para galerías y posts simples)
                    if p.get('is_gallery'):
                        meta = p.get('media_metadata', {})
                        for k in sorted(meta.keys()):
                            if meta[k].get('e') == 'Image':
                                u = meta[k]['s'].get('u') or meta[k]['s'].get('gif')
                                if u: image_urls.append(u.replace('&amp;', '&'))
                    elif 'url' in p and any(ext in p['url'].lower() for ext in ['.png', '.jpg', '.jpeg']):
                        image_urls.append(p['url'])

                    for idx, img_url in enumerate(image_urls):
                        # ID único: ID del post + índice (para galerías)
                        u_id = f"{p['id']}" if len(image_urls) == 1 else f"{p['id']}_{idx}"
                        
                        # CHEQUEO 1: ¿Ya tenemos este ID?
                        if u_id in existing_ids: 
                            continue

                        try:
                            # Descargamos la imagen en memoria (sin guardar en disco)
                            time.sleep(0.5) # Ser amables con Reddit
                            img_res = session.get(img_url, timeout=10)
                            img = Image.open(BytesIO(img_res.content))
                            
                            # Validar dimensiones (Filtro para que sea un SPINE y no otra cosa)
                            # Ratio debe ser alto (más alto que ancho) -> Standard ~161/10.5 = 15.3
                            # Ponemos > 2.6 para ser permisivos pero evitar portadas cuadradas
                            if (img.height / img.width) >= 2.6:
                                
                                # CHEQUEO 2: ¿Ya tenemos esta imagen (Hash visual)?
                                h = get_image_hash(img)
                                if h in existing_hashes: 
                                    continue

                                print(f"📤 Subiendo nuevo spine: {clean_title(p['title'])}...")

                                # --- SUBIDA A CLOUDINARY ---
                                # Convertimos a WebP en memoria para subir optimizado
                                buffer = BytesIO()
                                img.convert("RGBA").save(buffer, format="WEBP", quality=90)
                                buffer.seek(0)

                                upload_result = cloudinary.uploader.upload(
                                    buffer,
                                    folder=CLOUDINARY_FOLDER, # Usa la carpeta 'spines' o 'spines_test'
                                    public_id=u_id,
                                    format="webp",
                                    overwrite=True
                                )

                                cloud_url = upload_result['secure_url']
                                title = clean_title(p['title'])
                                if len(image_urls) > 1: title += f" (Var {idx+1})"
                                
                                # --- CREAR ENTRADA JSON ---
                                entry = {
                                    "id": u_id,
                                    "title": title,
                                    "author": f"u/{p['author']}",
                                    "src": f"/spines/{u_id}.webp", # Mantenemos formato legacy por compatibilidad
                                    "hash": h,
                                    "image": cloud_url # La URL real de Cloudinary
                                }
                                
                                existing_data.append(entry)
                                existing_ids.add(u_id)
                                existing_hashes.add(h)
                                total_new += 1
                                
                                # Guardamos cada vez para no perder progreso si peta
                                save_db(existing_data)
                                
                        except Exception as e:
                            print(f"❌ Error procesando imagen: {e}")
                            continue
                            
                if not after: 
                    break

    except KeyboardInterrupt:
        print("\n🛑 Interrupción manual. Guardando...")
        save_db(existing_data)
        sys.exit(0)

    print(f"\n✨ ¡Hecho! Se han añadido {total_new} lomos nuevos a la carpeta '{CLOUDINARY_FOLDER}'.")

if __name__ == "__main__":
    update_database()