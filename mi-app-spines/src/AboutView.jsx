import React, { useState } from 'react';

const AboutView = () => {
  const [activeSection, setActiveSection] = useState('about');

  const getMenuItemStyle = (sectionId) => ({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '10px 15px',
    marginBottom: '10px',
    fontSize: '22px',
    fontWeight: 'bold',
    color: activeSection === sectionId ? '#fff' : '#888',
    textTransform: 'uppercase',
    transition: 'color 0.2s',
  });

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      padding: '40px',
      fontFamily: '"Courier New", Courier, monospace' // ESTILO RPG APLICADO A TODO
    }}>
      
      {/* --- SIDEBAR MENÚ ESTILO RPG --- */}
      <div style={{ 
        width: '300px', 
        paddingTop: '60px',
        paddingRight: '30px',
        borderRight: '2px solid #333'
      }}>
        <div style={{
          backgroundColor: '#000',
          border: '2px solid #555',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '4px 4px 0px rgba(179,0,0,0.5)'
        }}>
          
          <div 
            style={getMenuItemStyle('about')} 
            onClick={() => setActiveSection('about')}
            onMouseEnter={(e) => { if (activeSection !== 'about') e.currentTarget.style.color = '#b30000'; }}
            onMouseLeave={(e) => { if (activeSection !== 'about') e.currentTarget.style.color = '#888'; }}
          >
            <span style={{ width: '20px', opacity: activeSection === 'about' ? 1 : 0, color: '#b30000' }}>▶</span> 
            ABOUT
          </div>

          <div 
            style={getMenuItemStyle('how-to')} 
            onClick={() => setActiveSection('how-to')}
            onMouseEnter={(e) => { if (activeSection !== 'how-to') e.currentTarget.style.color = '#b30000'; }}
            onMouseLeave={(e) => { if (activeSection !== 'how-to') e.currentTarget.style.color = '#888'; }}
          >
            <span style={{ width: '20px', opacity: activeSection === 'how-to' ? 1 : 0, color: '#b30000' }}>▶</span> 
            HOW TO USE
          </div>

          <div 
            style={getMenuItemStyle('recommendations')} 
            onClick={() => setActiveSection('recommendations')}
            onMouseEnter={(e) => { if (activeSection !== 'recommendations') e.currentTarget.style.color = '#b30000'; }}
            onMouseLeave={(e) => { if (activeSection !== 'recommendations') e.currentTarget.style.color = '#888'; }}
          >
            <span style={{ width: '20px', opacity: activeSection === 'recommendations' ? 1 : 0, color: '#b30000' }}>▶</span> 
            ADVICE
          </div>

        </div>
      </div>

      {/* --- ÁREA DE CONTENIDO (DERECHA) --- */}
      <div style={{ 
        flex: 1, 
        paddingLeft: '50px', 
        paddingTop: '40px',
        maxWidth: '900px'
      }}>
        
        {/* SECCIÓN: ABOUT */}
        {activeSection === 'about' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: '900', 
              margin: '0 0 5px 0', 
              letterSpacing: '-1px',
              textShadow: '0 2px 10px rgba(179, 0, 0, 0.5)' 
            }}>
              THE SPINE ARCHIVE
            </h1>
            <div style={{ color: '#b30000', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '40px', letterSpacing: '2px' }}>
              PRESERVATION PROJECT
            </div>

            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#ccc', textAlign: 'justify', marginBottom: '40px' }}>
              Welcome to <strong>The Spine Archive</strong>. I am creating this project dedicated to preserving, cataloging, and showcasing the incredible work of the <strong>r/SwitchSpines</strong> community. My mission is to create a seamless, searchable database that allows collectors to unify their shelves with high-quality custom artwork. Every spine in this archive is a testament to the creativity and passion of the fans who dedicate their time to making our physical collections look better than ever.
            </p>

            <div style={{ height: '1px', backgroundColor: '#333', margin: '40px 0' }}></div>

            <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '15px' }}>Contribution & Contact</h2>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#999', textAlign: 'justify', marginBottom: '25px' }}>
              This database is a living project, constantly growing with new releases and community submissions. If you are an artist wishing to add your portfolio, or if you don't find a specific franchise or creator that you know <strong>is already on the r/SwitchSpines subreddit</strong>, please send me a private message. Your feedback and contributions help keep this archive complete and up to date for everyone. <br/><br/><strong style={{color: '#ddd'}}>Please contact me if image quality is a big issue or if a spine size is incorrect.</strong>
            </p>

            <a 
              href="https://www.reddit.com/user/Certain-Issue5855/" 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#b30000',
                color: 'white',
                padding: '12px 25px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                border: '2px solid #ff0000',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#cc0000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b30000'; }}
            >
              Send me a Private Message
            </a>
          </div>
        )}

        {/* SECCIÓN: HOW TO USE */}
        {activeSection === 'how-to' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <h1 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '30px', borderBottom: '2px solid #b30000', paddingBottom: '10px' }}>
              SYSTEM MANUAL
            </h1>
            
            <h3 style={{ color: '#b30000', fontSize: '1.3rem', marginBottom: '10px' }}>1. Selecting Spines</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#ccc', marginBottom: '30px' }}>
              Browse the catalog and click on any spine to add it to your selection. The total count will update in the top bar. You can use the search bar to find specific games, franchises, or even search for your favorite creator's username.
            </p>

            <h3 style={{ color: '#b30000', fontSize: '1.3rem', marginBottom: '10px' }}>2. Paper Sizes & Printing</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#ccc', marginBottom: '15px' }}>
              When you generate the PDF, you will be prompted to select a paper size.
            </p>
            <ul style={{ color: '#ccc', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '30px', backgroundColor: '#1a1a1a', padding: '20px 40px', borderRadius: '8px' }}>
              <li style={{ marginBottom: '10px' }}><strong>Letter Size (Recommended):</strong> This is the default and highly recommended setting for standard home printing. It ensures the dimensions of the spines match standard Nintendo Switch cases perfectly.</li>
              <li><strong>A4 / Legal / Other:</strong> These formats are provided as alternatives, particularly useful if you are taking the PDF to a professional print shop or using specific photographic paper sizes. Always verify dimensions before printing a large batch.</li>
            </ul>

            <h3 style={{ color: '#b30000', fontSize: '1.3rem', marginBottom: '10px' }}>3. Cutting</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#ccc' }}>
              For the best results, use a paper trimmer or an X-ACTO knife with a metal ruler. The generated PDF includes subtle guidelines to help you make clean, precise cuts.
            </p>
          </div>
        )}

        {/* SECCIÓN: RECOMMENDATIONS / ADVICE */}
        {activeSection === 'recommendations' && (
          <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
            <h1 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '30px', borderBottom: '2px solid #b30000', paddingBottom: '10px' }}>
              PRO TIPS
            </h1>

            <h3 style={{ color: '#ffcc00', fontSize: '1.4rem', marginBottom: '15px' }}>Maintain a Consistent Shelf</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#ccc', marginBottom: '25px', textAlign: 'justify' }}>
              If you discover a spine design you really like, <strong style={{ color: 'white', textDecoration: 'underline' }}>we highly recommend checking out other works by the same author.</strong> Many creators on r/SwitchSpines design their covers following a specific template or visual style. 
              <br/><br/>
              By using spines from a single creator (or creators with similar styles) for a specific franchise, you ensure your physical collection looks unified and professional on the shelf.
            </p>

            {/* IMAGEN DE EJEMPLO */}
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              border: '1px solid #444', 
              borderRadius: '8px', 
              padding: '20px',
              textAlign: 'center',
              marginTop: '30px'
            }}>
              <p style={{ color: '#888', fontStyle: 'italic', marginBottom: '15px' }}>Example: Consistent series formatting by u/DieNoMight9</p>
              
              <div style={{ 
                width: '100%', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                {/* Asegúrate de que el nombre aquí coincide con el archivo en tu carpeta public */}
                <img 
                  src="/ejemplo-estilo-dnn.png" 
                  alt="Consistent formatting example" 
                  style={{ maxWidth: '100%', height: 'auto', border: '1px solid #333' }}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div style={{ position: 'fixed', bottom: '20px', left: '40px', color: '#444', fontSize: '12px' }}>
        © {new Date().getFullYear()} The Spine Archive. Not affiliated with Nintendo.
      </div>
    </div>
  );
};

export default AboutView;