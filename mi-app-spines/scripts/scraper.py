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

# --- CONFIGURACIÓN ---
cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

CLOUDINARY_FOLDER = os.getenv('CLOUDINARY_FOLDER', 'spines_test')
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_JSON_PATH = os.path.join(BASE_DIR, "public", "database.json")

# SOLO BUSCAMOS UNA LETRA PARA LA PRUEBA (puedes poner más luego)
SEARCH_TERMS = ['d', "e"] 

# !!! LÍMITE DE PRUEBA !!! (Pon 5 para probar, 1000 para real)
MAX_TEST_UPLOADS = 5 

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

    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}
    
    print(f"\n🚀 Iniciando Scraper en: {CLOUDINARY_FOLDER}")
    print(f"🎯 Objetivo de prueba: Máximo {MAX_TEST_UPLOADS} subidas nuevas.")
    
    total_new = 0

    try:
        for term in SEARCH_TERMS:
            # SI YA HEMOS LLEGADO AL LÍMITE DE LA PRUEBA, PARAMOS TODO
            if total_new >= MAX_TEST_UPLOADS:
                print("\n🛑 Límite de prueba alcanzado. Deteniendo script.")
                break

            print(f"🔍 Escaneando término: '{term}'")
            after = None
            
            while True:
                if total_new >= MAX_TEST_UPLOADS: break # Romper bucle while

                url = f"https://www.reddit.com/r/SwitchSpines/search.json?q={term}&restrict_sr=1&sort=new&limit=50"
                if after: url += f"&after={after}"
                
                try:
                    res = session.get(url, timeout=10)
                except Exception:
                    time.sleep(5); continue

                if res.status_code == 429:
                    time.sleep(30); continue
                
                if res.status_code != 200: break

                data = res.json().get('data', {})
                posts = data.get('children', [])
                after = data.get('after')
                
                if not posts: break

                for post in posts:
                    if total_new >= MAX_TEST_UPLOADS: break # Romper bucle for

                    p = post['data']
                    image_urls = []
                    
                    if p.get('is_gallery'):
                        meta = p.get('media_metadata', {})
                        for k in sorted(meta.keys()):
                            if meta[k].get('e') == 'Image':
                                u = meta[k]['s'].get('u') or meta[k]['s'].get('gif')
                                if u: image_urls.append(u.replace('&amp;', '&'))
                    elif 'url' in p and any(ext in p['url'].lower() for ext in ['.png', '.jpg', '.jpeg']):
                        image_urls.append(p['url'])

                    for idx, img_url in enumerate(image_urls):
                        if total_new >= MAX_TEST_UPLOADS: break

                        u_id = f"{p['id']}" if len(image_urls) == 1 else f"{p['id']}_{idx}"
                        if u_id in existing_ids: continue

                        try:
                            time.sleep(0.5)
                            img_res = session.get(img_url, timeout=10)
                            img = Image.open(BytesIO(img_res.content))
                            
                            # --- CORRECCIÓN DE TAMAÑO GIGANTE ---
                            # Si la altura es mayor a 10,000px, redimensionamos proporcionalmente
                            if img.height > 10000:
                                print(f"⚠️ Imagen gigante detectada ({img.height}px). Reduciendo...")
                                aspect_ratio = img.width / img.height
                                new_height = 8000 # Altura segura (menos de 16383)
                                new_width = int(new_height * aspect_ratio)
                                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                            if (img.height / img.width) >= 2.6:
                                h = get_image_hash(img)
                                if h in existing_hashes: continue

                                print(f"📤 Subiendo ({total_new + 1}/{MAX_TEST_UPLOADS}): {clean_title(p['title'])}...")

                                buffer = BytesIO()
                                img.convert("RGBA").save(buffer, format="WEBP", quality=90)
                                buffer.seek(0)

                                upload_result = cloudinary.uploader.upload(
                                    buffer,
                                    folder=CLOUDINARY_FOLDER,
                                    public_id=u_id,
                                    format="webp",
                                    overwrite=True
                                )

                                entry = {
                                    "id": u_id,
                                    "title": clean_title(p['title']) + (f" (Var {idx+1})" if len(image_urls)>1 else ""),
                                    "author": f"u/{p['author']}",
                                    "src": f"/spines/{u_id}.webp",
                                    "hash": h,
                                    "image": upload_result['secure_url']
                                }
                                
                                existing_data.append(entry)
                                existing_ids.add(u_id)
                                existing_hashes.add(h)
                                total_new += 1
                                save_db(existing_data)
                                
                        except Exception as e:
                            print(f"❌ Error saltado: {e}")
                            continue
                            
                if not after: break
    except KeyboardInterrupt:
        save_db(existing_data)
        sys.exit(0)

    print(f"\n✨ Prueba finalizada. {total_new} subidas nuevas.")

if __name__ == "__main__":
    update_database()