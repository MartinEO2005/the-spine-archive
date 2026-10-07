import React from 'react';

const MobileInfoView = () => {
  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#1a1a1a', borderTop: '2px solid #333' }}>
      <article style={{ maxWidth: '600px', margin: '0 auto', color: '#ccc', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
        <h2 style={{ color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '14px', marginBottom: '20px', lineHeight: '1.4' }}>
          WELCOME TO THE SPINE ARCHIVE
        </h2>
        
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>
          <strong>The Spine Archive</strong> is a community-driven database dedicated to preserving, sharing, and organizing high-quality custom Nintendo Switch spines. 
          You are currently viewing the mobile version of our site in <strong>Read-Only Mode</strong>, which allows you to browse our extensive catalog of fan-made covers.
        </p>

        <h3 style={{ color: '#fff', fontSize: '16px', borderBottom: '1px solid #444', paddingBottom: '8px', marginBottom: '15px' }}>
          Why is Printing Disabled on Mobile?
        </h3>
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>
          To ensure your custom covers fit perfectly in physical Nintendo Switch cases, our tool generates a strict 1:1 scale PDF. Mobile browsers and operating systems (iOS/Android) handle PDF generation and print margins unpredictably, often resulting in auto-scaled, shrunken, or misaligned covers. For the best experience and pinpoint physical accuracy, <strong>we strongly require accessing The Spine Archive from a Desktop or Laptop PC</strong>.
        </p>

        <h3 style={{ color: '#fff', fontSize: '16px', borderBottom: '1px solid #444', paddingBottom: '8px', marginBottom: '15px' }}>
          Printing Guidelines & Troubleshooting
        </h3>
        <p style={{ marginBottom: '15px', fontSize: '14px' }}>
          Once you access our platform from a desktop computer, keep these golden rules in mind before sending your PDF to the printer:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px', fontSize: '14px' }}>
          <li style={{ marginBottom: '10px' }}><strong>100% Scale is Mandatory:</strong> Always set your print scale to exactly 100% or "Actual Size" in your printer settings.</li>
          <li style={{ marginBottom: '10px' }}><strong>Disable Auto-Margins:</strong> Completely uncheck options like <em>"Fit to Scale"</em>, <em>"Fit to Printable Area"</em>, or <em>"Fit to Margins"</em>.</li>
          <li style={{ marginBottom: '10px' }}><strong>Paper Type:</strong> For the most authentic commercial look, we recommend using high-quality glossy or semi-gloss photo paper (around 120gsm to 150gsm).</li>
          <li style={{ marginBottom: '10px' }}><strong>Test Before You Print:</strong> Always do a test run in black & white on standard cheap printer paper. Cut it out and slide it into a Switch case to verify the sizing before using expensive photo paper and color ink.</li>
        </ul>

        <h3 style={{ color: '#fff', fontSize: '16px', borderBottom: '1px solid #444', paddingBottom: '8px', marginBottom: '15px' }}>
          About the Community Project
        </h3>
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>
          This project was born out of love for physical media collection. The standard red Switch spines can look monotonous on a shelf. Our community creates and curates vibrant, detailed artwork that brings life back to your physical game library. Whether you are replacing a water-damaged cover, buying loose cartridges, or customizing your entire shelf, our web tools are built to make the process as seamless as possible.
        </p>
      </article>
    </div>
  );
};

export default MobileInfoView;