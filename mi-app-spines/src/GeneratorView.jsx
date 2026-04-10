import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// --- TEMA UI ESTILO PHOTOSHOP DARK ---
const theme = {
  bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909',
  border: '#3c3c3c', accent: '#007fd4', text: '#cccccc', textMuted: '#888888'
};

// --- ESTILOS DE LOS TIRADORES DE REDIMENSIÓN (GRANDES) ---
const handleStyle = {
  width: '16px', height: '16px', background: '#fff',
  border: `3px solid ${theme.accent}`, borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.5)', pointerEvents: 'auto'
};
const resizeHandleStyles = {
  bottomRight: { ...handleStyle, right: '-8px', bottom: '-8px' },
  bottomLeft: { ...handleStyle, left: '-8px', bottom: '-8px' },
  topRight: { ...handleStyle, right: '-8px', top: '-8px' },
  topLeft: { ...handleStyle, left: '-8px', top: '-8px' },
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [zoom, setZoom] = useState(0.4); 
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  
  // MODOS DE VISTA Y HERRAMIENTAS
  const [previewMode, setPreviewMode] = useState(false);
  const [croppingLayerId, setCroppingLayerId] = useState(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });

  const [clipboard, setClipboard] = useState(null);
  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==========================================
  // ATAJOS DE TECLADO (Portapapeles y Borrado)
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        setLayers(prev => prev.filter(l => l.id !== selectedLayerId));
        setSelectedLayerId(null); setCroppingLayerId(null);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedLayerId) {
        setClipboard(layers.find(l => l.id === selectedLayerId));
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
        const newLayer = { ...clipboard, id: nanoid(), name: `${clipboard.name} (Copy)`, x: clipboard.x + 20, y: clipboard.y + 20, zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10 };
        setLayers(prev => [...prev, newLayer]); setSelectedLayerId(newLayer.id);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedLayerId) {
        e.preventDefault();
        const layerToCopy = layers.find(l => l.id === selectedLayerId);
        if (layerToCopy) {
          const newLayer = { ...layerToCopy, id: nanoid(), name: `${layerToCopy.name} (Copy)`, x: layerToCopy.x + 20, y: layerToCopy.y + 20, zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10 };
          setLayers(prev => [...prev, newLayer]); setSelectedLayerId(newLayer.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, clipboard]);

  // ==========================================
  // ZOOM ESCALONADO (10%)
  // ==========================================
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) { 
        e.preventDefault(); 
        const direction = e.deltaY < 0 ? 1 : -1; 
        setZoom(prev => Math.max(0.1, Math.min(4, Math.round((prev + (direction * 0.1)) * 10) / 10)));
      }
    };
    if (workspaceRef.current) workspaceRef.current.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspaceRef.current?.removeEventListener('wheel', handleWheel);
  }, []);

  // ==========================================
  // LÓGICA DE ROTACIÓN NATIVA
  // ==========================================
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

  // ==========================================
  // DRAG & DROP (ARCHIVOS E INTERNET) - RESTAURADO
  // ==========================================
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();

    // 1. Archivos locales del PC
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => { 
        if (file.type.startsWith('image/')) addImageToCanvas(URL.createObjectURL(file), 'Local File'); 
      });
      return;
    }

    // 2. Arrastrar desde otra pestaña de internet (HTML)
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) { addImageToCanvas(match[1], 'Web Image'); return; }
    }

    // 3. Arrastrar una URL directa
    const url = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/plain');
    if (url && (url.match(/^http/) || url.match(/^data:image/))) {
      addImageToCanvas(url, 'URL Image');
    }
  };

  // ==========================================
  // CAPAS Y PROPIEDADES
  // ==========================================
  const addLayer = (type, props, name) => {
    const newL = { 
      id: nanoid(), type, name: `${name} ${layers.length + 1}`, 
      x: 0, y: 500, width: type==='text'?200:150, height: type==='text'?60:150, 
      rotation: 0, opacity: 100, visible: true, lockRatio: false, 
      cropMask: null, 
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10, ...props 
    };
    setLayers([...layers, newL]); setSelectedLayerId(newL.id); setPreviewMode(false);
  };

  const addImageToCanvas = (src, n='Image') => addLayer('image', { url: src }, n);
  const updateLayer = (id, newProps) => setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));

  const startCropMode = (layer) => {
    setCroppingLayerId(layer.id);
    setCropBox(layer.cropMask || { x: 0, y: 0, width: layer.width, height: layer.height });
  };

  const applyCrop = () => {
    if (croppingLayerId) {
      updateLayer(croppingLayerId, { cropMask: cropBox });
      setCroppingLayerId(null);
    }
  };

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

