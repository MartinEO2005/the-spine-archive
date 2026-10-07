import React from 'react';

const CONFETTI_PARTICLES = Array.from({ length: 30 }).map(() => ({
  left: `${Math.random() * 100}%`,
  color: ['#ffcc00', '#b30000', '#00ff00', '#00ffff'][Math.floor(Math.random() * 4)],
  duration: `${1 + Math.random() * 1.5}s`,
  delay: `${Math.random() * 2}s`
}));

const UpdateModal = ({ showUpdateModal, setShowUpdateModal, scrapeInfo }) => {
  if (!showUpdateModal) return null;

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999, 
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: '"Press Start 2P", monospace'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {CONFETTI_PARTICLES.map((particle, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '-10px',
            left: particle.left,
            width: '6px', height: '6px',
            backgroundColor: particle.color,
            animation: `confetti-fall ${particle.duration} infinite linear`,
            animationDelay: particle.delay
          }}></div>
        ))}
      </div>

      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '40px', 
        width: '750px', 
        textAlign: 'center', 
        border: '4px solid #b30000', 
        animation: 'pulse-border 2s infinite',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <img 
            src="/Imagen_fuego.jpg" 
            alt="Bowser Fire" 
            style={{ 
              width: '380px', 
              height: 'auto', 
              display: 'block',
              filter: 'drop-shadow(0px 0px 15px rgba(255, 100, 0, 0.4))'
            }} 
          />
        </div>
        <h2 style={{ 
          color: '#fff', 
          fontSize: '22px', 
          marginBottom: '25px', 
          borderBottom: '4px solid #b30000',
          paddingBottom: '20px',
          textShadow: '4px 4px 0px #b30000',
          letterSpacing: '2px'
        }}>
          LATEST SCRAPE
        </h2>
        <div style={{ backgroundColor: '#111', padding: '30px', border: '4px solid #333', marginBottom: '35px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '14px', marginBottom: '15px', lineHeight: '1.8' }}>
            <span style={{ color: '#ffcc00', fontSize: '24px', textShadow: '2px 2px #000' }}>{scrapeInfo.count}</span><br/> 
            NEW SPINES DETECTED!
          </div>
          <div style={{ color: '#888', fontSize: '9px', marginBottom: '25px', fontFamily: 'monospace' }}>
            [ SYSTEM DATE: {scrapeInfo.date} ]
          </div>
          <div style={{ borderTop: '2px dashed #444', paddingTop: '20px' }}>
            <p style={{ color: '#ffcc00', fontSize: '10px', margin: '0 0 15px 0' }}>
              ★ TOP CONTRIBUTORS ★
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
              {scrapeInfo.authors?.map((author, idx) => (
                <span key={idx} style={{
                  backgroundColor: '#222',
                  color: '#ff4d4d',
                  padding: '8px 12px',
                  border: '2px solid #555',
                  fontSize: '9px',
                  boxShadow: '2px 2px 0px #000'
                }}>
                  {author}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowUpdateModal(false)} 
          style={{ 
            background: '#b30000', 
            color: 'white', 
            border: '4px solid #fff', 
            cursor: 'pointer', 
            padding: '15px 40px', 
            fontWeight: 'bold', 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '14px', 
            boxShadow: '6px 6px 0px #000',
            transition: 'transform 0.1s',
            letterSpacing: '1px'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          AWESOME!
        </button>
      </div>
    </div>
  );
};

export default UpdateModal;