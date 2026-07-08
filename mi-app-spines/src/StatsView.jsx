import React, { useMemo, useState } from 'react';

const StatsView = ({ stats: propStats, spines = [] }) => {
  const [expandedAuthor, setExpandedAuthor] = useState(null);
  const [authorTopSpines, setAuthorTopSpines] = useState([]);

  // --- CÁLCULO: TOP UPLOADERS (ÚLTIMOS 30 DÍAS) ---
  const topUploaders30Days = useMemo(() => {
    if (!spines.length) return [];
    
    const now = Date.now() / 1000; // Tiempo actual en segundos (Unix)
    const thirtyDays = 30 * 24 * 60 * 60;
    const counts = {};

    spines.forEach(s => {
      // Solo contamos si tiene fecha y fue en los últimos 30 días
      if (s.created_utc && (now - s.created_utc) <= thirtyDays) {
        const author = s.author ? s.author.replace('u/', '') : 'Unknown';
        counts[author] = (counts[author] || 0) + 1;
      }
    });

    // Ordenamos de mayor a menor y sacamos el Top 5
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [spines]);

  // --- CÁLCULO: ESTADÍSTICAS GLOBALES ---
  const stats = useMemo(() => {
    if (propStats) return propStats;
    if (!spines.length) return null;
    const counts = {};
    spines.forEach(s => {
      const author = s.author ? s.author.replace('u/', '') : 'Unknown';
      counts[author] = (counts[author] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return { totalSpines: spines.length, totalAuthors: Object.keys(counts).length, topAuthors: sorted };
  }, [propStats, spines]);

  // --- CÁLCULO: FRANQUICIAS ---
  const franchiseStats = useMemo(() => {
    const counts = { Zelda: 0, Mario: 0, Xenoblade: 0, Pokemon: 0, Metroid: 0, Kirby: 0, DragonQuest: 0, AnimalCrossing: 0 };
    spines.forEach(s => {
      const title = s.title?.toLowerCase() || "";
      if (title.includes('zelda')) counts.Zelda++;
      if (title.includes('mario')) counts.Mario++;
      if (title.includes('xenoblade')) counts.Xenoblade++;
      if (title.includes('pokemon') || title.includes('pokémon')) counts.Pokemon++;
      if (title.includes('metroid')) counts.Metroid++;
      if (title.includes('kirby')) counts.Kirby++;
      if (title.includes('dragon quest')) counts.DragonQuest++;
      if (title.includes('animal crossing')) counts.AnimalCrossing++;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [spines]);

  const handleExpandAuthor = (author) => {
    if (expandedAuthor === author) {
      setExpandedAuthor(null);
      return;
    }
    setExpandedAuthor(author);
    // Como ya no usamos Redis para los clicks, simplemente mostramos los 5 lomos más recientes de este autor
    const authorSpines = spines
        .filter(s => (s.author || '').replace('u/', '') === author)
        .slice(0, 5);
    setAuthorTopSpines(authorSpines);
  };

  if (!stats) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>No data available.</div>;

  // --- LÓGICA DE BARRA DE PROGRESO (Rastreador de pasos estilo RPG) ---
  const progressSteps = [
    { target: 1000, name: "Lv.1 - INITIATION" },
    { target: 2500, name: "Lv.2 - APPRENTICE" },
    { target: 5000, name: "Lv.3 - ARCHIVIST" },
    { target: 7500, name: "Lv.4 - HERO" },
    { target: 10000, name: "MAX - MASTER OF SPINES" }
  ];
  const maxSpines = stats.totalSpines;
  const isPartyMode = maxSpines >= 10000;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px', color: 'white', backgroundColor: '#111' }}>
      
      {/* ANIMACIONES RETRO & FUENTE */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          /* Animación de destellos retro (sparkles) */
          @keyframes pixel-sparkle {
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(0.5); }
          }

          /* Modo Fiesta: Colores parpadeantes para texto MAX */
          @keyframes rainbow-text {
            0% { color: #ff0000; text-shadow: 2px 2px 0 #ffff00; }
            33% { color: #00ff00; text-shadow: 2px 2px 0 #ff00ff; }
            66% { color: #0000ff; text-shadow: 2px 2px 0 #00ffff; }
            100% { color: #ff0000; text-shadow: 2px 2px 0 #ffff00; }
          }
          
          /* Estilo retro 8-bits para el botón de Reddit */
          .retro-reddit-btn {
            background-color: #FF4500;
            color: white;
            font-family: '"Press Start 2P", monospace';
            font-size: 8px;
            padding: 8px 12px;
            border: 2px solid #fff;
            text-decoration: none;
            box-shadow: 3px 3px 0px #000;
            transition: transform 0.1s;
          }
          .retro-reddit-btn:active {
            transform: translate(3px, 3px);
            box-shadow: 0px 0px 0px #000;
          }
        `}
      </style>

      {/* CONTENEDOR PRINCIPAL: DIVIDIDO EN 2 COLUMNAS */}
      <div style={{ display: 'flex', gap: '50px', maxWidth: '1400px', margin: '0 auto', alignItems: 'flex-start' }}>
        
        {/* ============================================== */}
        {/* COLUMNA IZQUIERDA: DASHBOARD & BARRA DE PROGRESO */}
        {/* ============================================== */}
        <div style={{ flex: '0 0 450px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <img 
              src="/logo.jpg" 
              alt="The Spine Archive Logo" 
              style={{ height: '140px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 10px rgba(179,0,0,0.5))' }}
            />
          </div>

          <h1 style={{ 
            fontFamily: '"Press Start 2P", monospace',
            textAlign: 'center',
            borderBottom: '4px solid #b30000',
            paddingBottom: '15px',
            color: '#fff',
            textShadow: '3px 3px 0px #b30000',
            fontSize: '1.5rem',
            letterSpacing: '2px'
          }}>
            STATS DASHBOARD
          </h1>

          {/* TOTALES ESTILO ARCADE */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1, backgroundColor: '#222', padding: '15px', border: '4px solid #333', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: '"Press Start 2P", monospace', marginBottom: '10px' }}>TOTAL SPINES</div>
              <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#b30000', fontFamily: '"Press Start 2P", monospace' }}>{stats.totalSpines}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#222', padding: '15px', border: '4px solid #333', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: '"Press Start 2P", monospace', marginBottom: '10px' }}>TOTAL AUTHORS</div>
              <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', fontFamily: '"Press Start 2P", monospace' }}>{stats.totalAuthors}</div>
            </div>
          </div>

          {/* NUEVA BARRA DE PROGRESO POR PASOS (QUEST LOG) */}
          <div style={{ backgroundColor: '#222', padding: '20px', border: '4px solid #333', position: 'relative' }}>
            <h2 style={{ fontSize: '14px', color: '#fff', fontFamily: '"Press Start 2P", monospace', marginBottom: '25px', textShadow: '2px 2px #b30000' }}>
              COMMUNITY QUEST
            </h2>
            
            {/* Si hay fiesta, dibujamos destellos aleatorios por el recuadro */}
            {isPartyMode && (
              <>
                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '20px', animation: 'pixel-sparkle 0.8s infinite alternate' }}>✨</div>
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '20px', animation: 'pixel-sparkle 1.2s infinite alternate' }}>✨</div>
              </>
            )}

            <div style={{ position: 'relative', paddingLeft: '30px' }}>
              {/* Línea vertical de fondo */}
              <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '4px', backgroundColor: '#111', zIndex: 0 }}></div>
              
              {progressSteps.map((step, index) => {
                const isReached = maxSpines >= step.target;
                const isMaxParty = isReached && step.target === 10000;
                
                return (
                  <div key={index} style={{ position: 'relative', marginBottom: '25px', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                    {/* El nodo (Checkpoint) */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '-28px', 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: isReached ? '#b30000' : '#111', 
                      border: isReached ? '4px solid #fff' : '4px solid #444',
                      boxShadow: isReached ? '0 0 10px #b30000' : 'none'
                    }}></div>
                    
                    {/* Textos del paso */}
                    <div style={{ marginLeft: '10px', fontFamily: '"Press Start 2P", monospace', fontSize: '10px', lineHeight: '1.5' }}>
                      <div style={{ 
                        color: isReached ? '#fff' : '#666', 
                        animation: isMaxParty ? 'rainbow-text 1s infinite' : 'none' 
                      }}>
                        {step.name}
                      </div>
                      <div style={{ color: isReached ? '#b30000' : '#444' }}>
                        {isReached ? 'CLEARED!' : `GOAL: ${step.target}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOP UPLOADERS */}
          <div style={{ backgroundColor: '#222', padding: '20px', border: '4px solid #333' }}>
            <h2 style={{ color: '#ffcc00', marginBottom: '20px', fontFamily: '"Press Start 2P", monospace', fontSize: '12px', lineHeight: '1.5' }}>🔥 TOP 5 UPLOADERS<br/><span style={{fontSize: '8px', color: '#aaa'}}>(LAST 30 DAYS)</span></h2>
            {topUploaders30Days.length > 0 ? (
              topUploaders30Days.map(([author, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < topUploaders30Days.length - 1 ? '2px dashed #444' : 'none', fontFamily: 'monospace', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>#{i+1} u/{author}</span>
                  <span style={{ color: '#ffcc00' }}>{count} SPINES</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#666', fontFamily: 'monospace' }}>No new spines. Be the first!</div>
            )}
          </div>

          {/* FRANQUICIAS */}
          <div style={{ backgroundColor: '#222', padding: '20px', border: '4px solid #333' }}>
            <h2 style={{ color: '#aaa', marginBottom: '20px', fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>FRANCHISES</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {franchiseStats.map(([name, count]) => (
                <div key={name} style={{ backgroundColor: '#111', padding: '8px 12px', border: '2px solid #555', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{name.toUpperCase()}</span>
                  <span style={{ color: '#b30000', fontWeight: 'bold' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* COLUMNA DERECHA: TODOS LOS CONTRIBUIDORES      */}
        {/* ============================================== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <h1 style={{ 
            fontFamily: '"Press Start 2P", monospace', 
            textAlign: 'center', 
            borderBottom: '4px solid #b30000', 
            paddingBottom: '15px', 
            marginBottom: '30px',
            color: '#fff', 
            textShadow: '3px 3px 0px #b30000', 
            fontSize: '1.5rem',
            letterSpacing: '2px' 
          }}>
            ALL CONTRIBUTORS
          </h1>

          <div style={{ backgroundColor: '#222', border: '4px solid #333', marginBottom: '100px' }}>
            {stats.topAuthors.map(([author, count], index) => {
              const isExpanded = expandedAuthor === author;
              return (
                <div key={author} style={{ backgroundColor: index % 2 === 0 ? '#222' : '#1a1a1a', borderBottom: '2px solid #333' }}>
                  
                  <div 
                    onClick={() => handleExpandAuthor(author)} 
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', cursor: 'pointer', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '50%' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px', fontFamily: 'monospace', color: index < 3 ? '#b30000' : 'white' }}>u/{author}</span>
                    </div>
                    
                    {/* BOTÓN DE REDDIT Y CONTADOR ALINEADOS A LA DERECHA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px', color: isExpanded ? '#b30000' : 'white' }}>
                        {count} SPINES {isExpanded ? '▲' : '▼'}
                      </div>
                      <a 
                        href={`https://www.reddit.com/user/${author}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()} 
                        className="retro-reddit-btn"
                      >
                        REDDIT ↗
                      </a>
                    </div>
                  </div>

                  {/* VISTA DESPLEGABLE DE LOMOS */}
                  {isExpanded && (
                    <div style={{ padding: '40px 20px', backgroundColor: '#0a0a0a', borderTop: '2px dashed #444', display: 'flex', gap: '40px', overflowX: 'auto', alignItems: 'center' }}>
                      {authorTopSpines.length > 0 ? (
                        authorTopSpines.map((spine, i) => (
                          <div key={i} style={{ flexShrink: 0, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '220px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' }}>
                              <img 
                                src={spine.image || spine.src} 
                                alt={spine.title} 
                                loading="lazy"
                                style={{ 
                                  height: '220px', 
                                  transform: 'rotate(-90deg)', 
                                  transformOrigin: 'center',
                                  border: '2px solid #fff',
                                  boxShadow: '4px 4px 0px #000'
                                }} 
                              />
                            </div>
                            <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', marginTop: '10px' }}>
                              {spine.title}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#666', fontFamily: 'monospace', fontSize: '14px' }}>No spines found.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default StatsView;