import React, { useState, useEffect } from 'react';
import CatalogView from './CatalogView';
import PrinterView from './PrinterView';
import TaggerView from './TaggerView';
import CookieBanner from './components/CookieBanner';
import MobileInfoView from './components/MobileInfoView'; // <-- Ajusta la ruta si es necesario

function App() {
  const [view, setView] = useState('catalog');
  const [selectedSpines, setSelectedSpines] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileNoticeModal, setShowMobileNoticeModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConfirmSelection = (spines) => {
    setSelectedSpines(spines);
    if (isMobile) {
      setShowMobileNoticeModal(true);
    } else {
      setView('printer');
    }
  };

  const handleBackToCatalog = (currentSpinesInPrinter) => {
    if (currentSpinesInPrinter) {
      setSelectedSpines(currentSpinesInPrinter);
    }
    setView('catalog');
  };

  if (view === 'tagger') {
    return <TaggerView onExit={() => setView('catalog')} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111' }}>
      
      {view === 'catalog' && (
  <>
    <CatalogView 
      onConfirm={handleConfirmSelection} 
      initialSelected={selectedSpines} 
      isMobile={isMobile}
    />
    
    {/* MODAL BLOQUEANTE PARA USUARIOS MÓVILES */}
    {showMobileNoticeModal && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#222', padding: '30px', borderRadius: '12px', maxWidth: '450px',
          textAlign: 'center', border: '2px solid #b30000', color: 'white', fontFamily: 'sans-serif'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🖥️</div>
          <h3 style={{ color: '#b30000', fontFamily: '"Press Start 2P", monospace', fontSize: '12px', marginBottom: '15px', lineHeight: '1.5' }}>
            PLEASE USE A PC TO PRINT
          </h3>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#ccc', marginBottom: '25px' }}>
            You have selected <b>{selectedSpines.length} spine(s)</b>. However, mobile devices cannot generate the PDF at the exact 1:1 scale required to fit physical Nintendo Switch cases. 
            <br/><br/>
            Please visit this website on a <b>Desktop or Laptop PC</b> to use the layout editor.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowMobileNoticeModal(false)}
              style={{ backgroundColor: '#b30000', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              UNDERSTOOD
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)}

      {view === 'printer' && (
        <PrinterView 
          selectedSpines={selectedSpines} 
          onBack={handleBackToCatalog} 
        />
      )}

      <CookieBanner />
    </div>
  );
}

export default App;