import json

# Mapeo de claves (Nombres de las etiquetas)
key_mapping = {
    "Plataforma": "Platform",
    "Color Base": "Base Color",
    "Tipografía del Título": "Title Typography",
    "Alineación del Texto": "Text Alignment",
    "Estilo Principal": "Main Style"
    # "Lower logo" y "Extras" ya están correctamente en inglés
}

# Mapeo de valores (Opciones de cada etiqueta)
value_mapping = {
    # Colores
    "Rojo": "Red",
    "Azul": "Blue",
    "Amarillo": "Yellow",
    "Verde": "Green",
    "Rosa": "Pink",
    "Naranja": "Orange",
    "Morado": "Purple",
    "Blanco": "White",
    "Negro": "Black",
    "Gris": "Gray",
    "Multicolor": "Multicolor", 
    
    # Tipografía
    "Texto Simple": "Simple Text",
    "Logo Original": "Original Logo",
    
    # Alineación
    "Centrado Arriba": "Top Centered",
    "Centrado Arriba con margen": "Top Centered with margin",
    "Centro": "Center",
    "Abajo": "Bottom",
    "Cubre todo (desde arriba)": "Cover all (from top)",
    "Cubre todo (centrado)": "Cover all (centered)",
    
    # Estilos
    "Minimalista": "Minimalist",
    "Escénico / Detallado": "Scenic / Detailed",
    "Maximalista (Kitsch)": "Maximalist (Kitsch)",
    
    # Extras (Array)
    "Estilo DNN": "DNN Style",
    "Personaje Abajo": "Character Bottom",
    "Personajes por todo el lomo": "Characters throughout the spine",
    "Set / Panorama": "Set / Panorama"
}

# 1. Cargar la base de datos
with open('C:\\Users\\MartinEO\\Desktop\\the-spine-archive\\mi-app-spines\\public\\database_ia_taggeada.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 2. Recorrer y traducir
for item in data:
    if "tags" in item:
        new_tags = {}
        for old_key, old_value in item["tags"].items():
            # Traducir la clave (si no está en el diccionario, mantiene la original)
            new_key = key_mapping.get(old_key, old_key)
            
            # Traducir los valores
            if isinstance(old_value, list):
                # Si es una lista (como 'Extras'), traduce cada elemento por separado
                new_value = [value_mapping.get(v, v) for v in old_value]
            else:
                # Si es un string normal, lo traduce directo
                new_value = value_mapping.get(old_value, old_value)
            
            new_tags[new_key] = new_value
        
        # Sobrescribir los tags viejos con los nuevos ya en inglés
        item["tags"] = new_tags

# 3. Guardar el archivo limpio
with open('database_ia_english.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("¡Migración a inglés completada con éxito, Martin!")