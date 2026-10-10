import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Leemos las credenciales desde las variables de entorno de Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const TagEditView = ({ onCancel }) => {
  const [spines, setSpines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpine, setSelectedSpines] = useState(null);
  const [proposedTags, setProposedTags] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const filterCategories = {
    "Platform": ['Switch 1', 'Switch 2'],
    "Main Style": ['Minimalist', 'Scenic / Detailed', 'Maximalist (Kitsch)'],
    "Title Typography": ['Simple Text', 'Original Logo'],
    "Lower Logo": ['Nintendo', 'other'],
    "Extras": ['DNN Style', 'Character Bottom', 'Characters throughout the spine', 'Set / Panorama'],
    "Text Alignment": ['Top Centered', 'Top Centered with margin', 'Center', 'Bottom', 'Cover All'],
    "Base Color": ['Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Orange', 'Purple', 'White', 'Black', 'Gray', 'Multicolor']
  };

  useEffect(() => {
    fetch('/database.json')
      .then(res => res.json())
      .then(data => {
        setSpines(data);
        if (data && data.length > 0) {
          setSelectedSpines(data[0]);
          setProposedTags(data[0].tags || {});
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar spines:", err);
        setLoading(false);
      });
  }, []);

  const handleSelectSpine = (spine) => {
    setSelectedSpines(spine);
    setProposedTags(spine.tags || {});
  };

  const handleToggleTag = (category, value) => {
    setProposedTags(prev => {
      const categoryTags = prev[category] || [];
      if (categoryTags.includes(value)) {
        return { ...prev, [category]: categoryTags.filter(t => t !== value) };
      } else {
        return { ...prev, [category]: [...categoryTags, value] };
      }
    });
  };

  // --- FUNCIÓN DE ENVÍO AL BUZÓN DE SUPABASE ---
  const handleSubmit = async () => {
    if (!selectedSpine) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('tag_requests')
        .insert([
          { 
            spine_id: selectedSpine.id, 
            spine_title: selectedSpine.title,
            proposed_tags: proposedTags,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      alert("¡Etiquetas enviadas con éxito! Quedarán pendientes de revisión. ¡Gracias!");
      onCancel();
    } catch (err) {
      console.error("Error al enviar las etiquetas:", err);
      alert("Hubo un error al enviar el cambio. Inténtalo de nuevo.");
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
      <div style={{ color: 'white', textAlign: 'center', marginTop: '100px', fontFamily: '"Press Start 2P", monospace' }}>
        LOADING CATALOG...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'white', fontFamily: 'monospace', padding: '20px' }}>
      
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        border: '3px solid #b30000', 
        padding: '20px', 
        marginBottom: '20px',
        boxShadow: '4px 4px 0px #000',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            backgroundColor: '#111',
            color: '#ffcc00',
            border: '2px solid #ffcc00',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'monospace'
          }}
        />

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          overflowX: 'auto', 
          paddingBottom: '10px',
          maxHeight: '130px'
        }}>
          {filteredSpines.slice(0, 30).map(spine => {
            const isSelected = selectedSpine?.id === spine.id;
            return (
              <div 
                key={spine.id}
                onClick={() => handleSelectSpine(spine)}
                style={{
                  minWidth: '50px',
                  cursor: 'pointer',
                  border: isSelected ? '3px solid #ffcc00' : '2px solid #333',
                  boxShadow: isSelected ? '0 0 10px #ffcc00' : 'none',
                  backgroundColor: '#000',
                  padding: '3px',
                  textAlign: 'center',
                  opacity: isSelected ? 1 : 0.6
                }}
              >
                <img 
                  src={spine.image_url || spine.url} 
                  alt={spine.title}
                  style={{ height: '90px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {selectedSpine && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          
          <div style={{
            backgroundColor: '#161616',
            border: '3px solid #333',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '4px 4px 0px #000',
            height: 'fit-content',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{ 
              color: '#ffcc00', 
              fontFamily: '"Press Start 2P", monospace', 
              fontSize: '0.65rem', 
              marginBottom: '15px',
              wordBreak: 'break-word'
            }}>
              {selectedSpine.title}
            </div>
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '15px' }}>
              By: {selectedSpine.author}
            </div>

            <div style={{ backgroundColor: '#000', padding: '10px', border: '1px solid #444', marginBottom: '15px' }}>
              <img 
                src={selectedSpine.image_url || selectedSpine.url} 
                alt={selectedSpine.title}
                style={{ maxHeight: '420px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>

          <div style={{
            backgroundColor: '#161616',
            border: '4px solid #b30000',
            boxShadow: '6px 6px 0px #000',
            padding: '25px'
          }}>
            <div style={{ borderBottom: '2px dashed #444', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '12px', margin: 0 }}>
                SELECT CORRECT ATTRIBUTES
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              {Object.entries(filterCategories).map(([category, options]) => (
                <div key={category} style={{ backgroundColor: '#111', padding: '12px', border: '2px solid #333' }}>
                  <div style={{ marginBottom: '10px', color: '#00ffcc', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem' }}>
                    {category}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {options.map(option => {
                      const isSelected = proposedTags[category]?.includes(option);
                      return (
                        <label key={option} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: isSelected ? '#fff' : '#777' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected || false} 
                            onChange={() => handleToggleTag(category, option)}
                            style={{ accentColor: '#ffcc00' }}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '2px solid #333' }}>
              <div style={{ fontSize: '10px', color: '#ff6666' }}>* Refer to the official guide if unsure.</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={onCancel} style={{ backgroundColor: 'transparent', color: '#888', border: '2px solid #555', padding: '8px 12px', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', cursor: 'pointer' }}>
                  CANCEL
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  style={{ backgroundColor: '#b30000', color: '#fff', border: '2px solid #ff4d4d', boxShadow: '2px 2px 0px #000', padding: '8px 15px', fontFamily: '"Press Start 2P", monospace', fontSize: '0.55rem', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}
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
};

export default TagEditView;