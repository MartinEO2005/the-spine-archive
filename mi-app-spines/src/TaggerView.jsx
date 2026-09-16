import React, { useState } from 'react';

// Categorías extraídas exactamente de tu idea_categor.md
const CATEGORIAS = {
  Plataforma: ["Switch 1", "Switch 2"],
  "Color Base": ["Rojo", "Azul", "Amarillo", "Verde", "Rosa", "Naranja", "Morado", "Blanco", "Negro", "Gris", "Multicolor"],
  "Tipografía del Título": ["Texto Simple", "Logo Original"],
  "Alineación del Texto": ["Centrado Arriba", "Centro Exacto", "Cubre todo (desde arriba)", "Cubre todo (centrado)"],
  "Estilo Principal": ["Minimalista", "Escénico / Detallado", "Maximalista (Kitsch)"]
};

// Extras es multiselección (Array)
const EXTRAS = ["Estilo DNN", "Personaje Abajo", "Personajes por todo el lomo", "Set / Panorama"];

export default function TaggerView({ onExit }) {
  const [db, setDb] = useState([]);
  const [isFileLoaded, setIsFileLoaded] = useState(false);

  // Cargar el JSON localmente
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setDb(json);
        setIsFileLoaded(true);
      } catch (error) {
        alert("Error al leer el JSON. Asegúrate de que el formato es correcto.");
      }
    };
    reader.readAsText(file);
  };

  // Buscar el primer juego al que le falte ALGUNA de las categorías base
  const currentIndex = db.findIndex(game => {
    if (!game.tags) return true;
    return Object.keys(CATEGORIAS).some(cat => !game.tags[cat]);
  });

  const currentGame = currentIndex !== -1 ? db[currentIndex] : null;
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
    
    let newExtras;
    if (currentExtras.includes(extra)) {
      newExtras = currentExtras.filter(e => e !== extra);
    } else {
      newExtras = [...currentExtras, extra];
    }
    
    game.tags = { ...game.tags, Extras: newExtras };
    updatedDb[currentIndex] = game;
    setDb(updatedDb);
  };

  // NUEVO: Manejar el cambio del color Hexadecimal
  const handleHexChange = (e) => {
    const updatedDb = [...db];
    const game = { ...updatedDb[currentIndex] };
    // Guardamos el color hexadecimal en la raíz del objeto del juego
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

  if (!isFileLoaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222', color: 'white' }}>
        <h2>Herramienta de Etiquetado</h2>
        <p style={{ marginBottom: '20px' }}>Sube tu archivo database.json para empezar</p>
        <input type="file" accept=".json" onChange={handleFileUpload} style={{ padding: '10px', backgroundColor: '#444', borderRadius: '5px' }} />
        <button onClick={onExit} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}>Volver al Catálogo</button>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222', color: 'white' }}>
        <h1>¡Todo etiquetado! 🎉</h1>
        <button onClick={handleDownload} style={{ padding: '15px', marginTop: '20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Descargar JSON actualizado
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#222', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span>Pendientes: {pendientes}</span>
        <div>
          <button onClick={handleDownload} style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
            Guardar Progreso (.json)
          </button>
          <button onClick={onExit} style={{ padding: '8px 15px', backgroundColor: '#b30000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Panel Izquierdo: Imagen */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '400px', width: '100%', backgroundColor: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', padding: '10px' }}>
            <img src={currentGame.image || currentGame.imageUrl || currentGame.src} alt="spine" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
          <h3 style={{ textAlign: 'center', marginTop: '15px' }}>{currentGame.title || "Sin título"}</h3>
        </div>

        {/* Panel Derecho: Controles */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          {/* NUEVO: Selector de Color Hexadecimal */}
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px', border: '1px solid #4CAF50', gridColumn: '1 / -1' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>Color Hexadecimal (Exacto)</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input 
                type="color" 
                value={currentGame.hexColor || "#ffffff"} 
                onChange={handleHexChange}
                style={{ width: '60px', height: '40px', cursor: 'pointer', padding: '0', border: 'none', backgroundColor: 'transparent' }}
              />
              <input 
                type="text" 
                value={currentGame.hexColor || ""} 
                onChange={handleHexChange}
                placeholder="#FFFFFF"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#222', color: 'white', width: '100px' }}
              />
              <span style={{ fontSize: '12px', color: '#aaa' }}>Haz clic en el cuadro de color y usa el cuentagotas para extraer el tono exacto de la imagen.</span>
            </div>
          </div>

          {/* Categorías de selección única */}
          {Object.entries(CATEGORIAS).map(([categoria, opciones]) => (
            <div key={categoria} style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>{categoria}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {opciones.map(opcion => {
                  const isSelected = currentGame.tags && currentGame.tags[categoria] === opcion;
                  return (
                    <button
                      key={opcion}
                      onClick={() => handleTag(categoria, opcion)}
                      style={{
                        padding: '6px 12px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        backgroundColor: isSelected ? '#3b82f6' : '#555',
                        color: 'white', fontWeight: isSelected ? 'bold' : 'normal'
                      }}
                    >
                      {opcion}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Extras (Selección múltiple) */}
          <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '8px', border: '1px solid #b30000' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '5px' }}>Extras (Múltiple)</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EXTRAS.map(extra => {
                const currentExtras = currentGame.tags?.Extras || [];
                const isSelected = currentExtras.includes(extra);
                return (
                  <button
                    key={extra}
                    onClick={() => handleExtraToggle(extra)}
                    style={{
                      padding: '6px 12px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      backgroundColor: isSelected ? '#ef4444' : '#555',
                      color: 'white'
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
  );
}