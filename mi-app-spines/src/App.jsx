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

  const resetSpineWidth = () => {
    setConfig({ ...config, spineWidthMM: DEFAULT_SPINE_WIDTH });
  };

  const getSafeImageData = (url) => {
    return new Promise((resolve) => {
      if (!url || !url.startsWith('http')) return resolve(null);
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => resolve(null);
    });
  };

  const generatePreview = useCallback(async () => {
    if (images.length === 0 || view !== 'pdf') {
      setPdfUrl(null);
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Calculamos orientación: si el ancho es menor que el alto, es Portrait ('p')
      const isPortrait = config.pageWidth < config.pageHeight;
      const orientation = isPortrait ? 'p' : 'l';

      const pdf = new jsPDF({
        orientation: orientation,
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

      if (urlList.length === 0) {
        setPdfUrl(null);
        setIsGenerating(false);
        return;
      }

      const loadedImages = await Promise.all(urlList.map(url => getSafeImageData(url)));

      loadedImages.forEach((imgData) => {
        if (!imgData) return;

        // Si no cabe en el ancho restante, saltamos de fila
        if (curX + sW > pW - mRight) {
          curX = mLeft;
          curY += sH + 2;
        }
        
        // Si no cabe en el alto restante (usamos margen de seguridad de 2mm), nueva página
        if (curY + sH > pH - 2) {
          pdf.addPage([inchToMm(config.pageWidth), inchToMm(config.pageHeight)], orientation);
          curX = mLeft;
          curY = mTop;
        }

        pdf.addImage(imgData, 'JPEG', curX, curY, sW, sH, undefined, 'NONE');
        curX += sW + gap;
      });

      setPdfUrl(pdf.output('bloburl'));
    } catch (err) {
      console.error("PDF Generator Error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [images, config, view]);

  useEffect(() => {
    const timeoutId = setTimeout(() => generatePreview(), 400);
    return () => clearTimeout(timeoutId);
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
          <div style={{ color: 'white', fontWeight: 'bold' }}>SPINES PREVIEW (MULTI-PAGE)</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => setImages([])} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>CLEAR ALL</button>
             <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#b30000' }}>DOWNLOAD PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* PANEL IZQUIERDO */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', borderRight: '1px solid #999', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {images.map((imgObj, i) => (
              <div key={i} style={{ position: 'relative', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', border: !imgObj.image ? '2px solid orange' : 'none' }}>
                <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imgObj.image || imgObj.src} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>COUNT:</span>
                    <input type="number" value={imgObj.count} onChange={(e) => {
                      const newImgs = [...images];
                      newImgs[i].count = Math.max(1, parseInt(e.target.value) || 1);
                      setImages(newImgs);
                    }} style={{ width: '45px', textAlign: 'center', border: '1px solid #ccc', color: '#000', background: 'white' }} />
                </div>
                <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(230, 0, 18, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer' }}> × </button>
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA CENTRAL Y CONTROLES */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#525659' }}>
          
          <div style={{ 
              position: 'absolute', top: '15px', right: '15px', zIndex: 10, 
              backgroundColor: 'white', padding: '15px', borderRadius: '8px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', 
              flexDirection: 'column', gap: '12px',
              color: '#000000' 
          }}>
            <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', color: '#333', marginBottom: '4px' }}>PAPER SIZE</label>
                <select 
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Letter') setConfig({...config, pageWidth: 11.0, pageHeight: 8.5, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1});
                        if (val === 'A4') setConfig({...config, pageWidth: 11.69, pageHeight: 8.27, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1});
                        if (val === '7x5') setConfig({...config, pageWidth: 5.0, pageHeight: 7.0, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1});
                        // NUEVA OPCIÓN TIGHT: Márgenes mínimos y spacing casi nulo para que entren 12
                        if (val === '7x5-tight') setConfig({...config, pageWidth: 5.0, pageHeight: 7.0, marginTop: 0.1, marginLeft: 0.01, marginRight: 0.01, spineSpacing: 0.0});
                    }}
                    style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', color: 'black', fontSize: '12px' }}
                >
                    <option value="Letter">Letter (𝐫𝐞𝐜𝐨𝐦𝐦𝐞𝐧𝐝𝐞𝐝) - 11" x 8.5"</option>
                    <option value="A4">A4 (EU) - 297 x 210mm</option>
                    <option value="7x5">7 x 5 inch (Standard)</option>
                    <option value="7x5-tight">7 x 5 inch (Tight)</option>
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Spacing', key: 'spineSpacing' },
                { label: 'Page W', key: 'pageWidth' },
                { label: 'Page H', key: 'pageHeight' },
                { label: 'M. Top', key: 'marginTop' },
                { label: 'M. Left', key: 'marginLeft' },
                { label: 'M. Right', key: 'marginRight' }
              ].map(item => (
                <div key={item.key}>
                  <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', color: '#333' }}>{item.label}</label>
                  <input 
                    type="number" step="0.01" 
                    value={config[item.key]} 
                    onChange={e => setConfig({...config, [item.key]: parseFloat(e.target.value) || 0})} 
                    style={{ width: '55px', color: '#000', border: '1px solid #ccc', background: 'white' }} 
                  />
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>Spine (mm): </label>
                  <input 
                    type="range" min={DEFAULT_SPINE_WIDTH - 5} max={DEFAULT_SPINE_WIDTH + 10} step="0.1"
                    value={config.spineWidthMM} 
                    onChange={e => setConfig({...config, spineWidthMM: parseFloat(e.target.value)})} 
                    style={{ width: '100px', verticalAlign: 'middle' }} 
                  />
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#000' }}>{config.spineWidthMM}</span>
                </div>
                <button 
                  onClick={resetSpineWidth}
                  style={{ backgroundColor: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: '3px', fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}
                >
                  RESET
                </button>
            </div>
          </div>

          {pdfUrl ? (
            <iframe src={`${pdfUrl}#view=FitH`} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              <p>{isGenerating ? "📥 Downloading from Cloudinary..." : "Generating preview..."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;