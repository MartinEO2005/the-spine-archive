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
# DB_JSON_PATH se actualiza a public/ para que React lo lea de forma estática en producción
DB_JSON_PATH = os.path.join(BASE_DIR, "public", "database.json")
EXTRACTIONS_DIR = os.path.join(BASE_DIR, "extractions") 

# --- DETECCIÓN INTELIGENTE DE LA CARPETA EXTRACTIONS ---
if not os.path.exists(EXTRACTIONS_DIR):
    raiz_proyecto = os.path.dirname(BASE_DIR)
    posible_ruta = os.path.join(raiz_proyecto, "extractions")
    if os.path.exists(posible_ruta):
        EXTRACTIONS_DIR = posible_ruta

# Verificación de seguridad antes de empezar
if not os.path.exists(DB_JSON_PATH):
    print(f"❌ ERROR CRÍTICO: No se encuentra el archivo en: {DB_JSON_PATH}")
    print("Por favor, verifica que la base de datos existe en tu directorio public.")
    sys.exit(1)

# --- TU LISTA DE TÉRMINOS EXACTA E INTOCABLE ---
letras = "abcdefghijklmnopqrstuvwxyz"
SEARCH_TERMS = [" ","by","The Eternal Comet","Drosanator", "shizoid_man", "SemiColin73", "Josarbe333", "Lewcifer820", "Mii203" ,"eridyon","pand_ashh","Olivigarden","KelvinBelmont",
               "TheKosmicKollector", "WarioPunk", "Smirkytrick", "rroneaa", "DukeLeto10191", "Yu-No","HomoSnakexual", "yngames", "Commander_Shepard123", "D4rks4dch4ld",
                 "Areckusu", "KEGINUS","ArgyleMonkey", "PSX_Ramitas", "by","LatchHyena", "TRIGGERSHAFT", "RukeyzZ", "version", "AriKage", ":", "Veyle", 
                 "N80378", "gaymersaurio_rex", "WishIWereAGhost", "SirDvolution", "thedustud", "Knuckles316" ,"spamgal6969", "pokeguy64", "MTPPY2",
                 "Toskotadi"]


#SEARCH_TERMS = [" ","by"]
MAX_UPLOADS = 10000 

