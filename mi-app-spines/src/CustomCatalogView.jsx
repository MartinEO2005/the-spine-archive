import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import SpineGrid from './SpineGrid';
import CustomStatsView from './CustomStatsView';
import AboutView from './AboutView';
import LegalView from './LegalView';

// =====================================================================
// CATÁLOGO "OTRAS CONSOLAS" (r/CustomGameSpines)
// Copia independiente de CatalogView.jsx con paleta PlayStation / Xbox.
// No comparte estado ni datos con el catálogo de Switch.
// =====================================================================

// --- PALETA PLAYSTATION (AZUL) / XBOX (VERDE) ---
const PALETTE = {
  navBg: 'linear-gradient(90deg, #003791 0%, #0070d1 55%, #107c10 100%)',
  primary: '#0070d1',      // Azul PlayStation (botones principales)
  primaryDark: '#003791',  // Azul oscuro (texto sobre blanco)
  secondary: '#107c10',    // Verde Xbox (botones secundarios)
  highlight: '#3ddc97',    // Verde claro (títulos y acentos)
  pageBg: '#0d1117',
  panelBg: '#161b22',
  border: '#1f3a5f',
};

// --- FUENTES DE DATOS PROPIAS (no tocan database.json de Switch) ---
const DATA_URL = '/database_custom.json';
const INFO_URL = '/scrape_info_custom.json';

