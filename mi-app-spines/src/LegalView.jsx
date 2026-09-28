import React from 'react';

const LegalView = ({ onBack }) => {
  return (
    <div style={{
      maxWidth: '850px',
      margin: '0 auto',
      padding: '40px 20px',
      color: 'rgba(255, 255, 255, 0.85)',
      fontFamily: 'sans-serif',
      lineHeight: '1.7',
      fontSize: '13px'
    }}>
      {onBack && (
        <button 
          onClick={onBack}
          style={{
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #444',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '30px',
            fontWeight: 'bold',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px'
          }}
        >
          ← BACK TO CATALOG
        </button>
      )}

      <h1 style={{ color: '#ffcc00', fontSize: '24px', marginBottom: '10px', fontFamily: '"Press Start 2P", monospace' }}>
        LEGAL & PRIVACY
      </h1>
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>

      {/* --- PRIVACY POLICY --- */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', borderBottom: '2px solid #b30000', paddingBottom: '8px', marginBottom: '20px' }}>
          1. Privacy Policy
        </h2>
        <p style={{ marginBottom: '15px' }}>
          At <strong>The Spine Archive</strong>, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by The Spine Archive and how we use it.
        </p>
        
        <h3 style={{ color: '#ffcc00', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>1.1. Information We Collect & Log Files</h3>
        <p style={{ marginBottom: '15px' }}>
          The Spine Archive follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected includes IP addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, and tracking users' movement on the website.
        </p>

        <h3 style={{ color: '#ffcc00', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>1.2. Cookies and Web Beacons (AdSense & Analytics)</h3>
        <p style={{ marginBottom: '15px' }}>
          Like any other website, The Spine Archive uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. 
          We use Google Analytics to understand site traffic. Additionally, Google is a third-party vendor on our site and uses DART cookies to serve ads to our site visitors based upon their visit to our site and other sites on the internet. 
          Users may choose to decline the use of cookies via our Cookie Consent Banner or by visiting the Google Ad and Content Network Privacy Policy.
        </p>

        <h3 style={{ color: '#ffcc00', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>1.3. User Data Rights (GDPR & CCPA)</h3>
        <p style={{ marginBottom: '15px' }}>
          Depending on your location, you may have rights under the General Data Protection Regulation (GDPR) or California Consumer Privacy Act (CCPA) to request access to, deletion of, or restriction of processing of your personal data. Please contact us to exercise these rights.
        </p>
      </section>

      {/* --- TERMS OF SERVICE --- */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', borderBottom: '2px solid #b30000', paddingBottom: '8px', marginBottom: '20px' }}>
          2. Terms of Service
        </h2>
        <p style={{ marginBottom: '15px' }}>
          By accessing this website, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
        </p>

        <h3 style={{ color: '#ffcc00', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>2.1. Platform Ownership & Acceptable Use</h3>
        <p style={{ marginBottom: '15px' }}>
          Permission is granted to download the generated PDFs and image materials on The Spine Archive. However, the original source code, web design, interface layout, and database structures of <strong>The Spine Archive</strong> are the exclusive property of the website creator. Under these terms you may not:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '15px', color: '#ccc' }}>
          <li style={{ marginBottom: '8px' }}>Scrape, mirror, duplicate, or redistribute the underlying application code or database collections without explicit written consent.</li>
          <li style={{ marginBottom: '8px' }}>Attempt to decompile or reverse engineer any software contained on the website.</li>
          <li style={{ marginBottom: '8px' }}>Use automated scripts, spiders, or scrapers to harvest bulk images or PDFs from the server to create clone applications.</li>
        </ul>

        <h3 style={{ color: '#ffcc00', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>2.2. Fair Use & Copyright Disclaimer</h3>
        <p style={{ marginBottom: '15px' }}>
          The Spine Archive is an independent, community-driven database. <strong>We are in no way affiliated with, authorized, maintained, sponsored, or endorsed by Nintendo Co., Ltd. or any other video game publisher/developer.</strong>
        </p>
        <p style={{ marginBottom: '15px' }}>
          All game titles, characters, logos, console names, and related branding are registered trademarks and copyrights of their respective owners. The custom spine artwork hosted on this platform is fan-made, transformative material intended strictly for collection management. This constitutes a "Fair Use" of any copyrighted material as provided for in section 107 of the US Copyright Law.
        </p>

        <h3 style={{ color: '#ffcc00', fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>2.3. Limitation of Liability</h3>
        <p style={{ marginBottom: '15px' }}>
          The materials on The Spine Archive's website are provided on an 'as is' basis. In no event shall The Spine Archive or its contributors be liable for any damages (including, without limitation, costs of printing, wasted ink/paper, or hardware malfunction) arising out of the use or inability to use the materials on this website, even if notified orally or in writing of the possibility of such damage.
        </p>
      </section>

      {/* --- CONTACT & DMCA --- */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', fontSize: '18px', borderBottom: '2px solid #b30000', paddingBottom: '8px', marginBottom: '20px' }}>
          3. DMCA & Contact Information
        </h2>
        <p style={{ marginBottom: '15px' }}>
          We respect the intellectual property rights of others. If you are a copyright owner or an agent thereof, and you believe that any content hosted on The Spine Archive infringes your copyrights, you may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing us with the necessary information to the email below.
        </p>
        <p style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a1a1a', borderLeft: '4px solid #ffcc00', display: 'inline-block' }}>
          Contact & Legal Inquiries: <strong style={{ color: '#ffcc00' }}>contact@thespinearchive.com</strong>
        </p>
      </section>
    </div>
  );
};

export default LegalView;