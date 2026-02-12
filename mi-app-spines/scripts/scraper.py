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

# --- CONFIGURACIÓN CLOUDINARY ---
# En local puedes rellenar esto. Para GitHub Actions usaremos variables de entorno.
cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', 'TU_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY', 'TU_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET', 'TU_API_SECRET')
)

# --- RUTAS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 
DB_JSON_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "public", "database.json"))

# Términos de búsqueda (Lógica A-Z + extras)
SEARCH_TERMS = [l for l in "abcdefghijklmnopqrstuvwxyz"] + ['lego', "star wars", "star"]

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
    
    print(f"\n🚀 Buscando actualizaciones en Cloudinary...")
    total_new = 0

    try:
        for term in SEARCH_TERMS:
            print(f"🔍 Escaneando: '{term}'")
            after = None
            while True:
                url = f"https://www.reddit.com/r/SwitchSpines/search.json?q={term}&restrict_sr=1&sort=new&limit=50"
                if after: url += f"&after={after}"
                
                res = session.get(url, timeout=20)
                if res.status_code == 429:
                    time.sleep(30); continue
                
                data = res.json().get('data', {})
                posts = data.get('children', [])
                after = data.get('after')
                if not posts: break

                for post in posts:
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
                        u_id = f"{p['id']}_{idx}"
                        if u_id in existing_ids: continue

                        try:
                            time.sleep(0.2)
                            img_res = session.get(img_url, timeout=15)
                            img = Image.open(BytesIO(img_res.content))
                            
                            # Mantenemos tu ratio de lomo (2.6+)
                            if (img.height / img.width) >= 2.6:
                                h = get_image_hash(img)
                                if h in existing_hashes: continue

                                # --- SUBIDA A CLOUDINARY ---
                                # Convertimos a WebP en memoria antes de subir
                                buffer = BytesIO()
                                img.convert("RGBA").save(buffer, format="WEBP", quality=85)
                                buffer.seek(0)

                                upload_result = cloudinary.uploader.upload(
                                    buffer,
                                    folder="spines",
                                    public_id=u_id,
                                    format="webp",
                                    overwrite=True
                                )

                                cloud_url = upload_result['secure_url']
                                title = clean_title(p['title'])
                                if len(image_urls) > 1: title += f" (Alt {idx+1})"
                                
                                entry = {
                                    "id": u_id, 
                                    "title": title, 
                                    "author": f"u/{p['author']}",
                                    "src": cloud_url, # URL DE LA NUBE
                                    "hash": h
                                }
                                existing_data.append(entry)
                                existing_ids.add(u_id)
                                existing_hashes.add(h)
                                total_new += 1
                                save_db(existing_data)
                                print(f"  ✅ En la nube: {title}")
                        except: continue
                if not after: break
    except KeyboardInterrupt:
        sys.exit(0)

    print(f"\n✨ ¡Hecho! {total_new} lomos nuevos en la nube.")

if __name__ == "__main__":
    update_database()