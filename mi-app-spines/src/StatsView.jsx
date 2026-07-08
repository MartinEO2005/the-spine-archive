import React, { useMemo, useState } from 'react';

// META GLOBAL PARA LA BARRA DE PROGRESO
const MILESTONE = 10000;

const StatsView = ({ stats: propStats, spines = [] }) => {
  const [expandedAuthor, setExpandedAuthor] = useState(null);
  const [authorTopSpines, setAuthorTopSpines] = useState([]);

  // --- CÁLCULO: TOP UPLOADERS (ÚLTIMOS 30 DÍAS) ---
  const topUploaders30Days = useMemo(() => {
    if (!spines.length) return [];
    
    const now = Date.now() / 1000; 
    const thirtyDays = 30 * 24 * 60 * 60;
    const counts = {};

    spines.forEach(s => {
      if (s.created_utc && (now - s.created_utc) <= thirtyDays) {
        const author = s.author ? s.author.replace('u/', '') : 'Unknown';
        counts[author] = (counts[author] || 0) + 1;
      }
    });

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
    const authorSpines = spines
        .filter(s => (s.author || '').replace('u/', '') === author)
        .slice(0, 5);
    setAuthorTopSpines(authorSpines);
  };

  if (!stats) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>No data available.</div>;

  // --- LÓGICA DE LA BARRA DE PROGRESO ---
  const progressPercent = Math.min((stats.totalSpines / MILESTONE) * 100, 100);
  const isMilestoneReached = stats.totalSpines >= MILESTONE;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '50px', color: 'white', backgroundColor: '#0d0d0d' }}>
      
      {/* Estilos inyectados para tipografía y animaciones de destello */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          @keyframes glow-pulse {
            0% { box-shadow: 0 0 10px #b30000, 0 0 20px #b30000; }
            50% { box-shadow: 0 0 20px #ffcc00, 0 0 40px #ffcc00; }
            100% { box-shadow: 0 0 10px #b30000, 0 0 20px #b30000; }
          }

          @keyframes fill-up {
            from { height: 0%; }
            to { height: ${progressPercent}%; }
          }
          
          .reddit-btn:hover {
            background-color: #FF4500 !important;
            color: white !important;
          }
        `}
      </style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <img 
            src="/logo.jpg" 
            alt="The Spine Archive Logo" 
            style={{ height: '160px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 10px rgba(179,0,0,0.5))' }} 
          />
        </div>

        <h1 style={{ 
          fontFamily: '"Press Start 2P", monospace', 
          textAlign: 'center', 
          borderBottom: '2px solid #333', 
          paddingBottom: '25px', 
          marginBottom: '40px',
          color: '#fff',
          textShadow: '3px 3px 0px #b30000',
          fontSize: '2rem',
          letterSpacing: '2px'
        }}>
          STATISTICS
        </h1>
        
        {/* PANEL SUPERIOR: BARRA DE PROGRESO + TARJETAS DE ESTADÍSTICAS */}
        <div style={{ display: 'flex', gap: '30px', margin: '40px 0', alignItems: 'stretch' }}>
          
          {/* BARRA DE PROGRESO VERTICAL */}
          <div style={{ 
            width: '80px', 
            backgroundColor: '#1a1a1a', 
            borderRadius: '12px', 
            border: '2px solid #333',
            display: 'flex',
            flexDirection: 'column-reverse', // Llena de abajo hacia arriba
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              width: '100%',
              height: `${progressPercent}%`,
              background: isMilestoneReached 
                ? 'linear-gradient(to top, #b30000, #ffcc00)' 
                : 'linear-gradient(to top, #4a0000, #b30000)',
              animation: isMilestoneReached ? 'glow-pulse 2s infinite, fill-up 1.5s ease-out' : 'fill-up 1.5s ease-out',
              borderTopRightRadius: '8px',
              borderTopLeftRadius: '8px',
              transition: 'height 1s ease-out'
            }}></div>
            {/* Texto superpuesto en la barra */}
            <div style={{ 
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
              writingMode: 'vertical-rl', textOrientation: 'mixed', transformOrigin: 'center',
              fontWeight: 'bold', letterSpacing: '2px', color: 'rgba(255,255,255,0.8)',
              textShadow: '1px 1px 2px black'
            }}>
              {stats.totalSpines} / {MILESTONE}
            </div>
          </div>

          {/* TARJETAS DE TOTALES Y TOP UPLOADERS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, backgroundColor: '#1a1a1a', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '45px', fontWeight: 'bold', color: '#b30000' }}>{stats.totalSpines}</div>
                <div style={{ color: '#888', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', marginTop: '5px' }}>Total Spines</div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#1a1a1a', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '45px', fontWeight: 'bold', color: 'white' }}>{stats.totalAuthors}</div>
                <div style={{ color: '#888', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', marginTop: '5px' }}>Total Authors</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <h2 style={{ color: '#ffcc00', margin: '0 0 15px 0', fontSize: '1.2rem', fontFamily: 'sans-serif' }}>
                🔥 Top Uploaders <span style={{ color: '#666', fontSize: '0.9rem' }}>(Last 30 Days)</span>
              </h2>
              {topUploaders30Days.length > 0 ? (
                topUploaders30Days.map(([author, count], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < topUploaders30Days.length - 1 ? '1px solid #2a2a2a' : 'none' }}>
                    <span style={{ fontWeight: 'bold', color: '#ddd' }}>#{i+1} u/{author}</span>
                    <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{count} <span style={{ color: '#666', fontWeight: 'normal' }}>spines</span></span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No new spines uploaded recently. Be the first!</div>
              )}
            </div>
          </div>

        </div>

        <h2 style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '20px', fontFamily: 'sans-serif', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Spines by Franchise</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '50px' }}>
          {franchiseStats.map(([name, count]) => (
            <div key={name} style={{ backgroundColor: '#1a1a1a', padding: '12px 25px', borderRadius: '25px', border: '1px solid rgba(179,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              <span style={{ fontWeight: 'bold', color: '#eee' }}>{name.toUpperCase()}</span>
              <span style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.1rem' }}>{count}</span>
            </div>
          ))}
        </div>

        <h2 style={{ color: 'white', fontFamily: 'sans-serif', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>All Contributors</h2>
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', marginBottom: '100px', boxShadow: '0 5px 20px rgba(0,0,0,0.4)' }}>
          {stats.topAuthors.map(([author, count], index) => {
            const isExpanded = expandedAuthor === author;
            return (
              <div key={author} style={{ backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#141414', borderBottom: '1px solid #2a2a2a' }}>
                
                <div 
                  onClick={() => handleExpandAuthor(author)} 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 25px', cursor: 'pointer', transition: 'background-color 0.2s', alignItems: 'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252525'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: index < 3 ? '#b30000' : '#eee' }}>u/{author}</span>
                  </div>
                  
                  {/* BOTÓN DE REDDIT SEPARADO Y VISUAL */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    <div style={{ fontWeight: 'bold', color: isExpanded ? '#b30000' : '#888', minWidth: '100px', textAlign: 'right' }}>
                      {count} spines <span style={{ marginLeft: '5px' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    <a 
                      href={`https://www.reddit.com/user/${author}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      onClick={(e) => e.stopPropagation()} 
                      className="reddit-btn"
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        color: '#FF4500', 
                        textDecoration: 'none', 
                        backgroundColor: 'rgba(255,69,0,0.1)', 
                        border: '1px solid #FF4500',
                        padding: '8px 16px', 
                        borderRadius: '20px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      Reddit ↗
                    </a>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '40px 25px', backgroundColor: '#0d0d0d', borderTop: '1px solid #333', display: 'flex', gap: '30px', overflowX: 'auto', alignItems: 'center', boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.3)' }}>
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
                                borderRadius: '4px', 
                                border: '1px solid #555',
                                boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                              }} 
                            />
                          </div>
                          <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', marginTop: '5px' }}>
                            {spine.title}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#666', fontSize: '13px' }}>No spines found.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsView;