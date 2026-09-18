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
Analiza esta imagen de un lomo de videojuego de Nintendo Switch. Eres un experto en diseño. Devuelve EXCLUSIVAMENTE un objeto JSON válido con los siguientes campos y valores exactos permitidos:

- "Plataforma": "Switch 1" o "Switch 2".
- "Color Base": "Rojo", "Azul", "Amarillo", "Verde", "Rosa", "Naranja", "Morado", "Blanco", "Negro", "Gris" o "Multicolor".
- "Tipografía del Título": "Texto Simple" o "Logo Original".
- "Lower logo": "Nintendo" o "other".
- "Alineación del Texto":
    * "Centrado Arriba": El texto empieza inmediatamente debajo del banner rojo superior, pegado a él sin dejar hueco.
    * "Centrado Arriba con margen": Hay un espacio vacío o decorativo claramente visible entre el banner rojo y el inicio del texto.
    * "Centro": El texto flota en la mitad absoluta del lomo, con bastante espacio libre arriba y abajo.
    * "Abajo": El texto está agrupado íntegramente en la mitad inferior del lomo.
    * "Cubre todo (desde arriba)": El texto es muy largo y ocupa casi toda la franja vertical, empezando desde arriba.
    * "Cubre todo (centrado)": El texto es largo y ocupa gran parte del lomo, pero deja márgenes simétricos arriba y abajo.
- "Estilo Principal":
    * "Minimalista": El fondo detrás de las letras es liso, un degradado simple o un patrón sutil. ATENCIÓN: Si hay personajes en la parte inferior pero el fondo central donde está el texto es limpio, SIGUE SIENDO Minimalista.
    * "Escénico / Detallado": El fondo tiene una ilustración compleja, un escenario de fondo o texturas densas que ocupan todo el espacio.
    * "Maximalista (Kitsch)": El diseño es caótico, recargado, saturado de personajes, colores y logotipos por todos lados sin espacio para respirar.
- "Extras": Esto es un ARRAY de strings (puede estar vacío `[]` si no tiene extras). Selecciona TODAS las que apliquen de esta lista:
    * "Estilo DNN": El lomo pertenece a este estilo característico que incluye un círculo inferior con un icono o miniatura de personaje situado justo encima del logotipo del fondo.
    * "Personaje Abajo": Hay un personaje, rostro o figura aislada ubicada en la base inferior del lomo.
    * "Personajes por todo el lomo": Hay múltiples personajes, caras o figuras distribuidas a lo largo de toda la franja vertical.
    * "Set / Panorama": El arte del lomo está cortado en los bordes porque forma parte de un mural más grande pensado para unirse con otras cajas.
"""

coste_total_sesion = 0.0

config = types.GenerateContentConfig(
    response_mime_type="application/json",
    temperature=0.2
)

for i, game in enumerate(database):
    # Saltar solo si ya tiene TODO (incluyendo Extras)
    if "tags" in game and all(k in game["tags"] for k in ["Plataforma", "Color Base", "Estilo Principal", "Extras"]):
        continue

    raw_url = game.get("image") or game.get("imageUrl") or game.get("src") or game.get("url") or game.get("id")
    if not raw_url:
        continue

    if not raw_url.startswith("http"):
        raw_url = f"https://thespinearchive.xyz/{raw_url.lstrip('/')}"

    try:
        response = requests.get(raw_url, timeout=10)
        if response.status_code != 200:
            print(f"❌ Error descargando imagen {i}")
            continue
        
        img = Image.open(BytesIO(response.content))

        max_retries = 4
        ai_response = None
        
        for attempt in range(max_retries):
            try:
                ai_response = client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=[PROMPT, img],
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
            coste_img = (tokens_in / 1_000_000 * 0.075) + (tokens_out / 1_000_000 * 0.30)
            coste_total_sesion += coste_img

        game["tags"] = {
            "Plataforma": parsed_data.get("Plataforma", "Switch 1"),
            "Color Base": parsed_data.get("Color Base", "Negro"),
            "Tipografía del Título": parsed_data.get("Tipografía del Título", "Texto Simple"),
            "Alineación del Texto": parsed_data.get("Alineación del Texto", "Centro"),
            "Estilo Principal": parsed_data.get("Estilo Principal", "Minimalista"),
            "Lower logo": parsed_data.get("Lower logo", "Nintendo"),
            "Extras": parsed_data.get("Extras", [])
        }

        print(f"✅ [{i+1}/{len(database)}] {game.get('title', 'Desconocido')} | Extras: {game['tags']['Extras']} | Coste: ${coste_img:.6f}")

        if (i + 1) % 20 == 0:
            with open(output_json_path, "w", encoding="utf-8") as out:
                json.dump(database, out, indent=2, ensure_ascii=False)
            print("💾 Progreso intermedio guardado.")

        time.sleep(1)

    except json.JSONDecodeError:
        print(f"⚠️ Error procesando [{i+1}]: La IA no devolvió un JSON válido. Saltando...")
    except Exception as e:
        print(f"⚠️ Error procesando [{i+1}] ({raw_url}): {e}")
        time.sleep(2)

with open(output_json_path, "w", encoding="utf-8") as out:
    json.dump(database, out, indent=2, ensure_ascii=False)

print(f"🎉 ¡Proceso completado! Coste total de esta sesión: ${coste_total_sesion:.4f}")