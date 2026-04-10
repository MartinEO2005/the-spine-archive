import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { nanoid } from 'nanoid';

// --- ESTILOS UI TIPO PHOTOSHOP / FIGMA ---
const theme = {
  bgApp: '#1e1e1e',       // Fondo general
  bgPanel: '#252526',     // Fondo de los paneles laterales
  bgCanvas: '#0e0e0e',    // Fondo de la zona de trabajo
  border: '#3c3c3c',      // Bordes sutiles
  accent: '#007fd4',      // Azul tipo VS Code/Photoshop
  text: '#cccccc',        // Texto principal
  textMuted: '#888888',   // Texto secundario
};

const GeneratorView = () => {
  const [template, setTemplate] = useState('switch1');
  const [zoom, setZoom] = useState(0.8); // Nivel de zoom inicial para que se vea completo
  const [layers, setLayers] = useState([]); // Capas (Assets y Fondo)
  const [selectedLayerId, setSelectedLayerId] = useState(null); // Capa activa

  const workspaceRef = useRef(null);

  // --- LÓGICA DE DRAG & DROP (ARCHIVOS E INTERNET) ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const addImageToCanvas = (src, name = 'Image') => {
    const newLayer = {
      id: nanoid(),
      name: `${name} ${layers.length + 1}`,
      url: src,
      x: 0, y: 300, 
      width: 80, height: 80,
      visible: true,
      opacity: 100
    };
    setLayers(prev => [newLayer, ...prev]); // Añade arriba de la lista
    setSelectedLayerId(newLayer.id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Si es un archivo local (escritorio)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          addImageToCanvas(URL.createObjectURL(file), 'Local Image');
        }
      });
      return;
    }

    // 2. Si es una imagen arrastrada desde otra pestaña de internet
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      // Intentamos extraer el src del html que envía el navegador
      const match = html.match(/src\s*=\s*"([^"]+)"/);
      if (match) {
        addImageToCanvas(match[1], 'Web Image');
        return;
      }
    }

    // 3. Fallback: URL pura
    const url = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/plain');
    if (url && (url.match(/^http/) || url.match(/^data:image/))) {
      addImageToCanvas(url, 'URL Image');
    }
  };

  // --- GESTIÓN DE CAPAS ---
  const removeLayer = (id) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const toggleVisibility = (id) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const updateLayerOpacity = (id, opacity) => {
    setLayers(layers.map(l => l.id === id ? { ...l, opacity: opacity } : l));
  };

  // Truco para "subir" o "bajar" capas en el array
  const moveLayer = (index, direction) => {
    const newLayers = [...layers];
    if (direction === 'up' && index > 0) {
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
    } else if (direction === 'down' && index < newLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    }
    setLayers(newLayers);
  };

  // Deseleccionar al hacer clic en el fondo vacío
  const handleWorkspaceClick = (e) => {
    if (e.target.id === 'workspace-bg') setSelectedLayerId(null);
  };

  // --- RENDERIZADO ---
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bgApp, color: theme.text, fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* TOOLBAR SUPERIOR */}
      <div style={{ height: '50px', backgroundColor: theme.bgPanel, borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'white' }}>Spine Studio Pro</h2>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '5px 10px', borderRadius: '4px', fontSize: '12px' }}>
            <option value="switch1">Template: Switch V1</option>
            <option value="switch2">Template: Switch V2</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: theme.textMuted }}>Zoom:</span>
          <input type="range" min="0.3" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(e.target.value)} style={{ width: '100px' }} />
          <button style={{ padding: '8px 20px', background: theme.accent, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', marginLeft: '10px' }}>
            Export PDF
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* PANEL IZQUIERDO: HERRAMIENTAS (Simulando barra lateral) */}
        <div style={{ width: '60px', backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
          <div title="Drag images directly to the canvas" style={{ width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bgApp, borderRadius: '6px', marginBottom: '10px', cursor: 'help' }}>
            🖱️
          </div>
          {/* Aquí podrías añadir botones para Herramienta Texto, Color, etc. */}
        </div>

        {/* ÁREA CENTRAL: EL LIENZO (WORKSPACE) */}
        <div 
          id="workspace-bg"
          onClick={handleWorkspaceClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ flex: 1, backgroundColor: theme.bgCanvas, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}
        >
          {/* Instrucciones flotantes si está vacío */}
          {layers.length === 0 && (
            <div style={{ position: 'absolute', color: theme.textMuted, textAlign: 'center', pointerEvents: 'none' }}>
              <p style={{ fontSize: '24px', margin: 0 }}>📁</p>
              <p>Drag & Drop images here (Files or from Web)</p>
            </div>
          )}

          {/* CONTENEDOR DEL LOMO (Se escala con el zoom) */}
          <div style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'center center', 
            transition: 'transform 0.1s ease-out',
            // Medidas exactas proporcionales (Ej: 80px ancho x 912px alto = 1:11.4)
            width: '80px', 
            height: '912px', 
            backgroundColor: '#ffffff', // Fondo base del papel
            boxShadow: '0 0 50px rgba(0,0,0,0.8)',
            position: 'relative',
            overflow: 'hidden' // Corta lo que sobra
          }}>
            
            {/* CAPAS DE USUARIO (Ordenadas invertidas para que el índice 0 sea arriba visualmente) */}
            {[...layers].reverse().map((layer) => layer.visible && (
              <Rnd
                key={layer.id}
                size={{ width: layer.width, height: layer.height }}
                position={{ x: layer.x, y: layer.y }}
                onDragStop={(e, d) => setLayers(layers.map(l => l.id === layer.id ? { ...l, x: d.x, y: d.y } : l))}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setLayers(layers.map(l => l.id === layer.id ? { ...l, width: ref.style.width, height: ref.style.height, ...position } : l));
                }}
                // Solo activamos los tiradores si la capa está seleccionada
                disableDragging={selectedLayerId !== layer.id}
                enableResizing={selectedLayerId === layer.id}
                style={{
                  zIndex: 10 + layers.findIndex(l => l.id === layer.id), // Respetar orden
                  opacity: layer.opacity / 100,
                  // Bordes azules tipo Photoshop al seleccionar
                  border: selectedLayerId === layer.id ? `1px solid ${theme.accent}` : 'none' 
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
              >
                <img src={layer.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
              </Rnd>
            ))}

            {/* LA PLANTILLA TRANSPARENTE (Siempre encima de todo) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
              <img src={`/${template}-template.png`} alt="Template" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: PROPIEDADES Y CAPAS (Layers) */}
        <div style={{ width: '280px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '15px', borderBottom: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '13px', textTransform: 'uppercase', color: theme.textMuted }}>Layers</h3>
            
            {/* LISTA DE CAPAS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {layers.map((layer, index) => (
                <div 
                  key={layer.id} 
                  onClick={() => setSelectedLayerId(layer.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', padding: '8px', 
                    backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, 
                    borderRadius: '4px', cursor: 'pointer',
                    border: selectedLayerId === layer.id ? `1px solid #4a90e2` : `1px solid transparent`
                  }}
                >
                  {/* Botón Visibilidad */}
                  <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? 'white' : '#555', cursor: 'pointer', padding: '0 5px' }}>
                    {layer.visible ? '👁️' : '🕶️'}
                  </button>
                  
                  {/* Miniatura y Nombre */}
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#333', marginLeft: '5px', backgroundImage: `url(${layer.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                  <span style={{ fontSize: '12px', marginLeft: '10px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.name}</span>
                  
                  {/* Botones de Orden y Borrar */}
                  {selectedLayerId === layer.id && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(index, 'up'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayer(index, 'down'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}>▼</button>
                      <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} style={{ background: '#d40000', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}>✖</button>
                    </div>
                  )}
                </div>
              ))}
              {layers.length === 0 && <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', margin: '20px 0' }}>No layers yet.</p>}
            </div>
          </div>

          {/* PANEL DE PROPIEDADES (Solo si hay capa seleccionada) */}
          {selectedLayerId && (
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '13px', textTransform: 'uppercase', color: theme.textMuted }}>Properties</h3>
              {layers.map(layer => layer.id === selectedLayerId && (
                <div key="props">
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '11px', color: theme.textMuted, display: 'block', marginBottom: '5px' }}>Opacity: {layer.opacity}%</label>
                    <input type="range" min="0" max="100" value={layer.opacity} onChange={(e) => updateLayerOpacity(layer.id, e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#666' }}>Use the corner handles on the canvas to resize, and click/drag to move.</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GeneratorView;