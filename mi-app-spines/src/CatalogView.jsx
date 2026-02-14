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
  const [visibleCount, setVisibleCount] = useState(60); 

  useEffect(() => {
    fetch('/database.json')
      .then(res => res.json())
      .then(data => { setSpines(data); setLoading(false); });
  }, []);

  useEffect(() => {
    setVisibleCount(60);
    window.scrollTo(0, 0);
  }, [searchTerm, currentView]);

  useEffect(() => {
    const handleScroll = () => {
      if (currentView !== 'catalog') return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        setVisibleCount(prev => prev + 40);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

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

  const filteredSpines = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return spines;
    return spines.filter(s => {
      const title = s.title?.toLowerCase() || "";
      const author = s.author?.toLowerCase() || "";
      return title.includes(term) || author.includes(term);
    });
  }, [spines, searchTerm]);

  if (loading) return <div style={{color: 'white', textAlign: 'center', marginTop: '20%', backgroundColor: '#111', height: '100vh'}}>LOADING...</div>;

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#111' }}>
      
      {/* HEADER */}
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 1000, position: 'sticky', top: 0, width: '100%', boxSizing: 'border-box' }}>
        <img src="/logo.jpg" alt="Logo" onClick={() => setCurrentView('catalog')} style={{ height: '50px', cursor: 'pointer', marginRight: '30px' }} />
        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => setCurrentView('catalog')} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', borderBottom: currentView === 'catalog' ? '3px solid white' : 'none' }}>CATALOG</button>
          <button onClick={() => setCurrentView('stats')} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', borderBottom: currentView === 'stats' ? '3px solid white' : 'none' }}>STATS</button>
          <button onClick={() => setCurrentView('about')} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', borderBottom: currentView === 'about' ? '3px solid white' : 'none' }}>ABOUT</button>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {currentView === 'catalog' && (
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '80%', maxWidth: '400px', padding: '10px', borderRadius: '5px', border: 'none' }} />
          )}
        </div>
        <button onClick={() => onConfirm(selectedSpines)} disabled={selectedSpines.length === 0} style={{ backgroundColor: 'white', color: '#b30000', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
          PDF ({selectedSpines.length})
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, width: '100%' }}>
        {currentView === 'catalog' ? (
          <SpineGrid 
            spines={filteredSpines.slice(0, visibleCount)} 
            selectedSpines={selectedSpines} 
            toggleSpine={(spine) => {
              const isSelected = selectedSpines.find(s => s.id === spine.id);
              setSelectedSpines(isSelected ? selectedSpines.filter(s => s.id !== spine.id) : [...selectedSpines, {...spine, count: 1}]);
            }} 
            hoveredId={hoveredId} setHoveredId={setHoveredId} 
          />
        ) : (
          <div className="view-container">
            {currentView === 'stats' ? <StatsView stats={stats} spines={spines} /> : <AboutView />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogView;