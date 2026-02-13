import React from 'react';

const AboutView = () => {
  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      padding: '60px 20px', 
      color: 'white', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start', // Para que no quede centrado verticalmente si hay mucho texto
      background: 'linear-gradient(180deg, #111 0%, #0d0d0d 100%)' // Gradiente sutil
    }}>
      
      {/* TARJETA PRINCIPAL */}
      <div style={{ 
        maxWidth: '800px', 
        width: '100%', 
        backgroundColor: '#1a1a1a', 
        padding: '50px', 
        borderRadius: '12px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', // Sombra profunda
        border: '1px solid #333',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* BARRA DECORATIVA SUPERIOR */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #b30000, #ff0000, #b30000)' }}></div>

        {/* TÍTULO */}
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '800', 
          marginBottom: '10px', 
          marginTop: '0', 
          letterSpacing: '-1px',
          textShadow: '0 2px 10px rgba(179, 0, 0, 0.3)' 
        }}>
          THE SPINE ARCHIVE
        </h1>
        <div style={{ color: '#b30000', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '40px', letterSpacing: '2px' }}>
          PRESERVATION PROJECT
        </div>

        {/* PARRAFO 1: INTRODUCCIÓN */}
        <div style={{ 
          fontSize: '1.1rem', 
          lineHeight: '1.8', 
          color: '#ccc', 
          textAlign: 'justify', // TEXTO JUSTIFICADO
          marginBottom: '40px' 
        }}>
          <p>
            Welcome to <strong>The Spine Archive</strong>. This project is dedicated to preserving, cataloging, and showcasing the incredible work of the <strong>r/SwitchSpines</strong> community. Our mission is to create a seamless, searchable database that allows collectors to unify their shelves with high-quality custom artwork. Every spine in this archive is a testament to the creativity and passion of the fans who dedicate their time to making our physical collections look better than ever.
          </p>
        </div>

        {/* LÍNEA SEPARADORA */}
        <div style={{ height: '1px', backgroundColor: '#333', margin: '40px 0' }}></div>

        {/* PÁRRAFO 2: CONTACTO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '10px' }}>Contribution & Contact</h2>
          <p style={{ 
            fontSize: '1rem', 
            lineHeight: '1.6', 
            color: '#999', 
            textAlign: 'justify', // TEXTO JUSTIFICADO
            margin: 0
          }}>
            This database is a living project, constantly growing with new releases and community submissions. If you are an artist wishing to add your portfolio, or a user looking for a specific franchise or creator that hasn't been archived yet, please do not hesitate to reach out. Your feedback and contributions help keep this archive complete and up to date for everyone. <strong>Please contact if image quality is a big issue or if spine size is incorrect</strong>
          </p>

          {/* BOTÓN DE REDDIT */}
          <div style={{ marginTop: '20px' }}>
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
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'background-color 0.2s, transform 0.2s',
                border: '1px solid #ff0000'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#cc0000';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#b30000';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Contact u/Certain-Issue5855
            </a>
          </div>
        </div>

      </div>
      
      {/* CREDITOS PEQUEÑOS AL PIE */}
      <div style={{ position: 'fixed', bottom: '20px', color: '#444', fontSize: '12px' }}>
        © {new Date().getFullYear()} The Spine Archive. Not affiliated with Nintendo.
      </div>
    </div>
  );
};

export default AboutView;