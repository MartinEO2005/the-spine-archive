import React, { useState, useMemo } from 'react';
import { FUN_FACTS } from '../data/funFactsData';

// Componente para las cajas negras con borde blanco (Estilo Earthbound)
const RPGBox = ({ children, style }) => (
  <div style={{
    backgroundColor: '#000',
    border: '4px solid #fff',
    boxShadow: '6px 6px 0px #000', // Sombra sólida para profundidad
    padding: '20px',
    marginBottom: '20px',
    color: '#fff',
    position: 'relative',
    ...style
  }}>
    {children}
  </div>
);

const AboutView = () => {
  const [activeSection, setActiveSection] = useState('about');

  // Lógica para que el Fun Fact cambie cada día según tu JSON
  const dailyFact = useMemo(() => {
    if (!FUN_FACTS || FUN_FACTS.length === 0) return { name: "Loading...", fact: "No data found.", cover: "" };
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return FUN_FACTS[dayOfYear % FUN_FACTS.length];
  }, []);

  const menuStyle = (id) => ({
    cursor: 'pointer',
    padding: '10px',
    fontSize: '20px',
    color: activeSection === id ? '#fff' : '#666',
    display: 'flex',
    alignItems: 'center',
    transition: '0.2s'
  });

  return (
    <div style={{ 
      display: 'flex', minHeight: '100vh', backgroundColor: '#1a1a1a', // Fondo gris oscuro para resaltar los cuadros negros
      color: 'white', padding: '40px', fontFamily: '"Courier New", Courier, monospace' 
    }}>
      
      {/* --- MENÚ IZQUIERDO --- */}
      <div style={{ width: '250px', marginRight: '40px' }}>
        <RPGBox>
          <div style={menuStyle('about')} onClick={() => setActiveSection('about')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'about' ? 'visible' : 'hidden' }}>▶</span> ABOUT
          </div>
          <div style={menuStyle('how-to')} onClick={() => setActiveSection('how-to')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'how-to' ? 'visible' : 'hidden' }}>▶</span> HOW TO
          </div>
          <div style={menuStyle('advice')} onClick={() => setActiveSection('advice')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'advice' ? 'visible' : 'hidden' }}>▶</span> ADVICE
          </div>
        </RPGBox>
      </div>

      {/* --- CONTENIDO CENTRAL --- */}
      <div style={{ flex: 1, maxWidth: '700px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', margin: '0 0 10px 0', color: '#fff',
          textShadow: '4px 4px 0px #000', // Sombra negra limpia, sin rojo
          WebkitTextStroke: '1px #fff' 
        }}>
          THE SPINE ARCHIVE
        </h1>
        <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '30px', letterSpacing: '2px' }}>PRESERVATION PROJECT</p>

        {activeSection === 'about' && (
          <>
            <RPGBox>
              <p style={{ lineHeight: '1.6', margin: 0 }}>
                Welcome to <b>The Spine Archive</b>. This project is dedicated to cataloging the work of the <b>r/SwitchSpines</b> community.
              </p>
            </RPGBox>
            
            <RPGBox>
              <h2 style={{ marginTop: 0, fontSize: '1.2rem', borderBottom: '2px solid #fff', paddingBottom: '5px' }}>CONTRIBUTION</h2>
              <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
                If you are an artist or a collector, feel free to reach out to add your work to the database.
              </p>
              <a href="#" style={{ color: '#000', backgroundColor: '#fff', padding: '5px 10px', textDecoration: 'none', fontWeight: 'bold' }}>
                SEND MESSAGE
              </a>
            </RPGBox>
          </>
        )}

        {/* ... Otras secciones con la misma estructura de RPGBox ... */}
      </div>

      {/* --- SIDEBAR DERECHO: EL FUN FACT --- */}
      <div style={{ width: '300px', marginLeft: '40px' }}>
        <div style={{ border: '4px solid #fff', marginBottom: '15px', backgroundColor: '#000' }}>
          <img 
            src={dailyFact.cover} 
            alt="Game Art" 
            style={{ width: '100%', display: 'block', filter: 'contrast(1.1)' }} 
            onError={(e) => e.target.src = "https://via.placeholder.com/300x450?text=No+Cover"}
          />
        </div>
        
        <RPGBox style={{ minHeight: '150px' }}>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>— DID YOU KNOW? —</div>
          <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.4' }}>
            {dailyFact.fact}
          </p>
          <div style={{ textAlign: 'right', marginTop: '10px', animation: 'blink 1s step-end infinite' }}>▼</div>
        </RPGBox>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default AboutView;