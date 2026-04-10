import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Circle, Transformer } from 'react-konva';
import useImage from 'use-image';
import { nanoid } from 'nanoid';

// --- TEMA UI ---
const theme = { bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909', border: '#3c3c3c', accent: '#007fd4', text: '#cccccc', textMuted: '#888888' };

// ==========================================
// COMPONENTES KONVA (IMAGEN Y TRANSFORMADOR)
// ==========================================
const DesignImage = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();
  // 'anonymous' ayuda a evitar bloqueos CORS en algunas imágenes de internet
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
          // Konva escala visualmente, nosotros actualizamos el ancho/alto real y reseteamos escala
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          borderStroke={theme.accent}
          anchorStroke={theme.accent}
          anchorFill="#fff"
          anchorSize={10}
          rotateAnchorOffset={30}
        />
      )}
    </React.Fragment>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL DEL ESTUDIO
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

  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Cargar la plantilla (marco transparente)
  const [templateImg] = useImage(`/${template}-template.png`);

  // --- ATAJOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setLayers(prev => prev.filter(l => l.id !== selectedId));
        setSelectedId(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedId) {
        setClipboard(layers.find(l => l.id === selectedId));
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
        const newL = { ...clipboard, id: nanoid(), name: `${clipboard.name} (Copy)`, x: clipboard.x + 20, y: clipboard.y + 20 };
        setLayers(prev => [...prev, newL]);
        setSelectedId(newL.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        const t = layers.find(l => l.id === selectedId);
        if (t) {
          const newL = { ...t, id: nanoid(), name: `${t.name} (Copy)`, x: t.x + 20, y: t.y + 20 };
          setLayers(prev => [...prev, newL]);
          setSelectedId(newL.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // --- ARRASTRAR DE INTERNET / PC ---
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    stageRef.current.setPointersPositions(e);
    // Coordenadas relativas al lienzo escalado
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const x = pointer.x / zoom - stage.x() / zoom;
    const y = pointer.y / zoom - stage.y() / zoom;

    const addImg = (url) => {
      const newL = { id: nanoid(), type: 'image', name: `Img ${layers.length + 1}`, url, x, y, width: 150, height: 150, rotation: 0, opacity: 1 };
      setLayers(prev => [...prev, newL]);
      setSelectedId(newL.id);
    };

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(f => { if (f.type.startsWith('image/')) addImg(URL.createObjectURL(f)); });
      return;
    }
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) { addImg(match[1]); return; }
    }
    const url = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/plain');
    if (url && (url.match(/^http/) || url.match(/^data:image/))) addImg(url);
  };

  const addLayer = (type, props, name) => {
    const newL = { id: nanoid(), type, name: `${name} ${layers.length + 1}`, x: 50, y: 50, width: 150, height: 150, rotation: 0, opacity: 1, ...props };
    setLayers([...layers, newL]);
    setSelectedId(newL.id);
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    // Altura calculada para no romper la página general (asumiendo que tienes una navbar arriba)
    <div style={{ height: 'calc(100vh - 80px)', minHeight: '600px', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', border: `1px solid ${theme.border}` }}>
      
      {/* TOOLBAR SUPERIOR */}
      <div style={{ flex: '0 0 50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', color: 'white' }}>SPINE STUDIO PRO (CANVAS)</h2>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '4px 8px', borderRadius: '4px' }}>
            <option value="switch1">Switch V1</option>
            <option value="switch2">Switch V2</option>
          </select>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderLeft: `1px solid ${theme.border}`, paddingLeft: '15px' }}>
            <span style={{ fontSize: '12px' }}>Spines:</span>
            <select value={spineCount} onChange={e => setSpineCount(parseInt(e.target.value))} style={{ background: theme.bgApp, color: theme.text, padding: '4px' }}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select>
            {spineCount > 1 && <><span style={{ fontSize: '12px', marginLeft: '10px' }}>Gap: {spineGap}px</span><input type="range" min="0" max="100" value={spineGap} onChange={e => setSpineGap(parseInt(e.target.value))} style={{ width: '60px' }}/></>}
          </div>
        </div>
        <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}% (Ctrl+Rueda)</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* HERRAMIENTAS (IZQUIERDA) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px' }}>
          <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files[0]) addLayer('image', { url: URL.createObjectURL(e.target.files[0]) }, 'Image'); e.target.value=null; }} style={{ display: 'none' }} />
          <button onClick={() => setSelectedId(null)} style={{ width: '40px', height: '40px', background: !selectedId ? '#333' : 'transparent', border: 'none', borderRadius: '4px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={() => addLayer('text', { text: 'TEXTO', fill: '#000000', fontSize: 40, width: 200, height: 50 }, 'Text')} style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
        </div>

        {/* WORKSPACE (EL CANVAS) */}
        <div ref={containerRef} onDragOver={e => e.preventDefault()} onDrop={handleDrop} style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', position: 'relative' }}>
          
          {/* El Stage de Konva dibuja el motor gráfico */}
          <Stage 
            width={window.innerWidth} 
            height={2000} // Altura generosa para el scroll interno
            scaleX={zoom} scaleY={zoom}
            ref={stageRef}
            onMouseDown={(e) => {
              // Si clicamos en el fondo (Stage), deseleccionamos
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
            style={{ margin: '50px' }}
          >
            <Layer>
              {/* 1. DIBUJAR LOS FONDOS DE LOS LOMOS */}
              {[...Array(spineCount)].map((_, i) => (
                <Rect key={`bg-${i}`} x={i * (100 + spineGap)} y={0} width={100} height={1533} fill={bgColor} shadowColor="black" shadowBlur={20} shadowOpacity={0.8} />
              ))}

              {/* 2. DIBUJAR LAS CAPAS DEL USUARIO */}
              {layers.map((layer, i) => {
                if (!layer.visible) return null;
                const props = {
                  ...layer,
                  opacity: layer.opacity,
                  draggable: true,
                  onClick: () => setSelectedId(layer.id),
                  onTap: () => setSelectedId(layer.id),
                  onDragEnd: (e) => {
                    const newLayers = layers.slice();
                    newLayers[i] = { ...layer, x: e.target.x(), y: e.target.y() };
                    setLayers(newLayers);
                  }
                };

                if (layer.type === 'image') {
                  return <DesignImage key={layer.id} shapeProps={layer} isSelected={layer.id === selectedId} onSelect={() => setSelectedId(layer.id)} onChange={(newProps) => { const newLayers = layers.slice(); newLayers[i] = newProps; setLayers(newLayers); }} />;
                }
                if (layer.type === 'text') {
                  // Textos en Konva
                  return <KonvaText key={layer.id} {...props} text={layer.text} fontSize={layer.fontSize} fill={layer.fill} />;
                }
                return null;
              })}

              {/* 3. DIBUJAR LAS PLANTILLAS ENCIMA DE TODO (Solo lectura) */}
              {templateImg && [...Array(spineCount)].map((_, i) => (
                <KonvaImage key={`tpl-${i}`} image={templateImg} x={i * (100 + spineGap)} y={0} width={100} height={1533} listening={false} />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* PANEL DERECHO (PROPIEDADES) */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted }}>CAPAS</h3>
            {/* Lista invertida para que la más nueva salga arriba */}
            {[...layers].reverse().map(l => (
              <div key={l.id} onClick={() => setSelectedId(l.id)} style={{ padding: '8px', marginBottom: '5px', backgroundColor: selectedId === l.id ? theme.accent : '#333', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px' }}>{l.name}</span>
                {selectedId === l.id && <button onClick={(e) => { e.stopPropagation(); setLayers(layers.filter(x => x.id !== l.id)); setSelectedId(null); }} style={{ background: '#b30000', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer' }}>X</button>}
              </div>
            ))}
          </div>

          <div style={{ height: '350px', padding: '15px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted }}>PROPIEDADES</h3>
            {!selectedId ? (
              <div>
                <label style={{ fontSize: '12px' }}>Color Fondo Lomo</label><br/>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ marginTop: '10px' }}/>
              </div>
            ) : selectedLayer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedLayer.type === 'text' && (
                  <>
                    <input type="text" value={selectedLayer.text} onChange={e => { const n = layers.slice(); n.find(x => x.id === selectedId).text = e.target.value; setLayers(n); }} style={{ padding: '8px', background: '#111', color: 'white', border: '1px solid #444' }} />
                    <input type="color" value={selectedLayer.fill} onChange={e => { const n = layers.slice(); n.find(x => x.id === selectedId).fill = e.target.value; setLayers(n); }} />
                  </>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacidad (0-1)</label>
                    <input type="number" step="0.1" min="0" max="1" value={selectedLayer.opacity} onChange={e => { const n = layers.slice(); n.find(x => x.id === selectedId).opacity = parseFloat(e.target.value); setLayers(n); }} style={{ width: '100%', background: '#111', color: 'white', border: '1px solid #444', padding: '4px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotación (°)</label>
                    <input type="number" value={Math.round(selectedLayer.rotation)} onChange={e => { const n = layers.slice(); n.find(x => x.id === selectedId).rotation = parseInt(e.target.value); setLayers(n); }} style={{ width: '100%', background: '#111', color: 'white', border: '1px solid #444', padding: '4px' }} />
                  </div>
                </div>
                
                <p style={{ fontSize: '11px', color: '#888', marginTop: '20px' }}>Usa los controles directamente en la imagen para escalar y rotar con precisión milimétrica.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorView;