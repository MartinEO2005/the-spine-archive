import React from 'react';

const FilterGuideView = ({ onBack }) => {
  return (
    <div style={{
      maxWidth: '1050px',
      margin: '0 auto',
      padding: '40px 20px 80px 20px',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      lineHeight: '1.6'
    }}>
      {/* TOP NAVIGATION BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <button 
          onClick={onBack}
          style={{
            backgroundColor: '#1a1a1a',
            color: '#fff',
            border: '2px solid #b30000',
            padding: '12px 22px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            boxShadow: '3px 3px 0px #000'
          }}
        >
          ← BACK TO CATALOG
        </button>

        <span style={{ fontSize: '11px', color: '#888', fontFamily: '"Press Start 2P", monospace', letterSpacing: '1px' }}>
          THE SPINE ARCHIVE // OFFICIAL GUIDE
        </span>
      </div>

      {/* HEADER SECTION */}
      <div style={{
        backgroundColor: '#161616',
        border: '4px solid #333',
        padding: '35px',
        marginBottom: '45px',
        borderLeft: '8px solid #ffcc00',
        boxShadow: '4px 4px 0px #000'
      }}>
        <h1 style={{ color: '#ffcc00', fontFamily: '"Press Start 2P", monospace', fontSize: '20px', margin: '0 0 15px 0', lineHeight: '1.4', textShadow: '2px 2px 0px #000' }}>
          OFFICIAL FILTER & TAGGING GUIDE
        </h1>
        <p style={{ margin: 0, color: '#bbb', fontSize: '13px', maxWidth: '880px', lineHeight: '1.7', fontFamily: 'monospace' }}>
          To maintain a high-standard, searchable database and prepare for community tagging features, every custom Nintendo Switch spine is categorized using a strict set of visual rules. Use this guide to understand what each category represents or to accurately tag artwork when contributing to the archive.
        </p>
      </div>

      {/* SECTION 1: TEXT ALIGNMENT */}
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>
          1. Text Alignment
        </h2>
        <p style={paragraphStyle}>
          The <strong>Text Alignment</strong> filter specifies where the primary title typography or logo is positioned along the vertical axis of the spine. This is one of the most critical visual filters for collectors who want uniform shelf alignment.
        </p>

        {/* IMAGEN 1 */}
        <div style={imageContainerStyle}>
          <img 
            src="/images/guide/text-alignment.png" 
            alt="Text Alignment Comparison Guide" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerText = '🖼️ [ MISSING IMAGE: /public/images/guide/text-alignment.png ]';
              e.target.parentNode.style.padding = '50px 20px';
              e.target.parentNode.style.color = '#ffcc00';
              e.target.parentNode.style.fontFamily = '"Press Start 2P", monospace';
              e.target.parentNode.style.fontSize = '11px';
            }}
          />
        </div>

        <div style={gridTwoCols}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Top Centered</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> The title logo or text is placed at the top of the spine, positioned immediately below the top Nintendo Switch red banner.
            </p>
            <ul style={bulletListStyle}>
              <li>Almost no margin exists between the bottom of the top banner and the start of the title text.</li>
              <li>Leaves the lower spine free for background artwork, characters, or secondary details.</li>
              <li>Mimics the classic layout placement of official Switch retail spines.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Top Centered with Margin</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> Placed in the upper section of the spine, but with a deliberate, visible vertical gap between the top banner and the title.
            </p>
            <ul style={bulletListStyle}>
              <li>Features an intentional empty margin (typically 60 to 100 pixels in height).</li>
              <li>Allows background elements (sky, scenery, atmospheric lighting) to breathe before text begins.</li>
              <li>Differentiates custom artistic layouts from strict, flush-to-the-top standard templates.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Center</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> The main title floats in the absolute middle of the spine layout.
            </p>
            <ul style={bulletListStyle}>
              <li>Features symmetrical empty space above and below the title block.</li>
              <li>Highly popular in minimalist, cinematic, or poster-style custom covers.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Bottom</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> The main game title is grouped entirely within the lower half of the spine.
            </p>
            <ul style={bulletListStyle}>
              <li>Positioned near the base, directly above the publisher logo.</li>
              <li>Leaves the top and middle sections open for tall character illustrations or landscape visuals.</li>
            </ul>
          </div>

          <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <h3 style={cardTitleStyle}>Cover All</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> The title or logo typography spans almost the entire vertical length of the spine, starting from the top banner down to the base area.
            </p>
            <ul style={bulletListStyle}>
              <li>Ideal for long game titles or massive stylized vertical typography.</li>
              <li>Anchored near the top banner and extends deep into the lower portion of the box.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 2: MAIN STYLE */}
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>
          2. Main Style
        </h2>
        <p style={paragraphStyle}>
          The <strong>Main Style</strong> filter defines the artistic complexity and density of the overall spine artwork.
        </p>

        {/* IMAGEN 2 */}
        <div style={imageContainerStyle}>
          <img 
            src="/images/guide/main-style.png" 
            alt="Main Style Comparison Guide" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerText = '🖼️ [ MISSING IMAGE: /public/images/guide/main-style.png ]';
              e.target.parentNode.style.padding = '50px 20px';
              e.target.parentNode.style.color = '#ffcc00';
              e.target.parentNode.style.fontFamily = '"Press Start 2P", monospace';
              e.target.parentNode.style.fontSize = '11px';
            }}
          />
        </div>

        <div style={gridThreeCols}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Minimalist</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> Clean, elegant designs focusing on negative space, solid backdrops, or subtle textures.
            </p>
            <ul style={bulletListStyle}>
              <li>Backgrounds consist of solid colors, subtle gradients, or simple patterns.</li>
              <li><strong style={{ color: '#ffcc00' }}>Tagging Rule:</strong> If a spine includes a small character or logo at the bottom base, but the central background behind the title remains clean, it is still classified as Minimalist.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Scenic / Detailed</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> Fully illustrated or atmospheric backdrops that cover the entire spine surface.
            </p>
            <ul style={bulletListStyle}>
              <li>Uses complex background art, concept art, rich landscape textures, or panoramic game environments.</li>
              <li>The artwork extends uninterrupted behind the title typography.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Maximalist (Kitsch)</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> Intentionally chaotic, densely packed, or visually overloaded cover designs.
            </p>
            <ul style={bulletListStyle}>
              <li>Saturated with multiple characters, overlapping logos, vibrant pattern layers, and intense contrast.</li>
              <li>Designed without negative space for a high-energy visual impact on the shelf.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3: EXTRAS */}
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>
          3. Extras & Special Tags
        </h2>
        <p style={paragraphStyle}>
          The <strong>Extras</strong> filter allows multiple selection tags to account for special artistic details and signature community styles.
        </p>

        {/* IMAGEN 3 */}
        <div style={imageContainerStyle}>
          <img 
            src="/images/guide/extras.png" 
            alt="Extras and Special Tags Guide" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerText = '🖼️ [ MISSING IMAGE: /public/images/guide/extras.png ]';
              e.target.parentNode.style.padding = '50px 20px';
              e.target.parentNode.style.color = '#ffcc00';
              e.target.parentNode.style.fontFamily = '"Press Start 2P", monospace';
              e.target.parentNode.style.fontSize = '11px';
            }}
          />
        </div>

        <div style={gridTwoCols}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>DNN Style</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> A signature community template format featuring a character face framed inside a <strong>perfect circle</strong>, positioned directly above the publisher logo.
            </p>
            <ul style={bulletListStyle}>
              <li>Applied strictly to designs following the circular frame icon standard.</li>
              <li>Must be an added decorative frame (not the company's own circular logo).</li>
              <li>Must NOT contain additional overlapping characters along the spine.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Character Bottom</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> An isolated character figure, headshot, or element positioned cleanly at the bottom base of the spine, serving as a focal highlight.
            </p>
            <ul style={bulletListStyle}>
              <li>Character remains localized at the base without extending up the spine.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Characters Throughout the Spine</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> Multiple character illustrations, figures, or portraits distributed vertically along the entire length of the spine.
            </p>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Set / Panorama</h3>
            <p style={cardTextStyle}>
              <strong>Definition:</strong> Artwork designed as part of a connected multi-box mural or collection series.
            </p>
            <ul style={bulletListStyle}>
              <li>Artwork edges line up seamlessly with adjoining game boxes on a shelf.</li>
              <li>Includes series collections, multi-part volumes (e.g., Vol. 1, Vol. 2), or multi-game sets.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 4: CORE ATTRIBUTES */}
      <section style={sectionStyle}>
        <h2 style={sectionHeaderStyle}>
          4. Core Attributes & Base Colors
        </h2>

        <div style={gridThreeCols}>
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Title Typography</h3>
            <ul style={bulletListStyle}>
              <li><strong>Simple Text:</strong> Uniform, clean typography applied across titles for a cohesive library aesthetic.</li>
              <li><strong>Original Logo:</strong> Official custom-designed game title logo (retaining unique game fonts and branding).</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Platform</h3>
            <ul style={bulletListStyle}>
              <li><strong>Switch 1:</strong> Standard original Nintendo Switch spine design template.</li>
              <li><strong>Switch 2:</strong> Updated or next-generation concept template variant.</li>
            </ul>
          </div>

          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Lower Logo</h3>
            <ul style={bulletListStyle}>
              <li><strong>Nintendo:</strong> Official Nintendo console branding or standard publisher logos at the bottom.</li>
              <li><strong>Other:</strong> Custom creator signatures or non-standard logo elements.</li>
            </ul>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: '20px' }}>
          <h3 style={cardTitleStyle}>Base Color Tagging Rule</h3>
          <p style={cardTextStyle}>
            Select the primary color that best represents the overall background tone when viewed on a shelf. Available options:
             <span style={{ color: '#ffcc00' }}> Red, Blue, Yellow, Green, Pink, Orange, Purple, White, Black, Gray, Multicolor</span>.
          </p>
          <p style={{ ...cardTextStyle, marginTop: '10px', color: '#aaa' }}>
            <em>Rule for Multicolor: If the design features a dynamic blend of 3 or more strong contrasting colors without a single clear primary background color, select <strong>Multicolor</strong>.</em>
          </p>
        </div>
      </section>
    </div>
  );
};

