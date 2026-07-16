import React, { useState, useEffect, useMemo } from 'react';
import SpineGrid from './SpineGrid';
import StatsView from './StatsView';
import AboutView from './AboutView';
import RequestsView from './RequestsView';

const CatalogView = ({ onConfirm, initialSelected = [] }) => {
  const [spines, setSpines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState(''); 
  const [selectedSpines, setSelectedSpines] = useState(initialSelected);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('catalog');
  const [visibleCount, setVisibleCount] = useState(60); 
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetch('/database.json')
      .then(res => res.json())
      .then(data => { 
        setSpines(data); 
        setLoading(false); 
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('search');
    if (query) {
      const decodedQuery = decodeURIComponent(query).replace(/-/g, ' ');
      setSearchTerm(decodedQuery);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setVisibleCount(60); 
    }, 300);
    return () => clearTimeout(timer); 
  }, [searchTerm]);

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

  // LÓGICA DE NOVEDADES (Últimos 7 días)
  const recentData = useMemo(() => {
    if (!spines.length) return { count: 0, authors: [] };

    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const recentSpines = spines.filter(s => s.created_utc && s.created_utc >= sevenDaysAgo);

    if (recentSpines.length === 0) return { count: 0, authors: [] };

    const uniqueAuthors = [...new Set(recentSpines.map(s => s.author))].filter(Boolean);
    
    return {
      count: recentSpines.length,
      authors: uniqueAuthors
    };
  }, [spines]);

  // DISPARADOR DEL POP-UP (Solo 1 vez por sesión)
  useEffect(() => {
    if (recentData.count > 0 && !sessionStorage.getItem('updateModalSeen')) {
      setShowUpdateModal(true);
      sessionStorage.setItem('updateModalSeen', 'true');
    }
  }, [recentData]);

  // FILTRADO Y ORDENAMIENTO
  const filteredSpines = useMemo(() => {
    let result = [...spines];

    const term = debouncedTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(s => 
        (s.title && s.title.toLowerCase().includes(term)) || 
        (s.author && s.author.toLowerCase().includes(term))
      );
    }

    if (sortOrder === 'newest') {
      result.reverse(); 
    } else if (sortOrder === 'az') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [spines, debouncedTerm, sortOrder]);

  const registerClick = (spine) => {
    if (!spine || !spine.author) return;
    const cleanAuthor = spine.author.replace('u/', '');
    fetch(`/api/click?author=${cleanAuthor}&spineId=${spine.id}`).catch(() => {}); 
  };

  const navButtonStyle = (view) => ({
    backgroundColor: 'transparent', 
    color: currentView === view ? 'white' : 'rgba(255,255,255,0.6)',
    border: 'none', 
    fontWeight: 'bold', 
    fontSize: '16px', 
    cursor: 'pointer', 
    marginRight: '20px',
    borderBottom: currentView === view ? '2px solid white' : '2px solid transparent', 
    padding: '5px 0'
  });

  if (loading) return <div style={{color: 'white', textAlign: 'center', marginTop: '20%'}}>LOADING...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111' }}>
      
      {/* POP-UP DE NOVEDADES */}
      {showUpdateModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, 
          display: 'flex', justifyContent: 'center', alignItems: 'center' 
        }}>
          <div style={{ 
            backgroundColor: '#222', padding: '35px', borderRadius: '12px', width: '450px', 
            textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', border: '2px solid #b30000' 
          }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🔥</div>
            
            <h2 style={{ color: '#ffcc00', marginBottom: '20px', fontFamily: '"Press Start 2P", monospace', fontSize: '14px', lineHeight: '1.5' }}>
              LATEST UPDATE
            </h2>
            
            <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #444' }}>
              <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.6', margin: 0, fontFamily: 'sans-serif' }}>
                <strong>{recentData.count}</strong> new spines were added this week!
                <br/><br/>
                Huge thanks to our contributors:<br/>
                <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>
                  {recentData.authors.slice(0, 8).join(', ')}{recentData.authors.length > 8 ? ' and more!' : ''}
                </span>
              </p>
            </div>

            <button 
              onClick={() => setShowUpdateModal(false)} 
              style={{ 
                background: '#b30000', color: 'white', border: 'none', cursor: 'pointer', 
                padding: '12px 30px', borderRadius: '5px', fontWeight: 'bold', 
                fontFamily: '"Press Start 2P", monospace', fontSize: '10px',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.3)'
              }}
            >
              AWESOME!
            </button>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100, position: 'sticky', top: 0 }}>
        <img src="/logo.jpg" alt="Logo" onClick={() => setCurrentView('catalog')} style={{ height: '70px', cursor: 'pointer', marginRight: '30px' }} />
        
        <div style={{ display: 'flex', marginRight: '30px' }}>
          <button onClick={() => setCurrentView('catalog')} style={navButtonStyle('catalog')}>CATALOG</button>
          <button onClick={() => setCurrentView('stats')} style={navButtonStyle('stats')}>STATS</button>
          <button onClick={() => setCurrentView('requests')} style={navButtonStyle('requests')}>REQUESTS</button>
          <button onClick={() => setCurrentView('about')} style={navButtonStyle('about')}>ABOUT</button>
        </div>
        
        {currentView === 'catalog' && (
          <div style={{ flex: 1, maxWidth: '400px', display: 'flex', gap: '10px' }}>
             <input 
                type="text" 
                placeholder="Search by name, author..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ flex: 1, padding: '10px 20px', borderRadius: '5px', border: 'none' }} 
              />
          </div>
        )}
        
        <div style={{ flex: 1 }}></div>

        <a 
          href="https://ko-fi.com/martineo" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            backgroundColor: '#000',
            color: '#ffcc00', 
            padding: '10px 15px',
            border: '2px solid #ffcc00',
            fontWeight: 'bold',
            textDecoration: 'none',
            fontSize: '13px',
            marginRight: '15px',
            borderRadius: '5px',
            boxShadow: '3px 3px 0px rgba(0,0,0,0.2)'
          }}
        >
          ⭐ SUPPORT THE PROJECT
        </a>

        <button 
          onClick={() => onConfirm(selectedSpines)} 
          disabled={selectedSpines.length === 0} 
          style={{ 
            backgroundColor: selectedSpines.length > 0 ? 'white' : '#666', 
            color: '#b30000', 
            border: 'none', 
            padding: '10px 25px', 
            borderRadius: '5px', 
            fontWeight: 'bold', 
            cursor: 'pointer' 
          }}
        >
          GENERATE PDF ({selectedSpines.length})
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: '#111', position: 'relative' }}>
        {currentView === 'catalog' ? (
          <>
            {/* BOTÓN FLOTANTE PARA ORDENAR (Posición absoluta pura, no rompe el grid) */}
            <button 
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'az' : 'newest')}
              title={sortOrder === 'newest' ? 'Viewing Newest. Click for A-Z' : 'Viewing A-Z. Click for Newest'}
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                backgroundColor: '#222',
                color: '#fff',
                border: '2px solid #444',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                zIndex: 50,
                boxShadow: '2px 2px 0px #000',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {sortOrder === 'newest' ? '🔄' : '🔤'}
            </button>

            {/* SE RESTAURA EL GRID LIMPIO SIN PADDINGS EXTRAÑOS */}
            <SpineGrid 
              spines={filteredSpines.slice(0, visibleCount)} 
              selectedSpines={selectedSpines} 
              toggleSpine={(s) => {
                const isSelected = selectedSpines.find(x => x.id === s.id);
                if (!isSelected) registerClick(s); 
                setSelectedSpines(isSelected ? selectedSpines.filter(x => x.id !== s.id) : [...selectedSpines, {...s, count: 1}]);
              }} 
              hoveredId={hoveredId} 
              setHoveredId={setHoveredId} 
            />
          </>
        ) : (
          <div style={{ padding: '40px', minHeight: '100vh' }}>
            {currentView === 'stats' && <StatsView spines={spines} />}
            {currentView === 'requests' && <RequestsView />}
            {currentView === 'about' && <AboutView />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogView;