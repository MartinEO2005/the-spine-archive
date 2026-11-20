import React, { useState, useEffect } from 'react';
import CatalogView from './CatalogView';
import PrinterView from './PrinterView';
import CustomPrinterView from './CustomPrinterView';
import TaggerView from './TaggerView';
import FilterGuideView from './FilterGuideView'; 
import TagEditView from './TagEditView'; 
import CookieBanner from './components/CookieBanner';
import MobileInfoView from './components/MobileInfoView'; 
import LandingView from './LandingView';
import CustomCatalogView from './CustomCatalogView';

// null = landing · 'switch' = catálogo actual · 'custom' = otras consolas
const readSectionFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('section');
  if (s === 'switch' || s === 'custom') return s;
  // Retrocompatibilidad: enlaces antiguos (?view=..., ?search=...) van directos a Switch
  if (params.has('view') || params.has('search')) return 'switch';
  return null;
};

function App() {
  const [view, setView] = useState('catalog'); 
  const [selectedSpines, setSelectedSpines] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileNoticeModal, setShowMobileNoticeModal] = useState(false);
  const [section, setSection] = useState(readSectionFromUrl);

  // Leer la URL al iniciar la web (?view=guide o ?view=tag-edit)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'guide') {
      setView('guide');
    } else if (viewParam === 'tag-edit') {
      setView('tag-edit');
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    // Botón "Atrás" del navegador: vuelve a leer la sección desde la URL
    const handlePopState = () => setSection(readSectionFromUrl());
    window.addEventListener('resize', handleResize);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Función helper para cambiar de vista y actualizar la URL en la barra del navegador
  const changeAppView = (newView) => {
    setView(newView);
    const url = new URL(window.location);
    if (newView === 'catalog') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', newView);
    }
    window.history.pushState({}, '', url);
  };

  // Cambiar entre landing / Switch / otras consolas
  const goToSection = (newSection) => {
    setSection(newSection);
    setView('catalog');
    setSelectedSpines([]); // no mezclar spines de Switch con las de otras consolas
    const url = new URL(window.location);
    url.searchParams.delete('view');
    if (newSection) url.searchParams.set('section', newSection);
    else url.searchParams.delete('section');
    window.history.pushState({}, '', url);
    window.scrollTo(0, 0);
  };

  const handleConfirmSelection = (spines) => {
    setSelectedSpines(spines);
    // BLOQUEO ESTRICTO: Si es móvil, NUNCA permitimos cambiar la vista a 'printer'
    if (window.innerWidth < 768 || isMobile) {
      setShowMobileNoticeModal(true);
      return; 
    }
    setView('printer');
  };

  const handleBackToCatalog = (currentSpinesInPrinter) => {
    if (currentSpinesInPrinter) {
      setSelectedSpines(currentSpinesInPrinter);
    }
    changeAppView('catalog');
  };

  // --- SELECTOR DE PLATAFORMA (LANDING) ---
  if (!section) {
    return <LandingView onSelect={goToSection} />;
  }

  // --- VISTAS DE PANTALLA COMPLETA ---
  if (view === 'tagger') {
    return <TaggerView onExit={() => changeAppView('catalog')} />;
  }

  if (view === 'guide') {
    return <FilterGuideView onBack={() => changeAppView('catalog')} />;
  }

  if (view === 'tag-edit') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111', padding: '40px 20px' }}>
        <TagEditView 
          spineName="Community Contribution"
          currentAITags={{}}
          onCancel={() => changeAppView('catalog')}
          onSubmit={(proposedTags) => {
            console.log("Tags enviadas:", proposedTags);
            alert("¡Etiquetas enviadas correctamente para revisión!");
            changeAppView('catalog');
          }}
        />
      </div>
    );
  }

  // Doble comprobación dinámica de móvil en render
  const isActuallyMobile = isMobile || window.innerWidth < 768;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111', position: 'relative' }}>
      
      {view === 'catalog' && (
        <>
          {section === 'custom' ? (
            <CustomCatalogView
              onConfirm={handleConfirmSelection}
              initialSelected={selectedSpines}
              isMobile={isActuallyMobile}
              onGoHome={() => goToSection(null)}
            />
          ) : (
            <CatalogView 
              onConfirm={handleConfirmSelection} 
              initialSelected={selectedSpines} 
              isMobile={isActuallyMobile}
              onOpenGuide={() => changeAppView('guide')} 
              onOpenTagEdit={() => changeAppView('tag-edit')} 
              onGoHome={() => goToSection(null)}
            />
          )}
          
          {/* MODAL BLOQUEANTE ANTIZOOM AGRESIVO PARA MÓVILES */}
          {showMobileNoticeModal && (
            <div 
              onTouchMove={(e) => e.preventDefault()} // Bloquea cualquier intento de scroll o gesto táctil de zoom por detrás
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 999999,
                display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
                touchAction: 'none', overflow: 'hidden', overscrollBehavior: 'none'
              }}
            >
              <div style={{
                backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '12px', maxWidth: '460px',
                textAlign: 'center', border: '2px solid #ffcc00', color: 'white', fontFamily: 'sans-serif',
                boxShadow: '0 10px 25px rgba(0,0,0,0.9)'
              }}>
                <div style={{ fontSize: '35px', marginBottom: '15px' }}>🖥️</div>
                <h3 style={{ color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '11px', marginBottom: '15px', lineHeight: '1.6' }}>
                  PC REQUIRED FOR PRINTING
                </h3>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#ccc', marginBottom: '20px' }}>
                  You have selected <b>{selectedSpines.length} spine(s)</b>. Due to mobile device print scaling limitations, 1:1 physical precision is only guaranteed on <b>Desktop or Laptop PCs</b>.
                  <br/><br/>
                  Feel free to browse and organize your collection here! When you are ready to print, open the site on your computer.
                </p>

                {/* Enlace sutil de apoyo voluntario */}
                <div style={{ marginBottom: '25px', backgroundColor: '#2a2a2a', padding: '12px', borderRadius: '6px' }}>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 8px 0' }}>Do you love the project and want to support its maintenance?</p>
                  <a 
                    href="https://ko-fi.com/martineo" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#ffcc00', fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline'
                    }}
                  >
                    ⭐ Buy me a coffee on Ko-fi
                  </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowMobileNoticeModal(false)}
                    style={{ backgroundColor: '#b30000', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: 'sans-serif' }}
                  >
                    UNDERSTOOD
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* RENDERIZADO CONDICIONAL BLINDADO: Si es móvil de verdad, JAMÁS muestra PrinterView */}
      {view === 'printer' && !isActuallyMobile && (
        section === 'custom' ? (
          <CustomPrinterView
            selectedSpines={selectedSpines}
            onBack={handleBackToCatalog}
          />
        ) : (
          <PrinterView 
            selectedSpines={selectedSpines} 
            onBack={handleBackToCatalog} 
          />
        )
      )}

      {view === 'printer' && isActuallyMobile && (
        <div style={{ padding: '50px', textAlign: 'center', color: '#fff', fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>
          <p>ACCESS DENIED ON MOBILE DEVICES</p>
          <button 
            onClick={() => changeAppView('catalog')}
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#b30000', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            RETURN TO CATALOG
          </button>
        </div>
      )}

      <CookieBanner />
    </div>
  );
}

export default App;