# --- CONFIGURACIÓN DE DOBLE SESIÓN ---
api_session = curl_requests.Session(impersonate="chrome131")
api_session.cookies.update({
    'reddit_session': 'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml9iYms5ZzY1ZSIsImV4cCI6MTgwOTEwNDYxNy44MzA2MzcsImlhdCI6MTc5MzQ2NjIxNy44MzA2MzcsImp0aSI6IjhLU2JEbTdvcFFLRkgtUENiaVoyNmJxdWQ0SVc0ZyIsImF0IjoxLCJjaWQiOiJjb29raWUiLCJsY2EiOjE2MTc0ODgwOTEwMDAsInNjcCI6ImVKd0FBZ0Q5XzF0ZEF3QUJGUUM1IiwiZmxvIjoxfQ.iMr8Zz7OhSfBC9nHOQEwc-jZ2ieO5f9u8fhXh_PhlcjqePtbgQeoM9SBaKhCdzWlt6y7BuZP5CNV38RqM3unbVwxjfKmbyN05o-KCIZA3Kd5QFuS6Rx93PsRkTQtf7Cp_CgsAiIY3g_QF-n_7pN-3Tv_JjNf3FdVMfMcEagcOhoGS-1KUn7RayLilFxncif30Fdt2c_sagSiPnZBGyOBohCMV3ta_E-YdYLF2TaS761TU-2ePuRJTH5rjthmsDfEJfgq3o_QL8FSSEh2pWblKvCYnIxYkdVlmuoiPF5RfOQSGRjAij9npnX0efK1QwmyITsXDwMDxgblMMp6HcyR-g', 
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

# =====================================================================
# --- SOPORTE DE GALERÍAS (VARIAS SPINES EN UN MISMO POST) ---
# Mismo formato que ya usa tu database.json:
#   Post con 1 imagen  -> {id}
#   Galería            -> {id}_0, {id}_1, {id}_2 ...  + título "(Parte N)"
# También reconoce los IDs {id} y {id}_altN que se crearon por error,
# para no volver a subir nada que ya esté.
# =====================================================================
def base_post_id(u_id):
    return u_id.split('_')[0]          # los IDs de Reddit no llevan "_"

def make_spine_id(post_id, index, total):
    return post_id if total == 1 else f"{post_id}_{index}"

def equivalent_ids(post_id, index):
    """Todas las formas en que esa imagen puede estar ya guardada."""
    ids = {f"{post_id}_{index}"}
    if index == 0:
        ids.add(post_id)
    else:
        ids.add(f"{post_id}_alt{index}")
    return ids

def post_index_count(post_id, existing_ids):
    """Cuántas imágenes de este post hay ya guardadas (en cualquier formato)."""
    return sum(1 for i in existing_ids if base_post_id(i) == post_id)

DOWNLOAD_FAILURES = []   # imágenes que fallaron al descargar (se reintentan en la próxima ejecución)

# Posts ya revisados que NO tienen spines válidas (peticiones, fotos, portadas...).
# Se recuerdan para no volver a analizarlos y para saber cuándo parar de paginar.
SKIPPED_PATH = os.path.join(EXTRACTIONS_DIR, "skipped_posts.json")

def load_skipped():
    try:
        with open(SKIPPED_PATH, 'r', encoding='utf-8') as f:
            return set(json.load(f))
    except Exception:
        return set()

def save_skipped(skipped):
    try:
        os.makedirs(os.path.dirname(SKIPPED_PATH), exist_ok=True)
        with open(SKIPPED_PATH, 'w', encoding='utf-8') as f:
            json.dump(sorted(skipped), f)
    except Exception as e:
        print(f"⚠️ No se pudo guardar skipped_posts.json: {e}")

def is_gallery_post(p):
    return bool(p.get('is_gallery')) or p.get('post_hint') == 'gallery' or '/gallery/' in (p.get('url') or '')

def fetch_full_post(post_id):
    """Post completo desde Reddit. ScrapeCreators NO trae las imágenes de las galerías."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }
    json_url = f"https://www.reddit.com/r/SwitchSpines/comments/{post_id}.json"
    try:
        res = api_session.get(json_url, headers=headers, timeout=15)
        if res.status_code == 429:
            print("⏳ Rate limit alcanzado en API de Reddit (429). Esperando 15 segundos...")
            time.sleep(15)
            res = api_session.get(json_url, headers=headers, timeout=15)
        if res.status_code != 200:
            print(f"❌ No se pudo obtener el post de Reddit. Status HTTP: {res.status_code}")
            return None
        post_data = res.json()[0]['data']['children'][0]['data']
        # Soporte para Crossposts (publicaciones re-compartidas)
        if 'crosspost_parent_list' in post_data and post_data['crosspost_parent_list']:
            post_data = post_data['crosspost_parent_list'][0]
        return post_data
    except Exception as e:
        print(f"❌ Error al consultar el post {post_id}: {e}")
        return None

def extract_image_urls(post_data):
    """Devuelve TODAS las URLs de imagen del post, en el orden de la galería."""
    # Prioridad 1: Galería / imágenes incrustadas (media_metadata), en orden real
    meta = post_data.get('media_metadata') or {}
    if meta:
        order = [i.get('media_id') for i in (post_data.get('gallery_data') or {}).get('items', [])] or sorted(meta.keys())
        urls = []
        for mid in order:
            m = meta.get(mid, {})
            if m.get('e') != 'Image':
                continue
            # URL directa de i.redd.it (más fiable que la de preview firmada)
            ext = (m.get('m') or 'image/png').split('/')[-1].replace('jpeg', 'jpg')
            urls.append(f"https://i.redd.it/{mid}.{ext}")
        if urls:
            return urls

    # Prioridad 2: Previsualización de CDN de Reddit (Preview)
    try:
        images = post_data.get('preview', {}).get('images', [])
        if images:
            return [images[0]['source']['url'].replace('&amp;', '&')]
    except Exception:
        pass

    # Prioridad 3: URL de destino directo (i.redd.it, imgur, etc.)
    candidate = post_data.get('url_overridden_by_dest') or post_data.get('url', '')
    if candidate and 'reddit.com/' not in candidate:   # descarta /r/, /comments/ y /gallery/
        if 'imgur.com/' in candidate and not any(ext in candidate.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp']):
            img_id = candidate.rstrip('/').split('/')[-1]
            candidate = f"https://i.imgur.com/{img_id}.png"
        return [candidate]
    return []

def process_spine_image(img_url, u_id, post_data, existing_data, existing_ids, existing_hashes, check_ratio=True, title_suffix=""):
    """Descarga, valida, guarda en local, sube a B2 y añade a database.json. Devuelve la entrada o None."""
    if u_id in existing_ids:
        print(f"⚠️ El ID {u_id} ya existe en la base de datos.")
        return None

    img_res = img_session.get(img_url, timeout=10)
    if img_res.status_code != 200:
        print("⚠️ No se pudo descargar la imagen desde la CDN.")
        DOWNLOAD_FAILURES.append(u_id)
        return None

    img = Image.open(BytesIO(img_res.content))

    # --- 🛡️ FILTRO ESTRICTO DE PROPORCIÓN DE SPINE ---
    if check_ratio and (img.height / img.width) < 2.6:
        print(f"⚠️ Omitido: La imagen no tiene formato de spine (Proporción ancho/alto inválida: {img.width}x{img.height}).")
        return None

    if img.height > 12000:
        aspect = img.width / img.height
        img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

    h = get_image_hash(img)
    if h in existing_hashes:
        print("⚠️ Esta imagen ya existe (duplicada por hash).")
        return None

    buffer = BytesIO()
    img.convert("RGBA").save(buffer, format="WEBP", quality=85)
    buffer.seek(0)

    local_dir = os.path.join(BASE_DIR, "public", "spines")
    os.makedirs(local_dir, exist_ok=True)
    with open(os.path.join(local_dir, f"{u_id}.webp"), 'wb') as f:
        f.write(buffer.getvalue())
    print(f"💾 Backup local guardado: {u_id}.webp")

    filename_b2 = f"spines/{u_id}.webp"
    s3_client.upload_fileobj(buffer, B2_BUCKET_NAME, filename_b2, ExtraArgs={'ContentType': 'image/webp'})
    print(f"☁️ Subido a Backblaze B2: {u_id}.webp")

    prefix = B2_PUBLIC_URL_PREFIX or f"https://cdn.thespinearchive.xyz/file/{B2_BUCKET_NAME}"
    public_image_url = f"{prefix.rstrip('/')}/{filename_b2}"

    raw_author = post_data.get('author')
    author_name = f"u/{raw_author}" if raw_author and raw_author != "[deleted]" else "u/DeletedUser"

    new_entry = {
        "id": u_id,
        "title": clean_title(post_data.get('title', 'Unknown')) + title_suffix,
        "author": author_name,
        "src": f"/spines/{u_id}.webp",
        "hash": h,
        "image": public_image_url,
        "created_utc": int(post_data.get('created_utc', time.time()))
    }

    existing_data.append(new_entry)
    existing_ids.add(u_id)
    existing_hashes.add(h)
    save_db(existing_data)
    print(f"🎉 ¡ÉXITO! '{new_entry['title']}' añadido correctamente.")
    return new_entry

def process_post_images(post_data, existing_data, existing_ids, existing_hashes, check_ratio=True):
    """Procesa TODAS las imágenes de un post. Devuelve la lista de entradas nuevas."""
    post_id = str(post_data.get('id', ''))
    img_urls = extract_image_urls(post_data)

    if not img_urls:
        print("⚠️ Omitido: El post no contiene una imagen válida.")
        return []

    if len(img_urls) > 1:
        print(f"🖼️ Galería detectada: {len(img_urls)} imágenes")

    total = len(img_urls)
    added = []
    for idx, img_url in enumerate(img_urls):
        u_id = make_spine_id(post_id, idx, total)
        if total > 1:
            print(f"\n   ➜ Imagen {idx + 1}/{total} (ID: {u_id})")
        already = equivalent_ids(post_id, idx) & existing_ids
        if total == 1 and post_id in existing_ids:
            already = {post_id}
        if already:
            print(f"   ⏭️ Ya estaba en la base de datos (como {', '.join(sorted(already))}).")
            continue
        try:
            suffix = f" (Parte {idx + 1})" if total > 1 else ""
            entry = process_spine_image(img_url, u_id, post_data, existing_data, existing_ids, existing_hashes, check_ratio, suffix)
            if entry:
                added.append(entry)
                time.sleep(2)
        except Exception as e:
            print(f"❌ Error procesando la imagen {u_id}: {e}")
    return added

# --- FUNCIÓN PARA FORZAR EL SCRAPING DE UN POST ESPECÍFICO ---
def process_single_reddit_post(post_url_or_id):
    """
    Forzar el scraping de un post específico de Reddit omitiendo 
    los filtros estrictos de búsqueda general. Soporta enlaces cortos (/s/),
    crossposts, galerías (TODAS sus imágenes), links de Imgur e imágenes embebidas.
    Si el post ya existía con solo 1 imagen, añade las que faltan (_alt1, _alt2...).
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }

    # 1. Resolver enlaces cortos de móvil (/s/)
    if '/s/' in post_url_or_id:
        try:
            r = normal_requests.get(post_url_or_id, headers=headers, allow_redirects=True, timeout=10)
            post_url_or_id = r.url
        except Exception as e:
            print(f"❌ Error al resolver el enlace corto ({post_url_or_id}): {e}")
            return

    match = re.search(r'comments/([a-z0-9]+)', post_url_or_id)
    post_id = match.group(1) if match else post_url_or_id.strip()

    print(f"\n🎯 Intentando forzar scraping del post ID: {post_id}")

    post_data = fetch_full_post(post_id)
    if not post_data:
        return

    with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}

    added = process_post_images(post_data, existing_data, existing_ids, existing_hashes, check_ratio=False)
    print(f"\n✨ {len(added)} lomo(s) añadido(s) desde este post.")


