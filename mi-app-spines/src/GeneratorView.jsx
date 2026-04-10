import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// --- TEMA UI ESTILO PHOTOSHOP DARK ---
const theme = {
  bgApp: '#1e1e1e',
  bgPanel: '#252526',
  bgCanvas: '#090909',
  border: '#3c3c3c',
  accent: '#007fd4',
  text: '#cccccc',
  textMuted: '#888888',
  handle: '#ffffff',
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [zoom, setZoom] = useState(0.4); 
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  
  // NUEVO: Modo vista previa (recorta los bordes)
  const [previewMode, setPreviewMode] = useState(false);

  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ZOOM CON LA RUEDA DEL RATÓN ---
  useEffect(() => {
    const workspace = workspaceRef.current;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomChange = e.deltaY * -0.002;
        setZoom(prev => Math.min(Math.max(0.1, prev + zoomChange), 4)); 
      }
    };
    if (workspace) workspace.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspace && workspace.removeEventListener('wheel', handleWheel);
  }, []);

  // --- LÓGICA DE ROTACIÓN CON EL RATÓN ---
  const handleRotateStart = (e, layer) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Obtenemos el centro real del elemento en la pantalla
    const el = document.getElementById(`layer-content-${layer.id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      // atan2 nos da el ángulo en radianes, lo pasamos a grados
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      angle = angle + 90; // Ajustamos para que arriba sea 0 grados
      updateLayer(layer.id, { rotation: Math.round(angle) });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // --- IMPORTACIÓN ---
  const addImageToCanvas = (src, name = 'Image') => {
    const newLayer = {
      id: nanoid(),
      name: `${name} ${layers.length + 1}`,
      url: src,
      x: -50, y: 500, // Empieza un poco desfasado para que se vea bien
      width: 200, height: 200,
      rotation: 0,
      opacity: 100,
      visible: true,
      lockRatio: true // Mantiene proporciones por defecto
    };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
    setPreviewMode(false); // Salir de preview al añadir algo
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      addImageToCanvas(URL.createObjectURL(e.target.files[0]), 'Upload');
      e.target.value = null; 
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

  // --- ACTUALIZACIÓN DE CAPAS ---
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

  const handleWorkspaceClick = (e) => {
    if (e.target.id === 'workspace-bg' || e.target.id === 'workspace-container') {
      setSelectedLayerId(null);
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* TOOLBAR SUPERIOR */}
      <div style={{ height: '50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>SPINE STUDIO PRO</h2>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}>
            <option value="switch1">Template: Switch Original</option>
            <option value="switch2">Template: Switch 2</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}%</span>
          
          {/* BOTÓN MODO PREVIEW */}
          <button 
            onClick={() => { setPreviewMode(!previewMode); setSelectedLayerId(null); }} 
            style={{ padding: '8px 15px', background: previewMode ? theme.accent : 'transparent', color: 'white', border: `1px solid ${theme.accent}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {previewMode ? '✏️ BACK TO EDIT' : '👁️ PREVIEW CROP'}
          </button>

          <button style={{ padding: '8px 25px', background: 'white', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            EXPORT
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* BARRA LATERAL IZQUIERDA (HERRAMIENTAS) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', zIndex: 50 }}>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} title="Import Image" style={{ width: '40px', height: '40px', backgroundColor: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>
            🖼️
          </button>
        </div>

        {/* ÁREA CENTRAL: LIENZO */}
        <div id="workspace-bg" ref={workspaceRef} onClick={handleWorkspaceClick} onDragOver={handleDragOver} onDrop={handleDrop} style={{ flex: 1, backgroundColor: theme.bgCanvas, position: 'relative', overflow: 'auto', display: 'flex' }}>
          <div id="workspace-container" style={{ margin: 'auto', padding: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* LOMO - Si previewMode es false, es visible, si es true, recorta */}
            <div style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'center center',
              width: '100px', height: '1533px', 
              backgroundColor: bgColor,
              boxShadow: '0 0 40px rgba(0,0,0,1)',
              position: 'relative',
              // LA MAGIA: visible permite trabajar cómodo, hidden recorta la imagen final
              overflow: previewMode ? 'hidden' : 'visible'
            }}>
              
              {/* LÍNEAS GUÍA DEL LOMO (Solo visibles en modo edición) */}
              {!previewMode && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 9998 }} />
              )}

              {layers.map((layer) => layer.visible && (
                <Rnd
                  key={layer.id}
                  size={{ width: layer.width, height: layer.height }}
                  position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => updateLayer(layer.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) => {
                    updateLayer(layer.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos });
                  }}
                  disableDragging={selectedLayerId !== layer.id || previewMode}
                  enableResizing={selectedLayerId === layer.id && !previewMode}
                  lockAspectRatio={layer.lockRatio}
                  style={{
                    zIndex: 10 + layers.findIndex(l => l.id === layer.id),
                    opacity: layer.opacity / 100,
                    outline: (selectedLayerId === layer.id && !previewMode) ? `1px solid ${theme.accent}` : 'none',
                  }}
                  onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedLayerId(layer.id); }}
                >
                  {/* CONTENEDOR DE LA IMAGEN CON ROTACIÓN NATIVA */}
                  <div id={`layer-content-${layer.id}`} style={{ width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)`, position: 'relative' }}>
                    <img src={layer.url} alt="" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
                    
                    {/* TIRADOR DE ROTACIÓN NATIVO TIPO PHOTOSHOP (Solo en modo edición) */}
                    {(selectedLayerId === layer.id && !previewMode) && (
                      <>
                        <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '25px', backgroundColor: theme.accent }} />
                        <div 
                          onMouseDown={(e) => handleRotateStart(e, layer)}
                          style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', backgroundColor: 'white', border: `2px solid ${theme.accent}`, borderRadius: '50%', cursor: 'crosshair', pointerEvents: 'auto' }}
                        />
                      </>
                    )}
                  </div>
                </Rnd>
              ))}

              {/* PLANTILLA DE LA CONSOLA (Siempre encima) */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
                <img src={`/${template}-template.png`} alt="Template" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>

          </div>
        </div>

        {/* PANEL DERECHO: CAPAS Y PROPIEDADES */}
        <div style={{ width: '300px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          {/* LISTA DE CAPAS */}
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px 15px 10px', borderBottom: `1px solid ${theme.border}` }}>
              <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', color: theme.textMuted }}>LAYERS</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {[...layers].reverse().map((layer) => (
                <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#444', cursor: 'pointer', padding: '0 5px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
                  <div style={{ width: '24px', height: '24px', backgroundColor: '#111', marginLeft: '5px', backgroundImage: `url(${layer.url})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></div>
                  <span style={{ fontSize: '12px', marginLeft: '10px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedLayerId === layer.id ? '#fff' : theme.text }}>{layer.name}</span>
                  {selectedLayerId === layer.id && (
                    <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} style={{ background: '#b30000', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>✖</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PANEL DE PROPIEDADES AVANZADAS */}
          <div style={{ height: '320px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', textTransform: 'uppercase', color: theme.textMuted }}>PROPERTIES</h3>
            
            {!selectedLayerId ? (
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '50px', height: '30px', border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }} />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', width: '80px', fontSize: '12px', borderRadius: '4px' }} />
                </div>
              </div>
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* CHECKBOX PROPORCIONES */}
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedLayer.lockRatio} onChange={e => updateLayer(selectedLayer.id, { lockRatio: e.target.checked })} />
                  Maintain Aspect Ratio
                </label>

                {/* X / Y / ROTACIÓN / OPACIDAD RÁPIDOS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotation (°)</label>
                    <input type="number" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacity (%)</label>
                    <input type="number" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>
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