import React from 'react';

const SeoTextSection = () => {
  return (
    <article style={{
      maxWidth: '1000px',
      margin: '40px auto 20px auto',
      padding: '30px',
      backgroundColor: '#181818',
      borderRadius: '8px',
      border: '1px solid #333',
      color: '#ccc',
      fontFamily: 'sans-serif',
      lineHeight: '1.7',
      fontSize: '13px',
      textAlign: 'left'
    }}>
      <h2 style={{
        color: '#ffcc00',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        marginBottom: '15px',
        borderBottom: '2px solid #b30000',
        paddingBottom: '10px'
      }}>
        COMPREHENSIVE GUIDE TO CUSTOM NINTENDO SWITCH SPINES
      </h2>

      <p style={{ marginBottom: '15px' }}>
        Welcome to <strong>The Spine Archive</strong>, the leading community database and automated layout generator for custom Nintendo Switch replacement spines. Standard retail Nintendo Switch game cases feature uniform red spines with plain white text. While minimal, this default shelf layout can appear monotonous for passionate game collectors. Our platform allows fans to transform their physical libraries with custom, game-themed spine artwork designed by independent creators worldwide.
      </p>

      <h3 style={{ color: '#fff', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>
        1. How 1:1 Scale PDF Generation Works
      </h3>
      <p style={{ marginBottom: '15px' }}>
        Printing custom spines accurately requires exact physical measurements to avoid loose fitting or overlapping case edges. The standard dimensions for a physical Nintendo Switch case spine are <strong>10.5 mm in width (~0.41 inches) by 161 mm in height</strong>. Our browser-based generator formats your chosen artwork directly onto standard Letter or A4 printable sheets using exact millimeter ratios, bypassing the need for manual image scaling in external editing software.
      </p>

      <h3 style={{ color: '#fff', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>
        2. Recommended Printing Paper & Equipment
      </h3>
      <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
        <li style={{ marginBottom: '8px' }}><strong>Paper Type:</strong> High-gloss photo paper between 120 gsm and 180 gsm is highly recommended to replicate original retail jacket vibrance.</li>
        <li style={{ marginBottom: '8px' }}><strong>Printer Scaling Settings:</strong> When sending your generated PDF to print, ensure your software scale is set strictly to <em>"100%"</em> or <em>"Actual Size"</em>. Disable any "Fit to Printable Area" options.</li>
        <li style={{ marginBottom: '8px' }}><strong>Cutting Tools:</strong> Use a precision craft knife and a stainless steel ruler or a rotary paper trimmer for smooth, straight borders.</li>
      </ul>

      <h3 style={{ color: '#fff', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>
        3. Community Curation & Fair Use
      </h3>
      <p style={{ marginBottom: '15px' }}>
        The Spine Archive operates as a non-profit archival library and utility suite. All hosted designs are user-submitted fan artwork. Game titles, trademarked logos, and character designs remain the exclusive intellectual property of their respective publishers, including Nintendo Co., Ltd. Materials hosted here are intended strictly for personal collection management under Fair Use provisions.
      </p>
    </article>
  );
};

export default SeoTextSection;