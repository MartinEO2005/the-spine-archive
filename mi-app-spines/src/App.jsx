import React, { useState, useEffect } from 'react';
import CatalogView from './CatalogView';
import PrinterView from './PrinterView';
import TaggerView from './TaggerView';
import FilterGuideView from './FilterGuideView'; 
import TagEditView from './TagEditView'; 
import CookieBanner from './components/CookieBanner';
import MobileInfoView from './components/MobileInfoView'; 

function App() {
  const [view, setView] = useState('catalog'); 
  const [selectedSpines, setSelectedSpines] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileNoticeModal, setShowMobileNoticeModal] = useState(false);

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleConfirmSelection = (spines) => {
    setSelectedSpines(spines);
    // BLOQUEO ESTRICTO: Si es móvil, NUNCA permitimos cambiar la vista a 'printer'
    if (isMobile) {
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111' }}>
      
      {view === 'catalog' && (
        <>
          <CatalogView 
            onConfirm={handleConfirmSelection} 
            initialSelected={selectedSpines} 
            isMobile={isMobile}
            onOpenGuide={() => changeAppView('guide')} 
            onOpenTagEdit={() => changeAppView('tag-edit')} 
          />
          
          {/* MODAL BLOQUEANTE ANTIZOOM PARA USUARIOS MÓVILES */}
          {showMobileNoticeModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 99999,
              display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px',
              touchAction: 'none', overflow: 'hidden' // Impide gestos de zoom y scroll de fondo
            }}>
              <div style={{
                backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '12px', maxWidth: '460px',
                textAlign: 'center', border: '2px solid #ffcc00', color: 'white', fontFamily: 'sans-serif',
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
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

      {/* DOBLE VALIDACIÓN DE SEGURIDAD: Aunque cambien la URL o manipulen el estado, si es móvil nunca se renderiza PrinterView */}
      {view === 'printer' && !isMobile && (
        <PrinterView 
          selectedSpines={selectedSpines} 
          onBack={handleBackToCatalog} 
        />
      )}

      {/* Si intentan entrar a printer siendo móvil, les devolvemos automáticamente al catálogo */}
      {view === 'printer' && isMobile && (
        (() => {
          // Forzamos la redirección visual al catálogo de forma limpia
          setTimeout(() => {
            setView('catalog');
            setShowMobileNoticeModal(true);
          }, 0);
          return null;
        })()
      )}

      <CookieBanner />
    </div>
  );
}

export default App;