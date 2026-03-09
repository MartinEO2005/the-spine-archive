import React, { useState, useMemo } from 'react';
import { FUN_FACTS } from './data/funFactsData';

// Componente para las cajas negras con borde blanco (Estilo RPG clásico)
const RPGBox = ({ children, style }) => (
  <div style={{
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Un poco translúcido para que se intuya el fondo
    border: '4px solid #fff',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.7)', 
    padding: '25px',
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

  // Lógica del Fun Fact
  const dailyFact = useMemo(() => {
    if (!FUN_FACTS || FUN_FACTS.length === 0) {
      return { 
        name: "Loading...", 
        fact: "Cargando datos de la base de datos...", 
        cover: "https://via.placeholder.com/300x450?text=Cargando" 
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
    transition: '0.2s',
    fontWeight: activeSection === id ? 'bold' : 'normal',
    textShadow: activeSection === id ? '2px 2px 0px #000' : 'none'
  });

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      // FONDO RPG: El linear-gradient oscurece la imagen un 85% para que los textos sean legibles.
      // Recuerda poner una imagen llamada "fondo_rpg.jpg" en tu carpeta public/
      backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.85), rgba(10, 10, 10, 0.95)), url('/fondo_rpg.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: 'white', 
      padding: '40px', 
      fontFamily: '"Courier New", Courier, monospace' 
    }}>
      
      {/* --- MENÚ IZQUIERDO --- */}
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

      {/* --- CONTENIDO CENTRAL --- */}
      <div style={{ flex: 1, maxWidth: '800px' }}>
        
        {/* Título mejorado: Más limpio, sin bordes raros, sombra estilo 16-bits */}
        <h1 style={{ 
          fontSize: '3.8rem', 
          margin: '0 0 10px 0', 
          color: '#ffffff',
          textShadow: '3px 3px 0px #000, 6px 6px 0px rgba(0,0,0,0.5)',
          letterSpacing: '2px'
        }}>
          THE SPINE ARCHIVE
        </h1>
        <p style={{ color: '#ff4444', fontWeight: 'bold', marginBottom: '40px', letterSpacing: '3px', textShadow: '2px 2px 0px #000' }}>
          PRESERVATION PROJECT
        </p>

        {/* SECCIÓN: ABOUT */}
        {activeSection === 'about' && (
          <>
            <RPGBox>
              <p style={{ lineHeight: '1.8', margin: 0, textAlign: 'justify', fontSize: '1.05rem' }}>
                Welcome to <b>The Spine Archive</b>. I am creating this project dedicated to preserving, cataloging, and showcasing the incredible work of the <b>r/SwitchSpines</b> community. My mission is to create a seamless, searchable database that allows collectors to unify their shelves with high-quality custom artwork. Every spine in this archive is a testament to the creativity and passion of the fans who dedicate their time to making our physical collections look better than ever.
              </p>
            </RPGBox>
            
            <RPGBox>
              <h2 style={{ marginTop: 0, fontSize: '1.4rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '20px' }}>Contribution & Contact</h2>
              <p style={{ fontSize: '1rem', color: '#ccc', lineHeight: '1.7', textAlign: 'justify', marginBottom: '20px' }}>
                This database is a living project, constantly growing with new releases and community submissions. If you are an artist wishing to add your portfolio, or if you don't find a specific franchise or creator that you know is already on the r/SwitchSpines subreddit, please send me a private message. Your feedback and contributions help keep this archive complete and up to date for everyone.
              </p>
              <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', marginBottom: '25px' }}>
                Please contact me if image quality is a big issue or if a spine size is incorrect.
              </p>
              <a href="#" style={{ 
                display: 'inline-block', color: '#fff', backgroundColor: '#b30000', 
                padding: '12px 20px', textDecoration: 'none', fontWeight: 'bold', border: '2px solid #fff',
                boxShadow: '3px 3px 0px #000'
              }}>
                SEND ME A PRIVATE MESSAGE
              </a>
            </RPGBox>
          </>
        )}

        {/* SECCIÓN: HOW TO USE (System Manual) */}
        {activeSection === 'how-to' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '20px' }}>SYSTEM MANUAL</h2>
            
            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>1. Selecting Spines</h3>
            <p style={{ lineHeight: '1.7', margin: '0 0 20px 0', color: '#ddd' }}>
              Browse the catalog and click on any spine to add it to your selection. The total count will update in the top bar. You can use the search bar to find specific games, franchises, or even search for your favorite creator's username.
            </p>

            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>2. Paper Sizes & Printing</h3>
            <p style={{ lineHeight: '1.7', margin: '0 0 20px 0', color: '#ddd' }}>
              When you generate the PDF, you will be prompted to select a paper size.<br/><br/>
              • <b>Letter Size (Recommended):</b> This is the default and highly recommended setting for standard home printing. It ensures the dimensions of the spines match standard Nintendo Switch cases perfectly.<br/><br/>
              • <b>A4 / Legal / Other:</b> These formats are provided as alternatives, particularly useful if you are taking the PDF to a professional print shop or using specific photographic paper sizes. Always verify dimensions before printing a large batch.
            </p>

            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>3. Cutting</h3>
            <p style={{ lineHeight: '1.7', margin: 0, color: '#ddd' }}>
              For the best results, use a paper trimmer or an X-ACTO knife with a metal ruler. The generated PDF includes subtle guidelines to help you make clean, precise cuts.
            </p>
          </RPGBox>
        )}

        {/* SECCIÓN: ADVICE (Pro Tips) */}
        {activeSection === 'advice' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '20px' }}>PRO TIPS</h2>
            
            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>Maintain a Consistent Shelf</h3>
            <p style={{ lineHeight: '1.7', margin: '0 0 15px 0', color: '#ddd' }}>
              If you discover a spine design you really like, we highly recommend checking out other works by the same author. Many creators on r/SwitchSpines design their covers following a specific template or visual style.
            </p>
            <p style={{ lineHeight: '1.7', margin: '0 0 20px 0', color: '#ddd' }}>
              By using spines from a single creator (or creators with similar styles) for a specific franchise, you ensure your physical collection looks unified and professional on the shelf.
            </p>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '15px', borderLeft: '4px solid #ffcc00' }}>
              <p style={{ fontSize: '0.95rem', color: '#fff', fontStyle: 'italic', margin: 0 }}>
                Example: Consistent series formatting by u/DieNoMight9
              </p>
            </div>
          </RPGBox>
        )}
      </div>

      {/* --- SIDEBAR DERECHO: EL FUN FACT --- */}
      {/* Ensanchado a 450px */}
      <div style={{ width: '450px', marginLeft: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ 
          border: '4px solid #fff', 
          marginBottom: '20px', 
          backgroundColor: '#000',
          width: '300px', // Forzamos la imagen a 300px para que no se vea gigante
          minHeight: '430px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '6px 6px 0px rgba(0,0,0,0.7)'
        }}>
          <img 
            src={dailyFact.cover ? dailyFact.cover : "https://via.placeholder.com/300x450?text=No+Image"} 
            alt={dailyFact.name || "Game Art"} 
            style={{ width: '100%', height: 'auto', display: 'block', filter: 'contrast(1.1)' }} 
            onError={(e) => e.target.src = "https://via.placeholder.com/300x450?text=Error+Loading+Image"}
          />
        </div>
        
        {/* La caja de texto ahora ocupa el 100% de los 450px */}
        <RPGBox style={{ width: '100%', minHeight: '180px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffcc00', marginBottom: '10px', borderBottom: '1px solid #555', paddingBottom: '8px' }}>
            {dailyFact.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '12px', letterSpacing: '1px' }}>— DID YOU KNOW? —</div>
          <p style={{ fontSize: '1rem', margin: 0, lineHeight: '1.6', textAlign: 'justify', color: '#eee' }}>
            {dailyFact.fact}
          </p>
          <div style={{ textAlign: 'right', marginTop: '15px', animation: 'blink 1s step-end infinite', color: '#fff', fontSize: '1.2rem' }}>▼</div>
        </RPGBox>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default AboutView;