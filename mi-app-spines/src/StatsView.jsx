import React, { useMemo, useState, useEffect } from 'react';

const StatsView = ({ stats: propStats, spines = [] }) => {
  const [trendingAuthors, setTrendingAuthors] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [expandedAuthor, setExpandedAuthor] = useState(null);
  
  // Nuevos estados para el top 5 de spines del autor expandido
  const [authorTopSpines, setAuthorTopSpines] = useState([]);
  const [loadingAuthorSpines, setLoadingAuthorSpines] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setTrendingAuthors(data.ranking || []);
        setLoadingTrending(false);
      })
      .catch(() => setLoadingTrending(false));
  }, []);

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

  const franchiseStats = useMemo(() => { /* Igual que lo tenías */
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

  // Manejar el clic en el desplegable
  const handleExpandAuthor = (author) => {
    if (expandedAuthor === author) {
      setExpandedAuthor(null);
      return;
    }
    setExpandedAuthor(author);
    setLoadingAuthorSpines(true);
    
    // Buscar en Redis las más clickeadas
    fetch(`/api/top-spines?author=${author}`)
      .then(res => res.json())
      .then(data => {
        if (data.topSpines && data.topSpines.length > 0) {
          // Unir datos de Redis con las imágenes de tu catálogo
          const populated = data.topSpines.map(ts => {
            const found = spines.find(s => String(s.id) === String(ts.spineId));
            return { ...found, clicks: ts.clicks };
          }).filter(s => s && s.title);
          setAuthorTopSpines(populated);
        } else {
          // Si no hay clics, muestra las 5 primeras por defecto
          setAuthorTopSpines(spines.filter(s => (s.author || '').replace('u/', '') === author).slice(0, 5));
        }
        setLoadingAuthorSpines(false);
      })
      .catch(() => {
        setAuthorTopSpines(spines.filter(s => (s.author || '').replace('u/', '') === author).slice(0, 5));
        setLoadingAuthorSpines(false);
      });
  };

  if (!stats) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>No data available.</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '50px', color: 'white', backgroundColor: '#111' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ... (Toda la sección superior se mantiene idéntica) ... */}
        <h1 style={{ borderBottom: '2px solid #b30000', paddingBottom: '10px' }}>Project Statistics</h1>
        
        {/* Trending Creators ... */}
        {/* Franchise Stats ... */}

        <h2 style={{ color: 'white', marginTop: '40px' }}>All Contributors</h2>
        <div style={{ backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
          {stats.topAuthors.map(([author, count], index) => {
            const isExpanded = expandedAuthor === author;
            return (
              <div key={author} style={{ backgroundColor: index % 2 === 0 ? '#222' : '#1a1a1a', borderBottom: '1px solid #333' }}>
                
                <div 
                  onClick={() => handleExpandAuthor(author)} 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontWeight: 'bold', color: index < 3 ? '#b30000' : 'white' }}>u/{author}</span>
                  <div style={{ fontWeight: 'bold', color: isExpanded ? '#b30000' : 'white' }}>
                    {count} spines {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {/* EL DESPLEGABLE HORIZONTAL */}
                {isExpanded && (
                  <div style={{ padding: '30px 20px', backgroundColor: '#0a0a0a', borderTop: '1px solid #333', display: 'flex', gap: '30px', overflowX: 'auto', alignItems: 'flex-start' }}>
                    {loadingAuthorSpines ? (
                      <div style={{ color: '#666', fontSize: '13px' }}>Loading top spines...</div>
                    ) : authorTopSpines.length > 0 ? (
                      authorTopSpines.map((spine, i) => (
                        <div key={i} style={{ flexShrink: 0, width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          
                          {/* Contenedor truco CSS para tumbar la Spine */}
                          <div style={{ width: '180px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                            <img 
                              src={spine.image || spine.src} 
                              alt={spine.title} 
                              loading="lazy"
                              style={{ 
                                height: '180px', // Altura original de la spine
                                transform: 'rotate(-90deg)', // La tumbamos hacia la izquierda
                                transformOrigin: 'center',
                                borderRadius: '4px', 
                                border: '1px solid #444'
                              }} 
                            />
                          </div>
                          
                          <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            {spine.title}
                          </div>
                          {/* Etiqueta de clics (solo si existe) */}
                          {spine.clicks !== undefined && (
                             <div style={{ color: '#ffcc00', fontSize: '11px', marginTop: '5px', fontWeight: 'bold' }}>
                               🔥 {spine.clicks} clicks
                             </div>
                          )}
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