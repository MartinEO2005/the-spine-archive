import os
import requests
import json
import time
import re
import hashlib
import xml.etree.ElementTree as ET  # Librería nativa para leer RSS (sin instalar nada)
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

CLOUDINARY_FOLDER = 'spines_archive' 
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_JSON_PATH = os.path.join(BASE_DIR, "public", "database.json")

original_terms = [ "Lewcifer820", "Mii203" ,"eridyon","pand_ashh","Olivigarden", "TheKosmicKollector", "WarioPunk", "Smirkytrick", "rroneaa", "DukeLeto10191", "LadyRaye176","Remarkable",
 "SemiColin73", "Josarbe333", "HomoSnakexual", "ppmax008", "Tokyo Chronos"] + list("abcdefghijklmnopqrstuvwxyz")

# Mantenemos el orden original eliminando duplicados manualmente
raw_terms = [t for term in original_terms for t in (term.lower(), term.capitalize(), term)]
SEARCH_TERMS = []
for t in raw_terms:
    if t not in SEARCH_TERMS:
        SEARCH_TERMS.append(t)

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
    # PARTE 1: CARGA DE BASE DE DATOS (100% SEGURA E INTACTA)
    if os.path.exists(DB_JSON_PATH):
        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}
    
    print(f"\n🚀 Iniciando actualización masiva en: {CLOUDINARY_FOLDER}")
    print(f"📊 Base de datos actual: {len(existing_data)} entradas.")
    
    total_new = 0

    try:
        for term in SEARCH_TERMS:
            if total_new >= MAX_UPLOADS: break

            print(f"🔍 Buscando (Vía RSS): '{term}'")

            # PARTE 2: EL LOOPHOLE - LECTURA DEL CANAL RSS
            url = f"https://www.reddit.com/r/SwitchSpines/search.rss?q={term}&restrict_sr=1&sort=new&limit=50"
            
            try:
                res = session.get(url, timeout=15)
            except Exception as e:
                print(f"   💥 Error de conexión con '{term}': {e}")
                time.sleep(5); continue

            if res.status_code == 429:
                print("   ⏳ Esperando por Rate Limit (429)...")
                time.sleep(30); continue
            
            if res.status_code != 200: 
                print(f"   ⚠️ Reddit devolvió error {res.status_code} para '{term}'")
                continue

            try:
                root = ET.fromstring(res.content)
            except Exception:
                print(f"   ⚠️ No se pudo parsear el XML de '{term}'.")
                continue

            namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
            entries = root.findall('atom:entry', namespaces)

            if not entries: 
                print(f"   ℹ️ Búsqueda vacía para '{term}'.")
                continue

            for entry in entries:
                if total_new >= MAX_UPLOADS: break

                # Extraer ID del post (Reddit format: t3_1abcdef -> 1abcdef)
                id_node = entry.find('atom:id', namespaces)
                if id_node is None: continue
                p_id = id_node.text.split('_')[-1] if '_' in id_node.text else id_node.text

                # Extraer Título
                title_node = entry.find('atom:title', namespaces)
                p_title = title_node.text if title_node is not None else "Sin título"

                # Extraer Autor
                author_node = entry.find('atom:author/atom:name', namespaces)
                p_author = author_node.text.replace('/u/', 'u/') if author_node is not None else "deleted"

                content_node = entry.find('atom:content', namespaces)
                content = content_node.text if content_node is not None else ""

                # MEJORA: Regex extendido para capturar formatos de galería de Reddit
                # Captura tanto i.redd.it como preview.redd.it y enlaces dentro de etiquetas de imagen
                urls_found = re.findall(r'https://(?:i|preview)\.redd\.it/[a-zA-Z0-9]+\.(?:jpg|jpeg|png|webp)', content)
                
                # Si sospechamos que es una galería, intentamos buscar enlaces adicionales 
                # que a veces Reddit esconde en el atributo 'href' dentro del HTML del RSS
                more_urls = re.findall(r'href="(https://i\.redd\.it/[^"]+\.(?:jpg|jpeg|png|webp))"', content)
                
                image_urls = list(dict.fromkeys(urls_found + more_urls))
                
                # 2. Si no hay originales (pasa en algunos posts viejos), buscamos los previews
                if not image_urls:
                    image_urls = re.findall(r'https://preview\.redd\.it/[a-zA-Z0-9]+\.(?:jpg|jpeg|png|webp)', content)
                
                image_urls = list(dict.fromkeys(image_urls)) # Eliminar urls duplicadas

                # ---------------------------------------------------------
                # PARTE 3: PROCESAMIENTO MULTI-IMAGEN BLINDADO
                # ---------------------------------------------------------
                for idx, img_url in enumerate(image_urls):
                    if total_new >= MAX_UPLOADS: break

                    # ID único por cada imagen del post (postID_0, postID_1, etc.)
                    u_id = f"{p_id}_{idx}"
                    
                    if u_id in existing_ids: continue

                    try:
                        time.sleep(0.4)
                        img_res = session.get(img_url, timeout=10)
                        
                        # Filtro: Si el enlace está roto o bloqueado, saltamos
                        if img_res.status_code != 200:
                            continue
                            
                        # Filtro: Intentamos abrir la imagen de forma segura
                        try:
                            img = Image.open(BytesIO(img_res.content))
                        except Exception:
                            continue # Si no es una imagen válida, la ignoramos
                        
                        if img.height > 12000:
                            aspect = img.width / img.height
                            img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

                        if (img.height / img.width) >= 2.6:
                            h = get_image_hash(img)
                            if h in existing_hashes: continue

                            print(f"✅ Nuevo lomo encontrado: {clean_title(p_title)} (Imagen {idx+1})")

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

                            entry_data = {
                                "id": u_id,
                                "title": f"{clean_title(p_title)} (Parte {idx+1})",
                                "author": f"{p_author}",
                                "src": f"/spines/{u_id}.webp",
                                "hash": h,
                                "image": upload_result['secure_url'],
                                "created_utc": int(time.time())
                            }
                            
                            existing_data.append(entry_data)
                            existing_ids.add(u_id)
                            existing_hashes.add(h)
                            total_new += 1
                            
                            if total_new % 5 == 0:
                                save_db(existing_data)
                            
                    except Exception as e:
                        print(f"⚠️ Error procesando imagen {idx} de {p_id}: {e}")
                        continue
                        
    except KeyboardInterrupt:
        print("\nInterrumpido. Guardando progreso...")
    
    save_db(existing_data)
    print(f"\n✨ Proceso finalizado. {total_new} lomos añadidos correctamente.")

if __name__ == "__main__":
    update_database()