import React, { useState, useMemo } from 'react';
import { FUN_FACTS } from './data/funFactsData';

// Componente para las cajas negras con borde blanco (Estilo RPG)
const RPGBox = ({ children, style }) => (
  <div style={{
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    border: '4px solid #fff',
    boxShadow: '6px 6px 0px #000',
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
    color: activeSection === id ? '#fff' : '#666',
    display: 'flex',
    alignItems: 'center',
    transition: '0.2s',
    fontWeight: activeSection === id ? 'bold' : 'normal'
  });

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      // FONDO CON IMAGEN DIFUMINADA Y OSCURECIDA
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('/fondo_rpg.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: 'white', 
      padding: '40px', 
      fontFamily: '"Courier New", Courier, monospace' 
    }}>
      
      {/* 1. MENÚ (IZQUIERDA) */}
      <div style={{ width: '250px', marginRight: '40px' }}>
        <RPGBox>
          <div style={menuStyle('about')} onClick={() => setActiveSection('about')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'about' ? 'visible' : 'hidden', color: '#ff0000' }}>▶</span> ABOUT
          </div>
          <div style={menuStyle('how-to')} onClick={() => setActiveSection('how-to')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'how-to' ? 'visible' : 'hidden', color: '#ff0000' }}>▶</span> HOW TO USE
          </div>
          <div style={menuStyle('advice')} onClick={() => setActiveSection('advice')}>
            <span style={{ marginRight: '10px', visibility: activeSection === 'advice' ? 'visible' : 'hidden', color: '#ff0000' }}>▶</span> ADVICE
          </div>
        </RPGBox>
      </div>

      {/* --- CONTENIDO CENTRAL --- */}
      <div style={{ flex: 1, maxWidth: '800px' }}>
        <h1 style={{ 
          fontSize: '3.5rem', margin: '0 0 10px 0', color: '#fff',
          textShadow: '4px 4px 0px #000',
          WebkitTextStroke: '1px #fff' 
        }}>
          THE SPINE ARCHIVE
        </h1>
        <p style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '30px', letterSpacing: '2px' }}>
          PRESERVATION PROJECT
        </p>

        {/* SECCIÓN ABOUT (TEXTO COMPLETO) */}
        {activeSection === 'about' && (
          <>
            <RPGBox>
              <p style={{ lineHeight: '1.8', margin: 0, textAlign: 'justify' }}>
                Welcome to <b>The Spine Archive</b>. I am creating this project dedicated to preserving, cataloging, and showcasing the incredible work of the <b>r/SwitchSpines</b> community. My mission is to create a seamless, searchable database that allows collectors to unify their shelves with high-quality custom artwork. Every spine in this archive is a testament to the creativity and passion of the fans who dedicate their time to making our physical collections look better than ever.
              </p>
            </RPGBox>
            <RPGBox>
              <h2 style={{ marginTop: 0, fontSize: '1.4rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '15px' }}>Contribution & Contact</h2>
              <p style={{ fontSize: '0.95rem', color: '#ccc', lineHeight: '1.6', textAlign: 'justify', marginBottom: '20px' }}>
                This database is a living project, constantly growing with new releases and community submissions. If you are an artist wishing to add your portfolio, or if you don't find a specific franchise or creator that you know is already on the r/SwitchSpines subreddit, please send me a private message. Your feedback and contributions help keep this archive complete and up to date for everyone.
              </p>
              <p style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 'bold', marginBottom: '20px' }}>
                Please contact me if image quality is a big issue or if a spine size is incorrect.
              </p>
              <button style={{ 
                backgroundColor: '#cc0000', color: '#fff', padding: '10px 15px', 
                fontWeight: 'bold', border: '2px solid #fff', cursor: 'pointer'
              }}>
                SEND ME A PRIVATE MESSAGE
              </button>
            </RPGBox>
          </>
        )}

        {/* SECCIÓN HOW TO USE (SYSTEM MANUAL) */}
        {activeSection === 'how-to' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '20px' }}>SYSTEM MANUAL</h2>
            
            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>1. Selecting Spines</h3>
            <p style={{ lineHeight: '1.7', marginBottom: '20px', color: '#ddd' }}>
              Browse the catalog and click on any spine to add it to your selection. The total count will update in the top bar. You can use the search bar to find specific games, franchises, or even search for your favorite creator's username.
            </p>

            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>2. Paper Sizes & Printing</h3>
            <p style={{ lineHeight: '1.7', marginBottom: '20px', color: '#ddd' }}>
              • <b>Letter Size (Recommended):</b> Default setting for standard home printing. It ensures the dimensions match standard Nintendo Switch cases perfectly.<br/>
              • <b>A4 / Legal / Other:</b> Use these for professional print shops. Always verify dimensions before printing large batches.
            </p>

            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>3. Cutting</h3>
            <p style={{ lineHeight: '1.7', margin: 0, color: '#ddd' }}>
              For best results, use a paper trimmer or an X-ACTO knife with a metal ruler. The generated PDF includes subtle guidelines to help you make precise cuts.
            </p>
          </RPGBox>
        )}

        {/* SECCIÓN ADVICE (PRO TIPS + IMAGEN) */}
        {activeSection === 'advice' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, fontSize: '1.5rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '20px' }}>PRO TIPS</h2>
            <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>Maintain a Consistent Shelf</h3>
            <p style={{ lineHeight: '1.7', color: '#ddd', marginBottom: '20px' }}>
              Using spines from a single creator ensures your physical collection looks unified and professional. Many creators follow specific templates for their series.
            </p>
            
            {/* Cuadrante para la imagen estilo-dnn */}
            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              padding: '15px', 
              border: '2px solid #444',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '15px' }}>
                Example: Consistent series formatting by u/DieNoMight9
              </p>
              <img 
                src="/ejemplo-estilo-dnn.png" 
                alt="Example Spines Style" 
                style={{ maxWidth: '100%', height: 'auto', border: '2px solid #fff' }}
              />
            </div>
          </RPGBox>
        )}
      </div>

      {/* --- SIDEBAR DERECHO: FUN FACT Y METROID (LOGICA ORIGINAL) --- */}
      <div style={{ width: '300px', marginLeft: '40px' }}>
        <div style={{ 
          border: '4px solid #fff', marginBottom: '15px', backgroundColor: '#000',
          minHeight: '430px', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img 
            src={dailyFact.cover ? dailyFact.cover : "https://via.placeholder.com/300x450?text=No+Image"} 
            alt={dailyFact.name || "Game Art"} 
            style={{ width: '100%', height: 'auto', display: 'block', filter: 'contrast(1.1)' }} 
            onError={(e) => e.target.src = "https://via.placeholder.com/300x450?text=Error+Loading+Image"}
          />
        </div>
        
        <RPGBox style={{ minHeight: '180px' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
            {dailyFact.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>— DID YOU KNOW? —</div>
          <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.5', textAlign: 'justify' }}>
            {dailyFact.fact}
          </p>
          <div style={{ textAlign: 'right', marginTop: '10px', animation: 'blink 1s step-end infinite', color: '#fff' }}>▼</div>
        </RPGBox>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
};

export default AboutView;