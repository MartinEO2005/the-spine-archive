import React, { useState, useEffect } from 'react';

const CATEGORIAS = {
  Plataforma: ["Switch 1", "Switch 2"],
  "Color Base": ["Rojo", "Azul", "Amarillo", "Verde", "Rosa", "Naranja", "Morado", "Blanco", "Negro", "Gris", "Multicolor"],
  "Tipografía del Título": ["Texto Simple", "Logo Original"],
  "Alineación del Texto": ["Centrado Arriba", "Centro Exacto", "Cubre todo (desde arriba)", "Cubre todo (centrado)"],
  "Estilo Principal": ["Minimalista", "Escénico / Detallado", "Maximalista (Kitsch)"]
};

const EXTRAS = ["Estilo DNN", "Personaje Abajo", "Personajes por todo el lomo", "Set / Panorama"];

export default function TaggerView({ onExit }) {
  const [db, setDb] = useState([]);
  const [isFileLoaded, setIsFileLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // NUEVO: Detector de móvil para el Tagger
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setDb(json);
        const firstUntagged = json.findIndex(game => !game.tags || Object.keys(CATEGORIAS).some(cat => !game.tags[cat]));
        setCurrentIndex(firstUntagged !== -1 ? firstUntagged : 0);
        setIsFileLoaded(true);
      } catch (error) {
        alert("Error al leer el JSON. Asegúrate de que el formato es correcto.");
      }
    };
    reader.readAsText(file);
  };

  const getImageUrl = (game) => {
    if (!game) return "";
    let rawUrl = game.image || game.imageUrl || game.src || game.url || game.id;
    if (!rawUrl) return "SIN_URL_EN_JSON";
    if (rawUrl.startsWith('http')) return rawUrl;
    
    rawUrl = rawUrl.replace(/^\/+/, '');
    if (!rawUrl.includes('.')) rawUrl = `${rawUrl}.webp`;
    
    return rawUrl.startsWith('spines/') ? `/${rawUrl}` : `/spines/${rawUrl}`; 
  };

  const currentGame = db[currentIndex] || null;
  const pendientes = db.filter(g => !g.tags || Object.keys(CATEGORIAS).some(cat => !g.tags[cat])).length;

  const handleTag = (categoria, valor) => {
    const updatedDb = [...db];
    const game = { ...updatedDb[currentIndex] };
    game.tags = { ...game.tags, [categoria]: valor };
    updatedDb[currentIndex] = game;
    setDb(updatedDb);
  };

  const handleExtraToggle = (extra) => {
    const updatedDb = [...db];
    const game = { ...updatedDb[currentIndex] };
    const currentExtras = game.tags?.Extras || [];
    let newExtras = currentExtras.includes(extra) 
      ? currentExtras.filter(e => e !== extra)
      : [...currentExtras, extra];
    
    game.tags = { ...game.tags, Extras: newExtras };
    updatedDb[currentIndex] = game;
    setDb(updatedDb);
  };

  const handleHexChange = (e) => {
    const updatedDb = [...db];
    const game = { ...updatedDb[currentIndex] };
    game.hexColor = e.target.value;
    updatedDb[currentIndex] = game;
    setDb(updatedDb);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "database_etiquetada.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const nextSpine = () => { if (currentIndex < db.length - 1) setCurrentIndex(currentIndex + 1); };
  const prevSpine = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSpine();
      if (e.key === 'ArrowLeft') prevSpine();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, db.length]);

  if (!isFileLoaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h2>Herramienta de Etiquetado</h2>
        <p style={{ marginBottom: '20px' }}>Sube tu archivo database.json para empezar</p>
        <input type="file" accept=".json" onChange={handleFileUpload} style={{ padding: '10px', backgroundColor: '#333', borderRadius: '5px', maxWidth: '100%' }} />
        <button onClick={onExit} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}>Volver al Catálogo</button>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '10px' : '15px', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0' }}>
        <span style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: 'bold' }}>Pendientes: {pendientes}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownload} style={{ padding: '8px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>
            Guardar JSON
          </button>
          <button onClick={onExit} style={{ padding: '8px 12px', backgroundColor: '#b30000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '12px' : '14px' }}>
            Salir
          </button>
        </div>
      </div>

      {/* TIRA DE CONTEXTO */}
      <div style={{ 
        display: 'flex', gap: '8px', overflowX: 'auto', backgroundColor: '#111', 
        padding: '10px', borderRadius: '8px', marginBottom: '15px', height: isMobile ? '100px' : '160px', alignItems: 'center',
        border: '1px solid #333'
      }}>
        {db.map((game, i) => {
          if (Math.abs(i - currentIndex) > 15) return null;
          const isCurrent = i === currentIndex;
          return (
            <img 
              key={i} src={getImageUrl(game)} onClick={() => setCurrentIndex(i)} title={game.title}
              style={{ 
                height: isCurrent ? '100%' : '75%', cursor: 'pointer', 
                border: isCurrent ? '3px solid #4CAF50' : '2px solid transparent',
                opacity: isCurrent ? 1 : 0.5, objectFit: 'contain', transition: 'all 0.2s ease', backgroundColor: '#222'
              }} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          );
        })}
      </div>

      {/* LAYOUT PRINCIPAL RESPONSIVO */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '15px' : '30px', flex: 1 }}>
        
        {/* Panel Izquierdo: IMAGEN */}
        <div style={{ flex: isMobile ? 'none' : '0 0 450px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            height: isMobile ? '40vh' : '65vh', width: '100%', backgroundColor: '#111', display: 'flex', 
            justifyContent: 'center', alignItems: 'center', borderRadius: '8px', padding: '10px',
            border: '2px solid #333'
          }}>
            <img src={getImageUrl(currentGame)} alt="spine" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button onClick={prevSpine} disabled={currentIndex === 0} style={{ padding: isMobile ? '10px' : '12px 20px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              &larr; {isMobile ? '' : 'Anterior'}
            </button>
            <div style={{ textAlign: 'center', flex: 1, padding: '0 5px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: isMobile ? '14px' : '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentGame?.title || "Sin título"}
              </h3>
              <span style={{ fontSize: '12px', color: '#aaa' }}>{currentIndex + 1} / {db.length}</span>
            </div>
            <button onClick={nextSpine} disabled={currentIndex === db.length - 1} style={{ padding: isMobile ? '10px' : '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              {isMobile ? '' : 'Siguiente'} &rarr;
            </button>
          </div>
        </div>

        {/* Panel Derecho: CONTROLES */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', paddingRight: isMobile ? '0' : '10px', height: isMobile ? 'auto' : '75vh', paddingBottom: isMobile ? '40px' : '0' }}>
          
          {/* Color Picker (Nativo en móvil funciona genial) */}
          <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', border: '1px solid #4CAF50' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>Color Hexadecimal</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input type="color" value={currentGame?.hexColor || "#ffffff"} onChange={handleHexChange} style={{ width: '50px', height: '40px', cursor: 'pointer', padding: '0', border: 'none', backgroundColor: 'transparent' }} />
              <input type="text" value={currentGame?.hexColor || ""} onChange={handleHexChange} placeholder="#FFFFFF" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#111', color: 'white', width: '100px', fontWeight: 'bold' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {Object.entries(CATEGORIAS).map(([categoria, opciones]) => (
              <div key={categoria} style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>{categoria}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {opciones.map(opcion => {
                    const isSelected = currentGame?.tags && currentGame.tags[categoria] === opcion;
                    return (
                      <button
                        key={opcion} onClick={() => handleTag(categoria, opcion)}
                        style={{
                          padding: '10px 12px', fontSize: '13px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                          backgroundColor: isSelected ? '#3b82f6' : '#444', color: 'white', fontWeight: isSelected ? 'bold' : 'normal', flexGrow: isMobile ? 1 : 0
                        }}
                      >
                        {opcion}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', border: '1px solid #b30000' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>Extras (Múltiple)</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EXTRAS.map(extra => {
                  const currentExtras = currentGame?.tags?.Extras || [];
                  const isSelected = currentExtras.includes(extra);
                  return (
                    <button
                      key={extra} onClick={() => handleExtraToggle(extra)}
                      style={{
                        padding: '10px 12px', fontSize: '13px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        backgroundColor: isSelected ? '#ef4444' : '#444', color: 'white', fontWeight: isSelected ? 'bold' : 'normal', flexGrow: isMobile ? 1 : 0
                      }}
                    >
                      {extra}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}