import React, { useState } from 'react';
import CatalogView from './CatalogView';
import PrinterView from './PrinterView';

function App() {
  const [view, setView] = useState('catalog'); // Controla qué página ves
  const [selectedSpines, setSelectedSpines] = useState([]); // Los lomos elegidos

  // Función para ir a imprimir
  const goToPrinter = (spines) => {
    setSelectedSpines(spines);
    setView('printer');
  };

  return (
    <div>
      {view === 'catalog' ? (
        <CatalogView onConfirm={goToPrinter} />
      ) : (
        <PrinterView 
          initialSpines={selectedSpines} 
          onBack={() => setView('catalog')} 
        />
      )}
    </div>
  );
}

export default App;