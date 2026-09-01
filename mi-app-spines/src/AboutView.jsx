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
  const [zoomedImage, setZoomedImage] = useState(null); // Estado para el modal de la imagen

  const dailyFact = useMemo(() => {
    if (!FUN_FACTS || FUN_FACTS.length === 0) {
      return { 
        name: "Loading...", 
        fact: "Cargando datos de la base de datos...", 
        cover: "https://via.placeholder.com/300x450?text=Cargando" 
      };
    }
    return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
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

  // Mini-componente para las tarjetas de imágenes (más limpio y fácil de añadir nuevas)
  const ExampleCard = ({ title, src }) => (
    <div 
      onClick={() => setZoomedImage(src)}
      style={{ 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        padding: '15px', 
        border: '2px solid #444',
        textAlign: 'center',
        flex: '1',
        minWidth: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'zoom-in', // Cambia el cursor para indicar que es clickeable
        transition: 'border-color 0.2s, transform 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.transform = 'scale(1.02)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '15px', width: '100%' }}>
        {title}
      </p>
      <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={src} 
          alt={title} 
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '2px solid #fff' }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* --- OVERLAY DE ZOOM DE IMAGEN --- */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={zoomedImage} 
            alt="Zoomed preview" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90vh', 
              border: '4px solid #fff', 
              boxShadow: '0px 0px 20px #000',
              objectFit: 'contain' 
            }} 
          />
          <div style={{ position: 'absolute', top: '20px', right: '40px', color: '#fff', fontFamily: '"Press Start 2P"', fontSize: '24px' }}>
            X
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('/fondo_rpg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: 'white', 
        padding: '40px', 
        fontFamily: '"Courier New", Courier, monospace' 
      }}>
        
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          `}
        </style>

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
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '3.5rem', margin: '0 0 10px 0', color: '#fff',
            textShadow: '4px 4px 0px #000',
            WebkitTextStroke: '1px #fff' 
          }}>
            THE SPINE ARCHIVE
          </h1>
          <p style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '30px', letterSpacing: '2px' }}>
            PRESERVATION PROJECT
          </p>

          {/* SECCIÓN ABOUT */}
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
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <a href="https://www.reddit.com/user/Certain-Issue5855/" target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#cc0000', color: '#fff', padding: '10px 15px', fontWeight: 'bold', border: '2px solid #fff', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                    SEND ME A Private Message
                  </a>
                  <a href="https://ko-fi.com/martineo" target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#29abe0', color: '#fff', padding: '10px 15px', fontWeight: 'bold', border: '2px solid #fff', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                    ☕ Support me on Ko-fi
                  </a>
                </div>
              </RPGBox>
            </>
          )}

          {/* SECCIÓN HOW TO USE */}
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

          {/* SECCIÓN ADVICE */}
          {activeSection === 'advice' && (
            <RPGBox>
              <h2 style={{ marginTop: 0, fontSize: '1.5rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '20px' }}>PRO TIPS</h2>
              <h3 style={{ fontSize: '1.1rem', color: '#ffcc00', marginBottom: '10px' }}>Maintain a Consistent Shelf</h3>
              <p style={{ lineHeight: '1.7', color: '#ddd', marginBottom: '20px' }}>
                There is an <b>incredible variety of unique styles</b> to choose from! Using spines from a single style/creator ensures your physical collection looks unified and professional. Many of our beloved creators follow specific templates for their series or depending on the franchise. <span style={{color: '#ffcc00', fontWeight: 'bold'}}>Make sure to explore all the amazing creators before making your final selection to find the perfect aesthetic!</span>
              </p>
              
              {/* Contenedor Flex para imágenes. Ahora usa el subcomponente ExampleCard */}
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
                
                <ExampleCard 
                  title="Example 1: Consistent series formatting" 
                  src="/ejemplo-estilo-dnn.png" 
                />
                
                <ExampleCard 
                  title="Example 2: A different creator's aesthetic" 
                  src="/ejemplo-estilo-2.png" 
                />
                
                <ExampleCard 
                  title="Example 3: Yet another creative style" 
                  src="/ejemplo-estilo-3.png" 
                />

              </div>
              <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.8rem', marginTop: '15px' }}>(Click on any image to enlarge)</p>
            </RPGBox>
          )}
        </div>

        {/* --- SIDEBAR DERECHO: FUN FACT --- */}
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

      </div>
    </>
  );
};

export default AboutView;