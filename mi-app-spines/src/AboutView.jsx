import React, { useState, useMemo } from 'react';
import { FUN_FACTS } from './data/funFactsData';

const RPGBox = ({ children, style }) => (
  <div style={{
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    border: '4px solid #fff',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.7)', 
    padding: '30px',
    marginBottom: '25px',
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
        fact: "The Japanese box art for Super Metroid is a cinematic masterpiece...", 
        cover: "/covers/super_metroid1.webp" 
      };
    }
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return FUN_FACTS[dayOfYear % FUN_FACTS.length];
  }, []);

  const menuStyle = (id) => ({
    cursor: 'pointer',
    padding: '15px 10px',
    fontSize: '22px',
    color: activeSection === id ? '#fff' : '#666',
    display: 'flex',
    alignItems: 'center',
    fontWeight: activeSection === id ? 'bold' : 'normal',
    textShadow: activeSection === id ? '2px 2px 0px #000' : 'none',
    transition: 'all 0.2s ease'
  });

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.85)), url('/fondo_rpg.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: 'white', 
      padding: '50px', 
      fontFamily: '"Courier New", Courier, monospace' 
    }}>
      
      {/* SIDEBAR IZQUIERDO: NAVEGACIÓN */}
      <div style={{ width: '280px', marginRight: '50px' }}>
        <RPGBox style={{ padding: '15px' }}>
          <div style={menuStyle('about')} onClick={() => setActiveSection('about')}>
            <span style={{ marginRight: '15px', visibility: activeSection === 'about' ? 'visible' : 'hidden', color: '#ff3333' }}>▶</span> ABOUT
          </div>
          <div style={menuStyle('how-to')} onClick={() => setActiveSection('how-to')}>
            <span style={{ marginRight: '15px', visibility: activeSection === 'how-to' ? 'visible' : 'hidden', color: '#ff3333' }}>▶</span> HOW TO USE
          </div>
          <div style={menuStyle('advice')} onClick={() => setActiveSection('advice')}>
            <span style={{ marginRight: '15px', visibility: activeSection === 'advice' ? 'visible' : 'hidden', color: '#ff3333' }}>▶</span> ADVICE
          </div>
        </RPGBox>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, maxWidth: '900px' }}>
        <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0', color: '#fff', textShadow: '4px 4px 0px #000', letterSpacing: '1px' }}>
          THE SPINE ARCHIVE
        </h1>
        <p style={{ color: '#ff4444', fontWeight: 'bold', marginBottom: '50px', letterSpacing: '4px', fontSize: '1.1rem' }}>PRESERVATION PROJECT</p>

        {/* CONTENIDO: ABOUT */}
        {activeSection === 'about' && (
          <>
            <RPGBox>
              <p style={{ lineHeight: '1.8', margin: 0, textAlign: 'justify', fontSize: '1.1rem' }}>
                Welcome to <b>The Spine Archive</b>. I am creating this project dedicated to preserving, cataloging, and showcasing the incredible work of the <b>r/SwitchSpines</b> community. My mission is to create a seamless, searchable database that allows collectors to unify their shelves with high-quality custom artwork. Every spine in this archive is a testament to the creativity and passion of the fans who dedicate their time to making our physical collections look better than ever.
              </p>
            </RPGBox>
            <RPGBox>
              <h2 style={{ marginTop: 0, fontSize: '1.6rem', borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '20px' }}>Contribution & Contact</h2>
              <p style={{ color: '#ddd', lineHeight: '1.8', fontSize: '1rem', marginBottom: '20px' }}>
                This database is a living project, constantly growing with new releases and community submissions. If you are an artist wishing to add your portfolio, or if you don't find a specific franchise or creator that you know is already on the r/SwitchSpines subreddit, please send me a private message. Your feedback and contributions help keep this archive complete and up to date for everyone.
              </p>
              <p style={{ fontWeight: 'bold', marginBottom: '25px', color: '#fff' }}>Please contact me if image quality is a big issue or if a spine size is incorrect.</p>
              <button style={{ backgroundColor: '#b30000', color: '#fff', padding: '15px 30px', border: '3px solid #fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '4px 4px 0px #000' }}>
                SEND ME A PRIVATE MESSAGE
              </button>
            </RPGBox>
          </>
        )}

        {/* CONTENIDO: HOW TO USE */}
        {activeSection === 'how-to' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '25px' }}>SYSTEM MANUAL</h2>
            
            <h3 style={{ color: '#ffcc00', marginBottom: '10px' }}>1. Selecting Spines</h3>
            <p style={{ marginTop: 0, lineHeight: '1.6', color: '#ddd' }}>Browse the catalog and click on any spine to add it to your selection. The total count will update in the top bar. You can use the search bar to find specific games, franchises, or even search for your favorite creator's username.</p>
            
            <h3 style={{ color: '#ffcc00', marginBottom: '10px', marginTop: '25px' }}>2. Paper Sizes & Printing</h3>
            <p style={{ marginTop: 0, lineHeight: '1.6', color: '#ddd' }}>
              When you generate the PDF, you will be prompted to select a paper size.<br/><br/>
              • <b>Letter Size (Recommended):</b> This is the default and highly recommended setting for standard home printing. It ensures the dimensions of the spines match standard Nintendo Switch cases perfectly.<br/><br/>
              • <b>A4 / Legal / Other:</b> These formats are provided as alternatives, particularly useful if you are taking the PDF to a professional print shop or using specific photographic paper sizes. Always verify dimensions before printing a large batch.
            </p>
            
            <h3 style={{ color: '#ffcc00', marginBottom: '10px', marginTop: '25px' }}>3. Cutting</h3>
            <p style={{ marginTop: 0, lineHeight: '1.6', color: '#ddd' }}>For the best results, use a paper trimmer or an X-ACTO knife with a metal ruler. The generated PDF includes subtle guidelines to help you make clean, precise cuts.</p>
          </RPGBox>
        )}

        {/* CONTENIDO: ADVICE */}
        {activeSection === 'advice' && (
          <RPGBox>
            <h2 style={{ marginTop: 0, borderBottom: '2px solid #fff', paddingBottom: '10px', marginBottom: '25px' }}>PRO TIPS</h2>
            <h3 style={{ color: '#ffcc00', marginBottom: '10px' }}>Maintain a Consistent Shelf</h3>
            <p style={{ lineHeight: '1.7', color: '#ddd' }}>
              If you discover a spine design you really like, we highly recommend checking out other works by the same author. Many creators on r/SwitchSpines design their covers following a specific template or visual style. 
              <br/><br/>
              By using spines from a single creator (or creators with similar styles) for a specific franchise, you ensure your physical collection looks unified and professional on the shelf.
            </p>
            
            <div style={{ textAlign: 'center', marginTop: '30px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '4px' }}>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', marginBottom: '15px', color: '#fff' }}>Example: Consistent series formatting by u/DieNoMight9</p>
              <img 
                src="/ejemplo-estilo-dnn.png" 
                alt="Example Spines" 
                style={{ maxWidth: '600px', width: '100%', border: '3px solid #fff', boxShadow: '5px 5px 0px #000' }} 
              />
            </div>
          </RPGBox>
        )}
      </div>

      {/* SIDEBAR DERECHO: FUN FACT (ENSANCHADO) */}
      <div style={{ width: '500px', marginLeft: '50px', display: 'flex', flexDirection: 'column' }}>
        {/* IMAGEN DE METROID */}
        <div style={{ 
          border: '4px solid #fff', 
          marginBottom: '25px', 
          backgroundColor: '#000', 
          width: '320px', 
          alignSelf: 'center',
          boxShadow: '8px 8px 0px rgba(0,0,0,0.8)'
        }}>
          <img 
            src={dailyFact.cover} 
            alt={dailyFact.name} 
            style={{ width: '100%', display: 'block' }} 
            onError={(e) => e.target.src = "https://via.placeholder.com/320x450?text=Metroid+Cover"}
          />
        </div>

        {/* CAJA DE TEXTO (ESTIRADA) */}
        <RPGBox style={{ width: '100%', minHeight: '220px', flex: 1 }}>
          <div style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
            {dailyFact.name}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', letterSpacing: '2px' }}>— DID YOU KNOW? —</div>
          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', margin: 0, textAlign: 'justify' }}>
            {dailyFact.fact}
          </p>
          <div style={{ textAlign: 'right', marginTop: '20px', animation: 'blink 1s step-end infinite', fontSize: '1.5rem' }}>▼</div>
        </RPGBox>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default AboutView;