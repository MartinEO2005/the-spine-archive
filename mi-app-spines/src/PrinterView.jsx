import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

const DEFAULT_SPINE_WIDTH = 10.5;

const PrinterView = ({ initialSpines, onBack }) => {
  const [images, setImages] = useState(initialSpines);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // ESTADO: Control del Modal de Descarga / Donaciones
  const [supportModal, setSupportModal] = useState({ show: false, status: 'processing' });

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

  // FUNCIÓN DE DESCARGA Y MODAL
  const handleDownloadClick = () => {
    if (!pdfUrl) return;
    
    // 1. Mostrar modal de carga
    setSupportModal({ show: true, status: 'processing' });

    // 2. Esperar 2 segundos y forzar la descarga del archivo sin abrir pestañas nuevas
    setTimeout(() => {
      setSupportModal({ show: true, status: 'ready' });
      
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'The_Spine_Archive_Print.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden', position: 'relative' }}>
      
      {/* Importar la fuente Pixel Art de Google Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* HEADER */}
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK</button>
        
        {/* NUEVO TÍTULO CON FUENTE PIXELADA */}
        <div style={{ 
          color: 'white', 
          fontFamily: '"Press Start 2P", monospace', 
          fontSize: '12px', 
          textShadow: '2px 2px 0px #000',
          letterSpacing: '1px'
        }}>
          {isGenerating ? "⏳ GENERATING..." : "SPINES PREVIEW (MULTI-PAGE)"}
        </div>
        
        <button 
          onClick={handleDownloadClick} 
          disabled={!pdfUrl} 
          style={{ background: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', color: '#b30000', cursor: pdfUrl ? 'pointer' : 'not-allowed', opacity: pdfUrl ? 1 : 0.5 }}
        >
          DOWNLOAD PDF
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {images.map((img, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <img src={img.image || img.src} alt="t" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    value={img.count} 
                    onChange={(e) => {
                      const newImages = [...images];
                      newImages[i].count = Math.max(1, parseInt(e.target.value) || 1);
                      setImages(newImages);
                    }} 
                    style={{ width: '50px', color: '#000000', WebkitTextFillColor: '#000000', background: 'white', border: '1px solid #ccc' }} 
                  />
                  <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ background: 'red', color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', backgroundColor: '#525659', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px' }}>
          
          {/* CAJA DE CONFIGURACIÓN */}
          <div style={{ 
            position: 'absolute', top: '20px', right: '20px', zIndex: 1000, 
            backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', width: '280px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'
          }}>
            {['spineSpacing', 'pageWidth', 'pageHeight', 'marginTop', 'marginLeft', 'marginRight'].map(k => (
              <div key={k}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', color: '#000000', WebkitTextFillColor: '#000000', marginBottom: '4px' }}>
                  {k.toUpperCase()}
                </label>
                <input 
                  type="number" step="0.1" value={config[k]} 
                  onChange={e => setConfig({...config, [k]: parseFloat(e.target.value) || 0})} 
                  style={{ width: '100%', color: '#000000', WebkitTextFillColor: '#000000', backgroundColor: '#ffffff', border: '2px solid #333333', borderRadius: '4px', padding: '5px', boxSizing: 'border-box' }} 
                />
              </div>
            ))}
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} title="preview" />
          ) : (
            <div style={{ color: 'white', marginTop: '100px' }}><h2>Generating preview...</h2></div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DE DESCARGA Y DONACIÓN */}
      {/* ============================================================== */}
      {supportModal.show && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, 
          display: 'flex', justifyContent: 'center', alignItems: 'center' 
        }}>
          <div style={{ 
            backgroundColor: '#222', padding: '40px', borderRadius: '12px', width: '480px', 
            textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', border: '2px solid #b30000' 
          }}>
            {supportModal.status === 'processing' ? (
              <>
                <div style={{ fontSize: '50px', marginBottom: '20px', display: 'inline-block', animation: 'spin 2s linear infinite' }}>⏳</div>
                <h2 style={{ color: 'white', marginBottom: '10px', fontFamily: '"Press Start 2P", monospace', fontSize: '14px', lineHeight: '1.5' }}>PREPARING YOUR PDF...</h2>
                <p style={{ color: '#aaa', fontSize: '14px' }}>Ajustando resoluciones para una alta calidad de impresión.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>✅</div>
                <h2 style={{ color: '#4CAF50', marginBottom: '10px', fontFamily: '"Press Start 2P", monospace', fontSize: '14px', lineHeight: '1.5' }}>DOWNLOAD STARTED!</h2>
                
                <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', marginTop: '25px', marginBottom: '25px', border: '1px solid #444' }}>
                  <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    Mantener <b>The Spine Archive</b> es completamente gratuito para la comunidad, pero los costes de los servidores y la base de datos aumentan mes a mes.
                    <br/><br/>
                    Si esta herramienta te ha sido útil, <b>considera ayudarnos a pagar la factura del servidor</b> para que el proyecto pueda seguir creciendo. ❤️
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '25px' }}>
                  {/* ENLACE KO-FI DEL USUARIO */}
                  <a href="https://ko-fi.com/martineo" target="_blank" rel="noreferrer" style={{ background: '#FF5E5B', color: 'white', padding: '12px 25px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    ☕ Apoyar en Ko-fi
                  </a>
                </div>

                <button 
                  onClick={() => setSupportModal({ show: false, status: 'processing' })} 
                  style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}
                >
                  Cerrar y volver a la aplicación
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default PrinterView;