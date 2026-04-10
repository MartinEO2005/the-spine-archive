import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

const theme = {
  bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909',
  border: '#3c3c3c', accent: '#007fd4', text: '#cccccc', textMuted: '#888888'
};

const handleStyle = {
  width: '14px', height: '14px', background: '#fff',
  border: `2px solid ${theme.accent}`, borderRadius: '50%',
  boxShadow: '0 2px 4px rgba(0,0,0,0.5)', pointerEvents: 'auto'
};
const resizeHandleStyles = {
  bottomRight: { ...handleStyle, right: '-7px', bottom: '-7px' },
  bottomLeft: { ...handleStyle, left: '-7px', bottom: '-7px' },
  topRight: { ...handleStyle, right: '-7px', top: '-7px' },
  topLeft: { ...handleStyle, left: '-7px', top: '-7px' },
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [spineCount, setSpineCount] = useState(1); 
  const [spineGap, setSpineGap] = useState(0); // NUEVO: Distancia entre lomos
  
  const [zoom, setZoom] = useState(0.4); 
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  
  const [previewMode, setPreviewMode] = useState(false);
  const [croppingLayerId, setCroppingLayerId] = useState(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 }); 

  const [clipboard, setClipboard] = useState(null);
  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- BLOQUEADOR ABSOLUTO DE SCROLL EXTERIOR ---
  useEffect(() => {
    // Esto fuerza al navegador a eliminar la barra de scroll de tu página principal
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  // --- ATAJOS ---
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

  // --- ZOOM ---
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

  const addLayer = (type, props, name) => {
    const newL = { 
      id: nanoid(), type, name: `${name} ${layers.length + 1}`, 
      x: 0, y: 500, width: type==='text'?200:150, height: type==='text'?60:150, 
      rotation: 0, opacity: 100, visible: true, lockRatio: false, cropMask: null, 
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10, ...props 
    };
    setLayers([...layers, newL]); setSelectedLayerId(newL.id); setPreviewMode(false);
  };

  const updateLayer = (id, newProps) => setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));

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

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => { if (file.type.startsWith('image/')) addLayer('image', { url: URL.createObjectURL(file) }, 'Local File'); });
      return;
    }
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) { addLayer('image', { url: match[1] }, 'Web Image'); return; }
    }
    const url = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/plain');
    if (url && (url.match(/^http/) || url.match(/^data:image/))) addLayer('image', { url: url }, 'URL Image');
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  
  // Cálculo dinámico del ancho total del lienzo incluyendo los huecos (gaps)
  const canvasWidth = (spineCount * 100) + ((spineCount - 1) * spineGap);

  // El position 'fixed' y zIndex 9999 asegura que sobreescriba cualquier cosa de tu web
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif' }}>
      
      {/* TOOLBAR SUPERIOR */}
      <div style={{ flex: '0 0 50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', color: 'white', letterSpacing: '1px' }}>SPINE STUDIO PRO</h2>
          
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px', outline: 'none' }}>
            <option value="switch1">Template: Switch V1</option>
            <option value="switch2">Template: Switch V2</option>
          </select>
          
          {/* SELECTORES DE MULTI-SPINE Y GAP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '12px', color: theme.textMuted }}>Spines:</span>
              <select value={spineCount} onChange={e => setSpineCount(parseInt(e.target.value))} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px', outline: 'none' }}>
                {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>
            
            {spineCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '12px', color: theme.textMuted }}>Gap: {spineGap}px</span>
                <input type="range" min="0" max="100" value={spineGap} onChange={e => setSpineGap(parseInt(e.target.value))} style={{ width: '80px' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}%</span>
          <button onClick={() => {setPreviewMode(!previewMode); setCroppingLayerId(null);}} style={{ padding: '8px 15px', background: previewMode ? theme.accent : 'transparent', color: 'white', border: `1px solid ${theme.accent}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            {previewMode ? '✏️ VOLVER A EDITAR' : '👁️ VISTA PREVIA (CROP)'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* BARRA LATERAL */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', zIndex: 50 }}>
          <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files[0]) addLayer('image', { url: URL.createObjectURL(e.target.files[0]) }, 'Image'); e.target.value=null; }} style={{ display: 'none' }} />
          <button onClick={() => {setSelectedLayerId(null); setCroppingLayerId(null);}} title="Select Tool (V)" style={{ width: '40px', height: '40px', background: !selectedLayerId ? '#333' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Import Image (I)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={() => addLayer('text', { text: 'NUEVO TEXTO', color: '#000', fontSize: 32, fontFamily: 'sans-serif' }, 'Text')} title="Add Text (T)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
        </div>

        {/* LIENZO (WORKSPACE) */}
        <div ref={workspaceRef} onClick={(e) => { if(e.target.id==='workspace-bg') {setSelectedLayerId(null); setCroppingLayerId(null);} }} id="workspace-bg" onDragOver={e=>e.preventDefault()} onDrop={handleDrop} style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', display: 'flex', position: 'relative' }}>
          <div style={{ margin: 'auto', padding: '150px' }}>
            
            {/* CONTENEDOR MULTI-LOMO TRANSPARENTE */}
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', width: `${canvasWidth}px`, height: '1533px', position: 'relative', overflow: previewMode ? 'hidden' : 'visible' }}>
              
              {/* FONDOS Y PLANTILLAS DE CADA LOMO */}
              {[...Array(spineCount)].map((_, i) => {
                const leftPos = i * (100 + spineGap);
                return (
                  <div key={`bg-${i}`} style={{ position: 'absolute', top: 0, left: `${leftPos}px`, width: '100px', height: '100%', backgroundColor: bgColor, boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}>
                    {!previewMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px dashed rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 99998 }} />}
                  </div>
                );
              })}

              {/* CAPAS DE USUARIO (Pueden atravesar los lomos) */}
              {[...layers].sort((a,b) => a.zIndex - b.zIndex).map((layer) => layer.visible && (
                <Rnd key={layer.id} size={{ width: layer.width, height: layer.height }} position={{ x: layer.x, y: layer.y }}
                  onDragStop={(e, d) => updateLayer(layer.id, { x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, pos) => updateLayer(layer.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })}
                  disableDragging={previewMode || croppingLayerId === layer.id} 
                  enableResizing={selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id} 
                  lockAspectRatio={layer.lockRatio}
                  resizeHandleStyles={selectedLayerId === layer.id ? resizeHandleStyles : {}}
                  style={{ zIndex: layer.zIndex, opacity: layer.opacity / 100, outline: (selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id) ? `2px solid ${theme.accent}` : 'none' }}
                  onClick={(e) => { e.stopPropagation(); if (!previewMode) setSelectedLayerId(layer.id); }}
                >
                  <div id={`layer-content-${layer.id}`} style={{ position: 'relative', width: '100%', height: '100%', transform: `rotate(${layer.rotation}deg)` }}>
                    {layer.type === 'image' && (
                      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                        <img src={layer.url} style={{ width: '100%', height: '100%', objectFit: 'fill', clipPath: (layer.cropMask && croppingLayerId !== layer.id) ? `inset(${layer.cropMask.y}px ${layer.width - (layer.cropMask.x + layer.cropMask.width)}px ${layer.height - (layer.cropMask.y + layer.cropMask.height)}px ${layer.cropMask.x}px)` : 'none', opacity: croppingLayerId === layer.id ? 0.4 : 1 }} draggable="false" alt="" />
                        
                        {croppingLayerId === layer.id && (
                          <Rnd bounds="parent" size={{ width: cropBox.width, height: cropBox.height }} position={{ x: cropBox.x, y: cropBox.y }} onDrag={(e, d) => setCropBox({ ...cropBox, x: d.x, y: d.y })} onResize={(e, dir, ref, delta, pos) => setCropBox({ width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...pos })} style={{ border: '2px dashed #ff0000', backgroundColor: 'rgba(255,0,0,0.1)', zIndex: 10 }}>
                             <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                               <img src={layer.url} style={{ position: 'absolute', top: -cropBox.y, left: -cropBox.x, width: layer.width, height: layer.height, objectFit: 'fill' }} alt="" />
                             </div>
                          </Rnd>
                        )}
                        
                        {(selectedLayerId === layer.id && !previewMode && croppingLayerId !== layer.id) && (
                          <>
                            <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '25px', backgroundColor: theme.accent }} />
                            <div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', backgroundColor: 'white', border: `3px solid ${theme.accent}`, borderRadius: '50%', cursor: 'grab' }} />
                          </>
                        )}
                      </div>
                    )}
                    
                    {layer.type === 'text' && (
                      <>
                        <textarea value={layer.text} onChange={e => updateLayer(layer.id, { text: e.target.value })} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: layer.color, fontSize: `${layer.fontSize}px`, fontFamily: layer.fontFamily, resize: 'none', textAlign: 'center', outline: 'none' }} />
                        {(selectedLayerId === layer.id && !previewMode) && (<div onMouseDown={(e) => handleRotateStart(e, layer)} style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', backgroundColor: 'white', border: `3px solid ${theme.accent}`, borderRadius: '50%', cursor: 'grab' }} />)}
                      </>
                    )}
                  </div>
                </Rnd>
              ))}
              
              {/* MÁSCARAS DE PLANTILLA POR CADA LOMO */}
              {[...Array(spineCount)].map((_, i) => (
                <img key={`tpl-${i}`} src={`/${template}-template.png`} style={{ position: 'absolute', top: 0, left: `${i * (100 + spineGap)}px`, width: '100px', height: '100%', zIndex: 99999, pointerEvents: 'none' }} alt="" />
              ))}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>LAYERS</h3></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {[...layers].sort((a,b) => b.zIndex - a.zIndex).map((layer) => (
                <div key={layer.id} onClick={() => {setSelectedLayerId(layer.id); setCroppingLayerId(null);}} style={{ display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '5px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
                  <span style={{ fontSize: '16px', margin: '0 10px' }}>{layer.type === 'image' ? '🖼️' : 'T'}</span>
                  <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{layer.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '400px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted }}>PROPERTIES</h3>
            {!selectedLayerId ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '40px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }} />
              </div>
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', color: theme.text }}>
                  <input type="checkbox" checked={selectedLayer.lockRatio} onChange={e => updateLayer(selectedLayer.id, { lockRatio: e.target.checked })} />
                  Mantener Proporciones
                </label>
                {selectedLayer.type === 'image' && (
                  <button onClick={() => croppingLayerId === selectedLayer.id ? setCroppingLayerId(null) : setCroppingLayerId(selectedLayer.id)} style={{ padding: '12px', background: croppingLayerId === selectedLayer.id ? '#00ff00' : '#444', color: croppingLayerId === selectedLayer.id ? '#000' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {croppingLayerId === selectedLayer.id ? '✅ APLICAR CROP' : '✂️ ACTIVAR RECORTE VISUAL'}
                  </button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotación (°)</label>
                    <input type="number" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, padding: '6px', borderRadius: '4px' }} />
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