import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const COLOR_MAP = {
  "Red": "#ef4444", "Blue": "#3b82f6", "Yellow": "#eab308", "Green": "#22c55e",
  "Pink": "#ec4899", "Orange": "#f97316", "Purple": "#a855f7", "White": "#ffffff",
  "Black": "#000000", "Gray": "#6b7280", "Multicolor": "linear-gradient(45deg, red, yellow, green, blue)"
};

const SINGLE_CATEGORIES = {
  "Platform": ['Switch 1', 'Switch 2'],
  "Base Color": ['Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Orange', 'Purple', 'White', 'Black', 'Gray', 'Multicolor'],
  "Title Typography": ['Simple Text', 'Original Logo'],
  // Unificado a un solo "Cover All"
  "Text Alignment": ['Top Centered', 'Top Centered with margin', 'Center', 'Bottom', 'Cover All'],
  "Main Style": ['Minimalist', 'Scenic / Detailed', 'Maximalist (Kitsch)'],
  "Lower Logo": ['Nintendo', 'other']
};

const EXTRAS = ['DNN Style', 'Character Bottom', 'Characters throughout the spine', 'Set / Panorama'];

export default function TagEditView({ onCancel }) {
  const [spines, setSpines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpine, setSelectedSpine] = useState(null);
  const [proposedTags, setProposedTags] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    fetch(`/scrape_info.json?t=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error("Fallo al cargar scrape_info");
        return res.json();
      })
      .then(info => {
        const version = info.date ? encodeURIComponent(info.date) : "v1";
        return fetch(`/database.json?v=${version}`);
      })
      .catch(() => fetch('/database.json'))
      .then(res => res.json())
      .then(data => {
        setSpines(data);
        if (data && data.length > 0) {
          setSelectedSpine(data[0]);
          setProposedTags(data[0].tags || {});
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar spines:", err);
        setLoading(false);
      });

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getImageUrl = (game) => {
    if (!game) return "";
    let rawUrl = game.image || game.imageUrl || game.src || game.url || game.id;
    if (!rawUrl) return "";
    if (rawUrl.startsWith('http')) return rawUrl;
    rawUrl = rawUrl.replace(/^\/+/, '');
    if (!rawUrl.includes('.')) rawUrl = `${rawUrl}.webp`;
    return rawUrl.startsWith('spines/') ? `/${rawUrl}` : `/spines/${rawUrl}`;
  };

  const handleSelectSpine = (spine) => {
    setSelectedSpine(spine);
    setProposedTags(spine.tags || {});
  };

  const handleSelectTag = (category, value) => {
    setProposedTags(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleExtraToggle = (extra) => {
    setProposedTags(prev => {
      const currentExtras = prev["Extras"] || [];
      const newExtras = currentExtras.includes(extra)
        ? currentExtras.filter(e => e !== extra)
        : [...currentExtras, extra];
      return { ...prev, Extras: newExtras };
    });
  };

  // --- PRUEBA DE LA API DE SUPABASE ---
  const handleSubmit = async () => {
    if (!selectedSpine) return;
    setSubmitting(true);

    try {
      console.log("Enviando datos a Supabase...", {
        spine_id: selectedSpine.id,
        spine_title: selectedSpine.title,
        proposed_tags: proposedTags
      });

      const { data, error } = await supabase
        .from('tag_requests')
        .insert([
          { 
            spine_id: selectedSpine.id, 
            spine_title: selectedSpine.title,
            proposed_tags: proposedTags,
            status: 'pending'
          }
        ])
        .select();

      if (error) throw error;

      console.log("Respuesta exitosa de Supabase:", data);
      alert("¡Prueba exitosa! Etiquetas guardadas en la base de datos de Supabase.");
      onCancel();
    } catch (err) {
      console.error("Error en la prueba con Supabase:", err);
      alert("Hubo un error al conectar con Supabase. Revisa la consola.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSpines = spines.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (s.title || '').toLowerCase().includes(term) || (s.author || '').toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div style={{ color: 'white', textAlign: 'center', marginTop: '100px', fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}>
        LOADING CATALOG...
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '10px' : '20px', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER BAR */}
      <div style={{ 
        backgroundColor: '#111', 
        border: '3px solid #b30000', 
        padding: '20px', 
        marginBottom: '20px',
        boxShadow: '4px 4px 0px #000',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '14px', margin: '0 0 5px 0' }}>
              🔧 TAG EDITOR COMMUNITY TOOL
            </h1>
            <p style={{ margin: 0, color: '#aaa', fontSize: '12px' }}>
              Select a spine, inspect its visual design, and update its tags based on the official guide.
            </p>
          </div>
          <button onClick={onCancel} style={{
            backgroundColor: '#333', color: '#fff', border: '2px solid #555',
            padding: '10px 15px', fontFamily: '"Press Start 2P", monospace', fontSize: '0.6rem', cursor: 'pointer'
          }}>
            ← BACK TO CATALOG
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Search spine by title or author to edit..."
          style={{
            width: '100%',
            padding: '12px 15px',
            backgroundColor: '#1a1a1a',
            color: '#ffcc00',
            border: '2px solid #ffcc00',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            borderRadius: '4px'
          }}
        />

        {/* SPINE SELECTOR CAROUSEL */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          overflowX: 'auto', 
          backgroundColor: '#161616',
          padding: '10px',
          borderRadius: '8px',
          height: '140px',
          alignItems: 'center',
          border: '1px solid #333'
        }}>
          {filteredSpines.map((spine, i) => {
            const isSelected = selectedSpine?.id === spine.id;
            const imgUrl = getImageUrl(spine);
            return (
              <div 
                key={spine.id || i}
                onClick={() => handleSelectSpine(spine)}
                style={{
                  minWidth: '50px',
                  height: '110px',
                  cursor: 'pointer',
                  border: isSelected ? '3px solid #ffcc00' : '2px solid #333',
                  boxShadow: isSelected ? '0 0 10px #ffcc00' : 'none',
                  backgroundColor: '#000',
                  padding: '4px',
                  textAlign: 'center',
                  opacity: isSelected ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                title={spine.title}
              >
                <img 
                  src={imgUrl} 
                  alt={spine.title}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {selectedSpine && (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
          
          {/* PREVIEW COLUMN */}
          <div style={{
            backgroundColor: '#161616',
            border: '3px solid #333',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '4px 4px 0px #000',
            width: isMobile ? '100%' : '320px',
            height: 'fit-content'
          }}>
            <div style={{ 
              color: '#ffcc00', 
              fontFamily: '"Press Start 2P", monospace', 
              fontSize: '0.65rem', 
              marginBottom: '10px',
              wordBreak: 'break-word'
            }}>
              {selectedSpine.title}
            </div>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '15px' }}>
              By: {selectedSpine.author}
            </div>

            <div style={{ backgroundColor: '#000', padding: '15px', border: '1px solid #444', marginBottom: '15px', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={getImageUrl(selectedSpine)} 
                alt={selectedSpine.title}
                style={{ maxHeight: '420px', maxWidth: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          {/* TAGS EDITOR COLUMN */}
          <div style={{
            backgroundColor: '#161616',
            border: '4px solid #b30000',
            boxShadow: '6px 6px 0px #000',
            padding: '25px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ borderBottom: '2px dashed #444', paddingBottom: '12px' }}>
              <h2 style={{ color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '12px', margin: 0 }}>
                SELECT CORRECT ATTRIBUTES
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
              {Object.entries(SINGLE_CATEGORIES).map(([category, options]) => (
                <div key={category} style={{ backgroundColor: '#111', padding: '15px', border: '2px solid #333', borderRadius: '6px' }}>
                  <div style={{ marginBottom: '12px', color: '#00ffcc', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                    {category}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {options.map(option => {
                      const isSelected = proposedTags[category] === option;
                      return (
                        <button
                          key={option}
                          onClick={() => handleSelectTag(category, option)}
                          style={{
                            padding: '8px 10px',
                            fontSize: '12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#3b82f6' : '#2a2a2a',
                            color: isSelected ? '#fff' : '#aaa',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {category === "Base Color" && COLOR_MAP[option] && (
                            <span style={{
                              width: '10px', height: '10px', borderRadius: '2px',
                              background: COLOR_MAP[option], display: 'inline-block',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }} />
                          )}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* EXTRAS (MULTIPLE) */}
              <div style={{ backgroundColor: '#111', padding: '15px', border: '2px solid #b30000', borderRadius: '6px' }}>
                <div style={{ marginBottom: '12px', color: '#ff6666', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                  Extras (Multiple)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EXTRAS.map(extra => {
                    const currentExtras = proposedTags["Extras"] || [];
                    const isSelected = currentExtras.includes(extra);
                    return (
                      <button
                        key={extra}
                        onClick={() => handleExtraToggle(extra)}
                        style={{
                          padding: '8px 10px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#ef4444' : '#2a2a2a',
                          color: isSelected ? '#fff' : '#aaa',
                          fontWeight: isSelected ? 'bold' : 'normal'
                        }}
                      >
                        {extra}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '2px solid #333', borderRadius: '6px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '10px', color: '#ff6666' }}>* Refer to the official guide if unsure.</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onCancel} style={{ backgroundColor: 'transparent', color: '#888', border: '2px solid #555', padding: '10px 15px', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', cursor: 'pointer', borderRadius: '4px' }}>
                  CANCEL
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  style={{ backgroundColor: '#b30000', color: '#fff', border: '2px solid #ff4d4d', boxShadow: '2px 2px 0px #000', padding: '10px 20px', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', cursor: 'pointer', opacity: submitting ? 0.5 : 1, borderRadius: '4px' }}
                >
                  {submitting ? 'SENDING...' : 'SUBMIT FIX'}
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}