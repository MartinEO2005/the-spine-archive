"""
scraper_custom.py — Igual que scraper.py, pero para r/CustomGameSpines
=====================================================================
- Backblaze B2: mismo bucket, carpeta  custom/{id}.webp   (Switch sigue en spines/)
- Backup local: mi-app-spines/custom_spines/{id}.webp
- Base de datos: public/database_custom.json   (+ public/scrape_info_custom.json)
- Detecta la consola por el título:  "(PS5)", "[3DS]", "PS4 & PS5"...
- Las galerías (varios lomos en un post) se guardan como {id}_1, {id}_2...

Requiere en el .env (además de las variables B2 que ya usas):
    SCRAPECREATORS_API_KEY=...
    REDDIT_SESSION=...        (la misma cookie que tienes en scraper.py; necesaria para las galerías)
"""

import os
import re
import sys
import json
import time
import hashlib
from io import BytesIO

import boto3
import requests as normal_requests
from curl_cffi import requests as curl_requests
from PIL import Image
from dotenv import load_dotenv

load_dotenv(override=True)

# --- CONFIGURACIÓN B2 (las mismas variables que scraper.py) ---
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('B2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('B2_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('B2_SECRET_KEY')
)
B2_BUCKET_NAME = os.getenv('B2_BUCKET_NAME')
B2_PUBLIC_URL_PREFIX = os.getenv('B2_PUBLIC_URL_PREFIX', '').strip()
B2_FOLDER = "custom"                                   # <- carpeta distinta a la de Switch

# --- RUTAS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # mi-app-spines/
DB_JSON_PATH = os.path.join(BASE_DIR, "public", "database_custom.json")
SCRAPE_INFO_PATH = os.path.join(BASE_DIR, "public", "scrape_info_custom.json")
LOCAL_BACKUP_DIR = os.path.join(BASE_DIR, "custom_spines")

SUBREDDIT = "CustomGameSpines"
API_KEY = os.getenv("SCRAPECREATORS_API_KEY", "").strip()
REDDIT_SESSION = os.getenv("REDDIT_SESSION", "").strip()
MAX_PAGES = 8                    # 25 posts por página
MIN_SPINE_RATIO = 2.6            # mismo filtro que scraper.py
SKIP_FLAIRS = {"request", "discussion"}

# --- DETECCIÓN DE CONSOLA POR TÍTULO (el orden importa) ---
CONSOLE_PATTERNS = [
    ("PS5",          r"\bps\s?5\b|playstation\s?5"),
    ("PS4",          r"\bps\s?4\b|playstation\s?4"),
    ("PS3",          r"\bps\s?3\b|playstation\s?3"),
    ("PS2",          r"\bps\s?2\b|playstation\s?2"),
    ("PS1",          r"\bps\s?1\b|\bpsx\b|\bps\s?one\b|playstation\s?1\b"),
    ("PS Vita",      r"\bps\s?vita\b|\bvita\b"),
    ("PSP",          r"\bpsp\b"),
    ("Xbox Series",  r"xbox\s?series|\bxs[xs]\b|\bseries\s?[xs]\b"),
    ("Xbox One",     r"xbox\s?one|\bxb\s?1\b|\bxbo\b"),
    ("Xbox 360",     r"xbox\s?360|\bx360\b"),
    ("Xbox",         r"\bog\s?xbox\b|\bxbox\b(?!\s?(?:one|series|360))"),
    ("Wii U",        r"\bwii\s?u\b"),
    ("Wii",          r"\bwii\b(?!\s?u\b)"),
    ("GameCube",     r"game\s?cube|\bgcn\b|\bngc\b"),
    ("3DS",          r"\b(?:new\s?)?[23]ds(?:\s?xl)?\b"),
    ("DS",           r"\bn?dsi?\b"),
]
SWITCH_PATTERN = r"\bswitch\b|\bnsw?\b"

# Consola -> tipo de caja (lo usará PrinterView para las medidas)
CONSOLE_TO_FORMAT = {
    "PS5": "ps", "PS4": "ps", "PS3": "ps",
    "Xbox Series": "xbox-modern", "Xbox One": "xbox-modern",
    "Xbox 360": "dvd", "PS2": "dvd", "Wii": "dvd",
    "Xbox": "xbox-og", "Wii U": "wiiu", "GameCube": "gamecube",
    "3DS": "ds", "DS": "ds", "PS1": "jewel", "PS Vita": "vita", "PSP": "umd",
}

# --- SESIONES (igual que scraper.py) ---
api_session = curl_requests.Session(impersonate="chrome131")
if REDDIT_SESSION:
    api_session.cookies.update({'reddit_session': REDDIT_SESSION})

img_session = normal_requests.Session()
img_session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
})


def detect_consoles(title):
    t = (title or "").lower().replace("&amp;", "&")
    return [name for name, pattern in CONSOLE_PATTERNS if re.search(pattern, t)]


def clean_title(title):
    """Quita [etiquetas], (consola), 'by autor' y la palabra 'spine(s)'."""
    t = (title or "").replace('&amp;', '&')
    t = re.sub(r'\[.*?\]', '', t)
    t = re.sub(r'\((?:[^)]*?(?:ps\s?\d|playstation|xbox|wii|3ds|\bds\b|nintendo|gamecube|vita|psp|italian|spanish|usa|europe|european)[^)]*)\)', '', t, flags=re.I)
    t = re.sub(r'\s+by\s+\S+\s*$', '', t, flags=re.I)
    for _, pattern in CONSOLE_PATTERNS:
        t = re.sub(pattern, '', t, flags=re.I)
    t = re.sub(r'\b(?:nintendo|new)\s*$', '', t.strip(), flags=re.I)
    t = re.sub(r'\bspines?\b', '', t, flags=re.I)
    t = re.sub(r'\s{2,}', ' ', t).strip(" -–|&/")
    return t or (title or '').strip()


def get_image_hash(img):
    img_small = img.convert("L").resize((16, 16), Image.Resampling.LANCZOS)
    return hashlib.md5(img_small.tobytes()).hexdigest()


def save_db(data):
    try:
        temp_path = DB_JSON_PATH + ".tmp"
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        if os.path.getsize(temp_path) > 0:
            if os.path.exists(DB_JSON_PATH):
                os.remove(DB_JSON_PATH)
            os.rename(temp_path, DB_JSON_PATH)
    except Exception as e:
        print(f"❌ ERROR CRÍTICO AL GUARDAR database_custom.json: {e}")


def load_db():
    if not os.path.exists(DB_JSON_PATH):
        return []
    try:
        with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print("⚠️ database_custom.json tenía error de formato. Iniciando limpio.")
        return []


# --- IMÁGENES DE UN POST ---
def fetch_full_post(post_id):
    """Post completo desde Reddit (ScrapeCreators no trae las imágenes de las galerías)."""
    url = f"https://www.reddit.com/r/{SUBREDDIT}/comments/{post_id}.json"
    try:
        res = api_session.get(url, timeout=15)
        if res.status_code == 429:
            print("⏳ Rate limit de Reddit (429). Esperando 15 segundos...")
            time.sleep(15)
            res = api_session.get(url, timeout=15)
        if res.status_code != 200:
            print(f"⚠️ Reddit respondió HTTP {res.status_code} para la galería {post_id}")
            return None
        post = res.json()[0]['data']['children'][0]['data']
        if post.get('crosspost_parent_list'):
            post = post['crosspost_parent_list'][0]
        return post
    except Exception as e:
        print(f"⚠️ No se pudo leer el post {post_id}: {e}")
        return None


def get_image_urls(p):
    """Lista de URLs de imagen del post (varias si es galería)."""
    is_gallery = p.get('post_hint') == 'gallery' or '/gallery/' in (p.get('url') or '') or p.get('is_gallery')
    if is_gallery and not p.get('media_metadata'):
        p = fetch_full_post(p.get('id')) or {}

    meta = p.get('media_metadata') or {}
    if meta:
        order = [i.get('media_id') for i in (p.get('gallery_data') or {}).get('items', [])] or sorted(meta.keys())
        urls = []
        for mid in order:
            m = meta.get(mid, {})
            if m.get('e') == 'Image':
                ext = (m.get('m') or 'image/png').split('/')[-1].replace('jpeg', 'jpg')
                urls.append(f"https://i.redd.it/{mid}.{ext}")
        if urls:
            return urls

    try:
        images = p.get('preview', {}).get('images', [])
        if images:
            return [images[0]['source']['url'].replace('&amp;', '&')]
    except Exception:
        pass

    candidate = p.get('url_overridden_by_dest') or p.get('url', '')
    if candidate and 'reddit.com/' not in candidate:
        if 'imgur.com/' in candidate and not any(ext in candidate.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp']):
            candidate = f"https://i.imgur.com/{candidate.rstrip('/').split('/')[-1]}.png"
        return [candidate]
    return []


# --- PROCESAR UN POST COMPLETO (todas sus imágenes) ---
def process_post(p, existing_ids, existing_hashes, existing_data):
    """Devuelve la lista de entradas nuevas añadidas para este post."""
    post_id = str(p.get('id', ''))
    title = p.get('title', '')
    flair = (p.get('link_flair_text') or '').strip().lower()

    if flair in SKIP_FLAIRS:
        print(f"⏭️  Omitido ({flair}): {title[:70]}")
        return []

    consoles = detect_consoles(title)
    if not consoles and re.search(SWITCH_PATTERN, title.lower()):
        print(f"⏭️  Omitido (Switch, va al catálogo principal): {title[:70]}")
        return []

    urls = get_image_urls(p)
    if not urls:
        print(f"⚠️ Sin imagen: {title[:70]}")
        return []

    raw_author = p.get('author')
    author_name = f"u/{raw_author}" if raw_author and raw_author != "[deleted]" else "u/DeletedUser"
    added = []

    for idx, img_url in enumerate(urls, 1):
        u_id = post_id if len(urls) == 1 else f"{post_id}_{idx}"
        if u_id in existing_ids:
            continue
        try:
            img_res = img_session.get(img_url, timeout=15)
            if img_res.status_code != 200:
                print(f"⚠️ No se pudo descargar la imagen {idx}/{len(urls)} de: {title[:60]}")
                continue
            img = Image.open(BytesIO(img_res.content))

            # Lomos en horizontal -> se giran a vertical
            if img.width > img.height:
                img = img.rotate(90, expand=True)

            ratio = img.height / img.width
            if ratio < MIN_SPINE_RATIO:
                print(f"⚠️ Omitido: no tiene formato de spine ({img.width}x{img.height}): {title[:60]}")
                continue

            if img.height > 12000:
                aspect = img.width / img.height
                img = img.resize((int(8000 * aspect), 8000), Image.Resampling.LANCZOS)

            h = get_image_hash(img)
            if h in existing_hashes:
                print("⚠️ Imagen duplicada (mismo hash).")
                continue

            buffer = BytesIO()
            img.convert("RGBA").save(buffer, format="WEBP", quality=85)
            buffer.seek(0)

            # Backup local
            os.makedirs(LOCAL_BACKUP_DIR, exist_ok=True)
            with open(os.path.join(LOCAL_BACKUP_DIR, f"{u_id}.webp"), 'wb') as f:
                f.write(buffer.getvalue())

            # Backblaze B2 -> carpeta custom/
            filename_b2 = f"{B2_FOLDER}/{u_id}.webp"
            s3_client.upload_fileobj(buffer, B2_BUCKET_NAME, filename_b2, ExtraArgs={'ContentType': 'image/webp'})
            prefix = B2_PUBLIC_URL_PREFIX or f"https://cdn.thespinearchive.xyz/file/{B2_BUCKET_NAME}"
            public_image_url = f"{prefix.rstrip('/')}/{filename_b2}"

            entry = {
                "id": u_id,
                "title": clean_title(title),
                "raw_title": title,
                "author": author_name,
                "consoles": consoles or ["Other"],
                "format": CONSOLE_TO_FORMAT.get(consoles[0], "") if consoles else "",
                "src": public_image_url,
                "hash": h,
                "image": public_image_url,
                "created_utc": int(p.get('created_utc', time.time()))
            }
            existing_data.append(entry)
            existing_ids.add(u_id)
            existing_hashes.add(h)
            added.append(entry)
            save_db(existing_data)
            tag = f" [{idx}/{len(urls)}]" if len(urls) > 1 else ""
            print(f"🎉 '{entry['title']}' ({'/'.join(entry['consoles'])}){tag} añadido.")
            time.sleep(1)
        except Exception as e:
            print(f"❌ Error procesando {u_id}: {e}")
    return added


# --- OPCIÓN 1: ACTUALIZACIÓN GENERAL (posts recientes) ---
def update_database():
    if not API_KEY:
        print("❌ Falta SCRAPECREATORS_API_KEY en el .env")
        sys.exit(1)

    existing_data = load_db()
    existing_ids = {item['id'] for item in existing_data}
    existing_hashes = {item['hash'] for item in existing_data if 'hash' in item}
    print(f"\n🚀 Actualizando r/{SUBREDDIT} -> B2 {B2_BUCKET_NAME}/{B2_FOLDER}/")
    print(f"📊 database_custom.json actual: {len(existing_data)} entradas.")

    new_entries, after = [], None
    for page in range(MAX_PAGES):
        params = {"subreddit": SUBREDDIT, "sort": "new"}
        if after:
            params["after"] = after
        res = normal_requests.get("https://api.scrapecreators.com/v1/reddit/subreddit",
                                  headers={"x-api-key": API_KEY}, params=params, timeout=30)
        if res.status_code != 200:
            print(f"❌ HTTP {res.status_code} en ScrapeCreators.")
            break
        data = res.json()
        posts = data.get("posts") or data.get("data", {}).get("children", [])
        print(f"\n📄 Página {page + 1}: {len(posts)} posts")
        page_had_new = False
        for post in posts:
            p = post.get('data', post)
            pid = str(p.get('id', ''))
            # Ya archivado (post simple o cualquier imagen de una galería)
            if pid in existing_ids or f"{pid}_1" in existing_ids:
                continue
            page_had_new = True
            new_entries += process_post(p, existing_ids, existing_hashes, existing_data)
        new_after = data.get("after")
        # Si una página entera ya estaba archivada, paramos (ya estamos al día)
        if not new_after or new_after == after or (not page_had_new and existing_data):
            break
        after = new_after
        time.sleep(1)

    save_db(existing_data)
    print(f"\n✨ Proceso finalizado. {len(new_entries)} lomos nuevos añadidos.")

    if new_entries:
        info = {
            "count": len(new_entries),
            "date": time.strftime("%Y-%m-%d %H:%M"),
            "authors": sorted({e['author'] for e in new_entries})
        }
        with open(SCRAPE_INFO_PATH, 'w', encoding='utf-8') as f:
            json.dump(info, f, indent=2, ensure_ascii=False)
        print(f"💾 scrape_info_custom.json actualizado.")


# --- OPCIÓN 2: FORZAR UN POST CONCRETO ---
def process_single_post(post_url_or_id):
    if '/s/' in post_url_or_id:
        try:
            post_url_or_id = normal_requests.get(post_url_or_id, headers=img_session.headers, allow_redirects=True, timeout=10).url
        except Exception as e:
            print(f"❌ Error al resolver el enlace corto: {e}")
            return
    match = re.search(r'comments/([a-z0-9]+)', post_url_or_id)
    post_id = match.group(1) if match else post_url_or_id.strip()
    p = fetch_full_post(post_id)
    if not p:
        print("❌ No se pudo obtener el post.")
        return
    existing_data = load_db()
    added = process_post(p, {i['id'] for i in existing_data}, {i['hash'] for i in existing_data if 'hash' in i}, existing_data)
    print(f"✨ {len(added)} lomos añadidos desde este post.")


if __name__ == "__main__":
    print("\n=============================================")
    print("📋 SCRAPER r/CustomGameSpines")
    print("=============================================")
    print("1. Actualizar con los posts recientes")
    print("2. Forzar scraping de un post específico por URL/ID")
    opcion = input("\nSelecciona una opción (1 o 2, por defecto 1): ").strip()
    if opcion == "2":
        target = input("Pega la URL o ID del post de Reddit: ").strip()
        if target:
            process_single_post(target)
    else:
        update_database()