// COMPONENT STYLES (Estilo Retro)
const sectionStyle = {
  marginBottom: '50px',
  backgroundColor: '#222',
  border: '4px solid #333',
  padding: '30px'
};

const sectionHeaderStyle = {
  color: '#fff',
  fontSize: '15px',
  fontFamily: '"Press Start 2P", monospace',
  borderBottom: '4px solid #b30000',
  paddingBottom: '12px',
  marginTop: 0,
  marginBottom: '20px',
  textShadow: '2px 2px 0px #b30000'
};

const paragraphStyle = {
  fontSize: '13px',
  color: '#ccc',
  marginBottom: '25px',
  lineHeight: '1.7',
  fontFamily: 'monospace'
};

const imageContainerStyle = {
  backgroundColor: '#111',
  border: '4px solid #333', 
  textAlign: 'center',
  marginBottom: '25px',
  overflow: 'hidden',
  boxShadow: '4px 4px 0px #000'
};

const gridTwoCols = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px'
};

const gridThreeCols = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '20px'
};

const cardStyle = {
  backgroundColor: '#111',
  border: '2px solid #555', 
  padding: '20px',
  boxShadow: '3px 3px 0px #000'
};

const cardTitleStyle = {
  color: '#ffcc00',
  fontSize: '12px',
  marginTop: 0,
  marginBottom: '10px',
  fontWeight: 'bold',
  fontFamily: '"Press Start 2P", monospace', 
  lineHeight: '1.4'
};

const cardTextStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#ccc',
  lineHeight: '1.6',
  fontFamily: 'monospace' 
};

const bulletListStyle = {
  marginTop: '10px',
  marginBottom: 0,
  paddingLeft: '18px',
  fontSize: '12px',
  color: '#aaa',
  lineHeight: '1.6',
  fontFamily: 'monospace'
};

export default FilterGuideView;