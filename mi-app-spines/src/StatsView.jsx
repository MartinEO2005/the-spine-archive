import React, { useMemo } from 'react';

const StatsView = ({ stats, spines = [] }) => {
  if (!stats) return null;

  // --- LÓGICA DE FRANQUICIAS ---
  const franchiseStats = useMemo(() => {
    const counts = {
      Zelda: 0,
      Mario: 0,
      Xenoblade: 0,
      Pokemon: 0,
      Metroid: 0,
      Kirby: 0,
      DragonQuest: 0,
      AnimalCrossing: 0
    };

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

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '50px', color: 'white' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ borderBottom: '2px solid #b30000', paddingBottom: '10px' }}>Project Statistics</h1>
        
        {/* FILA 1: ESTADÍSTICAS GENERALES */}
        <div style={{ display: 'flex', gap: '20px', margin: '40px 0' }}>
          <div style={{ flex: 1, backgroundColor: '#222', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#b30000' }}>{stats.totalSpines}</div>
            <div style={{ color: '#aaa' }}>Total Spines</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#222', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
            <div style={{ fontSize: '40px', fontWeight: 'bold', color: 'white' }}>{stats.totalAuthors}</div>
            <div style={{ color: '#aaa' }}>Authors</div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: FRANQUICIAS POPULARES */}
        <h2 style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '15px' }}>Spines by Franchise</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '50px' }}>
          {franchiseStats.map(([name, count]) => (
            <div key={name} style={{ 
              backgroundColor: '#1a1a1a', 
              padding: '10px 20px', 
              borderRadius: '20px', 
              border: '1px solid #b30000',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontWeight: 'bold' }}>{name.toUpperCase()}</span>
              <span style={{ color: '#b30000', fontWeight: 'bold' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* LISTA DE TOP CONTRIBUTORS */}
        <h2>Top Contributors (Click their name to support them!)</h2>
        <div style={{ backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
          {stats.topAuthors.map(([author, count], index) => (
            <div key={author} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '15px 20px', 
              backgroundColor: index % 2 === 0 ? '#222' : '#1a1a1a', 
              borderBottom: '1px solid #333' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Aumentado el width de 30px a 50px para evitar solapamiento en #100+ */}
                <span style={{ width: '50px', color: '#666', fontSize: '0.9rem' }}>#{index + 1}</span>
                <a 
                  href={`https://www.reddit.com/user/${author}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    fontWeight: 'bold', 
                    color: index < 3 ? '#b30000' : 'white', 
                    textDecoration: 'none' 
                  }}
                >
                  u/{author}
                </a>
              </div>
              <div style={{ fontWeight: 'bold' }}>{count} spines</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsView;