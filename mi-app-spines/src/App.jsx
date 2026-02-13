import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import CatalogView from './CatalogView';

const DEFAULT_SPINE_WIDTH = 10.5;

function App() {
  const [view, setView] = useState('catalog');
  const [images, setImages] = useState([]);
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

  // FUNCIÓN CRÍTICA: Convierte la URL de Cloudinary a algo que el PDF pueda tragar sin romperse
  const getSafeImageData = (url) => {
    return new Promise((resolve) => {
      // Si no es un link real (http), lo ignoramos para no causar el 404
      if (!url || !url.startsWith('http')) {
        console.warn("Saltando imagen no válida o local:", url);
        return resolve(null);
      }

      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous'); // Para evitar bloqueos de seguridad
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // Usamos JPEG para evitar el error de "PNG signature" que te salía
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };

      img.onerror = () => {
        console.error("Error cargando desde Cloudinary:", url);
        resolve(null);
      };
    });
  };

  const generatePreview = useCallback(async () => {
    if (images.length === 0 || view !== 'pdf') return;
    
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

      // Lista de URLs reales (Cloudinary)
      const urlList = [];
      images.forEach(imgObj => {
        // USAMOS .image (Cloudinary) - Si no existe, no intentamos cargar el local
        const urlToUse = imgObj.image; 
        if (urlToUse) {
          for (let i = 0; i < imgObj.count; i++) urlList.push(urlToUse);
        }
      });

      if (urlList.length === 0) {
        setIsGenerating(false);
        return;
      }

      // Descargamos todas las imágenes de Cloudinary antes de dibujar
      const loadedImages = await Promise.all(urlList.map(url => getSafeImageData(url)));

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
      console.error("Error fatal generando el PDF:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [images, config, view]);

  useEffect(() => {
    const timer = setTimeout(() => generatePreview(), 500);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  if (view === 'catalog') {
    return <CatalogView onConfirm={(sel) => { setImages(sel); setView('pdf'); }} initialSelected={images} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => setView('catalog')} style={{ background: 'black', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK TO CATALOG</button>
          <div style={{ color: 'white', fontWeight: 'bold' }}>{isGenerating ? "⏳ PROCESSING CLOUDINARY IMAGES..." : "SPINES PREVIEW"}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => setImages([])} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>CLEAR ALL</button>
             <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#b30000' }}>DOWNLOAD PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* PANEL IZQUIERDO */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {images.map((imgObj, i) => (
              <div key={i} style={{ position: 'relative', background: 'white', borderRadius: '8px', overflow: 'hidden', border: !imgObj.image ? '2px solid orange' : 'none' }}>
                <img 
                  src={imgObj.image || imgObj.src} 
                  alt="thumb" 
                  style={{ width: '100%', height: '100px', objectFit: 'cover', opacity: !imgObj.image ? 0.4 : 1 }} 
                />
                <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <input type="number" value={imgObj.count} onChange={(e) => {
                      const newImgs = [...images];
                      newImgs[i].count = Math.max(1, parseInt(e.target.value) || 1);
                      setImages(newImgs);
                    }} style={{ width: '45px' }} />
                </div>
                <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}> × </button>
              </div>
            ))}
          </div>
        </div>

        {/* PREVIEW CENTRAL */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#525659' }}>
          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, backgroundColor: 'white', padding: '15px', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            {['spineSpacing', 'pageWidth', 'pageHeight', 'marginTop', 'marginLeft', 'marginRight'].map(k => (
              <div key={k}>
                <label style={{ fontSize: '10px', fontWeight: 'bold' }}>{k}</label>
                <input type="number" step="0.1" value={config[k]} onChange={e => setConfig({...config, [k]: parseFloat(e.target.value) || 0})} style={{ width: '100%' }} />
              </div>
            ))}
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              <p>{isGenerating ? "Downloading high-quality images..." : "Select spines with Cloudinary links to preview"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;