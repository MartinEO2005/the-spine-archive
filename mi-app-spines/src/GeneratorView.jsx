import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// --- TEMA UI ESTILO PHOTOSHOP / FIGMA DARK ---
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
  const [previewMode, setPreviewMode] = useState(false);

  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ACCESIBILIDAD: ATAJOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Borrar capa activa (excepto si estamos escribiendo en un input o textarea)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          removeLayer(selectedLayerId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers]);

  // --- ZOOM CON CTRL + RUEDA ---
  useEffect(() => {
    const workspace = workspaceRef.current;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(prev => Math.min(Math.max(0.1, prev + (e.deltaY * -0.002)), 4)); 
      }
    };
    if (workspace) workspace.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspace && workspace.removeEventListener('wheel', handleWheel);
  }, []);

  // --- LÓGICA RECUPERADA: ROTACIÓN NATIVA CON RATÓN ---
  const handleRotateStart = (e, layer) => {
    e.stopPropagation();
    e.preventDefault();
    
    const el = document.getElementById(`layer-content-${layer.id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      angle = angle + 90; // Ajuste para que "arriba" sean 0 grados
      updateLayer(layer.id, { rotation: Math.round(angle) });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // --- CREACIÓN DE ELEMENTOS MULTI-TIPO ---
  const addLayer = (type, extraProps = {}, namePrefix) => {
    const newLayer = {
      id: nanoid(),
      type: type, // 'image', 'text', 'shape'
      name: `${namePrefix} ${layers.length + 1}`,
      x: 0, y: 500, 
      width: type === 'text' ? 250 : 150, 
      height: type === 'text' ? 60 : 150,
      rotation: 0, 
      opacity: 100, 
      visible: true, 
      lockRatio: type === 'image', // Las imágenes bloquean proporción por defecto
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10,
      ...extraProps
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
    setPreviewMode(false);
  };

  const addImageToCanvas = (src, name = 'Image') => addLayer('image', { url: src }, name);
  const addTextToCanvas = () => addLayer('text', { text: 'YOUR TEXT HERE', color: '#000000', fontSize: 32, fontFamily: 'sans-serif' }, 'Text');
  const addShapeToCanvas = (shapeType) => addLayer('shape', { shapeType: shapeType, fill: '#ff0000' }, shapeType === 'rect' ? 'Rectangle' : 'Circle');

  // --- IMPORTACIÓN Y DRAG & DROP ---
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      addImageToCanvas(URL.createObjectURL(e.target.files[0]), 'Upload');
      e.target.value = null; 
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => { if (file.type.startsWith('image/')) addImageToCanvas(URL.createObjectURL(file), 'Local File'); });
      return;
    }
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) { addImageToCanvas(match[1], 'Web Image'); return; }
    }
  };

  // --- GESTIÓN MATEMÁTICA DE CAPAS ---
  const updateLayer = (id, newProps) => setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));

  const moveLayerZIndex = (id, direction) => {
    const sortedLayers = [...layers].sort((a,b) => a.zIndex - b.zIndex);
    const currentIndex = sortedLayers.findIndex(l => l.id === id);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex < sortedLayers.length - 1) {
      const layerAbove = sortedLayers[currentIndex + 1];
      const targetZ = layerAbove.zIndex;
      const currentZ = sortedLayers[currentIndex].zIndex;
      updateLayer(id, { zIndex: targetZ });
      updateLayer(layerAbove.id, { zIndex: currentZ });
    } else if (direction === 'down' && currentIndex > 0) {
      const layerBelow = sortedLayers[currentIndex - 1];
      const targetZ = layerBelow.zIndex;
      const currentZ = sortedLayers[currentIndex].zIndex;
      updateLayer(id, { zIndex: targetZ });
      updateLayer(layerBelow.id, { zIndex: currentZ });
    }
  };

  const removeLayer = (id) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // --- RENDERIZADO VISUAL DEL ELEMENTO ---
  const renderLayerContent = (layer) => {
    if (layer.type === 'image') {
      return <img src={layer.url} alt="" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />;
    }
    if (layer.type === 'text') {
      return (
        <textarea 
          value={layer.text} 
          onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
          style={{ 
            width: '100%', height: '100%', background: 'transparent', border: 'none', 
            color: layer.color, fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, 
            resize: 'none', overflow: 'hidden', textAlign: 'center', outline: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} 
        />
      );
    }
    if (layer.type === 'shape') {
      return <div style={{ width: '100%', height: '100%', backgroundColor: layer.fill, borderRadius: layer.shapeType === 'circle' ? '50%' : '0' }} />;
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
        
        {/* BARRA DE HERRAMIENTAS (IZQUIERDA) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', zIndex: 50, gap: '10px' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
          
          <button onClick={() => setSelectedLayerId(null)} title="Select Tool (V)" style={{ width: '40px', height: '40px', background: !selectedLayerId ? '#333' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Import Image (I)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={addTextToCanvas} title="Add Text (T)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
          <button onClick={() => addShapeToCanvas('rect')} title="Add Rectangle (U)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⬛</button>
          <button onClick={() => addShapeToCanvas('circle')} title="Add Circle (O)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⚫</button>
        </div>

        {/* LIENZO INFINITO */}
        <div id="workspace-bg" ref={workspaceRef} onClick={(e) => { if(e.target.id==='workspace-bg' || e.target.id==='workspace-container') setSelectedLayerId(null); }} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', display: 'flex', position: 'relative' }}>
          <div id="workspace-container" style={{ margin: 'auto', padding: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', width: '100px', height: '1533px', backgroundColor: bgColor, boxShadow: '0 0 40px rgba(0,0,0,1)', position: 'relative', overflow: previewMode ? 'hidden' : 'visible' }}>
              
              {/* LÍNEAS GUÍA (Ocultas en preview) */}
              {!previewMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 99998 }} />}

              {/* RENDERIZADO DE CAPAS (Ordenadas por zIndex) */}
              {[...layers].sort((a,b) => a.zIndex - b.zIndex).map((layer) => layer.visible && (
                <Rnd
                  key={layer.id}
                  size={{ width: layer.width, height: layer.height }}
                  position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => updateLayer(layer.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) => updateLayer(layer.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                  disableDragging={selectedLayerId !== layer.id || previewMode}
                  enableResizing={selectedLayerId === layer.id && !previewMode}
                  lockAspectRatio={layer.lockRatio}
                  style={{ zIndex: layer.zIndex, opacity: layer.opacity / 100, outline: (selectedLayerId === layer.id && !previewMode) ? `2px solid ${theme.accent}` : 'none' }}
                  onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedLayerId(layer.id); }}
                >
                  {/* CONTENEDOR DE ROTACIÓN Y CONTENIDO */}
                  <div id={`layer-content-${layer.id}`} style={{ width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)`, position: 'relative' }}>
                    {renderLayerContent(layer)}
                    
                    {/* TIRADOR DE ROTACIÓN NATIVO */}
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
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, pointerEvents: 'none' }}>
                <img src={`/${template}-template.png`} alt="Template" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>

          </div>
        </div>

        {/* PANEL DERECHO (CAPAS Y PROPIEDADES DINÁMICAS) */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          {/* PANEL DE CAPAS VISUAL */}
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>LAYERS</h3></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {/* Mostramos la lista invertida por zIndex para que las superiores salgan arriba */}
              {[...layers].sort((a,b) => b.zIndex - a.zIndex).map((layer) => (
                <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px', fontSize: '14px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
                  <span style={{ fontSize: '16px', margin: '0 10px' }}>{layer.type === 'image' ? '🖼️' : layer.type === 'text' ? 'T' : '⬛'}</span>
                  <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedLayerId === layer.id ? '#fff' : theme.text }}>{layer.name}</span>
                  
                  {selectedLayerId === layer.id && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'up'); }} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'down'); }} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▼</button>
                      <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} style={{ background: '#b30000', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px', marginLeft: '4px' }}>✖</button>
                    </div>
                  )}
                </div>
              ))}
              {layers.length === 0 && <div style={{ fontSize: '12px', color: '#555', textAlign: 'center', marginTop: '20px' }}>No layers yet. Add something!</div>}
            </div>
          </div>

          {/* PANEL DE PROPIEDADES DINÁMICO */}
          <div style={{ height: '350px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>PROPERTIES</h3>
            
            {!selectedLayerId ? (
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '50px', height: '30px', border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }} />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', width: '80px', fontSize: '12px', borderRadius: '4px' }} />
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginTop: '20px', lineHeight: '1.5' }}>Tip: Use the toolbar to add text, shapes or import images.</p>
              </div>
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* CHECKBOX PROPORCIONES (General) */}
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedLayer.lockRatio} onChange={e => updateLayer(selectedLayer.id, { lockRatio: e.target.checked })} />
                  Maintain Aspect Ratio
                </label>

                {/* TEXT PROPERTIES */}
                {selectedLayer.type === 'text' && (
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '8px' }}>Text Settings</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} style={{ width: '40px', height: '30px', border: 'none', background: 'transparent' }} />
                      <input type="number" placeholder="Size" value={selectedLayer.fontSize} onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) || 12 })} style={{ flex: 1, background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px' }} />
                    </div>
                    <select value={selectedLayer.fontFamily} onChange={e => updateLayer(selectedLayer.id, { fontFamily: e.target.value })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px', fontSize: '12px' }}>
                      <option value="sans-serif">Sans-Serif (Modern)</option>
                      <option value="serif">Serif (Classic)</option>
                      <option value="monospace">Monospace (Code)</option>
                      <option value="impact">Impact (Bold)</option>
                    </select>
                  </div>
                )}

                {/* SHAPE PROPERTIES */}
                {selectedLayer.type === 'shape' && (
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '8px' }}>Shape Fill Color</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={selectedLayer.fill} onChange={e => updateLayer(selectedLayer.id, { fill: e.target.value })} style={{ width: '40px', height: '30px', border: 'none', background: 'transparent' }} />
                      <input type="text" value={selectedLayer.fill} onChange={e => updateLayer(selectedLayer.id, { fill: e.target.value })} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', width: '80px', fontSize: '12px', borderRadius: '4px' }} />
                    </div>
                  </div>
                )}

                {/* TRANSFORM PROPERTIES (Rotación y Opacidad) */}
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