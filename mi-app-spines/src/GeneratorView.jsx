import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// Tema UI estilo Photoshop / Figma Dark
const theme = {
  bgApp: '#1e1e1e',
  bgPanel: '#252526',
  bgCanvas: '#090909',
  border: '#3c3c3c',
  accent: '#007fd4',
  accentHover: '#0065a9',
  text: '#cccccc',
  textMuted: '#888888',
  handle: '#ffffff',
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [zoom, setZoom] = useState(0.4); // Zoom inicial al 40% para que quepa la espina de 1533px
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ZOOM CON LA RUEDA DEL RATÓN (Ctrl + Scroll) ---
  useEffect(() => {
    const workspace = workspaceRef.current;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomChange = e.deltaY * -0.002;
        setZoom(prev => Math.min(Math.max(0.1, prev + zoomChange), 4)); // Limite entre 10% y 400%
      }
    };
    if (workspace) workspace.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspace && workspace.removeEventListener('wheel', handleWheel);
  }, []);

  // --- LÓGICA DE IMPORTACIÓN DE IMÁGENES ---
  const addImageToCanvas = (src, name = 'Image') => {
    const newLayer = {
      id: nanoid(),
      name: `${name} ${layers.length + 1}`,
      url: src,
      x: 0, y: 500, 
      width: 100, height: 100,
      rotation: 0, // Nueva propiedad de rotación
      opacity: 100,
      visible: true
    };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      addImageToCanvas(URL.createObjectURL(e.target.files[0]), 'Upload');
      e.target.value = null; // Resetear input
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) addImageToCanvas(URL.createObjectURL(file), 'Local');
      });
      return;
    }
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) { addImageToCanvas(match[1], 'Web'); return; }
    }
    const url = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/plain');
    if (url && (url.match(/^http/) || url.match(/^data:image/))) addImageToCanvas(url, 'URL');
  };

  // --- GESTIÓN DE CAPAS Y PROPIEDADES ---
  const updateLayer = (id, newProps) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));
  };

  const moveLayer = (index, direction) => {
    const newLayers = [...layers];
    if (direction === 'up' && index > 0) {
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    } else if (direction === 'down' && index < newLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    }
    setLayers(newLayers);
  };

  const removeLayer = (id) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // Clic en el fondo deselecciona la capa actual para mostrar las propiedades del lienzo
  const handleWorkspaceClick = (e) => {
    if (e.target.id === 'workspace-bg' || e.target.id === 'workspace-container') {
      setSelectedLayerId(null);
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // Estilos visuales para los cuadritos de redimensión (Handles)
  const resizeHandleStyles = {
    bottomRight: { width: '10px', height: '10px', background: theme.handle, border: `2px solid ${theme.accent}`, right: '-5px', bottom: '-5px' },
    bottomLeft: { width: '10px', height: '10px', background: theme.handle, border: `2px solid ${theme.accent}`, left: '-5px', bottom: '-5px' },
    topRight: { width: '10px', height: '10px', background: theme.handle, border: `2px solid ${theme.accent}`, right: '-5px', top: '-5px' },
    topLeft: { width: '10px', height: '10px', background: theme.handle, border: `2px solid ${theme.accent}`, left: '-5px', top: '-5px' },
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* TOOLBAR SUPERIOR */}
      <div style={{ height: '50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>SPINE STUDIO</h2>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}>
            <option value="switch1">Template: Switch Original</option>
            <option value="switch2">Template: Switch 2</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}% (Ctrl+Wheel)</span>
          <button style={{ padding: '8px 25px', background: theme.accent, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            EXPORT PDF
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* BARRA LATERAL IZQUIERDA (HERRAMIENTAS) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', zIndex: 50 }}>
          
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
          
          <button 
            onClick={() => setSelectedLayerId(null)}
            title="Move Tool (V)"
            style={{ width: '40px', height: '40px', backgroundColor: !selectedLayerId ? theme.bgApp : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', marginBottom: '10px' }}
          >
            ↗
          </button>

          <button 
            onClick={() => fileInputRef.current.click()}
            title="Import Image"
            style={{ width: '40px', height: '40px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.bgApp}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            🖼️
          </button>
        </div>

        {/* ÁREA CENTRAL: LIENZO INFINITO */}
        <div 
          id="workspace-bg"
          ref={workspaceRef}
          onClick={handleWorkspaceClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ flex: 1, backgroundColor: theme.bgCanvas, position: 'relative', overflow: 'auto', display: 'flex' }}
        >
          {/* Contenedor Flex para centrar el lienzo dinámicamente */}
          <div id="workspace-container" style={{ margin: 'auto', padding: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* LOMO EXACTO (Proporción 1:15.33 -> 100px x 1533px) */}
            <div style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'center center',
              width: '100px', 
              height: '1533px', 
              backgroundColor: bgColor,
              boxShadow: '0 0 20px rgba(0,0,0,1)',
              position: 'relative',
              overflow: 'hidden' // Todo lo que salga del lomo se corta
            }}>
              
              {/* CAPAS DE IMÁGENES */}
              {[...layers].reverse().map((layer) => layer.visible && (
                <Rnd
                  key={layer.id}
                  size={{ width: layer.width, height: layer.height }}
                  position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => updateLayer(layer.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    updateLayer(layer.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...position });
                  }}
                  disableDragging={selectedLayerId !== layer.id}
                  enableResizing={selectedLayerId === layer.id}
                  resizeHandleStyles={selectedLayerId === layer.id ? resizeHandleStyles : {}}
                  style={{
                    zIndex: 10 + layers.findIndex(l => l.id === layer.id),
                    opacity: layer.opacity / 100,
                    // Borde de selección
                    outline: selectedLayerId === layer.id ? `1px solid ${theme.accent}` : 'none',
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                >
                  {/* Contenedor interno para la rotación */}
                  <div style={{ width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)` }}>
                    <img src={layer.url} alt="" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
                  </div>
                </Rnd>
              ))}

              {/* PLANTILLA TRANSPARENTE (Encima de todo) */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
                <img src={`/${template}-template.png`} alt="Template" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: CAPAS Y PROPIEDADES */}
        <div style={{ width: '300px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          {/* PANEL DE CAPAS (Mitad superior) */}
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 15px 10px', borderBottom: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '1px' }}>LAYERS</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {layers.map((layer, index) => (
                <div 
                  key={layer.id} 
                  onClick={() => setSelectedLayerId(layer.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px',
                    backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, 
                    borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#444', cursor: 'pointer', padding: '0 5px', fontSize: '14px' }}>
                    {layer.visible ? '👁️' : '🕶️'}
                  </button>
                  <div style={{ width: '24px', height: '24px', backgroundColor: '#111', marginLeft: '5px', backgroundImage: `url(${layer.url})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
                  <span style={{ fontSize: '12px', marginLeft: '10px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedLayerId === layer.id ? '#fff' : theme.text }}>{layer.name}</span>
                  
                  {selectedLayerId === layer.id && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(index, 'up'); }} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(index, 'down'); }} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▼</button>
                      <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} style={{ background: '#b30000', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px', marginLeft: '4px' }}>✖</button>
                    </div>
                  )}
                </div>
              ))}
              {layers.length === 0 && <div style={{ fontSize: '12px', color: '#555', textAlign: 'center', marginTop: '20px' }}>No layers yet. Drag images here.</div>}
            </div>
          </div>

          {/* PANEL DE PROPIEDADES (Mitad inferior) */}
          <div style={{ height: '320px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', textTransform: 'uppercase', color: theme.textMuted, letterSpacing: '1px' }}>PROPERTIES</h3>
            
            {/* Si NO hay capa seleccionada, muestra las propiedades del CANVAS */}
            {!selectedLayerId && (
              <div>
                <label style={{ fontSize: '12px', color: theme.text, display: 'block', marginBottom: '8px' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '50px', height: '30px', border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }} />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', width: '80px', fontSize: '12px', borderRadius: '4px' }} />
                </div>
                <p style={{ fontSize: '11px', color: theme.textMuted, marginTop: '20px', lineHeight: '1.5' }}>
                  Click on a layer to edit its properties (Size, Position, Rotation, Opacity).<br/><br/>
                  Hold <b>Ctrl</b> and use the <b>Mouse Wheel</b> to Zoom.
                </p>
              </div>
            )}

            {/* Si HAY una capa seleccionada, muestra sus propiedades */}
            {selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* POSITION */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '4px' }}>X</label>
                    <input type="number" value={Math.round(selectedLayer.x)} onChange={e => updateLayer(selectedLayer.id, { x: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '4px' }}>Y</label>
                    <input type="number" value={Math.round(selectedLayer.y)} onChange={e => updateLayer(selectedLayer.id, { y: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* SIZE */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '4px' }}>Width</label>
                    <input type="number" value={Math.round(selectedLayer.width)} onChange={e => updateLayer(selectedLayer.id, { width: parseInt(e.target.value) || 10 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '4px' }}>Height</label>
                    <input type="number" value={Math.round(selectedLayer.height)} onChange={e => updateLayer(selectedLayer.id, { height: parseInt(e.target.value) || 10 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* ROTATION & OPACITY */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotation</label>
                    <span style={{ fontSize: '10px', color: theme.text }}>{selectedLayer.rotation}°</span>
                  </div>
                  <input type="range" min="-180" max="180" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })} style={{ width: '100%' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacity</label>
                    <span style={{ fontSize: '10px', color: theme.text }}>{selectedLayer.opacity}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) })} style={{ width: '100%' }} />
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GeneratorView;