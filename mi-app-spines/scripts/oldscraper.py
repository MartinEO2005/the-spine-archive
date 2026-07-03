import os
import json
import time
import re
import hashlib
import cloudinary
import cloudinary.uploader
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

# Importamos AMBOS clientes para la estrategia de doble sesión
from curl_cffi import requests as curl_requests 
import requests as normal_requests

load_dotenv()

# --- CONFIGURACIÓN DE PRODUCCIÓN ---
cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

CLOUDINARY_FOLDER = 'spines_archive' 
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_JSON_PATH = os.path.join(BASE_DIR, "public", "database.json")

letras = "abcdefghijklmnopqrstuvwxyz"
SEARCH_TERMS = [" ","nascar", "SemiColin73", "Josarbe333", "Lewcifer820", "Mii203" ,"eridyon","pand_ashh","Olivigarden","KelvinBelmont", "TheKosmicKollector", "WarioPunk",
                 "Smirkytrick", "rroneaa", "DukeLeto10191", "Yu-No","HomoSnakexual", "yngames",
                   "zumba burn it up!", "Ultra Mega Xtra Party", "Ultra Kaiju Monster", "Dairoku: Agentes de Sakuratani", "Lafister", "Gal Metal", "Geminose: Animal Popstars",
                   "Sp4den", "Instant Chef Party"] + list(letras)

MAX_UPLOADS = 10000 

# -----------------------------------------------------------------
# CONFIGURACIÓN DE DOBLE SESIÓN
# -----------------------------------------------------------------
# Sesión 1: Solo para el JSON de Reddit (Evita el 403 de la API)
api_session = curl_requests.Session(impersonate="chrome120")
api_session.cookies.update({
    'reddit_session': 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml9iYms5ZzY1ZSIsImV4cCI6MTc5NjMxNzI4MC43OTUxMzksImlhdCI6MTc4MDY3ODg4MC43OTUxMzksImp0aSI6ImluN3hpWjcybkJvVGJnUUwtRVN4RkRMSEtmUlVkUSIsImF0IjoxLCJjaWQiOiJjb29raWUiLCJsY2EiOjE2MTc0ODgwOTEwMDAsInNjcCI6ImVKeUtqZ1VFQUFEX193RVZBTGsiLCJmbG8iOjF9.mJ0LZLS2OSEE91XdtYHm2jhucDgUxtyW8SAsdzJlsUN19k3Xh3qq41P603Wf1FYgcxY6o_GfDApFtyQJsjwcqru4vla63brewAUBWWHTD4HceSC4EIRVc5Nb4BCmNspBR0ZV4Decuay76cNyij4QDskFFmrejY4ELmYiiuTFUimvatP6GZjgzBfZahjf_W_EDUb6KOMlc77Kpyif6VG0-mmkjdVDoliwr5dd0mxoc5H7ejYziZrPgCIO_yZim6RtaU_whBIMV24Fhud99WHdDaZ55XjVUhWQ6zgfUZZ-5nh69KDQr5jzhrv-9w5K28mjzD-PDv6koJOESLchIXiJlA', # Cámbiame por tu cookie real
})

# Sesión 2: Solo para descargar las imágenes (Evita el "cannot identify image file")
img_session = normal_requests.Session()
img_session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
})
# -----------------------------------------------------------------

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

    print(f"\n🚀 Iniciando actualización masiva HÍBRIDA (Doble Sesión) en: {CLOUDINARY_FOLDER}")
    print(f"📊 Base de datos actual: {len(existing_data)} entradas.")

    total_new = 0

    try:
        for term in SEARCH_TERMS:
            if total_new >= MAX_UPLOADS: break

            print(f"🔍 Buscando en JSON: '{term}'")
            after = None

            while True:
                if total_new >= MAX_UPLOADS: break

                url = f"https://www.reddit.com/r/SwitchSpines/search.json?q={term}&restrict_sr=1&sort=new&limit=50"
                if after: url += f"&after={after}"

                try:
                    # PASO A: Buscamos usando la sesión camuflada contra el 403
                    res = api_session.get(url, timeout=15)
                except Exception as e:
                    print(f"   ⚠️ Error de conexión en API: {e}")
                    time.sleep(5); continue

                if res.status_code == 429:
                    print("   ⏳ Esperando por Rate Limit (API)...")
                    time.sleep(30); continue

                if res.status_code != 200: 
                    print(f"   ❌ Error {res.status_code} al acceder a la API")
                    break

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

                        if u_id in existing_ids: continue

                        try:
                            time.sleep(0.5)
                            # PASO B: Descargamos la imagen usando la sesión LIMPIA de requests
                            img_res = img_session.get(img_url, timeout=10)
                            
                            if img_res.status_code != 200: continue
                            
                            # Ahora los bytes serán una imagen real identificable
                            img = Image.open(BytesIO(img_res.content))

                            if img.height > 12000:
                                aspect = img.width / img.height
                                img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

                            if (img.height / img.width) >= 2.6:
                                h = get_image_hash(img)
                                if h in existing_hashes: continue

                                # 1. Para que tu consola te avise del número de imagen
                                print(f"✅ Nuevo lomo encontrado: {clean_title(p['title'])}" + (f" (Imagen {idx+1})" if len(image_urls) > 1 else ""))

                                buffer = BytesIO()
                                img.convert("RGBA").save(buffer, format="WEBP", quality=85)
                                buffer.seek(0)

                                upload_result = cloudinary.uploader.upload(
                                    buffer,
                                    folder=CLOUDINARY_FOLDER,
                                    public_id=u_id,
                                    format="webp",
                                    overwrite=True
                                )

                                # 2. Estructura con fecha y nombre correcto de galería
                                entry = {
                                    "id": u_id,
                                    "title": f"{clean_title(p['title'])} (Parte {idx+1})" if len(image_urls) > 1 else clean_title(p['title']),
                                    "author": f"u/{p['author']}",
                                    "src": f"/spines/{u_id}.webp",
                                    "hash": h,
                                    "image": upload_result['secure_url'],
                                    "created_utc": int(time.time()) 
                                }
                                existing_data.append(entry)
                                existing_ids.add(u_id)
                                existing_hashes.add(h)
                                total_new += 1

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