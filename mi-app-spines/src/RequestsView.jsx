import React, { useState, useEffect } from 'react';

const RequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('');
  const [switchVersion, setSwitchVersion] = useState('Both'); 
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
        body: JSON.stringify({ gameTitle, description, requester, switchVersion }), 
      });
      setGameTitle(''); setDescription(''); setRequester(''); setSwitchVersion('Both'); 
      setShowForm(false);
      await fetchRequests();
    } finally { setLoading(false); }
  };

  // NUEVA FUNCIÓN: Para que alguien aporte un link de Reddit a una petición
  const handleProvideLink = async (requestId) => {
    const link = prompt("Found it on Reddit? Paste the URL here so the admin can add it to the catalog:");
    if (!link) return;

    await fetch('/api/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, refLink: link }), // Enviamos el link
    });
    fetchRequests();
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
      alert("Unauthorized.");
      return;
    }
    try {
      await fetch(`/api/requests?requestId=${requestId}&password=TU_CONTRASEÑA_AQUI`, { method: 'DELETE' });
      fetchRequests();
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ color: 'white', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #b30000', paddingBottom: '15px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>⚔️ BOUNTY BOARD</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: showForm ? '#444' : '#b30000', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '24px', cursor: 'pointer' }}>
          {showForm ? '×' : '+'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #444' }}>
          <h3>Post a New Request</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input placeholder="Game Title" value={gameTitle} onChange={e => setGameTitle(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555' }} required />
            <select value={switchVersion} onChange={e => setSwitchVersion(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555' }}>
              <option value="Switch 1">Switch 1 Only</option>
              <option value="Switch 2">Switch 2 Only</option>
              <option value="Both">Both Versions</option>
            </select>
            <textarea placeholder="Details..." value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555' }} />
            <button type="submit" disabled={loading} style={{ backgroundColor: '#b30000', color: 'white', padding: '12px', fontWeight: 'bold' }}>
              {loading ? 'POSTING...' : 'SUBMIT BOUNTY'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {requests.map(req => (
          <div key={req.id} style={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>{req.gameTitle}</h3>
            <p style={{ fontSize: '0.8rem', color: '#ffcc00' }}>Target: {req.switchVersion || 'Both'}</p>
            <p style={{ fontSize: '0.85rem', color: '#bbb' }}>{req.description}</p>

            {/* SI ALGUIEN APORTÓ UN LINK, SE MUESTRA AQUÍ */}
            {req.refLink && (
              <div style={{ background: '#003300', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#00ff00' }}>Found on Reddit:</p>
                <a href={req.refLink} target="_blank" rel="noreferrer" style={{ color: 'white', fontSize: '0.8rem' }}>View Reference</a>
              </div>
            )}

            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => handleClaim(req.id)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #b30000', color: '#b30000', fontSize: '0.7rem' }}>
                  🛡️ CLAIM
                </button>
                
                {/* BOTÓN PARA QUE OTRA PERSONA PONGA EL LINK */}
                <button onClick={() => handleProvideLink(req.id)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #00ccff', color: '#00ccff', fontSize: '0.7rem' }}>
                  🔗 LINK FOUND
                </button>
              </div>

              {req.status === 'in-progress' && (
                <button onClick={() => handleComplete(req.id, req.claimedBy)} style={{ width: '100%', padding: '8px', background: '#00ff00', color: 'black', border: 'none', fontWeight: 'bold' }}>
                  DONE
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestsView;