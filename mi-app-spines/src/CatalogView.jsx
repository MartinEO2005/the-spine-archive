import React, { useState, useEffect, useMemo } from 'react';
import SpineGrid from './SpineGrid';
import StatsView from './StatsView';
import AboutView from './AboutView';
import RequestsView from './RequestsView';

// --- GENERADOR DE PURPURINA PARA EL POP-UP ---
const CONFETTI_PARTICLES = Array.from({ length: 30 }).map(() => ({
  left: `${Math.random() * 100}%`,
  color: ['#ffcc00', '#b30000', '#00ff00', '#00ffff'][Math.floor(Math.random() * 4)],
  duration: `${1 + Math.random() * 1.5}s`,
  delay: `${Math.random() * 2}s`
}));

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
    fetch('/database.json')
      .then(res => res.json())
      .then(data => { 
        setSpines(data); 
        setLoading(false); 
      });

    fetch('/scrape_info.json')
      .then(res => res.json())
      .then(data => setScrapeInfo(data))
      .catch(() => {});
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

  useEffect(() => {
    if (scrapeInfo.count > 0 && !sessionStorage.getItem('updateModalSeen')) {
      setShowUpdateModal(true);
      sessionStorage.setItem('updateModalSeen', 'true');
    }
  }, [scrapeInfo]);

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
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          @keyframes confetti-fall {
            0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
          }

          @keyframes pulse-border {
            0% { border-color: #b30000; box-shadow: 0 0 10px #b30000; }
            50% { border-color: #ffcc00; box-shadow: 0 0 30px #ffcc00; }
            100% { border-color: #b30000; box-shadow: 0 0 10px #b30000; }
          }
        `}
      </style>

      {/* POP-UP RETRO PIXEL CON EFECTOS VISUALES */}
      {showUpdateModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: '"Press Start 2P", monospace'
        }}>
          
          {/* Lluvia de confeti de fondo */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {CONFETTI_PARTICLES.map((particle, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: '-10px',
                left: particle.left,
                width: '6px', height: '6px',
                backgroundColor: particle.color,
                animation: `confetti-fall ${particle.duration} infinite linear`,
                animationDelay: particle.delay
              }}></div>
            ))}
          </div>

          <div style={{ 
            backgroundColor: '#1a1a1a', 
            padding: '40px', 
            width: '750px', 
            textAlign: 'center', 
            border: '4px solid #b30000', 
            animation: 'pulse-border 2s infinite',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 10
          }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <img 
                src="/Imagen_fuego.jpg" 
                alt="Bowser Fire" 
                style={{ 
                  width: '380px', 
                  height: 'auto', 
                  display: 'block',
                  filter: 'drop-shadow(0px 0px 15px rgba(255, 100, 0, 0.4))'
                }} 
              />
            </div>
            
            <h2 style={{ 
              color: '#fff', 
              fontSize: '22px', 
              marginBottom: '25px', 
              borderBottom: '4px solid #b30000',
              paddingBottom: '20px',
              textShadow: '4px 4px 0px #b30000',
              letterSpacing: '2px'
            }}>
              LATEST SCRAPE
            </h2>
            
            <div style={{ 
              backgroundColor: '#111', 
              padding: '30px', 
              border: '4px solid #333', 
              marginBottom: '35px',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: '#fff', 
                fontSize: '14px', 
                marginBottom: '15px', 
                lineHeight: '1.8' 
              }}>
                <span style={{ color: '#ffcc00', fontSize: '24px', textShadow: '2px 2px #000' }}>{scrapeInfo.count}</span><br/> 
                NEW SPINES DETECTED!
              </div>
              
              <div style={{ color: '#888', fontSize: '9px', marginBottom: '25px', fontFamily: 'monospace' }}>
                [ SYSTEM DATE: {scrapeInfo.date} ]
              </div>
              
              <div style={{ borderTop: '2px dashed #444', paddingTop: '20px' }}>
                <p style={{ color: '#ffcc00', fontSize: '10px', margin: '0 0 15px 0' }}>
                  ★ TOP CONTRIBUTORS ★
                </p>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'center', 
                  gap: '10px' 
                }}>
                  {scrapeInfo.authors?.slice(0, 30).map((author, idx) => (
                    <span key={idx} style={{
                      backgroundColor: '#222',
                      color: '#ff4d4d',
                      padding: '8px 12px',
                      border: '2px solid #555',
                      fontSize: '9px',
                      boxShadow: '2px 2px 0px #000'
                    }}>
                      {author}
                    </span>
                  ))}
                  {scrapeInfo.authors?.length > 30 && (
                    <span style={{ color: '#888', fontSize: '9px', padding: '8px' }}>...and more!</span>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowUpdateModal(false)} 
              style={{ 
                background: '#b30000', 
                color: 'white', 
                border: '4px solid #fff', 
                cursor: 'pointer', 
                padding: '15px 40px', 
                fontWeight: 'bold', 
                fontFamily: '"Press Start 2P", monospace', 
                fontSize: '14px', 
                boxShadow: '6px 6px 0px #000',
                transition: 'transform 0.1s',
                letterSpacing: '1px'
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