import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

const DEFAULT_SPINE_WIDTH = 10.5;

const PrinterView = ({ initialSpines, onBack }) => {
  const [images, setImages] = useState(initialSpines);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const loadImageSafe = (url) => {
    return new Promise((resolve) => {
      if (!url || !url.startsWith('http')) return resolve(null);
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const generatePreview = useCallback(async () => {
    if (images.length === 0) { setPdfUrl(null); return; }
    setIsGenerating(true);
    try {
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

      const urlList = [];
      images.forEach(imgObj => {
        if (imgObj.image) {
          for (let i = 0; i < imgObj.count; i++) urlList.push(imgObj.image);
        }
      });

      if (urlList.length === 0) { setPdfUrl(null); return; }
      const loadedImages = await Promise.all(urlList.map(url => loadImageSafe(url)));

      loadedImages.forEach((imgData) => {
        if (!imgData) return;
        if (curX + sW > pW - mRight) {
          curX = mLeft;
          curY += sH + 5;
        }
        if (curY + sH > pH - mTop) {
          pdf.addPage([inchToMm(config.pageWidth), inchToMm(config.pageHeight)], 'l');
          curX = mLeft;
          curY = mTop;
        }
        pdf.addImage(imgData, 'JPEG', curX, curY, sW, sH, undefined, 'NONE');
        curX += sW + gap;
      });

      setPdfUrl(pdf.output('bloburl'));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [images, config]);

  useEffect(() => {
    const timer = setTimeout(() => generatePreview(), 800);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK</button>
        <div style={{ color: 'white', fontWeight: 'bold' }}>
          {isGenerating ? "⏳ GENERATING PDF..." : "PRINT EDITOR"}
        </div>
        <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', color: '#b30000', cursor: 'pointer' }}>DOWNLOAD PDF</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR IZQUIERDO */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', position: 'relative', border: '1px solid #999' }}>
                <img src={img.image || img.src} alt="t" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
                  <input 
                    type="number" 
                    value={img.count} 
                    onChange={(e) => {
                      const newImages = [...images];
                      newImages[i].count = Math.max(1, parseInt(e.target.value) || 1);
                      setImages(newImages);
                    }} 
                    style={{ width: '50px', color: 'black', background: 'white', border: '1px solid #ccc', padding: '2px' }} 
                  />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ background: '#ff4444', color: 'white', border: 'none', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '4px', fontWeight: 'bold' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA DE PREVIEW Y CONFIGURACIÓN */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#525659', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
          
          {/* CAJA DE CONFIGURACIÓN - AHORA CON COLOR FORZADO TRAS EL CAMBIO EN INDEX.CSS */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            zIndex: 1000, 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            width: '280px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            color: '#333333' // Esto asegura que etiquetas y textos hereden el negro
          }}>
            {['spineSpacing', 'pageWidth', 'pageHeight', 'marginTop', 'marginLeft', 'marginRight'].map(k => (
              <div key={k}>
                <label style={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  display: 'block', 
                  color: '#333333', 
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {k.replace(/([A-Z])/g, ' $1')}
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={config[k]} 
                  onChange={e => setConfig({...config, [k]: parseFloat(e.target.value) || 0})} 
                  style={{ 
                    width: '100%', 
                    color: '#000000', 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #bbbbbb', 
                    borderRadius: '4px',
                    padding: '5px',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }} 
                />
              </div>
            ))}
            <button 
              onClick={() => setConfig({ ...config, spineSpacing: 0.1, pageWidth: 11, pageHeight: 8.5, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5 })} 
              style={{ 
                gridColumn: 'span 2', 
                backgroundColor: '#eee', 
                color: '#333', 
                border: '1px solid #ccc',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px'
              }}
            >
              RESET SETTINGS
            </button>
          </div>

          {/* PDF IFRAME */}
          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }} title="preview" />
          ) : (
            <div style={{ color: 'white', marginTop: '100px', textAlign: 'center' }}>
              <h2 style={{ color: 'white' }}>{isGenerating ? "Processing Images..." : "No items selected"}</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterView;