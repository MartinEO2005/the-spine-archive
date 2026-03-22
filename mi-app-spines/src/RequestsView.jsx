import React, { useState, useEffect } from 'react';

const RequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Error loading requests", e); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameTitle, description, requester }),
      });
      setGameTitle(''); setDescription(''); setRequester('');
      setShowForm(false);
      await fetchRequests();
    } finally { setLoading(false); }
  };

  const handleClaim = async (requestId) => {
    const artistName = prompt("Enter your Name (u/name):");
    if (!artistName) return;
    
    await fetch('/api/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, artistName }),
    });
    fetchRequests();
  };

  return (
    <div style={{ color: 'white', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #b30000', paddingBottom: '15px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>⚔️ BOUNTY BOARD</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ 
            backgroundColor: showForm ? '#444' : '#b30000', 
            color: 'white', border: 'none', borderRadius: '50%', 
            width: '40px', height: '40px', fontSize: '24px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* Formulario Desplegable */}
      {showForm && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #444' }}>
          <h3 style={{ marginTop: 0 }}>Post a New Request</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input placeholder="Game Title (e.g. Zelda: Echoes of Wisdom)" value={gameTitle} onChange={e => setGameTitle(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} required />
            <textarea placeholder="Specific details (Style, language, region...)" value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', minHeight: '80px' }} />
            <input placeholder="Your Reddit/Name (Optional)" value={requester} onChange={e => setRequester(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} />
            <button type="submit" disabled={loading} style={{ backgroundColor: '#b30000', color: 'white', border: 'none', padding: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
              {loading ? 'POSTING...' : 'SUBMIT BOUNTY'}
            </button>
          </form>
        </div>
      )}

      {/* Grid de Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {requests.length === 0 ? (
          <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>No active bounties. Be the first to request one!</p>
        ) : (
          requests.map(req => (
            <div key={req.id} style={{ 
              backgroundColor: '#1a1a1a', border: `1px solid ${req.status === 'pending' ? '#444' : '#00ff00'}`, 
              borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: req.status === 'in-progress' ? '0 0 10px rgba(0,255,0,0.1)' : 'none'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: req.status === 'pending' ? '#ffcc00' : '#00ff00', fontWeight: 'bold' }}>
                    ● {req.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{req.gameTitle}</h3>
                <p style={{ fontSize: '0.85rem', color: '#bbb', margin: '0 0 15px 0', lineHeight: '1.4' }}>{req.description}</p>
              </div>
              
              <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 10px 0' }}>By: {req.requester || 'Anonymous'}</p>
                {req.status === 'pending' ? (
                  <button 
                    onClick={() => handleClaim(req.id)}
                    style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #b30000', color: '#b30000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
                  >
                    🛡️ CLAIM BOUNTY
                  </button>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#00ff00', textAlign: 'center', fontWeight: 'bold' }}>
                    ⚒️ Working: {req.claimedBy}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequestsView;