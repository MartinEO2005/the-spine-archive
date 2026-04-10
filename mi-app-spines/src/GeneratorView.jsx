import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

const theme = {
  bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909',
  border: '#3c3c3c', accent: '#007fd4', text: '#cccccc',
  textMuted: '#888888', handle: '#ffffff',
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
      // Borrar capa con la tecla Suprimir o Backspace (si no estamos escribiendo texto)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          removeLayer(selectedLayerId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers]);

  // --- ZOOM ---
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

  // --- CREACIÓN DE ELEMENTOS (IMAGEN, TEXTO, FORMA) ---
  const addLayer = (type, extraProps = {}, namePrefix) => {
    const newLayer = {
      id: nanoid(),
      type: type, // 'image', 'text', 'shape'
      name: `${namePrefix} ${layers.length + 1}`,
      x: 0, y: 500, width: type === 'text' ? 200 : 100, height: type === 'text' ? 50 : 100,
      rotation: 0, opacity: 100, visible: true, lockRatio: type === 'image',
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10,
      ...extraProps
    };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
    setPreviewMode(false);
  };

  const addImageToCanvas = (src, name = 'Image') => addLayer('image', { url: src }, name);
  const addTextToCanvas = () => addLayer('text', { text: 'New Text', color: '#000000', fontSize: 24, fontFamily: 'Arial' }, 'Text');
  const addShapeToCanvas = (shapeType) => addLayer('shape', { shapeType: shapeType, fill: '#ff0000' }, shapeType === 'rect' ? 'Rectangle' : 'Circle');

  // --- EVENTOS DE IMPORTACIÓN ---
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      addImageToCanvas(URL.createObjectURL(e.target.files[0]), 'Upload');
      e.target.value = null; 
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => { if (file.type.startsWith('image/')) addImageToCanvas(URL.createObjectURL(file), 'Local'); });
      return;
    }
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) { addImageToCanvas(match[1], 'Web'); return; }
    }
  };

  // --- GESTIÓN DE CAPAS ARREGLADA ---
  const updateLayer = (id, newProps) => setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));

  const moveLayerZIndex = (id, direction) => {
    const layerToMove = layers.find(l => l.id === id);
    if (!layerToMove) return;

    // Ordenamos las capas por zIndex para saber quién está arriba/abajo
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const currentIndex = sortedLayers.findIndex(l => l.id === id);

    if (direction === 'up' && currentIndex < sortedLayers.length - 1) {
      const layerAbove = sortedLayers[currentIndex + 1];
      updateLayer(id, { zIndex: layerAbove.zIndex });
      updateLayer(layerAbove.id, { zIndex: layerToMove.zIndex });
    } else if (direction === 'down' && currentIndex > 0) {
      const layerBelow = sortedLayers[currentIndex - 1];
      updateLayer(id, { zIndex: layerBelow.zIndex });
      updateLayer(layerBelow.id, { zIndex: layerToMove.zIndex });
    }
  };

  const removeLayer = (id) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // --- RENDERIZADO DEL CONTENIDO DE LA CAPA ---
  const renderLayerContent = (layer) => {
    if (layer.type === 'image') {
      return <img src={layer.url} alt="" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />;
    }
    if (layer.type === 'text') {
      return (
        <textarea 
          value={layer.text} 
          onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
          style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: layer.color, fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, resize: 'none', overflow: 'hidden', textAlign: 'center', display: 'flex', outline: 'none' }} 
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
      
      {/* TOOLBAR */}
      <div style={{ height: '50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'white' }}>SPINE STUDIO PRO</h2>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px', fontSize: '12px' }}>
            <option value="switch1">Switch V1</option><option value="switch2">Switch V2</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => { setPreviewMode(!previewMode); setSelectedLayerId(null); }} style={{ padding: '8px 15px', background: previewMode ? theme.accent : 'transparent', color: 'white', border: `1px solid ${theme.accent}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            {previewMode ? '✏️ EDIT' : '👁️ PREVIEW'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* BARRA DE HERRAMIENTAS (IZQUIERDA) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', zIndex: 50, gap: '10px' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
          
          <button onClick={() => setSelectedLayerId(null)} title="Select (V)" style={{ width: '40px', height: '40px', background: !selectedLayerId ? '#333' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Image (I)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={addTextToCanvas} title="Text (T)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
          <button onClick={() => addShapeToCanvas('rect')} title="Rectangle (U)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⬛</button>
          <button onClick={() => addShapeToCanvas('circle')} title="Circle (O)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⚫</button>
        </div>

        {/* LIENZO */}
        <div id="workspace-bg" ref={workspaceRef} onClick={(e) => { if(e.target.id==='workspace-bg' || e.target.id==='workspace-container') setSelectedLayerId(null); }} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', display: 'flex' }}>
          <div id="workspace-container" style={{ margin: 'auto', padding: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', width: '100px', height: '1533px', backgroundColor: bgColor, boxShadow: '0 0 40px rgba(0,0,0,1)', position: 'relative', overflow: previewMode ? 'hidden' : 'visible' }}>
              
              {!previewMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 99998 }} />}

              {/* ORDENAMOS POR zIndex PARA RENDERIZAR */}
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
                  <div style={{ width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)`, position: 'relative' }}>
                    {renderLayerContent(layer)}
                  </div>
                </Rnd>
              ))}

              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, pointerEvents: 'none' }}>
                <img src={`/${template}-template.png`} alt="Template" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO (CAPAS Y PROPIEDADES) */}
        <div style={{ width: '300px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>LAYERS</h3></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {/* LISTA DE CAPAS VISUAL (Las de mayor zIndex arriba) */}
              {[...layers].sort((a,b) => b.zIndex - a.zIndex).map((layer) => (
                <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '16px', marginRight: '10px' }}>{layer.type === 'image' ? '🖼️' : layer.type === 'text' ? 'T' : '⬛'}</span>
                  <span style={{ fontSize: '12px', flex: 1 }}>{layer.name}</span>
                  {selectedLayerId === layer.id && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'up'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer' }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'down'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer' }}>▼</button>
                      <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} style={{ background: '#b30000', border: 'none', color: 'white', cursor: 'pointer' }}>✖</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '350px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted }}>PROPERTIES</h3>
            {!selectedLayerId ? (
               <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* PROPIEDADES DE TEXTO */}
                {selectedLayer.type === 'text' && (
                  <>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Color / Font Size</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} style={{ width: '40px' }} />
                      <input type="number" value={selectedLayer.fontSize} onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })} style={{ width: '60px' }} />
                    </div>
                  </>
                )}

                {/* PROPIEDADES DE FORMA */}
                {selectedLayer.type === 'shape' && (
                  <>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Fill Color</label>
                    <input type="color" value={selectedLayer.fill} onChange={e => updateLayer(selectedLayer.id, { fill: e.target.value })} />
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotation (°)</label>
                    <input type="number" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, padding: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacity (%)</label>
                    <input type="number" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, padding: '4px' }} />
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