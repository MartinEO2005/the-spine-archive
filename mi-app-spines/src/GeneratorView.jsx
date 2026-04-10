import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// --- TEMA UI ---
const theme = { bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909', border: '#3c3c3c', accent: '#007fd4', text: '#cccccc', textMuted: '#888888', handle: '#ffffff' };

// --- TIRADORES DE REDIMENSIÓN GIGANTES ---
const handleSize = '20px'; // Aumentado para mayor accesibilidad
const customHandle = { width: handleSize, height: handleSize, background: '#fff', border: `4px solid ${theme.accent}`, borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.6)', pointerEvents: 'auto' };
const resizeHandleStyles = {
  bottomRight: { ...customHandle, right: '-10px', bottom: '-10px' },
  bottomLeft: { ...customHandle, left: '-10px', bottom: '-10px' },
  topRight: { ...customHandle, right: '-10px', top: '-10px' },
  topLeft: { ...customHandle, left: '-10px', top: '-10px' },
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [zoom, setZoom] = useState(0.4); 
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  
  // NUEVO: Estado para saber si estamos en modo Recorte Visual
  const [croppingLayerId, setCroppingLayerId] = useState(null);

  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- ATAJOS DE TECLADO ---
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, clipboard]);

  // --- ZOOM ESCALONADO ---
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

  const addLayer = (type, props, name) => {
    const newL = { 
      id: nanoid(), type, name: `${name} ${layers.length + 1}`, 
      x: 0, y: 500, width: type==='text'?200:150, height: type==='text'?60:150, 
      rotation: 0, opacity: 100, visible: true, lockRatio: false, 
      crop: { top: 0, right: 0, bottom: 0, left: 0 }, 
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10, ...props 
    };
    setLayers([...layers, newL]); setSelectedLayerId(newL.id); setPreviewMode(false); setCroppingLayerId(null);
  };

  const updateLayer = (id, newProps) => setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ height: '50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <h2 style={{ margin: 0, fontSize: '14px', color: 'white' }}>SPINE STUDIO PRO</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}%</span>
          <button onClick={() => {setPreviewMode(!previewMode); setCroppingLayerId(null);}} style={{ padding: '8px 15px', background: previewMode ? theme.accent : 'transparent', color: 'white', border: `1px solid ${theme.accent}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            {previewMode ? '✏️ EDIT' : '👁️ PREVIEW CROP'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* BARRA LATERAL */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', zIndex: 50 }}>
          <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files[0]) addLayer('image', {url: URL.createObjectURL(e.target.files[0])}, 'File'); e.target.value=null; }} style={{ display: 'none' }} />
          <button onClick={() => {setSelectedLayerId(null); setCroppingLayerId(null);}} title="Select (V)" style={{ width: '40px', height: '40px', background: !selectedLayerId ? '#333' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Import Image (I)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={() => addLayer('text', { text: 'TEXT', color: '#000', fontSize: 32, fontFamily: 'sans-serif' }, 'Text')} title="Add Text (T)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
        </div>

        {/* WORKSPACE */}
        <div ref={workspaceRef} onClick={(e) => { if(e.target.id==='workspace-bg') {setSelectedLayerId(null); setCroppingLayerId(null);} }} id="workspace-bg" style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', display: 'flex', position: 'relative' }}>
          <div style={{ margin: 'auto', padding: '150px' }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', width: '100px', height: '1533px', backgroundColor: bgColor, position: 'relative', overflow: previewMode ? 'hidden' : 'visible', boxShadow: '0 0 40px rgba(0,0,0,1)' }}>
              
              {!previewMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 99998 }} />}

              {[...layers].sort((a,b) => a.zIndex - b.zIndex).map((layer) => layer.visible && (
                <Rnd key={layer.id} size={{ width: layer.width, height: layer.height }} position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => updateLayer(layer.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) => updateLayer(layer.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                  disableDragging={selectedLayerId !== layer.id || previewMode || croppingLayerId === layer.id} 
                  enableResizing={selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id} 
                  lockAspectRatio={layer.lockRatio}
                  resizeHandleStyles={selectedLayerId === layer.id && croppingLayerId !== layer.id ? resizeHandleStyles : {}}
                  style={{ zIndex: layer.zIndex, opacity: layer.opacity / 100, outline: (selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id) ? `3px solid ${theme.accent}` : 'none' }}
                  onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedLayerId(layer.id); }}
                >
                  <div id={`layer-content-${layer.id}`} style={{ width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)`, position: 'relative' }}>
                    
                    {layer.type === 'image' && (
                      <div style={{ position: 'relative', width: '100%', height: '100%', border: croppingLayerId === layer.id ? '3px dashed #00ff00' : 'none' }}>
                        <img 
                          src={layer.url} 
                          style={{ width: '100%', height: '100%', objectFit: 'fill', clipPath: `inset(${layer.crop.top}% ${layer.crop.right}% ${layer.crop.bottom}% ${layer.crop.left}%)`, pointerEvents: 'none' }} 
                          draggable="false" alt="" 
                        />
                        {/* CONTROLES VISUALES DE RECORTE (Solo visibles si se pulsa "Crop") */}
                        {croppingLayerId === layer.id && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }}>
                             <input type="range" min="0" max="100" value={layer.crop.top} onChange={e => updateLayer(layer.id, { crop: { ...layer.crop, top: parseInt(e.target.value) } })} style={{ width: '100%', margin: '-10px 0 0 0', cursor: 'ns-resize' }} title="Recortar Arriba" />
                             <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                               <input type="range" min="0" max="100" value={layer.crop.left} onChange={e => updateLayer(layer.id, { crop: { ...layer.crop, left: parseInt(e.target.value) } })} style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '20px', margin: '0 0 0 -10px', cursor: 'ew-resize' }} title="Recortar Izquierda" />
                               <input type="range" min="0" max="100" value={layer.crop.right} onChange={e => updateLayer(layer.id, { crop: { ...layer.crop, right: parseInt(e.target.value) } })} style={{ writingMode: 'vertical-lr', width: '20px', margin: '0 -10px 0 0', cursor: 'ew-resize' }} title="Recortar Derecha" />
                             </div>
                             <input type="range" min="0" max="100" value={layer.crop.bottom} onChange={e => updateLayer(layer.id, { crop: { ...layer.crop, bottom: parseInt(e.target.value) } })} style={{ width: '100%', margin: '0 0 -10px 0', cursor: 'ns-resize' }} title="Recortar Abajo" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {layer.type === 'text' && <textarea value={layer.text} onChange={e => updateLayer(layer.id, { text: e.target.value })} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: layer.color, fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, resize: 'none', textAlign: 'center', outline: 'none' }} />}
                    
                    {/* TIRADOR DE ROTACIÓN */}
                    {(selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id) && (
                      <>
                        <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '3px', height: '25px', backgroundColor: theme.accent }} />
                        <div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', width: '18px', height: '18px', backgroundColor: 'white', border: `4px solid ${theme.accent}`, borderRadius: '50%', cursor: 'grab' }} title="Rotate" />
                      </>
                    )}
                  </div>
                </Rnd>
              ))}
              <img src={`/${template}-template.png`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, pointerEvents: 'none' }} alt="" />
            </div>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          <div style={{ height: '400px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted }}>PROPERTIES</h3>
            
            {!selectedLayerId ? (
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: theme.text }}>
                  <input type="checkbox" checked={selectedLayer.lockRatio} onChange={e => updateLayer(selectedLayer.id, { lockRatio: e.target.checked })} />
                  Maintain Aspect Ratio
                </label>

                {selectedLayer.type === 'image' && (
                  <button 
                    onClick={() => setCroppingLayerId(croppingLayerId === selectedLayer.id ? null : selectedLayer.id)} 
                    style={{ padding: '10px', background: croppingLayerId === selectedLayer.id ? '#00ff00' : '#444', color: croppingLayerId === selectedLayer.id ? '#000' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {croppingLayerId === selectedLayer.id ? '✅ FINISH CROP' : '✂️ VISUAL CROP'}
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotation (°)</label>
                    <input type="number" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, padding: '6px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacity (%)</label>
                    <input type="number" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, padding: '6px' }} />
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