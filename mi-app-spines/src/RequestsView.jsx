import React, { useState, useEffect } from 'react';

const RequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [gameTitle, setGameTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('');

  // Cargar peticiones al entrar
  const fetchRequests = async () => {
    const res = await fetch('/api/requests');
    const data = await res.json();
    setRequests(data);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gameTitle) return;
    
    await fetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify({ gameTitle, description, requester, status: 'pending' }),
    });
    
    setGameTitle(''); setDescription(''); setRequester('');
    fetchRequests();
  };

  const handleClaim = async (requestId, artistName) => {
    if (!artistName) return alert("Please enter your name to claim this bounty!");
    await fetch('/api/requests', {
      method: 'PATCH',
      body: JSON.stringify({ requestId, artistName, status: 'in-progress' }),
    });
    fetchRequests();
  };

  return (
    <div style={{ color: 'white', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h2 style={{ borderBottom: '2px solid #b30000', paddingBottom: '10px' }}>⚔️ BOUNTY BOARD (REQUESTS)</h2>
      
      {/* Explicación rápida */}
      <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '5px', marginBottom: '30px', borderLeft: '4px solid #b30000' }}>
        <p><strong>Users:</strong> Can't find a spine? Post a request here. Be specific with the version or style!</p>
        <p><strong>Artists:</strong> Click "CLAIM" to let others know you're working on it. Mention your name so users can find your work on Reddit later.</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
        <input placeholder="Game Title (Required)" value={gameTitle} onChange={e => setGameTitle(e.target.value)} style={{ padding: '10px' }} required />
        <textarea placeholder="Details (Version, language, specific artist style...)" value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '10px', minHeight: '60px' }} />
        <input placeholder="Your Name (Optional)" value={requester} onChange={e => setRequester(e.target.value)} style={{ padding: '10px' }} />
        <button type="submit" style={{ backgroundColor: '#b30000', color: 'white', border: 'none', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>POST REQUEST</button>
      </form>

      {/* Lista de peticiones */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {requests.map(req => (
          <div key={req.id} style={{ border: '1px solid #444', padding: '15px', position: 'relative' }}>
            <span style={{ color: req.status === 'pending' ? '#ffcc00' : '#00ff00', fontSize: '0.8rem' }}>
              [{req.status.toUpperCase()}]
            </span>
            <h3>{req.gameTitle}</h3>
            <p style={{ fontSize: '0.9rem', color: '#ccc' }}>{req.description}</p>
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Requested by: {req.requester || 'Anonymous'}</p>
            
            {req.status === 'pending' ? (
              <button 
                onClick={() => {
                  const name = prompt("Enter your Artist Name (u/name):");
                  if (name) handleClaim(req.id, name);
                }}
                style={{ marginTop: '10px', cursor: 'pointer' }}
              >
                🛡️ CLAIM REQUEST
              </button>
            ) : (
              <p style={{ color: '#00ff00', marginTop: '10px' }}>⚒️ Working on it: <strong>{req.claimedBy}</strong></p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestsView;