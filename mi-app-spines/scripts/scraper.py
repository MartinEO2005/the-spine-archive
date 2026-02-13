import os
import json
import signal
import sys
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# 1. CARGA DE SECRETOS
load_dotenv()

cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

# 2. RUTAS (Se ajustan solas a tu PC)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_JSON = os.path.join(BASE_DIR, "public", "database.json")
RUTA_FOTOS = os.path.join(BASE_DIR, "public", "spines")

# Variable global para guardar datos si cortamos el script
datos_globales = []
cambios_pendientes = False

def guardar_y_salir(signum, frame):
    """Esta función se activa si pulsas Ctrl+C"""
    print("\n\n🛑 ¡INTERRUPCIÓN DETECTADA! (Ctrl+C)")
    if cambios_pendientes:
        print("💾 Guardando progreso antes de cerrar...")
        with open(RUTA_JSON, 'w', encoding='utf-8') as f:
            json.dump(datos_globales, f, indent=2, ensure_ascii=False)
        print("✅ Progreso guardado. ¡Hasta luego!")
    else:
        print("👋 Cerrando sin cambios pendientes.")
    sys.exit(0)

# Activamos el detector de Ctrl+C
signal.signal(signal.SIGINT, guardar_y_salir)

def limpiar_titulo(nombre_archivo):
    """Solo se usa para libros NUEVOS que no tengan título"""
    return os.path.splitext(nombre_archivo)[0].replace('_', ' ').replace('-', ' ').title()

def ejecutar_cirugia():
    global datos_globales, cambios_pendientes
    
    print(f"📂 Leyendo base de datos actual: {RUTA_JSON}")
    
    # Cargar JSON existente (Si no existe, creamos lista vacía)
    if os.path.exists(RUTA_JSON):
        with open(RUTA_JSON, 'r', encoding='utf-8') as f:
            datos_globales = json.load(f)
    else:
        datos_globales = []

    # Crear un mapa para buscar rápido por ID (Evita duplicados)
    mapa_db = {item['id']: item for item in datos_globales}
    
    # Obtener fotos de la carpeta
    if not os.path.exists(RUTA_FOTOS):
        print(f"❌ ERROR: No encuentro la carpeta {RUTA_FOTOS}")
        return

    archivos_en_carpeta = [f for f in os.listdir(RUTA_FOTOS) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    print(f"🔍 Analizando {len(archivos_en_carpeta)} archivos en la carpeta...")

    contador_nuevos = 0
    contador_actualizados = 0
    contador_saltados = 0

    for archivo in archivos_en_carpeta:
        ruta_completa = os.path.join(RUTA_FOTOS, archivo)
        
        # CASO 1: El libro YA EXISTE en el JSON
        if archivo in mapa_db:
            entrada = mapa_db[archivo]
            
            # ¿Ya tiene link de Cloudinary?
            if "image" in entrada and "res.cloudinary.com" in entrada["image"]:
                print(f"⏩ Saltando (Ya tiene nube): {archivo}")
                contador_saltados += 1
                continue
            
            # Si no tiene link, lo subimos pero RESPETAMOS el resto
            print(f"🔄 Actualizando existente: {archivo} (Mantiene Autor: {entrada.get('author', 'N/A')})")
            try:
                res = cloudinary.uploader.upload(ruta_completa, folder="spines_archive")
                entrada['image'] = res['secure_url'] # Solo tocamos esto
                contador_actualizados += 1
                cambios_pendientes = True
            except Exception as e:
                print(f"❌ Error subiendo {archivo}: {e}")

        # CASO 2: El libro es NUEVO (No está en el JSON)
        else:
            print(f"✨ Encontrado NUEVO spine: {archivo}")
            try:
                res = cloudinary.uploader.upload(ruta_completa, folder="spines_archive")
                nueva_entrada = {
                    "id": archivo,
                    "title": limpiar_titulo(archivo),
                    "author": "Unknown", # Valor por defecto seguro
                    "image": res['secure_url']
                }
                datos_globales.append(nueva_entrada)
                # Actualizamos el mapa por si acaso
                mapa_db[archivo] = nueva_entrada
                contador_nuevos += 1
                cambios_pendientes = True
            except Exception as e:
                print(f"❌ Error subiendo {archivo}: {e}")

    # GUARDADO FINAL
    if cambios_pendientes:
        print("\n💾 Guardando todos los cambios en database.json...")
        with open(RUTA_JSON, 'w', encoding='utf-8') as f:
            json.dump(datos_globales, f, indent=2, ensure_ascii=False)
        print(f"✅ ¡TERMINADO!\n- Actualizados: {contador_actualizados}\n- Nuevos añadidos: {contador_nuevos}\n- Saltados (ya listos): {contador_saltados}")
    else:
        print("\n✅ Todo estaba al día. No se tocó el archivo.")

if __name__ == "__main__":
    ejecutar_cirugia()