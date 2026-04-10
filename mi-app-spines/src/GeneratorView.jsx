import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// ==========================================
// 1. TEMA VISUAL (Estilo Photoshop Dark)
// ==========================================
const theme = {
  bgApp: '#1e1e1e',
  bgPanel: '#252526',
  bgCanvas: '#090909',
  border: '#3c3c3c',
  accent: '#007fd4',
  text: '#cccccc',
  textMuted: '#888888',
};

// ==========================================
// 2. COMPONENTE: PANEL DERECHO (Capas y Propiedades)
// ==========================================
const StudioRightPanel = ({ layers, selectedLayerId, setSelectedLayerId, updateLayer, moveLayerZIndex, removeLayer, duplicateLayer, bgColor, setBgColor }) => {
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      
      {/* --- LISTA DE CAPAS --- */}
      <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>LAYERS (CAPAS)</h3></div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {[...layers].sort((a, b) => b.zIndex - a.zIndex).map((layer) => (
            <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
              <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
              <span style={{ fontSize: '16px', margin: '0 10px' }}>{layer.type === 'image' ? '🖼️' : layer.type === 'text' ? 'T' : '⬛'}</span>
              <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{layer.name}</span>
              
              {/* Controles de la capa seleccionada */}
              {selectedLayerId === layer.id && (
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} title="Duplicate (Ctrl+D)" style={{ background: '#444', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>📄</button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'up'); }} title="Bring Forward" style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'down'); }} title="Send Backward" style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▼</button>
                  <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} title="Delete (Supr)" style={{ background: '#b30000', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>✖</button>
                </div>
              )}
            </div>
          ))}
          {layers.length === 0 && <p style={{fontSize:'12px', color:'#666', textAlign:'center', marginTop:'20px'}}>No layers yet.</p>}
        </div>
      </div>

      {/* --- PANEL DE PROPIEDADES --- */}
      <div style={{ height: '350px', padding: '15px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted }}>PROPERTIES (PROPIEDADES)</h3>
        
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

            {/* Propiedades de Texto */}
            {selectedLayer.type === 'text' && (
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '8px' }}>Text Settings</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} style={{ width: '40px', cursor: 'pointer' }} />
                  <input type="number" placeholder="Size" value={selectedLayer.fontSize} onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) || 12 })} style={{ flex: 1, background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px' }} />
                </div>
                <select value={selectedLayer.fontFamily} onChange={e => updateLayer(selectedLayer.id, { fontFamily: e.target.value })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px', fontSize: '12px' }}>
                  <option value="sans-serif">Sans-Serif (Modern)</option>
                  <option value="serif">Serif (Classic)</option>
                  <option value="impact">Impact (Bold)</option>
                  <option value="monospace">Monospace (Code)</option>
                </select>
              </div>
            )}

            {/* Propiedades de Formas */}
            {selectedLayer.type === 'shape' && (
               <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                 <label style={{ fontSize: '10px', color: theme.textMuted, display: 'block', marginBottom: '8px' }}>Shape Color</label>
                 <input type="color" value={selectedLayer.fill} onChange={e => updateLayer(selectedLayer.id, { fill: e.target.value })} style={{ width: '100%', height: '30px', cursor: 'pointer' }} />
               </div>
            )}

            {/* Transformaciones (Rotación y Opacidad) */}
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
  );
};

// ==========================================
// 3. COMPONENTE PRINCIPAL (WORKSPACE)
// ==========================================
const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [zoom, setZoom] = useState(0.4); 
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ATAJOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Borrar (Suprimir / Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          setLayers(prev => prev.filter(l => l.id !== selectedLayerId));
          setSelectedLayerId(null);
        }
      }
      // Duplicar (Ctrl + D)
      if (e.ctrlKey && e.key === 'd' && selectedLayerId) {
        e.preventDefault();
        duplicateLayer(selectedLayerId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers]);

  // --- ZOOM CON RATÓN ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) { 
        e.preventDefault(); 
        setZoom(p => Math.min(Math.max(0.1, p + (e.deltaY * -0.002)), 4)); 
      }
    };
    if (workspaceRef.current) workspaceRef.current.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspaceRef.current?.removeEventListener('wheel', handleWheel);
  }, []);

  // --- DUPLICAR CAPA ---
  const duplicateLayer = (id) => {
    const layerToCopy = layers.find(l => l.id === id);
    if (!layerToCopy) return;
    const newLayer = {
      ...layerToCopy,
      id: nanoid(),
      name: `${layerToCopy.name} Copy`,
      x: layerToCopy.x + 30, // Desfase visual
      y: layerToCopy.y + 30,
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

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
      setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, rotation: Math.round(angle) } : l));
    };
    const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
  };

  // --- CREADORES Y ACTUALIZADORES ---
  const addLayer = (type, props, name) => {
    const newL = { 
      id: nanoid(), type, name: `${name} ${layers.length + 1}`, 
      x: 0, y: 500, width: type==='text'?200:150, height: type==='text'?60:150, 
      rotation: 0, opacity: 100, visible: true, lockRatio: type==='image', 
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
          <button style={{ padding: '8px 25px', background: 'white', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            EXPORT (SOON)
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
            
            {/* LOMO DE LA SWITCH */}
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', width: '100px', height: '1533px', backgroundColor: bgColor, position: 'relative', overflow: previewMode ? 'hidden' : 'visible', boxShadow: '0 0 40px rgba(0,0,0,1)' }}>
              
              {!previewMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 99998 }} />}

              {/* RENDER DE CAPAS */}
              {[...layers].sort((a,b) => a.zIndex - b.zIndex).map((layer) => layer.visible && (
                <Rnd key={layer.id} size={{ width: layer.width, height: layer.height }} position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => setLayers(layers.map(l => l.id === layer.id ? { ...l, x: d.x, y: d.y } : l))}
                  onResizeStop={(e, dir, ref, delta, pos) => setLayers(layers.map(l => l.id === layer.id ? { ...l, width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos } : l))}
                  disableDragging={selectedLayerId !== layer.id || previewMode} enableResizing={selectedLayerId === layer.id && !previewMode} lockAspectRatio={layer.lockRatio}
                  style={{ zIndex: layer.zIndex, opacity: layer.opacity / 100, outline: (selectedLayerId === layer.id && !previewMode) ? `2px solid ${theme.accent}` : 'none' }}
                  onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedLayerId(layer.id); }}
                >
                  <div id={`layer-content-${layer.id}`} style={{ width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)`, position: 'relative' }}>
                    {layer.type === 'image' && <img src={layer.url} style={{ width: '100%', height: '100%' }} draggable="false" alt="" />}
                    {layer.type === 'text' && <textarea value={layer.text} onChange={e => setLayers(layers.map(l=>l.id===layer.id?{...l, text: e.target.value}:l))} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: layer.color, fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, resize: 'none', textAlign: 'center', outline: 'none' }} />}
                    {layer.type === 'shape' && <div style={{ width: '100%', height: '100%', backgroundColor: layer.fill, borderRadius: layer.shapeType === 'circle' ? '50%' : '0' }} />}
                    
                    {/* TIRADOR DE ROTACIÓN */}
                    {(selectedLayerId === layer.id && !previewMode) && (
                      <div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', backgroundColor: 'white', border: `2px solid ${theme.accent}`, borderRadius: '50%', cursor: 'crosshair' }} />
                    )}
                  </div>
                </Rnd>
              ))}
              
              <img src={`/${template}-template.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, pointerEvents: 'none' }} alt="" />
            </div>
          </div>
        </div>

        {/* --- PANEL DERECHO (IMPORTADO INTERNAMENTE) --- */}
        <StudioRightPanel 
          layers={layers} selectedLayerId={selectedLayerId} setSelectedLayerId={setSelectedLayerId} 
          updateLayer={(id, props) => setLayers(layers.map(l => l.id === id ? { ...l, ...props } : l))}
          moveLayerZIndex={moveLayerZIndex} removeLayer={(id) => {setLayers(layers.filter(l => l.id !== id)); setSelectedLayerId(null);}}
          duplicateLayer={duplicateLayer} bgColor={bgColor} setBgColor={setBgColor}
        />

      </div>
    </div>
  );
};

export default GeneratorView;