# --- OPCIÓN 3: PROCESAR ENLACES DEL TABLERO ---
def process_bounty_links_from_file():
    """
    Busca el archivo JSON más reciente de links extraídos en la carpeta
    extractions y los procesa uno por uno con pausas anti-429.
    """
    print("\n📁 Buscando archivos de enlaces en /extractions...")
    if not os.path.exists(EXTRACTIONS_DIR):
        print("❌ No se encontró la carpeta extractions.")
        return

    archivos_links = sorted([f for f in os.listdir(EXTRACTIONS_DIR) if f.startswith('links') and f.endswith('.json')])
    
    if not archivos_links:
        print("🤷 No se encontraron archivos de enlaces (links*.json). ¡Ejecuta primero el script de Node para extraerlos!")
        return
    
    ultimo_json = os.path.join(EXTRACTIONS_DIR, archivos_links[-1])
    print(f"📄 Leyendo archivo: {archivos_links[-1]}")
    
    try:
        with open(ultimo_json, 'r', encoding='utf-8') as f:
            links = json.load(f)
            
        if not links:
            print("⚠️ El archivo está vacío.")
            return
            
        print(f"🎯 ¡Se han encontrado {len(links)} links para procesar!")
        
        for idx, link in enumerate(links):
            print(f"\n-------------------------------------------------")
            print(f"🔗 [{idx+1}/{len(links)}] Procesando Link de la comunidad: {link}")
            print(f"-------------------------------------------------")
            process_single_reddit_post(link)
            
            # Pausa de 2 segundos entre peticiones para evitar activar la tasa límite HTTP 429
            time.sleep(2)
            
    except Exception as e:
        print(f"❌ Error al leer el archivo de links: {e}")

MAX_PAGES = 8   # ScrapeCreators devuelve 25 posts por página -> hasta 200 posts recientes

def update_database():
    try:
        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    except json.JSONDecodeError:
        print("⚠️ El database.json tenía error de formato. Iniciando limpio.")
        existing_data = []

    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}
    known_posts = {base_post_id(i) for i in existing_ids}
    # Galerías guardadas con UNA sola imagen (por el fallo antiguo): candidatas a recuperar las que faltan
    single_saved = {pid for pid in known_posts if post_index_count(pid, existing_ids) == 1}
    skipped_posts = load_skipped()

    print(f"\n🚀 Iniciando actualización vía ScrapeCreators en B2: {B2_BUCKET_NAME}")
    print(f"📊 Base de datos actual: {len(existing_data)} entradas.")

    # --- CONFIGURACIÓN DE SCRAPECREATORS ---
    api_key = "qRWn8PjygiUlOdUt1DhBboRx0Ju2"
    url = "https://api.scrapecreators.com/v1/reddit/subreddit"
    headers = {"x-api-key": api_key}

    total_new = 0
    new_authors = []
    after = None

    try:
        for page in range(MAX_PAGES):
            params = {"subreddit": "SwitchSpines", "sort": "new"}
            if after:
                params["after"] = after

            print(f"\n🔍 Consultando posts a través de ScrapeCreators (página {page + 1})...")
            res = normal_requests.get(url, headers=headers, params=params, timeout=20)
            if res.status_code != 200:
                print(f"❌ Error HTTP {res.status_code} al consultar la API de ScrapeCreators.")
                break

            data = res.json()
            posts = data.get("posts", []) or data.get("data", {}).get("children", [])
            print(f"🎯 ¡Se han obtenido {len(posts)} posts recientes correctamente!")
            if not posts:
                break

            page_had_unseen = False
            for post in posts:
                if total_new >= MAX_UPLOADS:
                    break

                p = post.get('data', post)
                post_id = str(p.get('id', ''))
                if not post_id:
                    continue

                if post_id in skipped_posts:
                    continue

                gallery = is_gallery_post(p)

                if post_id in known_posts:
                    # Galerías guardadas con solo 1 imagen: recuperamos las que faltan
                    if not (gallery and post_id in single_saved):
                        continue
                    print(f"\n-------------------------------------------------")
                    print(f"🔁 Revisando galería ya archivada (ID: {post_id}) por si faltan imágenes")
                    print(f"-------------------------------------------------")
                else:
                    page_had_unseen = True
                    print(f"\n-------------------------------------------------")
                    print(f"🔗 Analizando post (ID: {post_id})")
                    print(f"-------------------------------------------------")

                # Las galerías no traen las imágenes en ScrapeCreators: pedimos el post completo a Reddit
                post_data = p
                if gallery and not p.get('media_metadata'):
                    post_data = fetch_full_post(post_id)
                    if not post_data:
                        continue

                failures_before = len(DOWNLOAD_FAILURES)
                added = process_post_images(post_data, existing_data, existing_ids, existing_hashes)
                # Post nuevo sin ninguna spine válida y sin fallos de descarga -> no volver a analizarlo
                if not added and post_id not in known_posts and len(DOWNLOAD_FAILURES) == failures_before:
                    skipped_posts.add(post_id)
                if added:
                    known_posts.add(post_id)
                    single_saved.discard(post_id)
                total_new += len(added)
                new_authors += [e['author'] for e in added]

            # Si ya hemos llegado a posts anteriores a la última ejecución, estamos al día
            new_after = data.get("after") or data.get("data", {}).get("after")
            if not page_had_unseen:
                print("\n✅ Página sin posts nuevos: ya estás al día. Parando.")
                break
            if not new_after or new_after == after or total_new >= MAX_UPLOADS:
                break
            after = new_after
            time.sleep(1)

    except Exception as e:
        print(f"❌ Error al consultar la API: {e}")

    save_db(existing_data)
    save_skipped(skipped_posts)
    print(f"\n✨ Proceso finalizado. {total_new} lomos nuevos añadidos correctamente.")
    if DOWNLOAD_FAILURES:
        print(f"⚠️ {len(DOWNLOAD_FAILURES)} imágenes no se pudieron descargar; se reintentarán en la próxima ejecución.")

    if total_new > 0:
        scrape_info_path = os.path.join(BASE_DIR, "public", "scrape_info.json")
        unique_authors = sorted(list(set(new_authors)))
        info_payload = {
            "count": total_new,
            "date": time.strftime("%Y-%m-%d %H:%M"),
            "authors": unique_authors
        }
        try:
            with open(scrape_info_path, 'w', encoding='utf-8') as f_info:
                json.dump(info_payload, f_info, indent=2, ensure_ascii=False)
            print(f"💾 Metadatos del scrape actualizados en: {scrape_info_path}")
        except Exception as e:
            print(f"⚠️ No se pudo escribir scrape_info.json: {e}")

if __name__ == "__main__":
    print("\n=============================================")
    print("📋 CONTROL DE BÚSQUEDA DEL SCRAPER")
    print("=============================================")
    print("1. Scraping general por términos y cola de Node")
    print("2. Forzar scraping de un post específico por URL/ID de Reddit")
    print("3. Procesar archivo de enlaces extraídos (links-*.json)")
    
    opcion = input("\nSelecciona una opción (1, 2 o 3, por defecto 1): ").strip()

    if opcion == "3":
        process_bounty_links_from_file()
    elif opcion == "2":
        target_post = input("Pega la URL o ID del post de Reddit: ").strip()
        if target_post:
            process_single_reddit_post(target_post)
        else:
            print("⚠️ No ingresaste una URL válida. Abortando.")
    else:
        respuesta = input("\n¿Quieres añadir los juegos solicitados del .json a la búsqueda? (s/n): ").strip().lower()

        if respuesta == 's':
            try:
                if os.path.exists(EXTRACTIONS_DIR):
                    # Filtrar los archivos que NO empiecen por 'links' para buscar los títulos de juegos
                    archivos = sorted([f for f in os.listdir(EXTRACTIONS_DIR) if not f.startswith('links') and f.endswith('.json')])
                    if archivos:
                        ultimo_json = os.path.join(EXTRACTIONS_DIR, archivos[-1])
                        with open(ultimo_json, 'r', encoding='utf-8') as f:
                            peticiones_json = json.load(f)
                            
                            peticiones_limpias = [str(j).strip().lower() for j in peticiones_json if j]
                            SEARCH_TERMS = peticiones_limpias + SEARCH_TERMS
                            print(f"✅ ¡Éxito! Se han sumado {len(peticiones_limpias)} términos prioritarios desde {archivos[-1]}")
                    else:
                        print("⚠️ No hay archivos JSON de títulos en la carpeta /extractions. Usando solo tu lista fija.")
                else:
                    print("⚠️ No se encontró la carpeta /extractions. Usando solo tu lista fija.")
            except Exception as e:
                print(f"❌ Error al leer el JSON de extracción: {e}. Continuando solo con tu lista fija.")
        else:
            print("👍 Entendido. Buscando únicamente tu lista fija por defecto.")

        update_database()