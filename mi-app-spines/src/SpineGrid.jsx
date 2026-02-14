import React from 'react';

const SpineGrid = ({ spines, selectedSpines, toggleSpine, hoveredId, setHoveredId }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', padding: '50px', width: '100%', boxSizing: 'border-box' }}>
      {spines.map(spine => {
        const isSelected = selectedSpines.find(s => s.id === spine.id);
        const isHovered = hoveredId === spine.id;
        return (
          <div key={spine.id} onMouseEnter={() => setHoveredId(spine.id)} onMouseLeave={() => setHoveredId(null)} onClick={() => toggleSpine(spine)}
            style={{ position: 'relative', height: '500px', cursor: 'pointer', transition: 'transform 0.2s', transform: isHovered ? 'scale(1.05)' : 'scale(1)', zIndex: isHovered ? 10 : 1 }}>
            <img src={spine.image || spine.src} alt={spine.title} loading="lazy" style={{ height: '100%', width: 'auto', display: 'block', borderRadius: '4px', border: isSelected ? '4px solid #00ff00' : '1px solid #333' }} />
            {isHovered && (
              <div style={{ position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.95)', color: 'white', padding: '8px 15px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', fontWeight: 'bold', border: '1px solid #b30000', zIndex: 20, textAlign: 'center' }}>
                <div>{spine.title.toUpperCase()}</div>
                <div style={{ color: '#b30000', fontSize: '10px' }}>BY {spine.author?.toUpperCase() || 'UNKNOWN'}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SpineGrid;