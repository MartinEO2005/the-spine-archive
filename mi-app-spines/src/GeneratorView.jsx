import React, { useEffect, useRef, useState } from 'react';
import { SpineEngine } from './studio/SpineEngine'; // Importamos el motor

const theme = { bgApp: '#1e1e1e', bgPanel: '#252526', border: '#3c3c3c' };

const GeneratorView = () => {
  const canvasContainerRef = useRef(null);
  const engine = useRef(null); // Aquí guardamos la instancia de Fabric
  const fileInputRef = useRef(null);

  // Inicializar Fabric solo una vez cuando el componente se monta
  useEffect(() => {
    // Le pasamos el ID del canvas HTML, y un tamaño inicial
    engine.current = new SpineEngine('spine-canvas', 800, 1500);

    // Permitir arrastrar desde el PC o Internet directamente sobre el contenedor
    const container = canvasContainerRef.current;
    
    const handleDrop = (e) => {
      e.preventDefault();
      // 1. Archivos locales
      if (e.dataTransfer.files.length > 0) {
        const url = URL.createObjectURL(e.dataTransfer.files[0]);
        engine.current.addImageFromURL(url);
      } else {
        // 2. Arrastrar desde otra pestaña
        const html = e.dataTransfer.getData('text/html');
        const match = html && html.match(/src\s*=\s*"([^"]+)"/);
        if (match) {
          engine.current.addImageFromURL(match[1]);
        }
      }
    };

    container.addEventListener('dragover', (e) => e.preventDefault());
    container.addEventListener('drop', handleDrop);

    // Limpieza al salir de la vista
    return () => {
      container.removeEventListener('dragover', (e) => e.preventDefault());
      container.removeEventListener('drop', handleDrop);
      if (engine.current) engine.current.dispose();
    };
  }, []);

  // --- HANDLERS PARA LOS BOTONES ---
  const handleAddImage = (e) => {
    if (e.target.files[0]) {
      engine.current.addImageFromURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div style={{ display: 'flex', height: '85vh', backgroundColor: theme.bgApp, color: 'white' }}>
      
      {/* BARRA DE HERRAMIENTAS */}
      <div style={{ width: '80px', backgroundColor: theme.bgPanel, padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        <input type="file" ref={fileInputRef} onChange={handleAddImage} style={{ display: 'none' }} />
        
        <button onClick={() => fileInputRef.current.click()} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>🖼️</button>
        <button onClick={() => engine.current.addText("NUEVO TÍTULO")} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>T</button>
        <button onClick={() => engine.current.addShape('rect')} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>⬛</button>
      </div>

      {/* ZONA DEL CANVAS */}
      <div ref={canvasContainerRef} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '50px' }}>
        <div style={{ boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
          {/* Este es el Canvas de HTML que Fabric.js tomará bajo su control */}
          <canvas id="spine-canvas"></canvas>
        </div>
      </div>

      {/* PANEL DERECHO (CAPAS Y PROPIEDADES) */}
      <div style={{ width: '300px', backgroundColor: theme.bgPanel, padding: '20px' }}>
        <h3>Controles</h3>
        <p style={{ fontSize: '12px', color: '#aaa' }}>La rotación y escalado se hacen ahora directamente en la imagen con el ratón.</p>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => engine.current.bringForward()} style={{ padding: '10px' }}>▲ Subir Capa</button>
          <button onClick={() => engine.current.sendBackwards()} style={{ padding: '10px' }}>▼ Bajar Capa</button>
        </div>
        <button onClick={() => engine.current.deleteSelected()} style={{ padding: '10px', marginTop: '10px', background: '#b30000', color: 'white', border: 'none' }}>Borrar Seleccionado</button>
      </div>
    </div>
  );
};

export default GeneratorView;