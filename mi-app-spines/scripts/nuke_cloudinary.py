import os
import cloudinary
import cloudinary.api
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

def borrar_todo():
    # Pon aquí el nombre EXACTO de la carpeta que se creó en Cloudinary
    carpeta = "spines_archive" 
    
    print(f"⚠️  ATENCIÓN: Voy a borrar todas las imágenes de la carpeta '{carpeta}' en Cloudinary.")
    confirmacion = input("Escribe 'BORRAR' para confirmar: ")
    
    if confirmacion == "s":
        try:
            # Borra los recursos dentro de la carpeta
            print("💥 Borrando imágenes...")
            cloudinary.api.delete_resources_by_prefix(f"{carpeta}/", resource_type="image")
            
            # Borra la carpeta vacía (opcional)
            print("📁 Borrando carpeta...")
            cloudinary.api.delete_folder(carpeta)
            
            print("✅ Limpieza completada. Cloudinary está limpio.")
        except Exception as e:
            print(f"❌ Error: {e}")
    else:
        print("Operación cancelada.")

if __name__ == "__main__":
    borrar_todo()