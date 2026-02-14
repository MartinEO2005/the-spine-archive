import React from 'react';

const SpineGrid = ({ spines, selectedSpines, toggleSpine, hoveredId, setHoveredId }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '20px', 
      justifyContent: 'center', 
      padding: '40px 20px',
      width: '100%',
      boxSizing: 'border-box',
      backgroundColor: '#111'
    }}>
      {spines.map(spine => {
        const isSelected = selectedSpines.find(s => s.id === spine.id);
        const isHovered = hoveredId === spine.id;
        return (
          <div key={spine.id} onMouseEnter={() => setHoveredId(spine.id)} onMouseLeave={() => setHoveredId(null)} onClick={() => toggleSpine(spine)}
            style={{ position: 'relative', height: '450px', cursor: 'pointer', transition: 'transform 0.2s', transform: isHovered ? 'scale(1.05)' : 'scale(1)', zIndex: isHovered ? 10 : 1 }}>
            <img src={spine.image || spine.src} alt={spine.title} loading="lazy" style={{ height: '100%', width: 'auto', borderRadius: '4px', border: isSelected ? '4px solid #00ff00' : '1px solid #333' }} />
            {isHovered && (
              <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'black', color: 'white', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', border: '1px solid #b30000' }}>
                {spine.title}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SpineGrid;