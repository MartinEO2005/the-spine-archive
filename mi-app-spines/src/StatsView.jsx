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

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '50px', color: 'white', backgroundColor: '#111' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        `}
      </style>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
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
          borderBottom: '4px solid #b30000', 
          paddingBottom: '25px', 
          marginBottom: '40px',
          color: '#fff',
          textShadow: '3px 3px 0px #b30000',
          fontSize: '2rem',
          letterSpacing: '2px'
        }}>
          STATISTICS
        </h1>
        
        <div style={{ display: 'flex', gap: '20px', margin: '40px 0' }}>
          <div style={{ flex: 1, backgroundColor: '#222', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#b30000' }}>{stats.totalSpines}</div>
            <div style={{ color: '#aaa' }}>Total Spines</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#222', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'white' }}>{stats.totalAuthors}</div>
            <div style={{ color: '#aaa' }}>Total Authors</div>
          </div>
        </div>

        {/* --- NUEVA SECCIÓN: TOP UPLOADERS (30 DAYS) --- */}
        <h2 style={{ color: '#ffcc00', marginBottom: '15px', fontFamily: 'sans-serif' }}>🔥 Top Uploaders (Last 30 Days)</h2>
        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #ffcc00', marginBottom: '40px' }}>
          {topUploaders30Days.length > 0 ? (
            topUploaders30Days.map(([author, count], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < topUploaders30Days.length - 1 ? '1px solid #333' : 'none' }}>
                <span style={{ fontWeight: 'bold' }}>#{i+1} u/{author}</span>
                <span style={{ color: '#ffcc00' }}>{count} spines uploaded</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#666' }}>No new spines uploaded in the last 30 days. Be the first!</div>
          )}
        </div>

        <h2 style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '15px', fontFamily: 'sans-serif' }}>Spines by Franchise</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '50px' }}>
          {franchiseStats.map(([name, count]) => (
            <div key={name} style={{ backgroundColor: '#1a1a1a', padding: '10px 20px', borderRadius: '20px', border: '1px solid #b30000', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>{name.toUpperCase()}</span>
              <span style={{ color: '#b30000', fontWeight: 'bold' }}>{count}</span>
            </div>
          ))}
        </div>

        <h2 style={{ color: 'white', fontFamily: 'sans-serif' }}>All Contributors</h2>
        <div style={{ backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', marginBottom: '100px' }}>
          {stats.topAuthors.map(([author, count], index) => {
            const isExpanded = expandedAuthor === author;
            return (
              <div key={author} style={{ backgroundColor: index % 2 === 0 ? '#222' : '#1a1a1a', borderBottom: '1px solid #333' }}>
                
                <div 
                  onClick={() => handleExpandAuthor(author)} 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', cursor: 'pointer', transition: 'background-color 0.2s', alignItems: 'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: 'bold', color: index < 3 ? '#b30000' : 'white' }}>u/{author}</span>
                    <a 
                      href={`https://www.reddit.com/user/${author}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      onClick={(e) => e.stopPropagation()} 
                      style={{ fontSize: '11px', color: '#ccc', textDecoration: 'none', backgroundColor: '#444', padding: '2px 8px', borderRadius: '4px' }}
                    >
                      Reddit ↗
                    </a>
                  </div>
                  <div style={{ fontWeight: 'bold', color: isExpanded ? '#b30000' : 'white' }}>
                    {count} spines {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '40px 20px', backgroundColor: '#0a0a0a', borderTop: '1px solid #333', display: 'flex', gap: '40px', overflowX: 'auto', alignItems: 'center' }}>
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
                                borderRadius: '2px', 
                                border: '1px solid #444'
                              }} 
                            />
                          </div>
                          <div style={{ color: '#aaa', fontSize: '11px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
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