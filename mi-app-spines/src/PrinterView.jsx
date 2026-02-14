import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

const DEFAULT_SPINE_WIDTH = 10.5;

const PrinterView = ({ initialSpines, onBack }) => {
  const [images, setImages] = useState(initialSpines);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState({
    spineSpacing: 0.1, pageWidth: 11.0, pageHeight: 8.5,
    marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5,
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
        canvas.width = img.width; canvas.height = img.height;
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
        orientation: 'l', unit: 'mm',
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

      let curX = mLeft; let curY = mTop;
      const urlList = [];
      images.forEach(imgObj => {
        if (imgObj.image) { for (let i = 0; i < imgObj.count; i++) urlList.push(imgObj.image); }
      });

      if (urlList.length === 0) { setPdfUrl(null); return; }
      const loadedImages = await Promise.all(urlList.map(url => loadImageSafe(url)));

      loadedImages.forEach((imgData) => {
        if (!imgData) return;
        if (curX + sW > pW - mRight) { curX = mLeft; curY += sH + 5; }
        if (curY + sH > pH - mTop) {
          pdf.addPage([inchToMm(config.pageWidth), inchToMm(config.pageHeight)], 'l');
          curX = mLeft; curY = mTop;
        }
        pdf.addImage(imgData, 'JPEG', curX, curY, sW, sH, undefined, 'NONE');
        curX += sW + gap;
      });
      setPdfUrl(pdf.output('bloburl'));
    } catch (err) { console.error(err); } finally { setIsGenerating(false); }
  }, [images, config]);

  useEffect(() => {
    const timer = setTimeout(() => generatePreview(), 800);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden', color: '#333' }}>
      
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <button onClick={onBack} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK</button>
        <div style={{ color: 'white', fontWeight: 'bold' }}>{isGenerating ? "⏳ GENERATING..." : "PRINT EDITOR"}</div>
        <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', color: '#b30000' }}>DOWNLOAD PDF</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', padding: '15px', overflowY: 'auto', color: '#333' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <img src={img.image || img.src} style={{ width: '100%', height: '100px', objectFit: 'cover' }} alt="spine" />
                <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input type="number" value={img.count} onChange={(e) => {
                    const newImages = [...images];
                    newImages[i].count = Math.max(1, parseInt(e.target.value) || 1);
                    setImages(newImages);
                  }} style={{ width: '50px', color: '#333' }} />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PREVIEW */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#525659', display: 'flex', justifyContent: 'center' }}>
          {/* CONTROLES PDF - Forzamos color de texto negro aquí */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', width: '280px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', color: '#333' }}>
            {['spineSpacing', 'pageWidth', 'pageHeight', 'marginTop', 'marginLeft', 'marginRight'].map(k => (
              <div key={k}>
                <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', color: '#333' }}>{k.toUpperCase()}</label>
                <input type="number" step="0.1" value={config[k]} onChange={e => setConfig({...config, [k]: parseFloat(e.target.value) || 0})} style={{ width: '100%', color: '#333', background: 'white', border: '1px solid #ccc' }} />
              </div>
            ))}
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} style={{ width: '90%', height: '95%', border: 'none', marginTop: '10px' }} title="preview" />
          ) : (
            <div style={{ color: 'white', marginTop: '100px', textAlign: 'center' }}>
              <h2>{isGenerating ? "Preparing PDF..." : "No images to show"}</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterView;