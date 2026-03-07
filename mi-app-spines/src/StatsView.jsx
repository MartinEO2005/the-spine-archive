import React, { useMemo, useState, useEffect } from 'react';

const StatsView = ({ stats: propStats, spines = [] }) => {
  const [trendingAuthors, setTrendingAuthors] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  
  // Nuevo estado para controlar qué autor está desplegado
  const [expandedAuthor, setExpandedAuthor] = useState(null);

  // Cargar ranking de Redis (Top 5)
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

  // Función para obtener hasta 5 spines de un autor específico
  const getTopSpinesForAuthor = (authorName) => {
    return spines.filter(s => {
      const cleanA = s.author ? s.author.replace('u/', '') : 'Unknown';
      return cleanA === authorName;
    }).slice(0, 5);
  };

  if (!stats) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>No data available.</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '50px', color: 'white', backgroundColor: '#111' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ borderBottom: '2px solid #b30000', paddingBottom: '10px' }}>Project Statistics</h1>
        
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

        {/* --- SECCIÓN: RANKING POPULARIDAD (REDIS) --- */}
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

        <h2 style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '15px' }}>Spines by Franchise</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '50px' }}>
          {franchiseStats.map(([name, count]) => (
            <div key={name} style={{ backgroundColor: '#1a1a1a', padding: '10px 20px', borderRadius: '20px', border: '1px solid #b30000', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>{name.toUpperCase()}</span>
              <span style={{ color: '#b30000', fontWeight: 'bold' }}>{count}</span>
            </div>
          ))}
        </div>

        <h2 style={{ color: 'white' }}>All Contributors</h2>
        <div style={{ backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
          {stats.topAuthors.map(([author, count], index) => {
            const isExpanded = expandedAuthor === author;
            return (
              <div key={author} style={{ backgroundColor: index % 2 === 0 ? '#222' : '#1a1a1a', borderBottom: '1px solid #333' }}>
                
                {/* Cabecera de la fila interactiva */}
                <div 
                  onClick={() => setExpandedAuthor(isExpanded ? null : author)} 
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', cursor: 'pointer', alignItems: 'center', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: 'bold', color: index < 3 ? '#b30000' : 'white' }}>u/{author}</span>
                    <a 
                      href={`https://www.reddit.com/user/${author}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      onClick={(e) => e.stopPropagation()} // Evita que se cierre el acordeón al ir a Reddit
                      style={{ fontSize: '11px', color: '#ccc', textDecoration: 'none', backgroundColor: '#444', padding: '3px 8px', borderRadius: '4px' }}
                    >
                      Reddit ↗
                    </a>
                  </div>
                  <div style={{ fontWeight: 'bold', color: isExpanded ? '#b30000' : 'white' }}>
                    {count} spines {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {/* Desplegable de Spines (Horizontal) */}
                {isExpanded && (
                  <div style={{ padding: '20px', backgroundColor: '#050505', borderTop: '1px solid #333', display: 'flex', gap: '20px', overflowX: 'auto' }}>
                    {getTopSpinesForAuthor(author).map((spine, i) => (
                      <div key={i} style={{ flexShrink: 0, width: '100px', textAlign: 'center' }}>
                        <img 
                          src={spine.image || spine.src} 
                          alt={spine.title} 
                          loading="lazy"
                          style={{ height: '180px', width: 'auto', display: 'block', margin: '0 auto', borderRadius: '4px', border: '1px solid #444', objectFit: 'contain' }} 
                        />
                        <div style={{ color: '#aaa', fontSize: '11px', marginTop: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {spine.title}
                        </div>
                      </div>
                    ))}
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