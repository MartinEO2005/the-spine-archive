import os
import json
from PIL import Image

# --- MI CONFIGURACIÓN ---
FOLDER = "public/covers"
JSON_FILE = "nombres_juegos.json"
TARGET_WIDTH = 350

def run_local_processor():
    if not os.path.exists(FOLDER):
        os.makedirs(FOLDER)

    # Cargo el JSON existente (si lo hay) para no borrar lo que ya tienes
    metadata = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            try:
                metadata = json.load(f)
            except json.JSONDecodeError:
                pass
    
    # Extraigo las rutas que ya existen para no duplicar datos
    existing_covers = [item.get("cover") for item in metadata if "cover" in item]
    processed_count = 0

    print("🕵️‍♂️ Buscando imágenes nuevas en la carpeta...")

    # Reviso cada archivo en la carpeta
    for filename in os.listdir(FOLDER):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            img_path = os.path.join(FOLDER, filename)
            
            # Limpio el nombre (ej: "Super Mario RPG.jpg" -> "super_mario_rpg")
            name_without_ext = os.path.splitext(filename)[0]
            clean_name = name_without_ext.lower().replace(" ", "_")
            webp_filename = f"{clean_name}.webp"
            webp_path = os.path.join(FOLDER, webp_filename)

            try:
                # Comprimo y redimensiono
                img = Image.open(img_path)
                if img.mode != "RGB":
                    img = img.convert("RGB")
                
                w_percent = (TARGET_WIDTH / float(img.size[0]))
                h_size = int((float(img.size[1]) * float(w_percent)))
                img = img.resize((TARGET_WIDTH, h_size), Image.Resampling.LANCZOS)
                
                img.save(webp_path, "WEBP", quality=80)
                
                # Borro el original (JPG/PNG) para mantener tu carpeta limpia
                os.remove(img_path)
                
                # Añado al JSON si es un archivo nuevo
                cover_path = f"/covers/{webp_filename}"
                if cover_path not in existing_covers:
                    metadata.append({
                        "name": name_without_ext.replace("_", " ").title(),
                        "system": "SFC",
                        "cover": cover_path,
                        "fact": "* Beep boop... I am a placeholder fact waiting to be replaced! *"
                    })
                
                print(f"✅ Convertido y comprimido: {filename} -> {webp_filename}")
                processed_count += 1
                
            except Exception as e:
                print(f"❌ Error procesando {filename}: {e}")

    # Guardo el JSON actualizado
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
    
    if processed_count == 0:
        print("🤷‍♂️ No se encontraron imágenes JPG/PNG nuevas para comprimir.")
    else:
        print(f"✨ ¡Listo! Se procesaron {processed_count} imágenes nuevas.")

if __name__ == "__main__":
    run_local_processor()