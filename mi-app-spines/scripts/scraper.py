import os
import json
import time
import re
import hashlib
import sys
import boto3
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
from curl_cffi import requests as curl_requests 
import requests as normal_requests

# Forzamos recargar el .env por si has hecho cambios recientes
load_dotenv(override=True)

# --- CONFIGURACIÓN DE CREDENCIALES (SEGÚN TU .ENV) ---
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('B2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('B2_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('B2_SECRET_KEY')
)

B2_BUCKET_NAME = os.getenv('B2_BUCKET_NAME')
B2_PUBLIC_URL_PREFIX = os.getenv('B2_PUBLIC_URL_PREFIX', '').strip()

BASE_DIR = r"C:\Users\MartinEO\Desktop\the-spine-archive\mi-app-spines"
DB_JSON_PATH = os.path.join(BASE_DIR, "api", "database.json")
EXTRACTIONS_DIR = os.path.join(BASE_DIR, "extractions") 

# Verificación de seguridad antes de empezar
if not os.path.exists(DB_JSON_PATH):
    print(f"❌ ERROR CRÍTICO: No se encuentra el archivo en: {DB_JSON_PATH}")
    print("Por favor, verifica que la carpeta 'api' existe dentro de 'mi-app-spines'.")
    sys.exit(1)

# --- TU LISTA DE TÉRMINOS EXACTA E INTOCABLE ---
letras = "abcdefghijklmnopqrstuvwxyz"
SEARCH_TERMS = [" ","The Eternal Comet", "SemiColin73", "Josarbe333", "Lewcifer820", "Mii203" ,"eridyon","pand_ashh","Olivigarden","KelvinBelmont", "TheKosmicKollector", "WarioPunk",
                 "Smirkytrick", "rroneaa", "DukeLeto10191", "Yu-No","HomoSnakexual", "yngames", "Commander_Shepard123", "Dead by", "Paw Patrol", "D4rks4dch4ld"] 

MAX_UPLOADS = 10000 

# --- PREGUNTA INICIAL: ¿SUMAR COLA DE NODE? ---
print("\n=============================================")
print("📋 CONTROL DE BÚSQUEDA DEL SCRAPER")
print("=============================================")
respuesta = input("¿Quieres añadir los juegos solicitados del .json a la búsqueda? (s/n): ").strip().lower()

if respuesta == 's':
    try:
        if os.path.exists(EXTRACTIONS_DIR):
            archivos = sorted([f for f in os.listdir(EXTRACTIONS_DIR) if f.endswith('.json')])
            if archivos:
                ultimo_json = os.path.join(EXTRACTIONS_DIR, archivos[-1])
                with open(ultimo_json, 'r', encoding='utf-8') as f:
                    peticiones_json = json.load(f)
                    
                    peticiones_limpias = [str(j).strip().lower() for j in peticiones_json if j]
                    SEARCH_TERMS = peticiones_limpias + SEARCH_TERMS
                    print(f"✅ ¡Éxito! Se han sumado {len(peticiones_limpias)} términos prioritarios desde {archivos[-1]}")
            else:
                print("⚠️ No hay archivos JSON en la carpeta /extractions. Usando solo tu lista fija.")
        else:
            print("⚠️ No se encontró la carpeta /extractions. Usando solo tu lista fija.")
    except Exception as e:
        print(f"❌ Error al leer el JSON de extracción: {e}. Continuando solo con tu lista fija.")
else:
    print("👍 Entendido. Buscando únicamente tu lista fija por defecto.")


# --- CONFIGURACIÓN DE DOBLE SESIÓN ---
api_session = curl_requests.Session(impersonate="chrome120")
api_session.cookies.update({
    'reddit_session': 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml9iYms5ZzY1ZSIsImV4cCI6MTc5NjMxNzI4MC43OTUxMzksImlhdCI6MTc4MDY3ODg4MC43OTUxMzksImp0aSI6ImluN3hpWjcybkJvVGJnUUwtRVN4RkRMSEtmUlVkUSIsImF0IjoxLCJjaWQiOiJjb29raWUiLCJsY2EiOjE2MTc0ODgwOTEwMDAsInNjcCI6ImVKeUtqZ1VFQUFEX193RVZBTGsiLCJmbG8iOjF9.mJ0LZLS2OSEE91XdtYHm2jhucDgUxtyW8SAsdzJlsUN19k3Xh3qq41P603Wf1FYgcxY6o_GfDApFtyQJsjwcqru4vla63brewAUBWWHTD4HceSC4EIRVc5Nb4BCmNspBR0ZV4Decuay76cNyij4QDskFFmrejY4ELmYiiuTFUimvatP6GZjgzBfZahjf_W_EDUb6KOMlc77Kpyif6VG0-mmkjdVDoliwr5dd0mxoc5H7ejYziZrPgCIO_yZim6RtaU_whBIMV24Fhud99WHdDaZ55XjVUhWQ6zgfUZZ-5nh69KDQr5jzhrv-9w5K28mjzD-PDv6koJOESLchIXiJlA', 
})

