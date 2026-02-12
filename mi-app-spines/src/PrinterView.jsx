import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

const DEFAULT_SPINE_WIDTH = 10.5;

const PrinterView = ({ initialSpines, onBack }) => {
  const [images, setImages] = useState(initialSpines);
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

  const generatePreview = useCallback(async () => {
    if (images.length === 0) {
      setPdfUrl(null);
      return;
    }

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
      for (let i = 0; i < imgObj.count; i++) expandedImages.push(imgObj.src);
    });

    for (const src of expandedImages) {
      if (curX + sW > pW - mRight) {
        curX = mLeft;
        curY += sH + 5;
      }
      if (curY + sH > pH - mTop) {
        pdf.addPage([inchToMm(config.pageWidth), inchToMm(config.pageHeight)], 'l');
        curX = mLeft;
        curY = mTop;
      }
      pdf.addImage(src, 'PNG', curX, curY, sW, sH, undefined, 'FAST');
      curX += sW + gap;
    }

    setPdfUrl(pdf.output('bloburl'));
  }, [images, config]);

  useEffect(() => { generatePreview(); }, [generatePreview]);

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the print list?")) {
      setImages([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden' }}>
      
      {/* BARRA SUPERIOR */}
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <button onClick={onBack} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK</button>
        <div style={{ color: 'white', fontWeight: 'bold' }}>PRINT EDITOR</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleClearAll} style={{ background: '#333', color: '#ff4444', border: '1px solid #ff4444', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CLEAR ALL</button>
          <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', color: '#b30000' }}>DOWNLOAD PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LISTA LATERAL IZQUIERDA */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <img src={img.src} alt="t" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <input type="number" value={img.count} onChange={(e) => {
                    const newImages = [...images];
                    newImages[i].count = Math.max(1, parseInt(e.target.value) || 1);
                    setImages(newImages);
                  }} style={{ width: '40px' }} />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ background: 'red', color: 'white', border: 'none', cursor: 'pointer', width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><span style={{ transform: 'translate(-1px, -1px)', display: 'block' }}>✕</span></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VISOR PDF Y PANEL DE CONFIGURACIÓN */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#525659', display: 'flex', justifyContent: 'center' }}>
          
          {/* PANEL BLANCO DE CONFIGURACIÓN */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            zIndex: 10, 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '8px', 
            width: '280px', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '10px', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)' 
          }}>
            {['spineSpacing', 'pageWidth', 'pageHeight', 'marginTop', 'marginLeft', 'marginRight'].map(k => (
              <div key={k}>
                <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block' }}>{k.toUpperCase()}</label>
                <input type="number" step="0.1" value={config[k]} onChange={e => setConfig({...config, [k]: parseFloat(e.target.value) || 0})} style={{ width: '100%' }} />
              </div>
            ))}
            
            {/* AQUÍ ESTÁ EL BOTÓN DE RESET QUE FALTABA */}
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid #ccc', paddingTop: '10px', marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>SPINE WIDTH: {config.spineWidthMM}mm</label>
                <button 
                  onClick={() => setConfig({...config, spineWidthMM: DEFAULT_SPINE_WIDTH})}
                  style={{ backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '3px', fontSize: '9px', padding: '2px 8px', cursor: 'pointer' }}
                >
                  RESET (10.5mm)
                </button>
              </div>
              <input type="range" min={5.5} max={15.5} step="0.1" value={config.spineWidthMM} onChange={e => setConfig({...config, spineWidthMM: parseFloat(e.target.value)})} style={{ width: '100%' }} />
            </div>
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} style={{ width: '90%', height: '95%', border: 'none', marginTop: '10px' }} title="preview" />
          ) : (
            <div style={{ color: 'white', marginTop: '100px', textAlign: 'center' }}>
              <h2>PDF is empty</h2>
              <p>Go back and select some spines.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterView;