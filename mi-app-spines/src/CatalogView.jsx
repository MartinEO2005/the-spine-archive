import React, { useState, useEffect, useMemo } from 'react';
import SpineGrid from './SpineGrid';
import StatsView from './StatsView';
import AboutView from './AboutView';

const CatalogView = ({ onConfirm, initialSelected = [] }) => {
  const [spines, setSpines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpines, setSelectedSpines] = useState(initialSelected);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('catalog');

  useEffect(() => {
    fetch('/database.json')
      .then(res => res.json())
      .then(data => { setSpines(data); setLoading(false); });
  }, []);

  useEffect(() => { setSelectedSpines(initialSelected); }, [initialSelected]);

  const stats = useMemo(() => {
    if (!spines.length) return null;
    const counts = {};
    spines.forEach(s => {
      const author = s.author ? s.author.replace('u/', '') : 'Unknown';
      counts[author] = (counts[author] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return { totalSpines: spines.length, totalAuthors: Object.keys(counts).length, topAuthors: sorted };
  }, [spines]);

  const filteredSpines = spines.filter(s => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const title = s.title ? s.title.toLowerCase() : "";
    const author = s.author ? s.author.toLowerCase() : "";
    return title.includes(term) || author.includes(term);
  });
  
  const toggleSpine = (spine) => {
    const isSelected = selectedSpines.find(s => s.id === spine.id);
    if (isSelected) {
      setSelectedSpines(selectedSpines.filter(s => s.id !== spine.id));
    } else {
      setSelectedSpines([...selectedSpines, { ...spine, count: 1 }]);
    }
  };

  const navButtonStyle = (view) => ({
    backgroundColor: 'transparent', color: currentView === view ? 'white' : 'rgba(255,255,255,0.6)',
    border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginRight: '20px',
    borderBottom: currentView === view ? '2px solid white' : '2px solid transparent', padding: '5px 0'
  });

  if (loading) return <div style={{color: 'white', textAlign: 'center', marginTop: '20%'}}>LOADING DATABASE...</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111', fontFamily: 'sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100 }}>
        
        {/* --- CAMBIO AQUÍ: LOGO EN LUGAR DE TEXTO --- */}
        <img 
          src="/logo.jpg"  // Asegúrate de que la imagen se llame así en la carpeta public
          alt="The Spine Archive"
          onClick={() => setCurrentView('catalog')} // Al hacer clic te lleva al inicio
          style={{ 
            height: '70px', // Altura ajustada para caber en la barra de 70px
            width: 'auto', 
            objectFit: 'contain',
            marginRight: '30px', 
            cursor: 'pointer',
            borderRadius: '4px' // Opcional: suaviza las esquinas de la imagen
          }} 
        />

        <div style={{ display: 'flex', marginRight: '30px' }}>
          <button onClick={() => setCurrentView('catalog')} style={navButtonStyle('catalog')}>CATALOG</button>
          <button onClick={() => setCurrentView('stats')} style={navButtonStyle('stats')}>STATS</button>
          <button onClick={() => setCurrentView('about')} style={navButtonStyle('about')}>ABOUT</button>
        </div>
        
        {currentView === 'catalog' && (
          <input 
            type="text" 
            placeholder="Search by title or author..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, maxWidth: '400px', padding: '10px 20px', borderRadius: '5px', border: 'none' }}
          />
        )}
        
        <div style={{ flex: 1 }}></div>
        
        <button onClick={() => onConfirm(selectedSpines)} disabled={selectedSpines.length === 0}
          style={{ backgroundColor: selectedSpines.length > 0 ? 'white' : '#666', color: '#b30000', border: 'none', padding: '10px 25px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          GENERATE PDF ({selectedSpines.length})
        </button>
      </div>

      {currentView === 'catalog' && (
        <SpineGrid 
          spines={filteredSpines} 
          selectedSpines={selectedSpines} 
          toggleSpine={toggleSpine} 
          hoveredId={hoveredId} 
          setHoveredId={setHoveredId} 
        />
      )}
      
      {currentView === 'stats' && <StatsView stats={stats} spines={spines} />}
      
      {currentView === 'about' && <AboutView />}
    </div>
  );
};

export default CatalogView;