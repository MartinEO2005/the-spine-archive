import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Circle, Transformer } from 'react-konva';
import useImage from 'use-image';
import { nanoid } from 'nanoid';

// --- TEMA UI ---
const theme = { bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909', border: '#3c3c3c', accent: '#007fd4', text: '#cccccc', textMuted: '#888888' };

// ==========================================
// COMPONENTE: IMAGEN CON TRANSFORMADOR (ROTACIÓN/ESCALA)
// ==========================================
const DesignImage = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  // 'anonymous' evita bloqueos de seguridad en algunas imágenes de internet
  const [img] = useImage(shapeProps.url, 'anonymous'); 

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        image={img}
        draggable
        onDragEnd={(e) => {
          onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(), // La rotación nativa de Konva
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (shapeProps.lockRatio) {
              // Si las proporciones están bloqueadas, Konva lo maneja nativamente si habilitamos enabledAnchors
              return newBox;
            }
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          // Opciones visuales del transformador (Tiradores y Rotación)
          borderStroke={theme.accent}
          anchorStroke={theme.accent}
          anchorFill="#fff"
          anchorSize={12}
          rotateAnchorOffset={40} // Esto aleja el puntito de rotación para que sea más fácil agarrarlo
          rotateEnabled={true} // Obligamos a que se pueda rotar
        />
      )}
    </React.Fragment>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [spineCount, setSpineCount] = useState(1);
  const [spineGap, setSpineGap] = useState(0);
  const [zoom, setZoom] = useState(0.4);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [templateImg] = useImage(`/${template}-template.png`);

  // --- LÓGICA DE CAPAS ---
  const addLayer = (type, props, name) => {
    const newL = { id: nanoid(), type, name: `${name} ${layers.length + 1}`, x: 50, y: 100, width: type === 'text' ? 200 : 150, height: type === 'text' ? 50 : 150, rotation: 0, opacity: 1, visible: true, lockRatio: false, ...props };
    setLayers([...layers, newL]);
    setSelectedId(newL.id);
  };

  const updateLayer = (id, newProps) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...newProps } : l));
  };

  const removeLayer = (id) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateLayer = (id) => {
    const target = layers.find(l => l.id === id);
    if (target) {
      const newL = { ...target, id: nanoid(), name: `${target.name} (Copy)`, x: target.x + 20, y: target.y + 20 };
      setLayers([...layers, newL]);
      setSelectedId(newL.id);
    }
  };

  // Reordenar capas (Konva las dibuja según su orden en el array)
  const moveLayer = (id, direction) => {
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return;
    const newLayers = [...layers];
    
    if (direction === 'up' && index < newLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      setLayers(newLayers);
    } else if (direction === 'down' && index > 0) {
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      setLayers(newLayers);
    }
  };

  // --- ATAJOS Y PEGAR (CTRL+V) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeLayer(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedId) {
        setClipboard(layers.find(l => l.id === selectedId));
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
        duplicateLayer(clipboard.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicateLayer(selectedId);
      }
    };

    const handlePaste = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          addLayer('image', { url: URL.createObjectURL(blob) }, 'Pasted Image');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [selectedId, layers, clipboard]);

  // --- ZOOM ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const dir = e.deltaY < 0 ? 1 : -1;
        setZoom(prev => Math.max(0.1, Math.min(3, Math.round((prev + (dir * 0.1)) * 10) / 10)));
      }
    };
    const container = containerRef.current;
    if (container) container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container && container.removeEventListener('wheel', handleWheel);
  }, []);

  const selectedLayer = layers.find(l => l.id === selectedId);

  // NOTA: Quitado '100vh' y 'position: fixed'. Ahora es 'minHeight: 800px' y fluye en la página.
  return (
    <div style={{ width: '100%', minHeight: '800px', height: '85vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* --- TOOLBAR SUPERIOR --- */}
      <div style={{ flex: '0 0 50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', color: 'white' }}>SPINE STUDIO PRO (CANVAS)</h2>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px', outline: 'none' }}>
            <option value="switch1">Switch V1</option>
            <option value="switch2">Switch V2</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
            <span style={{ fontSize: '12px' }}>Spines:</span>
            <select value={spineCount} onChange={e => setSpineCount(parseInt(e.target.value))} style={{ background: theme.bgApp, color: theme.text, padding: '4px', outline: 'none' }}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select>
            {spineCount > 1 && <><span style={{ fontSize: '12px', marginLeft: '10px' }}>Gap: {spineGap}px</span><input type="range" min="0" max="100" value={spineGap} onChange={e => setSpineGap(parseInt(e.target.value))} style={{ width: '60px' }}/></>}
          </div>
        </div>
        <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}% (Ctrl+Rueda)</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* --- BARRA LATERAL (HERRAMIENTAS) --- */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px' }}>
          <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files[0]) addLayer('image', { url: URL.createObjectURL(e.target.files[0]) }, 'Image'); e.target.value=null; }} style={{ display: 'none' }} />
          <button onClick={() => setSelectedId(null)} title="Cursor" style={{ width: '40px', height: '40px', background: !selectedId ? '#333' : 'transparent', border: 'none', borderRadius: '4px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Añadir Imagen" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={() => addLayer('text', { text: 'TEXTO', fill: '#000000', fontSize: 40, width: 200, height: 50 }, 'Text')} title="Añadir Texto" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
          <button onClick={() => addLayer('shape', { shapeType: 'rect', fill: '#d40000', width: 100, height: 100 }, 'Rect')} title="Añadir Rectángulo" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⬛</button>
        </div>

        {/* --- LIENZO CENTRAL (CANVAS) --- */}
        <div ref={containerRef} style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', position: 'relative' }}>
          <Stage 
            width={window.innerWidth} 
            height={2000} // Alto suficiente para hacer scroll dentro del área de trabajo
            scaleX={zoom} scaleY={zoom}
            onMouseDown={(e) => {
              // Deseleccionar al hacer clic en el fondo vacío del lienzo
              if (e.target === e.target.getStage() || e.target.attrs.id === 'bg-rect') {
                setSelectedId(null);
              }
            }}
            style={{ margin: '50px' }} // Margen interior visual
          >
            <Layer>
              {/* 1. FONDOS DE LOS LOMOS */}
              {[...Array(spineCount)].map((_, i) => (
                <Rect id="bg-rect" key={`bg-${i}`} x={i * (100 + spineGap)} y={0} width={100} height={1533} fill={bgColor} shadowColor="black" shadowBlur={20} shadowOpacity={0.8} />
              ))}

              {/* 2. CAPAS DEL USUARIO (El array define el z-index en Konva) */}
              {layers.map((layer) => {
                if (!layer.visible) return null;
                const props = {
                  ...layer,
                  draggable: true,
                  onClick: () => setSelectedId(layer.id),
                  onTap: () => setSelectedId(layer.id),
                  onDragEnd: (e) => updateLayer(layer.id, { x: e.target.x(), y: e.target.y() })
                };

                if (layer.type === 'image') return <DesignImage key={layer.id} shapeProps={layer} isSelected={layer.id === selectedId} onSelect={() => setSelectedId(layer.id)} onChange={(newProps) => updateLayer(layer.id, newProps)} />;
                if (layer.type === 'text') return <KonvaText key={layer.id} {...props} text={layer.text} fontSize={layer.fontSize} fill={layer.fill} />;
                if (layer.type === 'shape') return <Rect key={layer.id} {...props} fill={layer.fill} />;
                return null;
              })}

              {/* 3. PLANTILLAS TRANSPARENTES (Siempre arriba, bloquean eventos de ratón para no estorbar) */}
              {templateImg && [...Array(spineCount)].map((_, i) => (
                <KonvaImage key={`tpl-${i}`} image={templateImg} x={i * (100 + spineGap)} y={0} width={100} height={1533} listening={false} />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* --- PANEL DERECHO (CAPAS Y PROPIEDADES) --- */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>CAPAS</h3></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {/* Lista invertida visualmente para que la última añadida salga arriba */}
              {[...layers].reverse().map(l => (
                <div key={l.id} onClick={() => setSelectedId(l.id)} style={{ padding: '8px', marginBottom: '5px', backgroundColor: selectedId === l.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <button onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { visible: !l.visible }); }} style={{ background: 'transparent', border: 'none', color: l.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px' }}>{l.visible ? '👁️' : '🕶️'}</button>
                  <span style={{ fontSize: '14px', margin: '0 10px' }}>{l.type === 'image' ? '🖼️' : l.type === 'text' ? 'T' : '⬛'}</span>
                  <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                  
                  {/* BOTONES DE CAPAS RESTAURADOS */}
                  {selectedId === l.id && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); duplicateLayer(l.id); }} title="Duplicar" style={{ background: '#444', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer', padding: '2px 5px' }}>📄</button>
                      {/* Nota: Como mostramos la lista invertida, subir visualmente significa mover 'down' en el array */}
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 'up'); }} title="Traer al frente" style={{ background: '#333', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer', padding: '2px 5px' }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 'down'); }} title="Enviar al fondo" style={{ background: '#333', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer', padding: '2px 5px' }}>▼</button>
                      <button onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }} title="Borrar" style={{ background: '#b30000', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer', padding: '2px 5px' }}>✖</button>
                    </div>
                  )}
                </div>
              ))}
              {layers.length === 0 && <p style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>No hay capas.</p>}
            </div>
          </div>

          <div style={{ height: '350px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>PROPIEDADES</h3>
            {!selectedId ? (
              <div>
                <label style={{ fontSize: '12px' }}>Color Fondo Lomo</label><br/>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ marginTop: '10px', cursor: 'pointer', border: 'none', background: 'transparent' }}/>
              </div>
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {selectedLayer.type === 'text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                    <input type="text" value={selectedLayer.text} onChange={e => updateLayer(selectedId, { text: e.target.value })} style={{ padding: '8px', background: '#111', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="color" value={selectedLayer.fill} onChange={e => updateLayer(selectedId, { fill: e.target.value })} style={{ cursor: 'pointer' }} />
                      <input type="number" placeholder="Tamaño" value={selectedLayer.fontSize} onChange={e => updateLayer(selectedId, { fontSize: parseInt(e.target.value) || 20 })} style={{ width: '60px', background: '#111', color: 'white', border: '1px solid #444', borderRadius: '4px' }} />
                    </div>
                  </div>
                )}
                
                {selectedLayer.type === 'shape' && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px' }}>Color de Forma</label>
                    <input type="color" value={selectedLayer.fill} onChange={e => updateLayer(selectedId, { fill: e.target.value })} style={{ cursor: 'pointer' }} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacidad (0-1)</label>
                    <input type="number" step="0.1" min="0" max="1" value={selectedLayer.opacity} onChange={e => updateLayer(selectedId, { opacity: parseFloat(e.target.value) || 1 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotación (°)</label>
                    <input type="number" value={Math.round(selectedLayer.rotation)} onChange={e => updateLayer(selectedId, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px', borderRadius: '4px' }} />
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