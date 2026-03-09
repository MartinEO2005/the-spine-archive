import React, { useState, useMemo } from 'react';
import { FUN_FACTS } from './data/funFactsData';

const RPGBox = ({ children, style }) => (
  <div style={{
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    border: '4px solid #fff',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.7)', 
    padding: '25px',
    marginBottom: '20px',
    color: '#fff',
    ...style
  }}>
    {children}
  </div>
);

const AboutView = () => {
  const [activeSection, setActiveSection] = useState('about');

  const dailyFact = useMemo(() => {
    if (!FUN_FACTS || FUN_FACTS.length === 0) {
      return { 
        name: "Super Metroid", 
        fact: "The Japanese box art is a cinematic masterpiece...", 
        cover: "/covers/super_metroid1.webp" 
      };
    }
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return FUN_FACTS[dayOfYear % FUN_FACTS.length];
  }, []);

  const menuStyle = (id) => ({
    cursor: 'pointer',
    padding: '12px 10px',
    fontSize: '20px',
    color: activeSection === id ? '#fff' : '#888',
    display: 'flex',
    alignItems: 'center',
    fontWeight: activeSection === id ? 'bold' : 'normal',
    textShadow: activeSection === id ? '2px 2px 0px #000' : 'none'
  });

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      // Fondo RPG difuminado (Asegúrate de tener fondo_rpg.jpg en public/)
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('/fondo_rpg.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: 'white', 
      padding: '40px', 
      fontFamily: '"Courier New", Courier, monospace' 
    }}>
      
      {/* SECCIÓN IZQUIERDA: MENÚ */}
      <div style={{ width: '250px', marginRight: '40px' }}>
        <RPGBox>
          <div style={menuStyle('about')} onClick={() => setActiveSection('about')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'about' ? 'visible' : 'hidden', color: '#ff3333' }}>▶</span> ABOUT
          </div>
          <div style={menuStyle('how-to')} onClick={() => setActiveSection('how-to')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'how-to' ? 'visible' : 'hidden', color: '#ff3333' }}>▶</span> HOW TO USE
          </div>
          <div style={menuStyle('advice')} onClick={() => setActiveSection('advice')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'advice' ? 'visible' : 'hidden', color: '#ff3333' }}>▶</span> ADVICE
          </div>
        </RPGBox>
      </div>

      {/* SECCIÓN CENTRAL: CONTENIDO */}
      <div style={{ flex: 1, maxWidth: '800px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          margin: '0 0 5px 0', 
          color: '#fff',
          textShadow: '4px 4px 0px #000'
        }}>
          THE SPINE ARCHIVE
        </h1>
        <p style={{ color: '#ff4444', fontWeight: 'bold', marginBottom: '40px', letterSpacing: '2px' }}>PRESERVATION PROJECT</p>

        {activeSection === 'about' && (
          <>
            <RPGBox>
              <p style={{ lineHeight: '1.8', margin: 0, textAlign: 'justify' }}>
                Welcome to <b>The Spine Archive</b>. I am creating this project dedicated to preserving, cataloging, and showcasing the incredible work of the <b>r/SwitchSpines</b> community.
              </p>
            </RPGBox>
            <RPGBox>
              <h2 style={{ marginTop: 0, borderBottom: '2px solid #fff', paddingBottom: '10px' }}>Contribution & Contact</h2>
              <p style={{ color: '#ccc', lineHeight: '1.7' }}>
                If you are an artist wishing to add your portfolio, please send me a private message.
              </p>
              <button style={{ backgroundColor: '#b30000', color: '#fff', padding: '10px 20px', border: '2px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>
                SEND ME A PRIVATE MESSAGE
              </button>
            </RPGBox>
          </>
        )}

        {activeSection === 'how-to' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, borderBottom: '2px solid #fff', paddingBottom: '10px' }}>SYSTEM MANUAL</h2>
            <h3 style={{ color: '#ffcc00', marginBottom: '5px' }}>1. Selecting Spines</h3>
            <p style={{ marginTop: 0 }}>Browse the catalog and click on any spine to add it to your selection. The total count will update in the top bar.</p>
            
            <h3 style={{ color: '#ffcc00', marginBottom: '5px' }}>2. Paper Sizes & Printing</h3>
            <p style={{ marginTop: 0 }}>
              • <b>Letter Size (Recommended):</b> Default setting for standard home printing.<br/>
              • <b>A4 / Legal / Other:</b> For professional shops. Always verify dimensions.
            </p>
            
            <h3 style={{ color: '#ffcc00', marginBottom: '5px' }}>3. Cutting</h3>
            <p style={{ marginTop: 0 }}>Use a paper trimmer or an X-ACTO knife with a metal ruler for best results.</p>
          </RPGBox>
        )}

        {activeSection === 'advice' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, borderBottom: '2px solid #fff', paddingBottom: '10px' }}>PRO TIPS</h2>
            <h3 style={{ color: '#ffcc00' }}>Maintain a Consistent Shelf</h3>
            <p>Using spines from a single creator ensures your physical collection looks unified and professional on the shelf.</p>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '10px' }}>Example: Consistent series formatting by u/DieNoMight9</p>
              <img 
                src="/ejemplo-estilo-dnn.png" 
                alt="Example Spines" 
                style={{ width: '100%', border: '2px solid #fff', boxShadow: '4px 4px 0px #000' }} 
              />
            </div>
          </RPGBox>
        )}
      </div>

      {/* SECCIÓN DERECHA: FUN FACT (Estirada) */}
      <div style={{ width: '450px', marginLeft: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ border: '4px solid #fff', marginBottom: '20px', backgroundColor: '#000', width: '300px' }}>
          <img 
            src={dailyFact.cover} 
            alt={dailyFact.name} 
            style={{ width: '100%', display: 'block' }} 
            onError={(e) => e.target.src = "https://via.placeholder.com/300x450?text=Metroid+Cover"}
          />
        </div>
        <RPGBox style={{ width: '100%', minHeight: '200px' }}>
          <div style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '10px' }}>{dailyFact.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>— DID YOU KNOW? —</div>
          <p style={{ fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>{dailyFact.fact}</p>
          <div style={{ textAlign: 'right', marginTop: '15px', animation: 'blink 1s step-end infinite' }}>▼</div>
        </RPGBox>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
};

export default AboutView;