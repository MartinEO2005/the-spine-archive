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

  // OPTIMIZACIÓN 1: Paginación para no explotar con 6000 imágenes
  const [visibleCount, setVisibleCount] = useState(60); 

  useEffect(() => {
    fetch('/database.json')
      .then(res => res.json())
      .then(data => { setSpines(data); setLoading(false); });
  }, []);

  useEffect(() => { setSelectedSpines(initialSelected); }, [initialSelected]);

  // Resetear la paginación si buscamos algo nuevo
  useEffect(() => {
    setVisibleCount(60);
  }, [searchTerm]);

  // Detectar scroll para cargar más imágenes automáticamente (Infinite Scroll simple)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount(prev => prev + 40); // Carga 40 más al llegar al fondo
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // OPTIMIZACIÓN 2: useMemo para que el filtrado sea instantáneo
  const filteredSpines = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return spines;
    return spines.filter(s => {
      const title = s.title ? s.title.toLowerCase() : "";
      const author = s.author ? s.author.toLowerCase() : "";
      return title.includes(term) || author.includes(term);
    });
  }, [spines, searchTerm]);

  // Aquí cortamos la lista para pasarle solo las visibles a SpineGrid
  const spinesToDisplay = filteredSpines.slice(0, visibleCount);
  
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111', fontFamily: 'sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100, position: 'sticky', top: 0 }}>
        
        <img 
          src="/logo.jpg"
          alt="The Spine Archive Logo"
          onClick={() => setCurrentView('catalog')}
          style={{ height: '70px', width: 'auto', objectFit: 'contain', marginRight: '30px', cursor: 'pointer', borderRadius: '4px' }} 
        />

        <div style={{ display: 'flex', marginRight: '30px' }}>
          <button onClick={() => setCurrentView('catalog')} style={navButtonStyle('catalog')}>CATALOG</button>
          <button onClick={() => setCurrentView('stats')} style={navButtonStyle('stats')}>STATS</button>
          <button onClick={() => setCurrentView('about')} style={navButtonStyle('about')}>ABOUT</button>
        </div>
        
        {currentView === 'catalog' && (
          <input 
            type="text" 
            placeholder="Search 6000+ titles..." 
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
        <div style={{ flex: 1 }}>
            <SpineGrid 
              spines={spinesToDisplay} 
              selectedSpines={selectedSpines} 
              toggleSpine={toggleSpine} 
              hoveredId={hoveredId} 
              setHoveredId={setHoveredId} 
            />
            {/* Mensaje sutil al final para saber que hay más */}
            {visibleCount < filteredSpines.length && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Scrolling to load more spines...
                </div>
            )}
        </div>
      )}
      
      {currentView === 'stats' && <StatsView stats={stats} spines={spines} />}
      
      {currentView === 'about' && <AboutView />}
    </div>
  );
};

export default CatalogView;