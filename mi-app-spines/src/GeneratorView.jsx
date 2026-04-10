import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd'; // LIBRERÍA PARA ARRASTRAR Y REDIMENSIONAR
import { nanoid } from 'nanoid'; // LIBRERÍA PARA GENERAR IDS ÚNICOS

// Estilos comunes para los inputs y selectores
const inputStyle = {
  width: '100%',
  padding: '12px',
  background: '#333',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '6px',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const sectionStyle = {
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#2a2a2a',
  borderRadius: '8px',
  border: '1px solid #444'
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const canvasRef = useRef(null); // Referencia al lienzo para exportación

  // ESTADOS DE LA CAPA DE FONDO (CAPA 0)
  const [bgColor, setBgColor] = useState('#1a1a1a');
  const [bgImage, setBgImage] = useState(null);

  // ESTADO DE LA CAPA DE ASSETS (MÚLTIPLES IMÁGENES, CAPA 1-N)
  // Cada asset es: { id, url, x, y, width, height, zIndex }
  const [assets, setAssets] = useState([]); 

  // --- MANEJO DE IMÁGENES ---

  // Subir imagen de fondo
  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) setBgImage(URL.createObjectURL(file));
  };

  // Subir un asset (personaje, logo)
  const handleAssetUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newAsset = {
        id: nanoid(), // ID único
        url: URL.createObjectURL(file),
        x: 10, // Posición inicial
        y: 200, 
        width: 100, // Tamaño inicial
        height: 100,
        zIndex: assets.length + 1 // El más nuevo va arriba
      };
      setAssets([...assets, newAsset]); 
    }
  };

  // --- GESTIÓN DE CAPAS (BRING TO FRONT / SEND TO BACK) ---

  // Función para reordenar la lista de assets y actualizar sus zIndex
  const reorderAssets = (idToMove, action) => {
    const currentIndex = assets.findIndex(asset => asset.id === idToMove);
    if (currentIndex === -1) return;

    let newIndex;
    if (action === 'up') {
      newIndex = Math.min(currentIndex + 1, assets.length - 1); // Subir en la lista (traer adelante)
    } else if (action === 'down') {
      newIndex = Math.max(currentIndex - 1, 0); // Bajar en la lista (enviar atrás)
    } else {
      return;
    }

    if (newIndex === currentIndex) return;

    const reorderedAssets = [...assets];
    const [movedAsset] = reorderedAssets.splice(currentIndex, 1); // Quitar el asset
    reorderedAssets.splice(newIndex, 0, movedAsset); // Insertarlo en la nueva posición

    // Actualizar los zIndex basados en el nuevo orden de la lista
    const updatedAssets = reorderedAssets.map((asset, index) => ({
      ...asset,
      zIndex: index + 1 // El orden de la lista define el zIndex
    }));

    setAssets(updatedAssets);
  };

  // Función para borrar un asset
  const removeAsset = (idToRemove) => {
    setAssets(assets.filter(asset => asset.id !== idToRemove));
  };

  // --- EXPORTACIÓN A IMAGEN ---
  const handleDownload = () => {
    alert("This function is not implemented in this demo. It requires advanced Canvas API or a third-party library to merge layers into a single image.");
  };

  return (
    <div style={{ color: 'white', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #b30000', paddingBottom: '15px', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>🛠️ SPINE STUDIO (BETA)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ ...inputStyle, width: '150px' }}>
            <option value="switch1">Switch 1</option>
            <option value="switch2">Switch 2</option>
          </select>
          <button onClick={handleDownload} style={{ padding: '12px 25px', background: '#b30000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            📥 DOWNLOAD SPINE
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* --- PANEL IZQUIERDO: HERRAMIENTAS Y CAPAS --- */}
        <div style={{ flex: '0 0 350px', backgroundColor: '#222', padding: '25px', borderRadius: '12px', border: '1px solid #444', boxSizing: 'border-box' }}>
          
          {/* SECCIÓN 1: FONDO */}
          <div style={sectionStyle}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#ccc', fontSize: '12px', textTransform: 'uppercase' }}>1. Background (Solid Color / Image)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '45px', height: '45px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} placeholder="#1a1a1a" />
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888' }}>Upload an image to use as background (covers solid color).</p>
            <input type="file" accept="image/*" onChange={handleBackgroundUpload} style={inputStyle} />
            {bgImage && (
               <button onClick={() => setBgImage(null)} style={{ marginTop: '8px', background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Remove Background Image</button>
            )}
          </div>

          {/* SECCIÓN 2: ASSETS (AÑADIR) */}
          <div style={sectionStyle}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#ccc', fontSize: '12px', textTransform: 'uppercase' }}>2. Add Assets (Logos, Characters...)</label>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#888' }}>PNG with transparency is recommended for clean layering.</p>
            <input type="file" accept="image/*" onChange={handleAssetUpload} style={inputStyle} />
          </div>

          {/* SECCIÓN 3: GESTIÓN DE CAPAS (LAYERS) */}
          {assets.length > 0 && (
            <div style={sectionStyle}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#ccc', fontSize: '12px', textTransform: 'uppercase' }}>3. Layer Manager (Stack Order)</label>
              <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px' }}>
                {assets.map((asset, index) => (
                    <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '10px 15px', borderRadius: '6px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#aaa', width: '20px' }}>#{index + 1}</span>
                        <img src={asset.url} alt="Asset" style={{ width: '25px', height: '25px', objectFit: 'contain', background: '#333', borderRadius: '4px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => reorderAssets(asset.id, 'down')} title="Send Backward" style={{ background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px' }}>▼</button>
                        <button onClick={() => reorderAssets(asset.id, 'up')} title="Bring Forward" style={{ background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px' }}>▲</button>
                        <button onClick={() => removeAsset(asset.id)} title="Remove" style={{ background: '#b30000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px' }}>X</button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- PANEL DERECHO: LIENZO (CANVAS) CON DIMENSIONES CORRECTAS --- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#888', textTransform: 'uppercase', fontSize: '12px' }}>Spine Live Preview</h3>
          
          {/* EL LIENZO - Dimensiones corregidas y relación de aspecto real (~1:11.36) */}
          <div ref={canvasRef} style={{ 
            position: 'relative', 
            // Dimensiones fijas basadas en la relación de aspecto de un lomo de Switch real.
            width: '60px', 
            height: '682px', 
            // CAPA 0: Color de fondo y/o Imagen de fondo
            backgroundColor: bgColor,
            backgroundImage: bgImage ? `url(${bgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid #555',
            borderRadius: '2px', // Pequeño redondeo para un look físico
            boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden' // Esconde lo que se salga de los bordes
          }}>
            
            {/* CAPA 1-N: ASSETS ARRASTRABLES Y REDIMENSIONABLES */}
            {assets.map((asset) => (
              <Rnd
                key={asset.id}
                default={{ x: asset.x, y: asset.y, width: asset.width, height: asset.height }}
                bounds="parent" // Mantiene la imagen dentro de los límites del lomo
                style={{ zIndex: asset.zIndex }}
                onDragStop={(e, d) => {
                    setAssets(assets.map(a => a.id === asset.id ? { ...a, x: d.x, y: d.y } : a));
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                    setAssets(assets.map(a => a.id === asset.id ? { ...a, width: ref.style.width, height: ref.style.height, ...position } : a));
                }}
              >
                <img 
                  src={asset.url} 
                  alt="Asset" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} 
                />
              </Rnd>
            ))}

            {/* CAPA FINAL: LA PLANTILLA OFICIAL (El marco con el centro transparente) */}
            <img 
              src={`/${template}-template.png`} 
              alt="Spine Template" 
              style={{ 
                position: 'absolute', 
                top: 0, left: 0, width: '100%', height: '100%', 
                // El zIndex de la plantilla debe ser mayor que el de cualquier asset
                zIndex: 1000, 
                pointerEvents: 'none' // Evita que la plantilla bloquee los clics a las imágenes de abajo
              }} 
            />
          </div>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>Actual aspect ratio: ~1:11.36</p>
        </div>

      </div>
    </div>
  );
};

export default GeneratorView;