img_session = normal_requests.Session()
img_session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
})

def get_image_hash(img):
    img_small = img.convert("L").resize((16, 16), Image.Resampling.LANCZOS)
    return hashlib.md5(img_small.tobytes()).hexdigest()

def clean_title(title):
    t = title.replace('&amp;', '&')
    t = re.sub(r'\[.*?\]', '', t).strip()
    return t

# --- SISTEMA DE GUARDADO ATÓMICO ---
def save_db(data):
    try:
        temp_path = DB_JSON_PATH + ".tmp"
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
            if os.path.exists(DB_JSON_PATH):
                os.remove(DB_JSON_PATH)
            os.rename(temp_path, DB_JSON_PATH)
    except Exception as e:
        print(f"❌ ERROR CRÍTICO AL GUARDAR DATABASE.JSON: {e}")

def update_database():
    try:
        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    except json.JSONDecodeError:
        print("⚠️ El database.json en /api tenía error de formato. Iniciando limpio.")
        existing_data = []

    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}

    print(f"\n🚀 Iniciando actualización en Backblaze B2: {B2_BUCKET_NAME}")
    print(f"📊 Base de datos actual: {len(existing_data)} entradas.")

    total_new = 0

    try:
        for term in SEARCH_TERMS:
            if total_new >= MAX_UPLOADS: break

            print(f"🔍 Buscando en Reddit: '{term}'")
            after = None

            while True:
                if total_new >= MAX_UPLOADS: break

                url = f"https://www.reddit.com/r/SwitchSpines/search.json?q={term}&restrict_sr=1&sort=new&limit=50"
                if after: url += f"&after={after}"

                try:
                    res = api_session.get(url, timeout=15)
                except Exception as e:
                    print(f"   ⚠️ Error de conexión en API: {e}")
                    time.sleep(5); continue

                if res.status_code == 429:
                    print("   ⏳ Esperando por Rate Limit (API)...")
                    time.sleep(30); continue

                if res.status_code != 200: 
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
                            time.sleep(0.4)
                            img_res = img_session.get(img_url, timeout=10)
                            if img_res.status_code != 200: continue
                            
                            img = Image.open(BytesIO(img_res.content))

                            if img.height > 12000:
                                aspect = img.width / img.height
                                img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

                            if (img.height / img.width) >= 2.6:
                                h = get_image_hash(img)
                                if h in existing_hashes: continue

                                print(f"✅ Nuevo lomo encontrado: {clean_title(p['title'])}")

                                buffer = BytesIO()
                                img.convert("RGBA").save(buffer, format="WEBP", quality=85)
                                buffer.seek(0)

                                # --- SUBIDA A BACKBLAZE B2 ---
                                filename_b2 = f"spines/{u_id}.webp"
                                s3_client.upload_fileobj(
                                    buffer,
                                    B2_BUCKET_NAME,
                                    filename_b2,
                                    ExtraArgs={'ContentType': 'image/webp'}
                                )

                                # --- CONSTRUCCIÓN INFALIBLE DE LA URL PÚBLICA ---
                                prefix = B2_PUBLIC_URL_PREFIX
                                if not prefix: 
                                    # Fallback automático por si el .env falla
                                    prefix = f"https://f005.backblazeb2.com/file/{B2_BUCKET_NAME}"

                                public_image_url = f"{prefix.rstrip('/')}/{filename_b2}"

                                entry = {
                                    "id": u_id,
                                    "title": f"{clean_title(p['title'])} (Parte {idx+1})" if len(image_urls) > 1 else clean_title(p['title']),
                                    "author": f"u/{p['author']}",
                                    "src": f"/spines/{u_id}.webp",
                                    "hash": h,
                                    "image": public_image_url,
                                    "created_utc": int(p.get('created_utc', time.time())) 
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
        print("\n🛑 Escaneo cancelado por el usuario. Asegurando base de datos...")

    save_db(existing_data)
    print(f"\n✨ Proceso finalizado. {total_new} lomos añadidos correctamente.")

if __name__ == "__main__":
    update_database()