const CustomCatalogView = ({ onConfirm, initialSelected = [], isMobile = false, onGoHome }) => {
  const [spines, setSpines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedSpines, setSelectedSpines] = useState(initialSelected);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('catalog');
  const [visibleCount, setVisibleCount] = useState(60);
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedConsoles, setSelectedConsoles] = useState([]);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatusMsg, setPdfStatusMsg] = useState('');
  const fileInputRef = useRef(null);

  const changeView = (newView) => {
    setCurrentView(newView);
    const url = new URL(window.location);
    if (newView === 'catalog') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', newView);
    }
    window.history.pushState({}, '', url);
  };

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

  // --- CARGA DE DATOS (tolerante a que los JSON aún no existan) ---
  useEffect(() => {
    fetch(`${INFO_URL}?t=${Date.now()}`)
      .then(res => (res.ok ? res.json() : null))
      .catch(() => null)
      .then(info => {
        const version = info?.date ? encodeURIComponent(info.date) : 'v1';
        return fetch(`${DATA_URL}?v=${version}`);
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setSpines(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Error al cargar database_custom.json:", err);
        setSpines([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['stats', 'about', 'legal'].includes(viewParam)) {
      setCurrentView(viewParam);
    }
    const query = params.get('search');
    if (query) {
      setSearchTerm(decodeURIComponent(query).replace(/-/g, ' '));
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

  const normalizeText = (text) => {
    if (!text) return '';
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  };

  // --- CONSOLAS DISPONIBLES: se deducen de los datos, sin lista fija ---
  const availableConsoles = useMemo(() => {
    const set = new Set();
    spines.forEach(s => (s.consoles || []).forEach(c => set.add(c)));
    return [...set].sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
  }, [spines]);

  const toggleConsole = (consoleName) => {
    setSelectedConsoles(prev =>
      prev.includes(consoleName) ? prev.filter(c => c !== consoleName) : [...prev, consoleName]
    );
    setVisibleCount(60);
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

    if (selectedConsoles.length > 0) {
      result = result.filter(s => (s.consoles || []).some(c => selectedConsoles.includes(c)));
    }

    if (sortOrder === 'newest') {
      result.reverse();
    } else if (sortOrder === 'az') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [spines, debouncedTerm, sortOrder, selectedConsoles]);

  // NOTA: no llamamos a /api/click aquí a propósito, para no mezclar
  // los clics de otras consolas con las estadísticas de Switch.

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

  const chipStyle = (active) => ({
    backgroundColor: active ? PALETTE.secondary : PALETTE.panelBg,
    color: '#fff',
    border: `2px solid ${active ? PALETTE.highlight : PALETTE.border}`,
    borderRadius: '20px',
    padding: '8px 14px',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '0.6rem',
    cursor: 'pointer'
  });

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%', fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}>LOADING...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: PALETTE.pageBg }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}
      </style>

      {/* MODAL RESTAURAR PDF */}
      {showPdfModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: '"Press Start 2P", monospace'
        }}>
          <div style={{
            backgroundColor: PALETTE.panelBg, padding: '30px', border: `3px solid ${PALETTE.primary}`,
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
                    backgroundColor: PALETTE.primary, color: 'white', border: 'none',
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
      <div style={{ height: '70px', background: PALETTE.navBg, display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100, position: 'sticky', top: 0 }}>
        <img src="/logo 2.png" alt="Logo" onClick={() => changeView('catalog')} style={{ height: '70px', cursor: 'pointer', marginRight: '30px' }} />

        <div style={{ display: 'flex', marginRight: '30px', fontFamily: 'sans-serif' }}>
          <button onClick={() => changeView('catalog')} style={navButtonStyle('catalog')}>CATALOG</button>
          <button onClick={() => changeView('stats')} style={navButtonStyle('stats')}>STATS</button>
          <button onClick={() => changeView('about')} style={navButtonStyle('about')}>ABOUT</button>
          {onGoHome && (
            <button onClick={onGoHome} style={navButtonStyle('__home')}>⇄ PLATFORMS</button>
          )}
        </div>

        <div style={{ flex: 1 }}></div>

        <a
          href="https://www.stopkillinggames.com/"
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#fff',
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
            color: PALETTE.highlight,
            padding: '10px 15px',
            border: `2px solid ${PALETTE.highlight}`,
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
            color: PALETTE.primaryDark,
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
        <div style={{ backgroundColor: PALETTE.pageBg, padding: '20px 30px 10px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{
              fontSize: '16px',
              color: PALETTE.highlight,
              fontFamily: '"Press Start 2P", monospace',
              marginBottom: '10px',
              textShadow: '2px 2px 0px #000'
            }}>
              CUSTOM SPINES FOR EVERY CONSOLE
            </h1>
            <p style={{ fontSize: '13px', color: '#aaaaaa', maxWidth: '750px', margin: '0 auto', lineHeight: '1.5' }}>
              PlayStation, Xbox, 3DS and more: community-made replacement spines from r/CustomGameSpines. Pick your favorites, build your sheet and print.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'az' : 'newest')}
              style={{
                backgroundColor: PALETTE.panelBg,
                color: '#fff',
                border: `2px solid ${PALETTE.border}`,
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
                backgroundColor: PALETTE.primary,
                color: '#fff',
                border: `2px solid ${PALETTE.border}`,
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
                  backgroundColor: PALETTE.panelBg,
                  color: '#fff',
                  border: `2px solid ${PALETTE.border}`,
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* FILTRO POR CONSOLA (sustituye a FilterMenu, cuyas opciones son de Switch) */}
          {availableConsoles.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
              <button onClick={() => setSelectedConsoles([])} style={chipStyle(selectedConsoles.length === 0)}>
                ALL
              </button>
              {availableConsoles.map(c => (
                <button key={c} onClick={() => toggleConsole(c)} style={chipStyle(selectedConsoles.includes(c))}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ÁREA DE CONTENIDO */}
      <div style={{ flex: 1, backgroundColor: PALETTE.pageBg, position: 'relative', paddingBottom: '40px' }}>
        {currentView === 'catalog' ? (
          filteredSpines.length > 0 ? (
            <SpineGrid
              spines={filteredSpines.slice(0, visibleCount)}
              selectedSpines={selectedSpines}
              toggleSpine={(s) => {
                const isSelected = selectedSpines.find(x => x.id === s.id);
                setSelectedSpines(isSelected ? selectedSpines.filter(x => x.id !== s.id) : [...selectedSpines, { ...s, count: 1 }]);
              }}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#888', fontFamily: '"Press Start 2P", monospace', fontSize: '11px', padding: '80px 20px', lineHeight: '1.8' }}>
              {spines.length === 0 ? 'NO SPINES YET — COMING SOON' : 'NO SPINES MATCH YOUR SEARCH'}
            </div>
          )
        ) : (
          <div style={{ padding: '40px', minHeight: '100vh', paddingBottom: '60px' }}>
            {currentView === 'stats' && <CustomStatsView spines={spines} />}
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
        <span onClick={() => changeView('legal')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
          Privacy Policy &amp; Terms of Service
        </span>
      </div>
    </div>
  );
};

export default CustomCatalogView;
