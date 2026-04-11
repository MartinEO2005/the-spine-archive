import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { nanoid } from 'nanoid';

// --- TEMA UI ESTILO PHOTOSHOP DARK ---
const theme = {
  bgApp: '#1e1e1e', bgPanel: '#252526', bgCanvas: '#090909',
  border: '#3c3c3c', accent: '#007fd4', text: '#cccccc', textMuted: '#888888'
};

const GeneratorView = () => {
  // --- ESTADOS DE LA UI ---
  const [template, setTemplate] = useState('switch1');
  const [spineCount, setSpineCount] = useState(1);
  const [spineGap, setSpineGap] = useState(0);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [zoom, setZoom] = useState(0.4);
  
  // Sincronización entre Fabric y React
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Referencias
  const canvasContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==========================================
  // 1. INICIALIZACIÓN DE FABRIC.JS
  // ==========================================
  useEffect(() => {
    // Bloquear scroll de la página
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Crear el lienzo de Fabric
    const canvas = new fabric.Canvas('spine-canvas', {
      width: window.innerWidth - 380, // Ancho ventana menos paneles
      height: 2000,
      backgroundColor: theme.bgCanvas,
      preserveObjectStacking: true, // Crucial para mantener el orden de las capas
    });
    fabricCanvasRef.current = canvas;

    // Estilo profesional para los cuadrantes de selección (Tiradores)
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: theme.accent,
      borderColor: theme.accent,
      cornerSize: 12,
      padding: 5,
      cornerStyle: 'circle',
      borderDashArray: [4, 4]
    });

    // --- SINCRONIZACIÓN DE ESTADOS (FABRIC -> REACT) ---
    const syncLayers = () => {
      // Obtenemos solo los objetos del usuario (ignoramos fondos y plantillas)
      const userObjects = canvas.getObjects().filter(o => !o.isBg && !o.isTemplate);
      const layerData = userObjects.map(o => ({
        id: o.id,
        name: o.name,
        type: o.customType,
        visible: o.visible,
        opacity: o.opacity * 100,
        angle: Math.round(o.angle || 0),
        lockRatio: o.lockUniScaling
      }));
      setLayers(layerData);
    };

    canvas.on('object:added', syncLayers);
    canvas.on('object:removed', syncLayers);
    canvas.on('object:modified', syncLayers);
    
    canvas.on('selection:created', (e) => setSelectedId(e.selected[0]?.id || null));
    canvas.on('selection:updated', (e) => setSelectedId(e.selected[0]?.id || null));
    canvas.on('selection:cleared', () => setSelectedId(null));

    // --- ZOOM CON LA RUEDA DEL RATÓN ---
    canvas.on('mouse:wheel', function(opt) {
      if (opt.e.ctrlKey || opt.e.metaKey) {
        opt.e.preventDefault();
        opt.e.stopPropagation();
        let currentZoom = canvas.getZoom();
        let newZoom = currentZoom + (opt.e.deltaY < 0 ? 0.05 : -0.05);
        newZoom = Math.max(0.1, Math.min(newZoom, 4));
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
        setZoom(newZoom);
      }
    });

    // PANEO (Arrastrar el lienzo con Alt + Click)
    canvas.on('mouse:down', function(opt) {
      if (opt.e.altKey) {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
      }
    });
    canvas.on('mouse:move', function(opt) {
      if (this.isDragging) {
        let e = opt.e;
        let vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    });
    canvas.on('mouse:up', function(opt) {
      this.isDragging = false;
      this.selection = true;
    });

    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      canvas.dispose();
    };
  }, []);

  // ==========================================
  // 2. DIBUJAR ENTORNO (LOMOS Y PLANTILLAS)
  // ==========================================
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Borrar fondos y plantillas anteriores
    const objects = canvas.getObjects();
    objects.forEach(o => { if (o.isBg || o.isTemplate) canvas.remove(o); });

    // Dibujar los nuevos
    for (let i = 0; i < spineCount; i++) {
      const leftPos = i * (100 + spineGap) + 150; // +150 de margen izquierdo inicial

      // Fondo de color
      const bg = new fabric.Rect({
        left: leftPos, top: 100, width: 100, height: 1533,
        fill: bgColor,
        selectable: false, evented: false,
        isBg: true
      });
      canvas.add(bg);
      bg.sendToBack();

      // Plantilla de Nintendo (Overlay transparente)
      fabric.Image.fromURL(`/${template}-template.png`, (img) => {
        img.set({
          left: leftPos, top: 100, width: 100, height: 1533,
          selectable: false, evented: false,
          isTemplate: true
        });
        canvas.add(img);
        img.bringToFront();
      });
    }
  }, [spineCount, spineGap, bgColor, template]);

  // ==========================================
  // 3. HERRAMIENTAS Y MÉTODOS DE CREACIÓN
  // ==========================================
  const addImageToCanvas = (url) => {
    const canvas = fabricCanvasRef.current;
    fabric.Image.fromURL(url, (img) => {
      img.set({
        id: nanoid(),
        name: `Image ${layers.length + 1}`,
        customType: 'image',
        left: 200, top: 200,
        originX: 'center', originY: 'center',
        lockUniScaling: false // Permitir estirar por defecto
      });
      if (img.width > 300) img.scaleToWidth(300);
      
      canvas.add(img);
      // Asegurarnos de que queda por debajo de las plantillas pero encima del fondo
      const templates = canvas.getObjects().filter(o => o.isTemplate);
      templates.forEach(t => t.bringToFront());
      
      canvas.setActiveObject(img);
    }, { crossOrigin: 'anonymous' });
  };

  const addTextToCanvas = () => {
    const canvas = fabricCanvasRef.current;
    const text = new fabric.IText('NUEVO TÍTULO', {
      id: nanoid(),
      name: `Text ${layers.length + 1}`,
      customType: 'text',
      left: 200, top: 200,
      originX: 'center', originY: 'center',
      fontFamily: 'sans-serif',
      fill: '#ffffff',
      fontSize: 32,
    });
    canvas.add(text);
    const templates = canvas.getObjects().filter(o => o.isTemplate);
    templates.forEach(t => t.bringToFront());
    canvas.setActiveObject(text);
  };

  const addShapeToCanvas = (type) => {
    const canvas = fabricCanvasRef.current;
    let shape;
    const commonProps = { id: nanoid(), name: `Shape ${layers.length + 1}`, customType: 'shape', left: 200, top: 200, originX: 'center', originY: 'center' };
    
    if (type === 'rect') shape = new fabric.Rect({ ...commonProps, width: 100, height: 100, fill: '#d40000' });
    if (type === 'circle') shape = new fabric.Circle({ ...commonProps, radius: 50, fill: '#007fd4' });
    
    if (shape) {
      canvas.add(shape);
      const templates = canvas.getObjects().filter(o => o.isTemplate);
      templates.forEach(t => t.bringToFront());
      canvas.setActiveObject(shape);
    }
  };

  // --- DRAG & DROP Y PORTAPAPELES (CTRL+V) ---
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          addImageToCanvas(URL.createObjectURL(blob));
        }
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const canvas = fabricCanvasRef.current;
      const activeObj = canvas.getActiveObject();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeObj) canvas.remove(activeObj);
      }
      
      // Duplicar con Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (!activeObj) return;
        activeObj.clone((cloned) => {
          cloned.set({
            left: cloned.left + 30, top: cloned.top + 30,
            id: nanoid(), name: `${activeObj.name} (Copy)`,
            evented: true,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          const templates = canvas.getObjects().filter(o => o.isTemplate);
          templates.forEach(t => t.bringToFront());
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [layers]);

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const url = URL.createObjectURL(e.dataTransfer.files[0]);
      addImageToCanvas(url);
      return;
    }
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) addImageToCanvas(match[1]);
    }
  };

  // ==========================================
  // 4. FUNCIONES DEL PANEL DERECHO
  // ==========================================
  const activeObject = selectedId ? fabricCanvasRef.current?.getObjects().find(o => o.id === selectedId) : null;

  const updateActiveObject = (updates) => {
    if (!activeObject) return;
    activeObject.set(updates);
    fabricCanvasRef.current.requestRenderAll();
    
    // Forzar actualización del estado de React
    setLayers(prev => prev.map(l => l.id === selectedId ? { ...l, ...updates } : l));
  };

  const deleteLayer = (id) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas.getObjects().find(o => o.id === id);
    if (obj) canvas.remove(obj);
  };

  const reorderLayer = (id, direction) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas.getObjects().find(o => o.id === id);
    if (!obj) return;
    
    if (direction === 'up') obj.bringForward();
    if (direction === 'down') obj.sendBackwards();
    
    // Proteger fondos y plantillas
    const backgrounds = canvas.getObjects().filter(o => o.isBg);
    const templates = canvas.getObjects().filter(o => o.isTemplate);
    backgrounds.forEach(b => b.sendToBack());
    templates.forEach(t => t.bringToFront());
    
    canvas.requestRenderAll();
    // Emitir un evento falso para forzar sincronización
    canvas.fire('object:modified'); 
  };

  // ==========================================
  // RENDER DE LA INTERFAZ
  // ==========================================
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif' }}>
      
      {/* TOOLBAR SUPERIOR */}
      <div style={{ flex: '0 0 50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', color: 'white', letterSpacing: '1px' }}>SPINE STUDIO ULTIMATE</h2>
          
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '4px', outline: 'none' }}>
            <option value="switch1">Template: Switch V1</option>
            <option value="switch2">Template: Switch V2</option>
          </select>
          
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
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom: {Math.round(zoom * 100)}% (Ctrl+Wheel)</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* BARRA LATERAL (HERRAMIENTAS) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', zIndex: 50 }}>
          <input type="file" ref={fileInputRef} onChange={e => { if(e.target.files[0]) addImageToCanvas(URL.createObjectURL(e.target.files[0])); e.target.value=null; }} style={{ display: 'none' }} />
          
          <button onClick={() => {fabricCanvasRef.current?.discardActiveObject(); fabricCanvasRef.current?.requestRenderAll();}} title="Cursor" style={{ width: '40px', height: '40px', background: !selectedId ? '#333' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>↖</button>
          <button onClick={() => fileInputRef.current.click()} title="Añadir Imagen (O usa Ctrl+V)" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>🖼️</button>
          <button onClick={addTextToCanvas} title="Añadir Texto" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>T</button>
          <button onClick={() => addShapeToCanvas('rect')} title="Añadir Rectángulo" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⬛</button>
          <button onClick={() => addShapeToCanvas('circle')} title="Añadir Círculo" style={{ width: '40px', height: '40px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'white', fontSize: '18px', cursor: 'pointer' }}>⚫</button>
        </div>

        {/* LIENZO CENTRAL (EL MOTOR DE FABRIC) */}
        <div 
          ref={canvasContainerRef} 
          onDragOver={e=>e.preventDefault()} 
          onDrop={handleDrop} 
          style={{ flex: 1, backgroundColor: theme.bgCanvas, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <canvas id="spine-canvas" />
        </div>

        {/* PANEL DERECHO (PROPIEDADES Y CAPAS) */}
        <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
          
          {/* PANEL DE CAPAS */}
          <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>LAYERS (CAPAS)</h3></div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {[...layers].reverse().map((layer) => (
                <div key={layer.id} onClick={() => {const obj = fabricCanvasRef.current.getObjects().find(o=>o.id===layer.id); fabricCanvasRef.current.setActiveObject(obj); fabricCanvasRef.current.requestRenderAll();}} style={{ display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '5px', backgroundColor: selectedId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
                  <button onClick={(e) => { e.stopPropagation(); const obj = fabricCanvasRef.current.getObjects().find(o=>o.id===layer.id); obj.set('visible', !obj.visible); fabricCanvasRef.current.requestRenderAll(); fabricCanvasRef.current.fire('object:modified'); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
                  <span style={{ fontSize: '16px', margin: '0 10px' }}>{layer.type === 'image' ? '🖼️' : layer.type === 'text' ? 'T' : '⬛'}</span>
                  <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{layer.name}</span>
                  
                  {selectedId === layer.id && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'up'); }} title="Subir (Al frente)" style={{ background: '#333', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer', padding: '2px 5px' }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'down'); }} title="Bajar (Al fondo)" style={{ background: '#333', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer', padding: '2px 5px' }}>▼</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} title="Borrar" style={{ background: '#b30000', border: 'none', color: 'white', borderRadius: '3px', cursor: 'pointer', padding: '2px 5px' }}>✖</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PANEL DE PROPIEDADES DINÁMICO */}
          <div style={{ height: '400px', padding: '15px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>PROPIEDADES</h3>
            
            {!activeObject ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '40px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <span style={{ fontSize: '12px' }}>Color Base del Lomo</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* PROPIEDAD: BLOQUEO DE ASPECTO */}
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', color: theme.text }}>
                  <input type="checkbox" checked={activeObject.lockUniScaling} onChange={e => updateActiveObject({ lockUniScaling: e.target.checked })} />
                  Mantener Proporciones (Aspect Ratio)
                </label>

                {/* PROPIEDADES DE TEXTO */}
                {activeObject.customType === 'text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                    <input type="text" value={activeObject.text} onChange={e => updateActiveObject({ text: e.target.value })} style={{ padding: '8px', background: '#111', color: 'white', border: `1px solid ${theme.border}`, borderRadius: '4px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="color" value={activeObject.fill} onChange={e => updateActiveObject({ fill: e.target.value })} style={{ cursor: 'pointer' }} />
                      <input type="number" placeholder="Tamaño" value={activeObject.fontSize} onChange={e => updateActiveObject({ fontSize: parseInt(e.target.value) || 20 })} style={{ width: '60px', background: '#111', color: 'white', border: `1px solid ${theme.border}`, borderRadius: '4px' }} />
                    </div>
                  </div>
                )}

                {/* PROPIEDADES DE FORMAS */}
                {activeObject.customType === 'shape' && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                    <input type="color" value={activeObject.fill} onChange={e => updateActiveObject({ fill: e.target.value })} style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: '12px' }}>Color de la Forma</span>
                  </div>
                )}

                {/* PROPIEDADES COMUNES (Rotación y Opacidad) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotación (°)</label>
                    <input type="number" value={Math.round(activeObject.angle || 0)} onChange={e => updateActiveObject({ angle: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, padding: '6px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacidad (%)</label>
                    <input type="number" min="0" max="100" value={Math.round((activeObject.opacity || 1) * 100)} onChange={e => updateActiveObject({ opacity: (parseInt(e.target.value) || 0) / 100 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, padding: '6px', borderRadius: '4px', border: `1px solid ${theme.border}` }} />
                  </div>
                </div>

                <div style={{ padding: '10px', background: 'rgba(0,127,212,0.1)', border: `1px solid ${theme.accent}`, borderRadius: '6px', marginTop: '10px' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>
                    💡 <b>Atajos de Teclado:</b><br/>
                    • Ctrl + V: Pegar imagen de internet<br/>
                    • Ctrl + D: Duplicar seleccion<br/>
                    • Alt + Click Izq (Arrastrar): Moverse por el lienzo<br/>
                    • Ctrl + Rueda Ratón: Zoom
                  </p>
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