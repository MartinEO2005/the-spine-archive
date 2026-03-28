import React, { useState, useEffect } from 'react';

const RequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('');
  const [switchVersion, setSwitchVersion] = useState('Both'); 
  const [refLink, setRefLink] = useState(''); // NUEVO: Estado para el link de referencia
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
        // Enviamos refLink al servidor
        body: JSON.stringify({ gameTitle, description, requester, switchVersion, refLink }), 
      });
      setGameTitle(''); setDescription(''); setRequester(''); setSwitchVersion('Both'); setRefLink('');
      setShowForm(false);
      await fetchRequests();
    } finally { setLoading(false); }
  };

  const handleClaim = async (requestId) => {
    const artistName = prompt("Enter your Artist Name (u/name):");
    if (!artistName) return;
    
    await fetch('/api/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, artistName }),
    });
    fetchRequests();
  };

  const handleComplete = async (requestId, currentClaims) => {
    const artistName = prompt("To close this request, enter your Artist Name (u/name):");
    if (!artistName) return;

    if (!currentClaims.includes(artistName)) {
      alert("Unauthorized. Only assigned artists can mark this bounty as finished.");
      return;
    }

    if (!confirm("Have you already uploaded this spine to the catalog? This will remove the request from the board.")) return;

    try {
      await fetch(`/api/requests?requestId=${requestId}&password=TU_CONTRASEÑA_AQUI`, {
        method: 'DELETE',
      });
      fetchRequests();
    } catch (e) { console.error("Error finishing request", e); }
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
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* EXPLICACIÓN ACTUALIZADA PARA EL USUARIO */}
      <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #b30000', marginBottom: '30px', fontSize: '0.85rem', lineHeight: '1.6' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#fff' }}>HOW IT WORKS</p>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#bbb' }}>
          <li><strong>Users:</strong> Click "+" to request a spine. <strong>If it already exists on Reddit but not here</strong>, please provide the link so we can add it to the catalog!</li>
          <li><strong>Artists:</strong> Claim a bounty to start working. Multiple artists can collaborate.</li>
          <li><strong>Completion:</strong> Once the spine is live in our catalog, the bounty can be marked as <strong>DONE</strong>.</li>
        </ul>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #444' }}>
          <h3 style={{ marginTop: 0 }}>Post a New Request</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input placeholder="Game Title (e.g. Zelda: Echoes of Wisdom)" value={gameTitle} onChange={e => setGameTitle(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} required />
            
            <select 
              value={switchVersion} 
              onChange={e => setSwitchVersion(e.target.value)} 
              style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
            >
              <option value="Switch 1">Switch 1 Only</option>
              <option value="Switch 2">Switch 2 Only</option>
              <option value="Both">Both Versions</option>
            </select>

            {/* CAMPO DE LINK CON EXPLICACIÓN */}
            <input 
              placeholder="Reddit Link (If the spine already exists there)" 
              value={refLink} 
              onChange={e => setRefLink(e.target.value)} 
              style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} 
            />

            <textarea placeholder="Specific details (Region, language, specific artist style...)" value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', minHeight: '80px' }} />
            <input placeholder="Your Reddit Name (Optional)" value={requester} onChange={e => setRequester(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} />
            <button type="submit" disabled={loading} style={{ backgroundColor: '#b30000', color: 'white', border: 'none', padding: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
              {loading ? 'POSTING...' : 'SUBMIT BOUNTY'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {requests.map(req => (
          <div key={req.id} style={{ 
            backgroundColor: '#1a1a1a', border: `1px solid ${req.status === 'pending' ? '#444' : '#00ff00'}`, 
            borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: req.status === 'pending' ? '#ffcc00' : '#00ff00', fontWeight: 'bold' }}>
                  ● {req.status.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{req.gameTitle}</h3>
              <p style={{ fontSize: '0.8rem', color: '#ffcc00', margin: '0 0 10px 0', fontWeight: 'bold' }}>Target: {req.switchVersion || 'Not specified'}</p>
              
              <p style={{ fontSize: '0.85rem', color: '#bbb', margin: '0 0 10px 0', lineHeight: '1.4' }}>{req.description}</p>

              {/* MOSTRAR LINK SI EXISTE */}
              {req.refLink && (
                <a href={req.refLink} target="_blank" rel="noopener noreferrer" style={{ color: '#00ccff', fontSize: '0.8rem', textDecoration: 'none', display: 'block', marginBottom: '15px' }}>
                  🔗 View Reference Link
                </a>
              )}
            </div>
            
            <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
              <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 10px 0' }}>By: {req.requester || 'Anonymous'}</p>
              
              {req.claimedBy && req.claimedBy.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#00ff00', textAlign: 'center', fontWeight: 'bold', marginBottom: '10px' }}>
                  ⚒️ Working: {req.claimedBy.join(', ')}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleClaim(req.id)} style={{ flex: 2, padding: '8px', background: 'transparent', border: `1px solid ${req.status === 'pending' ? '#b30000' : '#00ff00'}`, color: req.status === 'pending' ? '#b30000' : '#00ff00', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '0.7rem' }}>
                  {req.status === 'pending' ? '🛡️ CLAIM' : '+ JOIN'}
                </button>
                {req.status === 'in-progress' && (
                  <button onClick={() => handleComplete(req.id, req.claimedBy)} style={{ flex: 1, padding: '8px', background: '#00ff00', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '0.7rem' }}>
                    DONE
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestsView;