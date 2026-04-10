import React, { useState } from 'react';
import { Rnd } from 'react-rnd'; // IMPORTAMOS LA LIBRERÍA DE ARRASTRAR

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  
  // CAPA 1 (Fondo)
  const [bgColor, setBgColor] = useState('#1a1a1a');
  const [bgImage, setBgImage] = useState(null);

  // CAPA 2 (Assets)
  const [assets, setAssets] = useState([]); 

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) setBgImage(URL.createObjectURL(file));
  };

  const handleAssetUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newAsset = {
        id: Date.now(),
        url: URL.createObjectURL(file),
        // Posición y tamaño inicial por defecto
        x: 10, 
        y: 200, 
        width: 100, 
        height: 100
      };
      setAssets([...assets, newAsset]); 
    }
  };

  const removeAsset = (idToRemove) => {
    setAssets(assets.filter(asset => asset.id !== idToRemove));
  };

  return (
    <div style={{ color: 'white', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ borderBottom: '2px solid #b30000', paddingBottom: '15px', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>🛠️ SPINE STUDIO (BETA)</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
          Upload your background, add characters and logos, and build your spine.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* PANEL IZQUIERDO: CONTROLES */}
        <div style={{ flex: 1, backgroundColor: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00' }}>1. Select Target</label>
            <select value={template} onChange={e => setTemplate(e.target.value)} style={{ width: '100%', padding: '10px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}>
              <option value="switch1">Nintendo Switch (Original)</option>
              <option value="switch2">Nintendo Switch 2 (Rumored)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '4px', borderLeft: '4px solid #b30000' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'white' }}>2. Background (Layer 1)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Solid Color</span>
            </div>
            <input type="file" accept="image/*" onChange={handleBackgroundUpload} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontSize: '0.8rem' }} />
            {bgImage && (
               <button onClick={() => setBgImage(null)} style={{ marginTop: '5px', background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Remove Background Image</button>
            )}
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '4px', borderLeft: '4px solid #00ccff' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'white' }}>3. Add Assets (Layer 2)</label>
            <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 0 }}>Add logos, characters, or text images (PNG with transparency).</p>
            <input type="file" accept="image/*" onChange={handleAssetUpload} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '10px' }} />
            
            {assets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {assets.map((asset, index) => (
                  <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '5px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Asset {index + 1}</span>
                    <button onClick={() => removeAsset(asset.id)} style={{ background: '#b30000', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>X</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button style={{ flex: 1, padding: '12px', background: '#b30000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              📥 DOWNLOAD SPINE
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: PREVISUALIZACIÓN EN VIVO */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ccc' }}>Live Preview</h3>
          
          <div style={{ 
            position: 'relative', 
            width: '120px', 
            height: '500px', 
            backgroundColor: bgColor,
            backgroundImage: bgImage ? `url(${bgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid #555',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            overflow: 'hidden' // Esconde lo que se salga de los bordes
          }}>
            
            {/* CAPA 2: ASSETS ARRASTRABLES */}
            {assets.map((asset) => (
              <Rnd
                key={asset.id}
                default={{
                  x: asset.x,
                  y: asset.y,
                  width: asset.width,
                  height: asset.height,
                }}
                bounds="parent" // Mantiene la imagen dentro del lomo
                style={{ zIndex: 2 }}
              >
                <img 
                  src={asset.url} 
                  alt="Asset" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    pointerEvents: 'none' // Evita bugs raros al arrastrar la imagen
                  }} 
                />
              </Rnd>
            ))}

            {/* CAPA 3: LA PLANTILLA OFICIAL */}
            <img 
              src={`/${template}-template.png`} 
              alt="Spine Template" 
              style={{ 
                position: 'absolute', 
                top: 0, left: 0, width: '100%', height: '100%', 
                zIndex: 3, 
                pointerEvents: 'none' 
              }} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default GeneratorView;