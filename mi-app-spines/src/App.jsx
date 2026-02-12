import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import CatalogView from './CatalogView';

const DEFAULT_SPINE_WIDTH = 10.5;

function App() {
  const [view, setView] = useState('catalog');
  const [images, setImages] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [config, setConfig] = useState({
    spineSpacing: 0.1,
    pageWidth: 11.0,
    pageHeight: 8.5,
    marginTop: 0.5,
    marginLeft: 0.5,
    marginRight: 0.5,
    spineWidthMM: DEFAULT_SPINE_WIDTH
  });

  const inchToMm = (inch) => inch * 25.4;

  const handleConfirmSelection = (selectedFromCatalog) => {
    setImages(selectedFromCatalog);
    setView('pdf');
  };

  const removeSpine = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateCount = (index, val) => {
    const newCount = Math.max(1, parseInt(val) || 1);
    setImages(prev => prev.map((img, i) => i === index ? { ...img, count: newCount } : img));
  };

  // RESET LOGIC
  const resetSpineWidth = () => {
    setConfig({ ...config, spineWidthMM: DEFAULT_SPINE_WIDTH });
  };

  useEffect(() => {
    if (images.length === 0 || view !== 'pdf') {
      setPdfUrl(null);
      return;
    }
    const timeoutId = setTimeout(() => generatePreview(), 300);
    return () => clearTimeout(timeoutId);
  }, [images, config, view]);

  const generatePreview = async () => {
    const pdf = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: [inchToMm(config.pageWidth), inchToMm(config.pageHeight)]
    });

    const sW = parseFloat(config.spineWidthMM);
    const sH = 161;
    const gap = inchToMm(config.spineSpacing);
    const mLeft = inchToMm(config.marginLeft);
    const mTop = inchToMm(config.marginTop);
    const pW = inchToMm(config.pageWidth);
    const pH = inchToMm(config.pageHeight);
    const mRight = inchToMm(config.marginRight);

    let curX = mLeft;
    let curY = mTop;

    const expandedImages = [];
    images.forEach(imgObj => {
      for (let i = 0; i < imgObj.count; i++) {
        expandedImages.push(imgObj.src);
      }
    });

    for (let i = 0; i < expandedImages.length; i++) {
      if (curX + sW > pW - mRight) {
        curX = mLeft;
        curY += sH + 5;
      }
      if (curY + sH > pH - mTop) {
        pdf.addPage([inchToMm(config.pageWidth), inchToMm(config.pageHeight)], 'l');
        curX = mLeft;
        curY = mTop;
      }
      pdf.addImage(expandedImages[i], 'PNG', curX, curY, sW, sH, undefined, 'NONE');
      curX += sW + gap;
    }

    const blob = pdf.output('bloburl');
    setPdfUrl(blob);
  };

  if (view === 'catalog') {
    return <CatalogView onConfirm={handleConfirmSelection} initialSelected={images} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* HEADER - ENGLISH ONLY */}
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => setView('catalog')} style={{ background: 'black', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK TO CATALOG</button>
          <div style={{ color: 'white', fontWeight: 'bold' }}>SPINES PREVIEW (MULTI-PAGE)</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => setImages([])} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>CLEAR ALL</button>
             <button onClick={() => window.open(pdfUrl)} style={{ background: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>DOWNLOAD PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANEL */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', borderRight: '1px solid #999', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {images.map((imgObj, i) => (
              <div key={i} style={{ position: 'relative', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imgObj.src} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>COUNT:</span>
                    <input type="number" value={imgObj.count} onChange={(e) => updateCount(i, e.target.value)} style={{ width: '45px', textAlign: 'center', border: '1px solid #ccc' }} />
                </div>
                <button onClick={() => removeSpine(i)} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(230, 0, 18, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}> × </button>
              </div>
            ))}
          </div>
        </div>

        {/* CENTRAL PREVIEW & FLOATING CONTROLS */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#525659' }}>
          
          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Spacing', key: 'spineSpacing' },
              { label: 'Page W', key: 'pageWidth' },
              { label: 'Page H', key: 'pageHeight' },
              { label: 'M. Top', key: 'marginTop' },
              { label: 'M. Left', key: 'marginLeft' },
              { label: 'M. Right', key: 'marginRight' }
            ].map(item => (
              <div key={item.key}>
                <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block' }}>{item.label}</label>
                <input 
                  type="number" step="0.01" 
                  value={config[item.key]} 
                  onChange={e => setConfig({...config, [item.key]: parseFloat(e.target.value) || 0})} 
                  style={{ width: '55px' }} 
                />
              </div>
            ))}
            <div style={{ gridColumn: 'span 3', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Spine (mm): </label>
                  <input 
                    type="range" min={DEFAULT_SPINE_WIDTH - 5} max={DEFAULT_SPINE_WIDTH + 10} step="0.1"
                    value={config.spineWidthMM} 
                    onChange={e => setConfig({...config, spineWidthMM: parseFloat(e.target.value)})} 
                    style={{ width: '100px', verticalAlign: 'middle' }} 
                  />
                  <span style={{ marginLeft: '8px', fontSize: '12px' }}>{config.spineWidthMM}</span>
                </div>
                <button 
                  onClick={resetSpineWidth}
                  style={{ backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '3px', fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}
                >
                  RESET
                </button>
            </div>
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              <p>Generating preview...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;