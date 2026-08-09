import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

const DEFAULT_SPINE_WIDTH = 10.5;

// CLAVE: Objeto global para guardar las imágenes y evitar que se descarguen en bucle
const printerImageCache = {};

const PrinterView = ({ initialSpines, onBack }) => {
  const [images, setImages] = useState(initialSpines);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // NUEVOS ESTADOS PARA DRAG & DROP
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
    const timer = setTimeout(() => generatePreview(), 1500);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  // FUNCIONES DE DRAG & DROP
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', backgroundColor: '#e5e5e5', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ height: '50px', backgroundColor: '#b30000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
        <button onClick={onBack} style={{ background: '#444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← BACK</button>
        <div style={{ color: 'white', fontWeight: 'bold' }}>
          {isGenerating ? "⏳ GENERATING..." : "PRINT EDITOR"}
        </div>
        <button onClick={() => window.open(pdfUrl)} disabled={!pdfUrl} style={{ background: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', color: '#b30000' }}>DOWNLOAD PDF</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '380px', backgroundColor: '#d1d1d1', padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {images.map((img, i) => (
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
                  background: 'white', 
                  borderRadius: '4px', 
                  overflow: 'hidden', 
                  position: 'relative',
                  cursor: 'grab',
                  opacity: draggedItemIndex === i ? 0.4 : 1, // Hace semi-transparente el que estás moviendo
                  border: dragOverItemIndex === i && draggedItemIndex !== i ? '3px dashed #007bff' : '3px solid transparent', // Indicador visual de destino
                  transform: dragOverItemIndex === i && draggedItemIndex !== i ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                {/* BARRA VISUAL PARA ARRASTRAR */}
                <div style={{ backgroundColor: '#444', color: 'white', textAlign: 'center', fontSize: '12px', padding: '4px 0', fontWeight: 'bold' }}>
                  ☰ 
                </div>

                <img src={img.image || img.src} alt="spine" style={{ width: '100%', height: '100px', objectFit: 'cover', pointerEvents: 'none' }} />
                
                <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    value={img.count || 1} 
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
          <div style={{ 
            position: 'absolute', top: '20px', right: '20px', zIndex: 1000, 
            backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', width: '280px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'
          }}>
            {['spineSpacing', 'pageWidth', 'pageHeight', 'marginTop', 'marginLeft', 'marginRight'].map(k => (
              <div key={k}>
                <label style={{ 
                  fontSize: '11px', fontWeight: 'bold', display: 'block', 
                  color: '#000000', 
                  WebkitTextFillColor: '#000000', 
                  marginBottom: '4px'
                }}>
                  {k.toUpperCase()}
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={config[k]} 
                  onChange={e => setConfig({...config, [k]: parseFloat(e.target.value) || 0})} 
                  style={{ 
                    width: '100%', 
                    color: '#000000', 
                    WebkitTextFillColor: '#000000', 
                    backgroundColor: '#ffffff', 
                    border: '2px solid #333333', 
                    borderRadius: '4px', padding: '5px', boxSizing: 'border-box'
                  }} 
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
    </div>
  );
};

export default PrinterView;