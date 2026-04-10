import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// --- TEMA UI ESTILO PHOTOSHOP DARK ---
const theme = {
  bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909',
  border: '#3c3c3c', accent: '#007fd4', text: '#cccccc',
  textMuted: '#888888', handle: '#ffffff',
};

// Estilos para los tiradores de redimensión (HACERLOS GRANDES Y VISIBLES)
const handleSize = '16px';
const customHandle = {
  width: handleSize, height: handleSize, background: '#fff',
  border: `3px solid ${theme.accent}`, borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.5)', pointerEvents: 'auto'
};
const resizeHandleStyles = {
  bottomRight: { ...customHandle, right: '-8px', bottom: '-8px' },
  bottomLeft: { ...customHandle, left: '-8px', bottom: '-8px' },
  topRight: { ...customHandle, right: '-8px', top: '-8px' },
  topLeft: { ...customHandle, left: '-8px', top: '-8px' },
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [zoom, setZoom] = useState(0.4); 
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // PORTAPAPELES PARA CTRL+C / CTRL+V
  const [clipboard, setClipboard] = useState(null);

  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ATAJOS DE TECLADO (Supr, Ctrl+C, Ctrl+V, Ctrl+D) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar atajos si estamos escribiendo en un input o textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Borrar
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        setLayers(prev => prev.filter(l => l.id !== selectedLayerId));
        setSelectedLayerId(null);
      }
      
      // Copiar (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedLayerId) {
        const layerToCopy = layers.find(l => l.id === selectedLayerId);
        if (layerToCopy) setClipboard(layerToCopy);
      }
      
      // Pegar (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
        const newLayer = {
          ...clipboard,
          id: nanoid(),
          name: `${clipboard.name} (Copy)`,
          x: clipboard.x + 20, y: clipboard.y + 20, // Desfase
          zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10
        };
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
      }

      // Duplicar Rápido (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedLayerId) {
        e.preventDefault();
        const layerToCopy = layers.find(l => l.id === selectedLayerId);
        if (layerToCopy) {
          const newLayer = { ...layerToCopy, id: nanoid(), name: `${layerToCopy.name} (Copy)`, x: layerToCopy.x + 20, y: layerToCopy.y + 20, zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10 };
          setLayers(prev => [...prev, newLayer]);
          setSelectedLayerId(newLayer.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, clipboard]);

  // --- ZOOM ESCALONADO (10% por golpe de rueda) ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) { 
        e.preventDefault(); 
        const direction = e.deltaY < 0 ? 1 : -1; // 1 = Acercar, -1 = Alejar
        setZoom(prev => {
          let newZoom = prev + (direction * 0.1);
          // Redondear a un decimal para evitar errores flotantes (ej: 0.300000004)
          newZoom = Math.round(newZoom * 10) / 10;
          return Math.max(0.1, Math.min(4, newZoom)); // Limitar entre 10% y 400%
        });
      }
    };
    if (workspaceRef.current) workspaceRef.current.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspaceRef.current?.removeEventListener('wheel', handleWheel);
  }, []);

  // --- ROTACIÓN CON EL RATÓN ---
  const handleRotateStart = (e, layer) => {
    e.stopPropagation(); e.preventDefault();
    const el = document.getElementById(`layer-content-${layer.id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (moveEvent) => {
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI) + 90;
      updateLayer(layer.id, { rotation: Math.round(angle) });
    };
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
  };

  // --- CREADORES Y ACTUALIZADORES ---
  const addLayer = (type, props, name) => {
    const newL = { 
      id: nanoid(), type, name: `${name} ${layers.length + 1}`, 
      x: 0, y: 500, width: type==='text'?200:150, height: type==='text'?60:150, 
      rotation: 0, opacity: 100, visible: true, 
      lockRatio: false, // DESACTIVADO POR DEFECTO PARA PODER ESTIRAR
      crop: { top: 0, right: 0, bottom: 0, left: 0 }, // NUEVO: Valores de recorte
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10, ...props 
    };
    setLayers([...layers, newL]); setSelectedLayerId(newL.id); setPreviewMode(false);
  };

  const addImageToCanvas = (src, n='Image') => addLayer('image', { url: src }, n);

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => { if (file.type.startsWith('image/')) addImageToCanvas(URL.createObjectURL(file), 'File'); });
    }
  };

  const updateLayer = (id, newProps) => setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));

  const moveLayerZIndex = (id, direction) => {
    const sorted = [...layers].sort((a,b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex(l => l.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx < sorted.length - 1) {
      setLayers(layers.map(l => l.id === id ? {...l, zIndex: sorted[idx+1].zIndex} : l.id === sorted[idx+1].id ? {...l, zIndex: sorted[idx].zIndex} : l));
    } else if (direction === 'down' && idx > 0) {
      setLayers(layers.map(l => l.id === id ? {...l, zIndex: sorted[idx-1].zIndex} : l.id === sorted[idx-1].id ? {...l, zIndex: sorted[idx].zIndex} : l));
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* --- TOOLBAR SUPERIOR --- */}
      <div style={{ height: '50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', color: 'white', letterSpacing: '1px' }}>SPINE STUDIO PRO</h2>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px', outline: 'none' }}>
            <option value="switch1">Template: Switch V1</option>
            <option value="switch2">Template: Switch V2</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}%</span>
          <button onClick={() => setPreviewMode(!previewMode)} style={{ padding: '8px 15px', background: previewMode ? theme.accent : 'transparent', color: 'white', border: `1px solid ${theme.accent}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            {previewMode ? '✏️ BACK TO EDIT' : '👁️ PREVIEW CROP'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* --- BARRA LATERAL (HERRAMIENTAS) --- */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', zIndex: 50 }}>
          <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files[0]) addImageToCanvas(URL.createObjectURL(e.target.files[0])); e.target.value=null; }} style={{ display: 'none' }} />
          
          <button onClick={() => setSelectedLayerId(null)} title="Select Tool (V)" style={{ width: '40px', height: '40px', background: !selectedLayerId ? '#333' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Import Image (I)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={() => addLayer('text', { text: 'YOUR TEXT', color: '#000', fontSize: 32, fontFamily: 'sans-serif' }, 'Text')} title="Add Text (T)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
          <button onClick={() => addLayer('shape', { shapeType: 'rect', fill: '#d40000' }, 'Rect')} title="Add Rectangle (U)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⬛</button>
          <button onClick={() => addLayer('shape', { shapeType: 'circle', fill: '#007fd4' }, 'Circle')} title="Add Circle (O)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⚫</button>
        </div>

        {/* --- LIENZO INFINITO (WORKSPACE) --- */}
        <div ref={workspaceRef} onClick={(e) => { if(e.target.id==='workspace-bg') setSelectedLayerId(null); }} id="workspace-bg" onDragOver={e=>e.preventDefault()} onDrop={handleDrop} style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', display: 'flex', position: 'relative' }}>
          <div style={{ margin: 'auto', padding: '150px' }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', width: '100px', height: '1533px', backgroundColor: bgColor, position: 'relative', overflow: previewMode ? 'hidden' : 'visible', boxShadow: '0 0 40px rgba(0,0,0,1)' }}>
              
              {!previewMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 99998 }} />}

              {/* RENDER DE CAPAS */}
              {[...layers].sort((a,b) => a.zIndex - b.zIndex).map((layer) => layer.visible && (
                <Rnd key={layer.id} size={{ width: layer.width, height: layer.height }} position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => updateLayer(layer.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) => updateLayer(layer.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                  disableDragging={selectedLayerId !== layer.id || previewMode} 
                  enableResizing={selectedLayerId === layer.id && !previewMode} 
                  lockAspectRatio={layer.lockRatio}
                  resizeHandleStyles={selectedLayerId === layer.id ? resizeHandleStyles : {}}
                  style={{ zIndex: layer.zIndex, opacity: layer.opacity / 100, outline: (selectedLayerId === layer.id && !previewMode) ? `2px solid ${theme.accent}` : 'none' }}
                  onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedLayerId(layer.id); }}
                >
                  <div id={`layer-content-${layer.id}`} style={{ width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)`, position: 'relative' }}>
                    
                    {/* IMAGEN CON MÁSCARA DE RECORTE (CROP) Y ESTIRAMIENTO (object-fit: fill) */}
                    {layer.type === 'image' && (
                      <img 
                        src={layer.url} 
                        style={{ 
                          width: '100%', height: '100%', 
                          objectFit: 'fill', /* PERMITE ESTIRAR */
                          clipPath: layer.crop ? `inset(${layer.crop.top}% ${layer.crop.right}% ${layer.crop.bottom}% ${layer.crop.left}%)` : 'none',
                          pointerEvents: 'none' 
                        }} 
                        draggable="false" alt="" 
                      />
                    )}
                    
                    {layer.type === 'text' && <textarea value={layer.text} onChange={e => updateLayer(layer.id, { text: e.target.value })} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: layer.color, fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, resize: 'none', textAlign: 'center', outline: 'none' }} />}
                    {layer.type === 'shape' && <div style={{ width: '100%', height: '100%', backgroundColor: layer.fill, borderRadius: layer.shapeType === 'circle' ? '50%' : '0' }} />}
                    
                    {/* TIRADOR DE ROTACIÓN */}
                    {(selectedLayerId === layer.id && !previewMode) && (
                      <>
                        <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '25px', backgroundColor: theme.accent }} />
                        <div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', backgroundColor: 'white', border: `3px solid ${theme.accent}`, borderRadius: '50%', cursor: 'grab' }} />
                      </>
                    )}
                  </div>
                </Rnd>
              ))}
              
              <img src={`/${template}-template.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, pointerEvents: 'none' }} alt="" />
            </div>
          </div>
        </div>

        {/* --- PANEL DERECHO (CAPAS Y PROPIEDADES) --- */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>LAYERS (CAPAS)</h3></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {[...layers].sort((a,b) => b.zIndex - a.zIndex).map((layer) => (
                <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
                  <span style={{ fontSize: '16px', margin: '0 10px' }}>{layer.type === 'image' ? '🖼️' : layer.type === 'text' ? 'T' : '⬛'}</span>
                  <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{layer.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '400px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>PROPERTIES</h3>
            
            {!selectedLayerId ? (
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px', color: theme.text }}>Background Color</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '40px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '4px 8px', borderRadius: '4px', width: '80px' }} />
                </div>
              </div>
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: theme.text }}>
                  <input type="checkbox" checked={selectedLayer.lockRatio} onChange={e => updateLayer(selectedLayer.id, { lockRatio: e.target.checked })} />
                  Maintain Aspect Ratio
                </label>

                {/* --- NUEVO: CONTROLES DE RECORTE (CROP) PARA IMÁGENES --- */}
                {selectedLayer.type === 'image' && selectedLayer.crop && (
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '8px' }}>Image Crop (%)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><span style={{fontSize:'10px'}}>Top</span><input type="range" min="0" max="100" value={selectedLayer.crop.top} onChange={e => updateLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, top: parseInt(e.target.value) } })} style={{width:'100%'}}/></div>
                      <div><span style={{fontSize:'10px'}}>Bottom</span><input type="range" min="0" max="100" value={selectedLayer.crop.bottom} onChange={e => updateLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, bottom: parseInt(e.target.value) } })} style={{width:'100%'}}/></div>
                      <div><span style={{fontSize:'10px'}}>Left</span><input type="range" min="0" max="100" value={selectedLayer.crop.left} onChange={e => updateLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, left: parseInt(e.target.value) } })} style={{width:'100%'}}/></div>
                      <div><span style={{fontSize:'10px'}}>Right</span><input type="range" min="0" max="100" value={selectedLayer.crop.right} onChange={e => updateLayer(selectedLayer.id, { crop: { ...selectedLayer.crop, right: parseInt(e.target.value) } })} style={{width:'100%'}}/></div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotation (°)</label>
                    <input type="number" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacity (%)</label>
                    <input type="number" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px' }} />
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