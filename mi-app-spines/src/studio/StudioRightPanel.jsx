import React from 'react';

const theme = { bgApp: '#1e1e1e', bgPanel: '#252526', border: '#3c3c3c', accent: '#007fd4', text: '#cccccc', textMuted: '#888888' };

const StudioRightPanel = ({ layers, selectedLayerId, setSelectedLayerId, updateLayer, moveLayerZIndex, removeLayer, duplicateLayer, bgColor, setBgColor }) => {
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div style={{ width: '320px', backgroundColor: theme.bgPanel, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      
      {/* PANEL DE CAPAS */}
      <div style={{ flex: 1, borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px' }}><h3 style={{ margin: 0, fontSize: '11px', color: theme.textMuted, letterSpacing: '1px' }}>LAYERS</h3></div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {[...layers].sort((a, b) => b.zIndex - a.zIndex).map((layer) => (
            <div key={layer.id} onClick={() => setSelectedLayerId(layer.id)} style={{ display: 'flex', alignItems: 'center', padding: '8px', marginBottom: '4px', backgroundColor: selectedLayerId === layer.id ? theme.accent : theme.bgApp, borderRadius: '4px', cursor: 'pointer' }}>
              <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} style={{ background: 'transparent', border: 'none', color: layer.visible ? '#fff' : '#555', cursor: 'pointer', padding: '0 5px' }}>{layer.visible ? '👁️' : '🕶️'}</button>
              <span style={{ fontSize: '16px', margin: '0 10px' }}>{layer.type === 'image' ? '🖼️' : layer.type === 'text' ? 'T' : '⬛'}</span>
              <span style={{ fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{layer.name}</span>
              
              {selectedLayerId === layer.id && (
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }} title="Duplicate" style={{ background: '#444', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>📄</button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'up'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▲</button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayerZIndex(layer.id, 'down'); }} style={{ background: '#333', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>▼</button>
                  <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} style={{ background: '#b30000', border: 'none', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '3px' }}>✖</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DE PROPIEDADES */}
      <div style={{ height: '350px', padding: '15px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '11px', color: theme.textMuted }}>PROPERTIES</h3>
        
        {!selectedLayerId ? (
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Background Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '40px', height: '30px', border: 'none', background: 'transparent' }} />
            </div>
          </div>
        ) : selectedLayer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedLayer.lockRatio} onChange={e => updateLayer(selectedLayer.id, { lockRatio: e.target.checked })} />
              Maintain Aspect Ratio
            </label>

            {selectedLayer.type === 'text' && (
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="color" value={selectedLayer.color} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} style={{ width: '40px' }} />
                  <input type="number" value={selectedLayer.fontSize} onChange={e => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) || 12 })} style={{ flex: 1 }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: theme.textMuted }}>Rotation (°)</label>
                <input type="number" value={selectedLayer.rotation} onChange={e => updateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: theme.textMuted }}>Opacity (%)</label>
                <input type="number" min="0" max="100" value={selectedLayer.opacity} onChange={e => updateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) || 0 })} style={{ width: '100%', background: theme.bgApp, color: theme.text, border: `1px solid ${theme.border}`, padding: '4px' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioRightPanel;