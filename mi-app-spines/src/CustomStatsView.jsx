import React, { useMemo, useState } from 'react';

// =====================================================================
// STATS DE "OTRAS CONSOLAS" (r/CustomGameSpines)
// Copia independiente de StatsView.jsx con paleta PlayStation / Xbox,
// desglose por consola y franquicias multiplataforma.
// =====================================================================

const PALETTE = {
  primary: '#0070d1',      // Azul PlayStation
  primaryDark: '#003791',
  secondary: '#107c10',    // Verde Xbox
  highlight: '#3ddc97',
  gold: '#ffcc00',
  panelBg: '#161b22',
  pageBg: '#0d1117',
  border: '#1f3a5f',
};

const PIXEL_FONT = '"Press Start 2P", monospace';

// Purpurina constante (evita re-renderizados)
const CONFETTI_PARTICLES = Array.from({ length: 15 }).map(() => ({
  left: `${Math.random() * 100}%`,
  color: [PALETTE.gold, PALETTE.primary, PALETTE.secondary, PALETTE.highlight][Math.floor(Math.random() * 4)],
  duration: `${1 + Math.random() * 1.5}s`,
  delay: `${Math.random() * 2}s`
}));

// Niveles escalados: esta base empieza mucho más pequeña que la de Switch
const MILESTONES = [
  { target: 50, name: "Lv.1 - PRESS START" },
  { target: 100, name: "Lv.2 - ROOKIE" },
  { target: 250, name: "Lv.3 - COLLECTOR" },
  { target: 500, name: "Lv.4 - ARCHIVIST" },
  { target: 1000, name: "Lv.5 - HERO" },
  { target: 2500, name: "Lv.6 - LEGEND" },
  { target: 5000, name: "Lv.7 - MYTHIC" },
  { target: 10000, name: "MAX - THE ARCHIVE" }
];

// Color de cada barra según la "familia" de la consola
const consoleColor = (name = '') => {
  const n = name.toUpperCase();
  if (n.startsWith('PS') || n.includes('PLAYSTATION') || n.includes('VITA') || n.includes('PSP')) return PALETTE.primary;
  if (n.includes('XBOX')) return PALETTE.secondary;
  if (n.includes('DS') || n.includes('WII') || n.includes('GAMECUBE') || n.includes('GC')) return '#e60012';
  return '#888';
};

// Franquicias multiplataforma: [nombre visible, palabras clave]
const FRANCHISES = [
  ['God of War', ['god of war']],
  ['Uncharted', ['uncharted']],
  ['The Last of Us', ['last of us']],
  ['Spider-Man', ['spider-man', 'spiderman', 'spider man']],
  ['Horizon', ['horizon zero', 'horizon forbidden']],
  ['Ratchet & Clank', ['ratchet']],
  ['Crash', ['crash bandicoot', 'crash team']],
  ['Spyro', ['spyro']],
  ['Halo', ['halo']],
  ['Gears of War', ['gears of war', 'gears 5', 'gears tactics']],
  ['Forza', ['forza']],
  ['Final Fantasy', ['final fantasy']],
  ['Kingdom Hearts', ['kingdom hearts']],
  ['Persona', ['persona', 'shin megami']],
  ['Yakuza / LAD', ['yakuza', 'like a dragon']],
  ['Resident Evil', ['resident evil', 'biohazard']],
  ['Metal Gear', ['metal gear']],
  ['Souls', ['dark souls', 'demon\'s souls', 'elden ring', 'bloodborne', 'sekiro']],
  ['Assassin\'s Creed', ['assassin']],
  ['Call of Duty', ['call of duty']],
  ['Monster Hunter', ['monster hunter']],
  ['Dragon Quest', ['dragon quest']],
  ['Tales of', ['tales of']],
  ['Pokémon', ['pokemon', 'pokémon']],
  ['Zelda', ['zelda']],
  ['Mario', ['mario']],
  ['Sonic', ['sonic']],
  ['Street Fighter', ['street fighter']],
  ['LEGO', ['lego']],
];

const RetroBox = ({ children, style }) => (
  <div style={{ backgroundColor: PALETTE.panelBg, padding: '20px', border: `4px solid ${PALETTE.border}`, boxShadow: '6px 6px 0px #000', ...style }}>
    {children}
  </div>
);

const CustomStatsView = ({ spines = [] }) => {
  const [expandedAuthor, setExpandedAuthor] = useState(null);
  const [authorTopSpines, setAuthorTopSpines] = useState([]);

  // --- TOTALES Y RANKING DE AUTORES ---
  const stats = useMemo(() => {
    if (!spines.length) return null;
    const counts = {};
    spines.forEach(s => {
      const author = s.author ? s.author.replace('u/', '') : 'Unknown';
      counts[author] = (counts[author] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return { totalSpines: spines.length, totalAuthors: Object.keys(counts).length, topAuthors: sorted };
  }, [spines]);

  // --- DESGLOSE POR CONSOLA (lo nuevo respecto a Switch) ---
  const consoleStats = useMemo(() => {
    const counts = {};
    spines.forEach(s => {
      const list = (s.consoles && s.consoles.length) ? s.consoles : ['Other'];
      list.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [spines]);

  // --- TOP UPLOADERS (ÚLTIMOS 30 DÍAS) ---
  const topUploaders30Days = useMemo(() => {
    const now = Date.now() / 1000;
    const thirtyDays = 30 * 24 * 60 * 60;
    const counts = {};
    spines.forEach(s => {
      if (s.created_utc && (now - s.created_utc) <= thirtyDays) {
        const author = s.author ? s.author.replace('u/', '') : 'Unknown';
        counts[author] = (counts[author] || 0) + 1;
      }
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [spines]);

  // --- FRANQUICIAS ---
  const franchiseStats = useMemo(() => {
    const counts = {};
    spines.forEach(s => {
      const title = (s.title || '').toLowerCase();
      FRANCHISES.forEach(([name, keywords]) => {
        if (keywords.some(k => title.includes(k))) counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [spines]);

  const handleExpandAuthor = (author) => {
    if (expandedAuthor === author) {
      setExpandedAuthor(null);
      return;
    }
    setExpandedAuthor(author);
    setAuthorTopSpines(spines.filter(s => (s.author || '').replace('u/', '') === author).slice(0, 5));
  };

  if (!stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px' }}>
        <RetroBox style={{ textAlign: 'center', maxWidth: '520px' }}>
          <div style={{ fontSize: '36px', marginBottom: '20px' }}>📊</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: '12px', color: PALETTE.highlight, lineHeight: '1.8' }}>
            NO DATA YET
          </div>
          <p style={{ color: '#aaa', fontFamily: 'monospace', marginTop: '15px', lineHeight: '1.6' }}>
            Stats will appear as soon as the first spines from r/CustomGameSpines are archived.
          </p>
        </RetroBox>
      </div>
    );
  }

  // --- BARRA DE PROGRESO POR PASOS (QUEST LOG) ---
  const maxSpines = stats.totalSpines;
  let goalIndex = MILESTONES.findIndex(m => maxSpines < m.target);
  if (goalIndex === -1) goalIndex = MILESTONES.length - 1;
  const startIndex = Math.max(0, goalIndex - 2);
  const visibleSteps = MILESTONES.slice(startIndex, startIndex + 5);
  const maxConsoleCount = consoleStats.length ? consoleStats[0][1] : 1;

  const sectionTitle = {
    fontFamily: PIXEL_FONT,
    textAlign: 'center',
    borderBottom: `4px solid ${PALETTE.primary}`,
    paddingBottom: '15px',
    color: '#fff',
    textShadow: `3px 3px 0px ${PALETTE.primaryDark}`,
    fontSize: '1.5rem',
    letterSpacing: '2px'
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px', color: 'white', backgroundColor: PALETTE.pageBg }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          @keyframes custom-goal-pulse {
            0% { box-shadow: 0 0 5px ${PALETTE.highlight}; border-color: ${PALETTE.highlight}; }
            50% { box-shadow: 0 0 20px ${PALETTE.highlight}; border-color: #fff; }
            100% { box-shadow: 0 0 5px ${PALETTE.highlight}; border-color: ${PALETTE.highlight}; }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
          }
          @keyframes custom-bar-grow { from { width: 0; } }
          .custom-reddit-btn {
            background-color: #FF4500; color: white; font-family: ${PIXEL_FONT};
            font-size: 8px; padding: 8px 12px; border: 2px solid #fff; text-decoration: none;
            box-shadow: 3px 3px 0px #000; transition: transform 0.1s;
          }
          .custom-reddit-btn:active { transform: translate(3px, 3px); box-shadow: 0px 0px 0px #000; }
        `}
      </style>

      <div style={{ display: 'flex', gap: '50px', maxWidth: '1400px', margin: '0 auto', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ========== COLUMNA IZQUIERDA: DASHBOARD ========== */}
        <div style={{ flex: '0 0 450px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <img
              src="/logo.jpg"
              alt="The Spine Archive Logo"
              style={{ height: '140px', objectFit: 'contain', filter: `drop-shadow(0px 0px 10px ${PALETTE.primary})` }}
            />
          </div>

          <h1 style={sectionTitle}>STATS DASHBOARD</h1>

          <div style={{ display: 'flex', gap: '15px' }}>
            <RetroBox style={{ flex: 1, textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: PIXEL_FONT, marginBottom: '10px' }}>TOTAL SPINES</div>
              <div style={{ fontSize: '30px', color: PALETTE.primary, fontFamily: PIXEL_FONT }}>{stats.totalSpines}</div>
            </RetroBox>
            <RetroBox style={{ flex: 1, textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: PIXEL_FONT, marginBottom: '10px' }}>TOTAL AUTHORS</div>
              <div style={{ fontSize: '30px', color: PALETTE.highlight, fontFamily: PIXEL_FONT }}>{stats.totalAuthors}</div>
            </RetroBox>
          </div>

          {/* SPINES POR CONSOLA */}
          <RetroBox>
            <h2 style={{ fontSize: '14px', color: '#fff', fontFamily: PIXEL_FONT, marginBottom: '25px', textShadow: `2px 2px ${PALETTE.primaryDark}` }}>
              🎮 SPINES BY CONSOLE
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {consoleStats.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '90px', flexShrink: 0, fontFamily: PIXEL_FONT, fontSize: '9px', color: '#fff' }}>{name}</div>
                  <div style={{ flex: 1, height: '18px', backgroundColor: '#000', border: '2px solid #333' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(4, (count / maxConsoleCount) * 100)}%`,
                      backgroundColor: consoleColor(name),
                      backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 8px)',
                      animation: 'custom-bar-grow 0.8s steps(8)'
                    }} />
                  </div>
                  <div style={{ width: '50px', textAlign: 'right', fontFamily: PIXEL_FONT, fontSize: '10px', color: PALETTE.gold }}>{count}</div>
                </div>
              ))}
            </div>
          </RetroBox>

          {/* COMMUNITY QUEST */}
          <RetroBox style={{ position: 'relative', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '14px', color: '#fff', fontFamily: PIXEL_FONT, marginBottom: '25px', textShadow: `2px 2px ${PALETTE.primaryDark}` }}>
              COMMUNITY QUEST
            </h2>
            <div style={{ position: 'relative', paddingLeft: '30px' }}>
              <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '4px', backgroundColor: '#000', zIndex: 0 }}></div>
              {visibleSteps.map((step, index) => {
                const isReached = maxSpines >= step.target;
                const isCurrentGoal = step.target === MILESTONES[goalIndex].target;
                return (
                  <div key={index} style={{ position: 'relative', marginBottom: '25px', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      position: 'absolute', left: '-28px', width: '16px', height: '16px',
                      backgroundColor: isReached ? PALETTE.secondary : (isCurrentGoal ? PALETTE.highlight : '#000'),
                      border: isReached ? '4px solid #fff' : '4px solid #444',
                      animation: isCurrentGoal ? 'custom-goal-pulse 1.5s infinite' : 'none',
                    }}></div>
                    {isCurrentGoal && (
                      <div style={{ position: 'absolute', top: '-10px', left: '-40px', right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
                        {CONFETTI_PARTICLES.map((particle, i) => (
                          <div key={i} style={{
                            position: 'absolute', left: particle.left, width: '4px', height: '4px',
                            backgroundColor: particle.color,
                            animation: `confetti-fall ${particle.duration} infinite linear`,
                            animationDelay: particle.delay
                          }}></div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginLeft: '10px', fontFamily: PIXEL_FONT, fontSize: '10px', lineHeight: '1.5', zIndex: 2 }}>
                      <div style={{ color: isReached ? '#fff' : (isCurrentGoal ? PALETTE.highlight : '#666') }}>{step.name}</div>
                      <div style={{ color: isReached ? PALETTE.highlight : (isCurrentGoal ? '#fff' : '#444') }}>
                        {isReached ? 'CLEARED!' : (isCurrentGoal ? `CURRENT GOAL: ${step.target}` : `LOCKED: ${step.target}`)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RetroBox>

          {/* TOP 5 ÚLTIMOS 30 DÍAS */}
          <RetroBox>
            <h2 style={{ color: PALETTE.gold, marginBottom: '20px', fontFamily: PIXEL_FONT, fontSize: '12px', lineHeight: '1.5' }}>
              🔥 TOP 5 LAST UPLOADERS<br /><span style={{ fontSize: '8px', color: '#aaa' }}>(LAST 30 DAYS)</span>
            </h2>
            {topUploaders30Days.length > 0 ? (
              topUploaders30Days.map(([author, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < topUploaders30Days.length - 1 ? '2px dashed #333' : 'none', fontFamily: 'monospace', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>#{i + 1} u/{author}</span>
                  <span style={{ color: PALETTE.highlight }}>{count} SPINES</span>
                </div>
              ))
            ) : (
              <div style={{ color: '#666', fontFamily: 'monospace' }}>No new spines. Be the first!</div>
            )}
          </RetroBox>

          {/* FRANQUICIAS */}
          {franchiseStats.length > 0 && (
            <RetroBox>
              <h2 style={{ color: '#aaa', marginBottom: '20px', fontFamily: PIXEL_FONT, fontSize: '12px' }}>FRANCHISES</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {franchiseStats.map(([name, count]) => (
                  <div key={name} style={{ backgroundColor: '#000', padding: '8px 12px', border: `2px solid ${PALETTE.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{name.toUpperCase()}</span>
                    <span style={{ color: PALETTE.highlight, fontWeight: 'bold' }}>{count}</span>
                  </div>
                ))}
              </div>
            </RetroBox>
          )}
        </div>

        {/* ========== COLUMNA DERECHA: TODOS LOS CONTRIBUIDORES ========== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h1 style={{ ...sectionTitle, marginBottom: '30px' }}>ALL CONTRIBUTORS</h1>

          <div style={{ backgroundColor: PALETTE.panelBg, border: `4px solid ${PALETTE.border}`, marginBottom: '100px', maxWidth: '100%', overflow: 'hidden' }}>
            {stats.topAuthors.map(([author, count], index) => {
              const isExpanded = expandedAuthor === author;
              return (
                <div key={author} style={{ backgroundColor: index % 2 === 0 ? PALETTE.panelBg : '#0f141a', borderBottom: '2px solid #222' }}>
                  <div
                    onClick={() => handleExpandAuthor(author)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', cursor: 'pointer', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2a37'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '18px', fontFamily: 'monospace', color: index < 3 ? PALETTE.highlight : 'white' }}>u/{author}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px', color: isExpanded ? PALETTE.highlight : 'white' }}>
                        {count} SPINES {isExpanded ? '▲' : '▼'}
                      </div>
                      <a
                        href={`https://www.reddit.com/user/${author}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="custom-reddit-btn"
                      >
                        REDDIT ↗
                      </a>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '40px 20px', backgroundColor: '#05080c', borderTop: '2px dashed #333', display: 'flex', gap: '40px', overflowX: 'auto', width: '100%', boxSizing: 'border-box', alignItems: 'center' }}>
                      {authorTopSpines.map((spine, i) => (
                        <div key={i} style={{ flexShrink: 0, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '220px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '25px' }}>
                            <img
                              src={spine.image || spine.src}
                              alt={spine.title}
                              loading="lazy"
                              style={{ height: '220px', transform: 'rotate(-90deg)', transformOrigin: 'center', border: '2px solid #fff', boxShadow: '4px 4px 0px #000' }}
                            />
                          </div>
                          <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', marginTop: '10px' }}>
                            {spine.title} {spine.consoles?.length ? `· ${spine.consoles.join('/')}` : ''}
                          </div>
                        </div>
                      ))}
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

export default CustomStatsView;
