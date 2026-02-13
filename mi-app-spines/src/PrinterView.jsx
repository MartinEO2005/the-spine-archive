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
      // 🛡️ FILTRO CRÍTICO: Si no empieza por http, es una ruta local que fallará en Vercel
      if (!url || !url.startsWith('http')) {
        console.warn("🚫 Saltando ruta local no permitida en Vercel:", url);
        return resolve(null);
      }

      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9)); // Forzamos JPEG para evitar líos de firmas
      };

      img.onerror = () => {
        console.error("❌ Error de red/CORS en URL:", url);
        resolve(null);
      };

      img.src = url;
    });
  };

  const generatePreview = useCallback(async () => {
    if (images.length === 0) {
      setPdfUrl(null);
      return;
    }

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

      // Solo procesamos lo que tenga link de Cloudinary
      const urlList = [];
      images.forEach(imgObj => {
        // PRIORIDAD ABSOLUTA A .image
        const urlToUse = imgObj.image; 
        if (urlToUse) {
          for (let i = 0; i < imgObj.count; i++) urlList.push(urlToUse);
        }
      });

      if (urlList.length === 0) {
        console.warn("⚠️ Ninguna de las imágenes seleccionadas tiene link de Cloudinary todavía.");
        setPdfUrl(null);
        return;
      }

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
      console.error("🔥 Error en PDF:", err);
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
      
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <button onClick={onBack} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK</button>
        <div style={{ color: 'white', fontWeight: 'bold' }}>
          {isGenerating ? "⏳ SYNCING CLOUDINARY..." : "PRINT EDITOR"}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setImages([])} style={{ background: '#333', color: '#ff4444', border: '1px solid #ff4444', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>CLEAR ALL</button>
          <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', color: '#b30000' }}>DOWNLOAD PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', position: 'relative', border: !img.image ? '2px solid orange' : 'none' }}>
                <img 
                  src={img.image || img.src} 
                  alt="t" 
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100px', objectFit: 'cover', opacity: !img.image ? 0.3 : 1 }} 
                />
                {!img.image && <div style={{position:'absolute', top:0, fontSize:'8px', background:'orange', color:'black', padding:'2px'}}>LOCAL ONLY</div>}
                <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <input type="number" value={img.count} onChange={(e) => {
                    const newImages = [...images];
                    newImages[i].count = Math.max(1, parseInt(e.target.value) || 1);
                    setImages(newImages);
                  }} style={{ width: '40px' }} />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ background: 'red', color: 'white', border: 'none', cursor: 'pointer', width: '22px', height: '22px', borderRadius: '4px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', backgroundColor: '#525659', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', width: '280px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            {['spineSpacing', 'pageWidth', 'pageHeight', 'marginTop', 'marginLeft', 'marginRight'].map(k => (
              <div key={k}>
                <label style={{ fontSize: '9px', fontWeight: 'bold', display: 'block' }}>{k.toUpperCase()}</label>
                <input type="number" step="0.1" value={config[k]} onChange={e => setConfig({...config, [k]: parseFloat(e.target.value) || 0})} style={{ width: '100%' }} />
              </div>
            ))}
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} style={{ width: '90%', height: '95%', border: 'none', marginTop: '10px' }} title="preview" />
          ) : (
            <div style={{ color: 'white', marginTop: '100px', textAlign: 'center', padding: '20px' }}>
              <h2>{isGenerating ? "Downloading Cloudinary Assets..." : "No Cloudinary images found"}</h2>
              <p style={{fontSize: '12px'}}>If you see orange borders on the left, those images aren't uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterView;