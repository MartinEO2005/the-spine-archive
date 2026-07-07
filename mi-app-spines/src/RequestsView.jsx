import React, { useState, useEffect, useMemo } from 'react';

const RequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [gameTitle, setGameTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('');
  const [switchVersion, setSwitchVersion] = useState('Both'); 
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Error loading requests", e); }
  };

  useEffect(() => { fetchRequests(); }, []);

  // AGRUPACIÓN POR USUARIO: Transforma la lista plana en un objeto estructurado por solicitante
  const groupedRequests = useMemo(() => {
    const groups = {};
    requests.forEach(req => {
      const user = req.requester ? req.requester.trim() : 'Anonymous User';
      if (!groups[user]) groups[user] = [];
      groups[user].push(req);
    });
    return groups;
  }, [requests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameTitle, description, requester, switchVersion, language }), 
      });
      setGameTitle(''); setDescription(''); setRequester(''); setSwitchVersion('Both'); setLanguage('English');
      setShowForm(false);
      await fetchRequests();
    } finally { setLoading(false); }
  };

  const handleProvideLink = async (requestId) => {
    const link = prompt("Found it on Reddit? Paste the URL here so the admin can add it to the catalog:");
    if (!link) return;
    await fetch('/api/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, refLink: link }), 
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
    if (!currentClaims?.includes(artistName)) {
      alert("Unauthorized.");
      return;
    }
    try {
      await fetch(`/api/requests?requestId=${requestId}&password=TU_CONTRASEÑA_AQUI`, { method: 'DELETE' });
      fetchRequests();
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ color: 'white', maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #b30000', paddingBottom: '15px', marginBottom: '20px' }}>
        {/* HEADER PRINCIPAL - ESTILO GAMER RETRO */}
      <h1 style={{ 
        fontFamily: '"Press Start 2P", monospace', 
        textAlign: 'center', 
        borderBottom: '4px solid #b30000', 
        paddingBottom: '25px', 
        marginBottom: '30px',
        color: '#fff',
        textShadow: '3px 3px 0px #b30000',
        fontSize: '2rem',
        letterSpacing: '2px'
      }}>
        ⚔️ BOUNTY BOARD
      </h1>
        <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: showForm ? '#444' : '#b30000', color: 'white', border: 'none', borderRadius: '5px', padding: '10px 20px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: '0.2s' }}>
          {showForm ? '✕ CLOSE FORM' : '+ NEW REQUEST'}
        </button>
      </div>

      {/* TEXTO DE CONTROL DE SCRAPEO CONSERVA DE FORMA INTACTA TU FRASE ANTERIOR */}
      <div style={{ backgroundColor: '#1a1a1a', borderLeft: '4px solid #b30000', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc', lineHeight: '1.5' }}>
          If your request was removed, it's because it has already been added to the catalog :) Pls dont remove the requests after they are fulfilled, as I should be aware of what spines I need to scrape.
        </p>
      </div>

      {/* NUEVO AVISO DE BÚSQUEDA OBLIGATORIA DE DUPLICADOS */}
      <div style={{ backgroundColor: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', padding: '15px', borderRadius: '6px', marginBottom: '30px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#ffcc00', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ ALWAYS SEARCH THE WEBSITE FIRST!</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#ddd', lineHeight: '1.4' }}>
          Please do a thorough search on the catalog before submitting a new bounty. The board is flooded with requests for titles that <strong>have already been completed and uploaded</strong>. Check deep before you type!
        </p>
      </div>

      {/* SECCIÓN DE CUADRANTES DE REDIRECCIÓN (REDDIT / DISCORD) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* CUADRANTE SUBREDDIT */}
        <a href="https://www.reddit.com/r/SwitchSpines/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ backgroundColor: '#222', border: '1px solid #ff4500', borderRadius: '8px', padding: '25px', cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#292929'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#222'}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff4500', display: 'flex', alignItems: 'center', gap: '10px' }}>🛸 SUBMIT VIA SUBREDDIT</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#bbb', lineHeight: '1.4' }}>
              Want your spines faster? Post your request on our official Subreddit community. Active community artists respond and fulfill bounties directly here significantly quicker!
            </p>
          </div>
        </a>

        {/* CUADRANTE DISCORD */}
        <a href="https://discord.gg/YrVvT3kR7Q" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ backgroundColor: '#222', border: '1px solid #5865F2', borderRadius: '8px', padding: '25px', cursor: 'pointer', transition: 'transform 0.2s, background-color 0.2s', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#292929'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#222'}>
            <h3 style={{ margin: '0 0 10px 0', color: '#5865F2', display: 'flex', alignItems: 'center', gap: '10px' }}>💬 JOIN THE DISCORD SERVER</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#bbb', lineHeight: '1.4' }}>
              Want your spines faster? Post your request on the discord community. Submit requests and get real-time status updates with the artists.
            </p>
          </div>
        </a>

      </div>

      {/* REGLAS DE USO */}
      <div style={{ backgroundColor: '#161616', border: '1px solid #333', borderRadius: '8px', padding: '20px', marginBottom: '40px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#b30000', fontSize: '1rem', letterSpacing: '0.5px' }}>📋 REQUEST BOARD RULES</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Always input your consistent username (e.g., Reddit u/username) so all your items gather into your unique profile box below.</li>
          <li>Clearly specify the language (English, Spanish, etc.) and style preferences inside the details area.</li>
          <li>Mark accurately if the request targets <strong>Switch 1</strong>, <strong>Switch 2</strong>, or requires compatibility with both.</li>
        </ul>
      </div>

      {/* FORMULARIO DE SOLICITUD */}
      {showForm && (
        <div style={{ backgroundColor: '#222', padding: '25px', borderRadius: '8px', marginBottom: '40px', border: '1px solid #444' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Post a New Request</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <input placeholder="Your Username (e.g. u/Martineo)" value={requester} onChange={e => setRequester(e.target.value)} style={{ flex: 1, minWidth: '250px', padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} required />
              <input placeholder="Game Title" value={gameTitle} onChange={e => setGameTitle(e.target.value)} style={{ flex: 1, minWidth: '250px', padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} required />
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <select value={switchVersion} onChange={e => setSwitchVersion(e.target.value)} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}>
                <option value="Switch 1">Switch 1</option>
                <option value="Switch 2">Switch 2</option>
                <option value="Both">Both Versions</option>
              </select>

              <select value={language} onChange={e => setLanguage(e.target.value)} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} required>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Japanese">Japanese</option>
                <option value="Other">Other / Multi</option>
              </select>
            </div>

            <textarea placeholder="Details (Region, specific style, variant...)" value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '12px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', minHeight: '80px' }} />
            
            <button type="submit" disabled={loading} style={{ backgroundColor: '#b30000', color: 'white', padding: '14px', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
              {loading ? 'POSTING...' : 'SUBMIT TO MY QUEUE'}
            </button>
          </form>
        </div>
      )}

      {/* PANEL DE SOLICITUDES AGRUPADAS POR CUADRANTE DE USUARIO */}
      <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', color: '#ffcc00' }}>👥 ACTIVE REQUESTS BY USER</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {Object.keys(groupedRequests).length === 0 ? (
          <p style={{ color: '#666', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>No active requests found on the board.</p>
        ) : (
          Object.entries(groupedRequests).map(([user, userBounties]) => (
            <div key={user} style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              <div>
                {/* CABECERA DEL CUADRANTE: Nombre del usuario */}
                <div style={{ borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '15px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', textTransform: 'uppercase', tracking: '0.5px' }}>REQUESTER Profile</span>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>👤 {user}</h3>
                </div>

                {/* LISTA DE SPINES QUE QUIERE ESTE USUARIO ESPECÍFICO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {userBounties.map(item => (
                    <div key={item.id} style={{ background: '#222', padding: '12px', borderRadius: '6px', border: '1px solid #2e2e2e' }}>
                      
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff', marginBottom: '5px' }}>
                        {item.gameTitle}
                      </div>

                      {/* TAGS DE IDIOMA Y VERSIÓN */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#332200', color: '#ffcc00', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>
                          {item.switchVersion || 'Both'}
                        </span>
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#002233', color: '#00ccff', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>
                          {item.language || 'English'}
                        </span>
                      </div>

                      {/* ESTILO / DESCRIPCIÓN */}
                      {item.description && (
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#aaa', fontStyle: 'italic', lineHeight: '1.3' }}>
                          🎨 {item.description}
                        </p>
                      )}

                      {/* ENLACE DE REFERENCIA */}
                      {item.refLink && (
                        <div style={{ background: '#002200', padding: '6px 10px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #004400' }}>
                          <a href={item.refLink} target="_blank" rel="noreferrer" style={{ color: '#00ff00', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            🔗 Reference Link
                          </a>
                        </div>
                      )}

                      {/* BOTONES DE ACCIÓN PARA CADA ELEMENTO INDIVIDUAL */}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                        <button onClick={() => handleClaim(item.id)} style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid #b30000', color: '#b30000', borderRadius: '3px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}>
                          🛡️ CLAIM
                        </button>
                        <button onClick={() => handleProvideLink(item.id)} style={{ flex: 1, padding: '5px', background: 'transparent', border: '1px solid #00ccff', color: '#00ccff', borderRadius: '3px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}>
                          🔗 LINK
                        </button>
                        {item.status === 'in-progress' && (
                          <button onClick={() => handleComplete(item.id, item.claimedBy)} style={{ padding: '5px 10px', background: '#00ff00', color: 'black', border: 'none', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer' }}>
                            DONE
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

              </div>

              {/* CONTADOR DE SOLICITUDES TOTALES DEL USUARIO */}
              <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #2a2a2a', textAlign: 'right', fontSize: '0.75rem', color: '#666' }}>
                Total Items in Queue: {userBounties.length}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default RequestsView;