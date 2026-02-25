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

load_dotenv()

# --- CONFIGURACIÓN DE PRODUCCIÓN ---
cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

# Volvemos a la carpeta original de producción
CLOUDINARY_FOLDER = 'spines_archive' 
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_JSON_PATH = os.path.join(BASE_DIR, "public", "database.json")

# Generamos términos: a-z, A-Z y franquicias clave (cumpliendo tu regla de variaciones)
letras = "abcdefghijklmnopqrstuvwxyz"
SEARCH_TERMS = ["Lewcifer820", "Mii203" ,"eridyon","pand_ashh","Olivigarden", "TheKosmicKollector", "WarioPunk"] # + list(letras)

# Límite alto para producción (básicamente sin límite)
MAX_UPLOADS = 10000 

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
})

def get_image_hash(img):
    img_small = img.convert("L").resize((16, 16), Image.Resampling.LANCZOS)
    return hashlib.md5(img_small.tobytes()).hexdigest()

def clean_title(title):
    t = title.replace('&amp;', '&')
    t = re.sub(r'\[.*?\]', '', t).strip()
    return t

def save_db(data):
    with open(DB_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def update_database():
    if os.path.exists(DB_JSON_PATH):
        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    # Diccionarios para evitar duplicados por ID o por Imagen
    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}
    
    print(f"\n🚀 Iniciando actualización masiva en: {CLOUDINARY_FOLDER}")
    print(f"📊 Base de datos actual: {len(existing_data)} entradas.")
    
    total_new = 0

    try:
        for term in SEARCH_TERMS:
            if total_new >= MAX_UPLOADS:
                break

            print(f"🔍 Buscando: '{term}'")
            after = None
            
            while True:
                if total_new >= MAX_UPLOADS: break

                url = f"https://www.reddit.com/r/SwitchSpines/search.json?q={term}&restrict_sr=1&sort=new&limit=50"
                if after: url += f"&after={after}"
                
                try:
                    res = session.get(url, timeout=15)
                except Exception:
                    time.sleep(5); continue

                if res.status_code == 429:
                    print("⏳ Esperando por Rate Limit...")
                    time.sleep(30); continue
                
                if res.status_code != 200: break

                data = res.json().get('data', {})
                posts = data.get('children', [])
                after = data.get('after')
                
                if not posts: break

                for post in posts:
                    if total_new >= MAX_UPLOADS: break

                    p = post['data']
                    image_urls = []
                    
                    if p.get('is_gallery'):
                        meta = p.get('media_metadata', {})
                        for k in sorted(meta.keys()):
                            if meta[k].get('e') == 'Image':
                                u = meta[k]['s'].get('u') or meta[k]['s'].get('gif')
                                if u: image_urls.append(u.replace('&amp;', '&'))
                    elif 'url' in p and any(ext in p['url'].lower() for ext in ['.png', '.jpg', '.jpeg', '.webp']): 
                        image_urls.append(p['url'])

                    for idx, img_url in enumerate(image_urls):
                        if total_new >= MAX_UPLOADS: break

                        u_id = f"{p['id']}" if len(image_urls) == 1 else f"{p['id']}_{idx}"
                        
                        # FILTRO 1: Evitar duplicar el mismo post
                        if u_id in existing_ids: continue

                        try:
                            time.sleep(0.4)
                            img_res = session.get(img_url, timeout=10)
                            img = Image.open(BytesIO(img_res.content))
                            
                            # Redimensionar si es excesivamente grande para evitar errores de WebP
                            if img.height > 12000:
                                aspect = img.width / img.height
                                img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

                            # Validar que parezca un lomo (ratio alto)
                            if (img.height / img.width) >= 2.6:
                                
                                # FILTRO 2: Evitar duplicar la misma imagen (aunque el post sea distinto)
                                h = get_image_hash(img)
                                if h in existing_hashes: continue

                                print(f"✅ Nuevo lomo encontrado: {clean_title(p['title'])}")

                                buffer = BytesIO()
                                img.convert("RGBA").save(buffer, format="WEBP", quality=85)
                                buffer.seek(0)

                                # Subida a la carpeta de PRODUCCIÓN
                                upload_result = cloudinary.uploader.upload(
                                    buffer,
                                    folder=CLOUDINARY_FOLDER,
                                    public_id=u_id,
                                    format="webp",
                                    overwrite=True
                                )

                                entry = {
                                    "id": u_id,
                                    "title": clean_title(p['title']) + (f" (Alt {idx+1})" if len(image_urls)>1 else ""),
                                    "author": f"u/{p['author']}",
                                    "src": f"/spines/{u_id}.webp",
                                    "hash": h,
                                    "image": upload_result['secure_url']
                                }
                                
                                existing_data.append(entry)
                                existing_ids.add(u_id)
                                existing_hashes.add(h)
                                total_new += 1
                                
                                # Guardar progreso frecuentemente
                                if total_new % 5 == 0:
                                    save_db(existing_data)
                                
                        except Exception as e:
                            print(f"⚠️ Error con {u_id}: {e}")
                            continue
                            
                if not after: break
    except KeyboardInterrupt:
        print("\nInterrumpido. Guardando progreso...")
    
    save_db(existing_data)
    print(f"\n✨ Proceso finalizado. {total_new} lomos añadidos correctamente.")

if __name__ == "__main__":
    update_database()