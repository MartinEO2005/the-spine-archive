import React, { useMemo, useState } from 'react';

// --- GENERADOR DE PURPURINA CONSTANTE PARA EVITAR RE-RENDERIZADOS ---
const CONFETTI_PARTICLES = Array.from({ length: 15 }).map(() => ({
  left: `${Math.random() * 100}%`,
  color: ['#ffcc00', '#b30000', '#00ff00', '#00ffff'][Math.floor(Math.random() * 4)],
  duration: `${1 + Math.random() * 1.5}s`,
  delay: `${Math.random() * 2}s`
}));

// --- NIVELES (QUEST LOG) ---
const MILESTONES = [
  { target: 1000, name: "Lv.1 - INITIATOR" },
  { target: 2500, name: "Lv.2 - APPRENTICE" },
  { target: 5000, name: "Lv.3 - ARCHIVIST" },
  { target: 7500, name: "Lv.4 - HERO" },
  { target: 10000, name: "Lv.5 - MASTER" },
  { target: 12500, name: "Lv.6 - LEGEND" },
  { target: 15000, name: "Lv.7 - MYTHIC" },
  { target: 17500, name: "Lv.8 - TITAN" },
  { target: 20000, name: "Lv.9 - GOD TIER" },
  { target: 30000, name: "Lv.10 - OMNISCIENT" },
  { target: 50000, name: "MAX - THE ARCHIVE" }
];

