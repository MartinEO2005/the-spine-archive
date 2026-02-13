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

  // FUNCIÓN DE CARGA SEGURA: Si falla el 404, no rompe el PDF
  const loadImageSafe = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // Convertimos a JPEG para evitar el error de "PNG signature"
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };

      img.onerror = () => {
        console.warn("⚠️ Saltando imagen por error 404 o carga:", url);
        resolve(null); // Devolvemos null en lugar de error para que Promise.all no explote
      };

      // Si la URL no empieza por http, es que el scraper no funcionó bien para este ID
      if (!url.startsWith('http')) {
        console.error("❌ URL inválida (no es Cloudinary):", url);
        resolve(null);
      } else {
        img.src = url;
      }
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

      // Priorizar siempre el campo .image (Cloudinary)
      const urlList = [];
      images.forEach(imgObj => {
        const urlToUse = imgObj.image || imgObj.src;
        for (let i = 0; i < imgObj.count; i++) {
          urlList.push(urlToUse);
        }
      });

      // Cargamos todas las imágenes. Las que den 404 devolverán null.
      const loadedImages = await Promise.all(urlList.map(url => loadImageSafe(url)));

      loadedImages.forEach((imgData) => {
        if (!imgData) return; // Si la imagen falló (null), no la dibujamos

        if (curX + sW > pW - mRight) {
          curX = mLeft;
          curY += sH + 5;
        }
        if (curY + sH > pH - mTop) {
          pdf.addPage([inchToMm(config.pageWidth), inchToMm(config.pageHeight)], 'l');
          curX = mLeft;
          curY = mTop;
        }

        // Usamos formato JPEG para evitar problemas de firmas de archivos
        pdf.addImage(imgData, 'JPEG', curX, curY, sW, sH, undefined, 'NONE');
        curX += sW + gap;
      });

      setPdfUrl(pdf.output('bloburl'));
    } catch (err) {
      console.error("Error crítico generando PDF:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [images, config]);

  useEffect(() => {
    const timer = setTimeout(() => generatePreview(), 600);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden' }}>
      
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <button onClick={onBack} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK</button>
        <div style={{ color: 'white', fontWeight: 'bold' }}>
          {isGenerating ? "⏳ PROCESSING IMAGES..." : "PRINT EDITOR"}
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
              <div key={i} style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={img.image || img.src} 
                  alt="thumb" 
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100px', objectFit: 'cover' }} 
                />
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
          {/* Panel de Configuración */}
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
            <div style={{ color: 'white', marginTop: '100px', textAlign: 'center' }}>
              <h2>{isGenerating ? "Downloading from Cloudinary..." : "PDF is empty"}</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterView;