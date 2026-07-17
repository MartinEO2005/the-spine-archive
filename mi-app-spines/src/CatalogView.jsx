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
  const [scrapeInfo, setScrapeInfo] = useState({ count: 0, authors: [], date: '' });

  useEffect(() => {
    // 1. Cargamos base de datos estática desde /public/database.json
    fetch('/database.json')
      .then(res => res.json())
      .then(data => { 
        setSpines(data); 
        setLoading(false); 
      });

    // 2. Cargamos metadatos de scrape_info.json generados automáticamente por Python
    fetch('/scrape_info.json')
      .then(res => res.json())
      .then(data => setScrapeInfo(data))
      .catch(() => {}); // Evitamos romper la web si el archivo aún no existe
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

  // DISPARADOR DEL POP-UP (Solo se muestra 1 vez por sesión del navegador)
  useEffect(() => {
    if (scrapeInfo.count > 0 && !sessionStorage.getItem('updateModalSeen')) {
      setShowUpdateModal(true);
      sessionStorage.setItem('updateModalSeen', 'true');
    }
  }, [scrapeInfo]);

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

  if (loading) return <div style={{color: 'white', textAlign: 'center', marginTop: '20%', fontFamily: '"Press Start 2P", monospace', fontSize: '14px'}}>LOADING...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111' }}>
      
      {/* POP-UP RETRO PIXEL RE-DISEÑADO (MÁS GRANDE Y LEGIBLE) */}
      {showUpdateModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: '"Press Start 2P", monospace'
        }}>
          <div style={{ 
            backgroundColor: '#222', 
            padding: '40px', 
            width: '680px', // Aumentado para dar espacio a los textos y nombres
            textAlign: 'center', 
            border: '4px solid #b30000', 
            boxShadow: '8px 8px 0px #000',
            boxSizing: 'border-box'
          }}>
            
            {/* Bowser de fuego reemplazando el emoji */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
              <img 
                src="/Imagen_fuego.jpg" 
                alt="Bowser Fire" 
                style={{ 
                  width: '320px', 
                  height: 'auto', 
                  display: 'block'
                }} 
              />
            </div>
            
            <h2 style={{ 
              color: '#fff', 
              fontSize: '18px', // Fuente más grande y legible
              marginBottom: '25px', 
              borderBottom: '4px solid #b30000',
              paddingBottom: '20px',
              textShadow: '3px 3px 0px #b30000',
              letterSpacing: '1px'
            }}>
              LATEST SCRAPE
            </h2>
            
            <div style={{ 
              backgroundColor: '#111', 
              padding: '25px', 
              border: '4px solid #333', 
              marginBottom: '30px',
              textAlign: 'left',
              lineHeight: '1.8'
            }}>
              <p style={{ color: '#fff', fontSize: '11px', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
                💥 <span style={{ color: '#ffcc00' }}>{scrapeInfo.count}</span> NEW SPINES DETECTED!
              </p>
              
              <p style={{ color: '#888', fontSize: '10px', margin: '0 0 20px 0' }}>
                SCRAPE DATE: {scrapeInfo.date}
              </p>
              
              <div style={{ borderTop: '2px dashed #333', paddingTop: '15px' }}>
                <p style={{ color: '#aaa', fontSize: '10px', margin: '0 0 10px 0', textDecoration: 'underline' }}>
                  CONTRIBUTORS:
                </p>
                <p style={{ 
                  color: '#ff4d4d', 
                  fontSize: '9px', 
                  margin: 0, 
                  lineHeight: '1.8',
                  wordBreak: 'break-word', // Asegura que no se salgan de los bordes del cuadro
                  whiteSpace: 'normal'
                }}>
                  {scrapeInfo.authors?.slice(0, 30).join(', ')}
                  {scrapeInfo.authors?.length > 30 ? ' and more!' : ''}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowUpdateModal(false)} 
              style={{ 
                background: '#b30000', 
                color: 'white', 
                border: '3px solid #fff', 
                cursor: 'pointer', 
                padding: '12px 30px', 
                fontWeight: 'bold', 
                fontFamily: '"Press Start 2P", monospace', 
                fontSize: '11px', // Botón más grande y fácil de clickear
                boxShadow: '4px 4px 0px #000',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              AWESOME!
            </button>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100, position: 'sticky', top: 0 }}>
        <img src="/logo.jpg" alt="Logo" onClick={() => setCurrentView('catalog')} style={{ height: '70px', cursor: 'pointer', marginRight: '30px' }} />
        
        <div style={{ display: 'flex', marginRight: '30px', fontFamily: 'sans-serif' }}>
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
                style={{ flex: 1, padding: '10px 20px', borderRadius: '5px', border: 'none', fontFamily: 'sans-serif' }} 
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
            boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
            fontFamily: 'sans-serif'
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
            cursor: 'pointer',
            fontFamily: 'sans-serif'
          }}
        >
          GENERATE PDF ({selectedSpines.length})
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: '#111', position: 'relative' }}>
        {currentView === 'catalog' ? (
          <>
            {/* BOTÓN FLOTANTE PARA ORDENAR */}
            <button 
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'az' : 'newest')}
              title={sortOrder === 'newest' ? 'Viewing Newest. Click for A-Z' : 'Viewing A-Z. Click for Newest'}
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                backgroundColor: '#222',
                color: '#fff',
                border: '3px solid #444',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                zIndex: 50,
                boxShadow: '3px 3px 0px #000',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {sortOrder === 'newest' ? '🔥' : '🔤'}
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