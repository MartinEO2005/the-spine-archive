import os
import json

# Esto le dice a Python: "Busca database.json en la misma carpeta donde está este script"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, 'database.json')

with open(DB_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    # Si el campo 'image' contiene 'cloudinary', lo borramos o lo reemplazamos
    if 'cloudinary' in item.get('image', ''):
        # Movemos la URL buena del 'src' al 'image' si la tenemos
        if 'cdn.thespinearchive.xyz' in item.get('src', ''):
            item['image'] = item['src']
            item['src'] = f"/spines/{item['id']}.webp" # Estandarizamos el local

# Guarda el archivo limpio
with open('api/database.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)