import React, { useMemo, useState, useEffect } from 'react';

const StatsView = ({ stats: propStats, spines = [] }) => {
  const [trendingAuthors, setTrendingAuthors] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [expandedAuthor, setExpandedAuthor] = useState(null);
  
  // Estados para el top 5 de spines del autor expandido
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
    setLoadingAuthorSpines(true);
    
    fetch(`/api/top-spines?author=${author}`)
      .then(res => res.json())
      .then(data => {
        if (data.topSpines && data.topSpines.length > 0) {
          const populated = data.topSpines.map(ts => {
            const found = spines.find(s => String(s.id) === String(ts.spineId));
            return found ? { ...found, clicks: ts.clicks } : null;
          }).filter(Boolean);
          setAuthorTopSpines(populated);
        } else {
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
        <h1 style={{ borderBottom: '2px solid #b30000', paddingBottom: '10px' }}>Project Statistics</h1>
        
        {/* --- CONTADORES PRINCIPALES --- */}
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

        {/* --- TRENDING CREATORS (REDIS) --- */}
        <h2 style={{ color: '#ffcc00', marginBottom: '15px' }}>🔥 Trending Creators (Top 5 by clicks)</h2>
        <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #ffcc00', marginBottom: '40px' }}>
          {loadingTrending ? (
            <div style={{ color: '#666' }}>Loading real-time data...</div>
          ) : trendingAuthors.length > 0 ? (
            trendingAuthors.slice(0, 5).map((entry, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid #333' : 'none' }}>
                <span style={{ fontWeight: 'bold' }}>#{i+1} u/{entry.author}</span>
                <span style={{ color: '#ffcc00' }}>{entry.clicks} clicks</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#666' }}>No clicks recorded yet. Be the first!</div>
          )}
        </div>

        {/* --- FRANQUICIAS --- */}
        <h2 style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '15px' }}>Spines by Franchise</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '50px' }}>
          {franchiseStats.map(([name, count]) => (
            <div key={name} style={{ backgroundColor: '#1a1a1a', padding: '10px 20px', borderRadius: '20px', border: '1px solid #b30000', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>{name.toUpperCase()}</span>
              <span style={{ color: '#b30000', fontWeight: 'bold' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* --- LISTADO DE TODOS LOS CONTRIBUYENTES CON DESPLEGABLE --- */}
        <h2 style={{ color: 'white' }}>All Contributors</h2>
        <div style={{ backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', marginBottom: '100px' }}>
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

                {isExpanded && (
                  <div style={{ padding: '40px 20px', backgroundColor: '#0a0a0a', borderTop: '1px solid #333', display: 'flex', gap: '40px', overflowX: 'auto', alignItems: 'center' }}>
                    {loadingAuthorSpines ? (
                      <div style={{ color: '#666', fontSize: '13px' }}>Loading top spines...</div>
                    ) : authorTopSpines.length > 0 ? (
                      authorTopSpines.map((spine, i) => (
                        <div key={i} style={{ flexShrink: 0, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          
                          {/* Contenedor de la Spine Tumbada (Horizontal) */}
                          <div style={{ width: '220px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' }}>
                            <img 
                              src={spine.image || spine.src} 
                              alt={spine.title} 
                              loading="lazy"
                              style={{ 
                                height: '220px', // Tamaño de la spine
                                transform: 'rotate(-90deg)', // El truco para que salga horizontal
                                transformOrigin: 'center',
                                borderRadius: '2px', 
                                border: '1px solid #444'
                              }} 
                            />
                          </div>
                          
                          <div style={{ color: '#aaa', fontSize: '11px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                            {spine.title}
                          </div>
                          {spine.clicks !== undefined && (
                             <div style={{ color: '#ffcc00', fontSize: '10px', marginTop: '5px', fontWeight: 'bold' }}>
                               🔥 {spine.clicks} clicks
                             </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#666', fontSize: '13px' }}>No spines recorded yet.</div>
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