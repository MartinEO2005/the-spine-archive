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
    const handleScroll = () => {
      if (currentView !== 'catalog') return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        setVisibleCount(prev => prev + 40);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const filteredSpines = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return spines;
    return spines.filter(s => {
      const title = s.title?.toLowerCase() || "";
      const author = s.author?.toLowerCase() || "";
      return title.includes(term) || author.includes(term);
    });
  }, [spines, searchTerm]);

  const navButtonStyle = (view) => ({
    backgroundColor: 'transparent', color: currentView === view ? 'white' : 'rgba(255,255,255,0.6)',
    border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginRight: '20px',
    borderBottom: currentView === view ? '2px solid white' : '2px solid transparent', padding: '5px 0'
  });

  if (loading) return <div style={{color: 'white', textAlign: 'center', marginTop: '20%'}}>LOADING...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111' }}>
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100, position: 'sticky', top: 0 }}>
        <img src="/logo.jpg" alt="Logo" onClick={() => setCurrentView('catalog')} style={{ height: '70px', cursor: 'pointer', marginRight: '30px' }} />
        <div style={{ display: 'flex', marginRight: '30px' }}>
          <button onClick={() => setCurrentView('catalog')} style={navButtonStyle('catalog')}>CATALOG</button>
          <button onClick={() => setCurrentView('stats')} style={navButtonStyle('stats')}>STATS</button>
          <button onClick={() => setCurrentView('about')} style={navButtonStyle('about')}>ABOUT</button>
        </div>
        {currentView === 'catalog' && (
          <input type="text" placeholder="Search 6000+ titles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, maxWidth: '400px', padding: '10px 20px', borderRadius: '5px', border: 'none' }} />
        )}
        <div style={{ flex: 1 }}></div>
        <button onClick={() => onConfirm(selectedSpines)} disabled={selectedSpines.length === 0} style={{ backgroundColor: selectedSpines.length > 0 ? 'white' : '#666', color: '#b30000', border: 'none', padding: '10px 25px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          GENERATE PDF ({selectedSpines.length})
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: '#111' }}>
        {currentView === 'catalog' ? (
          <SpineGrid spines={filteredSpines.slice(0, visibleCount)} selectedSpines={selectedSpines} toggleSpine={(s) => {
            const isSelected = selectedSpines.find(x => x.id === s.id);
            setSelectedSpines(isSelected ? selectedSpines.filter(x => x.id !== s.id) : [...selectedSpines, {...s, count: 1}]);
          }} hoveredId={hoveredId} setHoveredId={setHoveredId} />
        ) : (
          <div style={{ padding: '40px', minHeight: '100vh' }}>
            {currentView === 'stats' ? <StatsView spines={spines} /> : <AboutView />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogView;