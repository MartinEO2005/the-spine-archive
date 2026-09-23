import json
import os
import time
import requests
from PIL import Image
from io import BytesIO
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Cargar variables de entorno buscando de forma inteligente en varias rutas posibles
current_dir = os.path.dirname(os.path.abspath(__file__))
possible_env_paths = [
    os.path.join(current_dir, '.env'),
    os.path.join(current_dir, '..', '.env'),
    os.path.join(current_dir, '..', '..', '.env')
]

env_loaded = False
for path in possible_env_paths:
    if os.path.exists(path):
        load_dotenv(dotenv_path=path)
        env_loaded = True
        break

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: No se encontró la GEMINI_API_KEY. Asegúrate de que el archivo .env existe y contiene GEMINI_API_KEY=tu_clave")
    exit(1)

client = genai.Client(api_key=api_key)

input_json_path = os.path.join(current_dir, '..', 'public', 'database.json')
output_json_path = os.path.join(current_dir, '..', 'public', 'database_ia_taggeada.json')

# Cargar progreso o iniciar desde cero
try:
    if os.path.exists(output_json_path):
        print("🔄 Archivo de progreso detectado. Retomando desde database_ia_taggeada.json...")
        with open(output_json_path, "r", encoding="utf-8") as f:
            database = json.load(f)
    else:
        print("🚀 Iniciando desde cero con database.json...")
        with open(input_json_path, "r", encoding="utf-8") as f:
            database = json.load(f)
except FileNotFoundError:
    print("❌ ERROR: No se encuentra el archivo JSON.")
    exit(1)

PROMPT = """
Analyze this image and the metadata of a Nintendo Switch game spine. You are a design expert. Return EXCLUSIVELY a valid JSON object with the following fields and exact allowed values:

- "Platform": "Switch 1" or "Switch 2".
- "Base Color": "Red", "Blue", "Yellow", "Green", "Pink", "Orange", "Purple", "White", "Black", "Gray", or "Multicolor".
- "Title Typography": "Simple Text" or "Original Logo".
- "Lower logo": "Nintendo" or "other".
- "Text Alignment":
    * "Top Centered": The text starts immediately below the top red banner, almost glued to it leaving very little space.
    * "Top Centered with margin": There is a clear, atmospheric, or decorative empty space visible between the Nintendo Switch red banner and the start of the title text, with an average margin of 60 to 100 pixels that allows displaying the background, sky, or characteristic color of the game before the main typography.
    * "Center": The text floats in the absolute middle of the spine, with plenty of free space above and below.
    * "Bottom": The text is grouped entirely in the bottom half of the spine.
    * "Cover all (from top)": The text is very long and occupies almost the entire vertical strip, starting from the top.
    * "Cover all (centered)": The text is long and occupies a large part of the spine, but leaves symmetrical margins at the top and bottom.
- "Main Style":
    * "Minimalist": The background behind the letters is solid, a simple gradient, or a subtle pattern. ATTENTION: If there are characters at the bottom but the central background where the text is located is clean, IT IS STILL Minimalist.
    * "Scenic / Detailed": The background features a complex illustration, a background scenario, or dense textures occupying the entire space.
    * "Maximalist (Kitsch)": The design is chaotic, overloaded, saturated with characters, colors, and logos everywhere with no room to breathe.
- "Extras": This is an array of strings (can be empty `[]` if there are no extras). Select ALL that apply from this list:
    * "DNN Style": Characterized by a PERFECT CIRCLE acting as a frame containing an icon or face, positioned RIGHT ABOVE the publisher's lower logo. 
      - LOCK RULE (MANDATORY): You can ONLY apply this tag if the 'Author/Creator' metadata contains one of these exact words: "DieNoMighty", "DieNomight9", "DNN", "Mii203", or rarely "eridyon". 
      - If the creator is NOT in that list, you are STRICTLY FORBIDDEN from using the "DNN Style" tag, regardless of any circle or logo you see in the image.
      - LOGO PROHIBITION: Even if the author matches, the circle must be an added decorative frame. DO NOT mark it if the circle IS the company's own logo (such as Aksys, Super Rare Games, Inti Creates, or CC2).
      - In the case of DNN style, it cannot have any other characters at the bottom of the spine, not even partially. If there is a character, even a small one, it is not DNN style. If it is DNN, it must not have any other extras.
    * "Character Bottom": There is an isolated character, face, or figure located at the bottom base of the spine that isolatedly forms the main detail of the design.
    * "Characters throughout the spine": There are multiple characters, faces, or figures distributed along the entire vertical strip.
    * "Set / Panorama": The spine art is cut at the edges because it's part of a larger mural meant to join with other boxes. It can also be a panorama if the game name has something like "set", "series", or parts 1, 2, 3, or "Vol. 1", "Vol. 2", etc.
- "hexColor": Analyze the 3 candidate colors provided in the metadata (Pixel 1, Pixel 2, or Pixel 3) and strictly return in hexadecimal format (e.g., #4C7497) the one that best matches the background or main color of the spine.
"""

coste_total_sesion = 0.0

config = types.GenerateContentConfig(
    response_mime_type="application/json",
    temperature=0.2
)

for i, game in enumerate(database):
    # Saltar solo si ya tiene TODO (incluyendo Extras y hexColor)
    if "tags" in game and all(k in game["tags"] for k in ["Platform", "Base Color", "Main Style", "Extras"]) and "hexColor" in game:
        continue

    raw_url = game.get("image") or game.get("imageUrl") or game.get("src") or game.get("url") or game.get("id")
    if not raw_url:
        continue

    if not raw_url.startswith("http"):
        raw_url = f"https://thespinearchive.xyz/{raw_url.lstrip('/')}"
        
    game_title = game.get("title", "Desconocido")
    game_author = game.get("author", "Desconocido")

    try:
        # --- Blindaje de descarga contra microcortes de red ---
        max_descarga_retries = 3
        response = None
        for attempt_dl in range(max_descarga_retries):
            try:
                response = requests.get(raw_url, timeout=10)
                if response.status_code == 200:
                    break
            except Exception as e_dl:
                if attempt_dl < max_descarga_retries - 1:
                    print(f"⚠️ Microcorte de red en imagen {i+1}. Reintentando en 3s...")
                    time.sleep(3)
                else:
                    raise e_dl
                    
        if not response or response.status_code != 200:
            print(f"❌ Error final descargando imagen {i+1}")
            continue
        
        img = Image.open(BytesIO(response.content))

        # --- Extracción de los 3 píxeles estratégicos ---
        width, height = img.size
        def get_hex_at(x_pct, y_pct):
            x = int(width * x_pct)
            y = int(height * y_pct)
            r, g, b = img.convert('RGB').getpixel((x, y))
            return f"#{r:02X}{g:02X}{b:02X}"

        c1 = get_hex_at(0.80, 0.18)
        c2 = get_hex_at(0.10, 0.50)
        c3 = get_hex_at(0.20, 0.80)

        max_retries = 4
        ai_response = None
        
        # Inyectamos los datos del JSON y los colores candidatos como texto de ayuda para la IA
        contexto_metadatos = f"GAME METADATA -> Title: {game_title} | Author/Creator: {game_author} | Extracted candidate colors: [Pixel 1: {c1}, Pixel 2: {c2}, Pixel 3: {c3}]"
        
        for attempt in range(max_retries):
            try:
                ai_response = client.models.generate_content(
                    model="gemini-3.5-flash-lite",
                    contents=[PROMPT, contexto_metadatos, img],
                    config=config
                )
                break 
            except Exception as api_err:
                err_msg = str(api_err)
                if ("503" in err_msg or "429" in err_msg) and attempt < max_retries - 1:
                    sleep_time = (attempt + 1) * 5
                    print(f"⏳ Servidor saturado/Sin saldo. Reintentando en {sleep_time} segundos... (Intento {attempt + 1}/{max_retries})")
                    time.sleep(sleep_time)
                else:
                    raise api_err

        if not ai_response:
            raise Exception("No se obtuvo respuesta de la API.")

        try:
            text_res = ai_response.text.strip()
        except ValueError:
            print(f"⚠️ Imagen {i+1} bloqueada por filtros de seguridad. Saltando...")
            continue

        if text_res.startswith("```json"):
            text_res = text_res[7:-3].strip()
        elif text_res.startswith("```"):
            text_res = text_res[3:-3].strip()

        parsed_data = json.loads(text_res)

        coste_img = 0.0
        if ai_response.usage_metadata:
            tokens_in = ai_response.usage_metadata.prompt_token_count
            tokens_out = ai_response.usage_metadata.candidates_token_count
            coste_img = (tokens_in / 1_000_000 * 0.30) + (tokens_out / 1_000_000 * 2.50)
            coste_total_sesion += coste_img

        game["tags"] = {
            "Platform": parsed_data.get("Platform", "Switch 1"),
            "Base Color": parsed_data.get("Base Color", "Black"),
            "Title Typography": parsed_data.get("Title Typography", "Simple Text"),
            "Text Alignment": parsed_data.get("Text Alignment", "Center"),
            "Main Style": parsed_data.get("Main Style", "Minimalist"),
            "Lower logo": parsed_data.get("Lower logo", "Nintendo"),
            "Extras": parsed_data.get("Extras", [])
        }

        # Guardamos el hexColor elegido por la IA al mismo nivel que "tags"
        game["hexColor"] = parsed_data.get("hexColor", c1)

        # Actualizado para mostrar el Color Base y el Hex en la terminal
        print(f"✅ [{i+1}/{len(database)}] {game.get('title', 'Desconocido')} | Color: {game['tags']['Base Color']} | Hex: {game['hexColor']} | Coste: ${coste_img:.6f}")

        if (i + 1) % 20 == 0:
            with open(output_json_path, "w", encoding="utf-8") as out:
                json.dump(database, out, indent=2, ensure_ascii=False)
            print("💾 Progreso intermedio guardado.")

        # Ajustado a 1.0s para aprovechar la cuenta de pago
        time.sleep(1.0)

    except json.JSONDecodeError:
        print(f"⚠️ Error procesando [{i+1}]: La IA no devolvió un JSON válido. Saltando...")
    except Exception as e:
        print(f"⚠️ Error procesando [{i+1}] ({raw_url}): {e}")
        time.sleep(2)

with open(output_json_path, "w", encoding="utf-8") as out:
    json.dump(database, out, indent=2, ensure_ascii=False)

print(f"🎉 ¡Proceso completado! Coste virtual total de esta sesión: ${coste_total_sesion:.4f}")