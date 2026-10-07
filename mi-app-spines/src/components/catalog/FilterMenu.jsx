import React from 'react';

const FilterMenu = ({ 
  showFiltersMenu, 
  setShowFiltersMenu, 
  selectedFilters, 
  handleFilterChange, 
  clearFilters, 
  totalActiveFilters 
}) => {
  return (
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
        FILTERS {totalActiveFilters > 0 && `(${totalActiveFilters})`} <span style={{ fontSize: '0.6rem', color: '#888' }}>{showFiltersMenu ? '▲' : '▼'}</span>
      </button>

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

          {totalActiveFilters > 0 && (
            <button 
              onClick={clearFilters}
              style={{ gridColumn: 'span 3', backgroundColor: '#333', color: '#ffcc00', border: '1px solid #ffcc00', padding: '6px', cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', marginBottom: '5px' }}
            >
              🧹 CLEAR ALL FILTERS
            </button>
          )}

          {/* COLUMNA 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['Switch 1', 'Switch 2'].map(val => (
                  <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={selectedFilters["Platform"]?.includes(val)} onChange={() => handleFilterChange("Platform", val)} /> {val}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Main Style</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['Minimalist', 'Scenic / Detailed', 'Maximalist (Kitsch)'].map(val => (
                  <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={selectedFilters["Main Style"]?.includes(val)} onChange={() => handleFilterChange("Main Style", val)} /> {val}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Title Typography</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['Simple Text', 'Original Logo'].map(val => (
                  <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={selectedFilters["Title Typography"]?.includes(val)} onChange={() => handleFilterChange("Title Typography", val)} /> {val}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Lower Logo</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['Nintendo', 'other'].map(val => (
                  <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={selectedFilters["Lower logo"]?.includes(val)} onChange={() => handleFilterChange("Lower logo", val)} /> {val}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Extras</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['DNN Style', 'Character Bottom', 'Characters throughout the spine', 'Set / Panorama'].map(val => (
                  <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={selectedFilters["Extras"]?.includes(val)} onChange={() => handleFilterChange("Extras", val)} /> {val}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Text Alignment</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {['Top Centered', 'Top Centered with margin', 'Center', 'Bottom', 'Cover all (from top)', 'Cover all (centered)'].map(val => (
                  <label key={val} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={selectedFilters["Text Alignment"]?.includes(val)} onChange={() => handleFilterChange("Text Alignment", val)} /> {val}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA 3 */}
          <div>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '0.65rem' }}>Base Color</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
              {[
                { name: 'Red', color: '#e60012' },
                { name: 'Blue', color: '#0066cc' },
                { name: 'Yellow', color: '#ffcc00' },
                { name: 'Green', color: '#28a745' },
                { name: 'Pink', color: '#ff69b4' },
                { name: 'Orange', color: '#ff8c00' },
                { name: 'Purple', color: '#8a2be2' },
                { name: 'White', color: '#ffffff' },
                { name: 'Black', color: '#111111' },
                { name: 'Gray', color: '#888888' },
              ].map(item => (
                <label key={item.name} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={selectedFilters["Base Color"]?.includes(item.name)} onChange={() => handleFilterChange("Base Color", item.name)} />
                  <span style={{ width: '12px', height: '12px', backgroundColor: item.color, border: '1px solid #777', display: 'inline-block' }}></span> {item.name}
                </label>
              ))}

              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                <input type="checkbox" checked={selectedFilters["Base Color"]?.includes("Multicolor")} onChange={() => handleFilterChange("Base Color", "Multicolor")} />
                <span style={{ width: '12px', height: '12px', background: 'linear-gradient(45deg, red, yellow, green, cyan, blue, magenta)', border: '1px solid #777', display: 'inline-block' }}></span> Multicolor
              </label>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default FilterMenu;