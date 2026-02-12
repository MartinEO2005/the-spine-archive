import os
import json
import shutil
from datetime import datetime

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_JSON_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "public", "database.json"))
IMAGES_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "public", "spines"))
LOG_FILE_PATH = os.path.join(BASE_DIR, "deleted_spines_log.txt")

def load_database():
    if not os.path.exists(DB_JSON_PATH):
        print(f"❌ Error: No se encontró el archivo {DB_JSON_PATH}")
        return None
    with open(DB_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_database(data):
    # Crear backup antes de guardar
    backup_path = f"{DB_JSON_PATH}.bak"
    shutil.copy2(DB_JSON_PATH, backup_path)
    
    with open(DB_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def log_deleted_items(items):
    with open(LOG_FILE_PATH, 'a', encoding='utf-8') as f:
        f.write(f"\n--- SESIÓN DE ELIMINACIÓN: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---\n")
        for item in items:
            log_line = f"ELIMINADO: [{item['id']}] - {item['title']} | Autor: {item['author']}\n"
            f.write(log_line)
        f.write("-" * 50 + "\n")

def delete_spines():
    data = load_database()
    if data is None: return

    print("--- 🗑️ ELIMINADOR CON REGISTRO Y BACKUP ---")
    query = input("🔍 Buscar lomo (ej: Construction): ").strip().lower()

    # Soporte para términos de búsqueda según tus preferencias (Mayus/Minus)
    matches = [
        item for item in data 
        if query in item['title'].lower() or query in item['author'].lower()
    ]

    if not matches:
        print(f"❌ No se encontraron resultados para: '{query}'")
        return

    print(f"\n✅ Se encontraron {len(matches)} lomos:")
    for i, item in enumerate(matches):
        print(f"  [{i}] ID: {item['id']} | {item['title']} | {item['author']}")

    choice = input("\n👉 Índices a borrar (ej: 0,1,2), 'all' o 'q': ").strip().lower()
    if choice == 'q': return
    
    indices = []
    if choice == 'all':
        indices = list(range(len(matches)))
    else:
        try:
            indices = [int(x.strip()) for x in choice.split(',')]
        except ValueError:
            print("❌ Error en el formato de números.")
            return

    targets = [matches[i] for i in indices if 0 <= i < len(matches)]
    
    if not targets:
        print("❌ Selección vacía.")
        return

    print(f"\n⚠️ Vas a borrar {len(targets)} lomos. Se guardará un registro en 'deleted_spines_log.txt'.")
    if input("¿Confirmar? (s/n): ").lower() == 's':
        ids_to_remove = [t['id'] for t in targets]
        
        # 1. Guardar en el Log
        log_deleted_items(targets)
        
        # 2. Actualizar JSON (con backup automático)
        new_data = [item for item in data if item['id'] not in ids_to_remove]
        save_database(new_data)
        
        # 3. Borrar archivos físicos
        for t in targets:
            file_path = os.path.join(IMAGES_DIR, f"{t['id']}.webp")
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"🗑️ Físico borrado: {t['id']}.webp")
            else:
                print(f"⚠️ Imagen no encontrada: {t['id']}.webp")

        print(f"\n✨ ¡Hecho! Revisa '{os.path.basename(LOG_FILE_PATH)}' para ver el historial.")

if __name__ == "__main__":
    delete_spines()