const StatsView = ({ stats: propStats, spines = [] }) => {
  const [expandedAuthor, setExpandedAuthor] = useState(null);
  const [authorTopSpines, setAuthorTopSpines] = useState([]);

  // --- CÁLCULO: TOP UPLOADERS (ÚLTIMOS 30 DÍAS) ---
  const topUploaders30Days = useMemo(() => {
    if (!spines.length) return [];
    const now = Date.now() / 1000; 
    const thirtyDays = 30 * 24 * 60 * 60;
    const counts = {};

    spines.forEach(s => {
      if (s.created_utc && (now - s.created_utc) <= thirtyDays) {
        const author = s.author ? s.author.replace('u/', '') : 'Unknown';
        counts[author] = (counts[author] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [spines]);

  // --- CÁLCULO: ESTADÍSTICAS GLOBALES ---
  const stats = useMemo(() => {
    if (propStats) return propStats;
    if (!spines.length) return null;
    const counts = {};
    spines.forEach(s => {
      const author = s.author ? s.author.replace('u/', '') : 'Unknown';
      counts[author] = (counts[author] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return { totalSpines: spines.length, totalAuthors: Object.keys(counts).length, topAuthors: sorted };
  }, [propStats, spines]);

  const franchiseStats = useMemo(() => {
    const counts = { 
      Zelda: 0, Mario: 0, Pokemon: 0, Metroid: 0, Kirby: 0, 
      FinalFantasy: 0, FireEmblem: 0, Xenoblade: 0, Persona: 0, 
      DragonQuest: 0, AnimalCrossing: 0, Splatoon: 0, 
      AceAttorney: 0, Lego: 0, Luigi: 0, Sonic: 0, 
      MegaMan: 0, DonkeyKong: 0, StreetFighter: 0, ResidentEvil: 0,
      StarFox: 0, Pikmin: 0, MonsterHunter: 0, KingdomHearts: 0 
    };

    spines.forEach(s => {
      const title = s.title?.toLowerCase() || "";
      
      if (title.includes('zelda') || title.includes('link')) counts.Zelda++;
      if (title.includes('mario')) counts.Mario++;
      if (title.includes('pokemon') || title.includes('pokémon')) counts.Pokemon++;
      if (title.includes('metroid') || title.includes('samus')) counts.Metroid++;
      if (title.includes('kirby')) counts.Kirby++;
      if (title.includes('final fantasy')) counts.FinalFantasy++;
      if (title.includes('fire emblem')) counts.FireEmblem++;
      if (title.includes('xenoblade')) counts.Xenoblade++;
      if (title.includes('persona') || title.includes('shin megami')) counts.Persona++;
      if (title.includes('dragon quest')) counts.DragonQuest++;
      if (title.includes('animal crossing')) counts.AnimalCrossing++;
      if (title.includes('splatoon')) counts.Splatoon++;
      if (title.includes('ace attorney') || title.includes('phoenix wright')) counts.AceAttorney++;
      if (title.includes('lego')) counts.Lego++;
      if (title.includes('luigi')) counts.Luigi++;
      if (title.includes('sonic')) counts.Sonic++;
      if (title.includes('mega man') || title.includes('megaman')) counts.MegaMan++;
      if (title.includes('donkey kong')) counts.DonkeyKong++;
      if (title.includes('street fighter')) counts.StreetFighter++;
      if (title.includes('resident evil')) counts.ResidentEvil++;
      if (title.includes('star fox')) counts.StarFox++;
      if (title.includes('pikmin')) counts.Pikmin++;
      if (title.includes('monster hunter')) counts.MonsterHunter++;
      if (title.includes('kingdom hearts')) counts.KingdomHearts++;
    });

    // Filtramos los que tengan al menos 1 ocurrencia para no ensuciar la UI
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
  }, [spines]);

  const handleExpandAuthor = (author) => {
    if (expandedAuthor === author) {
      setExpandedAuthor(null);
      return;
    }
    setExpandedAuthor(author);
    const authorSpines = spines
        .filter(s => (s.author || '').replace('u/', '') === author)
        .slice(0, 5);
    setAuthorTopSpines(authorSpines);
  };

  if (!stats) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>No data available.</div>;

  // --- LÓGICA DE BARRA DE PROGRESO DINÁMICA ---
  const maxSpines = stats.totalSpines;
  let goalIndex = MILESTONES.findIndex(m => maxSpines < m.target);
  
  // Si superó todas las metas, nos quedamos en la última
  if (goalIndex === -1) goalIndex = MILESTONES.length - 1; 

  // Calculamos una "ventana" de 5 metas alrededor del objetivo actual para no hacer la lista infinita
  const startIndex = Math.max(0, goalIndex - 2);
  const visibleSteps = MILESTONES.slice(startIndex, startIndex + 5);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px', color: 'white', backgroundColor: '#111' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          /* Animación de destellos retro (sparkles) */
          @keyframes pixel-sparkle {
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(0.5); }
          }

          /* Efecto Parpadeo para la meta actual */
          @keyframes goal-pulse {
            0% { box-shadow: 0 0 5px #ffcc00; border-color: #ffcc00; }
            50% { box-shadow: 0 0 20px #ffcc00; border-color: #fff; }
            100% { box-shadow: 0 0 5px #ffcc00; border-color: #ffcc00; }
          }

          /* Animación de caída para la purpurina */
          @keyframes confetti-fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
          }
          
          /* Estilo retro 8-bits para el botón de Reddit */
          .retro-reddit-btn {
            background-color: #FF4500;
            color: white;
            font-family: '"Press Start 2P", monospace';
            font-size: 8px;
            padding: 8px 12px;
            border: 2px solid #fff;
            text-decoration: none;
            box-shadow: 3px 3px 0px #000;
            transition: transform 0.1s;
          }
          .retro-reddit-btn:active {
            transform: translate(3px, 3px);
            box-shadow: 0px 0px 0px #000;
          }
        `}
      </style>

      {/* CONTENEDOR PRINCIPAL: DIVIDIDO EN 2 COLUMNAS */}
      <div style={{ display: 'flex', gap: '50px', maxWidth: '1400px', margin: '0 auto', alignItems: 'flex-start' }}>
        
        {/* ============================================== */}
        {/* COLUMNA IZQUIERDA: DASHBOARD & BARRA DE PROGRESO */}
        {/* ============================================== */}
        <div style={{ flex: '0 0 450px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <img 
              src="/logo.jpg" 
              alt="The Spine Archive Logo" 
              style={{ height: '140px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 10px rgba(179,0,0,0.5))' }}
            />
          </div>

          <h1 style={{ 
            fontFamily: '"Press Start 2P", monospace',
            textAlign: 'center',
            borderBottom: '4px solid #b30000',
            paddingBottom: '15px',
            color: '#fff',
            textShadow: '3px 3px 0px #b30000',
            fontSize: '1.5rem',
            letterSpacing: '2px'
          }}>
            STATS DASHBOARD
          </h1>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1, backgroundColor: '#222', padding: '15px', border: '4px solid #333', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: '"Press Start 2P", monospace', marginBottom: '10px' }}>TOTAL SPINES</div>
              <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#b30000', fontFamily: '"Press Start 2P", monospace' }}>{stats.totalSpines}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#222', padding: '15px', border: '4px solid #333', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: '"Press Start 2P", monospace', marginBottom: '10px' }}>TOTAL AUTHORS</div>
              <div style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', fontFamily: '"Press Start 2P", monospace' }}>{stats.totalAuthors}</div>
            </div>
          </div>

          {/* BARRA DE PROGRESO POR PASOS DINÁMICA (QUEST LOG) */}
          <div style={{ backgroundColor: '#222', padding: '20px', border: '4px solid #333', position: 'relative', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '14px', color: '#fff', fontFamily: '"Press Start 2P", monospace', marginBottom: '25px', textShadow: '2px 2px #b30000' }}>
              COMMUNITY QUEST
            </h2>

            <div style={{ position: 'relative', paddingLeft: '30px' }}>
              {/* Línea vertical de fondo */}
              <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '4px', backgroundColor: '#111', zIndex: 0 }}></div>
              
              {visibleSteps.map((step, index) => {
                const isReached = maxSpines >= step.target;
                const isCurrentGoal = step.target === MILESTONES[goalIndex].target;
                
                return (
                  <div key={index} style={{ position: 'relative', marginBottom: '25px', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                    
                    {/* El nodo (Checkpoint) */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '-28px', 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: isReached ? '#b30000' : (isCurrentGoal ? '#ffcc00' : '#111'), 
                      border: isReached ? '4px solid #fff' : '4px solid #444',
                      animation: isCurrentGoal ? 'goal-pulse 1.5s infinite' : 'none',
                    }}></div>
                    
                    {/* Lluvia de purpurina SOLO en el objetivo actual */}
                    {isCurrentGoal && (
                      <div style={{ position: 'absolute', top: '-10px', left: '-40px', right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
                        {CONFETTI_PARTICLES.map((particle, i) => (
                          <div key={i} style={{
                            position: 'absolute',
                            left: particle.left,
                            width: '4px', height: '4px',
                            backgroundColor: particle.color,
                            animation: `confetti-fall ${particle.duration} infinite linear`,
                            animationDelay: particle.delay
                          }}></div>
                        ))}
                      </div>
                    )}

                    {/* Textos del paso */}
                    <div style={{ marginLeft: '10px', fontFamily: '"Press Start 2P", monospace', fontSize: '10px', lineHeight: '1.5', zIndex: 2 }}>
                      <div style={{ color: isReached ? '#fff' : (isCurrentGoal ? '#ffcc00' : '#666') }}>
                        {step.name}
                      </div>
                      <div style={{ color: isReached ? '#b30000' : (isCurrentGoal ? '#fff' : '#444') }}>
                        {isReached ? 'CLEARED!' : (isCurrentGoal ? `CURRENT GOAL: ${step.target}` : `LOCKED: ${step.target}`)}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ backgroundColor: '#222', padding: '20px', border: '4px solid #333' }}>
            <h2 style={{ color: '#ffcc00', marginBottom: '20px', fontFamily: '"Press Start 2P", monospace', fontSize: '12px', lineHeight: '1.5' }}>🔥 TOP 5 LAST UPLOADERS<br/><span style={{fontSize: '8px', color: '#aaa'}}>(LAST 30 DAYS)</span></h2>
            {topUploaders30Days.length > 0 ? (
              topUploaders30Days.map(([author, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < topUploaders30Days.length - 1 ? '2px dashed #444' : 'none', fontFamily: 'monospace', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>#{i+1} u/{author}</span>
                  <span style={{ color: '#ffcc00' }}>{count} SPINES</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#666', fontFamily: 'monospace' }}>No new spines. Be the first!</div>
            )}
          </div>

          <div style={{ backgroundColor: '#222', padding: '20px', border: '4px solid #333' }}>
            <h2 style={{ color: '#aaa', marginBottom: '20px', fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}>FRANCHISES</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {franchiseStats.map(([name, count]) => (
                <div key={name} style={{ backgroundColor: '#111', padding: '8px 12px', border: '2px solid #555', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{name.toUpperCase()}</span>
                  <span style={{ color: '#b30000', fontWeight: 'bold' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* COLUMNA DERECHA: TODOS LOS CONTRIBUIDORES      */}
        {/* LA CLAVE DEL BUG FIX ESTÁ AQUÍ: minWidth: 0     */}
        {/* ============================================== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          
          <h1 style={{ 
            fontFamily: '"Press Start 2P", monospace', 
            textAlign: 'center', 
            borderBottom: '4px solid #b30000', 
            paddingBottom: '15px', 
            marginBottom: '30px',
            color: '#fff', 
            textShadow: '3px 3px 0px #b30000', 
            fontSize: '1.5rem',
            letterSpacing: '2px' 
          }}>
            ALL CONTRIBUTORS
          </h1>

          {/* Se añade maxWidth 100% para respetar el límite */}
          <div style={{ backgroundColor: '#222', border: '4px solid #333', marginBottom: '100px', maxWidth: '100%', overflow: 'hidden' }}>
            {stats.topAuthors.map(([author, count], index) => {
              const isExpanded = expandedAuthor === author;
              return (
                <div key={author} style={{ backgroundColor: index % 2 === 0 ? '#222' : '#1a1a1a', borderBottom: '2px solid #333' }}>
                  
                  <div 
                    onClick={() => handleExpandAuthor(author)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', cursor: 'pointer', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '50%' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px', fontFamily: 'monospace', color: index < 3 ? '#b30000' : 'white' }}>u/{author}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px', color: isExpanded ? '#b30000' : 'white' }}>
                        {count} SPINES {isExpanded ? '▲' : '▼'}
                      </div>
                      <a 
                        href={`https://www.reddit.com/user/${author}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="retro-reddit-btn"
                      >
                        REDDIT ↗
                      </a>
                    </div>
                  </div>

                  {/* VISTA DESPLEGABLE DE LOMOS */}
                  {isExpanded && (
                    <div style={{ padding: '40px 20px', backgroundColor: '#0a0a0a', borderTop: '2px dashed #444', display: 'flex', gap: '40px', overflowX: 'auto', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                      {authorTopSpines.length > 0 ? (
                        authorTopSpines.map((spine, i) => (
                          <div key={i} style={{ flexShrink: 0, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '220px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' }}>
                              <img 
                                src={spine.image || spine.src}
                                alt={spine.title}
                                loading="lazy"
                                style={{ 
                                  height: '220px',
                                  transform: 'rotate(-90deg)',
                                  transformOrigin: 'center',
                                  border: '2px solid #fff',
                                  boxShadow: '4px 4px 0px #000'
                                }} 
                              />
                            </div>
                            <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', marginTop: '10px' }}>
                              {spine.title}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#666', fontFamily: 'monospace', fontSize: '14px' }}>No spines found.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default StatsView;