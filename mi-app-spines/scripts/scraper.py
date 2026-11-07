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

# --- FUNCIÓN PARA FORZAR EL SCRAPING DE UN POST ESPECÍFICO ---
def process_single_reddit_post(post_url_or_id):
    """
    Forzar el scraping de un post específico de Reddit omitiendo 
    los filtros estrictos de búsqueda general. Soporta enlaces cortos (/s/),
    crossposts, galerías, links de Imgur e imágenes embebidas.
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

    json_url = f"https://www.reddit.com/r/SwitchSpines/comments/{post_id}.json"

    try:
        res = api_session.get(json_url, headers=headers, timeout=15)
    except Exception as e:
        print(f"❌ Error de conexión al consultar el post: {e}")
        return

    # Manejo del Rate Limit 429
    if res.status_code == 429:
        print("⏳ Rate limit alcanzado en API de Reddit (429). Esperando 15 segundos...")
        time.sleep(15)
        return

    if res.status_code != 200:
        print(f"❌ No se pudo obtener el post de Reddit. Status HTTP: {res.status_code}")
        return

    try:
        data = res.json()
        post_data = data[0]['data']['children'][0]['data']
        
    except Exception as e:
        print(f"❌ Error al interpretar la respuesta JSON del post: {e}")
        return

    # Soporte para Crossposts (publicaciones re-compartidas)
    if 'crosspost_parent_list' in post_data and post_data['crosspost_parent_list']:
        post_data = post_data['crosspost_parent_list'][0]

    # --- EXTRACCIÓN ROBUSTA DE LA URL DE IMAGEN ---
    img_url = None

    # Prioridad 1: Imágen(es) en media_metadata (Galerías o imágenes incrustadas)
    if post_data.get('media_metadata'):
        meta = post_data.get('media_metadata', {})
        for k in sorted(meta.keys()):
            if meta[k].get('e') == 'Image':
                u = meta[k].get('s', {}).get('u') or meta[k].get('s', {}).get('gif')
                if u:
                    img_url = u.replace('&amp;', '&')
                    break

    # Prioridad 2: Previsualización de CDN de Reddit (Preview)
    if not img_url:
        try:
            images = post_data.get('preview', {}).get('images', [])
            if images:
                img_url = images[0]['source']['url'].replace('&amp;', '&')
        except Exception:
            pass

    # Prioridad 3: URL de destino directo (i.redd.it, imgur, etc.)
    if not img_url:
        candidate = post_data.get('url_overridden_by_dest') or post_data.get('url', '')
        if candidate and 'reddit.com/r/' not in candidate and 'reddit.com/comments/' not in candidate:
            if 'imgur.com/' in candidate and not any(ext in candidate.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp']):
                img_id = candidate.rstrip('/').split('/')[-1]
                candidate = f"https://i.imgur.com/{img_id}.png"
            img_url = candidate

    # Validación final anti-HTML
    if not img_url or 'reddit.com/r/' in img_url or 'reddit.com/comments/' in img_url:
        print("❌ No se encontró ninguna URL de imagen válida en el post (es un post de solo texto o petición sin imagen).")
        return

    print(f"🔗 URL de la imagen detectada: {img_url}")

    try:
        img_res = img_session.get(img_url, timeout=10)
        if img_res.status_code != 200:
            print("❌ No se pudo descargar la imagen desde la CDN.")
            return

        img = Image.open(BytesIO(img_res.content))

        if img.height > 12000:
            aspect = img.width / img.height
            img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

        h = get_image_hash(img)

        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)

        existing_ids = {item['id'] for item in existing_data}
        existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}

        u_id = post_id
        if u_id in existing_ids:
            print(f"⚠️ El ID {u_id} ya existe en la base de datos.")
            return

        if h in existing_hashes:
            print("⚠️ Esta imagen exacta ya está registrada en la base de datos (mismo hash).")
            return

        buffer = BytesIO()
        img.convert("RGBA").save(buffer, format="WEBP", quality=85)
        buffer.seek(0)

        # Guardado local en public/spines
        local_dir = os.path.join(BASE_DIR, "public", "spines")
        os.makedirs(local_dir, exist_ok=True)
        local_filepath = os.path.join(local_dir, f"{u_id}.webp")
        with open(local_filepath, 'wb') as f:
            f.write(buffer.getvalue())

        # Subida a Backblaze B2
        filename_b2 = f"spines/{u_id}.webp"
        s3_client.upload_fileobj(
            buffer,
            B2_BUCKET_NAME,
            filename_b2,
            ExtraArgs={'ContentType': 'image/webp'}
        )

        prefix = B2_PUBLIC_URL_PREFIX or f"https://cdn.thespinearchive.xyz/file/{B2_BUCKET_NAME}"
        public_image_url = f"{prefix.rstrip('/')}/{filename_b2}"

        raw_author = post_data.get('author')
        author_name = f"u/{raw_author}" if raw_author and raw_author != "[deleted]" else "u/DeletedUser"

        new_entry = {
            "id": u_id,
            "title": clean_title(post_data['title']),
            "author": author_name,
            "src": f"/spines/{u_id}.webp",
            "hash": h,
            "image": public_image_url,
            "created_utc": int(post_data.get('created_utc', time.time()))
        }

        existing_data.append(new_entry)
        save_db(existing_data)
        print(f"🎉 ¡ÉXITO! '{new_entry['title']}' (por {author_name}) se ha añadido correctamente a B2 y database.json.")

    except Exception as e:
        print(f"❌ Error procesando el post individual: {e}")


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

def update_database():
    try:
        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    except json.JSONDecodeError:
        print("⚠️ El database.json tenía error de formato. Iniciando limpio.")
        existing_data = []

    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}

    print(f"\n🚀 Iniciando actualización vía Feed RSS (Filtrado estricto) en B2: {B2_BUCKET_NAME}")
    print(f"📊 Base de datos actual: {len(existing_data)} entradas.")

    rss_url = "https://www.reddit.com/r/SwitchSpines/new.rss?limit=100"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }

    try:
        print(f"🔍 Consultando feed RSS público de r/SwitchSpines...")
        res = normal_requests.get(rss_url, headers=headers, timeout=15)
        
        if res.status_code != 200:
            print(f"❌ Error HTTP {res.status_code} al obtener el feed RSS.")
            return

        post_ids = re.findall(r'reddit\.com/r/SwitchSpines/comments/([a-z0-9]+)', res.text)
        unique_ids = list(dict.fromkeys(post_ids))
        
        print(f"🎯 ¡Se han encontrado {len(unique_ids)} posts recientes en el RSS!")

        total_new = 0
        new_authors = []

        for post_id in unique_ids:
            if total_new >= MAX_UPLOADS: 
                break

            if post_id in existing_ids:
                continue

            print(f"\n-------------------------------------------------")
            print(f"🔗 Analizando post (ID: {post_id})")
            print(f"-------------------------------------------------")
            
            json_url = f"https://www.reddit.com/r/SwitchSpines/comments/{post_id}.json"
            try:
                post_res = api_session.get(json_url, headers=headers, timeout=15)
                if post_res.status_code != 200:
                    print(f"⚠️ No se pudo consultar el detalle del post {post_id}")
                    continue

                post_data_json = post_res.json()
                post_data = post_data_json[0]['data']['children'][0]['data']

                if 'crosspost_parent_list' in post_data and post_data['crosspost_parent_list']:
                    post_data = post_data['crosspost_parent_list'][0]

                img_url = None
                if post_data.get('media_metadata'):
                    meta = post_data.get('media_metadata', {})
                    for k in sorted(meta.keys()):
                        if meta[k].get('e') == 'Image':
                            u = meta[k].get('s', {}).get('u') or meta[k].get('s', {}).get('gif')
                            if u:
                                img_url = u.replace('&amp;', '&')
                                break

                if not img_url:
                    try:
                        images = post_data.get('preview', {}).get('images', [])
                        if images:
                            img_url = images[0]['source']['url'].replace('&amp;', '&')
                    except Exception:
                        pass

                if not img_url:
                    candidate = post_data.get('url_overridden_by_dest') or post_data.get('url', '')
                    if candidate and 'reddit.com/r/' not in candidate:
                        if 'imgur.com/' in candidate and not any(ext in candidate.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp']):
                            img_id = candidate.rstrip('/').split('/')[-1]
                            candidate = f"https://i.imgur.com/{img_id}.png"
                        img_url = candidate

                if not img_url:
                    print("⚠️ Omitido: El post no contiene una imagen válida.")
                    continue

                img_res = img_session.get(img_url, timeout=10)
                if img_res.status_code != 200:
                    print("⚠️ No se pudo descargar la imagen desde la CDN.")
                    continue

                img = Image.open(BytesIO(img_res.content))

                # --- 🛡️ FILTRO ESTRICTO DE PROPORCIÓN DE SPINE ---
                # Evita que se cuelen fotos de colecciones, memes o imágenes cuadradas/horizontales
                if (img.height / img.width) < 2.6:
                    print(f"⚠️ Omitido: La imagen no tiene formato de spine (Proporción ancho/alto inválida: {img.width}x{img.height}).")
                    continue

                if img.height > 12000:
                    aspect = img.width / img.height
                    img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

                h = get_image_hash(img)
                if h in existing_hashes:
                    print("⚠️ Esta imagen ya existe (duplicada por hash).")
                    continue

                buffer = BytesIO()
                img.convert("RGBA").save(buffer, format="WEBP", quality=85)
                buffer.seek(0)

                local_dir = os.path.join(BASE_DIR, "public", "spines")
                os.makedirs(local_dir, exist_ok=True)
                local_filepath = os.path.join(local_dir, f"{post_id}.webp")
                
                with open(local_filepath, 'wb') as f:
                    f.write(buffer.getvalue())
                print(f"💾 Backup local guardado: {post_id}.webp")

                filename_b2 = f"spines/{post_id}.webp"
                s3_client.upload_fileobj(
                    buffer,
                    B2_BUCKET_NAME,
                    filename_b2,
                    ExtraArgs={'ContentType': 'image/webp'}
                )
                print(f"☁️ Subido a Backblaze B2: {post_id}.webp")

                prefix = B2_PUBLIC_URL_PREFIX or f"https://cdn.thespinearchive.xyz/file/{B2_BUCKET_NAME}"
                public_image_url = f"{prefix.rstrip('/')}/{filename_b2}"

                raw_author = post_data.get('author')
                author_name = f"u/{raw_author}" if raw_author and raw_author != "[deleted]" else "u/DeletedUser"

                new_entry = {
                    "id": post_id,
                    "title": clean_title(post_data['title']),
                    "author": author_name,
                    "src": f"/spines/{post_id}.webp",
                    "hash": h,
                    "image": public_image_url,
                    "created_utc": int(post_data.get('created_utc', time.time()))
                }

                existing_data.append(new_entry)
                existing_ids.add(post_id)
                existing_hashes.add(h)
                
                total_new += 1
                new_authors.append(author_name)
                save_db(existing_data)
                print(f"🎉 ¡ÉXITO! '{new_entry['title']}' añadido correctamente.")

                time.sleep(2)

            except Exception as e:
                print(f"❌ Error procesando el post ID {post_id}: {e}")
                continue

    except Exception as e:
        print(f"❌ Error al consultar el feed RSS: {e}")

    save_db(existing_data)
    print(f"\n✨ Proceso finalizado. {total_new} lomos nuevos añadidos correctamente.")

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