// ==========================================
  // RENDERIZADO VISUAL
  // ==========================================
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* TOOLBAR SUPERIOR */}
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
          <button onClick={() => {setPreviewMode(!previewMode); setCroppingLayerId(null);}} style={{ padding: '8px 15px', background: previewMode ? theme.accent : 'transparent', color: 'white', border: `1px solid ${theme.accent}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            {previewMode ? '✏️ VOLVER A EDITAR' : '👁️ VISTA PREVIA CROP'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* BARRA LATERAL (HERRAMIENTAS) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', zIndex: 50 }}>
          <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files[0]) addImageToCanvas(URL.createObjectURL(e.target.files[0]), 'PC File'); e.target.value=null; }} style={{ display: 'none' }} />
          
          <button onClick={() => {setSelectedLayerId(null); setCroppingLayerId(null);}} title="Select Tool (V)" style={{ width: '40px', height: '40px', background: !selectedLayerId ? '#333' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Import Image (I)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={() => addLayer('text', { text: 'NUEVO TEXTO', color: '#000', fontSize: 32, fontFamily: 'sans-serif' }, 'Text')} title="Add Text (T)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
          <button onClick={() => addLayer('shape', { shapeType: 'rect', fill: '#d40000' }, 'Rect')} title="Add Rectangle (U)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⬛</button>
          <button onClick={() => addLayer('shape', { shapeType: 'circle', fill: '#007fd4' }, 'Circle')} title="Add Circle (O)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⚫</button>
        </div>

        {/* LIENZO (WORKSPACE) */}
        <div ref={workspaceRef} onClick={(e) => { if(e.target.id==='workspace-bg') {setSelectedLayerId(null); setCroppingLayerId(null);} }} id="workspace-bg" onDragOver={e=>e.preventDefault()} onDrop={handleDrop} style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', display: 'flex', position: 'relative' }}>
          <div style={{ margin: 'auto', padding: '150px' }}>
            
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', width: '100px', height: '1533px', backgroundColor: bgColor, position: 'relative', overflow: previewMode ? 'hidden' : 'visible', boxShadow: '0 0 40px rgba(0,0,0,1)' }}>
              
              {!previewMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 99998 }} />}

              {/* RENDERIZADO DE LAS CAPAS */}
              {[...layers].sort((a,b) => a.zIndex - b.zIndex).map((layer) => layer.visible && (
                
                <Rnd key={layer.id} size={{ width: layer.width, height: layer.height }} position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => updateLayer(layer.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) => updateLayer(layer.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                  disableDragging={previewMode || croppingLayerId === layer.id} 
                  enableResizing={selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id} 
                  lockAspectRatio={layer.lockRatio}
                  resizeHandleStyles={selectedLayerId === layer.id ? resizeHandleStyles : {}}
                  style={{ 
                    zIndex: layer.zIndex, 
                    opacity: layer.opacity / 100, 
                    transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation}deg)`,
                    outline: (selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id) ? `2px solid ${theme.accent}` : 'none' 
                  }}
                  onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedLayerId(layer.id); }}
                >
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    
                    {layer.type === 'image' && (
                      <div id={`layer-content-${layer.id}`} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                        <img 
                          src={layer.url} 
                          style={{ 
                            width: '100%', height: '100%', objectFit: 'fill', 
                            clipPath: (layer.cropMask && croppingLayerId !== layer.id) ? `inset(${layer.cropMask.y}px ${layer.width - (layer.cropMask.x + layer.cropMask.width)}px ${layer.height - (layer.cropMask.y + layer.cropMask.height)}px ${layer.cropMask.x}px)` : 'none',
                            opacity: croppingLayerId === layer.id ? 0.4 : 1 
                          }} 
                          draggable="false" alt="" 
                        />
                        
                        {croppingLayerId === layer.id && (
                          <Rnd
                            bounds="parent" size={{ width: cropBox.width, height: cropBox.height }} position={{ x: cropBox.x, y: cropBox.y }}
                            onDrag={(e, d) => setCropBox({ ...cropBox, x: d.x, y: d.y })}
                            onResize={(e, dir, ref, delta, pos) => setCropBox({ width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                            style={{ border: '2px dashed #ff0000', backgroundColor: 'rgba(255,0,0,0.1)', zIndex: 10 }}
                          >
                             <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                               <img src={layer.url} style={{ position: 'absolute', top: -cropBox.y, left: -cropBox.x, width: layer.width, height: layer.height, objectFit: 'fill' }} alt="" />
                             </div>
                          </Rnd>
                        )}
                        
                        {/* TIRADOR DE ROTACIÓN */}
                        {(selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id) && (
                          <>
                            <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '25px', backgroundColor: theme.accent }} />
                            <div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', backgroundColor: 'white', border: `3px solid ${theme.accent}`, borderRadius: '50%', cursor: 'grab' }} />
                          </>
                        )}
                      </div>
                    )}
                    
                    {layer.type === 'text' && (
                      <div id={`layer-content-${layer.id}`} style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <textarea value={layer.text} onChange={e => updateLayer(layer.id, { text: e.target.value })} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: layer.color, fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, resize: 'none', textAlign: 'center', outline: 'none' }} />
                        {(selectedLayerId === layer.id && !previewMode) && (
                          <>
                            <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '25px', backgroundColor: theme.accent }} />
                            <div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', backgroundColor: 'white', border: `3px solid ${theme.accent}`, borderRadius: '50%', cursor: 'grab' }} />
                          </>
                        )}
                      </div>
                    )}

                    {layer.type === 'shape' && (
                      <div id={`layer-content-${layer.id}`} style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <div style={{ width: '100%', height: '100%', backgroundColor: layer.fill, borderRadius: layer.shapeType === 'circle' ? '50%' : '0' }} />
                        {(selectedLayerId === layer.id && !previewMode) && (
                          <>
                            <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '25px', backgroundColor: theme.accent }} />
                            <div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', backgroundColor: 'white', border: `3px solid ${theme.accent}`, borderRadius: '50%', cursor: 'grab' }} />
                          </>
                        )}
                      </div>
                    )}
                    
                  </div>
                </Rnd>
              ))}
              
              <img src={`/${template}-template.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, pointerEvents: 'none' }} alt="" />
            </div>
          </div>
        </div>

        {/* PANEL DERECHO (PROPIEDADES Y CAPAS) */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>LAYERS (CAPAS)</h3></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {[...layers].sort((a,b) => b.zIndex - a.zIndex).map((layer) => (
                <div key={layer.id} onClick={() => {setSelectedLayerId(layer.id); setCroppingLayerId(null);}} style={{ display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '5px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
                  <span style={{ fontSize: '16px', margin: '0 10px' }}>{layer.type === 'image' ? '🖼️' : layer.type === 'text' ? 'T' : '⬛'}</span>
                  <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{layer.name}</span>
                  {selectedLayerId === layer.id && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'up'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'down'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▼</button>
                    </div>
                  )}
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
                  Mantener Proporciones
                </label>

                {selectedLayer.type === 'image' && (
                  <button 
                    onClick={() => croppingLayerId === selectedLayer.id ? applyCrop() : startCropMode(selectedLayer)} 
                    style={{ padding: '12px', background: croppingLayerId === selectedLayer.id ? '#00ff00' : '#444', color: croppingLayerId === selectedLayer.id ? '#000' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s' }}
                  >
                    {croppingLayerId === selectedLayer.id ? '✅ APLICAR CROP' : '✂️ ACTIVAR RECORTE VISUAL'}
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotación (°)</label>
                    <input type="number" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacidad (%)</label>
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