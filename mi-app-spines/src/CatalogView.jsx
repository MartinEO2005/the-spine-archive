import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import SpineGrid from './SpineGrid';
import StatsView from './StatsView';
import AboutView from './AboutView';
import RequestsView from './RequestsView';
import LegalView from './LegalView';

import SeoTextSection from './components/catalog/SeoTextSection';
import FilterMenu from './components/catalog/FilterMenu';
import UpdateModal from './components/catalog/UpdateModal';

const CatalogView = ({ onConfirm, initialSelected = [], isMobile = false, onOpenGuide, onOpenTagEdit }) => {
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

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatusMsg, setPdfStatusMsg] = useState('');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedFilters, setSelectedFilters] = useState({
    "Platform": [],
    "Main Style": [],
    "Title Typography": [],
    "Lower logo": [],
    "Extras": [],
    "Text Alignment": [],
    "Base Color": []
  });

  const changeView = (newView) => {
    if (newView === 'guide') {
      if (onOpenGuide) onOpenGuide();
      return;
    }
    setCurrentView(newView);
    const url = new URL(window.location);
    if (newView === 'catalog') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', newView);
    }
    window.history.pushState({}, '', url);
  };

  const handleFilterChange = (category, value) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      "Platform": [],
      "Main Style": [],
      "Title Typography": [],
      "Lower logo": [],
      "Extras": [],
      "Text Alignment": [],
      "Base Color": []
    });
  };

  const totalActiveFilters = Object.values(selectedFilters).flat().length;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setShowPdfModal(true);
      setPdfLoading(true);
      setPdfStatusMsg("PROCESANDO ARCHIVO PDF...");

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const metadataSubject = pdfDoc.getSubject();

        if (metadataSubject) {
          const parsedData = JSON.parse(metadataSubject);
          const restoredSpines = parsedData.selectedSpines || parsedData.images || (Array.isArray(parsedData) ? parsedData : null);

          if (restoredSpines && Array.isArray(restoredSpines) && restoredSpines.length > 0) {
            setSelectedSpines(restoredSpines);
            setPdfStatusMsg(`¡PROGRESO RESTAURADO! SE CARGARON ${restoredSpines.length} SPINES.`);
          } else {
            setPdfStatusMsg("EL PDF NO CONTIENE LISTA DE SPINES VÁLIDA.");
          }
        } else {
          setPdfStatusMsg("ESTE PDF NO CONTIENE METADATOS DE ARCHIVO.");
        }
      } catch (error) {
        console.error("Error al procesar el PDF:", error);
        setPdfStatusMsg("ERROR AL LEER EL ARCHIVO PDF.");
      } finally {
        setPdfLoading(false);
        e.target.value = null;
      }
    } else if (file) {
      alert("Por favor, selecciona un archivo PDF válido.");
    }
  };

  useEffect(() => {
    fetch(`/scrape_info.json?t=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error("Fallo al cargar scrape_info");
        return res.json();
      })
      .then(info => {
        setScrapeInfo(info);
        const version = info.date ? encodeURIComponent(info.date) : "v1";
        return fetch(`/database.json?v=${version}`);
      })
      .catch(() => fetch('/database.json'))
      .then(res => res.json())
      .then(data => { 
        setSpines(data); 
        setLoading(false); 
      })
      .catch(err => {
        console.error("Error al cargar la base de datos:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'guide') {
      if (onOpenGuide) onOpenGuide();
    } else if (viewParam && ['stats', 'requests', 'about', 'legal'].includes(viewParam)) {
      setCurrentView(viewParam);
    }
    const query = params.get('search');
    if (query) {
      const decodedQuery = decodeURIComponent(query).replace(/-/g, ' ');
      setSearchTerm(decodedQuery);
    }
  }, [onOpenGuide]);

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

  const normalizeText = (text) => {
    if (!text) return '';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filteredSpines = useMemo(() => {
    let result = [...spines];
    const term = debouncedTerm.trim();

    if (term) {
      const searchWords = normalizeText(term).split(/\s+/);
      result = result.filter(s => {
        const normalizedTitle = normalizeText(s.title);
        const normalizedAuthor = normalizeText(s.author);
        return searchWords.every(word => 
          normalizedTitle.includes(word) || normalizedAuthor.includes(word)
        );
      });
    }

    Object.keys(selectedFilters).forEach(catKey => {
      const activeValues = selectedFilters[catKey];
      if (activeValues && activeValues.length > 0) {
        result = result.filter(spine => {
          if (!spine.tags) return false;
          const tagValue = spine.tags[catKey] ?? 
                           spine.tags[catKey.toLowerCase()] ?? 
                           spine.tags[catKey.charAt(0).toUpperCase() + catKey.slice(1)];
          if (!tagValue) return false;
          if (Array.isArray(tagValue)) {
            return activeValues.some(val => tagValue.includes(val));
          }
          return activeValues.includes(tagValue);
        });
      }
    });

    if (sortOrder === 'newest') {
      result.reverse(); 
    } else if (sortOrder === 'az') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [spines, debouncedTerm, sortOrder, selectedFilters]);

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

      {/* MODAL NOVEDADES SCRAPE */}
      <UpdateModal 
        showUpdateModal={showUpdateModal} 
        setShowUpdateModal={setShowUpdateModal} 
        scrapeInfo={scrapeInfo} 
      />

      {/* MODAL RESTAURAR PDF */}
      {showPdfModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: '"Press Start 2P", monospace'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a', padding: '30px', border: '3px solid #b30000',
            textAlign: 'center', color: 'white', width: '420px'
          }}>
            {pdfLoading ? (
              <>
                <div style={{ fontSize: '30px', marginBottom: '20px' }}>⏳</div>
                <p style={{ fontSize: '12px', lineHeight: '1.6' }}>PROCESANDO ARCHIVO PDF...</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '30px', marginBottom: '20px' }}>📄</div>
                <p style={{ fontSize: '11px', marginBottom: '20px', lineHeight: '1.6' }}>{pdfStatusMsg}</p>
                <button 
                  onClick={() => setShowPdfModal(false)}
                  style={{
                    backgroundColor: '#b30000', color: 'white', border: 'none',
                    padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px'
                  }}
                >
                  CERRAR
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* NAVBAR SUPERIOR */}
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100, position: 'sticky', top: 0 }}>
        <img src="/logo.jpg" alt="Logo" onClick={() => changeView('catalog')} style={{ height: '70px', cursor: 'pointer', marginRight: '30px' }} />
        
        <div style={{ display: 'flex', marginRight: '30px', fontFamily: 'sans-serif' }}>
          <button onClick={() => changeView('catalog')} style={navButtonStyle('catalog')}>CATALOG</button>
          <button onClick={() => changeView('stats')} style={navButtonStyle('stats')}>STATS</button>
          <button onClick={() => changeView('requests')} style={navButtonStyle('requests')}>REQUESTS</button>
          <button onClick={() => changeView('about')} style={navButtonStyle('about')}>ABOUT</button>
        </div>
        
        <div style={{ flex: 1 }}></div>

        <a 
          href="https://www.stopkillinggames.com/" 
          target="_blank" 
          rel="noreferrer" 
          style={{ 
            color: '#ffcc00', 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '11px', 
            textDecoration: 'none', 
            textShadow: '2px 2px 0px #000',
            letterSpacing: '1px',
            marginRight: '25px',
            display: 'inline-block'
          }}
        >
          ✊ #StopKillingGames
        </a>

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
            borderRadius: '5px'
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

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/pdf" 
        style={{ display: 'none' }} 
      />

      {/* BARRA DE HERRAMIENTAS Y BÚSQUEDA */}
      {currentView === 'catalog' && (
        <div style={{ backgroundColor: '#111', padding: '20px 30px 10px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ 
              fontSize: '16px', 
              color: '#ffcc00', 
              fontFamily: '"Press Start 2P", monospace', 
              marginBottom: '10px',
              textShadow: '2px 2px 0px #000'
            }}>
              LEVEL UP YOUR GAME SHELF WITH CUSTOM SPINES
            </h1>
            <p style={{ fontSize: '13px', color: '#aaaaaa', maxWidth: '750px', margin: '0 auto', lineHeight: '1.5' }}>
              Transform your Switch library with high-quality replacement spines from the community. Pick your favorite designs, build your custom sheet, and print 1:1 PDFs.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'az' : 'newest')}
              style={{
                backgroundColor: sortOrder === 'newest' ? '#222' : '#1a1a1a',
                color: '#fff',
                border: '2px solid #333',
                borderRadius: '25px',
                padding: '12px 18px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.65rem',
                cursor: 'pointer'
              }}
            >
              {sortOrder === 'newest' ? '🔥 NEWEST' : '🔤 A-Z'}    
            </button>

            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: '#b30000',
                color: '#fff',
                border: '2px solid #333',
                padding: '12px 18px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.65rem',
                cursor: 'pointer'
              }}
            >
              📄 UPLOAD PDF
            </button>

            <div style={{ position: 'relative', minWidth: '380px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Dynamic Search by name, author, reddit username..."
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: '#1e1e1e',
                  color: '#fff',
                  border: '2px solid #333',
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <FilterMenu 
              showFiltersMenu={showFiltersMenu}
              setShowFiltersMenu={setShowFiltersMenu}
              selectedFilters={selectedFilters}
              handleFilterChange={handleFilterChange}
              clearFilters={clearFilters}
              totalActiveFilters={totalActiveFilters}
              onOpenGuide={onOpenGuide} 
              onOpenTagEdit={onOpenTagEdit}
            />

            <button style={{
              backgroundColor: '#b30000',
              color: '#fff',
              border: '2px solid #333',
              padding: '12px 18px',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '0.65rem',
              cursor: 'pointer'
            }}>
              🤖 AI (in process)
            </button>
          </div>
        </div>
      )}

      {/* ÁREA DE CONTENIDO */}
      <div style={{ flex: 1, backgroundColor: '#111', position: 'relative', paddingBottom: '40px' }}>
        {currentView === 'catalog' ? (
          <>
            {/* SI ES MÓVIL, EL TEXTO SEO APARECE ARRIBA DEL TODO PARA ADSENSE Y LECTURA */}
            {isMobile && <SeoTextSection />}

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

            {/* SI ES PC, EL TEXTO SEO SE QUEDA ABAJO PARA NO ROMPER EL FLUJO DE IMPRESIÓN */}
            {!isMobile && <SeoTextSection />}
          </>
        ) : (
          <div style={{ padding: '40px', minHeight: '100vh', paddingBottom: '60px' }}>
            {currentView === 'stats' && <StatsView spines={spines} />}
            {currentView === 'requests' && <RequestsView />}
            {currentView === 'about' && <AboutView />}
            {currentView === 'legal' && <LegalView onBack={() => changeView('catalog')} />}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        padding: '8px 0',
        fontSize: '11px',
        zIndex: 500,
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
      }}>
        <span>© {new Date().getFullYear()} The Spine Archive.</span>
        
        {/* ENLACE DIRECTO PARA EL RASTREADOR DE ADSENSE */}
        <a 
          href="?view=guide" 
          onClick={(e) => {
            e.preventDefault();
            changeView('guide');
          }}
          style={{ color: '#ffcc00', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Filter &amp; Tagging Guide
        </a>

        <span>|</span>

        <span onClick={() => changeView('legal')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Privacy Policy &amp; Terms of Service
        </span>
      </div>
    </div> 
  );
};

export default CatalogView;