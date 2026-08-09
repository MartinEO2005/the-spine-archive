import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

const DEFAULT_SPINE_WIDTH = 10.5;

// Objeto global para guardar las imágenes ya convertidas a Base64 y evitar descargas en bucle
const printerImageCache = {};

const PrinterView = ({ initialSpines, onBack }) => {
  const [images, setImages] = useState(initialSpines);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estados para Drag & Drop
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

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

  const loadImageSafe = (spine) => {
    return new Promise((resolve) => {
      const url = spine.image || spine.src;
      if (!url) return resolve(null);
      
      if (printerImageCache[url]) {
        return resolve(printerImageCache[url]);
      }
      
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous'); 
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        printerImageCache[url] = base64; 
        resolve(base64);
      };
      
      img.onerror = (err) => {
        console.error("Error cargando imagen para PDF:", url, err);
        resolve(null); 
      };
      
      img.src = url;
    });
  };

  const generatePreview = useCallback(async () => {
    if (images.length === 0) { setPdfUrl(null); return; }
    setIsGenerating(true);
    try {
      const isPortrait = config.pageWidth < config.pageHeight;
      const orientation = isPortrait ? 'p' : 'l';

      let pdfFormat = [inchToMm(config.pageWidth), inchToMm(config.pageHeight)];
      if (config.pageWidth === 11.0 && config.pageHeight === 8.5) {
        pdfFormat = 'letter';
      } else if (config.pageWidth === 11.69 && config.pageHeight === 8.27) {
        pdfFormat = 'a4';
      }

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pdfFormat
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
      const objectList = [];
      
      images.forEach(imgObj => {
        for (let i = 0; i < (imgObj.count || 1); i++) {
            objectList.push(imgObj);
        }
      });

      if (objectList.length === 0) { setPdfUrl(null); return; }
      
      const loadedImages = await Promise.all(objectList.map(obj => loadImageSafe(obj)));

      loadedImages.forEach((imgData) => {
        if (!imgData) return;
        if (curX + sW > pW - mRight) { curX = mLeft; curY += sH + 2; }
        if (curY + sH > pH - 2) {
          pdf.addPage([inchToMm(config.pageWidth), inchToMm(config.pageHeight)], orientation);
          curX = mLeft; curY = mTop;
        }
        pdf.addImage(imgData, 'JPEG', curX, curY, sW, sH, undefined, 'NONE');
        curX += sW + gap;
      });
      setPdfUrl(pdf.output('bloburl'));
    } catch (err) { console.error(err); } finally { setIsGenerating(false); }
  }, [images, config]);

  useEffect(() => {
    const timer = setTimeout(() => generatePreview(), 1500);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  // Funciones de Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (index) => {
    setDragOverItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newImages = [...images];
    const draggedItem = newImages[draggedItemIndex];
    newImages.splice(draggedItemIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);
    
    setImages(newImages);
    handleDragEnd();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'black', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK TO CATALOG</button>
        <div style={{ color: 'white', fontWeight: 'bold' }}>
          {isGenerating ? "⏳ GENERATING..." : "SPINES PREVIEW (MULTI-PAGE)"}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setImages([])} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>CLEAR ALL</button>
          <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#b30000' }}>DOWNLOAD PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* PANEL IZQUIERDO CON DRAG & DROP */}
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', borderRight: '1px solid #999', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {images.map((imgObj, i) => (
              <div 
                key={i} 
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDragEnter={() => handleDragEnter(i)}
                onDragLeave={() => { if(dragOverItemIndex === i) setDragOverItemIndex(null); }}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                style={{ 
                  position: 'relative', 
                  background: 'white', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)', 
                  border: dragOverItemIndex === i && draggedItemIndex !== i ? '3px dashed #b30000' : (!imgObj.src ? '2px solid orange' : 'none'),
                  cursor: 'grab',
                  opacity: draggedItemIndex === i ? 0.5 : 1,
                  transform: dragOverItemIndex === i && draggedItemIndex !== i ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ backgroundColor: '#444', color: 'white', textAlign: 'center', fontSize: '10px', padding: '3px 0', cursor: 'grab' }}>
                  ☰ DRAG
                </div>

                <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={imgObj.image || imgObj.src} alt="t" style={{ width: '100%', height: '100px', objectFit: 'cover', pointerEvents: 'none' }} />
                </div>
                
                <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>COUNT:</span>
                  <input 
                    type="number" 
                    value={imgObj.count} 
                    onChange={(e) => {
                      const newImgs = [...images];
                      newImgs[i].count = Math.max(1, parseInt(e.target.value) || 1);
                      setImages(newImgs);
                    }} 
                    style={{ width: '45px', textAlign: 'center', border: '1px solid #ccc', color: '#000', background: 'white' }} 
                  />
                </div>
                
                <button 
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))} 
                  style={{ position: 'absolute', top: '22px', right: '5px', backgroundColor: 'rgba(230, 0, 18, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', zIndex: 10 }}
                > 
                  × 
                </button>
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
              flexDirection: 'column', gap: '12px', color: '#000000' 
          }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', color: '#333', marginBottom: '4px' }}>PAPER SIZE</label>
              <select 
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Letter') setConfig({...config, pageWidth: 11.0, pageHeight: 8.5, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1});
                    if (val === 'A4') setConfig({...config, pageWidth: 11.69, pageHeight: 8.27, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1});
                    if (val === '7x5') setConfig({...config, pageWidth: 5.0, pageHeight: 7.0, marginTop: 0.5, marginLeft: 0.5, marginRight: 0.5, spineSpacing: 0.1});
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
              <p>{isGenerating ? "📥 Generating PDF..." : "Generating preview..."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterView;