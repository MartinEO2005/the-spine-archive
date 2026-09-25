import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
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

  // --- ESTADOS Y REFERENCIAS PARA PDF Y FILTROS ---
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatusMsg, setPdfStatusMsg] = useState('');
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const fileInputRef = useRef(null);

  // --- LECTURA REAL DE METADATOS DEL PDF SUBIDO ---
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

  // --- CARGA INTELIGENTE Y SEGURA DE BBDD ---
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
      .catch(() => {
        return fetch('/database.json');
      })
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

  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
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

      {/* POP-UP SCRAPE INFO */}
      {showUpdateModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: '"Press Start 2P", monospace'
        }}>
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
            <div style={{ backgroundColor: '#111', padding: '30px', border: '4px solid #333', marginBottom: '35px', textAlign: 'center' }}>
              <div style={{ color: '#fff', fontSize: '14px', marginBottom: '15px', lineHeight: '1.8' }}>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                  {scrapeInfo.authors?.map((author, idx) => (
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

      {/* MODAL DE CARGA DE INSERTAR PDF */}
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

      {/* HEADER PRINCIPAL (NAVBAR SUPERIOR) */}
      <div style={{ height: '70px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', padding: '0 30px', zIndex: 100, position: 'sticky', top: 0 }}>
        <img src="/logo.jpg" alt="Logo" onClick={() => setCurrentView('catalog')} style={{ height: '70px', cursor: 'pointer', marginRight: '30px' }} />
        
        <div style={{ display: 'flex', marginRight: '30px', fontFamily: 'sans-serif' }}>
          <button onClick={() => setCurrentView('catalog')} style={navButtonStyle('catalog')}>CATALOG</button>
          <button onClick={() => setCurrentView('stats')} style={navButtonStyle('stats')}>STATS</button>
          <button onClick={() => setCurrentView('requests')} style={navButtonStyle('requests')}>REQUESTS</button>
          <button onClick={() => setCurrentView('about')} style={navButtonStyle('about')}>ABOUT</button>
        </div>
        
        <div style={{ flex: 1 }}></div>

        {/* TEXTO RETRO #StopKillingGames */}
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
            transition: 'all 0.2s ease',
            display: 'inline-block'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#ffcc00'; e.currentTarget.style.transform = 'scale(1)'; }}
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
            borderRadius: '5px',
            boxShadow: '3px 3px 0px rgba(0,0,0,0.2)',
            display: 'inline-block',
            fontFamily: 'inherit'
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

{/* INPUT OCULTO PARA CARGA DE PDF */}
<input 
  type="file" 
  ref={fileInputRef} 
  onChange={handleFileChange} 
  accept="application/pdf" 
  style={{ display: 'none' }} 
/>

{/* SUB-BARRA DE HERRAMIENTAS Y BÚSQUEDA - FONDO UNIFICADO #111 */}
{currentView === 'catalog' && (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
    padding: '18px 20px',
    backgroundColor: '#111',
    position: 'relative'
  }}>

    {/* BOTÓN NEWEST */}
    <button 
      onClick={() => setSortOrder(prev => prev === 'newest' ? 'az' : 'newest')}
      style={{
        position: "absolute",
        left: "20px",
        backgroundColor: sortOrder === 'newest' ? '#222' : '#1a1a1a',
        color: '#fff',
        border: '2px solid #333',
        borderRadius: '25px',
        boxShadow: '4px 4px 0px #000',
        padding: '12px 18px',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '0.65rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {sortOrder === 'newest' ? '🔥 NEWEST' : '🔤 A-Z'}    
      </button>

    {/* BOTÓN UPLOAD PDF */}
    <button 
      onClick={() => fileInputRef.current?.click()}
      style={{
        backgroundColor: '#b30000',
        color: '#fff',
        border: '2px solid #333',
        boxShadow: '4px 4px 0px #000',
        padding: '12px 18px',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '0.65rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      📄 UPLOAD PDF
    </button>

    {/* INPUT DE BÚSQUEDA GRANDE Y CON BORDES REDONDEADOS */}
    <div style={{ position: 'relative', minWidth: '380px' }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="🔍 Dynamic Search by name, author, reddit username...."
        style={{
          width: '100%',
          padding: '12px 20px',
          backgroundColor: '#1e1e1e',
          color: '#fff',
          border: '2px solid #333333ff',
          borderRadius: '25px',
          boxShadow: '4px 4px 0px #000',
          fontSize: '0.85rem',
          boxSizing: 'border-box',
          outline: 'none'
        }}
      />
    </div>

    {/* BOTÓN FILTROS */}
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setShowFiltersMenu(!showFiltersMenu)} 
        style={{
          backgroundColor: showFiltersMenu ? '#2a2a2a' : '#1e1e1e',
          color: '#fff',
          border: '2px solid #333',
          boxShadow: '4px 4px 0px #000',
          padding: '12px 18px',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.65rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        FILTERS <span style={{ fontSize: '0.6rem', color: '#888' }}>{showFiltersMenu ? '▲' : '▼'}</span>
      </button>

      {/* MENÚ DE FILTROS DESPLEGABLE EN 3 COLUMNAS */}
      {showFiltersMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '12px',
          backgroundColor: '#1a1a1a',
          border: '3px solid #b30000',
          boxShadow: '6px 6px 0px #000',
          padding: '20px',
          width: '700px',
          zIndex: 100,
          color: 'white',
          fontSize: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.2fr',
          gap: '20px'
        }}>

          {/* COLUMNA 1: PLATFORM, MAIN STYLE, TITLE TYPOGRAPHY, LOWER LOGO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Switch 1</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Switch 2</label>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Main Style</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Minimalist</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Scenic / Detailed</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Maximalist (Kitsch)</label>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Title Typography</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Simple Text</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Original Logo</label>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Lower Logo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Nintendo</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> other</label>
              </div>
            </div>

          </div>

          {/* COLUMNA 2: EXTRAS & TEXT ALIGNMENT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Extras</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> DNN Style</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Character Bottom</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Characters throughout the spine</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Set / Panorama</label>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Text Alignment</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Top Centered</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Top Centered with margin</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Center</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Bottom</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Cover all (from top)</label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" /> Cover all (centered)</label>
              </div>
            </div>

          </div>

          {/* COLUMNA 3: BASE COLOR */}
          <div>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Base Color</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
              
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#e60012', border: '1px solid #777', display: 'inline-block' }}></span> Red
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#0066cc', border: '1px solid #777', display: 'inline-block' }}></span> Blue
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#ffcc00', border: '1px solid #777', display: 'inline-block' }}></span> Yellow
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#28a745', border: '1px solid #777', display: 'inline-block' }}></span> Green
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#ff69b4', border: '1px solid #777', display: 'inline-block' }}></span> Pink
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#ff8c00', border: '1px solid #777', display: 'inline-block' }}></span> Orange
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#8a2be2', border: '1px solid #777', display: 'inline-block' }}></span> Purple
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#ffffff', border: '1px solid #777', display: 'inline-block' }}></span> White
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#111111', border: '1px solid #777', display: 'inline-block' }}></span> Black
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', backgroundColor: '#888888', border: '1px solid #777', display: 'inline-block' }}></span> Gray
              </label>

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                <input type="checkbox" />
                <span style={{ width: '12px', height: '12px', background: 'linear-gradient(45deg, red, yellow, green, cyan, blue, magenta)', border: '1px solid #777', display: 'inline-block' }}></span> Multicolor
              </label>

            </div>
          </div>

        </div>
      )}
    </div>

    {/* BOTÓN AI RECOMMENDATION */}
    <button style={{
      backgroundColor: '#b30000',
      color: '#fff',
      border: '2px solid #333',
      boxShadow: '4px 4px 0px #000',
      padding: '12px 18px',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '0.65rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      🤖 AI  (in process)
    </button>
        </div>
      )}

      {/* ÁREA DE CONTENIDO */}
      <div style={{ flex: 1, backgroundColor: '#111', position: 'relative' }}>
        {currentView === 'catalog' ? (
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